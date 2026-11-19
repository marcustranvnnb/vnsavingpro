import { TENURE_DAYS_MAP, TENURE_LABELS } from '../src/data/banksData.js';
import { getLiveRatesSnapshotAsync } from './_lib/liveRatesCache.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
  if (quotaGuard.blocked) {
    return sendPocQuotaResponse(res, quotaGuard);
  }

  const snapshot = await getLiveRatesSnapshotAsync();
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return res.status(200).json({
    ok: true,
    updatedAt: snapshot.updatedAt,
    banks: snapshot.banks,
    syncMeta: snapshot.syncMeta,
    storage: snapshot.storage,
    supabaseConnected: Boolean(snapshot.supabaseConnected),
    tenures: TENURE_LABELS,
    tenureDays: TENURE_DAYS_MAP,
  });
}
