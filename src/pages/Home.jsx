import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Cloud,
  Coffee,
  ExternalLink,
  FileSpreadsheet,
  Heart,
  Home as HomeIcon,
  Lock,
  LogIn,
  MessageSquarePlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { APP_VERSION, getLocalizedTools } from '../tools.js';
import { UNIKORN_BADGE_IMG_URL, UNIKORN_EMBED_URL, UNIKORN_PRODUCT_URL } from '../data/contributorsData.js';
import { useI18n } from '../i18n/index.jsx';
import { href, useRates } from '../state.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useServerCalc } from '../utils/apiClient.js';
import { compact, chip, pct } from '../utils/format.js';
import { HouseholdModeSwitch } from '../components/HouseholdModeSwitch.jsx';
import { AdaptiveGrid, DualPaneSection, PageContainer } from '../components/AdaptiveLayout.jsx';
import { useDisplayMode } from '../layout/DisplayModeContext.jsx';
import { Badge, BankMark, Button, Card, Chip, cx } from '../components/ui.jsx';

const TARGETS = [5_000_000, 10_000_000, 20_000_000, 30_000_000];
const SAVINGS = [3_000_000, 5_000_000, 10_000_000, 20_000_000];

const HOUSEHOLD_EF_NOTE = {
  vi: {
    INDIVIDUAL: 'Cá nhân · Quỹ dự phòng khuyến nghị: 4 tháng chi tiêu',
    COUPLE: 'Cặp đôi · Quỹ dự phòng khuyến nghị: 6 tháng chi tiêu',
    FAMILY: 'Gia đình · Quỹ dự phòng khuyến nghị: 6–12 tháng chi tiêu',
  },
  en: {
    INDIVIDUAL: 'Individual · Recommended Emergency Fund: 4 months of expenses',
    COUPLE: 'Couple · Recommended Emergency Fund: 6 months of expenses',
    FAMILY: 'Family · Recommended Emergency Fund: 6–12 months of expenses',
  },
  ja: {
    INDIVIDUAL: '個人 · 推奨緊急資金：生活費4ヶ月分',
    COUPLE: 'カップル · 推奨緊急資金：生活費6ヶ月分',
    FAMILY: '家族 · 推奨緊急資金：生活費6〜12ヶ月分',
  },
};

const HOUSEHOLD_CARDS = [
  {
    id: 'INDIVIDUAL',
    icon: User,
    badge: { vi: 'Dự phòng 4 tháng', en: '4-Month Buffer', ja: '緊急資金 4ヶ月分' },
    title: { vi: 'Cá nhân độc lập', en: 'Individual Planner', ja: '個人（シングル）' },
    subtitle: { vi: 'Tối ưu 1 nguồn thu + thu nhập phụ', en: '1 primary earner + side income', ja: '本業＋副収入を効率運用' },
    highlights: {
      vi: [
        'Gộp lương chính, freelance & đầu tư thành dòng tiền rõ ràng',
        'Theo dõi Quỹ dự phòng 4 tháng & tỷ lệ phủ chi tiêu',
        'So sánh nhanh ngân hàng lãi cao cho khoản gửi linh hoạt',
      ],
      en: [
        'Combine full-time salary, freelance & investments in one cash flow',
        'Track your 4-month Emergency Fund and expense coverage ratio',
        'Spot the highest-yield digital bank for flexible or term deposits',
      ],
      ja: [
        '本業・副業・投資収入を1つの明確なキャッシュフローに統合',
        '4ヶ月分の緊急防衛資金と生活費カバー率をリアルタイム追跡',
        '柔軟性の高い高金利ネット銀行をひと目で比較',
      ],
    },
    cta: { vi: 'Lập kế hoạch Cá nhân', en: 'Plan as Individual', ja: '個人プランを作成' },
  },
  {
    id: 'COUPLE',
    icon: Users,
    badge: { vi: 'Dự phòng 6 tháng', en: '6-Month Buffer', ja: '緊急資金 6ヶ月分' },
    title: { vi: 'Cặp đôi (2 người)', en: 'Couple (2 Earners)', ja: 'カップル（2人）' },
    subtitle: { vi: 'Đồng bộ mục tiêu tài chính chung', en: 'Align shared financial milestones', ja: 'ふたりの資産目標を同期' },
    highlights: {
      vi: [
        'Chia khoản góp theo tỷ lệ thu nhập, 50/50 hoặc tự chỉnh %',
        'Quỹ dự phòng 6 tháng thanh khoản tách biệt kỳ hạn dài',
        'Stress-test sức chịu đựng khi 1 trong 2 tạm giảm thu nhập',
      ],
      en: [
        'Split monthly contributions proportionally, 50/50, or custom %',
        'Keep a liquid 6-month buffer separate from long-term deposits',
        'Stress-test household resilience if either partner pauses income',
      ],
      ja: [
        '収入比例・50/50・自由割合で毎月の積立負担を公平に配分',
        '6ヶ月分の緊急資金と長期定期預金を明確に分離管理',
        'どちらか一方の収入が減った場合の耐久力をストレステスト',
      ],
    },
    cta: { vi: 'Lập kế hoạch Cặp đôi', en: 'Plan as a Couple', ja: 'カップルプランを作成' },
  },
  {
    id: 'FAMILY',
    icon: HomeIcon,
    badge: { vi: 'Dự phòng 6–12 tháng', en: '6–12 Mo Buffer', ja: '緊急資金 6〜12ヶ月分' },
    title: { vi: 'Gia đình có người phụ thuộc', en: 'Family with Dependents', ja: 'ファミリー（扶養家族あり）' },
    subtitle: { vi: 'Bảo vệ an toàn tài chính trụ cột', en: 'Protect household & dependents', ja: '家族と大黒柱の安全網を保護' },
    highlights: {
      vi: [
        'Tách riêng chi phí cố định & chi phí nuôi con / bố mẹ',
        'Bật chế độ Ưu tiên lấp Quỹ dự phòng trước (Fund-First)',
        'Cảnh báo tự động khi tỷ trọng thu nhập trụ cột từ ≥ 75%',
      ],
      en: [
        'Separate fixed household costs from child & dependent expenses',
        'Toggle Fund-First mode to fill your Emergency Fund before compounding',
        'Auto-warn on breadwinner income concentration at >= 75%',
      ],
      ja: [
        '固定生活費と養育・扶養コストを分けて正確に把握',
        '緊急資金優先モード（Fund-First）で安全網を先に完成',
        '1人の収入比率が75%以上のとき集中リスクを自動警告',
      ],
    },
    cta: { vi: 'Lập kế hoạch Gia đình', en: 'Plan for Family', ja: '家族プランを作成' },
  },
];

const INITIAL_ESTIMATE = {
  timeText: '...',
  requiredPrincipal: 0,
  compoundSharePct: 0,
  monthsNeeded: 0,
};

function QuickEstimate() {
  const { best } = useRates();
  const { lang, tx } = useI18n();
  const [householdMode, setHouseholdMode] = useState('INDIVIDUAL');
  const [target, setTarget] = useState(10_000_000);
  const [saving, setSaving] = useState(5_000_000);
  const top = best('12M');

  const { data: r, loading } = useServerCalc(
    'quick_estimate',
    {
      targetMonthlyInterest: target,
      monthlySavingsAmount: saving,
      initialCapital: 0,
      annualInterestRate: top.rate,
    },
    INITIAL_ESTIMATE
  );

  return (
    <Card className="relative overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-400">
            {tx('Ước tính nhanh', 'Quick Estimate', 'クイック試算')}
          </span>
          <Badge tone="success">
            <Zap className="size-3" /> {top.bank.name} {pct(top.rate, 2, lang)}
          </Badge>
        </div>

        <div className="mt-4">
          <HouseholdModeSwitch value={householdMode} onChange={setHouseholdMode} compact />
          <p className="mt-1.5 text-[11px] text-zinc-400">{HOUSEHOLD_EF_NOTE[lang][householdMode]}</p>
        </div>

        <div className="mt-4 text-[13px] text-zinc-400">
          {tx('Tôi muốn nhận mỗi tháng', 'Desired monthly passive income', '毎月の目標不労所得')}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TARGETS.map((v) => (
            <Chip key={v} active={target === v} onClick={() => setTarget(v)}>
              {chip(v, lang)}
            </Chip>
          ))}
        </div>

        <div className="mt-4 text-[13px] text-zinc-400">
          {tx('Mỗi tháng tôi tiết kiệm được', 'Monthly savings deposit', '毎月の積立可能額')}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAVINGS.map((v) => (
            <Chip key={v} active={saving === v} onClick={() => setSaving(v)}>
              {chip(v, lang)}
            </Chip>
          ))}
        </div>

        <div className={cx('mt-5 border-t border-white/[0.06] pt-4 transition-opacity sm:mt-6 sm:pt-5', loading && 'opacity-70')}>
          <div className="text-[13px] text-zinc-500">
            {tx('Bạn sẽ đạt mục tiêu sau', 'Time to reach target', '目標達成までの期間')}
          </div>
          <div className="mt-1 break-words text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
            {r.timeText}
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            {tx('Cần tích luỹ', 'Target principal', '必要元本')}{' '}
            <span className="font-medium text-white">{compact(r.requiredPrincipal, lang)}</span> —{' '}
            {tx('trong đó lãi kép đóng góp', 'with compound interest contributing', '複利利息の割合')}{' '}
            <span className="font-medium text-emerald-300">{pct(r.compoundSharePct, 0, lang)}</span>.
          </div>
        </div>

        <Button
          as="a"
          href={href('plan', { target, saving, hh: householdMode })}
          variant="primary"
          className="mt-5 w-full"
        >
          {tx('Xem lộ trình chi tiết', 'Open Detailed Roadmap', '詳細ロードマップを見る')} <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

function RateSnapshot() {
  const { banks, getRate, updatedAt } = useRates();
  const { lang, tx } = useI18n();
  const rows = banks.map((b) => ({ bank: b, rate: getRate(b, '12M') })).sort((a, b) => b.rate - a.rate);
  const max = rows[0]?.rate || 1;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-white">
              {tx('Lãi suất kỳ hạn 12 tháng', '12-Month Savings Rates', '12ヶ月定期預金 金利ランキング')}
            </h2>
            <Badge tone="brand">
              {tx(`Cập nhật đầu tháng · ${updatedAt}`, `Monthly 1st Sync · ${updatedAt}`, `毎月1日同期 · ${updatedAt}`)}
            </Badge>
          </div>
          <p className="mt-1 text-[13px] text-zinc-500">
            {tx('Xếp hạng 4 ngân hàng số tại Việt Nam, %/năm', 'Top 4 Vietnam digital banks (% p.a.)', 'ベトナム主要ネット銀行4行ランキング（年利%）')}
          </p>
        </div>
        <a href={href('rates')} className="flex items-center gap-1 text-[13px] text-indigo-300 hover:text-indigo-200">
          {tx('Tất cả kỳ hạn', 'All tenures', '全期間を比較')} <ArrowUpRight className="size-3.5" />
        </a>
      </div>
      <div className="mt-5 space-y-4">
        {rows.map(({ bank, rate }, i) => (
          <div key={bank.id} className="flex items-center gap-3">
            <BankMark bank={bank} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-zinc-200">{bank.name}</span>
                <span className={cx('shrink-0 text-sm font-semibold tabular-nums', i === 0 ? 'text-emerald-300' : 'text-white')}>
                  {pct(rate, 2, lang)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={cx('h-full rounded-full', i === 0 ? 'bg-emerald-400' : 'bg-zinc-500/60')}
                  style={{ width: `${(rate / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Home({ onOpenAuth, onOpenData }) {
  const { best, updatedAt } = useRates();
  const { user, authConfigured } = useAuth();
  const { lang, tx } = useI18n();
  const { mode, duoPosture } = useDisplayMode();
  const top = best('12M');
  const localizedTools = getLocalizedTools(lang);
  const primary = localizedTools.filter((t) => t.primary);
  const secondary = localizedTools.filter((t) => !t.primary);
  const isMobileMode = mode === 'mobile';
  const compactFold = mode === 'duo' && duoPosture === 'tabletop';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-[-280px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <PageContainer
          className={cx(
            'relative',
            compactFold ? 'pb-8 pt-6' : isMobileMode ? 'pb-10 pt-6' : 'pb-14 pt-10 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-18'
          )}
        >
          <DualPaneSection
            ratio="wide-left"
            align="center"
            left={
              <div className="animate-rise min-w-0">
                <a
                  href={href('rates')}
                  className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-xs text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.07] sm:rounded-full sm:py-1 sm:pl-1"
                >
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300">
                    {APP_VERSION}
                  </span>
                  <span>
                    {tx(
                      `Lãi suất cập nhật ${updatedAt} · Auto-sync đầu mỗi tháng`,
                      `Rates updated ${updatedAt} · Auto-synced 1st of month`,
                      `金利更新 ${updatedAt} · 毎月1日 自動同期`
                    )}
                  </span>
                  <ArrowRight className="size-3 shrink-0" />
                </a>
                <h1
                  className={cx(
                    'mt-5 font-semibold leading-[1.12] tracking-tight text-white',
                    isMobileMode ? 'text-3xl' : 'text-3xl sm:mt-6 sm:text-5xl lg:text-[54px]'
                  )}
                >
                  {tx('Biến tiền tiết kiệm thành ', 'Turn monthly savings into ', '毎月の貯蓄を')}
                  <span className="text-gradient">
                    {tx('thu nhập thụ động', 'predictable passive income', '安定した不労所得へ')}
                  </span>
                </h1>
                <p
                  className={cx(
                    'mt-4 max-w-xl leading-relaxed text-zinc-400',
                    isMobileMode ? 'text-[15px]' : 'text-[15px] sm:mt-5 sm:text-lg'
                  )}
                >
                  {tx(
                    'Lập lộ trình tài chính chuẩn xác cho Cá nhân, Cặp đôi & Gia đình — biết rõ cần gửi bao nhiêu, lấp Quỹ dự phòng thế nào và chọn ngân hàng số nào lãi cao nhất. Tối ưu đồng bộ cho Mobile, Tablet, Duo / Màn hình gập & PC.',
                    'Build data-driven savings roadmaps for Individuals, Couples & Families — know how much to deposit, how to fill your Emergency Fund, and which Vietnam digital bank pays the highest yield. Adaptive across Mobile, Tablet, Duo/Fold & Desktop.',
                    '個人・カップル・家族向けに、毎月の積立額・緊急防衛資金・高金利ネット銀行を正確に試算。Mobile・Tablet・Duo/折りたたみ・PCの全画面に最適化されています。'
                  )}
                </p>
                <div className={cx('mt-7 flex gap-3', isMobileMode ? 'flex-col' : 'flex-col sm:mt-8 sm:flex-row')}>
                  <Button as="a" href={href('plan')} variant="primary" size="lg" className={isMobileMode ? 'w-full' : 'w-full sm:w-auto'}>
                    {tx('Lập kế hoạch ngay', 'Start Planning Now', '今すぐプラン設計')} <ArrowRight className="size-4" />
                  </Button>
                  <Button as="a" href={href('rates')} size="lg" className={isMobileMode ? 'w-full' : 'w-full sm:w-auto'}>
                    {tx('So sánh lãi suất', 'Compare Bank Rates', '金利を比較する')}
                  </Button>
                </div>
                <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-white/[0.06] pt-6 sm:mt-10 sm:gap-6">
                  {[
                    { k: pct(top.rate, 2, lang), v: tx('Lãi suất cao nhất (12T)', 'Highest 12M Rate', '12ヶ月最高金利') },
                    { k: tx('4 chế độ', '4 Screens', '4画面対応'), v: tx('Mobile · Tablet · Duo · PC', 'Mobile · Tablet · Duo · PC', 'Mobile · Tablet · Duo · PC') },
                    { k: 'Mùng 1', v: tx('Cập nhật lãi suất đầu tháng', 'Auto-synced 1st of month', '毎月1日自動レート同期') },
                  ].map((s) => (
                    <div key={s.v} className="min-w-0">
                      <dt className={cx('font-semibold tracking-tight text-white tabular-nums', isMobileMode ? 'text-base' : 'text-lg sm:text-2xl')}>
                        {s.k}
                      </dt>
                      <dd className="mt-1 text-[11px] leading-snug text-zinc-500 sm:text-xs">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            }
            right={
              <div className="animate-rise min-w-0 [animation-delay:120ms]">
                <QuickEstimate />
              </div>
            }
          />
        </PageContainer>
      </section>

      {/* Household Modes */}
      <PageContainer as="section" className="pt-12 sm:pt-16 lg:pt-20">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
            <Users className="size-3.5" /> {tx('3 mô hình tài chính', '3 Household Models', '3つの世帯モデル')}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {tx('Lập kế hoạch theo đúng mô hình tài chính của bạn', 'Plan around how your household actually saves', 'ライフスタイルに合わせた貯蓄設計')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {tx(
              'Chọn xuất phát điểm phù hợp — mọi thông số Quỹ dự phòng, quy tắc góp chung 2 người và Stress-test rủi ro trụ cột sẽ được thiết lập tự động.',
              'Pick the setup that matches your life stage — Emergency Fund targets, 2-earner contribution splits, and income shock stress-tests adapt automatically.',
              '世帯構成を選ぶだけで、緊急防衛資金の目安・2人の積立配分・収入減少ストレステストが自動最適化されます。'
            )}
          </p>
        </div>

        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 3 }} hingeAligned className="mt-7">
          {HOUSEHOLD_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.id}
                href={href('plan', { hh: card.id })}
                className="card-interactive group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-surface p-5 hover:border-indigo-400/30 hover:bg-elevated"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/20">
                      <Icon className="size-5 text-indigo-300" />
                    </span>
                    <Badge tone="brand">{card.badge[lang]}</Badge>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{card.title[lang]}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">{card.subtitle[lang]}</p>
                  <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3.5 text-xs leading-relaxed text-zinc-400">
                    {card.highlights[lang].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="mt-5 flex items-center gap-1.5 text-[13px] font-medium text-indigo-300 transition-colors group-hover:text-white">
                  {card.cta[lang]} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            );
          })}
        </AdaptiveGrid>
      </PageContainer>

      {/* Tools */}
      <PageContainer className="py-12 sm:py-16 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
              <Sparkles className="size-3.5" /> {tx('Bộ công cụ', 'Toolkit', 'ツール一覧')}
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {tx('Mọi thứ bạn cần để tiết kiệm thông minh', 'Everything you need to compound smarter', '賢く資産を増やすオールインワンツール')}
            </h2>
          </div>
        </div>

        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 4 }} hingeAligned className="mt-7">
          {primary.map((t) => (
            <a
              key={t.id}
              href={href(t.id)}
              className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-elevated"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/20">
                <t.icon className="size-5 text-indigo-300" />
              </span>
              <span className="mt-5 text-[15px] font-semibold text-white">{t.label}</span>
              <span className="mt-1.5 flex-1 text-[13px] leading-relaxed text-zinc-500">{t.desc}</span>
              <span className="mt-5 flex items-center gap-1 text-[13px] font-medium text-zinc-400 transition-colors group-hover:text-white">
                {tx('Mở công cụ', 'Open tool', 'ツールを開く')} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </AdaptiveGrid>

        <AdaptiveGrid
          cols={{ mobile: 1, tablet: 2, duo: 2, desktop: secondary.length <= 2 ? 2 : 3 }}
          hingeAligned
          className="mt-3"
        >
          {secondary.map((t) => (
            <a
              key={t.id}
              href={href(t.id)}
              className="card-interactive group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-surface p-4 hover:bg-elevated"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.07]">
                <t.icon className="size-[18px] text-zinc-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">{t.label}</span>
                <span className="mt-0.5 block line-clamp-2 text-xs text-zinc-500 sm:truncate">{t.desc}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-white" />
            </a>
          ))}
        </AdaptiveGrid>
      </PageContainer>

      {/* Unikorn Community & Hall of Fame Showcase */}
      <PageContainer as="section" className="pb-12 sm:pb-16">
        <Card className="relative overflow-hidden border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] via-surface to-amber-500/[0.05] p-5 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <DualPaneSection
            ratio="wide-left"
            align="center"
            left={
              <div className="relative space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="warning">
                    <Sparkles className="size-3" /> Live on Unikorn.vn
                  </Badge>
                  <Badge tone="brand">
                    <Award className="size-3" /> {tx('Xây dựng cùng cộng đồng', 'Community Built', 'コミュニティ共創')}
                  </Badge>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {tx(
                    'Theo dõi tiến độ & Tiếp sức VnSavingPro trên Unikorn',
                    'Track Progress & Support VnSavingPro on Unikorn',
                    'Unikorn.vn で開発の歩みをチェック＆応援しよう'
                  )}
                </h2>

                <p className="text-sm leading-relaxed text-zinc-300">
                  {tx(
                    'VnSavingPro hiện đã có mặt chính thức trên nền tảng Unikorn. Mọi người có thể vào trang Unikorn để trực tiếp gửi feedback (input), theo dõi cách từng góp ý được cải thiện thành tính năng mới, cũng như Clap, Review, Support hoặc Donate tiếp sức cho dự án.',
                    'VnSavingPro is live on Unikorn.vn! Visit our product page to see how community feedback turns into real upgrades, submit new ideas, and Clap, Review, Support, or Donate to keep this toolkit growing.',
                    'VnSavingProはUnikorn.vnに公式掲載されています。皆様からのフィードバックがどのように改善・新機能へ反映されているかを確認でき、新提案・Clap・レビュー・サポート（寄付）も行えます。'
                  )}
                </p>

                <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
                  <Button
                    as="a"
                    href={UNIKORN_PRODUCT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="primary"
                    size="md"
                  >
                    <ExternalLink className="size-4" />
                    {tx('Mở VnSavingPro trên Unikorn', 'Visit VnSavingPro on Unikorn', 'Unikorn.vn ページへ')}
                  </Button>
                  <Button as="a" href={href('contributors')} variant="secondary" size="md">
                    <Award className="size-4 text-amber-300" />
                    {tx('Bảng Vinh Danh Cộng Đồng', 'Contributors Hall of Fame', 'コミュニティ表彰を見る')}
                  </Button>
                </div>
              </div>
            }
            right={
              <div className="relative space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-canvas/70 p-4">
                  <a
                    href={UNIKORN_EMBED_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-xl transition hover:opacity-95"
                  >
                    <img
                      src={UNIKORN_BADGE_IMG_URL}
                      alt="VnSavingPro trên Unikorn.vn"
                      style={{ width: '256px', height: '64px' }}
                      width={256}
                      height={64}
                      loading="lazy"
                      className="max-w-full rounded-xl shadow-md"
                    />
                  </a>
                  <span className="text-[11px] font-medium text-zinc-400">
                    {tx('Huy hiệu chính thức trên Unikorn', 'Official Unikorn Badge', 'Unikorn 公式バッジ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <a
                    href={UNIKORN_PRODUCT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-interactive rounded-xl border border-white/[0.08] bg-canvas/60 p-3 hover:border-indigo-400/40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <MessageSquarePlus className="size-3.5 text-indigo-300" />
                      {tx('Góp ý & Theo dõi', 'Input Feedback', '意見投稿・改善追跡')}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-400">
                      {tx('Xem sản phẩm được nâng cấp từ góp ý thế nào', 'Track how suggestions ship live', '要望の反映状況をリアルタイム確認')}
                    </p>
                  </a>

                  <a
                    href={UNIKORN_PRODUCT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-interactive rounded-xl border border-white/[0.08] bg-canvas/60 p-3 hover:border-amber-400/40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <ThumbsUp className="size-3.5 text-amber-300" />
                      {tx('Clap ủng hộ', 'Clap to Support', 'Clap で応援')}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-400">
                      {tx('Giúp nhiều bạn trẻ Việt khám phá công cụ', 'Help more savers find VnSavingPro', 'より多くの利用者へ広める')}
                    </p>
                  </a>

                  <a
                    href={UNIKORN_PRODUCT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-interactive rounded-xl border border-white/[0.08] bg-canvas/60 p-3 hover:border-emerald-400/40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Star className="size-3.5 text-emerald-300" />
                      {tx('Viết Review', 'Write Review', 'レビュー投稿')}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-400">
                      {tx('Chia sẻ đánh giá trải nghiệm thực tế', 'Share your real savings experience', '実際の体験レビューを共有')}
                    </p>
                  </a>

                  <a
                    href={UNIKORN_PRODUCT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-interactive rounded-xl border border-white/[0.08] bg-canvas/60 p-3 hover:border-rose-400/40"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Coffee className="size-3.5 text-rose-300" />
                      {tx('Support / Donate', 'Support / Donate', 'サポート / 寄付')}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-400">
                      {tx('Tiếp sức server & cập nhật lãi suất đầu tháng', 'Back hosting & monthly 1st rate sync', 'サーバー維持と毎月1日同期を支援')}
                    </p>
                  </a>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Heart className="size-3.5 text-rose-400" />
                    {tx('Người đóng góp tiêu biểu được vinh danh công khai', 'Contributors credited on Hall of Fame', '協力者の皆様を表彰ページで紹介中')}
                  </span>
                  <a href={href('contributors')} className="font-medium text-indigo-300 hover:underline">
                    {tx('Xem bảng vinh danh →', 'View all →', '一覧へ →')}
                  </a>
                </div>
              </div>
            }
          />
        </Card>
      </PageContainer>

      {/* Rates + Cloud Sync, Security & Export */}
      <PageContainer className="pb-16 sm:pb-20">
        <DualPaneSection
          ratio="wide-left"
          left={<RateSnapshot />}
          right={
            <Card className="flex flex-col justify-between gap-5 p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/20">
                    <ShieldCheck className="size-[18px] text-emerald-300" />
                  </span>
                  <Badge tone="success">{tx('Miễn phí · Đa thiết bị', 'Free · Multi-Screen', '無料・全画面対応')}</Badge>
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white">
                    {tx('Bảo mật, Đồng bộ Cloud & Giao diện đa màn hình', 'Privacy, Cloud Sync & Adaptive Screens', 'セキュリティ・クラウド同期・マルチ画面')}
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-400">
                    <li className="flex items-start gap-2.5">
                      <Lock className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                      <span>
                        <strong className="text-zinc-200">{tx('Dùng ngay & Mã hoá cục bộ:', 'Instant Access & Local Encryption:', '登録不要・端末暗号化：')}</strong>{' '}
                        {tx(
                          'Dùng mọi công cụ miễn phí không bắt buộc tạo tài khoản; dữ liệu lưu trên thiết bị luôn được mã hoá cục bộ.',
                          'Every tool runs free with zero mandatory sign-up; local browser state is encrypted on your device.',
                          'アカウント登録なしですべての試算機能を無料利用可能。端末保存データは暗号化されます。'
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Cloud className="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
                      <span>
                        <strong className="text-zinc-200">{tx('Đồng bộ Mobile · Tablet · Duo/Fold · PC:', 'Sync across Mobile, Tablet, Duo/Fold & PC:', 'Mobile・Tablet・Duo/Fold・PC対応：')}</strong>{' '}
                        {tx(
                          'Đăng nhập Google / Email hoặc mã chia sẻ 6 ký tự trên Supabase Cloud, kèm tuỳ chọn chuyển layout cho iPhone Duo, Galaxy Z Fold, Tablet và Desktop.',
                          'Sign in with Google/Email or a 6-char share code via Supabase Cloud, paired with adaptive layout modes for iPhone Duo, Galaxy Fold, Tablet, and Desktop.',
                          'Google/メール認証または6桁コードでSupabase同期。iPhone Duo・Galaxy Fold・Tablet・PCに最適レイアウトで自動対応します。'
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <FileSpreadsheet className="mt-0.5 size-3.5 shrink-0 text-sky-300" />
                      <span>
                        <strong className="text-zinc-200">{tx('API bảo mật & Xuất báo cáo:', 'Protected API & Multi-Format Export:', '安全API計算・多形式出力：')}</strong>{' '}
                        {tx(
                          'Tính toán chạy qua Serverless API an toàn; xuất báo cáo lộ trình sang Google Docs, .DOC và .CSV.',
                          'Calculations execute through our secured Serverless API; export reports to Google Docs, .DOC, and .CSV.',
                          '計算ロジックは安全なサーバーレスAPIで実行。Googleドキュメント、.DOC、.CSV形式で帳票出力が可能です。'
                        )}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {user ? (
                    <Button as="a" href={href('profile')} variant="primary" size="sm">
                      <User className="size-3.5" /> {tx('Mở Hồ sơ & Kịch bản đã lưu', 'Open Profile & Saved Plans', 'プロフィールを開く')}
                    </Button>
                  ) : (
                    authConfigured &&
                    onOpenAuth && (
                      <Button type="button" variant="primary" size="sm" onClick={onOpenAuth}>
                        <LogIn className="size-3.5" /> {tx('Đăng nhập Google / Email', 'Sign in with Google / Email', 'Google / メールでログイン')}
                      </Button>
                    )
                  )}
                  {onOpenData && (
                    <Button type="button" variant="secondary" size="sm" onClick={onOpenData}>
                      <Cloud className="size-3.5" /> {tx('Sao lưu / Mã Cloud', 'Backup / Cloud Code', 'バックアップ / コード')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-white/[0.02] p-3 text-xs leading-relaxed text-zinc-500 ring-1 ring-inset ring-white/[0.05]">
                <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
                {tx(
                  'Thông tin lãi suất được tổng hợp từ trang chính thức public của từng ngân hàng; chi tiết gói ưu đãi bạn vui lòng tải ứng dụng ngân hàng để tham khảo trực tiếp (kết quả chỉ mang tính tham khảo).',
                  'Interest rates are compiled from public official bank pages; check each bank’s official app for exact promo terms (for reference only).',
                  '金利情報は各銀行の公式公開ページより収集しています。キャンペーン等の正確な適用条件は公式アプリでご確認ください（結果は参考値です）。'
                )}
              </div>
            </Card>
          }
        />
      </PageContainer>
    </>
  );
}
