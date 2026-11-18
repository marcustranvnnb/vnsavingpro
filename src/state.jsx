import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INITIAL_BANKS_DATA, RATES_UPDATED_AT } from './data/banksData.js';
import { getPageTitle, getRoutePath, resolveRouteId } from './tools.js';
import { cryptoStorage } from './utils/cryptoStorage.js';

/* ── Clean History API Router ───────────────────────────────
   Uses clean URLs (`/`, `/plan`, `/rates`, ...) backed by
   Vercel (`vercel.json`) and Cloudflare (`_redirects`) SPA
   rewrites, with automatic `#/...` legacy hash migration.    */

const NAV_EVENT = 'vnsaving:navigate';

function readLocation() {
  if (window.location.hash === '#' || window.location.hash.startsWith('#/')) {
    const raw = window.location.hash.slice(1);
    const [hashPath = '/', hashQuery = ''] = raw.split('?');
    const routeId = resolveRouteId(hashPath);
    const cleanPath = getRoutePath(routeId);
    const cleanUrl = hashQuery ? `${cleanPath}?${hashQuery}` : cleanPath;
    window.history.replaceState({}, '', cleanUrl);
  }
  const params = Object.fromEntries(new URLSearchParams(window.location.search));
  return { route: resolveRouteId(window.location.pathname), params };
}

export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.origin);
  const targetUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (targetUrl !== currentUrl) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', targetUrl);
    window.dispatchEvent(new CustomEvent(NAV_EVENT));
  }
  window.scrollTo({ top: 0 });
}

export function useRoute() {
  const [state, setState] = useState(readLocation);

  useEffect(() => {
    document.title = getPageTitle(state.route);
  }, [state.route]);

  useEffect(() => {
    const onChange = () => {
      setState(readLocation());
      window.scrollTo({ top: 0 });
    };

    const onDocumentClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = e.target?.closest?.('a[href]');
      if (!anchor || anchor.hasAttribute('download')) return;
      const targetAttr = anchor.getAttribute('target');
      if (targetAttr && targetAttr !== '_self') return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      let resolved;
      try {
        resolved = new URL(anchor.href, window.location.origin);
      } catch {
        return;
      }
      if (resolved.origin !== window.location.origin) return;
      if (resolved.pathname.startsWith('/api/') || /\.pdf$/i.test(resolved.pathname)) return;

      e.preventDefault();
      navigate(`${resolved.pathname}${resolved.search}${resolved.hash}`);
    };

    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    window.addEventListener(NAV_EVENT, onChange);
    document.addEventListener('click', onDocumentClick);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener(NAV_EVENT, onChange);
      document.removeEventListener('click', onDocumentClick);
    };
  }, []);

  return state;
}

export const href = (route, params) => {
  const basePath = getRoutePath(route);
  const search = params ? new URLSearchParams(params).toString() : '';
  return search ? `${basePath}?${search}` : basePath;
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
