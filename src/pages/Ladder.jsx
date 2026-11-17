import React, { useMemo, useState } from 'react';
import { Layers, Coins, PiggyBank, Wallet } from 'lucide-react';
import { useRates } from '../state.jsx';
import { simulateLadderingMatrix } from '../utils/calculator.js';
import { chip, compact, fmt, pct, vnd } from '../utils/format.js';
import {
  Badge,
  Card,
  CardHeader,
  MoneyField,
  PageHeader,
  SliderField,
  Stat,
  Table,
  cx,
} from '../components/ui.jsx';
import { BankPicker } from '../components/BankPicker.jsx';

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

export default function Ladder() {
  const { banks, getRate } = useRates();

  const [monthlySavings, setMonthlySavings] = useState(5_000_000);
  const [totalMonths, setTotalMonths] = useState(12);
  const [bankId, setBankId] = useState('tnex');
  const [strategy, setStrategy] = useState('SPLIT_50_50');
  const [shortTerm, setShortTerm] = useState('1M');
  const [longTerm, setLongTerm] = useState('12M');
  const [shortPct, setShortPct] = useState(40);

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
      { term: longTerm, percent: 100 - shortPct, rate: bankRates[longTerm] || 6.5 },
    ],
    [shortTerm, longTerm, shortPct, bankRates]
  );

  const result = useMemo(
    () =>
      simulateLadderingMatrix({
        monthlySavings,
        strategy,
        customAllocations,
        totalMonths,
        bankRates,
      }),
    [monthlySavings, strategy, customAllocations, totalMonths, bankRates]
  );

  const totalDeposited = monthlySavings * totalMonths;
  const totalInterest = Math.max(0, result.finalPortfolioValue - totalDeposited);
  const activeStrategy = STRATEGIES.find((s) => s.id === strategy) || STRATEGIES[0];
  const splitLabel =
    strategy === 'CUSTOM'
      ? `${shortPct}% ${shortTerm.replace('M', 'T')} · ${100 - shortPct}% ${longTerm.replace('M', 'T')}`
      : activeStrategy.split;

  return (
    <>
      <PageHeader
        icon={Layers}
        eyebrow="Chiến lược bậc thang"
        title="Tiết kiệm bậc thang (Savings Ladder)"
        description="Thay vì dồn hết tiền vào một sổ dài hạn dễ mất lãi khi cần rút gấp, hãy chia nhỏ khoản gửi hàng tháng vào nhiều kỳ hạn xoay vòng."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Controls */}
        <Card className="space-y-6 p-5 sm:p-6">
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

          <SliderField
            label="Thời gian mô phỏng"
            display={`${totalMonths} tháng (${(totalMonths / 12).toFixed(1)} năm)`}
            value={totalMonths}
            onChange={setTotalMonths}
            min={6}
            max={60}
            step={3}
          />

          <div className="border-t border-white/[0.06] pt-5">
            <BankPicker bankId={bankId} onBank={setBankId} tenure="6M" label="Chọn ngân hàng áp dụng lãi suất" />
          </div>

          <div className="space-y-2.5 border-t border-white/[0.06] pt-5">
            <div className="text-[13px] font-medium text-zinc-300">Chiến lược phân bổ sổ</div>
            {STRATEGIES.map((s) => {
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

            {strategy === 'CUSTOM' && (
              <div className="mt-3 space-y-4 rounded-xl bg-black/25 p-4 ring-1 ring-inset ring-white/[0.08]">
                <div className="grid grid-cols-2 gap-3">
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

        {/* Results */}
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              icon={Coins}
              label="Tổng tài sản cuối kỳ"
              value={compact(result.finalPortfolioValue)}
              hint={vnd(result.finalPortfolioValue)}
            />
            <Stat
              icon={Wallet}
              label="Tổng gốc đã nộp"
              value={compact(totalDeposited)}
              hint={`${totalMonths} tháng × ${compact(monthlySavings)}`}
            />
            <Stat
              icon={PiggyBank}
              label="Lãi thụ động ước tính / tháng"
              tone="emerald"
              value={`+${vnd(result.finalMonthlyYield)}`}
              hint={`Tổng lãi đã đáo hạn: +${compact(totalInterest)}`}
            />
          </div>

          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Bảng dòng tiền xoay vòng từng tháng"
              description={`Mô phỏng tại ${bank.name} (1T: ${pct(bankRates['1M'])}, 3T: ${pct(bankRates['3M'])}, 6T: ${pct(bankRates['6M'])}) — ${activeStrategy.title}.`}
            />

            <Table
              className="mt-5 max-h-[520px]"
              head={[
                'Tháng',
                'Gửi thêm',
                'Tỷ lệ chia',
                'Sổ đang chạy',
                'Vốn đáo hạn',
                'Lãi đáo hạn',
                'Tổng danh mục',
              ]}
            >
              {result.timelineRows.map((row) => (
                <tr key={row.monthIndex} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-white">{row.month}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.monthlyContribution)}</td>
                  <td className="px-4 py-3 text-right text-xs text-zinc-500">{splitLabel}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone="neutral">{row.activePackagesCount} sổ</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    {row.totalMaturedThisMonth > 0 ? fmt(row.totalMaturedThisMonth) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-300">
                    {row.totalInterestMaturedThisMonth > 0 ? `+${fmt(row.totalInterestMaturedThisMonth)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{fmt(row.totalPortfolioValue)}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
