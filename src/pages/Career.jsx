import React, { useMemo, useState } from 'react';
import { Briefcase, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
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
  Segmented,
  SliderField,
  Table,
  cx,
} from '../components/ui.jsx';
import { HouseholdModeSwitch } from '../components/HouseholdModeSwitch.jsx';
import { BankPicker } from '../components/BankPicker.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';

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
  const { lang, tx } = useI18n();
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const initialBankId = saved.bankId || 'cake';
  const initialTenure = saved.tenure || '12M';
  const initialBank = banks.find((b) => b.id === initialBankId) || banks[0];
  const initialRate =
    saved.customRate !== '' && Number(saved.customRate) > 0
      ? Number(saved.customRate)
      : getRate(initialBank, initialTenure) || 6.9;

  const [householdMode, setHouseholdMode] = useState(() =>
    ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(saved.householdMode) ? saved.householdMode : 'INDIVIDUAL'
  );
  const [salary, setSalary] = useState(() => Number(saved.salaryFullTime) || Number(saved.salary) || 25_000_000);
  const [partnerSalary, setPartnerSalary] = useState(() => Number(saved.partnerSalaryFullTime) || 20_000_000);
  const [partnerGrowthMode, setPartnerGrowthMode] = useState('SAME');
  const [savingsRate, setSavingsRate] = useState(20);
  const [targetIncome, setTargetIncome] = useState(() => Number(saved.target) || 10_000_000);
  const [bankId, setBankId] = useState(initialBankId);
  const [tenure, setTenure] = useState(initialTenure);
  const [annualRate, setAnnualRate] = useState(initialRate);
  const [selected, setSelected] = useState('JOB_HOPPING');
  const hasPartner = householdMode === 'COUPLE' || householdMode === 'FAMILY';
  const combinedSalary = salary + (hasPartner ? partnerSalary : 0);

  const presets = (arr) => arr.map((v) => ({ value: v, label: v === 0 ? '0 ₫' : chip(v, lang) }));

  const optionsList = useMemo(
    () => [
      {
        id: 'FIXED_RAISE',
        title: tx('Tăng lương định kỳ (+2 triệu/năm)', 'Fixed Raise (+2M VND / year)', '定額昇給（毎年 +200万VND）'),
        desc: tx(
          'Mỗi năm lương tăng đều đặn 2.000.000 ₫/tháng.',
          'Monthly salary grows steadily by +2,000,000 VND each year.',
          '毎月給与が毎年一定額 +2,000,000 VND ずつ増加するシナリオ。'
        ),
        tag: tx('Ổn định', 'Steady', '安定成長'),
      },
      {
        id: 'PERCENT_RAISE',
        title: tx('Tăng lương 10% mỗi năm', 'Percentage Raise (+10% / year)', '定率昇給（毎年 +10%）'),
        desc: tx(
          'Mỗi năm lương tăng thêm 10% dựa trên mức lương năm trước.',
          'Annual salary compounds by +10% based on prior year salary.',
          '前年の給与に対して毎年10%ずつ複利的に昇給するシナリオ。'
        ),
        tag: tx('Tăng trưởng đều', 'Compounding', '堅実成長'),
      },
      {
        id: 'JOB_HOPPING',
        title: tx('Nhảy việc bứt phá (+30% mỗi 2 năm)', 'Job Hopping (+30% / 2 years)', 'キャリア転職（2年ごとに +30%）'),
        desc: tx(
          'Mỗi 2 năm chuyển việc hoặc thăng chức với mức tăng thu nhập 30%.',
          'Promotion or strategic role move every 2 years with a +30% salary jump.',
          '2年ごとの転職・昇進で給与水準が30%アップする積極シナリオ。'
        ),
        tag: tx('Bứt phá nhanh', 'Fastest', '最速達成'),
      },
    ],
    [tx]
  );

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
      partnerSalary: hasPartner ? partnerSalary : 0,
      partnerGrowthMode,
      savingsRatePercent: savingsRate,
      targetMonthlyInterest: targetIncome,
      annualInterestRate: annualRate,
    }),
    [salary, hasPartner, partnerSalary, partnerGrowthMode, savingsRate, targetIncome, annualRate]
  );

  const { data: careerBundle, loading } = useServerCalc('career', careerPayload, INITIAL_CAREER_DATA);

  const results = useMemo(
    () =>
      optionsList.map((opt) => ({
        ...opt,
        res: careerBundle.results?.[opt.id] || EMPTY_CAREER_RES,
      })),
    [optionsList, careerBundle]
  );

  const active = results.find((r) => r.id === selected) || results[0];

  return (
    <>
      <PageHeader
        icon={Briefcase}
        eyebrow={tx('Sự nghiệp & tiết kiệm', 'Career & Income Growth', 'キャリア収入成長')}
        title={tx(
          'Lộ trình tăng lương rút ngắn đường tới tự do tài chính',
          'How Salary Growth Accelerates Financial Freedom',
          '昇給・キャリアアップで目標達成をどれだけ早められるか'
        )}
        description={tx(
          'Khi thu nhập tăng lên nhưng bạn vẫn giữ nguyên tỷ lệ tiết kiệm (% lương), số tiền gửi thêm mỗi tháng sẽ tăng theo cấp số nhân.',
          'When your income rises while you keep a steady savings rate (% of salary), monthly compound deposits accelerate dramatically.',
          '貯蓄率（%）を維持したまま収入が増えると、毎月の積立額が雪だるま式に増加し目標達成が大きく前倒しされます。'
        )}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Controls */}
        <Card className="space-y-6 p-5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="space-y-2">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
              {tx('Hồ sơ tài chính', 'Financial Profile', '世帯モデル')}
            </span>
            <HouseholdModeSwitch value={householdMode} onChange={setHouseholdMode} compact />
          </div>

          <MoneyField
            label={
              hasPartner
                ? tx('Lương Người 1 (Bạn) / tháng', 'Earner 1 Salary (You) / month', '1人目（あなた）の月収')
                : tx('Mức lương hiện tại / tháng', 'Current Monthly Salary', '現在の月収')
            }
            value={salary}
            onChange={setSalary}
            min={5_000_000}
            max={150_000_000}
            step={1_000_000}
            inputMax={1_000_000_000}
            presets={presets([15_000_000, 25_000_000, 35_000_000, 50_000_000])}
          />

          {hasPartner && (
            <div className="space-y-4 rounded-xl border border-sky-400/20 bg-sky-500/[0.04] p-3.5">
              <MoneyField
                label={tx('Lương Người 2 (Bạn đời) / tháng', 'Earner 2 Salary (Partner) / month', '2人目（パートナー）の月収')}
                value={partnerSalary}
                onChange={setPartnerSalary}
                min={0}
                max={150_000_000}
                step={1_000_000}
                inputMax={1_000_000_000}
                presets={presets([0, 15_000_000, 25_000_000, 40_000_000])}
              />
              <div className="space-y-1.5">
                <span className="block text-[11px] font-medium text-zinc-300">
                  {tx('Kịch bản tăng lương áp dụng cho', 'Apply salary growth to', '昇給シミュレーション対象')}
                </span>
                <Segmented
                  size="sm"
                  value={partnerGrowthMode}
                  onChange={setPartnerGrowthMode}
                  options={[
                    { value: 'SAME', label: tx('Cả 2 cùng tăng', 'Both Earners Grow', '2人とも昇給') },
                    { value: 'STATIC', label: tx('Chỉ Người 1 tăng', 'Earner 1 Only', '1人目のみ昇給') },
                  ]}
                />
              </div>
            </div>
          )}

          <SliderField
            label={tx('Tỷ lệ trích lương tiết kiệm', 'Monthly Savings Rate', '給与からの貯蓄率')}
            display={`${savingsRate}% (${compact((combinedSalary * savingsRate) / 100, lang)}${tx('/tháng', '/mo', '/月')})`}
            value={savingsRate}
            onChange={setSavingsRate}
            min={5}
            max={60}
            step={5}
          />

          <MoneyField
            label={tx('Mục tiêu lãi thụ động / tháng', 'Target Monthly Passive Income', '毎月の目標不労所得')}
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
              label={tx('Lãi suất tiết kiệm kỳ vọng', 'Expected Annual Savings Rate', '想定預金金利（年率）')}
              display={`${pct(annualRate, 1, lang)}${tx('/năm', '/yr', '/年')}`}
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    <div className="text-xs text-zinc-500">
                      {tx(
                        `Thời gian đạt ${compact(targetIncome, lang)}/tháng`,
                        `Time to reach ${compact(targetIncome, lang)}/mo`,
                        `${compact(targetIncome, lang)}/月 達成期間`
                      )}
                    </div>
                    <div className="mt-0.5 text-2xl font-semibold tracking-tight text-white tabular-nums">
                      {item.res.yearsToGoal} {tx('năm', 'yrs', '年')}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {tx('Lương khi về đích:', 'Salary at goal:', '達成時の月収：')}{' '}
                      <span className="text-zinc-300">
                        {compact(item.res.finalMonthlySalary, lang)}
                        {tx('/th', '/mo', '/月')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Annual table for selected option */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={tx(`Lộ trình từng năm — ${active.title}`, `Year-by-Year Path — ${active.title}`, `年別推移 — ${active.title}`)}
              description={tx(
                `Vốn mục tiêu cần tích luỹ: ${vnd(active.res.requiredPrincipal, lang)} (lãi suất ${pct(annualRate, 1, lang)}/năm).`,
                `Target capital needed: ${vnd(active.res.requiredPrincipal, lang)} (at ${pct(annualRate, 1, lang)}/yr).`,
                `必要な目標元本：${vnd(active.res.requiredPrincipal, lang)}（年利 ${pct(annualRate, 1, lang)}）。`
              )}
            />

            <Table
              className="mt-5 max-h-[480px]"
              head={[
                tx('Năm', 'Year', '年次'),
                tx('Lương / tháng', 'Salary / Mo', '月収'),
                tx('Tiết kiệm / tháng', 'Savings / Mo', '毎月積立'),
                tx('Tổng tài sản', 'Total Assets', '総資産'),
                tx('Lãi thụ động / tháng', 'Passive Yield / Mo', '毎月不労所得'),
                tx('Tiến độ', 'Progress', '進捗'),
              ]}
            >
              {active.res.annualLog.map((row) => {
                const progress = Math.min(100, Math.round((row.monthlyPassiveYield / targetIncome) * 100));
                const reached = row.monthlyPassiveYield >= targetIncome;
                return (
                  <tr key={row.year} className={reached ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/[0.02]'}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                      {tx(`Năm ${row.year}`, `Year ${row.year}`, `${row.year}年目`)}
                      {reached && (
                        <Badge tone="success" className="ml-2">
                          {tx('Đạt mục tiêu', 'Goal Reached', '目標達成')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">{fmt(row.monthlySalary, lang)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">{fmt(row.monthlySavings, lang)}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmt(row.totalBalance, lang)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-300">
                      {fmt(row.monthlyPassiveYield, lang)}
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

          <FeedbackWidget
            toolId="career"
            toolLabel={tx('Lộ trình tăng lương', 'Career Growth Simulator', '昇給ロードマップ')}
            snapshot={{ salary, savingsRate, targetIncome, annualRate, selected, yearsToGoal: active.res.yearsToGoal }}
          />
        </div>
      </div>
    </>
  );
}
