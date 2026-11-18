const intFmt = new Intl.NumberFormat('vi-VN');

/** Coerce any input to a finite number, blocking NaN / Infinity / -Infinity propagation. */
export const safeNum = (n, fallback = 0) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
};

/** 12500000 -> "12.500.000" */
export const fmt = (n) => intFmt.format(Math.round(safeNum(n, 0)));

/** 12500000 -> "12.500.000 ₫" */
export const vnd = (n) => `${fmt(n)} ₫`;

const short = (x) =>
  new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2,
  }).format(safeNum(x, 0));

/** 1250000000 -> "1,25 tỷ", 12500000 -> "12,5 triệu" */
export function compact(n) {
  const v = Math.round(safeNum(n, 0));
  const a = Math.abs(v);
  if (a >= 1e9) return `${short(v / 1e9)} tỷ`;
  if (a >= 1e6) return `${short(v / 1e6)} triệu`;
  if (a >= 1e3) return `${short(v / 1e3)} nghìn`;
  return fmt(v);
}

/** Short chip label: 10000000 -> "10tr", 1500000000 -> "1,5 tỷ" */
export function chip(n) {
  const v = safeNum(n, 0);
  if (v >= 1e9) return `${short(v / 1e9)} tỷ`;
  if (v >= 1e6) return `${short(v / 1e6)}tr`;
  if (v >= 1e3) return `${short(v / 1e3)}k`;
  return fmt(v);
}

/** 8.6 -> "8,6%" */
export const pct = (n, digits = 2) =>
  `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(safeNum(n, 0))}%`;

/** 99 -> "8 năm 3 tháng" */
export function duration(months) {
  const m = Math.max(0, Math.round(safeNum(months, 0)));
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r} tháng`;
  if (r === 0) return `${y} năm`;
  return `${y} năm ${r} tháng`;
}
