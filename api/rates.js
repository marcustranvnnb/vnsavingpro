import { TENURE_DAYS_MAP, TENURE_LABELS } from '../src/data/banksData.js';
import { calculatePassiveIncomeRoadmap } from './_lib/calculator.js';
import { getLiveRatesSnapshotAsync } from './_lib/liveRatesCache.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isKeepalive = /(?:^|[?&])keepalive=1(?:&|$)/.test(String(req.url || ''));

  const quotaGuard = await checkAndTrackQuota({ trackApiHit: false });
  if (quotaGuard.blocked) {
    return sendPocQuotaResponse(res, quotaGuard);
  }

  const snapshot = await getLiveRatesSnapshotAsync({ bypassMemoryCache: isKeepalive });
  const best12MRate =
    (snapshot.banks || [])
      .map((b) => Number(b?.rates?.['12M']) || 0)
      .sort((a, b) => b - a)[0] || 6.9;

  const qeBase = {
    targetMonthlyInterest: 10_000_000,
    monthlySavingsAmount: 5_000_000,
    initialCapital: 0,
    annualInterestRate: best12MRate,
  };
  const estVi = calculatePassiveIncomeRoadmap({ ...qeBase, lang: 'vi' });
  const estEn = calculatePassiveIncomeRoadmap({ ...qeBase, lang: 'en' });
  const estJa = calculatePassiveIncomeRoadmap({ ...qeBase, lang: 'ja' });

  res.setHeader(
    'Cache-Control',
    isKeepalive ? 'no-store' : 'public, s-maxage=86400, stale-while-revalidate=604800'
  );

  return res.status(200).json({
    ok: true,
    updatedAt: snapshot.updatedAt,
    syncSchedule: 'monthly_day_1',
    syncTimeUtc7: '09:00',
    nextSyncDay: 1,
    pocValidationReached: Boolean(quotaGuard.blocked),
    banks: snapshot.banks,
    defaultQuickEstimate: {
      rate: best12MRate,
      target: qeBase.targetMonthlyInterest,
      saving: qeBase.monthlySavingsAmount,
      requiredPrincipal: estVi.requiredPrincipal,
      compoundSharePct: estVi.compoundSharePct,
      monthsNeeded: estVi.monthsNeeded,
      timeText: {
        vi: estVi.timeText,
        en: estEn.timeText,
        ja: estJa.timeText,
      },
    },
    syncMeta: snapshot.syncMeta,
    storage: snapshot.storage,
    supabaseConnected: Boolean(snapshot.supabaseConnected),
    tenures: TENURE_LABELS,
    tenureDays: TENURE_DAYS_MAP,
  });
}
