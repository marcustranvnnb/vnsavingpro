import React, { useEffect, useMemo } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { AuthForm } from '../components/AuthModal.jsx';
import { Card, PageHeader } from '../components/ui.jsx';
import { consumeAuthReturnPath, useAuth } from '../contexts/AuthContext.jsx';
import { href, navigate } from '../state.jsx';

function readOAuthCallbackError(params) {
  let err = params?.error || '';
  let desc = params?.error_description || '';
  if (!err && typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    err = hashParams.get('error') || '';
    desc = hashParams.get('error_description') || desc;
  }
  if (!err && !desc) return '';
  if (err === 'access_denied') return 'Bạn đã huỷ đăng nhập với Google.';
  return desc || 'Đăng nhập Google không thành công. Vui lòng thử lại.';
}

export default function Auth({ params }) {
  const { user, authLoading, passwordRecoveryMode } = useAuth();
  const modeParam = params?.mode === 'reset' ? 'update_password' : params?.mode === 'signup' ? 'signup' : 'signin';
  const hasOAuthCode = Boolean(params?.code);
  const oauthError = useMemo(() => readOAuthCallbackError(params), [params]);

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
        eyebrow="Tài khoản & Đồng bộ"
        title={passwordRecoveryMode || modeParam === 'update_password' ? 'Đặt lại mật khẩu' : 'Đăng nhập VnSavingPro'}
        description="Lưu trữ các kịch bản tài chính cá nhân, đồng bộ lãi suất tự chỉnh và truy cập mọi nơi."
      />
      <Card className="p-6">
        {(hasOAuthCode || authLoading) && !oauthError && !user ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Loader2 className="size-6 animate-spin text-indigo-400" />
            <p className="text-sm font-medium text-white">Đang hoàn tất xác thực Google...</p>
            <p className="text-xs text-zinc-400">Hệ thống đang đồng bộ hồ sơ cá nhân của bạn.</p>
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
