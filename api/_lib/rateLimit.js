/**
 * Bounded per-IP sliding-window rate limiter safe for long-lived Fluid Compute instances.
 * Prevents unbounded Map memory growth while shedding burst traffic cleanly.
 */
export function createRateLimiter({ windowMs = 60_000, maxRequests = 120, maxEntries = 2000 } = {}) {
  const hits = new Map();

  return function isRateLimited(req) {
    const forwarded = req?.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
      req?.socket?.remoteAddress ||
      'unknown';
    const now = Date.now();
    const entry = hits.get(ip);

    if (hits.size >= maxEntries) {
      for (const [key, val] of hits.entries()) {
        if (now - val.windowStart > windowMs) {
          hits.delete(key);
        }
      }
      while (hits.size >= maxEntries) {
        const oldestKey = hits.keys().next().value;
        if (oldestKey === undefined) break;
        hits.delete(oldestKey);
      }
    }

    if (!entry || now - entry.windowStart > windowMs) {
      hits.set(ip, { windowStart: now, count: 1 });
      return false;
    }

    entry.count += 1;
    return entry.count > maxRequests;
  };
}
