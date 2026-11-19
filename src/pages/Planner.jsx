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
import { useI18n } from '../i18n/index.jsx';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { copyReportForGoogleDocs, downloadGoogleDocsFile } from '../utils/googleDocsExporter.js';
import { syncUserPrefCookie } from '../utils/cookieManager.js';
import { cryptoStorage } from '../utils/cryptoStorage.js';
import { compact, chip, duration, fmt, pct, vnd } from '../utils/format.js';
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

const presets = (arr, l) => arr.map((v) => ({ value: v, label: v === 0 ? '0 ₫' : chip(v, l) }));

function IncomeRangeField({ label, sublabel, minVal, maxVal, onMin, onMax, quickValues }) {
  const { lang, tx } = useI18n();
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
          <span className="mb-1 block text-[11px] text-zinc-500">
            {tx('Thấp nhất / tháng', 'Monthly Min', '月額下限')}
          </span>
          <NumberInput
            value={minVal}
            onChange={onMin}
            suffix="₫"
            max={10_000_000_000}
            ariaLabel={`${label} ${tx('thấp nhất', 'min', '下限')}`}
          />
        </div>
        <div>
          <span className="mb-1 block text-[11px] text-zinc-500">
            {tx('Cao nhất / tháng', 'Monthly Max', '月額上限')}
          </span>
          <NumberInput
            value={maxVal}
            onChange={onMax}
            suffix="₫"
            max={10_000_000_000}
            ariaLabel={`${label} ${tx('cao nhất', 'max', '上限')}`}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[11px] text-zinc-500">{tx('Đặt nhanh:', 'Quick fill:', 'クイック設定：')}</span>
        {quickValues.map((v) => (
          <Chip key={v} active={bothEqual && minVal === v} onClick={() => applyPreset(v)}>
            {v === 0 ? '0 ₫' : chip(v, lang)}
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
  const { lang, tx } = useI18n();

  if (!stage) return null;

  const validFilter =
    groupFilter === 'all' || stage.cohorts.some((c) => c.key === groupFilter) ? groupFilter : 'all';
  const filteredPackages =
    validFilter === 'all' ? stage.packages : stage.packages.filter((p) => p.groupKey === validFilter);
  const cdUnit = tx('gói', 'CDs', '口');

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
                      {cohort.packageCount} {cdUnit}
                    </Badge>
                    <Badge tone={cohort.rolledPackages > 0 ? 'brand' : 'neutral'}>
                      {cohort.rolledPackages > 0
                        ? tx(`Tái tục ${cohort.maxRolloverCount} lần`, `Rolled ×${cohort.maxRolloverCount}`, `継続 ${cohort.maxRolloverCount}回`)
                        : tx('Đang kỳ đầu', 'First cycle', '初回')}
                    </Badge>
                  </div>
                </div>

                <div className="mt-1.5 text-[11px] font-mono text-zinc-400">{cohort.codeRange}</div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">{tx('Gốc mở sổ', 'Opening Capital', '預入元本')}</div>
                    <div className="mt-0.5 font-medium text-zinc-200">
                      {cohort.packageCount === 1
                        ? vnd(cohort.totalInitial, lang)
                        : `${compact(cohort.perPackageInitial, lang)}/${tx('sổ', 'CD', '口')}`}
                    </div>
                    {cohort.packageCount > 1 && (
                      <div className="text-[10px] text-zinc-500">
                        {tx('Tổng gốc:', 'Total:', '元本計：')} {compact(cohort.totalInitial, lang)}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">{tx('Số dư hiện tại', 'Current Balance', '現在残高')}</div>
                    <div className="mt-0.5 font-semibold text-white">{vnd(cohort.totalBalance, lang)}</div>
                    <div className="text-[10px] text-emerald-300/80">
                      +{compact(cohort.totalAccumulatedInterest, lang)} {tx('lãi gộp', 'compounded', '組入利息')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-xs tabular-nums ring-1 ring-inset ring-emerald-400/20">
                <div className="text-emerald-200">
                  {cohort.packageCount > 1 && (
                    <span className="mr-1.5 text-[11px] text-emerald-300/80">
                      {tx(
                        `Mỗi sổ +${compact(cohort.perPackageMonthlyInterest, lang)}/th ·`,
                        `Each +${compact(cohort.perPackageMonthlyInterest, lang)}/mo ·`,
                        `1口 +${compact(cohort.perPackageMonthlyInterest, lang)}/月 ·`
                      )}
                    </span>
                  )}
                  <strong className="font-semibold text-emerald-300">
                    +{vnd(cohort.totalMonthlyInterest, lang)}
                    {tx('/tháng', '/mo', '/月')}
                  </strong>
                </div>
                <span className="font-semibold text-emerald-300">
                  {pct(cohort.sharePct, 1, lang)} {tx('tổng lãi', 'of yield', 'シェア')}
                </span>
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
          {tx('Tất cả', 'All', 'すべて')} ({stage.packagesTotalCount} {tx('sổ', 'CDs', '口')})
        </Chip>
        {stage.cohorts.map((c) => (
          <Chip key={c.key} active={validFilter === c.key} onClick={() => setGroupFilter(c.key)}>
            {c.label} ({c.packageCount})
          </Chip>
        ))}
      </div>

      {stage.packagesTruncated && (
        <p className="rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
          {tx(
            `Đang hiển thị 12 sổ đầu + 108 sổ gần nhất trên tổng số ${stage.packagesTotalCount} sổ để giữ giao diện mượt mà. Chuyển sang Gộp theo lô / đợt để xem trọn bộ từng năm.`,
            `Showing first 12 + latest 108 of ${stage.packagesTotalCount} passbooks for smooth scrolling. Switch to Group by Cohort for yearly totals.`,
            `快適に表示するため計${stage.packagesTotalCount}口のうち先頭12口＋直近108口を表示しています。全体は「グループ表示」で確認できます。`
          )}
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
                  {pkg.rolloverCount > 0
                    ? tx(`Tái tục ${pkg.rolloverCount} lần`, `Rolled ×${pkg.rolloverCount}`, `継続 ${pkg.rolloverCount}回`)
                    : tx(`Đáo hạn T${pkg.nextMaturityMonth}`, `Mat. M${pkg.nextMaturityMonth}`, `満期 M${pkg.nextMaturityMonth}`)}
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{pkg.groupLabel}</span>
                <span>
                  {pkg.openMonth === 0
                    ? tx('Mở ban đầu', 'Opened Day 0', '開始時')
                    : tx(`Mở T${pkg.openMonth}`, `Opened M${pkg.openMonth}`, `開始 M${pkg.openMonth}`)}
                </span>
              </div>
              <div className="mt-2.5 space-y-1 border-t border-white/[0.05] pt-2 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>{tx('Gốc mở sổ:', 'Principal:', '預入元本：')}</span>
                  <span>{vnd(pkg.initialPrincipal, lang)}</span>
                </div>
                <div className="flex justify-between font-medium text-white">
                  <span>{tx('Số dư hiện tại:', 'Balance:', '現在残高：')}</span>
                  <span>{vnd(pkg.currentBalance, lang)}</span>
                </div>
                <div className="flex justify-between text-emerald-300/80">
                  <span>{tx('Lãi đã tích luỹ:', 'Interest:', '累計利息：')}</span>
                  <span>+{vnd(pkg.accumulatedInterest, lang)}</span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-500/[0.08] px-2.5 py-1.5 font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
              <span>
                +{vnd(pkg.monthlyInterest, lang)}
                {tx('/tháng', '/mo', '/月')}
              </span>
              <span className="text-[11px] opacity-80">{pct(pkg.sharePct, 1, lang)}</span>
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
  const { lang, tx } = useI18n();
  const cdUnit = tx('gói', 'CDs', '口');

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
        title={tx('Chi tiết lộ trình & Danh mục gói tiết kiệm', 'Stage Passbook Shelf & Breakdown', 'ロードマップ明細・保有証書')}
        description={tx(
          `Theo dõi chính xác ở từng giai đoạn bạn sở hữu bao nhiêu sổ (kỳ hạn ${roadmap.tenureMonths || 12} tháng) và mỗi sổ đang mang lại bao nhiêu tiền lãi.`,
          `Inspect how many passbooks (${roadmap.tenureMonths || 12}-month term) you hold at each stage and monthly interest generated.`,
          `各時点の保有証書数（期間 ${roadmap.tenureMonths || 12}ヶ月）と証書ごとの毎月利息を確認できます。`
        )}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={explorerView}
              onChange={setExplorerView}
              options={[
                { value: 'shelf', label: tx('Kệ sổ theo giai đoạn', 'Passbook Shelf', 'ステージ別') },
                { value: 'matrix', label: tx('Bảng phân tầng', 'Tiered Matrix', '推移マトリクス') },
              ]}
            />
            <Segmented
              size="sm"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: 'cohorts', label: tx('Gộp theo lô / đợt', 'Group by Cohort', 'グループ') },
                { value: 'individual', label: tx('Từng sổ lẻ', 'Single CDs', '個別証書') },
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
              const pillLabel = s.isGoal
                ? `${s.label.replace(/[·・]\s*(Đạt mục tiêu|Goal Reached|目標達成)/, '').trim()} 🎯`
                : s.label;
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
                      {pillLabel}
                    </span>
                    <Badge tone={active ? 'brand' : 'neutral'}>
                      {s.totalPackages} {cdUnit}
                    </Badge>
                  </div>
                  <div className="text-[11px] tabular-nums text-zinc-400">
                    +{compact(s.monthlyInterest, lang)}
                    {tx('/th', '/mo', '/月')} · {pct(s.goalProgressPct, 0, lang)}
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
                {tx('Giai đoạn:', 'Milestone:', 'ステージ：')} {activeStage.label}
              </div>
              <span className="text-xs text-zinc-400 tabular-nums">
                {tx(
                  `Đã tích luỹ ${pct(activeStage.goalProgressPct, 1, lang)} mục tiêu`,
                  `${pct(activeStage.goalProgressPct, 1, lang)} toward target`,
                  `目標達成率 ${pct(activeStage.goalProgressPct, 1, lang)}`
                )}
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl bg-black/30 p-3">
                <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Package className="size-3.5 text-indigo-300" /> {tx('Tổng số gói đang mở', 'Open Passbooks', '保有証書数')}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-white">
                  {activeStage.totalPackages} {cdUnit}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {activeStage.rolledOverCount} {tx('đã tái tục', 'rolled', '継続')} · {activeStage.firstCycleCount}{' '}
                  {tx('kỳ đầu', 'new', '初回')}
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-[11px] text-zinc-500">{tx('Tổng số dư các sổ', 'Total Balance', '合計残高')}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-white">{compact(activeStage.totalBalance, lang)}</div>
                <div className="text-[11px] text-zinc-500 tabular-nums">
                  {tx('Vốn gửi:', 'Principal:', '元本：')} {compact(activeStage.totalDeposited, lang)}
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-[11px] text-zinc-500">{tx('Lãi các sổ đẻ ra / tháng', 'Monthly Interest Earned', '毎月発生利息')}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-emerald-300">
                  +{compact(activeStage.monthlyInterest, lang)}
                  {tx('/th', '/mo', '/月')}
                </div>
                <div className="text-[11px] text-zinc-500 tabular-nums">
                  ~{compact(activeStage.annualInterest, lang)}
                  {tx('/năm', '/yr', '/年')}
                </div>
              </div>
              <div className="rounded-xl bg-black/30 p-3">
                <div className="text-[11px] text-zinc-500">{tx('Tổng lãi kép tích luỹ', 'Compounded Gain', '累計複利')}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-indigo-300">
                  +{compact(activeStage.accumulatedInterest, lang)}
                </div>
                <div className="text-[11px] text-zinc-500">{tx('từ lãi nhập gốc', 'from reinvestment', '複利再投資分')}</div>
              </div>
            </div>

            {activeStage.cohorts.length > 0 && activeStage.monthlyInterest > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span>{tx('Tỷ trọng nguồn lãi theo đợt mở sổ', 'Yield breakdown by cohort', 'ロット別利息シェア')}</span>
                  <span className="tabular-nums">
                    {tx('Tổng', 'Total', '合計')} +{vnd(activeStage.monthlyInterest, lang)}
                    {tx('/tháng', '/mo', '/月')} (100%)
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  {activeStage.cohorts.map((c) => {
                    const st = COHORT_STYLE[c.tone] || COHORT_STYLE.emerald;
                    return (
                      <div
                        key={c.key}
                        title={`${c.label}: +${vnd(c.totalMonthlyInterest, lang)}${tx('/th', '/mo', '/月')} (${pct(c.sharePct, 1, lang)})`}
                        className={cx('h-full border-r border-canvas/70 last:border-r-0', st.bar)}
                        style={{ width: `${Math.max(1, c.sharePct)}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-indigo-400" /> {tx('Vốn ban đầu', 'Initial Capital', '初期元本')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-sky-400" /> {tx('Các lô cũ đã tái tục', 'Rolled Cohorts', '継続ロット')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400" /> {tx('Lô mới kỳ đầu', 'New Cohorts', '新規ロット')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-400" /> {tx('Thưởng cuối năm', 'Annual Bonuses', '年間賞与')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <StagePackageDetails stage={activeStage} granularity={granularity} />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-zinc-500">
              {tx('Nhấn vào một dòng giai đoạn để mở chi tiết các gói bên trong.', 'Click any row to inspect passbooks inside.', '行をクリックすると詳細証書を確認できます。')}
            </span>
            <Segmented
              size="sm"
              value={rows}
              onChange={onRowsChange}
              options={[
                { value: 'yearly', label: tx('Theo năm', 'Yearly', '年次') },
                { value: 'all', label: tx('Theo tháng', 'Monthly', '月次') },
              ]}
            />
          </div>

          <Table
            className="max-h-[560px]"
            head={[
              tx('Giai đoạn', 'Milestone', '時点'),
              tx('Số gói mở', 'Open CDs', '保有口数'),
              tx('Tiền đã gửi', 'Deposited', '積立元本'),
              tx('Lãi tích luỹ', 'Interest', '累計利息'),
              tx('Tổng tài sản', 'Total Assets', '総資産'),
              tx('Lãi / tháng', 'Yield / Mo', '毎月利息'),
            ]}
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
                        {r.month === 0
                          ? tx('Hiện tại', 'Now', '現在')
                          : r.month % 12 === 0
                            ? tx(`Năm ${r.month / 12}`, `Year ${r.month / 12}`, `${r.month / 12}年目`)
                            : tx(`Tháng ${r.month}`, `Month ${r.month}`, `${r.month}ヶ月目`)}
                      </span>
                      {goal && (
                        <Badge tone="success" className="ml-2">
                          {tx('Đạt mục tiêu', 'Goal Reached', '目標達成')}
                        </Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Badge tone={isExpanded ? 'brand' : 'neutral'}>
                        {r.activePackagesCount ?? 0} {cdUnit}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{fmt(r.principalDeposited, lang)}</td>
                    <td className="px-4 py-3 text-right text-emerald-300/90">+{fmt(r.interestEarnedTotal, lang)}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmt(r.totalBalance, lang)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">{fmt(r.monthlyPassiveIncomeGenerated, lang)}</td>
                  </tr>
                  {isExpanded && match?.stage && (
                    <tr className="bg-black/25">
                      <td colSpan={6} className="p-4">
                        {!match.exact && (
                          <p className="mb-3 text-[11px] text-amber-300/90">
                            {tx(
                              `Đang hiển thị cơ cấu gói tại cột mốc gần nhất (${match.stage.label}).`,
                              `Showing nearest passbook milestone (${match.stage.label}).`,
                              `最寄りのマイルストーン（${match.stage.label}）の内訳を表示しています。`
                            )}
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
    timeText: '...',
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
    ratingLabel: '...',
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
  const { lang, tx, formatTenure } = useI18n();
  const notify = useToast();
  const saved = useMemo(() => loadSavedPlannerState(), []);
  const pset = (arr) => presets(arr, lang);

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
    const head = [
      tx('Tháng', 'Month', '経過月'),
      tx('Vốn đã gửi (VND)', 'Deposited Principal (VND)', '積立元本 (VND)'),
      tx('Lãi kép tích luỹ (VND)', 'Compounded Interest (VND)', '累計複利 (VND)'),
      tx('Tổng tài sản (VND)', 'Total Assets (VND)', '総資産 (VND)'),
      tx('Thu nhập thụ động/tháng (VND)', 'Passive Income / Mo (VND)', '毎月不労所得 (VND)'),
    ];
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
    a.download = `VnSavingPro_Roadmap_${isTargetAmount ? targetAmount : target}.csv`;
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
    if (lang !== 'vi') query.lang = lang;
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
      notify(tx('Đã sao chép link chia sẻ kế hoạch', 'Plan share link copied!', 'プラン共有リンクをコピーしました！'));
    });
  };

  const reportPayload = {
    lang,
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
    bankName: usingCustom ? tx('Lãi suất tự nhập', 'Custom Rate', '独自設定金利') : bank.name,
    tenureLabel: formatTenure(tenure),
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
    notify(
      tx(
        'Đã chép báo cáo! Hãy nhấn Ctrl+V (hoặc Cmd+V) trong trang Google Docs mới mở.',
        'Report copied! Press Ctrl+V (or Cmd+V) inside the newly opened Google Docs page.',
        'レポートをコピーしました！新しいGoogleドキュメントで貼り付け（Ctrl+V / Cmd+V）してください。'
      )
    );
  };

  const handleCopyForGoogleDocs = async () => {
    await copyReportForGoogleDocs(reportPayload);
    notify(
      tx(
        'Đã sao chép báo cáo (kèm bảng định dạng) vào clipboard',
        'Formatted report copied to clipboard',
        '整形済みレポートをクリップボードにコピーしました'
      )
    );
  };

  return (
    <>
      <PageHeader
        icon={Target}
        eyebrow={tx('Kế hoạch thu nhập thụ động', 'Passive Income Roadmap', '不労所得・資産計画プランナー')}
        title={tx('Bao giờ tiền lãi đủ nuôi bạn?', 'When Will Your Interest Pay Your Bills?', '預金利息で生活費を賄える日はいつ？')}
        description={tx(
          'Nhập mục tiêu và khả năng tiết kiệm. Chúng tôi tính số vốn cần có, thời gian về đích và cách để đến nhanh hơn.',
          'Set your target and monthly savings capacity. We compute required capital, your timeline, Emergency Fund buffer, and faster shortcuts.',
          '目標と毎月の積立力を入力するだけで、必要元本・達成時期・緊急資金・最短シナリオを算出します。'
        )}
        actions={
          <>
            <Button size="sm" onClick={sharePlan}>
              <Share2 className="size-3.5" /> {tx('Chia sẻ link', 'Share Link', 'リンク共有')}
            </Button>
            <Button size="sm" onClick={() => setGdocsOpen(true)} disabled={!roadmap.monthByMonthLog.length}>
              <FileText className="size-3.5 text-indigo-300" /> Google Docs
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" /> {tx('In / PDF', 'Print / PDF', '印刷 / PDF')}
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={!roadmap.monthByMonthLog.length}>
              <Download className="size-3.5" /> {tx('Xuất CSV', 'Export CSV', 'CSV出力')}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Inputs */}
        <Card className="space-y-5 p-5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <SlidersHorizontal className="size-3.5 text-indigo-300" /> {tx('Phiên bản nhập liệu', 'Input Mode', '入力モード')}
              </span>
              <Segmented
                size="sm"
                value={inputMode}
                onChange={setInputMode}
                options={[
                  { value: 'basic', label: tx('Cơ bản', 'Basic', '基本') },
                  { value: 'advanced', label: tx('Chuyên sâu', 'Pro', '詳細') },
                ]}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {inputMode === 'basic'
                ? tx(
                    'Phiên bản Cơ bản (Nhanh): thông số cốt lõi, tính thuần theo lãi suất ngân hàng.',
                    'Basic (Quick): essential inputs calculated cleanly with bank rates.',
                    '基本（簡易）：主要項目だけでシンプルに試算します。'
                  )
                : tx(
                    'Phiên bản Chuyên sâu (Thực tế): thu nhập đa nguồn, phân chia 2 người, tăng gửi/năm, thưởng & lạm phát.',
                    'Pro (Realistic): multi-source income ranges, 2-earner splits, annual step-up, bonuses & inflation.',
                    '詳細（実践）：副業・投資範囲、2人の負担配分、毎年増額、賞与、インフレ調整に対応。'
                  )}
            </p>
            <div className="pt-2">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {tx('0. Hồ sơ tài chính', '0. Household Profile', '0. 世帯プロファイル')}
              </span>
              <HouseholdModeSwitch value={householdMode} onChange={handleHouseholdChange} />
            </div>
          </div>

          {/* Step 1: Dual Goal Selection */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {tx('1. Mục tiêu cần đạt', '1. Target Goal', '1. 目標設定')}
              </span>
              <Segmented
                size="sm"
                value={goalType}
                onChange={setGoalType}
                options={[
                  { value: 'PASSIVE_INCOME', label: tx('Lãi thụ động / tháng', 'Passive Yield / Mo', '毎月不労所得') },
                  { value: 'TARGET_AMOUNT', label: tx('Số tiền mục tiêu', 'Target Capital', '目標金額') },
                ]}
              />
            </div>

            {isTargetAmount ? (
              <MoneyField
                label={tx('Tổng số tiền tiết kiệm mục tiêu', 'Total Savings Goal Amount', '目標積立元本額')}
                hint={tx(
                  `Khi đạt mốc này, tiền lãi sinh ra khoảng ${vnd(roadmap.baseMonthlyInterest, lang)}/tháng.`,
                  `At goal, monthly passive interest yields approx. ${vnd(roadmap.baseMonthlyInterest, lang)}/mo.`,
                  `目標達成時、毎月の不労所得は約 ${vnd(roadmap.baseMonthlyInterest, lang)}/月 になります。`
                )}
                value={targetAmount}
                onChange={setTargetAmount}
                min={50_000_000}
                max={10_000_000_000}
                step={25_000_000}
                inputMax={500_000_000_000}
                presets={pset([100_000_000, 300_000_000, 500_000_000, 1_000_000_000, 2_000_000_000, 5_000_000_000])}
              />
            ) : (
              <MoneyField
                label={tx('Thu nhập thụ động mong muốn / tháng', 'Desired Passive Income / Month', '毎月の目標不労所得')}
                hint={tx(
                  `Cần tích luỹ sổ tiết kiệm gốc khoảng ${compact(roadmap.nominalRequiredPrincipal, lang)} (tại ${pct(rate, 2, lang)}/năm).`,
                  `Requires approx. ${compact(roadmap.nominalRequiredPrincipal, lang)} in principal (at ${pct(rate, 2, lang)}/yr).`,
                  `必要元本の目安は約 ${compact(roadmap.nominalRequiredPrincipal, lang)}（年利 ${pct(rate, 2, lang)} 換算）。`
                )}
                value={target}
                onChange={setTarget}
                min={1_000_000}
                max={100_000_000}
                step={500_000}
                inputMax={1_000_000_000}
                presets={pset([3_000_000, 5_000_000, 10_000_000, 20_000_000, 30_000_000, 50_000_000])}
              />
            )}
          </div>

          {/* Step 2: Bidirectional Solver */}
          <div className="space-y-4 border-t border-white/[0.06] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {tx('2. Kế hoạch gửi tiết kiệm', '2. Savings Plan', '2. 積立計画')}
              </span>
              <Segmented
                size="sm"
                value={solveMode}
                onChange={setSolveMode}
                options={[
                  { value: 'TIME', label: tx('Tính thời gian đạt', 'Solve Timeline', '達成期間を計算') },
                  { value: 'SAVING', label: tx('Tính tiền gửi / tháng', 'Solve Monthly Save', '必要積立額を計算') },
                ]}
              />
            </div>

            <MoneyField
              label={tx('Vốn tiết kiệm hiện có', 'Existing Initial Capital', '現在の貯蓄元本')}
              value={capital}
              onChange={setCapital}
              min={0}
              max={2_000_000_000}
              step={5_000_000}
              inputMax={100_000_000_000}
              presets={pset([0, 50_000_000, 200_000_000, 500_000_000])}
            />

            {isSavingSolver ? (
              <div className="space-y-2.5">
                <SliderField
                  label={tx('Thời hạn muốn đạt mục tiêu', 'Target Time Horizon', '目標達成期間')}
                  display={`${targetYears} ${tx('năm', 'yrs', '年')} (${targetYears * 12} ${tx('tháng', 'mos', 'ヶ月')})`}
                  value={targetYears}
                  onChange={setTargetYears}
                  min={1}
                  max={30}
                  step={1}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 5, 10, 15, 20].map((y) => (
                    <Chip key={y} active={targetYears === y} onClick={() => setTargetYears(y)}>
                      {y} {tx('năm', 'yrs', '年')}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <MoneyField
                label={tx('Gửi thêm mỗi tháng', 'Monthly Contribution', '毎月の積立額')}
                value={saving}
                onChange={setSaving}
                min={0}
                max={50_000_000}
                step={500_000}
                inputMax={1_000_000_000}
                presets={pset([2_000_000, 5_000_000, 10_000_000, 15_000_000])}
              />
            )}
          </div>

          {/* Step 3: Monthly Household Income & Expense Breakdown */}
          <div className="space-y-4 border-t border-white/[0.06] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {tx('3. Thu nhập & Chi phí', '3. Income & Expenses', '3. 収入と支出')} (
                {hasPartner ? tx('2 người', '2 Earners', '2人分') : tx('Cá nhân', 'Individual', '個人')})
              </span>
              <Badge tone="neutral" className="tabular-nums">
                {tx('Thu:', 'In:', '月収：')}{' '}
                {totalIncomeMin === totalIncomeMax
                  ? compact(totalIncomeAvg, lang)
                  : `${compact(totalIncomeMin, lang)}–${compact(totalIncomeMax, lang)}`}
              </Badge>
            </div>

            <MoneyField
              label={
                hasPartner
                  ? tx('Người 1 — Thu nhập công việc chính', 'Earner 1 — Full-Time Income', '1人目 — 本業の月収')
                  : tx('Thu nhập từ công việc chính (Full-time)', 'Primary Full-Time Income', '本業の月収（フルタイム）')
              }
              value={salaryFullTime}
              onChange={setSalaryFullTime}
              min={0}
              max={200_000_000}
              step={1_000_000}
              inputMax={10_000_000_000}
              presets={pset([10_000_000, 15_000_000, 25_000_000, 40_000_000, 60_000_000])}
            />

            {inputMode === 'advanced' && (
              <>
                <IncomeRangeField
                  label={tx('Người 1 — Công việc phụ (Freelance / Part-time)', 'Earner 1 — Side Income (Freelance)', '1人目 — 副業収入（フリーランス等）')}
                  sublabel={tx('Khoảng thu nhập / tháng', 'Monthly range', '月額レンジ')}
                  minVal={freelanceIncomeMin}
                  maxVal={freelanceIncomeMax}
                  onMin={setFreelanceIncomeMin}
                  onMax={setFreelanceIncomeMax}
                  quickValues={[0, 2_000_000, 5_000_000, 10_000_000, 20_000_000]}
                />
                <IncomeRangeField
                  label={tx('Người 1 — Thu nhập từ đầu tư', 'Earner 1 — Investment Income', '1人目 — 投資収入')}
                  sublabel={tx('Khoảng thu nhập / tháng', 'Monthly range', '月額レンジ')}
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
                  label={tx('Người 2 (Bạn đời) — Thu nhập chính / tháng', 'Earner 2 (Partner) — Full-Time / Mo', '2人目（パートナー）— 本業月収')}
                  value={partnerSalaryFullTime}
                  onChange={setPartnerSalaryFullTime}
                  min={0}
                  max={200_000_000}
                  step={1_000_000}
                  inputMax={10_000_000_000}
                  presets={pset([0, 12_000_000, 20_000_000, 30_000_000, 50_000_000])}
                />

                {inputMode === 'advanced' && (
                  <>
                    <IncomeRangeField
                      label={tx('Người 2 — Công việc phụ (Freelance)', 'Earner 2 — Side Income (Freelance)', '2人目 — 副業収入')}
                      sublabel={tx('Khoảng thu nhập / tháng', 'Monthly range', '月額レンジ')}
                      minVal={partnerFreelanceMin}
                      maxVal={partnerFreelanceMax}
                      onMin={setPartnerFreelanceMin}
                      onMax={setPartnerFreelanceMax}
                      quickValues={[0, 2_000_000, 5_000_000, 10_000_000]}
                    />
                    <IncomeRangeField
                      label={tx('Người 2 — Thu nhập từ đầu tư', 'Earner 2 — Investment Income', '2人目 — 投資収入')}
                      sublabel={tx('Khoảng thu nhập / tháng', 'Monthly range', '月額レンジ')}
                      minVal={partnerInvestMin}
                      maxVal={partnerInvestMax}
                      onMin={setPartnerInvestMin}
                      onMax={setPartnerInvestMax}
                      quickValues={[0, 1_000_000, 3_000_000, 5_000_000]}
                    />
                  </>
                )}

                <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
                  <span className="block text-[11px] font-medium text-zinc-300">
                    {tx('Cách chia khoản gửi hàng tháng', 'Monthly Savings Split Rule', '毎月の積立分担ルール')}
                  </span>
                  <Segmented
                    size="sm"
                    value={contributionRule}
                    onChange={setContributionRule}
                    options={[
                      { value: 'PROPORTIONAL', label: tx('Theo thu nhập', 'Proportional', '収入比例') },
                      { value: 'SPLIT_50_50', label: '50 / 50' },
                      { value: 'CUSTOM', label: tx('Tự chỉnh %', 'Custom %', '自由配分%') },
                    ]}
                  />
                  {contributionRule === 'CUSTOM' && (
                    <SliderField
                      label={tx('Tỷ lệ Người 1 đóng góp', 'Earner 1 Share', '1人目の負担割合')}
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
              label={
                hasPartner
                  ? tx('Chi phí sinh hoạt cố định của hộ / tháng', 'Fixed Household Living Cost / Mo', '世帯の固定生活費 / 月')
                  : tx('Chi phí sinh hoạt cố định / tháng', 'Fixed Living Expenses / Mo', '毎月の固定生活費')
              }
              value={monthlyFixedExpense}
              onChange={setMonthlyFixedExpense}
              min={0}
              max={200_000_000}
              step={1_000_000}
              inputMax={10_000_000_000}
              presets={pset(hasPartner ? [12_000_000, 18_000_000, 25_000_000, 35_000_000] : [8_000_000, 12_000_000, 18_000_000, 25_000_000])}
            />

            {householdMode === 'FAMILY' && (
              <div className="space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-3">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-zinc-200">
                    {tx('Số người phụ thuộc (con nhỏ / bố mẹ)', 'Dependents (children / parents)', '扶養家族の人数（子ども・親など）')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <Chip key={n} active={dependentsCount === n} onClick={() => setDependentsCount(n)}>
                        {n === 0 ? tx('Chưa có', 'None', 'なし') : `${n} ${tx('người', 'dep.', '人')}`}
                      </Chip>
                    ))}
                  </div>
                </div>
                <MoneyField
                  label={tx('Chi phí cho người phụ thuộc / tháng', 'Monthly Dependents Expenses', '扶養家族関連の月額費用')}
                  value={monthlyDependentsCost}
                  onChange={setMonthlyDependentsCost}
                  min={0}
                  max={100_000_000}
                  step={1_000_000}
                  inputMax={10_000_000_000}
                  presets={pset([0, 4_000_000, 8_000_000, 15_000_000, 25_000_000])}
                />
              </div>
            )}

            {/* Total monthly income & Emergency Fund Mode summary card */}
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] p-3.5 space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-indigo-200">
                  {hasPartner
                    ? tx('Tổng thu nhập hộ / tháng', 'Total Household Income / Mo', '世帯の月間総収入')
                    : tx('Tổng thu nhập hàng tháng', 'Total Monthly Income', '毎月の総収入')}
                </span>
                <span className="text-base font-semibold tabular-nums text-white">
                  {totalIncomeMin === totalIncomeMax
                    ? vnd(totalIncomeAvg, lang)
                    : `${compact(totalIncomeMin, lang)} – ${compact(totalIncomeMax, lang)}`}
                </span>
              </div>
              {totalIncomeMin !== totalIncomeMax && (
                <div className="text-[11px] tabular-nums text-zinc-400">
                  {tx('Thấp nhất:', 'Min:', '最小：')} {vnd(totalIncomeMin, lang)} · {tx('Cao nhất:', 'Max:', '最大：')}{' '}
                  {vnd(totalIncomeMax, lang)} · {tx('TB:', 'Avg:', '平均：')} {vnd(totalIncomeAvg, lang)}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[11px] text-zinc-400 tabular-nums">
                <span>
                  {tx('Tỷ lệ gửi:', 'Save rate:', '貯蓄率：')}{' '}
                  <strong className="text-emerald-300">{pct(roadmap.savingsRatePercent, 1, lang)}</strong>
                </span>
                <span>
                  {tx('Dư tự do:', 'Free cash:', '余剰資金：')}{' '}
                  <strong className={householdAnalysis?.freeCashFlow < 0 ? 'text-red-300' : 'text-zinc-200'}>
                    {compact(
                      householdAnalysis?.freeCashFlow ??
                        totalIncomeAvg - monthlyFixedExpense - (householdMode === 'FAMILY' ? monthlyDependentsCost : 0) - (roadmap.requiredMonthlyDeposit || saving),
                      lang
                    )}
                  </strong>
                </span>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] pt-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-zinc-300">
                    {tx('Xử lý Quỹ dự phòng khẩn cấp', 'Emergency Fund Handling', '緊急防衛資金の扱い')}
                  </span>
                </div>
                <Segmented
                  size="sm"
                  value={prioritizeEmergencyFund ? 'FUND_FIRST' : 'PARALLEL'}
                  onChange={(v) => setPrioritizeEmergencyFund(v === 'FUND_FIRST')}
                  options={[
                    { value: 'PARALLEL', label: tx('Theo dõi song song', 'Track in Parallel', '並行トラッキング') },
                    { value: 'FUND_FIRST', label: tx('Lấp quỹ trước', 'Fill EF First', '緊急資金を優先') },
                  ]}
                />
                {inputMode === 'advanced' && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-zinc-500">
                      {tx('Số tháng dự phòng:', 'Target EF months:', '目標備蓄月数：')}
                    </span>
                    {[
                      { v: 0, l: tx('Khuyến nghị', 'Recommended', '推奨値') },
                      { v: 6, l: tx('6T', '6M', '6ヶ月') },
                      { v: 9, l: tx('9T', '9M', '9ヶ月') },
                      { v: 12, l: tx('12T', '12M', '12ヶ月') },
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
                {tx(
                  'Chuyên sâu: Tăng gửi/năm · Thưởng Tết · Bù lạm phát · Chuẩn TT14',
                  'Pro: Step-Up/Yr · Annual Bonus · Inflation Adjust · Circ.14',
                  '詳細：毎年増額・賞与・インフレ補正・通達14号基準'
                )}
              </span>
              <span className="shrink-0 font-medium text-indigo-300">{tx('Mở rộng', 'Expand', '開く')}</span>
            </button>
          ) : (
            <div className="space-y-5 border-t border-white/[0.06] pt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                {tx('Đòn bẩy & Thực tế (Chuyên sâu)', 'Accelerators & Reality (Pro)', '詳細加速設定・インフレ調整')}
              </div>

              {/* Annual step-up */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-zinc-300">
                    {tx('Tăng mức gửi mỗi năm', 'Annual Deposit Step-Up', '毎年の積立増額率')}
                  </label>
                  <DecimalInput
                    value={annualStepUpPct}
                    onChange={(v) => setAnnualStepUpPct(v === '' ? 0 : v)}
                    suffix={tx('%/năm', '%/yr', '%/年')}
                    min={0}
                    max={30}
                    step={1}
                    className="w-28"
                    ariaLabel={tx('Tỷ lệ tăng mức gửi hàng năm', 'Annual deposit step-up rate', '年間積立増額率')}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 5, 10, 15].map((v) => (
                    <Chip key={v} active={Number(annualStepUpPct) === v} onClick={() => setAnnualStepUpPct(v)}>
                      {v === 0 ? tx('Cố định (0%)', 'Flat (0%)', '固定 (0%)') : `+${v}${tx('%/năm', '%/yr', '%/年')}`}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Annual bonus lump sum */}
              <MoneyField
                label={tx('Thưởng / Gửi gộp thêm cuối mỗi năm', 'Annual Bonus / Year-End Top-Up', '年末賞与・毎年一括追加積立')}
                value={annualBonusAmount}
                onChange={setAnnualBonusAmount}
                min={0}
                max={200_000_000}
                step={5_000_000}
                inputMax={5_000_000_000}
                presets={pset([0, 10_000_000, 20_000_000, 50_000_000])}
              />

              {/* Inflation adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-zinc-300">
                    {tx('Bù trượt giá lạm phát', 'Inflation Protection', 'インフレ調整')}
                  </label>
                  <DecimalInput
                    value={inflationRatePct}
                    onChange={(v) => setInflationRatePct(v === '' ? 0 : v)}
                    suffix={tx('%/năm', '%/yr', '%/年')}
                    min={0}
                    max={15}
                    step={0.5}
                    className="w-28"
                    ariaLabel={tx('Bù trượt giá lạm phát hàng năm', 'Annual inflation rate adjustment', '想定インフレ率')}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 3.5, 4.5, 6].map((v) => (
                    <Chip key={v} active={Number(inflationRatePct) === v} onClick={() => setInflationRatePct(v)}>
                      {v === 0 ? tx('Tắt (0%)', 'Off (0%)', 'オフ (0%)') : `${v}${tx('%/năm', '%/yr', '%/年')}`}
                    </Chip>
                  ))}
                </div>
                {effectiveInflation > 0 && roadmap.requiredPrincipal > roadmap.nominalRequiredPrincipal && (
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90 ring-1 ring-inset ring-amber-400/20">
                    {tx('Mục tiêu gốc', 'Base target', '当初目標')}{' '}
                    <strong className="tabular-nums">{compact(roadmap.nominalRequiredPrincipal, lang)}</strong>{' '}
                    {tx('cần nâng lên', 'is adjusted to', 'は購買力維持のため')}{' '}
                    <strong className="tabular-nums">{compact(roadmap.requiredPrincipal, lang)}</strong>{' '}
                    {tx(
                      `để giữ nguyên sức mua sau lạm phát ${pct(effectiveInflation, 1, lang)}/năm.`,
                      `to preserve purchasing power under ${pct(effectiveInflation, 1, lang)}/yr inflation.`,
                      `（年率 ${pct(effectiveInflation, 1, lang)} のインフレ加算後）へ自動調整されます。`
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                  <Pencil className="size-3.5" /> {tx('Hoặc nhập lãi suất khác', 'Or override interest rate', 'カスタム金利を入力')}
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
                    ariaLabel={tx('Lãi suất tuỳ chỉnh', 'Custom rate', 'カスタム金利')}
                  />
                  {usingCustom && (
                    <button
                      onClick={() => setCustomRate('')}
                      aria-label={tx('Bỏ lãi suất tuỳ chỉnh', 'Clear custom rate', 'カスタム金利を解除')}
                      className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-zinc-400">{tx('Cơ sở tính lãi', 'Day-count basis', '金利計算基準')}</span>
                <Segmented
                  size="sm"
                  value={calcMode}
                  onChange={setCalcMode}
                  options={[
                    { value: 'NOMINAL_MONTHS', label: tx('Tháng đều / 12', 'Months / 12', '月割り / 12') },
                    { value: 'ACTUAL_DAYS', label: tx('Chuẩn TT14 (30/365)', 'Circ.14 (30/365)', '通達14号 (30/365)') },
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
                  lang === 'en' ? (
                    <>
                      To accumulate <span className="font-medium text-white">{vnd(roadmap.requiredPrincipal, lang)}</span>
                      {isSavingSolver && (
                        <>
                          {' '}in <span className="font-medium text-white">{targetYears} years</span>
                        </>
                      )}
                      , you need
                    </>
                  ) : lang === 'ja' ? (
                    <>
                      {isSavingSolver && (
                        <>
                          <span className="font-medium text-white">{targetYears}年</span>で{' '}
                        </>
                      )}
                      <span className="font-medium text-white">{vnd(roadmap.requiredPrincipal, lang)}</span>
                      を達成するには
                    </>
                  ) : (
                    <>
                      Để tích luỹ <span className="font-medium text-white">{vnd(roadmap.requiredPrincipal, lang)}</span>
                      {isSavingSolver && (
                        <>
                          {' '}sau <span className="font-medium text-white">{targetYears} năm</span>
                        </>
                      )}
                      , bạn cần
                    </>
                  )
                ) : lang === 'en' ? (
                  <>
                    To earn{' '}
                    <span className="font-medium text-white">{vnd(roadmap.targetMonthlyInterest || target, lang)}</span>{' '}
                    per month
                    {isSavingSolver && (
                      <>
                        {' '}in <span className="font-medium text-white">{targetYears} years</span>
                      </>
                    )}
                    , you need
                  </>
                ) : lang === 'ja' ? (
                  <>
                    {isSavingSolver && (
                      <>
                        <span className="font-medium text-white">{targetYears}年</span>後に{' '}
                      </>
                    )}
                    毎月<span className="font-medium text-white">{vnd(roadmap.targetMonthlyInterest || target, lang)}</span>
                    の利息を得るには
                  </>
                ) : (
                  <>
                    Để nhận{' '}
                    <span className="font-medium text-white">{vnd(roadmap.targetMonthlyInterest || target, lang)}</span> mỗi
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
                  {usingCustom
                    ? tx('Lãi suất tự nhập', 'Custom rate', 'カスタム金利')
                    : `${bank.name} · ${formatTenure(tenure)}`}{' '}
                  · {pct(rate, undefined, lang)}
                </Badge>
                {householdAnalysis && <Badge tone="neutral">{householdAnalysis.modeLabel}</Badge>}
                {roadmap.prioritizeEmergencyFund && (
                  <Badge tone="warning">
                    {tx(
                      `Lấp quỹ DP trước (${roadmap.emergencyFundMonths}T)`,
                      `Fill emergency fund first (${roadmap.emergencyFundMonths}M)`,
                      `緊急資金優先 (${roadmap.emergencyFundMonths}ヶ月)`
                    )}
                  </Badge>
                )}
                {effectiveStepUp > 0 && (
                  <Badge tone="success">
                    {tx(
                      `Tăng gửi +${pct(effectiveStepUp, 0, lang)}/năm`,
                      `Step-up +${pct(effectiveStepUp, 0, lang)}/yr`,
                      `毎年 +${pct(effectiveStepUp, 0, lang)} 増額`
                    )}
                  </Badge>
                )}
                {effectiveBonus > 0 && (
                  <Badge tone="success">
                    {tx(
                      `+${compact(effectiveBonus, lang)} thưởng/năm`,
                      `+${compact(effectiveBonus, lang)} bonus/yr`,
                      `+${compact(effectiveBonus, lang)} ボーナス/年`
                    )}
                  </Badge>
                )}
                {effectiveInflation > 0 && (
                  <Badge tone="warning">
                    {tx(
                      `Đã bù lạm phát ${pct(effectiveInflation, 1, lang)}/năm`,
                      `Inflation-adjusted ${pct(effectiveInflation, 1, lang)}/yr`,
                      `インフレ調整 ${pct(effectiveInflation, 1, lang)}/年`
                    )}
                  </Badge>
                )}
              </div>

              <div className="mt-3 break-words text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl lg:text-5xl">
                {roadmap.isAlreadyReached ? (
                  tx('Đã đạt mục tiêu 🎉', 'Goal already reached 🎉', '目標達成済み 🎉')
                ) : isSavingSolver ? (
                  <>
                    {vnd(roadmap.requiredMonthlyDeposit, lang)}
                    <span className="text-lg font-normal text-zinc-400 sm:text-2xl">
                      {tx(' / tháng', ' / month', ' / 月')}
                    </span>
                  </>
                ) : reachable ? (
                  roadmap.timeText
                ) : (
                  tx('Hơn 60 năm', 'Over 60 years', '60年以上')
                )}
              </div>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                {roadmap.isAlreadyReached
                  ? isTargetAmount
                    ? tx(
                        `Vốn hiện tại (${compact(capital, lang)}) đã vượt mục tiêu và tạo ra ${vnd(
                          roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0,
                          lang
                        )} lãi mỗi tháng.`,
                        `Your current capital (${compact(capital, lang)}) already exceeds the target and generates ${vnd(
                          roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0,
                          lang
                        )}/month in interest.`,
                        `現在の元本（${compact(capital, lang)}）はすでに目標を上回っており、毎月 ${vnd(
                          roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0,
                          lang
                        )} の利息を生んでいます。`
                      )
                    : tx(
                        `Vốn hiện tại đã đủ tạo ra ${vnd(
                          roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0,
                          lang
                        )} lãi mỗi tháng.`,
                        `Your current capital already generates ${vnd(
                          roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0,
                          lang
                        )}/month in interest.`,
                        `現在の元本だけで毎月 ${vnd(
                          roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0,
                          lang
                        )} の利息を達成しています。`
                      )
                  : isSavingSolver
                    ? tx(
                        `Gửi ${compact(roadmap.requiredMonthlyDeposit, lang)} mỗi tháng${
                          effectiveStepUp > 0 ? ` (năm đầu, tăng ${pct(effectiveStepUp, 0, lang)} mỗi năm)` : ''
                        } trong ${targetYears} năm để tích luỹ đủ ${vnd(roadmap.requiredPrincipal, lang)}.`,
                        `Save ${compact(roadmap.requiredMonthlyDeposit, lang)}/month${
                          effectiveStepUp > 0 ? ` (Year 1, growing ${pct(effectiveStepUp, 0, lang)}/yr)` : ''
                        } over ${targetYears} years to accumulate ${vnd(roadmap.requiredPrincipal, lang)}.`,
                        `${targetYears}年間、毎月 ${compact(roadmap.requiredMonthlyDeposit, lang)}${
                          effectiveStepUp > 0 ? `（初年度・毎年 ${pct(effectiveStepUp, 0, lang)} 増額）` : ''
                        } を積み立てて ${vnd(roadmap.requiredPrincipal, lang)} を達成します。`
                      )
                    : reachable
                      ? tx(
                          `Tích luỹ đủ ${vnd(roadmap.requiredPrincipal, lang)} bằng cách gửi ${compact(saving, lang)} mỗi tháng${
                            effectiveStepUp > 0 ? ` (tăng +${pct(effectiveStepUp, 0, lang)}/năm)` : ''
                          } và để lãi tự tái đầu tư.`,
                          `Accumulate ${vnd(roadmap.requiredPrincipal, lang)} by saving ${compact(saving, lang)}/month${
                            effectiveStepUp > 0 ? ` (+${pct(effectiveStepUp, 0, lang)}/yr step-up)` : ''
                          } and reinvesting all interest.`,
                          `毎月 ${compact(saving, lang)}${
                            effectiveStepUp > 0 ? `（毎年 +${pct(effectiveStepUp, 0, lang)} 増額）` : ''
                          } を積み立て、利息を全額再投資して ${vnd(roadmap.requiredPrincipal, lang)} を達成します。`
                        )
                      : tx(
                          'Với mức tiết kiệm hiện tại, mục tiêu quá xa. Hãy tăng số tiền gửi hàng tháng, bật tăng mức gửi hằng năm hoặc giảm mục tiêu.',
                          'At your current saving pace, the goal is too far away. Increase monthly savings, enable annual step-ups, or lower the target.',
                          '現在の積立ペースでは目標まで遠すぎます。毎月の積立額を増やすか、年次増額を有効にするか、目標を下げてください。'
                        )}
              </p>

              <div className="mt-6">
                <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>{tx('Tiến độ hiện tại', 'Current progress', '現在の進捗')}</span>
                  <span className="tabular-nums">
                    {compact(capital, lang)} / {compact(roadmap.requiredPrincipal, lang)}
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
                label={tx('Lãi thụ động khi đạt', 'Passive income at goal', '達成時の不労所得')}
                value={`${compact(roadmap.finalMonthlyPassiveIncome, lang)}${tx('/th', '/mo', '/月')}`}
                hint={tx(
                  `từ vốn ${compact(roadmap.requiredPrincipal, lang)}`,
                  `from ${compact(roadmap.requiredPrincipal, lang)} principal`,
                  `元本 ${compact(roadmap.requiredPrincipal, lang)} から`
                )}
                className="card-interactive"
              />
            ) : (
              <Stat
                icon={Coins}
                label={tx('Số vốn cần có', 'Required principal', '必要元本')}
                value={compact(roadmap.requiredPrincipal, lang)}
                hint={tx(
                  `tại ${pct(rate, undefined, lang)}/năm`,
                  `at ${pct(rate, undefined, lang)}/yr`,
                  `年利 ${pct(rate, undefined, lang)}`
                )}
                className="card-interactive"
              />
            )}

            {isSavingSolver ? (
              <Stat
                icon={Wallet}
                label={tx('Cần gửi / tháng', 'Required / month', '毎月必要積立額')}
                value={compact(roadmap.requiredMonthlyDeposit, lang)}
                hint={tx(
                  `tổng vốn tự gửi ${compact(roadmap.totalDeposited, lang)}`,
                  `total principal ${compact(roadmap.totalDeposited, lang)}`,
                  `積立元本計 ${compact(roadmap.totalDeposited, lang)}`
                )}
                className="card-interactive"
              />
            ) : (
              <Stat
                icon={Wallet}
                label={tx('Tổng tiền bạn gửi', 'Total contributed', '積立元本合計')}
                value={reachable ? compact(roadmap.totalDeposited, lang) : '—'}
                hint={tx('vốn + tiền gửi + thưởng', 'capital + deposits + bonus', '初期資金＋積立＋ボーナス')}
                className="card-interactive"
              />
            )}

            <Stat
              icon={PiggyBank}
              label={tx('Lãi kép đóng góp', 'Compound interest', '複利収益')}
              tone="emerald"
              value={reachable ? compact(roadmap.totalCompoundInterest, lang) : '—'}
              hint={
                reachable
                  ? tx(
                      `${pct(roadmap.compoundSharePct, 1, lang)} tổng tài sản`,
                      `${pct(roadmap.compoundSharePct, 1, lang)} of total`,
                      `総資産の ${pct(roadmap.compoundSharePct, 1, lang)}`
                    )
                  : undefined
              }
              className="card-interactive"
            />
            <Stat
              icon={Gauge}
              label={tx('Độ khả thi', 'Feasibility score', '実現可能性')}
              tone={scoreTone}
              value={`${feasibility.score}/100`}
              hint={feasibility.ratingLabel}
              className="card-interactive"
            />
          </div>

          {/* Insights right below Stats */}
          {(feasibility.strengths.length > 0 || feasibility.warnings.length > 0) && (
            <Card className="p-5 sm:p-6">
              <CardHeader title={tx('Nhận xét về kế hoạch', 'Plan assessment', 'プラン評価')} />
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
                  ? tx('Tài sản tăng trưởng theo thời gian', 'Wealth growth over time', '資産推移シミュレーション')
                  : isSavingSolver
                    ? tx(
                        'Ngân hàng nào cần gửi hàng tháng ít nhất?',
                        'Which bank requires the lowest monthly saving?',
                        '毎月の積立額が最も少ない銀行は？'
                      )
                    : tx(
                        'Về đích nhanh nhất với ngân hàng nào?',
                        'Which bank reaches your goal fastest?',
                        '最短で目標に到達する銀行は？'
                      )
              }
              description={
                view === 'growth'
                  ? tx(
                      'Khoảng cách giữa hai đường là phần lãi kép ngân hàng trả cho bạn.',
                      'The gap between the two curves is the compound interest paid by the bank.',
                      '2本の線の差額が銀行から得られる複利利息です。'
                    )
                  : tx(
                      'Mỗi ngân hàng tính ở kỳ hạn có lãi suất cao nhất.',
                      'Each bank uses its highest-yield tenure.',
                      '各銀行の最高金利の預入期間で計算しています。'
                    )
              }
              right={
                <Segmented
                  size="sm"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'growth', label: tx('Tăng trưởng', 'Growth chart', '資産推移') },
                    { value: 'banks', label: tx('So sánh ngân hàng', 'Compare banks', '銀行比較') },
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
                      {tx(
                        'Nhập số tiền gửi hàng tháng để xem biểu đồ',
                        'Enter a monthly saving amount to view the chart',
                        'グラフを表示するには毎月の積立額を入力してください'
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-4 rounded bg-indigo-400" /> {tx('Tổng tài sản', 'Total wealth', '総資産')}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-4 border-t border-dashed border-zinc-400" /> {tx('Tiền bạn gửi', 'Your deposits', '積立元本')}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-4 border-t border-dotted border-emerald-400" /> {tx('Mục tiêu', 'Goal target', '目標額')}
                  </span>
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
                            {b.name}{' '}
                            <span className="font-normal text-zinc-500">
                              · {formatTenure(t)} · {pct(r, undefined, lang)}
                            </span>
                          </span>
                          <span className={cx('shrink-0 font-semibold tabular-nums', i === 0 ? 'text-emerald-300' : 'text-white')}>
                            {isSavingSolver
                              ? `${compact(res.requiredMonthlyDeposit, lang)}${tx('/th', '/mo', '/月')}`
                              : res.monthsNeeded >= 720
                                ? tx('> 60 năm', '> 60 yrs', '60年超')
                                : duration(res.monthsNeeded, lang)}
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
              title={
                isSavingSolver
                  ? tx('Cách giảm số tiền cần gửi mỗi tháng', 'Ways to reduce monthly saving', '毎月の積立額を減らす方法')
                  : tx('Cách để về đích sớm hơn', 'Ways to reach your goal sooner', '目標を早める方法')
              }
              description={tx('So với kế hoạch hiện tại của bạn.', 'Compared to your current baseline plan.', '現在のプランとの比較。')}
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
                        ? `${compact(s.r.requiredMonthlyDeposit || 0, lang)}${tx('/tháng', '/month', '/月')}`
                        : s.r.monthsNeeded >= 720
                          ? tx('> 60 năm', '> 60 yrs', '60年超')
                          : s.r.timeText}
                    </div>
                    {isSavingSolver
                      ? savedMonthly > 0 && (
                          <div className="mt-1 text-xs font-medium text-emerald-300">
                            {tx(
                              `Giảm ${compact(savedMonthly, lang)}/tháng`,
                              `Save ${compact(savedMonthly, lang)}/month`,
                              `毎月 ${compact(savedMonthly, lang)} 節約`
                            )}
                          </div>
                        )
                      : saved > 0 && (
                          <div className="mt-1 text-xs font-medium text-emerald-300">
                            {tx(
                              `Nhanh hơn ${duration(saved, lang)}`,
                              `${duration(saved, lang)} faster`,
                              `${duration(saved, lang)} 短縮`
                            )}
                          </div>
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
            toolLabel={
              isTargetAmount
                ? tx('Kế hoạch tích luỹ số tiền mục tiêu', 'Target capital saving plan', '目標資産積立プラン')
                : tx('Kế hoạch thu nhập thụ động', 'Passive income saving plan', '不労所得積立プラン')
            }
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
      <Modal
        open={gdocsOpen}
        onClose={() => setGdocsOpen(false)}
        title={tx('Liên kết & xuất sang Google Docs', 'Connect & export to Google Docs', 'Googleドキュメントに連携・出力')}
      >
        <div className="space-y-4">
          <Callout icon={FileText} tone="brand">
            {lang === 'en' ? (
              <>
                Report includes full plan parameters, feasibility score, acceleration scenarios, and yearly schedule —
                formatted cleanly to paste directly into Google Docs or download as a{' '}
                <code className="text-indigo-200">.doc</code> file.
              </>
            ) : lang === 'ja' ? (
              <>
                プラン条件、実現可能性スコア、加速シナリオ、年次スケジュールが含まれており、Googleドキュメントへの貼り付けや{' '}
                <code className="text-indigo-200">.doc</code> ファイル保存に対応しています。
              </>
            ) : (
              <>
                Báo cáo bao gồm đầy đủ thông số kế hoạch, điểm khả thi, kịch bản tăng tốc và bảng lộ trình theo năm — được
                định dạng sẵn để dán trực tiếp vào Google Docs hoặc tải file{' '}
                <code className="text-indigo-200">.doc</code>.
              </>
            )}
          </Callout>
          <div className="space-y-2.5">
            <Button variant="primary" className="w-full" onClick={handleOpenGoogleDocs}>
              <ExternalLink className="size-4" />{' '}
              {tx(
                'Chép báo cáo & Mở Google Docs (docs.new)',
                'Copy report & Open Google Docs (docs.new)',
                'コピーして Googleドキュメントを開く (docs.new)'
              )}
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleCopyForGoogleDocs}>
              <Copy className="size-4" />{' '}
              {tx(
                'Chỉ sao chép nội dung báo cáo (Ctrl+V)',
                'Copy report content only (Ctrl+V)',
                'レポート内容のみコピー (Ctrl+V)'
              )}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                downloadGoogleDocsFile(reportPayload);
                notify(
                  tx(
                    'Đã tải file .DOC tương thích Google Docs & Word',
                    'Downloaded .DOC file compatible with Google Docs & Word',
                    'Googleドキュメント・Word用 .DOC ファイルを保存しました'
                  )
                );
              }}
            >
              <Download className="size-4" />{' '}
              {tx(
                'Tải file .DOC (Upload lên Google Drive / Word)',
                'Download .DOC file (Upload to Google Drive / Word)',
                '.DOC ファイルをダウンロード (Drive / Word)'
              )}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            {lang === 'en' ? (
              <>
                Tip: Once the new Google Docs tab opens, press <strong className="text-zinc-300">Ctrl + V</strong> (or{' '}
                <strong className="text-zinc-300">Cmd + V</strong> on Mac) to insert the formatted report and tables.
              </>
            ) : lang === 'ja' ? (
              <>
                ヒント：新しい Googleドキュメントが開いたら、<strong className="text-zinc-300">Ctrl + V</strong>（Macは{' '}
                <strong className="text-zinc-300">Cmd + V</strong>）で整形済みレポートと表を貼り付けられます。
              </>
            ) : (
              <>
                Mẹo: Khi trang Google Docs mới mở ra, bạn chỉ cần nhấn <strong className="text-zinc-300">Ctrl + V</strong>{' '}
                (hoặc <strong className="text-zinc-300">Cmd + V</strong> trên Mac) để chèn toàn bộ tiêu đề và bảng số liệu
                vừa tính.
              </>
            )}
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
              {isSavingSolver
                ? tx(
                    `Cần gửi / tháng (${targetYears} năm)`,
                    `Save / month (${targetYears} yrs)`,
                    `毎月積立 (${targetYears}年)`
                  )
                : tx(
                    `Đích đến (${pct(rate, undefined, lang)}/năm)`,
                    `Goal (${pct(rate, undefined, lang)}/yr)`,
                    `目標 (年利 ${pct(rate, undefined, lang)})`
                  )}
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-white">
              {roadmap.isAlreadyReached
                ? tx('Đã đạt mục tiêu', 'Goal reached', '目標達成済み')
                : isSavingSolver
                  ? `${compact(roadmap.requiredMonthlyDeposit, lang)}${tx('/th', '/mo', '/月')}`
                  : reachable
                    ? roadmap.timeText
                    : tx('> 60 năm', '> 60 yrs', '60年超')}{' '}
              · <span className="text-emerald-300">{compact(roadmap.requiredPrincipal, lang)}</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-200">
            {tx('Kết quả', 'Results', '結果')} <ArrowDown className="size-3" />
          </span>
        </button>
      </div>
    </>
  );
}
