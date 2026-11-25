import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Droplets,
  Eye,
  Gift,
  Plus,
  ShieldCheck,
  Sprout,
  Trash2,
  Trees,
  Zap,
} from 'lucide-react';
import { AdaptiveGrid } from './AdaptiveLayout.jsx';
import { IsometricSkyIsland } from './IsometricSkyIsland.jsx';
import { LuckyCatMascot } from './LuckyCatMascot.jsx';
import { Badge, Button, Card, CardHeader, Chip, Modal, Progress, cx } from './ui.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, useRates, useToast } from '../state.jsx';
import {
  TREE_GROWTH_STAGES,
  VIETNAM_WEALTH_TREES,
  computeTreeStatus,
  getMysteryFruitSprite,
  getTreeSpeciesById,
  getTreeStageSprite,
  recommendTreeSpecies,
} from '../data/wealthTreesData.js';
import {
  loadActivePassbooks,
  loadSavedPlannerState,
  loadWealthTrees,
  saveWealthTrees,
} from '../utils/apiClient.js';
import { compact, vnd } from '../utils/format.js';

/**
 * Reusable pure SVG renderer supporting all 8 botanical architectures of the 14 Vietnamese species.
 */
function VietnameseTreeSvg({ status, previewFull = false, previewStageIndex = null, onClickMystery }) {
  const { species, stage, acceleratedProgressPct, canHarvestMystery } = status;
  const v = species.visual;
  const displayStageIndex = previewFull
    ? 8
    : previewStageIndex
      ? Math.max(1, Math.min(8, previewStageIndex))
      : stage.index;
  const displayStageMeta = TREE_GROWTH_STAGES[displayStageIndex - 1] || stage;
  const pct = previewFull ? 100 : previewStageIndex ? displayStageMeta.minPct : acceleratedProgressPct;
  const spriteUrl = getTreeStageSprite(species.id, displayStageIndex);
  const showMysteryGlow = canHarvestMystery || displayStageIndex === 8;

  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-sky-950/35 via-canvas/70 to-emerald-950/35 p-5">
      <div
        className="pointer-events-none absolute top-10 size-44 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          background: v.glowColor,
          opacity: pct >= 50 ? 0.55 : 0.25,
        }}
      />

      <div className="relative z-10 flex h-56 w-full max-w-[260px] items-center justify-center">
        <img
          src={spriteUrl}
          alt={`${species.name[status.lang || 'vi'] || species.name.vi} - ${displayStageMeta.label[status.lang || 'vi']}`}
          draggable={false}
          className="animate-tree-sway max-h-52 w-auto object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.48)]"
        />

        {showMysteryGlow && (
          <button
            type="button"
            onClick={onClickMystery}
            className="animate-coin-sparkle absolute -top-1 right-4 cursor-pointer rounded-full bg-amber-500/20 p-1.5 ring-2 ring-amber-300/60 shadow-[0_0_24px_rgba(251,191,36,0.65)] transition hover:scale-110"
            title={status.mysteryFruit.name[status.lang || 'vi'] || status.mysteryFruit.name.vi}
          >
            <img
              src={status.mysterySprite}
              alt={status.mysteryFruit.name.vi}
              className="size-10 object-contain"
            />
          </button>
        )}
      </div>

      <div className="relative z-10 mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
        <Badge tone={displayStageIndex >= 8 ? 'success' : 'brand'}>
          {species.emoji} {displayStageIndex}/8 · {displayStageMeta.label[status.lang || 'vi'] || displayStageMeta.label.vi}
        </Badge>
        {status.growthMultiplier > 1 && (
          <Badge tone="warning">
            <Zap className="size-3" /> {status.growthMultiplier}x
          </Badge>
        )}
      </div>

      <div
        className="pointer-events-none absolute bottom-10 right-3 z-20 flex flex-col items-center sm:right-4"
        title="Mèo Chiêu Tài Miu Vàng đang chăm cây"
      >
        <LuckyCatMascot
          mood={canHarvestMystery || displayStageIndex === 8 ? 'celebrate' : 'gardener'}
          size="sm"
        />
      </div>
    </div>
  );
}

export function WealthTreeGarden({ compact: isCompactWidget = false }) {
  const { lang, tx } = useI18n();
  const { banks } = useRates();
  const notify = useToast();
  const inspectorRef = useRef(null);

  const [trees, setTrees] = useState(loadWealthTrees);
  const [selectedId, setSelectedId] = useState(() => loadWealthTrees()[0]?.id || '');
  const [previewFull, setPreviewFull] = useState(false);
  const [previewStageIndex, setPreviewStageIndex] = useState(null);
  const [wateringBurst, setWateringBurst] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [targetPlotIndex, setTargetPlotIndex] = useState(null);
  const [almanacOpen, setAlmanacOpen] = useState(false);
  const [mysteryModalTree, setMysteryModalTree] = useState(null);

  // New tree form state
  const plan = useMemo(() => loadSavedPlannerState() || {}, []);
  const defaultYears = plan.targetYears || 4;
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState(() => Number(plan.targetAmount) || 500_000_000);
  const [newInitial, setNewInitial] = useState(() => Number(plan.capital) || 50_000_000);
  const [newMonthly, setNewMonthly] = useState(() => Number(plan.saving) || 10_000_000);
  const [newYears, setNewYears] = useState(defaultYears);
  const [newSpeciesId, setNewSpeciesId] = useState(() => recommendTreeSpecies(defaultYears).id);

  // Check-in deposit verification form
  const [depositAmount, setDepositAmount] = useState(() => Number(plan.saving) || 10_000_000);
  const [depositBankId, setDepositBankId] = useState(() => plan.bankId || 'cake');
  const [depositProof, setDepositProof] = useState('');

  const persistTrees = (nextList, focusId = null) => {
    saveWealthTrees(nextList);
    const clean = loadWealthTrees();
    setTrees(clean);
    if (focusId) setSelectedId(focusId);
    else if (clean.length > 0 && !clean.some((t) => t.id === selectedId)) {
      setSelectedId(clean[0].id);
    }
  };

  const activeTree = useMemo(
    () => trees.find((t) => t.id === selectedId) || trees[0] || null,
    [trees, selectedId]
  );

  const activeStatus = useMemo(
    () => (activeTree ? { ...computeTreeStatus(activeTree), lang } : null),
    [activeTree, lang]
  );

  const handleSelectTreeFromScene = (tree) => {
    setSelectedId(tree.id);
    setDepositAmount(tree.monthlyPlanned);
    if (inspectorRef.current) {
      inspectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handlePlantAtPlot = (plotIdx) => {
    setTargetPlotIndex(plotIdx);
    setShowNewForm(true);
  };

  const handleMoveTreeToPlot = (treeId, destPlotIdx) => {
    const next = trees.map((t) =>
      t.id === treeId ? { ...t, plotIndex: destPlotIdx } : t
    );
    persistTrees(next, treeId);
  };

  const handlePlantFromPlanner = () => {
    const p = loadSavedPlannerState() || {};
    const targetCap = Number(p.targetAmount) || (Number(p.target) ? Number(p.target) * 200 : 500_000_000);
    const initCap = Number(p.capital) || 50_000_000;
    const monthly = Number(p.saving) || 10_000_000;
    const yrs = Math.max(0.5, Number(p.targetYears) || Math.round(Math.max(1, (targetCap - initCap) / Math.max(1, monthly * 12))));
    const recSpecies = recommendTreeSpecies(yrs);
    const treeId = `tree_${Date.now().toString(36)}`;
    const newTree = {
      id: treeId,
      title:
        p.goalType === 'TARGET_AMOUNT'
          ? tx(`Kế hoạch ${compact(targetCap, 'vi')}`, `Target ${compact(targetCap, 'en')}`, `目標 ${compact(targetCap, 'ja')}`)
          : tx('Cây Tự do Tài chính (/plan)', 'Passive Income Tree (/plan)', '不労所得ツリー (/plan)'),
      speciesId: recSpecies.id,
      householdMode: p.householdMode || 'INDIVIDUAL',
      targetCapital: targetCap,
      initialCapital: initCap,
      monthlyPlanned: monthly,
      expectedYears: yrs,
      createdAt: new Date().toISOString().slice(0, 10),
      mysteryUnlocked: initCap >= targetCap,
      mysteryFruitId: recSpecies.mysteryFruitId,
      isDummy: false,
      checkIns: [],
    };
    persistTrees([newTree, ...trees], treeId);
    setDepositAmount(monthly);
    notify(
      tx(
        `Đã gieo hạt giống ${recSpecies.name.vi} vào Khu Vườn Ảo!`,
        `Planted a ${recSpecies.name.en} seed into your Virtual Orchard!`,
        `${recSpecies.name.ja}の種をバーチャル園に植えました！`
      )
    );
  };

  const handleSeedDemoOrchard = () => {
    const dToday = new Date().toISOString().slice(0, 10);
    const ts = Date.now().toString(36);
    const demo1Id = `tree_demo_${ts}_1`;
    const demo2Id = `tree_demo_${ts}_2`;
    const demo3Id = `tree_demo_${ts}_3`;
    const demo4Id = `tree_demo_${ts}_4`;
    const demos = [
      {
        id: demo1Id,
        title: tx('[Bot Mẫu] Sen Hồng Đệm Dự Phòng (100%)', '[Bot Dummy] Lotus Reserve (100%)', '[Bot見本] ドンタップ蓮防衛資金'),
        speciesId: 'sen_dong_thap',
        householdMode: 'INDIVIDUAL',
        targetCapital: 100_000_000,
        initialCapital: 60_000_000,
        monthlyPlanned: 10_000_000,
        expectedYears: 0.5,
        createdAt: dToday,
        mysteryUnlocked: false,
        mysteryFruitId: 'fruit_lien_hoa_ngoc',
        isDummy: true,
        checkIns: [
          { id: 'chk_s1', amount: 20_000_000, date: dToday, bankId: 'timo', proofCode: 'BOT-SEN-01', verified: true, isOverTarget: true },
          { id: 'chk_s2', amount: 22_000_000, date: dToday, bankId: 'cake', proofCode: 'BOT-SEN-02', verified: true, isOverTarget: true },
        ],
      },
      {
        id: demo2Id,
        title: tx('[Bot Mẫu] Dừa Xiêm Mua Xe Gia Đình', '[Bot Dummy] Coconut Car Fund', '[Bot見本] ココナッツマイカー資金'),
        speciesId: 'dua_xiem_ben_tre',
        householdMode: 'COUPLE',
        targetCapital: 450_000_000,
        initialCapital: 160_000_000,
        monthlyPlanned: 12_000_000,
        expectedYears: 2.5,
        createdAt: dToday,
        mysteryUnlocked: false,
        mysteryFruitId: 'fruit_dua_ngoc_bich',
        isDummy: true,
        checkIns: [
          { id: 'chk_d1', amount: 18_000_000, date: dToday, bankId: 'cake', proofCode: 'BOT-DUA-01', verified: true, isOverTarget: true },
          { id: 'chk_d2', amount: 15_000_000, date: dToday, bankId: 'liobank', proofCode: 'BOT-DUA-02', verified: true, isOverTarget: true },
        ],
      },
      {
        id: demo3Id,
        title: tx('[Bot Mẫu] Vải Thiều & Xoài Quỹ Nhà (Vượt tốc)', '[Bot Dummy] Lychee Home Down Payment', '[Bot見本] ライチ住宅頭金プラン'),
        speciesId: 'vai_thieu_luc_ngan',
        householdMode: 'FAMILY',
        targetCapital: 700_000_000,
        initialCapital: 440_000_000,
        monthlyPlanned: 15_000_000,
        expectedYears: 4,
        createdAt: dToday,
        mysteryUnlocked: false,
        mysteryFruitId: 'fruit_vai_rong_do',
        isDummy: true,
        checkIns: [
          { id: 'chk_v1', amount: 24_000_000, date: dToday, bankId: 'tnex', proofCode: 'BOT-VAI-01', verified: true, isOverTarget: true },
          { id: 'chk_v2', amount: 22_000_000, date: dToday, bankId: 'cake', proofCode: 'BOT-VAI-02', verified: true, isOverTarget: true },
        ],
      },
      {
        id: demo4Id,
        title: tx('[Bot Mẫu] Tre Ngà Coast FIRE 12 Năm', '[Bot Dummy] Ivory Bamboo Coast FIRE', '[Bot見本] 黄金竹Coast FIRE'),
        speciesId: 'tre_nga_thanh_giong',
        householdMode: 'INDIVIDUAL',
        targetCapital: 2_500_000_000,
        initialCapital: 550_000_000,
        monthlyPlanned: 18_000_000,
        expectedYears: 12,
        createdAt: dToday,
        mysteryUnlocked: false,
        mysteryFruitId: 'fruit_mang_vang_phu_dong',
        isDummy: true,
        checkIns: [
          { id: 'chk_t1', amount: 25_000_000, date: dToday, bankId: 'timo', proofCode: 'BOT-TRE-01', verified: true, isOverTarget: true },
        ],
      },
    ];
    persistTrees([...demos, ...trees], demo1Id);
    notify(tx('Đã dựng Khu Vườn Mẫu 4 cây (Sen Đồng Tháp 100%, Dừa Xiêm, Vải Thiều & Tre Ngà)!', 'Seeded 4 Bot Demo Trees across your Virtual Orchard!', '4本のBot見本ツリーをバーチャル果樹園に生成しました！'));
  };

  const handleCreateCustomTree = (e) => {
    e.preventDefault();
    const spec = getTreeSpeciesById(newSpeciesId);
    const treeId = `tree_${Date.now().toString(36)}`;
    const usedPlots = new Set(trees.map((t) => Number(t.plotIndex)).filter((n) => Number.isInteger(n)));
    let assignedPlot = Number.isInteger(targetPlotIndex) ? targetPlotIndex : 0;
    if (usedPlots.has(assignedPlot)) {
      for (let i = 0; i < 12; i++) {
        if (!usedPlots.has(i)) {
          assignedPlot = i;
          break;
        }
      }
    }
    const newTree = {
      id: treeId,
      title: newTitle.trim() || `${spec.name[lang] || spec.name.vi}`,
      speciesId: spec.id,
      householdMode: plan.householdMode || 'INDIVIDUAL',
      targetCapital: Math.max(1_000_000, Number(newTarget) || 500_000_000),
      initialCapital: Math.max(0, Number(newInitial) || 0),
      monthlyPlanned: Math.max(100_000, Number(newMonthly) || 10_000_000),
      expectedYears: Math.max(0.25, Number(newYears) || spec.idealYears),
      createdAt: new Date().toISOString().slice(0, 10),
      mysteryUnlocked: false,
      mysteryFruitId: spec.mysteryFruitId,
      isDummy: false,
      plotIndex: assignedPlot,
      checkIns: [],
    };
    persistTrees([newTree, ...trees], treeId);
    setNewTitle('');
    setTargetPlotIndex(null);
    setShowNewForm(false);
    setDepositAmount(newTree.monthlyPlanned);
    notify(tx(`Đã gieo hạt giống ${spec.name[lang] || spec.name.vi} lên ô đất #${assignedPlot + 1}!`, `Planted ${spec.name.en} on plot #${assignedPlot + 1}!`, `${spec.name.ja}を区画 #${assignedPlot + 1} に植えました！`));
  };

  const handleQuickPlantSpecies = (sp) => {
    const treeId = `tree_${Date.now().toString(36)}`;
    const newTree = {
      id: treeId,
      title: sp.name[lang] || sp.name.vi,
      speciesId: sp.id,
      householdMode: plan.householdMode || 'INDIVIDUAL',
      targetCapital: Math.max(50_000_000, Number(plan.targetAmount) || 300_000_000),
      initialCapital: Math.max(0, Number(plan.capital) || 30_000_000),
      monthlyPlanned: Math.max(500_000, Number(plan.saving) || 10_000_000),
      expectedYears: sp.idealYears,
      createdAt: new Date().toISOString().slice(0, 10),
      mysteryUnlocked: false,
      mysteryFruitId: sp.mysteryFruitId,
      isDummy: false,
      checkIns: [],
    };
    persistTrees([newTree, ...trees], treeId);
    setAlmanacOpen(false);
    notify(tx(`🌱 Đã trồng thêm ${sp.name.vi} vào khu vườn ảo!`, `🌱 Planted ${sp.name.en} into your Virtual Orchard!`, `🌱 ${sp.name.ja}をバーチャル果樹園に植えました！`));
  };

  const handleChangeSpecies = (speciesId) => {
    if (!activeTree) return;
    const spec = getTreeSpeciesById(speciesId);
    const next = trees.map((t) =>
      t.id === activeTree.id ? { ...t, speciesId: spec.id, mysteryFruitId: spec.mysteryFruitId } : t
    );
    persistTrees(next, activeTree.id);
    notify(tx(`Đã đổi giống cây sang ${spec.name[lang] || spec.name.vi}`, `Switched tree species to ${spec.name.en}`, `${spec.name.ja}に変更しました`));
  };

  const handleVerifyDeposit = (e) => {
    e.preventDefault();
    if (!activeTree) return;
    const amt = Math.max(50_000, Number(depositAmount) || 0);
    const isOver = amt > activeTree.monthlyPlanned;
    const cleanProof =
      depositProof.trim() || `${depositBankId.toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const checkIn = {
      id: `chk_${Date.now().toString(36)}`,
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      bankId: depositBankId,
      proofCode: cleanProof,
      verified: true,
      isOverTarget: isOver,
    };
    const next = trees.map((t) =>
      t.id === activeTree.id ? { ...t, checkIns: [checkIn, ...(t.checkIns || [])] } : t
    );
    persistTrees(next, activeTree.id);
    setDepositProof('');
    setPreviewStageIndex(null);

    const burstTs = Date.now();
    setWateringBurst({ treeId: activeTree.id, amount: amt, isOver, ts: burstTs });
    window.setTimeout(() => {
      setWateringBurst((prev) => (prev?.ts === burstTs ? null : prev));
    }, 2000);

    if (isOver) {
      const extraPct = Math.round(((amt - activeTree.monthlyPlanned) / Math.max(1, activeTree.monthlyPlanned)) * 100);
      notify(
        tx(
          `🚀 Xác thực thành công +${vnd(amt, lang)} (vượt +${extraPct}% kế hoạch)! Cây đang tăng tốc phát triển!`,
          `🚀 Verified +${vnd(amt, lang)} (+${extraPct}% over plan)! Your tree just received a growth boost!`,
          `🚀 +${vnd(amt, lang)} を認証（計画比+${extraPct}%）！成長スピードが加速しました！`
        )
      );
    } else {
      notify(
        tx(
          `💧 Đã tưới cây với ${vnd(amt, lang)} (Xác thực: ${cleanProof})`,
          `💧 Watered tree with ${vnd(amt, lang)} (Ref: ${cleanProof})`,
          `💧 ${vnd(amt, lang)} で水やりを認証しました`
        )
      );
    }
  };

  const handleSyncFromPassbooks = () => {
    if (!activeTree) return;
    const pbs = loadActivePassbooks().filter((p) => !String(p.id).startsWith('pb_ef_') && !String(p.id).startsWith('pb_goal_'));
    if (pbs.length === 0) {
      notify(tx('Chưa có sổ tiết kiệm thật trong Kệ Sổ Thực Tế để đối chiếu.', 'No real passbooks found in your tracker to sync yet.', '同期できる保有定期預金がまだありません。'));
      return;
    }
    const existingRefs = new Set((activeTree.checkIns || []).map((c) => c.proofCode));
    const additions = pbs
      .filter((pb) => !existingRefs.has(`PB:${pb.id}`))
      .map((pb) => ({
        id: `chk_pb_${pb.id}`,
        amount: pb.principal,
        date: pb.openDate || new Date().toISOString().slice(0, 10),
        bankId: pb.bankId,
        proofCode: `PB:${pb.id}`,
        verified: true,
        isOverTarget: pb.principal > activeTree.monthlyPlanned,
      }));
    if (additions.length === 0) {
      notify(tx('Tất cả sổ thật trong Kệ Sổ đã được xác thực vào cây này rồi!', 'All real passbooks are already synced into this tree!', 'すべての保有預金は既に認証済みです！'));
      return;
    }
    const next = trees.map((t) =>
      t.id === activeTree.id ? { ...t, checkIns: [...additions, ...(t.checkIns || [])] } : t
    );
    persistTrees(next, activeTree.id);
    notify(tx(`Đã đối chiếu & xác thực ${additions.length} sổ tiết kiệm thật vào cây!`, `Verified ${additions.length} real passbooks into your tree!`, `${additions.length}件の実定期預金を認証しました！`));
  };

  const handleUnlockMystery = () => {
    if (!activeTree || !activeStatus?.canHarvestMystery) return;
    const next = trees.map((t) =>
      t.id === activeTree.id ? { ...t, mysteryUnlocked: true } : t
    );
    persistTrees(next, activeTree.id);
    setMysteryModalTree({ ...activeTree, status: activeStatus });
  };

  const handleDeleteTree = (id) => {
    persistTrees(trees.filter((t) => t.id !== id));
    notify(tx('Đã nhổ cây khỏi khu vườn ảo', 'Removed plan tree', 'ツリーを削除しました'));
  };

  if (isCompactWidget) {
    return (
      <Card className="border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] via-surface to-indigo-500/[0.04] p-5 space-y-4">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Trees className="size-4 text-emerald-300" />
              {tx('Khu Vườn Ảo 14 Giống Cây Việt Nam', 'Virtual Wealth Orchard (14 Trees)', 'バーチャル資産果樹園（14樹種）')}
            </span>
          }
          description={tx(
            `Đang trồng ${trees.length} cây kế hoạch · Vào khu vườn ảo 3 thời tiết để ngắm cây & mở Quả Bí Ẩn.`,
            `Growing ${trees.length} plan trees · Enter your 3-weather Virtual Orchard & unlock 14 Mystery Fruits.`,
            `${trees.length}本の木を育成中 · 仮想庭園へ入って木々の成長や神秘の実を楽しめます。`
          )}
          right={
            <Button as="a" href={href('garden')} size="sm" variant="primary">
              <Sprout className="size-3.5" />
              {tx('Vào Khu Vườn Ảo', 'Enter Virtual Orchard', 'バーチャル園に入る')}
            </Button>
          }
        />
        {trees.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 p-4 text-xs text-zinc-400">
            <span>{tx('Bạn chưa gieo cây nào. Hãy gieo hạt từ kế hoạch hiện tại!', 'No plan trees planted yet — sow your first seed!', 'まだ種を植えていません。現在のプランから種を植えましょう！')}</span>
            <Button type="button" size="sm" variant="secondary" onClick={handlePlantFromPlanner}>
              🌱 {tx('Gieo hạt ngay', 'Plant Seed Now', '今すぐ種を植える')}
            </Button>
          </div>
        ) : (
          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 3 }}>
            {trees.slice(0, 3).map((t) => {
              const st = computeTreeStatus(t);
              return (
                <a
                  key={t.id}
                  href={href('garden')}
                  className="card-interactive rounded-xl border border-white/[0.07] bg-canvas/60 p-3.5 space-y-2 hover:border-emerald-400/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-white">
                      {st.species.emoji} {t.title}
                    </span>
                    {t.mysteryUnlocked ? (
                      <Badge tone="warning">{st.mysteryFruit.emoji} {tx('Đã nở Quả Bí Ẩn', 'Mystery Unlocked', '収穫済')}</Badge>
                    ) : st.canHarvestMystery ? (
                      <Badge tone="success">✨ {tx('Mở Quả Bí Ẩn!', 'Harvest Ready!', '収穫可能!')}</Badge>
                    ) : (
                      <Badge tone="brand">{st.rawProgressPct}%</Badge>
                    )}
                  </div>
                  <Progress value={st.acceleratedProgressPct} tone="emerald" />
                  <div className="flex justify-between text-[11px] text-zinc-400 tabular-nums">
                    <span>{st.species.name[lang] || st.species.name.vi}</span>
                    <span>{st.growthMultiplier}x</span>
                  </div>
                </a>
              );
            })}
          </AdaptiveGrid>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal 2.5D Isometric Sky Island (like Khu Vườn Trên Mây) */}
      <IsometricSkyIsland
        trees={trees}
        selectedId={activeTree?.id || ''}
        wateringBurst={wateringBurst}
        onSelectTree={(tree) => {
          setPreviewStageIndex(null);
          handleSelectTreeFromScene(tree);
        }}
        onPlantAtPlot={handlePlantAtPlot}
        onMoveTreeToPlot={handleMoveTreeToPlot}
        onWaterSelected={handleSelectTreeFromScene}
        onHarvestSelected={(tree) => {
          const st = { ...computeTreeStatus(tree), lang };
          if (st.canHarvestMystery) {
            const next = trees.map((t) => (t.id === tree.id ? { ...t, mysteryUnlocked: true } : t));
            persistTrees(next, tree.id);
            setMysteryModalTree({ ...tree, status: st });
          }
        }}
        onOpenAlmanac={() => setAlmanacOpen(true)}
        onSeedDemo={handleSeedDemoOrchard}
      />

      {/* Orchard Action Bar & Custom Planting Form */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              {tx(`Quản lý & Tưới Cây Trong Vườn (${trees.length} Cây Kế Hoạch)`, `Manage & Water Orchard (${trees.length} Plans)`, `果樹園管理・水やり（${trees.length}プラン）`)}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {tx(
                'Chọn 14 giống cây Việt Nam từ 3 tháng tới 40 năm. Bấm vào từng cây trên bãi cỏ bên trên hoặc bên dưới để tưới cây và mở Quả Bí Ẩn.',
                'Choose among 14 Vietnamese trees (3 months to 40 years). Click any tree in the panorama above to water it or unbox Mystery Fruits.',
                '3ヶ月〜40年の目標に合う14種のベトナム樹種から選択可能。上の果樹園から木を選んで水やりや収穫を行えます。'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="primary" onClick={handlePlantFromPlanner}>
              <Sprout className="size-3.5" />
              {tx('Gieo hạt từ /plan', 'Sow From /plan', '/planから植える')}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewForm((v) => !v)}>
              <Plus className="size-3.5" />
              {tx('Tự tạo cây mới', 'Plant Custom Tree', '新規ツリー作成')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleSeedDemoOrchard}>
              🤖 {tx('Dựng Vườn Mẫu Bot (4 cây)', 'Seed 4-Tree Bot Demo', '4本Bot見本を生成')}
            </Button>
          </div>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreateCustomTree} className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.04] p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Tên cây / Mục tiêu', 'Plan Tree Title', 'プラン名')}</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  placeholder={tx('VD: Cây Mua Nhà 2030', 'e.g. Home Goal 2030', '例：住宅取得プラン')}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Vốn mục tiêu (₫)', 'Target Capital (₫)', '目標元本 (₫)')}</label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(Number(e.target.value))}
                  min={1_000_000}
                  step={10_000_000}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white tabular-nums"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Số năm dự kiến', 'Expected Years', '想定年数')}</label>
                <input
                  type="number"
                  value={newYears}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setNewYears(y);
                    setNewSpeciesId(recommendTreeSpecies(y).id);
                  }}
                  min={0.25}
                  max={40}
                  step={0.25}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white tabular-nums"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Vốn ban đầu (₫)', 'Initial Capital (₫)', '初期元本 (₫)')}</label>
                <input
                  type="number"
                  value={newInitial}
                  onChange={(e) => setNewInitial(Number(e.target.value))}
                  min={0}
                  step={5_000_000}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white tabular-nums"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Mức đóng hàng tháng (₫)', 'Planned Monthly Deposit (₫)', '毎月目標積立額 (₫)')}</label>
                <input
                  type="number"
                  value={newMonthly}
                  onChange={(e) => setNewMonthly(Number(e.target.value))}
                  min={100_000}
                  step={1_000_000}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white tabular-nums"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Chọn giống cây Việt Nam (14 loại)', 'Vietnamese Tree Species (14)', 'ベトナム樹木品種（全14種）')}</label>
                <select
                  value={newSpeciesId}
                  onChange={(e) => setNewSpeciesId(e.target.value)}
                  className="select h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                >
                  {VIETNAM_WEALTH_TREES.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.emoji} {sp.name[lang] || sp.name.vi} ({sp.horizonBadge[lang] || sp.horizonBadge.vi})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewForm(false)}>
                {tx('Huỷ', 'Cancel', 'キャンセル')}
              </Button>
              <Button type="submit" size="sm" variant="primary">
                🌱 {tx('Gieo hạt giống này', 'Plant Seed', 'この種を植える')}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {activeTree && activeStatus && (
        <div ref={inspectorRef} className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
          {/* LEFT: Selected Tree Live Canvas & 14-Species Picker */}
          <Card className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">{activeStatus.species.horizonBadge[lang] || activeStatus.species.horizonBadge.vi}</Badge>
                  {activeTree.isDummy && (
                    <Badge tone="neutral">🤖 {tx('Bot tạo · Cây mẫu tham khảo', 'Bot Dummy Reference Tree', 'Bot参考ダミー')}</Badge>
                  )}
                  {activeStatus.growthMultiplier > 1 && (
                    <Badge tone="warning">
                      <Zap className="size-3" /> {tx(`Tăng tốc ${activeStatus.growthMultiplier}x`, `Boosted ${activeStatus.growthMultiplier}x`, `${activeStatus.growthMultiplier}倍加速`)}
                    </Badge>
                  )}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">{activeTree.title}</h3>
                <p className="text-xs text-zinc-400">
                  {activeStatus.species.name[lang] || activeStatus.species.name.vi} · {activeStatus.species.region[lang] || activeStatus.species.region.vi}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={previewFull ? 'primary' : 'secondary'}
                  onClick={() => setPreviewFull((v) => !v)}
                >
                  <Eye className="size-3.5" />
                  {previewFull ? tx('Xem cây thật', 'Live State', '現在表示') : tx('Xem trước 100%', 'Preview 100%', '100%予想')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteTree(activeTree.id)}
                  aria-label={tx('Xoá cây', 'Delete tree', '削除')}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <VietnameseTreeSvg
              status={activeStatus}
              previewFull={previewFull}
              previewStageIndex={previewStageIndex}
              onClickMystery={() => activeStatus.canHarvestMystery && handleUnlockMystery()}
            />

            {/* Mystery Fruit Harvest Banner */}
            {activeStatus.canHarvestMystery ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/[0.14] to-emerald-500/[0.10] p-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <Gift className="size-4" />
                    {activeTree.mysteryUnlocked
                      ? tx('Đã thu hoạch Quả Bí Ẩn!', 'Mystery Fruit Harvested!', '神秘の実を収穫済み！')
                      : tx('Chúc mừng 100%! Quả Bí Ẩn vừa nở hoa trên ngọn cây!', '100% Milestone! A Mystery Fruit has bloomed!', '100%達成！神秘の実が実りました！')}
                  </div>
                  <p className="mt-1 text-xs text-zinc-200">
                    {activeTree.mysteryUnlocked
                      ? `${activeStatus.mysteryFruit.emoji} ${activeStatus.mysteryFruit.name[lang] || activeStatus.mysteryFruit.name.vi} — ${activeStatus.mysteryFruit.lore[lang] || activeStatus.mysteryFruit.lore.vi}`
                      : tx('Bấm nút bên cạnh hoặc chạm vào quả vàng trên cây để mở khóa Quả Bí Ẩn hiếm của giống cây này.', 'Tap below or click the glowing golden fruit on your tree to reveal your reward!', '下のボタンまたは黄金の実をタップして収穫しましょう！')}
                  </p>
                </div>
                <Button type="button" size="sm" variant="primary" onClick={handleUnlockMystery}>
                  ✨ {activeTree.mysteryUnlocked ? tx('Xem lại Quả Bí Ẩn', 'View Trophy', '実績を見る') : tx('Mở Quả Bí Ẩn', 'Open Mystery Fruit', '神秘の実を開く')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    {tx('Tiến độ thật:', 'Actual Progress:', '実達成率:')} <strong className="text-white">{activeStatus.rawProgressPct}%</strong>
                    {activeStatus.acceleratedProgressPct > activeStatus.rawProgressPct && (
                      <span className="ml-2 text-emerald-300">
                        ({tx(`Hiển thị tăng tốc ${activeStatus.acceleratedProgressPct}%`, `Boosted growth ${activeStatus.acceleratedProgressPct}%`, `加速成長 ${activeStatus.acceleratedProgressPct}%`)})
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-zinc-300">
                    {compact(activeStatus.currentCapital, lang)} / {compact(activeStatus.targetCapital, lang)}
                  </span>
                </div>
                <Progress value={activeStatus.acceleratedProgressPct} tone="emerald" />
                {activeStatus.monthsSavedByOverDeposit > 0 && (
                  <p className="text-[11px] text-amber-300">
                    🚀 {tx(
                      `Nhờ đóng vượt kế hoạch (+${vnd(activeStatus.overDepositBonusVnd, lang)}), bạn đang rút ngắn được khoảng ${activeStatus.monthsSavedByOverDeposit} tháng về đích!`,
                      `Over-depositing (+${vnd(activeStatus.overDepositBonusVnd, lang)}) is pulling your harvest ~${activeStatus.monthsSavedByOverDeposit} months closer!`,
                      `計画超過の入金 (+${vnd(activeStatus.overDepositBonusVnd, lang)}) により目標達成が約${activeStatus.monthsSavedByOverDeposit}ヶ月早まっています！`
                    )}
                  </p>
                )}
              </div>
            )}

            {/* 14 Vietnamese Species Picker */}
            <div className="space-y-2.5 border-t border-white/[0.06] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-300">
                  {tx('Chọn trong 14 giống cây Việt Nam (theo số năm kế hoạch)', 'Pick From 14 Vietnamese Tree Species', '14種のベトナム在来樹から変更')}
                </span>
                <span className="text-[11px] text-emerald-300">
                  {tx(`Gợi ý ${activeTree.expectedYears}N:`, `${activeTree.expectedYears}Y Pick:`, `推奨:`)} {recommendTreeSpecies(activeTree.expectedYears).emoji}{' '}
                  {recommendTreeSpecies(activeTree.expectedYears).name[lang] || recommendTreeSpecies(activeTree.expectedYears).name.vi}
                </span>
              </div>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {VIETNAM_WEALTH_TREES.map((sp) => {
                  const selected = sp.id === activeTree.speciesId;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => handleChangeSpecies(sp.id)}
                      className={cx(
                        'rounded-xl border p-2.5 text-left text-xs transition',
                        selected
                          ? 'border-emerald-400/50 bg-emerald-500/15 text-white'
                          : 'border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15] hover:text-zinc-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{sp.emoji}</span>
                        <span className="text-[10px] text-zinc-400">{sp.minYears}–{sp.maxYears}N</span>
                      </div>
                      <div className="mt-1 line-clamp-1 font-medium">{sp.name[lang] || sp.name.vi}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                <strong className="text-zinc-200">{tx('Thuộc tính cây:', 'Tree Traits:', '特徴:')}</strong>{' '}
                {activeStatus.species.attributes[lang]?.rhythm} · {activeStatus.species.attributes[lang]?.fitGoal}
              </p>
            </div>
          </Card>

          {/* RIGHT: Deposit Verification Check-In & History */}
          <Card className="p-5 sm:p-6 space-y-5">
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Droplets className="size-4 text-emerald-300" />
                  {tx('Tưới cây · Xác thực tiền đã đóng', 'Water Tree · Verify Deposit', '水やり · 入金認証チェックイン')}
                </span>
              }
              description={tx(
                `Mức đóng kế hoạch: ${vnd(activeTree.monthlyPlanned, lang)}/tháng. Đóng nhiều hơn giúp cây tăng tốc sinh trưởng tới 2.0x!`,
                `Planned: ${vnd(activeTree.monthlyPlanned, lang)}/mo. Over-depositing accelerates tree growth up to 2.0x!`,
                `目標積立: ${vnd(activeTree.monthlyPlanned, lang)}/月。目標以上の入金で成長スピードが最大2倍！`
              )}
              right={
                <Button type="button" size="sm" variant="secondary" onClick={handleSyncFromPassbooks}>
                  <ShieldCheck className="size-3.5 text-emerald-300" />
                  {tx('Đối chiếu Kệ Sổ', 'Sync Passbooks', '保有預金同期')}
                </Button>
              }
            />

            <form onSubmit={handleVerifyDeposit} className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label className="font-medium text-zinc-300">
                    {tx('Số tiền đã đóng thực tế (₫)', 'Actual Deposited Amount (₫)', '実際の入金額 (₫)')}
                  </label>
                  {depositAmount > activeTree.monthlyPlanned && (
                    <Badge tone="warning">
                      <Zap className="size-3" /> {tx('Vượt kế hoạch — Tăng tốc!', 'Over-Target Boost!', '超過ブースト！')}
                    </Badge>
                  )}
                </div>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  min={50_000}
                  step={500_000}
                  className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm font-semibold text-white tabular-nums outline-none focus:border-emerald-400/60"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip active={depositAmount === activeTree.monthlyPlanned} onClick={() => setDepositAmount(activeTree.monthlyPlanned)}>
                    100% ({compact(activeTree.monthlyPlanned, lang)})
                  </Chip>
                  <Chip
                    active={depositAmount === Math.round(activeTree.monthlyPlanned * 1.25)}
                    onClick={() => setDepositAmount(Math.round(activeTree.monthlyPlanned * 1.25))}
                  >
                    🚀 125% ({compact(Math.round(activeTree.monthlyPlanned * 1.25), lang)})
                  </Chip>
                  <Chip
                    active={depositAmount === Math.round(activeTree.monthlyPlanned * 1.5)}
                    onClick={() => setDepositAmount(Math.round(activeTree.monthlyPlanned * 1.5))}
                  >
                    ⚡ 150% ({compact(Math.round(activeTree.monthlyPlanned * 1.5), lang)})
                  </Chip>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">{tx('Ngân hàng xác nhận', 'Bank Source', '入金先銀行')}</label>
                  <select
                    value={depositBankId}
                    onChange={(e) => setDepositBankId(e.target.value)}
                    className="select h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-400">{tx('Mã xác thực sổ / Mã GD', 'Passbook / Tx Ref Code', '証書番号・取引ID')}</label>
                  <input
                    type="text"
                    value={depositProof}
                    onChange={(e) => setDepositProof(e.target.value)}
                    maxLength={48}
                    placeholder={tx('VD: CAKE-2026-8812', 'e.g. CAKE-2026-8812', '例：CAKE-2026-8812')}
                    className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                <CheckCircle2 className="size-4" />
                {tx('Xác thực tiền đóng & Tưới cây ngay', 'Verify Deposit & Grow Tree', '入金を認証して木を育てる')}
              </Button>
            </form>

            {/* 8 Biological Growth Stages Interactive Ladder */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-400">
                  {tx('8 Chu Kỳ Sinh Trưởng (Chạm để xem trước từng giai đoạn)', '8 Biological Growth Stages (Tap any stage to preview)', '8段階の成長サイクル（タップして各段階をプレビュー）')}
                </span>
                {previewStageIndex && (
                  <button
                    type="button"
                    onClick={() => setPreviewStageIndex(null)}
                    className="text-[11px] font-medium text-amber-300 hover:underline"
                  >
                    {tx('Về giai đoạn thật', 'Reset live stage', '現在の段階に戻す')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {TREE_GROWTH_STAGES.map((st) => {
                  const passed = activeStatus.acceleratedProgressPct >= st.minPct;
                  const current = previewStageIndex ? st.index === previewStageIndex : st.id === activeStatus.stage.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPreviewStageIndex((prev) => (prev === st.index ? null : st.index))}
                      className={cx(
                        'rounded-lg border p-2 text-center text-[10px] transition hover:border-emerald-400/50',
                        current
                          ? 'border-emerald-400/70 bg-emerald-500/25 font-semibold text-white'
                          : passed
                            ? 'border-indigo-400/35 bg-indigo-500/12 text-indigo-200'
                            : 'border-white/[0.06] bg-white/[0.015] text-zinc-500'
                      )}
                    >
                      <div>#{st.index} · {Math.round(st.minPct)}%</div>
                      <div className="mt-0.5 line-clamp-1">{st.label[lang] || st.label.vi}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Verified Deposit Log */}
            <div className="space-y-2 border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">
                  {tx(`Lịch sử xác thực tiền đóng (${(activeTree.checkIns || []).length})`, `Verified Deposit Log (${(activeTree.checkIns || []).length})`, `認証済み入金履歴`)}
                </span>
                <span className="text-emerald-300 tabular-nums">
                  +{compact(activeStatus.verifiedDepositsTotal, lang)}
                </span>
              </div>
              {(activeTree.checkIns || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">
                  {tx('Chưa có lượt xác thực đóng tiền nào cho cây này.', 'No verified deposit check-ins logged for this tree yet.', 'まだこのツリーの入金認証はありません。')}
                </p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {(activeTree.checkIns || []).map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white tabular-nums">{vnd(c.amount, lang)}</span>
                          <Badge tone="brand">{c.bankId.toUpperCase()}</Badge>
                          {c.isOverTarget && <Badge tone="warning">🚀 {tx('Vượt mức', 'Boost', '超過')}</Badge>}
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-500">
                          {c.date} · {tx('Mã:', 'Ref:', 'ID:')} <span className="font-mono text-zinc-300">{c.proofCode}</span>
                        </div>
                      </div>
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 14-Species Botanical & Mystery Fruit Almanac Modal */}
      <Modal
        open={almanacOpen}
        onClose={() => setAlmanacOpen(false)}
        title={tx(
          '📖 Bách Khoa 14 Loài Cây & Quả Bí Ẩn Việt Nam',
          '📖 14 Native Vietnamese Trees & Mystery Fruit Almanac',
          '📖 ベトナム名木14種＆神秘の実アルマナック'
        )}
        className="max-w-3xl"
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {VIETNAM_WEALTH_TREES.map((sp) => (
              <div
                key={sp.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 sm:flex-row sm:items-center"
              >
                <div className="relative flex size-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-sky-950/50 to-emerald-950/50 p-1.5 ring-1 ring-white/10">
                  <img
                    src={getTreeStageSprite(sp.id, 8)}
                    alt={sp.name[lang] || sp.name.vi}
                    className="max-h-20 w-auto object-contain drop-shadow"
                  />
                  <img
                    src={getMysteryFruitSprite(sp.id)}
                    alt=""
                    className="absolute -right-1.5 -top-1.5 size-7 object-contain drop-shadow"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">
                      {sp.emoji} {sp.name[lang] || sp.name.vi}
                    </span>
                    <Badge tone="brand">{sp.horizonBadge[lang] || sp.horizonBadge.vi}</Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    📍 {sp.region[lang] || sp.region.vi} · 🎁{' '}
                    <span className="text-amber-300">
                      {sp.attributes[lang]?.fitGoal}
                    </span>
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-300">
                    {sp.description[lang] || sp.description.vi}
                  </p>
                </div>
                <Button type="button" size="sm" variant="primary" onClick={() => handleQuickPlantSpecies(sp)}>
                  🌱 {tx('Trồng cây này', 'Plant', '植える')}
                </Button>
              </div>
          ))}
        </div>
      </Modal>

      {/* Mystery Fruit Unboxing Celebration Modal */}
      <Modal
        open={Boolean(mysteryModalTree)}
        onClose={() => setMysteryModalTree(null)}
        title={tx('✨ Chúc mừng thu hoạch Quả Bí Ẩn!', '✨ Mystery Fruit Harvested!', '✨ 神秘の実を収穫しました！')}
      >
        {mysteryModalTree && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <LuckyCatMascot mood="celebrate" size="md" />
              <div className="animate-build-pop flex size-22 items-center justify-center rounded-full border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/25 to-emerald-500/20 p-2 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                <img
                  src={mysteryModalTree.status.mysterySprite}
                  alt={mysteryModalTree.status.mysteryFruit.name.vi}
                  className="size-16 object-contain drop-shadow"
                />
              </div>
            </div>
            <div>
              <Badge tone="warning">
                {mysteryModalTree.status.mysteryFruit.rarity[lang] || mysteryModalTree.status.mysteryFruit.rarity.vi}
              </Badge>
              <h4 className="mt-2 text-lg font-bold text-white">
                {mysteryModalTree.status.mysteryFruit.name[lang] || mysteryModalTree.status.mysteryFruit.name.vi}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                {mysteryModalTree.status.mysteryFruit.lore[lang] || mysteryModalTree.status.mysteryFruit.lore.vi}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] p-3 text-xs text-emerald-200">
              {tx(
                `Tổng vốn đã tích lũy trên cây: ${vnd(mysteryModalTree.status.currentCapital, lang)} (${mysteryModalTree.status.checkInsCount} lần xác thực đóng tiền).`,
                `Total accumulated on this tree: ${vnd(mysteryModalTree.status.currentCapital, lang)} across ${mysteryModalTree.status.checkInsCount} verified deposits.`,
                `合計達成額: ${vnd(mysteryModalTree.status.currentCapital, lang)}（${mysteryModalTree.status.checkInsCount}回の認証入金）。`
              )}
            </div>
            <Button type="button" variant="primary" className="w-full" onClick={() => setMysteryModalTree(null)}>
              {tx('Tuyệt vời! Lưu vào Khu Vườn', 'Awesome! Keep in Orchard', 'ガーデンに保存する')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
