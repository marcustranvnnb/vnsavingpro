import { useEffect, useState } from 'react';
import { cryptoStorage } from './cryptoStorage.js';

const calcCache = new Map();
const MAX_CACHE_ENTRIES = 100;

function setCached(key, value) {
  if (calcCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = calcCache.keys().next().value;
    calcCache.delete(oldestKey);
  }
  calcCache.set(key, value);
}

/**
 * Fetches proprietary calculations from the serverless endpoint `/api/calculate`.
 * Retains previous valid state while updating so UI sliders stay smooth and flicker-free.
 */
export function useServerCalc(action, payload, initialData = null) {
  const serialized = JSON.stringify(payload);
  const cacheKey = `${action}:${serialized}`;

  const [state, setState] = useState(() => {
    const hit = calcCache.get(cacheKey);
    return {
      data: hit ?? initialData,
      loading: !hit,
      error: null,
    };
  });

  useEffect(() => {
    const hit = calcCache.get(cacheKey);
    if (hit) {
      setState({ data: hit, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setCached(cacheKey, json);
        if (!cancelled) {
          setState({ data: json, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setState((prev) => ({ ...prev, loading: false, error: err.message || 'Calculation error' }));
        }
      }
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return state;
}

export function loadSavedPlannerState() {
  return cryptoStorage.load('PLANNER_STATE', {}) || {};
}
