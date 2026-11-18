import {
  INITIAL_BANKS_DATA,
  RATES_UPDATED_AT,
  TENURE_DAYS_MAP,
  TENURE_LABELS,
} from '../src/data/banksData.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    updatedAt: RATES_UPDATED_AT,
    banks: INITIAL_BANKS_DATA,
    tenures: TENURE_LABELS,
    tenureDays: TENURE_DAYS_MAP,
  });
}
