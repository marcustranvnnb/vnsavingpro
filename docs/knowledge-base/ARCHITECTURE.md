# VnSavingPro — Architecture & Technical Reference (v1.7.0.0 Trilingual Serverless + Supabase Free Tier)

## 1. High-Level Architecture

```mermaid
flowchart TD
    Entry["src/main.jsx"] --> App["src/App.jsx (AppProvider + Shell)"]
    App --> State["src/state.jsx (Clean History Router + RatesCtx + ToastCtx)"]
    State -->|GET /api/rates| ApiRates["api/rates.js (Edge Cached + Supabase Snapshot)"]
    App --> Layout["src/components/Layout.jsx (TopNav, MobileTabBar, Footer)"]
    App --> Modal["src/components/DataModal.jsx (Supabase Cloud Sync, JSON/CSV Backup)"]
    App --> Cookie["src/components/CookieBanner.jsx + cookieManager.js"]
    App --> Pages["React.lazy() Tool Pages + Home.jsx"]
    Pages -->|useServerCalc()| ApiClient["src/utils/apiClient.js (50ms debounce + Map cache + Cloud Plans)"]
    ApiClient -->|POST /api/calculate| ApiCalc["api/calculate.js (Rate-Limited Serverless Handler)"]
    ApiCalc --> ServerLib["api/_lib/{calculator,feasibilityEvaluator}.js (Secret Server-Only)"]
    Pages -->|FeedbackWidget| ApiFeedback["api/feedback.js -> api/_lib/supabase.js"]
    ApiRates --> Supabase["Supabase Free Tier Postgres (bank_rate_snapshots, user_feedback, saved_plans)"]
    ApiFeedback --> Supabase
    Modal -->|POST/GET /api/plans| ApiPlans["api/plans.js"] --> Supabase
    Pages -->|Google Docs Export| GDocs["src/utils/googleDocsExporter.js (docs.new + .doc)"]
```

## 2. Proprietary Algorithm Protection (`api/_lib/` & `api/calculate.js`)

- **Zero Client Exposure**: `calculator.js`, `feasibilityEvaluator.js`, `householdAnalytics.js`, and `supabase.js` (`SUPABASE_SERVICE_ROLE_KEY`) live exclusively inside `api/_lib/` and are **never imported by `src/`**. Production Vite bundles (`dist/assets/*.js`) are built with `sourcemap: false` and contain only UI components and API requests.
- **Supabase Free Tier Persistence (`supabase/schema.sql` + `api/_lib/supabase.js`)**:
  - Zero-dependency server-side PostgREST client (`sbSelect`, `sbInsert`, `sbUpsert`) using native `fetch` with a 3.5s timeout and automatic fallback to in-memory/bundled defaults when `SUPABASE_URL` / keys are not yet configured.
  - Tables: `public.bank_rate_snapshots`, `public.user_feedback`, and `public.saved_plans` (protected with RLS policies).
- **Endpoints**:
  - `GET /api/rates` ([api/rates.js](../../api/rates.js)): Serves bank rates + `RATES_UPDATED_AT` + `supabaseConnected` status from `getLiveRatesSnapshotAsync()` (60s warm cache over Supabase `bank_rate_snapshots`, fallback to `INITIAL_BANKS_DATA`).
  - `POST /api/calculate` ([api/calculate.js](../../api/calculate.js)): Handles `quick_estimate`, `planner_bundle`, `calculator_bundle`, `ladder`, `career`, and `inflation` with per-IP in-memory rate limiting (`120 req/min`).
  - `GET`/`POST /api/feedback` ([api/feedback.js](../../api/feedback.js)): Persists star ratings, tags, comments, and snapshots into Supabase `user_feedback` (with memory fallback), plus local `USER_FEEDBACK_LOG` mirror via `cryptoStorage`.
  - `GET`/`POST`/`DELETE /api/plans` ([api/plans.js](../../api/plans.js)): Saves and loads sanitized financial plans (`plan`, `customRates`, `calc`, `ladder`, `career`, `inflation`, `banks`) using 6–12 character share codes (`saved_plans` table in Supabase + user ownership via JWT).
  - `GET /api/quota-status` ([api/quota-status.js](../../api/quota-status.js)) & [quotaGuard.js](../../api/_lib/quotaGuard.js) + [resend.js](../../api/_lib/resend.js): Monitors Free-Tier caps (Vercel API invocations, Supabase DB MB & MAU, Resend daily/monthly emails), sends deduplicated alerts at **80%, 90%, 95%, and 100%** via Resend (`quota_alerts_log`), and locks API endpoints with HTTP `503 POC_QUOTA_REACHED` triggering `PocValidationOverlay.jsx`.
  - `GET /api/cron/sync-rates` ([api/cron/sync-rates.js](../../api/cron/sync-rates.js)): Scheduled via `vercel.json` (`0 2 * * *` UTC = 09:00 AM UTC+7) to live-scrape TNEX, TIMO, LioBank, and Cake, force-refresh Free-Tier quota status, and persist snapshots via `setLiveRatesSnapshotAsync()`.
- **Automated Daily 9:00 AM Rate Scrapers (`scripts/` & `.github/workflows/daily-rates-sync.yml`)**:
  - `scripts/scrape-tnex.js` scrapes `https://www.tnex.vn/san-pham/tiet-kiem` (`parseTnexHtml`) and updates `src/data/banksData.js`, `src/data/bankPackagesData.js`, and `src/data/scraped/tnex-latest.json`.
  - `scripts/scrape-timo.js` scrapes `https://timo.vn/tiet-kiem-co-ky-han/` and updates `src/data/banksData.js`, `src/data/bankPackagesData.js`, and `src/data/scraped/timo-latest.json`.
  - `scripts/scrape-liobank.js` scrapes default tariffs from `https://liobank.vn/vn/deposit-tariffs`, dynamically discovers the latest CTKM promo PDF link from LioBank's site (currently `Liobank_The_Le_CTKM_Cong_Lai_suat_Tiet_kiem_11.11.2026.pdf`), parses compressed PDF streams via `node:zlib` (`parseLiobankPromoPdfBuffer`), and updates `banksData.js`, `bankPackagesData.js`, and `src/data/scraped/liobank-latest.json`.
  - `scripts/scrape-cake.js` scrapes both `https://cake.vn/tien-gui/tien-gui-tieu-chuan` (17 standard deposit terms + effective date + `+2.2%` bonus promo) and `https://cake.vn/tien-gui/tien-gui-co-ky-han-tich-luy` (accumulative deposit terms & promos), updating `banksData.js`, `bankPackagesData.js` (`cake-standard`, `cake-accumulate`), and `src/data/scraped/cake-latest.json`.
  - `scripts/scrape-all.js` runs all 4 bank scrapers and pushes the combined snapshot into Supabase Postgres (`setLiveRatesSnapshotAsync`) when Supabase env vars are configured.
  - GitHub Actions runs daily at `09:00 AM` Vietnam time (`0 2 * * *`) and pushes updates to `main`; `scripts/register-daily-9am-task.ps1` sets up an equivalent Windows Scheduled Task locally.
- **Local Dev/Preview Parity (`vite.config.js`)**: `loadEnv` loads server-only keys into `process.env` and `vercelApiPlugin()` intercepts `/api/rates`, `/api/calculate`, `/api/feedback`, `/api/plans`, `/api/quota-status`, and `/api/cron/sync-rates` during `vite dev` and `vite preview`.

## 3. Routing & State Management (`src/state.jsx` & `src/tools.js`)

- **Routing (`useRoute`, `href`, `navigate`) & 3-Language i18n (`src/i18n/index.jsx`)**:
  - Single source of truth for page naming & URLs lives in `src/tools.js` (`HOME_PAGE` & `TOOLS` with `path`, `aliases`, and `pageTitle`) plus helpers `normalizePath()`, `resolveRouteId()`, `getRoutePath()`, `getLocalizedTools()`, `getLocalizedPageTitle()`, and `getLocalizedVersionHighlights()`.
  - `I18nProvider` (`src/i18n/index.jsx`) manages `lang` (`vi` | `en` | `ja`), persisted across `localStorage` (`vnsaving_lang`), `?lang=` query param, `vnsaving_prefs` cookie, and `<html lang>`, and syncs `setFormatLang()` (`src/utils/format.js`) so numbers/units render natively (`tỷ/triệu`, `B/M/K`, `億/万`) while `useServerCalc()` passes `lang` into `POST /api/calculate` and isolates cache keys per language.
  - Parses `window.location.pathname` and `window.location.search` into `{ route, params }` (e.g., `/`, `/plan?target=10000000&saving=5000000`, or Vietnamese aliases like `/ke-hoach`).
  - Automatically migrates legacy `#/...` URLs via `history.replaceState`, intercepts same-origin `<a>` clicks for zero-reload SPA transitions, syncs localized `document.title` per route, and scrolls to top on navigation/popstate.
- **Rates Context (`useRates`)**:
  - Fetches `/api/rates` on mount (falling back to `INITIAL_BANKS_DATA` + `RATES_UPDATED_AT`), merges with user-customized overrides stored in `localStorage` under `VNSAVING_SECURE_CUSTOM_RATES` via `cryptoStorage`.
  - Exposes: `banks`, `updatedAt`, `customRates`, `getRate`, `isCustom`, `setRate`, `resetRate`, `replaceAll`, and `best(tenure)`.
- **Cross-Tool Plan Continuity (`src/utils/apiClient.js`)**:
  - `loadSavedPlannerState()` reads `PLANNER_STATE` so `Calculator`, `Ladder`, `Career`, and `Inflation` pre-fill from the user's active financial plan.

## 4. Design System, Responsive Layout & App Versioning (`src/index.css`, `src/components/ui.jsx`, `src/version.json`)

- **Theme**: Dark-first financial dashboard (`bg-canvas` `#08090b`, `bg-surface` `#0e0f13`, `bg-elevated` `#16181d`, indigo/emerald accents, `Inter` font with `tabular-nums`).
- **4-Part App Versioning (`src/version.json` + `scripts/bump-version.js` + `AGENTS.md`)**:
  - Uses `MAJOR.MINOR.PATCH.BUILD` starting at `1.6.0.0`, synced into [src/tools.js](../../src/tools.js) (`APP_VERSION`, `APP_VERSION_RAW`, `APP_VERSION_DATE`, `APP_VERSION_LABEL`, `VERSION_HIGHLIGHTS`) and [package.json](../../package.json) (`version` 3-part SemVer + `appVersion` 4-part).
  - Run `npm run version:bump` (or `node scripts/bump-version.js [build|patch|minor|major]`) on every committed update.
- **Responsive Breakpoints (Mobile `<640px`, Tablet `640px–1024px`, PC/Desktop `>=1024px`)**:
  - `overflow-x: clip` on `html, body` prevents horizontal scroll while preserving sticky sidebars on Desktop (`lg:sticky lg:top-20`).
  - Mobile & touch devices: `text-base sm:text-sm` on text inputs (prevents iOS focus zoom), `@media (pointer: coarse)` 22px slider thumbs, `min-h-[44px]`/`min-h-[52px]` tap targets, bottom-sheet modal grab handles, `MobileTabBar` quick account/data/version sheet, and tablet-centered (`md:max-w-xl`) sticky result bars that clear both `MobileTabBar` and `Footer` (`pb-36 md:pb-20 lg:pb-0`).
- **Reusable Primitives (`src/components/ui.jsx`)**:
  - `NumberInput` manages `focused` + `draft` state so typing or clearing digits never jumps the cursor or locks on `0`.
  - `@media print` in `src/index.css` expands scrollable tables and hides navigation/action controls for clean PDF printing.

## 5. Build, Security Hardening & Deployment (`vite.config.js`, `vercel.json`, `public/_headers`)

- **Vite 5** with `@vitejs/plugin-react`, `@tailwindcss/vite`, `build.sourcemap: false`, manual chunks (`react`, `charts`), and `viteSriPlugin()` generating `sha384` Subresource Integrity (`integrity` + `crossorigin`) attributes on all emitted `/assets/*.js` and `/assets/*.css` tags in `dist/index.html`.
- **HTTP Security Headers** (`vercel.json`, `public/_headers`, `vite.config.js`): `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security`.
- **Hardened Client Storage & Self-Healing (`src/utils/cryptoStorage.js` & `src/App.jsx`)**: Strict key allowlist (`CUSTOM_RATES`, `CUSTOM_REFERRAL_CODES`, `PLANNER_STATE`, `USER_FEEDBACK_LOG`), signed cipher envelopes (`v2.<nonce>.<sig>.<cipherB64>`), circular-reference-safe JSON serialization, per-key schema & `Number.isFinite()` validation, XSS tag stripping, foreign-key flooding auto-purge, `safeExternalUrl()` protocol enforcement, and `AppErrorBoundary` recovery UI.
- **`vercel.json`**: Uses `"framework": "vite"`, excludes `/api/(.*)` from SPA rewrites (`"source": "/((?!api/).*)"`), configures daily 09:00 AM VN cron (`0 2 * * *`), and deploys serverless functions under `api/`.
