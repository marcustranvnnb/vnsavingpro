import { randomUUID } from 'node:crypto';
import { readJsonBody } from './_lib/http.js';
import {
  getUserFromBearerToken,
  isSupabaseConfigured,
  sbDelete,
  sbSelect,
  sbUpsert,
} from './_lib/supabase.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';
import { createRateLimiter } from './_lib/rateLimit.js';

const ALLOWED_TOOLS = new Set(['plan', 'calculator', 'ladder', 'career', 'inflation', 'fx', 'salary']);
const ALLOWED_MODES = new Set(['INDIVIDUAL', 'COUPLE', 'FAMILY']);
const ALLOWED_TONES = new Set(['default', 'emerald', 'indigo', 'amber']);
const MAX_ENTRIES_PER_USER = 50;
const MAX_BATCH = 25;
const historyLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60, maxEntries: 2000 });

// Per-user in-memory fallback when Supabase env vars are not configured or temporarily unreachable
const memoryHistoryByUser = new Map();

function cleanStr(val, maxLen = 140) {
  return String(val ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function sanitizeClientRunId(rawId) {
  const cleaned = String(rawId ?? '').trim();
  if (/^[a-zA-Z0-9_-]{4,64}$/.test(cleaned)) {
    return cleaned;
  }
  return `run_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function sanitizeIsoDate(rawDate) {
  if (rawDate) {
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return new Date().toISOString();
}

function sanitizeMetrics(rawMetrics) {
  if (!Array.isArray(rawMetrics)) return [];
  const out = [];
  for (const item of rawMetrics.slice(0, 6)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const label = cleanStr(item.label, 60);
    const value = cleanStr(item.value, 60);
    if (!label && !value) continue;
    const tone = ALLOWED_TONES.has(item.tone) ? item.tone : 'default';
    out.push({ label, value, tone });
  }
  return out;
}

function sanitizeInputs(rawInputs) {
  if (!rawInputs || typeof rawInputs !== 'object' || Array.isArray(rawInputs)) {
    return {};
  }
  try {
    const serialized = JSON.stringify(rawInputs);
    if (serialized.length <= 8000) {
      return JSON.parse(serialized);
    }
    const trimmed = {};
    for (const [k, v] of Object.entries(rawInputs).slice(0, 40)) {
      if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
        trimmed[k] = v;
      } else if (typeof v === 'string') {
        trimmed[k] = cleanStr(v, 160);
      }
    }
    return trimmed;
  } catch {
    return {};
  }
}

function sanitizeEntry(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const tool = cleanStr(raw.tool, 24).toLowerCase();
  if (!ALLOWED_TOOLS.has(tool)) return null;

  const title = cleanStr(raw.title, 140) || tool;
  const rawMode = cleanStr(raw.householdMode || raw.household_mode || 'INDIVIDUAL', 20).toUpperCase();
  const householdMode = ALLOWED_MODES.has(rawMode) ? rawMode : 'INDIVIDUAL';
  const summary = cleanStr(raw.summary, 240);
  const metrics = sanitizeMetrics(raw.metrics);
  const inputs = sanitizeInputs(raw.inputs);
  const clientRunId = sanitizeClientRunId(raw.clientRunId || raw.client_run_id);
  const createdAt = sanitizeIsoDate(raw.createdAt || raw.created_at);

  return {
    tool,
    title,
    householdMode,
    summary,
    metrics,
    inputs,
    clientRunId,
    createdAt,
  };
}

function formatRow(row) {
  return {
    id: String(row.id || row.client_run_id || ''),
    clientRunId: row.client_run_id || row.clientRunId || null,
    tool: row.tool,
    title: row.title || '',
    householdMode: row.household_mode || row.householdMode || 'INDIVIDUAL',
    summary: row.summary || '',
    metrics: Array.isArray(row.metrics) ? row.metrics : [],
    inputs: row.inputs && typeof row.inputs === 'object' ? row.inputs : {},
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

function upsertMemoryHistory(userId, normalizedEntries) {
  const existing = memoryHistoryByUser.get(userId) || [];
  const byRunId = new Map();
  for (const item of existing) {
    byRunId.set(item.clientRunId || item.id, item);
  }
  for (const entry of normalizedEntries) {
    byRunId.set(entry.clientRunId, {
      id: entry.clientRunId,
      ...entry,
    });
  }
  const merged = Array.from(byRunId.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ENTRIES_PER_USER);
  memoryHistoryByUser.set(userId, merged);
  return merged;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (historyLimiter(req)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please slow down.' });
  }

  const auth = await getUserFromBearerToken(req);
  if (!auth.ok || !auth.user?.id) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required',
    });
  }
  const userId = auth.user.id;
  const supabaseConnected = isSupabaseConfigured();

  if (req.method === 'GET') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) {
      return sendPocQuotaResponse(res, quotaGuard);
    }

    const toolParam = cleanStr(req.query?.tool, 24).toLowerCase();
    const toolFilter = ALLOWED_TOOLS.has(toolParam) ? toolParam : null;
    const rawLimit = Number(req.query?.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(MAX_ENTRIES_PER_USER, Math.max(1, Math.round(rawLimit))) : 40;

    if (supabaseConnected) {
      let query = `select=id,tool,title,household_mode,summary,metrics,inputs,client_run_id,created_at&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=${limit}`;
      if (toolFilter) {
        query += `&tool=eq.${encodeURIComponent(toolFilter)}`;
      }
      const dbRes = await sbSelect('calculation_history', query);
      if (dbRes.ok && Array.isArray(dbRes.data)) {
        const items = dbRes.data.map(formatRow);
        upsertMemoryHistory(userId, items);
        return res.status(200).json({
          ok: true,
          items,
          storage: 'supabase',
        });
      }
    }

    const mem = memoryHistoryByUser.get(userId) || [];
    const filtered = toolFilter ? mem.filter((item) => item.tool === toolFilter) : mem;
    return res.status(200).json({
      ok: true,
      items: filtered.slice(0, limit),
      storage: 'memory',
    });
  }

  if (req.method === 'POST') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) {
      return sendPocQuotaResponse(res, quotaGuard);
    }

    let body = {};
    try {
      body = await readJsonBody(req);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    }

    const rawList = Array.isArray(body?.entries) ? body.entries.slice(0, MAX_BATCH) : [body];
    const validEntries = rawList.map(sanitizeEntry).filter(Boolean);
    if (validEntries.length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid calculation history entry provided' });
    }

    upsertMemoryHistory(userId, validEntries);

    if (supabaseConnected) {
      const dbRows = validEntries.map((e) => ({
        user_id: userId,
        tool: e.tool,
        title: e.title,
        household_mode: e.householdMode,
        summary: e.summary,
        metrics: e.metrics,
        inputs: e.inputs,
        client_run_id: e.clientRunId,
        created_at: e.createdAt,
      }));
      const upRes = await sbUpsert('calculation_history', dbRows, 'user_id,client_run_id');
      if (upRes.ok && Array.isArray(upRes.data)) {
        const items = upRes.data.map(formatRow);
        // Enforce 50-row retention cap per user on Supabase Free Tier
        try {
          const oldRes = await sbSelect(
            'calculation_history',
            `select=id&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&offset=${MAX_ENTRIES_PER_USER}&limit=50`
          );
          if (oldRes.ok && Array.isArray(oldRes.data) && oldRes.data.length > 0) {
            const overflowIds = oldRes.data
              .map((r) => String(r.id || ''))
              .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
            if (overflowIds.length > 0) {
              await sbDelete(
                'calculation_history',
                `user_id=eq.${encodeURIComponent(userId)}&id=in.(${overflowIds.join(',')})`
              );
            }
          }
        } catch {
          // Non-critical retention cleanup failure
        }
        return res.status(200).json({
          ok: true,
          savedCount: items.length,
          items,
          storage: 'supabase',
        });
      }
    }

    return res.status(200).json({
      ok: true,
      savedCount: validEntries.length,
      items: validEntries.map((e) => ({ id: e.clientRunId, ...e })),
      storage: 'memory',
    });
  }

  if (req.method === 'DELETE') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) {
      return sendPocQuotaResponse(res, quotaGuard);
    }

    const clearAll = String(req.query?.all || '') === '1';
    const rawId = cleanStr(req.query?.id, 80);

    if (!clearAll && !rawId) {
      return res.status(400).json({ ok: false, error: 'Missing id or all=1 parameter' });
    }

    if (clearAll) {
      memoryHistoryByUser.set(userId, []);
      if (supabaseConnected) {
        await sbDelete('calculation_history', `user_id=eq.${encodeURIComponent(userId)}`);
      }
      return res.status(200).json({ ok: true, deletedAll: true });
    }

    const current = memoryHistoryByUser.get(userId) || [];
    memoryHistoryByUser.set(
      userId,
      current.filter((item) => item.id !== rawId && item.clientRunId !== rawId)
    );

    if (supabaseConnected) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
      const filterCol = isUuid ? 'id' : 'client_run_id';
      await sbDelete(
        'calculation_history',
        `${filterCol}=eq.${encodeURIComponent(rawId)}&user_id=eq.${encodeURIComponent(userId)}`
      );
    }

    return res.status(200).json({ ok: true, deletedId: rawId });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
