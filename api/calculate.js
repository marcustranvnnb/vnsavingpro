import {
  calculateCareerGrowthImpact,
  calculateDepositComparison,
  calculateEarlyWithdrawalComparison,
  calculateInflationImpact,
  calculatePassiveIncomeRoadmap,
  simulateLadderingMatrix,
} from './_lib/calculator.js';
import { evaluatePlanFeasibility } from './_lib/feasibilityEvaluator.js';
import { readJsonBody } from './_lib/http.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const ipHits = new Map();

function isRateLimited(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { action, payload = {} } = body || {};
  res.setHeader('Cache-Control', 'no-store');

  switch (action) {
    case 'quick_estimate': {
      const r = calculatePassiveIncomeRoadmap({
        targetMonthlyInterest: payload.targetMonthlyInterest,
        monthlySavingsAmount: payload.monthlySavingsAmount,
        initialCapital: payload.initialCapital ?? 0,
        annualInterestRate: payload.annualInterestRate,
      });
      return res.status(200).json({
        timeText: r.timeText,
        requiredPrincipal: r.requiredPrincipal,
        compoundSharePct: r.compoundSharePct,
        monthsNeeded: r.monthsNeeded,
      });
    }

    case 'planner_bundle': {
      const baseArgs = {
        goalType: payload.goalType || 'PASSIVE_INCOME',
        targetMonthlyInterest: payload.targetMonthlyInterest,
        targetAmount: payload.targetAmount,
        solveMode: payload.solveMode || 'TIME',
        targetYears: payload.targetYears,
        currentSalary: payload.currentSalary,
        monthlySavingsAmount: payload.monthlySavingsAmount,
        initialCapital: payload.initialCapital,
        annualInterestRate: payload.annualInterestRate,
        calculationMode: payload.calculationMode || 'NOMINAL_MONTHS',
        annualStepUpPct: payload.annualStepUpPct ?? 0,
        annualBonusAmount: payload.annualBonusAmount ?? 0,
        inflationRatePct: payload.inflationRatePct ?? 0,
      };

      const roadmap = calculatePassiveIncomeRoadmap(baseArgs);

      const feasibility = evaluatePlanFeasibility({
        monthlySalary: baseArgs.currentSalary,
        monthlySavings: roadmap.requiredMonthlyDeposit,
        yearsToGoal: roadmap.yearsNeeded,
        realYieldRate: Math.max(0, Number(baseArgs.annualInterestRate || 0) - (Number(baseArgs.inflationRatePct) || 3.5)),
      });

      const saving = Number(baseArgs.monthlySavingsAmount) || 0;
      const capital = Number(baseArgs.initialCapital) || 0;
      const rate = Number(baseArgs.annualInterestRate) || 6;
      const years = Math.min(50, Math.max(1, Number(baseArgs.targetYears) || 5));

      let scenarios;
      if (roadmap.solveMode === 'SAVING') {
        const s1 = calculatePassiveIncomeRoadmap({ ...baseArgs, targetYears: Math.min(50, years + 2) });
        const s2 = calculatePassiveIncomeRoadmap({ ...baseArgs, initialCapital: capital + 50_000_000 });
        const s3 =
          payload.topForTenure && payload.topForTenure.rate > rate
            ? calculatePassiveIncomeRoadmap({ ...baseArgs, annualInterestRate: payload.topForTenure.rate })
            : calculatePassiveIncomeRoadmap({
                ...baseArgs,
                annualStepUpPct: Math.max(10, Number(baseArgs.annualStepUpPct || 0) + 5),
              });
        const s3Title =
          payload.topForTenure && payload.topForTenure.rate > rate
            ? `Chuyển sang ${payload.topForTenure.bankName} ${payload.topForTenure.rateLabel}`
            : `Tăng mức gửi +${Math.max(10, Number(baseArgs.annualStepUpPct || 0) + 5)}%/năm`;

        scenarios = [
          {
            title: `Kéo dài thời hạn lên ${Math.min(50, years + 2)} năm`,
            r: {
              monthsNeeded: s1.monthsNeeded,
              timeText: s1.timeText,
              requiredMonthlyDeposit: s1.requiredMonthlyDeposit,
              savedMonthly: Math.max(0, roadmap.requiredMonthlyDeposit - s1.requiredMonthlyDeposit),
            },
          },
          {
            title: 'Thêm 50 triệu vốn ban đầu',
            r: {
              monthsNeeded: s2.monthsNeeded,
              timeText: s2.timeText,
              requiredMonthlyDeposit: s2.requiredMonthlyDeposit,
              savedMonthly: Math.max(0, roadmap.requiredMonthlyDeposit - s2.requiredMonthlyDeposit),
            },
          },
          {
            title: s3Title,
            r: {
              monthsNeeded: s3.monthsNeeded,
              timeText: s3.timeText,
              requiredMonthlyDeposit: s3.requiredMonthlyDeposit,
              savedMonthly: Math.max(0, roadmap.requiredMonthlyDeposit - s3.requiredMonthlyDeposit),
            },
          },
        ];
      } else {
        const s1 = calculatePassiveIncomeRoadmap({ ...baseArgs, monthlySavingsAmount: saving + 1_000_000 });
        const s2 = calculatePassiveIncomeRoadmap({ ...baseArgs, monthlySavingsAmount: saving + 3_000_000 });
        let s3;
        let s3Title;
        if (payload.topForTenure && payload.topForTenure.rate > rate) {
          s3 = calculatePassiveIncomeRoadmap({ ...baseArgs, annualInterestRate: payload.topForTenure.rate });
          s3Title = `Chuyển sang ${payload.topForTenure.bankName} ${payload.topForTenure.rateLabel}`;
        } else if (Number(baseArgs.annualStepUpPct || 0) === 0) {
          s3 = calculatePassiveIncomeRoadmap({ ...baseArgs, annualStepUpPct: 10 });
          s3Title = 'Tăng mức gửi +10% mỗi năm';
        } else {
          s3 = calculatePassiveIncomeRoadmap({ ...baseArgs, initialCapital: capital + 50_000_000 });
          s3Title = 'Thêm 50 triệu vốn ban đầu';
        }

        scenarios = [
          { title: 'Tiết kiệm thêm 1 triệu/tháng', r: { monthsNeeded: s1.monthsNeeded, timeText: s1.timeText } },
          { title: 'Tiết kiệm thêm 3 triệu/tháng', r: { monthsNeeded: s2.monthsNeeded, timeText: s2.timeText } },
          { title: s3Title, r: { monthsNeeded: s3.monthsNeeded, timeText: s3.timeText } },
        ];
      }

      const bankList = Array.isArray(payload.bankComparisons) ? payload.bankComparisons : [];
      const bankRuns = bankList
        .map((item) => {
          const resBank = calculatePassiveIncomeRoadmap({ ...baseArgs, annualInterestRate: item.bestRate });
          return {
            bankId: item.bankId,
            tenure: item.bestTenure,
            rate: item.bestRate,
            monthsNeeded: resBank.monthsNeeded,
            requiredMonthlyDeposit: resBank.requiredMonthlyDeposit,
          };
        })
        .sort((a, b) =>
          roadmap.solveMode === 'SAVING'
            ? a.requiredMonthlyDeposit - b.requiredMonthlyDeposit
            : a.monthsNeeded - b.monthsNeeded
        );

      return res.status(200).json({
        roadmap,
        feasibility,
        scenarios,
        bankRuns,
      });
    }

    case 'calculator_bundle': {
      const comparison = calculateDepositComparison({
        principal: payload.principal,
        ratePercent: payload.rate,
        tenureCode: payload.tenure,
        customDays: payload.customDays,
      });
      const earlySim = calculateEarlyWithdrawalComparison({
        principal: payload.principal,
        ratePercent: payload.rate,
        totalDays: comparison.days,
        withdrawAmount: payload.withdrawAmount,
        daysHeld: payload.daysHeld,
        nonTermRate: 0.5,
      });
      return res.status(200).json({
        ...comparison,
        earlySim,
      });
    }

    case 'ladder': {
      const result = simulateLadderingMatrix({
        monthlySavings: payload.monthlySavings,
        strategy: payload.strategy,
        customAllocations: payload.customAllocations,
        totalMonths: payload.totalMonths,
        bankRates: payload.bankRates,
      });
      return res.status(200).json(result);
    }

    case 'career': {
      const options = ['FIXED_RAISE', 'PERCENT_RAISE', 'JOB_HOPPING'];
      const results = {};
      for (const opt of options) {
        results[opt] = calculateCareerGrowthImpact({
          currentSalary: payload.currentSalary,
          savingsRatePercent: payload.savingsRatePercent,
          targetMonthlyInterest: payload.targetMonthlyInterest,
          annualInterestRate: payload.annualInterestRate,
          careerOption: opt,
        });
      }
      return res.status(200).json({ results });
    }

    case 'inflation': {
      const nominalRate = Number(payload.nominalRate) || 0;
      const inflationRate = Number(payload.inflationRate) || 0;
      const targetIncome = Number(payload.targetPassiveIncome) || 0;
      const years = Math.min(30, Math.max(1, Number(payload.years) || 10));

      const impact = calculateInflationImpact({
        nominalRate,
        inflationRate,
        targetPassiveIncome: targetIncome,
        years,
      });
      const futureNominalNeeded = Math.round(targetIncome * Math.pow(1 + inflationRate / 100, years));
      const rows = [];
      for (let y = 1; y <= years; y++) {
        const ratio = 1 / Math.pow(1 + inflationRate / 100, y);
        rows.push({
          year: y,
          nominal: targetIncome,
          realValue: Math.round(targetIncome * ratio),
          retainedPct: Number((ratio * 100).toFixed(1)),
          neededForSamePower: Math.round(targetIncome * Math.pow(1 + inflationRate / 100, y)),
        });
      }
      return res.status(200).json({ impact, futureNominalNeeded, rows });
    }

    default:
      return res.status(400).json({ error: `Unknown calculation action: ${action}` });
  }
}
