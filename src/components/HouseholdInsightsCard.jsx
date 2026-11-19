import React from 'react';
import { AlertTriangle, CheckCircle2, HeartHandshake, ShieldCheck, ShieldAlert, Users } from 'lucide-react';
import { compact, pct, vnd } from '../utils/format.js';
import { Badge, Card, CardHeader, Progress, cx } from './ui.jsx';

function StressTestRow({ item }) {
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
          {ok ? 'Vẫn trụ được chi phí' : `Thiếu ${compact(item.monthlyGap)}/th`}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] tabular-nums text-zinc-400 sm:grid-cols-3 sm:gap-2">
        <div>
          Thu nhập còn: <strong className="text-zinc-200">{compact(item.remainingIncome)}</strong>
        </div>
        {ok ? (
          <div>
            Dư mỗi tháng: <strong className="text-emerald-300">+{compact(item.monthlySurplus)}</strong>
          </div>
        ) : (
          <>
            <div>
              Vốn hiện có trụ:{' '}
              <strong className="text-zinc-200">
                {item.runwayMonthsWithCapital !== null ? `${item.runwayMonthsWithCapital} tháng` : '—'}
              </strong>
            </div>
            <div>
              Khi đủ quỹ DP:{' '}
              <strong className="text-indigo-300">
                {item.runwayMonthsWithTarget !== null ? `${item.runwayMonthsWithTarget} tháng` : '—'}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function HouseholdInsightsCard({ analysis, roadmap }) {
  if (!analysis) return null;

  const efTarget = analysis.emergencyFundTarget || 0;
  const efPct = analysis.emergencyFundCoveragePct ?? 0;
  const split = analysis.contributionSplit;
  const netPositive = analysis.freeCashFlow >= 0;

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title={`Phân tích Tài chính ${analysis.modeLabel}`}
        description={
          analysis.hasPartner
            ? 'Theo dõi dòng tiền hộ, tỷ lệ đóng góp 2 người, quỹ khẩn cấp và kiểm tra sức chịu đựng khi biến động thu nhập.'
            : 'Kiểm soát dòng tiền sau chi tiêu, quỹ dự phòng khẩn cấp cá nhân và mức bao phủ chi phí.'
        }
        right={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{analysis.modeLabel}</Badge>
            {analysis.mode === 'FAMILY' && analysis.dependentsCount > 0 && (
              <Badge tone="neutral">{analysis.dependentsCount} người phụ thuộc</Badge>
            )}
          </div>
        }
      />

      {/* Top 3 Household Metrics */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11px] text-zinc-400">Chi phí sinh hoạt / tháng</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-white">{vnd(analysis.totalMonthlyExpense)}</p>
          {analysis.mode === 'FAMILY' && analysis.dependentsCost > 0 && (
            <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
              Cố định {compact(analysis.fixedExpense)} + Phụ thuộc {compact(analysis.dependentsCost)}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11px] text-zinc-400">Dòng tiền dư tự do / tháng</p>
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
            {netPositive ? 'Thu nhập − Chi phí − Tiền gửi' : 'Đang vượt khả năng dòng tiền'}
          </p>
        </div>

        <div className="rounded-xl bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11px] text-zinc-400">Lãi thụ động / Chi phí khi đạt</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-indigo-300">
            {pct(analysis.expenseCoveragePct, 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {analysis.expenseCoveragePct >= 100 ? 'Tự do chi phí sinh hoạt' : 'Mức độ bù đắp chi tiêu'}
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
            Quỹ Dự Phòng Khẩn Cấp ({analysis.targetEmergencyMonths} tháng chi tiêu)
          </span>
          <Badge tone={efPct >= 100 ? 'success' : 'warning'}>
            {efPct >= 100 ? 'Đã đủ 100%' : `Đạt ${pct(efPct, 0)} · Thiếu ${compact(analysis.emergencyFundShortfall)}`}
          </Badge>
        </div>

        <div className="mt-2.5">
          <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] tabular-nums text-zinc-400">
            <span>Vốn hiện có phân bổ dự phòng: {compact(analysis.emergencyFundCoveredByCapital)}</span>
            <span>Mục tiêu khuyến nghị: {vnd(efTarget)}</span>
          </div>
          <Progress value={efPct} />
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-400">
          {roadmap?.prioritizeEmergencyFund ? (
            roadmap.emergencyFundMonths > 0 ? (
              <>
                <strong className="text-indigo-300">Chế độ Lấp Quỹ Trước đang bật:</strong> Gửi toàn bộ tiết kiệm vào sổ
                ngắn hạn 1T–3T (4,75%/năm) để hoàn thành quỹ khẩn cấp trong{' '}
                <strong className="text-white">{roadmap.emergencyFundMonths} tháng đầu</strong>, sau đó mất thêm{' '}
                <strong className="text-white">{roadmap.goalOnlyMonths} tháng</strong> cho mục tiêu chính.
              </>
            ) : (
              <>
                <strong className="text-emerald-300">Chế độ Lấp Quỹ Trước đang bật:</strong> Vốn ban đầu đã đủ{' '}
                {vnd(efTarget)} quỹ khẩn cấp. Phần dư còn lại được đưa thẳng vào mục tiêu chính ngay từ Tháng 1.
              </>
            )
          ) : analysis.emergencyFundShortfall > 0 ? (
            <>
              <strong className="text-amber-300">Khuyến nghị tách sổ riêng:</strong> Nên giữ riêng{' '}
              <strong className="text-white">{vnd(efTarget)}</strong> ở kỳ hạn ngắn 1–3 tháng để tránh phải tất toán
              trước hạn khi cần tiền gấp
              {analysis.monthsToFillEmergencyFund < 120
                ? ` (nếu lấp trước sẽ mất khoảng ${analysis.monthsToFillEmergencyFund} tháng).`
                : '.'}
            </>
          ) : (
            <>
              <strong className="text-emerald-300">An toàn thanh khoản:</strong> Hãy giữ riêng {vnd(efTarget)} trong
              sổ kỳ hạn ngắn 1T–3T; số vốn vượt còn lại yên tâm gửi kỳ hạn dài để hưởng lãi tối đa.
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
              Phân bổ đóng góp hàng tháng (
              {split.rule === 'SPLIT_50_50'
                ? 'Chia đều 50/50'
                : split.rule === 'CUSTOM'
                  ? 'Tỷ lệ tự chỉnh'
                  : 'Theo tỷ lệ thu nhập'}
              )
            </span>
            <span className="text-[11px] tabular-nums text-zinc-400">
              Người góp chính: {pct(split.breadwinnerConcentrationPct, 0)} tổng thu
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.04] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Người 1 (Bạn)</span>
                <Badge tone="brand">{pct(split.earner1Pct, 1)} phần gửi</Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs tabular-nums">
                <div className="flex justify-between text-zinc-400">
                  <span>Thu nhập tháng:</span>
                  <span className="text-zinc-200">{vnd(analysis.earner1Income)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cần góp tiết kiệm:</span>
                  <span className="font-semibold text-emerald-300">{vnd(split.earner1Contribution)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Tỷ lệ gửi / thu nhập riêng:</span>
                  <span>{pct(split.earner1SavingRatioPct, 1)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.04] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Người 2 (Bạn đời)</span>
                <Badge tone="neutral">{pct(split.earner2Pct, 1)} phần gửi</Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs tabular-nums">
                <div className="flex justify-between text-zinc-400">
                  <span>Thu nhập tháng:</span>
                  <span className="text-zinc-200">{vnd(analysis.earner2Income)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cần góp tiết kiệm:</span>
                  <span className="font-semibold text-emerald-300">{vnd(split.earner2Contribution)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Tỷ lệ gửi / thu nhập riêng:</span>
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
          Stress-test Biến động Thu nhập (Kiểm tra sức chịu đựng)
        </span>
        <div className={cx('grid gap-3', analysis.hasPartner ? 'sm:grid-cols-2' : 'grid-cols-1')}>
          <StressTestRow item={analysis.stressTest?.ifEarner1Stops} />
          {analysis.hasPartner && <StressTestRow item={analysis.stressTest?.ifEarner2Stops} />}
        </div>
      </div>
    </Card>
  );
}
