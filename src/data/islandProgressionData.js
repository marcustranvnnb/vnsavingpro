// ============================================================
// TIẾN TRÌNH XÂY NHÀ & MỞ RỘNG ĐẢO MÂY GẮN VỚI KẾ HOẠCH CORE
// Liên kết trực tiếp: /plan, Kệ Sổ Thực Tế, /fx, /cic & Vườn Cây
// ============================================================

import { computeTreeStatus } from './wealthTreesData.js';

export const HOUSE_LEVELS = [
  {
    level: 1,
    sprite: '/assets/garden/houses/house_lv1.png',
    unlockedPlots: 6,
    name: {
      vi: 'Lều Gieo Mầm',
      en: 'Starter Saver Camp',
      ja: '芽生えのキャンプテント',
    },
    requirement: {
      vi: 'Khởi đầu ngay khi bước vào Đảo Mây · Mở sẵn 6 ô đất gieo hạt',
      en: 'Starter island camp · Unlocks 6 soil plots immediately',
      ja: '初期キャンプ · 最初から6区画を開放',
    },
    badgeTone: 'neutral',
  },
  {
    level: 2,
    sprite: '/assets/garden/houses/house_lv2.png',
    unlockedPlots: 8,
    minCapital: 100_000_000,
    name: {
      vi: 'Chòi Tranh Ấm Áp',
      en: 'Warm Thatched Pavilion',
      ja: '温もりの茅葺き東屋',
    },
    requirement: {
      vi: 'Đạt ≥ 100tr ₫ vốn lõi/vườn, hoặc ≥ 1 Sổ Tiết Kiệm thật, hoặc ≥ 50% Quỹ Dự Phòng',
      en: 'Reach ≥ 100M VND total wealth, 1 Real Passbook, or ≥ 50% Emergency Fund',
      ja: '合計元本 1億VND以上、または実預金1件以上、または緊急資金50%以上',
    },
    badgeTone: 'brand',
  },
  {
    level: 3,
    sprite: '/assets/garden/houses/house_lv3.png',
    unlockedPlots: 10,
    minCapital: 300_000_000,
    name: {
      vi: 'Nhà Gỗ Mái Ngói',
      en: 'Terracotta Garden Cottage',
      ja: '赤瓦の木造コテージ',
    },
    requirement: {
      vi: 'Đạt ≥ 300tr ₫ vốn tích lũy, hoặc trồng ≥ 2 cây kế hoạch, hoặc chế độ Cặp Đôi',
      en: 'Reach ≥ 300M VND capital, grow ≥ 2 active trees, or activate Couple Plan',
      ja: '資産 3億VND以上、または育成ツリー2本以上、またはカップルモード',
    },
    badgeTone: 'success',
  },
  {
    level: 4,
    sprite: '/assets/garden/houses/house_lv4.png',
    unlockedPlots: 12,
    minCapital: 1_000_000_000,
    name: {
      vi: 'Biệt Thự Phố Vườn',
      en: 'Modern Vietnamese Villa',
      ja: 'モダンガーデンヴィラ',
    },
    requirement: {
      vi: 'Đạt ≥ 1 tỷ ₫ vốn, hoặc mở khóa ≥ 1 Quả Bí Ẩn, hoặc kế hoạch Gia Đình',
      en: 'Reach ≥ 1B VND capital, harvest ≥ 1 Mystery Fruit, or Family Plan',
      ja: '資産 10億VND以上、または神秘の実1個以上収穫、またはファミリー設計',
    },
    badgeTone: 'warning',
  },
  {
    level: 5,
    sprite: '/assets/garden/houses/house_lv5.png',
    unlockedPlots: 12,
    minCapital: 3_000_000_000,
    name: {
      vi: 'Dinh Thự Đảo Mây FIRE',
      en: 'Golden FIRE Sky Mansion',
      ja: '黄金のFIRE天空邸宅',
    },
    requirement: {
      vi: 'Đạt ≥ 3 tỷ ₫ tài sản hoặc hoàn thành ≥ 3 Quả Bí Ẩn Tự Do Tài Chính',
      en: 'Reach ≥ 3B VND wealth or unlock ≥ 3 Mystery Fruits',
      ja: '資産 30億VND以上、または神秘の実3個以上達成',
    },
    badgeTone: 'warning',
  },
];

export const ISLAND_LANDMARKS = [
  {
    id: 'fountain',
    emoji: '⛲',
    sprite: '/assets/garden/props/fountain.png',
    route: 'profile',
    name: {
      vi: 'Đài Phun Nước Thanh Khoản',
      en: 'Liquidity Crystal Fountain',
      ja: '流動性クリスタル噴水',
    },
    conditionText: {
      vi: 'Mở khi có ≥ 1 Sổ Tiết Kiệm Thực Tế hoặc Quỹ Dự Phòng > 0 trên /plan',
      en: 'Unlocks when tracking ≥ 1 Real Passbook or positive Emergency Fund',
      ja: '保有定期預金の登録または緊急資金の設定で開放',
    },
  },
  {
    id: 'portal',
    emoji: '🌀',
    sprite: '/assets/garden/props/pavilion.png',
    route: 'fx',
    name: {
      vi: 'Cổng Ngọc Ngoại Tệ & Tín Dụng',
      en: 'FX & Credit Mastery Portal',
      ja: '外貨FX・CICポータル',
    },
    conditionText: {
      vi: 'Mở khi theo dõi danh mục Ngoại tệ /fx hoặc mô phỏng CIC /cic',
      en: 'Unlocks with FX currency holdings (/fx) or CIC readiness simulation (/cic)',
      ja: '外貨FXポートフォリオ管理またはCIC信用診断の利用で開放',
    },
  },
  {
    id: 'waterfall',
    emoji: '🏞️',
    sprite: '/assets/garden/props/watering_can.png',
    route: 'garden',
    name: {
      vi: 'Thác Nước Lãi Kép Bứt Tốc',
      en: 'Compound Accelerator Waterfall',
      ja: '複利加速の滝',
    },
    conditionText: {
      vi: 'Mở khi có ít nhất 1 lần xác thực đóng vượt kế hoạch (> 1.0x)',
      en: 'Unlocks on your first verified over-target deposit check-in (> 1.0x)',
      ja: '目標以上の入金認証（1.0倍超ブースト）を1回達成で開放',
    },
  },
  {
    id: 'chest',
    emoji: '💰',
    sprite: '/assets/garden/props/chest.png',
    route: 'garden',
    name: {
      vi: 'Rương Kho Báu Mùa Vàng',
      en: 'Golden Harvest Treasure Chest',
      ja: '黄金の収穫宝箱',
    },
    conditionText: {
      vi: 'Mở khi hái Quả Bí Ẩn đầu tiên ở Chu kỳ 8 (100% mục tiêu)',
      en: 'Unlocks when you harvest your very first Stage-8 Mystery Fruit',
      ja: '第8段階（100%達成）の神秘の実を初収穫で開放',
    },
  },
];

export function computeIslandProgression({
  trees = [],
  plan = null,
  passbooks = [],
  fxPortfolio = null,
  cicState = null,
} = {}) {
  const treeCapital = trees.reduce((sum, t) => sum + computeTreeStatus(t).currentCapital, 0);
  const planCapital = Number(plan?.capital) || 0;
  const passbookCapital = Array.isArray(passbooks)
    ? passbooks.reduce((s, p) => s + (Number(p?.principal) || 0), 0)
    : 0;

  const totalCoreWealthVnd = Math.max(treeCapital, planCapital + passbookCapital);
  const efCurrent = Number(plan?.emergencyFundCurrent) || 0;
  const efTarget = Math.max(1, (Number(plan?.monthlyExpense) || 15_000_000) * (Number(plan?.emergencyFundMonths) || 4));
  const efPct = Math.min(100, Math.round((efCurrent / efTarget) * 100));

  const realPassbookCount = Array.isArray(passbooks)
    ? passbooks.filter((p) => !String(p?.id || '').startsWith('pb_ef_') && !String(p?.id || '').startsWith('pb_goal_')).length
    : 0;
  const harvestedCount = trees.filter((t) => t.mysteryUnlocked || computeTreeStatus(t).canHarvestMystery).length;
  const hasOverDeposit = trees.some((t) => (t.checkIns || []).some((c) => c.isOverTarget));
  const householdMode = plan?.householdMode || 'INDIVIDUAL';

  let earnedHouseLevel = 1;
  if (totalCoreWealthVnd >= 100_000_000 || realPassbookCount >= 1 || efPct >= 50 || trees.length >= 1) {
    earnedHouseLevel = 2;
  }
  if (totalCoreWealthVnd >= 300_000_000 || trees.length >= 2 || householdMode === 'COUPLE') {
    earnedHouseLevel = Math.max(earnedHouseLevel, 3);
  }
  if (totalCoreWealthVnd >= 1_000_000_000 || harvestedCount >= 1 || householdMode === 'FAMILY') {
    earnedHouseLevel = Math.max(earnedHouseLevel, 4);
  }
  if (totalCoreWealthVnd >= 3_000_000_000 || harvestedCount >= 3) {
    earnedHouseLevel = 5;
  }

  const currentHouse = HOUSE_LEVELS.find((h) => h.level === earnedHouseLevel) || HOUSE_LEVELS[0];
  const nextHouse = HOUSE_LEVELS.find((h) => h.level === earnedHouseLevel + 1) || null;
  const unlockedPlots = currentHouse.unlockedPlots;

  const fxHasHoldings = Array.isArray(fxPortfolio?.holdings)
    ? fxPortfolio.holdings.length > 0
    : Boolean(fxPortfolio && Number(fxPortfolio.amount) > 0);
  const cicVisited = Boolean(cicState && Number(cicState.monthlyNetIncome) > 0);

  const landmarks = ISLAND_LANDMARKS.map((lm) => {
    let unlocked = false;
    if (lm.id === 'fountain') unlocked = passbooks.length > 0 || efCurrent > 0;
    if (lm.id === 'portal') unlocked = fxHasHoldings || cicVisited || trees.length > 0;
    if (lm.id === 'waterfall') unlocked = hasOverDeposit;
    if (lm.id === 'chest') unlocked = harvestedCount > 0;
    return { ...lm, unlocked };
  });

  const nextCapitalGap = nextHouse?.minCapital ? Math.max(0, nextHouse.minCapital - totalCoreWealthVnd) : 0;

  return {
    earnedHouseLevel,
    currentHouse,
    nextHouse,
    nextCapitalGap,
    unlockedPlots,
    totalCoreWealthVnd,
    efPct,
    harvestedCount,
    landmarks,
  };
}
