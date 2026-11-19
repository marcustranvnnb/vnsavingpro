import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Cookie, Home, Info, LayoutGrid, LogIn, LogOut, ShieldCheck, User } from 'lucide-react';
import { APP_VERSION, APP_VERSION_DATE, APP_VERSION_LABEL, TOOLS, VERSION_HIGHLIGHTS } from '../tools.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { href, navigate, useRates, useToast } from '../state.jsx';
import { Badge, Button, Modal, cx } from './ui.jsx';

export function VersionBadge({ compact = false, className }) {
  const [open, setOpen] = useState(false);
  const { updatedAt, source } = useRates();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Thông tin phiên bản ${APP_VERSION} (${APP_VERSION_LABEL})`}
        aria-label={`Xem thông tin phiên bản ${APP_VERSION}`}
        className={cx(
          'inline-flex shrink-0 items-center rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          className
        )}
      >
        <Badge tone="brand" className="cursor-pointer gap-1 px-2 py-0.5 text-[11px] font-medium">
          <Info className="size-3" />
          <span>{compact ? APP_VERSION : `Phiên bản ${APP_VERSION}`}</span>
        </Badge>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Thông tin phiên bản VnSavingPro ${APP_VERSION}`}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            <div>
              <p className="text-xs font-medium text-white">{APP_VERSION_LABEL}</p>
              <p className="text-[11px] text-zinc-400">
                Phát hành: {APP_VERSION_DATE} · Lãi suất cập nhật: {updatedAt}
                {source === 'live-api' ? ' (Live API)' : ''}
              </p>
            </div>
            <Badge tone="success">Đang hoạt động</Badge>
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {VERSION_HIGHLIGHTS.map((release) => (
              <div
                key={release.version}
                className="rounded-xl bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06]"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={release.version === APP_VERSION ? 'brand' : 'neutral'}>
                      {release.version}
                    </Badge>
                    <span className="text-xs font-semibold text-white">{release.title}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-500">{release.date}</span>
                </div>
                <ul className="space-y-1 text-xs text-zinc-300">
                  {release.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={() => setOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Logo({ className }) {
  return (
    <a href={href('home')} className={cx('flex items-center gap-2.5', className)} aria-label="VnSavingPro – Trang chủ">
      <img
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-[10px] object-cover ring-1 ring-white/15 shadow-[0_6px_20px_-6px_rgba(99,102,241,0.75)]"
      />
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
          'flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] transition-colors lg:px-3 lg:text-sm',
          activeTool ? 'bg-white/[0.06] text-white' : 'text-zinc-400 hover:text-white'
        )}
      >
        <span className="hidden lg:inline">{activeTool ? `Công cụ: ${activeTool.short}` : 'Công cụ khác'}</span>
        <span className="lg:hidden">{activeTool ? activeTool.short : 'Thêm'}</span>
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

function UserMenu({ onOpenAuth }) {
  const { user, profile, authConfigured, signOut } = useAuth();
  const notify = useToast();
  const [open, setOpen] = useState(false);

  if (!authConfigured) return null;

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={onOpenAuth} aria-label="Đăng nhập">
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Đăng nhập</span>
      </Button>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Tài khoản';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] pl-1.5 pr-2.5 text-xs font-medium text-white transition hover:bg-white/[0.08]"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="size-5 rounded-lg object-cover" />
        ) : (
          <span className="flex size-5 items-center justify-center rounded-lg bg-indigo-500/25 text-[10px] font-semibold text-indigo-200">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate sm:inline">{displayName}</span>
        <ChevronDown className={cx('size-3 text-zinc-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-pop rounded-2xl border border-white/10 bg-elevated p-1.5 shadow-2xl">
            <div className="border-b border-white/[0.06] px-3 py-2">
              <p className="truncate text-xs font-semibold text-white">{displayName}</p>
              <p className="truncate text-[11px] text-zinc-400">{user.email}</p>
            </div>
            <a
              href={href('profile')}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/[0.05] hover:text-white"
            >
              <User className="size-3.5 text-indigo-300" /> Hồ sơ &amp; Kịch bản đã lưu
            </a>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                notify('Đã đăng xuất');
                navigate(href('home'));
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut className="size-3.5" /> Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopNav({ route, onOpenData, onOpenAuth }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:gap-6">
        <div className="flex min-w-0 items-center gap-2">
          <Logo />
          <VersionBadge compact className="hidden min-[400px]:inline-flex md:hidden xl:inline-flex" />
        </div>
        <nav className="hidden items-center gap-0.5 md:flex">
          {primary.map((t) => (
            <a
              key={t.id}
              href={href(t.id)}
              className={cx(
                'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] transition-colors lg:px-3 lg:text-sm',
                route === t.id ? 'bg-white/[0.06] text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              {t.short}
            </a>
          ))}
          <MoreMenu route={route} />
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onOpenData} aria-label="Dữ liệu của bạn">
            <ShieldCheck className="size-4" />
            <span className="hidden lg:inline">Dữ liệu</span>
          </Button>
          <UserMenu onOpenAuth={onOpenAuth} />
          {route !== 'plan' && (
            <Button as="a" href={href('plan')} variant="primary" size="sm" className="hidden xl:inline-flex">
              Lập kế hoạch
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar({ route, onOpenData, onOpenAuth }) {
  const [sheet, setSheet] = useState(false);
  const { user, authConfigured } = useAuth();
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
                  'flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition active:scale-95',
                  active ? 'text-white' : 'text-zinc-500'
                )}
              >
                <t.icon className={cx('size-5', active && 'text-indigo-300')} />
                <span className="truncate">{t.short}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={cx(
              'flex min-h-[52px] flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition active:scale-95',
              moreActive ? 'text-white' : 'text-zinc-500'
            )}
          >
            <LayoutGrid className={cx('size-5', moreActive && 'text-indigo-300')} />
            Thêm
          </button>
        </div>
      </nav>
      <Modal open={sheet} onClose={() => setSheet(false)} title="Công cụ & Tài khoản">
        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
            {user ? (
              <Button
                as="a"
                href={href('profile')}
                variant="secondary"
                size="sm"
                onClick={() => setSheet(false)}
              >
                <User className="size-3.5 text-indigo-300" /> Hồ sơ &amp; Kịch bản
              </Button>
            ) : (
              authConfigured &&
              onOpenAuth && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSheet(false);
                    onOpenAuth();
                  }}
                >
                  <LogIn className="size-3.5" /> Đăng nhập
                </Button>
              )
            )}
            {onOpenData && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSheet(false);
                  onOpenData();
                }}
              >
                <ShieldCheck className="size-3.5 text-emerald-300" /> Dữ liệu &amp; Cloud
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
            <span>Phiên bản hiện tại</span>
            <VersionBadge />
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Footer({ onOpenCookies }) {
  return (
    <footer className="border-t border-white/[0.06] pb-36 md:pb-20 lg:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <Logo />
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Công cụ lập kế hoạch tiết kiệm cá nhân, cặp đôi và gia đình. Thông tin lãi suất được lấy từ trang chính
            thức public của từng ngân hàng; chi tiết gói gửi và ưu đãi vui lòng tải ứng dụng ngân hàng để tham khảo trực
            tiếp. Mọi kết quả tính toán chỉ mang tính chất tham khảo.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm sm:gap-x-10">
          {TOOLS.map((t) => (
            <a key={t.id} href={href(t.id)} className="text-zinc-500 transition-colors hover:text-white">
              {t.label}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-600 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span>© 2026 VnSavingPro</span>
            <VersionBadge />
            {onOpenCookies && (
              <button
                type="button"
                onClick={onOpenCookies}
                className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.07] hover:text-white"
              >
                <Cookie className="size-3" /> Cài đặt Cookie
              </button>
            )}
          </div>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Tính toán bảo mật trên API — không lưu dữ liệu cá nhân lên server.
          </span>
        </div>
      </div>
    </footer>
  );
}
