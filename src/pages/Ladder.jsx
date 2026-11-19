import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coins,
  Layers,
  Package,
  PiggyBank,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  Wallet,
} from 'lucide-react';
import { useRates } from '../state.jsx';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { syncUserPrefCookie } from '../utils/cookieManager.js';
import { HOUSEHOLD_MODES, HouseholdModeSwitch } from '../components/HouseholdModeSwitch.jsx';
import { chip, compact, fmt, pct, vnd } from '../utils/format.js';
import {
  Badge,
  Card,
  CardHeader,
  Chip,
  MoneyField,
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
import { BankPicker } from '../components/BankPicker.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';

const STRATEGIES = [
  {
    id: 'ROLLING_1M',
    title: '100% kỳ hạn 1 tháng (xoay vòng)',
    desc: 'Toàn bộ tiền gửi vào kỳ hạn 1 tháng và tự động tái tục. Thanh khoản cao nhất.',
    split: '100% gói 1T',
  },
  {
    id: 'SPLIT_50_50',
    title: 'Bậc thang 50% (1T) + 50% (3T)',
    desc: 'Chia đôi khoản tiết kiệm hàng tháng vào kỳ hạn 1 tháng và 3 tháng để cân bằng lãi suất & thanh khoản.',
    split: '50% 1T · 50% 3T',
  },
  {
    id: 'TNEX_PROMO_30_70',
    title: 'Tối ưu lãi suất 30% (1T) + 70% (6T)',
    desc: 'Giữ 30% ở kỳ hạn 1 tháng dự phòng khẩn cấp, 70% đưa vào kỳ hạn 6 tháng để hưởng lãi suất cao.',
    split: '30% 1T · 70% 6T',
  },
  {
    id: 'CUSTOM',
    title: 'Tuỳ chỉnh tỷ lệ 2 kỳ hạn',
    desc: 'Tự chọn 2 kỳ hạn và tỷ lệ phần trăm phân bổ theo nhu cầu thanh khoản cá nhân.',
    split: 'Tuỳ chỉnh',
  },
];

const CUSTOM_TERMS = ['1M', '3M', '6M', '9M', '12M'];
const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v) }));

const INITIAL_LADDER_DATA = {
  timelineRows: [],
  finalPortfolioValue: 0,
  finalMonthlyYield: 0,
};

const COHORT_TONES = {
  emerald: { bar: 'bg-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-400/20' },
  indigo: { bar: 'bg-indigo-400', dot: 'bg-indigo-400', border: 'border-indigo-400/20' },
  sky: { bar: 'bg-sky-400', dot: 'bg-sky-400', border: 'border-sky-400/20' },
  amber: { bar: 'bg-amber-400', dot: 'bg-amber-400', border: 'border-amber-400/20' },
};

function LadderStageDetails({ row, granularity }) {
  const [termFilter, setTermFilter] = useState('all');
  if (!row) return null;

  const cohorts = row.cohorts || [];
  const packages = row.packages || [];
  const validFilter = termFilter === 'all' || cohorts.some((c) => c.term === termFilter) ? termFilter : 'all';
  const filteredPackages = validFilter === 'all' ? packages : packages.filter((p) => p.term === validFilter);

  if (granularity === 'cohorts') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {cohorts.map((cohort) => {
          const st = COHORT_TONES[cohort.tone] || COHORT_TONES.emerald;
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
                    <Badge tone="neutral">{cohort.packageCount} sổ</Badge>
                    <Badge tone={cohort.rolledPackages > 0 ? 'brand' : 'neutral'}>
                      {cohort.rolledPackages > 0 ? `${cohort.rolledPackages} đã tái tục` : 'Kỳ đầu'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">Lãi suất áp dụng: {pct(cohort.rate)}/năm</div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">Tổng vốn hiện tại</div>
                    <div className="mt-0.5 font-semibold text-white">{vnd(cohort.totalCurrentBalance)}</div>
                  </div>
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">Lãi đã gộp thêm</div>
                    <div className="mt-0.5 font-medium text-emerald-300">+{vnd(cohort.totalAccumulatedInterest)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-xs tabular-nums ring-1 ring-inset ring-emerald-400/20">
                <div className="text-emerald-200">
                  {cohort.packageCount > 1 && (
                    <span className="mr-1.5 text-[11px] text-emerald-300/80">
                      TB mỗi sổ +{compact(cohort.perPackageMonthlyInterest)}/th ·
                    </span>
                  )}
                  <strong className="font-semibold text-emerald-300">+{vnd(cohort.totalMonthlyInterest)}/tháng</strong>
                </div>
                <span className="font-semibold text-emerald-300">{pct(cohort.sharePct, 1)}</span>
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
        <Chip active={validFilter === 'all'} onClick={() => setTermFilter('all')}>
          Tất cả ({row.packagesTotalCount || packages.length} sổ)
        </Chip>
        {cohorts.map((c) => (
          <Chip key={c.term} active={validFilter === c.term} onClick={() => setTermFilter(c.term)}>
            {c.label} ({c.packageCount})
          </Chip>
        ))}
      </div>

      <div className="grid max-h-[420px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex flex-col justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs tabular-nums"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-white">{pkg.name}</span>
                <Badge tone={pkg.rolloverCount > 0 ? 'brand' : 'neutral'}>
                  {pkg.rolloverCount > 0 ? `Xoay vòng ${pkg.rolloverCount}` : `Đáo hạn T${pkg.maturityMonth}`}
                </Badge>
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                <span>Kỳ hạn {pkg.term.replace('M', ' tháng')} · {pct(pkg.rate)}</span>
                <span>Mở T{pkg.startMonth}</span>
              </div>
              <div className="mt-2.5 space-y-1 border-t border-white/[0.05] pt-2 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Số dư sổ:</span>
                  <span className="font-medium text-white">{vnd(pkg.currentAmount)}</span>
                </div>
                {pkg.accumulatedInterest > 0 && (
                  <div className="flex justify-between text-emerald-300/80">
                    <span>Lãi nhập gốc:</span>
                    <span>+{vnd(pkg.accumulatedInterest)}</span>
                  </div>
                )}
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

function LadderPackageExplorer({ rows, splitLabel }) {
  const [explorerView, setExplorerView] = useState('shelf'); // 'shelf' | 'matrix'
  const [granularity, setGranularity] = useState('cohorts'); // 'cohorts' | 'individual'
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(null);
  const [expandedMonthIdx, setExpandedMonthIdx] = useState(null);

  const stageMilestones = useMemo(() => {
    if (!rows.length) return [];
    const lastIdx = rows[rows.length - 1].monthIndex;
    const picks = new Set([1, 3, 6, 12, 18, 24, 36, 48, lastIdx]);
    return rows.filter((r) => picks.has(r.monthIndex));
  }, [rows]);

  const defaultMonthIdx = useMemo(() => {
    if (!rows.length) return 1;
    const m6 = rows.find((r) => r.monthIndex === 6);
    return m6 ? 6 : rows[rows.length - 1].monthIndex;
  }, [rows]);

  const activeRow =
    rows.find((r) => r.monthIndex === selectedMonthIdx) ||
    rows.find((r) => r.monthIndex === defaultMonthIdx) ||
    rows[rows.length - 1];

  const activeExpandedIdx = expandedMonthIdx !== null ? expandedMonthIdx : rows[rows.length - 1]?.monthIndex;

  if (!rows.length) return null;

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        title="Chi tiết lộ trình & Kệ sổ bậc thang"
        description={`Kiểm tra ở từng tháng bạn đang nắm giữ bao nhiêu sổ (${splitLabel}) và từng nhóm kỳ hạn sinh lời ra sao.`}
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
                { value: 'cohorts', label: 'Gộp theo kỳ hạn' },
                { value: 'individual', label: 'Từng sổ lẻ' },
              ]}
            />
          </div>
        }
      />

      {explorerView === 'shelf' && activeRow ? (
        <div className="mt-5 space-y-5">
          {/* Timeline stage pills */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {stageMilestones.map((r) => {
              const active = r.monthIndex === activeRow.monthIndex;
              const isLast = r.monthIndex === rows[rows.length - 1].monthIndex;
              return (
                <button
                  key={r.monthIndex}
                  type="button"
                  onClick={() => setSelectedMonthIdx(r.monthIndex)}
                  className={cx(
                    'flex shrink-0 flex-col items-start gap-1 rounded-xl border px-3.5 py-2.5 text-left transition-all',
                    active
                      ? 'border-indigo-400/50 bg-indigo-500/15 shadow-sm'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cx('text-xs font-semibold', active ? 'text-white' : 'text-zinc-300')}>
                      {r.month} {isLast ? '🎯' : ''}
                    </span>
                    <Badge tone={active ? 'brand' : 'neutral'}>{r.activePackagesCount} sổ</Badge>
                  </div>
                  <div className="text-[11px] tabular-nums text-zinc-400">
                    +{compact(r.estimatedMonthlyYield)}/th · {compact(r.totalPortfolioValue)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stage summary + Stacked Contribution Bar */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Package className="size-4 text-indigo-300" />
                Danh mục tại {activeRow.month}
              </div>
              <span className="text-xs text-zinc-400 tabular-nums">{activeRow.activePackagesCount} sổ đang chạy</span>
            </div>

            {activeRow.cohorts?.length > 0 && activeRow.estimatedMonthlyYield > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Tỷ trọng tiền lãi theo kỳ hạn bậc thang</span>
                  <span className="tabular-nums">Tổng +{vnd(activeRow.estimatedMonthlyYield)}/tháng</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  {activeRow.cohorts.map((c) => {
                    const st = COHORT_TONES[c.tone] || COHORT_TONES.emerald;
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
                  {activeRow.cohorts.map((c) => {
                    const st = COHORT_TONES[c.tone] || COHORT_TONES.emerald;
                    return (
                      <span key={c.key} className="flex items-center gap-1.5">
                        <span className={cx('size-2 rounded-full', st.dot)} />
                        {c.label} ({pct(c.sharePct, 1)})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <LadderStageDetails row={activeRow} granularity={granularity} />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="text-xs text-zinc-500">
            Nhấn vào từng dòng tháng để mở danh sách chi tiết các sổ bậc thang đang sinh lời tại tháng đó.
          </div>
          <Table
            className="max-h-[540px]"
            head={[
              'Tháng',
              'Gửi thêm',
              'Sổ đang chạy',
              'Vốn đáo hạn',
              'Lãi đáo hạn',
              'Tổng danh mục',
              'Lãi / tháng',
            ]}
          >
            {rows.map((row) => {
              const isExpanded = activeExpandedIdx === row.monthIndex;
              return (
                <React.Fragment key={row.monthIndex}>
                  <tr
                    onClick={() => setExpandedMonthIdx(isExpanded ? -1 : row.monthIndex)}
                    className={cx(
                      'cursor-pointer transition-colors hover:bg-white/[0.03]',
                      isExpanded && 'bg-white/[0.04]'
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                      <span className="inline-flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 text-indigo-300" />
                        ) : (
                          <ChevronRight className="size-3.5 text-zinc-500" />
                        )}
                        {row.month}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.monthlyContribution)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={isExpanded ? 'brand' : 'neutral'}>{row.activePackagesCount} sổ</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {row.totalMaturedThisMonth > 0 ? fmt(row.totalMaturedThisMonth) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-300">
                      {row.totalInterestMaturedThisMonth > 0 ? `+${fmt(row.totalInterestMaturedThisMonth)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(row.totalPortfolioValue)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">+{fmt(row.estimatedMonthlyYield)}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-black/25">
                      <td colSpan={7} className="p-4">
                        <LadderStageDetails row={row} granularity={granularity} />
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

export default function Ladder() {
  const { banks, getRate } = useRates();
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const [monthlySavings, setMonthlySavings] = useState(() => Number(saved.saving) || 5_000_000);
  const [householdMode, setHouseholdMode] = useState(() =>
    ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(saved.householdMode) ? saved.householdMode : 'INDIVIDUAL'
  );
  const [dependentsCount] = useState(() => Number(saved.dependentsCount) || 0);
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    const fixed = Number(saved.monthlyFixedExpense) || (saved.householdMode === 'COUPLE' || saved.householdMode === 'FAMILY' ? 18_000_000 : 12_000_000);
    const dep = saved.householdMode === 'FAMILY' ? Number(saved.monthlyDependentsCost) || 0 : 0;
    return fixed + dep;
  });
  const [totalMonths, setTotalMonths] = useState(12);
  const [bankId, setBankId] = useState(() => saved.bankId || 'cake');
  const [strategy, setStrategy] = useState('SPLIT_50_50');
  const [inputMode, setInputMode] = useState(() => saved.inputMode || 'basic');
  const [shortTerm, setShortTerm] = useState('1M');
  const [longTerm, setLongTerm] = useState('12M');
  const [shortPct, setShortPct] = useState(40);

  useEffect(() => {
    syncUserPrefCookie({ bankId, inputMode });
  }, [bankId, inputMode]);

  const bank = banks.find((b) => b.id === bankId) || banks[0];

  const bankRates = useMemo(() => {
    const map = {};
    Object.keys(bank.rates).forEach((k) => {
      map[k] = getRate(bank, k);
    });
    return map;
  }, [bank, getRate]);

  const customAllocations = useMemo(
    () => [
      { term: shortTerm, percent: shortPct, rate: bankRates[shortTerm] || 4.75 },
      { term: longTerm, percent: 100 - shortPct, rate: bankRates[longTerm] || 6.9 },
    ],
    [shortTerm, longTerm, shortPct, bankRates]
  );

  const ladderPayload = useMemo(
    () => ({
      monthlySavings,
      strategy,
      customAllocations,
      totalMonths,
      bankRates,
    }),
    [monthlySavings, strategy, customAllocations, totalMonths, bankRates]
  );

  const { data: result, loading, initialized } = useServerCalc('ladder', ladderPayload, INITIAL_LADDER_DATA);

  const totalDeposited = monthlySavings * totalMonths;
  const totalInterest = Math.max(0, result.finalPortfolioValue - totalDeposited);
  const lastRow = result.timelineRows[result.timelineRows.length - 1];
  const activeStrategy = STRATEGIES.find((s) => s.id === strategy) || STRATEGIES[0];
  const splitLabel =
    strategy === 'CUSTOM'
      ? `${shortPct}% ${shortTerm.replace('M', 'T')} · ${100 - shortPct}% ${longTerm.replace('M', 'T')}`
      : activeStrategy.split;
  const principalRatio = result.finalPortfolioValue > 0 ? (totalDeposited / result.finalPortfolioValue) * 100 : 0;

  const hhMeta = HOUSEHOLD_MODES.find((m) => m.id === householdMode) || HOUSEHOLD_MODES[0];
  const hasPartner = householdMode === 'COUPLE' || householdMode === 'FAMILY';
  const recMonths =
    householdMode === 'FAMILY'
      ? Math.min(12, 6 + Math.round(dependentsCount * 1.5))
      : householdMode === 'COUPLE'
        ? 6
        : 4;
  const recommendedLiquidTarget = monthlyExpense * recMonths;
  const liquidCohortsValue = (lastRow?.cohorts || [])
    .filter((c) => c.term === '1M' || c.term === '3M')
    .reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0);
  const liquidCoveragePct =
    recommendedLiquidTarget > 0 ? Math.min(100, Number(((liquidCohortsValue / recommendedLiquidTarget) * 100).toFixed(1))) : 100;

  const e1SharePct = (() => {
    if (!hasPartner) return 100;
    if (saved.contributionRule === 'SPLIT_50_50') return 50;
    if (saved.contributionRule === 'CUSTOM') return Number(saved.earner1SharePct) || 50;
    const e1 = Number(saved.salaryFullTime) || 25_000_000;
    const e2 = Number(saved.partnerSalaryFullTime) || 20_000_000;
    return e1 + e2 > 0 ? Number(((e1 / (e1 + e2)) * 100).toFixed(1)) : 50;
  })();
  const e1MonthlyLadder = Math.round((monthlySavings * e1SharePct) / 100);
  const e2MonthlyLadder = Math.max(0, monthlySavings - e1MonthlyLadder);

  return (
    <>
      <PageHeader
        icon={Layers}
        eyebrow="Chiến lược bậc thang"
        title="Tiết kiệm bậc thang (Savings Ladder)"
        description="Thay vì dồn hết tiền vào một sổ dài hạn dễ mất lãi khi cần rút gấp, hãy chia nhỏ khoản gửi hàng tháng vào nhiều kỳ hạn xoay vòng."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ── Left Inputs (Unified with Planner UI) ── */}
        <Card className="space-y-5 p-5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <SlidersHorizontal className="size-3.5 text-indigo-300" /> Phiên bản nhập liệu
              </span>
              <Segmented
                size="sm"
                value={inputMode}
                onChange={(mode) => {
                  setInputMode(mode);
                  if (mode === 'basic' && strategy === 'CUSTOM') {
                    setStrategy('SPLIT_50_50');
                  }
                }}
                options={[
                  { value: 'basic', label: 'Cơ bản' },
                  { value: 'advanced', label: 'Chuyên sâu' },
                ]}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {inputMode === 'basic'
                ? 'Phiên bản Cơ bản (Nhanh): chọn mức gửi hàng tháng và 1 trong 3 công thức bậc thang chuẩn.'
                : 'Phiên bản Chuyên sâu (Thực tế): kéo dài mô phỏng tới 60 tháng & tự tuỳ chỉnh tỷ lệ 2 kỳ hạn.'}
            </p>
            <div className="pt-2">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Hồ sơ thanh khoản
              </span>
              <HouseholdModeSwitch value={householdMode} onChange={setHouseholdMode} compact />
            </div>
          </div>

          <div className="space-y-4">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              1. Khoản gửi &amp; Thời gian
            </span>
            <MoneyField
              label="Số tiền gửi mới mỗi tháng"
              value={monthlySavings}
              onChange={setMonthlySavings}
              min={500_000}
              max={50_000_000}
              step={500_000}
              inputMax={500_000_000}
              presets={presets([1_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000])}
            />

            <MoneyField
              label="Chi tiêu sinh hoạt / tháng (đo quỹ dự phòng)"
              value={monthlyExpense}
              onChange={setMonthlyExpense}
              min={0}
              max={150_000_000}
              step={1_000_000}
              inputMax={500_000_000}
              presets={presets([10_000_000, 15_000_000, 20_000_000, 30_000_000])}
            />

            {inputMode === 'advanced' && (
              <SliderField
                label="Thời gian mô phỏng"
                display={`${totalMonths} tháng (${(totalMonths / 12).toFixed(1)} năm)`}
                value={totalMonths}
                onChange={setTotalMonths}
                min={6}
                max={60}
                step={3}
              />
            )}
          </div>

          <div className="space-y-3 border-t border-white/[0.06] pt-5">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              2. Ngân hàng áp dụng
            </span>
            <BankPicker bankId={bankId} onBank={setBankId} tenure="6M" label="Chọn ngân hàng áp dụng lãi suất" />
          </div>

          <div className="space-y-2.5 border-t border-white/[0.06] pt-5">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              3. Chiến lược phân bổ bậc thang
            </span>
            {STRATEGIES.filter((s) => inputMode === 'advanced' || s.id !== 'CUSTOM').map((s) => {
              const active = strategy === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategy(s.id)}
                  className={cx(
                    'w-full rounded-xl p-3.5 text-left ring-1 ring-inset transition-all',
                    active
                      ? 'bg-indigo-500/10 ring-indigo-400/40'
                      : 'bg-white/[0.02] ring-white/[0.07] hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white">{s.title}</span>
                    <Badge tone={active ? 'brand' : 'neutral'}>{s.split}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{s.desc}</p>
                </button>
              );
            })}

            {inputMode === 'basic' && (
              <button
                type="button"
                onClick={() => setInputMode('advanced')}
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3.5 py-2.5 text-left text-xs text-zinc-400 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.05] hover:text-zinc-200"
              >
                <span>Chuyên sâu: Thời gian {totalMonths} tháng &amp; Tuỳ chỉnh % kỳ hạn</span>
                <span className="shrink-0 font-medium text-indigo-300">Mở rộng</span>
              </button>
            )}

            {inputMode === 'advanced' && strategy === 'CUSTOM' && (
              <div className="mt-3 space-y-4 rounded-xl bg-black/25 p-4 ring-1 ring-inset ring-white/[0.08]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Gói ngắn hạn (Thanh khoản)</label>
                    <div className="flex flex-wrap gap-1">
                      {CUSTOM_TERMS.slice(0, 3).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setShortTerm(t)}
                          className={cx(
                            'rounded-lg px-2.5 py-1 text-xs font-medium',
                            shortTerm === t ? 'bg-indigo-500 text-white' : 'bg-white/[0.05] text-zinc-400 hover:text-white'
                          )}
                        >
                          {t.replace('M', 'T')} ({pct(bankRates[t])})
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Gói dài hạn (Lãi cao)</label>
                    <div className="flex flex-wrap gap-1">
                      {CUSTOM_TERMS.slice(1).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setLongTerm(t)}
                          className={cx(
                            'rounded-lg px-2.5 py-1 text-xs font-medium',
                            longTerm === t ? 'bg-emerald-500 text-white' : 'bg-white/[0.05] text-zinc-400 hover:text-white'
                          )}
                        >
                          {t.replace('M', 'T')} ({pct(bankRates[t])})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <SliderField
                  label="Tỷ lệ phân bổ"
                  display={splitLabel}
                  value={shortPct}
                  onChange={setShortPct}
                  min={10}
                  max={90}
                  step={10}
                />
              </div>
            )}
          </div>
        </Card>

        {/* ── Results ── */}
        <div id="ladder-results" className="min-w-0 space-y-5">
          {!initialized && loading ? (
            <ResultsSkeleton />
          ) : (
            <div className={cx('space-y-5 animate-fade transition-opacity', loading && 'opacity-80')}>
              {loading && <div className="loading-bar rounded-full" />}

              {/* Headline Card */}
              <Card className="relative overflow-hidden p-5 sm:p-7">
                <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-indigo-500/15 blur-3xl" />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
                    Sau <span className="font-medium text-white">{totalMonths} tháng</span> gửi đều{' '}
                    <span className="font-medium text-white">{compact(monthlySavings)}/tháng</span>, danh mục bậc thang
                    của bạn đạt
                    <Badge tone="brand">
                      {bank.name} · {splitLabel}
                    </Badge>
                  </div>
                  <div className="mt-3 break-words text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl lg:text-5xl">
                    {vnd(result.finalPortfolioValue)}
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                    Với <strong className="text-white">{lastRow?.activePackagesCount || 0} sổ</strong> đang xoay vòng liên
                    tục, danh mục tự tạo ra dòng lãi ước tính{' '}
                    <strong className="text-emerald-300">+{vnd(result.finalMonthlyYield)}/tháng</strong> và đã gộp{' '}
                    <strong className="text-indigo-300">+{vnd(totalInterest)}</strong> tiền lãi đáo hạn.
                  </p>
                  <div className="mt-6">
                    <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>Tỷ trọng gốc đã nộp / tổng danh mục cuối kỳ</span>
                      <span className="tabular-nums">
                        {compact(totalDeposited)} / {compact(result.finalPortfolioValue)}
                      </span>
                    </div>
                    <Progress value={principalRatio} />
                  </div>
                </div>
              </Card>

              {/* 4 KPI Stats */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Stat
                  icon={Coins}
                  label="Tổng danh mục cuối kỳ"
                  value={compact(result.finalPortfolioValue)}
                  hint={vnd(result.finalPortfolioValue)}
                  className="card-interactive"
                />
                <Stat
                  icon={Wallet}
                  label="Tổng gốc đã nộp"
                  value={compact(totalDeposited)}
                  hint={`${totalMonths} tháng × ${compact(monthlySavings)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={PiggyBank}
                  label="Lãi thụ động / tháng"
                  tone="emerald"
                  value={`+${compact(result.finalMonthlyYield)}`}
                  hint={`Lãi đã gộp: +${compact(totalInterest)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={Package}
                  label="Sổ đang xoay vòng"
                  tone="indigo"
                  value={`${lastRow?.activePackagesCount || 0} sổ`}
                  hint={splitLabel}
                  className="card-interactive"
                />
              </div>

              {/* Household Emergency Liquidity Card */}
              <Card className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    {liquidCoveragePct >= 100 ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="size-4 text-amber-400" />
                    )}
                    Thanh khoản dự phòng ({hhMeta.label} · {recMonths} tháng chi phí)
                  </span>
                  <Badge tone={liquidCoveragePct >= 100 ? 'success' : 'warning'}>
                    Lớp 1T–3T đạt {pct(liquidCoveragePct, 0)}
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs tabular-nums text-zinc-400">
                    <span>Sổ linh hoạt (1T–3T) cuối kỳ: {vnd(liquidCohortsValue)}</span>
                    <span>Mục tiêu dự phòng {recMonths}T: {vnd(recommendedLiquidTarget)}</span>
                  </div>
                  <Progress value={liquidCoveragePct} />
                </div>

                {hasPartner && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-xs tabular-nums text-zinc-300 ring-1 ring-inset ring-white/[0.06]">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Users className="size-3.5 text-indigo-300" /> Góp bậc thang mỗi tháng:
                    </span>
                    <span>
                      Người 1: <strong className="text-white">{vnd(e1MonthlyLadder)}</strong> ({pct(e1SharePct, 0)}) · Người 2:{' '}
                      <strong className="text-white">{vnd(e2MonthlyLadder)}</strong> ({pct(100 - e1SharePct, 0)})
                    </span>
                  </div>
                )}
              </Card>

              {/* Option 4 Ladder Stage Shelf & Expandable Matrix */}
              <LadderPackageExplorer rows={result.timelineRows} splitLabel={splitLabel} />

              <RateDisclaimer />

              <FeedbackWidget
                toolId="ladder"
                toolLabel="Tiết kiệm bậc thang"
                snapshot={{ monthlySavings, totalMonths, bankId, strategy, finalValue: result.finalPortfolioValue }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile / Tablet sticky live summary bar */}
      <div className="print-hidden fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 md:inset-x-auto md:bottom-4 md:left-1/2 md:w-full md:max-w-xl md:-translate-x-1/2 md:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => document.getElementById('ladder-results')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-400/25 bg-elevated/95 px-4 py-2.5 text-left shadow-2xl backdrop-blur"
        >
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-400">
              {bank.name} · {lastRow?.activePackagesCount || 0} sổ ({totalMonths}T)
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-white">
              {compact(result.finalPortfolioValue)} ·{' '}
              <span className="text-emerald-300">+{compact(result.finalMonthlyYield)}/th</span>
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
