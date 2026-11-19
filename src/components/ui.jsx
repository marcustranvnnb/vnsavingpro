import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { fmt } from '../utils/format.js';

export const cx = (...c) => c.filter(Boolean).join(' ');

/* ── Surfaces ───────────────────────────────────────────── */

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/[0.07] bg-surface shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, right, className }) {
  return (
    <div className={cx('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ icon: Icon, eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-indigo-300">
            {Icon && <Icon className="size-3.5" />}
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[32px] sm:leading-tight">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

/* ── Controls ───────────────────────────────────────────── */

export function Button({ variant = 'secondary', size = 'md', as: Comp = 'button', className, ...props }) {
  const variants = {
    primary:
      'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_24px_-10px_rgba(99,102,241,0.7)]',
    secondary: 'bg-white/[0.04] text-zinc-200 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08]',
    ghost: 'text-zinc-400 hover:bg-white/[0.05] hover:text-white',
    danger: 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/20 hover:bg-red-500/15',
  };
  const sizes = {
    sm: 'h-8 gap-1.5 px-3 text-xs',
    md: 'h-10 gap-2 px-4 text-sm',
    lg: 'h-12 gap-2 px-5 text-[15px]',
  };
  return (
    <Comp
      className={cx(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Badge({ tone = 'neutral', className, children }) {
  const tones = {
    neutral: 'bg-white/[0.05] text-zinc-300 ring-white/10',
    brand: 'bg-indigo-500/10 text-indigo-300 ring-indigo-400/20',
    success: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
    warning: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
    danger: 'bg-red-500/10 text-red-300 ring-red-400/20',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Segmented({ value, onChange, options, size = 'md', className }) {
  return (
    <div
      className={cx(
        'no-scrollbar inline-flex max-w-full overflow-x-auto rounded-xl bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.07]',
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              'shrink-0 whitespace-nowrap rounded-lg font-medium transition-all',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              active
                ? 'bg-white/[0.09] text-white shadow-sm ring-1 ring-inset ring-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, className, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'min-h-[32px] rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors sm:min-h-0 sm:py-1',
        active
          ? 'bg-indigo-500/15 text-indigo-200 ring-indigo-400/30'
          : 'bg-white/[0.03] text-zinc-400 ring-white/[0.07] hover:bg-white/[0.06] hover:text-zinc-200',
        className
      )}
      {...props}
    />
  );
}

export function Range({ value, min, max, step = 1, onChange, ariaLabel }) {
  const v = Math.min(max, Math.max(min, Number(value) || 0));
  const p = ((v - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={v}
      onChange={(e) => onChange(Number(e.target.value))}
      className="range"
      style={{ '--p': `${p}%` }}
    />
  );
}

/** Text input that formats with thousand separators (vi-VN) without caret jump while editing. */
export function NumberInput({ value, onChange, suffix, max, className, ariaLabel }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const handleFocus = (e) => {
    setFocused(true);
    setDraft(value ? String(value) : '');
    requestAnimationFrame(() => e.target?.select?.());
  };

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    const clamped = digits === '' ? '' : String(max ? Math.min(max, Number(digits)) : Number(digits));
    setDraft(clamped);
    onChange(clamped === '' ? 0 : Number(clamped));
  };

  return (
    <div
      className={cx(
        'flex h-10 items-center rounded-xl bg-black/30 px-3 ring-1 ring-inset ring-white/10 transition focus-within:ring-indigo-400/60',
        className
      )}
    >
      <input
        aria-label={ariaLabel}
        inputMode="numeric"
        value={focused ? draft : fmt(value)}
        onFocus={handleFocus}
        onBlur={() => setFocused(false)}
        onChange={handleChange}
        className="w-full min-w-0 bg-transparent text-right text-base font-medium tabular-nums text-white outline-none sm:text-sm"
      />
      {suffix && <span className="ml-2 shrink-0 text-xs text-zinc-500">{suffix}</span>}
    </div>
  );
}

export function DecimalInput({ value, onChange, suffix, min = 0, max = 100, step = 0.1, className, ariaLabel }) {
  return (
    <div
      className={cx(
        'flex h-10 items-center rounded-xl bg-black/30 px-3 ring-1 ring-inset ring-white/10 transition focus-within:ring-indigo-400/60',
        className
      )}
    >
      <input
        aria-label={ariaLabel}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Math.min(max, Math.max(min, Number(e.target.value))))}
        className="w-full min-w-0 bg-transparent text-right text-base font-medium tabular-nums text-white outline-none sm:text-sm"
      />
      {suffix && <span className="ml-2 shrink-0 text-xs text-zinc-500">{suffix}</span>}
    </div>
  );
}

/** Label + formatted number input + slider + quick presets. */
export function MoneyField({ label, hint, value, onChange, min, max, step, presets, suffix = '₫', inputMax }) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <label className="text-[13px] font-medium text-zinc-300">{label}</label>
        <NumberInput value={value} onChange={onChange} suffix={suffix} max={inputMax} className="w-full sm:w-44" ariaLabel={label} />
      </div>
      <Range value={value} min={min} max={max} step={step} onChange={onChange} ariaLabel={label} />
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <Chip key={p.value} active={value === p.value} onClick={() => onChange(p.value)}>
              {p.label}
            </Chip>
          ))}
        </div>
      )}
      {hint && <p className="text-xs leading-relaxed text-zinc-500">{hint}</p>}
    </div>
  );
}

/** Label + value readout + slider (for %, months, years…). */
export function SliderField({ label, display, value, onChange, min, max, step, hint }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[13px] font-medium text-zinc-300">{label}</label>
        <span className="shrink-0 rounded-lg bg-white/[0.04] px-2.5 py-1 text-sm font-semibold tabular-nums text-white ring-1 ring-inset ring-white/[0.07]">
          {display}
        </span>
      </div>
      <Range value={value} min={min} max={max} step={step} onChange={onChange} ariaLabel={label} />
      {hint && <p className="text-xs leading-relaxed text-zinc-500">{hint}</p>}
    </div>
  );
}

/* ── Data display ───────────────────────────────────────── */

const TONES = {
  emerald: 'text-emerald-300',
  indigo: 'text-indigo-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
  violet: 'text-violet-300',
};

export function Stat({ label, value, hint, tone, icon: Icon, className }) {
  return (
    <div className={cx('min-w-0 rounded-xl bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06] sm:p-4', className)}>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        {Icon && <Icon className="size-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <div className={cx('mt-1.5 break-words text-base font-semibold tabular-nums tracking-tight sm:text-xl', TONES[tone] || 'text-white')}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs leading-relaxed text-zinc-500">{hint}</div>}
    </div>
  );
}

export function Progress({ value, className, tone = 'indigo' }) {
  const bar = tone === 'emerald' ? 'from-emerald-500 to-emerald-300' : 'from-indigo-500 to-violet-400';
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}>
      <div
        className={cx('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', bar)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Table({ head, children, className }) {
  return (
    <div className={cx('overflow-auto overscroll-x-contain rounded-xl ring-1 ring-inset ring-white/[0.06]', className)}>
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead className="sticky top-0 z-10 bg-elevated/95 backdrop-blur">
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className={cx(
                  'whitespace-nowrap px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 sm:px-4 sm:py-3',
                  i > 0 && 'text-right'
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04] tabular-nums">{children}</tbody>
      </table>
    </div>
  );
}

export function Callout({ icon: Icon, tone = 'neutral', children, className }) {
  const tones = {
    neutral: 'bg-white/[0.02] text-zinc-400 ring-white/[0.06]',
    brand: 'bg-indigo-500/[0.06] text-indigo-200/90 ring-indigo-400/15',
    warning: 'bg-amber-500/[0.06] text-amber-200/90 ring-amber-400/15',
    success: 'bg-emerald-500/[0.06] text-emerald-200/90 ring-emerald-400/15',
  };
  return (
    <div className={cx('flex gap-3 rounded-xl p-4 text-[13px] leading-relaxed ring-1 ring-inset', tones[tone], className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

export function BankMark({ bank, size = 'md' }) {
  const s = { sm: 'size-7 text-[9px] rounded-lg', md: 'size-9 text-[10px] rounded-xl', lg: 'size-11 text-xs rounded-xl' }[size];
  return (
    <div
      className={cx('flex shrink-0 items-center justify-center font-bold tracking-tight text-white', s)}
      style={{
        background: `linear-gradient(145deg, ${bank.color}, ${bank.color}aa)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 16px -8px ${bank.color}`,
      }}
    >
      {bank.logoText.slice(0, 4)}
    </div>
  );
}

/* ── Overlay ────────────────────────────────────────────── */

export function Modal({ open, onClose, title, children, className }) {
  const { tx } = useI18n();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative max-h-[90dvh] w-full animate-pop overflow-y-auto rounded-t-2xl border border-white/10 bg-elevated p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-2xl sm:pb-5',
          className
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label={tx('Đóng', 'Close', '閉じる')}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Skeletons & Disclaimer ─────────────────────────────── */

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cx('skeleton-shimmer rounded-xl', className)} />;
}

export function ResultsSkeleton() {
  const { tx } = useI18n();
  return (
    <div className="space-y-5 animate-fade" aria-busy="true" aria-label={tx('Đang tải kết quả', 'Loading results', '結果を読み込み中')}>
      <Card className="p-5 sm:p-7">
        <Skeleton className="h-4 w-56 rounded-full" />
        <Skeleton className="mt-4 h-11 w-64 rounded-xl" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <Skeleton className="mt-6 h-2 w-full rounded-full" />
      </Card>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2.5 h-6 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>
      <Card className="p-5 sm:p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-56 w-full" />
      </Card>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 animate-fade" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-[480px] max-w-full" />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="space-y-4 p-5 sm:p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
        <ResultsSkeleton />
      </div>
    </div>
  );
}

export function RateDisclaimer({ className }) {
  const { tx } = useI18n();
  return (
    <Callout icon={Info} tone="neutral" className={cx('print-hidden text-xs', className)}>
      <div className="space-y-1">
        <div className="font-medium text-zinc-200">
          {tx(
            'Lưu ý về dữ liệu lãi suất & Kết quả tính toán',
            'Notice on Bank Rate Data & Estimates',
            '金利データおよび試算結果に関するご注意'
          )}
        </div>
        <p className="leading-relaxed text-zinc-400">
          {tx(
            'Thông tin lãi suất được tổng hợp tự động từ trang thông tin chính thức (public) của từng ngân hàng. Để nắm rõ chi tiết hạn mức, điều kiện áp dụng và các gói chương trình ưu đãi mới nhất, bạn nên tải ứng dụng chính thức của từng ngân hàng để tham khảo trực tiếp. Mọi số liệu và kết quả tính toán trên VnSavingPro chỉ mang tính chất tham khảo.',
            'Interest rates are auto-synced daily from each bank’s official public website. For exact deposit limits, eligibility criteria, and active promotional packages, please check each bank’s official mobile app directly. All calculations on VnSavingPro are for reference only.',
            '金利情報は各銀行の公式公開ページから毎日自動収集しています。最新の適用条件・上限額・キャンペーン特典の詳細は、必ず各銀行の公式アプリにて直接ご確認ください。VnSavingProの試算結果は参考値です。'
          )}
        </p>
      </div>
    </Callout>
  );
}
