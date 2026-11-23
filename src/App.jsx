import React, { Component, Suspense, lazy, useEffect, useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { AppProvider, href, navigate, useRoute } from './state.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { I18nProvider, LANG_STORAGE_KEY } from './i18n/index.jsx';
import { DisplayModeProvider, useDisplayMode } from './layout/DisplayModeContext.jsx';
import { cryptoStorage } from './utils/cryptoStorage.js';
import { TopNav, LayoutModeBanner, MobileTabBar, Footer } from './components/Layout.jsx';
import { PageContainer } from './components/AdaptiveLayout.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { DataModal } from './components/DataModal.jsx';
import { CookieBanner } from './components/CookieBanner.jsx';
import { PocValidationOverlay } from './components/PocValidationOverlay.jsx';
import { PageSkeleton } from './components/ui.jsx';
import {
  fetchQuotaStatusFromApi,
  OPEN_AUTH_EVENT,
  POC_QUOTA_EVENT,
  syncLocalHistoryToCloud,
} from './utils/apiClient.js';
import Home from './pages/Home.jsx';

// Tool pages are code-split so the home page loads fast (Chart.js only loads with the planner).
const pages = {
  plan: lazy(() => import('./pages/Planner.jsx')),
  rates: lazy(() => import('./pages/Rates.jsx')),
  calculator: lazy(() => import('./pages/Calculator.jsx')),
  ladder: lazy(() => import('./pages/Ladder.jsx')),
  career: lazy(() => import('./pages/Career.jsx')),
  inflation: lazy(() => import('./pages/Inflation.jsx')),
  contributors: lazy(() => import('./pages/Contributors.jsx')),
  auth: lazy(() => import('./pages/Auth.jsx')),
  profile: lazy(() => import('./pages/Profile.jsx')),
};

function Shell() {
  const { route, params } = useRoute();
  const { user, passwordRecoveryMode, getAccessToken } = useAuth();
  const { mode, duoPosture, isTabletSplit, isPreviewConstrained } = useDisplayMode();
  const [dataOpen, setDataOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);
  const [pocState, setPocState] = useState({ locked: false, info: null });
  const [previewPoc, setPreviewPoc] = useState(() => params?.preview_poc === '1');
  const Page = pages[route];

  useEffect(() => {
    const onOpenAuth = () => setAuthOpen(true);
    window.addEventListener(OPEN_AUTH_EVENT, onOpenAuth);
    return () => window.removeEventListener(OPEN_AUTH_EVENT, onOpenAuth);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const token = getAccessToken();
    if (token) {
      syncLocalHistoryToCloud(token);
    }
  }, [user?.id, getAccessToken]);

  useEffect(() => {
    if (params?.preview_poc === '1') {
      setPreviewPoc(true);
    }
  }, [params?.preview_poc]);

  useEffect(() => {
    const onPoc = (e) => {
      setPocState({ locked: true, info: e.detail || null });
    };
    window.addEventListener(POC_QUOTA_EVENT, onPoc);
    fetchQuotaStatusFromApi()
      .then((status) => {
        if (status?.pocValidationReached) {
          setPocState({ locked: true, info: status });
        }
      })
      .catch(() => {
        // Ignore offline/network check errors on initial quota probe
      });
    return () => window.removeEventListener(POC_QUOTA_EVENT, onPoc);
  }, []);

  useEffect(() => {
    if (passwordRecoveryMode && route !== 'auth') {
      navigate(`${href('auth')}?mode=reset`, { replace: true });
    }
  }, [passwordRecoveryMode, route]);

  const pageVerticalClass =
    mode === 'duo' && duoPosture === 'tabletop'
      ? 'pt-4 pb-8'
      : mode === 'duo'
        ? 'pt-5 pb-10'
        : mode === 'mobile'
          ? 'pt-5 pb-28'
          : mode === 'tablet'
            ? isTabletSplit
              ? 'pt-7 pb-12'
              : 'pt-7 pb-24'
            : 'pt-10 pb-16';

  const previewFrameClass = isPreviewConstrained
    ? mode === 'mobile'
      ? 'mx-auto w-full max-w-[460px] border-x border-white/[0.07] bg-canvas shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)]'
      : mode === 'tablet'
        ? 'mx-auto w-full max-w-[940px] border-x border-white/[0.07] bg-canvas shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)]'
        : ''
    : '';

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav route={route} onOpenData={() => setDataOpen(true)} onOpenAuth={() => setAuthOpen(true)} />
      <LayoutModeBanner />
      <main className={`flex-1 ${previewFrameClass}`}>
        {Page ? (
          <Suspense fallback={<PageSkeleton />}>
            <PageContainer key={route} className={`animate-rise ${pageVerticalClass}`}>
              <Page params={params} />
            </PageContainer>
          </Suspense>
        ) : (
          <Home onOpenAuth={() => setAuthOpen(true)} onOpenData={() => setDataOpen(true)} />
        )}
      </main>
      <Footer onOpenCookies={() => setCookieOpen(true)} />
      <MobileTabBar route={route} onOpenData={() => setDataOpen(true)} onOpenAuth={() => setAuthOpen(true)} />
      <PocValidationOverlay
        open={pocState.locked || previewPoc}
        info={pocState.info}
        isPreview={previewPoc && !pocState.locked}
        onClosePreview={() => setPreviewPoc(false)}
        onOpenData={() => setDataOpen(true)}
      />
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
      let lang = 'vi';
      try {
        const stored = window.localStorage?.getItem(LANG_STORAGE_KEY);
        if (stored === 'en' || stored === 'ja') lang = stored;
      } catch {
        // Ignore
      }
      const errTitle =
        lang === 'en'
          ? 'Invalid Browser Storage Detected'
          : lang === 'ja'
            ? 'ブラウザ保存データの異常を検知しました'
            : 'Phát hiện dữ liệu trình duyệt không hợp lệ';
      const errDesc =
        lang === 'en'
          ? 'Security protection blocked corrupted or malformed local data. Click below to reset temporary storage and reload safely.'
          : lang === 'ja'
            ? 'セキュリティ保護により破損データをブロックしました。下のボタンを押して初期化し、安全に再読み込みしてください。'
            : 'Hệ thống bảo vệ đã chặn dữ liệu bị hỏng hoặc sai định dạng để bảo vệ thiết bị của bạn. Nhấn nút dưới đây để dọn sạch bộ nhớ tạm và khôi phục ngay lập tức.';
      const errBtn =
        lang === 'en'
          ? 'Reset Default Data & Reload'
          : lang === 'ja'
            ? 'デフォルト設定にリセットして再読み込み'
            : 'Khôi phục dữ liệu mặc định & Tải lại';

      return (
        <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-zinc-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/25">
              <ShieldAlert className="size-6" />
            </div>
            <h1 className="text-lg font-semibold text-white">{errTitle}</h1>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{errDesc}</p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              <RotateCcw className="size-4" /> {errBtn}
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
      <I18nProvider>
        <DisplayModeProvider>
          <AppProvider>
            <AuthProvider>
              <Shell />
            </AuthProvider>
          </AppProvider>
        </DisplayModeProvider>
      </I18nProvider>
    </AppErrorBoundary>
  );
}
