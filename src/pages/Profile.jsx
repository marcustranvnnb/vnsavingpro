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
  const notify = useToast();

  const [fullName, setFullName] = useState('');
  const [defaultBankId, setDefaultBankId] = useState('cake');
  const [preferredGoalType, setPreferredGoalType] = useState('PASSIVE_INCOME');
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
        Đang tải thông tin tài khoản...
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
          <h1 className="text-lg font-semibold text-white">Bạn chưa đăng nhập</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Đăng nhập bằng Google hoặc Email để quản lý hồ sơ cá nhân và lưu nhiều kịch bản tiết kiệm trên Cloud.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button as="a" href={href('auth')} variant="primary">
              Đăng nhập / Đăng ký
            </Button>
            <Button as="a" href={href('plan')} variant="secondary">
              Về trang Kế hoạch
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const provider = user.app_metadata?.provider === 'google' ? 'Google' : 'Email & Mật khẩu';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Người dùng';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: fullName,
        default_bank_id: defaultBankId,
        preferred_goal_type: preferredGoalType,
      });
      notify('Đã cập nhật hồ sơ cá nhân');
    } catch (err) {
      notify(err?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      notify('Mật khẩu mới cần tối thiểu 6 ký tự');
      return;
    }
    setSavingPass(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      notify('Đã đổi mật khẩu thành công');
    } catch (err) {
      notify(err?.message || 'Không thể đổi mật khẩu');
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
      const title = newPlanTitle.trim() || `Kế hoạch ${new Date().toLocaleDateString('vi-VN')}`;
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
      notify('Đã lưu kịch bản vào tài khoản');
      await loadMyPlans();
    } catch (err) {
      notify(err?.message || 'Không thể lưu kế hoạch');
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
    notify(`Đã nạp kịch bản "${planRow.title}"`);
    navigate(href('plan'));
  };

  const handleDeletePlan = async (code) => {
    const token = getAccessToken();
    if (!token || !confirm('Xoá kịch bản này khỏi tài khoản?')) return;
    try {
      await deleteCloudPlanFromApi(code, token);
      setPlans((prev) => prev.filter((p) => p.shareCode !== code));
      notify('Đã xoá kịch bản');
    } catch (err) {
      notify(err?.message || 'Không thể xoá kịch bản');
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCode(code);
      notify(`Đã sao chép mã ${code}`);
      setTimeout(() => setCopiedCode(''), 1500);
    } catch {
      notify(`Mã chia sẻ: ${code}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserIcon}
        eyebrow="Hồ sơ & Tài khoản"
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản, tuỳ chọn ngân hàng mặc định và danh sách các kịch bản tiết kiệm của bạn."
        actions={
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await signOut();
              notify('Đã đăng xuất');
              navigate(href('home'));
            }}
          >
            <LogOut className="size-4" /> Đăng xuất
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
                  <Badge tone="success">Đã xác thực</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader title="Tuỳ chọn cá nhân" description="Đồng bộ tự động trên Supabase Postgres." />
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">Tên hiển thị</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={80}
                  className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white focus:border-indigo-400/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">Ngân hàng số ưu tiên</label>
                <select
                  value={defaultBankId}
                  onChange={(e) => setDefaultBankId(e.target.value)}
                  className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white focus:border-indigo-400/60 focus:outline-none"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-300">Mục tiêu mặc định</label>
                <select
                  value={preferredGoalType}
                  onChange={(e) => setPreferredGoalType(e.target.value)}
                  className="select h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white focus:border-indigo-400/60 focus:outline-none"
                >
                  <option value="PASSIVE_INCOME">Thu nhập thụ động hàng tháng</option>
                  <option value="TARGET_AMOUNT">Số tiền mục tiêu cụ thể</option>
                </select>
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={savingProfile}>
                <Save className="size-4" />
                {savingProfile ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <CardHeader
              title="Bảo mật & Mật khẩu"
              description="Đặt hoặc cập nhật mật khẩu đăng nhập bằng Email."
              right={<Shield className="size-4 text-zinc-500" />}
            />
            <form onSubmit={handleUpdatePassword} className="mt-4 space-y-3">
              <input
                type="password"
                minLength={6}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                autoComplete="new-password"
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
              />
              <Button type="submit" variant="secondary" className="w-full" disabled={savingPass}>
                <KeyRound className="size-4" />
                {savingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: User Saved Plans */}
        <div className="lg:col-span-7">
          <Card className="p-5">
            <CardHeader
              title="Kịch bản tiết kiệm đã lưu"
              description="Lưu nhiều phương án khác nhau (VD: Mua nhà 2028, Nghỉ hưu sớm) để mở lại nhanh."
              right={<Cloud className="size-4 text-emerald-400" />}
            />

            <form onSubmit={handleSaveCurrentPlan} className="mt-4 flex flex-wrap gap-2">
              <input
                type="text"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder="Đặt tên kịch bản hiện tại (VD: Mua nhà 2028)"
                maxLength={120}
                className="h-10 min-w-[200px] flex-1 rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
              />
              <Button type="submit" variant="primary" disabled={savingPlan}>
                <Plus className="size-4" />
                {savingPlan ? 'Đang lưu...' : 'Lưu kế hoạch hiện tại'}
              </Button>
            </form>

            <div className="mt-5 space-y-2.5">
              {plansLoading ? (
                <p className="py-6 text-center text-xs text-zinc-500">Đang tải danh sách kịch bản...</p>
              ) : plans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-400">
                  Bạn chưa lưu kịch bản nào vào tài khoản. Hãy nhập kế hoạch ở trang <strong>Kế hoạch</strong> rồi bấm
                  nút <strong>Lưu kế hoạch hiện tại</strong> ở trên.
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
                        Cập nhật: {new Date(p.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => handleApplyPlan(p)}>
                        <ExternalLink className="size-3.5" /> Mở
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(p.shareCode)}
                        title="Sao chép mã chia sẻ"
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
                        title="Xoá kịch bản"
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
