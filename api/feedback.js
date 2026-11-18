import { readJsonBody } from './_lib/http.js';

const MAX_ENTRIES = 500;
const feedbackStore = [];

function getSummary() {
  const count = feedbackStore.length;
  const averageRating =
    count > 0
      ? Number((feedbackStore.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(1))
      : 0;
  return { count, averageRating };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const summary = getSummary();
    return res.status(200).json({
      ...summary,
      entries: feedbackStore.slice(0, 50),
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

  const summary = getSummary();
  return res.status(200).json({
    ok: true,
    entry,
    ...summary,
  });
}
