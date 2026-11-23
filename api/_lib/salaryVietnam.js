/**
 * Server-Only Vietnam Statutory Payroll, Personal Income Tax (PIT),
 * Social Insurance (BHXH 41/2024/QH15), Employment Law (74/2025/QH15),
 * Regional Minimum Wages (NĐ 293/2025 & NĐ 399/2026), Base/Reference Salary (NĐ 161/2026),
 * and PIT Reform (Luật 109/2025/QH15 + NQ 110/2025/UBTVQH15) Engine.
 */

const LEGAL_REGIMES = {
  '2026_H2': {
    id: '2026_H2',
    effectiveLabel: '01/07/2026 – 31/12/2026',
    personalDeduction: 15_500_000,
    dependentDeduction: 6_200_000,
    referenceSalary: 2_530_000, // Mức tham chiếu / Lương cơ sở (NĐ 161/2026/NĐ-CP)
    regionalMinWage: {
      1: 5_310_000, // NĐ 293/2025/NĐ-CP
      2: 4_730_000,
      3: 4_140_000,
      4: 3_700_000,
    },
    brackets: [
      { id: 1, upTo: 10_000_000, rate: 0.05 }, // Luật Thuế TNCN 109/2025/QH15 (5 bậc)
      { id: 2, upTo: 30_000_000, rate: 0.1 },
      { id: 3, upTo: 60_000_000, rate: 0.2 },
      { id: 4, upTo: 100_000_000, rate: 0.3 },
      { id: 5, upTo: Infinity, rate: 0.35 },
    ],
    pitLegalRef: 'Luật Thuế TNCN 109/2025/QH15 (5 bậc) & NQ 110/2025/UBTVQH15',
    bhxhLegalRef: 'Luật BHXH 41/2024/QH15 · NĐ 161/2026/NĐ-CP · NĐ 293/2025/NĐ-CP · Luật Việc làm 74/2025/QH15',
  },
  '2027': {
    id: '2027',
    effectiveLabel: 'Từ 01/01/2027',
    personalDeduction: 15_500_000,
    dependentDeduction: 6_200_000,
    referenceSalary: 2_530_000,
    regionalMinWage: {
      1: 5_700_000, // NĐ 399/2026/NĐ-CP
      2: 5_080_000,
      3: 4_450_000,
      4: 4_040_000,
    },
    brackets: [
      { id: 1, upTo: 10_000_000, rate: 0.05 },
      { id: 2, upTo: 30_000_000, rate: 0.1 },
      { id: 3, upTo: 60_000_000, rate: 0.2 },
      { id: 4, upTo: 100_000_000, rate: 0.3 },
      { id: 5, upTo: Infinity, rate: 0.35 },
    ],
    pitLegalRef: 'Luật Thuế TNCN 109/2025/QH15 (5 bậc) & NQ 110/2025/UBTVQH15',
    bhxhLegalRef: 'NĐ 399/2026/NĐ-CP (Lương tối thiểu vùng 2027) · Luật BHXH 41/2024/QH15',
  },
  '2025': {
    id: '2025',
    effectiveLabel: 'Quy định cũ (trước 2026 để đối chiếu)',
    personalDeduction: 11_000_000,
    dependentDeduction: 4_400_000,
    referenceSalary: 2_340_000, // NĐ 73/2024/NĐ-CP
    regionalMinWage: {
      1: 4_960_000, // NĐ 74/2024/NĐ-CP
      2: 4_410_000,
      3: 3_860_000,
      4: 3_450_000,
    },
    brackets: [
      { id: 1, upTo: 5_000_000, rate: 0.05 },
      { id: 2, upTo: 10_000_000, rate: 0.1 },
      { id: 3, upTo: 18_000_000, rate: 0.15 },
      { id: 4, upTo: 32_000_000, rate: 0.2 },
      { id: 5, upTo: 52_000_000, rate: 0.25 },
      { id: 6, upTo: 80_000_000, rate: 0.3 },
      { id: 7, upTo: Infinity, rate: 0.35 },
    ],
    pitLegalRef: 'Luật cũ (7 bậc) & NQ 954/2020/UBTVQH14 (11tr / 4,4tr)',
    bhxhLegalRef: 'NĐ 73/2024/NĐ-CP & NĐ 74/2024/NĐ-CP',
  },
};

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getRegime(regimeKey) {
  return LEGAL_REGIMES[regimeKey] || LEGAL_REGIMES['2026_H2'];
}

function computeProgressivePit(taxableIncome, brackets) {
  if (taxableIncome <= 0) {
    return {
      totalPit: 0,
      rows: brackets.map((b, idx) => ({
        bracket: b.id,
        from: idx === 0 ? 0 : brackets[idx - 1].upTo,
        to: b.upTo === Infinity ? null : b.upTo,
        ratePct: Math.round(b.rate * 100),
        taxableSlice: 0,
        taxAmount: 0,
      })),
    };
  }

  let prevLimit = 0;
  let totalPit = 0;
  const rows = [];

  for (const b of brackets) {
    const cap = b.upTo;
    const width = cap === Infinity ? Infinity : cap - prevLimit;
    const slice = taxableIncome > prevLimit ? Math.min(taxableIncome - prevLimit, width) : 0;
    const taxAmount = Math.round(slice * b.rate);
    totalPit += taxAmount;
    rows.push({
      bracket: b.id,
      from: prevLimit,
      to: cap === Infinity ? null : cap,
      ratePct: Math.round(b.rate * 100),
      taxableSlice: Math.round(slice),
      taxAmount,
    });
    prevLimit = cap;
  }

  return { totalPit, rows };
}

function solveGrossToNetSingle({
  gross,
  region = 1,
  dependents = 0,
  insuranceBaseMode = 'FULL',
  customInsuranceBase = 0,
  taxExemptAllowance = 0,
  regime = '2026_H2',
  includeUnionFee = false,
}) {
  const cfg = getRegime(regime);
  const regId = [1, 2, 3, 4].includes(Number(region)) ? Number(region) : 1;
  const minWage = cfg.regionalMinWage[regId];
  const bhxhCap = 20 * cfg.referenceSalary;
  const bhtnCap = 20 * minWage;
  const deps = Math.max(0, Math.min(20, Math.round(toNum(dependents, 0))));
  const cleanGross = Math.max(0, Math.round(toNum(gross, 0)));
  const cleanExempt = Math.max(0, Math.min(cleanGross, Math.round(toNum(taxExemptAllowance, 0))));

  let rawInsBase = cleanGross - cleanExempt;
  if (insuranceBaseMode === 'CUSTOM') {
    rawInsBase = Math.max(0, Math.round(toNum(customInsuranceBase, 0)));
  } else if (insuranceBaseMode === 'MIN_WAGE') {
    rawInsBase = minWage;
  }

  const bhxhSalaryBase = cleanGross > 0 ? Math.min(Math.max(rawInsBase, minWage), bhxhCap) : 0;
  const bhtnSalaryBase = cleanGross > 0 ? Math.min(Math.max(rawInsBase, minWage), bhtnCap) : 0;

  // Employee contributions: 8% BHXH + 1.5% BHYT + 1% BHTN
  const empBhxh = Math.round(bhxhSalaryBase * 0.08);
  const empBhyt = Math.round(bhxhSalaryBase * 0.015);
  const empBhtn = Math.round(bhtnSalaryBase * 0.01);
  const empTotalInsurance = empBhxh + empBhyt + empBhtn;

  const personalDeduction = cfg.personalDeduction;
  const dependentDeduction = deps * cfg.dependentDeduction;
  const totalFamilyDeductions = personalDeduction + dependentDeduction;

  const taxableGross = Math.max(0, cleanGross - cleanExempt);
  const incomeBeforeTax = Math.max(0, taxableGross - empTotalInsurance);
  const taxableIncome = Math.max(0, incomeBeforeTax - totalFamilyDeductions);

  const pit = computeProgressivePit(taxableIncome, cfg.brackets);
  const net = Math.max(0, cleanGross - empTotalInsurance - pit.totalPit);

  // Employer contributions: 17.5% BHXH + 3% BHYT + 1% BHTN (+ optional 2% Trade Union fee)
  const erBhxh = Math.round(bhxhSalaryBase * 0.175);
  const erBhyt = Math.round(bhxhSalaryBase * 0.03);
  const erBhtn = Math.round(bhtnSalaryBase * 0.01);
  const erUnionFee = includeUnionFee ? Math.round(bhxhSalaryBase * 0.02) : 0;
  const erTotalContributions = erBhxh + erBhyt + erBhtn + erUnionFee;
  const employerTotalCost = cleanGross + erTotalContributions;

  return {
    regimeId: cfg.id,
    effectiveLabel: cfg.effectiveLabel,
    pitLegalRef: cfg.pitLegalRef,
    bhxhLegalRef: cfg.bhxhLegalRef,
    gross: cleanGross,
    net,
    taxExemptAllowance: cleanExempt,
    region: regId,
    regionalMinWage: minWage,
    referenceSalary: cfg.referenceSalary,
    bhxhCap,
    bhtnCap,
    bhxhSalaryBase,
    bhtnSalaryBase,
    employee: {
      bhxh: empBhxh,
      bhyt: empBhyt,
      bhtn: empBhtn,
      totalInsurance: empTotalInsurance,
      personalDeduction,
      dependentDeduction,
      totalFamilyDeductions,
      incomeBeforeTax,
      taxableIncome,
      pit: pit.totalPit,
      brackets: pit.rows,
      effectiveTaxRatePct: cleanGross > 0 ? Number(((pit.totalPit / cleanGross) * 100).toFixed(2)) : 0,
    },
    employer: {
      bhxh: erBhxh,
      bhyt: erBhyt,
      bhtn: erBhtn,
      unionFee: erUnionFee,
      totalContributions: erTotalContributions,
      totalCost: employerTotalCost,
    },
  };
}

function solveNetToGrossSingle(params) {
  const targetNet = Math.max(0, Math.round(toNum(params.amount, 0)));
  if (targetNet <= 0) {
    return solveGrossToNetSingle({ ...params, gross: 0 });
  }

  let low = targetNet;
  let high = Math.round(targetNet * 1.85 + 60_000_000);

  for (let i = 0; i < 65; i++) {
    const mid = Math.round((low + high) / 2);
    const probe = solveGrossToNetSingle({ ...params, gross: mid });
    if (probe.net < targetNet) {
      low = mid + 1;
    } else {
      high = mid;
    }
    if (high - low <= 1) break;
  }

  // Pick closest match around [low - 2 .. high + 2]
  let best = solveGrossToNetSingle({ ...params, gross: high });
  let bestDiff = Math.abs(best.net - targetNet);
  for (let g = Math.max(targetNet, low - 2); g <= high + 2; g++) {
    const cand = solveGrossToNetSingle({ ...params, gross: g });
    const diff = Math.abs(cand.net - targetNet);
    if (diff < bestDiff) {
      best = cand;
      bestDiff = diff;
    }
  }
  return best;
}

export function calculateVietnamSalary(payload = {}) {
  const lang = payload.lang === 'en' || payload.lang === 'ja' ? payload.lang : 'vi';
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  const mode = payload.mode === 'NET_TO_GROSS' ? 'NET_TO_GROSS' : 'GROSS_TO_NET';
  const regime = LEGAL_REGIMES[payload.regime] ? payload.regime : '2026_H2';
  const amount = Math.max(0, Math.round(toNum(payload.amount, 30_000_000)));
  const partnerAmount = Math.max(0, Math.round(toNum(payload.partnerAmount, 0)));
  const householdMode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(payload.householdMode)
    ? payload.householdMode
    : 'INDIVIDUAL';

  const singleArgs = {
    amount,
    gross: amount,
    region: payload.region ?? 1,
    dependents: payload.dependents ?? 0,
    insuranceBaseMode: payload.insuranceBaseMode || 'FULL',
    customInsuranceBase: payload.customInsuranceBase ?? 0,
    taxExemptAllowance: payload.taxExemptAllowance ?? 0,
    regime,
    includeUnionFee: Boolean(payload.includeUnionFee),
  };

  const primary =
    mode === 'NET_TO_GROSS'
      ? solveNetToGrossSingle(singleArgs)
      : solveGrossToNetSingle(singleArgs);

  // Compare primary Gross against 2025 legacy law & 2026 H2 law
  const legacy2025 = solveGrossToNetSingle({
    ...singleArgs,
    gross: primary.gross,
    regime: '2025',
  });
  const law2026 = solveGrossToNetSingle({
    ...singleArgs,
    gross: primary.gross,
    regime: '2026_H2',
  });

  const pitSavingsMonthly = Math.max(0, legacy2025.employee.pit - law2026.employee.pit);
  const pitSavingsAnnual = pitSavingsMonthly * 12;

  let partnerResult = null;
  if ((householdMode === 'COUPLE' || householdMode === 'FAMILY') && partnerAmount > 0) {
    const partnerArgs = {
      amount: partnerAmount,
      gross: partnerAmount,
      region: payload.region ?? 1,
      dependents: 0,
      insuranceBaseMode: payload.insuranceBaseMode || 'FULL',
      customInsuranceBase: payload.customInsuranceBase ?? 0,
      taxExemptAllowance: 0,
      regime,
      includeUnionFee: Boolean(payload.includeUnionFee),
    };
    partnerResult =
      mode === 'NET_TO_GROSS'
        ? solveNetToGrossSingle(partnerArgs)
        : solveGrossToNetSingle(partnerArgs);
  }

  const householdCombinedNet = primary.net + (partnerResult?.net || 0);
  const householdCombinedPit = primary.employee.pit + (partnerResult?.employee?.pit || 0);
  const suggestedMonthlySaving30Pct = Math.round(householdCombinedNet * 0.3);

  const summary =
    pitSavingsMonthly > 0
      ? lx(
          `Theo Luật Thuế TNCN 109/2025 (5 bậc) & NQ 110/2025 (15,5tr / 6,2tr), bạn tiết kiệm được ${pitSavingsMonthly.toLocaleString('vi-VN')} ₫/tháng (${pitSavingsAnnual.toLocaleString('vi-VN')} ₫/năm) tiền thuế so với quy định cũ 2025.`,
          `Under Vietnam's 2026 5-bracket PIT Law 109/2025 & NQ 110/2025 (15.5M/6.2M deductions), you save ${pitSavingsMonthly.toLocaleString('en-US')} VND/month (${pitSavingsAnnual.toLocaleString('en-US')} VND/year) vs 2025 rules.`,
          `2026年5段階所得税（基礎控除15.5M/扶養6.2M）により、2025年旧法比で月${pitSavingsMonthly.toLocaleString('ja-JP')} VND（年${pitSavingsAnnual.toLocaleString('ja-JP')} VND）の節税効果があります。`
        )
      : lx(
          `Thu nhập tính thuế của bạn đang ở ngưỡng miễn thuế TNCN theo NQ 110/2025 (giảm trừ bản thân 15,5 triệu + 6,2 triệu/người phụ thuộc).`,
          `Your income falls below the 2026 PIT threshold thanks to the raised 15.5M/6.2M personal deductions.`,
          `2026年新控除（15.5M/6.2M）により個人所得税は非課税枠内に収まっています。`
        );

  return {
    mode,
    primary,
    partner: partnerResult,
    householdSummary: {
      householdMode,
      combinedGross: primary.gross + (partnerResult?.gross || 0),
      combinedNet: householdCombinedNet,
      combinedPit: householdCombinedPit,
      suggestedMonthlySaving30Pct,
    },
    comparisonVs2025: {
      pit2025: legacy2025.employee.pit,
      pit2026: law2026.employee.pit,
      net2025: legacy2025.net,
      net2026: law2026.net,
      pitSavingsMonthly,
      pitSavingsAnnual,
    },
    summary,
  };
}

export function calculateSocialBenefits(payload = {}) {
  const lang = payload.lang === 'en' || payload.lang === 'ja' ? payload.lang : 'vi';
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  const regime = LEGAL_REGIMES[payload.regime] ? payload.regime : '2026_H2';
  const cfg = getRegime(regime);
  const regId = [1, 2, 3, 4].includes(Number(payload.region)) ? Number(payload.region) : 1;
  const minWage = cfg.regionalMinWage[regId];
  const refLevel = cfg.referenceSalary;
  const benefitType = ['unemployment', 'maternity', 'lump_sum_bhxh', 'sickness_severance'].includes(
    payload.benefitType
  )
    ? payload.benefitType
    : 'unemployment';

  const avgSalary6m = Math.max(0, Math.round(toNum(payload.avgSalary6m, 20_000_000)));
  const avgSalaryTotal = Math.max(0, Math.round(toNum(payload.avgSalaryTotal, avgSalary6m)));

  if (benefitType === 'unemployment') {
    const bhtnMonths = Math.max(0, Math.min(480, Math.round(toNum(payload.bhtnMonths, 36))));
    const rawMonthly = Math.round(avgSalary6m * 0.6);
    const maxCap = 5 * minWage; // Khoản 1 Điều 39 Luật Việc làm 74/2025/QH15 (cả khu vực công & tư)
    const monthlyBenefit = bhtnMonths >= 12 ? Math.min(rawMonthly, maxCap) : 0;
    const monthsEntitled =
      bhtnMonths < 12 ? 0 : bhtnMonths <= 36 ? 3 : Math.min(12, 3 + Math.floor((bhtnMonths - 36) / 12));
    const totalBenefit = monthlyBenefit * monthsEntitled;
    const carriedOverMonths =
      bhtnMonths >= 36 ? Math.max(0, bhtnMonths - monthsEntitled * 12) : bhtnMonths < 12 ? bhtnMonths : 0;

    return {
      benefitType,
      regimeId: cfg.id,
      legalRef: 'Khoản 1 Điều 39 Luật Việc làm 74/2025/QH15 (hiệu lực 01/01/2026)',
      eligible: bhtnMonths >= 12,
      monthlyBenefit,
      uncappedMonthly: rawMonthly,
      monthlyCap: maxCap,
      isCapped: rawMonthly > maxCap,
      monthsEntitled,
      totalBenefit,
      carriedOverMonths,
      regionalMinWage: minWage,
      note:
        bhtnMonths < 12
          ? lx(
              'Cần đóng BHTN đủ từ 12 tháng trở lên trong 24 tháng trước khi nghỉ việc để hưởng trợ cấp thất nghiệp.',
              'Minimum 12 months of unemployment insurance within the past 24 months is required.',
              '離職前24ヶ月以内に通算12ヶ月以上の雇用保険加入が必要です。'
            )
          : lx(
              `Trần trợ cấp tối đa theo Luật Việc làm 74/2025 là 5 × lương tối thiểu vùng Vùng ${regId} = ${maxCap.toLocaleString('vi-VN')} ₫/tháng (áp dụng thống nhất mọi khối).`,
              `Max monthly benefit under Employment Law 74/2025 is 5× Region ${regId} minimum wage (${maxCap.toLocaleString('en-US')} VND/mo) across both private and public sectors.`,
              `雇用保険法第74/2025号の上限は第${regId}地域最低賃金の5倍（${maxCap.toLocaleString('ja-JP')} VND/月）です。`
            ),
    };
  }

  if (benefitType === 'maternity') {
    const maternityType = payload.maternityType === 'voluntary' ? 'voluntary' : 'mandatory';
    const babiesCount = Math.max(1, Math.min(5, Math.round(toNum(payload.babiesCount, 1))));
    const cSection = Boolean(payload.cSection);
    const fatherLeaveType = ['normal', 'c_section', 'twins', 'twins_c_section'].includes(
      payload.fatherLeaveType
    )
      ? payload.fatherLeaveType
      : 'normal';

    if (maternityType === 'voluntary') {
      const voluntaryAllowance = 2_000_000 * babiesCount;
      return {
        benefitType,
        maternityType,
        regimeId: cfg.id,
        legalRef: 'Điều 95 Luật BHXH 41/2024/QH15 (BHXH tự nguyện từ 01/07/2025)',
        babiesCount,
        totalBenefit: voluntaryAllowance,
        perBabyAllowance: 2_000_000,
        note: lx(
          'Người tham gia BHXH tự nguyện đóng đủ từ 06 tháng trở lên trong 12 tháng trước sinh được Nhà nước hỗ trợ 2.000.000 ₫ cho mỗi con mới sinh.',
          'Voluntary BHXH contributors with >= 6 months in the 12 months before birth receive 2,000,000 VND per newborn funded by the State budget.',
          '任意社会保険に直前12ヶ月のうち6ヶ月以上加入で出産した場合、新生児1人あたり2,000,000 VNDが支給されます。'
        ),
      };
    }

    const leaveMonths = 6 + (babiesCount - 1);
    const salaryBenefit = Math.round(avgSalary6m * leaveMonths);
    const lumpSumAllowance = 2 * refLevel * babiesCount; // 2 × Mức tham chiếu cho mỗi con
    const recoveryDays = babiesCount >= 2 ? 10 : cSection ? 7 : 5;
    const recoveryAllowance = Math.round(recoveryDays * 0.3 * refLevel);
    const fatherDaysMap = { normal: 5, c_section: 7, twins: 10, twins_c_section: 14 };
    const fatherLeaveDays = fatherDaysMap[fatherLeaveType] || 5;
    const fatherAllowance = Math.round((avgSalary6m / 24) * fatherLeaveDays);
    const totalBenefit = salaryBenefit + lumpSumAllowance + recoveryAllowance;

    return {
      benefitType,
      maternityType,
      regimeId: cfg.id,
      legalRef: 'Luật BHXH 41/2024/QH15 & Mức tham chiếu NĐ 161/2026/NĐ-CP',
      babiesCount,
      leaveMonths,
      referenceLevel: refLevel,
      salaryBenefit,
      lumpSumAllowance,
      recoveryDays,
      recoveryAllowance,
      fatherLeaveDays,
      fatherAllowance,
      totalBenefit,
      note: lx(
        `Trợ cấp một lần khi sinh tính bằng 2 × mức tham chiếu (${refLevel.toLocaleString('vi-VN')} ₫) = ${(2 * refLevel).toLocaleString('vi-VN')} ₫/con.`,
        `One-time birth grant equals 2× reference level (${refLevel.toLocaleString('en-US')} VND) = ${(2 * refLevel).toLocaleString('en-US')} VND per baby.`,
        `出産一時金は基準額（${refLevel.toLocaleString('ja-JP')} VND）の2倍＝1児あたり${(2 * refLevel).toLocaleString('ja-JP')} VNDです。`
      ),
    };
  }

  if (benefitType === 'lump_sum_bhxh') {
    const bhxhJoinedBeforeJuly2025 = payload.bhxhJoinedBeforeJuly2025 !== false;
    const yearsBefore2014 = Math.max(0, Math.min(40, toNum(payload.yearsBefore2014, 0)));
    const yearsFrom2014 = Math.max(0, Math.min(40, toNum(payload.yearsFrom2014, 5)));
    const beforeAmount = Math.round(1.5 * yearsBefore2014 * avgSalaryTotal);
    const from2014Amount = Math.round(2.0 * yearsFrom2014 * avgSalaryTotal);
    const totalBenefit = beforeAmount + from2014Amount;

    return {
      benefitType,
      regimeId: cfg.id,
      legalRef: 'Điều 70 Luật BHXH 41/2024/QH15 (hiệu lực 01/07/2025)',
      bhxhJoinedBeforeJuly2025,
      yearsBefore2014,
      yearsFrom2014,
      beforeAmount,
      from2014Amount,
      totalBenefit,
      note: bhxhJoinedBeforeJuly2025
        ? lx(
            'Bạn tham gia BHXH trước 01/07/2025 nên vẫn được giữ quyền chọn rút BHXH 1 lần sau 12 tháng không đóng BHXH theo Điều 70.',
            'Because you joined BHXH before July 1, 2025, you retain standard lump-sum withdrawal eligibility after 12 non-contributing months.',
            '2025年7月1日以前からの加入者は、従来通り12ヶ月間の未加入後に一時金受給を選択できます。'
          )
        : lx(
            'Người bắt đầu tham gia BHXH từ 01/07/2025 KHÔNG được rút 1 lần sau 12 tháng nghỉ việc, chỉ giải quyết theo 4 trường hợp đặc biệt (đủ tuổi hưu chưa đủ 15 năm đóng, ra nước ngoài định cư, bệnh hiểm nghèo, suy giảm LĐ >=81%).',
            'New contributors joining on/after July 1, 2025 are only eligible under 4 statutory exceptions (retirement age without 15y, emigration, critical illness, >=81% disability).',
            '2025年7月1日以降の新規加入者は原則一括受給不可となり、法定4例外事由のみ対象となります。'
          ),
    };
  }

  // sickness_severance
  const sickDays = Math.max(0, Math.min(180, Math.round(toNum(payload.sickDays, 5))));
  const nonBhtnYears = Math.max(0, Math.min(40, toNum(payload.nonBhtnYears, 1)));
  const sicknessBenefit = Math.round(((avgSalary6m * 0.75) / 24) * sickDays);
  const severanceAllowance = Math.round(0.5 * avgSalary6m * nonBhtnYears);

  return {
    benefitType: 'sickness_severance',
    regimeId: cfg.id,
    legalRef: 'Luật BHXH 41/2024/QH15 & Điều 46 Bộ luật Lao động 2019',
    sickDays,
    sicknessBenefit,
    nonBhtnYears,
    severanceAllowance,
    totalBenefit: sicknessBenefit + severanceAllowance,
    note: lx(
      'Chế độ ốm đau ngắn ngày hưởng 75% mức tiền lương đóng BHXH chia 24 ngày/tháng. Trợ cấp thôi việc tính 0,5 tháng lương cho mỗi năm làm việc chưa đóng BHTN (từ 12 tháng trở lên).',
      'Standard sickness pays 75% of insured salary/24 per day; severance pays 0.5 month salary per non-UI year (>=12 months tenure).',
      '短期疾病手当は基準給与の75%/24日×日数、退職手当は雇用保険未加入期間1年につき0.5ヶ月分で算出されます。'
    ),
  };
}
