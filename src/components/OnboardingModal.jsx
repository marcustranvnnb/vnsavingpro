import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Check,
  Home as HomeIcon,
  PiggyBank,
  Receipt,
  Sparkles,
  Target,
  User,
  Users,
} from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate, useRates, useToast } from '../state.jsx';
import { applyOnboardingStarter, saveOnboardingState } from '../utils/apiClient.js';
import { chip, compact, pct } from '../utils/format.js';
import { Badge, Button, Modal, MoneyField, cx } from './ui.jsx';

const MODE_DEFAULTS = {
  INDIVIDUAL: { capital: 50_000_000, saving: 10_000_000, passive: 12_000_000, targetCap: 500_000_000 },
  COUPLE: { capital: 150_000_000, saving: 22_000_000, passive: 20_000_000, targetCap: 1_200_000_000 },
  FAMILY: { capital: 250_000_000, saving: 28_000_000, passive: 25_000_000, targetCap: 2_000_000_000 },
};

export default function OnboardingModal({ open, onClose, initialMode = 'INDIVIDUAL' }) {
  const { lang, tx } = useI18n();
  const { best, banks, getRate } = useRates();
  const notify = useToast();
  const top12 = best('12M');

  const [step, setStep] = useState(1);
  const [householdMode, setHouseholdMode] = useState(initialMode);
  const [goalFocus, setGoalFocus] = useState('PASSIVE_INCOME');
  const [capital, setCapital] = useState(MODE_DEFAULTS[initialMode]?.capital || 50_000_000);
  const [monthlySaving, setMonthlySaving] = useState(MODE_DEFAULTS[initialMode]?.saving || 10_000_000);
  const [targetPassive, setTargetPassive] = useState(MODE_DEFAULTS[initialMode]?.passive || 12_000_000);
  const [targetCapital, setTargetCapital] = useState(MODE_DEFAULTS[initialMode]?.targetCap || 500_000_000);
  const [bankId, setBankId] = useState(() => top12?.bank?.id || 'cake');

  useEffect(() => {
    if (open) {
      setStep(1);
      const nextMode = MODE_DEFAULTS[initialMode] ? initialMode : 'INDIVIDUAL';
      setHouseholdMode(nextMode);
      const d = MODE_DEFAULTS[nextMode];
      setCapital(d.capital);
      setMonthlySaving(d.saving);
      setTargetPassive(d.passive);
      setTargetCapital(d.targetCap);
      if (top12?.bank?.id) setBankId(top12.bank.id);
    }
  }, [open, initialMode, top12?.bank?.id]);

  const handleSelectMode = (nextMode) => {
    setHouseholdMode(nextMode);
    const d = MODE_DEFAULTS[nextMode] || MODE_DEFAULTS.INDIVIDUAL;
    setCapital(d.capital);
    setMonthlySaving(d.saving);
    setTargetPassive(d.passive);
    setTargetCapital(d.targetCap);
  };

  const handleDismiss = () => {
    saveOnboardingState({ dismissed: true, householdMode, goalFocus });
    onClose?.();
  };

  const handleComplete = () => {
    applyOnboardingStarter({
      householdMode,
      goalFocus,
      targetMonthlyPassive: targetPassive,
      targetCapital,
      monthlySaving,
      capital,
      bankId,
    });
    onClose?.();
    if (goalFocus === 'RATES_COMPARE') {
      notify(tx('Đã lưu hồ sơ gợi ý · Mở bảng xếp hạng lãi suất', 'Starter preferences saved · Opening Bank Rates', '初期設定を保存・金利ランキングへ移動'));
      navigate(href('rates'));
      return;
    }
    if (goalFocus === 'FX_MANAGER') {
      notify(tx('Đã lưu hồ sơ gợi ý · Mở Quản trị Ngoại tệ FX', 'Starter preferences saved · Opening FX Manager', '初期設定を保存・外貨FX管理へ移動'));
      navigate(href('fx'));
      return;
    }
    if (goalFocus === 'SALARY_2026') {
      notify(tx('Đã lưu hồ sơ gợi ý · Mở Tính Lương & BHXH Luật 2026', 'Starter preferences saved · Opening 2026 Salary & BHXH', '初期設定を保存・給与2026へ移動'));
      navigate(href('salary'));
      return;
    }
    notify(tx('Đã khởi tạo thông số mẫu · Mở lộ trình của bạn', 'Starter plan ready · Opening your Roadmap', 'プラン初期値を反映しました'));
    navigate(
      href('plan', {
        hh: householdMode,
        target: goalFocus === 'PASSIVE_INCOME' ? targetPassive : undefined,
        saving: monthlySaving,
      })
    );
  };

  const profiles = [
    {
      id: 'INDIVIDUAL',
      icon: User,
      badge: tx('Dự phòng 4 tháng', '4-Mo Buffer', '4ヶ月防衛資金'),
      title: tx('Cá nhân độc lập', 'Individual', '個人プラン'),
      desc: tx(
        'Theo dõi lương chính, thu nhập phụ & quỹ dự phòng cá nhân.',
        'Optimize salary, side income & solo emergency buffer.',
        '本業・副収入・個人の緊急防衛資金を整理。'
      ),
    },
    {
      id: 'COUPLE',
      icon: Users,
      badge: tx('Dự phòng 6 tháng', '6-Mo Buffer', '6ヶ月防衛資金'),
      title: tx('Cặp đôi (2 người)', 'Couple', 'カップル'),
      desc: tx(
        'Chia tỷ lệ góp chung công bằng & đồng bộ mục tiêu nhà/xe/thụ động.',
        'Split contributions fairly & align shared milestones together.',
        '2人の積立割合を配分し共有目標を設計。'
      ),
    },
    {
      id: 'FAMILY',
      icon: HomeIcon,
      badge: tx('Ưu tiên an toàn', 'Safety-First', '家族安全優先'),
      title: tx('Gia đình có con nhỏ / phụ thuộc', 'Family', 'ファミリー'),
      desc: tx(
        'Tách riêng chi phí nuôi con, ưu tiên lấp đầy Quỹ dự phòng 6–12 tháng.',
        'Guard dependent budgets & prioritize a 6–12 month safety net.',
        '扶養費を分離し6〜12ヶ月分の安全網を優先確保。'
      ),
    },
  ];

  const goals = [
    {
      id: 'PASSIVE_INCOME',
      icon: PiggyBank,
      badge: tx('Phổ biến nhất', 'Most Popular', '一番人気'),
      title: tx('Thu nhập thụ động mỗi tháng', 'Monthly Passive Income', '毎月の不労所得'),
      desc: tx(
        'Tính chính xác mất bao lâu để tiền lãi tiết kiệm hàng tháng chi trả sinh hoạt.',
        'See when monthly bank interest replaces part or all of your expenses.',
        '定期預金の毎月利息で生活費を賄えるまでの期間を算出。'
      ),
    },
    {
      id: 'TARGET_AMOUNT',
      icon: Target,
      title: tx('Tích luỹ mốc vốn mục tiêu', 'Target Capital Milestone', '目標資産額の達成'),
      desc: tx(
        'Cán mốc 500 triệu, 1 tỷ hay quỹ mua nhà/xe với số tiền góp hàng tháng.',
        'Hit 500M, 1B+ VND, home down-payment, or milestone reserve cleanly.',
        '5億・10億VNDなど具体的な資産・住宅頭金目標へ逆算。'
      ),
    },
    {
      id: 'RATES_COMPARE',
      icon: BarChart3,
      title: tx('So sánh lãi suất ngân hàng số cao nhất', 'Compare Top Digital Bank Yields', '高金利ネット銀行を比較'),
      desc: tx(
        `Đối chiếu Cake, TNEX, Timo, LioBank (cao nhất ${pct(top12.rate, 2, lang)}/năm kỳ hạn 12T).`,
        `Compare Cake, TNEX, Timo & LioBank (up to ${pct(top12.rate, 2, lang)} p.a. for 12M).`,
        `Cake・TNEX・Timo・LioBankを比較（12ヶ月最高 ${pct(top12.rate, 2, lang)}）。`
      ),
    },
    {
      id: 'FX_MANAGER',
      icon: ArrowLeftRight,
      title: tx('Quản trị Ngoại tệ & Tỷ giá Vietcombank (FX)', 'Manage Multi-Currency & FX Rates', '外貨FX・Vietcombank為替管理'),
      desc: tx(
        'Định giá USD, EUR, JPY... quy đổi VND và so sánh ngưỡng hoà vốn với gửi tiết kiệm.',
        'Track USD/EUR/JPY net worth and compare FX yields against VND bank deposits.',
        '米ドル・円などの換算総額とVND定期預金との比較を試算します。'
      ),
    },
    {
      id: 'SALARY_2026',
      icon: Receipt,
      title: tx('Tính Lương, Thuế 5 bậc & BHXH Luật 2026', '2026 Salary Gross–Net, 5-Bracket PIT & BHXH', '2026年新法 給与・所得税・社会保険'),
      desc: tx(
        'Áp dụng giảm trừ 15,5tr/6,2tr, 5 bậc thuế mới và chuyển thẳng Lương Net vào Kế hoạch.',
        'Apply 15.5M/6.2M deductions, 5 brackets & send Net income into your Planner.',
        '基礎控除15.5M・5段階税率で手取りを計算しプランナーへ連動します。'
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={handleDismiss}
      title={tx('Thiết lập lộ trình trong 30 giây', '30-Second Quick Setup', '30秒クイックプラン設定')}
    >
      <div className="space-y-5">
        {/* Stepper */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/[0.06]">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cx(
                  'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition',
                  step === n
                    ? 'bg-indigo-500 text-white'
                    : step > n
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/[0.05] text-zinc-500'
                )}
              >
                {step > n ? <Check className="size-3" /> : n}
                <span className="hidden sm:inline">
                  {n === 1
                    ? tx('Hồ sơ', 'Profile', '世帯')
                    : n === 2
                      ? tx('Mục tiêu', 'Goal', '目標')
                      : tx('Con số mẫu', 'Starter', '初期値')}
                </span>
              </span>
            ))}
          </div>
          <span className="text-[11px] text-zinc-400">
            {tx(`Bước ${step} / 3`, `Step ${step} of 3`, `ステップ ${step} / 3`)}
          </span>
        </div>

        {/* Step 1: Household Profile */}
        {step === 1 && (
          <div className="space-y-2.5">
            <p className="text-xs leading-relaxed text-zinc-400">
              {tx(
                'Bạn đang lập kế hoạch tiết kiệm theo mô hình nào?',
                'Who are you building this savings roadmap for?',
                'どの世帯タイプで貯蓄プランを設計しますか？'
              )}
            </p>
            <div className="grid gap-2.5">
              {profiles.map((p) => {
                const Icon = p.icon;
                const active = householdMode === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectMode(p.id)}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                      active
                        ? 'border-indigo-400/50 bg-indigo-500/12 ring-1 ring-inset ring-indigo-400/30'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{p.title}</span>
                        <Badge tone={active ? 'brand' : 'neutral'}>{p.badge}</Badge>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Primary Goal */}
        {step === 2 && (
          <div className="space-y-2.5">
            <p className="text-xs leading-relaxed text-zinc-400">
              {tx(
                'Mục tiêu ưu tiên nhất bạn muốn kiểm tra ngay là gì?',
                'Which financial milestone do you want to calculate first?',
                '最初に確認したい目標を選択してください。'
              )}
            </p>
            <div className="grid gap-2.5">
              {goals.map((g) => {
                const Icon = g.icon;
                const active = goalFocus === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalFocus(g.id)}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                      active
                        ? 'border-indigo-400/50 bg-indigo-500/12 ring-1 ring-inset ring-indigo-400/30'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-300">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{g.title}</span>
                        {g.badge && <Badge tone="success">{g.badge}</Badge>}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Starter Numbers or Preferred Bank */}
        {step === 3 && (
          <div className="space-y-4">
            {goalFocus === 'RATES_COMPARE' ? (
              <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Sparkles className="size-3.5" />
                  {tx('Chọn ngân hàng số bạn quan tâm trước:', 'Select a digital bank to inspect first:', '注目するネット銀行を選択：')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {banks.map((b) => {
                    const r12 = getRate(b, '12M');
                    const selected = bankId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBankId(b.id)}
                        className={cx(
                          'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition',
                          selected
                            ? 'border-emerald-400/50 bg-emerald-500/15 text-white'
                            : 'border-white/[0.08] bg-black/20 text-zinc-300 hover:border-white/20'
                        )}
                      >
                        <span className="truncate font-medium">{b.name}</span>
                        <span className="ml-2 shrink-0 font-mono font-semibold text-emerald-300">
                          {pct(r12, 2, lang)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {tx(
                    'Thông số mẫu của bạn cũng được lưu sẵn để bạn chuyển sang Lập kế hoạch bất cứ lúc nào.',
                    'Your selected household model is also saved whenever you jump into the Roadmap Planner.',
                    '選択した世帯モデルも同時に保存され、いつでもプラン設計へ移行できます。'
                  )}
                </p>
              </div>
            ) : (
              <>
                {goalFocus === 'PASSIVE_INCOME' ? (
                  <MoneyField
                    label={tx('Thu nhập thụ động mục tiêu / tháng', 'Target Monthly Passive Income', '目標の毎月不労所得')}
                    value={targetPassive}
                    onChange={setTargetPassive}
                    min={3_000_000}
                    max={50_000_000}
                    step={1_000_000}
                    presets={[5_000_000, 10_000_000, 15_000_000, 25_000_000].map((v) => ({
                      value: v,
                      label: chip(v, lang),
                    }))}
                  />
                ) : (
                  <MoneyField
                    label={tx('Mốc vốn tích luỹ mục tiêu', 'Target Capital Milestone', '目標積立元本')}
                    value={targetCapital}
                    onChange={setTargetCapital}
                    min={100_000_000}
                    max={5_000_000_000}
                    step={50_000_000}
                    presets={[300_000_000, 500_000_000, 1_000_000_000, 2_000_000_000].map((v) => ({
                      value: v,
                      label: chip(v, lang),
                    }))}
                  />
                )}

                <MoneyField
                  label={tx('Tiết kiệm mỗi tháng dự kiến', 'Estimated Monthly Saving', '毎月の積立予定額')}
                  value={monthlySaving}
                  onChange={setMonthlySaving}
                  min={1_000_000}
                  max={80_000_000}
                  step={1_000_000}
                  presets={[5_000_000, 10_000_000, 20_000_000, 30_000_000].map((v) => ({
                    value: v,
                    label: chip(v, lang),
                  }))}
                />

                <MoneyField
                  label={tx('Vốn hiện có ban đầu', 'Starting Capital', '初期元本')}
                  value={capital}
                  onChange={setCapital}
                  min={0}
                  max={2_000_000_000}
                  step={10_000_000}
                  presets={[0, 50_000_000, 150_000_000, 300_000_000].map((v) => ({
                    value: v,
                    label: chip(v, lang),
                  }))}
                />
              </>
            )}

            <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/[0.06]">
              {tx('Tóm tắt:', 'Summary:', '設定概要：')}{' '}
              <strong className="text-white">{profiles.find((p) => p.id === householdMode)?.title}</strong> ·{' '}
              <span className="text-indigo-200">{compact(monthlySaving, lang)}/{tx('tháng', 'mo', '月')}</span> ·{' '}
              <span className="text-emerald-300">{top12.bank.name} ({pct(top12.rate, 2, lang)})</span>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
          {step === 1 ? (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-zinc-500 transition hover:text-zinc-200"
            >
              {tx('Bỏ qua lần sau', 'Skip for now', 'スキップ')}
            </button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              <ArrowLeft className="size-3.5" /> {tx('Quay lại', 'Back', '戻る')}
            </Button>
          )}

          {step < 3 ? (
            <Button type="button" variant="primary" size="sm" onClick={() => setStep((s) => Math.min(3, s + 1))}>
              {tx('Tiếp tục', 'Continue', '次へ')} <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button type="button" variant="primary" size="sm" onClick={handleComplete}>
              <Sparkles className="size-3.5" />
              {goalFocus === 'RATES_COMPARE'
                ? tx('Mở bảng lãi suất ngay', 'View Bank Rates Now', '金利ランキングへ')
                : goalFocus === 'FX_MANAGER'
                  ? tx('Mở Quản trị Ngoại tệ FX', 'Open FX Manager', '外貨FX管理へ')
                  : goalFocus === 'SALARY_2026'
                    ? tx('Mở Lương & BHXH 2026', 'Open 2026 Payroll Tool', '給与2026へ')
                    : tx('Xem lộ trình cá nhân hoá', 'Open Personalized Roadmap', '専用プランを作成する')}
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
