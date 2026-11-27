import { randomUUID } from 'node:crypto';
import { readJsonBody } from './_lib/http.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';
import { createRateLimiter } from './_lib/rateLimit.js';
import { applyApiSecurityHeaders, isAdminBearerAuthorized, isTrustedOrigin } from './_lib/security.js';
import { isSupabaseConfigured, sbInsert, sbSelect } from './_lib/supabase.js';

const MAX_ENTRIES = 500;
const feedbackStore = [];
const readLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60, maxEntries: 2000 });
const writeLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 8, maxEntries: 2000 });

function getSummary(list = feedbackStore) {
  const count = list.length;
  const averageRating =
    count > 0
      ? Number((list.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / count).toFixed(1))
      : 0;
  return { count, averageRating };
}

function sanitizeText(raw, maxLen = 120) {
  return String(raw || '')
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizePublicUrl(raw) {
  const clean = String(raw || '').trim().slice(0, 200);
  if (!clean) return '';
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Reject invalid URLs
  }
  return '';
}

function normalizeRemoteEntry(row) {
  return {
    id: row.id,
    tool: row.tool || 'unknown',
    toolLabel: row.tool_label || '',
    rating: Number(row.rating) || 5,
    tags: Array.isArray(row.tags) ? row.tags : [],
    comment: row.comment || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Maps stored row/entry into strictly sanitized public contributor entry.
 * Never includes financial snapshot figures (capital, salary, target, etc.).
 */
function toPublicContributorEntry(raw) {
  const snapshot = raw?.snapshot;
  const credit = snapshot && typeof snapshot === 'object' ? snapshot.communityCredit : null;
  if (!credit || credit.showPublicly !== true) return null;

  return {
    id: String(raw.id || ''),
    name: sanitizeText(credit.name, 60) || 'VnSavingPro Contributor',
    url: sanitizePublicUrl(credit.url),
    tool: sanitizeText(raw.tool || 'general', 40),
    toolLabel: sanitizeText(raw.tool_label ?? raw.toolLabel ?? '', 80),
    rating: Math.min(5, Math.max(1, Math.round(Number(raw.rating) || 5))),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 6).map((t) => sanitizeText(t, 50)).filter(Boolean) : [],
    comment: sanitizeText(raw.comment || '', 800),
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  const isPublicMode = req.method === 'GET' && /(?:^|[?&])public=1(?:&|$)/.test(String(req.url || ''));

  if (req.method === 'GET' && readLimiter(req)) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please slow down.' });
  }
  if (req.method === 'POST' && writeLimiter(req)) {
    return res.status(429).json({ ok: false, error: 'Too many feedback submissions. Please wait a minute.' });
  }

  res.setHeader(
    'Cache-Control',
    isPublicMode ? 'public, s-maxage=300, stale-while-revalidate=600' : 'no-store'
  );

  const quotaGuard = await checkAndTrackQuota({ trackApiHit: !isPublicMode });
  if (quotaGuard.blocked) {
    return sendPocQuotaResponse(res, quotaGuard);
  }
  const supabaseConnected = isSupabaseConfigured();

  if (req.method === 'GET') {
    if (isPublicMode) {
      let publicEntries = [];
      if (supabaseConnected) {
        const sbRes = await sbSelect(
          'user_feedback',
          'select=id,tool,tool_label,rating,tags,comment,snapshot,created_at&order=created_at.desc&limit=100'
        );
        if (sbRes.ok && Array.isArray(sbRes.data)) {
          publicEntries = sbRes.data.map(toPublicContributorEntry).filter(Boolean);
          return res.status(200).json({
            count: publicEntries.length,
            entries: publicEntries,
            storage: 'supabase',
            supabaseConnected: true,
          });
        }
      }

      publicEntries = feedbackStore.map(toPublicContributorEntry).filter(Boolean).slice(0, 100);
      return res.status(200).json({
        count: publicEntries.length,
        entries: publicEntries,
        storage: 'memory',
        supabaseConnected,
      });
    }

    if (!isAdminBearerAuthorized(req)) {
      return res.status(401).json({
        ok: false,
        error: 'Admin authorization required. Use ?public=1 for public contributor feed.',
      });
    }

    if (supabaseConnected) {
      const sbRes = await sbSelect(
        'user_feedback',
        'select=id,tool,tool_label,rating,tags,comment,created_at&order=created_at.desc&limit=50'
      );
      if (sbRes.ok && Array.isArray(sbRes.data)) {
        const entries = sbRes.data.map(normalizeRemoteEntry);
        return res.status(200).json({
          ...getSummary(entries),
          entries,
          storage: 'supabase',
          supabaseConnected: true,
        });
      }
    }

    return res.status(200).json({
      ...getSummary(feedbackStore),
      entries: feedbackStore.slice(0, 50),
      storage: 'memory',
      supabaseConnected,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const rating = Math.round(Number(body?.rating) || 0);
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const showPublicly = Boolean(body?.showPublicly);
  const contributorName = sanitizeText(body?.contributorName || '', 60);
  const contributorUrl = sanitizePublicUrl(body?.contributorUrl || '');
  let baseSnapshot = {};
  if (body?.snapshot && typeof body.snapshot === 'object' && !Array.isArray(body.snapshot)) {
    try {
      const encodedSnap = JSON.stringify(body.snapshot);
      if (encodedSnap && encodedSnap.length <= 4096) {
        baseSnapshot = JSON.parse(encodedSnap);
      }
    } catch {
      baseSnapshot = {};
    }
  }
  const snapshotWithCredit = {
    ...baseSnapshot,
    communityCredit: showPublicly
      ? {
          showPublicly: true,
          name: contributorName || 'VnSavingPro Contributor',
          url: contributorUrl,
        }
      : { showPublicly: false },
  };

  const entry = {
    id: `fb_${randomUUID()}`,
    tool: sanitizeText(body?.tool || 'unknown', 40),
    toolLabel: sanitizeText(body?.toolLabel || '', 80),
    rating,
    tags: Array.isArray(body?.tags) ? body.tags.slice(0, 8).map((t) => sanitizeText(t, 60)).filter(Boolean) : [],
    comment: sanitizeText(body?.comment || '', 800),
    snapshot: snapshotWithCredit,
    createdAt: new Date().toISOString(),
  };

  feedbackStore.unshift(entry);
  if (feedbackStore.length > MAX_ENTRIES) {
    feedbackStore.length = MAX_ENTRIES;
  }

  let persisted = 'memory';
  if (supabaseConnected) {
    const sbRes = await sbInsert('user_feedback', {
      id: entry.id,
      tool: entry.tool,
      tool_label: entry.toolLabel,
      rating: entry.rating,
      tags: entry.tags,
      comment: entry.comment,
      snapshot: entry.snapshot,
      created_at: entry.createdAt,
    });
    if (sbRes.ok) {
      persisted = 'supabase';
    }
  }

  const summary = getSummary(feedbackStore);
  const { snapshot: _omittedSnapshot, ...safeResponseEntry } = entry;
  return res.status(200).json({
    ok: true,
    entry: {
      ...safeResponseEntry,
      showPublicly,
      contributorName: showPublicly ? snapshotWithCredit.communityCredit.name : '',
      contributorUrl: showPublicly ? snapshotWithCredit.communityCredit.url : '',
    },
    persisted,
    supabaseConnected,
    ...summary,
  });
}
