// ============================================================================
// Server-only Resend REST API client (Zero external dependencies)
// Used for Free-Tier quota alerts (80%, 90%, 95%, 100%) and notifications.
// ============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 5000;
const FREE_WEBMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.vn',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
]);

function extractEmailAddress(raw) {
  const str = String(raw || '').trim();
  const bracket = str.match(/<([^>]+)>/);
  const addr = (bracket ? bracket[1] : str).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr) ? addr : '';
}

export function getOwnerAlertEmail() {
  const explicit = extractEmailAddress(process.env.OWNER_ALERT_EMAIL);
  if (explicit) return explicit;
  const fromEnv = extractEmailAddress(process.env.RESEND_FROM_EMAIL);
  if (fromEnv && !fromEnv.endsWith('@resend.dev')) return fromEnv;
  return 'tranlinhmarcus2406@gmail.com';
}

export function getResendConfig() {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const rawFrom = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const extractedFrom = extractEmailAddress(rawFrom);
  const domain = extractedFrom ? extractedFrom.split('@')[1].toLowerCase() : '';

  // Resend cannot send FROM public webmail domains (@gmail.com, @yahoo.com, etc.).
  // Automatically normalize to onboarding@resend.dev and preserve user email as reply_to.
  const usesPublicWebmail = !extractedFrom || FREE_WEBMAIL_DOMAINS.has(domain);
  const from = usesPublicWebmail ? 'VnSavingPro Alerts <onboarding@resend.dev>' : rawFrom;
  const fallbackReplyTo = usesPublicWebmail && extractedFrom ? extractedFrom : undefined;

  return { apiKey, from, fallbackReplyTo };
}

export function isResendConfigured() {
  const { apiKey } = getResendConfig();
  return Boolean(apiKey && apiKey.startsWith('re_') && !apiKey.includes('your-'));
}

export async function sendResendEmail({ to, subject, html, text, replyTo } = {}) {
  if (!isResendConfigured()) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }
  const { apiKey, from, fallbackReplyTo } = getResendConfig();

  try {
    const payload = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject: String(subject || '').slice(0, 200),
      html,
      text,
    };
    const effectiveReplyTo = replyTo || fallbackReplyTo;
    if (effectiveReplyTo) {
      payload.reply_to = effectiveReplyTo;
    }

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(DEFAULT_TIMEOUT_MS) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.message || `Resend HTTP ${res.status}` };
    }
    return { ok: true, id: data?.id || null };
  } catch (err) {
    return { ok: false, error: err?.message || 'Resend request failed' };
  }
}

export async function sendOwnerQuotaAlertEmail({
  metricKey,
  metricLabel,
  thresholdPct,
  usedValue,
  limitValue,
  pct,
  unit = '',
  periodKey,
  pocLocked = false,
  snapshotSummary = [],
}) {
  const ownerEmail = getOwnerAlertEmail();
  const severity =
    thresholdPct >= 100
      ? { badge: '100% — POC VALIDATION LOCKED', color: '#ef4444' }
      : thresholdPct >= 95
      ? { badge: '95% — CRITICAL WARNING', color: '#f97316' }
      : thresholdPct >= 90
      ? { badge: '90% — HIGH USAGE', color: '#f59e0b' }
      : { badge: '80% — FREE-TIER NOTICE', color: '#6366f1' };

  const subject =
    thresholdPct >= 100
      ? `[VnSavingPro] POC Validation Phase Activated — ${metricLabel} đạt ${pct}% Free Quota`
      : `[VnSavingPro Alert ${thresholdPct}%] ${metricLabel} đạt ${pct}% hạn mức Free Tier`;

  const rowsHtml = (snapshotSummary || [])
    .map(
      (m) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:13px;">${m.label}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:13px;text-align:right;">${m.used} / ${m.limit} ${m.unit}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #27272a;color:${m.pct >= 90 ? '#fca5a5' : m.pct >= 80 ? '#fcd34d' : '#6ee7b7'};font-weight:600;font-size:13px;text-align:right;">${m.pct}%</td>
      </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;background:#08090b;color:#e4e4e7;padding:32px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#0e0f13;border:1px solid #27272a;border-radius:16px;padding:28px;">
      <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:${severity.color}22;border:1px solid ${severity.color}55;color:${severity.color};font-size:11px;font-weight:700;letter-spacing:0.04em;">
        ${severity.badge}
      </div>
      <h1 style="margin:14px 0 8px;font-size:20px;color:#ffffff;">
        ${pocLocked ? 'VnSavingPro đã chuyển sang POC Validation Phase' : `Cảnh báo Free-Tier đạt ngưỡng ${thresholdPct}%`}
      </h1>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#a1a1aa;">
        Chỉ số <strong style="color:#ffffff;">${metricLabel}</strong> (chu kỳ <code>${periodKey}</code>) vừa chạm mức
        <strong style="color:${severity.color};">${usedValue} / ${limitValue} ${unit} (${pct}%)</strong>.
        ${
          pocLocked
            ? 'Hệ thống đã tự động khóa các endpoint để đảm bảo không vượt gói Free và hiển thị thông báo POC Validation Phase tới người dùng.'
            : 'Vui lòng theo dõi lưu lượng hoặc chuẩn bị kế hoạch nâng cấp hạ tầng nếu cần thiết.'
        }
      </p>

      <table style="width:100%;border-collapse:collapse;background:#13151b;border:1px solid #27272a;border-radius:12px;overflow:hidden;margin-bottom:20px;">
        <thead>
          <tr>
            <th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#71717a;border-bottom:1px solid #27272a;">Resource</th>
            <th style="padding:10px;text-align:right;font-size:11px;text-transform:uppercase;color:#71717a;border-bottom:1px solid #27272a;">Đã dùng / Giới hạn</th>
            <th style="padding:10px;text-align:right;font-size:11px;text-transform:uppercase;color:#71717a;border-bottom:1px solid #27272a;">%</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div style="font-size:12px;color:#71717a;line-height:1.6;">
        <div>• Supabase Dashboard: https://supabase.com/dashboard/project/gvgyztwpjvjvztwhwnue</div>
        <div>• Vercel Project: https://vercel.com/phaheviet/vnsavingpro</div>
      </div>
    </div>
  </div>`;

  const text = `[VnSavingPro Alert ${thresholdPct}%] ${metricLabel} (${periodKey}): ${usedValue}/${limitValue} ${unit} (${pct}%). ${pocLocked ? 'POC Validation Phase activated.' : ''}`;

  return sendResendEmail({
    to: ownerEmail,
    subject,
    html,
    text,
  });
}
