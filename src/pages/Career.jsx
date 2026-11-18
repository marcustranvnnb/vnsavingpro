import React, { useMemo, useState } from 'react';
import { Briefcase, Sparkles } from 'lucide-react';
import { useRates } from '../state.jsx';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { chip, compact, fmt, pct, vnd } from '../utils/format.js';
import {
  Badge,
  Card,
  CardHeader,
  MoneyField,
  PageHeader,
  Progress,
  SliderField,
  Table,
  cx,
} from '../components/ui.jsx';
import { BankPicker } from '../components/BankPicker.jsx';

const OPTIONS = [
  {
    id: 'FIXED_RAISE',
    title: 'Tăng lương định kỳ (+2 triệu/năm)',
    desc: 'Mỗi năm lương tăng đều đặn 2.000.000 ₫/tháng.',
    tag: 'Ổn định',
  },
  {
    id: 'PERCENT_RAISE',
    title: 'Tăng lương 10% mỗi năm',
    desc: 'Mỗi năm lương tăng thêm 10% dựa trên mức lương năm trước.',
    tag: 'Tăng trưởng đều',
  },
  {
    id: 'JOB_HOPPING',
    title: 'Nhảy việc bứt phá (+30% mỗi 2 năm)',
    desc: 'Mỗi 2 năm chuyển việc hoặc thăng chức với mức tăng thu nhập 30%.',
    tag: 'Bứt phá nhanh',
  },
];

const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v) }));

const EMPTY_CAREER_RES = {
  requiredPrincipal: 0,
  monthsToGoal: 0,
  yearsToGoal: 0,
  finalMonthlySalary: 0,
  annualLog: [],
};

const INITIAL_CAREER_DATA = {
  results: {
    FIXED_RAISE: EMPTY_CAREER_RES,
    PERCENT_RAISE: EMPTY_CAREER_RES,
    JOB_HOPPING: EMPTY_CAREER_RES,
  },
};

export default function Career() {
  const { banks, getRate } = useRates();
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const initialBankId = saved.bankId || 'cake';
  const initialTenure = saved.tenure || '12M';
  const initialBank = banks.find((b) => b.id === initialBankId) || banks[0];
  const initialRate =
    saved.customRate !== '' && Number(saved.customRate) > 0
      ? Number(saved.customRate)
      : getRate(initialBank, initialTenure) || 6.9;

  const [salary, setSalary] = useState(() => Number(saved.salary) || 30_000_000);
  const [savingsRate, setSavingsRate] = useState(20);
  const [targetIncome, setTargetIncome] = useState(() => Number(saved.target) || 10_000_000);
  const [bankId, setBankId] = useState(initialBankId);
  const [tenure, setTenure] = useState(initialTenure);
  const [annualRate, setAnnualRate] = useState(initialRate);
  const [selected, setSelected] = useState('JOB_HOPPING');

  const handleBankChange = (nextBankId) => {
    setBankId(nextBankId);
    const b = banks.find((x) => x.id === nextBankId) || banks[0];
    setAnnualRate(getRate(b, tenure) || 6.0);
  };

  const handleTenureChange = (nextTenure) => {
    setTenure(nextTenure);
    const b = banks.find((x) => x.id === bankId) || banks[0];
    setAnnualRate(getRate(b, nextTenure) || 6.0);
  };

  const careerPayload = useMemo(
    () => ({
      currentSalary: salary,
      savingsRatePercent: savingsRate,
      targetMonthlyInterest: targetIncome,
      annualInterestRate: annualRate,
    }),
    [salary, savingsRate, targetIncome, annualRate]
  );

  const { data: careerBundle, loading } = useServerCalc('career', careerPayload, INITIAL_CAREER_DATA);

  const results = useMemo(
    () =>
      OPTIONS.map((opt) => ({
        ...opt,
        res: careerBundle.results?.[opt.id] || EMPTY_CAREER_RES,
      })),
    [careerBundle]
  );

  const active = results.find((r) => r.id === selected) || results[0];

  return (
    <>
      <PageHeader
        icon={Briefcase}
        eyebrow="Sự nghiệp & tiết kiệm"
        title="Lộ trình tăng lương rút ngắn đường tới tự do tài chính"
        description="Khi thu nhập tăng lên nhưng bạn vẫn giữ nguyên tỷ lệ tiết kiệm (% lương), số tiền gửi thêm mỗi tháng sẽ tăng theo cấp số nhân."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Controls */}
        <Card className="space-y-6 p-5 sm:p-6">
          <MoneyField
            label="Mức lương hiện tại / tháng"
            value={salary}
            onChange={setSalary}
            min={5_000_000}
            max={150_000_000}
            step={1_000_000}
            inputMax={1_000_000_000}
            presets={presets([15_000_000, 25_000_000, 35_000_000, 50_000_000])}
          />

          <SliderField
            label="Tỷ lệ trích lương tiết kiệm"
            display={`${savingsRate}% (${compact((salary * savingsRate) / 100)}/tháng)`}
            value={savingsRate}
            onChange={setSavingsRate}
            min={5}
            max={60}
            step={5}
          />

          <MoneyField
            label="Mục tiêu lãi thụ động / tháng"
            value={targetIncome}
            onChange={setTargetIncome}
            min={2_000_000}
            max={50_000_000}
            step={1_000_000}
            inputMax={500_000_000}
            presets={presets([5_000_000, 10_000_000, 20_000_000, 30_000_000])}
          />

          <div className="space-y-4 border-t border-white/[0.06] pt-5">
            <BankPicker
              bankId={bankId}
              onBank={handleBankChange}
              tenure={tenure}
              onTenure={handleTenureChange}
            />
            <SliderField
              label="Lãi suất tiết kiệm kỳ vọng"
              display={`${pct(annualRate, 1)}/năm`}
              value={annualRate}
              onChange={setAnnualRate}
              min={4}
              max={12}
              step={0.1}
            />
          </div>
        </Card>

        {/* Results */}
        <div className={cx('min-w-0 space-y-5 transition-opacity', loading && 'opacity-75')}>
          {/* 3 Career Strategy Cards */}
          <div className="grid gap-3 md:grid-cols-3">
            {results.map((item) => {
              const isSelected = item.id === selected;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.id)}
                  className={cx(
                    'flex flex-col justify-between rounded-2xl border p-5 text-left transition-all',
                    isSelected
                      ? 'border-indigo-400/40 bg-indigo-500/[0.08]'
                      : 'border-white/[0.07] bg-surface hover:border-white/[0.14]'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={isSelected ? 'brand' : 'neutral'}>{item.tag}</Badge>
                      {item.id === 'JOB_HOPPING' && <Sparkles className="size-3.5 text-emerald-400" />}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.desc}</p>
                  </div>

                  <div className="mt-5 border-t border-white/[0.06] pt-3">
                    <div className="text-xs text-zinc-500">Thời gian đạt {compact(targetIncome)}/tháng</div>
                    <div className="mt-0.5 text-2xl font-semibold tracking-tight text-white tabular-nums">
                      {item.res.yearsToGoal} năm
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Lương khi về đích: <span className="text-zinc-300">{compact(item.res.finalMonthlySalary)}/th</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Annual table for selected option */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={`Lộ trình từng năm — ${active.title}`}
              description={`Vốn mục tiêu cần tích luỹ: ${vnd(active.res.requiredPrincipal)} (lãi suất ${pct(annualRate, 1)}/năm).`}
            />

            <Table
              className="mt-5 max-h-[480px]"
              head={['Năm', 'Lương / tháng', 'Tiết kiệm / tháng', 'Tổng tài sản', 'Lãi thụ động / tháng', 'Tiến độ']}
            >
              {active.res.annualLog.map((row) => {
                const progress = Math.min(100, Math.round((row.monthlyPassiveYield / targetIncome) * 100));
                const reached = row.monthlyPassiveYield >= targetIncome;
                return (
                  <tr key={row.year} className={reached ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/[0.02]'}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                      Năm {row.year}
                      {reached && <Badge tone="success" className="ml-2">Đạt mục tiêu</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.monthlySalary)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">{fmt(row.monthlySavings)}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmt(row.totalBalance)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-300">
                      {fmt(row.monthlyPassiveYield)}
                    </td>
                    <td className="w-36 px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={progress} tone={reached ? 'emerald' : 'indigo'} className="w-16" />
                        <span className="w-9 text-right text-xs text-zinc-400">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
