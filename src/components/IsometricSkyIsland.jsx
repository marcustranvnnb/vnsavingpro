import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Droplets,
  Gift,
  Move,
  Paintbrush,
  Plus,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { useToast } from '../state.jsx';
import { ORCHARD_THEMES, computeTreeStatus } from '../data/wealthTreesData.js';
import { compact } from '../utils/format.js';
import { LuckyCatFortuneModal, LuckyCatMascot } from './LuckyCatMascot.jsx';
import { Badge, Button, Modal, cx } from './ui.jsx';

const DECOR_KEY = 'vnsaving_sky_island_decor_v1';

const DEFAULT_DECOR = {
  gardenName: '',
  hut: true,
  fountain: true,
  portal: true,
  waterfall: true,
  fence: true,
};

function readDecor() {
  try {
    const raw = localStorage.getItem(DECOR_KEY);
    if (!raw) return DEFAULT_DECOR;
    return { ...DEFAULT_DECOR, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DECOR;
  }
}

function saveDecor(next) {
  try {
    localStorage.setItem(DECOR_KEY, JSON.stringify(next));
  } catch {
    // ignore storage limits
  }
}

// 2.5D Isometric projection constants (7x6 terrain grid)
const HALF_W = 54;
const HALF_H = 27;
const ORIGIN_X = 560;
const ORIGIN_Y = 148;

function isoProject(col, row, elev = 0) {
  const x = ORIGIN_X + (col - row) * HALF_W;
  const y = ORIGIN_Y + (col + row) * HALF_H - elev;
  return { x, y };
}

function IsoVoxel({
  col,
  row,
  elev = 0,
  depth = 26,
  topFill = '#65a30d',
  leftFill = '#78350f',
  rightFill = '#451a03',
  stroke = 'rgba(0,0,0,0.22)',
  children,
}) {
  const { x, y } = isoProject(col, row, elev);
  const topPts = `${x},${y} ${x + HALF_W},${y + HALF_H} ${x},${y + HALF_H * 2} ${x - HALF_W},${y + HALF_H}`;
  const leftPts = `${x - HALF_W},${y + HALF_H} ${x},${y + HALF_H * 2} ${x},${y + HALF_H * 2 + depth} ${x - HALF_W},${y + HALF_H + depth}`;
  const rightPts = `${x},${y + HALF_H * 2} ${x + HALF_W},${y + HALF_H} ${x + HALF_W},${y + HALF_H + depth} ${x},${y + HALF_H * 2 + depth}`;

  return (
    <g>
      <polygon points={leftPts} fill={leftFill} stroke={stroke} strokeWidth="0.8" />
      <polygon points={rightPts} fill={rightFill} stroke={stroke} strokeWidth="0.8" />
      <polygon points={topPts} fill={topFill} stroke={stroke} strokeWidth="0.9" />
      {children}
    </g>
  );
}

// 12 interactive farm plot coordinates sorted back-to-front
const PLOT_COORDS = [
  { plotIndex: 0, col: 1, row: 2 },
  { plotIndex: 1, col: 2, row: 2 },
  { plotIndex: 2, col: 4, row: 2 },
  { plotIndex: 3, col: 5, row: 2 },
  { plotIndex: 4, col: 1, row: 3 },
  { plotIndex: 5, col: 2, row: 3 },
  { plotIndex: 6, col: 3, row: 3 },
  { plotIndex: 7, col: 4, row: 3 },
  { plotIndex: 8, col: 5, row: 3 },
  { plotIndex: 9, col: 2, row: 4 },
  { plotIndex: 10, col: 3, row: 4 },
  { plotIndex: 11, col: 4, row: 4 },
];

const STATIC_TERRAIN = [
  // Back mountain / waterfall stones (row 0)
  { key: 'stone_3_0', col: 3, row: 0, elev: 44, depth: 70, type: 'cliff' },
  { key: 'stone_4_0', col: 4, row: 0, elev: 32, depth: 58, type: 'cliff' },
  { key: 'grass_5_0', col: 5, row: 0, elev: 18, depth: 44, type: 'grass' },
  { key: 'grass_6_0', col: 6, row: 0, elev: 18, depth: 44, type: 'grass' },
  // Row 1
  { key: 'stone_0_1', col: 0, row: 1, elev: 14, depth: 42, type: 'stone_portal' },
  { key: 'grass_1_1', col: 1, row: 1, elev: 10, depth: 36, type: 'grass' },
  { key: 'grass_2_1', col: 2, row: 1, elev: 8, depth: 34, type: 'grass' },
  { key: 'water_3_1', col: 3, row: 1, elev: 4, depth: 30, type: 'water' },
  { key: 'grass_4_1', col: 4, row: 1, elev: 8, depth: 34, type: 'grass' },
  { key: 'grass_5_1', col: 5, row: 1, elev: 12, depth: 38, type: 'fountain_pad' },
  { key: 'grass_6_1', col: 6, row: 1, elev: 10, depth: 36, type: 'grass' },
  // Row 2 stream center & borders
  { key: 'grass_0_2', col: 0, row: 2, elev: 4, depth: 32, type: 'grass' },
  { key: 'water_3_2', col: 3, row: 2, elev: 0, depth: 28, type: 'water' },
  { key: 'grass_6_2', col: 6, row: 2, elev: 4, depth: 30, type: 'grass' },
  // Row 3 edges
  { key: 'grass_0_3', col: 0, row: 3, elev: 0, depth: 30, type: 'grass' },
  // Row 4 side flower beds
  { key: 'flower_1_4', col: 1, row: 4, elev: 0, depth: 30, type: 'flower_grass' },
  { key: 'flower_5_4', col: 5, row: 4, elev: 0, depth: 30, type: 'flower_grass' },
  // Front tip (row 5)
  { key: 'flower_2_5', col: 2, row: 5, elev: 0, depth: 32, type: 'flower_grass' },
  { key: 'grass_3_5', col: 3, row: 5, elev: 0, depth: 32, type: 'grass' },
  { key: 'flower_4_5', col: 4, row: 5, elev: 0, depth: 32, type: 'flower_grass' },
];

export function IsometricSkyIsland({
  trees = [],
  selectedId = '',
  onSelectTree,
  onPlantAtPlot,
  onMoveTreeToPlot,
  onWaterSelected,
  onHarvestSelected,
  onOpenAlmanac,
  onSeedDemo,
  renderTreeGlyph,
}) {
  const { lang, tx } = useI18n();
  const notify = useToast();

  const [themeId, setThemeId] = useState('SUNNY_MORNING');
  const [zoom, setZoom] = useState(1);
  const [decor, setDecor] = useState(readDecor);
  const [decorOpen, setDecorOpen] = useState(false);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [moveSourceId, setMoveSourceId] = useState('');

  const isRain = themeId === 'NOURISHING_RAIN';
  const isNight = themeId === 'STARRY_FIREFLY';

  // Assign each tree deterministically to a unique plot 0..11
  const plotToTree = useMemo(() => {
    const map = new Map();
    const unplaced = [];
    for (const t of trees) {
      const p = Number(t.plotIndex);
      if (Number.isInteger(p) && p >= 0 && p < 12 && !map.has(p)) {
        map.set(p, t);
      } else {
        unplaced.push(t);
      }
    }
    for (const t of unplaced) {
      for (let i = 0; i < 12; i++) {
        if (!map.has(i)) {
          map.set(i, t);
          break;
        }
      }
    }
    return map;
  }, [trees]);

  // Combined depth-sorted render tiles
  const sortedTiles = useMemo(() => {
    const items = [
      ...STATIC_TERRAIN.map((t) => ({ kind: 'static', ...t })),
      ...PLOT_COORDS.map((p) => ({ kind: 'plot', elev: 2, depth: 30, ...p })),
    ];
    return items.sort((a, b) => a.col + a.row - (b.col + b.row) || a.col - b.col);
  }, []);

  // Island Gamification HUD stats
  const totalCapital = trees.reduce((s, t) => s + computeTreeStatus(t).currentCapital, 0);
  const totalCheckIns = trees.reduce((s, t) => s + (t.checkIns?.length || 0), 0);
  const unlockedCount = trees.filter((t) => t.mysteryUnlocked).length;
  const harvestReadyTrees = trees.filter((t) => computeTreeStatus(t).canHarvestMystery);
  const harvestReadyCount = harvestReadyTrees.length;
  const xpPoints = trees.length * 40 + totalCheckIns * 25 + unlockedCount * 120 + Math.floor(totalCapital / 25_000_000);
  const islandLevel = Math.max(1, 1 + Math.floor(xpPoints / 120));
  const levelProgressPct = Math.min(100, Math.round(((xpPoints % 120) / 120) * 100));

  const selectedTree = trees.find((t) => t.id === selectedId) || trees[0] || null;
  const selectedStatus = selectedTree ? computeTreeStatus(selectedTree) : null;

  const updateDecor = (patch) => {
    const next = { ...decor, ...patch };
    setDecor(next);
    saveDecor(next);
  };

  const handlePlotClick = (plotIdx, occupantTree) => {
    if (moveSourceId) {
      if (occupantTree && occupantTree.id === moveSourceId) {
        setMoveSourceId('');
        return;
      }
      if (!occupantTree) {
        onMoveTreeToPlot?.(moveSourceId, plotIdx);
        setMoveSourceId('');
        notify(tx(`🏡 Đã di chuyển cây sang ô đất #${plotIdx + 1}!`, `🏡 Moved tree to plot #${plotIdx + 1}!`, `🏡 区画 #${plotIdx + 1} へ木を移動しました！`));
        return;
      }
      notify(tx('Ô đất này đã có cây khác! Hãy chọn ô đất trống để di chuyển.', 'That plot is occupied! Tap an empty plot.', 'その区画には別の木があります。空き区画を選んでください。'));
      return;
    }

    if (occupantTree) {
      onSelectTree?.(occupantTree);
    } else {
      onPlantAtPlot?.(plotIdx);
    }
  };

  const skyBg = isNight
    ? 'from-[#070b24] via-[#131842] to-[#0b2538]'
    : isRain
      ? 'from-[#1e293b] via-[#0e4a67] to-[#0f3d3e]'
      : 'from-[#0ea5e9]/75 via-[#38bdf8]/55 to-[#67e8f9]/45';

  return (
    <Card className="overflow-hidden border-amber-400/35 p-0 shadow-[0_24px_60px_-20px_rgba(14,165,233,0.35)]">
      {/* Top Wooden & Gold Game HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#784b26] bg-gradient-to-r from-[#2c1a0f] via-[#3a2315] to-[#2c1a0f] px-3 py-2.5 text-xs sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Star Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-black/35 px-2.5 py-1">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-[11px] font-extrabold text-white shadow">
              ★{islandLevel}
            </span>
            <div className="min-w-[68px]">
              <div className="flex items-center justify-between text-[10px] font-semibold text-amber-200">
                <span className="max-w-[110px] truncate">
                  {decor.gardenName.trim() || tx('Đảo Mây Của Tôi', 'My Sky Island', 'マイ天空島')}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300" style={{ width: `${levelProgressPct}%` }} />
              </div>
            </div>
          </div>

          {/* Mystery Fruit Gems */}
          <div
            className="flex items-center gap-1.5 rounded-xl border border-fuchsia-400/35 bg-black/35 px-2.5 py-1 font-semibold text-fuchsia-200 tabular-nums"
            title={tx('Quả Bí Ẩn đã mở / Cây trồng', 'Mystery Fruits Harvested', '神秘の実の数')}
          >
            <span>💎</span>
            <span>{unlockedCount} / {trees.length}</span>
          </div>

          {/* Orchard Capital Gold */}
          <div
            className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-black/35 px-2.5 py-1 font-semibold text-amber-200 tabular-nums"
            title={tx('Tổng vốn thực tế trong vườn', 'Total Orchard Capital', '庭園内の合計資産')}
          >
            <span>🪙</span>
            <span>{compact(totalCapital, lang)}</span>
          </div>

          {/* Tree Plots Counter */}
          <div className="hidden items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-black/35 px-2.5 py-1 font-semibold text-emerald-200 tabular-nums sm:flex">
            <span>🌱</span>
            <span>{trees.length}/12</span>
          </div>
        </div>

        {/* Weather & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ORCHARD_THEMES.map((th) => {
            const active = themeId === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setThemeId(th.id)}
                className={cx(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition',
                  active
                    ? 'border-amber-300 bg-amber-400/25 text-white shadow'
                    : 'border-white/15 bg-black/30 text-amber-100/75 hover:text-white'
                )}
              >
                <span>{th.emoji}</span>
                <span className="hidden md:inline">{th.label[lang] || th.label.vi}</span>
              </button>
            );
          })}
          <div className="hidden items-center rounded-full border border-white/15 bg-black/30 p-0.5 sm:inline-flex">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
              className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label={tx('Thu nhỏ đảo', 'Zoom out', '縮小')}
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))}
              className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label={tx('Phóng to đảo', 'Zoom in', '拡大')}
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Isometric Sky Island Viewport */}
      <div className={cx('relative overflow-hidden bg-gradient-to-b', skyBg)}>
        {/* Ambient Sky Glow & Rain Streaks */}
        {isRain && (
          <div className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(108deg,transparent_0,transparent_18px,rgba(186,230,253,0.18)_19px,transparent_21px)]" />
        )}
        {isNight && (
          <div className="pointer-events-none absolute right-10 top-6 z-0 size-14 rounded-full bg-amber-200/90 shadow-[0_0_40px_rgba(253,224,71,0.6)]" />
        )}

        {/* Left Floating Wooden Action Dock (like Farm Game UI) */}
        <div className="absolute left-2.5 top-3 z-20 flex flex-col gap-1.5 sm:left-3.5 sm:top-4">
          {[
            {
              id: 'almanac',
              icon: BookOpen,
              label: tx('14 Giống Cây', '14 Species', '14種図鑑'),
              onClick: onOpenAlmanac,
              tone: 'text-amber-950',
            },
            {
              id: 'plant',
              icon: Plus,
              label: tx('Gieo Cây Mới', 'Sow Seed', '新しく植える'),
              onClick: () => {
                const freePlot = PLOT_COORDS.find((p) => !plotToTree.has(p.plotIndex))?.plotIndex ?? 0;
                onPlantAtPlot?.(freePlot);
              },
              tone: 'text-emerald-900',
            },
            {
              id: 'water',
              icon: Droplets,
              label: tx('Tưới Cây', 'Water Tree', '水やり'),
              onClick: () => selectedTree && onWaterSelected?.(selectedTree),
              disabled: !selectedTree,
              tone: 'text-sky-900',
            },
            {
              id: 'harvest',
              icon: Gift,
              label: tx('Quả Bí Ẩn', 'Mystery Fruit', '神秘の実'),
              badge: harvestReadyCount > 0 ? harvestReadyCount : null,
              onClick: () => {
                if (harvestReadyTrees.length > 0) {
                  onHarvestSelected?.(harvestReadyTrees[0]);
                } else {
                  notify(tx('Chăm cây đạt 100% để mở khóa Quả Bí Ẩn nhé!', 'Grow any tree to 100% to harvest a Mystery Fruit!', '100%達成で神秘の実を収穫できます！'));
                }
              },
              tone: 'text-rose-900',
            },
            {
              id: 'decor',
              icon: Paintbrush,
              label: tx('Trang Trí Đảo', 'Decorate', '島を飾る'),
              onClick: () => setDecorOpen(true),
              tone: 'text-indigo-950',
            },
            {
              id: 'cat',
              icon: Sparkles,
              label: tx('Miu Vàng', 'Miu Cat', 'ミウちゃん'),
              onClick: () => setFortuneOpen(true),
              tone: 'text-amber-900',
            },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                disabled={btn.disabled}
                onClick={btn.onClick}
                title={btn.label}
                className={cx(
                  'group relative flex size-10 items-center justify-center rounded-xl border-2 border-[#784b26] bg-gradient-to-b from-[#fef3c7] to-[#e6c28b] shadow-[0_4px_10px_rgba(0,0,0,0.35)] transition hover:scale-105 active:scale-95 disabled:opacity-45 sm:size-11',
                  btn.tone
                )}
              >
                <Icon className="size-4 sm:size-5" />
                {btn.badge && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow">
                    {btn.badge}
                  </span>
                )}
                <span className="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-lg bg-black/85 px-2 py-1 text-[11px] font-medium text-white shadow group-hover:block">
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Move Mode Banner */}
        {moveSourceId && (
          <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300 bg-amber-950/95 px-4 py-1.5 text-xs font-semibold text-amber-100 shadow-xl">
            <Move className="size-3.5 text-amber-300" />
            <span>{tx('Chọn 1 ô đất trống trên đảo để dời cây tới!', 'Tap any empty island plot to move your tree!', '空き区画をタップして木を移動！')}</span>
            <button
              type="button"
              onClick={() => setMoveSourceId('')}
              className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] hover:bg-white/25"
            >
              {tx('Huỷ', 'Cancel', '中止')}
            </button>
          </div>
        )}

        {/* 2.5D Isometric Island Canvas */}
        <div className="overflow-x-auto px-2 py-3 sm:px-6">
          <div
            className="mx-auto transition-transform duration-200"
            style={{
              width: `${Math.round(920 * zoom)}px`,
              maxWidth: zoom <= 1 ? '100%' : 'none',
            }}
          >
            <svg viewBox="0 0 1120 620" className="w-full select-none drop-shadow-[0_26px_45px_rgba(0,0,0,0.45)]">
              <defs>
                <linearGradient id="waterfallBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <radialGradient id="portalGlow">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="65%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Soft Drifting Clouds Behind & Beneath the Floating Island */}
              <g opacity={isNight ? 0.25 : 0.88}>
                <g transform="translate(150, 410)">
                  <circle cx="0" cy="20" r="34" fill="#ffffff" />
                  <circle cx="42" cy="14" r="44" fill="#ffffff" />
                  <circle cx="90" cy="24" r="32" fill="#f8fafc" />
                  <ellipse cx="46" cy="40" rx="76" ry="20" fill="#e0f2fe" />
                </g>
                <g transform="translate(820, 430)">
                  <circle cx="0" cy="18" r="30" fill="#ffffff" />
                  <circle cx="40" cy="10" r="42" fill="#ffffff" />
                  <circle cx="84" cy="22" r="28" fill="#f8fafc" />
                  <ellipse cx="42" cy="36" rx="70" ry="18" fill="#e0f2fe" />
                </g>
                <g transform="translate(760, 78)" opacity="0.8">
                  <circle cx="0" cy="14" r="22" fill="#ffffff" />
                  <circle cx="28" cy="10" r="28" fill="#ffffff" />
                  <circle cx="58" cy="16" r="20" fill="#f8fafc" />
                </g>
                <g transform="translate(260, 62)" opacity="0.72">
                  <circle cx="0" cy="14" r="20" fill="#ffffff" />
                  <circle cx="26" cy="9" r="26" fill="#ffffff" />
                  <circle cx="54" cy="15" r="18" fill="#f8fafc" />
                </g>
              </g>

              {/* Back-to-front Painter's Order Isometric Tiles & Objects */}
              {sortedTiles.map((tile) => {
                if (tile.kind === 'static') {
                  const isWater = tile.type === 'water';
                  const isCliff = tile.type === 'cliff';
                  const isStonePortal = tile.type === 'stone_portal';
                  const isFlower = tile.type === 'flower_grass';

                  const topFill = isWater
                    ? '#38bdf8'
                    : isCliff
                      ? '#a8a29e'
                      : isStonePortal
                        ? '#cbd5e1'
                        : '#84cc16';
                  const leftFill = isWater ? '#0284c7' : isCliff || isStonePortal ? '#78716c' : '#a16207';
                  const rightFill = isWater ? '#0369a1' : isCliff || isStonePortal ? '#57534e' : '#713f12';
                  const { x, y } = isoProject(tile.col, tile.row, tile.elev);

                  return (
                    <IsoVoxel
                      key={tile.key}
                      col={tile.col}
                      row={tile.row}
                      elev={tile.elev}
                      depth={tile.depth}
                      topFill={topFill}
                      leftFill={leftFill}
                      rightFill={rightFill}
                    >
                      {/* Animated Waterfall Cascade */}
                      {tile.key === 'stone_3_0' && decor.waterfall && (
                        <g>
                          <path
                            d={`M${x - 14} ${y + 24} L${x + 12} ${y + 38} L${x + 12} ${y + 88} L${x - 14} ${y + 72} Z`}
                            fill="url(#waterfallBlue)"
                            opacity="0.92"
                          />
                          <ellipse cx={x - 1} cy={y + 84} rx="22" ry="9" fill="#e0f2fe" opacity="0.75" />
                        </g>
                      )}

                      {/* Water Ripples & Lily Pad */}
                      {isWater && (
                        <g>
                          <ellipse cx={x} cy={y + 27} rx="22" ry="10" fill="#7dd3fc" opacity="0.4" />
                          <circle cx={x - 12} cy={y + 26} r="6" fill="#22c55e" />
                          <circle cx={x - 10} cy={y + 24} r="3" fill="#f472b6" />
                        </g>
                      )}

                      {/* Vietnamese Thatched Pavilion (Chòi Tranh) at grass_6_0 */}
                      {tile.key === 'grass_6_0' && decor.hut && (
                        <g transform={`translate(${x}, ${y + 12})`}>
                          {/* Pillars & Floor */}
                          <ellipse cx="0" cy="14" rx="28" ry="13" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
                          <line x1="-18" y1="10" x2="-18" y2="-22" stroke="#78350f" strokeWidth="4" />
                          <line x1="18" y1="10" x2="18" y2="-22" stroke="#78350f" strokeWidth="4" />
                          <line x1="0" y1="20" x2="0" y2="-16" stroke="#92400e" strokeWidth="4" />
                          {/* Golden Thatched Conical Roof */}
                          <polygon points="0,-54 -36,-16 36,-16" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                          <polygon points="0,-54 0,-16 36,-16" fill="#eab308" />
                          <circle cx="0" cy="-55" r="4" fill="#fef08a" />
                        </g>
                      )}

                      {/* Crystal Fountain at grass_5_1 */}
                      {tile.type === 'fountain_pad' && decor.fountain && (
                        <g transform={`translate(${x}, ${y + 16})`}>
                          <ellipse cx="0" cy="12" rx="26" ry="13" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="2.5" />
                          <rect x="-5" y="-12" width="10" height="22" rx="3" fill="#bae6fd" />
                          <ellipse cx="0" cy="-12" rx="13" ry="6" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.5" />
                          <path d="M0,-14 Q-12,-28 -18,-6" fill="none" stroke="#e0f2fe" strokeWidth="2" />
                          <path d="M0,-14 Q12,-28 18,-6" fill="none" stroke="#e0f2fe" strokeWidth="2" />
                        </g>
                      )}

                      {/* Mystic Island Portal at stone_0_1 */}
                      {isStonePortal && decor.portal && (
                        <g transform={`translate(${x}, ${y + 12})`}>
                          <ellipse cx="0" cy="-16" rx="22" ry="30" fill="none" stroke="#a3e635" strokeWidth="6" />
                          <ellipse cx="0" cy="-16" rx="16" ry="23" fill="url(#portalGlow)" className="animate-coin-sparkle" />
                        </g>
                      )}

                      {/* Pretty Flowers on Outer Rim */}
                      {isFlower && (
                        <g transform={`translate(${x}, ${y + 25})`}>
                          <circle cx="-12" cy="-2" r="4" fill="#fbbf24" />
                          <circle cx="10" cy="2" r="4" fill="#fb7185" />
                          <circle cx="2" cy="-8" r="3.5" fill="#fde047" />
                        </g>
                      )}
                    </IsoVoxel>
                  );
                }

                // Interactive Farm Plot 0..11
                const occupant = plotToTree.get(tile.plotIndex) || null;
                const occStatus = occupant ? computeTreeStatus(occupant) : null;
                const isSelected = Boolean(occupant && occupant.id === selectedTree?.id);
                const isMoveTarget = Boolean(moveSourceId && !occupant);
                const isLotusPlot = occStatus?.species?.id === 'sen_dong_thap';
                const { x, y } = isoProject(tile.col, tile.row, tile.elev);

                return (
                  <g
                    key={`plot_${tile.plotIndex}`}
                    onClick={() => handlePlotClick(tile.plotIndex, occupant)}
                    className="cursor-pointer group"
                  >
                    <IsoVoxel
                      col={tile.col}
                      row={tile.row}
                      elev={tile.elev}
                      depth={tile.depth}
                      topFill={isLotusPlot ? '#0284c7' : occupant ? '#b47844' : '#d6a468'}
                      leftFill="#92400e"
                      rightFill="#78350f"
                      stroke={isSelected ? '#fde047' : isMoveTarget ? '#34d399' : 'rgba(255,255,255,0.22)'}
                    >
                      {/* Highlight Halo on Selected or Move-Target Plot */}
                      {(isSelected || isMoveTarget) && (
                        <polygon
                          points={`${x},${y + 3} ${x + HALF_W - 5},${y + HALF_H} ${x},${y + HALF_H * 2 - 3} ${x - HALF_W + 5},${y + HALF_H}`}
                          fill="none"
                          stroke={isSelected ? '#fde047' : '#4ade80'}
                          strokeWidth="3"
                        />
                      )}

                      {/* Small Wooden Farm Fence Posts */}
                      {decor.fence && (
                        <g stroke="#78350f" strokeWidth="2.5" strokeLinecap="round">
                          <line x1={x - 42} y1={y + 26} x2={x - 42} y2={y + 15} />
                          <line x1={x + 42} y1={y + 26} x2={x + 42} y2={y + 15} />
                        </g>
                      )}

                      {/* Empty Plot "+" Prompt */}
                      {!occupant && (
                        <g transform={`translate(${x}, ${y + 27})`}>
                          <ellipse cx="0" cy="0" rx="18" ry="9" fill="rgba(255,255,255,0.22)" />
                          <text x="0" y="3.5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#fffbeb">
                            +
                          </text>
                        </g>
                      )}

                      {/* Live Growing Vietnamese Tree Inside the 3D Isometric Plot */}
                      {occupant && occStatus && renderTreeGlyph && (
                        <g transform={`translate(${x - 86}, ${y - 108}) scale(0.61)`}>
                          {renderTreeGlyph(occStatus, { compactScene: true })}
                        </g>
                      )}

                      {/* Miu Vang Standing Beside the Selected Tree Plot */}
                      {isSelected && (
                        <g>
                          <circle cx={x + 34} cy={y + 8} r="14" fill="rgba(251,191,36,0.28)" />
                          <svg x={x + 12} y={y - 24} width="44" height="44">
                            <LuckyCatMascot
                              mood={occStatus?.canHarvestMystery ? 'celebrate' : 'gardener'}
                              className="h-full w-full"
                            />
                          </svg>
                        </g>
                      )}

                      {/* Compact Progress Badge at Front Corner of Plot */}
                      {occupant && occStatus && (
                        <g transform={`translate(${x}, ${y + 44})`}>
                          <rect
                            x="-30"
                            y="-9"
                            width="60"
                            height="16"
                            rx="8"
                            fill={isSelected ? '#f59e0b' : 'rgba(15,23,42,0.85)'}
                            stroke={occStatus.canHarvestMystery ? '#fde047' : 'rgba(255,255,255,0.25)'}
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="2.5"
                            textAnchor="middle"
                            fontSize="9.5"
                            fontWeight="700"
                            fill={isSelected ? '#1c1917' : '#f8fafc'}
                          >
                            {occStatus.species.emoji} {occStatus.rawProgressPct}%
                          </text>
                        </g>
                      )}
                    </IsoVoxel>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Bottom Selected-Plot Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/55 px-4 py-2.5 text-xs backdrop-blur-md">
          {selectedTree && selectedStatus ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base">{selectedStatus.species.emoji}</span>
                <span className="font-semibold text-white">{selectedTree.title}</span>
                <Badge tone="brand">{selectedStatus.rawProgressPct}%</Badge>
                {selectedStatus.growthMultiplier > 1 && (
                  <Badge tone="warning">⚡ {selectedStatus.growthMultiplier}x</Badge>
                )}
                <span className="hidden text-zinc-400 sm:inline">
                  · {compact(selectedStatus.currentCapital, lang)} / {compact(selectedStatus.targetCapital, lang)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button type="button" size="sm" variant="primary" onClick={() => onWaterSelected?.(selectedTree)}>
                  💧 {tx('Tưới cây', 'Water Tree', '水やり')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={moveSourceId === selectedTree.id ? 'primary' : 'secondary'}
                  onClick={() => setMoveSourceId((prev) => (prev === selectedTree.id ? '' : selectedTree.id))}
                >
                  <Move className="size-3.5" />
                  {moveSourceId === selectedTree.id
                    ? tx('Đang chọn ô mới...', 'Tap empty plot...', '移動先を選択...')
                    : tx('Dời vị trí cây', 'Move Plot', '区画を移動')}
                </Button>
                {selectedStatus.canHarvestMystery && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => onHarvestSelected?.(selectedTree)}>
                    ✨ {tx('Mở Quả Bí Ẩn', 'Harvest Fruit', '神秘の実を開く')}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <span className="text-zinc-300">
                {tx(
                  'Chạm vào bất kỳ dấu (+) trên Đảo Mây để trồng hạt giống đầu tiên của bạn!',
                  'Tap any (+) soil plot on the Sky Island to plant your first seed!',
                  '天空島の (+) 区画をタップして最初の種を植えましょう！'
                )}
              </span>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="primary" onClick={() => onPlantAtPlot?.(0)}>
                  🌱 {tx('Gieo hạt ngay', 'Plant Seed', '今すぐ植える')}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={onSeedDemo}>
                  🤖 {tx('Thử Đảo Mẫu Bot', 'Demo Island', '見本を見る')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorate & Personalize Sky Island Modal */}
      <Modal
        open={decorOpen}
        onClose={() => setDecorOpen(false)}
        title={tx('🏡 Trang Trí Đảo Mây Cá Nhân', '🏡 Customize Your Personal Sky Island', '🏡 天空島をカスタマイズ')}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              {tx('Tên Khu Vườn Của Bạn', 'Your Personal Garden Name', 'あなただけの庭園名')}
            </label>
            <input
              type="text"
              maxLength={40}
              value={decor.gardenName}
              onChange={(e) => updateDecor({ gardenName: e.target.value })}
              placeholder={tx('VD: Đảo Mây Nhà Mình ✨', 'e.g. Our Sky Sanctuary ✨', '例：わが家の天空ガーデン ✨')}
              className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-400">
              {tx('Công trình & Cảnh quan trên Đảo Mây', 'Island Landmarks & Props', '島の施設・景観')}
            </div>
            {[
              { key: 'hut', label: tx('🛖 Chòi Tranh Nghỉ Chân Việt Nam', '🛖 Vietnamese Thatched Pavilion', '🛖 伝統的なあずまや') },
              { key: 'fountain', label: tx('⛲ Đài Phun Nước Pha Lê', '⛲ Crystal Fountain', '⛲ クリスタル噴水') },
              { key: 'waterfall', label: tx('🏞️ Thác Nước Đỉnh Núi & Hồ Sen', '🏞️ Cascade Waterfall', '🏞️ 崖の滝') },
              { key: 'portal', label: tx('🌀 Cổng Thần Kỳ Ánh Ngọc', '🌀 Emerald Mystic Portal', '🌀 エメラルドのポータル') },
              { key: 'fence', label: tx('🪵 Hàng Rào Gỗ Ô Đất', '🪵 Wooden Plot Fences', '🪵 区画の木製フェンス') },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-zinc-200 hover:bg-white/[0.05]"
              >
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(decor[item.key])}
                  onChange={(e) => updateDecor({ [item.key]: e.target.checked })}
                  className="size-4 accent-emerald-400"
                />
              </label>
            ))}
          </div>

          <Button type="button" variant="primary" className="w-full" onClick={() => setDecorOpen(false)}>
            {tx('Lưu & Ngắm Đảo Mây', 'Save & View Island', '保存して島を見る')}
          </Button>
        </div>
      </Modal>

      <LuckyCatFortuneModal open={fortuneOpen} onClose={() => setFortuneOpen(false)} />
    </Card>
  );
}
