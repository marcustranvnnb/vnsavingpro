import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  hasAuthUrlCallback,
  hasStoredSupabaseSession,
  isBrowserAuthConfigured,
  loadSupabaseClient,
  supabaseBrowserKey,
  supabaseBrowserUrl,
} from '../utils/supabaseClient.js';
import { sanitizeText } from '../utils/cryptoStorage.js';

const AuthCtx = createContext(null);
const RETURN_PATH_KEY = 'vnsaving_auth_return_to';

export const useAuth = () => useContext(AuthCtx);

export function consumeAuthReturnPath() {
  try {
    const raw = window.sessionStorage?.getItem(RETURN_PATH_KEY) || '';
    window.sessionStorage?.removeItem(RETURN_PATH_KEY);
    if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/auth')) {
      return raw;
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
  return '';
}

function normalizeAuthError(err) {
  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
  if (msg.includes('email not confirmed')) return 'Vui lòng mở hộp thư và xác nhận email trước khi đăng nhập.';
  if (msg.includes('user already registered')) return 'Email này đã được đăng ký. Hãy chuyển sang tab Đăng nhập.';
  if (msg.includes('password should be at least')) return 'Mật khẩu cần tối thiểu 6 ký tự.';
  if (msg.includes('rate limit')) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
    return 'Đăng nhập Google chưa được bật trên Supabase Dashboard (Authentication → Providers → Google).';
  }
  if (msg.includes('access_denied')) return 'Bạn đã huỷ đăng nhập với Google.';
  return err?.message || 'Đã có lỗi xảy ra khi xác thực.';
}

export function AuthProvider({ children }) {
  const needsImmediateSessionHydration =
    isBrowserAuthConfigured() && (hasStoredSupabaseSession() || hasAuthUrlCallback());

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(needsImmediateSessionHydration);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(null);

  const clientRef = useRef(null);
  const listenerBoundRef = useRef(false);
  const subscriptionRef = useRef(null);
  const probedGoogleRef = useRef(false);

  const loadOrCreateProfile = useCallback(async (client, user) => {
    if (!client || !user?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, avatar_url, default_bank_id, preferred_goal_type, default_household_mode, updated_at, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      return data;
    }

    const fallbackName = sanitizeText(
      user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      80
    );
    const fallbackAvatar = String(user.user_metadata?.avatar_url || user.user_metadata?.picture || '').slice(0, 400);

    const { data: created } = await client
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: fallbackName,
          avatar_url: fallbackAvatar,
        },
        { onConflict: 'id' }
      )
      .select('id, full_name, avatar_url, default_bank_id, preferred_goal_type, default_household_mode, updated_at, created_at')
      .single();

    if (created) {
      setProfile(created);
      return created;
    }
    return null;
  }, []);

  const ensureClient = useCallback(async () => {
    if (!isBrowserAuthConfigured()) return null;
    const client = clientRef.current || (await loadSupabaseClient());
    if (!client) return null;
    clientRef.current = client;

    if (!listenerBoundRef.current) {
      listenerBoundRef.current = true;
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, nextSession) => {
        setSession(nextSession || null);
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecoveryMode(true);
        }
        if (nextSession?.user) {
          loadOrCreateProfile(client, nextSession.user);
        } else {
          setProfile(null);
        }
      });
      subscriptionRef.current = subscription;
    }

    return client;
  }, [loadOrCreateProfile]);

  useEffect(() => {
    let mounted = true;
    if (!needsImmediateSessionHydration) {
      setAuthLoading(false);
    } else {
      ensureClient()
        .then(async (client) => {
          if (!mounted || !client) {
            if (mounted) setAuthLoading(false);
            return;
          }
          const { data } = await client.auth.getSession();
          if (!mounted) return;
          const activeSession = data?.session || null;
          setSession(activeSession);
          if (activeSession?.user) {
            await loadOrCreateProfile(client, activeSession.user);
          }
          if (mounted) setAuthLoading(false);
        })
        .catch(() => {
          if (mounted) setAuthLoading(false);
        });
    }

    return () => {
      mounted = false;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      listenerBoundRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const probeGoogleProvider = useCallback(async () => {
    if (probedGoogleRef.current || !isBrowserAuthConfigured()) return;
    probedGoogleRef.current = true;
    try {
      const res = await fetch(`${supabaseBrowserUrl}/auth/v1/settings`, {
        headers: { apikey: supabaseBrowserKey },
      });
      const settings = res.ok ? await res.json() : null;
      if (settings?.external) {
        setGoogleEnabled(Boolean(settings.external.google));
      }
    } catch {
      // Ignore network failure while probing provider status
    }
  }, []);

  const value = useMemo(() => {
    const user = session?.user || null;

    return {
      authConfigured: isBrowserAuthConfigured(),
      googleEnabled,
      probeGoogleProvider,
      authLoading,
      session,
      user,
      profile,
      passwordRecoveryMode,
      clearPasswordRecoveryMode: () => setPasswordRecoveryMode(false),
      getAccessToken: () => session?.access_token || null,
      refreshProfile: async () => {
        if (!user) return null;
        const client = await ensureClient();
        return client ? loadOrCreateProfile(client, user) : null;
      },

      signInWithGoogle: async (redirectTo) => {
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        try {
          const currentPath = `${window.location.pathname}${window.location.search}`;
          if (currentPath && !currentPath.startsWith('/auth')) {
            window.sessionStorage?.setItem(RETURN_PATH_KEY, currentPath);
          }
        } catch {
          // Ignore sessionStorage restrictions
        }
        const callbackUrl = redirectTo || `${window.location.origin}/auth`;
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
        if (error) throw new Error(normalizeAuthError(error));
      },

      signInWithEmail: async (email, password) => {
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        const { data, error } = await client.auth.signInWithPassword({
          email: String(email || '').trim(),
          password: String(password || ''),
        });
        if (error) throw new Error(normalizeAuthError(error));
        return data;
      },

      signUpWithEmail: async (email, password, fullName = '') => {
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        const cleanName = sanitizeText(fullName, 80);
        const { data, error } = await client.auth.signUp({
          email: String(email || '').trim(),
          password: String(password || ''),
          options: {
            data: cleanName ? { full_name: cleanName } : undefined,
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw new Error(normalizeAuthError(error));
        return data;
      },

      resetPassword: async (email) => {
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        const { error } = await client.auth.resetPasswordForEmail(String(email || '').trim(), {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw new Error(normalizeAuthError(error));
      },

      updatePassword: async (newPassword) => {
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        const { error } = await client.auth.updateUser({ password: String(newPassword || '') });
        if (error) throw new Error(normalizeAuthError(error));
        setPasswordRecoveryMode(false);
      },

      updateProfile: async (patch) => {
        const client = await ensureClient();
        if (!client || !user?.id) throw new Error('Bạn cần đăng nhập để cập nhật hồ sơ.');
        const payload = {
          updated_at: new Date().toISOString(),
        };
        if (patch.full_name !== undefined) {
          payload.full_name = sanitizeText(patch.full_name, 80);
        }
        if (patch.default_bank_id !== undefined) {
          payload.default_bank_id = ['cake', 'tnex', 'timo', 'liobank'].includes(patch.default_bank_id)
            ? patch.default_bank_id
            : 'cake';
        }
        if (patch.preferred_goal_type !== undefined) {
          payload.preferred_goal_type =
            patch.preferred_goal_type === 'TARGET_AMOUNT' ? 'TARGET_AMOUNT' : 'PASSIVE_INCOME';
        }
        if (patch.default_household_mode !== undefined) {
          payload.default_household_mode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(patch.default_household_mode)
            ? patch.default_household_mode
            : 'INDIVIDUAL';
        }
        const { data, error } = await client
          .from('profiles')
          .update(payload)
          .eq('id', user.id)
          .select('id, full_name, avatar_url, default_bank_id, preferred_goal_type, default_household_mode, updated_at, created_at')
          .single();

        if (error) throw new Error(normalizeAuthError(error));
        setProfile(data);
        return data;
      },

      signOut: async () => {
        const client = clientRef.current;
        if (client) {
          await client.auth.signOut();
        }
        setSession(null);
        setProfile(null);
      },
    };
  }, [authLoading, ensureClient, googleEnabled, loadOrCreateProfile, passwordRecoveryMode, probeGoogleProvider, profile, session]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
