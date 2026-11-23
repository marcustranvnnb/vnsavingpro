import { useCallback, useEffect, useRef, useState } from 'react';
import { cryptoStorage } from './cryptoStorage.js';
import { getFormatLang } from './format.js';

export const POC_QUOTA_EVENT = 'vnsaving:poc-quota-reached';
export const OPEN_AUTH_EVENT = 'vnsaving:open-auth';
export const CALC_HISTORY_UPDATED_EVENT = 'vnsaving:calc-history-updated';

export function emitPocQuotaReached(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(POC_QUOTA_EVENT, { detail }));
  }
}

export function openAuthPrompt(mode = 'login') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_AUTH_EVENT, { detail: { mode } }));
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
 * Supports two modes:
 * - `'auto'` (default): live calculation whenever payload updates (used in Home QuickEstimate).
 * - `'manual'`: computes on initial mount and auto-re-localizes on language change, while
 *   explicitly waiting for the user's Run CTA (`run()`) whenever tool input parameters change,
 *   showing smooth lazy loading feedback (`minLoadingMs`) and invoking `onSuccess`.
 */
export function useServerCalc(action, payload, initialData = null, options = {}) {
  const { mode = 'auto', minLoadingMs = mode === 'manual' ? 320 : 0, onSuccess = null } = options || {};

  const lang = getFormatLang();
  const baseSerialized = JSON.stringify(payload ?? {});
  const effectivePayload =
    payload && typeof payload === 'object' && !Array.isArray(payload) && !payload.lang
      ? { ...payload, lang }
      : payload;
  const serialized = JSON.stringify(effectivePayload ?? {});
  const cacheKey = `${action}:${serialized}`;

  const [applied, setApplied] = useState(() => ({
    cacheKey,
    baseSerialized,
    payload: effectivePayload,
    seq: 0,
    trigger: 'init',
  }));

  const [state, setState] = useState(() => {
    const hit = calcCache.get(cacheKey);
    return {
      data: hit ?? initialData,
      loading: !hit,
      initialized: Boolean(hit),
      error: null,
    };
  });

  const latestRef = useRef({ cacheKey, baseSerialized, payload: effectivePayload });
  latestRef.current = { cacheKey, baseSerialized, payload: effectivePayload };

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (mode === 'auto') {
      if (cacheKey !== applied.cacheKey) {
        setApplied((prev) => ({
          cacheKey,
          baseSerialized,
          payload: effectivePayload,
          seq: prev.seq,
          trigger: 'auto',
        }));
      }
      return;
    }

    // In manual mode, keep existing applied inputs dirty until user clicks Run,
    // UNLESS inputs haven't diverged and only the UI language changed.
    if (baseSerialized === applied.baseSerialized && cacheKey !== applied.cacheKey) {
      setApplied((prev) => ({
        ...prev,
        cacheKey,
        payload: effectivePayload,
        trigger: 'lang',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cacheKey, baseSerialized, applied.baseSerialized, applied.cacheKey]);

  const run = useCallback(() => {
    const latest = latestRef.current;
    setApplied((prev) => ({
      cacheKey: latest.cacheKey,
      baseSerialized: latest.baseSerialized,
      payload: latest.payload,
      seq: prev.seq + 1,
      trigger: 'manual',
    }));
  }, []);

  useEffect(() => {
    const targetKey = applied.cacheKey;
    const targetPayload = applied.payload;
    const targetTrigger = applied.trigger;
    const hit = calcCache.get(targetKey);

    if (hit && targetTrigger !== 'manual') {
      setState({ data: hit, loading: false, initialized: true, error: null });
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    const startedAt = Date.now();
    const effectiveMinMs = targetTrigger === 'manual' ? Math.max(240, minLoadingMs) : minLoadingMs;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const debounceMs = targetTrigger === 'manual' ? 0 : 45;
    const timer = setTimeout(async () => {
      try {
        let json = hit;
        if (!json) {
          const res = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload: targetPayload }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            handlePotentialPocLock(res, errJson);
            throw new Error(errJson?.error || `HTTP ${res.status}`);
          }
          json = await res.json();
          setCached(targetKey, json);
        }

        const elapsed = Date.now() - startedAt;
        const waitMs = Math.max(0, effectiveMinMs - elapsed);
        if (waitMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }

        if (!cancelled) {
          setState({ data: json, loading: false, initialized: true, error: null });
          if (targetTrigger === 'manual' && typeof onSuccessRef.current === 'function') {
            onSuccessRef.current(json, targetPayload);
          }
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setState((prev) => ({
            ...prev,
            loading: false,
            initialized: true,
            error: err.message || 'Calculation error',
          }));
        }
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, applied.cacheKey, applied.seq]);

  const isDirty = mode === 'manual' && baseSerialized !== applied.baseSerialized;

  return {
    ...state,
    isDirty,
    run,
    runCount: applied.seq,
  };
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

/* ── Calculation & Plan Run History ─────────────────────────────────────── */

export function makeClientRunId() {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadLocalCalculationHistory() {
  const list = cryptoStorage.load('CALC_HISTORY_LOG', []);
  return Array.isArray(list) ? list : [];
}

export function saveLocalCalculationHistoryEntry(entry) {
  if (!entry || !entry.tool) return [];
  const existing = loadLocalCalculationHistory();
  const key = entry.clientRunId || entry.id;
  const deduped = existing.filter((x) => (x.clientRunId || x.id) !== key);
  const next = [entry, ...deduped].slice(0, 40);
  cryptoStorage.save('CALC_HISTORY_LOG', next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CALC_HISTORY_UPDATED_EVENT));
  }
  return next;
}

export function removeLocalCalculationHistoryEntry(idOrRunId) {
  const existing = loadLocalCalculationHistory();
  const next = existing.filter((x) => x.id !== idOrRunId && x.clientRunId !== idOrRunId);
  cryptoStorage.save('CALC_HISTORY_LOG', next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CALC_HISTORY_UPDATED_EVENT));
  }
  return next;
}

export function saveToolRestoreState(tool, inputs) {
  return cryptoStorage.save('TOOL_RESTORE_STATE', {
    tool,
    inputs: inputs && typeof inputs === 'object' ? inputs : {},
    restoredAt: new Date().toISOString(),
  });
}

export function consumeToolRestoreState(expectedTool) {
  const pending = cryptoStorage.load('TOOL_RESTORE_STATE', null);
  if (pending && pending.tool === expectedTool && pending.inputs && typeof pending.inputs === 'object') {
    setTimeout(() => {
      const current = cryptoStorage.load('TOOL_RESTORE_STATE', null);
      if (current && current.restoredAt === pending.restoredAt && current.tool === expectedTool) {
        cryptoStorage.remove('TOOL_RESTORE_STATE');
      }
    }, 250);
    return pending.inputs;
  }
  return null;
}

export async function fetchMyCalculationHistoryFromApi(accessToken, { tool = null, limit = 40 } = {}) {
  const params = new URLSearchParams();
  if (tool && tool !== 'all') params.set('tool', tool);
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`/api/history?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return Array.isArray(json.items) ? json.items : [];
}

export async function saveCalculationHistoryToApi(entriesOrEntry, accessToken) {
  if (!accessToken) return null;
  const body = Array.isArray(entriesOrEntry) ? { entries: entriesOrEntry } : entriesOrEntry;
  const res = await fetch('/api/history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  handlePotentialPocLock(res, json);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function deleteCalculationHistoryFromApi(idOrRunId, accessToken) {
  if (!accessToken) return { ok: true };
  const query = idOrRunId === null ? 'all=1' : `id=${encodeURIComponent(idOrRunId)}`;
  const res = await fetch(`/api/history?${query}`, {
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

export function recordToolRun({
  tool,
  title,
  householdMode = 'INDIVIDUAL',
  summary = '',
  metrics = [],
  inputs = {},
  accessToken = null,
}) {
  const clientRunId = makeClientRunId();
  const entry = {
    id: clientRunId,
    clientRunId,
    tool,
    title: String(title || tool).slice(0, 140),
    householdMode,
    summary: String(summary || '').slice(0, 240),
    metrics: Array.isArray(metrics) ? metrics.slice(0, 6) : [],
    inputs: inputs && typeof inputs === 'object' ? inputs : {},
    createdAt: new Date().toISOString(),
  };

  saveLocalCalculationHistoryEntry(entry);

  if (accessToken) {
    saveCalculationHistoryToApi(entry, accessToken).catch(() => {
      // Retain local encrypted history gracefully if network/token temporarily fails
    });
  }

  return entry;
}

export async function syncLocalHistoryToCloud(accessToken) {
  if (!accessToken) return [];
  const local = loadLocalCalculationHistory();
  if (local.length === 0) return [];
  try {
    const res = await saveCalculationHistoryToApi(local.slice(0, 25), accessToken);
    return Array.isArray(res?.items) ? res.items : local;
  } catch {
    return local;
  }
}
