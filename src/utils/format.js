const LOCALES = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
};

let currentLang = 'vi';

function resolveLang(lang) {
  const target = lang || currentLang;
  return target === 'en' || target === 'ja' ? target : 'vi';
}

export function setFormatLang(lang) {
  currentLang = resolveLang(lang);
}

export function getFormatLang() {
  return currentLang;
}

/** Coerce any input to a finite number, blocking NaN / Infinity / -Infinity propagation. */
export const safeNum = (n, fallback = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
};

const getIntFormatter = (lang) => new Intl.NumberFormat(LOCALES[resolveLang(lang)]);

/** 12500000 -> "12.500.000" (vi) | "12,500,000" (en/ja) */
export const fmt = (n, lang) => getIntFormatter(lang).format(Math.round(safeNum(n, 0)));

/** 12500000 -> "12.500.000 ₫" */
export const vnd = (n, lang) => `${fmt(n, lang)} ₫`;

const shortNum = (x, lang) =>
  new Intl.NumberFormat(LOCALES[resolveLang(lang)], {
    maximumFractionDigits: Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2,
  }).format(safeNum(x, 0));

/** Compact currency formatting for vi, en, ja */
export function compact(n, lang) {
  const l = resolveLang(lang);
  const v = Math.round(safeNum(n, 0));
  const a = Math.abs(v);

  if (l === 'ja') {
    if (a >= 1e8) return `${shortNum(v / 1e8, l)}億`;
    if (a >= 1e4) return `${shortNum(v / 1e4, l)}万`;
    return fmt(v, l);
  }
  if (l === 'en') {
    if (a >= 1e9) return `${shortNum(v / 1e9, l)}B`;
    if (a >= 1e6) return `${shortNum(v / 1e6, l)}M`;
    if (a >= 1e3) return `${shortNum(v / 1e3, l)}K`;
    return fmt(v, l);
  }

  if (a >= 1e9) return `${shortNum(v / 1e9, l)} tỷ`;
  if (a >= 1e6) return `${shortNum(v / 1e6, l)} triệu`;
  if (a >= 1e3) return `${shortNum(v / 1e3, l)} nghìn`;
  return fmt(v, l);
}

/** Short chip label: 10000000 -> "10tr" (vi) | "10M" (en) | "1,000万" (ja) */
export function chip(n, lang) {
  const l = resolveLang(lang);
  const v = safeNum(n, 0);
  const a = Math.abs(v);

  if (l === 'ja') {
    if (a >= 1e8) return `${shortNum(v / 1e8, l)}億`;
    if (a >= 1e4) return `${shortNum(v / 1e4, l)}万`;
    return fmt(v, l);
  }
  if (l === 'en') {
    if (a >= 1e9) return `${shortNum(v / 1e9, l)}B`;
    if (a >= 1e6) return `${shortNum(v / 1e6, l)}M`;
    if (a >= 1e3) return `${shortNum(v / 1e3, l)}K`;
    return fmt(v, l);
  }

  if (a >= 1e9) return `${shortNum(v / 1e9, l)} tỷ`;
  if (a >= 1e6) return `${shortNum(v / 1e6, l)}tr`;
  if (a >= 1e3) return `${shortNum(v / 1e3, l)}k`;
  return fmt(v, l);
}

/** 8.6 -> "8,6%" (vi) | "8.6%" (en/ja) */
export const pct = (n, digits = 2, lang) =>
  `${new Intl.NumberFormat(LOCALES[resolveLang(lang)], { maximumFractionDigits: digits }).format(safeNum(n, 0))}%`;

/** 99 -> "8 năm 3 tháng" | "8 yrs 3 mos" | "8年3ヶ月" */
export function duration(months, lang) {
  const l = resolveLang(lang);
  const m = Math.max(0, Math.round(safeNum(months, 0)));
  const y = Math.floor(m / 12);
  const r = m % 12;

  if (l === 'en') {
    const yLbl = y === 1 ? 'yr' : 'yrs';
    const rLbl = r === 1 ? 'mo' : 'mos';
    if (y === 0) return `${r} ${rLbl}`;
    if (r === 0) return `${y} ${yLbl}`;
    return `${y} ${yLbl} ${r} ${rLbl}`;
  }

  if (l === 'ja') {
    if (y === 0) return `${r}ヶ月`;
    if (r === 0) return `${y}年`;
    return `${y}年${r}ヶ月`;
  }

  if (y === 0) return `${r} tháng`;
  if (r === 0) return `${y} năm`;
  return `${y} năm ${r} tháng`;
}

/** Format tenure codes such as 1W..36M in active language */
export function formatTenure(code = '', lang) {
  const l = resolveLang(lang);
  const raw = String(code || '').trim().toUpperCase();
  const match = raw.match(/^(\d+)([WM])$/);
  if (!match) return raw;
  const numVal = Number(match[1]);
  const unit = match[2];

  if (unit === 'W') {
    if (l === 'en') return `${numVal} ${numVal === 1 ? 'week' : 'weeks'}`;
    if (l === 'ja') return `${numVal}週間`;
    return `${numVal} tuần`;
  }

  if (l === 'en') return `${numVal} ${numVal === 1 ? 'mo' : 'mos'}`;
  if (l === 'ja') return `${numVal}ヶ月`;
  return `${numVal} tháng`;
}
