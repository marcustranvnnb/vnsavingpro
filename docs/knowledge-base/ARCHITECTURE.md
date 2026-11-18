# VnSavingPro — Architecture & Technical Reference (v1.4 Tier 1 Serverless)

## 1. High-Level Architecture

```mermaid
flowchart TD
    Entry["src/main.jsx"] --> App["src/App.jsx (AppProvider + Shell)"]
    App --> State["src/state.jsx (Clean History Router + RatesCtx + ToastCtx)"]
    State -->|GET /api/rates| ApiRates["api/rates.js (Edge Cached 1h)"]
    App --> Layout["src/components/Layout.jsx (TopNav, MobileTabBar, Footer)"]
    App --> Modal["src/components/DataModal.jsx (JSON/CSV Backup, Feedback Log)"]
    App --> Pages["React.lazy() Tool Pages + Home.jsx"]
    Pages -->|useServerCalc()| ApiClient["src/utils/apiClient.js (50ms debounce + Map cache)"]
    ApiClient -->|POST /api/calculate| ApiCalc["api/calculate.js (Rate-Limited Serverless Handler)"]
    ApiCalc --> ServerLib["api/_lib/{calculator,feasibilityEvaluator}.js (Secret Server-Only)"]
    Pages -->|FeedbackWidget| ApiFeedback["api/feedback.js + localStorage USER_FEEDBACK_LOG"]
    Pages -->|Google Docs Export| GDocs["src/utils/googleDocsExporter.js (docs.new + .doc)"]
```

## 2. Proprietary Algorithm Protection (`api/_lib/` & `api/calculate.js`)

- **Zero Client Exposure**: `calculator.js` and `feasibilityEvaluator.js` live exclusively inside `api/_lib/` and are **never imported by `src/`**. Production Vite bundles (`dist/assets/*.js`) are built with `sourcemap: false` and contain only UI components and API requests.
- **Endpoints**:
  - `GET /api/rates` ([api/rates.js](../../api/rates.js)): Serves bank rates + `RATES_UPDATED_AT` with `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
  - `POST /api/calculate` ([api/calculate.js](../../api/calculate.js)): Handles `quick_estimate`, `planner_bundle`, `calculator_bundle`, `ladder`, `career`, and `inflation` with per-IP in-memory rate limiting (`120 req/min`).
  - `GET`/`POST /api/feedback` ([api/feedback.js](../../api/feedback.js)): Records post-result user star ratings, tags, comments, and snapshots; mirrored locally under `USER_FEEDBACK_LOG` via `cryptoStorage` and exportable via JSON/CSV in `DataModal.jsx`.
  - `GET /api/cron/sync-rates` ([api/cron/sync-rates.js](../../api/cron/sync-rates.js)): Scheduled via `vercel.json` (`0 2 * * *` UTC = 09:00 AM UTC+7) to live-scrape TNEX and TIMO and refresh `api/_lib/liveRatesCache.js`.
- **Automated Daily 9:00 AM Rate Scrapers (`scripts/` & `.github/workflows/daily-rates-sync.yml`)**:
  - `scripts/scrape-tnex.js` scrapes `https://www.tnex.vn/san-pham/tiet-kiem` (`parseTnexHtml`) and updates `src/data/banksData.js`, `src/data/bankPackagesData.js`, and `src/data/scraped/tnex-latest.json`.
  - `scripts/scrape-timo.js` scrapes `https://timo.vn/tiet-kiem-co-ky-han/` and updates `src/data/banksData.js`, `src/data/bankPackagesData.js`, and `src/data/scraped/timo-latest.json`.
  - `scripts/scrape-liobank.js` scrapes default tariffs from `https://liobank.vn/vn/deposit-tariffs`, dynamically discovers the latest CTKM promo PDF link from LioBank's site (currently `Liobank_The_Le_CTKM_Cong_Lai_suat_Tiet_kiem_11.11.2026.pdf`), parses compressed PDF streams via `node:zlib` (`parseLiobankPromoPdfBuffer`), and updates `banksData.js`, `bankPackagesData.js`, and `src/data/scraped/liobank-latest.json`.
  - `scripts/scrape-cake.js` scrapes both `https://cake.vn/tien-gui/tien-gui-tieu-chuan` (17 standard deposit terms + effective date + `+2.2%` bonus promo) and `https://cake.vn/tien-gui/tien-gui-co-ky-han-tich-luy` (accumulative deposit terms & promos), updating `banksData.js`, `bankPackagesData.js` (`cake-standard`, `cake-accumulate`), and `src/data/scraped/cake-latest.json`.
  - GitHub Actions runs both daily at `09:00 AM` Vietnam time (`0 2 * * *`) and pushes updates to `main`; `scripts/register-daily-9am-task.ps1` sets up an equivalent Windows Scheduled Task locally.
- **Local Dev/Preview Parity (`vite.config.js`)**: `vercelApiPlugin()` intercepts `/api/rates`, `/api/calculate`, `/api/feedback`, and `/api/cron/sync-rates` during `vite dev` and `vite preview` and forwards directly to the Node handlers in `api/`.

## 3. Routing & State Management (`src/state.jsx` & `src/tools.js`)

- **Clean History API Router (`useRoute`, `href`, `navigate`)**:
  - Single source of truth for page naming & URLs lives in `src/tools.js` (`HOME_PAGE` & `TOOLS` with `path`, `aliases`, and `pageTitle`) plus helpers `normalizePath()`, `resolveRouteId()`, `getRoutePath()`, and `getPageTitle()`.
  - Parses `window.location.pathname` and `window.location.search` into `{ route, params }` (e.g., `/`, `/plan?target=10000000&saving=5000000`, or Vietnamese aliases like `/ke-hoach`).
  - Automatically migrates legacy `#/...` URLs via `history.replaceState`, intercepts same-origin `<a>` clicks for zero-reload SPA transitions, syncs `document.title` per route, and scrolls to top on navigation/popstate.
- **Rates Context (`useRates`)**:
  - Fetches `/api/rates` on mount (falling back to `INITIAL_BANKS_DATA` + `RATES_UPDATED_AT`), merges with user-customized overrides stored in `localStorage` under `VNSAVING_SECURE_CUSTOM_RATES` via `cryptoStorage`.
  - Exposes: `banks`, `updatedAt`, `customRates`, `getRate`, `isCustom`, `setRate`, `resetRate`, `replaceAll`, and `best(tenure)`.
- **Cross-Tool Plan Continuity (`src/utils/apiClient.js`)**:
  - `loadSavedPlannerState()` reads `PLANNER_STATE` so `Calculator`, `Ladder`, `Career`, and `Inflation` pre-fill from the user's active financial plan.

## 4. Design System (`src/index.css` & `src/components/ui.jsx`)

- **Theme**: Dark-first financial dashboard (`bg-canvas` `#08090b`, `bg-surface` `#0e0f13`, `bg-elevated` `#16181d`, indigo/emerald accents, `Inter` font with `tabular-nums`).
- **Reusable Primitives (`src/components/ui.jsx`)**:
  - `NumberInput` manages `focused` + `draft` state so typing or clearing digits never jumps the cursor or locks on `0`.
  - `@media print` in `src/index.css` expands scrollable tables and hides navigation/action controls for clean PDF printing.

## 5. Build & Deployment (`vite.config.js` & `vercel.json`)

- **Vite 5** with `@vitejs/plugin-react`, `@tailwindcss/vite`, `build.sourcemap: false`, and manual chunks (`react`, `charts`).
- **`vercel.json`**: Uses `"framework": "vite"`, excludes `/api/(.*)` from SPA rewrites (`"source": "/((?!api/).*)"`), and deploys serverless functions under `api/`.
