function num(v, fallback = 0, min = -1e15, max = 1e15) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normLang(l) {
  return l === 'en' || l === 'ja' ? l : 'vi';
}

function lx(lang, vi, en, ja) {
  if (lang === 'en') return en;
  if (lang === 'ja') return ja;
  return vi;
}

function localeFor(lang) {
  if (lang === 'en') return 'en-US';
  if (lang === 'ja') return 'ja-JP';
  return 'vi-VN';
}

/**
 * Evaluates the Financial Health Feasibility Score (0 to 100)
 * for a user's savings scenario (Server-Side Proprietary Scoring).
 */
export function evaluatePlanFeasibility({
  monthlySalary = 35000000,
  monthlySavings = 1000000,
  yearsToGoal = 10,
  strategy = 'SPLIT_50_50',
  realYieldRate = 3.4,
  incomeMin = null,
  incomeMax = null,
  hasExtraIncome = false,
  householdAnalysis = null,
  lang = 'vi',
}) {
  const l = normLang(lang);
  const safeSalary = num(monthlySalary, 35000000, 1, 1e12);
  const safeSavings = num(monthlySavings, 1000000, 0, 1e12);
  const safeYears = num(yearsToGoal, 10, 0, 100);
  const safeRealYield = num(realYieldRate, 3.4, -50, 50);
  const safeIncomeMin = incomeMin === null || incomeMin === undefined ? null : num(incomeMin, 0, 0, 1e12);
  const safeIncomeMax = incomeMax === null || incomeMax === undefined ? null : num(incomeMax, 0, 0, 1e12);

  let score = 70;
  const savingsToIncomeRatio = (safeSavings / safeSalary) * 100;
  const warnings = [];
  const strengths = [];

  if (savingsToIncomeRatio < 5) {
    score -= 15;
    warnings.push(
      lx(
        l,
        'Tỷ lệ tiết kiệm thấp (<5% thu nhập). Cần tăng số tiền gửi để rút ngắn thời gian tự do tài chính.',
        'Low savings ratio (<5% of income). Increasing your monthly deposit will shorten time to goal.',
        '貯蓄率が低め（収入の5%未満）です。毎月の積立額を増やすと目標達成が早まります。'
      )
    );
  } else if (savingsToIncomeRatio >= 15 && savingsToIncomeRatio <= 35) {
    score += 15;
    strengths.push(
      lx(
        l,
        'Tỷ lệ tiết kiệm lý tưởng (15% - 35% thu nhập), cân bằng tốt giữa tích lũy và chi tiêu.',
        'Ideal savings ratio (15%–35% of income), balancing wealth accumulation with living expenses.',
        '理想的な貯蓄率（収入の15%〜35%）で、生活費と資産形成のバランスが良好です。'
      )
    );
  } else if (savingsToIncomeRatio > 50) {
    score -= 10;
    warnings.push(
      lx(
        l,
        'Tỷ lệ tiết kiệm quá cao (>50% thu nhập), rủi ro gây áp lực căng thẳng tài chính hàng ngày.',
        'Very high savings ratio (>50% of income), which may put strain on day-to-day cash flow.',
        '貯蓄率が非常に高く（収入の50%超）、日々の家計キャッシュフローに負担がかかる恐れがあります。'
      )
    );
  }

  if (hasExtraIncome) {
    score += 5;
    const isVariable = safeIncomeMax !== null && safeIncomeMin !== null && safeIncomeMax > safeIncomeMin;
    strengths.push(
      isVariable
        ? lx(
            l,
            'Đa dạng nguồn thu nhập (công việc chính kết hợp công việc phụ / đầu tư), hỗ trợ dòng tiền tích lũy linh hoạt hơn.',
            'Diversified income sources (full-time plus freelance/investment) add flexibility to your savings cash flow.',
            '収入源の多様化（本業＋副業・投資）により、積立キャッシュフローに柔軟性が生まれています。'
          )
        : lx(
            l,
            'Đa dạng nguồn thu nhập (công việc chính kết hợp công việc phụ / đầu tư), giúp gia tăng năng lực tích lũy hàng tháng.',
            'Diversified income sources (full-time plus freelance/investment) strengthen monthly saving capacity.',
            '複数の収入源（本業＋副業・投資）により、毎月の貯蓄余力が高まっています。'
          )
    );
  }

  if (safeIncomeMin !== null && safeIncomeMin > 0 && safeSavings > safeIncomeMin) {
    warnings.push(
      lx(
        l,
        'Mức tiết kiệm hàng tháng cao hơn tổng thu nhập ở tháng thấp nhất — cần dự phòng cho những tháng thu nhập phụ/đầu tư giảm.',
        'Monthly saving exceeds your lowest-income month — keep a buffer for months when side or investment income dips.',
        '毎月の積立額が最低収入月の収入を上回っています。副業・投資収入が減る月への余裕枠を確保してください。'
      )
    );
  }

  if (safeYears > 30) {
    score -= 20;
    warnings.push(
      lx(
        l,
        'Thời gian chạm mốc quá dài (>30 năm). Khuyên dùng tính năng Tăng Lương/Nhảy Việc để rút ngắn.',
        'Very long horizon (>30 years). Try the Salary Growth simulator to see how income raises shorten your timeline.',
        '目標達成まで非常に長い期間（30年超）がかかります。昇給・転職シミュレーターで短縮策を検討しましょう。'
      )
    );
  } else if (safeYears <= 12) {
    score += 15;
    strengths.push(
      lx(
        l,
        'Thời gian chạm mốc rất khả thi (<12 năm). Kế hoạch thực tế và đầy tính động lực.',
        'Achievable timeline (<= 12 years). Realistic and motivating milestone.',
        '実現性の高い達成期間（12年以内）です。現実的でモチベーションを保ちやすい計画です。'
      )
    );
  }

  if (strategy === 'ROLLING_1M' || strategy === 'SPLIT_50_50' || strategy === 'TNEX_PROMO_30_70') {
    score += 10;
    strengths.push(
      lx(
        l,
        'Có gói kỳ hạn ngắn (1 tháng/3 tháng) duy trì thanh khoản xoay vòng hàng tháng.',
        'Short-term tranches (1M/3M) maintain steady monthly rolling liquidity.',
        '短期枠（1ヶ月・3ヶ月）を組み込むことで毎月の流動性を確保できています。'
      )
    );
  }

  if (safeRealYield >= 4.0) {
    score += 10;
    strengths.push(
      lx(
        l,
        'Lợi suất thực tế sau lạm phát dương cao (>=4.0%/năm), bảo vệ giá trị đồng tiền tốt.',
        'Strong positive real yield after inflation (>= 4.0%/yr) protects purchasing power well.',
        'インフレ調整後の実質利回りが高く（年4.0%以上）、購買力をしっかり守れています。'
      )
    );
  }

  if (householdAnalysis) {
    if (householdAnalysis.freeCashFlow < 0) {
      score -= 15;
      const formattedFcf = householdAnalysis.freeCashFlow.toLocaleString(localeFor(l));
      warnings.push(
        lx(
          l,
          `Dòng tiền hộ âm (${formattedFcf} ₫/tháng) sau khi trừ chi phí sinh hoạt & khoản tiết kiệm. Cần giảm mức gửi hoặc rà soát chi tiêu.`,
          `Negative monthly free cash flow (${formattedFcf} VND/mo) after expenses and savings. Consider lowering monthly deposits or trimming spending.`,
          `生活費と積立を差し引いた自由キャッシュフローがマイナス（${formattedFcf} VND/月）です。積立額または支出の見直しが必要です。`
        )
      );
    } else if (householdAnalysis.expenseCoveragePct >= 100) {
      score += 5;
      strengths.push(
        lx(
          l,
          `Khi đạt mục tiêu, tiền lãi thụ động bao phủ ${householdAnalysis.expenseCoveragePct}% chi phí sinh hoạt hàng tháng của ${householdAnalysis.modeLabel.toLowerCase()}.`,
          `At goal, passive interest covers ${householdAnalysis.expenseCoveragePct}% of monthly ${householdAnalysis.modeLabel.toLowerCase()} expenses.`,
          `目標達成時、毎月の不労所得が${householdAnalysis.modeLabel}の生活費の${householdAnalysis.expenseCoveragePct}%をカバーします。`
        )
      );
    }

    if (householdAnalysis.emergencyFundTarget > 0) {
      if (householdAnalysis.emergencyFundCoveragePct >= 100) {
        score += 8;
        strengths.push(
          lx(
            l,
            `Quỹ dự phòng khẩn cấp (${householdAnalysis.targetEmergencyMonths} tháng chi phí) đã được vốn hiện có bảo chứng đủ 100%.`,
            `Emergency fund (${householdAnalysis.targetEmergencyMonths} months of expenses) is 100% covered by your current capital.`,
            `緊急防衛資金（生活費${householdAnalysis.targetEmergencyMonths}ヶ月分）は現在の元本で100%確保済みです。`
          )
        );
      } else if (householdAnalysis.emergencyFundCoveragePct < 50 && !householdAnalysis.prioritizeEmergencyFund) {
        score -= 8;
        warnings.push(
          lx(
            l,
            `Quỹ dự phòng khẩn cấp mới đạt ${householdAnalysis.emergencyFundCoveragePct}% (${householdAnalysis.targetEmergencyMonths} tháng chi tiêu). Khuyên giữ riêng sổ ngắn hạn 1M–3M hoặc bật chế độ Lấp quỹ trước.`,
            `Emergency fund is only ${householdAnalysis.emergencyFundCoveragePct}% funded (${householdAnalysis.targetEmergencyMonths}-month target). Keep a separate 1M–3M liquid passbook or enable Fund-First mode.`,
            `緊急防衛資金の達成率が${householdAnalysis.emergencyFundCoveragePct}%（目標${householdAnalysis.targetEmergencyMonths}ヶ月分）です。短期預金（1〜3ヶ月）の確保または「緊急資金を優先」モードを推奨します。`
          )
        );
      }
    }

    if (
      householdAnalysis.mode === 'FAMILY' &&
      householdAnalysis.dependentsCount > 0 &&
      householdAnalysis.contributionSplit?.breadwinnerConcentrationPct >= 75
    ) {
      warnings.push(
        lx(
          l,
          `Rủi ro tập trung thu nhập: 1 người đang gánh ${householdAnalysis.contributionSplit.breadwinnerConcentrationPct}% tổng thu nhập gia đình có ${householdAnalysis.dependentsCount} người phụ thuộc — nên ưu tiên quỹ khẩn cấp >= 9 tháng.`,
          `Breadwinner concentration risk: one earner supplies ${householdAnalysis.contributionSplit.breadwinnerConcentrationPct}% of household income with ${householdAnalysis.dependentsCount} dependents — target an emergency fund of >= 9 months.`,
          `収入集中リスク：扶養家族${householdAnalysis.dependentsCount}人に対し、1人が世帯収入の${householdAnalysis.contributionSplit.breadwinnerConcentrationPct}%を担っています。9ヶ月分以上の緊急資金確保を推奨します。`
        )
      );
    }
  }

  const finalScore = Math.max(10, Math.min(100, score));

  let ratingLabel = lx(l, 'Khả thi', 'Feasible', '実現可能');
  let badgeColor = '#10b981';
  if (finalScore >= 85) {
    ratingLabel = lx(l, 'Xuất Sắc - Rất Khả Thi', 'Excellent - Highly Feasible', '優秀・極めて現実的');
    badgeColor = '#10b981';
  } else if (finalScore >= 70) {
    ratingLabel = lx(l, 'Tốt - Khả Thi cao', 'Good - High Feasibility', '良好・高い実現性');
    badgeColor = '#0284c7';
  } else if (finalScore >= 50) {
    ratingLabel = lx(l, 'Trung Bình - Cần Tối Ưu', 'Moderate - Needs Optimization', '標準・最適化の余地あり');
    badgeColor = '#f59e0b';
  } else {
    ratingLabel = lx(l, 'Cần Điều Chỉnh Lộ Trình', 'Needs Roadmap Adjustment', 'ロードマップの調整が必要');
    badgeColor = '#ef4444';
  }

  return {
    score: finalScore,
    ratingLabel,
    badgeColor,
    savingsToIncomeRatio: Number(savingsToIncomeRatio.toFixed(1)),
    strengths,
    warnings,
  };
}
