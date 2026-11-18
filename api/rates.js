import { TENURE_DAYS_MAP, TENURE_LABELS } from '../src/data/banksData.js';
import { getLiveRatesSnapshot } from './_lib/liveRatesCache.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const snapshot = getLiveRatesSnapshot();
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    updatedAt: snapshot.updatedAt,
    banks: snapshot.banks,
    syncMeta: snapshot.syncMeta,
    tenures: TENURE_LABELS,
    tenureDays: TENURE_DAYS_MAP,
  });
}
