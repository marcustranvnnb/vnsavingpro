import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator as CalcIcon,
  CheckCircle2,
  Coins,
  Info,
  Percent,
  PiggyBank,
  RotateCcw,
  Scissors,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { useRates } from '../state.jsx';
import { TENURE_DAYS_MAP } from '../data/banksData.js';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { syncUserPrefCookie } from '../utils/cookieManager.js';
import { chip, compact, pct, vnd } from '../utils/format.js';
import { AdaptiveGrid, WorkspaceSplit } from '../components/AdaptiveLayout.jsx';
import {
  Badge,
  Callout,
  Card,
  CardHeader,
  DecimalInput,
  MoneyField,
  NumberInput,
  PageHeader,
  Progress,
  RateDisclaimer,
  ResultsSkeleton,
  Segmented,
  SliderField,
  Stat,
  cx,
} from '../components/ui.jsx';
import { BankPicker } from '../components/BankPicker.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';

const INITIAL_CALC_DATA = {
  days: 365,
  months: 12,
  m1: { interest: 0, monthly: 0, total: 0 },
  m2: { interest: 0, monthly: 0, total: 0 },
  m3: { interest: 0, monthly: 0, total: 0 },
  diffDaysVsMonths: 0,
  diffCompoundVsDays: 0,
  earlySim: {
    withdrawAmount: 30_000_000,
    remainingPrincipal: 70_000_000,
    daysHeld: 180,
    totalDays: 365,
    nonTermRate: 0.5,
    fullEarlyInterest: 0,
    partialTotalInterest: 0,
    interestSavedByPartial: 0,
  },
};

export default function Calculator() {
  const { banks, getRate } = useRates();
  const { lang, tx, formatTenure } = useI18n();
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const [principal, setPrincipal] = useState(100_000_000);
  const [bankId, setBankId] = useState(() => saved.bankId || 'cake');
  const [tenure, setTenure] = useState(() => saved.tenure || '12M');
  const [customRate, setCustomRate] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [inputMode, setInputMode] = useState(() => saved.inputMode || 'basic');
  const [withdrawAmount, setWithdrawAmount] = useState(30_000_000);
  const [daysHeld, setDaysHeld] = useState(180);

  const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v, lang) }));

  useEffect(() => {
    syncUserPrefCookie({ bankId, tenure, inputMode });
  }, [bankId, tenure, inputMode]);

  const bank = banks.find((b) => b.id === bankId) || banks[0];
  const usingCustom = inputMode === 'advanced' && customRate !== '' && Number(customRate) > 0;
  const rate = usingCustom ? Number(customRate) : getRate(bank, tenure) || 6;

  const defaultDays = TENURE_DAYS_MAP[tenure] || 365;
  const days = inputMode === 'advanced' && customDays !== '' && Number(customDays) > 0 ? Number(customDays) : defaultDays;

  const calcPayload = useMemo(
    () => ({
      principal,
      rate,
      tenure,
      customDays: inputMode === 'advanced' && customDays !== '' && Number(customDays) > 0 ? Number(customDays) : null,
      withdrawAmount: Math.min(principal, withdrawAmount),
      daysHeld: Math.min(days, daysHeld),
    }),
    [principal, rate, tenure, inputMode, customDays, withdrawAmount, days, daysHeld]
  );

  const { data: res, loading, initialized } = useServerCalc('calculator_bundle', calcPayload, INITIAL_CALC_DATA);
  const { m1, m2, m3, diffDaysVsMonths, diffCompoundVsDays, earlySim } = res;
  const interestSharePct = m1.total > 0 ? Math.min(100, (m1.interest / m1.total) * 100) : 0;

  const methods = [
    {
      id: 'actual',
      badge: tx('Chuẩn NHNN (TT 14)', 'SBV Standard (Circ. 14)', '中銀通達14号準拠'),
      tone: 'success',
      title: tx('Ngày thực tế / 365', 'Actual Days / 365', '実日数 / 365日法'),
      subtitle: tx(`${days} ngày thực gửi · Cơ sở 365 ngày`, `${days} actual days · 365-day base`, `実預入 ${days}日 · 年365日計算`),
      interest: m1.interest,
      monthly: m1.monthly,
      total: m1.total,
      desc: tx(
        'Áp dụng tại hầu hết ngân hàng Việt Nam theo Thông tư 14/2017/TT-NHNN (tính trên cơ sở 1 năm = 365 ngày).',
        'Official Vietnamese banking standard under SBV Circular 14/2017/TT-NHNN (365-day annual basis).',
        'ベトナム国家銀行通達14/2017/TT-NHNNに基づき、大半のベトナム銀行で採用されている日割り計算式。'
      ),
      highlight: true,
    },
    {
      id: 'nominal',
      badge: tx('Tháng tròn', 'Nominal Month', '月割り計算'),
      tone: 'neutral',
      title: tx('Tháng tròn / 12', 'Nominal Months / 12', '月割り / 12ヶ月法'),
      subtitle: tx(`${res.months} tháng tròn · Chia đều 12 tháng`, `${res.months} nominal months · Divided by 12`, `${res.months}ヶ月 · 12ヶ月均等割`),
      interest: m2.interest,
      monthly: m2.monthly,
      total: m2.total,
      desc: tx(
        'Cách ước tính nhẩm nhanh bằng cách chia đều 12 tháng. Thường lệch nhẹ ở các kỳ hạn 1–6 tháng (30 ngày/tháng).',
        'Quick mental estimate dividing the annual rate evenly by 12 months. Slightly differs on 1–6M tenures (30-day months).',
        '年利を単純に12ヶ月で割る概算方式。1〜6ヶ月定期（月30日換算）では実日数法とわずかに差が出ます。'
      ),
    },
    {
      id: 'compound',
      badge: tx('Tái tục hàng tháng', 'Monthly Rollover', '毎月複利ロールオーバー'),
      tone: 'brand',
      title: tx('Lãi kép hàng tháng', 'Monthly Compounding', '毎月複利計算'),
      subtitle: tx(`Tái tục gốc + lãi qua ${res.months} chu kỳ`, `Auto-compounded over ${res.months} cycles`, `${res.months}サイクル連続複利運用`),
      interest: m3.interest,
      monthly: m3.monthly,
      total: m3.total,
      desc: tx(
        'Áp dụng khi tiền lãi mỗi tháng được tự động cộng dồn vào gốc để tính lãi cho tháng kế tiếp.',
        'Applies when monthly interest is automatically reinvested into principal for the next month.',
        '毎月の利息を元本へ自動組入して翌月の利息計算に含める場合の試算です。'
      ),
    },
  ];

  return (
    <>
      <PageHeader
        icon={CalcIcon}
        eyebrow={tx('Công cụ tính lãi', 'Interest Calculator', '預金利息シミュレーター')}
        title={tx('Tính lãi tiết kiệm & so sánh 3 cách tính', 'Deposit Interest & 3-Method Comparator', '定期預金利息計算・3方式比較')}
        description={tx(
          'Cùng một khoản tiền gửi và lãi suất, cách tính theo ngày thực tế (365 ngày), tháng tròn (12 tháng) và lãi kép cho kết quả khác nhau như thế nào?',
          'See how Actual Days/365, Nominal Months/12, and Monthly Compounding differ on the exact same deposit amount and interest rate.',
          '同じ預入元本と年利でも、「実日数/365日」「月割り/12」「毎月複利」によって受取利息がどう変わるかを比較できます。'
        )}
      />

      <WorkspaceSplit
        resultsId="calculator-results"
        mobileSummary={{
          eyebrow: `${bank.name} · ${formatTenure(tenure)} (${pct(rate, 2, lang)})`,
          value: (
            <>
              {tx('Lãi TT14:', 'Circ.14 Int:', '利息：')}{' '}
              <span className="text-emerald-300">+{compact(m1.interest, lang)}</span> ·{' '}
              {tx('Tổng', 'Total', '合計')} {compact(m1.total, lang)}
            </>
          ),
        }}
        controls={
          <div className="space-y-5">
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <SlidersHorizontal className="size-3.5 text-indigo-300" />{' '}
                {tx('Phiên bản nhập liệu', 'Input Mode', '入力モード')}
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
                    'Phiên bản Cơ bản (Nhanh): tính lãi chuẩn TT14 theo lãi suất niêm yết của từng ngân hàng số.',
                    'Basic (Quick): computes SBV Circular 14 yields using published bank tariffs.',
                    '基本（簡易）：各ネット銀行の公式金利を使って中銀通達14号基準で即時試算します。'
                  )
                : tx(
                    'Phiên bản Chuyên sâu (Thực tế): mở tuỳ chỉnh lãi suất ưu đãi riêng, số ngày thực gửi & kịch bản rút sớm.',
                    'Pro (Custom): unlock custom promo rate overrides, exact deposit day counts & early withdrawal tuning.',
                    '詳細（実践）：独自の優遇金利上書きや実預入日数のカスタマイズが利用できます。'
                  )}
            </p>
          </div>

          <div className="space-y-4">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              {tx('1. Số tiền gửi tiết kiệm', '1. Deposit Principal', '1. 預入元本')}
            </span>
            <MoneyField
              label={tx('Vốn gửi kỳ này', 'Deposit Amount', '今回の預入額')}
              value={principal}
              onChange={setPrincipal}
              min={1_000_000}
              max={2_000_000_000}
              step={5_000_000}
              inputMax={100_000_000_000}
              presets={presets([10_000_000, 50_000_000, 100_000_000, 500_000_000, 1_000_000_000])}
            />
          </div>

          <div className="space-y-3 border-t border-white/[0.06] pt-5">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              {tx('2. Ngân hàng & Kỳ hạn', '2. Bank & Tenure', '2. 銀行と預入期間')}
            </span>
            <BankPicker
              bankId={bankId}
              onBank={(id) => {
                setBankId(id);
                setCustomRate('');
              }}
              tenure={tenure}
              onTenure={(t) => {
                setTenure(t);
                setCustomDays('');
              }}
            />
          </div>

          {inputMode === 'basic' ? (
            <button
              type="button"
              onClick={() => setInputMode('advanced')}
              className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3.5 py-2.5 text-left text-xs text-zinc-400 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.05] hover:text-zinc-200"
            >
              <span className="truncate">
                {tx(
                  `Chuyên sâu: Lãi suất tuỳ chỉnh · Số ngày thực tế (${days}N)`,
                  `Pro: Custom Rate · Actual Day Count (${days}d)`,
                  `詳細：金利カスタム · 実預入日数 (${days}日)`
                )}
              </span>
              <span className="shrink-0 font-medium text-indigo-300">
                {tx('Mở rộng', 'Expand', '開く')}
              </span>
            </button>
          ) : (
            <div className="space-y-4 border-t border-white/[0.06] pt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                {tx('Tuỳ chỉnh chuyên sâu', 'Pro Overrides', '詳細カスタム設定')}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {tx('Lãi suất tuỳ chỉnh', 'Custom Rate', 'カスタム金利')}
                  </label>
                  <div className="flex items-center gap-1">
                    <DecimalInput
                      value={customRate}
                      onChange={setCustomRate}
                      suffix="%"
                      min={0.1}
                      max={25}
                      step={0.1}
                      ariaLabel={tx('Lãi suất tuỳ chỉnh', 'Custom rate', 'カスタム金利')}
                    />
                    {usingCustom && (
                      <button
                        type="button"
                        onClick={() => setCustomRate('')}
                        aria-label={tx('Khôi phục lãi suất mặc định', 'Reset to default rate', '標準金利に戻す')}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {tx('Số ngày thực tế', 'Actual Days Held', '実預入日数')}
                  </label>
                  <NumberInput
                    value={customDays === '' ? defaultDays : customDays}
                    onChange={setCustomDays}
                    suffix={tx('ngày', 'days', '日')}
                    max={3650}
                    ariaLabel={tx('Số ngày thực tế', 'Actual days', '実日数')}
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        }
        results={
          <div className="space-y-5">
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
                    {tx('Gửi', 'Depositing', '預入元本')}{' '}
                    <span className="font-medium text-white">{vnd(principal, lang)}</span>{' '}
                    {tx('trong', 'for', '・期間')}{' '}
                    <span className="font-medium text-white">{formatTenure(tenure)}</span> ({days} {tx('ngày', 'days', '日')}),{' '}
                    {tx('tiền lãi chuẩn NHNN là', 'SBV standard interest is', '中銀基準の受取利息は')}
                    <Badge tone="brand">
                      {usingCustom ? tx('Lãi suất tự nhập', 'Custom Rate', '独自金利') : bank.name} · {pct(rate, 2, lang)}
                      {tx('/năm', '/yr', '/年')}
                    </Badge>
                  </div>
                  <div className="mt-3 break-words text-3xl font-semibold tracking-tight text-emerald-300 tabular-nums sm:text-4xl lg:text-5xl">
                    +{vnd(m1.interest, lang)}
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                    {tx('Tổng gốc & lãi nhận khi đáo hạn đạt', 'Total principal + interest at maturity:', '満期時の元利合計は')}{' '}
                    <strong className="text-white">{vnd(m1.total, lang)}</strong> ({tx('bình quân', 'avg', '平均')}{' '}
                    <strong className="text-indigo-300">{vnd(m1.monthly, lang)}{tx('/tháng', '/mo', '/月')}</strong>).{' '}
                    {tx('Nếu tái tục gốc + lãi hàng tháng, tổng lãi đạt', 'With monthly compounding rollover, total interest reaches', '毎月元利自動継続の場合は合計利息')}{' '}
                    <strong className="text-emerald-300">+{vnd(m3.interest, lang)}</strong>.
                  </p>
                  <div className="mt-6">
                    <div className="mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>{tx('Tỷ trọng tiền lãi trong tổng thu về', 'Interest share of maturity payout', '満期受取額に占める利息比率')}</span>
                      <span className="tabular-nums">
                        +{compact(m1.interest, lang)} / {compact(m1.total, lang)} ({pct(interestSharePct, 1, lang)})
                      </span>
                    </div>
                    <Progress value={Math.min(100, interestSharePct * 4)} tone="emerald" />
                  </div>
                </div>
              </Card>

              {/* 4 KPI Stats */}
              <AdaptiveGrid cols={{ mobile: 2, tablet: 2, duo: 2, desktop: 4 }}>
                <Stat
                  icon={Coins}
                  label={tx('Lãi chuẩn TT14 (365N)', 'SBV Circ. 14 (365d)', '中銀通達14号 (365日)')}
                  tone="emerald"
                  value={`+${compact(m1.interest, lang)}`}
                  hint={`${vnd(m1.monthly, lang)}${tx('/tháng', '/mo', '/月')}`}
                  className="card-interactive"
                />
                <Stat
                  icon={Wallet}
                  label={tx('Lãi tháng tròn / 12', 'Nominal Months / 12', '月割り計算 / 12')}
                  value={`+${compact(m2.interest, lang)}`}
                  hint={`${tx('Chênh', 'Diff', '差額')} ${diffDaysVsMonths >= 0 ? '+' : '-'}${compact(Math.abs(diffDaysVsMonths), lang)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={PiggyBank}
                  label={tx('Lãi kép hàng tháng', 'Monthly Compounding', '毎月複利')}
                  tone="indigo"
                  value={`+${compact(m3.interest, lang)}`}
                  hint={`${tx('Lợi thêm', 'Extra', '上乗せ')} +${compact(diffCompoundVsDays, lang)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={Percent}
                  label={tx('Giữ lại khi rút 1 phần', 'Saved via Partial Pull', '一部解約による保全額')}
                  tone="amber"
                  value={`+${compact(earlySim.interestSavedByPartial, lang)}`}
                  hint={tx('so với phá toàn bộ sổ', 'vs. breaking full CD', '全額解約と比較')}
                  className="card-interactive"
                />
              </AdaptiveGrid>

              {/* 3 Calculation Methods Comparison */}
              <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 1, desktop: 3 }} gap="gap-4">
                {methods.map((m) => (
                  <Card
                    key={m.id}
                    className={cx(
                      'card-interactive flex flex-col justify-between p-5',
                      m.highlight && 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] to-surface'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={m.tone}>{m.badge}</Badge>
                        {m.highlight && <CheckCircle2 className="size-4 text-emerald-400" />}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-white">{m.title}</h3>
                      <div className="mt-2 rounded-lg bg-black/30 px-3 py-2 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.05]">
                        {m.subtitle}
                      </div>

                      <div className="mt-5">
                        <div className="text-xs text-zinc-500">
                          {tx('Tổng tiền lãi nhận được', 'Total Interest Earned', '合計受取利息')}
                        </div>
                        <div
                          className={cx(
                            'mt-1 text-2xl font-semibold tracking-tight tabular-nums',
                            m.highlight ? 'text-emerald-300' : 'text-white'
                          )}
                        >
                          +{vnd(m.interest, lang)}
                        </div>
                      </div>

                      <dl className="mt-4 space-y-2 border-t border-white/[0.06] pt-3 text-xs tabular-nums">
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">{tx('Bình quân / tháng', 'Monthly average', '月平均利息')}</dt>
                          <dd className="font-medium text-zinc-200">{vnd(m.monthly, lang)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">{tx('Tổng gốc + lãi cuối kỳ', 'Maturity payout', '満期受取合計')}</dt>
                          <dd className="font-semibold text-white">{vnd(m.total, lang)}</dd>
                        </div>
                      </dl>
                    </div>

                    <p className="mt-4 border-t border-white/[0.05] pt-3 text-xs leading-relaxed text-zinc-500">{m.desc}</p>
                  </Card>
                ))}
              </AdaptiveGrid>

              {/* Method Differences */}
              <Card className="p-5 sm:p-6">
                <CardHeader
                  title={tx('Chênh lệch giữa các phương pháp', 'Spread Between Calculation Methods', '計算方法による受取差額')}
                  description={tx(
                    `Với khoản gửi ${vnd(principal, lang)} trong ${formatTenure(tenure)} (${days} ngày) tại mức lãi ${pct(rate, 2, lang)}/năm:`,
                    `For ${vnd(principal, lang)} deposited over ${formatTenure(tenure)} (${days} days) at ${pct(rate, 2, lang)} p.a.:`,
                    `元本 ${vnd(principal, lang)}・期間 ${formatTenure(tenure)}（${days}日）・年利 ${pct(rate, 2, lang)} の場合：`
                  )}
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <div className="text-xs text-zinc-500">
                      {tx('Ngày thực tế / 365 so với Tháng tròn / 12', 'Actual Days / 365 vs. Nominal / 12', '実日数 / 365日法 vs 月割り / 12法')}
                    </div>
                    <div className="mt-1.5 text-lg font-semibold tabular-nums text-white">
                      {diffDaysVsMonths >= 0 ? `+${vnd(diffDaysVsMonths, lang)}` : `-${vnd(Math.abs(diffDaysVsMonths), lang)}`}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {diffDaysVsMonths === 0
                        ? tx('Hai phương pháp cho kết quả bằng nhau ở kỳ hạn 365 ngày.', 'Both methods match cleanly on a 365-day year.', '365日ちょうどの場合、両方式の結果は一致します。')
                        : tx('Do số ngày thực tế của kỳ hạn khác với tỷ lệ tháng/12.', 'Occurs because exact day count differs from 12 nominal months.', '月割り（年12ヶ月換算）と実日数の差によって生じます。')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <div className="text-xs text-zinc-500">
                      {tx('Lãi kép hàng tháng so với Ngày thực tế / 365', 'Monthly Compounding vs. Actual / 365', '毎月複利 vs 実日数 / 365日法')}
                    </div>
                    <div className="mt-1.5 text-lg font-semibold tabular-nums text-emerald-300">
                      +{vnd(diffCompoundVsDays, lang)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {tx('Phần lãi tăng thêm nhờ tái tục lãi hàng tháng vào tiền gốc.', 'Extra yield earned by rolling interest back into principal every month.', '毎月利息を元本に再投資することで得られる複利の上乗せ分。')}
                    </div>
                  </div>
                </div>
              </Card>

              <Callout icon={Info} tone="brand">
                <strong>{tx('Cơ sở Thông tư 14/2017/TT-NHNN:', 'SBV Circular 14/2017/TT-NHNN Basis:', 'ベトナム国家銀行 通達14/2017号の基準：')}</strong>{' '}
                {tx(
                  'Các ngân hàng tại Việt Nam niêm yết lãi suất năm dựa trên cơ sở 365 ngày. Khi gửi kỳ hạn ngắn (ví dụ 1 tháng = 30 ngày), số tiền lãi thực nhận được tính tự động theo số ngày thực gửi qua máy chủ tính toán bảo mật của VnSavingPro.',
                  'Banks in Vietnam quote annual interest rates on a 365-day basis. For short terms like 1 month (30 days), exact earned interest scales by actual days held via VnSavingPro’s secure calculation server.',
                  'ベトナムの銀行は年利を365日基準で計算します。1ヶ月（30日）などの短期定期では、実預入日数に応じた日割り利息がVnSavingProの安全APIで自動算出されます。'
                )}
              </Callout>

              {/* Partial Early Withdrawal Simulator */}
              <Card className="p-5 sm:p-6">
                <CardHeader
                  title={tx('Mô phỏng rút trước hạn: Rút toàn bộ vs. Rút gốc một phần', 'Early Withdrawal: Full Break vs. Partial Principal', '中途解約比較：全額解約 vs 元本一部解約')}
                  description={tx(
                    'Nếu bạn cần tiền mặt đột xuất giữa kỳ hạn, việc chọn ngân hàng cho phép rút gốc từng phần (Cake, LioBank) hoặc chia nhỏ sổ (Timo) giúp giữ nguyên lãi suất có kỳ hạn cho phần vốn còn lại.',
                    'If you need urgent cash mid-term, banks with partial withdrawal (Cake, LioBank) or split passbooks (Timo) keep full term interest intact on your remaining principal.',
                    '期中に急な資金が必要になった場合、一部解約対応（Cake、LioBank）や自動分割（Timo）の銀行なら残高に対する定期金利を失わずに済みます。'
                  )}
                  right={
                    <Badge tone="brand">
                      <Scissors className="size-3" /> {tx('Bảo vệ tiền lãi', 'Protect Interest', '利息を保護')}
                    </Badge>
                  }
                />

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-4 rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <MoneyField
                      label={tx('Số tiền cần rút sớm', 'Amount Withdrawn Early', '中途解約したい金額')}
                      value={Math.min(principal, withdrawAmount)}
                      onChange={setWithdrawAmount}
                      min={1_000_000}
                      max={principal}
                      step={5_000_000}
                      inputMax={principal}
                      presets={presets(
                        [Math.round(principal * 0.25), Math.round(principal * 0.5), Math.round(principal * 0.75)].filter(
                          (v) => v > 0
                        )
                      )}
                    />
                    <SliderField
                      label={tx('Thời điểm phát sinh rút sớm', 'Withdrawal Timing', '解約発生タイミング')}
                      display={tx(`Sau ${Math.min(days, daysHeld)} / ${days} ngày`, `Day ${Math.min(days, daysHeld)} / ${days}`, `${Math.min(days, daysHeld)} / ${days}日目`)}
                      value={Math.min(days, daysHeld)}
                      onChange={setDaysHeld}
                      min={15}
                      max={days}
                      step={15}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col justify-between rounded-xl bg-red-500/[0.05] p-4 ring-1 ring-inset ring-red-400/20">
                      <div>
                        <Badge tone="danger">{tx('Tất toán toàn bộ sổ', 'Break Full Passbook', '全額中途解約')}</Badge>
                        <div className="mt-2 text-xs text-zinc-400">
                          {tx(
                            `Toàn bộ ${compact(principal, lang)} bị tính lãi không kỳ hạn (${pct(earlySim.nonTermRate, 1, lang)}/năm) cho ${earlySim.daysHeld} ngày.`,
                            `All ${compact(principal, lang)} drops to demand rate (${pct(earlySim.nonTermRate, 1, lang)}/yr) for ${earlySim.daysHeld} days.`,
                            `元本すべて（${compact(principal, lang)}）が普通預金金利（${pct(earlySim.nonTermRate, 1, lang)}/年・${earlySim.daysHeld}日分）に下がります。`
                          )}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-white/[0.06] pt-3">
                        <div className="text-xs text-zinc-500">{tx('Tổng lãi nhận được', 'Total Interest Earned', '合計受取利息')}</div>
                        <div className="mt-0.5 text-xl font-semibold tabular-nums text-red-300">
                          +{vnd(earlySim.fullEarlyInterest, lang)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl bg-emerald-500/[0.06] p-4 ring-1 ring-inset ring-emerald-400/25">
                      <div>
                        <Badge tone="success">{tx('Rút gốc một phần / Chia sổ', 'Partial Withdrawal', '一部解約・分割預金')}</Badge>
                        <div className="mt-2 text-xs text-zinc-400">
                          {tx('Chỉ', 'Only', '引き出す')}{' '}
                          {compact(earlySim.withdrawAmount, lang)}{' '}
                          {tx('chịu lãi', 'earns demand rate', 'のみ普通金利')}{' '}
                          {pct(earlySim.nonTermRate, 1, lang)};{' '}
                          {tx('phần còn lại', 'remaining', '残りの')}{' '}
                          <strong className="text-white">{compact(earlySim.remainingPrincipal, lang)}</strong>{' '}
                          {tx('giữ nguyên lãi', 'keeps full rate', 'は定期金利')}{' '}
                          {pct(rate, 2, lang)} {tx('đến cuối kỳ.', 'to maturity.', 'が満期まで維持。')}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-white/[0.06] pt-3">
                        <div className="text-xs text-zinc-500">{tx('Tổng lãi nhận được', 'Total Interest Earned', '合計受取利息')}</div>
                        <div className="mt-0.5 text-xl font-semibold tabular-nums text-emerald-300">
                          +{vnd(earlySim.partialTotalInterest, lang)}
                        </div>
                        <div className="mt-1 text-xs font-medium text-emerald-400">
                          {tx(
                            `Giữ lại được +${vnd(earlySim.interestSavedByPartial, lang)} tiền lãi`,
                            `Saved +${vnd(earlySim.interestSavedByPartial, lang)} in interest`,
                            `+${vnd(earlySim.interestSavedByPartial, lang)} の利息を保護`
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <RateDisclaimer />

              <FeedbackWidget
                toolId="calculator"
                toolLabel={tx('Tính lãi tiết kiệm', 'Interest Calculator', '利息計算')}
                snapshot={{ principal, bankId, tenure, rate, days, m1Interest: m1.interest }}
              />
            </div>
          )}
          </div>
        }
      />
    </>
  );
}
