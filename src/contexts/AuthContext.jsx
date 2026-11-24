import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  hasAuthUrlCallback,
  hasStoredSupabaseSession,
  isBrowserAuthConfigured,
  loadSupabaseClient,
  supabaseBrowserKey,
  supabaseBrowserUrl,
} from '../utils/supabaseClient.js';
import { cryptoStorage, sanitizeText } from '../utils/cryptoStorage.js';

const AuthCtx = createContext(null);
const RETURN_PATH_KEY = 'vnsaving_auth_return_to';
const DEMO_SESSION_KEY = 'vnsaving_demo_session_v1';

export const DEMO_ACCOUNT_CREDENTIALS = {
  email: 'demo@vnsavingpro.vn',
  password: 'VnSavingDemo2026!',
  fullName: 'Minh & Lan (Tài khoản Demo)',
};

export const useAuth = () => useContext(AuthCtx);

function buildDemoState(savedProfile = null) {
  const demoUser = {
    id: 'demo_user_vnsavingpro_001',
    email: DEMO_ACCOUNT_CREDENTIALS.email,
    app_metadata: { provider: 'demo' },
    user_metadata: {
      full_name: savedProfile?.full_name || DEMO_ACCOUNT_CREDENTIALS.fullName,
    },
  };
  const demoProfile = {
    id: demoUser.id,
    full_name: savedProfile?.full_name || DEMO_ACCOUNT_CREDENTIALS.fullName,
    avatar_url: '',
    default_bank_id: savedProfile?.default_bank_id || 'cake',
    preferred_goal_type: savedProfile?.preferred_goal_type || 'TARGET_AMOUNT',
    default_household_mode: savedProfile?.default_household_mode || 'COUPLE',
    account_role: 'COMMUNITY_PLANNERS',
    is_verified_expert: false,
    expert_verification_status: 'none',
    is_community_voted_planner: true,
    community_planner_score: 4.9,
    community_total_votes: 28,
    community_total_clones: 14,
    steward_enabled: true,
    updated_at: new Date().toISOString(),
  };
  return { demoUser, demoProfile };
}

function readStoredDemoSession() {
  try {
    const raw = window.sessionStorage?.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.active ? buildDemoState(parsed.profile) : null;
  } catch {
    return null;
  }
}

function writeStoredDemoSession(profile) {
  try {
    window.sessionStorage?.setItem(
      DEMO_SESSION_KEY,
      JSON.stringify({ active: true, profile })
    );
  } catch {
    // ignore storage limits
  }
}

function clearStoredDemoSession() {
  try {
    window.sessionStorage?.removeItem(DEMO_SESSION_KEY);
  } catch {
    // ignore
  }
}

function seedDemoWorkspaceIfEmpty() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const existingTrees = cryptoStorage.getJSON('WEALTH_TREES_STATE', null);
    if (!Array.isArray(existingTrees) || existingTrees.length === 0) {
      cryptoStorage.setJSON('WEALTH_TREES_STATE', [
        {
          id: 'tree_demo_sen_01',
          title: '[Demo] Sen Hồng Quỹ Dự Phòng (100%)',
          speciesId: 'sen_dong_thap',
          householdMode: 'COUPLE',
          targetCapital: 120_000_000,
          initialCapital: 80_000_000,
          monthlyPlanned: 10_000_000,
          expectedYears: 0.5,
          createdAt: today,
          mysteryUnlocked: false,
          mysteryFruitId: 'fruit_lien_hoa_ngoc',
          isDummy: true,
          checkIns: [
            { id: 'chk_demo_1', amount: 20_000_000, date: today, bankId: 'timo', proofCode: 'DEMO-TIMO-01', verified: true, isOverTarget: true },
            { id: 'chk_demo_2', amount: 22_000_000, date: today, bankId: 'cake', proofCode: 'DEMO-CAKE-02', verified: true, isOverTarget: true },
          ],
        },
        {
          id: 'tree_demo_dua_02',
          title: '[Demo] Dừa Xiêm Mua Xe Gia Đình',
          speciesId: 'dua_xiem_ben_tre',
          householdMode: 'COUPLE',
          targetCapital: 450_000_000,
          initialCapital: 170_000_000,
          monthlyPlanned: 12_000_000,
          expectedYears: 2.5,
          createdAt: today,
          mysteryUnlocked: false,
          mysteryFruitId: 'fruit_dua_ngoc_bich',
          isDummy: true,
          checkIns: [
            { id: 'chk_demo_3', amount: 18_000_000, date: today, bankId: 'cake', proofCode: 'DEMO-CAKE-03', verified: true, isOverTarget: true },
          ],
        },
        {
          id: 'tree_demo_vai_03',
          title: '[Demo] Vải Thiều Đối Ứng Mua Nhà',
          speciesId: 'vai_thieu_luc_ngan',
          householdMode: 'COUPLE',
          targetCapital: 700_000_000,
          initialCapital: 450_000_000,
          monthlyPlanned: 15_000_000,
          expectedYears: 4,
          createdAt: today,
          mysteryUnlocked: false,
          mysteryFruitId: 'fruit_vai_rong_do',
          isDummy: true,
          checkIns: [
            { id: 'chk_demo_4', amount: 24_000_000, date: today, bankId: 'tnex', proofCode: 'DEMO-TNEX-04', verified: true, isOverTarget: true },
          ],
        },
        {
          id: 'tree_demo_tre_04',
          title: '[Demo] Tre Ngà Tự Do Tài Chính 12N',
          speciesId: 'tre_nga_thanh_giong',
          householdMode: 'COUPLE',
          targetCapital: 2_500_000_000,
          initialCapital: 600_000_000,
          monthlyPlanned: 20_000_000,
          expectedYears: 12,
          createdAt: today,
          mysteryUnlocked: false,
          mysteryFruitId: 'fruit_mang_vang_phu_dong',
          isDummy: true,
          checkIns: [
            { id: 'chk_demo_5', amount: 25_000_000, date: today, bankId: 'liobank', proofCode: 'DEMO-LIO-05', verified: true, isOverTarget: true },
          ],
        },
      ]);
    }

    const existingPlan = cryptoStorage.getJSON('PLANNER_STATE', null);
    if (!existingPlan) {
      cryptoStorage.setJSON('PLANNER_STATE', {
        goalType: 'TARGET_AMOUNT',
        target: 15_000_000,
        targetAmount: 700_000_000,
        capital: 180_000_000,
        saving: 18_000_000,
        householdMode: 'COUPLE',
        monthlyExpense: 22_000_000,
        emergencyFundCurrent: 120_000_000,
        emergencyFundMonths: 6,
        bankId: 'cake',
        tenure: '12M',
      });
    }

    const existingPassbooks = cryptoStorage.getJSON('ACTIVE_PASSBOOKS_STATE', null);
    if (!Array.isArray(existingPassbooks) || existingPassbooks.length === 0) {
      cryptoStorage.setJSON('ACTIVE_PASSBOOKS_STATE', [
        {
          id: 'pb_demo_cake_1',
          bankId: 'cake',
          label: '[Bot / Demo] Sổ Quỹ Nhà 12T',
          owner: 'JOINT',
          fundTag: 'GOAL',
          principal: 250_000_000,
          ratePct: 7.3,
          tenureMonths: 12,
          openDate: today,
          renewMode: 'PRINCIPAL_AND_INTEREST',
        },
        {
          id: 'pb_demo_timo_2',
          bankId: 'timo',
          label: '[Bot / Demo] Quỹ Dự Phòng 6T',
          owner: 'SELF',
          fundTag: 'EMERGENCY',
          principal: 120_000_000,
          ratePct: 6.0,
          tenureMonths: 6,
          openDate: today,
          renewMode: 'PRINCIPAL_AND_INTEREST',
        },
      ]);
    }
  } catch {
    // Non-fatal demo seeding error
  }
}

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

  const initialDemo = useMemo(() => readStoredDemoSession(), []);

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(initialDemo?.demoProfile || null);
  const [demoUserState, setDemoUserState] = useState(initialDemo?.demoUser || null);
  const [authLoading, setAuthLoading] = useState(needsImmediateSessionHydration && !initialDemo);
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

    const baseCols = 'id, full_name, avatar_url, default_bank_id, preferred_goal_type, default_household_mode, updated_at, created_at';
    const v2Cols = `${baseCols}, account_role, is_verified_expert, expert_verification_status, expert_credentials, is_community_voted_planner, community_planner_score, community_total_votes, community_total_clones, steward_enabled`;

    let { data, error } = await client
      .from('profiles')
      .select(v2Cols)
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      const fallbackRes = await client
        .from('profiles')
        .select(baseCols)
        .eq('id', user.id)
        .maybeSingle();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

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
      .select(baseCols)
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
          clearStoredDemoSession();
          setDemoUserState(null);
          loadOrCreateProfile(client, nextSession.user);
        } else if (!readStoredDemoSession()) {
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
            clearStoredDemoSession();
            setDemoUserState(null);
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

  const activateDemoSession = useCallback(() => {
    seedDemoWorkspaceIfEmpty();
    const { demoUser, demoProfile } = buildDemoState();
    writeStoredDemoSession(demoProfile);
    setDemoUserState(demoUser);
    setProfile(demoProfile);
    setSession(null);
    return { user: demoUser, profile: demoProfile };
  }, []);

  const value = useMemo(() => {
    const isDemoSession = Boolean(demoUserState) && !session?.user;
    const user = session?.user || demoUserState || null;

    return {
      authConfigured: isBrowserAuthConfigured(),
      googleEnabled,
      probeGoogleProvider,
      authLoading,
      session,
      user,
      profile,
      isDemoSession,
      demoCredentials: DEMO_ACCOUNT_CREDENTIALS,
      signInAsDemo: async () => activateDemoSession(),
      passwordRecoveryMode,
      clearPasswordRecoveryMode: () => setPasswordRecoveryMode(false),
      getAccessToken: () => session?.access_token || null,
      refreshProfile: async () => {
        if (isDemoSession) return profile;
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
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanPass = String(password || '');
        if (
          cleanEmail === DEMO_ACCOUNT_CREDENTIALS.email &&
          cleanPass === DEMO_ACCOUNT_CREDENTIALS.password
        ) {
          return activateDemoSession();
        }
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
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
        if (isDemoSession) {
          throw new Error('Không thể đổi mật khẩu của Tài khoản Demo công khai.');
        }
        const client = await ensureClient();
        if (!client) throw new Error('Supabase Auth chưa được cấu hình.');
        const { error } = await client.auth.updateUser({ password: String(newPassword || '') });
        if (error) throw new Error(normalizeAuthError(error));
        setPasswordRecoveryMode(false);
      },

      updateProfile: async (patch) => {
        if (isDemoSession) {
          const nextProfile = {
            ...(profile || buildDemoState().demoProfile),
            updated_at: new Date().toISOString(),
          };
          if (patch.full_name !== undefined) nextProfile.full_name = sanitizeText(patch.full_name, 80);
          if (patch.default_bank_id !== undefined) {
            nextProfile.default_bank_id = ['cake', 'tnex', 'timo', 'liobank'].includes(patch.default_bank_id)
              ? patch.default_bank_id
              : 'cake';
          }
          if (patch.preferred_goal_type !== undefined) {
            nextProfile.preferred_goal_type =
              patch.preferred_goal_type === 'TARGET_AMOUNT' ? 'TARGET_AMOUNT' : 'PASSIVE_INCOME';
          }
          if (patch.default_household_mode !== undefined) {
            nextProfile.default_household_mode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(patch.default_household_mode)
              ? patch.default_household_mode
              : 'COUPLE';
          }
          writeStoredDemoSession(nextProfile);
          setProfile(nextProfile);
          return nextProfile;
        }
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
        clearStoredDemoSession();
        setDemoUserState(null);
        const client = clientRef.current;
        if (client) {
          await client.auth.signOut();
        }
        setSession(null);
        setProfile(null);
      },
    };
  }, [activateDemoSession, authLoading, demoUserState, ensureClient, googleEnabled, loadOrCreateProfile, passwordRecoveryMode, probeGoogleProvider, profile, session]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
