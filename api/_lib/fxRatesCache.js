const VCB_XML_URL = 'https://portal.vietcombank.com.vn/UserControls/TVPortal.TyGia/pXML.aspx';
const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4500;

export const PRIORITY_CURRENCY_ORDER = [
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'SGD',
  'KRW',
  'CNY',
  'THB',
  'CAD',
  'CHF',
  'HKD',
];

const FALLBACK_CURRENCIES = [
  { code: 'USD', name: 'US DOLLAR', buy: 25570.0, transfer: 25600.0, sell: 25980.0 },
  { code: 'EUR', name: 'EURO', buy: 26850.0, transfer: 27121.0, sell: 28280.0 },
  { code: 'JPY', name: 'JAPANESE YEN', buy: 162.8, transfer: 164.44, sell: 172.1 },
  { code: 'GBP', name: 'POUND STERLING', buy: 31950.0, transfer: 32273.0, sell: 33280.0 },
  { code: 'AUD', name: 'AUSTRALIAN DOLLAR', buy: 16743.86, transfer: 16912.99, sell: 17455.16 },
  { code: 'SGD', name: 'SINGAPORE DOLLAR', buy: 18920.0, transfer: 19111.0, sell: 19710.0 },
  { code: 'KRW', name: 'SOUTH KOREAN WON', buy: 16.4, transfer: 18.22, sell: 19.85 },
  { code: 'CNY', name: 'CHINESE YUAN', buy: 3485.0, transfer: 3520.0, sell: 3640.0 },
  { code: 'THB', name: 'THAILAND BAHT', buy: 662.0, transfer: 735.0, sell: 768.0 },
  { code: 'CAD', name: 'CANADIAN DOLLAR', buy: 17542.76, transfer: 17719.96, sell: 18288.0 },
  { code: 'CHF', name: 'SWISS FRANC', buy: 28400.0, transfer: 28687.0, sell: 29620.0 },
  { code: 'HKD', name: 'HONGKONG DOLLAR', buy: 3220.0, transfer: 3253.0, sell: 3375.0 },
];

let fxCache = {
  data: null,
  expiresAt: 0,
};

function parseVcbNumber(raw) {
  if (!raw || raw === '-') return null;
  const cleaned = String(raw).replace(/,/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function decorateCurrency(item) {
  const transferVal = item.transfer ?? item.buy ?? item.sell ?? 0;
  const buyVal = item.buy ?? transferVal;
  const sellVal = item.sell ?? transferVal;
  const spreadPct =
    transferVal > 0 && sellVal > transferVal
      ? Number((((sellVal - transferVal) / transferVal) * 100).toFixed(2))
      : 0;
  const mid = Number(((transferVal + sellVal) / 2).toFixed(2));
  return {
    code: String(item.code || '').toUpperCase().trim(),
    name: String(item.name || '').trim(),
    buy: buyVal,
    transfer: transferVal,
    sell: sellVal,
    mid,
    spreadPct,
  };
}

function parseVcbXml(xmlText) {
  const dtMatch = xmlText.match(/<DateTime>([^<]+)<\/DateTime>/i);
  const updatedAt = dtMatch ? dtMatch[1].trim() : new Date().toISOString();
  const exrateRe = /<Exrate\s+([^>]+?)\/>/gi;
  const parsed = [];
  let match;

  while ((match = exrateRe.exec(xmlText)) !== null) {
    const attrs = match[1];
    const getAttr = (name) => {
      const m = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
      return m ? m[1] : '';
    };
    const code = getAttr('CurrencyCode').toUpperCase().trim();
    if (!code) continue;
    const transfer = parseVcbNumber(getAttr('Transfer'));
    const buy = parseVcbNumber(getAttr('Buy'));
    const sell = parseVcbNumber(getAttr('Sell'));
    if (!transfer && !buy && !sell) continue;

    parsed.push(
      decorateCurrency({
        code,
        name: getAttr('CurrencyName').trim() || code,
        buy,
        transfer,
        sell,
      })
    );
  }

  parsed.sort((a, b) => {
    const ia = PRIORITY_CURRENCY_ORDER.indexOf(a.code);
    const ib = PRIORITY_CURRENCY_ORDER.indexOf(b.code);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.code.localeCompare(b.code);
  });

  return { updatedAt, currencies: parsed };
}

export async function getLiveFxSnapshotAsync({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && fxCache.data && now < fxCache.expiresAt) {
    return fxCache.data;
  }

  try {
    const res = await fetch(VCB_XML_URL, {
      headers: {
        'User-Agent': 'VnSavingPro/2.0 (+https://vnsavingpro.vercel.app)',
        Accept: 'application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal:
        typeof AbortSignal !== 'undefined' && AbortSignal.timeout
          ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
          : undefined,
    });
    if (res.ok) {
      const xmlText = await res.text();
      const parsed = parseVcbXml(xmlText);
      if (parsed.currencies.length >= 6) {
        const snapshot = {
          source: 'vietcombank_live',
          updatedAt: parsed.updatedAt,
          baseCurrency: 'VND',
          currencies: parsed.currencies,
        };
        fxCache = { data: snapshot, expiresAt: now + CACHE_TTL_MS };
        return snapshot;
      }
    }
  } catch {
    // Fall back gracefully to bundled snapshot
  }

  const fallback = {
    source: 'vietcombank_reference',
    updatedAt: '23/11/2026 15:07',
    baseCurrency: 'VND',
    currencies: FALLBACK_CURRENCIES.map(decorateCurrency),
  };
  if (!fxCache.data) {
    fxCache = { data: fallback, expiresAt: now + 5 * 60 * 1000 };
  }
  return fxCache.data;
}
