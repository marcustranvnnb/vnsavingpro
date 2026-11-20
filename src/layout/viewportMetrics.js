export const DISPLAY_MODE_STORAGE_KEY = 'vnsaving_display_mode';
export const DUO_POSTURE_STORAGE_KEY = 'vnsaving_duo_posture';

export const DISPLAY_MODES = [
  {
    id: 'auto',
    label: { vi: 'Tự động (Auto)', en: 'Auto Detect', ja: '自動検出 (Auto)' },
    shortLabel: { vi: 'Auto', en: 'Auto', ja: '自動' },
    desc: {
      vi: 'Tự động nhận diện Mobile, Tablet, Duo / Màn hình gập hoặc PC.',
      en: 'Automatically detects Mobile, Tablet, Duo / Foldable, or Desktop.',
      ja: 'Mobile・Tablet・Duo/折りたたみ・PCを自動判別します。',
    },
  },
  {
    id: 'mobile',
    label: { vi: 'Mobile', en: 'Mobile', ja: 'Mobile' },
    shortLabel: { vi: 'Mobile', en: 'Mobile', ja: 'Mobile' },
    desc: {
      vi: '1 cột gọn gàng, thanh chạm đáy & sheet nổi tối ưu cho điện thoại.',
      en: 'Compact single-column stack with thumb navigation & bottom summary bar.',
      ja: 'スマホ向け1カラム設計・親指操作ナビ＆下部サマリーバー。',
    },
  },
  {
    id: 'tablet',
    label: { vi: 'Tablet', en: 'Tablet', ja: 'Tablet' },
    shortLabel: { vi: 'Tablet', en: 'Tablet', ja: 'Tablet' },
    desc: {
      vi: 'Thanh công cụ 1 chạm + chia 2 cột thông minh khi xoay ngang (>=768px).',
      en: 'Quick tablet toolbar + smart 2-column split on landscape/wide tablets.',
      ja: '専用ツールバー＆ワイド表示時の2カラム最適化。',
    },
  },
  {
    id: 'duo',
    label: { vi: 'Duo / Fold', en: 'Duo / Fold', ja: 'Duo / 折りたたみ' },
    shortLabel: { vi: 'Duo/Fold', en: 'Duo', ja: 'Duo' },
    desc: {
      vi: 'Tối ưu Samsung Galaxy Fold, iPhone Duo/Fold, Pixel Fold & Surface Duo (Book 2 cột hoặc Flex trên-dưới né nếp gấp).',
      en: 'Engineered for iPhone Duo/Fold, Galaxy Z Fold, Pixel Fold & Surface Duo with hinge-safe Book & Flex postures.',
      ja: 'iPhone Duo・Galaxy Z Fold・Pixel Fold対応。ヒンジを回避するBook（左右）／Flex（上下）表示。',
    },
  },
  {
    id: 'desktop',
    label: { vi: 'PC / Desktop', en: 'Desktop / PC', ja: 'PC / デスクトップ' },
    shortLabel: { vi: 'Desktop', en: 'Desktop', ja: 'PC' },
    desc: {
      vi: 'Toàn màn hình rộng 2 khung song song kèm thanh điều khiển cố định.',
      en: 'Widescreen dual-column workspace with sticky sidebar & multi-card grids.',
      ja: 'ワイド画面向けの固定サイドバー付き2ペイン＆多列グリッド。',
    },
  },
];

export const DUO_POSTURES = [
  {
    id: 'auto',
    label: { vi: 'Tự động theo bản lề', en: 'Auto Posture', ja: 'ヒンジ自動' },
    desc: { vi: 'Book khi mở ngang, Flex khi gập dọc', en: 'Book when wide, Flex when stacked', ja: '横開きでBook・縦折りでFlex' },
  },
  {
    id: 'book',
    label: { vi: 'Book (Trái | Phải)', en: 'Book (Left | Right)', ja: 'Book（左 | 右）' },
    desc: { vi: '2 nửa màn hình cạnh nhau, né rãnh bản lề giữa', en: 'Dual side-by-side panes avoiding center fold seam', ja: '中央ヒンジを避けた左右2画面並列' },
  },
  {
    id: 'tabletop',
    label: { vi: 'Flex / Tabletop (Trên / Dưới)', en: 'Flex / Tabletop (Top / Bottom)', ja: 'Flex（上 / 下）' },
    desc: { vi: 'Kết quả cố định màn hình trên, nhập liệu màn hình dưới', en: 'Results pinned on top half, controls on bottom half', ja: '上画面に結果・下画面に入力パネル' },
  },
];

const VALID_MODES = new Set(['auto', 'mobile', 'tablet', 'duo', 'desktop']);
const VALID_POSTURES = new Set(['auto', 'book', 'tabletop']);

export function isValidDisplayMode(v) {
  return VALID_MODES.has(v);
}

export function isValidDuoPosture(v) {
  return VALID_POSTURES.has(v);
}

/**
 * Pure viewport & foldable segment resolver (safe in Node & browser).
 */
export function detectViewportMetrics({
  width = 1280,
  height = 800,
  segments = null,
  horizontalSegments = false,
  verticalSegments = false,
  isCoarsePointer = false,
  preference = 'auto',
  duoPosturePref = 'auto',
} = {}) {
  const w = Math.max(240, Math.round(Number(width) || 1280));
  const h = Math.max(320, Math.round(Number(height) || 800));
  const pref = isValidDisplayMode(preference) ? preference : 'auto';
  const posturePref = isValidDuoPosture(duoPosturePref) ? duoPosturePref : 'auto';

  let hardwareFoldable = false;
  let hardwarePosture = null;
  let hingeSize = null;
  let pane1Size = null;
  let pane2Size = null;

  if (Array.isArray(segments) && segments.length >= 2) {
    const s0 = segments[0];
    const s1 = segments[1];
    if (s0 && s1 && typeof s0.left === 'number' && typeof s1.left === 'number' && s0.left !== s1.left) {
      const ordered = [...segments].sort((a, b) => a.left - b.left);
      hardwareFoldable = true;
      hardwarePosture = 'book';
      hingeSize = Math.max(16, Math.round(ordered[1].left - (ordered[0].left + ordered[0].width)));
      pane1Size = Math.round(ordered[0].width);
      pane2Size = Math.round(ordered[1].width);
    } else if (s0 && s1 && typeof s0.top === 'number' && typeof s1.top === 'number' && s0.top !== s1.top) {
      const ordered = [...segments].sort((a, b) => a.top - b.top);
      hardwareFoldable = true;
      hardwarePosture = 'tabletop';
      hingeSize = Math.max(16, Math.round(ordered[1].top - (ordered[0].top + ordered[0].height)));
      pane1Size = Math.round(ordered[0].height);
      pane2Size = Math.round(ordered[1].height);
    }
  }

  if (!hardwareFoldable && (horizontalSegments || verticalSegments)) {
    hardwareFoldable = true;
    hardwarePosture = horizontalSegments ? 'book' : 'tabletop';
  }

  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  const ratio = w / Math.max(1, h);
  const isFoldableInner = Boolean(isCoarsePointer && minDim >= 580 && maxDim <= 1150 && ratio >= 0.8 && ratio <= 1.25);
  const isCoverScreen = w <= 390;

  let autoMode = 'desktop';
  if (hardwareFoldable || isFoldableInner) {
    autoMode = 'duo';
  } else if (w < 640) {
    autoMode = 'mobile';
  } else if (w < 1024) {
    autoMode = 'tablet';
  }

  const mode = pref === 'auto' ? autoMode : pref;

  let duoPosture = 'book';
  if (posturePref === 'tabletop') {
    duoPosture = 'tabletop';
  } else if (posturePref === 'book') {
    duoPosture = w < 560 ? 'tabletop' : 'book';
  } else {
    duoPosture = hardwarePosture || (w >= 600 && w >= h * 0.78 ? 'book' : 'tabletop');
  }

  const isTabletSplit = mode === 'tablet' && w >= 768;
  const isForced = pref !== 'auto';
  const isPreviewConstrained = isForced && ((mode === 'mobile' && w > 520) || (mode === 'tablet' && w > 1040));

  return {
    width: w,
    height: h,
    autoMode,
    mode,
    preference: pref,
    duoPosture,
    duoPosturePref: posturePref,
    hardwareFoldable,
    hardwarePosture,
    isFoldableInner,
    isCoverScreen,
    isTabletSplit,
    isForced,
    isPreviewConstrained,
    hingeSize: hingeSize || (duoPosture === 'tabletop' ? 24 : 28),
    pane1Size: pane1Size || null,
    pane2Size: pane2Size || null,
  };
}
