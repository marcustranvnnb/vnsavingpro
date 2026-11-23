import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Baby,
  Briefcase,
  CheckCircle2,
  Landmark,
  Receipt,
  Scale,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { AdaptiveGrid, WorkspaceSplit } from '../components/AdaptiveLayout.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import { SavePlanPromptCard } from '../components/SavePlanPromptCard.jsx';
import {
  Badge,
  Button,
  CalculationLoader,
  Callout,
  Card,
  CardHeader,
  Chip,
  MoneyField,
  NumberInput,
  PageHeader,
  Segmented,
  Stat,
  Table,
  cx,
} from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate, useToast } from '../state.jsx';
import {
  consumeToolRestoreState,
  loadSavedPlannerState,
  loadSavedSalaryState,
  recordToolRun,
  saveSalaryState,
  useServerCalc,
} from '../utils/apiClient.js';
import { cryptoStorage } from '../utils/cryptoStorage.js';
import { chip, compact, fmt, vnd } from '../utils/format.js';

const DEFAULT_SALARY_STATE = {
  mode: 'GROSS_TO_NET',
  amount: 30_000_000,
  partnerAmount: 0,
  householdMode: 'INDIVIDUAL',
  region: 1,
  dependents: 0,
  regime: '2026_H2',
  insuranceBaseMode: 'FULL',
  customInsuranceBase: 15_000_000,
  taxExemptAllowance: 0,
  includeUnionFee: false,
};

const INITIAL_SALARY_RESULT = {
  mode: 'GROSS_TO_NET',
  primary: {
    regimeId: '2026_H2',
    effectiveLabel: '01/07/2026 – 31/12/2026',
    pitLegalRef: 'Luật Thuế TNCN 109/2025/QH15 (5 bậc) & NQ 110/2025/UBTVQH15',
    bhxhLegalRef: 'Luật BHXH 41/2024/QH15 · NĐ 161/2026/NĐ-CP · NĐ 293/2025/NĐ-CP',
    gross: 30_000_000,
    net: 26_215_000,
    region: 1,
    regionalMinWage: 5_310_000,
    referenceSalary: 2_530_000,
    bhxhCap: 50_600_000,
    bhtnCap: 106_200_000,
    bhxhSalaryBase: 30_000_000,
    bhtnSalaryBase: 30_000_000,
    employee: {
      bhxh: 2_400_000,
      bhyt: 450_000,
      bhtn: 300_000,
      totalInsurance: 3_150_000,
      personalDeduction: 15_500_000,
      dependentDeduction: 0,
      totalFamilyDeductions: 15_500_000,
      incomeBeforeTax: 26_850_000,
      taxableIncome: 11_350_000,
      pit: 635_000,
      brackets: [
        { bracket: 1, from: 0, to: 10_000_000, ratePct: 5, taxableSlice: 10_000_000, taxAmount: 500_000 },
        { bracket: 2, from: 10_000_000, to: 30_000_000, ratePct: 10, taxableSlice: 1_350_000, taxAmount: 135_000 },
        { bracket: 3, from: 30_000_000, to: 60_000_000, ratePct: 20, taxableSlice: 0, taxAmount: 0 },
        { bracket: 4, from: 60_000_000, to: 100_000_000, ratePct: 30, taxableSlice: 0, taxAmount: 0 },
        { bracket: 5, from: 100_000_000, to: null, ratePct: 35, taxableSlice: 0, taxAmount: 0 },
      ],
      effectiveTaxRatePct: 2.12,
    },
    employer: {
      bhxh: 5_250_000,
      bhyt: 900_000,
      bhtn: 300_000,
      unionFee: 0,
      totalContributions: 6_450_000,
      totalCost: 36_450_000,
    },
  },
  partner: null,
  householdSummary: {
    householdMode: 'INDIVIDUAL',
    combinedGross: 30_000_000,
    combinedNet: 26_215_000,
    combinedPit: 635_000,
    suggestedMonthlySaving30Pct: 7_864_500,
  },
  comparisonVs2025: {
    pit2025: 1_627_500,
    pit2026: 635_000,
    net2025: 25_222_500,
    net2026: 26_215_000,
    pitSavingsMonthly: 992_500,
    pitSavingsAnnual: 11_910_000,
  },
  summary:
    'Theo Luật Thuế TNCN 109/2025 (5 bậc) & NQ 110/2025 (15,5tr / 6,2tr), bạn tiết kiệm được 992.500 ₫/tháng (11.910.000 ₫/năm) tiền thuế so với quy định cũ 2025.',
};

const INITIAL_BENEFIT_RESULT = {
  benefitType: 'unemployment',
  regimeId: '2026_H2',
  legalRef: 'Khoản 1 Điều 39 Luật Việc làm 74/2025/QH15 (hiệu lực 01/01/2026)',
  eligible: true,
  monthlyBenefit: 12_000_000,
  uncappedMonthly: 12_000_000,
  monthlyCap: 26_550_000,
  isCapped: false,
  monthsEntitled: 3,
  totalBenefit: 36_000_000,
  carriedOverMonths: 0,
  regionalMinWage: 5_310_000,
  note: 'Trần trợ cấp tối đa theo Luật Việc làm 74/2025 là 5 × lương tối thiểu vùng Vùng 1 = 26.550.000 ₫/tháng.',
};

export default function SalaryInsurance() {
  const { lang, tx } = useI18n();
  const { user, getAccessToken } = useAuth();
  const notify = useToast();

  const [activeTab, setActiveTab] = useState('payroll');

  const [salaryState, setSalaryState] = useState(() => {
    const restored = consumeToolRestoreState('salary');
    if (restored?.benefitType) {
      return DEFAULT_SALARY_STATE;
    }
    if (restored?.amount) {
      return { ...DEFAULT_SALARY_STATE, ...restored };
    }
    const saved = loadSavedSalaryState();
    if (saved && Object.keys(saved).length > 0) {
      return { ...DEFAULT_SALARY_STATE, ...saved };
    }
    const plan = loadSavedPlannerState();
    if (plan?.salaryFullTime) {
      return {
        ...DEFAULT_SALARY_STATE,
        amount: plan.salaryFullTime,
        partnerAmount: plan.partnerSalaryFullTime || 0,
        householdMode: plan.householdMode || 'INDIVIDUAL',
        dependents: plan.dependentsCount || 0,
      };
    }
    return DEFAULT_SALARY_STATE;
  });

  const [benefitState, setBenefitState] = useState({
    benefitType: 'unemployment',
    avgSalary6m: 20_000_000,
    avgSalaryTotal: 18_000_000,
    region: 1,
    regime: '2026_H2',
    bhtnMonths: 36,
    maternityType: 'mandatory',
    babiesCount: 1,
    cSection: false,
    fatherLeaveType: 'normal',
    bhxhJoinedBeforeJuly2025: true,
    yearsBefore2014: 0,
    yearsFrom2014: 5,
    sickDays: 5,
    nonBhtnYears: 1,
  });

  useEffect(() => {
    saveSalaryState(salaryState);
  }, [salaryState]);

  const payrollCalc = useServerCalc('salary_gross_net', salaryState, INITIAL_SALARY_RESULT, {
    mode: 'manual',
    minLoadingMs: 320,
    onSuccess: (calcJson, payload) => {
      const p = calcJson?.primary || {};
      recordToolRun({
        tool: 'salary',
        title: tx(
          `${payload.mode === 'NET_TO_GROSS' ? 'Net→Gross' : 'Gross→Net'} (${compact(p.gross || 0, lang)} · ${payload.regime})`,
          `${payload.mode === 'NET_TO_GROSS' ? 'Net→Gross' : 'Gross→Net'} (${compact(p.gross || 0, lang)})`,
          `給与試算（${compact(p.gross || 0, lang)}）`
        ),
        householdMode: payload.householdMode || 'INDIVIDUAL',
        summary: tx(
          `Thực nhận Net: ${vnd(p.net || 0, lang)} · Thuế TNCN: ${vnd(p.employee?.pit || 0, lang)} · Tiết kiệm luật 2026: ${vnd(calcJson?.comparisonVs2025?.pitSavingsMonthly || 0, lang)}/tháng`,
          `Net: ${vnd(p.net || 0, lang)} · PIT: ${vnd(p.employee?.pit || 0, lang)} · 2026 Tax Saved: ${vnd(calcJson?.comparisonVs2025?.pitSavingsMonthly || 0, lang)}/mo`,
          `手取り: ${vnd(p.net || 0, lang)} · 所得税: ${vnd(p.employee?.pit || 0, lang)}`
        ),
        metrics: [
          { label: tx('Lương Net thực nhận', 'Net Salary', '手取り給与'), value: compact(p.net || 0, lang), tone: 'emerald' },
          { label: tx('Thuế TNCN 5 bậc', '2026 PIT', '個人所得税'), value: compact(p.employee?.pit || 0, lang), tone: 'amber' },
          {
            label: tx('Giảm thuế so với 2025', 'Saved vs 2025', '2025比節税額'),
            value: `+${compact(calcJson?.comparisonVs2025?.pitSavingsMonthly || 0, lang)}`,
            tone: 'indigo',
          },
        ],
        inputs: payload,
        accessToken: user ? getAccessToken() : null,
      });
    },
  });

  const benefitCalc = useServerCalc('social_benefits', benefitState, INITIAL_BENEFIT_RESULT, {
    mode: 'manual',
    minLoadingMs: 300,
    onSuccess: (calcJson, payload) => {
      recordToolRun({
        tool: 'salary',
        title: tx(
          `Trợ cấp BHXH (${payload.benefitType})`,
          `Social Benefit (${payload.benefitType})`,
          `社会保険給付 (${payload.benefitType})`
        ),
        summary: tx(
          `Tổng dự toán hưởng: ${vnd(calcJson?.totalBenefit || 0, lang)}`,
          `Estimated Total Benefit: ${vnd(calcJson?.totalBenefit || 0, lang)}`,
          `予想給付総額: ${vnd(calcJson?.totalBenefit || 0, lang)}`
        ),
        metrics: [
          { label: tx('Tổng trợ cấp', 'Total Benefit', '給付合計'), value: compact(calcJson?.totalBenefit || 0, lang), tone: 'emerald' },
        ],
        inputs: payload,
        accessToken: user ? getAccessToken() : null,
      });
    },
  });

  const p = payrollCalc.data?.primary || INITIAL_SALARY_RESULT.primary;
  const cmp25 = payrollCalc.data?.comparisonVs2025 || INITIAL_SALARY_RESULT.comparisonVs2025;
  const hhSummary = payrollCalc.data?.householdSummary || INITIAL_SALARY_RESULT.householdSummary;
  const ben = benefitCalc.data || INITIAL_BENEFIT_RESULT;

  const handleApplyNetToPlanner = () => {
    const prevPlan = cryptoStorage.load('PLANNER_STATE', {}) || {};
    cryptoStorage.save('PLANNER_STATE', {
      ...prevPlan,
      householdMode: salaryState.householdMode,
      dependentsCount: salaryState.dependents,
      salaryFullTime: p.net,
      partnerSalaryFullTime: payrollCalc.data?.partner?.net || prevPlan.partnerSalaryFullTime || 0,
      saving: Math.max(1_000_000, hhSummary.suggestedMonthlySaving30Pct),
    });
    notify(
      tx(
        'Đã nạp Lương Net thực nhận (2026) & gợi ý tiết kiệm 30% vào trang Lập kế hoạch!',
        'Synced 2026 Net salary & 30% saving rate into Roadmap Planner!',
        '手取り給与と積立推奨額をプランナーへ反映しました！'
      )
    );
    navigate(href('plan', { hh: salaryState.householdMode }));
  };

  const regionNames = [
    { value: 1, label: tx('Vùng I (HN, TP.HCM, HP...)', 'Region I (HN, HCMC...)', '第1地域（HN/HCMC）') },
    { value: 2, label: tx('Vùng II (ĐN, Cần Thơ...)', 'Region II (DN, Can Tho...)', '第2地域') },
    { value: 3, label: tx('Vùng III (TP trực thuộc tỉnh)', 'Region III (Provincial cities)', '第3地域') },
    { value: 4, label: tx('Vùng IV (Khu vực còn lại)', 'Region IV (Other areas)', '第4地域') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        eyebrow={tx('Bộ Công Cụ 3 · Luật Việt Nam 2026', 'Suite 3 · Vietnam 2026 Statutory Rules', 'ツール群3・ベトナム2026年新法対応')}
        title={tx('Lương Gross ↔ Net, Thuế TNCN 5 bậc & BHXH / Trợ cấp 2026', 'Vietnam 2026 Salary, 5-Bracket PIT & Social Insurance', '給与手取り計算・5段階所得税・社会保険 2026')}
        description={tx(
          'Cập nhật đầy đủ NQ 110/2025/UBTVQH15 (giảm trừ 15,5 triệu / 6,2 triệu), Luật Thuế TNCN 109/2025/QH15 (5 bậc), NĐ 161/2026 (mức tham chiếu 2,53 triệu), NĐ 293/2025 & NĐ 399/2026 (LTTV), Luật BHXH 41/2024 và Luật Việc làm 74/2025.',
          'Powered by NQ 110/2025 (15.5M/6.2M deductions), PIT Law 109/2025 (5 brackets), Decree 161/2026 (2.53M ref salary), Decrees 293/2025 & 399/2026, BHXH Law 41/2024 & Employment Law 74/2025.',
          '2026年施行の個人所得税5段階化・基礎控除15.5M/扶養6.2M・地域別最低賃金・改正社会保険法・雇用法に完全準拠。'
        )}
        actions={
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'payroll', label: tx('Lương Gross ↔ Net & Thuế TNCN', 'Salary & PIT 2026', '給与・個人所得税') },
              { value: 'benefits', label: tx('BHXH, BHTN, Thai sản & 1 Lần', 'BHXH & Benefits', '失業・出産・一時金') },
            ]}
          />
        }
      />

      {activeTab === 'payroll' ? (
        <WorkspaceSplit
          resultsId="salary-results"
          mobileSummary={{
            eyebrow: salaryState.mode === 'GROSS_TO_NET' ? tx('Lương Net thực nhận', 'Net Salary', '手取り給与') : tx('Lương Gross quy đổi', 'Required Gross', '必要額面給与'),
            value: compact(salaryState.mode === 'GROSS_TO_NET' ? p.net : p.gross, lang),
            ctaLabel: tx('Chi tiết', 'Details', '詳細'),
          }}
          runAction={{
            isDirty: payrollCalc.isDirty,
            loading: payrollCalc.loading,
            onRun: payrollCalc.run,
            label: tx('Tính Lương & Thuế TNCN 2026', 'Calculate 2026 Payroll', '給与・税額を計算する'),
          }}
          controls={
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {tx('Giai đoạn quy định pháp luật', 'Statutory Legal Regime', '適用法令区分')}
                </label>
                <Segmented
                  size="sm"
                  value={salaryState.regime}
                  onChange={(v) => setSalaryState((s) => ({ ...s, regime: v }))}
                  options={[
                    { value: '2026_H2', label: tx('Luật 2026 (từ 07/26)', '2026 Active', '2026現行法') },
                    { value: '2027', label: tx('2027 (LTTV mới)', '2027 Forecast', '2027年見込') },
                    { value: '2025', label: tx('Luật cũ 2025', 'Old 2025', '2025旧法') },
                  ]}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Segmented
                  size="sm"
                  value={salaryState.mode}
                  onChange={(v) => setSalaryState((s) => ({ ...s, mode: v }))}
                  options={[
                    { value: 'GROSS_TO_NET', label: 'Gross → Net' },
                    { value: 'NET_TO_GROSS', label: 'Net → Gross' },
                  ]}
                />
                <Segmented
                  size="sm"
                  value={salaryState.householdMode}
                  onChange={(v) => setSalaryState((s) => ({ ...s, householdMode: v }))}
                  options={[
                    { value: 'INDIVIDUAL', label: tx('1 người', 'Solo', '個人') },
                    { value: 'COUPLE', label: tx('Cặp đôi', 'Couple', 'カップル') },
                    { value: 'FAMILY', label: tx('Gia đình', 'Family', '家族') },
                  ]}
                />
              </div>

              <MoneyField
                label={
                  salaryState.mode === 'GROSS_TO_NET'
                    ? tx('Thu nhập Gross hàng tháng', 'Monthly Gross Income', '月収（額面 Gross）')
                    : tx('Lương Net thực nhận mong muốn', 'Desired Monthly Net', '希望手取り（Net）')
                }
                value={salaryState.amount}
                onChange={(v) => setSalaryState((s) => ({ ...s, amount: v }))}
                min={5_000_000}
                max={200_000_000}
                step={500_000}
                presets={[15_000_000, 25_000_000, 35_000_000, 50_000_000, 80_000_000].map((v) => ({
                  value: v,
                  label: chip(v, lang),
                }))}
              />

              {(salaryState.householdMode === 'COUPLE' || salaryState.householdMode === 'FAMILY') && (
                <MoneyField
                  label={tx('Lương người đồng hành / bạn đời (tuỳ chọn)', 'Partner Monthly Income (optional)', 'パートナー月収（任意）')}
                  value={salaryState.partnerAmount}
                  onChange={(v) => setSalaryState((s) => ({ ...s, partnerAmount: v }))}
                  min={0}
                  max={150_000_000}
                  step={500_000}
                  presets={[0, 15_000_000, 25_000_000, 40_000_000].map((v) => ({
                    value: v,
                    label: v === 0 ? '0 ₫' : chip(v, lang),
                  }))}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {tx('Vùng lương tối thiểu', 'Wage Region', '最低賃金地域')}
                  </label>
                  <select
                    value={salaryState.region}
                    onChange={(e) => setSalaryState((s) => ({ ...s, region: Number(e.target.value) }))}
                    className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                  >
                    {regionNames.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    {tx('Số người phụ thuộc (6,2tr/người)', 'Dependents (6.2M each)', '扶養人数（6.2M/人）')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((d) => (
                      <Chip
                        key={d}
                        active={salaryState.dependents === d}
                        onClick={() => setSalaryState((s) => ({ ...s, dependents: d }))}
                      >
                        {d}
                      </Chip>
                    ))}
                    <NumberInput
                      value={salaryState.dependents}
                      onChange={(v) => setSalaryState((s) => ({ ...s, dependents: v }))}
                      max={15}
                      className="h-9 flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] pt-3">
                <label className="block text-xs font-medium text-zinc-400">
                  {tx('Mức lương đóng BHXH / BHYT / BHTN', 'Social Insurance Salary Base', '社会保険料の算定基礎')}
                </label>
                <Segmented
                  size="sm"
                  value={salaryState.insuranceBaseMode}
                  onChange={(v) => setSalaryState((s) => ({ ...s, insuranceBaseMode: v }))}
                  options={[
                    { value: 'FULL', label: tx('Trên lương chính thức', 'Official Salary', '支給給与全額') },
                    { value: 'MIN_WAGE', label: tx('Lương tối thiểu vùng', 'Regional Min', '地域最低賃金') },
                    { value: 'CUSTOM', label: tx('Tự nhập mức đóng', 'Custom Base', '任意入力') },
                  ]}
                />
                {salaryState.insuranceBaseMode === 'CUSTOM' && (
                  <NumberInput
                    value={salaryState.customInsuranceBase}
                    onChange={(v) => setSalaryState((s) => ({ ...s, customInsuranceBase: v }))}
                    max={500_000_000}
                    suffix="₫"
                  />
                )}
              </div>

              <MoneyField
                label={tx('Phụ cấp không tính thuế TNCN (ăn trưa, điện thoại...)', 'Tax-Exempt Allowances', '非課税手当（昼食・通信など）')}
                value={salaryState.taxExemptAllowance}
                onChange={(v) => setSalaryState((s) => ({ ...s, taxExemptAllowance: v }))}
                min={0}
                max={10_000_000}
                step={100_000}
                presets={[0, 730_000, 1_500_000].map((v) => ({
                  value: v,
                  label: v === 0 ? '0 ₫' : chip(v, lang),
                }))}
              />
            </div>
          }
          results={
            <div className="space-y-6">
              <CalculationLoader
                loading={payrollCalc.loading}
                label={tx('Đang tính lương, BHXH & biểu thuế 5 bậc 2026...', 'Computing 2026 payroll, PIT & BHXH...', '2026年新法基準で給与・税額を計算中...')}
              />

              {/* Statutory Regime Callout + Savings Highlight */}
              <Card className="border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.08] via-surface to-indigo-500/[0.06] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="success">{p.regimeId === '2025' ? tx('Đối chiếu 2025 (7 bậc)', 'Old 2025 (7 Brackets)', '2025旧法') : tx('Luật 2026 · 5 bậc thuế', '2026 · 5 Brackets', '2026新法・5段階')}</Badge>
                      <Badge tone="brand">{p.effectiveLabel}</Badge>
                    </div>
                    <p className="mt-2.5 text-sm font-medium leading-relaxed text-white">{payrollCalc.data?.summary}</p>
                    <p className="mt-1 text-xs text-zinc-400">{p.pitLegalRef} · {p.bhxhLegalRef}</p>
                  </div>
                  <Button type="button" size="sm" variant="primary" onClick={handleApplyNetToPlanner}>
                    <Sparkles className="size-3.5" />
                    {tx('Nạp vào Lập kế hoạch', 'Send Net to Planner', 'プランへ反映')}
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
              </Card>

              <AdaptiveGrid cols={{ mobile: 2, tablet: 4, duo: 2, desktop: 4 }}>
                <Stat
                  label={tx('Lương Gross', 'Gross Salary', '額面給与 (Gross)')}
                  value={compact(p.gross, lang)}
                  hint={vnd(p.gross, lang)}
                />
                <Stat
                  label={tx('Lương Net thực nhận', 'Net Take-Home', '手取り (Net)')}
                  value={compact(p.net, lang)}
                  hint={vnd(p.net, lang)}
                  tone="emerald"
                />
                <Stat
                  label={tx('Tổng BHXH/YT/TN (10,5%)', 'Employee Insurance (10.5%)', '社会保険自己負担 (10.5%)')}
                  value={compact(p.employee?.totalInsurance || 0, lang)}
                  hint={`BHXH ${fmt(p.employee?.bhxh)} · BHYT ${fmt(p.employee?.bhyt)} · BHTN ${fmt(p.employee?.bhtn)}`}
                  tone="indigo"
                />
                <Stat
                  label={tx('Thuế TNCN phải đóng', 'Personal Income Tax', '個人所得税 (PIT)')}
                  value={compact(p.employee?.pit || 0, lang)}
                  hint={tx(`Thuế suất hiệu dụng ${p.employee?.effectiveTaxRatePct || 0}%`, `Effective ${p.employee?.effectiveTaxRatePct || 0}%`, `実効税率 ${p.employee?.effectiveTaxRatePct || 0}%`)}
                  tone="amber"
                />
              </AdaptiveGrid>

              {payrollCalc.data?.partner && (
                <Card className="border-indigo-400/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
                      <Users className="size-4 text-indigo-300" />
                      {tx('Tổng thu nhập ròng 2 người (Hộ gia đình):', 'Combined 2-Earner Household Net:', '世帯合算手取り月収：')}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold tabular-nums">
                      <span className="text-emerald-300">{vnd(hhSummary.combinedNet, lang)}</span>
                      <Badge tone="brand">
                        {tx(`Gợi ý tiết kiệm 30%: ${compact(hhSummary.suggestedMonthlySaving30Pct, lang)}/th`, `Suggested 30% save: ${compact(hhSummary.suggestedMonthlySaving30Pct, lang)}/mo`, `推奨積立30%: ${compact(hhSummary.suggestedMonthlySaving30Pct, lang)}/月`)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}

              {/* Deduction + Employer Cost + 2025 vs 2026 Comparison */}
              <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
                <Card className="p-5">
                  <CardHeader
                    title={tx('Diễn giải các khoản giảm trừ & đóng góp', 'Statutory Deductions Breakdown', '控除・社会保険内訳')}
                    right={<Scale className="size-4 text-indigo-300" />}
                  />
                  <div className="mt-4 space-y-2 text-xs tabular-nums">
                    {[
                      [tx('Lương đóng BHXH/BHYT (Trần 20× tham chiếu)', 'BHXH/BHYT Salary Base', '年金・健保算定基礎'), vnd(p.bhxhSalaryBase, lang)],
                      [tx('BHXH người LĐ (8%)', 'Employee Social Ins. (8%)', '年金保険料 (8%)'), `-${vnd(p.employee?.bhxh, lang)}`],
                      [tx('BHYT người LĐ (1,5%)', 'Employee Health Ins. (1.5%)', '健康保険料 (1.5%)'), `-${vnd(p.employee?.bhyt, lang)}`],
                      [tx('BHTN người LĐ (1%)', 'Employee Unemployment (1%)', '雇用保険料 (1%)'), `-${vnd(p.employee?.bhtn, lang)}`],
                      [tx('Thu nhập trước thuế', 'Pre-Tax Income', '税引前所得'), vnd(p.employee?.incomeBeforeTax, lang)],
                      [tx('Giảm trừ gia cảnh bản thân', 'Personal Deduction', '基礎控除'), `-${vnd(p.employee?.personalDeduction, lang)}`],
                      [tx('Giảm trừ người phụ thuộc', 'Dependent Deduction', '扶養控除'), `-${vnd(p.employee?.dependentDeduction, lang)}`],
                      [tx('Thu nhập tính thuế TNCN', 'Taxable Income', '課税所得'), vnd(p.employee?.taxableIncome, lang)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-1.5">
                        <span className="text-zinc-400">{k}</span>
                        <span className="font-medium text-white">{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <CardHeader
                    title={tx('Người sử dụng LĐ đóng & Lợi ích Luật 2026', 'Employer Cost & 2026 Law Savings', '会社負担額・2026年改正節税比較')}
                    right={<Landmark className="size-4 text-emerald-300" />}
                  />
                  <div className="mt-4 space-y-2 text-xs tabular-nums">
                    <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-1.5">
                      <span className="text-zinc-400">{tx('BHXH Doanh nghiệp (17,5%)', 'Employer Social Ins. (17.5%)', '会社負担 年金 (17.5%)')}</span>
                      <span className="text-white">{vnd(p.employer?.bhxh, lang)}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-1.5">
                      <span className="text-zinc-400">{tx('BHYT Doanh nghiệp (3%)', 'Employer Health Ins. (3%)', '会社負担 健保 (3%)')}</span>
                      <span className="text-white">{vnd(p.employer?.bhyt, lang)}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-1.5">
                      <span className="text-zinc-400">{tx('BHTN Doanh nghiệp (1%)', 'Employer Unemployment (1%)', '会社負担 雇保 (1%)')}</span>
                      <span className="text-white">{vnd(p.employer?.bhtn, lang)}</span>
                    </div>
                    <div className="flex justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 font-semibold">
                      <span className="text-zinc-200">{tx('Tổng chi phí doanh nghiệp chi trả', 'Total Employer Cost', '会社総コスト')}</span>
                      <span className="text-indigo-200">{vnd(p.employer?.totalCost, lang)}</span>
                    </div>

                    <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                        {tx('So sánh Thuế TNCN 2026 (5 bậc) vs 2025 (7 bậc)', '2026 (5-Bracket) vs 2025 (7-Bracket)', '2026年5段階 vs 2025年7段階比較')}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-zinc-400">{tx('Thuế cũ 2025:', '2025 Tax:', '2025税額：')}</div>
                          <div className="font-semibold text-zinc-200">{vnd(cmp25.pit2025, lang)}</div>
                        </div>
                        <div>
                          <div className="text-zinc-400">{tx('Thuế mới 2026:', '2026 Tax:', '2026税額：')}</div>
                          <div className="font-semibold text-emerald-300">{vnd(cmp25.pit2026, lang)}</div>
                        </div>
                      </div>
                      <div className="mt-2 border-t border-emerald-400/20 pt-2 text-xs font-semibold text-emerald-200">
                        {tx('Tiết kiệm thêm mỗi năm:', 'Annual Take-Home Gain:', '年間手取り増加：')} +{vnd(cmp25.pitSavingsAnnual, lang)}
                      </div>
                    </div>
                  </div>
                </Card>
              </AdaptiveGrid>

              {/* Brackets Table */}
              <Card className="p-5">
                <CardHeader
                  title={tx('Chi tiết thuế TNCN theo từng bậc lũy tiến', 'Progressive Tax Bracket Breakdown', '所得税率段階別内訳')}
                />
                <div className="mt-3">
                  <Table
                    head={[
                      tx('Bậc', 'Bracket', '段階'),
                      tx('Phần thu nhập tính thuế', 'Taxable Slice', '課税対象枠'),
                      tx('Thuế suất', 'Rate', '税率'),
                      tx('Thuế phải nộp', 'Tax Amount', '税額'),
                    ]}
                  >
                    {(p.employee?.brackets || []).map((b) => (
                      <tr key={b.bracket} className={b.taxAmount > 0 ? 'bg-indigo-500/[0.04]' : ''}>
                        <td className="px-3 py-2.5 font-medium text-white sm:px-4">
                          {tx(`Bậc ${b.bracket}`, `Tier ${b.bracket}`, `第${b.bracket}段階`)} ({fmt(b.from)} – {b.to ? fmt(b.to) : '∞'})
                        </td>
                        <td className="px-3 py-2.5 text-right text-zinc-300 sm:px-4">{vnd(b.taxableSlice, lang)}</td>
                        <td className="px-3 py-2.5 text-right text-indigo-300 sm:px-4">{b.ratePct}%</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-white sm:px-4">{vnd(b.taxAmount, lang)}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              </Card>
            </div>
          }
        />
      ) : (
        <WorkspaceSplit
          resultsId="benefits-results"
          mobileSummary={{
            eyebrow: tx('Tổng trợ cấp ước tính', 'Estimated Benefit', '給付予想額'),
            value: compact(ben.totalBenefit, lang),
            ctaLabel: tx('Xem chi tiết', 'Details', '詳細'),
          }}
          runAction={{
            isDirty: benefitCalc.isDirty,
            loading: benefitCalc.loading,
            onRun: benefitCalc.run,
            label: tx('Tính Trợ cấp BHXH / BHTN', 'Calculate Social Benefits', '給付金を試算する'),
          }}
          controls={
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  {tx('Chọn chế độ bảo hiểm / trợ cấp', 'Select Benefit Type', '給付種別を選択')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'unemployment', label: tx('Thất nghiệp (BHTN)', 'Unemployment', '失業給付') },
                    { id: 'maternity', label: tx('Thai sản (2024)', 'Maternity', '出産給付') },
                    { id: 'lump_sum_bhxh', label: tx('BHXH 1 lần', 'BHXH Lump-Sum', '脱退一時金') },
                    { id: 'sickness_severance', label: tx('Ốm đau / Thôi việc', 'Sickness / Severance', '傷病・退職手当') },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBenefitState((b) => ({ ...b, benefitType: item.id }))}
                      className={cx(
                        'rounded-xl px-2.5 py-2 text-xs font-medium ring-1 ring-inset transition',
                        benefitState.benefitType === item.id
                          ? 'bg-indigo-500/20 text-white ring-indigo-400/45'
                          : 'bg-white/[0.03] text-zinc-400 ring-white/[0.08] hover:text-white'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <MoneyField
                label={tx('Lương bình quân đóng BH 6 tháng gần nhất', '6-Month Avg Insured Salary', '直近6ヶ月平均算定給与')}
                value={benefitState.avgSalary6m}
                onChange={(v) => setBenefitState((b) => ({ ...b, avgSalary6m: v }))}
                min={3_700_000}
                max={120_000_000}
                step={500_000}
                presets={[10_000_000, 20_000_000, 35_000_000, 50_000_000].map((v) => ({
                  value: v,
                  label: chip(v, lang),
                }))}
              />

              {benefitState.benefitType === 'unemployment' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      {tx('Số tháng đã đóng BHTN chưa hưởng', 'Unclaimed UI Months', '未受給の雇用保険加入月数')}
                    </label>
                    <NumberInput
                      value={benefitState.bhtnMonths}
                      onChange={(v) => setBenefitState((b) => ({ ...b, bhtnMonths: v }))}
                      max={480}
                      suffix={tx('tháng', 'mo', 'ヶ月')}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      {tx('Vùng áp dụng trần 5 × LTTV', 'Wage Region (5× Cap)', '上限算定地域')}
                    </label>
                    <select
                      value={benefitState.region}
                      onChange={(e) => setBenefitState((b) => ({ ...b, region: Number(e.target.value) }))}
                      className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                    >
                      {regionNames.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {benefitState.benefitType === 'maternity' && (
                <div className="space-y-3">
                  <Segmented
                    size="sm"
                    value={benefitState.maternityType}
                    onChange={(v) => setBenefitState((b) => ({ ...b, maternityType: v }))}
                    options={[
                      { value: 'mandatory', label: tx('BHXH Bắt buộc', 'Mandatory', '強制社会保険') },
                      { value: 'voluntary', label: tx('BHXH Tự nguyện (2tr/con)', 'Voluntary (2M/child)', '任意社会保険') },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">{tx('Số con sinh', 'Newborns', '出産児数')}</label>
                      <NumberInput
                        value={benefitState.babiesCount}
                        onChange={(v) => setBenefitState((b) => ({ ...b, babiesCount: Math.max(1, v) }))}
                        max={5}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant={benefitState.cSection ? 'primary' : 'secondary'}
                        className="w-full"
                        onClick={() => setBenefitState((b) => ({ ...b, cSection: !b.cSection }))}
                      >
                        {benefitState.cSection ? tx('Sinh mổ (Đã chọn)', 'C-Section', '帝王切開') : tx('Sinh thường', 'Normal Delivery', '通常分娩')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {benefitState.benefitType === 'lump_sum_bhxh' && (
                <div className="space-y-3">
                  <Segmented
                    size="sm"
                    value={benefitState.bhxhJoinedBeforeJuly2025 ? 'before' : 'after'}
                    onChange={(v) => setBenefitState((b) => ({ ...b, bhxhJoinedBeforeJuly2025: v === 'before' }))}
                    options={[
                      { value: 'before', label: tx('Tham gia trước 01/07/2025', 'Joined < 07/2025', '2025/7以前加入') },
                      { value: 'after', label: tx('Từ 01/07/2025 trở đi', 'Joined >= 07/2025', '2025/7以降加入') },
                    ]}
                  />
                  <MoneyField
                    label={tx('Lương bình quân toàn bộ quá trình (MBQTL)', 'Career Avg Insured Salary', '全期間平均算定給与')}
                    value={benefitState.avgSalaryTotal}
                    onChange={(v) => setBenefitState((b) => ({ ...b, avgSalaryTotal: v }))}
                    min={3_700_000}
                    max={80_000_000}
                    step={500_000}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">{tx('Số năm trước 2014 (×1,5)', 'Years < 2014', '2014年以前(年)')}</label>
                      <NumberInput value={benefitState.yearsBefore2014} onChange={(v) => setBenefitState((b) => ({ ...b, yearsBefore2014: v }))} max={40} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">{tx('Số năm từ 2014 (×2,0)', 'Years >= 2014', '2014年以降(年)')}</label>
                      <NumberInput value={benefitState.yearsFrom2014} onChange={(v) => setBenefitState((b) => ({ ...b, yearsFrom2014: v }))} max={40} />
                    </div>
                  </div>
                </div>
              )}

              {benefitState.benefitType === 'sickness_severance' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">{tx('Số ngày nghỉ ốm hưởng BH', 'Insured Sick Days', '傷病休暇日数')}</label>
                    <NumberInput value={benefitState.sickDays} onChange={(v) => setBenefitState((b) => ({ ...b, sickDays: v }))} max={180} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">{tx('Số năm chưa đóng BHTN', 'Non-UI Years', '雇保未加入年数')}</label>
                    <NumberInput value={benefitState.nonBhtnYears} onChange={(v) => setBenefitState((b) => ({ ...b, nonBhtnYears: v }))} max={40} />
                  </div>
                </div>
              )}
            </div>
          }
          results={
            <div className="space-y-6">
              <CalculationLoader loading={benefitCalc.loading} label={tx('Đang đối chiếu mức tham chiếu 2,53 triệu & Luật BHXH 41/2024...', 'Calculating statutory benefits...', '社会保険給付を計算中...')} />

              <Callout
                icon={benefitState.benefitType === 'lump_sum_bhxh' && !benefitState.bhxhJoinedBeforeJuly2025 ? ShieldAlert : Baby}
                tone={benefitState.benefitType === 'lump_sum_bhxh' && !benefitState.bhxhJoinedBeforeJuly2025 ? 'warning' : 'success'}
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white">{ben.legalRef}</div>
                  <div>{ben.note}</div>
                </div>
              </Callout>

              <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 2, desktop: 3 }}>
                <Stat
                  label={tx('Tổng trợ cấp ước tính', 'Estimated Total Benefit', '予想給付総額')}
                  value={compact(ben.totalBenefit, lang)}
                  hint={vnd(ben.totalBenefit, lang)}
                  tone="emerald"
                />
                {ben.benefitType === 'unemployment' && (
                  <>
                    <Stat
                      label={tx('Mức hưởng hàng tháng', 'Monthly Benefit', '月額給付')}
                      value={compact(ben.monthlyBenefit, lang)}
                      hint={ben.isCapped ? tx('Đã chạm trần 5× LTTV', 'Capped at 5× min wage', '上限到達') : vnd(ben.monthlyCap, lang)}
                      tone="indigo"
                    />
                    <Stat
                      label={tx('Số tháng được hưởng', 'Entitled Months', '給付期間')}
                      value={`${ben.monthsEntitled} ${tx('tháng', 'months', 'ヶ月')}`}
                      hint={tx(`Bảo lưu dư: ${ben.carriedOverMonths} tháng`, `Carried over: ${ben.carriedOverMonths} mo`, `繰越残: ${ben.carriedOverMonths}ヶ月`)}
                    />
                  </>
                )}
                {ben.benefitType === 'maternity' && ben.maternityType === 'mandatory' && (
                  <>
                    <Stat
                      label={tx('Tiền lương 6T thai sản', '6M Salary Replacement', '産休給与給付')}
                      value={compact(ben.salaryBenefit, lang)}
                      hint={`${ben.leaveMonths} ${tx('tháng', 'months', 'ヶ月')}`}
                      tone="indigo"
                    />
                    <Stat
                      label={tx('Trợ cấp 1 lần (2× tham chiếu)', 'Birth Grant (2× Ref)', '出産一時金')}
                      value={compact(ben.lumpSumAllowance, lang)}
                      hint={`${tx('Dưỡng sức:', 'Recovery:', '療養手当:')} ${vnd(ben.recoveryAllowance, lang)}`}
                    />
                  </>
                )}
                {ben.benefitType === 'lump_sum_bhxh' && (
                  <>
                    <Stat
                      label={tx('Giai đoạn trước 2014 (×1,5)', 'Pre-2014 Portion', '2014年以前分')}
                      value={compact(ben.beforeAmount, lang)}
                      hint={`${ben.yearsBefore2014} ${tx('năm', 'yrs', '年')}`}
                    />
                    <Stat
                      label={tx('Giai đoạn từ 2014 (×2,0)', 'From-2014 Portion', '2014年以降分')}
                      value={compact(ben.from2014Amount, lang)}
                      hint={`${ben.yearsFrom2014} ${tx('năm', 'yrs', '年')}`}
                      tone="indigo"
                    />
                  </>
                )}
                {ben.benefitType === 'sickness_severance' && (
                  <>
                    <Stat
                      label={tx('Trợ cấp ốm đau (75%)', 'Sickness Benefit (75%)', '傷病手当')}
                      value={compact(ben.sicknessBenefit, lang)}
                      hint={`${ben.sickDays} ${tx('ngày', 'days', '日')}`}
                    />
                    <Stat
                      label={tx('Trợ cấp thôi việc', 'Severance Allowance', '退職手当')}
                      value={compact(ben.severanceAllowance, lang)}
                      hint={`${ben.nonBhtnYears} ${tx('năm', 'yrs', '年')}`}
                      tone="indigo"
                    />
                  </>
                )}
              </AdaptiveGrid>

              <SavePlanPromptCard />
              <FeedbackWidget
                tool="salary"
                toolLabel={tx('Lương & BHXH 2026', 'Salary & Social Ins. 2026', '給与・社会保険 2026')}
                snapshot={{ regime: benefitState.regime, benefitType: benefitState.benefitType }}
              />
            </div>
          }
        />
      )}
    </div>
  );
}
