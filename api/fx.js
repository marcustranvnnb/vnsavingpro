import { getLiveFxSnapshotAsync } from './_lib/fxRatesCache.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';
import { createRateLimiter } from './_lib/rateLimit.js';

const fxRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 90, maxEntries: 2000 });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (fxRateLimiter(req)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  const force = String(req.query?.refresh || '') === '1';
  const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
  if (quotaGuard.blocked) {
    return sendPocQuotaResponse(res, quotaGuard);
  }

  try {
    const snapshot = await getLiveFxSnapshotAsync({ forceRefresh: force });
    res.setHeader(
      'Cache-Control',
      force ? 'no-store' : 'public, s-maxage=900, stale-while-revalidate=3600'
    );
    return res.status(200).json({
      ok: true,
      ...snapshot,
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Failed to load FX rates' });
  }
}
