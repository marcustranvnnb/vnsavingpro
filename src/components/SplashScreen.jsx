import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { APP_VERSION } from '../tools.js';
import { LuckyCatMascot } from './LuckyCatMascot.jsx';

export default function SplashScreen({ onDone }) {
  const { tx } = useI18n();
  const [progress, setProgress] = useState(14);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setProgress(100);
      const t1 = window.setTimeout(() => setFading(true), 120);
      const t2 = window.setTimeout(() => {
        setHidden(true);
        onDone?.();
      }, 260);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    const tStart = window.setTimeout(() => setProgress(62), 60);
    const tMid = window.setTimeout(() => setProgress(94), 340);
    const tFull = window.setTimeout(() => setProgress(100), 600);
    const tFade = window.setTimeout(() => setFading(true), 680);
    const tDone = window.setTimeout(() => {
      setHidden(true);
      onDone?.();
    }, 960);

    return () => {
      window.clearTimeout(tStart);
      window.clearTimeout(tMid);
      window.clearTimeout(tFull);
      window.clearTimeout(tFade);
      window.clearTimeout(tDone);
    };
  }, [onDone]);

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={tx('Đang khởi động VnSavingPro', 'Loading VnSavingPro', 'VnSavingPro を読み込み中')}
      className={`fixed inset-0 z-[95] flex flex-col items-center justify-center bg-[#06080f] px-6 transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px circle at 50% 42%, rgba(99,102,241,0.16), transparent 65%), radial-gradient(420px circle at 55% 58%, rgba(16,185,129,0.10), transparent 65%)',
        }}
      />

      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        <div className="relative flex items-center justify-center gap-3">
          <div className="absolute -inset-4 rounded-full bg-amber-500/15 blur-2xl animate-pulse" />
          <LuckyCatMascot mood="wave" size="md" className="relative z-10" />
          <img
            src="/logo.png"
            alt="VnSavingPro"
            width={56}
            height={56}
            className="relative z-10 size-14 rounded-[18px] object-cover ring-1 ring-white/20 shadow-[0_14px_40px_-8px_rgba(99,102,241,0.75)]"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-white">
            VnSaving<span className="text-indigo-300">Pro</span>
          </span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-medium text-indigo-200 ring-1 ring-inset ring-white/10">
            {APP_VERSION}
          </span>
        </div>

        <p className="mt-2 text-xs text-amber-200/90">
          {tx(
            'Meow~ Mèo Chiêu Tài Miu Vàng đang mở két lãi suất & trông vườn cây cho bạn...',
            'Meow~ Miu Vang Lucky Cat is unlocking rates & tending your wealth orchard...',
            'ニャ〜！招き猫ミウちゃんが金利表と資産ツリーを準備中...'
          )}
        </p>

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-400 to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>
            {tx(
              'Cá nhân · Cặp đôi · Gia đình · Chuẩn SBV 365 ngày',
              'Personal · Couple · Family · SBV 365-day standard',
              '個人・カップル・家族向け・SBV 365日基準'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
