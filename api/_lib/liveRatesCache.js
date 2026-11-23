import { INITIAL_BANKS_DATA, RATES_UPDATED_AT } from '../../src/data/banksData.js';
import { isSupabaseConfigured, sbDelete, sbInsert, sbSelect } from './supabase.js';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6-hour server memory cache for monthly day-1 rate snapshots

let cachedSnapshot = null;
let cachedAtMs = 0;
let cachedStorage = 'memory';

export function setLiveRatesSnapshot(banks, updatedAt, syncMeta = null, storage = 'memory') {
  cachedSnapshot = {
    banks,
    updatedAt,
    syncMeta,
    cachedAt: new Date().toISOString(),
  };
  cachedAtMs = Date.now();
  cachedStorage = storage;
  return cachedSnapshot;
}

export function getLiveRatesSnapshot() {
  if (cachedSnapshot) {
    return cachedSnapshot;
  }
  return {
    banks: INITIAL_BANKS_DATA,
    updatedAt: RATES_UPDATED_AT,
    syncMeta: null,
    cachedAt: null,
  };
}

export async function getLiveRatesSnapshotAsync({ bypassMemoryCache = false } = {}) {
  const supabaseConnected = isSupabaseConfigured();

  if (supabaseConnected) {
    const isFreshSupabaseCache =
      !bypassMemoryCache && cachedSnapshot && cachedStorage === 'supabase' && Date.now() - cachedAtMs <= CACHE_TTL_MS;
    if (isFreshSupabaseCache) {
      return {
        ...cachedSnapshot,
        storage: 'supabase',
        supabaseConnected: true,
      };
    }

    const res = await sbSelect(
      'bank_rate_snapshots',
      'select=updated_date,banks,sync_meta,created_at&order=created_at.desc&limit=1'
    );

    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      const row = res.data[0];
      if (Array.isArray(row?.banks) && row.banks.length > 0) {
        const snap = setLiveRatesSnapshot(
          row.banks,
          row.updated_date || RATES_UPDATED_AT,
          row.sync_meta || null,
          'supabase'
        );
        return {
          ...snap,
          snapshotCreatedAt: row.created_at || snap.cachedAt,
          storage: 'supabase',
          supabaseConnected: true,
        };
      }
    }

    return {
      ...getLiveRatesSnapshot(),
      storage: 'supabase-empty-fallback',
      supabaseConnected: true,
    };
  }

  return {
    ...getLiveRatesSnapshot(),
    storage: 'memory',
    supabaseConnected: false,
  };
}

export async function setLiveRatesSnapshotAsync(banks, updatedDate, syncMeta = {}) {
  const snap = setLiveRatesSnapshot(banks, updatedDate, syncMeta, 'memory');
  const supabaseConnected = isSupabaseConfigured();

  if (!supabaseConnected) {
    return {
      ...snap,
      supabaseSaved: false,
      storage: 'memory',
      supabaseConnected: false,
    };
  }

  const res = await sbInsert(
    'bank_rate_snapshots',
    {
      updated_date: updatedDate,
      banks,
      sync_meta: syncMeta,
    },
    { returning: false }
  );

  if (res.ok) {
    cachedStorage = 'supabase';
    // Keep only newest 24 snapshots (2 years of monthly runs) to preserve Free-Tier storage
    try {
      const oldRes = await sbSelect('bank_rate_snapshots', 'select=id&order=created_at.desc&offset=24&limit=50');
      if (oldRes.ok && Array.isArray(oldRes.data) && oldRes.data.length > 0) {
        const oldIds = oldRes.data.map((r) => Number(r.id)).filter((n) => Number.isFinite(n) && n > 0);
        if (oldIds.length > 0) {
          await sbDelete('bank_rate_snapshots', `id=in.(${oldIds.join(',')})`);
        }
      }
    } catch {
      // Non-critical retention cleanup failure
    }
  }

  return {
    ...snap,
    supabaseSaved: res.ok,
    supabaseError: res.error || null,
    storage: res.ok ? 'supabase' : 'memory',
    supabaseConnected: true,
  };
}
