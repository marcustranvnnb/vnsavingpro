import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Lock, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { TOOLS } from '../tools.js';
import { href, useRates } from '../state.jsx';
import { useServerCalc } from '../utils/apiClient.js';
import { compact, chip, pct } from '../utils/format.js';
import { Badge, BankMark, Button, Card, Chip, cx } from '../components/ui.jsx';

const TARGETS = [5_000_000, 10_000_000, 20_000_000, 30_000_000];
const SAVINGS = [3_000_000, 5_000_000, 10_000_000];

const INITIAL_ESTIMATE = {
  timeText: '...',
  requiredPrincipal: 0,
  compoundSharePct: 0,
  monthsNeeded: 0,
};

function QuickEstimate() {
  const { best } = useRates();
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
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Ước tính nhanh</span>
          <Badge tone="success">
            <Zap className="size-3" /> {top.bank.name} {pct(top.rate)}
          </Badge>
        </div>

        <div className="mt-5 text-[13px] text-zinc-400">Tôi muốn nhận mỗi tháng</div>
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

        <div className={cx('mt-6 border-t border-white/[0.06] pt-5 transition-opacity', loading && 'opacity-70')}>
          <div className="text-[13px] text-zinc-500">Bạn sẽ đạt mục tiêu sau</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-white tabular-nums">{r.timeText}</div>
          <div className="mt-2 text-[13px] leading-relaxed text-zinc-400">
            Cần tích luỹ <span className="font-medium text-white">{compact(r.requiredPrincipal)}</span> — trong đó lãi
            kép đóng góp <span className="font-medium text-emerald-300">{pct(r.compoundSharePct, 0)}</span>.
          </div>
        </div>

        <Button
          as="a"
          href={href('plan', { target, saving })}
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
  const { banks, getRate } = useRates();
  const rows = banks.map((b) => ({ bank: b, rate: getRate(b, '12M') })).sort((a, b) => b.rate - a.rate);
  const max = rows[0]?.rate || 1;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Lãi suất kỳ hạn 12 tháng</h2>
          <p className="mt-1 text-[13px] text-zinc-500">Xếp hạng 4 ngân hàng số, %/năm</p>
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
                <span className={cx('text-sm font-semibold tabular-nums', i === 0 ? 'text-emerald-300' : 'text-white')}>
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

export default function Home() {
  const { best, updatedAt } = useRates();
  const top = best('12M');
  const primary = TOOLS.filter((t) => t.primary);
  const secondary = TOOLS.filter((t) => !t.primary);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-[-280px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pb-24">
          <div className="animate-rise">
            <a
              href={href('rates')}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] py-1 pl-1 pr-3 text-xs text-zinc-300 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.07]"
            >
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300">Mới</span>
              Lãi suất cập nhật {updatedAt}
              <ArrowRight className="size-3" />
            </a>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              Biến tiền tiết kiệm thành <span className="text-gradient">thu nhập thụ động</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Biết chính xác cần gửi bao nhiêu, ở ngân hàng nào và mất bao lâu để tiền lãi trả cho bạn mỗi tháng. Miễn
              phí, không cần đăng ký.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as="a" href={href('plan')} variant="primary" size="lg">
                Lập kế hoạch ngay <ArrowRight className="size-4" />
              </Button>
              <Button as="a" href={href('rates')} size="lg">
                So sánh lãi suất
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/[0.06] pt-6">
              {[
                { k: pct(top.rate), v: 'Lãi suất cao nhất' },
                { k: '4', v: 'Ngân hàng số' },
                { k: '100%', v: 'Chạy trên thiết bị' },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="text-2xl font-semibold tracking-tight text-white tabular-nums">{s.k}</dt>
                  <dd className="mt-1 text-xs text-zinc-500">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <QuickEstimate />
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
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

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {secondary.map((t) => (
            <a
              key={t.id}
              href={href(t.id)}
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-surface p-4 transition-colors hover:border-white/[0.14] hover:bg-elevated"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.07]">
                <t.icon className="size-[18px] text-zinc-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">{t.label}</span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500">{t.desc}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-white" />
            </a>
          ))}
        </div>
      </section>

      {/* Rates + trust */}
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-20 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <RateSnapshot />
        <Card className="flex flex-col justify-between gap-6 p-5 sm:p-6">
          <div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/20">
              <Lock className="size-[18px] text-emerald-300" />
            </span>
            <h2 className="mt-5 text-[15px] font-semibold text-white">Riêng tư tuyệt đối</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
              Không tài khoản, không theo dõi. Số liệu bạn nhập chỉ nằm trong trình duyệt và có thể sao lưu hoặc xoá bất
              cứ lúc nào.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-white/[0.02] p-3 text-xs leading-relaxed text-zinc-500 ring-1 ring-inset ring-white/[0.05]">
            <RefreshCw className="mt-0.5 size-3.5 shrink-0" />
            Lãi suất thu thập từ website chính thức của từng ngân hàng. Bạn có thể tự cập nhật nếu ngân hàng thay đổi.
          </div>
        </Card>
      </section>
    </>
  );
}
