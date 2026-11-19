import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Cookie,
  Globe,
  Home,
  Info,
  LayoutGrid,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  APP_VERSION,
  APP_VERSION_DATE,
  getLocalizedTools,
  getLocalizedVersionHighlights,
  getLocalizedVersionLabel,
} from '../tools.js';
import { SUPPORTED_LANGS, useI18n } from '../i18n/index.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { href, navigate, useRates, useToast } from '../state.jsx';
import { Badge, Button, Modal, cx } from './ui.jsx';

export function LanguageSwitcher({ compact = false, className }) {
  const { lang, setLang, tx } = useI18n();
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGS.find((l) => l.code === lang) || SUPPORTED_LANGS[0];

  return (
    <div className={cx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={tx('Chọn ngôn ngữ', 'Select language', '言語を選択')}
        title={tx('Đổi ngôn ngữ (VI · EN · JA)', 'Switch language (VI · EN · JA)', '言語切替 (VI · EN · JA)')}
        className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
      >
        <Globe className="size-3.5 text-indigo-300" />
        <span>{compact ? current.short : current.label}</span>
        <ChevronDown className={cx('size-3 text-zinc-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-40 animate-pop rounded-2xl border border-white/10 bg-elevated p-1.5 shadow-2xl">
            {SUPPORTED_LANGS.map((item) => {
              const active = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLang(item.code);
                    setOpen(false);
                  }}
                  className={cx(
                    'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition',
                    active ? 'bg-indigo-500/15 font-semibold text-white' : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <span>
                    <span className="mr-2 font-mono text-[11px] text-indigo-300">{item.short}</span>
                    {item.label}
                  </span>
                  {active && <Check className="size-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function VersionBadge({ compact = false, className }) {
  const [open, setOpen] = useState(false);
  const { updatedAt, source } = useRates();
  const { lang, tx } = useI18n();
  const highlights = getLocalizedVersionHighlights(lang);
  const versionLabel = getLocalizedVersionLabel(lang);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={tx(
          `Thông tin phiên bản ${APP_VERSION} (${versionLabel})`,
          `Version ${APP_VERSION} (${versionLabel})`,
          `バージョン ${APP_VERSION} (${versionLabel})`
        )}
        aria-label={tx(`Xem thông tin phiên bản ${APP_VERSION}`, `View release notes for ${APP_VERSION}`, `${APP_VERSION} の更新履歴を見る`)}
        className={cx(
          'inline-flex shrink-0 items-center rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          className
        )}
      >
        <Badge tone="brand" className="cursor-pointer gap-1 px-2 py-0.5 text-[11px] font-medium">
          <Info className="size-3" />
          <span>{compact ? APP_VERSION : tx(`Phiên bản ${APP_VERSION}`, `Version ${APP_VERSION}`, `バージョン ${APP_VERSION}`)}</span>
        </Badge>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={tx(`Thông tin phiên bản VnSavingPro ${APP_VERSION}`, `VnSavingPro ${APP_VERSION} Release Notes`, `VnSavingPro ${APP_VERSION} リリース情報`)}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            <div>
              <p className="text-xs font-medium text-white">{versionLabel}</p>
              <p className="text-[11px] text-zinc-400">
                {tx('Phát hành:', 'Released:', 'リリース：')} {APP_VERSION_DATE} ·{' '}
                {tx('Lãi suất cập nhật:', 'Rates synced:', '金利更新：')} {updatedAt}
                {source === 'live-api' ? ' (Live API)' : ''}
              </p>
            </div>
            <Badge tone="success">{tx('Đang hoạt động', 'Active', '稼働中')}</Badge>
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
            {highlights.map((release) => (
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
              {tx('Đóng', 'Close', '閉じる')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Logo({ className }) {
  const { tx } = useI18n();
  return (
    <a
      href={href('home')}
      className={cx('flex items-center gap-2.5', className)}
      aria-label={tx('VnSavingPro – Trang chủ', 'VnSavingPro – Home', 'VnSavingPro – トップページ')}
    >
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

function MoreMenu({ route }) {
  const { lang, tx } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [route]);
  const secondary = getLocalizedTools(lang).filter((t) => !t.primary);
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
        <span className="hidden lg:inline">
          {activeTool ? `${tx('Công cụ:', 'Tool:', 'ツール：')} ${activeTool.short}` : tx('Công cụ khác', 'More Tools', 'その他ツール')}
        </span>
        <span className="lg:hidden">{activeTool ? activeTool.short : tx('Thêm', 'More', 'その他')}</span>
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
  const { tx } = useI18n();
  const notify = useToast();
  const [open, setOpen] = useState(false);

  if (!authConfigured) return null;

  if (!user) {
    return (
      <Button variant="secondary" size="sm" onClick={onOpenAuth} aria-label={tx('Đăng nhập', 'Sign in', 'ログイン')}>
        <LogIn className="size-4" />
        <span className="hidden sm:inline">{tx('Đăng nhập', 'Sign in', 'ログイン')}</span>
      </Button>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || tx('Tài khoản', 'Account', 'アカウント');
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
              <User className="size-3.5 text-indigo-300" /> {tx('Hồ sơ & Kịch bản đã lưu', 'Profile & Saved Plans', 'プロフィール・保存済み')}
            </a>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                notify(tx('Đã đăng xuất', 'Signed out', 'ログアウトしました'));
                navigate(href('home'));
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut className="size-3.5" /> {tx('Đăng xuất', 'Sign out', 'ログアウト')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopNav({ route, onOpenData, onOpenAuth }) {
  const { lang, tx } = useI18n();
  const primary = getLocalizedTools(lang).filter((t) => t.primary);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:gap-5">
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
          <LanguageSwitcher compact />
          <Button variant="ghost" size="sm" onClick={onOpenData} aria-label={tx('Dữ liệu của bạn', 'Your data', 'データ管理')}>
            <ShieldCheck className="size-4" />
            <span className="hidden lg:inline">{tx('Dữ liệu', 'Data', 'データ')}</span>
          </Button>
          <UserMenu onOpenAuth={onOpenAuth} />
          {route !== 'plan' && (
            <Button as="a" href={href('plan')} variant="primary" size="sm" className="hidden xl:inline-flex">
              {tx('Lập kế hoạch', 'Start Planning', 'プラン作成')}
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
  const { lang, setLang, tx } = useI18n();
  useEffect(() => setSheet(false), [route]);

  const localizedTools = getLocalizedTools(lang);
  const primary = localizedTools.filter((t) => t.primary);
  const items = [{ id: 'home', short: tx('Trang chủ', 'Home', 'ホーム'), icon: Home }, ...primary.slice(0, 3)];
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
            {tx('Thêm', 'More', 'その他')}
          </button>
        </div>
      </nav>
      <Modal open={sheet} onClose={() => setSheet(false)} title={tx('Công cụ & Tài khoản', 'Tools & Account', 'ツール・アカウント')}>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            {localizedTools.slice(3).map((t) => (
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
                <User className="size-3.5 text-indigo-300" /> {tx('Hồ sơ & Kịch bản', 'Profile & Plans', 'プロフィール')}
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
                  <LogIn className="size-3.5" /> {tx('Đăng nhập', 'Sign in', 'ログイン')}
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
                <ShieldCheck className="size-3.5 text-emerald-300" /> {tx('Dữ liệu & Cloud', 'Data & Cloud', 'データ管理')}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Globe className="size-3.5 text-indigo-300" />
              {tx('Ngôn ngữ:', 'Language:', '言語：')}
            </span>
            <div className="flex gap-1.5">
              {SUPPORTED_LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={cx(
                    'rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
                    lang === item.code
                      ? 'bg-indigo-500/20 text-white ring-indigo-400/40'
                      : 'bg-white/[0.03] text-zinc-400 ring-white/[0.08] hover:text-white'
                  )}
                >
                  {item.short} · {item.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
            <span>{tx('Phiên bản hiện tại', 'Current version', '現在のバージョン')}</span>
            <VersionBadge />
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Footer({ onOpenCookies }) {
  const { lang, setLang, tx } = useI18n();
  const localizedTools = getLocalizedTools(lang);

  return (
    <footer className="border-t border-white/[0.06] pb-36 md:pb-20 lg:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <Logo />
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            {tx(
              'Công cụ lập kế hoạch tiết kiệm cá nhân, cặp đôi và gia đình. Thông tin lãi suất được lấy từ trang chính thức public của từng ngân hàng; chi tiết gói gửi và ưu đãi vui lòng tải ứng dụng ngân hàng để tham khảo trực tiếp. Mọi kết quả tính toán chỉ mang tính chất tham khảo.',
              'Personal, couple & family savings planner for Vietnam digital banks. Interest rates are collected from public official pages; check each bank’s official app for exact promotional terms. All results are for reference only.',
              'ベトナムのネット銀行向け個人・カップル・家族用貯蓄プランナー。金利情報は各銀行の公式公開ページから取得しています。キャンペーン等の詳細は必ず各行公式アプリにてご確認ください。試算結果は参考値です。'
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm sm:gap-x-10">
          {localizedTools.map((t) => (
            <a key={t.id} href={href(t.id)} className="text-zinc-500 transition-colors hover:text-white">
              {t.label}
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-zinc-600 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span>© 2026 VnSavingPro</span>
            <VersionBadge />
            {onOpenCookies && (
              <button
                type="button"
                onClick={onOpenCookies}
                className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.07] hover:text-white"
              >
                <Cookie className="size-3" /> {tx('Cài đặt Cookie', 'Cookie Settings', 'Cookie設定')}
              </button>
            )}
            <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] p-0.5 ring-1 ring-inset ring-white/[0.08]">
              {SUPPORTED_LANGS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={cx(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium transition',
                    lang === item.code ? 'bg-indigo-500/25 text-indigo-200' : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {item.short}
                </button>
              ))}
            </div>
          </div>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 shrink-0" />{' '}
            {tx(
              'Tính toán bảo mật trên API — không lưu dữ liệu cá nhân lên server.',
              'Encrypted calculation via Serverless API — personal inputs stay on your device.',
              'サーバーAPIで安全に計算 — 個人データは許可なくサーバーへ保存されません。'
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
