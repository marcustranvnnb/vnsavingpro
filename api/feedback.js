import { readJsonBody } from './_lib/http.js';
import { isSupabaseConfigured, sbInsert, sbSelect } from './_lib/supabase.js';

const MAX_ENTRIES = 500;
const feedbackStore = [];

function getSummary(list = feedbackStore) {
  const count = list.length;
  const averageRating =
    count > 0
      ? Number((list.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / count).toFixed(1))
      : 0;
  return { count, averageRating };
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const supabaseConnected = isSupabaseConfigured();

  if (req.method === 'GET') {
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

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tool: String(body?.tool || 'unknown').slice(0, 40),
    toolLabel: String(body?.toolLabel || '').slice(0, 80),
    rating,
    tags: Array.isArray(body?.tags) ? body.tags.slice(0, 8).map((t) => String(t).slice(0, 60)) : [],
    comment: String(body?.comment || '').trim().slice(0, 800),
    snapshot: body?.snapshot && typeof body.snapshot === 'object' ? body.snapshot : null,
    createdAt: body?.createdAt || new Date().toISOString(),
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
  return res.status(200).json({
    ok: true,
    entry,
    persisted,
    supabaseConnected,
    ...summary,
  });
}
