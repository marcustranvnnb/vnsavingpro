// ============================================================
// SERVER-ONLY: VIETNAM CIC CREDIT HEALTH, PASSBOOK PLEDGE ARBITRAGE
// & 2-STAGE HOME LOAN VS. RENT-AND-SAVE ENGINE
// Zero PII (Decree 13/2023/ND-CP compliant)
// ============================================================

function clamp(v, min, max, fallback = min) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function mapCicScoreToRank(score) {
  if (score >= 680) return 1;
  if (score >= 650) return 2;
  if (score >= 620) return 3;
  if (score >= 595) return 4;
  if (score >= 570) return 5;
  if (score >= 545) return 6;
  if (score >= 520) return 7;
  if (score >= 495) return 8;
  if (score >= 460) return 9;
  return 10;
}

function scoreCoreCic({
  debtGroup,
  lateCount24m,
  dtiPct,
  cardUtilizationPct,
  creditAgeYears,
  newInquiries6m,
  hasCreditCard,
  hasSecuredLoan,
  hasConsumerCashLoan,
  hasSavingsCollateral,
}) {
  // 1. Payment History (35%)
  let paymentSub = 100 - lateCount24m * 8;
  if (debtGroup === 2) paymentSub = Math.min(paymentSub, 55);
  else if (debtGroup === 3) paymentSub = Math.min(paymentSub, 30);
  else if (debtGroup === 4) paymentSub = Math.min(paymentSub, 18);
  else if (debtGroup >= 5) paymentSub = Math.min(paymentSub, 8);
  paymentSub = clamp(paymentSub, 5, 100);

  // 2. Debt Burden: DTI + Card Utilization (30%)
  let dtiSub = 100;
  if (dtiPct > 65) dtiSub = 15;
  else if (dtiPct > 50) dtiSub = 38;
  else if (dtiPct > 40) dtiSub = 60;
  else if (dtiPct > 28) dtiSub = 80;
  else if (dtiPct > 15) dtiSub = 92;

  let utilSub = 100;
  if (cardUtilizationPct > 85) utilSub = 15;
  else if (cardUtilizationPct > 65) utilSub = 40;
  else if (cardUtilizationPct > 45) utilSub = 65;
  else if (cardUtilizationPct > 30) utilSub = 82;
  else if (cardUtilizationPct > 15) utilSub = 94;

  const debtBurdenSub = dtiSub * 0.55 + utilSub * 0.45;

  // 3. Credit History Length (15%)
  let ageSub = 35;
  if (creditAgeYears >= 7) ageSub = 100;
  else if (creditAgeYears >= 5) ageSub = 92;
  else if (creditAgeYears >= 3) ageSub = 82;
  else if (creditAgeYears >= 1.5) ageSub = 65;
  else if (creditAgeYears >= 0.5) ageSub = 50;

  // 4. Credit Mix (10%)
  let mixSub = 45;
  if (hasCreditCard) mixSub += 20;
  if (hasSecuredLoan) mixSub += 20;
  if (hasSavingsCollateral) mixSub += 15;
  if (hasConsumerCashLoan) mixSub -= 10;
  mixSub = clamp(mixSub, 20, 100);

  // 5. Recent Inquiries / Applications (10%)
  let inqSub = 100;
  if (newInquiries6m >= 5) inqSub = 22;
  else if (newInquiries6m === 4) inqSub = 38;
  else if (newInquiries6m === 3) inqSub = 55;
  else if (newInquiries6m === 2) inqSub = 72;
  else if (newInquiries6m === 1) inqSub = 88;

  const weightedPct =
    paymentSub * 0.35 + debtBurdenSub * 0.3 + ageSub * 0.15 + mixSub * 0.1 + inqSub * 0.1;

  let score = Math.round(403 + (weightedPct / 100) * (706 - 403));
  if (debtGroup === 2) score = Math.min(score, 588);
  else if (debtGroup === 3) score = Math.min(score, 515);
  else if (debtGroup === 4) score = Math.min(score, 468);
  else if (debtGroup >= 5) score = Math.min(score, 430);
  score = clamp(score, 403, 706);

  return {
    score,
    rank: mapCicScoreToRank(score),
    pillars: {
      payment: Math.round(paymentSub),
      debtBurden: Math.round(debtBurdenSub),
      creditAge: Math.round(ageSub),
      creditMix: Math.round(mixSub),
      inquiries: Math.round(inqSub),
    },
  };
}

function computePledgeArbitrage({
  passbookPrincipal,
  passbookRatePct,
  passbookTenureMonths,
  monthsAlreadyHeld,
  urgentCashNeeded,
  urgentDaysNeeded,
  pledgeSpreadPct,
  lang,
}) {
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  const principal = clamp(passbookPrincipal, 1_000_000, 500_000_000_000, 200_000_000);
  const ratePct = clamp(passbookRatePct, 0.5, 20, 8.6);
  const tenureMonths = clamp(passbookTenureMonths, 1, 36, 12);
  const heldMonths = clamp(monthsAlreadyHeld, 0, Math.max(0, tenureMonths - 0.25), Math.min(8, tenureMonths - 1));
  const cashNeeded = clamp(urgentCashNeeded, 500_000, principal, Math.min(principal, 40_000_000));
  const daysHeld = Math.round(heldMonths * 30.4);
  const pledgeDays = clamp(urgentDaysNeeded, 7, 365, 45);
  const spread = clamp(pledgeSpreadPct, 0.5, 10, 1.8);
  const nonTermRate = 0.5;

  // Interest already accrued at contract rate during months held vs. dropped to 0.5% on early break
  const breakFullLost = Math.round(principal * ((ratePct - nonTermRate) / 100) * (daysHeld / 365));
  const breakPartialLost = Math.round(cashNeeded * ((ratePct - nonTermRate) / 100) * (daysHeld / 365));

  // Net cost of pledging the passbook for urgentDaysNeeded: borrow at (passbookRate + spread) while passbook still earns passbookRate!
  // Plus opportunity cost on cashNeeded is simply spread% (if kept in bank) or gross borrow rate minus earned rate:
  const grossBorrowInterest = Math.round(cashNeeded * ((ratePct + spread) / 100) * (pledgeDays / 365));
  const netSpreadCost = Math.round(cashNeeded * (spread / 100) * (pledgeDays / 365));

  const netSavedVsFullBreak = breakFullLost - netSpreadCost;
  const netSavedVsPartialBreak = breakPartialLost - netSpreadCost;

  const recommendPledge = netSavedVsPartialBreak > 0 || netSavedVsFullBreak > 0;
  return {
    passbookPrincipal: principal,
    urgentCashNeeded: cashNeeded,
    urgentDaysNeeded: pledgeDays,
    pledgeRatePct: Number((ratePct + spread).toFixed(2)),
    breakFullLost,
    breakPartialLost,
    grossBorrowInterest,
    netSpreadCost,
    netSavedVsFullBreak,
    netSavedVsPartialBreak,
    recommend: recommendPledge ? 'PLEDGE' : 'PARTIAL_WITHDRAWAL',
    note: recommendPledge
      ? lx(
          `Vay cầm cố sổ tiết kiệm giữ trọn lãi cao (${ratePct}%/năm), giúp tiết kiệm hơn rút nguyên sổ sớm tới ${Math.max(0, netSavedVsFullBreak).toLocaleString('vi-VN')} ₫.`,
          `Pledging your passbook preserves full ${ratePct}% p.a. yield and saves up to ${Math.max(0, netSavedVsFullBreak).toLocaleString('en-US')} VND vs. breaking the full deposit early.`,
          `定期預金担保ローンにより${ratePct}%の高金利を保護でき、全額中途解約より最大${Math.max(0, netSavedVsFullBreak).toLocaleString('ja-JP')} VND有利です。`
        )
      : lx(
          'Vì số ngày cần vốn dài hoặc sổ mới mở, rút từng phần (nếu ngân hàng hỗ trợ) có chi phí thấp hơn vay cầm cố.',
          'For a newly opened passbook or longer cash horizon, partial early withdrawal costs less than pledging.',
          '預入直後または借入期間が長いため、一部解約の方が担保ローンより低コストです。'
        ),
  };
}

function simulateLoanSchedule({
  loanAmount,
  prefRatePct,
  prefMonths,
  floatRatePct,
  totalMonths,
  repaymentMethod,
  annualPrepayment,
  earlyPenaltyPct,
}) {
  let balance = loanAmount;
  let totalInterest = 0;
  let totalPenalty = 0;
  let totalPrincipalPaid = 0;
  let monthsUsed = 0;
  let phase1FirstPayment = 0;
  let phase2FirstPayment = 0;
  const horizonSnapshots = {};

  const fixedMonthlyPrincipal = loanAmount / Math.max(1, totalMonths);
  const r1 = prefRatePct / 100 / 12;
  const r2 = floatRatePct / 100 / 12;
  const annuityPmt1 =
    r1 > 0
      ? (loanAmount * r1 * Math.pow(1 + r1, totalMonths)) / (Math.pow(1 + r1, totalMonths) - 1)
      : fixedMonthlyPrincipal;
  let annuityPmt2 = null;

  const monthlyCashOutflows = [];

  for (let m = 1; m <= totalMonths && balance > 1; m++) {
    const inPref = m <= prefMonths;
    const mr = inPref ? r1 : r2;
    const interest = balance * mr;

    let schedPrincipal;
    if (repaymentMethod === 'ANNUITY') {
      if (!inPref && annuityPmt2 === null) {
        const remMonths = Math.max(1, totalMonths - m + 1);
        annuityPmt2 =
          r2 > 0
            ? (balance * r2 * Math.pow(1 + r2, remMonths)) / (Math.pow(1 + r2, remMonths) - 1)
            : balance / remMonths;
      }
      const pmt = inPref ? annuityPmt1 : annuityPmt2;
      schedPrincipal = Math.max(0, Math.min(balance, pmt - interest));
    } else {
      schedPrincipal = Math.min(balance, fixedMonthlyPrincipal);
    }

    const monthlyPay = schedPrincipal + interest;
    if (m === 1) phase1FirstPayment = Math.round(monthlyPay);
    if (m === prefMonths + 1) phase2FirstPayment = Math.round(monthlyPay);

    balance -= schedPrincipal;
    totalInterest += interest;
    totalPrincipalPaid += schedPrincipal;
    let prepayThisMonth = 0;

    if (annualPrepayment > 0 && m % 12 === 0 && balance > 1 && m < totalMonths) {
      const extra = Math.min(balance, annualPrepayment);
      const penalty = m <= 36 ? extra * (earlyPenaltyPct / 100) : 0;
      balance -= extra;
      totalPrincipalPaid += extra;
      totalPenalty += penalty;
      prepayThisMonth = extra + penalty;
    }

    monthlyCashOutflows.push(monthlyPay + prepayThisMonth);
    monthsUsed = m;

    if (m % 12 === 0) {
      horizonSnapshots[m / 12] = {
        remainingBalance: Math.round(balance),
        cumulativeInterest: Math.round(totalInterest),
      };
    }
  }

  if (phase2FirstPayment === 0) phase2FirstPayment = phase1FirstPayment;

  return {
    phase1FirstPayment,
    phase2FirstPayment,
    paymentShockVnd: Math.max(0, phase2FirstPayment - phase1FirstPayment),
    totalInterest: Math.round(totalInterest),
    totalPenalty: Math.round(totalPenalty),
    monthsUsed,
    monthlyCashOutflows,
    horizonSnapshots,
  };
}

function computeTwoStageHomeLoan({
  assetPrice,
  downPayment,
  preferentialRatePct,
  preferentialMonths,
  floatingRatePct,
  loanYears,
  repaymentMethod,
  annualPrepaymentAmount,
  earlyRepayPenaltyPct,
  currentMonthlyRent,
  rentGrowthPct,
  assetAppreciationPct,
  savingsYieldPct,
  compareHorizonYears,
  monthlyNetIncome,
  existingMonthlyDebtPayment,
  lang,
}) {
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  const price = clamp(assetPrice, 50_000_000, 500_000_000_000, 2_400_000_000);
  const down = clamp(downPayment, 0, price * 0.95, Math.round(price * 0.3));
  const loanAmount = Math.max(10_000_000, price - down);
  const prefRate = clamp(preferentialRatePct, 0.5, 25, 6.8);
  const prefMonths = Math.round(clamp(preferentialMonths, 3, 120, 24));
  const floatRate = clamp(floatingRatePct, 1, 30, 10.5);
  const years = Math.round(clamp(loanYears, 1, 35, 20));
  const totalMonths = years * 12;
  const method = repaymentMethod === 'ANNUITY' ? 'ANNUITY' : 'DECLINING_BALANCE';
  const prepay = clamp(annualPrepaymentAmount, 0, loanAmount, 50_000_000);
  const penaltyPct = clamp(earlyRepayPenaltyPct, 0, 10, 1.5);
  const baseRent = clamp(currentMonthlyRent, 0, 500_000_000, 12_000_000);
  const rentGrowth = clamp(rentGrowthPct, 0, 20, 3.5);
  const appPct = clamp(assetAppreciationPct, -10, 30, 5.5);
  const savYield = clamp(savingsYieldPct, 0.5, 20, 8.6);
  const horizonY = Math.round(clamp(compareHorizonYears, 1, Math.min(20, years), 5));

  const baseline = simulateLoanSchedule({
    loanAmount,
    prefRatePct: prefRate,
    prefMonths,
    floatRatePct: floatRate,
    totalMonths,
    repaymentMethod: method,
    annualPrepayment: 0,
    earlyPenaltyPct: penaltyPct,
  });

  const withPrepay =
    prepay > 0
      ? simulateLoanSchedule({
          loanAmount,
          prefRatePct: prefRate,
          prefMonths,
          floatRatePct: floatRate,
          totalMonths,
          repaymentMethod: method,
          annualPrepayment: prepay,
          earlyPenaltyPct: penaltyPct,
        })
      : baseline;

  const interestSaved = Math.max(0, baseline.totalInterest - withPrepay.totalInterest - withPrepay.totalPenalty);
  const monthsShortened = Math.max(0, baseline.monthsUsed - withPrepay.monthsUsed);

  const safeIncome = Math.max(1, Number(monthlyNetIncome) || 28_000_000);
  const phase1DtiPct = Number((((baseline.phase1FirstPayment + existingMonthlyDebtPayment) / safeIncome) * 100).toFixed(1));
  const phase2DtiPct = Number((((baseline.phase2FirstPayment + existingMonthlyDebtPayment) / safeIncome) * 100).toFixed(1));

  // Compare horizonY years: Buy Now vs. Rent & Compound Digital Savings
  const horizonMonths = horizonY * 12;
  const projectedAssetValue = Math.round(price * Math.pow(1 + appPct / 100, horizonY));
  const remainingLoanAtHorizon = baseline.horizonSnapshots[horizonY]?.remainingBalance ?? 0;
  const buyNetEquity = projectedAssetValue - remainingLoanAtHorizon;

  let rentSavingsFund = down;
  let totalRentPaid = 0;
  let totalBuyCashPaid = down;
  const monthlySavRate = savYield / 100 / 12;
  let extraMonthlyCashNeededToBuy = 0;

  for (let m = 1; m <= horizonMonths; m++) {
    const yearIdx = Math.floor((m - 1) / 12);
    const rentThisMonth = baseRent * Math.pow(1 + rentGrowth / 100, yearIdx);
    const loanThisMonth = baseline.monthlyCashOutflows[m - 1] ?? 0;
    totalRentPaid += rentThisMonth;
    totalBuyCashPaid += loanThisMonth;

    const diff = loanThisMonth - rentThisMonth;
    if (diff > 0) extraMonthlyCashNeededToBuy += diff;
    rentSavingsFund = Math.max(0, rentSavingsFund * (1 + monthlySavRate) + diff);
  }

  const buyNetWealth = buyNetEquity;
  const rentNetWealth = Math.round(rentSavingsFund);
  const netAdvantage = Math.abs(buyNetWealth - rentNetWealth);
  const winner = buyNetWealth >= rentNetWealth ? 'BUY' : 'RENT_AND_SAVE';

  return {
    loanAmount,
    downPayment: down,
    downPaymentPct: Number(((down / price) * 100).toFixed(1)),
    phase1FirstPayment: baseline.phase1FirstPayment,
    phase2FirstPayment: baseline.phase2FirstPayment,
    paymentShockVnd: baseline.paymentShockVnd,
    totalInterestBaseline: baseline.totalInterest,
    totalInterestWithPrepay: withPrepay.totalInterest,
    totalPenaltyPaid: withPrepay.totalPenalty,
    interestSaved,
    monthsShortened,
    phase1DtiPct,
    phase2DtiPct,
    horizonYears: horizonY,
    projectedAssetValue,
    remainingLoanAtHorizon,
    buyNetWealth,
    rentNetWealth,
    totalRentPaid: Math.round(totalRentPaid),
    totalBuyCashPaid: Math.round(totalBuyCashPaid),
    extraMonthlyCashNeededToBuy: Math.round(extraMonthlyCashNeededToBuy),
    winner,
    advantageVnd: netAdvantage,
    summaryNote:
      winner === 'BUY'
        ? lx(
            `Sau ${horizonY} năm, tài sản ròng Mua ngay vượt trội hơn Thuê + Gửi tiết kiệm khoảng ${netAdvantage.toLocaleString('vi-VN')} ₫ (giả định tài sản tăng ${appPct}%/năm).`,
            `Over ${horizonY} years, Buying Now leads Rent & Save by ${netAdvantage.toLocaleString('en-US')} VND in net equity (assuming ${appPct}%/yr appreciation).`,
            `${horizonY}年後、今購入する方が賃貸＋預金運用より純資産が約${netAdvantage.toLocaleString('ja-JP')} VND上回ります（年${appPct}%値上がり仮定）。`
          )
        : lx(
            `Sau ${horizonY} năm, tiếp tục Thuê nhà & Gửi tiết kiệm số (${savYield}%/năm) tạo tổng tài sản ròng cao hơn ${netAdvantage.toLocaleString('vi-VN')} ₫ và tránh sốc lãi thả nổi ${floatRate}%.`,
            `Over ${horizonY} years, Renting & compounding at ${savYield}%/yr builds ${netAdvantage.toLocaleString('en-US')} VND more net wealth while avoiding the ${floatRate}% floating rate shock.`,
            `${horizonY}年後、賃貸＋${savYield}%定期運用のほうが純資産が約${netAdvantage.toLocaleString('ja-JP')} VND多く、変動金利${floatRate}%への上昇ショックも回避できます。`
          ),
  };
}

export function calculateCicAndLoanBundle(payload = {}) {
  const lang = payload.lang === 'en' || payload.lang === 'ja' ? payload.lang : 'vi';
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);

  const debtGroup = Math.round(clamp(payload.debtGroup, 1, 5, 1));
  const lateCount24m = Math.round(clamp(payload.lateCount24m, 0, 24, 0));
  const monthlyNetIncome = clamp(payload.monthlyNetIncome, 1_000_000, 10_000_000_000, 28_000_000);
  const existingMonthlyDebtPayment = clamp(payload.existingMonthlyDebtPayment, 0, 5_000_000_000, 3_000_000);
  const creditCardLimit = clamp(payload.creditCardLimit, 0, 10_000_000_000, 50_000_000);
  const creditCardBalance = clamp(payload.creditCardBalance, 0, 10_000_000_000, 10_000_000);
  const creditAgeYears = clamp(payload.creditAgeYears, 0, 50, 3);
  const newInquiries6m = Math.round(clamp(payload.newInquiries6m, 0, 20, 1));
  const hasCreditCard = payload.hasCreditCard !== false;
  const hasSecuredLoan = Boolean(payload.hasSecuredLoan);
  const hasConsumerCashLoan = Boolean(payload.hasConsumerCashLoan);
  const hasSavingsCollateral = payload.hasSavingsCollateral !== false;

  const dtiPct = Number(((existingMonthlyDebtPayment / monthlyNetIncome) * 100).toFixed(1));
  const cardUtilizationPct =
    creditCardLimit > 0 ? Number(((creditCardBalance / creditCardLimit) * 100).toFixed(1)) : 0;

  const cic = scoreCoreCic({
    debtGroup,
    lateCount24m,
    dtiPct,
    cardUtilizationPct,
    creditAgeYears,
    newInquiries6m,
    hasCreditCard,
    hasSecuredLoan,
    hasConsumerCashLoan,
    hasSavingsCollateral,
  });

  // What-If 90-day recovery: card utilization <= 20%, inquiries cooled to 0
  const whatIfDebtPayment =
    cardUtilizationPct > 20 && creditCardLimit > 0
      ? Math.max(0, existingMonthlyDebtPayment - Math.round((creditCardBalance - creditCardLimit * 0.2) * 0.05))
      : existingMonthlyDebtPayment;
  const whatIfDtiPct = Number(((whatIfDebtPayment / monthlyNetIncome) * 100).toFixed(1));
  const whatIfUtilPct = creditCardLimit > 0 ? Math.min(cardUtilizationPct, 20) : 0;
  const whatIf = scoreCoreCic({
    debtGroup,
    lateCount24m: debtGroup === 1 ? 0 : Math.min(lateCount24m, 1),
    dtiPct: whatIfDtiPct,
    cardUtilizationPct: whatIfUtilPct,
    creditAgeYears,
    newInquiries6m: 0,
    hasCreditCard,
    hasSecuredLoan,
    hasConsumerCashLoan,
    hasSavingsCollateral: true,
  });

  const maxSafeAdditionalInstallment = Math.max(
    0,
    Math.round(monthlyNetIncome * 0.4 - existingMonthlyDebtPayment)
  );

  let riskBand = 'low';
  let statusLabel = lx('Tốt / Rủi ro thấp — Dễ duyệt lãi ưu đãi', 'Strong / Low Risk — Prime Approval Ready', '優良・低リスク（優遇金利対象）');
  if (cic.rank >= 9 || debtGroup >= 3) {
    riskBand = 'high';
    statusLabel = lx(
      'Rủi ro cao / Cần phục hồi CIC trước khi vay',
      'High Risk / Credit Repair Required',
      '高リスク・信用回復が必要'
    );
  } else if (cic.rank >= 5 || debtGroup === 2) {
    riskBand = 'medium';
    statusLabel = lx(
      'Trung bình — Nên giảm DTI & dư nợ thẻ trước khi nộp hồ sơ',
      'Moderate — Optimize DTI & Card Usage Before Applying',
      '中リスク（DTI・カード利用率の圧縮推奨）'
    );
  }

  const recommendations = [];
  if (debtGroup >= 2) {
    recommendations.push(
      lx(
        `Đưa toàn bộ khoản nợ về Nhóm 1 ngay lập tức (Nhóm 2 cần ~12 tháng ổn định; Nhóm 3–5 cần tối thiểu 5 năm sau tất toán theo quy định lưu trữ CIC).`,
        `Clear overdue balances back to Group 1 immediately (Group 2 lingers ~12 months; Groups 3–5 persist up to 5 years post-settlement).`,
        `延滞分を直ちに解消して区分1へ戻しましょう（区分2は約12ヶ月、区分3〜5は完済後最長5年間履歴が残ります）。`
      )
    );
  }
  if (cardUtilizationPct > 30) {
    recommendations.push(
      lx(
        `Hạ tỷ lệ sử dụng thẻ tín dụng từ ${cardUtilizationPct}% xuống dưới 30% trước ngày chốt sao kê để tăng nhanh sức khỏe điểm CIC.`,
        `Bring credit card utilization down from ${cardUtilizationPct}% to under 30% prior to statement close.`,
        `締め日前にクレジットカード利用率を${cardUtilizationPct}%から30%未満へ下げてください。`
      )
    );
  }
  if (dtiPct > 40) {
    recommendations.push(
      lx(
        `Tỷ lệ trả nợ/Thu nhập (DTI) đang ở mức ${dtiPct}% (vượt ngưỡng an toàn 40%). Cần tất toán bớt khoản góp hoặc bổ sung thu nhập trước khi vay mua nhà.`,
        `Your Debt-to-Income ratio (${dtiPct}%) exceeds the 40% bank comfort threshold. Reduce installments before applying for a mortgage.`,
        `返済負担率（DTI）が${dtiPct}%と安全水準の40%を超えています。新規ローン前に既存債務を減らしてください。`
      )
    );
  }
  if (newInquiries6m >= 3) {
    recommendations.push(
      lx(
        `Bạn có ${newInquiries6m} lượt mở/tra cứu tín dụng trong 6 tháng — nên ngưng nộp hồ sơ thẻ/vay mới ít nhất 90 ngày.`,
        `Pause new card or loan applications for 90 days (${newInquiries6m} recent inquiries detected).`,
        `直近6ヶ月で${newInquiries6m}件の新規申込があり、今後90日間は新規申請を控えることを推奨します。`
      )
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      lx(
        'Hồ sơ tín dụng đang ở trạng thái tốt. Duy trì thanh toán tự động đúng hạn và giữ DTI dưới 40% khi vay mới.',
        'Credit readiness looks healthy. Keep auto-pay active and maintain total DTI under 40% on new loans.',
        '信用状態は良好です。自動引き落としの維持と総返済負担率40%以下のキープを心がけましょう。'
      )
    );
  }

  const pledgeArbitrage = computePledgeArbitrage({
    passbookPrincipal: payload.passbookPrincipal,
    passbookRatePct: payload.passbookRatePct,
    passbookTenureMonths: payload.passbookTenureMonths,
    monthsAlreadyHeld: payload.monthsAlreadyHeld,
    urgentCashNeeded: payload.urgentCashNeeded,
    urgentDaysNeeded: payload.urgentDaysNeeded,
    pledgeSpreadPct: payload.pledgeSpreadPct,
    lang,
  });

  const homeLoan = computeTwoStageHomeLoan({
    assetPrice: payload.assetPrice,
    downPayment: payload.downPayment,
    preferentialRatePct: payload.preferentialRatePct,
    preferentialMonths: payload.preferentialMonths,
    floatingRatePct: payload.floatingRatePct,
    loanYears: payload.loanYears,
    repaymentMethod: payload.repaymentMethod,
    annualPrepaymentAmount: payload.annualPrepaymentAmount,
    earlyRepayPenaltyPct: payload.earlyRepayPenaltyPct,
    currentMonthlyRent: payload.currentMonthlyRent,
    rentGrowthPct: payload.rentGrowthPct,
    assetAppreciationPct: payload.assetAppreciationPct,
    savingsYieldPct: payload.savingsYieldPct,
    compareHorizonYears: payload.compareHorizonYears,
    monthlyNetIncome,
    existingMonthlyDebtPayment,
    lang,
  });

  return {
    score: cic.score,
    rank: cic.rank,
    riskBand,
    statusLabel,
    debtGroup,
    dtiPct,
    cardUtilizationPct,
    maxSafeAdditionalInstallment,
    pillars: cic.pillars,
    whatIf: {
      score: whatIf.score,
      rank: whatIf.rank,
      gain: Math.max(0, whatIf.score - cic.score),
    },
    recommendations,
    pledgeArbitrage,
    homeLoan,
    privacyNotice: lx(
      'Tuân thủ Nghị định 13/2023/NĐ-CP: không thu thập CCCD hay số tài khoản ngân hàng. Kiểm tra báo cáo CIC chính thức miễn phí 1 lần/năm tại cic.gov.vn.',
      'Decree 13/2023/ND-CP compliant: zero ID numbers or bank accounts collected. Verify official annual free report at cic.gov.vn.',
      '政令13/2023準拠：国民IDや口座番号は一切収集しません。公式レポートはcic.gov.vnで年1回無料照会できます。'
    ),
  };
}
