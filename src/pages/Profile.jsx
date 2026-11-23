import React, { useCallback, useEffect, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Clock,
  Cloud,
  Copy,
  ExternalLink,
  History,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  Shield,
  Trash2,
  UserPlus,
  Users,
  User as UserIcon,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, PageHeader, cx } from '../components/ui.jsx';
import { DualPaneSection } from '../components/AdaptiveLayout.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate, useRates, useToast } from '../state.jsx';
import {
  CALC_HISTORY_UPDATED_EVENT,
  acceptCollabInviteFromApi,
  createCollabInviteFromApi,
  deleteCalculationHistoryFromApi,
  deleteCloudPlanFromApi,
  fetchCollaborationsFromApi,
  fetchMyCalculationHistoryFromApi,
  fetchMyCloudPlansFromApi,
  loadLocalCalculationHistory,
  openAuthPrompt,
  previewCollabInviteFromApi,
  removeLocalCalculationHistoryEntry,
  revokeCollabInviteFromApi,
  saveCloudPlanToApi,
  saveToolRestoreState,
  syncCollabPlanFromApi,
  syncLocalHistoryToCloud,
} from '../utils/apiClient.js';
import { cryptoStorage, isPlainObject } from '../utils/cryptoStorage.js';

function getHistoryToolMeta(tool, tx) {
  const map = {
    plan: { label: tx('Kế hoạch', 'Planner', 'プラン'), tone: 'brand' },
    calculator: { label: tx('Tính lãi', 'Calculator', '利息計算'), tone: 'success' },
    ladder: { label: tx('Bậc thang', 'Ladder', 'ラダー'), tone: 'brand' },
    career: { label: tx('Tăng lương', 'Career', 'キャリア'), tone: 'warning' },
    inflation: { label: tx('Lạm phát', 'Inflation', 'インフレ'), tone: 'neutral' },
  };
  return map[tool] || { label: tool, tone: 'neutral' };
}

function getHouseholdBadgeLabel(mode, tx) {
  if (mode === 'COUPLE') return tx('Cặp đôi', 'Couple', 'カップル');
  if (mode === 'FAMILY') return tx('Gia đình', 'Family', '家族');
  return tx('Cá nhân', 'Individual', '個人');
}

export default function Profile({ params }) {
  const {
    user,
    profile,
    authLoading,
    getAccessToken,
    updateProfile,
    updatePassword,
    signOut,
  } = useAuth();
  const { banks, replaceAll } = useRates();
  const { lang, tx } = useI18n();
  const notify = useToast();

  const inviteFromUrl = String(params?.invite || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  const [fullName, setFullName] = useState('');
  const [defaultBankId, setDefaultBankId] = useState('cake');
  const [preferredGoalType, setPreferredGoalType] = useState('PASSIVE_INCOME');
  const [defaultHouseholdMode, setDefaultHouseholdMode] = useState('INDIVIDUAL');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const [collabs, setCollabs] = useState([]);
  const [collabsLoading, setCollabsLoading] = useState(false);
  const [collabMode, setCollabMode] = useState('COUPLE');
  const [collabRole, setCollabRole] = useState('partner');
  const [collabTitle, setCollabTitle] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [creatingCollab, setCreatingCollab] = useState(false);
  const [latestInviteUrl, setLatestInviteUrl] = useState('');
  const [manualInviteCode, setManualInviteCode] = useState('');
  const [joiningCollab, setJoiningCollab] = useState(false);
  const [syncingCollabId, setSyncingCollabId] = useState('');
  const [invitePreview, setInvitePreview] = useState(null);
  const [invitePreviewError, setInvitePreviewError] = useState('');

  const [historyItems, setHistoryItems] = useState(() => loadLocalCalculationHistory());
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDefaultBankId(profile.default_bank_id || 'cake');
      setPreferredGoalType(profile.preferred_goal_type || 'PASSIVE_INCOME');
      setDefaultHouseholdMode(profile.default_household_mode || 'INDIVIDUAL');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    }
  }, [profile, user]);

  const loadMyPlans = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setPlansLoading(true);
    try {
      const res = await fetchMyCloudPlansFromApi(token);
      setPlans(Array.isArray(res.plans) ? res.plans : []);
    } catch {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, [getAccessToken]);

  const loadMyHistory = useCallback(async () => {
    const local = loadLocalCalculationHistory();
    const token = getAccessToken();
    if (!token) {
      setHistoryItems(local);
      return;
    }
    setHistoryLoading(true);
    try {
      await syncLocalHistoryToCloud(token);
      const cloud = await fetchMyCalculationHistoryFromApi(token, { limit: 50 });
      const byRun = new Map();
      for (const item of [...cloud, ...local]) {
        const k = item.clientRunId || item.id;
        if (k && !byRun.has(k)) byRun.set(k, item);
      }
      const merged = Array.from(byRun.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHistoryItems(merged);
    } catch {
      setHistoryItems(local);
    } finally {
      setHistoryLoading(false);
    }
  }, [getAccessToken]);

  const loadCollaborations = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setCollabsLoading(true);
    try {
      const res = await fetchCollaborationsFromApi(token);
      setCollabs(res.items || []);
    } catch {
      // ignore if collaborations table is not yet migrated
    } finally {
      setCollabsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!inviteFromUrl || !/^[A-Z0-9]{6,10}$/.test(inviteFromUrl)) {
      setInvitePreview(null);
      setInvitePreviewError('');
      return;
    }
    let cancelled = false;
    previewCollabInviteFromApi(inviteFromUrl)
      .then((res) => {
        if (!cancelled) {
          setInvitePreview(res.preview || null);
          setInvitePreviewError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInvitePreview(null);
          setInvitePreviewError(err?.message || '');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteFromUrl]);

  useEffect(() => {
    const onUpdated = () => {
      if (!user) {
        setHistoryItems(loadLocalCalculationHistory());
      }
    };
    window.addEventListener(CALC_HISTORY_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(CALC_HISTORY_UPDATED_EVENT, onUpdated);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMyPlans();
      loadMyHistory();
      loadCollaborations();
    }
  }, [user, loadMyPlans, loadMyHistory, loadCollaborations]);

  const getCollabInviteUrl = (code) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vnsavingpro.vercel.app';
    return `${origin}/profile?invite=${code}`;
  };

  const handleCopyText = async (text, label) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedCode(text);
      notify(label || tx('Đã sao chép', 'Copied', 'コピーしました'));
      setTimeout(() => setCopiedCode(''), 1500);
    } catch {
      notify(text);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center text-sm text-zinc-400">
        {tx('Đang tải thông tin tài khoản...', 'Loading account profile...', 'アカウント情報を読み込み中...')}
      </div>
    );
  }

  if (!user) {
    const guestLocale = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'vi-VN';
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-8">
        {inviteFromUrl && (
          <Card className="border-emerald-400/30 bg-gradient-to-br from-emerald-500/[0.09] via-surface to-indigo-500/[0.06] p-5 sm:p-6">
            {invitePreview ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success">{getHouseholdBadgeLabel(invitePreview.householdMode, tx)}</Badge>
                    <Badge tone="brand">{invitePreview.inviteCode}</Badge>
                  </div>
                  <h2 className="text-base font-semibold text-white">
                    {tx(
                      `${invitePreview.ownerDisplayName} mời bạn cùng lập "${invitePreview.title}"`,
                      `${invitePreview.ownerDisplayName} invited you to co-plan "${invitePreview.title}"`,
                      `${invitePreview.ownerDisplayName} さんから共同プラン「${invitePreview.title}」への招待`
                    )}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {tx(
                      'Đăng nhập bằng Google hoặc Email để xác nhận tham gia không gian tài chính chung.',
                      'Sign in with Google or Email to join this shared planning workspace.',
                      'Googleまたはメールでログインして共同プランへ参加してください。'
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => openAuthPrompt('login')}
                >
                  <UserPlus className="size-4" />
                  {tx('Đăng nhập & Tham gia', 'Sign In to Join', 'ログインして参加')}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-amber-300">
                {invitePreviewError ||
                  tx('Không tìm thấy thông tin lời mời hoặc mã mời đã hết hạn.', 'Invite not found or expired.', '招待が見つからないか期限切れです。')}
              </p>
            )}
          </Card>
        )}
        <Card className="border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.08] via-surface to-emerald-500/[0.05] p-6 text-center sm:p-8">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
            <BookmarkPlus className="size-6" />
          </div>
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            {tx(
              'Bạn muốn lưu và xem lại các kế hoạch & kết quả tính toán không?',
              'Want to save and revisit your plans & calculation results?',
              '作成したプランや試算結果を保存して見返しますか？'
            )}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
            {tx(
              'Đăng nhập bằng Google hoặc Email để lưu bản ghi kết quả từ mọi công cụ (Kế hoạch, Tính lãi, Bậc thang, Tăng lương, Lạm phát) vào Hồ sơ cá nhân và mở lại bất kỳ lúc nào.',
              'Sign in with Google or Email to store run results across all tools (Planner, Calculator, Ladder, Career, Inflation) inside your Profile and reopen them anytime.',
              'Googleまたはメールでログインすると、全ツールの試算結果・プラン履歴をプロフィールに永続保存し、いつでもワンタップで復元できます。'
            )}
          </p>
          {historyItems.length > 0 && (
            <div className="mt-3 flex justify-center">
              <Badge tone="brand">
                {tx(
                  `Đang có ${historyItems.length} lần chạy trên trình duyệt này chờ đồng bộ Cloud`,
                  `${historyItems.length} local runs ready to sync to Cloud`,
                  `このブラウザに ${historyItems.length}件の履歴が保存中`
                )}
              </Badge>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Button type="button" variant="primary" onClick={() => openAuthPrompt('login')}>
              <LogIn className="size-4" />
              {tx('Có, vào đây để lưu & xem lại', 'Yes, enter here to save & review', 'はい、保存・確認する')}
            </Button>
            <Button as="a" href={href('auth')} variant="secondary">
              <UserIcon className="size-4" />
              {tx('Mở trang Đăng nhập / Đăng ký', 'Sign In / Sign Up Page', 'ログインページへ')}
            </Button>
            <Button as="a" href={href('plan')} variant="ghost">
              {tx('Về trang Kế hoạch', 'Open Planner', 'プランナーへ')}
            </Button>
          </div>
        </Card>

        {historyItems.length > 0 && (
          <Card className="p-5">
            <CardHeader
              title={tx('Lịch sử tạm trên trình duyệt này', 'Temporary Browser Run History', 'ブラウザ内の一時試算履歴')}
              description={tx(
                'Đăng nhập ở nút phía trên để đồng bộ các bản ghi này lên tài khoản Cloud của bạn.',
                'Sign in above to sync these local runs permanently into your account.',
                '上のボタンからログインすると、これらの履歴がクラウドアカウントに同期されます。'
              )}
              right={<History className="size-4 text-indigo-300" />}
            />
            <div className="mt-4 space-y-2.5">
              {historyItems.slice(0, 5).map((item) => {
                const meta = getHistoryToolMeta(item.tool, tx);
                return (
                  <div
                    key={item.id || item.clientRunId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="truncate text-xs font-medium text-white">{item.title}</span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-zinc-400">
                        {item.summary} · {new Date(item.createdAt).toLocaleString(guestLocale)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    );
  }

  const provider =
    user.app_metadata?.provider === 'google'
      ? 'Google'
      : tx('Email & Mật khẩu', 'Email & Password', 'メール＆パスワード');
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const displayName = profile?.full_name || user.email?.split('@')[0] || tx('Người dùng', 'User', 'ユーザー');
  const initials = displayName.slice(0, 2).toUpperCase();
  const dateLocale = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'vi-VN';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName,
        default_bank_id: defaultBankId,
        preferred_goal_type: preferredGoalType,
        default_household_mode: defaultHouseholdMode,
      });
      notify(tx('Đã cập nhật hồ sơ cá nhân', 'Profile updated', 'プロフィールを更新しました'));
    } catch (err) {
      notify(err?.message || tx('Không thể cập nhật hồ sơ', 'Could not update profile', 'プロフィールを更新できませんでした'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      notify(tx('Mật khẩu mới cần tối thiểu 6 ký tự', 'New password needs at least 6 characters', 'パスワードは6文字以上必要です'));
      return;
    }
    setSavingPass(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      notify(tx('Đã đổi mật khẩu thành công', 'Password changed successfully', 'パスワードを変更しました'));
    } catch (err) {
      notify(err?.message || tx('Không thể đổi mật khẩu', 'Could not change password', 'パスワードを変更できませんでした'));
    } finally {
      setSavingPass(false);
    }
  };

  const handleSaveCurrentPlan = async (e) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSavingPlan(true);
    try {
      const plannerState = cryptoStorage.load('PLANNER_STATE', null);
      const customRates = cryptoStorage.load('CUSTOM_RATES', {});
      const title =
        newPlanTitle.trim() ||
        `${tx('Kế hoạch', 'Plan', 'プラン')} ${new Date().toLocaleDateString(dateLocale)}`;
      await saveCloudPlanToApi({
        title,
        isShared: true,
        accessToken: token,
        payload: {
          plan: isPlainObject(plannerState) ? plannerState : {},
          customRates: isPlainObject(customRates) ? customRates : {},
        },
      });
      setNewPlanTitle('');
      notify(tx('Đã lưu kịch bản vào tài khoản', 'Saved scenario to your account', 'アカウントにプランを保存しました'));
      await loadMyPlans();
    } catch (err) {
      notify(err?.message || tx('Không thể lưu kế hoạch', 'Could not save scenario', 'プランを保存できませんでした'));
    } finally {
      setSavingPlan(false);
    }
  };

  const handleApplyPlan = (planRow) => {
    const payload = planRow?.payload;
    if (isPlainObject(payload?.customRates)) {
      replaceAll(payload.customRates);
    }
    if (isPlainObject(payload?.plan) && Object.keys(payload.plan).length > 0) {
      cryptoStorage.save('PLANNER_STATE', payload.plan);
    }
    notify(tx(`Đã nạp kịch bản "${planRow.title}"`, `Loaded "${planRow.title}"`, `プラン「${planRow.title}」を読み込みました`));
    navigate(href('plan'));
  };

  const handleDeletePlan = async (code) => {
    const token = getAccessToken();
    if (
      !token ||
      !confirm(tx('Xoá kịch bản này khỏi tài khoản?', 'Delete this scenario from your account?', 'このプランをアカウントから削除しますか？'))
    ) {
      return;
    }
    try {
      await deleteCloudPlanFromApi(code, token);
      setPlans((prev) => prev.filter((p) => p.shareCode !== code));
      notify(tx('Đã xoá kịch bản', 'Deleted scenario', 'プランを削除しました'));
    } catch (err) {
      notify(err?.message || tx('Không thể xoá kịch bản', 'Could not delete scenario', 'プランを削除できませんでした'));
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCode(code);
      notify(tx(`Đã sao chép mã ${code}`, `Copied code ${code}`, `コード ${code} をコピーしました`));
      setTimeout(() => setCopiedCode(''), 1500);
    } catch {
      notify(tx(`Mã chia sẻ: ${code}`, `Share code: ${code}`, `共有コード：${code}`));
    }
  };

  const handleRestoreHistory = (item) => {
    if (!item?.tool) return;
    saveToolRestoreState(item.tool, item.inputs || {});
    if (item.tool === 'plan' && isPlainObject(item.inputs) && Object.keys(item.inputs).length > 0) {
      cryptoStorage.save('PLANNER_STATE', item.inputs);
    }
    notify(
      tx(
        `Đã khôi phục "${item.title}"`,
        `Restored "${item.title}"`,
        `履歴「${item.title}」を読み込みました`
      )
    );
    navigate(href(item.tool));
  };

  const handleDeleteHistory = async (item) => {
    const key = item.clientRunId || item.id;
    removeLocalCalculationHistoryEntry(key);
    setHistoryItems((prev) => prev.filter((x) => (x.clientRunId || x.id) !== key && x.id !== item.id));
    const token = getAccessToken();
    if (token) {
      try {
        await deleteCalculationHistoryFromApi(item.id || key, token);
      } catch {
        // Retain clean optimistic UI state if record was local-only
      }
    }
    notify(tx('Đã xoá bản ghi khỏi lịch sử', 'Deleted history record', '履歴を削除しました'));
  };

  const handleCreateCollabInvite = async (e) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setCreatingCollab(true);
    try {
      const plannerState = cryptoStorage.load('PLANNER_STATE', {});
      const title =
        collabTitle.trim() ||
        (collabMode === 'FAMILY'
          ? tx('Kế hoạch Gia đình chung', 'Shared Family Roadmap', '家族共同プラン')
          : tx('Kế hoạch Cặp đôi chung', 'Shared Couple Roadmap', 'カップル共同プラン'));
      const res = await createCollabInviteFromApi({
        householdMode: collabMode,
        role: collabRole,
        title,
        invitedEmail: collabEmail.trim(),
        planPayload: isPlainObject(plannerState) ? { ...plannerState, householdMode: collabMode } : { householdMode: collabMode },
        accessToken: token,
      });
      setCollabTitle('');
      setCollabEmail('');
      const shareUrl = getCollabInviteUrl(res.item.inviteCode);
      setLatestInviteUrl(shareUrl);
      setCollabs((prev) => [res.item, ...prev.filter((c) => c.id !== res.item.id)]);
      notify(
        res.emailSent
          ? tx('Đã tạo lời mời & gửi email tới người đồng hành!', 'Created invite & emailed your partner!', '招待を作成しメール送信しました')
          : tx(`Đã tạo mã mời ${res.item.inviteCode} · Hãy sao chép link gửi ngay!`, `Invite ${res.item.inviteCode} ready · Copy & share!`, `招待コード ${res.item.inviteCode} を作成しました`)
      );
    } catch (err) {
      notify(err?.message || tx('Không thể tạo lời mời chung', 'Could not create invite', '招待を作成できませんでした'));
    } finally {
      setCreatingCollab(false);
    }
  };

  const handleAcceptCollabInvite = async (rawCode) => {
    const token = getAccessToken();
    const cleanCode = String(rawCode || '').trim().toUpperCase();
    if (!token || !cleanCode) return;
    setJoiningCollab(true);
    try {
      const res = await acceptCollabInviteFromApi({ inviteCode: cleanCode, accessToken: token });
      setManualInviteCode('');
      setInvitePreview(null);
      if (isPlainObject(res.item?.planPayload) && Object.keys(res.item.planPayload).length > 0) {
        cryptoStorage.save('PLANNER_STATE', {
          ...res.item.planPayload,
          householdMode: res.item.householdMode,
        });
      }
      await loadCollaborations();
      notify(
        tx(
          `Đã tham gia "${res.item.title}"! Có thể mở ngay trong Lập kế hoạch.`,
          `Joined "${res.item.title}"! Ready to open in Planner.`,
          `「${res.item.title}」に参加しました！`
        )
      );
    } catch (err) {
      notify(err?.message || tx('Không thể tham gia lời mời này', 'Could not accept invite', '招待に参加できませんでした'));
    } finally {
      setJoiningCollab(false);
    }
  };

  const handleOpenCollabPlan = (item) => {
    const prev = cryptoStorage.load('PLANNER_STATE', {});
    const nextPlan = {
      ...(isPlainObject(prev) ? prev : {}),
      ...(isPlainObject(item.planPayload) ? item.planPayload : {}),
      householdMode: item.householdMode || 'COUPLE',
      householdConfigured: true,
    };
    cryptoStorage.save('PLANNER_STATE', nextPlan);
    notify(tx(`Đã nạp "${item.title}" (${getHouseholdBadgeLabel(item.householdMode, tx)})`, `Loaded "${item.title}"`, `「${item.title}」を開きました`));
    navigate(href('plan', { hh: item.householdMode || 'COUPLE' }));
  };

  const handleSyncCollabPlan = async (item) => {
    const token = getAccessToken();
    if (!token || !item?.id) return;
    setSyncingCollabId(item.id);
    try {
      const currentPlan = cryptoStorage.load('PLANNER_STATE', {});
      const res = await syncCollabPlanFromApi({
        collabId: item.id,
        planPayload: {
          ...(isPlainObject(currentPlan) ? currentPlan : {}),
          householdMode: item.householdMode || currentPlan?.householdMode || 'COUPLE',
        },
        accessToken: token,
      });
      setCollabs((prev) => prev.map((c) => (c.id === res.item.id ? res.item : c)));
      notify(tx('Đã đồng bộ thông số kế hoạch mới nhất lên không gian chung!', 'Synced latest plan numbers to shared space!', '最新プランを共有スペースに同期しました'));
    } catch (err) {
      notify(err?.message || tx('Không thể đồng bộ kế hoạch chung', 'Could not sync shared plan', '共有プランを同期できませんでした'));
    } finally {
      setSyncingCollabId('');
    }
  };

  const handleRevokeCollab = async (item) => {
    const token = getAccessToken();
    if (
      !token ||
      !confirm(tx('Thu hồi lời mời / Rời khỏi không gian kế hoạch chung này?', 'Revoke or leave this shared workspace?', 'この共同プランを解除しますか？'))
    ) {
      return;
    }
    try {
      await revokeCollabInviteFromApi(item.id, token);
      setCollabs((prev) => prev.filter((c) => c.id !== item.id));
      notify(tx('Đã gỡ bỏ kế hoạch chung', 'Removed shared workspace', '共同プランを解除しました'));
    } catch (err) {
      notify(err?.message || tx('Không thể cập nhật trạng thái lời mời', 'Could not remove invite', '解除できませんでした'));
    }
  };

  const filteredHistory =
    historyFilter === 'all' ? historyItems : historyItems.filter((item) => item.tool === historyFilter);

  const historyTabs = [
    { id: 'all', label: tx('Tất cả', 'All', 'すべて') },
    { id: 'plan', label: tx('Kế hoạch', 'Planner', 'プラン') },
    { id: 'calculator', label: tx('Tính lãi', 'Calculator', '利息計算') },
    { id: 'ladder', label: tx('Bậc thang', 'Ladder', 'ラダー') },
    { id: 'career', label: tx('Tăng lương', 'Career', 'キャリア') },
    { id: 'inflation', label: tx('Lạm phát', 'Inflation', 'インフレ') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserIcon}
        eyebrow={tx('Hồ sơ & Tài khoản', 'Profile & Account', 'プロフィール・アカウント')}
        title={tx('Hồ sơ cá nhân', 'Personal Profile', 'マイプロフィール')}
        description={tx(
          'Quản lý thông tin tài khoản, tuỳ chọn ngân hàng mặc định và danh sách các kịch bản tiết kiệm của bạn.',
          'Manage account preferences, default digital bank, household mode, and saved Cloud scenarios.',
          'アカウント情報・優先ネット銀行・世帯モデル・保存済みクラウドプランを管理します。'
        )}
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await signOut();
              notify(tx('Đã đăng xuất', 'Signed out', 'ログアウトしました'));
              navigate(href('home'));
            }}
          >
            <LogOut className="size-4" /> {tx('Đăng xuất', 'Sign Out', 'ログアウト')}
          </Button>
        }
      />

      <DualPaneSection
        ratio="wide-right"
        left={
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="size-14 rounded-2xl object-cover ring-1 ring-white/15"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-base font-semibold text-indigo-200 ring-1 ring-indigo-400/30">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-white">{displayName}</h2>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone="brand">{provider}</Badge>
                    <Badge tone="success">{tx('Đã xác thực', 'Verified', '認証済み')}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader
                title={tx('Tuỳ chọn cá nhân', 'Preferences', '個人設定')}
                description={tx('Đồng bộ tự động trên Supabase Postgres.', 'Auto-synced via Supabase Postgres.', 'Supabase Postgres に自動同期されます。')}
              />
              <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    {tx('Tên hiển thị', 'Display Name', '表示名')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={80}
                    className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-base text-white focus:border-indigo-400/60 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    {tx('Ngân hàng số ưu tiên', 'Preferred Digital Bank', '優先ネット銀行')}
                  </label>
                  <select
                    value={defaultBankId}
                    onChange={(e) => setDefaultBankId(e.target.value)}
                    className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-base text-white focus:border-indigo-400/60 focus:outline-none sm:text-sm"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    {tx('Mục tiêu mặc định', 'Default Goal Type', 'デフォルト目標タイプ')}
                  </label>
                  <select
                    value={preferredGoalType}
                    onChange={(e) => setPreferredGoalType(e.target.value)}
                    className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-base text-white focus:border-indigo-400/60 focus:outline-none sm:text-sm"
                  >
                    <option value="PASSIVE_INCOME">
                      {tx('Thu nhập thụ động hàng tháng', 'Monthly Passive Income', '毎月の不労所得')}
                    </option>
                    <option value="TARGET_AMOUNT">
                      {tx('Số tiền mục tiêu cụ thể', 'Target Savings Capital', '目標積立元本')}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    {tx('Chế độ tài chính mặc định', 'Default Household Mode', 'デフォルト世帯モデル')}
                  </label>
                  <select
                    value={defaultHouseholdMode}
                    onChange={(e) => setDefaultHouseholdMode(e.target.value)}
                    className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-base text-white focus:border-indigo-400/60 focus:outline-none sm:text-sm"
                  >
                    <option value="INDIVIDUAL">{tx('Cá nhân', 'Individual', '個人')}</option>
                    <option value="COUPLE">{tx('Cặp đôi (2 người có thu nhập)', 'Couple (2 Earners)', 'カップル（2人収入）')}</option>
                    <option value="FAMILY">{tx('Gia đình (Có người phụ thuộc)', 'Family (With Dependents)', 'ファミリー（扶養家族あり）')}</option>
                  </select>
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={savingProfile}>
                  <Save className="size-4" />
                  {savingProfile
                    ? tx('Đang lưu...', 'Saving...', '保存中...')
                    : tx('Lưu thông tin hồ sơ', 'Save Profile', 'プロフィールを保存')}
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <CardHeader
                title={tx('Bảo mật & Mật khẩu', 'Security & Password', 'セキュリティ・パスワード')}
                description={tx('Đặt hoặc cập nhật mật khẩu đăng nhập bằng Email.', 'Set or change your Email sign-in password.', 'メールログイン用のパスワードを設定・更新します。')}
                right={<Shield className="size-4 text-zinc-500" />}
              />
              <form onSubmit={handleUpdatePassword} className="mt-4 space-y-3">
                <input
                  type="password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tx('Nhập mật khẩu mới (tối thiểu 6 ký tự)', 'Enter new password (min 6 chars)', '新しいパスワード（6文字以上）')}
                  autoComplete="new-password"
                  className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-base text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:text-sm"
                />
                <Button type="submit" variant="secondary" className="w-full" disabled={savingPass}>
                  <KeyRound className="size-4" />
                  {savingPass
                    ? tx('Đang cập nhật...', 'Updating...', '更新中...')
                    : tx('Cập nhật mật khẩu', 'Update Password', 'パスワードを更新')}
                </Button>
              </form>
            </Card>
          </div>
        }
        right={
          <div className="space-y-6">
            <Card className="border-indigo-400/20 p-5">
              <CardHeader
                title={tx('Mời lập kế hoạch cùng nhau (Cặp đôi · Gia đình)', 'Shared Household Planning (Couple · Family)', '共同プランニング（カップル・家族）')}
                description={tx(
                  'Tạo không gian hoạch định chung cho 2 người hoặc gia đình: gửi link mời, đồng bộ thông số kế hoạch từ máy này và cùng mở trực tiếp trong trang Kế hoạch.',
                  'Invite a partner or family member via shareable link or optional email to co-own and sync your household savings plan.',
                  'パートナーや家族をリンク／メールで招待し、最新の積立プランを共有・同期できます。'
                )}
                right={<Users className="size-4 text-indigo-300" />}
              />

              {invitePreview && invitePreview.status !== 'revoked' && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.08] p-3.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="success">{tx('Lời mời đang chờ bạn', 'Pending Invite', '招待が届いています')}</Badge>
                      <Badge tone="brand">{invitePreview.inviteCode}</Badge>
                      <Badge tone="neutral">{getHouseholdBadgeLabel(invitePreview.householdMode, tx)}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium text-white">
                      {tx(
                        `${invitePreview.ownerDisplayName} mời bạn tham gia "${invitePreview.title}"`,
                        `${invitePreview.ownerDisplayName} invited you to "${invitePreview.title}"`,
                        `${invitePreview.ownerDisplayName} さんからの招待：「${invitePreview.title}」`
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={joiningCollab}
                    onClick={() => handleAcceptCollabInvite(invitePreview.inviteCode)}
                  >
                    <UserPlus className="size-3.5" />
                    {joiningCollab
                      ? tx('Đang tham gia...', 'Joining...', '参加処理中...')
                      : tx('Chấp nhận tham gia', 'Accept Invite', '承諾して参加')}
                  </Button>
                </div>
              )}

              <form onSubmit={handleCreateCollabInvite} className="mt-4 space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-zinc-400">
                      {tx('Tên kế hoạch chung', 'Shared Plan Name', '共同プラン名')}
                    </label>
                    <input
                      type="text"
                      value={collabTitle}
                      onChange={(e) => setCollabTitle(e.target.value)}
                      maxLength={120}
                      placeholder={tx('VD: Quỹ mua nhà 2028', 'e.g. Home Fund 2028', '例：2028年住宅資金')}
                      className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-zinc-400">
                      {tx('Email người đồng hành (tuỳ chọn)', 'Partner Email (optional)', '相手のメール（任意）')}
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="pointer-events-none absolute left-3 size-3.5 text-zinc-500" />
                      <input
                        type="email"
                        value={collabEmail}
                        onChange={(e) => setCollabEmail(e.target.value)}
                        maxLength={140}
                        placeholder="partner@email.com"
                        className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 pl-8 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-black/30 p-0.5 ring-1 ring-inset ring-white/10">
                      {['COUPLE', 'FAMILY'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCollabMode(m)}
                          className={cx(
                            'rounded-lg px-2.5 py-1 text-xs font-medium transition',
                            collabMode === m ? 'bg-indigo-500/25 text-white' : 'text-zinc-400 hover:text-white'
                          )}
                        >
                          {getHouseholdBadgeLabel(m, tx)}
                        </button>
                      ))}
                    </div>
                    <select
                      value={collabRole}
                      onChange={(e) => setCollabRole(e.target.value)}
                      className="select h-8 rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-zinc-200 focus:border-indigo-400/60 focus:outline-none"
                    >
                      <option value="partner">{tx('Bạn đời · Cùng chỉnh sửa', 'Partner · Co-editor', 'パートナー（共同編集）')}</option>
                      <option value="family_member">{tx('Thành viên gia đình · Đồng bộ', 'Family · Sync access', '家族メンバー（同期）')}</option>
                      <option value="viewer">{tx('Chỉ xem lộ trình', 'View only', '閲覧のみ')}</option>
                    </select>
                  </div>

                  <Button type="submit" variant="primary" size="sm" disabled={creatingCollab}>
                    <UserPlus className="size-3.5" />
                    {creatingCollab
                      ? tx('Đang tạo lời mời...', 'Creating invite...', '作成中...')
                      : tx('Tạo link mời chung', 'Create Invite Link', '招待リンクを作成')}
                  </Button>
                </div>

                {latestInviteUrl && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] px-3 py-2 text-xs">
                    <span className="truncate font-mono text-emerald-200">{latestInviteUrl}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleCopyText(
                          latestInviteUrl,
                          tx('Đã sao chép link mời!', 'Invite link copied!', '招待リンクをコピーしました')
                        )
                      }
                    >
                      <Copy className="size-3" /> {tx('Sao chép link', 'Copy Link', 'コピー')}
                    </Button>
                  </div>
                )}
              </form>

              <div className="mt-4 space-y-2.5">
                {collabsLoading ? (
                  <p className="py-4 text-center text-xs text-zinc-500">
                    {tx('Đang tải danh sách không gian chung...', 'Loading shared workspaces...', '共同プランを読み込み中...')}
                  </p>
                ) : collabs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-400">
                    {tx(
                      'Chưa có kế hoạch chung nào. Hãy tạo link mời phía trên hoặc nhập mã mời từ người thân ở bên dưới.',
                      'No shared plans yet. Create an invite link above or enter a code below.',
                      'まだ共同プランがありません。上から招待を作成するか、下のコード入力欄から参加できます。'
                    )}
                  </div>
                ) : (
                  collabs.map((c) => {
                    const isOwner = c.ownerUserId === user.id;
                    const inviteUrl = getCollabInviteUrl(c.inviteCode);
                    const partnerName = isOwner
                      ? c.memberDisplayName || c.invitedEmail || tx('Đang chờ người tham gia', 'Waiting for partner', '参加待ち')
                      : c.ownerDisplayName;
                    return (
                      <div
                        key={c.id || c.inviteCode}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-white">{c.title}</span>
                              <Badge tone="brand">{getHouseholdBadgeLabel(c.householdMode, tx)}</Badge>
                              <Badge tone={c.status === 'active' ? 'success' : 'warning'}>
                                {c.status === 'active'
                                  ? tx('Đã kết nối', 'Active', '連携中')
                                  : tx('Chờ tham gia', 'Pending', '承認待ち')}
                              </Badge>
                              <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                                {c.inviteCode}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-400">
                              {isOwner
                                ? tx(`Thành viên: ${partnerName}`, `Partner: ${partnerName}`, `メンバー：${partnerName}`)
                                : tx(`Chủ kế hoạch: ${partnerName}`, `Owner: ${partnerName}`, `オーナー：${partnerName}`)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => handleOpenCollabPlan(c)}>
                              <ExternalLink className="size-3.5" /> {tx('Mở', 'Open', '開く')}
                            </Button>
                            {(isOwner || c.role !== 'viewer') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={syncingCollabId === c.id}
                                onClick={() => handleSyncCollabPlan(c)}
                                title={tx('Đẩy thông số Kế hoạch hiện tại lên không gian chung', 'Sync active plan from this browser', 'この端末のプランを同期')}
                              >
                                <RefreshCw className={cx('size-3.5 text-emerald-300', syncingCollabId === c.id && 'animate-spin')} />
                                {tx('Đồng bộ', 'Sync', '同期')}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleCopyText(
                                  inviteUrl,
                                  tx(`Đã chép link mời ${c.inviteCode}`, `Copied link ${c.inviteCode}`, `招待リンク ${c.inviteCode} をコピー`)
                                )
                              }
                              title={tx('Sao chép link mời', 'Copy invite link', '招待リンクをコピー')}
                            >
                              <Share2 className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleRevokeCollab(c)}
                              title={isOwner ? tx('Thu hồi lời mời', 'Revoke invite', '招待を取り消す') : tx('Rời nhóm', 'Leave workspace', 'グループを退出')}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-3 sm:flex-row">
                <input
                  type="text"
                  value={manualInviteCode}
                  onChange={(e) => setManualInviteCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder={tx('Nhập mã mời từ người thân (VD: A7K9P2Q4)', 'Enter partner invite code', '招待コードを入力')}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 font-mono text-xs uppercase text-white placeholder:font-sans placeholder:normal-case placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={joiningCollab || manualInviteCode.trim().length < 6}
                  onClick={() => handleAcceptCollabInvite(manualInviteCode)}
                >
                  <Check className="size-3.5" /> {tx('Tham gia bằng mã', 'Join with Code', 'コードで参加')}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader
                title={tx('Lịch sử lập kế hoạch & chạy công cụ', 'Plan & Tool Run History', 'プラン・シミュレーション実行履歴')}
                description={tx(
                  'Tự động ghi nhận kết quả mỗi lần bạn bấm tạo kế hoạch hoặc chạy mô hình, bấm Mở lại để nạp nguyên vẹn thông số cũ.',
                  'Records each plan and tool run so you can inspect key outcomes and reload exact inputs anytime.',
                  'プラン作成や各ツール実行の結果を自動記録します。「再読み込み」で当時の設定をそのまま復元できます。'
                )}
                right={
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={loadMyHistory}
                    disabled={historyLoading}
                    title={tx('Làm mới lịch sử', 'Refresh history', '履歴を更新')}
                  >
                    <RefreshCw className={cx('size-3.5', historyLoading && 'animate-spin')} />
                    {tx('Đồng bộ', 'Refresh', '更新')}
                  </Button>
                }
              />

              <div className="mt-4 flex flex-wrap gap-1.5">
                {historyTabs.map((tab) => {
                  const active = historyFilter === tab.id;
                  const count =
                    tab.id === 'all' ? historyItems.length : historyItems.filter((x) => x.tool === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHistoryFilter(tab.id)}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
                        active
                          ? 'bg-indigo-500/20 text-white ring-indigo-400/45'
                          : 'bg-white/[0.03] text-zinc-400 ring-white/[0.08] hover:text-white'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[10px] text-zinc-400 tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-3">
                {historyLoading && filteredHistory.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    {tx('Đang tải lịch sử tính toán...', 'Loading run history...', '実行履歴を読み込み中...')}
                  </p>
                ) : filteredHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
                    {tx(
                      'Chưa có bản ghi chạy mô hình nào trong mục này. Hãy mở công cụ và bấm nút thực hiện để hệ thống ghi lại kết quả.',
                      'No runs recorded here yet. Open any tool and press its Run button to store a snapshot.',
                      'まだ履歴がありません。各ツールで実行ボタンを押すと結果が記録されます。'
                    )}
                  </div>
                ) : (
                  filteredHistory.map((item) => {
                    const meta = getHistoryToolMeta(item.tool, tx);
                    return (
                      <div
                        key={item.id || item.clientRunId}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-white/[0.14]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              {item.householdMode && (
                                <Badge tone="neutral">{getHouseholdBadgeLabel(item.householdMode, tx)}</Badge>
                              )}
                              <span className="truncate text-sm font-medium text-white">{item.title}</span>
                            </div>
                            {item.summary && <p className="mt-1 text-xs text-zinc-300">{item.summary}</p>}
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                              <Clock className="size-3" />
                              {new Date(item.createdAt).toLocaleString(dateLocale)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => handleRestoreHistory(item)}>
                              <RotateCcw className="size-3.5 text-indigo-300" /> {tx('Mở lại', 'Reopen', '再読み込み')}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteHistory(item)}
                              title={tx('Xoá khỏi lịch sử', 'Delete run', '削除')}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {Array.isArray(item.metrics) && item.metrics.length > 0 && (
                          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {item.metrics.slice(0, 3).map((m, idx) => (
                              <div key={idx} className="rounded-lg bg-black/25 px-2.5 py-1.5">
                                <div className="truncate text-[10px] text-zinc-500">{m.label}</div>
                                <div
                                  className={cx(
                                    'mt-0.5 truncate text-xs font-semibold tabular-nums',
                                    m.tone === 'emerald'
                                      ? 'text-emerald-300'
                                      : m.tone === 'indigo'
                                        ? 'text-indigo-300'
                                        : m.tone === 'amber'
                                          ? 'text-amber-300'
                                          : 'text-white'
                                  )}
                                >
                                  {m.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="p-5">
            <CardHeader
              title={tx('Kịch bản tiết kiệm đã lưu', 'Saved Savings Scenarios', '保存済み貯蓄プラン')}
              description={tx(
                'Lưu nhiều phương án khác nhau (VD: Mua nhà 2028, Nghỉ hưu sớm) để mở lại nhanh.',
                'Store multiple plans (e.g., Home 2028, Early Retirement) for quick switching.',
                '目的別に複数のシナリオ（例：住宅購入、早期リタイア）をクラウド保存できます。'
              )}
              right={<Cloud className="size-4 text-emerald-400" />}
            />

            <form onSubmit={handleSaveCurrentPlan} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder={tx('Đặt tên kịch bản hiện tại (VD: Mua nhà 2028)', 'Name current plan (e.g. Home 2028)', 'プラン名を入力（例：2028年マイホーム）')}
                maxLength={120}
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-base text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:flex-1 sm:text-sm"
              />
              <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={savingPlan}>
                <Plus className="size-4" />
                {savingPlan
                  ? tx('Đang lưu...', 'Saving...', '保存中...')
                  : tx('Lưu kế hoạch hiện tại', 'Save Active Plan', '現在のプランを保存')}
              </Button>
            </form>

            <div className="mt-5 space-y-2.5">
              {plansLoading ? (
                <p className="py-6 text-center text-xs text-zinc-500">
                  {tx('Đang tải danh sách kịch bản...', 'Loading saved plans...', '保存済みプランを読み込み中...')}
                </p>
              ) : plans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
                  {tx(
                    'Bạn chưa lưu kịch bản nào vào tài khoản. Hãy nhập kế hoạch ở trang Kế hoạch rồi bấm nút Lưu kế hoạch hiện tại ở trên.',
                    'No scenarios saved yet. Configure a roadmap in the Planner page, then click Save Active Plan above.',
                    'まだ保存済みプランがありません。プランナーで設定後、上の「現在のプランを保存」を押してください。'
                  )}
                </div>
              ) : (
                plans.map((p) => (
                  <div
                    key={p.shareCode}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white">{p.title}</span>
                        <Badge tone="brand">{p.shareCode}</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {tx('Cập nhật:', 'Updated:', '更新日時：')} {new Date(p.updatedAt).toLocaleString(dateLocale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => handleApplyPlan(p)}>
                        <ExternalLink className="size-3.5" /> {tx('Mở', 'Load', '開く')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(p.shareCode)}
                        title={tx('Sao chép mã chia sẻ', 'Copy share code', '共有コードをコピー')}
                      >
                        {copiedCode === p.shareCode ? (
                          <Check className="size-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeletePlan(p.shareCode)}
                        title={tx('Xoá kịch bản', 'Delete scenario', 'プランを削除')}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          </div>
        }
      />
    </div>
  );
}
