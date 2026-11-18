import { TENURE_DAYS_MAP } from '../../src/data/banksData.js';

function num(v, fallback = 0, min = -1e15, max = 1e15) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Single interest calculation supporting Dual Modes
 * Mode 1: ACTUAL_DAYS (Thông tư 14 NHNN 365 days)
 * Mode 2: NOMINAL_MONTHS (12 Months base)
 */
export function calculateInterest({
  principal = 0,
  ratePercent = 0,
  tenureCode = "12M",
  payoutMethod = "MATURITY",
  calculationMode = "ACTUAL_DAYS"
}) {
  const p = num(principal, 0, 0, 1e13);
  const r = num(ratePercent, 0, 0, 50);

  let days = TENURE_DAYS_MAP[tenureCode] || 365;
  let months = 12;
  if (tenureCode.endsWith("W")) {
    const weeks = parseInt(tenureCode, 10) || 1;
    days = weeks * 7;
    months = (weeks * 7) / 30.416;
  } else if (tenureCode.endsWith("M")) {
    months = parseInt(tenureCode, 10) || 12;
    days = Math.round(months * 30.416);
    if (months === 12) days = 365;
    if (months === 6) days = 180;
    if (months === 3) days = 90;
    if (months === 1) days = 30;
  }

  let interestEarned = 0;

  if (calculationMode === "ACTUAL_DAYS") {
    interestEarned = (p * (r / 100) * days) / 365;
  } else {
    interestEarned = (p * (r / 100) * months) / 12;
  }

  let effectivePrincipal = p;
  let upfrontCash = 0;
  let effectiveAPY = r;

  if (payoutMethod === "UPFRONT") {
    upfrontCash = interestEarned;
    effectivePrincipal = Math.max(0, p - upfrontCash);
    if (effectivePrincipal > 0) {
      effectiveAPY = ((interestEarned / effectivePrincipal) * (12 / months)) * 100;
    }
  }

  const monthlyPayoutStream = payoutMethod === "MONTHLY" ? interestEarned / Math.max(1, months) : 0;
  const quarterlyPayoutStream = payoutMethod === "QUARTERLY" ? interestEarned / Math.max(1, months / 3) : 0;

  return {
    principal: p,
    ratePercent: r,
    tenureCode,
    days,
    months,
    interestEarned: Math.round(interestEarned),
    totalMaturityPayout: Math.round(p + (payoutMethod === "MATURITY" ? interestEarned : 0)),
    upfrontCash: Math.round(upfrontCash),
    effectivePrincipal: Math.round(effectivePrincipal),
    effectiveAPY: Number(effectiveAPY.toFixed(2)),
    monthlyPayoutStream: Math.round(monthlyPayoutStream),
    quarterlyPayoutStream: Math.round(quarterlyPayoutStream)
  };
}

/**
 * Compares 3 deposit calculation methods (Actual Days/365, Nominal Months/12, Monthly Compounding)
 */
export function calculateDepositComparison({
  principal = 100000000,
  ratePercent = 6.0,
  tenureCode = "12M",
  customDays = null
}) {
  const p = num(principal, 0, 0, 1e13);
  const r = num(ratePercent, 0, 0, 50);
  const months = Math.max(1, parseInt(tenureCode, 10) || 12);
  const defaultDays = TENURE_DAYS_MAP[tenureCode] || 365;
  const customD = num(customDays, 0, 0, 36500);
  const days = customD > 0 ? customD : defaultDays;

  const m1Interest = Math.round((p * (r / 100) * days) / 365);
  const m1Monthly = Math.round(m1Interest / months);
  const m1Total = p + m1Interest;

  const m2Interest = Math.round((p * (r / 100) * months) / 12);
  const m2Monthly = Math.round(m2Interest / months);
  const m2Total = p + m2Interest;

  const m3Total = Math.round(p * Math.pow(1 + r / 100 / 12, months));
  const m3Interest = m3Total - p;
  const m3Monthly = Math.round(m3Interest / months);

  return {
    days,
    months,
    m1: { interest: m1Interest, monthly: m1Monthly, total: m1Total },
    m2: { interest: m2Interest, monthly: m2Monthly, total: m2Total },
    m3: { interest: m3Interest, monthly: m3Monthly, total: m3Total },
    diffDaysVsMonths: m1Interest - m2Interest,
    diffCompoundVsDays: m3Interest - m1Interest
  };
}

function formatDurationVi(monthsNeeded, isAlreadyReached) {
  if (isAlreadyReached) return 'Đã đạt mục tiêu!';
  if (monthsNeeded >= 720) return '> 60 năm (Cần tăng tiền gửi)';
  const fullYears = Math.floor(monthsNeeded / 12);
  const remainingMonths = monthsNeeded % 12;
  if (fullYears === 0) return `${remainingMonths} tháng`;
  if (remainingMonths === 0) return `${fullYears} năm`;
  return `${fullYears} năm ${remainingMonths} tháng`;
}

function buildStagePackageSnapshot({
  stageMonth,
  finalMonth,
  isGoalReached,
  contributions,
  monthlyRate,
  tenureCode,
  tenureMonths,
  logRow,
  nominalRequiredPrincipal,
  requiredPrincipal,
}) {
  const active = contributions.filter((c) => c.openMonth <= stageMonth);
  const stageTotalBalance = logRow ? logRow.totalBalance : 0;
  const stageMonthlyInterest = logRow ? logRow.monthlyPassiveIncomeGenerated : 0;
  const stageTotalDeposited = logRow ? logRow.principalDeposited : 0;
  const stageAccumulatedInterest = logRow ? logRow.interestEarnedTotal : 0;

  let rolledOverCount = 0;
  let firstCycleCount = 0;
  const cohortMap = new Map();
  const detailedPackages = [];

  for (const c of active) {
    const ageMonths = Math.max(0, stageMonth - c.openMonth);
    const growthFactor = Math.pow(1 + monthlyRate, ageMonths);
    const exactBal = c.amount * growthFactor;
    const currentBalance = Math.round(exactBal);
    const accumulatedInterest = Math.max(0, currentBalance - c.amount);
    const exactMonthlyInt = exactBal * monthlyRate;
    const monthlyInterest = Math.round(exactMonthlyInt);
    const rolloverCount = ageMonths >= tenureMonths ? Math.floor(ageMonths / tenureMonths) : 0;
    const nextMaturityMonth = c.openMonth + (rolloverCount + 1) * tenureMonths;

    if (rolloverCount > 0) rolledOverCount++;
    else firstCycleCount++;

    const groupKey =
      c.type === 'INITIAL' ? 'INITIAL' : c.type === 'BONUS' ? `BONUS_${c.cohortYear}` : `YEAR_${c.cohortYear}`;
    const groupLabel =
      c.type === 'INITIAL'
        ? 'Vốn ban đầu'
        : c.type === 'BONUS'
          ? `Thưởng cuối Năm ${c.cohortYear}`
          : `Đợt gửi Năm ${c.cohortYear}`;

    detailedPackages.push({
      id: c.id,
      code: c.code,
      type: c.type,
      groupKey,
      groupLabel,
      openMonth: c.openMonth,
      cohortYear: c.cohortYear,
      initialPrincipal: c.amount,
      currentBalance,
      accumulatedInterest,
      monthlyInterest,
      sharePct: stageMonthlyInterest > 0 ? Number(((monthlyInterest / stageMonthlyInterest) * 100).toFixed(1)) : 0,
      rolloverCount,
      nextMaturityMonth,
    });

    if (!cohortMap.has(groupKey)) {
      cohortMap.set(groupKey, {
        key: groupKey,
        type: c.type,
        label: groupLabel,
        cohortYear: c.cohortYear,
        firstCode: c.code,
        lastCode: c.code,
        packageCount: 0,
        totalInitial: 0,
        exactBalanceSum: 0,
        exactMonthlyIntSum: 0,
        maxRolloverCount: 0,
        rolledPackages: 0,
      });
    }
    const g = cohortMap.get(groupKey);
    g.lastCode = c.code;
    g.packageCount += 1;
    g.totalInitial += c.amount;
    g.exactBalanceSum += exactBal;
    g.exactMonthlyIntSum += exactMonthlyInt;
    g.maxRolloverCount = Math.max(g.maxRolloverCount, rolloverCount);
    if (rolloverCount > 0) g.rolledPackages += 1;
  }

  const cohorts = Array.from(cohortMap.values()).map((g) => {
    const totalBalance = Math.round(g.exactBalanceSum);
    const totalMonthlyInterest = Math.round(g.exactMonthlyIntSum);
    const tone =
      g.type === 'INITIAL'
        ? 'indigo'
        : g.type === 'BONUS'
          ? 'amber'
          : g.rolledPackages > 0
            ? 'sky'
            : 'emerald';
    return {
      key: g.key,
      type: g.type,
      tone,
      label: g.label,
      cohortYear: g.cohortYear,
      codeRange: g.packageCount === 1 ? g.firstCode : `${g.firstCode} → ${g.lastCode}`,
      packageCount: g.packageCount,
      perPackageInitial: Math.round(g.totalInitial / Math.max(1, g.packageCount)),
      totalInitial: g.totalInitial,
      totalBalance,
      totalAccumulatedInterest: Math.max(0, totalBalance - g.totalInitial),
      totalMonthlyInterest,
      perPackageMonthlyInterest: Math.round(totalMonthlyInterest / Math.max(1, g.packageCount)),
      sharePct: 0,
      maxRolloverCount: g.maxRolloverCount,
      rolledPackages: g.rolledPackages,
    };
  });

  // Reconcile sub-dong Math.round residual onto the largest cohort so cohort sums match stage totals exactly
  if (cohorts.length > 0) {
    let largestIdx = 0;
    for (let idx = 1; idx < cohorts.length; idx++) {
      if (cohorts[idx].totalBalance > cohorts[largestIdx].totalBalance) largestIdx = idx;
    }
    const balSum = cohorts.reduce((s, c) => s + c.totalBalance, 0);
    const intSum = cohorts.reduce((s, c) => s + c.totalMonthlyInterest, 0);
    const balDiff = stageTotalBalance - balSum;
    const intDiff = stageMonthlyInterest - intSum;
    if (Math.abs(balDiff) <= cohorts.length * 2) {
      cohorts[largestIdx].totalBalance = Math.max(0, cohorts[largestIdx].totalBalance + balDiff);
      cohorts[largestIdx].totalAccumulatedInterest = Math.max(
        0,
        cohorts[largestIdx].totalBalance - cohorts[largestIdx].totalInitial
      );
    }
    if (Math.abs(intDiff) <= cohorts.length * 2) {
      cohorts[largestIdx].totalMonthlyInterest = Math.max(0, cohorts[largestIdx].totalMonthlyInterest + intDiff);
      cohorts[largestIdx].perPackageMonthlyInterest = Math.round(
        cohorts[largestIdx].totalMonthlyInterest / Math.max(1, cohorts[largestIdx].packageCount)
      );
    }
    cohorts.forEach((c) => {
      c.sharePct = stageMonthlyInterest > 0 ? Number(((c.totalMonthlyInterest / stageMonthlyInterest) * 100).toFixed(1)) : 0;
    });
  }

  let packages = detailedPackages;
  let packagesTruncated = false;
  if (detailedPackages.length > 120) {
    packages = [...detailedPackages.slice(0, 12), ...detailedPackages.slice(-108)];
    packagesTruncated = true;
  }

  const label =
    stageMonth === 0
      ? 'Hiện tại'
      : stageMonth === finalMonth && isGoalReached
        ? stageMonth % 12 === 0
          ? `Năm ${stageMonth / 12} · Đạt mục tiêu`
          : `Tháng ${stageMonth} · Đạt mục tiêu`
        : stageMonth % 12 === 0
          ? `Năm ${stageMonth / 12}`
          : `Tháng ${stageMonth}`;

  const targetBase = requiredPrincipal || nominalRequiredPrincipal || 1;
  const goalProgressPct = Number(Math.min(100, (stageTotalBalance / Math.max(1, targetBase)) * 100).toFixed(1));

  return {
    month: stageMonth,
    year: Number((stageMonth / 12).toFixed(1)),
    label,
    tenureCode,
    tenureMonths,
    totalPackages: active.length,
    rolledOverCount,
    firstCycleCount,
    totalDeposited: stageTotalDeposited,
    totalBalance: stageTotalBalance,
    accumulatedInterest: stageAccumulatedInterest,
    monthlyInterest: stageMonthlyInterest,
    annualInterest: stageMonthlyInterest * 12,
    goalProgressPct,
    isGoal: stageMonth === finalMonth && isGoalReached,
    cohorts,
    packages,
    packagesTotalCount: active.length,
    packagesTruncated,
  };
}

/**
 * Passive Income & Target Savings Roadmap Solver
 * Supports 2 goal types (`PASSIVE_INCOME` | `TARGET_AMOUNT`),
 * bidirectional solving (`TIME` | `SAVING`), plus step-up deposits,
 * annual bonus lump sums, inflation adjustment, and per-stage package breakdowns.
 */
export function calculatePassiveIncomeRoadmap({
  goalType = 'PASSIVE_INCOME',
  targetMonthlyInterest = 10000000,
  targetAmount = 500000000,
  solveMode = 'TIME',
  targetYears = 5,
  currentSalary = 35000000,
  monthlySavingsAmount = 5000000,
  initialCapital = 0,
  annualInterestRate = 6.0,
  calculationMode = 'NOMINAL_MONTHS',
  tenureCode = '12M',
  annualStepUpPct = 0,
  annualBonusAmount = 0,
  inflationRatePct = 0,
}) {
  const normalizedGoal = goalType === 'TARGET_AMOUNT' ? 'TARGET_AMOUNT' : 'PASSIVE_INCOME';
  const normalizedSolve = solveMode === 'SAVING' ? 'SAVING' : 'TIME';
  const salary = num(currentSalary, 35000000, 100000, 1e12);
  const inputMonthlyDeposit = num(monthlySavingsAmount, 0, 0, 1e12);
  const p0 = num(initialCapital, 0, 0, 1e13);
  const rate = num(annualInterestRate, 6.0, 0.1, 30);
  const safeTenure = typeof tenureCode === 'string' && /^(?:\d+[WM])$/.test(tenureCode) ? tenureCode : '12M';
  const tenureMonths = safeTenure.endsWith('W') ? 1 : Math.max(1, parseInt(safeTenure, 10) || 12);
  const stepUp = num(annualStepUpPct, 0, 0, 50);
  const bonus = num(annualBonusAmount, 0, 0, 1e12);
  const inflation = num(inflationRatePct, 0, 0, 20);

  const monthlyFactor = calculationMode === 'ACTUAL_DAYS' ? 30 / 365 : 1 / 12;
  const i = (rate / 100) * monthlyFactor;

  let nominalRequiredPrincipal;
  let baseMonthlyInterest;
  if (normalizedGoal === 'TARGET_AMOUNT') {
    nominalRequiredPrincipal = Math.round(num(targetAmount, 500_000_000, 1_000_000, 1e13));
    baseMonthlyInterest = Math.round(nominalRequiredPrincipal * i);
  } else {
    baseMonthlyInterest = Math.round(num(targetMonthlyInterest, 10_000_000, 100_000, 1e12));
    nominalRequiredPrincipal = Math.round(baseMonthlyInterest / i);
  }

  let monthsNeeded = 0;
  let currentBalance = p0;
  let depositedSoFar = p0;
  let requiredPrincipal = nominalRequiredPrincipal;
  let requiredMonthlyDeposit = inputMonthlyDeposit;
  let isAlreadyReached = p0 >= nominalRequiredPrincipal;
  const monthByMonthLog = [];
  const contributions = [];
  let nextPkgId = 1;
  let rolloverCursor = 0;

  if (p0 > 0) {
    contributions.push({
      id: nextPkgId,
      code: `Sổ #${nextPkgId}`,
      type: 'INITIAL',
      openMonth: 0,
      cohortYear: 0,
      amount: p0,
    });
    nextPkgId++;
  }

  const pushLogRow = (m) => {
    while (rolloverCursor < contributions.length && m - contributions[rolloverCursor].openMonth >= tenureMonths) {
      rolloverCursor++;
    }
    monthByMonthLog.push({
      month: m,
      year: m === 0 ? 0 : Number((m / 12).toFixed(1)),
      principalDeposited: Math.round(depositedSoFar),
      interestEarnedTotal: Math.round(Math.max(0, currentBalance - depositedSoFar)),
      totalBalance: Math.round(currentBalance),
      monthlyPassiveIncomeGenerated: Math.round(currentBalance * i),
      activePackagesCount: contributions.length,
      rolledOverPackagesCount: rolloverCursor,
    });
  };

  const recordMonthDeposits = (m, depositAmt, bonusAmt) => {
    const cohortYear = Math.floor((m - 1) / 12) + 1;
    if (depositAmt > 0) {
      contributions.push({
        id: nextPkgId,
        code: `Sổ #${nextPkgId}`,
        type: 'MONTHLY',
        openMonth: m,
        cohortYear,
        amount: depositAmt,
      });
      nextPkgId++;
    }
    if (bonusAmt > 0) {
      contributions.push({
        id: nextPkgId,
        code: `Sổ #${nextPkgId}`,
        type: 'BONUS',
        openMonth: m,
        cohortYear,
        amount: bonusAmt,
      });
      nextPkgId++;
    }
  };

  if (normalizedSolve === 'SAVING') {
    const safeYears = num(targetYears, 5, 1, 50);
    const targetMonths = Math.min(600, Math.max(12, Math.round(safeYears * 12)));
    const inflationMultiplier = Math.pow(1 + inflation / 100, targetMonths / 12);
    requiredPrincipal = Math.round(nominalRequiredPrincipal * inflationMultiplier);
    isAlreadyReached = p0 >= requiredPrincipal;

    if (isAlreadyReached) {
      requiredMonthlyDeposit = 0;
      monthsNeeded = 0;
      pushLogRow(0);
    } else {
      let baseBalance = p0;
      let unitFactor = 0;
      for (let m = 1; m <= targetMonths; m++) {
        const yearIdx = Math.floor((m - 1) / 12);
        const bonusThisMonth = m % 12 === 0 ? bonus : 0;
        baseBalance = baseBalance * (1 + i) + bonusThisMonth;
        unitFactor = unitFactor * (1 + i) + Math.pow(1 + stepUp / 100, yearIdx);
      }

      requiredMonthlyDeposit =
        baseBalance >= requiredPrincipal ? 0 : Math.ceil((requiredPrincipal - baseBalance) / Math.max(1e-9, unitFactor));

      pushLogRow(0);

      for (let m = 1; m <= targetMonths; m++) {
        const yearIdx = Math.floor((m - 1) / 12);
        const depositThisMonth = Math.round(requiredMonthlyDeposit * Math.pow(1 + stepUp / 100, yearIdx));
        const bonusThisMonth = m % 12 === 0 ? bonus : 0;
        currentBalance = currentBalance * (1 + i) + depositThisMonth + bonusThisMonth;
        depositedSoFar += depositThisMonth + bonusThisMonth;
        recordMonthDeposits(m, depositThisMonth, bonusThisMonth);
        pushLogRow(m);
      }
      monthsNeeded = targetMonths;
    }
  } else {
    requiredMonthlyDeposit = inputMonthlyDeposit;

    if (isAlreadyReached) {
      monthsNeeded = 0;
      pushLogRow(0);
    } else if (inputMonthlyDeposit <= 0 && bonus <= 0 && p0 <= 0) {
      monthsNeeded = 999;
    } else {
      pushLogRow(0);

      while (monthsNeeded < 720) {
        monthsNeeded++;
        const yearIdx = Math.floor((monthsNeeded - 1) / 12);
        const depositThisMonth = Math.round(inputMonthlyDeposit * Math.pow(1 + stepUp / 100, yearIdx));
        const bonusThisMonth = monthsNeeded % 12 === 0 ? bonus : 0;
        const targetAtMonth = Math.round(nominalRequiredPrincipal * Math.pow(1 + inflation / 100, monthsNeeded / 12));

        currentBalance = currentBalance * (1 + i) + depositThisMonth + bonusThisMonth;
        depositedSoFar += depositThisMonth + bonusThisMonth;
        requiredPrincipal = targetAtMonth;
        recordMonthDeposits(monthsNeeded, depositThisMonth, bonusThisMonth);
        pushLogRow(monthsNeeded);

        if (currentBalance >= targetAtMonth) {
          break;
        }
      }
    }
  }

  // Build stage snapshots for Option 4 Explorer
  const stageSnapshots = [];
  if (monthByMonthLog.length > 0) {
    const finalMonth = monthByMonthLog[monthByMonthLog.length - 1].month;
    const isGoalReached = isAlreadyReached || currentBalance >= requiredPrincipal;
    const stageMonthsSet = new Set();
    if (p0 > 0) stageMonthsSet.add(0);

    if (finalMonth < 12) {
      for (const m of [1, 3, 6, 9]) {
        if (m < finalMonth) stageMonthsSet.add(m);
      }
    } else if (finalMonth <= 180) {
      for (let m = 12; m <= finalMonth; m += 12) {
        stageMonthsSet.add(m);
      }
    } else {
      for (const y of [1, 2, 3, 5]) {
        if (y * 12 < finalMonth) stageMonthsSet.add(y * 12);
      }
      for (let m = 60; m < finalMonth; m += 60) {
        stageMonthsSet.add(m);
      }
    }
    stageMonthsSet.add(finalMonth);

    const logMap = new Map(monthByMonthLog.map((row) => [row.month, row]));
    const sortedStageMonths = Array.from(stageMonthsSet).sort((a, b) => a - b);
    for (const sm of sortedStageMonths) {
      stageSnapshots.push(
        buildStagePackageSnapshot({
          stageMonth: sm,
          finalMonth,
          isGoalReached,
          contributions,
          monthlyRate: i,
          tenureCode: safeTenure,
          tenureMonths,
          logRow: logMap.get(sm),
          nominalRequiredPrincipal,
          requiredPrincipal,
        })
      );
    }
  }

  const yearsNeeded = Number((monthsNeeded / 12).toFixed(1));
  const fullYears = Math.floor(monthsNeeded / 12);
  const remainingMonths = monthsNeeded % 12;
  const timeText = formatDurationVi(monthsNeeded, isAlreadyReached);

  const totalDeposited = Math.round(depositedSoFar);
  const finalBalance = Math.round(currentBalance);
  const totalCompoundInterest = Math.round(Math.max(0, finalBalance - totalDeposited));
  const compoundSharePct = finalBalance > 0 ? Number(((totalCompoundInterest / finalBalance) * 100).toFixed(1)) : 0;
  const savingsRatePercent = salary > 0 ? Number(((requiredMonthlyDeposit / salary) * 100).toFixed(1)) : 0;

  return {
    goalType: normalizedGoal,
    solveMode: normalizedSolve,
    targetYears: Number((monthsNeeded / 12).toFixed(1)),
    tenureCode: safeTenure,
    tenureMonths,
    targetMonthlyInterest: Math.round(requiredPrincipal * i),
    baseMonthlyInterest,
    nominalRequiredPrincipal,
    requiredPrincipal,
    annualInterestRate: rate,
    initialCapital: p0,
    monthlyDeposit: requiredMonthlyDeposit,
    requiredMonthlyDeposit,
    annualStepUpPct: stepUp,
    annualBonusAmount: bonus,
    inflationRatePct: inflation,
    monthsNeeded,
    yearsNeeded,
    fullYears,
    remainingMonths,
    timeText,
    totalDeposited,
    finalBalance,
    totalCompoundInterest,
    compoundSharePct,
    savingsRatePercent,
    finalMonthlyPassiveIncome: Math.round(finalBalance * i),
    isAlreadyReached,
    monthByMonthLog,
    stageSnapshots,
    isAchievableShortTerm: yearsNeeded <= 10,
  };
}

/**
 * Simulate Multi-Strategy Laddering Matrix
 */
export function simulateLadderingMatrix({
  monthlySavings = 1000000,
  strategy = "SPLIT_50_50",
  customAllocations = [
    { term: "1M", percent: 50, rate: 4.75 },
    { term: "3M", percent: 50, rate: 4.75 }
  ],
  totalMonths = 12,
  bankRates = {}
}) {
  const mAmount = num(monthlySavings, 1000000, 0, 1e12);
  const monthsCap = Math.round(num(totalMonths, 12, 1, 60));
  const timelineRows = [];

  let packagesConfig = [];
  if (strategy === "ROLLING_1M") {
    packagesConfig = [{ nameSuffix: "1M", term: "1M", percent: 100, defaultRate: 4.75 }];
  } else if (strategy === "SPLIT_50_50") {
    packagesConfig = [
      { nameSuffix: "1M", term: "1M", percent: 50, defaultRate: 4.75 },
      { nameSuffix: "3M", term: "3M", percent: 50, defaultRate: 4.75 }
    ];
  } else if (strategy === "TNEX_PROMO_30_70") {
    packagesConfig = [
      { nameSuffix: "1M", term: "1M", percent: 30, defaultRate: 4.75 },
      { nameSuffix: "6M", term: "6M", percent: 70, defaultRate: 6.90 }
    ];
  } else {
    packagesConfig = customAllocations;
  }

  const activePackages = [];
  let packageCounter = 1;

  for (let m = 1; m <= monthsCap; m++) {
    let totalMaturedThisMonth = 0;
    let totalInterestMaturedThisMonth = 0;

    activePackages.forEach(pkg => {
      if (pkg.status === "ACTIVE" && pkg.maturityMonth === m) {
        pkg.status = "MATURED";
        const calc = calculateInterest({
          principal: pkg.currentAmount,
          ratePercent: pkg.rate,
          tenureCode: pkg.term
        });
        pkg.interestEarned = calc.interestEarned;
        pkg.maturedAmount = pkg.currentAmount + calc.interestEarned;

        totalMaturedThisMonth += pkg.maturedAmount;
        totalInterestMaturedThisMonth += calc.interestEarned;

        pkg.status = "ROLLED_OVER";
        const rolloverMonths = pkg.term.endsWith("W") ? 1 : (parseInt(pkg.term, 10) || 1);
        activePackages.push({
          id: packageCounter++,
          name: `${pkg.name} (Xoay vòng ${m})`,
          initialAmount: pkg.maturedAmount,
          currentAmount: pkg.maturedAmount,
          term: pkg.term,
          rate: pkg.rate,
          startMonth: m,
          maturityMonth: m + rolloverMonths,
          status: "ACTIVE"
        });
      }
    });

    packagesConfig.forEach(cfg => {
      const pkgAmount = Math.round((mAmount * cfg.percent) / 100);
      if (pkgAmount > 0) {
        const monthsSpan = cfg.term === "1W" || cfg.term === "2W" || cfg.term === "3W" ? 1 : (parseInt(cfg.term, 10) || 1);
        activePackages.push({
          id: packageCounter++,
          name: `Gói ${packageCounter - 1} (${cfg.term})`,
          initialAmount: pkgAmount,
          currentAmount: pkgAmount,
          term: cfg.term,
          rate: cfg.rate || bankRates[cfg.term] || cfg.defaultRate || 5.0,
          startMonth: m,
          maturityMonth: m + monthsSpan,
          status: "ACTIVE"
        });
      }
    });

    const currentActiveList = activePackages.filter(p => p.status === "ACTIVE");
    const totalPortfolioValue = currentActiveList.reduce((sum, p) => sum + p.currentAmount, 0);
    const estimatedMonthlyYield = Math.round(currentActiveList.reduce((sum, p) => sum + (p.currentAmount * (p.rate / 100)) / 12, 0));

    timelineRows.push({
      month: `Tháng ${m}`,
      monthIndex: m,
      monthlyContribution: mAmount,
      activePackagesCount: currentActiveList.length,
      totalMaturedThisMonth,
      totalInterestMaturedThisMonth,
      totalPortfolioValue,
      estimatedMonthlyYield
    });
  }

  return {
    strategy,
    totalMonths: monthsCap,
    monthlySavings: mAmount,
    timelineRows,
    finalPortfolioValue: timelineRows[timelineRows.length - 1]?.totalPortfolioValue || 0,
    finalMonthlyYield: timelineRows[timelineRows.length - 1]?.estimatedMonthlyYield || 0
  };
}

/**
 * Career & Salary Growth Booster Engine
 */
export function calculateCareerGrowthImpact({
  currentSalary = 35000000,
  savingsRatePercent = 20,
  targetMonthlyInterest = 10000000,
  annualInterestRate = 6.9,
  careerOption = "JOB_HOPPING"
}) {
  const salary = num(currentSalary, 35000000, 100000, 1e12);
  const safeSavingsRate = num(savingsRatePercent, 20, 1, 95);
  const rate = num(annualInterestRate, 6.9, 0.1, 30);
  const targetInterest = num(targetMonthlyInterest, 10000000, 100000, 1e12);
  const requiredPrincipal = Math.round((targetInterest * 12 * 100) / rate);

  let currentMonthlySalary = salary;
  let currentBalance = 0;
  let monthsCount = 0;
  const annualLog = [];

  while (currentBalance < requiredPrincipal && monthsCount < 360) {
    monthsCount++;

    if (monthsCount > 1 && monthsCount % 12 === 1) {
      if (careerOption === "FIXED_RAISE") {
        currentMonthlySalary += 2000000;
      } else if (careerOption === "PERCENT_RAISE") {
        currentMonthlySalary = currentMonthlySalary * 1.10;
      }
    }

    if (careerOption === "JOB_HOPPING" && monthsCount > 1 && monthsCount % 24 === 1) {
      currentMonthlySalary = currentMonthlySalary * 1.30;
    }

    const currentMonthlySavings = Math.round((currentMonthlySalary * safeSavingsRate) / 100);
    const monthlyInterest = currentBalance * ((rate / 100) / 12);
    currentBalance = currentBalance + monthlyInterest + currentMonthlySavings;

    if (monthsCount % 12 === 0 || currentBalance >= requiredPrincipal) {
      annualLog.push({
        year: Math.ceil(monthsCount / 12),
        monthlySalary: Math.round(currentMonthlySalary),
        monthlySavings: Math.round(currentMonthlySavings),
        totalBalance: Math.round(currentBalance),
        monthlyPassiveYield: Math.round((currentBalance * (rate / 100)) / 12)
      });
    }
  }

  const yearsToGoal = Number((monthsCount / 12).toFixed(1));

  return {
    careerOption,
    requiredPrincipal,
    monthsToGoal: monthsCount,
    yearsToGoal,
    finalMonthlySalary: Math.round(currentMonthlySalary),
    annualLog
  };
}

/**
 * Advanced Inflation & Purchasing Power Converter (with exact Fisher Real Yield)
 */
export function calculateInflationImpact({
  nominalRate = 6.9,
  inflationRate = 3.5,
  targetPassiveIncome = 10000000,
  years = 10
}) {
  const safeNominal = num(nominalRate, 6.9, 0, 50);
  const safeInflation = num(inflationRate, 3.5, 0, 50);
  const safeTarget = num(targetPassiveIncome, 10000000, 0, 1e13);
  const safeYears = Math.round(num(years, 10, 1, 100));

  const realRate = Number((safeNominal - safeInflation).toFixed(2));
  const fisherRealRate = Number((((1 + safeNominal / 100) / (1 + safeInflation / 100) - 1) * 100).toFixed(2));
  const futurePurchasingPowerRatio = 1 / Math.pow(1 + safeInflation / 100, safeYears);
  const equivalentCurrentValue = Math.round(safeTarget * futurePurchasingPowerRatio);
  const inflationLossAmount = safeTarget - equivalentCurrentValue;

  return {
    nominalRate: safeNominal,
    inflationRate: safeInflation,
    realRate,
    fisherRealRate,
    years: safeYears,
    targetPassiveIncome: safeTarget,
    equivalentCurrentValue,
    inflationLossAmount,
    purchasingPowerRetainedPercent: Number((futurePurchasingPowerRatio * 100).toFixed(1))
  };
}

/**
 * Partial vs. Full Early Withdrawal Breakeven Simulator (Circular 14 / 365-day base)
 */
export function calculateEarlyWithdrawalComparison({
  principal = 100000000,
  ratePercent = 6.9,
  totalDays = 365,
  withdrawAmount = 30000000,
  daysHeld = 180,
  nonTermRate = 0.5
}) {
  const p = num(principal, 0, 0, 1e13);
  const r = num(ratePercent, 6.9, 0, 50);
  const dTotal = Math.round(num(totalDays, 365, 1, 36500));
  const w = Math.min(p, num(withdrawAmount, 0, 0, 1e13));
  const dHeld = Math.min(dTotal, Math.round(num(daysHeld, 1, 1, 36500)));
  const rNonTerm = num(nonTermRate, 0.5, 0, 20);

  const remainingPrincipal = Math.max(0, p - w);

  const holdFullInterest = Math.round((p * (r / 100) * dTotal) / 365);
  const fullEarlyInterest = Math.round((p * (rNonTerm / 100) * dHeld) / 365);
  const partialWithdrawnInterest = Math.round((w * (rNonTerm / 100) * dHeld) / 365);
  const partialRemainingInterest = Math.round((remainingPrincipal * (r / 100) * dTotal) / 365);
  const partialTotalInterest = partialWithdrawnInterest + partialRemainingInterest;

  return {
    principal: p,
    withdrawAmount: w,
    remainingPrincipal,
    daysHeld: dHeld,
    totalDays: dTotal,
    nonTermRate: rNonTerm,
    holdFullInterest,
    fullEarlyInterest,
    partialWithdrawnInterest,
    partialRemainingInterest,
    partialTotalInterest,
    interestSavedByPartial: Math.max(0, partialTotalInterest - fullEarlyInterest),
    interestLostVsMaturity: Math.max(0, holdFullInterest - partialTotalInterest)
  };
}
