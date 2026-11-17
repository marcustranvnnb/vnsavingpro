import React, { useMemo, useState } from 'react';
import { Calculator as CalcIcon, CheckCircle2, Info, Scissors } from 'lucide-react';
import { useRates } from '../state.jsx';
import { TENURE_DAYS_MAP, TENURE_LABELS } from '../data/banksData.js';
import { calculateEarlyWithdrawalComparison } from '../utils/calculator.js';
import { chip, compact, fmt, pct, vnd } from '../utils/format.js';
import {
  Badge,
  Callout,
  Card,
  CardHeader,
  DecimalInput,
  MoneyField,
  NumberInput,
  PageHeader,
  SliderField,
  cx,
} from '../components/ui.jsx';
import { BankPicker } from '../components/BankPicker.jsx';

const TENURES = ['1M', '3M', '6M', '9M', '12M', '18M', '24M', '36M'];

const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v) }));

export default function Calculator() {
  const { banks, getRate } = useRates();

  const [principal, setPrincipal] = useState(100_000_000);
  const [bankId, setBankId] = useState('tnex');
  const [tenure, setTenure] = useState('12M');
  const [customRate, setCustomRate] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(30_000_000);
  const [daysHeld, setDaysHeld] = useState(180);

  const bank = banks.find((b) => b.id === bankId) || banks[0];
  const rate = customRate !== '' && Number(customRate) > 0 ? Number(customRate) : getRate(bank, tenure) || 6;

  const months = parseInt(tenure, 10) || 12;
  const defaultDays = TENURE_DAYS_MAP[tenure] || 365;
  const days = customDays !== '' && Number(customDays) > 0 ? Number(customDays) : defaultDays;

  const earlySim = useMemo(
    () =>
      calculateEarlyWithdrawalComparison({
        principal,
        ratePercent: rate,
        totalDays: days,
        withdrawAmount: Math.min(principal, withdrawAmount),
        daysHeld: Math.min(days, daysHeld),
        nonTermRate: 0.5,
      }),
    [principal, rate, days, withdrawAmount, daysHeld]
  );

  // 1. Actual days / 365 (Circular 14/2017/TT-NHNN)
  const m1Interest = Math.round((principal * (rate / 100) * days) / 365);
  const m1Monthly = Math.round(m1Interest / months);
  const m1Total = principal + m1Interest;

  // 2. Nominal months / 12
  const m2Interest = Math.round((principal * (rate / 100) * months) / 12);
  const m2Monthly = Math.round(m2Interest / months);
  const m2Total = principal + m2Interest;

  // 3. Monthly compounding
  const m3Total = Math.round(principal * Math.pow(1 + rate / 100 / 12, months));
  const m3Interest = m3Total - principal;
  const m3Monthly = Math.round(m3Interest / months);

  const methods = [
    {
      id: 'actual',
      badge: 'Chuẩn NHNN (TT 14)',
      tone: 'success',
      title: 'Ngày thực tế / 365',
      formula: `${fmt(principal)} × ${pct(rate)} × ${days} ngày ÷ 365`,
      interest: m1Interest,
      monthly: m1Monthly,
      total: m1Total,
      desc: 'Áp dụng tại hầu hết ngân hàng Việt Nam theo Thông tư 14/2017/TT-NHNN (tính trên cơ sở 1 năm = 365 ngày).',
      highlight: true,
    },
    {
      id: 'nominal',
      badge: 'Tháng tròn',
      tone: 'neutral',
      title: 'Tháng tròn / 12',
      formula: `${fmt(principal)} × ${pct(rate)} × ${months} tháng ÷ 12`,
      interest: m2Interest,
      monthly: m2Monthly,
      total: m2Total,
      desc: 'Cách ước tính nhẩm nhanh bằng cách chia đều 12 tháng. Thường lệch nhẹ ở các kỳ hạn 1–6 tháng (30 ngày/tháng).',
    },
    {
      id: 'compound',
      badge: 'Tái tục hàng tháng',
      tone: 'brand',
      title: 'Lãi kép hàng tháng',
      formula: `${fmt(principal)} × (1 + ${pct(rate)} ÷ 12)^${months}`,
      interest: m3Interest,
      monthly: m3Monthly,
      total: m3Total,
      desc: 'Áp dụng khi tiền lãi mỗi tháng được tự động cộng dồn vào gốc để tính lãi cho tháng kế tiếp.',
    },
  ];

  const diffDaysVsMonths = m1Interest - m2Interest;
  const diffCompoundVsDays = m3Interest - m1Interest;

  return (
    <>
      <PageHeader
        icon={CalcIcon}
        eyebrow="Công cụ tính lãi"
        title="Tính lãi tiết kiệm & so sánh 3 cách tính"
        description="Cùng một khoản tiền gửi và lãi suất, cách tính theo ngày thực tế (365 ngày), tháng tròn (12 tháng) và lãi kép cho kết quả khác nhau như thế nào?"
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left controls */}
        <Card className="space-y-6 p-5 sm:p-6">
          <MoneyField
            label="Số tiền gửi tiết kiệm"
            value={principal}
            onChange={setPrincipal}
            min={1_000_000}
            max={2_000_000_000}
            step={5_000_000}
            inputMax={100_000_000_000}
            presets={presets([10_000_000, 50_000_000, 100_000_000, 500_000_000, 1_000_000_000])}
          />

          <div className="border-t border-white/[0.06] pt-5">
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

          <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Lãi suất tuỳ chỉnh</label>
              <DecimalInput
                value={customRate}
                onChange={setCustomRate}
                suffix="%/năm"
                min={0.1}
                max={25}
                step={0.1}
                ariaLabel="Lãi suất tuỳ chỉnh"
              />
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
        </Card>

        {/* Right results */}
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {methods.map((m) => (
              <Card
                key={m.id}
                className={cx(
                  'flex flex-col justify-between p-5',
                  m.highlight && 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] to-surface'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={m.tone}>{m.badge}</Badge>
                    {m.highlight && <CheckCircle2 className="size-4 text-emerald-400" />}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">{m.title}</h3>
                  <div className="mt-2 rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.05]">
                    {m.formula}
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
            <strong>Lưu ý thực tế:</strong> Theo Thông tư 14/2017/TT-NHNN của Ngân hàng Nhà nước, các ngân hàng thương
            mại và ngân hàng số tại Việt Nam niêm yết lãi suất năm dựa trên cơ sở <strong>365 ngày</strong>. Khi gửi kỳ
            hạn ngắn (ví dụ 1 tháng = 30 ngày), số tiền lãi thực nhận sẽ tính theo công thức{' '}
            <code className="text-indigo-200">Gốc × Lãi suất × Số ngày thực gửi / 365</code>.
          </Callout>

          {/* Partial Early Withdrawal Simulator (v1.2 Feature) */}
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
        </div>
      </div>
    </>
  );
}
