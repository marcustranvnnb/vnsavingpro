// ============================================================================
// Free-Tier Quota Guardian & POC Validation Phase Circuit Breaker
// Monitors Vercel Hobby API invocations, Supabase Free DB/MAU, and Resend Free
// email quotas. Sends Resend alerts at 80%, 90%, 95%, and 100%, and triggers
// the POC Validation Phase lock once 100% of any safe free cap is reached.
// ============================================================================

import { getOwnerAlertEmail, sendOwnerQuotaAlertEmail } from './resend.js';
import { getSupabaseConfig, isSupabaseConfigured, sbInsert, sbRpc } from './supabase.js';

export const ALERT_THRESHOLDS = [80, 90, 95, 100];

export const POC_VALIDATION_PAYLOAD = {
  ok: false,
  code: 'POC_QUOTA_REACHED',
  pocValidationReached: true,
  message:
    'This product has reached the POC Validation Phase. The business owner is preparing for an upgrade to have a better experience. Please accept our apologies.',
  messageVi:
    'Sản phẩm đã đạt đến giai đoạn xác thực POC (POC Validation Phase). Chủ sở hữu dự án đang chuẩn bị nâng cấp hạ tầng để mang lại trải nghiệm tốt hơn. Rất mong bạn thông cảm cho sự bất tiện này.',
};

const CACHE_WINDOW_MS = 15_000;
const BATCH_HIT_FLUSH = 10;

let pendingApiHits = 0;
let lastSyncMs = 0;
let cachedQuotaState = null;

function parseSafeLimit(envKey, fallback) {
  const raw = Number(process.env[envKey]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export function getFreeTierLimits() {
  return {
    vercel_api_monthly: parseSafeLimit('QUOTA_LIMIT_API_MONTHLY', 800_000), // Vercel Hobby: 1M invocations/mo
    supabase_db_mb: parseSafeLimit('QUOTA_LIMIT_DB_MB', 475), // Supabase Free: 500 MB DB
    supabase_mau: parseSafeLimit('QUOTA_LIMIT_MAU', 47_500), // Supabase Free: 50,000 MAU
    resend_daily: parseSafeLimit('QUOTA_LIMIT_RESEND_DAILY', 95), // Resend Free: 100/day (5 reserved for alerts)
    resend_monthly: parseSafeLimit('QUOTA_LIMIT_RESEND_MONTHLY', 2_850), // Resend Free: 3,000/mo
  };
}

export function getUtcPeriodKeys(now = new Date()) {
  const iso = now.toISOString();
  return {
    monthKey: iso.slice(0, 7),
    dayKey: iso.slice(0, 10),
  };
}

export function computeQuotaMetrics(snapshot = {}, limits = getFreeTierLimits()) {
  const { monthKey, dayKey } = getUtcPeriodKeys();
  const rows = Array.isArray(snapshot?.quotas) ? snapshot.quotas : [];
  const findUsed = (key, period) => {
    const found = rows.find((r) => r.metric_key === key && r.period_key === period);
    return Number(found?.used_value) || 0;
  };

  const apiUsed = findUsed('vercel_api_monthly', snapshot.month_key || monthKey);
  const dbMbUsed = Number(snapshot?.db_mb) || 0;
  const mauUsed = Number(snapshot?.mau_current_month) || 0;
  const resendDayUsed = findUsed('resend_daily', snapshot.day_key || dayKey);
  const resendMonthUsed = findUsed('resend_monthly', snapshot.month_key || monthKey);

  const defs = [
    {
      metricKey: 'vercel_api_monthly',
      label: 'Vercel API Invocations (Tháng)',
      periodKey: snapshot.month_key || monthKey,
      used: apiUsed,
      limit: limits.vercel_api_monthly,
      unit: 'requests',
    },
    {
      metricKey: 'supabase_db_mb',
      label: 'Supabase Postgres Storage',
      periodKey: snapshot.month_key || monthKey,
      used: dbMbUsed,
      limit: limits.supabase_db_mb,
      unit: 'MB',
    },
    {
      metricKey: 'supabase_mau',
      label: 'Supabase Auth MAU (Tháng)',
      periodKey: snapshot.month_key || monthKey,
      used: mauUsed,
      limit: limits.supabase_mau,
      unit: 'users',
    },
    {
      metricKey: 'resend_daily',
      label: 'Resend Email Quota (Hôm nay)',
      periodKey: snapshot.day_key || dayKey,
      used: resendDayUsed,
      limit: limits.resend_daily,
      unit: 'emails',
    },
    {
      metricKey: 'resend_monthly',
      label: 'Resend Email Quota (Tháng)',
      periodKey: snapshot.month_key || monthKey,
      used: resendMonthUsed,
      limit: limits.resend_monthly,
      unit: 'emails',
    },
  ];

  return defs.map((m) => ({
    ...m,
    pct: m.limit > 0 ? Number(((m.used / m.limit) * 100).toFixed(2)) : 0,
  }));
}

async function dispatchThresholdAlerts(metrics, { dryRun = false } = {}) {
  const ownerEmail = getOwnerAlertEmail();
  const pocLockedNow = metrics.some((m) => m.pct >= 100);
  const alertsTriggered = [];

  for (const metric of metrics) {
    for (const thresholdPct of ALERT_THRESHOLDS) {
      if (metric.pct < thresholdPct) continue;

      if (!dryRun) {
        const dedupInsert = await sbInsert(
          'quota_alerts_log',
          {
            metric_key: metric.metricKey,
            period_key: metric.periodKey,
            threshold_pct: thresholdPct,
            used_value: Math.round(metric.used),
            limit_value: Math.round(metric.limit),
            sent_to: ownerEmail,
            email_status: 'sending',
          },
          { returning: true }
        );

        // 409 conflict or duplicate means this threshold for this period was already sent
        if (!dedupInsert.ok) {
          continue;
        }
      }

      let emailRes = { ok: true, id: 'dry-run' };
      if (!dryRun) {
        emailRes = await sendOwnerQuotaAlertEmail({
          metricKey: metric.metricKey,
          metricLabel: metric.label,
          thresholdPct,
          usedValue: metric.used,
          limitValue: metric.limit,
          pct: metric.pct,
          unit: metric.unit,
          periodKey: metric.periodKey,
          pocLocked: pocLockedNow || thresholdPct >= 100,
          snapshotSummary: metrics,
        });

        if (emailRes.ok) {
          const { monthKey, dayKey } = getUtcPeriodKeys();
          const limits = getFreeTierLimits();
          await Promise.all([
            sbRpc('increment_quota_counter', {
              p_metric_key: 'resend_daily',
              p_period_key: dayKey,
              p_delta: 1,
              p_limit_value: limits.resend_daily,
            }),
            sbRpc('increment_quota_counter', {
              p_metric_key: 'resend_monthly',
              p_period_key: monthKey,
              p_delta: 1,
              p_limit_value: limits.resend_monthly,
            }),
          ]);
        }
      }

      alertsTriggered.push({
        metricKey: metric.metricKey,
        thresholdPct,
        pct: metric.pct,
        sentTo: ownerEmail,
        emailOk: emailRes.ok,
        emailError: emailRes.error || null,
      });
    }
  }

  return alertsTriggered;
}

export async function getQuotaStatus({ forceRefresh = false } = {}) {
  return checkAndTrackQuota({ trackApiHit: false, forceRefresh });
}

export async function checkAndTrackQuota({ trackApiHit = true, forceRefresh = false } = {}) {
  const limits = getFreeTierLimits();
  const { monthKey, dayKey } = getUtcPeriodKeys();

  if (String(process.env.POC_FORCE_LOCK || '').toLowerCase() === 'true') {
    const metrics = cachedQuotaState?.metrics || computeQuotaMetrics({}, limits);
    return {
      freeTierOnly: true,
      blocked: true,
      pocValidationReached: true,
      forcedByEnv: true,
      maxUsagePct: Math.max(100, cachedQuotaState?.maxUsagePct || 100),
      metrics,
      alertsTriggered: [],
    };
  }

  if (trackApiHit) {
    pendingApiHits += 1;
  }

  const supabaseReady = isSupabaseConfigured() && getSupabaseConfig().hasServiceRole;
  const shouldSyncRemote =
    supabaseReady &&
    (forceRefresh ||
      !cachedQuotaState ||
      pendingApiHits >= BATCH_HIT_FLUSH ||
      Date.now() - lastSyncMs >= CACHE_WINDOW_MS ||
      cachedQuotaState.maxUsagePct >= 75);

  if (shouldSyncRemote) {
    const deltaToFlush = pendingApiHits;
    pendingApiHits = 0;

    if (deltaToFlush > 0) {
      await sbRpc('increment_quota_counter', {
        p_metric_key: 'vercel_api_monthly',
        p_period_key: monthKey,
        p_delta: deltaToFlush,
        p_limit_value: limits.vercel_api_monthly,
      });
    }

    const snapRes = await sbRpc('get_free_tier_usage_snapshot', {});
    if (snapRes.ok && snapRes.data) {
      const metrics = computeQuotaMetrics(snapRes.data, limits);
      const maxUsagePct = Math.max(0, ...metrics.map((m) => m.pct));
      const pocValidationReached = metrics.some((m) => m.pct >= 100);
      const alertsTriggered = maxUsagePct >= 80 ? await dispatchThresholdAlerts(metrics) : [];

      cachedQuotaState = {
        freeTierOnly: true,
        blocked: pocValidationReached,
        pocValidationReached,
        forcedByEnv: false,
        maxUsagePct,
        metrics,
        alertsTriggered,
        monthKey,
        dayKey,
        syncedAt: new Date().toISOString(),
      };
      lastSyncMs = Date.now();
      return cachedQuotaState;
    }

    // Re-queue unflushed hits if RPC transiently failed
    pendingApiHits += deltaToFlush;
  }

  if (cachedQuotaState) {
    return {
      ...cachedQuotaState,
      blocked: cachedQuotaState.pocValidationReached,
    };
  }

  const fallbackMetrics = computeQuotaMetrics(
    {
      month_key: monthKey,
      day_key: dayKey,
      quotas: [{ metric_key: 'vercel_api_monthly', period_key: monthKey, used_value: pendingApiHits }],
    },
    limits
  );
  const maxUsagePct = Math.max(0, ...fallbackMetrics.map((m) => m.pct));
  return {
    freeTierOnly: true,
    blocked: maxUsagePct >= 100,
    pocValidationReached: maxUsagePct >= 100,
    forcedByEnv: false,
    maxUsagePct,
    metrics: fallbackMetrics,
    alertsTriggered: [],
    monthKey,
    dayKey,
  };
}

export async function trackEmailSentQuota(count = 1) {
  if (!isSupabaseConfigured() || !getSupabaseConfig().hasServiceRole) return;
  const limits = getFreeTierLimits();
  const { monthKey, dayKey } = getUtcPeriodKeys();
  const delta = Math.max(1, Math.round(Number(count) || 1));

  await Promise.all([
    sbRpc('increment_quota_counter', {
      p_metric_key: 'resend_daily',
      p_period_key: dayKey,
      p_delta: delta,
      p_limit_value: limits.resend_daily,
    }),
    sbRpc('increment_quota_counter', {
      p_metric_key: 'resend_monthly',
      p_period_key: monthKey,
      p_delta: delta,
      p_limit_value: limits.resend_monthly,
    }),
  ]);
  await checkAndTrackQuota({ trackApiHit: false, forceRefresh: true });
}

export async function evaluateSimulatedQuotaAlert(metricsOverrides) {
  const metrics = computeQuotaMetrics({}, getFreeTierLimits()).map((m) => {
    const ov = metricsOverrides?.[m.metricKey];
    if (!ov) return m;
    const used = ov.used ?? m.used;
    const limit = ov.limit ?? m.limit;
    return {
      ...m,
      used,
      limit,
      pct: limit > 0 ? Number(((used / limit) * 100).toFixed(2)) : 0,
    };
  });
  const alertsTriggered = await dispatchThresholdAlerts(metrics, { dryRun: true });
  return {
    pocValidationReached: metrics.some((m) => m.pct >= 100),
    maxUsagePct: Math.max(0, ...metrics.map((m) => m.pct)),
    metrics,
    alertsTriggered,
  };
}

export function sendPocQuotaResponse(res, guard) {
  return res.status(503).json({
    ...POC_VALIDATION_PAYLOAD,
    maxUsagePct: guard?.maxUsagePct ?? 100,
  });
}
