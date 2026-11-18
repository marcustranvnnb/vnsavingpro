import React, { Component, Suspense, lazy, useEffect, useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { AppProvider, href, navigate, useRoute } from './state.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { cryptoStorage } from './utils/cryptoStorage.js';
import { TopNav, MobileTabBar, Footer } from './components/Layout.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { DataModal } from './components/DataModal.jsx';
import { CookieBanner } from './components/CookieBanner.jsx';
import { PageSkeleton } from './components/ui.jsx';
import Home from './pages/Home.jsx';

// Tool pages are code-split so the home page loads fast (Chart.js only loads with the planner).
const pages = {
  plan: lazy(() => import('./pages/Planner.jsx')),
  rates: lazy(() => import('./pages/Rates.jsx')),
  calculator: lazy(() => import('./pages/Calculator.jsx')),
  ladder: lazy(() => import('./pages/Ladder.jsx')),
  career: lazy(() => import('./pages/Career.jsx')),
  inflation: lazy(() => import('./pages/Inflation.jsx')),
  auth: lazy(() => import('./pages/Auth.jsx')),
  profile: lazy(() => import('./pages/Profile.jsx')),
};

function Shell() {
  const { route, params } = useRoute();
  const { passwordRecoveryMode } = useAuth();
  const [dataOpen, setDataOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);
  const Page = pages[route];

  useEffect(() => {
    if (passwordRecoveryMode && route !== 'auth') {
      navigate(`${href('auth')}?mode=reset`, { replace: true });
    }
  }, [passwordRecoveryMode, route]);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav route={route} onOpenData={() => setDataOpen(true)} onOpenAuth={() => setAuthOpen(true)} />
      <main className="flex-1">
        {Page ? (
          <Suspense fallback={<PageSkeleton />}>
            <div key={route} className="mx-auto max-w-6xl animate-rise px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
              <Page params={params} />
            </div>
          </Suspense>
        ) : (
          <Home />
        )}
      </main>
      <Footer onOpenCookies={() => setCookieOpen(true)} />
      <MobileTabBar route={route} />
      <DataModal open={dataOpen} onClose={() => setDataOpen(false)} onOpenAuth={() => setAuthOpen(true)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <CookieBanner
        settingsOpen={cookieOpen}
        onOpenSettings={() => setCookieOpen(true)}
        onCloseSettings={() => setCookieOpen(false)}
      />
    </div>
  );
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    cryptoStorage.auditAndClean();
  }

  handleRecover = () => {
    cryptoStorage.clearAll();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-zinc-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/25">
              <ShieldAlert className="size-6" />
            </div>
            <h1 className="text-lg font-semibold text-white">Phát hiện dữ liệu trình duyệt không hợp lệ</h1>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Hệ thống bảo vệ đã chặn dữ liệu bị hỏng hoặc sai định dạng để bảo vệ thiết bị của bạn. Nhấn nút dưới đây để
              dọn sạch bộ nhớ tạm và khôi phục ngay lập tức.
            </p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              <RotateCcw className="size-4" /> Khôi phục dữ liệu mặc định &amp; Tải lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </AppProvider>
    </AppErrorBoundary>
  );
}
