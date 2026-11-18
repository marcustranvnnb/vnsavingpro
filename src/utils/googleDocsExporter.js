import { compact, fmt, pct, vnd } from './format.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPlanReportHTML({
  target,
  capital,
  saving,
  salary,
  bankName,
  tenureLabel,
  rate,
  calcMode,
  roadmap,
  feasibility,
  scenarios = [],
}) {
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
    .map((s) => `<li><strong>${esc(s.title)}:</strong> ${esc(s.r?.timeText || '—')}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Kế Hoạch Thu Nhập Thụ Động — VnSavingPro</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#18181b;line-height:1.5;max-width:780px;margin:0 auto;padding:20px;">
  <h1 style="color:#4338ca;margin-bottom:4px;">KẾ HOẠCH THU NHẬP THỤ ĐỘNG — VNSAVINGPRO</h1>
  <p style="color:#71717a;font-size:13px;margin-top:0;">Ngày lập báo cáo: ${esc(dateStr)} · Cơ sở tính: ${
    calcMode === 'ACTUAL_DAYS' ? 'Chuẩn Thông tư 14 (30/365 ngày)' : 'Tháng đều / 12'
  }</p>

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">1. Thông số kế hoạch</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Mục tiêu thu nhập thụ động / tháng</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(target))}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Vốn tiết kiệm ban đầu</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(capital))}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Gửi thêm mỗi tháng</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(saving))} (${esc(pct(roadmap?.savingsRatePercent || 0, 1))} lương ${esc(compact(salary))})</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>Ngân hàng &amp; lãi suất áp dụng</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(bankName)} (${esc(tenureLabel)}) — ${esc(pct(rate))}/năm</td>
    </tr>
  </table>

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">2. Kết quả &amp; Đánh giá khả thi</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>Thời gian về đích</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;font-weight:bold;color:#4338ca;">${esc(roadmap?.timeText || '—')}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>Tổng vốn mục tiêu cần tích luỹ</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;font-weight:bold;">${esc(vnd(roadmap?.requiredPrincipal || 0))}</td>
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

  ${strengthsHtml || warningsHtml ? `<h3>Nhận xét kế hoạch</h3><ul>${strengthsHtml}${warningsHtml}</ul>` : ''}
  ${scenariosHtml ? `<h3>Kịch bản rút ngắn thời gian</h3><ul>${scenariosHtml}</ul>` : ''}

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
  const { target, capital, saving, bankName, tenureLabel, rate, roadmap, feasibility } = data;
  const yearlyRows = (roadmap?.monthByMonthLog || []).filter(
    (r) => r.month === 0 || r.month % 12 === 0 || r.totalBalance >= (roadmap?.requiredPrincipal || 0)
  );
  const lines = [
    'KẾ HOẠCH THU NHẬP THỤ ĐỘNG — VNSAVINGPRO',
    `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`,
    '',
    '1. THÔNG SỐ ĐẦU VÀO',
    `- Thu nhập thụ động mong muốn: ${vnd(target)}/tháng`,
    `- Vốn ban đầu: ${vnd(capital)}`,
    `- Gửi thêm mỗi tháng: ${vnd(saving)}`,
    `- Ngân hàng & lãi suất: ${bankName} (${tenureLabel}) — ${pct(rate)}/năm`,
    '',
    '2. KẾT QUẢ & ĐÁNH GIÁ',
    `- Thời gian về đích: ${roadmap?.timeText || '—'}`,
    `- Tổng vốn cần tích luỹ: ${vnd(roadmap?.requiredPrincipal || 0)}`,
    `- Lãi kép đóng góp: +${vnd(roadmap?.totalCompoundInterest || 0)} (${pct(roadmap?.compoundSharePct || 0, 1)})`,
    `- Độ khả thi: ${feasibility?.score || 0}/100 (${feasibility?.ratingLabel || ''})`,
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
  a.download = `VnSavingPro_GoogleDocs_${data.target}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
