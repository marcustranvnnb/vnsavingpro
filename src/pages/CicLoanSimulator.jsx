import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
  DecimalInput,
  MoneyField,
  PageHeader,
  Progress,
  Segmented,
  SliderField,
  Stat,
  cx,
} from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, useRates, useToast } from '../state.jsx';
import {
  consumeToolRestoreState,
  loadActivePassbooks,
  loadSavedCicLoanState,
  loadSavedPlannerState,
  loadSavedSalaryState,
  recordToolRun,
  saveCicLoanState,
  useServerCalc,
} from '../utils/apiClient.js';
import { chip, compact, pct, vnd } from '../utils/format.js';

const DEFAULT_CIC_LOAN_STATE = {
  debtGroup: 1,
  lateCount24m: 0,
  monthlyNetIncome: 28_000_000,
  existingMonthlyDebtPayment: 3_000_000,
  creditCardLimit: 50_000_000,
  creditCardBalance: 10_000_000,
  creditAgeYears: 3,
  newInquiries6m: 1,
  hasCreditCard: true,
  hasSecuredLoan: false,
  hasConsumerCashLoan: false,
  hasSavingsCollateral: true,
  passbookPrincipal: 200_000_000,
  passbookRatePct: 8.6,
  passbookTenureMonths: 12,
  monthsAlreadyHeld: 8,
  urgentCashNeeded: 40_000_000,
  urgentDaysNeeded: 45,
  pledgeSpreadPct: 1.8,
  assetPrice: 2_400_000_000,
  downPayment: 720_000_000,
  preferentialRatePct: 6.8,
  preferentialMonths: 24,
  floatingRatePct: 10.5,
  loanYears: 20,
  repaymentMethod: 'DECLINING_BALANCE',
  annualPrepaymentAmount: 50_000_000,
  earlyRepayPenaltyPct: 1.5,
  currentMonthlyRent: 12_000_000,
  rentGrowthPct: 3.5,
  assetAppreciationPct: 5.5,
  savingsYieldPct: 8.6,
  compareHorizonYears: 5,
};

const INITIAL_RESULT = {
  score: 642,
  rank: 3,
  riskBand: 'low',
  statusLabel: 'Tốt / Rủi ro thấp — Dễ duyệt lãi ưu đãi',
  debtGroup: 1,
  dtiPct: 10.7,
  cardUtilizationPct: 20,
  maxSafeAdditionalInstallment: 8_200_000,
  pillars: { payment: 100, debtBurden: 93, creditAge: 82, creditMix: 80, inquiries: 88 },
  whatIf: { score: 654, rank: 2, gain: 12 },
  recommendations: [
    'Hồ sơ tín dụng đang ở trạng thái tốt. Duy trì thanh toán tự động đúng hạn và giữ DTI dưới 40% khi vay mới.',
  ],
  pledgeArbitrage: {
    passbookPrincipal: 200_000_000,
    urgentCashNeeded: 40_000_000,
    urgentDaysNeeded: 45,
    pledgeRatePct: 10.4,
    breakFullLost: 10_793_425,
    breakPartialLost: 2_158_685,
    grossBorrowInterest: 512_877,
    netSpreadCost: 88_767,
    netSavedVsFullBreak: 10_704_658,
    netSavedVsPartialBreak: 2_069_918,
    recommend: 'PLEDGE',
    note: 'Vay cầm cố sổ tiết kiệm giữ trọn lãi cao (8.6%/năm).',
  },
  homeLoan: {
    loanAmount: 1_680_000_000,
    downPayment: 720_000_000,
    downPaymentPct: 30,
    phase1FirstPayment: 16_520_000,
    phase2FirstPayment: 20_230_000,
    paymentShockVnd: 3_710_000,
    totalInterestBaseline: 1_557_800_000,
    totalInterestWithPrepay: 985_400_000,
    totalPenaltyPaid: 2_250_000,
    interestSaved: 570_150_000,
    monthsShortened: 72,
    phase1DtiPct: 69.7,
    phase2DtiPct: 83.0,
    horizonYears: 5,
    projectedAssetValue: 3_136_700_000,
    remainingLoanAtHorizon: 1_260_000_000,
    buyNetWealth: 1_876_700_000,
    rentNetWealth: 1_450_000_000,
    totalRentPaid: 772_000_000,
    totalBuyCashPaid: 1_780_000_000,
    winner: 'BUY',
    advantageVnd: 426_700_000,
    summaryNote: 'Kết quả tham khảo ban đầu — bấm Chạy mô hình để tính chính xác theo số liệu của bạn.',
  },
  privacyNotice:
    'Tuân thủ Nghị định 13/2023/NĐ-CP: không thu thập CCCD hay số tài khoản ngân hàng. Kiểm tra báo cáo CIC chính thức miễn phí 1 lần/năm tại cic.gov.vn.',
};

export default function CicLoanSimulator() {
  const { lang, tx } = useI18n();
  const { getAccessToken } = useAuth();
  const { best } = useRates();
  const notify = useToast();

  const initialRestored = useMemo(() => consumeToolRestoreState('cic'), []);
  const [tab, setTab] = useState(() => (initialRestored?.activeTab === 'home_loan' ? 'home_loan' : 'cic_pledge'));

  const [state, setState] = useState(() => {
    if (initialRestored && Object.keys(initialRestored).length > 0) {
      return { ...DEFAULT_CIC_LOAN_STATE, ...initialRestored };
    }
    const saved = loadSavedCicLoanState();
    if (saved && Object.keys(saved).length > 0) {
      return { ...DEFAULT_CIC_LOAN_STATE, ...saved };
    }
    const plan = loadSavedPlannerState();
    const salary = loadSavedSalaryState();
    const passbooks = loadActivePassbooks();
    const totalPb = passbooks.reduce((s, p) => s + (Number(p.principal) || 0), 0);
    return {
      ...DEFAULT_CIC_LOAN_STATE,
      ...(salary?.amount ? { monthlyNetIncome: Math.round(salary.amount * 0.85) } : {}),
      ...(plan?.capital || totalPb ? { downPayment: Math.max(totalPb, Number(plan?.capital) || 0), passbookPrincipal: Math.max(totalPb, Number(plan?.capital) || 200_000_000) } : {}),
    };
  });

  useEffect(() => {
    saveCicLoanState(state);
  }, [state]);

  const setField = (key, val) => setState((prev) => ({ ...prev, [key]: val }));

  const syncFromEcosystem = () => {
    const plan = loadSavedPlannerState();
    const salary = loadSavedSalaryState();
    const passbooks = loadActivePassbooks();
    const totalPb = passbooks.reduce((s, p) => s + (Number(p.principal) || 0), 0);
    const best12M = best('12M')?.rate || 8.6;
    const netApprox = salary?.amount
      ? Math.round((Number(salary.amount) + Number(salary.partnerAmount || 0)) * 0.84)
      : Math.round((Number(plan?.salaryFullTime || 28_000_000) + Number(plan?.partnerSalaryFullTime || 0)) * 0.86);
    const capitalVnd = totalPb > 0 ? totalPb : Number(plan?.capital) || state.passbookPrincipal;

    setState((prev) => ({
      ...prev,
      monthlyNetIncome: Math.max(5_000_000, netApprox),
      passbookPrincipal: Math.max(10_000_000, capitalVnd),
      passbookRatePct: best12M,
      savingsYieldPct: best12M,
      downPayment: Math.max(50_000_000, capitalVnd),
    }));
    notify(
      tx(
        'Đã đồng bộ Thu nhập Net, Sổ tiết kiệm & Lãi suất ngân hàng số cao nhất!',
        'Synced Net Income, Savings Principal & Top 12M Bank Yield!',
        '手取り収入・貯蓄残高・最高定期金利を同期しました！'
      )
    );
  };

  const { data: res, loading, isDirty, run } = useServerCalc('cic_loan_bundle', state, INITIAL_RESULT, {
    mode: 'manual',
    minLoadingMs: 320,
    onSuccess: (calcRes) => {
      recordToolRun({
        tool: 'cic',
        title:
          tab === 'home_loan'
            ? tx(`Mua nhà ${compact(state.assetPrice, lang)} (${state.loanYears}N)`, `Loan ${compact(state.assetPrice, lang)} (${state.loanYears}Y)`, `住宅購入試算 ${compact(state.assetPrice, lang)}`)
            : tx(`Điểm CIC ${calcRes.score} (Hạng ${calcRes.rank})`, `CIC Score ${calcRes.score} (Rank ${calcRes.rank})`, `CICスコア ${calcRes.score} (ランク${calcRes.rank})`),
        summary:
          tab === 'home_loan'
            ? calcRes.homeLoan?.summaryNote
            : tx(`DTI: ${calcRes.dtiPct}% · Hạn mức góp an toàn thêm: ${compact(calcRes.maxSafeAdditionalInstallment, lang)}/th`, `DTI: ${calcRes.dtiPct}% · Safe extra payment: ${compact(calcRes.maxSafeAdditionalInstallment, lang)}/mo`, `DTI: ${calcRes.dtiPct}% · 安全追加返済枠: ${compact(calcRes.maxSafeAdditionalInstallment, lang)}/月`),
        metrics: [
          { label: tx('Điểm CIC', 'CIC Score', 'CICスコア'), value: `${calcRes.score} (Hạng ${calcRes.rank})`, tone: calcRes.riskBand === 'low' ? 'emerald' : 'amber' },
          { label: tx('DTI hiện tại', 'DTI %', '返済負担率'), value: `${calcRes.dtiPct}%`, tone: calcRes.dtiPct <= 40 ? 'indigo' : 'amber' },
          { label: tx('Tiết kiệm lãi Prepay', 'Prepay Saved', '繰上返済節約'), value: compact(calcRes.homeLoan?.interestSaved || 0, lang), tone: 'emerald' },
        ],
        inputs: { ...state, activeTab: tab },
        accessToken: getAccessToken(),
      });
    },
  });

  const scorePct = Math.round(((res.score - 403) / (706 - 403)) * 100);
  const hl = res.homeLoan || INITIAL_RESULT.homeLoan;
  const pa = res.pledgeArbitrage || INITIAL_RESULT.pledgeArbitrage;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Landmark}
        eyebrow={tx('Không thu thập CCCD · Nghị định 13/2023/NĐ-CP', 'Zero-PII Simulation · Decree 13 Compliant', '個人情報不要・政令13/2023準拠')}
        title={tx('Sức Khỏe Tín Dụng CIC & Mô Phỏng Vay Mua Nhà 2 Giai Đoạn', 'CIC Credit Health & 2-Stage Home Loan Simulator', 'CIC信用スコア＆2段階金利住宅ローン比較')}
        description={tx(
          'Ước tính điểm CIC (403–706 · Hạng 1–10), so sánh Vay cầm cố sổ tiết kiệm vs. Phá sổ sớm, và giải bài toán Mua nhà (Ưu đãi + Thả nổi) hay Thuê nhà gửi tiết kiệm.',
          'Estimate your 5-pillar CIC readiness score (403–706), compare Passbook Pledging vs. Early Break, and simulate 2-stage Vietnam Mortgages vs. Renting & Saving.',
          'CIC信用スコア（403〜706点）試算、定期預金担保vs中途解約比較、および2段階金利住宅ローンvs賃貸貯蓄シミュレーションを一括実行できます。'
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={syncFromEcosystem}>
              <RefreshCw className="size-3.5 text-emerald-300" />
              {tx('Đồng bộ Lương & Sổ từ Hệ thống', 'Sync Salary & Savings', '給与・貯蓄データを同期')}
            </Button>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: 'cic_pledge', label: tx('Điểm CIC & Cầm cố sổ', 'CIC & Passbook Pledge', 'CIC・預金担保') },
                { value: 'home_loan', label: tx('Mua nhà 2 giai đoạn lãi', '2-Stage Home Loan', '住宅ローン比較') },
              ]}
            />
          </div>
        }
      />

      <WorkspaceSplit
        resultId="cic-results"
        stickySummary={{
          eyebrow: tab === 'home_loan' ? tx('Trả góp sau ưu đãi', 'Post-Promo Payment', '優遇後返済額') : tx('Sức khỏe CIC ước tính', 'Estimated CIC', '推定CICスコア'),
          value: tab === 'home_loan' ? `${vnd(hl.phase2FirstPayment, lang)}/th` : `${res.score} · Hạng ${res.rank}`,
        }}
        runAction={{
          onRun: run,
          isDirty,
          loading,
          label: tx('Chạy mô phỏng CIC & Khoản vay', 'Run CIC & Loan Model', 'シミュレーション実行'),
        }}
        left={
          <div className="space-y-5">
            {tab === 'cic_pledge' ? (
              <>
                <Card className="p-5 space-y-5">
                  <CardHeader
                    title={tx('1. Dữ liệu Tín dụng Hành vi (Ẩn danh)', '1. Anonymous Credit Profile', '1. 匿名クレジット指標')}
                    description={tx('Không yêu cầu nhập CCCD hay số tài khoản.', 'No national ID or account numbers required.', '国民IDや口座番号の入力は不要です。')}
                  />

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {tx('Nhóm nợ hiện tại (Thông tư 11/NHNN)', 'Current Debt Group (SBV Circ. 11)', '現在の債務区分')}
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((g) => (
                        <Chip key={g} active={state.debtGroup === g} onClick={() => setField('debtGroup', g)}>
                          {tx(`Nhóm ${g}`, `Grp ${g}`, `区分${g}`)}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <MoneyField
                    label={tx('Thu nhập ròng Net hộ gia đình/tháng', 'Monthly Household Net Income', '世帯月間手取り収入')}
                    value={state.monthlyNetIncome}
                    onChange={(v) => setField('monthlyNetIncome', v)}
                    min={5_000_000}
                    max={250_000_000}
                    step={1_000_000}
                    presets={[15_000_000, 28_000_000, 45_000_000, 80_000_000].map((v) => ({ value: v, label: chip(v, lang) }))}
                  />

                  <MoneyField
                    label={tx('Tổng trả góp nợ hiện tại / tháng', 'Current Monthly Debt Payments', '現在の月額ローン返済額')}
                    value={state.existingMonthlyDebtPayment}
                    onChange={(v) => setField('existingMonthlyDebtPayment', v)}
                    min={0}
                    max={150_000_000}
                    step={500_000}
                    presets={[0, 3_000_000, 8_000_000, 15_000_000].map((v) => ({ value: v, label: chip(v, lang) }))}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MoneyField
                      label={tx('Tổng hạn mức thẻ tín dụng', 'Credit Card Total Limit', 'クレカ利用枠合計')}
                      value={state.creditCardLimit}
                      onChange={(v) => setField('creditCardLimit', v)}
                      min={0}
                      max={300_000_000}
                      step={5_000_000}
                    />
                    <MoneyField
                      label={tx('Dư nợ đang dùng trên thẻ', 'Current Card Balance', '現在のクレカ残高')}
                      value={state.creditCardBalance}
                      onChange={(v) => setField('creditCardBalance', v)}
                      min={0}
                      max={300_000_000}
                      step={1_000_000}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SliderField
                      label={tx('Thâm niên thẻ/vay (năm)', 'Credit History (yrs)', 'クレジット歴（年）')}
                      display={`${state.creditAgeYears} ${tx('năm', 'yrs', '年')}`}
                      value={state.creditAgeYears}
                      onChange={(v) => setField('creditAgeYears', v)}
                      min={0}
                      max={20}
                      step={0.5}
                    />
                    <SliderField
                      label={tx('Mở thẻ/tra cứu 6T qua', 'New Inquiries (6M)', '直近6ヶ月の新規申込')}
                      display={`${state.newInquiries6m} ${tx('lần', 'reqs', '件')}`}
                      value={state.newInquiries6m}
                      onChange={(v) => setField('newInquiries6m', v)}
                      min={0}
                      max={8}
                      step={1}
                    />
                  </div>
                </Card>

                <Card className="p-5 space-y-4">
                  <CardHeader
                    title={tx('2. Bài toán Cầm cố Sổ Tiết kiệm vs. Rút Sớm', '2. Passbook Pledge vs. Early Break', '2. 定期預金担保 vs 中途解約')}
                    description={tx('Khi đột xuất cần tiền ngắn hạn: nên vay cầm cố sổ hay phá sổ sớm?', 'Need urgent short-term cash? Test borrowing against your deposit vs. breaking it early.', '急な資金需要時に定期預金を担保に借りるのと中途解約のどちらが有利か比較します。')}
                  />
                  <MoneyField
                    label={tx('Giá trị sổ tiết kiệm đang gửi', 'Savings Passbook Balance', '定期預金残高')}
                    value={state.passbookPrincipal}
                    onChange={(v) => setField('passbookPrincipal', v)}
                    min={10_000_000}
                    max={2_000_000_000}
                    step={10_000_000}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MoneyField
                      label={tx('Số tiền cần dùng gấp', 'Urgent Cash Needed', '必要資金')}
                      value={state.urgentCashNeeded}
                      onChange={(v) => setField('urgentCashNeeded', v)}
                      min={5_000_000}
                      max={500_000_000}
                      step={5_000_000}
                    />
                    <SliderField
                      label={tx('Số ngày cần xoay vốn', 'Bridge Duration (days)', '借入日数')}
                      display={`${state.urgentDaysNeeded} ${tx('ngày', 'days', '日')}`}
                      value={state.urgentDaysNeeded}
                      onChange={(v) => setField('urgentDaysNeeded', v)}
                      min={7}
                      max={180}
                      step={1}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">{tx('Lãi sổ (%/năm)', 'Passbook %', '預金金利%')}</label>
                      <DecimalInput value={state.passbookRatePct} onChange={(v) => setField('passbookRatePct', v)} suffix="%" min={1} max={20} step={0.1} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">{tx('Đã gửi (tháng)', 'Months Held', '経過月数')}</label>
                      <DecimalInput value={state.monthsAlreadyHeld} onChange={(v) => setField('monthsAlreadyHeld', v)} suffix="M" min={0} max={35} step={1} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">{tx('Biên độ cầm cố', 'Pledge Spread', '担保上乗せ幅')}</label>
                      <DecimalInput value={state.pledgeSpreadPct} onChange={(v) => setField('pledgeSpreadPct', v)} suffix="%" min={0.5} max={8} step={0.1} />
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-5 space-y-5">
                <CardHeader
                  title={tx('Thông số Mua Nhà / Xe & Thuê Nhà So Sánh', '2-Stage Loan & Rent Comparison Inputs', '住宅購入ローン＆賃貸比較入力')}
                  description={tx('Mô phỏng đúng cấu trúc vay Việt Nam: lãi ưu đãi ban đầu + lãi thả nổi + trả trước hạn mỗi năm.', 'Models Vietnamese 2-stage mortgages (promo period + floating reset + annual prepayment).', '優遇金利期間＋変動金利リセット＋年次繰上返済を反映します。')}
                />

                <MoneyField
                  label={tx('Giá trị tài sản (Nhà / Xe)', 'Target Asset Price', '物件・資産価格')}
                  value={state.assetPrice}
                  onChange={(v) => setField('assetPrice', v)}
                  min={200_000_000}
                  max={20_000_000_000}
                  step={50_000_000}
                  presets={[800_000_000, 1_800_000_000, 2_400_000_000, 4_000_000_000].map((v) => ({ value: v, label: chip(v, lang) }))}
                />

                <MoneyField
                  label={tx('Vốn tự có trả trước (Down payment)', 'Upfront Down Payment', '頭金（自己資金）')}
                  value={state.downPayment}
                  onChange={(v) => setField('downPayment', v)}
                  min={0}
                  max={state.assetPrice * 0.9}
                  step={20_000_000}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">{tx('Lãi ưu đãi GĐ 1', 'Stage 1 Promo %', '優遇金利 %')}</label>
                    <DecimalInput value={state.preferentialRatePct} onChange={(v) => setField('preferentialRatePct', v)} suffix="%" min={1} max={20} step={0.1} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">{tx('Số tháng ưu đãi', 'Promo Months', '優遇期間(月)')}</label>
                    <DecimalInput value={state.preferentialMonths} onChange={(v) => setField('preferentialMonths', v)} suffix="M" min={3} max={120} step={3} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">{tx('Lãi thả nổi GĐ 2', 'Floating %', '変動金利 %')}</label>
                    <DecimalInput value={state.floatingRatePct} onChange={(v) => setField('floatingRatePct', v)} suffix="%" min={2} max={25} step={0.2} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SliderField
                    label={tx('Thời hạn vay (năm)', 'Loan Term (yrs)', '借入期間（年）')}
                    display={`${state.loanYears} ${tx('năm', 'yrs', '年')}`}
                    value={state.loanYears}
                    onChange={(v) => setField('loanYears', v)}
                    min={3}
                    max={30}
                    step={1}
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {tx('Phương thức trả nợ', 'Repayment Method', '返済方式')}
                    </label>
                    <Segmented
                      size="sm"
                      value={state.repaymentMethod}
                      onChange={(v) => setField('repaymentMethod', v)}
                      options={[
                        { value: 'DECLINING_BALANCE', label: tx('Dư nợ giảm dần', 'Declining', '元金均等') },
                        { value: 'ANNUITY', label: tx('Gốc+lãi đều (Niên kim)', 'Annuity', '元利均等') },
                      ]}
                    />
                  </div>
                </div>

                <MoneyField
                  label={tx('Trả trước gốc mỗi năm (Thưởng Tết)', 'Annual Extra Prepayment', '毎年の繰上返済額')}
                  value={state.annualPrepaymentAmount}
                  onChange={(v) => setField('annualPrepaymentAmount', v)}
                  min={0}
                  max={500_000_000}
                  step={10_000_000}
                />

                <MoneyField
                  label={tx('Tiền thuê nhà tương đương / tháng', 'Comparable Monthly Rent', '比較用の月額家賃')}
                  value={state.currentMonthlyRent}
                  onChange={(v) => setField('currentMonthlyRent', v)}
                  min={0}
                  max={100_000_000}
                  step={1_000_000}
                />
              </Card>
            )}
          </div>
        }
        right={
          <div id="cic-results" className="space-y-5">
            {loading && <CalculationLoader />}

            {tab === 'cic_pledge' ? (
              <>
                <Card className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-indigo-300">
                        {tx('Chỉ số Sẵn sàng Tín dụng CIC (Ước tính)', 'Estimated CIC Credit Readiness', '推定CIC信用スコア')}
                      </span>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-4xl font-bold tracking-tight text-white tabular-nums">{res.score}</span>
                        <span className="text-xs text-zinc-500">/ 706</span>
                        <Badge tone={res.riskBand === 'low' ? 'success' : res.riskBand === 'medium' ? 'warning' : 'danger'}>
                          {tx(`Hạng ${res.rank} / 10`, `Rank ${res.rank} / 10`, `ランク ${res.rank} / 10`)}
                        </Badge>
                      </div>
                    </div>
                    <Badge tone={res.debtGroup === 1 ? 'success' : 'danger'}>
                      {tx(`Nhóm nợ ${res.debtGroup}`, `Debt Group ${res.debtGroup}`, `債務区分 ${res.debtGroup}`)}
                    </Badge>
                  </div>

                  <Progress value={scorePct} tone={res.riskBand === 'low' ? 'emerald' : 'indigo'} />
                  <p className="text-xs leading-relaxed text-zinc-300">{res.statusLabel}</p>

                  <AdaptiveGrid cols={{ mobile: 2, tablet: 3, duo: 3, desktop: 3 }}>
                    <Stat
                      label={tx('DTI (Nợ / Thu nhập)', 'Current DTI', '返済負担率')}
                      value={`${res.dtiPct}%`}
                      tone={res.dtiPct <= 40 ? 'emerald' : 'amber'}
                      hint={tx('Ngưỡng an toàn <= 40%', 'Safe ceiling <= 40%', '安全水準 <= 40%')}
                    />
                    <Stat
                      label={tx('Dùng hạn mức thẻ', 'Card Utilization', 'カード利用率')}
                      value={`${res.cardUtilizationPct}%`}
                      tone={res.cardUtilizationPct <= 30 ? 'emerald' : 'amber'}
                      hint={tx('Tối ưu <= 30%', 'Optimal <= 30%', '最適 <= 30%')}
                    />
                    <Stat
                      label={tx('Hạn mức góp thêm tối đa', 'Safe Extra Loan Cap', '安全追加返済枠')}
                      value={compact(res.maxSafeAdditionalInstallment, lang)}
                      tone="indigo"
                      hint={tx('Giữ DTI <= 40%', 'Keeps DTI <= 40%', 'DTI 40%以下維持')}
                    />
                  </AdaptiveGrid>

                  {res.whatIf?.gain > 0 && (
                    <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-3.5 text-xs text-emerald-100">
                      <Sparkles className="mr-1.5 inline size-3.5 text-emerald-300" />
                      <strong>{tx('Mô phỏng What-If 90 ngày:', '90-Day What-If Boost:', '90日改善シミュレーション：')}</strong>{' '}
                      {tx(
                        `Nếu hạ dùng thẻ về <= 20% và tạm ngưng mở hồ sơ mới, điểm CIC ước tính tăng +${res.whatIf.gain} điểm lên ${res.whatIf.score} (Hạng ${res.whatIf.rank}).`,
                        `Lowering card usage to <= 20% and pausing new inquiries can lift your score +${res.whatIf.gain} pts to ${res.whatIf.score} (Rank ${res.whatIf.rank}).`,
                        `カード利用率を20%以下に抑え新規申請を控えると、スコアは+${res.whatIf.gain}点の${res.whatIf.score}（ランク${res.whatIf.rank}）へ向上見込みです。`
                      )}
                    </div>
                  )}
                </Card>

                {/* Passbook Pledge Comparison */}
                <Card className="p-5 sm:p-6 space-y-4">
                  <CardHeader
                    title={tx('Vay Cầm cố Sổ Tiết kiệm vs. Phá Sổ Sớm', 'Passbook Pledge vs. Early Deposit Break', '定期預金担保ローン vs 中途解約')}
                    description={pa.note}
                    right={
                      <Badge tone={pa.recommend === 'PLEDGE' ? 'success' : 'warning'}>
                        {pa.recommend === 'PLEDGE'
                          ? tx('Khuyên dùng: Cầm cố sổ', 'Recommended: Pledge', '推奨：預金担保ローン')
                          : tx('Khuyên dùng: Rút từng phần', 'Recommended: Partial Break', '推奨：一部解約')}
                      </Badge>
                    }
                  />
                  <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 3, desktop: 3 }}>
                    <Stat
                      label={tx('Lãi mất nếu phá nguyên sổ', 'Full-Break Lost Interest', '全額解約時の失効利息')}
                      value={vnd(pa.breakFullLost, lang)}
                      tone="amber"
                      hint={tx('Hạ về 0.5%/năm', 'Drops to 0.5% p.a.', '0.5%へ低下')}
                    />
                    <Stat
                      label={tx(`Chi phí ròng Cầm cố (${pa.urgentDaysNeeded}N)`, `Net Pledge Spread Cost`, `実質担保コスト`)}
                      value={vnd(pa.netSpreadCost, lang)}
                      tone="indigo"
                      hint={tx(`Lãi sổ vẫn chạy ${state.passbookRatePct}%`, `Passbook still earns ${state.passbookRatePct}%`, `預金金利継続`)}
                    />
                    <Stat
                      label={tx('Tiết kiệm được khi Cầm cố', 'Net Saved vs. Full Break', '担保ローンによる節約額')}
                      value={vnd(Math.max(0, pa.netSavedVsFullBreak), lang)}
                      tone="emerald"
                      hint={tx(`So với rút 1 phần: +${vnd(Math.max(0, pa.netSavedVsPartialBreak), lang)}`, `Vs. partial: +${vnd(Math.max(0, pa.netSavedVsPartialBreak), lang)}`, `一部解約比`)}
                    />
                  </AdaptiveGrid>
                </Card>

                <Card className="p-5 space-y-2.5">
                  <CardHeader title={tx('Khuyến nghị Tối ưu Hồ sơ Tín dụng', 'Actionable Readiness Recommendations', '信用力改善アクション')} />
                  {(res.recommendations || []).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </Card>
              </>
            ) : (
              <>
                <Card className="p-5 sm:p-6 space-y-4">
                  <CardHeader
                    title={tx(`Kịch bản Vay ${compact(hl.loanAmount, lang)} (${100 - hl.downPaymentPct}% giá trị tài sản)`, `2-Stage Loan Summary (${compact(hl.loanAmount, lang)})`, `2段階金利ローン試算サマリー`)}
                    right={
                      <Badge tone={hl.phase2DtiPct <= 45 ? 'success' : 'warning'}>
                        {tx(`DTI sau ưu đãi: ${hl.phase2DtiPct}%`, `Post-Promo DTI: ${hl.phase2DtiPct}%`, `優遇後DTI: ${hl.phase2DtiPct}%`)}
                      </Badge>
                    }
                  />
                  <AdaptiveGrid cols={{ mobile: 2, tablet: 4, duo: 4, desktop: 4 }}>
                    <Stat
                      label={tx('Trả tháng GĐ 1 (Ưu đãi)', 'Stage 1 Monthly', '第1段階 毎月返済')}
                      value={vnd(hl.phase1FirstPayment, lang)}
                      tone="indigo"
                      hint={`${state.preferentialRatePct}% · ${state.preferentialMonths}M`}
                    />
                    <Stat
                      label={tx('Trả tháng GĐ 2 (Thả nổi)', 'Stage 2 Monthly', '第2段階 毎月返済')}
                      value={vnd(hl.phase2FirstPayment, lang)}
                      tone={hl.phase2DtiPct <= 45 ? 'emerald' : 'amber'}
                      hint={`+${vnd(hl.paymentShockVnd, lang)} ${tx('sốc lãi', 'jump', '上昇幅')}`}
                    />
                    <Stat
                      label={tx('Lãi tiết kiệm nhờ trả sớm', 'Prepay Interest Saved', '繰上返済による節税額')}
                      value={compact(hl.interestSaved, lang)}
                      tone="emerald"
                      hint={tx(`Rút ngắn ${hl.monthsShortened} tháng`, `${hl.monthsShortened} mo faster`, `${hl.monthsShortened}ヶ月短縮`)}
                    />
                    <Stat
                      label={tx('Tổng lãi (Không trả sớm)', 'Baseline Total Interest', '総支払利息')}
                      value={compact(hl.totalInterestBaseline, lang)}
                      tone="default"
                      hint={`${state.loanYears} ${tx('năm', 'yrs', '年')}`}
                    />
                  </AdaptiveGrid>
                  {hl.phase2DtiPct > 45 && (
                    <Callout icon={AlertTriangle} tone="warning">
                      {tx(
                        `Cảnh báo sốc lãi thả nổi: Khi hết ${state.preferentialMonths} tháng ưu đãi, khoản trả góp tăng lên ${vnd(hl.phase2FirstPayment, lang)}/tháng (${hl.phase2DtiPct}% thu nhập ròng). Nên nâng vốn trả trước hoặc giảm giá trị vay.`,
                        `Floating rate shock warning: After ${state.preferentialMonths} months, monthly payments jump to ${vnd(hl.phase2FirstPayment, lang)} (${hl.phase2DtiPct}% of net income).`,
                        `変動金利リスク警告：${state.preferentialMonths}ヶ月後の返済額は月${vnd(hl.phase2FirstPayment, lang)}（手取りの${hl.phase2DtiPct}%）へ上昇します。`
                      )}
                    </Callout>
                  )}
                </Card>

                <Card className="p-5 sm:p-6 space-y-4">
                  <CardHeader
                    title={tx(`Mua Nhà Ngay vs. Thuê Nhà + Gửi Tiết Kiệm Số (Sau ${hl.horizonYears} Năm)`, `Buy Now vs. Rent & Digital Savings (${hl.horizonYears}-Yr Horizon)`, `今すぐ購入 vs 賃貸＋ネット銀行積立 (${hl.horizonYears}年後)`)}
                    description={hl.summaryNote}
                    right={
                      <Badge tone={hl.winner === 'BUY' ? 'brand' : 'success'}>
                        <Building2 className="size-3" />
                        {hl.winner === 'BUY'
                          ? tx('Mua ngay lợi hơn', 'Buy Leads', '購入が有利')
                          : tx('Thuê + Tiết kiệm lợi hơn', 'Rent & Save Leads', '賃貸＋積立が有利')}
                      </Badge>
                    }
                  />
                  <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 3, desktop: 3 }}>
                    <Stat
                      label={tx('Tài sản ròng nếu Mua ngay', 'Buy Now Net Equity', '購入時純資産')}
                      value={compact(hl.buyNetWealth, lang)}
                      tone="indigo"
                      hint={tx(`Nhà ${compact(hl.projectedAssetValue, lang)} - Nợ ${compact(hl.remainingLoanAtHorizon, lang)}`, `Asset ${compact(hl.projectedAssetValue, lang)} - Debt`, `資産−残債`)}
                    />
                    <Stat
                      label={tx('Quỹ tiền nếu Thuê + Tiết kiệm', 'Rent & Save Portfolio', '賃貸＋預金残高')}
                      value={compact(hl.rentNetWealth, lang)}
                      tone="emerald"
                      hint={tx(`Gửi vốn đầu + chênh lệch ở ${state.savingsYieldPct}%`, `Compounded at ${state.savingsYieldPct}%`, `年利${state.savingsYieldPct}%複利`)}
                    />
                    <Stat
                      label={tx('Chênh lệch lợi thế ròng', 'Net Wealth Advantage', '純資産差額')}
                      value={compact(hl.advantageVnd, lang)}
                      tone="amber"
                      hint={tx(`Sau ${hl.horizonYears} năm`, `After ${hl.horizonYears} years`, `${hl.horizonYears}年後`)}
                    />
                  </AdaptiveGrid>
                </Card>
              </>
            )}

            <Callout icon={ShieldCheck} tone="brand">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{res.privacyNotice}</span>
                <a
                  href="https://cic.gov.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-200 hover:underline"
                >
                  cic.gov.vn <ExternalLink className="size-3" />
                </a>
              </div>
            </Callout>

            <SavePlanPromptCard />
          </div>
        }
      />

      <FeedbackWidget tool="cic" toolLabel={tx('Điểm CIC & Vay Mua Nhà', 'CIC & Home Loan', 'CIC・住宅ローン')} />
    </div>
  );
}
