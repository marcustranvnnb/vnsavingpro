/**
 * Evaluates the Financial Health Feasibility Score (0 to 100)
 * for a user's savings scenario.
 */
export function evaluatePlanFeasibility({
  monthlySalary = 35000000,
  monthlySavings = 1000000,
  yearsToGoal = 10,
  strategy = "SPLIT_50_50",
  realYieldRate = 5.1
}) {
  let score = 70; // baseline
  const savingsToIncomeRatio = (monthlySavings / Math.max(1, monthlySalary)) * 100;
  const metrics = [];
  const warnings = [];
  const strengths = [];

  // 1. Savings-to-Income Budget Safety (Ideal: 15% - 30%)
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

  // 2. Timeline Realism (Ideal: 3 to 15 years)
  if (yearsToGoal > 30) {
    score -= 20;
    warnings.push("Thời gian chạm mốc quá dài (>30 năm). Khuyên dùng tính năng Tăng Lương/Nhảy Việc để rút ngắn.");
  } else if (yearsToGoal <= 12) {
    score += 15;
    strengths.push("Thời gian chạm mốc rất khả thi (<12 năm). Kế hoạch thực tế và đầy tính động lực.");
  }

  // 3. Strategy & Liquidity Buffer
  if (strategy === "ROLLING_1M" || strategy === "SPLIT_50_50" || strategy === "TNEX_PROMO_30_70") {
    score += 10;
    strengths.push("Có gói kỳ hạn ngắn (1 tháng/3 tháng) duy trì thanh khoản xoay vòng hàng tháng.");
  }

  // 4. Inflation Protection
  if (realYieldRate >= 4.0) {
    score += 10;
    strengths.push("Lợi suất thực tế sau lạm phát dương cao (>=4.0%/năm), bảo vệ giá trị đồng tiền tốt.");
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(10, Math.min(100, score));

  let ratingLabel = "Khả thi";
  let badgeColor = "#10b981";
  if (finalScore >= 85) {
    ratingLabel = "Xuất Sắc - Rất Khả Thi";
    badgeColor = "#10b981";
  } else if (finalScore >= 70) {
    ratingLabel = "Tốt - Khả Thi High";
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
