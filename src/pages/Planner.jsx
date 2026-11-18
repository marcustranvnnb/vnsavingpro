import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
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
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { copyReportForGoogleDocs, downloadGoogleDocsFile } from '../utils/googleDocsExporter.js';
import { cryptoStorage } from '../utils/cryptoStorage.js';
import { compact, chip, duration, fmt, pct, vnd } from '../utils/format.js';
import { TENURE_LABELS } from '../data/banksData.js';
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
  PageHeader,
  Progress,
  Segmented,
  SliderField,
  Stat,
  Table,
  cx,
} from '../components/ui.jsx';
import { BankPicker, TENURE_OPTIONS } from '../components/BankPicker.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import GrowthChart from '../components/GrowthChart.jsx';

const presets = (arr) => arr.map((v) => ({ value: v, label: v === 0 ? '0 ₫' : chip(v) }));

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
    timeText: 'Đang tính...',
    totalDeposited: 0,
    totalCompoundInterest: 0,
    compoundSharePct: 0,
    savingsRatePercent: 0,
    finalMonthlyPassiveIncome: 0,
    annualStepUpPct: 0,
    annualBonusAmount: 0,
    inflationRatePct: 0,
    isAlreadyReached: false,
    monthByMonthLog: [],
  },
  feasibility: {
    score: 70,
    ratingLabel: 'Đang đánh giá...',
    strengths: [],
    warnings: [],
  },
  scenarios: [],
  bankRuns: [],
};

export default function Planner({ params = {} }) {
  const { banks, getRate, best } = useRates();
  const notify = useToast();
  const saved = useMemo(() => loadSavedPlannerState(), []);

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
  const [salary, setSalary] = useState(() => Number(params.salary) || Number(saved.salary) || 25_000_000);
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
      salary,
      bankId,
      tenure,
      customRate,
      calcMode,
      annualStepUpPct,
      annualBonusAmount,
      inflationRatePct,
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
    salary,
    bankId,
    tenure,
    customRate,
    calcMode,
    annualStepUpPct,
    annualBonusAmount,
    inflationRatePct,
  ]);

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
    return {
      goalType,
      targetMonthlyInterest: target,
      targetAmount,
      solveMode,
      targetYears,
      currentSalary: salary,
      monthlySavingsAmount: saving,
      initialCapital: capital,
      annualInterestRate: rate,
      calculationMode: calcMode,
      annualStepUpPct: effectiveStepUp,
      annualBonusAmount: effectiveBonus,
      inflationRatePct: effectiveInflation,
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
    saving,
    capital,
    rate,
    calcMode,
    effectiveStepUp,
    effectiveBonus,
    effectiveInflation,
    tenure,
    banks,
    getRate,
    best,
  ]);

  const { data: bundle, loading } = useServerCalc('planner_bundle', plannerPayload, INITIAL_PLANNER_DATA);
  const { roadmap, feasibility, scenarios } = bundle;
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

  const tableRows = roadmap.monthByMonthLog.filter(
    (r) => rows === 'all' || r.month === 0 || r.month % 12 === 0 || r.totalBalance >= roadmap.requiredPrincipal
  );

  const exportCSV = () => {
    const head = ['Tháng', 'Vốn đã gửi (VND)', 'Lãi kép tích luỹ (VND)', 'Tổng tài sản (VND)', 'Thu nhập thụ động/tháng (VND)'];
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
    a.download = `VnSavingPro_LoTrinh_${isTargetAmount ? targetAmount : target}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharePlan = () => {
    const query = {
      mode: inputMode,
      goal: goalType,
      target,
      targetAmount,
      solve: solveMode,
      years: targetYears,
      capital,
      saving,
      salary,
      bank: bankId,
      tenure,
      calcMode,
    };
    if (usingCustom) query.rate = customRate;
    if (effectiveStepUp > 0) query.stepUp = effectiveStepUp;
    if (effectiveBonus > 0) query.bonus = effectiveBonus;
    if (effectiveInflation > 0) query.inflation = effectiveInflation;
    const url = `${window.location.origin}${href('plan', query)}`;
    navigator.clipboard.writeText(url).then(() => {
      notify('Đã sao chép link chia sẻ kế hoạch');
    });
  };

  const reportPayload = {
    inputMode,
    goalType,
    target,
    targetAmount,
    solveMode,
    targetYears,
    capital,
    saving: isSavingSolver ? roadmap.requiredMonthlyDeposit : saving,
    salary,
    bankName: usingCustom ? 'Lãi suất tự nhập' : bank.name,
    tenureLabel: TENURE_LABELS[tenure] || tenure,
    rate,
    calcMode,
    annualStepUpPct: effectiveStepUp,
    annualBonusAmount: effectiveBonus,
    inflationRatePct: effectiveInflation,
    roadmap,
    feasibility,
    scenarios,
  };

  const handleOpenGoogleDocs = async () => {
    await copyReportForGoogleDocs(reportPayload);
    window.open('https://docs.new', '_blank', 'noopener,noreferrer');
    notify('Đã chép báo cáo! Hãy nhấn Ctrl+V (hoặc Cmd+V) trong trang Google Docs mới mở.');
  };

  const handleCopyForGoogleDocs = async () => {
    await copyReportForGoogleDocs(reportPayload);
    notify('Đã sao chép báo cáo (kèm bảng định dạng) vào clipboard');
  };

  return (
    <>
      <PageHeader
        icon={Target}
        eyebrow="Kế hoạch thu nhập thụ động"
        title="Bao giờ tiền lãi đủ nuôi bạn?"
        description="Nhập mục tiêu và khả năng tiết kiệm. Chúng tôi tính số vốn cần có, thời gian về đích và cách để đến nhanh hơn."
        actions={
          <>
            <Button size="sm" onClick={sharePlan}>
              <Share2 className="size-3.5" /> Chia sẻ link
            </Button>
            <Button size="sm" onClick={() => setGdocsOpen(true)} disabled={!roadmap.monthByMonthLog.length}>
              <FileText className="size-3.5 text-indigo-300" /> Google Docs
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-3.5" /> In / PDF
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={!roadmap.monthByMonthLog.length}>
              <Download className="size-3.5" /> Xuất CSV
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* ── Inputs ── */}
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
                ? 'Phiên bản Cơ bản (Nhanh): chỉ 4 thông số cốt lõi, tính thuần theo lãi suất ngân hàng.'
                : 'Phiên bản Chuyên sâu (Thực tế): thêm tăng mức gửi/năm, thưởng Tết, bù trượt giá lạm phát & chuẩn TT14.'}
            </p>
          </div>

          {/* Step 1: Dual Goal Selection */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">1. Mục tiêu cần đạt</span>
              <Segmented
                size="sm"
                value={goalType}
                onChange={setGoalType}
                options={[
                  { value: 'PASSIVE_INCOME', label: 'Lãi thụ động / tháng' },
                  { value: 'TARGET_AMOUNT', label: 'Số tiền mục tiêu' },
                ]}
              />
            </div>

            {isTargetAmount ? (
              <MoneyField
                label="Tổng số tiền tiết kiệm mục tiêu"
                hint={`Khi đạt mốc này, tiền lãi sinh ra khoảng ${vnd(roadmap.baseMonthlyInterest)}/tháng.`}
                value={targetAmount}
                onChange={setTargetAmount}
                min={50_000_000}
                max={10_000_000_000}
                step={25_000_000}
                inputMax={500_000_000_000}
                presets={presets([100_000_000, 300_000_000, 500_000_000, 1_000_000_000, 2_000_000_000, 5_000_000_000])}
              />
            ) : (
              <MoneyField
                label="Thu nhập thụ động mong muốn / tháng"
                hint={`Cần tích luỹ sổ tiết kiệm gốc khoảng ${compact(roadmap.nominalRequiredPrincipal)} (tại ${pct(rate)}/năm).`}
                value={target}
                onChange={setTarget}
                min={1_000_000}
                max={100_000_000}
                step={500_000}
                inputMax={1_000_000_000}
                presets={presets([3_000_000, 5_000_000, 10_000_000, 20_000_000, 30_000_000, 50_000_000])}
              />
            )}
          </div>

          {/* Step 2: Bidirectional Solver */}
          <div className="space-y-4 border-t border-white/[0.06] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">2. Kế hoạch gửi tiết kiệm</span>
              <Segmented
                size="sm"
                value={solveMode}
                onChange={setSolveMode}
                options={[
                  { value: 'TIME', label: 'Tính thời gian đạt' },
                  { value: 'SAVING', label: 'Tính tiền gửi / tháng' },
                ]}
              />
            </div>

            <MoneyField
              label="Vốn tiết kiệm hiện có"
              value={capital}
              onChange={setCapital}
              min={0}
              max={2_000_000_000}
              step={5_000_000}
              inputMax={100_000_000_000}
              presets={presets([0, 50_000_000, 200_000_000, 500_000_000])}
            />

            {isSavingSolver ? (
              <div className="space-y-2.5">
                <SliderField
                  label="Thời hạn muốn đạt mục tiêu"
                  display={`${targetYears} năm (${targetYears * 12} tháng)`}
                  value={targetYears}
                  onChange={setTargetYears}
                  min={1}
                  max={30}
                  step={1}
                />
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 5, 10, 15, 20].map((y) => (
                    <Chip key={y} active={targetYears === y} onClick={() => setTargetYears(y)}>
                      {y} năm
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <MoneyField
                label="Gửi thêm mỗi tháng"
                value={saving}
                onChange={setSaving}
                min={0}
                max={50_000_000}
                step={500_000}
                inputMax={1_000_000_000}
                presets={presets([2_000_000, 5_000_000, 10_000_000, 15_000_000])}
              />
            )}
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
                Chuyên sâu: Tăng gửi/năm · Thưởng Tết · Bù lạm phát · Lương &amp; TT14
              </span>
              <span className="shrink-0 font-medium text-indigo-300">Mở rộng</span>
            </button>
          ) : (
            <div className="space-y-5 border-t border-white/[0.06] pt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                Đòn bẩy &amp; Thực tế (Chuyên sâu)
              </div>

              {/* Annual step-up */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-zinc-300">Tăng mức gửi mỗi năm</label>
                  <DecimalInput
                    value={annualStepUpPct}
                    onChange={(v) => setAnnualStepUpPct(v === '' ? 0 : v)}
                    suffix="%/năm"
                    min={0}
                    max={30}
                    step={1}
                    className="w-28"
                    ariaLabel="Tỷ lệ tăng mức gửi hàng năm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 5, 10, 15].map((v) => (
                    <Chip key={v} active={Number(annualStepUpPct) === v} onClick={() => setAnnualStepUpPct(v)}>
                      {v === 0 ? 'Cố định (0%)' : `+${v}%/năm`}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Annual bonus lump sum */}
              <MoneyField
                label="Thưởng / Gửi gộp thêm cuối mỗi năm"
                value={annualBonusAmount}
                onChange={setAnnualBonusAmount}
                min={0}
                max={200_000_000}
                step={5_000_000}
                inputMax={5_000_000_000}
                presets={presets([0, 10_000_000, 20_000_000, 50_000_000])}
              />

              {/* Inflation adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[13px] text-zinc-300">Bù trượt giá lạm phát</label>
                  <DecimalInput
                    value={inflationRatePct}
                    onChange={(v) => setInflationRatePct(v === '' ? 0 : v)}
                    suffix="%/năm"
                    min={0}
                    max={15}
                    step={0.5}
                    className="w-28"
                    ariaLabel="Bù trượt giá lạm phát hàng năm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 3.5, 4.5, 6].map((v) => (
                    <Chip key={v} active={Number(inflationRatePct) === v} onClick={() => setInflationRatePct(v)}>
                      {v === 0 ? 'Tắt (0%)' : `${v}%/năm`}
                    </Chip>
                  ))}
                </div>
                {effectiveInflation > 0 && roadmap.requiredPrincipal > roadmap.nominalRequiredPrincipal && (
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90 ring-1 ring-inset ring-amber-400/20">
                    Mục tiêu gốc <strong className="tabular-nums">{compact(roadmap.nominalRequiredPrincipal)}</strong> cần
                    nâng lên <strong className="tabular-nums">{compact(roadmap.requiredPrincipal)}</strong> để giữ nguyên
                    sức mua sau lạm phát {pct(effectiveInflation, 1)}/năm.
                  </p>
                )}
              </div>

              <MoneyField
                label="Thu nhập hàng tháng"
                hint={`Độ khả thi: đang tiết kiệm ${pct(roadmap.savingsRatePercent, 1)} thu nhập, chi tiêu còn ${compact(
                  Math.max(0, salary - (roadmap.requiredMonthlyDeposit || saving))
                )}.`}
                value={salary}
                onChange={setSalary}
                min={5_000_000}
                max={200_000_000}
                step={1_000_000}
                inputMax={10_000_000_000}
              />

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                  <Pencil className="size-3.5" /> Hoặc nhập lãi suất khác
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
                    ariaLabel="Lãi suất tuỳ chỉnh"
                  />
                  {usingCustom && (
                    <button
                      onClick={() => setCustomRate('')}
                      aria-label="Bỏ lãi suất tuỳ chỉnh"
                      className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-zinc-400">Cơ sở tính lãi</span>
                <Segmented
                  size="sm"
                  value={calcMode}
                  onChange={setCalcMode}
                  options={[
                    { value: 'NOMINAL_MONTHS', label: 'Tháng đều / 12' },
                    { value: 'ACTUAL_DAYS', label: 'Chuẩn TT14 (30/365)' },
                  ]}
                />
              </div>
            </div>
          )}
        </Card>

        {/* ── Results ── */}
        <div id="planner-results" className={cx('min-w-0 space-y-5 transition-opacity', loading && 'opacity-75')}>
          {/* Headline */}
          <Card className="relative overflow-hidden p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-zinc-400">
                {isTargetAmount ? (
                  <>
                    Để tích luỹ <span className="font-medium text-white">{vnd(roadmap.requiredPrincipal)}</span>
                    {isSavingSolver && (
                      <>
                        {' '}sau <span className="font-medium text-white">{targetYears} năm</span>
                      </>
                    )}
                    , bạn cần
                  </>
                ) : (
                  <>
                    Để nhận{' '}
                    <span className="font-medium text-white">{vnd(roadmap.targetMonthlyInterest || target)}</span> mỗi
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
                  {usingCustom ? 'Lãi suất tự nhập' : `${bank.name} · ${TENURE_LABELS[tenure]}`} · {pct(rate)}
                </Badge>
                {effectiveStepUp > 0 && <Badge tone="success">Tăng gửi +{pct(effectiveStepUp, 0)}/năm</Badge>}
                {effectiveBonus > 0 && <Badge tone="success">+{compact(effectiveBonus)} thưởng/năm</Badge>}
                {effectiveInflation > 0 && <Badge tone="warning">Đã bù lạm phát {pct(effectiveInflation, 1)}/năm</Badge>}
              </div>

              <div className="mt-3 text-4xl font-semibold tracking-tight text-white tabular-nums sm:text-5xl">
                {roadmap.isAlreadyReached ? (
                  'Đã đạt mục tiêu 🎉'
                ) : isSavingSolver ? (
                  <>
                    {vnd(roadmap.requiredMonthlyDeposit)}
                    <span className="text-lg font-normal text-zinc-400 sm:text-2xl"> / tháng</span>
                  </>
                ) : reachable ? (
                  roadmap.timeText
                ) : (
                  'Hơn 60 năm'
                )}
              </div>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                {roadmap.isAlreadyReached
                  ? isTargetAmount
                    ? `Vốn hiện tại (${compact(capital)}) đã vượt mục tiêu và tạo ra ${vnd(
                        roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0
                      )} lãi mỗi tháng.`
                    : `Vốn hiện tại đã đủ tạo ra ${vnd(
                        roadmap.monthByMonthLog[0]?.monthlyPassiveIncomeGenerated || 0
                      )} lãi mỗi tháng.`
                  : isSavingSolver
                    ? `Gửi ${compact(roadmap.requiredMonthlyDeposit)} mỗi tháng${
                        effectiveStepUp > 0 ? ` (năm đầu, tăng ${pct(effectiveStepUp, 0)} mỗi năm)` : ''
                      } trong ${targetYears} năm để tích luỹ đủ ${vnd(roadmap.requiredPrincipal)}.`
                    : reachable
                      ? `Tích luỹ đủ ${vnd(roadmap.requiredPrincipal)} bằng cách gửi ${compact(saving)} mỗi tháng${
                          effectiveStepUp > 0 ? ` (tăng +${pct(effectiveStepUp, 0)}/năm)` : ''
                        } và để lãi tự tái đầu tư.`
                      : 'Với mức tiết kiệm hiện tại, mục tiêu quá xa. Hãy tăng số tiền gửi hàng tháng, bật tăng mức gửi hằng năm hoặc giảm mục tiêu.'}
              </p>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-zinc-500">
                  <span>Tiến độ hiện tại</span>
                  <span className="tabular-nums">
                    {compact(capital)} / {compact(roadmap.requiredPrincipal)}
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
                label="Lãi thụ động khi đạt"
                value={`${compact(roadmap.finalMonthlyPassiveIncome)}/th`}
                hint={`từ vốn ${compact(roadmap.requiredPrincipal)}`}
              />
            ) : (
              <Stat
                icon={Coins}
                label="Số vốn cần có"
                value={compact(roadmap.requiredPrincipal)}
                hint={`tại ${pct(rate)}/năm`}
              />
            )}

            {isSavingSolver ? (
              <Stat
                icon={Wallet}
                label="Cần gửi / tháng"
                value={compact(roadmap.requiredMonthlyDeposit)}
                hint={`tổng vốn tự gửi ${compact(roadmap.totalDeposited)}`}
              />
            ) : (
              <Stat
                icon={Wallet}
                label="Tổng tiền bạn gửi"
                value={reachable ? compact(roadmap.totalDeposited) : '—'}
                hint="vốn + tiền gửi + thưởng"
              />
            )}

            <Stat
              icon={PiggyBank}
              label="Lãi kép đóng góp"
              tone="emerald"
              value={reachable ? compact(roadmap.totalCompoundInterest) : '—'}
              hint={reachable ? `${pct(roadmap.compoundSharePct, 1)} tổng tài sản` : undefined}
            />
            <Stat
              icon={Gauge}
              label="Độ khả thi"
              tone={scoreTone}
              value={`${feasibility.score}/100`}
              hint={feasibility.ratingLabel.replace('High', 'cao')}
            />
          </div>

          {/* Insights right below Stats */}
          {(feasibility.strengths.length > 0 || feasibility.warnings.length > 0) && (
            <Card className="p-5 sm:p-6">
              <CardHeader title="Nhận xét về kế hoạch" />
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

          {/* Chart / bank comparison */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={
                view === 'growth'
                  ? 'Tài sản tăng trưởng theo thời gian'
                  : isSavingSolver
                    ? 'Ngân hàng nào cần gửi hàng tháng ít nhất?'
                    : 'Về đích nhanh nhất với ngân hàng nào?'
              }
              description={
                view === 'growth'
                  ? 'Khoảng cách giữa hai đường là phần lãi kép ngân hàng trả cho bạn.'
                  : 'Mỗi ngân hàng tính ở kỳ hạn có lãi suất cao nhất.'
              }
              right={
                <Segmented
                  size="sm"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'growth', label: 'Tăng trưởng' },
                    { value: 'banks', label: 'So sánh ngân hàng' },
                  ]}
                />
              }
            />
            {view === 'growth' ? (
              <>
                <div className="mt-6 h-72">
                  {roadmap.monthByMonthLog.length > 1 ? (
                    <GrowthChart log={roadmap.monthByMonthLog} target={roadmap.requiredPrincipal} />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-white/[0.02] text-sm text-zinc-500">
                      Nhập số tiền gửi hàng tháng để xem biểu đồ
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-2"><span className="h-0.5 w-4 rounded bg-indigo-400" /> Tổng tài sản</span>
                  <span className="flex items-center gap-2"><span className="h-0.5 w-4 border-t border-dashed border-zinc-400" /> Tiền bạn gửi</span>
                  <span className="flex items-center gap-2"><span className="h-0.5 w-4 border-t border-dotted border-emerald-400" /> Mục tiêu</span>
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
                            {b.name} <span className="font-normal text-zinc-500">· {TENURE_LABELS[t]} · {pct(r)}</span>
                          </span>
                          <span className={cx('shrink-0 font-semibold tabular-nums', i === 0 ? 'text-emerald-300' : 'text-white')}>
                            {isSavingSolver
                              ? `${compact(res.requiredMonthlyDeposit)}/th`
                              : res.monthsNeeded >= 720
                                ? '> 60 năm'
                                : duration(res.monthsNeeded)}
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
              title={isSavingSolver ? 'Cách giảm số tiền cần gửi mỗi tháng' : 'Cách để về đích sớm hơn'}
              description="So với kế hoạch hiện tại của bạn."
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
                        ? `${compact(s.r.requiredMonthlyDeposit || 0)}/tháng`
                        : s.r.monthsNeeded >= 720
                          ? '> 60 năm'
                          : s.r.timeText}
                    </div>
                    {isSavingSolver
                      ? savedMonthly > 0 && (
                          <div className="mt-1 text-xs font-medium text-emerald-300">Giảm {compact(savedMonthly)}/tháng</div>
                        )
                      : saved > 0 && (
                          <div className="mt-1 text-xs font-medium text-emerald-300">Nhanh hơn {duration(saved)}</div>
                        )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Table */}
          {roadmap.monthByMonthLog.length > 0 && (
            <Card className="p-5 sm:p-6">
              <CardHeader
                title="Chi tiết lộ trình"
                right={
                  <Segmented
                    size="sm"
                    value={rows}
                    onChange={setRows}
                    options={[
                      { value: 'yearly', label: 'Theo năm' },
                      { value: 'all', label: 'Theo tháng' },
                    ]}
                  />
                }
              />
              <Table
                className="mt-5 max-h-[440px]"
                head={['Thời điểm', 'Tiền đã gửi', 'Lãi tích luỹ', 'Tổng tài sản', 'Lãi / tháng']}
              >
                {tableRows.map((r) => {
                  const goal = r.month > 0 && r.totalBalance >= roadmap.requiredPrincipal;
                  return (
                    <tr key={r.month} className={goal ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/[0.02]'}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-200">
                        {r.month === 0 ? 'Hiện tại' : r.month % 12 === 0 ? `Năm ${r.month / 12}` : `Tháng ${r.month}`}
                        {goal && <Badge tone="success" className="ml-2">Đạt mục tiêu</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">{fmt(r.principalDeposited)}</td>
                      <td className="px-4 py-3 text-right text-emerald-300/90">+{fmt(r.interestEarnedTotal)}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{fmt(r.totalBalance)}</td>
                      <td className="px-4 py-3 text-right text-indigo-300">{fmt(r.monthlyPassiveIncomeGenerated)}</td>
                    </tr>
                  );
                })}
              </Table>
            </Card>
          )}

          <FeedbackWidget
            toolId="plan"
            toolLabel={isTargetAmount ? 'Kế hoạch tích luỹ số tiền mục tiêu' : 'Kế hoạch thu nhập thụ động'}
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
      </div>

      {/* Google Docs Modal */}
      <Modal open={gdocsOpen} onClose={() => setGdocsOpen(false)} title="Liên kết & xuất sang Google Docs">
        <div className="space-y-4">
          <Callout icon={FileText} tone="brand">
            Báo cáo bao gồm đầy đủ thông số kế hoạch, điểm khả thi, kịch bản tăng tốc và bảng lộ trình theo năm — được
            định dạng sẵn để dán trực tiếp vào Google Docs hoặc tải file <code className="text-indigo-200">.doc</code>.
          </Callout>
          <div className="space-y-2.5">
            <Button variant="primary" className="w-full" onClick={handleOpenGoogleDocs}>
              <ExternalLink className="size-4" /> Chép báo cáo &amp; Mở Google Docs (docs.new)
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleCopyForGoogleDocs}>
              <Copy className="size-4" /> Chỉ sao chép nội dung báo cáo (Ctrl+V)
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                downloadGoogleDocsFile(reportPayload);
                notify('Đã tải file .DOC tương thích Google Docs & Word');
              }}
            >
              <Download className="size-4" /> Tải file .DOC (Upload lên Google Drive / Word)
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Mẹo: Khi trang Google Docs mới mở ra, bạn chỉ cần nhấn <strong className="text-zinc-300">Ctrl + V</strong>{' '}
            (hoặc <strong className="text-zinc-300">Cmd + V</strong> trên Mac) để chèn toàn bộ tiêu đề và bảng số liệu
            vừa tính.
          </p>
        </div>
      </Modal>
      {/* Mobile sticky live summary bar */}
      <div className="print-hidden fixed inset-x-3 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-30 lg:hidden">
        <button
          type="button"
          onClick={() => document.getElementById('planner-results')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-400/25 bg-elevated/95 px-4 py-2.5 text-left shadow-2xl backdrop-blur"
        >
          <div className="min-w-0">
            <div className="text-[11px] text-zinc-400">
              {isSavingSolver ? `Cần gửi / tháng (${targetYears} năm)` : `Đích đến (${pct(rate)}/năm)`}
            </div>
            <div className="truncate text-sm font-semibold tabular-nums text-white">
              {roadmap.isAlreadyReached
                ? 'Đã đạt mục tiêu'
                : isSavingSolver
                  ? `${compact(roadmap.requiredMonthlyDeposit)}/th`
                  : reachable
                    ? roadmap.timeText
                    : '> 60 năm'}{' '}
              · <span className="text-emerald-300">{compact(roadmap.requiredPrincipal)}</span>
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
