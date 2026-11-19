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
import { useI18n } from '../i18n/index.jsx';
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

const CUSTOM_TERMS = ['1M', '3M', '6M', '9M', '12M'];

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
  const { lang, tx, formatTenure } = useI18n();
  if (!row) return null;

  const cohorts = row.cohorts || [];
  const packages = row.packages || [];
  const validFilter = termFilter === 'all' || cohorts.some((c) => c.term === termFilter) ? termFilter : 'all';
  const filteredPackages = validFilter === 'all' ? packages : packages.filter((p) => p.term === validFilter);
  const pkgUnit = tx('sổ', 'CDs', '口');

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
                    <Badge tone="neutral">
                      {cohort.packageCount} {pkgUnit}
                    </Badge>
                    <Badge tone={cohort.rolledPackages > 0 ? 'brand' : 'neutral'}>
                      {cohort.rolledPackages > 0
                        ? tx(`${cohort.rolledPackages} đã tái tục`, `${cohort.rolledPackages} rolled`, `${cohort.rolledPackages}件継続`)
                        : tx('Kỳ đầu', 'First cycle', '初回')}
                    </Badge>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  {tx('Lãi suất áp dụng:', 'Applied rate:', '適用金利：')} {pct(cohort.rate, 2, lang)}
                  {tx('/năm', '/yr', '/年')}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">
                      {tx('Tổng vốn hiện tại', 'Current Balance', '現在合計元本')}
                    </div>
                    <div className="mt-0.5 font-semibold text-white">{vnd(cohort.totalCurrentBalance, lang)}</div>
                  </div>
                  <div className="rounded-lg bg-black/25 px-2.5 py-2">
                    <div className="text-[11px] text-zinc-500">
                      {tx('Lãi đã gộp thêm', 'Compounded Int.', '組入済み利息')}
                    </div>
                    <div className="mt-0.5 font-medium text-emerald-300">+{vnd(cohort.totalAccumulatedInterest, lang)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-xs tabular-nums ring-1 ring-inset ring-emerald-400/20">
                <div className="text-emerald-200">
                  {cohort.packageCount > 1 && (
                    <span className="mr-1.5 text-[11px] text-emerald-300/80">
                      {tx(
                        `TB mỗi sổ +${compact(cohort.perPackageMonthlyInterest, lang)}/th ·`,
                        `Avg/CD +${compact(cohort.perPackageMonthlyInterest, lang)}/mo ·`,
                        `1口平均 +${compact(cohort.perPackageMonthlyInterest, lang)}/月 ·`
                      )}
                    </span>
                  )}
                  <strong className="font-semibold text-emerald-300">
                    +{vnd(cohort.totalMonthlyInterest, lang)}
                    {tx('/tháng', '/mo', '/月')}
                  </strong>
                </div>
                <span className="font-semibold text-emerald-300">{pct(cohort.sharePct, 1, lang)}</span>
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
          {tx('Tất cả', 'All', 'すべて')} ({row.packagesTotalCount || packages.length} {pkgUnit})
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
                  {pkg.rolloverCount > 0
                    ? tx(`Xoay vòng ${pkg.rolloverCount}`, `Rolled ×${pkg.rolloverCount}`, `継続 ${pkg.rolloverCount}回`)
                    : tx(`Đáo hạn T${pkg.maturityMonth}`, `Mat. M${pkg.maturityMonth}`, `満期 M${pkg.maturityMonth}`)}
                </Badge>
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                <span>
                  {formatTenure(pkg.term)} · {pct(pkg.rate, 2, lang)}
                </span>
                <span>
                  {tx(`Mở T${pkg.startMonth}`, `Open M${pkg.startMonth}`, `開始 M${pkg.startMonth}`)}
                </span>
              </div>
              <div className="mt-2.5 space-y-1 border-t border-white/[0.05] pt-2 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>{tx('Số dư sổ:', 'CD balance:', '証書残高：')}</span>
                  <span className="font-medium text-white">{vnd(pkg.currentAmount, lang)}</span>
                </div>
                {pkg.accumulatedInterest > 0 && (
                  <div className="flex justify-between text-emerald-300/80">
                    <span>{tx('Lãi nhập gốc:', 'Interest added:', '累計利息：')}</span>
                    <span>+{vnd(pkg.accumulatedInterest, lang)}</span>
                  </div>
                )}
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

function LadderPackageExplorer({ rows, splitLabel }) {
  const [explorerView, setExplorerView] = useState('shelf'); // 'shelf' | 'matrix'
  const [granularity, setGranularity] = useState('cohorts'); // 'cohorts' | 'individual'
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(null);
  const [expandedMonthIdx, setExpandedMonthIdx] = useState(null);
  const { lang, tx } = useI18n();
  const pkgUnit = tx('sổ', 'CDs', '口');

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
        title={tx('Chi tiết lộ trình & Kệ sổ bậc thang', 'Ladder Stage Shelf & Breakdown', 'ラダー貯蓄 ステージ別証書内訳')}
        description={tx(
          `Kiểm tra ở từng tháng bạn đang nắm giữ bao nhiêu sổ (${splitLabel}) và từng nhóm kỳ hạn sinh lời ra sao.`,
          `Inspect active passbooks each month (${splitLabel}) and how each tenure tier generates monthly interest.`,
          `各時点で保有中の証書口数（${splitLabel}）と預入期間ごとの利息配分を確認できます。`
        )}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={explorerView}
              onChange={setExplorerView}
              options={[
                { value: 'shelf', label: tx('Kệ sổ theo giai đoạn', 'Stage Shelf', 'ステージ別') },
                { value: 'matrix', label: tx('Bảng phân tầng', 'Schedule Matrix', '月次テーブル') },
              ]}
            />
            <Segmented
              size="sm"
              value={granularity}
              onChange={setGranularity}
              options={[
                { value: 'cohorts', label: tx('Gộp theo kỳ hạn', 'By Tenure', '期間グループ') },
                { value: 'individual', label: tx('Từng sổ lẻ', 'Single CDs', '個別証書') },
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
                    <Badge tone={active ? 'brand' : 'neutral'}>
                      {r.activePackagesCount} {pkgUnit}
                    </Badge>
                  </div>
                  <div className="text-[11px] tabular-nums text-zinc-400">
                    +{compact(r.estimatedMonthlyYield, lang)}
                    {tx('/th', '/mo', '/月')} · {compact(r.totalPortfolioValue, lang)}
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
                {tx(`Danh mục tại ${activeRow.month}`, `Portfolio at ${activeRow.month}`, `${activeRow.month}のポートフォリオ`)}
              </div>
              <span className="text-xs text-zinc-400 tabular-nums">
                {activeRow.activePackagesCount} {tx('sổ đang chạy', 'active CDs', '口 稼働中')}
              </span>
            </div>

            {activeRow.cohorts?.length > 0 && activeRow.estimatedMonthlyYield > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span>{tx('Tỷ trọng tiền lãi theo kỳ hạn bậc thang', 'Interest contribution by ladder tier', '期間別利息シェア')}</span>
                  <span className="tabular-nums">
                    {tx('Tổng', 'Total', '合計')} +{vnd(activeRow.estimatedMonthlyYield, lang)}
                    {tx('/tháng', '/mo', '/月')}
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  {activeRow.cohorts.map((c) => {
                    const st = COHORT_TONES[c.tone] || COHORT_TONES.emerald;
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
                  {activeRow.cohorts.map((c) => {
                    const st = COHORT_TONES[c.tone] || COHORT_TONES.emerald;
                    return (
                      <span key={c.key} className="flex items-center gap-1.5">
                        <span className={cx('size-2 rounded-full', st.dot)} />
                        {c.label} ({pct(c.sharePct, 1, lang)})
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
            {tx(
              'Nhấn vào từng dòng tháng để mở danh sách chi tiết các sổ bậc thang đang sinh lời tại tháng đó.',
              'Click any month row to inspect individual passbooks running in that period.',
              '各月の行をクリックすると、その時点で運用中の定期証書の詳細が開きます。'
            )}
          </div>
          <Table
            className="max-h-[540px]"
            head={[
              tx('Tháng', 'Month', '経過月'),
              tx('Gửi thêm', 'Deposit', '新規積立'),
              tx('Sổ đang chạy', 'Active CDs', '保有口数'),
              tx('Vốn đáo hạn', 'Matured Bal.', '満期元利'),
              tx('Lãi đáo hạn', 'Matured Int.', '満期利息'),
              tx('Tổng danh mục', 'Total Assets', '総資産'),
              tx('Lãi / tháng', 'Yield / Mo', '月間利息'),
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
                    <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.monthlyContribution, lang)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={isExpanded ? 'brand' : 'neutral'}>
                        {row.activePackagesCount} {pkgUnit}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {row.totalMaturedThisMonth > 0 ? fmt(row.totalMaturedThisMonth, lang) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-300">
                      {row.totalInterestMaturedThisMonth > 0 ? `+${fmt(row.totalInterestMaturedThisMonth, lang)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{fmt(row.totalPortfolioValue, lang)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">+{fmt(row.estimatedMonthlyYield, lang)}</td>
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
  const { lang, tx, formatTenure } = useI18n();
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const [monthlySavings, setMonthlySavings] = useState(() => Number(saved.saving) || 5_000_000);
  const [householdMode, setHouseholdMode] = useState(() =>
    ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(saved.householdMode) ? saved.householdMode : 'INDIVIDUAL'
  );
  const [dependentsCount] = useState(() => Number(saved.dependentsCount) || 0);
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    const fixed =
      Number(saved.monthlyFixedExpense) ||
      (saved.householdMode === 'COUPLE' || saved.householdMode === 'FAMILY' ? 18_000_000 : 12_000_000);
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

  const presets = (arr) => arr.map((v) => ({ value: v, label: v === 0 ? '0 ₫' : chip(v, lang) }));

  const strategiesList = useMemo(
    () => [
      {
        id: 'ROLLING_1M',
        title: tx('100% kỳ hạn 1 tháng (xoay vòng)', '100% 1-Month Rolling', '100% 1ヶ月定期ロールオーバー'),
        desc: tx(
          'Toàn bộ tiền gửi vào kỳ hạn 1 tháng và tự động tái tục. Thanh khoản cao nhất.',
          'All monthly deposits roll into 1-month passbooks. Maximum monthly liquidity.',
          '全額を1ヶ月定期で自動更新。最も高い流動性を維持できます。'
        ),
        split: tx('100% gói 1T', '100% 1M CD', '100% 1ヶ月枠'),
      },
      {
        id: 'SPLIT_50_50',
        title: tx('Bậc thang 50% (1T) + 50% (3T)', 'Balanced Ladder 50% (1M) + 50% (3M)', 'バランス型 50%(1ヶ月) + 50%(3ヶ月)'),
        desc: tx(
          'Chia đôi khoản tiết kiệm hàng tháng vào kỳ hạn 1 tháng và 3 tháng để cân bằng lãi suất & thanh khoản.',
          'Split deposits equally across 1M and 3M terms to balance yield and flexibility.',
          '毎月の積立を1ヶ月と3ヶ月に半額ずつ分散し、利回りと流動性を両立。'
        ),
        split: tx('50% 1T · 50% 3T', '50% 1M · 50% 3M', '50% 1ヶ月 · 50% 3ヶ月'),
      },
      {
        id: 'TNEX_PROMO_30_70',
        title: tx('Tối ưu lãi suất 30% (1T) + 70% (6T)', 'Yield Booster 30% (1M) + 70% (6M)', '利回り優先 30%(1ヶ月) + 70%(6ヶ月)'),
        desc: tx(
          'Giữ 30% ở kỳ hạn 1 tháng dự phòng khẩn cấp, 70% đưa vào kỳ hạn 6 tháng để hưởng lãi suất cao.',
          'Keep 30% liquid in 1M reserve and commit 70% into higher-yield 6M deposits.',
          '30%を1ヶ月緊急枠で確保しつつ、70%を高金利な6ヶ月枠へ集中配分。'
        ),
        split: tx('30% 1T · 70% 6T', '30% 1M · 70% 6M', '30% 1ヶ月 · 70% 6ヶ月'),
      },
      {
        id: 'CUSTOM',
        title: tx('Tuỳ chỉnh tỷ lệ 2 kỳ hạn', 'Custom Dual-Tenure Split', 'カスタム2期間配分'),
        desc: tx(
          'Tự chọn 2 kỳ hạn và tỷ lệ phần trăm phân bổ theo nhu cầu thanh khoản cá nhân.',
          'Pick any 2 tenures and percentage split tailored to your cash needs.',
          '任意の2つの期間と割合を自分の資金計画に合わせて自由設定します。'
        ),
        split: tx('Tuỳ chỉnh', 'Custom', 'カスタム'),
      },
    ],
    [tx]
  );

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
  const activeStrategy = strategiesList.find((s) => s.id === strategy) || strategiesList[0];
  const splitLabel =
    strategy === 'CUSTOM'
      ? `${shortPct}% ${formatTenure(shortTerm)} · ${100 - shortPct}% ${formatTenure(longTerm)}`
      : activeStrategy.split;
  const principalRatio = result.finalPortfolioValue > 0 ? (totalDeposited / result.finalPortfolioValue) * 100 : 0;

  const hhMeta = HOUSEHOLD_MODES.find((m) => m.id === householdMode) || HOUSEHOLD_MODES[0];
  const hhLabel = tx(hhMeta.label, hhMeta.labelEn, hhMeta.labelJa);
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
    .reduce((sum, c) => sum + (Number(c.totalCurrentBalance ?? c.totalValue) || 0), 0);
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
  const pkgUnit = tx('sổ', 'CDs', '口');

  return (
    <>
      <PageHeader
        icon={Layers}
        eyebrow={tx('Chiến lược bậc thang', 'Ladder Strategy', '階段式定期戦略')}
        title={tx('Tiết kiệm bậc thang (Savings Ladder)', 'Savings Ladder Simulator', 'ラダー貯蓄（定期預金分散）')}
        description={tx(
          'Thay vì dồn hết tiền vào một sổ dài hạn dễ mất lãi khi cần rút gấp, hãy chia nhỏ khoản gửi hàng tháng vào nhiều kỳ hạn xoay vòng.',
          'Instead of locking everything into one long deposit, stagger monthly deposits across short & long tenures for rolling liquidity.',
          '全額を長期定期に固定する代わりに、毎月の積立を複数期間に分散させて高い流動性と利回りを両立させます。'
        )}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left Inputs */}
        <Card className="space-y-5 p-5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <SlidersHorizontal className="size-3.5 text-indigo-300" />{' '}
                {tx('Phiên bản nhập liệu', 'Input Mode', '入力モード')}
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
                  { value: 'basic', label: tx('Cơ bản', 'Basic', '基本') },
                  { value: 'advanced', label: tx('Chuyên sâu', 'Pro', '詳細') },
                ]}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {inputMode === 'basic'
                ? tx(
                    'Phiên bản Cơ bản (Nhanh): chọn mức gửi hàng tháng và 1 trong 3 công thức bậc thang chuẩn.',
                    'Basic (Quick): set your monthly deposit and choose from 3 proven ladder templates.',
                    '基本（簡易）：毎月の積立額と3つの定番配分パターンから選ぶだけで試算します。'
                  )
                : tx(
                    'Phiên bản Chuyên sâu (Thực tế): kéo dài mô phỏng tới 60 tháng & tự tuỳ chỉnh tỷ lệ 2 kỳ hạn.',
                    'Pro (Custom): extend simulation up to 60 months & customize dual-tenure weights.',
                    '詳細（実践）：最大60ヶ月までの試算と2期間の自由な配分調整が可能です。'
                  )}
            </p>
            <div className="pt-2">
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {tx('Hồ sơ thanh khoản', 'Liquidity Profile', '世帯プロファイル')}
              </span>
              <HouseholdModeSwitch value={householdMode} onChange={setHouseholdMode} compact />
            </div>
          </div>

          <div className="space-y-4">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              {tx('1. Khoản gửi & Thời gian', '1. Deposit & Horizon', '1. 積立額と期間')}
            </span>
            <MoneyField
              label={tx('Số tiền gửi mới mỗi tháng', 'New Monthly Deposit', '毎月の新規積立額')}
              value={monthlySavings}
              onChange={setMonthlySavings}
              min={500_000}
              max={50_000_000}
              step={500_000}
              inputMax={500_000_000}
              presets={presets([1_000_000, 3_000_000, 5_000_000, 10_000_000, 20_000_000])}
            />

            <MoneyField
              label={tx('Chi tiêu sinh hoạt / tháng (đo quỹ dự phòng)', 'Monthly Living Cost (for EF check)', '毎月の生活費（緊急資金測定用）')}
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
                label={tx('Thời gian mô phỏng', 'Simulation Duration', 'シミュレーション期間')}
                display={`${totalMonths} ${tx('tháng', 'mos', 'ヶ月')} (${(totalMonths / 12).toFixed(1)} ${tx('năm', 'yrs', '年')})`}
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
              {tx('2. Ngân hàng áp dụng', '2. Digital Bank', '2. 適用銀行')}
            </span>
            <BankPicker
              bankId={bankId}
              onBank={setBankId}
              tenure="6M"
              label={tx('Chọn ngân hàng áp dụng lãi suất', 'Select bank rate table', '適用金利の銀行を選択')}
            />
          </div>

          <div className="space-y-2.5 border-t border-white/[0.06] pt-5">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              {tx('3. Chiến lược phân bổ bậc thang', '3. Ladder Split Strategy', '3. ラダー配分戦略')}
            </span>
            {strategiesList
              .filter((s) => inputMode === 'advanced' || s.id !== 'CUSTOM')
              .map((s) => {
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
                <span>
                  {tx(
                    `Chuyên sâu: Thời gian ${totalMonths} tháng & Tuỳ chỉnh % kỳ hạn`,
                    `Pro: ${totalMonths}-month horizon & Custom tier split`,
                    `詳細：${totalMonths}ヶ月期間・割合カスタム設定`
                  )}
                </span>
                <span className="shrink-0 font-medium text-indigo-300">
                  {tx('Mở rộng', 'Expand', '開く')}
                </span>
              </button>
            )}

            {inputMode === 'advanced' && strategy === 'CUSTOM' && (
              <div className="mt-3 space-y-4 rounded-xl bg-black/25 p-4 ring-1 ring-inset ring-white/[0.08]">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      {tx('Gói ngắn hạn (Thanh khoản)', 'Short Tranche (Liquid)', '短期枠（流動性）')}
                    </label>
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
                          {formatTenure(t)} ({pct(bankRates[t], 2, lang)})
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      {tx('Gói dài hạn (Lãi cao)', 'Long Tranche (Higher Yield)', '長期枠（高金利）')}
                    </label>
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
                          {formatTenure(t)} ({pct(bankRates[t], 2, lang)})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <SliderField
                  label={tx('Tỷ lệ phân bổ', 'Allocation Ratio', '配分比率')}
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

        {/* Results */}
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
                    {tx('Sau', 'After', '積立期間')}{' '}
                    <span className="font-medium text-white">
                      {totalMonths} {tx('tháng', 'mos', 'ヶ月')}
                    </span>{' '}
                    {tx('gửi đều', 'depositing', '・毎月')}{' '}
                    <span className="font-medium text-white">
                      {compact(monthlySavings, lang)}
                      {tx('/tháng', '/mo', '/月')}
                    </span>
                    , {tx('danh mục bậc thang của bạn đạt', 'your ladder portfolio reaches', 'ラダーポートフォリオ総額は')}
                    <Badge tone="brand">
                      {bank.name} · {splitLabel}
                    </Badge>
                  </div>
                  <div className="mt-3 break-words text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl lg:text-5xl">
                    {vnd(result.finalPortfolioValue, lang)}
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                    {tx('Với', 'With', '保有証書')}{' '}
                    <strong className="text-white">
                      {lastRow?.activePackagesCount || 0} {pkgUnit}
                    </strong>{' '}
                    {tx(
                      'đang xoay vòng liên tục, danh mục tự tạo ra dòng lãi ước tính',
                      'actively rolling, your ladder generates an estimated monthly yield of',
                      '口が継続回転し、月間予想利息'
                    )}{' '}
                    <strong className="text-emerald-300">
                      +{vnd(result.finalMonthlyYield, lang)}
                      {tx('/tháng', '/mo', '/月')}
                    </strong>{' '}
                    {tx('và đã gộp', 'with', '・組入済み累計利息')}{' '}
                    <strong className="text-indigo-300">+{vnd(totalInterest, lang)}</strong>{' '}
                    {tx('tiền lãi đáo hạn.', 'in compounded interest.', 'を達成します。')}
                  </p>
                  <div className="mt-6">
                    <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>{tx('Tỷ trọng gốc đã nộp / tổng danh mục cuối kỳ', 'Principal deposited / total portfolio', '総積立元本 / 最終残高比率')}</span>
                      <span className="tabular-nums">
                        {compact(totalDeposited, lang)} / {compact(result.finalPortfolioValue, lang)}
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
                  label={tx('Tổng danh mục cuối kỳ', 'Final Portfolio Value', '最終資産合計')}
                  value={compact(result.finalPortfolioValue, lang)}
                  hint={vnd(result.finalPortfolioValue, lang)}
                  className="card-interactive"
                />
                <Stat
                  icon={Wallet}
                  label={tx('Tổng gốc đã nộp', 'Total Deposited', '積立元本合計')}
                  value={compact(totalDeposited, lang)}
                  hint={`${totalMonths}${tx('T', 'm', 'ヶ月')} × ${compact(monthlySavings, lang)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={PiggyBank}
                  label={tx('Lãi thụ động / tháng', 'Monthly Passive Yield', '毎月予想利息')}
                  tone="emerald"
                  value={`+${compact(result.finalMonthlyYield, lang)}`}
                  hint={`${tx('Lãi đã gộp:', 'Compounded:', '組入利息：')} +${compact(totalInterest, lang)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={Package}
                  label={tx('Sổ đang xoay vòng', 'Active Passbooks', '運用中証書数')}
                  tone="indigo"
                  value={`${lastRow?.activePackagesCount || 0} ${pkgUnit}`}
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
                    {tx(
                      `Thanh khoản dự phòng (${hhLabel} · ${recMonths} tháng chi phí)`,
                      `Emergency Liquidity (${hhLabel} · ${recMonths}-month target)`,
                      `緊急流動性カバー（${hhLabel} · ${recMonths}ヶ月目安）`
                    )}
                  </span>
                  <Badge tone={liquidCoveragePct >= 100 ? 'success' : 'warning'}>
                    {tx(
                      `Lớp 1T–3T đạt ${pct(liquidCoveragePct, 0, lang)}`,
                      `1M–3M tier at ${pct(liquidCoveragePct, 0, lang)}`,
                      `1〜3ヶ月枠 達成率 ${pct(liquidCoveragePct, 0, lang)}`
                    )}
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs tabular-nums text-zinc-400">
                    <span>
                      {tx(
                        `Sổ linh hoạt (1T–3T) cuối kỳ: ${vnd(liquidCohortsValue, lang)}`,
                        `Liquid 1M–3M balance at end: ${vnd(liquidCohortsValue, lang)}`,
                        `満期時の短期枠（1〜3ヶ月）残高：${vnd(liquidCohortsValue, lang)}`
                      )}
                    </span>
                    <span>
                      {tx(
                        `Mục tiêu dự phòng ${recMonths}T: ${vnd(recommendedLiquidTarget, lang)}`,
                        `${recMonths}M EF target: ${vnd(recommendedLiquidTarget, lang)}`,
                        `緊急資金目標(${recMonths}ヶ月)：${vnd(recommendedLiquidTarget, lang)}`
                      )}
                    </span>
                  </div>
                  <Progress value={liquidCoveragePct} />
                </div>

                {hasPartner && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-xs tabular-nums text-zinc-300 ring-1 ring-inset ring-white/[0.06]">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Users className="size-3.5 text-indigo-300" />{' '}
                      {tx('Góp bậc thang mỗi tháng:', 'Monthly ladder split:', '毎月のラダー積立分担：')}
                    </span>
                    <span>
                      {tx('Người 1:', 'Earner 1:', '1人目：')}{' '}
                      <strong className="text-white">{vnd(e1MonthlyLadder, lang)}</strong> ({pct(e1SharePct, 0, lang)}) ·{' '}
                      {tx('Người 2:', 'Earner 2:', '2人目：')}{' '}
                      <strong className="text-white">{vnd(e2MonthlyLadder, lang)}</strong> ({pct(100 - e1SharePct, 0, lang)})
                    </span>
                  </div>
                )}
              </Card>

              {/* Ladder Stage Shelf & Expandable Matrix */}
              <LadderPackageExplorer rows={result.timelineRows} splitLabel={splitLabel} />

              <RateDisclaimer />

              <FeedbackWidget
                toolId="ladder"
                toolLabel={tx('Tiết kiệm bậc thang', 'Savings Ladder', 'ラダー貯蓄')}
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
              {bank.name} · {lastRow?.activePackagesCount || 0} {pkgUnit} ({totalMonths}
              {tx('T', 'm', 'ヶ月')})
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-white">
              {compact(result.finalPortfolioValue, lang)} ·{' '}
              <span className="text-emerald-300">
                +{compact(result.finalMonthlyYield, lang)}
                {tx('/th', '/mo', '/月')}
              </span>
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
