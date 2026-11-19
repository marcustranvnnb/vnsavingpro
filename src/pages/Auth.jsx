import React, { useEffect, useMemo } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { AuthForm } from '../components/AuthModal.jsx';
import { Card, PageHeader } from '../components/ui.jsx';
import { consumeAuthReturnPath, useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate } from '../state.jsx';

function readOAuthCallbackError(params, tx) {
  let err = params?.error || '';
  let desc = params?.error_description || '';
  if (!err && typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    err = hashParams.get('error') || '';
    desc = hashParams.get('error_description') || desc;
  }
  if (!err && !desc) return '';
  if (err === 'access_denied') {
    return tx('Bạn đã huỷ đăng nhập với Google.', 'You cancelled Google Sign-In.', 'Googleログインがキャンセルされました。');
  }
  return desc || tx('Đăng nhập Google không thành công. Vui lòng thử lại.', 'Google Sign-In failed. Please try again.', 'Googleログインに失敗しました。もう一度お試しください。');
}

export default function Auth({ params }) {
  const { user, authLoading, passwordRecoveryMode } = useAuth();
  const { tx } = useI18n();
  const modeParam = params?.mode === 'reset' ? 'update_password' : params?.mode === 'signup' ? 'signup' : 'signin';
  const hasOAuthCode = Boolean(params?.code);
  const oauthError = useMemo(() => readOAuthCallbackError(params, tx), [params, tx]);

  useEffect(() => {
    if (user && !passwordRecoveryMode && modeParam !== 'update_password') {
      const returnPath = consumeAuthReturnPath();
      navigate(returnPath || href('profile'), { replace: true });
    }
  }, [modeParam, passwordRecoveryMode, user]);

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        icon={ShieldCheck}
        eyebrow={tx('Tài khoản & Đồng bộ', 'Account & Cloud Sync', 'アカウント・同期')}
        title={
          passwordRecoveryMode || modeParam === 'update_password'
            ? tx('Đặt lại mật khẩu', 'Reset Password', 'パスワード再設定')
            : tx('Đăng nhập VnSavingPro', 'Sign In to VnSavingPro', 'VnSavingPro ログイン')
        }
        description={tx(
          'Lưu trữ các kịch bản tài chính cá nhân, đồng bộ lãi suất tự chỉnh và truy cập mọi nơi.',
          'Save your personal or household savings roadmaps, custom bank rates, and access anywhere.',
          '個人・世帯の貯蓄プランやカスタム金利をクラウド保存し、どの端末からでもアクセスできます。'
        )}
      />
      <Card className="p-6">
        {(hasOAuthCode || authLoading) && !oauthError && !user ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Loader2 className="size-6 animate-spin text-indigo-400" />
            <p className="text-sm font-medium text-white">
              {tx('Đang hoàn tất xác thực Google...', 'Completing Google sign-in...', 'Google認証を完了しています...')}
            </p>
            <p className="text-xs text-zinc-400">
              {tx('Hệ thống đang đồng bộ hồ sơ cá nhân của bạn.', 'Syncing your user profile.', 'プロフィール情報を同期しています。')}
            </p>
          </div>
        ) : (
          <AuthForm
            initialMode={modeParam}
            externalError={oauthError}
            onSuccess={() => {
              const returnPath = consumeAuthReturnPath();
              navigate(returnPath || href('profile'), { replace: true });
            }}
          />
        )}
      </Card>
    </div>
  );
}
