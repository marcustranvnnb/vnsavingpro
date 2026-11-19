import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Cloud,
  FileSpreadsheet,
  Home as HomeIcon,
  Lock,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { APP_VERSION, TOOLS } from '../tools.js';
import { href, useRates } from '../state.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useServerCalc } from '../utils/apiClient.js';
import { compact, chip, pct } from '../utils/format.js';
import { HouseholdModeSwitch } from '../components/HouseholdModeSwitch.jsx';
import { Badge, BankMark, Button, Card, Chip, cx } from '../components/ui.jsx';

const TARGETS = [5_000_000, 10_000_000, 20_000_000, 30_000_000];
const SAVINGS = [3_000_000, 5_000_000, 10_000_000, 20_000_000];

const HOUSEHOLD_EF_NOTE = {
  INDIVIDUAL: 'Cá nhân · Quỹ dự phòng khuyến nghị: 4 tháng chi tiêu',
  COUPLE: 'Cặp đôi · Quỹ dự phòng khuyến nghị: 6 tháng chi tiêu',
  FAMILY: 'Gia đình · Quỹ dự phòng khuyến nghị: 6–12 tháng chi tiêu',
};

const HOUSEHOLD_CARDS = [
  {
    id: 'INDIVIDUAL',
    icon: User,
    badge: 'Dự phòng 4 tháng',
    title: 'Cá nhân độc lập',
    subtitle: 'Tối ưu 1 nguồn thu + thu nhập phụ',
    highlights: [
      'Gộp lương chính, freelance & đầu tư thành dòng tiền rõ ràng',
      'Theo dõi Quỹ dự phòng 4 tháng & tỷ lệ phủ chi tiêu',
      'So sánh nhanh ngân hàng lãi cao cho khoản gửi linh hoạt',
    ],
    cta: 'Lập kế hoạch Cá nhân',
  },
  {
    id: 'COUPLE',
    icon: Users,
    badge: 'Dự phòng 6 tháng',
    title: 'Cặp đôi (2 người)',
    subtitle: 'Đồng bộ mục tiêu tài chính chung',
    highlights: [
      'Chia khoản góp theo tỷ lệ thu nhập, 50/50 hoặc tự chỉnh %',
      'Quỹ dự phòng 6 tháng thanh khoản tách biệt kỳ hạn dài',
      'Stress-test sức chịu đựng khi 1 trong 2 tạm giảm thu nhập',
    ],
    cta: 'Lập kế hoạch Cặp đôi',
  },
  {
    id: 'FAMILY',
    icon: HomeIcon,
    badge: 'Dự phòng 6–12 tháng',
    title: 'Gia đình có người phụ thuộc',
    subtitle: 'Bảo vệ an toàn tài chính trụ cột',
    highlights: [
      'Tách riêng chi phí cố định & chi phí nuôi con / bố mẹ',
      'Bật chế độ Ưu tiên lấp Quỹ dự phòng trước (Fund-First)',
      'Cảnh báo tự động khi tỷ trọng thu nhập trụ cột từ ≥ 75%',
    ],
    cta: 'Lập kế hoạch Gia đình',
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
          <span className="text-xs font-medium text-zinc-400">Ước tính nhanh</span>
          <Badge tone="success">
            <Zap className="size-3" /> {top.bank.name} {pct(top.rate)}
          </Badge>
        </div>

        <div className="mt-4">
          <HouseholdModeSwitch value={householdMode} onChange={setHouseholdMode} compact />
          <p className="mt-1.5 text-[11px] text-zinc-400">{HOUSEHOLD_EF_NOTE[householdMode]}</p>
        </div>

        <div className="mt-4 text-[13px] text-zinc-400">Tôi muốn nhận mỗi tháng</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TARGETS.map((v) => (
            <Chip key={v} active={target === v} onClick={() => setTarget(v)}>
              {chip(v)}
            </Chip>
          ))}
        </div>

        <div className="mt-4 text-[13px] text-zinc-400">Mỗi tháng tôi tiết kiệm được</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAVINGS.map((v) => (
            <Chip key={v} active={saving === v} onClick={() => setSaving(v)}>
              {chip(v)}
            </Chip>
          ))}
        </div>

        <div className={cx('mt-5 border-t border-white/[0.06] pt-4 transition-opacity sm:mt-6 sm:pt-5', loading && 'opacity-70')}>
          <div className="text-[13px] text-zinc-500">Bạn sẽ đạt mục tiêu sau</div>
          <div className="mt-1 break-words text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
            {r.timeText}
          </div>
          <div className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Cần tích luỹ <span className="font-medium text-white">{compact(r.requiredPrincipal)}</span> — trong đó lãi
            kép đóng góp <span className="font-medium text-emerald-300">{pct(r.compoundSharePct, 0)}</span>.
          </div>
        </div>

        <Button
          as="a"
          href={href('plan', { target, saving, hh: householdMode })}
          variant="primary"
          className="mt-5 w-full"
        >
          Xem lộ trình chi tiết <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

function RateSnapshot() {
  const { banks, getRate, updatedAt } = useRates();
  const rows = banks.map((b) => ({ bank: b, rate: getRate(b, '12M') })).sort((a, b) => b.rate - a.rate);
  const max = rows[0]?.rate || 1;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-white">Lãi suất kỳ hạn 12 tháng</h2>
            <Badge tone="brand">Auto-sync 09:00 · {updatedAt}</Badge>
          </div>
          <p className="mt-1 text-[13px] text-zinc-500">Xếp hạng 4 ngân hàng số tại Việt Nam, %/năm</p>
        </div>
        <a href={href('rates')} className="flex items-center gap-1 text-[13px] text-indigo-300 hover:text-indigo-200">
          Tất cả kỳ hạn <ArrowUpRight className="size-3.5" />
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
                  {pct(rate)}
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
  const top = best('12M');
  const primary = TOOLS.filter((t) => t.primary);
  const secondary = TOOLS.filter((t) => !t.primary);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-[-280px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-8 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pb-24 lg:pt-20">
          <div className="animate-rise min-w-0">
            <a
              href={href('rates')}
              className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-xs text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.07] sm:rounded-full sm:py-1 sm:pl-1"
            >
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300">
                {APP_VERSION}
              </span>
              <span>Lãi suất cập nhật {updatedAt} · Auto-sync 09:00 hằng ngày</span>
              <ArrowRight className="size-3 shrink-0" />
            </a>
            <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:mt-6 sm:text-5xl lg:text-[54px]">
              Biến tiền tiết kiệm thành <span className="text-gradient">thu nhập thụ động</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400 sm:mt-5 sm:text-lg">
              Lập lộ trình tài chính chuẩn xác cho <strong className="font-medium text-zinc-200">Cá nhân, Cặp đôi &amp; Gia đình</strong> — biết rõ cần gửi bao nhiêu, lấp Quỹ dự phòng thế nào và chọn ngân hàng số nào lãi cao nhất. Dùng ngay miễn phí, tuỳ chọn đồng bộ Cloud qua Google.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Button as="a" href={href('plan')} variant="primary" size="lg" className="w-full sm:w-auto">
                Lập kế hoạch ngay <ArrowRight className="size-4" />
              </Button>
              <Button as="a" href={href('rates')} size="lg" className="w-full sm:w-auto">
                So sánh lãi suất
              </Button>
            </div>
            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-white/[0.06] pt-6 sm:mt-10 sm:gap-6">
              {[
                { k: pct(top.rate), v: 'Lãi suất cao nhất (12T)' },
                { k: '3 mô hình', v: 'Cá nhân · Cặp đôi · Gia đình' },
                { k: '09:00', v: 'Tự động cập nhật mỗi ngày' },
              ].map((s) => (
                <div key={s.v} className="min-w-0">
                  <dt className="text-lg font-semibold tracking-tight text-white tabular-nums sm:text-2xl">{s.k}</dt>
                  <dd className="mt-1 text-[11px] leading-snug text-zinc-500 sm:text-xs">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="animate-rise min-w-0 [animation-delay:120ms]">
            <QuickEstimate />
          </div>
        </div>
      </section>

      {/* Household Modes */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
            <Users className="size-3.5" /> 3 mô hình tài chính
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Lập kế hoạch theo đúng mô hình tài chính của bạn
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Chọn xuất phát điểm phù hợp — mọi thông số Quỹ dự phòng, quy tắc góp chung 2 người và Stress-test rủi ro trụ cột sẽ được thiết lập tự động.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <Badge tone="brand">{card.badge}</Badge>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">{card.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">{card.subtitle}</p>
                  <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3.5 text-xs leading-relaxed text-zinc-400">
                    {card.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="mt-5 flex items-center gap-1.5 text-[13px] font-medium text-indigo-300 transition-colors group-hover:text-white">
                  {card.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
              <Sparkles className="size-3.5" /> Bộ công cụ
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Mọi thứ bạn cần để tiết kiệm thông minh
            </h2>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                Mở công cụ <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>

        <div className={cx('mt-3 grid gap-3', secondary.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
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
        </div>
      </section>

      {/* Rates + Cloud Sync, Security & Export */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-28 sm:px-6 sm:pb-24 lg:grid-cols-[1.35fr_1fr] lg:pb-20">
        <RateSnapshot />
        <Card className="flex flex-col justify-between gap-5 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/20">
                <ShieldCheck className="size-[18px] text-emerald-300" />
              </span>
              <Badge tone="success">Miễn phí · Đa thiết bị</Badge>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Bảo mật, Đồng bộ Cloud &amp; Báo cáo</h2>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                  <span>
                    <strong className="text-zinc-200">Dùng ngay &amp; Mã hoá cục bộ:</strong> Dùng mọi công cụ miễn phí không bắt buộc tạo tài khoản; dữ liệu lưu trên thiết bị luôn được mã hoá cục bộ.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Cloud className="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
                  <span>
                    <strong className="text-zinc-200">Đồng bộ Cloud &amp; Tài khoản (Tuỳ chọn):</strong> Đăng nhập nhanh bằng <strong className="text-white">Google / Email</strong> (hoặc mã chia sẻ 6 ký tự) để lưu nhiều kịch bản trên Supabase Cloud giữa Mobile, Tablet và PC.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileSpreadsheet className="mt-0.5 size-3.5 shrink-0 text-sky-300" />
                  <span>
                    <strong className="text-zinc-200">API bảo mật &amp; Xuất báo cáo:</strong> Tính toán chạy qua Serverless API an toàn; xuất báo cáo lộ trình sang <strong className="text-white">Google Docs, .DOC và .CSV</strong>.
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {user ? (
                <Button as="a" href={href('profile')} variant="primary" size="sm">
                  <User className="size-3.5" /> Mở Hồ sơ &amp; Kịch bản đã lưu
                </Button>
              ) : (
                authConfigured &&
                onOpenAuth && (
                  <Button type="button" variant="primary" size="sm" onClick={onOpenAuth}>
                    <LogIn className="size-3.5" /> Đăng nhập Google / Email
                  </Button>
                )
              )}
              {onOpenData && (
                <Button type="button" variant="secondary" size="sm" onClick={onOpenData}>
                  <Cloud className="size-3.5" /> Sao lưu / Mã Cloud
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-white/[0.02] p-3 text-xs leading-relaxed text-zinc-500 ring-1 ring-inset ring-white/[0.05]">
            <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
            Thông tin lãi suất được tổng hợp từ trang chính thức public của từng ngân hàng; chi tiết gói ưu đãi bạn vui
            lòng tải ứng dụng ngân hàng để tham khảo trực tiếp (kết quả chỉ mang tính tham khảo).
          </div>
        </Card>
      </section>
    </>
  );
}
