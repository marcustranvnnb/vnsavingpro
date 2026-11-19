import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  ExternalLink,
  KeyRound,
  LogOut,
  Plus,
  Save,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate, useRates, useToast } from '../state.jsx';
import {
  deleteCloudPlanFromApi,
  fetchMyCloudPlansFromApi,
  saveCloudPlanToApi,
} from '../utils/apiClient.js';
import { cryptoStorage, isPlainObject } from '../utils/cryptoStorage.js';

export default function Profile() {
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

  useEffect(() => {
    if (user) {
      loadMyPlans();
    }
  }, [user, loadMyPlans]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center text-sm text-zinc-400">
        {tx('Đang tải thông tin tài khoản...', 'Loading account profile...', 'アカウント情報を読み込み中...')}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <Card className="p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <UserIcon className="size-6" />
          </div>
          <h1 className="text-lg font-semibold text-white">
            {tx('Bạn chưa đăng nhập', 'You are not signed in', '未ログイン')}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            {tx(
              'Đăng nhập bằng Google hoặc Email để quản lý hồ sơ cá nhân và lưu nhiều kịch bản tiết kiệm trên Cloud.',
              'Sign in with Google or Email to manage your profile and save multiple savings scenarios on Cloud.',
              'Googleまたはメールでログインして、プロフィールや複数の貯蓄プランをクラウド管理できます。'
            )}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button as="a" href={href('auth')} variant="primary">
              {tx('Đăng nhập / Đăng ký', 'Sign In / Sign Up', 'ログイン / 登録')}
            </Button>
            <Button as="a" href={href('plan')} variant="secondary">
              {tx('Về trang Kế hoạch', 'Open Planner', 'プランナーへ')}
            </Button>
          </div>
        </Card>
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

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Account & Profile Settings */}
        <div className="space-y-6 lg:col-span-5">
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

        {/* Right Column: User Saved Plans */}
        <div className="lg:col-span-7">
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
      </div>
    </div>
  );
}
