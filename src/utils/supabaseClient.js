export const supabaseBrowserUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
export const supabaseBrowserKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

export const isBrowserAuthConfigured = () =>
  Boolean(supabaseBrowserUrl && supabaseBrowserKey && /^https?:\/\//i.test(supabaseBrowserUrl));

/**
 * Checks synchronously whether the user already has a persisted Supabase auth session token
 * so anonymous visitors avoid downloading the `@supabase/supabase-js` SDK on initial load.
 */
export function hasStoredSupabaseSession() {
  if (typeof window === 'undefined' || !isBrowserAuthConfigured()) return false;
  try {
    const storage = window.localStorage;
    if (!storage) return false;
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && /^sb-[a-z0-9-]+-auth-token/i.test(key)) {
        const val = storage.getItem(key);
        if (val && val.length > 20) return true;
      }
    }
  } catch {
    // Ignore restricted localStorage access
  }
  return false;
}

/**
 * Detects OAuth/password-recovery return callbacks that require initializing Supabase Auth.
 */
export function hasAuthUrlCallback() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  return (
    path === '/auth' ||
    path === '/login' ||
    path === '/register' ||
    /[?&](?:code|error|type=recovery)=?/i.test(search) ||
    /#(?:access_token|error)=/i.test(hash)
  );
}

let clientPromise = null;

/**
 * Lazily loads and instantiates the singleton Supabase Auth client in a deferred JS chunk.
 */
export async function loadSupabaseClient() {
  if (!isBrowserAuthConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseBrowserUrl, supabaseBrowserKey, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    );
  }
  return clientPromise;
}
