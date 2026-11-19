import { useEffect, useState } from 'react';
import { cryptoStorage } from './cryptoStorage.js';

export const POC_QUOTA_EVENT = 'vnsaving:poc-quota-reached';

export function emitPocQuotaReached(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(POC_QUOTA_EVENT, { detail }));
  }
}

function handlePotentialPocLock(res, json) {
  if ((res?.status === 503 || json?.pocValidationReached) && json?.code === 'POC_QUOTA_REACHED') {
    emitPocQuotaReached(json);
    return true;
  }
  return false;
}

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
      initialized: Boolean(hit),
      error: null,
    };
  });

  useEffect(() => {
    const hit = calcCache.get(cacheKey);
    if (hit) {
      setState({ data: hit, loading: false, initialized: true, error: null });
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
          const errJson = await res.json().catch(() => ({}));
          handlePotentialPocLock(res, errJson);
          throw new Error(errJson?.error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        setCached(cacheKey, json);
        if (!cancelled) {
          setState({ data: json, loading: false, initialized: true, error: null });
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setState((prev) => ({ ...prev, loading: false, initialized: true, error: err.message || 'Calculation error' }));
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

export async function fetchLiveRatesFromApi() {
  const res = await fetch('/api/rates');
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function fetchQuotaStatusFromApi() {
  const res = await fetch('/api/quota-status');
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  return json;
}

export async function saveCloudPlanToApi({ title, shareCode, payload, isShared = true, accessToken = null }) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await fetch('/api/plans', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, shareCode, payload, isShared }),
  });
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function fetchCloudPlanFromApi(code, accessToken = null) {
  const cleanCode = String(code || '').trim().toUpperCase();
  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await fetch(`/api/plans?code=${encodeURIComponent(cleanCode)}`, { headers });
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function fetchMyCloudPlansFromApi(accessToken) {
  const res = await fetch('/api/plans?mine=1', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function deleteCloudPlanFromApi(code, accessToken) {
  const cleanCode = String(code || '').trim().toUpperCase();
  const res = await fetch(`/api/plans?code=${encodeURIComponent(cleanCode)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}
