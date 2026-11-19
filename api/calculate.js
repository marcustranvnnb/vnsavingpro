import {
  calculateCareerGrowthImpact,
  calculateDepositComparison,
  calculateEarlyWithdrawalComparison,
  calculateInflationImpact,
  calculatePassiveIncomeRoadmap,
  simulateLadderingMatrix,
} from './_lib/calculator.js';
import { evaluatePlanFeasibility } from './_lib/feasibilityEvaluator.js';
import { computeHouseholdAnalysis, getRecommendedEmergencyMonths } from './_lib/householdAnalytics.js';
import { readJsonBody } from './_lib/http.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';

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

  const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
  if (quotaGuard.blocked) {
    return sendPocQuotaResponse(res, quotaGuard);
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { action, payload = {} } = body || {};
  const lang = payload.lang === 'en' || payload.lang === 'ja' ? payload.lang : 'vi';
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  res.setHeader('Cache-Control', 'no-store');

  switch (action) {
    case 'quick_estimate': {
      const r = calculatePassiveIncomeRoadmap({
        targetMonthlyInterest: payload.targetMonthlyInterest,
        monthlySavingsAmount: payload.monthlySavingsAmount,
        initialCapital: payload.initialCapital ?? 0,
        annualInterestRate: payload.annualInterestRate,
        lang,
      });
      return res.status(200).json({
        timeText: r.timeText,
        requiredPrincipal: r.requiredPrincipal,
        compoundSharePct: r.compoundSharePct,
        monthsNeeded: r.monthsNeeded,
      });
    }

    case 'planner_bundle': {
      const hhMode = payload.householdMode || 'INDIVIDUAL';
      const hhDeps = Number(payload.dependentsCount) || 0;
      const hhFixedExp = Number(payload.monthlyFixedExpense) || 0;
      const hhDepCost = hhMode === 'FAMILY' ? Number(payload.monthlyDependentsCost) || 0 : 0;
      const recMonths = getRecommendedEmergencyMonths(hhMode, hhDeps);
      const overrideMonths = Number(payload.emergencyFundMonths) || 0;
      const targetEfMonths = overrideMonths >= 3 ? overrideMonths : recMonths;
      const efTarget = Math.round((hhFixedExp + hhDepCost) * targetEfMonths);
      const prioritizeEf = Boolean(payload.prioritizeEmergencyFund);

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
        tenureCode: payload.tenureCode || '12M',
        annualStepUpPct: payload.annualStepUpPct ?? 0,
        annualBonusAmount: payload.annualBonusAmount ?? 0,
        inflationRatePct: payload.inflationRatePct ?? 0,
        prioritizeEmergencyFund: prioritizeEf,
        emergencyFundTarget: prioritizeEf ? efTarget : 0,
        emergencyFundRate: Number(payload.emergencyFundRate) || 4.75,
        lang,
      };

      const roadmap = calculatePassiveIncomeRoadmap(baseArgs);

      const householdAnalysis = {
        ...computeHouseholdAnalysis({
          householdMode: hhMode,
          dependentsCount: hhDeps,
          earner1Income: payload.earner1Income ?? payload.currentSalary,
          earner1IncomeMin: payload.earner1IncomeMin,
          earner1IncomeMax: payload.earner1IncomeMax,
          earner2Income: payload.earner2Income ?? 0,
          earner2IncomeMin: payload.earner2IncomeMin,
          earner2IncomeMax: payload.earner2IncomeMax,
          monthlyFixedExpense: hhFixedExp,
          monthlyDependentsCost: hhDepCost,
          contributionRule: payload.contributionRule || 'PROPORTIONAL',
          earner1SharePct: payload.earner1SharePct ?? 50,
          initialCapital: payload.initialCapital,
          monthlySavings: roadmap.requiredMonthlyDeposit,
          passiveIncomeAtGoal: roadmap.finalMonthlyPassiveIncome || roadmap.baseMonthlyInterest,
          emergencyFundMonthsOverride: overrideMonths,
          emergencyFundRate: Number(payload.emergencyFundRate) || 4.75,
          annualStepUpPct: baseArgs.annualStepUpPct,
          annualBonusAmount: baseArgs.annualBonusAmount,
          lang,
        }),
        prioritizeEmergencyFund: prioritizeEf,
      };

      const feasibility = evaluatePlanFeasibility({
        monthlySalary: baseArgs.currentSalary,
        monthlySavings: roadmap.requiredMonthlyDeposit,
        yearsToGoal: roadmap.yearsNeeded,
        realYieldRate: Math.max(0, Number(baseArgs.annualInterestRate || 0) - (Number(baseArgs.inflationRatePct) || 3.5)),
        incomeMin: payload.totalIncomeMin ?? null,
        incomeMax: payload.totalIncomeMax ?? null,
        hasExtraIncome: Boolean(payload.hasExtraIncome),
        householdAnalysis,
        lang,
      });

      const saving = Number(baseArgs.monthlySavingsAmount) || 0;
      const capital = Number(baseArgs.initialCapital) || 0;
      const rate = Number(baseArgs.annualInterestRate) || 6;
      const years = Math.min(50, Math.max(1, Number(baseArgs.targetYears) || 5));

      let scenarios;
      if (roadmap.solveMode === 'SAVING') {
        const s1 = calculatePassiveIncomeRoadmap({ ...baseArgs, targetYears: Math.min(50, years + 2) });
        const s2 = calculatePassiveIncomeRoadmap({ ...baseArgs, initialCapital: capital + 50_000_000 });
        const stepUpTarget = Math.max(10, Number(baseArgs.annualStepUpPct || 0) + 5);
        const s3 =
          payload.topForTenure && payload.topForTenure.rate > rate
            ? calculatePassiveIncomeRoadmap({ ...baseArgs, annualInterestRate: payload.topForTenure.rate })
            : calculatePassiveIncomeRoadmap({
                ...baseArgs,
                annualStepUpPct: stepUpTarget,
              });
        const s3Title =
          payload.topForTenure && payload.topForTenure.rate > rate
            ? lx(
                `Chuyển sang ${payload.topForTenure.bankName} ${payload.topForTenure.rateLabel}`,
                `Switch to ${payload.topForTenure.bankName} ${payload.topForTenure.rateLabel}`,
                `${payload.topForTenure.bankName} (${payload.topForTenure.rateLabel}) に変更`
              )
            : lx(
                `Tăng mức gửi +${stepUpTarget}%/năm`,
                `Increase deposits +${stepUpTarget}%/yr`,
                `毎年 +${stepUpTarget}% 増額積立`
              );

        const extYears = Math.min(50, years + 2);
        scenarios = [
          {
            title: lx(
              `Kéo dài thời hạn lên ${extYears} năm`,
              `Extend horizon to ${extYears} years`,
              `目標期間を${extYears}年に延長`
            ),
            r: {
              monthsNeeded: s1.monthsNeeded,
              timeText: s1.timeText,
              requiredMonthlyDeposit: s1.requiredMonthlyDeposit,
              savedMonthly: Math.max(0, roadmap.requiredMonthlyDeposit - s1.requiredMonthlyDeposit),
            },
          },
          {
            title: lx('Thêm 50 triệu vốn ban đầu', 'Add 50M VND initial capital', '初期元本を5,000万VND追加'),
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
          s3Title = lx(
            `Chuyển sang ${payload.topForTenure.bankName} ${payload.topForTenure.rateLabel}`,
            `Switch to ${payload.topForTenure.bankName} ${payload.topForTenure.rateLabel}`,
            `${payload.topForTenure.bankName} (${payload.topForTenure.rateLabel}) に変更`
          );
        } else if (Number(baseArgs.annualStepUpPct || 0) === 0) {
          s3 = calculatePassiveIncomeRoadmap({ ...baseArgs, annualStepUpPct: 10 });
          s3Title = lx('Tăng mức gửi +10% mỗi năm', 'Increase deposits +10% annually', '毎年 +10% 増額積立');
        } else {
          s3 = calculatePassiveIncomeRoadmap({ ...baseArgs, initialCapital: capital + 50_000_000 });
          s3Title = lx('Thêm 50 triệu vốn ban đầu', 'Add 50M VND initial capital', '初期元本を5,000万VND追加');
        }

        scenarios = [
          {
            title: lx('Tiết kiệm thêm 1 triệu/tháng', 'Save +1M VND more / month', '毎月さらに100万VND積立'),
            r: { monthsNeeded: s1.monthsNeeded, timeText: s1.timeText },
          },
          {
            title: lx('Tiết kiệm thêm 3 triệu/tháng', 'Save +3M VND more / month', '毎月さらに300万VND積立'),
            r: { monthsNeeded: s2.monthsNeeded, timeText: s2.timeText },
          },
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
        householdAnalysis,
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
        lang,
      });
      return res.status(200).json(result);
    }

    case 'career': {
      const options = ['FIXED_RAISE', 'PERCENT_RAISE', 'JOB_HOPPING'];
      const results = {};
      for (const opt of options) {
        results[opt] = calculateCareerGrowthImpact({
          currentSalary: payload.currentSalary,
          partnerSalary: payload.partnerSalary ?? 0,
          partnerGrowthMode: payload.partnerGrowthMode || 'SAME',
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
