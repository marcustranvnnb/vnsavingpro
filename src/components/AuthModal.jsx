import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, LogIn, Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useToast } from '../state.jsx';
import { Button, Modal } from './ui.jsx';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path
        fill="#4285F4"
        d="M21.1 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.4-1.1 2.5-2.2 3.2l3.4 2.6c2-1.8 2.5-4.6 2.5-8.1z"
      />
      <path
        fill="#FBBC05"
        d="M6.6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L3.2 7.1C2.8 8.6 2.5 10.2 2.5 12s.3 3.4.7 4.9l3.4-2.6z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.6 0 4.8-.9 6.4-2.3l-3.4-2.6c-.9.6-2 .9-3 .9-2.4 0-4.4-1.6-5.1-3.8l-3.4 2.6c1.6 3.2 4.8 5.2 8.5 5.2z"
      />
    </svg>
  );
}

export function AuthForm({ initialMode = 'signin', externalError = '', onSuccess }) {
  const {
    authConfigured,
    googleEnabled,
    probeGoogleProvider,
    passwordRecoveryMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
  } = useAuth();
  const { tx } = useI18n();
  const notify = useToast();

  useEffect(() => {
    probeGoogleProvider?.();
  }, [probeGoogleProvider]);

  const [mode, setMode] = useState(passwordRecoveryMode ? 'update_password' : initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(() =>
    externalError ? { tone: 'error', text: externalError } : null
  );

  useEffect(() => {
    if (externalError) {
      setFeedback({ tone: 'error', text: externalError });
    }
  }, [externalError]);

  useEffect(() => {
    if (passwordRecoveryMode) {
      setMode('update_password');
    } else if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, passwordRecoveryMode]);

  const handleGoogle = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setFeedback({
        tone: 'error',
        text: err?.message || tx('Không thể kết nối Google OAuth.', 'Unable to connect to Google OAuth.', 'Google OAuth に接続できません。'),
      });
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setBusy(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        notify(tx('Đăng nhập thành công', 'Signed in successfully', 'ログインしました'));
        onSuccess?.();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error(
            tx('Mật khẩu cần tối thiểu 6 ký tự.', 'Password must be at least 6 characters.', 'パスワードは6文字以上で入力してください。')
          );
        }
        const data = await signUpWithEmail(email, password, fullName);
        if (data?.session) {
          notify(tx('Tạo tài khoản & đăng nhập thành công', 'Account created & signed in', 'アカウント作成・ログイン完了'));
          onSuccess?.();
        } else {
          setFeedback({
            tone: 'success',
            text: tx(
              'Đăng ký thành công! Vui lòng kiểm tra hộp thư để xác nhận email trước khi đăng nhập.',
              'Account created! Please check your inbox to confirm your email before signing in.',
              '登録が完了しました！受信箱の確認リンクをクリックしてからログインしてください。'
            ),
          });
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setFeedback({
          tone: 'success',
          text: tx(
            'Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư (cả mục Spam).',
            'Password reset email sent! Please check your inbox (including Spam).',
            'パスワード再設定メールを送信しました。受信箱（迷惑メールフォルダ含む）をご確認ください。'
          ),
        });
      } else if (mode === 'update_password') {
        if (password.length < 6) {
          throw new Error(
            tx('Mật khẩu mới cần tối thiểu 6 ký tự.', 'New password must be at least 6 characters.', '新しいパスワードは6文字以上必要です。')
          );
        }
        if (password !== confirmPassword) {
          throw new Error(
            tx('Mật khẩu xác nhận không khớp.', 'Password confirmation does not match.', '確認用パスワードが一致しません。')
          );
        }
        await updatePassword(password);
        notify(tx('Đã cập nhật mật khẩu mới', 'Password updated', '新しいパスワードを保存しました'));
        onSuccess?.();
      }
    } catch (err) {
      setFeedback({
        tone: 'error',
        text: err?.message || tx('Thao tác thất bại.', 'Action failed.', '操作に失敗しました。'),
      });
    } finally {
      setBusy(false);
    }
  };

  if (!authConfigured) {
    return (
      <div className="rounded-xl bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-200 ring-1 ring-inset ring-amber-400/20">
        {tx(
          'Tính năng đăng nhập chưa có biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY. Vui lòng kiểm tra cấu hình Vercel / .env.local.',
          'Authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Please check Vercel / .env.local config.',
          'ログイン機能には環境変数 VITE_SUPABASE_URL と VITE_SUPABASE_PUBLISHABLE_KEY の設定が必要です。'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mode !== 'update_password' && (
        <>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setFeedback(null);
              }}
              className={`rounded-lg py-2 text-xs font-medium transition ${
                mode === 'signin' ? 'bg-indigo-500 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tx('Đăng nhập', 'Sign In', 'ログイン')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setFeedback(null);
              }}
              className={`rounded-lg py-2 text-xs font-medium transition ${
                mode === 'signup' ? 'bg-indigo-500 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tx('Đăng ký tài khoản', 'Create Account', '新規登録')}
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center bg-white/[0.06] hover:bg-white/[0.1]"
            onClick={handleGoogle}
            disabled={busy}
          >
            <GoogleIcon />
            {mode === 'signup'
              ? tx('Đăng ký nhanh với Google', 'Sign up with Google', 'Googleで登録')
              : tx('Tiếp tục với Google', 'Continue with Google', 'Googleで続行')}
          </Button>
          {googleEnabled === false && (
            <p className="text-center text-[11px] leading-relaxed text-amber-300/90">
              {tx(
                'Google OAuth đang chờ kích hoạt (chưa bật Google provider & Client ID/Secret trên Supabase Dashboard).',
                'Google OAuth is pending activation in Supabase Dashboard.',
                'Google OAuthはSupabase側での有効化待ちです。'
              )}
            </p>
          )}

          <div className="relative flex items-center py-0.5">
            <div className="flex-1 border-t border-white/[0.08]" />
            <span className="px-3 text-[11px] uppercase tracking-wider text-zinc-500">
              {tx('hoặc dùng Email', 'or use Email', 'またはメールで続行')}
            </span>
            <div className="flex-1 border-t border-white/[0.08]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              {tx('Tên hiển thị', 'Display Name', '表示名')}
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tx('VD: Minh Quân', 'e.g. Alex Nguyen', '例：田中 太郎')}
                maxLength={80}
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-3 text-base text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:text-sm"
              />
            </div>
          </div>
        )}

        {mode !== 'update_password' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-3 text-base text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:text-sm"
              />
            </div>
          </div>
        )}

        {mode !== 'forgot' && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                {mode === 'update_password'
                  ? tx('Mật khẩu mới', 'New Password', '新しいパスワード')
                  : tx('Mật khẩu', 'Password', 'パスワード')}
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setFeedback(null);
                  }}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  {tx('Quên mật khẩu?', 'Forgot password?', 'パスワードをお忘れですか？')}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tx('Tối thiểu 6 ký tự', 'Minimum 6 characters', '6文字以上')}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-10 text-base text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={
                  showPass
                    ? tx('Ẩn mật khẩu', 'Hide password', 'パスワードを隠す')
                    : tx('Hiện mật khẩu', 'Show password', 'パスワードを表示')
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}

        {mode === 'update_password' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              {tx('Xác nhận mật khẩu mới', 'Confirm New Password', '新しいパスワード（確認）')}
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={tx('Nhập lại mật khẩu mới', 'Re-enter new password', '新しいパスワードを再入力')}
                autoComplete="new-password"
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-3 text-base text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:text-sm"
              />
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
              feedback.tone === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20'
                : 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/20'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {mode === 'signin' && (
            <>
              <LogIn className="size-4" />
              {busy ? tx('Đang đăng nhập...', 'Signing in...', 'ログイン中...') : tx('Đăng nhập', 'Sign In', 'ログイン')}
            </>
          )}
          {mode === 'signup' && (
            <>
              <UserPlus className="size-4" />
              {busy ? tx('Đang tạo tài khoản...', 'Creating account...', 'アカウント作成中...') : tx('Tạo tài khoản', 'Create Account', 'アカウント作成')}
            </>
          )}
          {mode === 'forgot' && (
            <>
              <Mail className="size-4" />
              {busy
                ? tx('Đang gửi email...', 'Sending email...', '送信中...')
                : tx('Gửi link đặt lại mật khẩu', 'Send Reset Link', '再設定リンクを送信')}
            </>
          )}
          {mode === 'update_password' && (
            <>
              <KeyRound className="size-4" />
              {busy
                ? tx('Đang cập nhật...', 'Updating...', '更新中...')
                : tx('Lưu mật khẩu mới', 'Save New Password', '新しいパスワードを保存')}
            </>
          )}
        </Button>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setFeedback(null);
            }}
            className="w-full text-center text-xs text-zinc-400 hover:text-white"
          >
            {tx('Quay lại Đăng nhập', 'Back to Sign In', 'ログインに戻る')}
          </button>
        )}
      </form>
    </div>
  );
}

export function AuthModal({ open, onClose, initialMode = 'signin' }) {
  const { tx } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={tx('Tài khoản VnSavingPro', 'VnSavingPro Account', 'VnSavingPro アカウント')} className="max-w-md">
      <p className="mb-4 text-xs leading-relaxed text-zinc-400">
        {tx(
          'Đăng nhập để đồng bộ các kịch bản tiết kiệm giữa nhiều thiết bị và quản lý hồ sơ cá nhân. Bạn vẫn có thể sử dụng mọi công cụ hoàn toàn miễn phí mà không cần đăng nhập.',
          'Sign in to sync your savings scenarios across devices and manage your profile. You can still use every calculator free without signing in.',
          '複数端末で貯蓄プランを同期したり、プロフィール設定を保存したりできます。ログイン不要ですべてのツールを無料で利用することも可能です。'
        )}
      </p>
      <AuthForm initialMode={initialMode} onSuccess={onClose} />
    </Modal>
  );
}
