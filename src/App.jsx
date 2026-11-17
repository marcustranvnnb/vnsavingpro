import React, { Suspense, lazy, useState } from 'react';
import { AppProvider, useRoute } from './state.jsx';
import { TopNav, MobileTabBar, Footer } from './components/Layout.jsx';
import { DataModal } from './components/DataModal.jsx';
import Home from './pages/Home.jsx';

// Tool pages are code-split so the home page loads fast (Chart.js only loads with the planner).
const pages = {
  plan: lazy(() => import('./pages/Planner.jsx')),
  rates: lazy(() => import('./pages/Rates.jsx')),
  calculator: lazy(() => import('./pages/Calculator.jsx')),
  ladder: lazy(() => import('./pages/Ladder.jsx')),
  career: lazy(() => import('./pages/Career.jsx')),
  inflation: lazy(() => import('./pages/Inflation.jsx')),
  referral: lazy(() => import('./pages/Referral.jsx')),
};

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-white/[0.04]" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/[0.03]" />
      <div className="grid gap-4 pt-4 lg:grid-cols-[380px_1fr]">
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

function Shell() {
  const { route, params } = useRoute();
  const [dataOpen, setDataOpen] = useState(false);
  const Page = pages[route];

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav route={route} onOpenData={() => setDataOpen(true)} />
      <main className="flex-1">
        {Page ? (
          <Suspense fallback={<PageFallback />}>
            <div key={route} className="mx-auto max-w-6xl animate-rise px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
              <Page params={params} />
            </div>
          </Suspense>
        ) : (
          <Home />
        )}
      </main>
      <Footer />
      <MobileTabBar route={route} />
      <DataModal open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
