import React, { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthForm } from '../components/AuthModal.jsx';
import { Card, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { href, navigate } from '../state.jsx';

export default function Auth({ params }) {
  const { user, passwordRecoveryMode } = useAuth();
  const modeParam = params?.mode === 'reset' ? 'update_password' : params?.mode === 'signup' ? 'signup' : 'signin';

  useEffect(() => {
    if (user && !passwordRecoveryMode && modeParam !== 'update_password') {
      navigate(href('profile'), { replace: true });
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
        <AuthForm
          initialMode={modeParam}
          onSuccess={() => {
            navigate(href('profile'), { replace: true });
          }}
        />
      </Card>
    </div>
  );
}
