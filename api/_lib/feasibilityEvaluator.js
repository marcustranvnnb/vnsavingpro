function num(v, fallback = 0, min = -1e15, max = 1e15) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Evaluates the Financial Health Feasibility Score (0 to 100)
 * for a user's savings scenario (Server-Side Proprietary Scoring).
 */
export function evaluatePlanFeasibility({
  monthlySalary = 35000000,
  monthlySavings = 1000000,
  yearsToGoal = 10,
  strategy = "SPLIT_50_50",
  realYieldRate = 3.4,
  incomeMin = null,
  incomeMax = null,
  hasExtraIncome = false,
  householdAnalysis = null,
}) {
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
    warnings.push("Tỷ lệ tiết kiệm thấp (<5% thu nhập). Cần tăng số tiền gửi để rút ngắn thời gian tự do tài chính.");
  } else if (savingsToIncomeRatio >= 15 && savingsToIncomeRatio <= 35) {
    score += 15;
    strengths.push("Tỷ lệ tiết kiệm lý tưởng (15% - 35% thu nhập), cân bằng tốt giữa tích lũy và chi tiêu.");
  } else if (savingsToIncomeRatio > 50) {
    score -= 10;
    warnings.push("Tỷ lệ tiết kiệm quá cao (>50% thu nhập), rủi ro gây áp lực căng thẳng tài chính hàng ngày.");
  }

  if (hasExtraIncome) {
    score += 5;
    strengths.push(
      safeIncomeMax !== null && safeIncomeMin !== null && safeIncomeMax > safeIncomeMin
        ? "Đa dạng nguồn thu nhập (công việc chính kết hợp công việc phụ / đầu tư), hỗ trợ dòng tiền tích lũy linh hoạt hơn."
        : "Đa dạng nguồn thu nhập (công việc chính kết hợp công việc phụ / đầu tư), giúp gia tăng năng lực tích lũy hàng tháng."
    );
  }

  if (safeIncomeMin !== null && safeIncomeMin > 0 && safeSavings > safeIncomeMin) {
    warnings.push(
      "Mức tiết kiệm hàng tháng cao hơn tổng thu nhập ở tháng thấp nhất — cần dự phòng cho những tháng thu nhập phụ/đầu tư giảm."
    );
  }

  if (safeYears > 30) {
    score -= 20;
    warnings.push("Thời gian chạm mốc quá dài (>30 năm). Khuyên dùng tính năng Tăng Lương/Nhảy Việc để rút ngắn.");
  } else if (safeYears <= 12) {
    score += 15;
    strengths.push("Thời gian chạm mốc rất khả thi (<12 năm). Kế hoạch thực tế và đầy tính động lực.");
  }

  if (strategy === "ROLLING_1M" || strategy === "SPLIT_50_50" || strategy === "TNEX_PROMO_30_70") {
    score += 10;
    strengths.push("Có gói kỳ hạn ngắn (1 tháng/3 tháng) duy trì thanh khoản xoay vòng hàng tháng.");
  }

  if (safeRealYield >= 4.0) {
    score += 10;
    strengths.push("Lợi suất thực tế sau lạm phát dương cao (>=4.0%/năm), bảo vệ giá trị đồng tiền tốt.");
  }

  if (householdAnalysis) {
    if (householdAnalysis.freeCashFlow < 0) {
      score -= 15;
      warnings.push(
        `Dòng tiền hộ âm (${householdAnalysis.freeCashFlow.toLocaleString('vi-VN')} ₫/tháng) sau khi trừ chi phí sinh hoạt & khoản tiết kiệm. Cần giảm mức gửi hoặc rà soát chi tiêu.`
      );
    } else if (householdAnalysis.expenseCoveragePct >= 100) {
      score += 5;
      strengths.push(
        `Khi đạt mục tiêu, tiền lãi thụ động bao phủ ${householdAnalysis.expenseCoveragePct}% chi phí sinh hoạt hàng tháng của ${householdAnalysis.modeLabel.toLowerCase()}.`
      );
    }

    if (householdAnalysis.emergencyFundTarget > 0) {
      if (householdAnalysis.emergencyFundCoveragePct >= 100) {
        score += 8;
        strengths.push(
          `Quỹ dự phòng khẩn cấp (${householdAnalysis.targetEmergencyMonths} tháng chi phí) đã được vốn hiện có bảo chứng đủ 100%.`
        );
      } else if (householdAnalysis.emergencyFundCoveragePct < 50 && !householdAnalysis.prioritizeEmergencyFund) {
        score -= 8;
        warnings.push(
          `Quỹ dự phòng khẩn cấp mới đạt ${householdAnalysis.emergencyFundCoveragePct}% (${householdAnalysis.targetEmergencyMonths} tháng chi tiêu). Khuyên giữ riêng sổ ngắn hạn 1M–3M hoặc bật chế độ Lấp quỹ trước.`
        );
      }
    }

    if (
      householdAnalysis.mode === 'FAMILY' &&
      householdAnalysis.dependentsCount > 0 &&
      householdAnalysis.contributionSplit?.breadwinnerConcentrationPct >= 75
    ) {
      warnings.push(
        `Rủi ro tập trung thu nhập: 1 người đang gánh ${householdAnalysis.contributionSplit.breadwinnerConcentrationPct}% tổng thu nhập gia đình có ${householdAnalysis.dependentsCount} người phụ thuộc — nên ưu tiên quỹ khẩn cấp >= 9 tháng.`
      );
    }
  }

  const finalScore = Math.max(10, Math.min(100, score));

  let ratingLabel = "Khả thi";
  let badgeColor = "#10b981";
  if (finalScore >= 85) {
    ratingLabel = "Xuất Sắc - Rất Khả Thi";
    badgeColor = "#10b981";
  } else if (finalScore >= 70) {
    ratingLabel = "Tốt - Khả Thi cao";
    badgeColor = "#0284c7";
  } else if (finalScore >= 50) {
    ratingLabel = "Trung Bình - Cần Tối Ưu";
    badgeColor = "#f59e0b";
  } else {
    ratingLabel = "Cần Điều Chỉnh Lộ Trình";
    badgeColor = "#ef4444";
  }

  return {
    score: finalScore,
    ratingLabel,
    badgeColor,
    savingsToIncomeRatio: Number(savingsToIncomeRatio.toFixed(1)),
    strengths,
    warnings
  };
}
