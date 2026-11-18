import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
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
import { useRates } from '../state.jsx';
import { TENURE_DAYS_MAP, TENURE_LABELS } from '../data/banksData.js';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { syncUserPrefCookie } from '../utils/cookieManager.js';
import { chip, compact, pct, vnd } from '../utils/format.js';
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

const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v) }));

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
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const [principal, setPrincipal] = useState(100_000_000);
  const [bankId, setBankId] = useState(() => saved.bankId || 'cake');
  const [tenure, setTenure] = useState(() => saved.tenure || '12M');
  const [customRate, setCustomRate] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [inputMode, setInputMode] = useState(() => saved.inputMode || 'basic');
  const [withdrawAmount, setWithdrawAmount] = useState(30_000_000);
  const [daysHeld, setDaysHeld] = useState(180);

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
      badge: 'Chuẩn NHNN (TT 14)',
      tone: 'success',
      title: 'Ngày thực tế / 365',
      subtitle: `${days} ngày thực gửi · Cơ sở 365 ngày`,
      interest: m1.interest,
      monthly: m1.monthly,
      total: m1.total,
      desc: 'Áp dụng tại hầu hết ngân hàng Việt Nam theo Thông tư 14/2017/TT-NHNN (tính trên cơ sở 1 năm = 365 ngày).',
      highlight: true,
    },
    {
      id: 'nominal',
      badge: 'Tháng tròn',
      tone: 'neutral',
      title: 'Tháng tròn / 12',
      subtitle: `${res.months} tháng tròn · Chia đều 12 tháng`,
      interest: m2.interest,
      monthly: m2.monthly,
      total: m2.total,
      desc: 'Cách ước tính nhẩm nhanh bằng cách chia đều 12 tháng. Thường lệch nhẹ ở các kỳ hạn 1–6 tháng (30 ngày/tháng).',
    },
    {
      id: 'compound',
      badge: 'Tái tục hàng tháng',
      tone: 'brand',
      title: 'Lãi kép hàng tháng',
      subtitle: `Tái tục gốc + lãi qua ${res.months} chu kỳ`,
      interest: m3.interest,
      monthly: m3.monthly,
      total: m3.total,
      desc: 'Áp dụng khi tiền lãi mỗi tháng được tự động cộng dồn vào gốc để tính lãi cho tháng kế tiếp.',
    },
  ];

  return (
    <>
      <PageHeader
        icon={CalcIcon}
        eyebrow="Công cụ tính lãi"
        title="Tính lãi tiết kiệm & so sánh 3 cách tính"
        description="Cùng một khoản tiền gửi và lãi suất, cách tính theo ngày thực tế (365 ngày), tháng tròn (12 tháng) và lãi kép cho kết quả khác nhau như thế nào?"
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
                onChange={setInputMode}
                options={[
                  { value: 'basic', label: 'Cơ bản' },
                  { value: 'advanced', label: 'Chuyên sâu' },
                ]}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {inputMode === 'basic'
                ? 'Phiên bản Cơ bản (Nhanh): tính lãi chuẩn TT14 theo lãi suất niêm yết của từng ngân hàng số.'
                : 'Phiên bản Chuyên sâu (Thực tế): mở tuỳ chỉnh lãi suất ưu đãi riêng, số ngày thực gửi & kịch bản rút sớm.'}
            </p>
          </div>

          <div className="space-y-4">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              1. Số tiền gửi tiết kiệm
            </span>
            <MoneyField
              label="Vốn gửi kỳ này"
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
              2. Ngân hàng &amp; Kỳ hạn
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
                Chuyên sâu: Lãi suất tuỳ chỉnh · Số ngày thực tế ({days}N)
              </span>
              <span className="shrink-0 font-medium text-indigo-300">Mở rộng</span>
            </button>
          ) : (
            <div className="space-y-4 border-t border-white/[0.06] pt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                Tuỳ chỉnh chuyên sâu
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Lãi suất tuỳ chỉnh</label>
                  <div className="flex items-center gap-1">
                    <DecimalInput
                      value={customRate}
                      onChange={setCustomRate}
                      suffix="%"
                      min={0.1}
                      max={25}
                      step={0.1}
                      ariaLabel="Lãi suất tuỳ chỉnh"
                    />
                    {usingCustom && (
                      <button
                        type="button"
                        onClick={() => setCustomRate('')}
                        aria-label="Khôi phục lãi suất mặc định"
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Số ngày thực tế</label>
                  <NumberInput
                    value={customDays === '' ? defaultDays : customDays}
                    onChange={setCustomDays}
                    suffix="ngày"
                    max={3650}
                    ariaLabel="Số ngày thực tế"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ── Right Results (Unified Headline + 4 Stats + Details) ── */}
        <div id="calculator-results" className="min-w-0 space-y-5">
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
                    Gửi <span className="font-medium text-white">{vnd(principal)}</span> trong{' '}
                    <span className="font-medium text-white">{TENURE_LABELS[tenure]}</span> ({days} ngày), tiền lãi chuẩn
                    NHNN là
                    <Badge tone="brand">
                      {usingCustom ? 'Lãi suất tự nhập' : bank.name} · {pct(rate)}/năm
                    </Badge>
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-tight text-emerald-300 tabular-nums sm:text-5xl">
                    +{vnd(m1.interest)}
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                    Tổng gốc &amp; lãi nhận khi đáo hạn đạt <strong className="text-white">{vnd(m1.total)}</strong> (bình
                    quân <strong className="text-indigo-300">{vnd(m1.monthly)}/tháng</strong>). Nếu tái tục gốc + lãi hàng
                    tháng, tổng lãi đạt <strong className="text-emerald-300">+{vnd(m3.interest)}</strong>.
                  </p>
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-xs text-zinc-500">
                      <span>Tỷ trọng tiền lãi trong tổng thu về</span>
                      <span className="tabular-nums">
                        +{compact(m1.interest)} / {compact(m1.total)} ({pct(interestSharePct, 1)})
                      </span>
                    </div>
                    <Progress value={Math.min(100, interestSharePct * 4)} tone="emerald" />
                  </div>
                </div>
              </Card>

              {/* 4 KPI Stats */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Stat
                  icon={Coins}
                  label="Lãi chuẩn TT14 (365N)"
                  tone="emerald"
                  value={`+${compact(m1.interest)}`}
                  hint={`${vnd(m1.monthly)}/tháng`}
                  className="card-interactive"
                />
                <Stat
                  icon={Wallet}
                  label="Lãi tháng tròn / 12"
                  value={`+${compact(m2.interest)}`}
                  hint={`Chênh ${diffDaysVsMonths >= 0 ? '+' : '-'}${compact(Math.abs(diffDaysVsMonths))}`}
                  className="card-interactive"
                />
                <Stat
                  icon={PiggyBank}
                  label="Lãi kép hàng tháng"
                  tone="indigo"
                  value={`+${compact(m3.interest)}`}
                  hint={`Lợi thêm +${compact(diffCompoundVsDays)}`}
                  className="card-interactive"
                />
                <Stat
                  icon={Percent}
                  label="Giữ lại khi rút 1 phần"
                  tone="amber"
                  value={`+${compact(earlySim.interestSavedByPartial)}`}
                  hint="so với phá toàn bộ sổ"
                  className="card-interactive"
                />
              </div>

              {/* 3 Calculation Methods Comparison */}
              <div className="grid gap-4 md:grid-cols-3">
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
                        <div className="text-xs text-zinc-500">Tổng tiền lãi nhận được</div>
                        <div
                          className={cx(
                            'mt-1 text-2xl font-semibold tracking-tight tabular-nums',
                            m.highlight ? 'text-emerald-300' : 'text-white'
                          )}
                        >
                          +{vnd(m.interest)}
                        </div>
                      </div>

                      <dl className="mt-4 space-y-2 border-t border-white/[0.06] pt-3 text-xs tabular-nums">
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Bình quân / tháng</dt>
                          <dd className="font-medium text-zinc-200">{vnd(m.monthly)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-zinc-500">Tổng gốc + lãi cuối kỳ</dt>
                          <dd className="font-semibold text-white">{vnd(m.total)}</dd>
                        </div>
                      </dl>
                    </div>

                    <p className="mt-4 border-t border-white/[0.05] pt-3 text-xs leading-relaxed text-zinc-500">{m.desc}</p>
                  </Card>
                ))}
              </div>

              {/* Method Differences */}
              <Card className="p-5 sm:p-6">
                <CardHeader
                  title="Chênh lệch giữa các phương pháp"
                  description={`Với khoản gửi ${vnd(principal)} trong ${TENURE_LABELS[tenure]} (${days} ngày) tại mức lãi ${pct(rate)}/năm:`}
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <div className="text-xs text-zinc-500">Ngày thực tế / 365 so với Tháng tròn / 12</div>
                    <div className="mt-1.5 text-lg font-semibold tabular-nums text-white">
                      {diffDaysVsMonths >= 0 ? `+${vnd(diffDaysVsMonths)}` : `-${vnd(Math.abs(diffDaysVsMonths))}`}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {diffDaysVsMonths === 0
                        ? 'Hai phương pháp cho kết quả bằng nhau ở kỳ hạn 365 ngày.'
                        : 'Do số ngày thực tế của kỳ hạn khác với tỷ lệ tháng/12.'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <div className="text-xs text-zinc-500">Lãi kép hàng tháng so với Ngày thực tế / 365</div>
                    <div className="mt-1.5 text-lg font-semibold tabular-nums text-emerald-300">
                      +{vnd(diffCompoundVsDays)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Phần lãi tăng thêm nhờ tái tục lãi hàng tháng vào tiền gốc.
                    </div>
                  </div>
                </div>
              </Card>

              <Callout icon={Info} tone="brand">
                <strong>Cơ sở Thông tư 14/2017/TT-NHNN:</strong> Các ngân hàng tại Việt Nam niêm yết lãi suất năm dựa trên
                cơ sở <strong>365 ngày</strong>. Khi gửi kỳ hạn ngắn (ví dụ 1 tháng = 30 ngày), số tiền lãi thực nhận được
                tính tự động theo số ngày thực gửi qua máy chủ tính toán bảo mật của VnSavingPro.
              </Callout>

              {/* Partial Early Withdrawal Simulator */}
              <Card className="p-5 sm:p-6">
                <CardHeader
                  title="Mô phỏng rút trước hạn: Rút toàn bộ vs. Rút gốc một phần"
                  description="Nếu bạn cần tiền mặt đột xuất giữa kỳ hạn, việc chọn ngân hàng cho phép rút gốc từng phần (Cake, LioBank) hoặc chia nhỏ sổ (Timo) giúp giữ nguyên lãi suất có kỳ hạn cho phần vốn còn lại."
                  right={
                    <Badge tone="brand">
                      <Scissors className="size-3" /> Bảo vệ tiền lãi
                    </Badge>
                  }
                />

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-4 rounded-xl bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <MoneyField
                      label="Số tiền cần rút sớm"
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
                      label="Thời điểm phát sinh rút sớm"
                      display={`Sau ${Math.min(days, daysHeld)} / ${days} ngày`}
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
                        <Badge tone="danger">Tất toán toàn bộ sổ</Badge>
                        <div className="mt-2 text-xs text-zinc-400">
                          Toàn bộ {compact(principal)} bị tính lãi không kỳ hạn ({pct(earlySim.nonTermRate, 1)}/năm) cho{' '}
                          {earlySim.daysHeld} ngày.
                        </div>
                      </div>
                      <div className="mt-4 border-t border-white/[0.06] pt-3">
                        <div className="text-xs text-zinc-500">Tổng lãi nhận được</div>
                        <div className="mt-0.5 text-xl font-semibold tabular-nums text-red-300">
                          +{vnd(earlySim.fullEarlyInterest)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl bg-emerald-500/[0.06] p-4 ring-1 ring-inset ring-emerald-400/25">
                      <div>
                        <Badge tone="success">Rút gốc một phần / Chia sổ</Badge>
                        <div className="mt-2 text-xs text-zinc-400">
                          Chỉ {compact(earlySim.withdrawAmount)} chịu lãi {pct(earlySim.nonTermRate, 1)}; phần còn lại{' '}
                          <strong className="text-white">{compact(earlySim.remainingPrincipal)}</strong> giữ nguyên lãi{' '}
                          {pct(rate)} đến cuối kỳ.
                        </div>
                      </div>
                      <div className="mt-4 border-t border-white/[0.06] pt-3">
                        <div className="text-xs text-zinc-500">Tổng lãi nhận được</div>
                        <div className="mt-0.5 text-xl font-semibold tabular-nums text-emerald-300">
                          +{vnd(earlySim.partialTotalInterest)}
                        </div>
                        <div className="mt-1 text-xs font-medium text-emerald-400">
                          Giữ lại được +{vnd(earlySim.interestSavedByPartial)} tiền lãi
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <RateDisclaimer />

              <FeedbackWidget
                toolId="calculator"
                toolLabel="Tính lãi tiết kiệm"
                snapshot={{ principal, bankId, tenure, rate, days, m1Interest: m1.interest }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky live summary bar */}
      <div className="print-hidden fixed inset-x-3 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
        <button
          type="button"
          onClick={() => document.getElementById('calculator-results')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-400/25 bg-elevated/95 px-4 py-2.5 text-left shadow-2xl backdrop-blur"
        >
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-400">
              {bank.name} · {TENURE_LABELS[tenure]} ({pct(rate)})
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-white">
              Lãi TT14: <span className="text-emerald-300">+{compact(m1.interest)}</span> · Tổng {compact(m1.total)}
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
