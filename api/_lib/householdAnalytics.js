// ============================================================================
// Server-Only Household Financial Analytics (Cá nhân / Cặp đôi / Gia đình)
// Computes Emergency Fund targets, per-earner contribution splits, net cashflow,
// expense coverage, and breadwinner income stress-tests.
// ============================================================================

function num(v, fallback = 0, min = -1e15, max = 1e15) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const HOUSEHOLD_MODE_LABELS = {
  INDIVIDUAL: 'Cá nhân',
  COUPLE: 'Cặp đôi (2 người)',
  FAMILY: 'Gia đình',
};

export function getRecommendedEmergencyMonths(mode = 'INDIVIDUAL', dependentsCount = 0) {
  const deps = Math.round(num(dependentsCount, 0, 0, 10));
  if (mode === 'FAMILY') {
    return Math.min(12, 6 + Math.round(deps * 1.5));
  }
  if (mode === 'COUPLE') {
    return 6;
  }
  return 4;
}

export function simulateEmergencyFundFillMonths({
  initialCapital = 0,
  targetAmount = 0,
  monthlySavings = 0,
  annualStepUpPct = 0,
  annualBonusAmount = 0,
  emergencyAnnualRate = 4.75,
}) {
  const p0 = num(initialCapital, 0, 0, 1e13);
  const target = num(targetAmount, 0, 0, 1e13);
  if (target <= 0 || p0 >= target) return 0;

  const baseDeposit = num(monthlySavings, 0, 0, 1e12);
  const stepUp = num(annualStepUpPct, 0, 0, 50);
  const bonus = num(annualBonusAmount, 0, 0, 1e12);
  const mRate = num(emergencyAnnualRate, 4.75, 0.1, 20) / 100 / 12;

  if (baseDeposit <= 0 && bonus <= 0) return 999;

  let bal = p0;
  for (let m = 1; m <= 120; m++) {
    const yIdx = Math.floor((m - 1) / 12);
    const dep = Math.round(baseDeposit * Math.pow(1 + stepUp / 100, yIdx));
    const b = m % 12 === 0 ? bonus : 0;
    bal = bal * (1 + mRate) + dep + b;
    if (bal >= target) return m;
  }
  return 120;
}

export function computeHouseholdAnalysis({
  householdMode = 'INDIVIDUAL',
  dependentsCount = 0,
  earner1Income = 25_000_000,
  earner1IncomeMin = null,
  earner1IncomeMax = null,
  earner2Income = 0,
  earner2IncomeMin = null,
  earner2IncomeMax = null,
  monthlyFixedExpense = 12_000_000,
  monthlyDependentsCost = 0,
  contributionRule = 'PROPORTIONAL',
  earner1SharePct = 50,
  initialCapital = 0,
  monthlySavings = 5_000_000,
  passiveIncomeAtGoal = 10_000_000,
  emergencyFundMonthsOverride = 0,
  emergencyFundRate = 4.75,
  annualStepUpPct = 0,
  annualBonusAmount = 0,
}) {
  const mode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(householdMode) ? householdMode : 'INDIVIDUAL';
  const hasPartner = mode === 'COUPLE' || mode === 'FAMILY';
  const safeDependents = mode === 'FAMILY' ? Math.round(num(dependentsCount, 0, 0, 10)) : 0;

  const e1Avg = num(earner1Income, 25_000_000, 0, 1e12);
  const e1Min = earner1IncomeMin !== null && earner1IncomeMin !== undefined ? num(earner1IncomeMin, e1Avg, 0, 1e12) : e1Avg;
  const e1Max = earner1IncomeMax !== null && earner1IncomeMax !== undefined ? num(earner1IncomeMax, e1Avg, 0, 1e12) : e1Avg;

  const e2Avg = hasPartner ? num(earner2Income, 0, 0, 1e12) : 0;
  const e2Min = hasPartner
    ? earner2IncomeMin !== null && earner2IncomeMin !== undefined
      ? num(earner2IncomeMin, e2Avg, 0, 1e12)
      : e2Avg
    : 0;
  const e2Max = hasPartner
    ? earner2IncomeMax !== null && earner2IncomeMax !== undefined
      ? num(earner2IncomeMax, e2Avg, 0, 1e12)
      : e2Avg
    : 0;

  const totalIncomeAvg = Math.round(e1Avg + e2Avg);
  const totalIncomeMin = Math.round(e1Min + e2Min);
  const totalIncomeMax = Math.round(e1Max + e2Max);

  const fixedExpense = num(monthlyFixedExpense, 0, 0, 1e12);
  const depCost = mode === 'FAMILY' ? num(monthlyDependentsCost, 0, 0, 1e12) : 0;
  const totalMonthlyExpense = Math.round(fixedExpense + depCost);

  const safeCapital = num(initialCapital, 0, 0, 1e13);
  const safeSavings = num(monthlySavings, 0, 0, 1e12);
  const safePassiveGoal = num(passiveIncomeAtGoal, 0, 0, 1e12);

  const recommendedEmergencyMonths = getRecommendedEmergencyMonths(mode, safeDependents);
  const customMonths = Math.round(num(emergencyFundMonthsOverride, 0, 0, 18));
  const targetEmergencyMonths = customMonths >= 3 ? customMonths : recommendedEmergencyMonths;

  const emergencyFundTarget = Math.round(totalMonthlyExpense * targetEmergencyMonths);
  const emergencyFundCoveredByCapital = Math.min(safeCapital, emergencyFundTarget);
  const emergencyFundShortfall = Math.max(0, emergencyFundTarget - safeCapital);
  const emergencyFundCoveragePct =
    emergencyFundTarget > 0 ? Math.min(100, Number(((safeCapital / emergencyFundTarget) * 100).toFixed(1))) : 100;

  const monthsToFillEmergencyFund = simulateEmergencyFundFillMonths({
    initialCapital: safeCapital,
    targetAmount: emergencyFundTarget,
    monthlySavings: safeSavings,
    annualStepUpPct,
    annualBonusAmount,
    emergencyAnnualRate: emergencyFundRate,
  });

  const freeCashFlow = Math.round(totalIncomeAvg - totalMonthlyExpense - safeSavings);
  const freeCashFlowMin = Math.round(totalIncomeMin - totalMonthlyExpense - safeSavings);
  const expenseCoveragePct =
    totalMonthlyExpense > 0 ? Number(((safePassiveGoal / totalMonthlyExpense) * 100).toFixed(1)) : 0;
  const savingsToIncomeRatio =
    totalIncomeAvg > 0 ? Number(((safeSavings / totalIncomeAvg) * 100).toFixed(1)) : 0;

  // Contribution split
  const safeRule = ['PROPORTIONAL', 'SPLIT_50_50', 'CUSTOM'].includes(contributionRule)
    ? contributionRule
    : 'PROPORTIONAL';

  let earner1Pct = 100;
  let earner2Pct = 0;
  if (hasPartner) {
    if (safeRule === 'SPLIT_50_50') {
      earner1Pct = 50;
    } else if (safeRule === 'CUSTOM') {
      earner1Pct = Math.round(num(earner1SharePct, 50, 0, 100));
    } else {
      earner1Pct = totalIncomeAvg > 0 ? Number(((e1Avg / totalIncomeAvg) * 100).toFixed(1)) : 50;
    }
    earner2Pct = Number((100 - earner1Pct).toFixed(1));
  }

  const earner1Contribution = Math.round((safeSavings * earner1Pct) / 100);
  const earner2Contribution = hasPartner ? Math.max(0, Math.round(safeSavings - earner1Contribution)) : 0;
  const earner1IncomeSharePct =
    totalIncomeAvg > 0 ? Number(((e1Avg / totalIncomeAvg) * 100).toFixed(1)) : 100;
  const earner2IncomeSharePct = hasPartner ? Number((100 - earner1IncomeSharePct).toFixed(1)) : 0;
  const breadwinnerConcentrationPct = hasPartner
    ? Number(Math.max(earner1IncomeSharePct, earner2IncomeSharePct).toFixed(1))
    : 100;

  const earner1SavingRatioPct = e1Avg > 0 ? Number(((earner1Contribution / e1Avg) * 100).toFixed(1)) : 0;
  const earner2SavingRatioPct = hasPartner && e2Avg > 0 ? Number(((earner2Contribution / e2Avg) * 100).toFixed(1)) : 0;

  const buildStressCase = (remainingIncomeRaw, label) => {
    const remainingIncome = Math.round(remainingIncomeRaw);
    const monthlyGap = Math.max(0, totalMonthlyExpense - remainingIncome);
    const monthlySurplus = Math.max(0, remainingIncome - totalMonthlyExpense);
    const canCoverExpenses = remainingIncome >= totalMonthlyExpense;
    const runwayMonthsWithCapital =
      monthlyGap > 0 ? Number((safeCapital / monthlyGap).toFixed(1)) : null;
    const runwayMonthsWithTarget =
      monthlyGap > 0 && emergencyFundTarget > 0
        ? Number((emergencyFundTarget / monthlyGap).toFixed(1))
        : null;
    return {
      label,
      remainingIncome,
      monthlyGap,
      monthlySurplus,
      canCoverExpenses,
      runwayMonthsWithCapital,
      runwayMonthsWithTarget,
    };
  };

  const stressTest = {
    ifEarner1Stops: buildStressCase(
      hasPartner ? e2Avg : 0,
      hasPartner ? 'Nếu Người 1 tạm ngừng thu nhập' : 'Nếu thu nhập chính tạm gián đoạn'
    ),
    ifEarner2Stops: hasPartner
      ? buildStressCase(e1Avg, 'Nếu Người 2 tạm ngừng thu nhập')
      : null,
  };

  return {
    mode,
    modeLabel: HOUSEHOLD_MODE_LABELS[mode],
    hasPartner,
    membersCount: hasPartner ? 2 + safeDependents : 1,
    dependentsCount: safeDependents,
    totalIncomeAvg,
    totalIncomeMin,
    totalIncomeMax,
    earner1Income: Math.round(e1Avg),
    earner2Income: Math.round(e2Avg),
    fixedExpense: Math.round(fixedExpense),
    dependentsCost: Math.round(depCost),
    totalMonthlyExpense,
    freeCashFlow,
    freeCashFlowMin,
    expenseCoveragePct,
    savingsToIncomeRatio,
    recommendedEmergencyMonths,
    targetEmergencyMonths,
    emergencyFundTarget,
    emergencyFundCoveredByCapital,
    emergencyFundShortfall,
    emergencyFundCoveragePct,
    monthsToFillEmergencyFund,
    contributionSplit: {
      rule: safeRule,
      earner1Pct,
      earner2Pct,
      earner1Contribution,
      earner2Contribution,
      earner1IncomeSharePct,
      earner2IncomeSharePct,
      earner1SavingRatioPct,
      earner2SavingRatioPct,
      breadwinnerConcentrationPct,
    },
    stressTest,
  };
}
