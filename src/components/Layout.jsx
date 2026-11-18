import React, { useEffect, useState } from 'react';
import { ChevronDown, Home, LayoutGrid, ShieldCheck, TrendingUp } from 'lucide-react';
import { TOOLS } from '../tools.js';
import { href } from '../state.jsx';
import { Button, Modal, cx } from './ui.jsx';

export function Logo({ className }) {
  return (
    <a href={href('home')} className={cx('flex items-center gap-2.5', className)} aria-label="VnSavingPro – Trang chủ">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-400 to-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_20px_-6px_rgba(99,102,241,0.8)]">
        <TrendingUp className="size-4 text-white" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-white">
        VnSaving<span className="text-indigo-300">Pro</span>
      </span>
    </a>
  );
}

const primary = TOOLS.filter((t) => t.primary);
const secondary = TOOLS.filter((t) => !t.primary);

function MoreMenu({ route }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  const activeTool = secondary.find((t) => t.id === route);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors',
          activeTool ? 'bg-white/[0.06] text-white' : 'text-zinc-400 hover:text-white'
        )}
      >
        {activeTool ? `Công cụ: ${activeTool.short}` : 'Công cụ khác'}{' '}
        <ChevronDown className={cx('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 animate-pop rounded-2xl border border-white/10 bg-elevated p-2 shadow-2xl">
            {secondary.map((t) => (
              <a
                key={t.id}
                href={href(t.id)}
                className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-inset ring-white/[0.07]">
                  <t.icon className="size-4 text-indigo-300" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{t.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">{t.desc}</span>
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TopNav({ route, onOpenData }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 md:flex">
          {primary.map((t) => (
            <a
              key={t.id}
              href={href(t.id)}
              className={cx(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                route === t.id ? 'bg-white/[0.06] text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              {t.short}
            </a>
          ))}
          <MoreMenu route={route} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onOpenData} aria-label="Dữ liệu của bạn">
            <ShieldCheck className="size-4" />
            <span className="hidden sm:inline">Dữ liệu của bạn</span>
          </Button>
          {route !== 'plan' && (
            <Button as="a" href={href('plan')} variant="primary" size="sm" className="hidden sm:inline-flex">
              Lập kế hoạch
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar({ route }) {
  const [sheet, setSheet] = useState(false);
  useEffect(() => setSheet(false), [route]);
  const items = [{ id: 'home', short: 'Trang chủ', icon: Home }, ...primary.slice(0, 3)];
  const moreActive = !items.some((i) => i.id === route);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5">
          {items.map((t) => {
            const active = route === t.id;
            return (
              <a
                key={t.id}
                href={href(t.id)}
                className={cx(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-white' : 'text-zinc-500'
                )}
              >
                <t.icon className={cx('size-5', active && 'text-indigo-300')} />
                {t.short}
              </a>
            );
          })}
          <button
            onClick={() => setSheet(true)}
            className={cx(
              'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium',
              moreActive ? 'text-white' : 'text-zinc-500'
            )}
          >
            <LayoutGrid className={cx('size-5', moreActive && 'text-indigo-300')} />
            Thêm
          </button>
        </div>
      </nav>
      <Modal open={sheet} onClose={() => setSheet(false)} title="Tất cả công cụ">
        <div className="grid gap-1.5">
          {TOOLS.slice(3).map((t) => (
            <a
              key={t.id}
              href={href(t.id)}
              className={cx(
                'flex items-center gap-3 rounded-xl p-3 ring-1 ring-inset transition-colors',
                route === t.id ? 'bg-indigo-500/10 ring-indigo-400/20' : 'ring-white/[0.06] hover:bg-white/[0.04]'
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <t.icon className="size-4 text-indigo-300" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">{t.label}</span>
                <span className="block truncate text-xs text-zinc-500">{t.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </Modal>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pb-24 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Công cụ lập kế hoạch tiết kiệm cá nhân. Dữ liệu lãi suất chỉ mang tính tham khảo — vui lòng kiểm tra tại
            ngân hàng trước khi gửi tiền.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          {TOOLS.map((t) => (
            <a key={t.id} href={href(t.id)} className="text-zinc-500 transition-colors hover:text-white">
              {t.label}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-600 sm:px-6">
          <span>© 2026 VnSavingPro</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Mọi tính toán chạy trên thiết bị của bạn — không gửi dữ liệu lên server.
          </span>
        </div>
      </div>
    </footer>
  );
}
