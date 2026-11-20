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

export function getActiveCookiesList(lang = 'vi') {
  if (!hasDocument() || !document.cookie) return [];
  const t = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  const meta = {
    [CONSENT_COOKIE]: {
      category: t('Thiết yếu', 'Essential', '必須'),
      desc: t(
        'Lưu lựa chọn đồng ý cookie của bạn',
        'Stores your cookie consent preferences',
        'Cookie同意設定を保存します'
      ),
      ttl: t('180 ngày', '180 days', '180日間'),
    },
    [PREFS_COOKIE]: {
      category: t('Tuỳ chọn', 'Preferences', '環境設定'),
      desc: t(
        'Ghi nhớ ngân hàng, kỳ hạn, ngôn ngữ, chế độ màn hình & nhập liệu',
        'Remembers selected bank, tenure, language, display layout & input mode',
        '銀行・預入期間・言語・画面レイアウト・入力モードを記憶します'
      ),
      ttl: t('90 ngày', '90 days', '90日間'),
    },
    [ANALYTICS_COOKIE]: {
      category: t('Phân tích', 'Analytics', '分析'),
      desc: t(
        'Trạng thái đo lường hiệu năng & lượt xem trang',
        'Page view & performance analytics status',
        'アクセス計測とパフォーマンス分析の状態'
      ),
      ttl: t('90 ngày', '90 days', '90日間'),
    },
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
      const info = meta[name] || {
        category: t('Bên thứ 3 / Phiên', 'Third-party / Session', 'サードパーティ / セッション'),
        desc: t('Cookie trình duyệt / GTM', 'Browser / GTM cookie', 'ブラウザ / GTM Cookie'),
        ttl: t('Theo phiên', 'Session', 'セッション期間'),
      };
      return {
        name,
        valuePreview: decoded.length > 56 ? `${decoded.slice(0, 56)}…` : decoded,
        ...info,
      };
    });
}
