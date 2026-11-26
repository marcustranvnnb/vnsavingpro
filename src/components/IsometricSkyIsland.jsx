import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Droplets,
  Eye,
  Gift,
  Home,
  Lock,
  Move,
  Paintbrush,
  Plus,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { href, useToast } from '../state.jsx';
import { ORCHARD_THEMES, computeTreeStatus } from '../data/wealthTreesData.js';
import { HOUSE_LEVELS, computeIslandProgression } from '../data/islandProgressionData.js';
import {
  loadActivePassbooks,
  loadSavedCicLoanState,
  loadSavedFxState,
  loadSavedPlannerState,
} from '../utils/apiClient.js';
import { compact } from '../utils/format.js';
import { LuckyCatFortuneModal, LuckyCatMascot } from './LuckyCatMascot.jsx';
import { Badge, Button, Card, Modal, cx } from './ui.jsx';

const ISLAND_CONFIG_KEY = 'vnsaving_sky_island_config_v2';

const DEFAULT_CONFIG = {
  gardenName: '',
  builtHouseLevel: 1,
};

function readIslandConfig() {
  try {
    const raw = localStorage.getItem(ISLAND_CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveIslandConfig(next) {
  try {
    localStorage.setItem(ISLAND_CONFIG_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

// 12 calibrated soil plot centers (%) matching the 4x3 grid on /assets/garden/sky-island-map.jpg
// Sorted back-to-front so front trees cleanly overlap back trees
const SKY_ISLAND_PLOTS = [
  { plotIndex: 0, left: 54.0, top: 47.0, z: 10 },
  { plotIndex: 1, left: 46.5, top: 53.0, z: 11 },
  { plotIndex: 2, left: 61.8, top: 53.2, z: 12 },
  { plotIndex: 3, left: 38.8, top: 59.2, z: 13 },
  { plotIndex: 4, left: 54.2, top: 59.4, z: 14 },
  { plotIndex: 5, left: 69.5, top: 59.6, z: 15 },
  { plotIndex: 6, left: 31.2, top: 65.4, z: 16 },
  { plotIndex: 7, left: 46.5, top: 65.6, z: 17 },
  { plotIndex: 8, left: 62.0, top: 65.8, z: 18 },
  { plotIndex: 9, left: 39.0, top: 72.0, z: 19 },
  { plotIndex: 10, left: 54.4, top: 72.2, z: 20 },
  { plotIndex: 11, left: 46.8, top: 78.4, z: 21 },
];

const NIGHT_FIREFLIES = [
  { left: '22%', top: '34%', delay: '0s' },
  { left: '34%', top: '28%', delay: '0.6s' },
  { left: '48%', top: '18%', delay: '1.1s' },
  { left: '62%', top: '32%', delay: '0.4s' },
  { left: '74%', top: '26%', delay: '1.5s' },
  { left: '42%', top: '52%', delay: '0.9s' },
  { left: '58%', top: '62%', delay: '0.2s' },
  { left: '36%', top: '68%', delay: '1.7s' },
  { left: '66%', top: '56%', delay: '0.7s' },
  { left: '50%', top: '74%', delay: '1.3s' },
];

export function IsometricSkyIsland({
  trees = [],
  selectedId = '',
  wateringBurst = null,
  onSelectTree,
  onPlantAtPlot,
  onMoveTreeToPlot,
  onWaterSelected,
  onHarvestSelected,
  onOpenAlmanac,
  onSeedDemo,
}) {
  const { lang, tx } = useI18n();
  const notify = useToast();

  const [themeId, setThemeId] = useState('SUNNY_MORNING');
  const [zoom, setZoom] = useState(1);
  const [config, setConfig] = useState(readIslandConfig);
  const [houseModalOpen, setHouseModalOpen] = useState(false);
  const [previewDreamLv5, setPreviewDreamLv5] = useState(false);
  const [houseAnimKey, setHouseAnimKey] = useState(0);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [moveSourceId, setMoveSourceId] = useState('');

  const isRain = themeId === 'NOURISHING_RAIN';
  const isNight = themeId === 'STARRY_FIREFLY';

  // Read live Core Plan state to link House Upgrade & Landmarks directly with /plan, /fx, /cic & Passbooks
  const coreProgression = useMemo(() => {
    const plan = loadSavedPlannerState();
    const passbooks = loadActivePassbooks();
    const fxPortfolio = loadSavedFxState();
    const cicState = loadSavedCicLoanState();
    return computeIslandProgression({ trees, plan, passbooks, fxPortfolio, cicState });
  }, [trees]);

  const effectiveBuiltLevel = previewDreamLv5
    ? 5
    : Math.max(1, Math.min(5, config.builtHouseLevel || coreProgression.earnedHouseLevel));
  const canUpgradeHouse = coreProgression.earnedHouseLevel > (config.builtHouseLevel || 1);
  const displayedHouseLevel = previewDreamLv5
    ? 5
    : Math.max(effectiveBuiltLevel, Math.min(coreProgression.earnedHouseLevel, effectiveBuiltLevel));
  const houseMeta = HOUSE_LEVELS.find((h) => h.level === displayedHouseLevel) || HOUSE_LEVELS[0];
  const unlockedPlotsCount = previewDreamLv5
    ? 12
    : Math.max(coreProgression.unlockedPlots, houseMeta.unlockedPlots);

  const updateConfig = (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveIslandConfig(next);
  };

  const handleBuildNextHouse = (targetLevel) => {
    updateConfig({ builtHouseLevel: targetLevel });
    setHouseAnimKey((k) => k + 1);
    const meta = HOUSE_LEVELS.find((h) => h.level === targetLevel);
    notify(
      tx(
        `🏡 Tuyệt vời! Đã xây xong ${meta?.name.vi || `Nhà Cấp ${targetLevel}`} trên Đảo Mây!`,
        `🏡 Upgraded island home to ${meta?.name.en || `Lv.${targetLevel}`}!`,
        `🏡 天空島の住まいを ${meta?.name.ja || `Lv.${targetLevel}`} へ増築しました！`
      )
    );
  };

  // Assign trees deterministically to unique plots 0..11
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

  // HUD Game Stats
  const totalCapital = trees.reduce((s, t) => s + computeTreeStatus(t).currentCapital, 0);
  const totalCheckIns = trees.reduce((s, t) => s + (t.checkIns?.length || 0), 0);
  const unlockedFruits = trees.filter((t) => t.mysteryUnlocked).length;
  const harvestReadyTrees = trees.filter((t) => computeTreeStatus(t).canHarvestMystery);
  const harvestReadyCount = harvestReadyTrees.length;
  const xpPoints =
    trees.length * 40 +
    totalCheckIns * 25 +
    unlockedFruits * 120 +
    displayedHouseLevel * 60 +
    Math.floor(totalCapital / 25_000_000);
  const islandLevel = Math.max(1, 1 + Math.floor(xpPoints / 120));
  const levelProgressPct = Math.min(100, Math.round(((xpPoints % 120) / 120) * 100));

  const selectedTree = trees.find((t) => t.id === selectedId) || trees[0] || null;
  const selectedStatus = selectedTree ? computeTreeStatus(selectedTree) : null;

  const handlePlotClick = (plotIdx, isLocked, occupantTree) => {
    if (isLocked) {
      setHouseModalOpen(true);
      notify(
        tx(
          `🔒 Ô đất #${plotIdx + 1} mở khóa khi nâng cấp Ngôi Nhà trên Đảo Mây!`,
          `🔒 Plot #${plotIdx + 1} unlocks as you upgrade your Sky Island Home!`,
          `🔒 区画 #${plotIdx + 1} は住まいのアップグレードで開放されます！`
        )
      );
      return;
    }

    if (moveSourceId) {
      if (occupantTree && occupantTree.id === moveSourceId) {
        setMoveSourceId('');
        return;
      }
      if (!occupantTree) {
        onMoveTreeToPlot?.(moveSourceId, plotIdx);
        setMoveSourceId('');
        notify(tx(`🏡 Đã dời cây sang ô đất #${plotIdx + 1}!`, `🏡 Moved tree to plot #${plotIdx + 1}!`, `🏡 区画 #${plotIdx + 1} へ木を移動しました！`));
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

  return (
    <Card className="overflow-hidden border-amber-400/40 p-0 shadow-[0_24px_60px_-20px_rgba(14,165,233,0.35)]">
      {/* Top Wooden & Gold Game HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#784b26] bg-gradient-to-r from-[#2c1a0f] via-[#3d2516] to-[#2c1a0f] px-3 py-2.5 text-xs sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Island Level + XP */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-black/35 px-2.5 py-1">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-[11px] font-extrabold text-white shadow">
              ★{islandLevel}
            </span>
            <div className="min-w-[78px]">
              <div className="max-w-[125px] truncate text-[10px] font-semibold text-amber-200">
                {config.gardenName.trim() || tx('Đảo Mây Của Tôi', 'My Sky Island', 'マイ天空島')}
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* House Level & Upgrade Shortcut */}
          <button
            type="button"
            onClick={() => setHouseModalOpen(true)}
            className={cx(
              'flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-semibold transition',
              canUpgradeHouse
                ? 'animate-pulse border-amber-300 bg-amber-500/25 text-amber-100'
                : 'border-emerald-400/35 bg-black/35 text-emerald-200 hover:bg-emerald-500/15'
            )}
          >
            <Home className="size-3.5" />
            <span>
              {tx(`Nhà Lv.${displayedHouseLevel}`, `Home Lv.${displayedHouseLevel}`, `家 Lv.${displayedHouseLevel}`)}
            </span>
            {canUpgradeHouse && <span className="rounded bg-amber-400 px-1 text-[9px] font-bold text-black">UP!</span>}
          </button>

          {/* Mystery Fruit Gems */}
          <div className="flex items-center gap-1.5 rounded-xl border border-fuchsia-400/35 bg-black/35 px-2.5 py-1 font-semibold text-fuchsia-200 tabular-nums">
            <span>💎</span>
            <span>{unlockedFruits} / {trees.length}</span>
          </div>

          {/* Orchard Capital Gold */}
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-black/35 px-2.5 py-1 font-semibold text-amber-200 tabular-nums">
            <span>🪙</span>
            <span>{compact(totalCapital, lang)}</span>
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
          <button
            type="button"
            onClick={() => setPreviewDreamLv5((v) => !v)}
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition',
              previewDreamLv5
                ? 'border-emerald-300 bg-emerald-500/30 text-white'
                : 'border-white/15 bg-black/30 text-amber-100/75 hover:text-white'
            )}
            title={tx('Xem trước Dinh thự Lv.5 & mở 12 ô đất', 'Preview Lv.5 Mansion & all 12 plots', 'Lv.5豪邸・全12区画をプレビュー')}
          >
            <Eye className="size-3" />
            <span className="hidden lg:inline">{previewDreamLv5 ? 'Lv.5 Demo' : tx('Xem trước', 'Preview', '予想')}</span>
          </button>
          <div className="hidden items-center rounded-full border border-white/15 bg-black/30 p-0.5 sm:inline-flex">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.9, Number((z - 0.1).toFixed(2))))}
              className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label={tx('Thu nhỏ đảo', 'Zoom out', '縮小')}
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
              className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label={tx('Phóng to đảo', 'Zoom in', '拡大')}
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Painted 2.5D Isometric Sky Island Stage */}
      <div className="relative overflow-hidden bg-[#1e3a5f]">
        {/* Left Floating Wooden Action Dock */}
        <div className="absolute left-2.5 top-3 z-30 flex flex-col gap-1.5 sm:left-3.5 sm:top-4">
          {[
            {
              id: 'almanac',
              icon: BookOpen,
              label: tx('14 Giống Cây (8 Chu kỳ)', '14 Species (8 Stages)', '14種図鑑（8段階）'),
              onClick: onOpenAlmanac,
              tone: 'text-amber-950',
            },
            {
              id: 'plant',
              icon: Plus,
              label: tx('Gieo Cây Mới', 'Sow Seed', '新しく植える'),
              onClick: () => {
                const freePlot = SKY_ISLAND_PLOTS.find(
                  (p) => p.plotIndex < unlockedPlotsCount && !plotToTree.has(p.plotIndex)
                )?.plotIndex;
                if (freePlot === undefined) {
                  setHouseModalOpen(true);
                  notify(tx('Các ô đất đã mở đều đã trồng cây! Nâng cấp Ngôi Nhà để mở thêm ô đất nhé.', 'All unlocked plots are full! Upgrade your House to unlock more plots.', '開放済み区画がいっぱいです！家を増築して区画を増やしましょう。'));
                } else {
                  onPlantAtPlot?.(freePlot);
                }
              },
              tone: 'text-emerald-900',
            },
            {
              id: 'water',
              icon: Droplets,
              label: tx('Tưới Cây Đang Chọn', 'Water Tree', '水やり'),
              onClick: () => selectedTree && onWaterSelected?.(selectedTree),
              disabled: !selectedTree,
              tone: 'text-sky-900',
            },
            {
              id: 'harvest',
              icon: Gift,
              label: tx('Thu Hoạch Quả Bí Ẩn', 'Harvest Mystery Fruit', '神秘の実'),
              badge: harvestReadyCount > 0 ? harvestReadyCount : null,
              onClick: () => {
                if (harvestReadyTrees.length > 0) {
                  onHarvestSelected?.(harvestReadyTrees[0]);
                } else {
                  notify(tx('Chăm cây tới Chu kỳ 8 (100%) để mở khóa Quả Bí Ẩn nhé!', 'Grow any tree to Stage 8 (100%) to unlock a Mystery Fruit!', '第8段階（100%）で神秘の実を収穫できます！'));
                }
              },
              tone: 'text-rose-900',
            },
            {
              id: 'house',
              icon: Home,
              label: tx('Xây Nhà & Mở Khóa Đảo', 'Upgrade Home & Island', '家の増築・開放'),
              badge: canUpgradeHouse ? '!' : null,
              onClick: () => setHouseModalOpen(true),
              tone: 'text-amber-900',
            },
            {
              id: 'cat',
              icon: Sparkles,
              label: tx('Mèo Miu Vàng · Quẻ Lộc', 'Miu Cat Fortune', '招き猫ミウちゃん'),
              onClick: () => setFortuneOpen(true),
              tone: 'text-indigo-950',
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
                  'group relative flex size-9 items-center justify-center rounded-xl border-2 border-[#784b26] bg-gradient-to-b from-[#fef3c7] to-[#e6c28b] shadow-[0_4px_10px_rgba(0,0,0,0.4)] transition hover:scale-105 active:scale-95 disabled:opacity-45 sm:size-11',
                  btn.tone
                )}
              >
                <Icon className="size-4 sm:size-5" />
                {btn.badge !== null && btn.badge !== undefined && (
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

        {/* Move Mode Floating Prompt */}
        {moveSourceId && (
          <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300 bg-amber-950/95 px-4 py-1.5 text-xs font-semibold text-amber-100 shadow-xl">
            <Move className="size-3.5 text-amber-300" />
            <span>{tx('Chọn 1 ô đất trống đã mở khóa để dời cây tới!', 'Tap any unlocked empty plot to move your tree!', '開放済みの空き区画をタップ！')}</span>
            <button
              type="button"
              onClick={() => setMoveSourceId('')}
              className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] hover:bg-white/25"
            >
              {tx('Huỷ', 'Cancel', '中止')}
            </button>
          </div>
        )}

        {/* Scrollable 16:9 Isometric Island Artwork + Interactive Overlays */}
        <div className="overflow-x-auto">
          <div
            className="relative mx-auto aspect-[16/9] min-w-[680px] select-none transition-all duration-200"
            style={{ width: zoom > 1 ? `${Math.round(zoom * 100)}%` : '100%' }}
          >
            {/* Base Hand-Painted 2.5D Isometric Floating Island Map */}
            <img
              src="/assets/garden/sky-island-map.jpg"
              alt={tx('Đảo Mây Tài Sản 2.5D', '2.5D Floating Wealth Sky Island', '2.5D天空資産アイランド')}
              draggable={false}
              className={cx(
                'h-full w-full object-cover transition duration-500',
                isNight && 'brightness-[0.55] contrast-115 saturate-90 hue-rotate-[12deg]',
                isRain && 'brightness-[0.82] saturate-90'
              )}
            />

            {/* Weather FX Layer: Morning Sunbeams / Rain / Starry Fireflies */}
            {!isNight && !isRain && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 22% 14%, rgba(254, 240, 138, 0.28), transparent 45%)',
                }}
              />
            )}
            {isRain && (
              <div className="pointer-events-none absolute inset-0 z-20 bg-[repeating-linear-gradient(108deg,transparent_0,transparent_18px,rgba(186,230,253,0.22)_19px,transparent_21px)]" />
            )}
            {isNight && (
              <div className="pointer-events-none absolute inset-0 z-20">
                <div className="absolute right-[10%] top-[8%] size-10 rounded-full bg-amber-200/90 shadow-[0_0_32px_rgba(253,224,71,0.75)] sm:size-14" />
                {NIGHT_FIREFLIES.map((ff, idx) => (
                  <span
                    key={idx}
                    className="animate-firefly absolute size-2 rounded-full bg-amber-300 shadow-[0_0_12px_#fde047]"
                    style={{ left: ff.left, top: ff.top, animationDelay: ff.delay }}
                  />
                ))}
              </div>
            )}

            {/* Evolving Personal Home Overlay (Lv.1 -> Lv.5) Seated on Top-Right Terrace */}
            <button
              key={`house_${houseAnimKey}_${displayedHouseLevel}`}
              type="button"
              onClick={() => setHouseModalOpen(true)}
              style={{ left: '72%', top: '23%', zIndex: 15 }}
              className="animate-build-pop group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition hover:scale-105 focus-visible:outline-none"
              title={`${houseMeta.name[lang] || houseMeta.name.vi} (Lv.${displayedHouseLevel})`}
            >
              <img
                src={houseMeta.sprite}
                alt={houseMeta.name[lang] || houseMeta.name.vi}
                draggable={false}
                className={cx(
                  'w-[16vw] min-w-[104px] max-w-[205px] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]',
                  isNight && 'drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                )}
              />
              <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-amber-300/60 bg-black/80 px-2 py-0.5 text-[10px] font-bold text-amber-200 shadow">
                🏡 Lv.{displayedHouseLevel}
                {canUpgradeHouse && <span className="text-emerald-300">⬆</span>}
              </span>
            </button>

            {/* Unlocked Treasure Chest Near Staircase when Mystery Fruit Harvested */}
            {(unlockedFruits > 0 || previewDreamLv5) && (
              <div
                style={{ left: '61%', top: '39.5%', zIndex: 14 }}
                className="animate-build-pop pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <img
                  src="/assets/garden/props/chest.png"
                  alt="Rương Kho Báu Mùa Vàng"
                  className="w-[5.2vw] min-w-[36px] max-w-[66px] object-contain drop-shadow-[0_6px_12px_rgba(251,191,36,0.65)]"
                />
              </div>
            )}

            {/* Interactive 12 Soil Plots Matched to Sky Island Grid */}
            {SKY_ISLAND_PLOTS.map((plot) => {
              const occupant = plotToTree.get(plot.plotIndex) || null;
              const isLocked = plot.plotIndex >= unlockedPlotsCount && !occupant;
              const occStatus = occupant ? computeTreeStatus(occupant) : null;
              const isSelected = Boolean(occupant && occupant.id === selectedTree?.id);
              const isMoveTarget = Boolean(moveSourceId && !occupant && !isLocked);
              const isBeingWatered = Boolean(wateringBurst && occupant && wateringBurst.treeId === occupant.id);

              return (
                <div
                  key={`plot_${plot.plotIndex}`}
                  style={{ left: `${plot.left}%`, top: `${plot.top}%`, zIndex: plot.z }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => handlePlotClick(plot.plotIndex, isLocked, occupant)}
                    className={cx(
                      'group relative flex items-center justify-center rounded-full transition focus-visible:outline-none',
                      isSelected && 'ring-2 ring-amber-300/90 ring-offset-2 ring-offset-transparent',
                      isMoveTarget && 'ring-2 ring-emerald-400 animate-pulse'
                    )}
                    aria-label={
                      occupant
                        ? occupant.title
                        : isLocked
                          ? `Ô đất #${plot.plotIndex + 1} (Chưa mở khóa)`
                          : `Gieo cây vào ô đất #${plot.plotIndex + 1}`
                    }
                  >
                    {/* Locked Expansion Plot */}
                    {isLocked && (
                      <div className="relative flex flex-col items-center opacity-90 transition group-hover:scale-105">
                        <img
                          src="/assets/garden/houses/plot_locked.png"
                          alt=""
                          draggable={false}
                          className="w-[6.8vw] min-w-[46px] max-w-[82px] -translate-y-2 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
                        />
                        <span className=" -mt-2 inline-flex items-center gap-0.5 rounded-full bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200">
                          <Lock className="size-2.5" /> #{plot.plotIndex + 1}
                        </span>
                      </div>
                    )}

                    {/* Unlocked Empty Plot (+) */}
                    {!isLocked && !occupant && (
                      <div
                        className={cx(
                          'flex size-7 items-center justify-center rounded-full border text-xs font-bold shadow-md transition group-hover:scale-115 sm:size-8',
                          isMoveTarget
                            ? 'border-emerald-300 bg-emerald-500 text-white'
                            : 'border-amber-200/70 bg-amber-900/65 text-amber-100 hover:bg-emerald-600'
                        )}
                      >
                        <Plus className="size-4" />
                      </div>
                    )}

                    {/* Live 8-Stage Vietnamese Tree Sprite on Plot */}
                    {occupant && occStatus && (
                      <div className="relative flex flex-col items-center">
                        <img
                          src={occStatus.stageSprite}
                          alt={occStatus.species.name[lang] || occStatus.species.name.vi}
                          draggable={false}
                          style={{ animationDelay: `${(plot.plotIndex % 5) * 0.45}s` }}
                          className={cx(
                            'animate-tree-sway w-[8.5vw] min-w-[54px] max-w-[106px] -translate-y-[38%] object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.52)] transition group-hover:scale-105',
                            isSelected && 'drop-shadow-[0_0_16px_rgba(253,224,71,0.85)]'
                          )}
                        />

                        {/* Glowing Floating 3D Mystery Fruit Above Crown at 100% */}
                        {occStatus.canHarvestMystery && (
                          <img
                            src={occStatus.mysterySprite}
                            alt="Quả Bí Ẩn"
                            className="animate-coin-sparkle pointer-events-none absolute -top-[72%] left-1/2 size-7 -translate-x-1/2 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.95)] sm:size-9"
                          />
                        )}

                        {/* Watering Can Pour + Floating Reward Amount FX */}
                        {isBeingWatered && (
                          <div key={wateringBurst.ts} className="pointer-events-none absolute -top-[85%] left-1/2 z-40">
                            <img
                              src="/assets/garden/props/watering_can.png"
                              alt=""
                              className="animate-water-pour size-10 object-contain drop-shadow-lg sm:size-12"
                            />
                            <span className="animate-float-up absolute left-1/2 top-0 whitespace-nowrap rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-lg">
                              +{compact(wateringBurst.amount, lang)} {wateringBurst.isOver ? '⚡' : '💧'}
                            </span>
                          </div>
                        )}

                        {/* Miu Vang 3D Guard Standing Next to Selected Tree */}
                        {isSelected && (
                          <div className="pointer-events-none absolute -right-5 -top-3 z-30 sm:-right-7">
                            <LuckyCatMascot
                              mood={occStatus.canHarvestMystery ? 'celebrate' : 'gardener'}
                              size="sm"
                            />
                          </div>
                        )}

                        {/* Compact Name & Progress Pill Under Trunk */}
                        <span
                          className={cx(
                            '-mt-[34%] inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9px] font-bold shadow sm:text-[10px]',
                            isSelected
                              ? 'border-amber-200 bg-amber-400 text-zinc-950'
                              : 'border-white/25 bg-black/80 text-white'
                          )}
                        >
                          <span>{occStatus.species.emoji}</span>
                          <span>{occStatus.rawProgressPct}%</span>
                          {occStatus.growthMultiplier > 1 && <span className="text-amber-300">⚡</span>}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Selected-Plot Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/65 px-4 py-2.5 text-xs backdrop-blur-md">
          {selectedTree && selectedStatus ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base">{selectedStatus.species.emoji}</span>
                <span className="font-semibold text-white">{selectedTree.title}</span>
                <Badge tone="brand">
                  {tx(`Chu kỳ ${selectedStatus.stage.index}/8`, `Stage ${selectedStatus.stage.index}/8`, `段階 ${selectedStatus.stage.index}/8`)}
                </Badge>
                <Badge tone="success">{selectedStatus.rawProgressPct}%</Badge>
                {selectedStatus.growthMultiplier > 1 && (
                  <Badge tone="warning">⚡ {selectedStatus.growthMultiplier}x</Badge>
                )}
                <span className="hidden text-zinc-300 sm:inline">
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
                    ? tx('Chọn ô mới...', 'Tap empty plot...', '移動先を選択...')
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
                  'Tap any (+) plot on the Sky Island to plant your first seed!',
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

      {/* House Evolution & Core Plan Landmarks Progression Modal */}
      <Modal
        open={houseModalOpen}
        onClose={() => setHouseModalOpen(false)}
        title={tx(
          '🏡 Xây Nhà & Mở Rộng Đảo Mây (Liên kết Kế Hoạch Core)',
          '🏡 Build Home & Expand Sky Island (Linked to Core Plan)',
          '🏡 住まいの建築＆天空島拡張（ライフプラン連動）'
        )}
        className="max-w-2xl"
      >
        <div className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
          {/* Personal Garden Name */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              {tx('Đặt tên Khu Vườn Cá Nhân của bạn', 'Name Your Personal Sky Island', 'あなただけの庭園名')}
            </label>
            <input
              type="text"
              maxLength={40}
              value={config.gardenName}
              onChange={(e) => updateConfig({ gardenName: e.target.value })}
              placeholder={tx('VD: Đảo Mây Nhà Mình ✨', 'e.g. Our Sky Sanctuary ✨', '例：わが家の天空ガーデン ✨')}
              className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white"
            />
          </div>

          {/* House Evolution Levels (Lv.1 -> Lv.5) */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-white">
                {tx('1. Nâng Cấp Ngôi Nhà Tài Sản (5 Cấp · Mở 6 → 12 Ô Đất)', '1. Evolving Wealth Home (5 Levels · 6 → 12 Plots)', '1. 住まいの進化（全5段階・6〜12区画）')}
              </span>
              <span className="text-zinc-400">
                {tx('Vốn ghi nhận:', 'Tracked Capital:', '把握資産:')}{' '}
                <strong className="text-emerald-300 tabular-nums">{compact(coreProgression.totalCoreWealthVnd, lang)}</strong>
              </span>
            </div>

            <div className="grid gap-2.5">
              {HOUSE_LEVELS.map((lv) => {
                const earned = coreProgression.earnedHouseLevel >= lv.level;
                const built = (config.builtHouseLevel || 1) >= lv.level;
                const canBuildNow = earned && !built;
                return (
                  <div
                    key={lv.level}
                    className={cx(
                      'flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center',
                      built
                        ? 'border-emerald-400/40 bg-emerald-500/[0.08]'
                        : canBuildNow
                          ? 'border-amber-400/60 bg-amber-500/[0.10]'
                          : 'border-white/[0.08] bg-white/[0.02] opacity-85'
                    )}
                  >
                    <img
                      src={lv.sprite}
                      alt={lv.name[lang] || lv.name.vi}
                      className="size-16 shrink-0 rounded-xl bg-black/25 object-contain p-1 ring-1 ring-white/10"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={lv.badgeTone}>Lv.{lv.level}</Badge>
                        <span className="text-xs font-semibold text-white">{lv.name[lang] || lv.name.vi}</span>
                        <Badge tone="neutral">{lv.unlockedPlots} {tx('ô đất', 'plots', '区画')}</Badge>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-400">{lv.requirement[lang] || lv.requirement.vi}</p>
                    </div>
                    <div className="shrink-0">
                      {built ? (
                        <Badge tone="success">
                          <CheckCircle2 className="size-3" /> {tx('Đã xây dựng', 'Built', '建築済')}
                        </Badge>
                      ) : canBuildNow ? (
                        <Button type="button" size="sm" variant="primary" onClick={() => handleBuildNextHouse(lv.level)}>
                          🔨 {tx(`Xây Lv.${lv.level}`, `Build Lv.${lv.level}`, `Lv.${lv.level}を建てる`)}
                        </Button>
                      ) : (
                        <Button as="a" href={href('plan')} size="sm" variant="secondary">
                          {tx('Tới /plan', 'Open /plan', '/planへ')} <ArrowRight className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Core Pillar Landmarks */}
          <div className="space-y-2.5 border-t border-white/[0.08] pt-4">
            <div className="text-xs font-semibold text-white">
              {tx('2. Công Trình Vườn Theo Trụ Cột Tài Chính Core', '2. Garden Landmarks Linked to Core Wealth Pillars', '2. コア資産機能と連動する島の名所')}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {coreProgression.landmarks.map((lm) => (
                <a
                  key={lm.id}
                  href={href(lm.route)}
                  onClick={() => setHouseModalOpen(false)}
                  className={cx(
                    'flex items-center gap-3 rounded-xl border p-3 text-xs transition hover:bg-white/[0.05]',
                    lm.unlocked
                      ? 'border-emerald-400/35 bg-emerald-500/[0.07]'
                      : 'border-white/[0.08] bg-white/[0.02]'
                  )}
                >
                  <img src={lm.sprite} alt="" className="size-11 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 font-semibold text-white">
                      <span className="truncate">{lm.name[lang] || lm.name.vi}</span>
                      {lm.unlocked ? (
                        <Badge tone="success">✓</Badge>
                      ) : (
                        <Lock className="size-3 shrink-0 text-zinc-500" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-400">
                      {lm.conditionText[lang] || lm.conditionText.vi}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <LuckyCatFortuneModal open={fortuneOpen} onClose={() => setFortuneOpen(false)} />
    </Card>
  );
}
