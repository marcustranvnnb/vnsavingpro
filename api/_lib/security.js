import { createHash, timingSafeEqual } from 'node:crypto';

function sha256Buffer(value) {
  return createHash('sha256').update(String(value ?? ''), 'utf8').digest();
}

/**
 * Constant-time string comparison via fixed-length SHA-256 digests so
 * both secret content and secret length remain shielded from timing leaks.
 */
export function timingSafeStringEqual(a, b) {
  const strA = String(a ?? '');
  const strB = String(b ?? '');
  if (!strA || !strB) return false;
  return timingSafeEqual(sha256Buffer(strA), sha256Buffer(strB));
}

export function timingSafeBearerMatch(authHeader, expectedSecret) {
  const secret = String(expectedSecret ?? '').trim();
  if (!secret) return false;
  const raw = String(authHeader ?? '').trim();
  if (!raw.toLowerCase().startsWith('bearer ')) return false;
  const presented = raw.slice(7).trim();
  return timingSafeStringEqual(presented, secret);
}

export function isAdminBearerAuthorized(req) {
  const authHeader = req?.headers?.authorization;
  return (
    timingSafeBearerMatch(authHeader, process.env.CRON_SECRET) ||
    timingSafeBearerMatch(authHeader, process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function isAllowedOriginUrl(originStr) {
  let parsed;
  try {
    parsed = new URL(originStr);
  } catch {
    return false;
  }

  const configured = String(process.env.PUBLIC_APP_ORIGIN || 'https://vnsavingpro.vercel.app')
    .trim()
    .replace(/\/+$/, '');
  if (parsed.origin === configured || parsed.origin === 'https://vnsavingpro.vercel.app') {
    return true;
  }
  if (parsed.protocol === 'https:' && /^vnsavingpro-[a-z0-9-]+\.vercel\.app$/i.test(parsed.hostname)) {
    return true;
  }
  if (
    parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
  ) {
    return true;
  }
  return false;
}

/**
 * Blocks cross-site state-changing requests (anti-CSRF / anti-API-leeching) while permitting
 * same-origin browser calls, server-to-server admin requests, and headless CLI/unit calls without Origin.
 */
export function isTrustedOrigin(req) {
  const method = String(req?.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }
  if (isAdminBearerAuthorized(req)) {
    return true;
  }

  const fetchSite = String(req?.headers?.['sec-fetch-site'] || '').trim().toLowerCase();
  if (fetchSite === 'cross-site') {
    return false;
  }

  const rawOrigin = String(req?.headers?.origin || '').trim();
  if (rawOrigin) {
    if (rawOrigin === 'null') return false;
    return isAllowedOriginUrl(rawOrigin);
  }

  const rawReferer = String(req?.headers?.referer || '').trim();
  if (rawReferer) {
    return isAllowedOriginUrl(rawReferer);
  }

  return true;
}

export function applyApiSecurityHeaders(res) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}
