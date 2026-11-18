import { TENURE_DAYS_MAP } from '../../src/data/banksData.js';

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
  const p = Number(principal) || 0;
  const r = Number(ratePercent) || 0;

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
  const p = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(ratePercent) || 0);
  const months = parseInt(tenureCode, 10) || 12;
  const defaultDays = TENURE_DAYS_MAP[tenureCode] || 365;
  const days = customDays !== null && customDays !== '' && Number(customDays) > 0 ? Number(customDays) : defaultDays;

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

/**
 * Passive Income & Target Savings Roadmap Solver
 * Supports 2 goal types (`PASSIVE_INCOME` | `TARGET_AMOUNT`),
 * bidirectional solving (`TIME` | `SAVING`), plus step-up deposits,
 * annual bonus lump sums, and inflation adjustment.
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
  annualStepUpPct = 0,
  annualBonusAmount = 0,
  inflationRatePct = 0,
}) {
  const normalizedGoal = goalType === 'TARGET_AMOUNT' ? 'TARGET_AMOUNT' : 'PASSIVE_INCOME';
  const normalizedSolve = solveMode === 'SAVING' ? 'SAVING' : 'TIME';
  const salary = Math.max(0, Number(currentSalary) || 35000000);
  const inputMonthlyDeposit = Math.max(0, Number(monthlySavingsAmount) || 0);
  const p0 = Math.max(0, Number(initialCapital) || 0);
  const rate = Math.max(0.1, Number(annualInterestRate) || 6.0);
  const stepUp = Math.min(50, Math.max(0, Number(annualStepUpPct) || 0));
  const bonus = Math.max(0, Number(annualBonusAmount) || 0);
  const inflation = Math.min(20, Math.max(0, Number(inflationRatePct) || 0));

  const monthlyFactor = calculationMode === 'ACTUAL_DAYS' ? 30 / 365 : 1 / 12;
  const i = (rate / 100) * monthlyFactor;

  let nominalRequiredPrincipal;
  let baseMonthlyInterest;
  if (normalizedGoal === 'TARGET_AMOUNT') {
    nominalRequiredPrincipal = Math.max(1_000_000, Math.round(Number(targetAmount) || 500_000_000));
    baseMonthlyInterest = Math.round(nominalRequiredPrincipal * i);
  } else {
    baseMonthlyInterest = Math.max(100_000, Math.round(Number(targetMonthlyInterest) || 10_000_000));
    nominalRequiredPrincipal = Math.round(baseMonthlyInterest / i);
  }

  let monthsNeeded = 0;
  let currentBalance = p0;
  let depositedSoFar = p0;
  let requiredPrincipal = nominalRequiredPrincipal;
  let requiredMonthlyDeposit = inputMonthlyDeposit;
  let isAlreadyReached = p0 >= nominalRequiredPrincipal;
  const monthByMonthLog = [];

  if (normalizedSolve === 'SAVING') {
    const safeYears = Math.min(50, Math.max(1, Number(targetYears) || 5));
    const targetMonths = Math.min(600, Math.max(12, Math.round(safeYears * 12)));
    const inflationMultiplier = Math.pow(1 + inflation / 100, targetMonths / 12);
    requiredPrincipal = Math.round(nominalRequiredPrincipal * inflationMultiplier);
    isAlreadyReached = p0 >= requiredPrincipal;

    if (isAlreadyReached) {
      requiredMonthlyDeposit = 0;
      monthsNeeded = 0;
      monthByMonthLog.push({
        month: 0,
        year: 0,
        principalDeposited: p0,
        interestEarnedTotal: 0,
        totalBalance: p0,
        monthlyPassiveIncomeGenerated: Math.round(p0 * i),
      });
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

      monthByMonthLog.push({
        month: 0,
        year: 0,
        principalDeposited: p0,
        interestEarnedTotal: 0,
        totalBalance: p0,
        monthlyPassiveIncomeGenerated: Math.round(p0 * i),
      });

      for (let m = 1; m <= targetMonths; m++) {
        const yearIdx = Math.floor((m - 1) / 12);
        const depositThisMonth = Math.round(requiredMonthlyDeposit * Math.pow(1 + stepUp / 100, yearIdx));
        const bonusThisMonth = m % 12 === 0 ? bonus : 0;
        currentBalance = currentBalance * (1 + i) + depositThisMonth + bonusThisMonth;
        depositedSoFar += depositThisMonth + bonusThisMonth;

        monthByMonthLog.push({
          month: m,
          year: Number((m / 12).toFixed(1)),
          principalDeposited: Math.round(depositedSoFar),
          interestEarnedTotal: Math.round(Math.max(0, currentBalance - depositedSoFar)),
          totalBalance: Math.round(currentBalance),
          monthlyPassiveIncomeGenerated: Math.round(currentBalance * i),
        });
      }
      monthsNeeded = targetMonths;
    }
  } else {
    requiredMonthlyDeposit = inputMonthlyDeposit;

    if (isAlreadyReached) {
      monthsNeeded = 0;
      monthByMonthLog.push({
        month: 0,
        year: 0,
        principalDeposited: p0,
        interestEarnedTotal: 0,
        totalBalance: p0,
        monthlyPassiveIncomeGenerated: Math.round(p0 * i),
      });
    } else if (inputMonthlyDeposit <= 0 && bonus <= 0 && p0 <= 0) {
      monthsNeeded = 999;
    } else {
      monthByMonthLog.push({
        month: 0,
        year: 0,
        principalDeposited: p0,
        interestEarnedTotal: 0,
        totalBalance: p0,
        monthlyPassiveIncomeGenerated: Math.round(p0 * i),
      });

      while (monthsNeeded < 720) {
        monthsNeeded++;
        const yearIdx = Math.floor((monthsNeeded - 1) / 12);
        const depositThisMonth = Math.round(inputMonthlyDeposit * Math.pow(1 + stepUp / 100, yearIdx));
        const bonusThisMonth = monthsNeeded % 12 === 0 ? bonus : 0;
        const targetAtMonth = Math.round(nominalRequiredPrincipal * Math.pow(1 + inflation / 100, monthsNeeded / 12));

        currentBalance = currentBalance * (1 + i) + depositThisMonth + bonusThisMonth;
        depositedSoFar += depositThisMonth + bonusThisMonth;
        requiredPrincipal = targetAtMonth;

        monthByMonthLog.push({
          month: monthsNeeded,
          year: Number((monthsNeeded / 12).toFixed(1)),
          principalDeposited: Math.round(depositedSoFar),
          interestEarnedTotal: Math.round(Math.max(0, currentBalance - depositedSoFar)),
          totalBalance: Math.round(currentBalance),
          monthlyPassiveIncomeGenerated: Math.round(currentBalance * i),
        });

        if (currentBalance >= targetAtMonth) {
          break;
        }
      }
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
  const mAmount = Number(monthlySavings) || 1000000;
  const monthsCap = Math.min(60, Math.max(1, Number(totalMonths) || 12));
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
  const salary = Number(currentSalary) || 35000000;
  const rate = Math.max(0.1, Number(annualInterestRate) || 6.9);
  const targetInterest = Number(targetMonthlyInterest) || 10000000;
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

    const currentMonthlySavings = Math.round((currentMonthlySalary * savingsRatePercent) / 100);
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
  const realRate = Number((nominalRate - inflationRate).toFixed(2));
  const fisherRealRate = Number((((1 + nominalRate / 100) / (1 + inflationRate / 100) - 1) * 100).toFixed(2));
  const futurePurchasingPowerRatio = 1 / Math.pow(1 + inflationRate / 100, years);
  const equivalentCurrentValue = Math.round(targetPassiveIncome * futurePurchasingPowerRatio);
  const inflationLossAmount = targetPassiveIncome - equivalentCurrentValue;

  return {
    nominalRate,
    inflationRate,
    realRate,
    fisherRealRate,
    years,
    targetPassiveIncome,
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
  const p = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(ratePercent) || 0);
  const dTotal = Math.max(1, Number(totalDays) || 365);
  const w = Math.min(p, Math.max(0, Number(withdrawAmount) || 0));
  const dHeld = Math.min(dTotal, Math.max(1, Number(daysHeld) || 1));
  const rNonTerm = Math.max(0, Number(nonTermRate) || 0.5);

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
