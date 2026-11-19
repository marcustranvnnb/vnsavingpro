import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Package,
  Target,
  Wallet,
  PiggyBank,
  Coins,
  Gauge,
  SlidersHorizontal,
  Sparkles,
  Pencil,
  RotateCcw,
  Share2,
  Printer,
} from 'lucide-react';
import { href, useRates, useToast } from '../state.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { copyReportForGoogleDocs, downloadGoogleDocsFile } from '../utils/googleDocsExporter.js';
import { syncUserPrefCookie } from '../utils/cookieManager.js';
import { cryptoStorage } from '../utils/cryptoStorage.js';
import { compact, chip, duration, fmt, pct, vnd } from '../utils/format.js';
import { TENURE_LABELS } from '../data/banksData.js';
import { HouseholdModeSwitch } from '../components/HouseholdModeSwitch.jsx';
import { HouseholdInsightsCard } from '../components/HouseholdInsightsCard.jsx';
import {
  Badge,
  BankMark,
  Button,
  Callout,
  Card,
  CardHeader,
  Chip,
  DecimalInput,
  Modal,
  MoneyField,
  NumberInput,
  PageHeader,
  Progress,
  RateDisclaimer,
  ResultsSkeleton,
  Segmented,
  SliderField,
  Stat,
  Table,
  cx,
} from '../components/ui.jsx';
import { BankPicker, TENURE_OPTIONS } from '../components/BankPicker.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import GrowthChart from '../components/GrowthChart.jsx';

const presets = (arr) => arr.map((v) => ({ value: v, label: v === 0 ? '0 ₫' : chip(v) }));

function IncomeRangeField({ label, sublabel, minVal, maxVal, onMin, onMax, quickValues }) {
  const applyPreset = (v) => {
    onMin(v);
    onMax(v);
  };
  const bothEqual = minVal === maxVal;
  return (
    <div className="space-y-2 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-zinc-200">{label}</span>
        {sublabel && <span className="text-[11px] text-zinc-500">{sublabel}</span>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-[11px] text-zinc-500">Thấp nhất / tháng</span>
          <NumberInput
            value={minVal}
            onChange={onMin}
            suffix="₫"
            max={10_000_000_000}
            ariaLabel={`${label} thấp nhất`}
          />
        </div>
        <div>
          <span className="mb-1 block text-[11px] text-zinc-500">Cao nhất / tháng</span>
          <NumberInput
            value={maxVal}
            onChange={onMax}
            suffix="₫"
            max={10_000_000_000}
            ariaLabel={`${label} cao nhất`}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[11px] text-zinc-500">Đặt nhanh:</span>
        {quickValues.map((v) => (
          <Chip key={v} active={bothEqual && minVal === v} onClick={() => applyPreset(v)}>
            {v === 0 ? '0 ₫' : chip(v)}
          </Chip>
        ))}
      </div>
    </div>
  );
}

const COHORT_STYLE = {
  indigo: {
    bar: 'bg-indigo-400',
    dot: 'bg-indigo-400',
    badge: 'brand',
    border: 'border-indigo-400/20',
  },
  sky: {
    bar: 'bg-sky-400',
    dot: 'bg-sky-400',
    badge: 'brand',
    border: 'border-sky-400/20',
  },
  emerald: {
    bar: 'bg-emerald-400',
    dot: 'bg-emerald-400',
    badge: 'success',
    border: 'border-emerald-400/20',
  },
  amber: {
    bar: 'bg-amber-400',
    dot: 'bg-amber-400',
    badge: 'warning',
    border: 'border-amber-400/20',
  },
};

function StagePackageDetails({ stage, granularity }) {
  const [groupFilter, setGroupFilter] = useState('all');

  if (!stage) return null;

  const validFilter =
    groupFilter === 'all' || stage.cohorts.some((c) => c.key === groupFilter) ? groupFilter : 'all';
  const filteredPackages =
    validFilter === 'all' ? stage.packages : stage.packages.filter((p) => p.groupKey === validFilter);

  if (granularity === 'cohorts') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {stage.cohorts.map((cohort) => {
          const st = COHORT_STYLE[cohort.tone] || COHORT_STYLE.emerald;
          return (
            <div
              key={cohort.key}
              className={cx('flex flex-col justify-between rounded-xl border bg-white/[0.02] p-4', st.border)}
            >
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cx('size-2.5 shrink-0 rounded-full', st.dot)} />
                    <span className="text-sm font-semibold text-white">{cohort.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral" className="tabular-nums">
                      {cohort.packageCount} gói
                    </Badge>
                    <Badge tone={cohort.rolledPackages > 0 ? 'brand' : 'neutral'}>
                      {cohort.rolledPackages > 0 ? `Tái tục ${cohort.maxRolloverCount} lần` : 'Đang kỳ đầu'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-1.5 text-[11px] font-mono text-zinc-400">{cohort.codeRange}</div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">Gốc mở sổ</div>
                    <div className="mt-0.5 font-medium text-zinc-200">
                      {cohort.packageCount === 1 ? vnd(cohort.totalInitial) : `${compact(cohort.perPackageInitial)}/sổ`}
                    </div>
                    {cohort.packageCount > 1 && (
                      <div className="text-[10px] text-zinc-500">Tổng gốc: {compact(cohort.totalInitial)}</div>
                    )}
                  </div>
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">Số dư hiện tại</div>
                    <div className="mt-0.5 font-semibold text-white">{vnd(cohort.totalBalance)}</div>
                    <div className="text-[10px] text-emerald-300/80">
                      +{compact(cohort.totalAccumulatedInterest)} lãi gộp
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-xs tabular-nums ring-1 ring-inset ring-emerald-400/20">
                <div className="text-emerald-200">
                  {cohort.packageCount > 1 && (
                    <span className="mr-1.5 text-[11px] text-emerald-300/80">
                      Mỗi sổ +{compact(cohort.perPackageMonthlyInterest)}/th ·
                    </span>
                  )}
                  <strong className="font-semibold text-emerald-300">+{vnd(cohort.totalMonthlyInterest)}/tháng</strong>
                </div>
                <span className="font-semibold text-emerald-300">{pct(cohort.sharePct, 1)} tổng lãi</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={validFilter === 'all'} onClick={() => setGroupFilter('all')}>
          Tất cả ({stage.packagesTotalCount} sổ)
        </Chip>
        {stage.cohorts.map((c) => (
          <Chip key={c.key} active={validFilter === c.key} onClick={() => setGroupFilter(c.key)}>
            {c.label} ({c.packageCount})
          </Chip>
        ))}
      </div>

      {stage.packagesTruncated && (
        <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
          Đang hiển thị 12 sổ đầu + 108 sổ gần nhất trên tổng số <strong className="text-white">{stage.packagesTotalCount}</strong> sổ để giữ giao diện mượt mà. Chuyển sang <strong className="text-indigo-300">Gộp theo lô / đợt</strong> để xem trọn bộ từng năm.
        </p>
      )}

      <div className="grid max-h-[420px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex flex-col justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs tabular-nums"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-semibold text-white">{pkg.code}</span>
                <Badge tone={pkg.rolloverCount > 0 ? 'brand' : 'neutral'}>
                  {pkg.rolloverCount > 0 ? `Tái tục ${pkg.rolloverCount} lần` : `Đáo hạn T${pkg.nextMaturityMonth}`}
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{pkg.groupLabel}</span>
                <span>Mở {pkg.openMonth === 0 ? 'ban đầu' : `T${pkg.openMonth}`}</span>
              </div>
              <div className="mt-2.5 space-y-1 border-t border-white/[0.05] pt-2 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Gốc mở sổ:</span>
                  <span>{vnd(pkg.initialPrincipal)}</span>
                </div>
                <div className="flex justify-between font-medium text-white">
                  <span>Số dư hiện tại:</span>
                  <span>{vnd(pkg.currentBalance)}</span>
                </div>
                <div className="flex justify-between text-emerald-300/80">
                  <span>Lãi đã tích luỹ:</span>
                  <span>+{vnd(pkg.accumulatedInterest)}</span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-500/[0.08] px-2.5 py-1.5 font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
              <span>+{vnd(pkg.monthlyInterest)}/tháng</span>
              <span className="text-[11px] opacity-80">{pct(pkg.sharePct, 1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapPackageExplorer({ roadmap, rows, onRowsChange }) {
  const snapshots = roadmap.stageSnapshots || [];
  const [explorerView, setExplorerView] = useState('shelf'); // 'shelf' | 'matrix'
  const [granularity, setGranularity] = useState('cohorts'); // 'cohorts' | 'individual'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedMonth, setExpandedMonth] = useState(null);

  const defaultMonth = useMemo(() => {
    if (snapshots.length === 0) return 0;
    const yearOne = snapshots.find((s) => s.month === 12);
    return yearOne ? yearOne.month : snapshots[snapshots.length - 1].month;
  }, [snapshots]);

  const activeStage = useMemo(() => {
    if (snapshots.length === 0) return null;
    return snapshots.find((s) => s.month === selectedMonth) || snapshots.find((s) => s.month === defaultMonth) || snapshots[0];
  }, [snapshots, selectedMonth, defaultMonth]);

  const activeExpandedMonth = expandedMonth !== null ? expandedMonth : defaultMonth;

  const findNearestSnapshot = (targetMonth) => {
    if (snapshots.length === 0) return null;
    const exact = snapshots.find((s) => s.month === targetMonth);
    if (exact) return { stage: exact, exact: true };
    let best = snapshots[0];
    let minDiff = Math.abs(snapshots[0].month - targetMonth);
    for (const s of snapshots) {
      const diff = Math.abs(s.month - targetMonth);
      if (diff < minDiff) {
        best = s;
        minDiff = diff;
      }
    }
    return { stage: best, exact: false };
  };

  const matrixRows = roadmap.monthByMonthLog.filter(
    (r) => rows === 'all' || r.month === 0 || r.month % 12 === 0 || r.totalBalance >= roadmap.requiredPrincipal
  );

  if (roadmap.monthByMonthLog.length === 0) return null;

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Chi tiết lộ trình & Danh mục gói tiết kiệm"
        description={`Theo dõi chính xác ở từng giai đoạn bạn sở hữu bao nhiêu sổ (kỳ hạn ${roadmap.tenureMonths || 12} tháng) và mỗi sổ đang mang lại bao nhiêu tiền lãi.`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={explorerView}
              onChange={setExplorerView}
              options={[
                { value: 'shelf', label: 'Kệ sổ theo giai đoạn' },
                { value: 'matrix', label: 'Bảng phân tầng' },
              ]}
            />
            <Segmented
              size="sm"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: 'cohorts', label: 'Gộp theo lô / đợt' },
                { value: 'individual', label: 'Từng sổ lẻ' },
              ]}
            />
          </div>
        }
      />

      {explorerView === 'shelf' && activeStage ? (
        <div className="mt-5 space-y-5">
          {/* Timeline stage pills */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {snapshots.map((s) => {
              const active = s.month === activeStage.month;
              return (
                <button
                  key={s.month}
                  type="button"
                  onClick={() => setSelectedMonth(s.month)}
                  className={cx(
                    'flex shrink-0 flex-col items-start gap-1 rounded-xl border px-3.5 py-2.5 text-left transition-all',
                    active
                      ? 'border-indigo-400/50 bg-indigo-500/15 shadow-sm'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cx('text-xs font-semibold', active ? 'text-white' : 'text-zinc-300')}>
                      {s.isGoal ? `${s.label.replace(' · Đạt mục tiêu', '')} 🎯` : s.label}
                    </span>
                    <Badge tone={active ? 'brand' : 'neutral'}>{s.totalPackages} gói</Badge>
                  </div>
                  <div className="text-[11px] tabular-nums text-zinc-400">
                    +{compact(s.monthlyInterest)}/th · {pct(s.goalProgressPct, 0)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected stage summary KPIs & stacked bar */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers className="size-4 text-indigo-300" />
                Giai đoạn: {activeStage.label}
              </div>
              <span className="text-xs text-zinc-400 tabular-nums">
                Đã tích luỹ {pct(activeStage.goalProgressPct, 1)} mục tiêu
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl bg-black/30 p-3">
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Package className="size-3.5 text-indigo-300" /> Tổng số gói đang mở
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-white">{activeStage.totalPackages} gói</div>
                <div className="text-[11px] text-zinc-500">
                  {activeStage.rolledOverCount} đã tái tục · {activeStage.firstCycleCount} kỳ đầu
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-[11px] text-zinc-500">Tổng số dư các sổ</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-white">{compact(activeStage.totalBalance)}</div>
                <div className="text-[11px] text-zinc-500 tabular-nums">Vốn gửi: {compact(activeStage.totalDeposited)}</div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-[11px] text-zinc-500">Lãi các sổ đẻ ra / tháng</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-emerald-300">
                  +{compact(activeStage.monthlyInterest)}/th
                </div>
                <div className="text-[11px] text-zinc-500 tabular-nums">~{compact(activeStage.annualInterest)}/năm</div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-[11px] text-zinc-500">Tổng lãi kép tích luỹ</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-indigo-300">
                  +{compact(activeStage.accumulatedInterest)}
                </div>
                <div className="text-[11px] text-zinc-500">từ lãi nhập gốc</div>
              </div>
            </div>

            {activeStage.cohorts.length > 0 && activeStage.monthlyInterest > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Tỷ trọng nguồn lãi theo đợt mở sổ</span>
                  <span className="tabular-nums">Tổng +{vnd(activeStage.monthlyInterest)}/tháng (100%)</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  {activeStage.cohorts.map((c) => {
                    const st = COHORT_STYLE[c.tone] || COHORT_STYLE.emerald;
                    return (
                      <div
                        key={c.key}
                        title={`${c.label}: +${vnd(c.totalMonthlyInterest)}/th (${pct(c.sharePct, 1)})`}
                        className={cx('h-full border-r border-canvas/70 last:border-r-0', st.bar)}
                        style={{ width: `${Math.max(1, c.sharePct)}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-400" /> Vốn ban đầu</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sky-400" /> Các lô cũ đã tái tục</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-400" /> Lô mới kỳ đầu</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> Thưởng cuối năm</span>
                </div>
              </div>
            )}
          </div>

          <StagePackageDetails stage={activeStage} granularity={granularity} />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">Nhấn vào một dòng giai đoạn để mở chi tiết các gói bên trong.</span>
            <Segmented
              size="sm"
              value={rows}
              onChange={onRowsChange}
              options={[
                { value: 'yearly', label: 'Theo năm' },
                { value: 'all', label: 'Theo tháng' },
              ]}
            />
          </div>

          <Table
            className="max-h-[560px]"
            head={['Giai đoạn', 'Số gói mở', 'Tiền đã gửi', 'Lãi tích luỹ', 'Tổng tài sản', 'Lãi / tháng']}
          >
            {matrixRows.map((r) => {
              const goal = r.month > 0 && r.totalBalance >= roadmap.requiredPrincipal;
              const isExpanded = activeExpandedMonth === r.month;
              const match = isExpanded ? findNearestSnapshot(r.month) : null;
              return (
                <React.Fragment key={r.month}>
                  <tr
                    onClick={() => setExpandedMonth(isExpanded ? -1 : r.month)}
                    className={cx(
                      'cursor-pointer transition-colors',
                      goal ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1]' : 'hover:bg-white/[0.03]',
                      isExpanded && 'bg-white/[0.04]'
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-200">
                      <span className="inline-flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 text-indigo-300" />
                        ) : (
                          <ChevronRight className="size-3.5 text-zinc-500" />
                        )}
                        {r.month === 0 ? 'Hiện tại' : r.month % 12 === 0 ? `Năm ${r.month / 12}` : `Tháng ${r.month}`}
                      </span>
                      {goal && <Badge tone="success" className="ml-2">Đạt mục tiêu</Badge>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Badge tone={isExpanded ? 'brand' : 'neutral'}>
                        {r.activePackagesCount ?? 0} gói
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{fmt(r.principalDeposited)}</td>
                    <td className="px-4 py-3 text-right text-emerald-300/90">+{fmt(r.interestEarnedTotal)}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmt(r.totalBalance)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">{fmt(r.monthlyPassiveIncomeGenerated)}</td>
                  </tr>
                  {isExpanded && match?.stage && (
                    <tr className="bg-black/25">
                      <td colSpan={6} className="p-4">
                        {!match.exact && (
                          <p className="mb-3 text-[11px] text-amber-300/90">
                            Đang hiển thị cơ cấu gói tại cột mốc gần nhất ({match.stage.label}).
                          </p>
                        )}
                        <StagePackageDetails stage={match.stage} granularity={granularity} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </Table>
        </div>
      )}
    </Card>
  );
}

const INITIAL_PLANNER_DATA = {
  roadmap: {
    goalType: 'PASSIVE_INCOME',
    solveMode: 'TIME',
    targetYears: 5,
    nominalRequiredPrincipal: 0,
    requiredPrincipal: 0,
    baseMonthlyInterest: 0,
    requiredMonthlyDeposit: 0,
    monthsNeeded: 0,
    yearsNeeded: 0,
    timeText: 'Đang tính...',
    totalDeposited: 0,
    totalCompoundInterest: 0,
    compoundSharePct: 0,
    savingsRatePercent: 0,
    finalMonthlyPassiveIncome: 0,
    annualStepUpPct: 0,
    annualBonusAmount: 0,
    inflationRatePct: 0,
    isAlreadyReached: false,
    prioritizeEmergencyFund: false,
    emergencyFundReserved: 0,
    emergencyFundMonths: 0,
    goalOnlyMonths: 0,
    tenureMonths: 12,
    monthByMonthLog: [],
    stageSnapshots: [],
  },
  feasibility: {
    score: 70,
    ratingLabel: 'Đang đánh giá...',
    strengths: [],
    warnings: [],
  },
  householdAnalysis: null,
  scenarios: [],
  bankRuns: [],
};

export default function Planner({ params = {} }) {
  const { banks, getRate, best } = useRates();
  const { profile } = useAuth();
  const notify = useToast();
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const [householdMode, setHouseholdMode] = useState(() => {
    if (['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(params.hh)) return params.hh;
    if (['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(saved.householdMode)) return saved.householdMode;
    return 'INDIVIDUAL';
  });
  const [dependentsCount, setDependentsCount] = useState(() =>
    Math.min(10, Math.max(0, Number(params.deps) || Number(saved.dependentsCount) || 0))
  );
  const [inputMode, setInputMode] = useState(() =>
    params.mode === 'advanced' || params.mode === 'basic' ? params.mode : saved.inputMode || 'basic'
  );
  const [goalType, setGoalType] = useState(() =>
    params.goal === 'TARGET_AMOUNT' || params.goal === 'PASSIVE_INCOME'
      ? params.goal
      : saved.goalType || 'PASSIVE_INCOME'
  );
  const [target, setTarget] = useState(() => Number(params.target) || Number(saved.target) || 10_000_000);
  const [targetAmount, setTargetAmount] = useState(
    () => Number(params.targetAmount) || Number(saved.targetAmount) || 500_000_000
  );
  const [solveMode, setSolveMode] = useState(() =>
    params.solve === 'SAVING' || params.solve === 'TIME' ? params.solve : saved.solveMode || 'TIME'
  );
  const [targetYears, setTargetYears] = useState(
    () => Math.min(30, Math.max(1, Number(params.years) || Number(saved.targetYears) || 5))
  );
  const [capital, setCapital] = useState(() =>
    params.capital !== undefined ? Number(params.capital) : saved.capital !== undefined ? Number(saved.capital) : 50_000_000
  );
  const [saving, setSaving] = useState(() =>
    params.saving !== undefined ? Number(params.saving) : saved.saving !== undefined ? Number(saved.saving) : 5_000_000
  );
  const [salaryFullTime, setSalaryFullTime] = useState(() =>
    params.salary !== undefined
      ? Number(params.salary)
      : saved.salaryFullTime !== undefined
        ? Number(saved.salaryFullTime)
        : Number(saved.salary) || 25_000_000
  );
  const [freelanceIncomeMin, setFreelanceIncomeMin] = useState(
    () => Number(params.freeMin) || Number(saved.freelanceIncomeMin) || 0
  );
  const [freelanceIncomeMax, setFreelanceIncomeMax] = useState(
    () => Number(params.freeMax) || Number(saved.freelanceIncomeMax) || 0
  );
  const [investIncomeMin, setInvestIncomeMin] = useState(
    () => Number(params.invMin) || Number(saved.investIncomeMin) || 0
  );
  const [investIncomeMax, setInvestIncomeMax] = useState(
    () => Number(params.invMax) || Number(saved.investIncomeMax) || 0
  );
  const [partnerSalaryFullTime, setPartnerSalaryFullTime] = useState(() =>
    params.pSalary !== undefined
      ? Number(params.pSalary)
      : saved.partnerSalaryFullTime !== undefined
        ? Number(saved.partnerSalaryFullTime)
        : 0
  );
  const [partnerFreelanceMin, setPartnerFreelanceMin] = useState(() => Number(saved.partnerFreelanceMin) || 0);
  const [partnerFreelanceMax, setPartnerFreelanceMax] = useState(() => Number(saved.partnerFreelanceMax) || 0);
  const [partnerInvestMin, setPartnerInvestMin] = useState(() => Number(saved.partnerInvestMin) || 0);
  const [partnerInvestMax, setPartnerInvestMax] = useState(() => Number(saved.partnerInvestMax) || 0);
  const [monthlyFixedExpense, setMonthlyFixedExpense] = useState(() =>
    params.expense !== undefined
      ? Number(params.expense)
      : saved.monthlyFixedExpense !== undefined
        ? Number(saved.monthlyFixedExpense)
        : 12_000_000
  );
  const [monthlyDependentsCost, setMonthlyDependentsCost] = useState(() =>
    params.depCost !== undefined
      ? Number(params.depCost)
      : saved.monthlyDependentsCost !== undefined
        ? Number(saved.monthlyDependentsCost)
        : 0
  );
  const [contributionRule, setContributionRule] = useState(() =>
    ['PROPORTIONAL', 'SPLIT_50_50', 'CUSTOM'].includes(params.split)
      ? params.split
      : saved.contributionRule || 'PROPORTIONAL'
  );
  const [earner1SharePct, setEarner1SharePct] = useState(() =>
    saved.earner1SharePct !== undefined ? Number(saved.earner1SharePct) : 50
  );
  const [prioritizeEmergencyFund, setPrioritizeEmergencyFund] = useState(() =>
    params.efFirst !== undefined ? params.efFirst === '1' : Boolean(saved.prioritizeEmergencyFund)
  );
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(() =>
    saved.emergencyFundMonths !== undefined ? Number(saved.emergencyFundMonths) : 0
  );

  // Sync default household mode from logged-in profile if user has no URL/saved override
  useEffect(() => {
    if (!params.hh && !saved.householdMode && profile?.default_household_mode) {
      setHouseholdMode(profile.default_household_mode);
    }
  }, [params.hh, profile?.default_household_mode, saved.householdMode]);

  const handleHouseholdChange = (nextMode) => {
    setHouseholdMode(nextMode);
    if (nextMode === 'COUPLE' || nextMode === 'FAMILY') {
      if (partnerSalaryFullTime === 0) setPartnerSalaryFullTime(20_000_000);
      if (monthlyFixedExpense === 12_000_000) setMonthlyFixedExpense(18_000_000);
      if (nextMode === 'FAMILY') {
        if (dependentsCount === 0) setDependentsCount(1);
        if (monthlyDependentsCost === 0) setMonthlyDependentsCost(6_000_000);
      }
    } else if (nextMode === 'INDIVIDUAL' && monthlyFixedExpense === 18_000_000) {
      setMonthlyFixedExpense(12_000_000);
    }
  };

  const hasPartner = householdMode === 'COUPLE' || householdMode === 'FAMILY';
  const freeLow = Math.min(freelanceIncomeMin, freelanceIncomeMax);
  const freeHigh = Math.max(freelanceIncomeMin, freelanceIncomeMax);
  const invLow = Math.min(investIncomeMin, investIncomeMax);
  const invHigh = Math.max(investIncomeMin, investIncomeMax);
  const e1IncomeMin = salaryFullTime + freeLow + invLow;
  const e1IncomeMax = salaryFullTime + freeHigh + invHigh;
  const e1IncomeAvg = Math.round((e1IncomeMin + e1IncomeMax) / 2);

  const pFreeLow = hasPartner ? Math.min(partnerFreelanceMin, partnerFreelanceMax) : 0;
  const pFreeHigh = hasPartner ? Math.max(partnerFreelanceMin, partnerFreelanceMax) : 0;
  const pInvLow = hasPartner ? Math.min(partnerInvestMin, partnerInvestMax) : 0;
  const pInvHigh = hasPartner ? Math.max(partnerInvestMin, partnerInvestMax) : 0;
  const e2IncomeMin = hasPartner ? partnerSalaryFullTime + pFreeLow + pInvLow : 0;
  const e2IncomeMax = hasPartner ? partnerSalaryFullTime + pFreeHigh + pInvHigh : 0;
  const e2IncomeAvg = Math.round((e2IncomeMin + e2IncomeMax) / 2);

  const totalIncomeMin = e1IncomeMin + e2IncomeMin;
  const totalIncomeMax = e1IncomeMax + e2IncomeMax;
  const totalIncomeAvg = Math.round((totalIncomeMin + totalIncomeMax) / 2);
  const salary = totalIncomeAvg;
  const hasExtraIncome = freeHigh > 0 || invHigh > 0 || pFreeHigh > 0 || pInvHigh > 0;
  const [bankId, setBankId] = useState(() => params.bank || saved.bankId || 'cake');
  const [tenure, setTenure] = useState(() => params.tenure || saved.tenure || '12M');
  const [customRate, setCustomRate] = useState(() => params.rate ?? saved.customRate ?? '');
  const [calcMode, setCalcMode] = useState(() =>
    params.calcMode === 'ACTUAL_DAYS' || params.calcMode === 'NOMINAL_MONTHS'
      ? params.calcMode
      : saved.calcMode || 'NOMINAL_MONTHS'
  );
  const [annualStepUpPct, setAnnualStepUpPct] = useState(() =>
    params.stepUp !== undefined
      ? Number(params.stepUp)
      : saved.annualStepUpPct !== undefined
        ? Number(saved.annualStepUpPct)
        : 0
  );
  const [annualBonusAmount, setAnnualBonusAmount] = useState(() =>
    params.bonus !== undefined
      ? Number(params.bonus)
      : saved.annualBonusAmount !== undefined
        ? Number(saved.annualBonusAmount)
        : 0
  );
  const [inflationRatePct, setInflationRatePct] = useState(() =>
    params.inflation !== undefined
      ? Number(params.inflation)
      : saved.inflationRatePct !== undefined
        ? Number(saved.inflationRatePct)
        : 0
  );
  const [gdocsOpen, setGdocsOpen] = useState(false);
  const [view, setView] = useState('growth');
  const [rows, setRows] = useState('yearly');

  useEffect(() => {
    cryptoStorage.save('PLANNER_STATE', {
      inputMode,
      goalType,
      target,
      targetAmount,
      solveMode,
      targetYears,
      capital,
      saving,
      salaryFullTime,
      freelanceIncomeMin,
      freelanceIncomeMax,
      investIncomeMin,
      investIncomeMax,
      salary: totalIncomeAvg,
      bankId,
      tenure,
      customRate,
      calcMode,
      annualStepUpPct,
      annualBonusAmount,
      inflationRatePct,
      householdMode,
      dependentsCount,
      partnerSalaryFullTime,
      partnerFreelanceMin,
      partnerFreelanceMax,
      partnerInvestMin,
      partnerInvestMax,
      monthlyFixedExpense,
      monthlyDependentsCost,
      contributionRule,
      earner1SharePct,
      prioritizeEmergencyFund,
      emergencyFundMonths,
    });
  }, [
    inputMode,
    goalType,
    target,
    targetAmount,
    solveMode,
    targetYears,
    capital,
    saving,
    salaryFullTime,
    freelanceIncomeMin,
    freelanceIncomeMax,
    investIncomeMin,
    investIncomeMax,
    totalIncomeAvg,
    bankId,
    tenure,
    customRate,
    calcMode,
    annualStepUpPct,
    annualBonusAmount,
    inflationRatePct,
    householdMode,
    dependentsCount,
    partnerSalaryFullTime,
    partnerFreelanceMin,
    partnerFreelanceMax,
    partnerInvestMin,
    partnerInvestMax,
    monthlyFixedExpense,
    monthlyDependentsCost,
    contributionRule,
    earner1SharePct,
    prioritizeEmergencyFund,
    emergencyFundMonths,
  ]);

  useEffect(() => {
    syncUserPrefCookie({ bankId, tenure, inputMode });
  }, [bankId, tenure, inputMode]);

  const bank = banks.find((b) => b.id === bankId) || banks[0];
  const usingCustom = customRate !== '' && Number(customRate) > 0;
  const rate = usingCustom ? Number(customRate) : getRate(bank, tenure) || 6;

  const effectiveStepUp = inputMode === 'advanced' ? Number(annualStepUpPct) || 0 : 0;
  const effectiveBonus = inputMode === 'advanced' ? Number(annualBonusAmount) || 0 : 0;
  const effectiveInflation = inputMode === 'advanced' ? Number(inflationRatePct) || 0 : 0;

  const plannerPayload = useMemo(() => {
    const top = best(tenure);
    const bankComparisons = banks.map((b) => {
      const [bestTenure, bestRate] = TENURE_OPTIONS.map((t) => [t, getRate(b, t)]).sort((x, y) => y[1] - x[1])[0];
      return { bankId: b.id, bestTenure, bestRate };
    });
    const top1MRate = getRate(bank, '1M') || 4.75;
    return {
      goalType,
      targetMonthlyInterest: target,
      targetAmount,
      solveMode,
      targetYears,
      currentSalary: salary,
      totalIncomeMin,
      totalIncomeMax,
      hasExtraIncome,
      monthlySavingsAmount: saving,
      initialCapital: capital,
      annualInterestRate: rate,
      calculationMode: calcMode,
      tenureCode: tenure,
      annualStepUpPct: effectiveStepUp,
      annualBonusAmount: effectiveBonus,
      inflationRatePct: effectiveInflation,
      householdMode,
      dependentsCount,
      earner1Income: e1IncomeAvg,
      earner1IncomeMin: e1IncomeMin,
      earner1IncomeMax: e1IncomeMax,
      earner2Income: e2IncomeAvg,
      earner2IncomeMin: e2IncomeMin,
      earner2IncomeMax: e2IncomeMax,
      monthlyFixedExpense,
      monthlyDependentsCost,
      contributionRule,
      earner1SharePct,
      prioritizeEmergencyFund,
      emergencyFundMonths,
      emergencyFundRate: top1MRate,
      topForTenure: top ? { bankName: top.bank.name, rate: top.rate, rateLabel: pct(top.rate) } : null,
      bankComparisons,
    };
  }, [
    goalType,
    target,
    targetAmount,
    solveMode,
    targetYears,
    salary,
    totalIncomeMin,
    totalIncomeMax,
    hasExtraIncome,
    saving,
    capital,
    rate,
    calcMode,
    effectiveStepUp,
    effectiveBonus,
    effectiveInflation,
    householdMode,
    dependentsCount,
    e1IncomeAvg,
    e1IncomeMin,
    e1IncomeMax,
    e2IncomeAvg,
    e2IncomeMin,
    e2IncomeMax,
    monthlyFixedExpense,
    monthlyDependentsCost,
    contributionRule,
    earner1SharePct,
    prioritizeEmergencyFund,
    emergencyFundMonths,
    bank,
    tenure,
    banks,
    getRate,
    best,
  ]);

  const { data: bundle, loading, initialized } = useServerCalc('planner_bundle', plannerPayload, INITIAL_PLANNER_DATA);
  const { roadmap, feasibility, householdAnalysis, scenarios } = bundle;
  const bankRuns = useMemo(
    () =>
      (bundle.bankRuns || []).map((item) => ({
        ...item,
        bank: banks.find((b) => b.id === item.bankId) || banks[0],
        r: { monthsNeeded: item.monthsNeeded, requiredMonthlyDeposit: item.requiredMonthlyDeposit || 0 },
      })),
    [bundle.bankRuns, banks]
  );
  const maxMonths = Math.max(...bankRuns.map((x) => Math.min(x.r.monthsNeeded, 720)), 1);
  const maxMonthlyDep = Math.max(...bankRuns.map((x) => x.r.requiredMonthlyDeposit || 0), 1);

  const isTargetAmount = goalType === 'TARGET_AMOUNT';
  const isSavingSolver = solveMode === 'SAVING';
  const reachable = isSavingSolver ? !roadmap.isAlreadyReached || roadmap.monthsNeeded < 720 : roadmap.monthsNeeded < 720;
  const progress = roadmap.requiredPrincipal > 0 ? (capital / roadmap.requiredPrincipal) * 100 : 0;
  const scoreTone = feasibility.score >= 80 ? 'emerald' : feasibility.score >= 60 ? 'indigo' : 'amber';

  const exportCSV = () => {
    const head = ['Tháng', 'Vốn đã gửi (VND)', 'Lãi kép tích luỹ (VND)', 'Tổng tài sản (VND)', 'Thu nhập thụ động/tháng (VND)'];
    const body = roadmap.monthByMonthLog.map((r) => [
      r.month,
      r.principalDeposited,
      r.interestEarnedTotal,
      r.totalBalance,
      r.monthlyPassiveIncomeGenerated,
    ]);
    const csv = '\uFEFF' + [head, ...body].map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `VnSavingPro_LoTrinh_${isTargetAmount ? targetAmount : target}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharePlan = () => {
    const query = {
      hh: householdMode,
      mode: inputMode,
      goal: goalType,
      target,
      targetAmount,
      solve: solveMode,
      years: targetYears,
      capital,
      saving,
      salary: salaryFullTime,
      expense: monthlyFixedExpense,
      split: contributionRule,
      bank: bankId,
      tenure,
      calcMode,
    };
    if (hasPartner && partnerSalaryFullTime > 0) query.pSalary = partnerSalaryFullTime;
    if (householdMode === 'FAMILY' && dependentsCount > 0) query.deps = dependentsCount;
    if (householdMode === 'FAMILY' && monthlyDependentsCost > 0) query.depCost = monthlyDependentsCost;
    if (prioritizeEmergencyFund) query.efFirst = '1';
    if (freeLow > 0) query.freeMin = freeLow;
    if (freeHigh > 0) query.freeMax = freeHigh;
    if (invLow > 0) query.invMin = invLow;
    if (invHigh > 0) query.invMax = invHigh;
    if (usingCustom) query.rate = customRate;
    if (effectiveStepUp > 0) query.stepUp = effectiveStepUp;
    if (effectiveBonus > 0) query.bonus = effectiveBonus;
    if (effectiveInflation > 0) query.inflation = effectiveInflation;
    const url = `${window.location.origin}${href('plan', query)}`;
    navigator.clipboard.writeText(url).then(() => {
      notify('Đã sao chép link chia sẻ kế hoạch');
    });
  };

  const reportPayload = {
    inputMode,
    goalType,
    target,
    targetAmount,
    solveMode,
    targetYears,
    capital,
    saving: isSavingSolver ? roadmap.requiredMonthlyDeposit : saving,
    salary,
    salaryFullTime,
    freelanceMin: freeLow,
    freelanceMax: freeHigh,
    investMin: invLow,
    investMax: invHigh,
    totalIncomeMin,
    totalIncomeMax,
    bankName: usingCustom ? 'Lãi suất tự nhập' : bank.name,
    tenureLabel: TENURE_LABELS[tenure] || tenure,
    rate,
    calcMode,
    annualStepUpPct: effectiveStepUp,
    annualBonusAmount: effectiveBonus,
    inflationRatePct: effectiveInflation,
    householdAnalysis,
    roadmap,
    feasibility,
    scenarios,
  };

  const handleOpenGoogleDocs = async () => {
    await copyReportForGoogleDocs(reportPayload);
    window.open('https://docs.new', '_blank', 'noopener,noreferrer');
    notify('Đã chép báo cáo! Hãy nhấn Ctrl+V (hoặc Cmd+V) trong trang Google Docs mới mở.');
  };

  const handleCopyForGoogleDocs = async () => {
    await copyReportForGoogleDocs(reportPayload);
    notify('Đã sao chép báo cáo (kèm bảng định dạng) vào clipboard');
  };

  return (
    <>
      <PageHeader
        icon={Target}
        eyebrow="Kế hoạch thu nhập thụ động"
        title="Bao giờ tiền lãi đủ nuôi bạn?"
        description="Nhập mục tiêu và khả năng tiết kiệm. Chúng tôi tính số vốn cần có, thời gian về đích và cách để đến nhanh hơn."
        actions={
          <>
            <Button size="sm" onClick={sharePlan}>
              <Share2 className="size-3.5" /> Chia sẻ link
            </Button>
            <Button size="sm" onClick={() => setGdocsOpen(true)} disabled={!roadmap.monthByMonthLog.length}>
              <FileText className="size-3.5 text-indigo-300" /> Google Docs
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" /> In / PDF
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={!roadmap.monthByMonthLog.length}>
              <Download className="size-3.5" /> Xuất CSV
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ── Inputs ── */}
        <Card className="space-y-5 p-5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <SlidersHorizontal className="size-3.5 text-indigo-300" /> Phiên bản nhập liệu
              </span>
              <Segmented
                size="sm"
                value={inputMode}
                onChange={setInputMode}
                options={[
                  { value: 'basic', label: 'Cơ bản' },
                  { value: 'advanced', label: 'Chuyên sâu' },
                ]}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {inputMode === 'basic'
                ? 'Phiên bản Cơ bản (Nhanh): thông số cốt lõi, tính thuần theo lãi suất ngân hàng.'
                : 'Phiên bản Chuyên sâu (Thực tế): thu nhập đa nguồn, phân chia 2 người, tăng gửi/năm, thưởng & lạm phát.'}
            </p>
            <div className="pt-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                0. Hồ sơ tài chính
              </span>
              <HouseholdModeSwitch value={householdMode} onChange={handleHouseholdChange} />
            </div>
          </div>

          {/* Step 1: Dual Goal Selection */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">1. Mục tiêu cần đạt</span>
              <Segmented
                size="sm"
                value={goalType}
                onChange={setGoalType}
                options={[
                  { value: 'PASSIVE_INCOME', label: 'Lãi thụ động / tháng' },
                  { value: 'TARGET_AMOUNT', label: 'Số tiền mục tiêu' },
                ]}
              />
            </div>

            {isTargetAmount ? (
              <MoneyField
                label="Tổng số tiền tiết kiệm mục tiêu"
                hint={`Khi đạt mốc này, tiền lãi sinh ra khoảng ${vnd(roadmap.baseMonthlyInterest)}/tháng.`}
                value={targetAmount}
                onChange={setTargetAmount}
                min={50_000_000}
                max={10_000_000_000}
                step={25_000_000}
                inputMax={500_000_000_000}
                presets={presets([100_000_000, 300_000_000, 500_000_000, 1_000_000_000, 2_000_000_000, 5_000_000_000])}
              />
            ) : (
              <MoneyField
                label="Thu nhập thụ động mong muốn / tháng"
                hint={`Cần tích luỹ sổ tiết kiệm gốc khoảng ${compact(roadmap.nominalRequiredPrincipal)} (tại ${pct(rate)}/năm).`}
                value={target}
                onChange={setTarget}
                min={1_000_000}
                max={100_000_000}
                step={500_000}
                inputMax={1_000_000_000}
                presets={presets([3_000_000, 5_000_000, 10_000_000, 20_000_000, 30_000_000, 50_000_000])}
              />
            )}
          </div>

          {/* Step 2: Bidirectional Solver */}
          <div className="space-y-4 border-t border-white/[0.06] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">2. Kế hoạch gửi tiết kiệm</span>
              <Segmented
                size="sm"
                value={solveMode}
                onChange={setSolveMode}
                options={[
                  { value: 'TIME', label: 'Tính thời gian đạt' },
                  { value: 'SAVING', label: 'Tính tiền gửi / tháng' },
                ]}
              />
            </div>

            <MoneyField
              label="Vốn tiết kiệm hiện có"
              value={capital}
              onChange={setCapital}
              min={0}
              max={2_000_000_000}
              step={5_000_000}
              inputMax={100_000_000_000}
              presets={presets([0, 50_000_000, 200_000_000, 500_000_000])}
            />

            {isSavingSolver ? (
              <div className="space-y-2.5">
                <SliderField
                  label="Thời hạn muốn đạt mục tiêu"
                  display={`${targetYears} năm (${targetYears * 12} tháng)`}
                  value={targetYears}
                  onChange={setTargetYears}
                  min={1}
                  max={30}
                  step={1}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 5, 10, 15, 20].map((y) => (
                    <Chip key={y} active={targetYears === y} onClick={() => setTargetYears(y)}>
                      {y} năm
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <MoneyField
                label="Gửi thêm mỗi tháng"
                value={saving}
                onChange={setSaving}
                min={0}
                max={50_000_000}
                step={500_000}
                inputMax={1_000_000_000}
                presets={presets([2_000_000, 5_000_000, 10_000_000, 15_000_000])}
              />
            )}
          </div>

          {/* Step 3: Monthly Household Income & Expense Breakdown */}
          <div className="space-y-4 border-t border-white/[0.06] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                3. Thu nhập &amp; Chi phí ({hasPartner ? '2 người' : 'Cá nhân'})
              </span>
              <Badge tone="neutral" className="tabular-nums">
                Thu: {totalIncomeMin === totalIncomeMax ? compact(totalIncomeAvg) : `${compact(totalIncomeMin)}–${compact(totalIncomeMax)}`}
              </Badge>
            </div>

            <MoneyField
              label={hasPartner ? 'Người 1 — Thu nhập công việc chính' : 'Thu nhập từ công việc chính (Full-time)'}
              value={salaryFullTime}
              onChange={setSalaryFullTime}
              min={0}
              max={200_000_000}
              step={1_000_000}
              inputMax={10_000_000_000}
              presets={presets([10_000_000, 15_000_000, 25_000_000, 40_000_000, 60_000_000])}
            />

            {inputMode === 'advanced' && (
              <>
                <IncomeRangeField
                  label="Người 1 — Công việc phụ (Freelance / Part-time)"
                  sublabel="Khoảng thu nhập / tháng"
                  minVal={freelanceIncomeMin}
                  maxVal={freelanceIncomeMax}
                  onMin={setFreelanceIncomeMin}
                  onMax={setFreelanceIncomeMax}
                  quickValues={[0, 2_000_000, 5_000_000, 10_000_000, 20_000_000]}
                />
                <IncomeRangeField
                  label="Người 1 — Thu nhập từ đầu tư"
                  sublabel="Khoảng thu nhập / tháng"
                  minVal={investIncomeMin}
                  maxVal={investIncomeMax}
                  onMin={setInvestIncomeMin}
                  onMax={setInvestIncomeMax}
                  quickValues={[0, 1_000_000, 3_000_000, 5_000_000, 15_000_000]}
                />
              </>
            )}

            {hasPartner && (
              <div className="space-y-3 rounded-xl border border-sky-400/20 bg-sky-500/[0.04] p-3">
                <MoneyField
                  label="Người 2 (Bạn đời) — Thu nhập chính / tháng"
                  value={partnerSalaryFullTime}
                  onChange={setPartnerSalaryFullTime}
                  min={0}
                  max={200_000_000}
                  step={1_000_000}
                  inputMax={10_000_000_000}
                  presets={presets([0, 12_000_000, 20_000_000, 30_000_000, 50_000_000])}
                />

                {inputMode === 'advanced' && (
                  <>
                    <IncomeRangeField
                      label="Người 2 — Công việc phụ (Freelance)"
                      sublabel="Khoảng thu nhập / tháng"
                      minVal={partnerFreelanceMin}
                      maxVal={partnerFreelanceMax}
                      onMin={setPartnerFreelanceMin}
                      onMax={setPartnerFreelanceMax}
                      quickValues={[0, 2_000_000, 5_000_000, 10_000_000]}
                    />
                    <IncomeRangeField
                      label="Người 2 — Thu nhập từ đầu tư"
                      sublabel="Khoảng thu nhập / tháng"
                      minVal={partnerInvestMin}
                      maxVal={partnerInvestMax}
                      onMin={setPartnerInvestMin}
                      onMax={setPartnerInvestMax}
                      quickValues={[0, 1_000_000, 3_000_000, 5_000_000]}
                    />
                  </>
                )}

                <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
                  <span className="block text-[11px] font-medium text-zinc-300">Cách chia khoản gửi hàng tháng</span>
                  <Segmented
                    size="sm"
                    value={contributionRule}
                    onChange={setContributionRule}
                    options={[
                      { value: 'PROPORTIONAL', label: 'Theo thu nhập' },
                      { value: 'SPLIT_50_50', label: '50 / 50' },
                      { value: 'CUSTOM', label: 'Tự chỉnh %' },
                    ]}
                  />
                  {contributionRule === 'CUSTOM' && (
                    <SliderField
                      label="Tỷ lệ Người 1 đóng góp"
                      display={`${earner1SharePct}% / ${100 - earner1SharePct}%`}
                      value={earner1SharePct}
                      onChange={setEarner1SharePct}
                      min={0}
                      max={100}
                      step={5}
                    />
                  )}
                </div>
              </div>
            )}

            <MoneyField
              label={hasPartner ? 'Chi phí sinh hoạt cố định của hộ / tháng' : 'Chi phí sinh hoạt cố định / tháng'}
              value={monthlyFixedExpense}
              onChange={setMonthlyFixedExpense}
              min={0}
              max={200_000_000}
              step={1_000_000}
              inputMax={10_000_000_000}
              presets={presets(hasPartner ? [12_000_000, 18_000_000, 25_000_000, 35_000_000] : [8_000_000, 12_000_000, 18_000_000, 25_000_000])}
            />

            {householdMode === 'FAMILY' && (
              <div className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-3">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-zinc-200">Số người phụ thuộc (con nhỏ / bố mẹ)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <Chip key={n} active={dependentsCount === n} onClick={() => setDependentsCount(n)}>
                        {n === 0 ? 'Chưa có' : `${n} người`}
                      </Chip>
                    ))}
                  </div>
                </div>
                <MoneyField
                  label="Chi phí cho người phụ thuộc / tháng"
                  value={monthlyDependentsCost}
                  onChange={setMonthlyDependentsCost}
                  min={0}
                  max={100_000_000}
                  step={1_000_000}
                  inputMax={10_000_000_000}
                  presets={presets([0, 4_000_000, 8_000_000, 15_000_000, 25_000_000])}
                />
              </div>
            )}

            {/* Total monthly income & Emergency Fund Mode summary card */}
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] p-3.5 space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-indigo-200">
                  {hasPartner ? 'Tổng thu nhập hộ / tháng' : 'Tổng thu nhập hàng tháng'}
                </span>
                <span className="text-base font-semibold tabular-nums text-white">
                  {totalIncomeMin === totalIncomeMax
                    ? vnd(totalIncomeAvg)
                    : `${compact(totalIncomeMin)} – ${compact(totalIncomeMax)}`}
                </span>
              </div>
              {totalIncomeMin !== totalIncomeMax && (
                <div className="text-[11px] tabular-nums text-zinc-400">
                  Thấp nhất: {vnd(totalIncomeMin)} · Cao nhất: {vnd(totalIncomeMax)} · TB: {vnd(totalIncomeAvg)}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[11px] text-zinc-400 tabular-nums">
                <span>
                  Tỷ lệ gửi: <strong className="text-emerald-300">{pct(roadmap.savingsRatePercent, 1)}</strong>
                </span>
                <span>
                  Dư tự do:{' '}
                  <strong className={householdAnalysis?.freeCashFlow < 0 ? 'text-red-300' : 'text-zinc-200'}>
                    {compact(
                      householdAnalysis?.freeCashFlow ??
                        totalIncomeAvg - monthlyFixedExpense - (householdMode === 'FAMILY' ? monthlyDependentsCost : 0) - (roadmap.requiredMonthlyDeposit || saving)
                    )}
                  </strong>
                </span>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-zinc-300">Xử lý Quỹ dự phòng khẩn cấp</span>
                </div>
                <Segmented
                  size="sm"
                  value={prioritizeEmergencyFund ? 'FUND_FIRST' : 'PARALLEL'}
                  onChange={(v) => setPrioritizeEmergencyFund(v === 'FUND_FIRST')}
                  options={[
                    { value: 'PARALLEL', label: 'Theo dõi song song' },
                    { value: 'FUND_FIRST', label: 'Lấp quỹ trước' },
                  ]}
                />
                {inputMode === 'advanced' && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-zinc-500">Số tháng dự phòng:</span>
                    {[
                      { v: 0, l: 'Khuyến nghị' },
                      { v: 6, l: '6T' },
                      { v: 9, l: '9T' },
                      { v: 12, l: '12T' },
                    ].map((opt) => (
                      <Chip
                        key={opt.v}
                        active={emergencyFundMonths === opt.v}
                        onClick={() => setEmergencyFundMonths(opt.v)}
                      >
                        {opt.l}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <BankPicker bankId={bankId} onBank={(id) => { setBankId(id); setCustomRate(''); }} tenure={tenure} onTenure={setTenure} />
          </div>

          {inputMode === 'basic' ? (
            <button
              type="button"
              onClick={() => setInputMode('advanced')}
              className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3.5 py-2.5 text-left text-xs text-zinc-400 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.05] hover:text-zinc-200"
            >
              <span className="truncate">
                Chuyên sâu: Tăng gửi/năm · Thưởng Tết · Bù lạm phát · Chuẩn TT14
              </span>
              <span className="shrink-0 font-medium text-indigo-300">Mở rộng</span>
            </button>
          ) : (
            <div className="space-y-5 border-t border-white/[0.06] pt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                Đòn bẩy &amp; Thực tế (Chuyên sâu)
              </div>

              {/* Annual step-up */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-zinc-300">Tăng mức gửi mỗi năm</label>
                  <DecimalInput
                    value={annualStepUpPct}
                    onChange={(v) => setAnnualStepUpPct(v === '' ? 0 : v)}
                    suffix="%/năm"
                    min={0}
                    max={30}
                    step={1}
                    className="w-28"
                    ariaLabel="Tỷ lệ tăng mức gửi hàng năm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 5, 10, 15].map((v) => (
                    <Chip key={v} active={Number(annualStepUpPct) === v} onClick={() => setAnnualStepUpPct(v)}>
                      {v === 0 ? 'Cố định (0%)' : `+${v}%/năm`}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Annual bonus lump sum */}
              <MoneyField
                label="Thưởng / Gửi gộp thêm cuối mỗi năm"
                value={annualBonusAmount}
                onChange={setAnnualBonusAmount}
                min={0}
                max={200_000_000}
                step={5_000_000}
                inputMax={5_000_000_000}
                presets={presets([0, 10_000_000, 20_000_000, 50_000_000])}
              />

              {/* Inflation adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-zinc-300">Bù trượt giá lạm phát</label>
                  <DecimalInput
                    value={inflationRatePct}
                    onChange={(v) => setInflationRatePct(v === '' ? 0 : v)}
                    suffix="%/năm"
                    min={0}
                    max={15}
                    step={0.5}
                    className="w-28"
                    ariaLabel="Bù trượt giá lạm phát hàng năm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 3.5, 4.5, 6].map((v) => (
                    <Chip key={v} active={Number(inflationRatePct) === v} onClick={() => setInflationRatePct(v)}>
                      {v === 0 ? 'Tắt (0%)' : `${v}%/năm`}
                    </Chip>
                  ))}
                </div>
                {effectiveInflation > 0 && roadmap.requiredPrincipal > roadmap.nominalRequiredPrincipal && (
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90 ring-1 ring-inset ring-amber-400/20">
                    Mục tiêu gốc <strong className="tabular-nums">{compact(roadmap.nominalRequiredPrincipal)}</strong> cần
                    nâng lên <strong className="tabular-nums">{compact(roadmap.requiredPrincipal)}</strong> để giữ nguyên
                    sức mua sau lạm phát {pct(effectiveInflation, 1)}/năm.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                  <Pencil className="size-3.5" /> Hoặc nhập lãi suất khác
                </label>
                <div className="flex items-center gap-1.5">
                  <DecimalInput
                    value={customRate}
                    onChange={setCustomRate}
                    suffix="%"
                    min={0}
                    max={20}
                    step={0.1}
                    className="w-24"
                    ariaLabel="Lãi suất tuỳ chỉnh"
                  />
                  {usingCustom && (
                    <button
                      onClick={() => setCustomRate('')}
                      aria-label="Bỏ lãi suất tuỳ chỉnh"
                      className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-zinc-400">Cơ sở tính lãi</span>
                <Segmented
                  size="sm"
                  value={calcMode}
                  onChange={setCalcMode}
                  options={[
                    { value: 'NOMINAL_MONTHS', label: 'Tháng đều / 12' },
                    { value: 'ACTUAL_DAYS', label: 'Chuẩn TT14 (30/365)' },
                  ]}
                />
              </div>
            </div>
          )}
        </Card>

        {/* ── Results ── */}
        <div id="planner-results" className="min-w-0 space-y-5">
          {!initialized && loading ? (
            <ResultsSkeleton />
          ) : (
            <div className={cx('space-y-5 animate-fade transition-opacity', loading && 'opacity-80')}>
              {loading && <div className="loading-bar rounded-full" />}
              {/* Headline */}
              <Card className="relative overflow-hidden p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
                {isTargetAmount ? (
                  <>
                    Để tích luỹ <span className="font-medium text-white">{vnd(roadmap.requiredPrincipal)}</span>
                    {isSavingSolver && (
                      <>
                        {' '}sau <span className="font-medium text-white">{targetYears} năm</span>
                      </>
                    )}
                    , bạn cần
                  </>
                ) : (
                  <>
                    Để nhận{' '}
                    <span className="font-medium text-white">{vnd(roadmap.targetMonthlyInterest || target)}</span> mỗi
                    tháng
                    {isSavingSolver && (
                      <>
                        {' '}sau <span className="font-medium text-white">{targetYears} năm</span>
                      </>
                    )}
                    , bạn cần
                  </>
                )}
                <Badge tone="brand">
                  {usingCustom ? 'Lãi suất tự nhập' : `${bank.name} · ${TENURE_LABELS[tenure]}`} · {pct(rate)}
                </Badge>
                {householdAnalysis && <Badge tone="neutral">{householdAnalysis.modeLabel}</Badge>}
                {roadmap.prioritizeEmergencyFund && (
                  <Badge tone="warning">
                    Lấp quỹ DP trước ({roadmap.emergencyFundMonths}T)
                  </Badge>
                )}
                {effectiveStepUp > 0 && <Badge tone="success">Tăng gửi +{pct(effectiveStepUp, 0)}/năm</Badge>}
                {effectiveBonus > 0 && <Badge tone="success">+{compact(effectiveBonus)} thưởng/năm</Badge>}
                {effectiveInflation > 0 && <Badge tone="warning">Đã bù lạm phát {pct(effectiveInflation, 1)}/năm</Badge>}
              </div>

              <div className="mt-3 break-words text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl lg:text-5xl">
                {roadmap.isAlreadyReached ? (
                  'Đã đạt mục tiêu 🎉'
                ) : isSavingSolver ? (
                  <>
                    {vnd(roadmap.requiredMonthlyDeposit)}
                    <span className="text-lg font-normal text-zinc-400 sm:text-2xl"> / tháng</span>
                  </>
                ) : reachable ? (
                  roadmap.timeText
                ) : (
                  'Hơn 60 năm'
                )}
              </div>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                {roadmap.isAlreadyReached
                  ? isTargetAmount
                    ? `Vốn hiện tại (${compact(capital)}) đã vượt mục tiêu và tạo ra ${vnd(
                        roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0
                      )} lãi mỗi tháng.`
                    : `Vốn hiện tại đã đủ tạo ra ${vnd(
                        roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0
                      )} lãi mỗi tháng.`
                  : isSavingSolver
                    ? `Gửi ${compact(roadmap.requiredMonthlyDeposit)} mỗi tháng${
                        effectiveStepUp > 0 ? ` (năm đầu, tăng ${pct(effectiveStepUp, 0)} mỗi năm)` : ''
                      } trong ${targetYears} năm để tích luỹ đủ ${vnd(roadmap.requiredPrincipal)}.`
                    : reachable
                      ? `Tích luỹ đủ ${vnd(roadmap.requiredPrincipal)} bằng cách gửi ${compact(saving)} mỗi tháng${
                          effectiveStepUp > 0 ? ` (tăng +${pct(effectiveStepUp, 0)}/năm)` : ''
                        } và để lãi tự tái đầu tư.`
                      : 'Với mức tiết kiệm hiện tại, mục tiêu quá xa. Hãy tăng số tiền gửi hàng tháng, bật tăng mức gửi hằng năm hoặc giảm mục tiêu.'}
              </p>

              <div className="mt-6">
                <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>Tiến độ hiện tại</span>
                  <span className="tabular-nums">
                    {compact(capital)} / {compact(roadmap.requiredPrincipal)}
                  </span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {isTargetAmount ? (
              <Stat
                icon={Coins}
                label="Lãi thụ động khi đạt"
                value={`${compact(roadmap.finalMonthlyPassiveIncome)}/th`}
                hint={`từ vốn ${compact(roadmap.requiredPrincipal)}`}
                className="card-interactive"
              />
            ) : (
              <Stat
                icon={Coins}
                label="Số vốn cần có"
                value={compact(roadmap.requiredPrincipal)}
                hint={`tại ${pct(rate)}/năm`}
                className="card-interactive"
              />
            )}

            {isSavingSolver ? (
              <Stat
                icon={Wallet}
                label="Cần gửi / tháng"
                value={compact(roadmap.requiredMonthlyDeposit)}
                hint={`tổng vốn tự gửi ${compact(roadmap.totalDeposited)}`}
                className="card-interactive"
              />
            ) : (
              <Stat
                icon={Wallet}
                label="Tổng tiền bạn gửi"
                value={reachable ? compact(roadmap.totalDeposited) : '—'}
                hint="vốn + tiền gửi + thưởng"
                className="card-interactive"
              />
            )}

            <Stat
              icon={PiggyBank}
              label="Lãi kép đóng góp"
              tone="emerald"
              value={reachable ? compact(roadmap.totalCompoundInterest) : '—'}
              hint={reachable ? `${pct(roadmap.compoundSharePct, 1)} tổng tài sản` : undefined}
              className="card-interactive"
            />
            <Stat
              icon={Gauge}
              label="Độ khả thi"
              tone={scoreTone}
              value={`${feasibility.score}/100`}
              hint={feasibility.ratingLabel.replace('High', 'cao')}
              className="card-interactive"
            />
          </div>

          {/* Insights right below Stats */}
          {(feasibility.strengths.length > 0 || feasibility.warnings.length > 0) && (
            <Card className="p-5 sm:p-6">
              <CardHeader title="Nhận xét về kế hoạch" />
              <ul className="mt-4 space-y-2.5">
                {feasibility.strengths.map((s) => (
                  <li key={s} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-300">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {s}
                  </li>
                ))}
                {feasibility.warnings.map((w) => (
                  <li key={w} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" /> {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Household Analysis, Emergency Fund & Stress-Test */}
          {householdAnalysis && <HouseholdInsightsCard analysis={householdAnalysis} roadmap={roadmap} />}

          {/* Chart / bank comparison */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={
                view === 'growth'
                  ? 'Tài sản tăng trưởng theo thời gian'
                  : isSavingSolver
                    ? 'Ngân hàng nào cần gửi hàng tháng ít nhất?'
                    : 'Về đích nhanh nhất với ngân hàng nào?'
              }
              description={
                view === 'growth'
                  ? 'Khoảng cách giữa hai đường là phần lãi kép ngân hàng trả cho bạn.'
                  : 'Mỗi ngân hàng tính ở kỳ hạn có lãi suất cao nhất.'
              }
              right={
                <Segmented
                  size="sm"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'growth', label: 'Tăng trưởng' },
                    { value: 'banks', label: 'So sánh ngân hàng' },
                  ]}
                />
              }
            />
            {view === 'growth' ? (
              <>
                <div className="mt-5 h-60 sm:mt-6 sm:h-72 lg:h-80">
                  {roadmap.monthByMonthLog.length > 1 ? (
                    <GrowthChart log={roadmap.monthByMonthLog} target={roadmap.requiredPrincipal} />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-white/[0.02] text-sm text-zinc-500">
                      Nhập số tiền gửi hàng tháng để xem biểu đồ
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-2"><span className="h-0.5 w-4 rounded bg-indigo-400" /> Tổng tài sản</span>
                  <span className="flex items-center gap-2"><span className="h-0.5 w-4 border-t border-dashed border-zinc-400" /> Tiền bạn gửi</span>
                  <span className="flex items-center gap-2"><span className="h-0.5 w-4 border-t border-dotted border-emerald-400" /> Mục tiêu</span>
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-4">
                {bankRuns.map(({ bank: b, tenure: t, rate: r, r: res }, i) => {
                  const pctBar = isSavingSolver
                    ? ((res.requiredMonthlyDeposit || 0) / maxMonthlyDep) * 100
                    : (Math.min(res.monthsNeeded, 720) / maxMonths) * 100;
                  return (
                    <div key={b.id} className="flex items-center gap-3">
                      <BankMark bank={b} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium text-zinc-200">
                            {b.name} <span className="font-normal text-zinc-500">· {TENURE_LABELS[t]} · {pct(r)}</span>
                          </span>
                          <span className={cx('shrink-0 font-semibold tabular-nums', i === 0 ? 'text-emerald-300' : 'text-white')}>
                            {isSavingSolver
                              ? `${compact(res.requiredMonthlyDeposit)}/th`
                              : res.monthsNeeded >= 720
                                ? '> 60 năm'
                                : duration(res.monthsNeeded)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className={cx('h-full rounded-full', i === 0 ? 'bg-emerald-400' : 'bg-zinc-500/60')}
                            style={{ width: `${pctBar}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* What-if */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={isSavingSolver ? 'Cách giảm số tiền cần gửi mỗi tháng' : 'Cách để về đích sớm hơn'}
              description="So với kế hoạch hiện tại của bạn."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {scenarios.map((s) => {
                const saved = reachable ? roadmap.monthsNeeded - (s.r.monthsNeeded || 0) : 0;
                const savedMonthly = s.r.savedMonthly || 0;
                return (
                  <div key={s.title} className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Sparkles className="size-3.5 text-indigo-300" /> {s.title}
                    </div>
                    <div className="mt-2 text-lg font-semibold tabular-nums text-white">
                      {isSavingSolver
                        ? `${compact(s.r.requiredMonthlyDeposit || 0)}/tháng`
                        : s.r.monthsNeeded >= 720
                          ? '> 60 năm'
                          : s.r.timeText}
                    </div>
                    {isSavingSolver
                      ? savedMonthly > 0 && (
                          <div className="mt-1 text-xs font-medium text-emerald-300">Giảm {compact(savedMonthly)}/tháng</div>
                        )
                      : saved > 0 && (
                          <div className="mt-1 text-xs font-medium text-emerald-300">Nhanh hơn {duration(saved)}</div>
                        )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Stage Passbook Shelf & Expandable Matrix (Option 4) */}
          <RoadmapPackageExplorer roadmap={roadmap} rows={rows} onRowsChange={setRows} />

          <RateDisclaimer />

          <FeedbackWidget
            toolId="plan"
            toolLabel={isTargetAmount ? 'Kế hoạch tích luỹ số tiền mục tiêu' : 'Kế hoạch thu nhập thụ động'}
            snapshot={{
              inputMode,
              goalType,
              solveMode,
              target,
              targetAmount,
              targetYears,
              capital,
              saving: isSavingSolver ? roadmap.requiredMonthlyDeposit : saving,
              bankId,
              tenure,
              rate,
              timeText: roadmap.timeText,
            }}
          />
            </div>
          )}
        </div>
      </div>

      {/* Google Docs Modal */}
      <Modal open={gdocsOpen} onClose={() => setGdocsOpen(false)} title="Liên kết & xuất sang Google Docs">
        <div className="space-y-4">
          <Callout icon={FileText} tone="brand">
            Báo cáo bao gồm đầy đủ thông số kế hoạch, điểm khả thi, kịch bản tăng tốc và bảng lộ trình theo năm — được
            định dạng sẵn để dán trực tiếp vào Google Docs hoặc tải file <code className="text-indigo-200">.doc</code>.
          </Callout>
          <div className="space-y-2.5">
            <Button variant="primary" className="w-full" onClick={handleOpenGoogleDocs}>
              <ExternalLink className="size-4" /> Chép báo cáo &amp; Mở Google Docs (docs.new)
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleCopyForGoogleDocs}>
              <Copy className="size-4" /> Chỉ sao chép nội dung báo cáo (Ctrl+V)
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                downloadGoogleDocsFile(reportPayload);
                notify('Đã tải file .DOC tương thích Google Docs & Word');
              }}
            >
              <Download className="size-4" /> Tải file .DOC (Upload lên Google Drive / Word)
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Mẹo: Khi trang Google Docs mới mở ra, bạn chỉ cần nhấn <strong className="text-zinc-300">Ctrl + V</strong>{' '}
            (hoặc <strong className="text-zinc-300">Cmd + V</strong> trên Mac) để chèn toàn bộ tiêu đề và bảng số liệu
            vừa tính.
          </p>
        </div>
      </Modal>
      {/* Mobile / Tablet sticky live summary bar */}
      <div className="print-hidden fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 md:inset-x-auto md:bottom-4 md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2 md:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => document.getElementById('planner-results')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-400/25 bg-elevated/95 px-4 py-2.5 text-left shadow-2xl backdrop-blur"
        >
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-400">
              {isSavingSolver ? `Cần gửi / tháng (${targetYears} năm)` : `Đích đến (${pct(rate)}/năm)`}
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-white">
              {roadmap.isAlreadyReached
                ? 'Đã đạt mục tiêu'
                : isSavingSolver
                  ? `${compact(roadmap.requiredMonthlyDeposit)}/th`
                  : reachable
                    ? roadmap.timeText
                    : '> 60 năm'}{' '}
              · <span className="text-emerald-300">{compact(roadmap.requiredPrincipal)}</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-200">
            Kết quả <ArrowDown className="size-3" />
          </span>
        </button>
      </div>
    </>
  );
}
