import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, LogIn, Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
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

export function AuthForm({ initialMode = 'signin', onSuccess }) {
  const {
    authConfigured,
    passwordRecoveryMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
  } = useAuth();
  const notify = useToast();

  const [mode, setMode] = useState(passwordRecoveryMode ? 'update_password' : initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
      setFeedback({ tone: 'error', text: err?.message || 'Không thể kết nối Google OAuth.' });
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
        notify('Đăng nhập thành công');
        onSuccess?.();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Mật khẩu cần tối thiểu 6 ký tự.');
        }
        const data = await signUpWithEmail(email, password, fullName);
        if (data?.session) {
          notify('Tạo tài khoản & đăng nhập thành công');
          onSuccess?.();
        } else {
          setFeedback({
            tone: 'success',
            text: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư để xác nhận email trước khi đăng nhập.',
          });
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setFeedback({
          tone: 'success',
          text: 'Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư (cả mục Spam).',
        });
      } else if (mode === 'update_password') {
        if (password.length < 6) {
          throw new Error('Mật khẩu mới cần tối thiểu 6 ký tự.');
        }
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }
        await updatePassword(password);
        notify('Đã cập nhật mật khẩu mới');
        onSuccess?.();
      }
    } catch (err) {
      setFeedback({ tone: 'error', text: err?.message || 'Thao tác thất bại.' });
    } finally {
      setBusy(false);
    }
  };

  if (!authConfigured) {
    return (
      <div className="rounded-xl bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-200 ring-1 ring-inset ring-amber-400/20">
        Tính năng đăng nhập chưa có biến môi trường <code>VITE_SUPABASE_URL</code> và{' '}
        <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. Vui lòng kiểm tra cấu hình Vercel / <code>.env.local</code>.
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
              Đăng nhập
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
              Đăng ký tài khoản
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
            Tiếp tục với Google
          </Button>

          <div className="relative flex items-center py-0.5">
            <div className="flex-1 border-t border-white/[0.08]" />
            <span className="px-3 text-[11px] uppercase tracking-wider text-zinc-500">hoặc dùng Email</span>
            <div className="flex-1 border-t border-white/[0.08]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Tên hiển thị</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Minh Quân"
                maxLength={80}
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
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
                placeholder="ban@example.com"
                autoComplete="email"
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {mode !== 'forgot' && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">
                {mode === 'update_password' ? 'Mật khẩu mới' : 'Mật khẩu'}
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
                  Quên mật khẩu?
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
                placeholder="Tối thiểu 6 ký tự"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-10 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}

        {mode === 'update_password' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
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
              {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </>
          )}
          {mode === 'signup' && (
            <>
              <UserPlus className="size-4" />
              {busy ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </>
          )}
          {mode === 'forgot' && (
            <>
              <Mail className="size-4" />
              {busy ? 'Đang gửi email...' : 'Gửi link đặt lại mật khẩu'}
            </>
          )}
          {mode === 'update_password' && (
            <>
              <KeyRound className="size-4" />
              {busy ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
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
            Quay lại Đăng nhập
          </button>
        )}
      </form>
    </div>
  );
}

export function AuthModal({ open, onClose, initialMode = 'signin' }) {
  return (
    <Modal open={open} onClose={onClose} title="Tài khoản VnSavingPro" className="max-w-md">
      <p className="mb-4 text-xs leading-relaxed text-zinc-400">
        Đăng nhập để đồng bộ các kịch bản tiết kiệm giữa nhiều thiết bị và quản lý hồ sơ cá nhân. Bạn vẫn có thể sử dụng
        mọi công cụ hoàn toàn miễn phí mà không cần đăng nhập.
      </p>
      <AuthForm initialMode={initialMode} onSuccess={onClose} />
    </Modal>
  );
}
