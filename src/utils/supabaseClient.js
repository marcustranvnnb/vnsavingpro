import { createClient } from '@supabase/supabase-js';

export const supabaseBrowserUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
export const supabaseBrowserKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

export const isBrowserAuthConfigured = () =>
  Boolean(supabaseBrowserUrl && supabaseBrowserKey && /^https?:\/\//i.test(supabaseBrowserUrl));

export const supabase = isBrowserAuthConfigured()
  ? createClient(supabaseBrowserUrl, supabaseBrowserKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
