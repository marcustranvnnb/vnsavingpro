import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INITIAL_BANKS_DATA, RATES_UPDATED_AT } from './data/banksData.js';
import { cryptoStorage } from './utils/cryptoStorage.js';

/* ── Hash router ────────────────────────────────────────────
   Hash routes (#/plan, #/rates?…) work on any static host
   (Cloudflare Pages included) without server rewrites.        */

function readHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  return { route: path || 'home', params: Object.fromEntries(new URLSearchParams(query)) };
}

export function useRoute() {
  const [state, setState] = useState(readHash);
  useEffect(() => {
    const onChange = () => {
      setState(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return state;
}

export const href = (route, params) => {
  const q = params ? `?${new URLSearchParams(params)}` : '';
  return route === 'home' ? '#/' : `#/${route}${q}`;
};

/* ── Toast ─────────────────────────────────────────────── */

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

function ToastViewport({ toast }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 md:bottom-8">
      <div
        key={toast.id}
        className="flex animate-pop items-center gap-2 rounded-xl border border-white/10 bg-elevated/95 px-4 py-2.5 text-sm text-white shadow-2xl backdrop-blur"
      >
        <CheckCircle2 className="size-4 text-emerald-400" />
        {toast.message}
      </div>
    </div>
  );
}

/* ── Rates (with user overrides persisted on device) ───── */

const RatesCtx = createContext(null);
export const useRates = () => useContext(RatesCtx);

export function AppProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message) => {
    const id = Date.now();
    setToast({ id, message });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2400);
  }, []);

  const [customRates, setCustomRates] = useState(() => cryptoStorage.load('CUSTOM_RATES', {}));
  const [serverBanks, setServerBanks] = useState(INITIAL_BANKS_DATA);
  const [updatedAt, setUpdatedAt] = useState(RATES_UPDATED_AT);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.banks) && data.banks.length > 0) setServerBanks(data.banks);
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
      })
      .catch(() => {
        // Fallback silently to bundled INITIAL_BANKS_DATA
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rates = useMemo(() => {
    const persist = (next) => {
      setCustomRates(next);
      cryptoStorage.save('CUSTOM_RATES', next);
    };
    const getRate = (bank, tenure) => {
      const key = `${bank.id}_${tenure}`;
      return customRates[key] !== undefined ? customRates[key] : bank.rates[tenure] || 0;
    };
    return {
      banks: serverBanks,
      updatedAt,
      customRates,
      getRate,
      isCustom: (bank, tenure) => customRates[`${bank.id}_${tenure}`] !== undefined,
      setRate: (bank, tenure, value) => persist({ ...customRates, [`${bank.id}_${tenure}`]: value }),
      resetRate: (bank, tenure) => {
        const next = { ...customRates };
        delete next[`${bank.id}_${tenure}`];
        persist(next);
      },
      replaceAll: (next) => persist(next || {}),
      /** Highest rate across banks for a tenure. */
      best: (tenure) =>
        serverBanks.map((b) => ({ bank: b, rate: getRate(b, tenure) })).sort((a, b) => b.rate - a.rate)[0],
    };
  }, [customRates, serverBanks, updatedAt]);

  return (
    <ToastCtx.Provider value={notify}>
      <RatesCtx.Provider value={rates}>
        {children}
        <ToastViewport toast={toast} />
      </RatesCtx.Provider>
    </ToastCtx.Provider>
  );
}
