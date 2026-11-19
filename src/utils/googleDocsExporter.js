import { compact, fmt, getFormatLang, pct, vnd } from './format.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normLang(l) {
  return l === 'en' || l === 'ja' ? l : 'vi';
}

function txL(lang, vi, en, ja) {
  if (lang === 'en') return en;
  if (lang === 'ja') return ja;
  return vi;
}

function formatReportDate(lang) {
  const loc = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'vi-VN';
  return new Date().toLocaleDateString(loc);
}

export function buildPlanReportHTML(data) {
  const {
    lang: inputLang,
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
  } = data;

  const lang = normLang(inputLang || getFormatLang());
  const tx = (vi, en, ja) => txL(lang, vi, en, ja);
  const isTargetAmount = goalType === 'TARGET_AMOUNT';
  const isSavingSolver = solveMode === 'SAVING';
  const dateStr = formatReportDate(lang);
  const yearlyRows = (roadmap?.monthByMonthLog || []).filter(
    (r) => r.month === 0 || r.month % 12 === 0 || r.totalBalance >= (roadmap?.requiredPrincipal || 0)
  );

  const tableRowsHtml = yearlyRows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;">${
          r.month === 0
            ? tx('Hiện tại', 'Now', '現在')
            : r.month % 12 === 0
              ? tx(`Năm ${r.month / 12}`, `Year ${r.month / 12}`, `${r.month / 12}年目`)
              : tx(`Tháng ${r.month}`, `Month ${r.month}`, `${r.month}ヶ月目`)
        }</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(fmt(r.principalDeposited, lang))} ₫</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;color:#047857;">+${esc(fmt(r.interestEarnedTotal, lang))} ₫</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;font-weight:bold;">${esc(fmt(r.totalBalance, lang))} ₫</td>
        <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(fmt(r.monthlyPassiveIncomeGenerated, lang))} ₫</td>
      </tr>`
    )
    .join('');

  const strengthsHtml = (feasibility?.strengths || []).map((s) => `<li>✅ ${esc(s)}</li>`).join('');
  const warningsHtml = (feasibility?.warnings || []).map((w) => `<li>⚠️ ${esc(w)}</li>`).join('');
  const perMonthShort = tx('/tháng', '/mo', '/月');
  const scenariosHtml = scenarios
    .map((s) =>
      isSavingSolver
        ? `<li><strong>${esc(s.title)}:</strong> ${esc(vnd(s.r?.requiredMonthlyDeposit || 0, lang))}${perMonthShort}</li>`
        : `<li><strong>${esc(s.title)}:</strong> ${esc(s.r?.timeText || '—')}</li>`
    )
    .join('');

  const hasTotalRange =
    typeof totalIncomeMin === 'number' && typeof totalIncomeMax === 'number' && totalIncomeMin !== totalIncomeMax;
  const totalIncomeLabel = hasTotalRange ? `${vnd(totalIncomeMin, lang)} – ${vnd(totalIncomeMax, lang)}` : vnd(salary, lang);
  const fullTimeVal = salaryFullTime !== undefined ? salaryFullTime : salary;

  const incomeDetailRows = `
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Thu nhập công việc chính (Full-time)', 'Primary Full-Time Income', '本業収入（フルタイム）')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(fullTimeVal, lang))}${perMonthShort}</td>
    </tr>
    ${
      freelanceMax > 0
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Thu nhập công việc phụ (Freelance / Part-time)', 'Side Income (Freelance / Part-time)', '副業収入（フリーランス等）')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        freelanceMin === freelanceMax
          ? esc(vnd(freelanceMax, lang))
          : `${esc(vnd(freelanceMin, lang))} – ${esc(vnd(freelanceMax, lang))}`
      }${perMonthShort}</td>
    </tr>`
        : ''
    }
    ${
      investMax > 0
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Thu nhập từ các khoản đầu tư', 'Investment Income', '投資収入')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        investMin === investMax
          ? esc(vnd(investMax, lang))
          : `${esc(vnd(investMin, lang))} – ${esc(vnd(investMax, lang))}`
      }${perMonthShort}</td>
    </tr>`
        : ''
    }
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${tx('Tổng thu nhập hàng tháng', 'Total Monthly Income', '月間総収入')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;font-weight:bold;">${esc(
        totalIncomeLabel
      )} (${esc(pct(roadmap?.savingsRatePercent || 0, 1, lang))} ${tx('tiết kiệm', 'saved', '積立')})</td>
    </tr>`;

  const proExtrasRows =
    inputMode === 'advanced' && (annualStepUpPct > 0 || annualBonusAmount > 0 || inflationRatePct > 0)
      ? `
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Thông số Chuyên sâu', 'Pro Parameters', '詳細パラメータ')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${tx('Tăng gửi', 'Step-up', '毎年増額')} ${esc(pct(annualStepUpPct, 0, lang))}${tx('/năm', '/yr', '/年')} · ${tx('Thưởng', 'Bonus', '賞与')} ${esc(vnd(annualBonusAmount, lang))}${tx('/năm', '/yr', '/年')} · ${tx('Lạm phát', 'Inflation', 'インフレ')} ${esc(pct(inflationRatePct, 1, lang))}${tx('/năm', '/yr', '/年')}</td>
    </tr>`
      : '';

  const householdHtmlSection = householdAnalysis
    ? `
  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">${tx('2B. Phân tích Hồ sơ', '2B. Household Analysis:', '2B. 世帯別分析：')} ${esc(householdAnalysis.modeLabel)} &amp; ${tx('Quỹ Dự Phòng', 'Emergency Fund', '緊急資金')}</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Tổng thu nhập / Chi phí sinh hoạt / Dư tự do', 'Total Income / Living Expenses / Free Cash Flow', '月収合計 / 生活費 / 余剰資金')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(householdAnalysis.totalIncomeAvg, lang))} / ${esc(vnd(householdAnalysis.totalMonthlyExpense, lang))} / ${esc(vnd(householdAnalysis.freeCashFlow, lang))}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx(`Quỹ dự phòng khẩn cấp (${householdAnalysis.targetEmergencyMonths} tháng chi phí)`, `Emergency Fund (${householdAnalysis.targetEmergencyMonths} months)`, `緊急防衛資金（生活費${householdAnalysis.targetEmergencyMonths}ヶ月分）`)}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${tx('Mục tiêu', 'Target', '目標')} ${esc(vnd(householdAnalysis.emergencyFundTarget, lang))} · ${tx('Hiện có đạt', 'Funded', '達成率')} ${esc(pct(householdAnalysis.emergencyFundCoveragePct, 1, lang))} (${householdAnalysis.prioritizeEmergencyFund ? tx('Lấp quỹ trước', 'Fund-First', '緊急資金優先') : tx('Theo dõi song song', 'Parallel Tracking', '並行トラッキング')})</td>
    </tr>
    ${
      householdAnalysis.hasPartner
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${tx('Chia đóng góp hàng tháng (Người 1 / Người 2)', 'Monthly Contribution Split (Earner 1 / Earner 2)', '毎月の積立分担（1人目 / 2人目）')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(pct(householdAnalysis.contributionSplit.earner1Pct, 1, lang))} (${esc(vnd(householdAnalysis.contributionSplit.earner1Contribution, lang))}) / ${esc(pct(householdAnalysis.contributionSplit.earner2Pct, 1, lang))} (${esc(vnd(householdAnalysis.contributionSplit.earner2Contribution, lang))})</td>
    </tr>`
        : ''
    }
    ${
      householdAnalysis.stressTest?.ifEarner1Stops
        ? `<tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#fef3c7;"><strong>${tx('Stress-test rủi ro', 'Stress-test', 'ストレステスト')} (${esc(householdAnalysis.stressTest.ifEarner1Stops.label)})</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        householdAnalysis.stressTest.ifEarner1Stops.canCoverExpenses
          ? tx(
              `Vẫn đủ trang trải chi phí (dư ${vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlySurplus, lang)}/tháng)`,
              `Still covers expenses (+${vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlySurplus, lang)}/mo surplus)`,
              `生活費を賄えます（黒字 ${vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlySurplus, lang)}/月）`
            )
          : tx(
              `Thiếu hụt ${vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlyGap, lang)}/tháng — Quỹ khẩn cấp chịu được ${householdAnalysis.stressTest.ifEarner1Stops.runwayMonthsWithTarget || 0} tháng`,
              `Shortfall ${vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlyGap, lang)}/mo — Emergency fund lasts ${householdAnalysis.stressTest.ifEarner1Stops.runwayMonthsWithTarget || 0} mos`,
              `不足 ${vnd(householdAnalysis.stressTest.ifEarner1Stops.monthlyGap, lang)}/月 — 緊急資金耐久 ${householdAnalysis.stressTest.ifEarner1Stops.runwayMonthsWithTarget || 0}ヶ月`
            )
      }</td>
    </tr>`
        : ''
    }
  </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${esc(tx('Kế Hoạch Tích Luỹ Tiết Kiệm — VnSavingPro', 'Savings & Passive Income Plan — VnSavingPro', '積立・不労所得ロードマップ — VnSavingPro'))}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#18181b;line-height:1.5;max-width:780px;margin:0 auto;padding:20px;">
  <h1 style="color:#4338ca;margin-bottom:4px;">${
    isTargetAmount
      ? tx('KẾ HOẠCH TÍCH LUỸ SỐ TIỀN MỤC TIÊU', 'TARGET SAVINGS CAPITAL ROADMAP', '目標資産積立ロードマップ')
      : tx('KẾ HOẠCH THU NHẬP THỤ ĐỘNG', 'PASSIVE INCOME ROADMAP', '不労所得ロードマップ')
  } — VNSAVINGPRO</h1>
  <p style="color:#71717a;font-size:13px;margin-top:0;">${tx('Ngày lập báo cáo:', 'Report Date:', '作成日：')} ${esc(dateStr)} · ${tx('Phiên bản:', 'Mode:', 'モード：')} ${
    inputMode === 'advanced' ? tx('Chuyên sâu (Thực tế)', 'Pro (Realistic)', '詳細（現実ベース）') : tx('Cơ bản (Nhanh)', 'Basic (Quick)', '基本（簡易）')
  } · ${tx('Cơ sở tính:', 'Basis:', '計算基準：')} ${calcMode === 'ACTUAL_DAYS' ? tx('Chuẩn Thông tư 14 (30/365 ngày)', 'SBV Circular 14 (30/365)', '中銀通達14号 (30/365日)') : tx('Tháng đều / 12', 'Nominal Months / 12', '月割り / 12')}</p>

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">${tx('1. Thông số kế hoạch', '1. Plan Parameters', '1. プラン設定')} (${
    isSavingSolver ? tx('Tính tiền gửi / tháng theo thời hạn', 'Solve Monthly Saving', '必要毎月積立額を計算') : tx('Tính thời gian về đích', 'Solve Time to Goal', '達成期間を計算')
  })</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${
        isTargetAmount
          ? tx('Tổng số tiền tiết kiệm mục tiêu', 'Target Savings Capital', '目標積立額')
          : tx('Mục tiêu thu nhập thụ động / tháng', 'Target Monthly Passive Income', '毎月の目標不労所得')
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(
        vnd(isTargetAmount ? targetAmount : target, lang)
      )}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Vốn tiết kiệm ban đầu', 'Initial Capital', '初期元本')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(vnd(capital, lang))}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${
        isSavingSolver ? tx('Thời hạn mục tiêu', 'Target Horizon', '目標期間') : tx('Gửi thêm mỗi tháng', 'Monthly Contribution', '毎月の積立額')
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${
        isSavingSolver
          ? `${esc(targetYears)} ${tx('năm', 'yrs', '年')}`
          : `${esc(vnd(saving, lang))} (${esc(pct(roadmap?.savingsRatePercent || 0, 1, lang))} · ${esc(compact(salary, lang))})`
      }</td>
    </tr>
    ${incomeDetailRows}
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#f4f4f5;"><strong>${tx('Ngân hàng & lãi suất áp dụng', 'Bank & Interest Rate', '銀行・適用金利')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${esc(bankName)} (${esc(tenureLabel)}) — ${esc(pct(rate, 2, lang))}${tx('/năm', '/yr', '/年')}</td>
    </tr>
    ${proExtrasRows}
  </table>

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">${tx('2. Kết quả & Đánh giá khả thi', '2. Results & Feasibility', '2. 計算結果と実現可能性')}</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px;">
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${
        isSavingSolver ? tx('Số tiền cần gửi mỗi tháng', 'Required Monthly Saving', '必要な毎月積立額') : tx('Thời gian về đích', 'Time to Reach Goal', '目標達成期間')
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;font-weight:bold;color:#4338ca;">${esc(
        isSavingSolver ? `${vnd(roadmap?.requiredMonthlyDeposit || 0, lang)}${perMonthShort}` : roadmap?.timeText || '—'
      )}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${
        isTargetAmount ? tx('Mục tiêu cuối kỳ / Lãi thụ động', 'Target Capital / Passive Yield', '目標資産 / 毎月利息') : tx('Tổng vốn mục tiêu cần tích luỹ', 'Total Target Capital Needed', '必要な総資産')
      }</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;font-weight:bold;">${esc(
        vnd(roadmap?.requiredPrincipal || 0, lang)
      )}${isTargetAmount ? ` (${esc(vnd(roadmap?.finalMonthlyPassiveIncome || 0, lang))}${perMonthShort})` : ''}</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${tx('Tổng gốc bạn tự gửi / Lãi kép đóng góp', 'Total Principal / Compound Interest', '自己積立元本 / 複利利息')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;">${esc(vnd(roadmap?.totalDeposited || 0, lang))} / +${esc(vnd(roadmap?.totalCompoundInterest || 0, lang))} (${esc(pct(roadmap?.compoundSharePct || 0, 1, lang))})</td>
    </tr>
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;background:#eef2ff;"><strong>${tx('Điểm khả thi tài chính', 'Feasibility Score', '実現可能性スコア')}</strong></td>
      <td style="padding:8px 10px;border:1px solid #d4d4d8;"><strong>${esc(feasibility?.score || 0)}/100</strong> — ${esc(feasibility?.ratingLabel || '')}</td>
    </tr>
  </table>

  ${householdHtmlSection}
  ${strengthsHtml || warningsHtml ? `<h3>${tx('Nhận xét kế hoạch', 'Plan Insights', 'プラン診断コメント')}</h3><ul>${strengthsHtml}${warningsHtml}</ul>` : ''}
  ${scenariosHtml ? `<h3>${isSavingSolver ? tx('Kịch bản giảm số tiền cần gửi/tháng', 'Ways to Lower Monthly Deposit', '毎月の積立負担を減らす案') : tx('Kịch bản rút ngắn thời gian', 'Ways to Reach Goal Faster', '目標達成を早めるシナリオ')}</h3><ul>${scenariosHtml}</ul>` : ''}

  <h2 style="color:#18181b;border-bottom:2px solid #e4e4e7;padding-bottom:4px;">${tx('3. Lộ trình tích luỹ theo năm', '3. Yearly Accumulation Schedule', '3. 年次積立推移テーブル')}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#f4f4f5;">
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:left;">${tx('Thời điểm', 'Milestone', '時期')}</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${tx('Tiền đã gửi', 'Principal', '積立元本')}</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${tx('Lãi tích luỹ', 'Interest', '累計利息')}</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${tx('Tổng tài sản', 'Total Balance', '総資産')}</th>
        <th style="padding:8px 10px;border:1px solid #d4d4d8;text-align:right;">${tx('Lãi / tháng', 'Monthly Yield', '毎月利息')}</th>
      </tr>
    </thead>
    <tbody>${tableRowsHtml}</tbody>
  </table>
</body>
</html>`;
}

export function buildPlanReportText(data) {
  const {
    lang: inputLang,
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

  const lang = normLang(inputLang || getFormatLang());
  const tx = (vi, en, ja) => txL(lang, vi, en, ja);
  const perMonthShort = tx('/tháng', '/mo', '/月');
  const isTargetAmount = goalType === 'TARGET_AMOUNT';
  const isSavingSolver = solveMode === 'SAVING';
  const yearlyRows = (roadmap?.monthByMonthLog || []).filter(
    (r) => r.month === 0 || r.month % 12 === 0 || r.totalBalance >= (roadmap?.requiredPrincipal || 0)
  );
  const lines = [
    `${isTargetAmount ? tx('KẾ HOẠCH TÍCH LUỸ SỐ TIỀN MỤC TIÊU', 'TARGET CAPITAL ROADMAP', '目標資産積立ロードマップ') : tx('KẾ HOẠCH THU NHẬP THỤ ĐỘNG', 'PASSIVE INCOME ROADMAP', '不労所得ロードマップ')} — VNSAVINGPRO`,
    `${tx('Ngày lập:', 'Date:', '作成日：')} ${formatReportDate(lang)} · ${tx('Phiên bản:', 'Mode:', 'モード：')} ${
      inputMode === 'advanced' ? tx('Chuyên sâu', 'Pro', '詳細') : tx('Cơ bản', 'Basic', '基本')
    }`,
    '',
    tx('1. THÔNG SỐ ĐẦU VÀO', '1. INPUT PARAMETERS', '1. 入力パラメータ'),
    isTargetAmount
      ? `- ${tx('Số tiền tiết kiệm mục tiêu', 'Target capital', '目標積立額')}: ${vnd(targetAmount, lang)}`
      : `- ${tx('Thu nhập thụ động mong muốn', 'Target passive income', '毎月不労所得目標')}: ${vnd(target, lang)}${perMonthShort}`,
    `- ${tx('Vốn ban đầu', 'Initial capital', '初期元本')}: ${vnd(capital, lang)}`,
    isSavingSolver
      ? `- ${tx('Thời hạn mong muốn', 'Target horizon', '目標期間')}: ${targetYears} ${tx('năm', 'yrs', '年')}`
      : `- ${tx('Gửi thêm mỗi tháng', 'Monthly deposit', '毎月の積立額')}: ${vnd(saving, lang)}`,
    `- ${tx('Thu nhập chính (Full-time)', 'Primary full-time income', '本業月収')}: ${vnd(salaryFullTime !== undefined ? salaryFullTime : salary, lang)}${perMonthShort}`,
    ...(freelanceMax > 0
      ? [
          `- ${tx('Công việc phụ (Freelance/Part-time)', 'Side income (Freelance)', '副業収入')}: ${
            freelanceMin === freelanceMax ? vnd(freelanceMax, lang) : `${vnd(freelanceMin, lang)} – ${vnd(freelanceMax, lang)}`
          }${perMonthShort}`,
        ]
      : []),
    ...(investMax > 0
      ? [
          `- ${tx('Thu nhập từ đầu tư', 'Investment income', '投資収入')}: ${
            investMin === investMax ? vnd(investMax, lang) : `${vnd(investMin, lang)} – ${vnd(investMax, lang)}`
          }${perMonthShort}`,
        ]
      : []),
    `- ${tx('Tổng thu nhập hàng tháng', 'Total monthly income', '合計月収')}: ${
      typeof totalIncomeMin === 'number' && typeof totalIncomeMax === 'number' && totalIncomeMin !== totalIncomeMax
        ? `${vnd(totalIncomeMin, lang)} – ${vnd(totalIncomeMax, lang)}`
        : vnd(salary, lang)
    }`,
    `- ${tx('Ngân hàng & lãi suất', 'Bank & rate', '銀行・金利')}: ${bankName} (${tenureLabel}) — ${pct(rate, 2, lang)}${tx('/năm', '/yr', '/年')}`,
    '',
    tx('2. KẾT QUẢ & ĐÁNH GIÁ', '2. RESULTS & FEASIBILITY', '2. 計算結果と評価'),
    isSavingSolver
      ? `- ${tx('Số tiền cần gửi mỗi tháng', 'Required monthly deposit', '必要積立額')}: ${vnd(roadmap?.requiredMonthlyDeposit || 0, lang)}${perMonthShort}`
      : `- ${tx('Thời gian về đích', 'Time to goal', '目標達成期間')}: ${roadmap?.timeText || '—'}`,
    `- ${tx('Tổng vốn mục tiêu', 'Target principal', '必要元本')}: ${vnd(roadmap?.requiredPrincipal || 0, lang)}`,
    `- ${tx('Lãi kép đóng góp', 'Compound interest share', '複利利息貢献')}: +${vnd(roadmap?.totalCompoundInterest || 0, lang)} (${pct(roadmap?.compoundSharePct || 0, 1, lang)})`,
    `- ${tx('Độ khả thi', 'Feasibility score', '実現可能性スコア')}: ${feasibility?.score || 0}/100 (${feasibility?.ratingLabel || ''})`,
    ...(householdAnalysis
      ? [
          '',
          `${tx('2B. PHÂN TÍCH HỒ SƠ', '2B. HOUSEHOLD PROFILE:', '2B. 世帯別プロファイル：')} ${householdAnalysis.modeLabel.toUpperCase()}`,
          `- ${tx('Chi phí sinh hoạt hàng tháng', 'Monthly living expenses', '毎月生活費')}: ${vnd(householdAnalysis.totalMonthlyExpense, lang)} · ${tx('Dòng tiền dư tự do', 'Free cash flow', '余剰資金')}: ${vnd(householdAnalysis.freeCashFlow, lang)}`,
          `- ${tx(`Quỹ khẩn cấp (${householdAnalysis.targetEmergencyMonths} tháng)`, `Emergency fund (${householdAnalysis.targetEmergencyMonths} mos)`, `緊急防衛資金（${householdAnalysis.targetEmergencyMonths}ヶ月分）`)}: ${vnd(householdAnalysis.emergencyFundTarget, lang)} (${pct(householdAnalysis.emergencyFundCoveragePct, 1, lang)})`,
          ...(householdAnalysis.hasPartner
            ? [
                `- ${tx('Chia đóng góp hàng tháng', 'Contribution split', '拠出分担')}: ${tx('Người 1', 'Earner 1', '1人目')} ${pct(householdAnalysis.contributionSplit.earner1Pct, 1, lang)} (${vnd(householdAnalysis.contributionSplit.earner1Contribution, lang)}) · ${tx('Người 2', 'Earner 2', '2人目')} ${pct(householdAnalysis.contributionSplit.earner2Pct, 1, lang)} (${vnd(householdAnalysis.contributionSplit.earner2Contribution, lang)})`,
              ]
            : []),
        ]
      : []),
    '',
    tx('3. LỘ TRÌNH THEO NĂM', '3. YEARLY ROADMAP', '3. 年次ロードマップ'),
    ...yearlyRows.map((r) => {
      const label =
        r.month === 0
          ? tx('Hiện tại', 'Now', '現在')
          : r.month % 12 === 0
            ? tx(`Năm ${r.month / 12}`, `Year ${r.month / 12}`, `${r.month / 12}年目`)
            : tx(`Tháng ${r.month}`, `Month ${r.month}`, `${r.month}ヶ月目`);
      return `- ${label}: ${tx('Tổng', 'Total', '合計')} ${vnd(r.totalBalance, lang)} (${tx('Gốc', 'Principal', '元本')} ${vnd(r.principalDeposited, lang)}, ${tx('Lãi', 'Interest', '利息')} +${vnd(r.interestEarnedTotal, lang)}, ${tx('Thu nhập/tháng', 'Yield/mo', '毎月利息')} ${vnd(r.monthlyPassiveIncomeGenerated, lang)})`;
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
  a.download = `VnSavingPro_Report_${data.goalType === 'TARGET_AMOUNT' ? data.targetAmount : data.target}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
