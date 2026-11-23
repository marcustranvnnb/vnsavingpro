// ============================================================================
// Server-only Supabase PostgREST client (Zero external dependencies)
// Runs strictly inside Vercel / Node serverless functions (`api/`).
// Gracefully falls back when SUPABASE_URL / keys are not configured yet.
// ============================================================================

const DEFAULT_TIMEOUT_MS = 3500;

export function getSupabaseConfig() {
  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  const apiKey = serviceKey || anonKey;

  return {
    url,
    apiKey,
    hasServiceRole: Boolean(serviceKey),
  };
}

export function isSupabaseConfigured() {
  const { url, apiKey } = getSupabaseConfig();
  return Boolean(
    url &&
      apiKey &&
      /^https?:\/\/[a-z0-9.-]+/i.test(url) &&
      !url.includes('your-project-id') &&
      !apiKey.includes('your-')
  );
}

async function sbFetch(pathWithQuery, { method = 'GET', body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { url, apiKey } = getSupabaseConfig();
  if (!isSupabaseConfigured()) {
    return { ok: false, status: 0, data: null, error: 'Supabase not configured' };
  }

  try {
    const endpoint = `${url}/rest/v1/${String(pathWithQuery).replace(/^\/+/, '')}`;
    const res = await fetch(endpoint, {
      method,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    });

    const text = await res.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: typeof parsed === 'object' && parsed?.message ? parsed.message : `Supabase HTTP ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data: parsed, error: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Supabase request failed',
    };
  }
}

export async function sbSelect(table, queryString = '') {
  const path = queryString ? `${table}?${queryString}` : table;
  return sbFetch(path, { method: 'GET' });
}

export async function sbInsert(table, rowOrRows, { returning = false } = {}) {
  return sbFetch(table, {
    method: 'POST',
    headers: {
      Prefer: `return=${returning ? 'representation' : 'minimal'}`,
    },
    body: rowOrRows,
  });
}

export async function sbUpsert(table, rowOrRows, onConflictColumn) {
  const path = onConflictColumn ? `${table}?on_conflict=${encodeURIComponent(onConflictColumn)}` : table;
  return sbFetch(path, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: rowOrRows,
  });
}

export async function sbDelete(table, queryString = '') {
  const path = queryString ? `${table}?${queryString}` : table;
  return sbFetch(path, { method: 'DELETE' });
}

export async function sbPatch(table, queryString, patchFields) {
  const path = queryString ? `${table}?${queryString}` : table;
  return sbFetch(path, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: patchFields,
  });
}

export async function sbRpc(fnName, params = {}) {
  return sbFetch(`rpc/${encodeURIComponent(fnName)}`, {
    method: 'POST',
    body: params,
  });
}

export async function getUserFromBearerToken(req) {
  const authHeader = String(req?.headers?.authorization || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { ok: false, user: null };
  }
  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20 || !isSupabaseConfigured()) {
    return { ok: false, user: null };
  }

  const { url, apiKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${token}`,
      },
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(DEFAULT_TIMEOUT_MS) : undefined,
    });
    if (!res.ok) {
      return { ok: false, user: null };
    }
    const user = await res.json();
    if (!user?.id) {
      return { ok: false, user: null };
    }
    return { ok: true, user };
  } catch {
    return { ok: false, user: null };
  }
}
