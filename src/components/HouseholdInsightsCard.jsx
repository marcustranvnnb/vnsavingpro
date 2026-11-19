import React from 'react';
import { AlertTriangle, CheckCircle2, HeartHandshake, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { compact, pct, vnd } from '../utils/format.js';
import { Badge, Card, CardHeader, Progress, cx } from './ui.jsx';

function StressTestRow({ item, tx }) {
  if (!item) return null;
  const ok = item.canCoverExpenses;
  return (
    <div
      className={cx(
        'rounded-xl border p-3.5',
        ok ? 'border-emerald-400/20 bg-emerald-500/[0.05]' : 'border-amber-400/20 bg-amber-500/[0.05]'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
          {ok ? (
            <CheckCircle2 className="size-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="size-3.5 text-amber-400" />
          )}
          {item.label}
        </span>
        <Badge tone={ok ? 'success' : 'warning'}>
          {ok
            ? tx('Vẫn trụ được chi phí', 'Still covers expenses', '生活費を賄えます')
            : tx(`Thiếu ${compact(item.monthlyGap)}/th`, `Gap ${compact(item.monthlyGap)}/mo`, `不足 ${compact(item.monthlyGap)}/月`)}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] tabular-nums text-zinc-400 sm:grid-cols-3 sm:gap-2">
        <div>
          {tx('Thu nhập còn:', 'Remaining income:', '残存収入：')}{' '}
          <strong className="text-zinc-200">{compact(item.remainingIncome)}</strong>
        </div>
        {ok ? (
          <div>
            {tx('Dư mỗi tháng:', 'Monthly surplus:', '毎月黒字：')}{' '}
            <strong className="text-emerald-300">+{compact(item.monthlySurplus)}</strong>
          </div>
        ) : (
          <>
            <div>
              {tx('Vốn hiện có trụ:', 'Current runway:', '現資産での耐久：')}{' '}
              <strong className="text-zinc-200">
                {item.runwayMonthsWithCapital !== null
                  ? tx(`${item.runwayMonthsWithCapital} tháng`, `${item.runwayMonthsWithCapital} mos`, `${item.runwayMonthsWithCapital}ヶ月`)
                  : '—'}
              </strong>
            </div>
            <div>
              {tx('Khi đủ quỹ DP:', 'With full EF:', '緊急資金満額時：')}{' '}
              <strong className="text-indigo-300">
                {item.runwayMonthsWithTarget !== null
                  ? tx(`${item.runwayMonthsWithTarget} tháng`, `${item.runwayMonthsWithTarget} mos`, `${item.runwayMonthsWithTarget}ヶ月`)
                  : '—'}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function HouseholdInsightsCard({ analysis, roadmap }) {
  const { tx } = useI18n();
  if (!analysis) return null;

  const efTarget = analysis.emergencyFundTarget || 0;
  const efPct = analysis.emergencyFundCoveragePct ?? 0;
  const split = analysis.contributionSplit;
  const netPositive = analysis.freeCashFlow >= 0;

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title={tx(
          `Phân tích Tài chính ${analysis.modeLabel}`,
          `${analysis.modeLabel} Financial Breakdown`,
          `${analysis.modeLabel} 財務分析`
        )}
        description={
          analysis.hasPartner
            ? tx(
                'Theo dõi dòng tiền hộ, tỷ lệ đóng góp 2 người, quỹ khẩn cấp và kiểm tra sức chịu đựng khi biến động thu nhập.',
                'Track household cash flow, 2-earner contribution split, emergency buffer, and income shock stress-tests.',
                '世帯のキャッシュフロー、2人の拠出配分、緊急防衛資金、収入変動ストレステストを確認します。'
              )
            : tx(
                'Kiểm soát dòng tiền sau chi tiêu, quỹ dự phòng khẩn cấp cá nhân và mức bao phủ chi phí.',
                'Monitor post-expense free cash flow, personal emergency buffer, and passive expense coverage.',
                '生活費控除後の余剰資金、個人緊急資金の達成率、生活費カバー率を把握します。'
              )
        }
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{analysis.modeLabel}</Badge>
            {analysis.mode === 'FAMILY' && analysis.dependentsCount > 0 && (
              <Badge tone="neutral">
                {tx(
                  `${analysis.dependentsCount} người phụ thuộc`,
                  `${analysis.dependentsCount} dependents`,
                  `扶養家族 ${analysis.dependentsCount}人`
                )}
              </Badge>
            )}
          </div>
        }
      />

      {/* Top 3 Household Metrics */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11px] text-zinc-400">
            {tx('Chi phí sinh hoạt / tháng', 'Monthly Living Expenses', '毎月の生活費')}
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums text-white">{vnd(analysis.totalMonthlyExpense)}</p>
          {analysis.mode === 'FAMILY' && analysis.dependentsCost > 0 && (
            <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
              {tx(
                `Cố định ${compact(analysis.fixedExpense)} + Phụ thuộc ${compact(analysis.dependentsCost)}`,
                `Fixed ${compact(analysis.fixedExpense)} + Dependents ${compact(analysis.dependentsCost)}`,
                `固定費 ${compact(analysis.fixedExpense)} + 扶養費 ${compact(analysis.dependentsCost)}`
              )}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11px] text-zinc-400">
            {tx('Dòng tiền dư tự do / tháng', 'Free Cash Flow / Month', '毎月の余剰キャッシュフロー')}
          </p>
          <p
            className={cx(
              'mt-1 text-base font-semibold tabular-nums',
              netPositive ? 'text-emerald-300' : 'text-red-300'
            )}
          >
            {netPositive ? '+' : ''}
            {vnd(analysis.freeCashFlow)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {netPositive
              ? tx('Thu nhập − Chi phí − Tiền gửi', 'Income − Expenses − Savings', '収入 − 生活費 − 積立額')
              : tx('Đang vượt khả năng dòng tiền', 'Exceeds monthly cash flow', '月間キャッシュフロー超過')}
          </p>
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11px] text-zinc-400">
            {tx('Lãi thụ động / Chi phí khi đạt', 'Passive Income / Expenses at Goal', '目標時の生活費カバー率')}
          </p>
          <p className="mt-1 text-base font-semibold tabular-nums text-indigo-300">
            {pct(analysis.expenseCoveragePct, 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {analysis.expenseCoveragePct >= 100
              ? tx('Tự do chi phí sinh hoạt', 'Covers 100% living costs', '生活費を完全カバー')
              : tx('Mức độ bù đắp chi tiêu', 'Living expense offset ratio', '生活費補填割合')}
          </p>
        </div>
      </div>

      {/* Emergency Fund Status */}
      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-white">
            {efPct >= 100 ? (
              <ShieldCheck className="size-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="size-4 text-amber-400" />
            )}
            {tx(
              `Quỹ Dự Phòng Khẩn Cấp (${analysis.targetEmergencyMonths} tháng chi tiêu)`,
              `Emergency Fund (${analysis.targetEmergencyMonths} months of expenses)`,
              `緊急防衛資金（生活費${analysis.targetEmergencyMonths}ヶ月分）`
            )}
          </span>
          <Badge tone={efPct >= 100 ? 'success' : 'warning'}>
            {efPct >= 100
              ? tx('Đã đủ 100%', '100% Funded', '100% 確保済み')
              : tx(
                  `Đạt ${pct(efPct, 0)} · Thiếu ${compact(analysis.emergencyFundShortfall)}`,
                  `${pct(efPct, 0)} funded · Short ${compact(analysis.emergencyFundShortfall)}`,
                  `達成 ${pct(efPct, 0)} · 不足 ${compact(analysis.emergencyFundShortfall)}`
                )}
          </Badge>
        </div>

        <div className="mt-2.5">
          <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] tabular-nums text-zinc-400">
            <span>
              {tx(
                `Vốn hiện có phân bổ dự phòng: ${compact(analysis.emergencyFundCoveredByCapital)}`,
                `Capital allocated to EF: ${compact(analysis.emergencyFundCoveredByCapital)}`,
                `現在の緊急資金充当元本：${compact(analysis.emergencyFundCoveredByCapital)}`
              )}
            </span>
            <span>
              {tx(
                `Mục tiêu khuyến nghị: ${vnd(efTarget)}`,
                `Recommended target: ${vnd(efTarget)}`,
                `推奨目標額：${vnd(efTarget)}`
              )}
            </span>
          </div>
          <Progress value={efPct} />
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-400">
          {roadmap?.prioritizeEmergencyFund ? (
            roadmap.emergencyFundMonths > 0 ? (
              <>
                <strong className="text-indigo-300">
                  {tx('Chế độ Lấp Quỹ Trước đang bật:', 'Fund-First Mode Active:', '緊急資金優先モード有効：')}
                </strong>{' '}
                {tx(
                  `Gửi toàn bộ tiết kiệm vào sổ ngắn hạn 1T–3T (4,75%/năm) để hoàn thành quỹ khẩn cấp trong ${roadmap.emergencyFundMonths} tháng đầu, sau đó mất thêm ${roadmap.goalOnlyMonths} tháng cho mục tiêu chính.`,
                  `All deposits go into liquid 1M–3M passbooks (4.75%/yr) to complete your emergency fund in the first ${roadmap.emergencyFundMonths} months, followed by ${roadmap.goalOnlyMonths} months for your primary goal.`,
                  `最初の${roadmap.emergencyFundMonths}ヶ月は短期流動枠（1〜3ヶ月・年4.75%）へ全額積立し、緊急資金完成後の${roadmap.goalOnlyMonths}ヶ月で本目標へ複利運用します。`
                )}
              </>
            ) : (
              <>
                <strong className="text-emerald-300">
                  {tx('Chế độ Lấp Quỹ Trước đang bật:', 'Fund-First Mode Active:', '緊急資金優先モード有効：')}
                </strong>{' '}
                {tx(
                  `Vốn ban đầu đã đủ ${vnd(efTarget)} quỹ khẩn cấp. Phần dư còn lại được đưa thẳng vào mục tiêu chính ngay từ Tháng 1.`,
                  `Initial capital already covers your ${vnd(efTarget)} emergency fund. Remaining capital compounds toward your primary goal starting Month 1.`,
                  `初期元本で緊急資金${vnd(efTarget)}を既に確保済みのため、残額は1ヶ月目から本目標の複利運用へ直行します。`
                )}
              </>
            )
          ) : analysis.emergencyFundShortfall > 0 ? (
            <>
              <strong className="text-amber-300">
                {tx('Khuyến nghị tách sổ riêng:', 'Separate Buffer Recommended:', '別口座・短期分割を推奨：')}
              </strong>{' '}
              {tx(
                `Nên giữ riêng ${vnd(efTarget)} ở kỳ hạn ngắn 1–3 tháng để tránh phải tất toán trước hạn khi cần tiền gấp`,
                `Keep ${vnd(efTarget)} in liquid 1M–3M passbooks to avoid breaking long-term deposits prematurely`,
                `急な出費で長期定期を中途解約しないよう、${vnd(efTarget)}は1〜3ヶ月の短期定期で分けて保有することを推奨します`
              )}
              {analysis.monthsToFillEmergencyFund < 120
                ? tx(
                    ` (nếu lấp trước sẽ mất khoảng ${analysis.monthsToFillEmergencyFund} tháng).`,
                    ` (filling it first would take ~${analysis.monthsToFillEmergencyFund} months).`,
                    `（先に満額にする場合は約${analysis.monthsToFillEmergencyFund}ヶ月かかります）。`
                  )
                : '.'}
            </>
          ) : (
            <>
              <strong className="text-emerald-300">
                {tx('An toàn thanh khoản:', 'Healthy Liquidity Buffer:', '十分な流動性安全網：')}
              </strong>{' '}
              {tx(
                `Hãy giữ riêng ${vnd(efTarget)} trong sổ kỳ hạn ngắn 1T–3T; số vốn vượt còn lại yên tâm gửi kỳ hạn dài để hưởng lãi tối đa.`,
                `Keep ${vnd(efTarget)} in short 1M–3M tenures; the surplus capital can safely stay in higher-yield long tenures.`,
                `${vnd(efTarget)}を1〜3ヶ月定期で確保しておけば、残余元本は安心して高金利の長期定期へ預け入れできます。`
              )}
            </>
          )}
        </p>
      </div>

      {/* 2-Earner Split (Couple & Family) */}
      {analysis.hasPartner && split && (
        <div className="mt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <HeartHandshake className="size-4 text-indigo-300" />
              {tx('Phân bổ đóng góp hàng tháng', 'Monthly Contribution Split', '毎月の積立拠出配分')} (
              {split.rule === 'SPLIT_50_50'
                ? tx('Chia đều 50/50', '50/50 Split', '均等 50/50')
                : split.rule === 'CUSTOM'
                  ? tx('Tỷ lệ tự chỉnh', 'Custom %', 'カスタム配分')
                  : tx('Theo tỷ lệ thu nhập', 'Proportional to Income', '収入比例')}
              )
            </span>
            <span className="text-[11px] tabular-nums text-zinc-400">
              {tx('Người góp chính:', 'Primary earner share:', '主収入者の割合：')} {pct(split.breadwinnerConcentrationPct, 0)}{' '}
              {tx('tổng thu', 'of income', '（世帯収入比）')}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.04] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {tx('Người 1 (Bạn)', 'Earner 1 (You)', '1人目（あなた）')}
                </span>
                <Badge tone="brand">
                  {pct(split.earner1Pct, 1)} {tx('phần gửi', 'share', '負担割合')}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs tabular-nums">
                <div className="flex justify-between text-zinc-400">
                  <span>{tx('Thu nhập tháng:', 'Monthly income:', '月収：')}</span>
                  <span className="text-zinc-200">{vnd(analysis.earner1Income)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{tx('Cần góp tiết kiệm:', 'Monthly contribution:', '毎月積立額：')}</span>
                  <span className="font-semibold text-emerald-300">{vnd(split.earner1Contribution)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>{tx('Tỷ lệ gửi / thu nhập riêng:', 'Saving / own income:', '個人収入比の貯蓄率：')}</span>
                  <span>{pct(split.earner1SavingRatioPct, 1)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.04] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {tx('Người 2 (Bạn đời)', 'Earner 2 (Partner)', '2人目（パートナー）')}
                </span>
                <Badge tone="neutral">
                  {pct(split.earner2Pct, 1)} {tx('phần gửi', 'share', '負担割合')}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs tabular-nums">
                <div className="flex justify-between text-zinc-400">
                  <span>{tx('Thu nhập tháng:', 'Monthly income:', '月収：')}</span>
                  <span className="text-zinc-200">{vnd(analysis.earner2Income)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{tx('Cần góp tiết kiệm:', 'Monthly contribution:', '毎月積立額：')}</span>
                  <span className="font-semibold text-emerald-300">{vnd(split.earner2Contribution)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>{tx('Tỷ lệ gửi / thu nhập riêng:', 'Saving / own income:', '個人収入比の貯蓄率：')}</span>
                  <span>{pct(split.earner2SavingRatioPct, 1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadwinner Stress Test */}
      <div className="mt-4 space-y-2.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
          <Users className="size-4 text-zinc-400" />
          {tx(
            'Stress-test Biến động Thu nhập (Kiểm tra sức chịu đựng)',
            'Income Disruption Stress-Test',
            '収入変動ストレステスト（耐久力診断）'
          )}
        </span>
        <div className={cx('grid gap-3', analysis.hasPartner ? 'sm:grid-cols-2' : 'grid-cols-1')}>
          <StressTestRow item={analysis.stressTest?.ifEarner1Stops} tx={tx} />
          {analysis.hasPartner && <StressTestRow item={analysis.stressTest?.ifEarner2Stops} tx={tx} />}
        </div>
      </div>
    </Card>
  );
}
