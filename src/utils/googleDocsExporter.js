import { compact, fmt, pct, vnd } from './format.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPlanReportHTML({
  inputMode = 'basic',
  goalType = 'PASSIVE_INCOME',
  target,
  targetAmount,
  solveMode = 'TIME',
  targetYears,
  capital,
  saving,
  salary,
  salaryFullTime,
  freelanceMin = 0,
  freelanceMax = 0,
  investMin = 0,
  investMax = 0,
  totalIncomeMin,
  totalIncomeMax,
  bankName,
  tenureLabel,
  rate,
  calcMode,
  annualStepUpPct = 0,
  annualBonusAmount = 0,
  inflationRatePct = 0,
  householdAnalysis = null,
  roadmap,
  feasibility,
  scenarios = [],
}) {
  const isTargetAmount = goalType === 'TARGET_AMOUNT';
  const isSavingSolver = solveMode === 'SAVING';
  const dateStr = new Date().toLocaleDateString('vi-VN');
  const yearlyRows = (roadmap?.monthByMonthLog || []).filter(
    (r) => r.month === 0 || r.month % 12 === 0 || r.totalBalance >= (roadmap?.requiredPrincipal || 0)
  );

  const tableRowsHtml = yearlyRows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;">${
          r.month === 0 ? 'Hiện tại' : r.month % 12 === 0 ? `Năm ${r.month / 12}` : `Tháng ${r.month}`
        }</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(fmt(r.principalDeposited))} ₫</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;color:#047857;">+${esc(fmt(r.interestEarnedTotal))} ₫</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;font-weight:bold;">${esc(fmt(r.totalBalance))} ₫</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(fmt(r.monthlyPassiveIncomeGenerated))} ₫</td>
      </tr>`
    )
    .join('');

  const strengthsHtml = (feasibility?.strengths || []).map((s) => `<li>✅ ${esc(s)}</li>`).join('');
  const warningsHtml = (feasibility?.warnings || []).map((w) => `<li>⚠️ ${esc(w)}</li>`).join('');
  const scenariosHtml = scenarios
    .map((s) =>
      isSavingSolver
        ? `<li><strong>${esc(s.title)}:</strong> ${esc(vnd(s.r?.requiredMonthlyDeposit || 0))}/tháng</li>`
        : `<li><strong>${esc(s.title)}:</strong> ${esc(s.r?.timeText || '—')}</li>`
    )
    .join('');

  const hasTotalRange =
    typeof totalIncomeMin === 'number' && typeof totalIncomeMax === 'number' && totalIncomeMin !== totalIncomeMax;
  const totalIncomeLabel = hasTotalRange ? `${vnd(totalIncomeMin)} – ${vnd(totalIncomeMax)}` : vnd(salary);
  const fullTimeVal = salaryFullTime !== undefined ? salaryFullTime : salary;

  const incomeDetailRows = `
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Thu nhập công việc chính (Full-time)</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(fullTimeVal))}/tháng</td>
    </tr>
    ${
      freelanceMax > 0
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Thu nhập công việc phụ (Freelance / Part-time)</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        freelanceMin === freelanceMax ? esc(vnd(freelanceMax)) : `${esc(vnd(freelanceMin))} – ${esc(vnd(freelanceMax))}`
      }/tháng</td>
    </tr>`
        : ''
    }
    ${
      investMax > 0
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Thu nhập từ các khoản đầu tư</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        investMin === investMax ? esc(vnd(investMax)) : `${esc(vnd(investMin))} – ${esc(vnd(investMax))}`
      }/tháng</td>
    </tr>`
        : ''
    }
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>Tổng thu nhập hàng tháng</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;font-weight:bold;">${esc(
        totalIncomeLabel
      )} (${esc(pct(roadmap?.savingsRatePercent || 0, 1))} tiết kiệm)</td>
    </tr>`;

  const proExtrasRows =
    inputMode === 'advanced' && (annualStepUpPct > 0 || annualBonusAmount > 0 || inflationRatePct > 0)
      ? `
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Thông số Chuyên sâu</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">Tăng gửi ${esc(pct(annualStepUpPct, 0))}/năm · Thưởng ${esc(vnd(annualBonusAmount))}/năm · Lạm phát ${esc(pct(inflationRatePct, 1))}/năm</td>
    </tr>`
      : '';

  const householdHtmlSection = householdAnalysis
    ? `
  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">2B. Phân tích Hồ sơ ${esc(householdAnalysis.modeLabel)} &amp; Quỹ Dự Phòng</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Tổng thu nhập / Chi phí sinh hoạt / Dư tự do</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(householdAnalysis.totalIncomeAvg))} / ${esc(vnd(householdAnalysis.totalMonthlyExpense))} / ${esc(vnd(householdAnalysis.freeCashFlow))}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Quỹ dự phòng khẩn cấp (${esc(householdAnalysis.targetEmergencyMonths)} tháng chi phí)</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">Mục tiêu ${esc(vnd(householdAnalysis.emergencyFundTarget))} · Hiện có đạt ${esc(pct(householdAnalysis.emergencyFundCoveragePct, 1))} (${householdAnalysis.prioritizeEmergencyFund ? 'Lấp quỹ trước' : 'Theo dõi song song'})</td>
    </tr>
    ${
      householdAnalysis.hasPartner
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>Chia đóng góp hàng tháng (Người 1 / Người 2)</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(pct(householdAnalysis.contributionSplit.earner1Pct, 1))} (${esc(vnd(householdAnalysis.contributionSplit.earner1Contribution))}) / ${esc(pct(householdAnalysis.contributionSplit.earner2Pct, 1))} (${esc(vnd(householdAnalysis.contributionSplit.earner2Contribution))})</td>
    </tr>`
        : ''
    }
    ${
      householdAnalysis.stressTest?.ifEarner1Stops
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#fef3c7;"><strong>Stress-test rủi ro (${esc(householdAnalysis.stressTest.ifEarner1Stops.label)})</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        householdAnalysis.stressTest.ifEarner1Stops.canCoverExpenses
          ? `Vẫn đủ trang trải chi phí (dư ${esc(vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlySurplus))}/tháng)`
          : `Thiếu hụt ${esc(vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlyGap))}/tháng — Quỹ khẩn cấp chịu được ${esc(householdAnalysis.stressTest.ifEarner1Stops.runwayMonthsWithTarget || 0)} tháng`
      }</td>
    </tr>`
        : ''
    }
  </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Kế Hoạch Tích Luỹ Tiết Kiệm — VnSavingPro</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#18181b;line-height:1.5;max-width:780px;margin:0 auto;padding:20px;">
  <h1 style="color:#4338ca;margin-bottom:4px;">${
    isTargetAmount ? 'KẾ HOẠCH TÍCH LUỸ SỐ TIỀN MỤC TIÊU' : 'KẾ HOẠCH THU NHẬP THỤ ĐỘNG'
  } — VNSAVINGPRO</h1>
  <p style="color:#71717a;font-size:13px;margin-top:0;">Ngày lập báo cáo: ${esc(dateStr)} · Phiên bản: ${
    inputMode === 'advanced' ? 'Chuyên sâu (Thực tế)' : 'Cơ bản (Nhanh)'
  } · Cơ sở tính: ${calcMode === 'ACTUAL_DAYS' ? 'Chuẩn Thông tư 14 (30/365 ngày)' : 'Tháng đều / 12'}</p>

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">1. Thông số kế hoạch (${
    isSavingSolver ? 'Tính tiền gửi / tháng theo thời hạn' : 'Tính thời gian về đích'
  })</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${
        isTargetAmount ? 'Tổng số tiền tiết kiệm mục tiêu' : 'Mục tiêu thu nhập thụ động / tháng'
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(
        vnd(isTargetAmount ? targetAmount : target)
      )}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Vốn tiết kiệm ban đầu</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(capital))}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${
        isSavingSolver ? 'Thời hạn mục tiêu' : 'Gửi thêm mỗi tháng'
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        isSavingSolver
          ? `${esc(targetYears)} năm`
          : `${esc(vnd(saving))} (${esc(pct(roadmap?.savingsRatePercent || 0, 1))} tổng thu nhập ${esc(compact(salary))})`
      }</td>
    </tr>
    ${incomeDetailRows}
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Ngân hàng &amp; lãi suất áp dụng</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(bankName)} (${esc(tenureLabel)}) — ${esc(pct(rate))}/năm</td>
    </tr>
    ${proExtrasRows}
  </table>

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">2. Kết quả &amp; Đánh giá khả thi</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${
        isSavingSolver ? 'Số tiền cần gửi mỗi tháng' : 'Thời gian về đích'
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;font-weight:bold;color:#4338ca;">${esc(
        isSavingSolver ? `${vnd(roadmap?.requiredMonthlyDeposit || 0)} / tháng` : roadmap?.timeText || '—'
      )}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${
        isTargetAmount ? 'Mục tiêu cuối kỳ / Lãi thụ động' : 'Tổng vốn mục tiêu cần tích luỹ'
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;font-weight:bold;">${esc(
        vnd(roadmap?.requiredPrincipal || 0)
      )}${isTargetAmount ? ` (${esc(vnd(roadmap?.finalMonthlyPassiveIncome || 0))}/tháng)` : ''}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>Tổng gốc bạn tự gửi / Lãi kép đóng góp</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;">${esc(vnd(roadmap?.totalDeposited || 0))} / +${esc(vnd(roadmap?.totalCompoundInterest || 0))} (${esc(pct(roadmap?.compoundSharePct || 0, 1))})</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>Điểm khả thi tài chính</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;"><strong>${esc(feasibility?.score || 0)}/100</strong> — ${esc(feasibility?.ratingLabel || '')}</td>
    </tr>
  </table>

  ${householdHtmlSection}
  ${strengthsHtml || warningsHtml ? `<h3>Nhận xét kế hoạch</h3><ul>${strengthsHtml}${warningsHtml}</ul>` : ''}
  ${scenariosHtml ? `<h3>${isSavingSolver ? 'Kịch bản giảm số tiền cần gửi/tháng' : 'Kịch bản rút ngắn thời gian'}</h3><ul>${scenariosHtml}</ul>` : ''}

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">3. Lộ trình tích luỹ theo năm</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#f4f4f5;">
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:left;">Thời điểm</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">Tiền đã gửi</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">Lãi tích luỹ</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">Tổng tài sản</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">Lãi / tháng</th>
      </tr>
    </thead>
    <tbody>${tableRowsHtml}</tbody>
  </table>
</body>
</html>`;
}

export function buildPlanReportText(data) {
  const {
    inputMode = 'basic',
    goalType = 'PASSIVE_INCOME',
    target,
    targetAmount,
    solveMode = 'TIME',
    targetYears,
    capital,
    saving,
    salary,
    salaryFullTime,
    freelanceMin = 0,
    freelanceMax = 0,
    investMin = 0,
    investMax = 0,
    totalIncomeMin,
    totalIncomeMax,
    bankName,
    tenureLabel,
    rate,
    householdAnalysis = null,
    roadmap,
    feasibility,
  } = data;
  const isTargetAmount = goalType === 'TARGET_AMOUNT';
  const isSavingSolver = solveMode === 'SAVING';
  const yearlyRows = (roadmap?.monthByMonthLog || []).filter(
    (r) => r.month === 0 || r.month % 12 === 0 || r.totalBalance >= (roadmap?.requiredPrincipal || 0)
  );
  const lines = [
    `${isTargetAmount ? 'KẾ HOẠCH TÍCH LUỸ SỐ TIỀN MỤC TIÊU' : 'KẾ HOẠCH THU NHẬP THỤ ĐỘNG'} — VNSAVINGPRO`,
    `Ngày lập: ${new Date().toLocaleDateString('vi-VN')} · Phiên bản: ${
      inputMode === 'advanced' ? 'Chuyên sâu' : 'Cơ bản'
    }`,
    '',
    '1. THÔNG SỐ ĐẦU VÀO',
    isTargetAmount
      ? `- Số tiền tiết kiệm mục tiêu: ${vnd(targetAmount)}`
      : `- Thu nhập thụ động mong muốn: ${vnd(target)}/tháng`,
    `- Vốn ban đầu: ${vnd(capital)}`,
    isSavingSolver ? `- Thời hạn mong muốn: ${targetYears} năm` : `- Gửi thêm mỗi tháng: ${vnd(saving)}`,
    `- Thu nhập chính (Full-time): ${vnd(salaryFullTime !== undefined ? salaryFullTime : salary)}/tháng`,
    ...(freelanceMax > 0
      ? [`- Công việc phụ (Freelance/Part-time): ${freelanceMin === freelanceMax ? vnd(freelanceMax) : `${vnd(freelanceMin)} – ${vnd(freelanceMax)}`}/tháng`]
      : []),
    ...(investMax > 0
      ? [`- Thu nhập từ đầu tư: ${investMin === investMax ? vnd(investMax) : `${vnd(investMin)} – ${vnd(investMax)}`}/tháng`]
      : []),
    `- Tổng thu nhập hàng tháng: ${
      typeof totalIncomeMin === 'number' && typeof totalIncomeMax === 'number' && totalIncomeMin !== totalIncomeMax
        ? `${vnd(totalIncomeMin)} – ${vnd(totalIncomeMax)}`
        : vnd(salary)
    }`,
    `- Ngân hàng & lãi suất: ${bankName} (${tenureLabel}) — ${pct(rate)}/năm`,
    '',
    '2. KẾT QUẢ & ĐÁNH GIÁ',
    isSavingSolver
      ? `- Số tiền cần gửi mỗi tháng: ${vnd(roadmap?.requiredMonthlyDeposit || 0)}/tháng`
      : `- Thời gian về đích: ${roadmap?.timeText || '—'}`,
    `- Tổng vốn mục tiêu: ${vnd(roadmap?.requiredPrincipal || 0)}`,
    `- Lãi kép đóng góp: +${vnd(roadmap?.totalCompoundInterest || 0)} (${pct(roadmap?.compoundSharePct || 0, 1)})`,
    `- Độ khả thi: ${feasibility?.score || 0}/100 (${feasibility?.ratingLabel || ''})`,
    ...(householdAnalysis
      ? [
          '',
          `2B. PHÂN TÍCH HỒ SƠ ${householdAnalysis.modeLabel.toUpperCase()}`,
          `- Chi phí sinh hoạt hàng tháng: ${vnd(householdAnalysis.totalMonthlyExpense)} · Dòng tiền dư tự do: ${vnd(householdAnalysis.freeCashFlow)}`,
          `- Quỹ khẩn cấp (${householdAnalysis.targetEmergencyMonths} tháng): ${vnd(householdAnalysis.emergencyFundTarget)} (Vốn hiện có đạt ${pct(householdAnalysis.emergencyFundCoveragePct, 1)})`,
          ...(householdAnalysis.hasPartner
            ? [
                `- Chia đóng góp hàng tháng: Người 1 ${pct(householdAnalysis.contributionSplit.earner1Pct, 1)} (${vnd(householdAnalysis.contributionSplit.earner1Contribution)}) · Người 2 ${pct(householdAnalysis.contributionSplit.earner2Pct, 1)} (${vnd(householdAnalysis.contributionSplit.earner2Contribution)})`,
              ]
            : []),
        ]
      : []),
    '',
    '3. LỘ TRÌNH THEO NĂM',
    ...yearlyRows.map((r) => {
      const label = r.month === 0 ? 'Hiện tại' : r.month % 12 === 0 ? `Năm ${r.month / 12}` : `Tháng ${r.month}`;
      return `- ${label}: Tổng ${vnd(r.totalBalance)} (Gốc ${vnd(r.principalDeposited)}, Lãi +${vnd(r.interestEarnedTotal)}, Thu nhập/tháng ${vnd(r.monthlyPassiveIncomeGenerated)})`;
    }),
  ];
  return lines.join('\n');
}

export async function copyReportForGoogleDocs(data) {
  const html = buildPlanReportHTML(data);
  const text = buildPlanReportText(data);
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return true;
    } catch {
      // Fallback to plain text clipboard below
    }
  }
  await navigator.clipboard.writeText(text);
  return true;
}

export function downloadGoogleDocsFile(data) {
  const html = buildPlanReportHTML(data);
  const blob = new Blob(['\uFEFF', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VnSavingPro_GoogleDocs_${data.goalType === 'TARGET_AMOUNT' ? data.targetAmount : data.target}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
