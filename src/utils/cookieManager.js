/**
 * Browser Cookie Manager for VnSavingPro
 * Manages Consent (`vnsaving_cookie_consent`), User Preferences (`vnsaving_prefs`),
 * and Analytics (`vnsaving_analytics`) via standard `document.cookie` API.
 */

export const CONSENT_COOKIE = 'vnsaving_cookie_consent';
export const PREFS_COOKIE = 'vnsaving_prefs';
export const ANALYTICS_COOKIE = 'vnsaving_analytics';

function hasDocument() {
  return typeof document !== 'undefined';
}

export function setCookie(name, value, days = 180) {
  if (!hasDocument()) return;
  try {
    const encoded = encodeURIComponent(String(value));
    const maxAge = Math.max(0, Math.round(days * 86400));
    const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // Ignore cookie write restriction errors
  }
}

export function getCookie(name) {
  if (!hasDocument() || !document.cookie) return null;
  const pairs = document.cookie.split(';');
  const prefix = `${name}=`;
  for (const part of pairs) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      try {
        return decodeURIComponent(trimmed.slice(prefix.length));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function deleteCookie(name) {
  if (!hasDocument()) return;
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getCookieConsent() {
  const raw = getCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      essential: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent({ preferences = false, analytics = false } = {}) {
  const next = {
    essential: true,
    preferences: Boolean(preferences),
    analytics: Boolean(analytics),
    updatedAt: new Date().toISOString(),
  };
  setCookie(CONSENT_COOKIE, JSON.stringify(next), 180);

  if (next.preferences) {
    if (!getCookie(PREFS_COOKIE)) {
      setCookie(PREFS_COOKIE, JSON.stringify({ theme: 'dark', updatedAt: next.updatedAt }), 90);
    }
  } else {
    deleteCookie(PREFS_COOKIE);
  }

  if (next.analytics) {
    setCookie(ANALYTICS_COOKIE, 'granted', 90);
  } else {
    deleteCookie(ANALYTICS_COOKIE);
  }

  return next;
}

export function syncUserPrefCookie(patch = {}) {
  const consent = getCookieConsent();
  if (!consent?.preferences) return;
  let current = {};
  try {
    const raw = getCookie(PREFS_COOKIE);
    if (raw) current = JSON.parse(raw) || {};
  } catch {
    current = {};
  }
  const merged = { ...current, ...patch, updatedAt: new Date().toISOString() };
  setCookie(PREFS_COOKIE, JSON.stringify(merged), 90);
}

export function isAnalyticsAllowed() {
  const consent = getCookieConsent();
  if (consent === null) return true;
  return Boolean(consent.analytics);
}

export function getActiveCookiesList() {
  if (!hasDocument() || !document.cookie) return [];
  const meta = {
    [CONSENT_COOKIE]: { category: 'Thiết yếu', desc: 'Lưu lựa chọn đồng ý cookie của bạn', ttl: '180 ngày' },
    [PREFS_COOKIE]: { category: 'Tuỳ chọn', desc: 'Ghi nhớ ngân hàng, kỳ hạn & chế độ nhập liệu', ttl: '90 ngày' },
    [ANALYTICS_COOKIE]: { category: 'Phân tích', desc: 'Trạng thái đo lường hiệu năng & lượt xem trang', ttl: '90 ngày' },
  };
  return document.cookie
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf('=');
      const name = idx >= 0 ? entry.slice(0, idx) : entry;
      const rawVal = idx >= 0 ? entry.slice(idx + 1) : '';
      let decoded = rawVal;
      try {
        decoded = decodeURIComponent(rawVal);
      } catch {
        // Leave raw
      }
      const info = meta[name] || { category: 'Bên thứ 3 / Phiên', desc: 'Cookie trình duyệt / GTM', ttl: 'Theo phiên' };
      return {
        name,
        valuePreview: decoded.length > 56 ? `${decoded.slice(0, 56)}…` : decoded,
        ...info,
      };
    });
}
