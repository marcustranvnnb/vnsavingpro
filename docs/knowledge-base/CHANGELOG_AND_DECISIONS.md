# VnSavingPro — Changelog & Architecture Decision Records (ADRs)

All notable architectural changes, reviews, and configuration updates are recorded here chronologically.

---

## [2026-11-19] — Free-Tier Audit Verification, 80%/90%/95% Resend Alerts & POC Validation Phase Lock

- **Request**: Verify all packages & infrastructure stay strictly on Free Tier, alert owner email (`tranlinhmarcus2406@gmail.com`) via Resend at 80%, 90%, 95%, and 100% quota thresholds, and show a respectful POC Validation Phase screen when any quota hits its cap.
- **Changes Implemented**:
  - **Infrastructure Audit**: Confirmed Vercel team `phaheviet` is on **Hobby (Free)** (`excessBillingEnabled: false`), Supabase org `marcustranvnnb` is on **Free Tier** (`~11 MB / 500 MB`, `0 / 50,000 MAU`), and all `package.json` packages are open-source MIT/ISC.
  - **Supabase Migration (`add_free_tier_quota_guardian`)**: Added `public.usage_quotas`, `public.quota_alerts_log` (deduplication), and `service_role`-only RPCs `increment_quota_counter()` & `get_free_tier_usage_snapshot()` (`0` security advisor lints).
  - **Quota Guardian & Resend Alerts**: Created [api/_lib/quotaGuard.js](../../api/_lib/quotaGuard.js) & [api/quota-status.js](../../api/quota-status.js), upgraded [api/_lib/resend.js](../../api/_lib/resend.js) (`getOwnerAlertEmail`, auto-normalizing free webmail sender domains to `onboarding@resend.dev`, `sendOwnerQuotaAlertEmail`) & [api/_lib/supabase.js](../../api/_lib/supabase.js) (`sbRpc`), and guarded `api/calculate.js`, `api/rates.js`, `api/plans.js`, `api/feedback.js`, and `api/cron/sync-rates.js`.
  - **User-Facing POC Validation Phase Screen**: Created [src/components/PocValidationOverlay.jsx](../../src/components/PocValidationOverlay.jsx) and wired HTTP `503 POC_QUOTA_REACHED` detection across [src/utils/apiClient.js](../../src/utils/apiClient.js) and [src/App.jsx](../../src/App.jsx) (with `?preview_poc=1` preview support and JSON local backup access).
  - **Vercel Env Sync**: Configured `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `OWNER_ALERT_EMAIL` on Vercel project `vnsavingpro`.

---

## [2026-11-19] — Resend Email Helper & Supabase Custom SMTP Templates

- **Request**: Prepare Resend integration and configuration for Supabase Auth emails.
- **Changes Implemented**:
  - Created server-only [api/_lib/resend.js](../../api/_lib/resend.js) (`isResendConfigured`, `sendResendEmail`) using Resend REST API (`https://api.resend.com/emails`).
  - Created Vietnamese HTML Auth email templates in [supabase/email-templates/confirm-signup.html](../../supabase/email-templates/confirm-signup.html) and [supabase/email-templates/reset-password.html](../../supabase/email-templates/reset-password.html).
  - Updated [.env.example](../../.env.example) and [.env.local](../../.env.local) with `RESEND_API_KEY` and `RESEND_FROM_EMAIL` placeholders.

---

## [2026-11-19] — Supabase Authentication (Google OAuth + Email/Password) & User Profile (`/auth`, `/profile`)

- **Request**: Implement user authentication (Sign in / Sign up with Google and Email/Password, password reset) and user profile management with saved plans.
- **Changes Implemented**:
  - Applied Supabase migration `add_auth_profiles_and_user_plans` (and synced [supabase/schema.sql](../../supabase/schema.sql)): Added `public.profiles`, `public.handle_new_user()` trigger on `auth.users`, `user_id` & `is_shared` columns on `public.saved_plans`, and strict `(select auth.uid())` RLS policies (`0` security advisor lints).
  - Installed pinned `@supabase/supabase-js` in `package.json`, configured `VITE_SUPABASE_URL` & `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, `.env.example`, and Vercel, and updated CSP `connect-src` in [vercel.json](../../vercel.json), [public/_headers](../../public/_headers), and [vite.config.js](../../vite.config.js).
  - Created [src/utils/supabaseClient.js](../../src/utils/supabaseClient.js), [src/contexts/AuthContext.jsx](../../src/contexts/AuthContext.jsx), [src/components/AuthModal.jsx](../../src/components/AuthModal.jsx), [src/pages/Auth.jsx](../../src/pages/Auth.jsx) (`/auth`), and [src/pages/Profile.jsx](../../src/pages/Profile.jsx) (`/profile`).
  - Upgraded [api/_lib/supabase.js](../../api/_lib/supabase.js) (`getUserFromBearerToken`, `sbDelete`) and [api/plans.js](../../api/plans.js) (`GET ?mine=1`, owner-scoped `POST` & `DELETE`), plus wired `AuthProvider` and `UserMenu` into [src/App.jsx](../../src/App.jsx), [src/components/Layout.jsx](../../src/components/Layout.jsx), [src/components/DataModal.jsx](../../src/components/DataModal.jsx), and [src/tools.js](../../src/tools.js).

---

## [2026-11-19] — Updated Website Favicon & Brand Logo Assets

- **Request**: Update the website's favicon and navigation logo with the newly designed VnSavingPro icon.
- **Changes Implemented**:
  - Generated optimized web icons in `public/`: [favicon.png](../../public/favicon.png) (`64x64`), [apple-touch-icon.png](../../public/apple-touch-icon.png) (`180x180`), and [logo.png](../../public/logo.png) (`256x256`).
  - Updated [index.html](../../index.html): Replaced inline SVG data-URI favicon with `/favicon.png`, `/apple-touch-icon.png`, and `og:image` (`/logo.png`).
  - Updated [src/components/Layout.jsx](../../src/components/Layout.jsx): Replaced `<Logo />` placeholder `TrendingUp` badge with `/logo.png` (`32x32`, rounded `[10px]`, ring & glow).

---

## [2026-11-18] — Supabase Free Tier Integration (Postgres Persistence, Cloud Plan Sync & Scraper Push)

- **Request**: Connect and set up VnSavingPro with Supabase Free Tier to elevate persistence beyond ephemeral serverless memory.
- **Changes Implemented**:
  - Added [supabase/schema.sql](../../supabase/schema.sql) (`public.bank_rate_snapshots`, `public.user_feedback`, `public.saved_plans` + Row Level Security policies) and [.env.example](../../.env.example).
  - Created server-only zero-dependency PostgREST helper [api/_lib/supabase.js](../../api/_lib/supabase.js) (`getSupabaseConfig`, `isSupabaseConfigured`, `sbSelect`, `sbInsert`, `sbUpsert`).
  - Upgraded [api/_lib/liveRatesCache.js](../../api/_lib/liveRatesCache.js), [api/rates.js](../../api/rates.js), [api/cron/sync-rates.js](../../api/cron/sync-rates.js), and [scripts/scrape-all.js](../../scripts/scrape-all.js) to read/write bank rate snapshots to Supabase Postgres with automatic fallback to bundled `INITIAL_BANKS_DATA`.
  - Upgraded [api/feedback.js](../../api/feedback.js) to persist feedback entries and summaries to `public.user_feedback` in Supabase.
  - Created [api/plans.js](../../api/plans.js) (`GET`/`POST /api/plans`), updated [vite.config.js](../../vite.config.js) (`loadEnv` + `/api/plans` dev parity), [src/utils/apiClient.js](../../src/utils/apiClient.js) (`fetchLiveRatesFromApi`, `saveCloudPlanToApi`, `fetchCloudPlanFromApi`), [src/state.jsx](../../src/state.jsx) (`ratesSyncMeta`), and [src/components/DataModal.jsx](../../src/components/DataModal.jsx) (Supabase Cloud Sync status badge, save/share 6-character code, and cloud plan restore).
  - **Live Supabase Provisioning (via Supabase MCP)**: Created Free Tier project **`vnsavingpro`** (`gvgyztwpjvjvztwhwnue`, region `ap-southeast-1` Singapore, org `marcustranvnnb`), applied `create_vnsavingpro_tables` DDL + explicit Data API `GRANT` + RLS policies (verified `0` security advisor lints via `get_advisors`), seeded initial 4 digital banks snapshot in `public.bank_rate_snapshots`, configured `.env.local` (git-ignored), and verified live end-to-end persistence for `/api/rates`, `/api/plans`, and `/api/feedback`.

---

## [2026-11-18] — Unified UI (`Calculator`, `Ladder`), Hidden Referral, Animations & Skeletons, Cookie Manager & Rate Disclaimer

- **Request**: Temporarily hide `Ưu đãi mở tài khoản`, apply `Planner` UI style & Option 4 breakdown to `Calculator` and `Ladder`, add animations & skeleton loading states, implement Cookie setting banner/modal, and add an official public-rate disclaimer advising users to check bank apps for exact promo details.
- **Changes Implemented**:
  - Updated [src/tools.js](../../src/tools.js) & [src/App.jsx](../../src/App.jsx): Marked `referral` as `hidden: true` so it is omitted from navigation and routes redirect cleanly to `/`; wired `PageSkeleton` and `CookieBanner`.
  - Updated [src/index.css](../../src/index.css) & [src/components/ui.jsx](../../src/components/ui.jsx): Added `shimmer`, `pulseGlow`, `.skeleton-shimmer`, `.loading-bar`, `.card-interactive`, `Skeleton`, `ResultsSkeleton`, `PageSkeleton`, and `RateDisclaimer`.
  - Created [src/utils/cookieManager.js](../../src/utils/cookieManager.js) & [src/components/CookieBanner.jsx](../../src/components/CookieBanner.jsx), integrated with [src/state.jsx](../../src/state.jsx) & `Footer` in [src/components/Layout.jsx](../../src/components/Layout.jsx) (`vnsaving_cookie_consent`, `vnsaving_prefs`, `vnsaving_analytics`).
  - Updated [api/_lib/calculator.js](../../api/_lib/calculator.js) (`simulateLadderingMatrix` now emits per-month `cohorts` & individual `packages`), [src/pages/Ladder.jsx](../../src/pages/Ladder.jsx) (sticky left controls, Headline hero, 4 KPI Stats, Option 4 `LadderPackageExplorer` + mobile bar + disclaimer), [src/pages/Calculator.jsx](../../src/pages/Calculator.jsx) (sticky left controls, Headline hero, 4 KPI Stats, animations/skeletons + mobile bar + disclaimer), [src/pages/Planner.jsx](../../src/pages/Planner.jsx), [src/pages/Rates.jsx](../../src/pages/Rates.jsx), and [src/pages/Home.jsx](../../src/pages/Home.jsx).

---

## [2026-11-18] — Option 4: Interactive Stage Passbook Shelf & Expandable 2-Level Roadmap Explorer

- **Request**: Upgrade roadmap details to visually show how many savings passbooks/packages a user holds at each stage, how much interest each package generates, and provide Option 4 combining an interactive Passbook Shelf + Expandable Matrix with switching between Cohort Grouping (`Gộp theo lô / đợt`) and Individual Passbooks (`Sổ #1, #2...`).
- **Changes Implemented**:
  - Updated [api/_lib/calculator.js](../../api/_lib/calculator.js) & [api/calculate.js](../../api/calculate.js): Added `tenureCode` tracking, per-row `activePackagesCount`/`rolledOverPackagesCount`, and `buildStagePackageSnapshot()` producing `stageSnapshots` with reconciled `cohorts` (`INITIAL`, `YEAR_k`, `BONUS_k`) and up to 120 `packages` (`Sổ #k`, rollover counts, next maturity, per-package balance & monthly interest).
  - Updated [src/pages/Planner.jsx](../../src/pages/Planner.jsx): Added `RoadmapPackageExplorer` + `StagePackageDetails` supporting `Kệ sổ theo giai đoạn` (timeline pills, 4 KPIs, stacked contribution bar) & `Bảng phân tầng` (6-column accordion table expanding any stage row), plus live switching between `Gộp theo lô / đợt` and `Từng sổ lẻ` with group filters.
  - Updated [DOMAIN_AND_FORMULAS.md](./DOMAIN_AND_FORMULAS.md), [INDEX.md](./INDEX.md).

---

## [2026-11-18] — Detailed Monthly Income Breakdown (`Full-time`, `Freelance Min–Max`, `Investment Min–Max`, `Total Income`) in Basic & Advanced Modes

- **Request**: Surface monthly income in both `Cơ bản` and `Chuyên sâu` planner modes with breakdown into main full-time job, freelance/part-time range (Min–Max), investment income range (Min–Max), and computed total monthly income.
- **Changes Implemented**:
  - Updated [src/pages/Planner.jsx](../../src/pages/Planner.jsx): Added `IncomeRangeField` component and **3. Thu nhập hàng tháng** block visible in both `Cơ bản` and `Chuyên sâu` modes, computing `totalIncomeMin`, `totalIncomeMax`, and `totalIncomeAvg`, displaying total income summary (`Tổng thu nhập hàng tháng`), savings rate %, and remaining spending budget, while removing the duplicate `advanced`-only single salary input.
  - Updated [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js): Extended `PLANNER_STATE` schema validation to persist and sanitize `salaryFullTime`, `freelanceIncomeMin`, `freelanceIncomeMax`, `investIncomeMin`, `investIncomeMax`, and `salary`.
  - Updated [api/_lib/feasibilityEvaluator.js](../../api/_lib/feasibilityEvaluator.js) & [api/calculate.js](../../api/calculate.js): Added income diversification bonus (`hasExtraIncome`) and low-month cashflow buffer warning (`safeSavings > safeIncomeMin`).
  - Updated [src/utils/googleDocsExporter.js](../../src/utils/googleDocsExporter.js) to export full income breakdown tables & text.

---

## [2026-11-18] — Fix HTML, CSS & Webhint Problems (`index.html`, `src/index.css`, `.hintrc`)

- **Request**: Resolve all IDE Problems reported in `index.html` and `src/index.css`.
- **Changes Implemented**:
  - Updated [index.html](../../index.html): Removed `<meta name="theme-color" content="#08090b" />` (`compat-api/html`), added `title="Google Tag Manager"` (`axe/text-alternatives`), and replaced inline `style="display:none;visibility:hidden"` on the GTM `<noscript><iframe>` with `class="gtm-noscript" hidden` (`no-inline-styles`).
  - Updated [src/index.css](../../src/index.css): Added `.gtm-noscript` utility rule and reordered `-webkit-appearance: none;` before `appearance: none;` in `.range` and `.select` (`css-prefix-order`).
  - Added [.hintrc](../../.hintrc) configuring Webhint hints for the Vite + React + Tailwind CSS v4 workspace.

---

## [2026-11-18] — Comprehensive Security Hardening (Storage Integrity, Anti-NaN/Infinity, ErrorBoundary, CSP & Build SRI)

- **Request**: Remediate findings from the security / resilience audit (localStorage JSON poisoning, NaN/Infinity injection, XSS polyglot persistence, missing CSP/security headers, and missing Subresource Integrity hashes).
- **Changes Implemented**:
  - Rewrote [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js): Implemented strict key allowlist (`CUSTOM_RATES`, `CUSTOM_REFERRAL_CODES`, `PLANNER_STATE`, `USER_FEEDBACK_LOG`), signed device-keyed cipher envelopes (`v2.<nonce>.<sig>.<cipherB64>`), circular-reference-safe `safeStringify`, XSS stripping (`sanitizeText`, `sanitizeReferralCode`), strict per-key schema validators, `auditAndCleanStorage()` foreign-key flood purge, `safeExternalUrl()`, and automatic self-healing removal of tampered entries.
  - Updated [src/utils/format.js](../../src/utils/format.js), [api/_lib/calculator.js](../../api/_lib/calculator.js), and [api/_lib/feasibilityEvaluator.js](../../api/_lib/feasibilityEvaluator.js): Replaced `Number(...) || 0` patterns with finite-checked `safeNum` / `num` helpers blocking `NaN`, `Infinity`, `-Infinity`, and extreme numbers.
  - Updated [src/App.jsx](../../src/App.jsx), [src/state.jsx](../../src/state.jsx), [src/pages/Referral.jsx](../../src/pages/Referral.jsx), [src/pages/Rates.jsx](../../src/pages/Rates.jsx), [src/components/FeedbackWidget.jsx](../../src/components/FeedbackWidget.jsx), and [src/components/DataModal.jsx](../../src/components/DataModal.jsx): Added `AppErrorBoundary` recovery UI, state object/range guards, XSS input sanitization, 2 MB backup import cap, and `safeExternalUrl` enforcement on all `target="_blank" rel="noopener noreferrer"` links.
  - Updated [vercel.json](../../vercel.json), created [public/_headers](../../public/_headers), and updated [vite.config.js](../../vite.config.js): Enforced `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, plus `viteSriPlugin()` injecting `sha384-...` SRI hashes into `dist/index.html`.
  - Updated [ARCHITECTURE.md](./ARCHITECTURE.md) and [INDEX.md](./INDEX.md).

---

## [2026-11-18] — Planner Option 3: Dual Goal Modes, Bidirectional Solver & `Cơ bản` | `Chuyên sâu` Versions

- **Request**: Implement Option 3 on `/plan` with 2 distinct goal targets and 2 input versions (`Cơ bản` vs `Chuyên sâu`) to calculate both timeline and monthly saving plan.
- **Changes Implemented**:
  - Updated [api/_lib/calculator.js](../../api/_lib/calculator.js): Extended `calculatePassiveIncomeRoadmap` (while keeping `quick_estimate` backward compatibility) to support `goalType` (`PASSIVE_INCOME` vs `TARGET_AMOUNT`), bidirectional `solveMode` (`TIME` vs `SAVING`), plus Pro levers (`annualStepUpPct`, `annualBonusAmount`, `inflationRatePct`).
  - Updated [api/calculate.js](../../api/calculate.js): Extended `planner_bundle` to generate mode-aware `scenarios`, sorted `bankRuns` (`monthsNeeded` or `requiredMonthlyDeposit`), and inflation-adjusted `evaluatePlanFeasibility` scoring.
  - Updated [src/pages/Planner.jsx](../../src/pages/Planner.jsx): Redesigned the input panel into `Cơ bản (Nhanh)` vs `Chuyên sâu (Thực tế)`, added independent goal switcher (`Lãi thụ động / tháng` vs `Số tiền mục tiêu`), bidirectional solver toggle (`Tính thời gian đạt` vs `Tính tiền gửi / tháng`), Pro controls (annual step-up %, annual bonus, inflation compensation, income & TT14), and updated stats/charts/bank ranking/what-if scenarios/mobile summary bar.
  - Updated [src/utils/googleDocsExporter.js](../../src/utils/googleDocsExporter.js) and [DOMAIN_AND_FORMULAS.md](./DOMAIN_AND_FORMULAS.md).

---

## [2026-11-18] — Add Google Tag Manager (`GTM-MZVGJMWL`) & SPA `page_view` Tracking

- **Request**: Integrate Google Tag Manager snippet (`GTM-MZVGJMWL`) into VnSavingPro.
- **Changes Implemented**:
  - Updated [index.html](../../index.html): Added async `https://www.googletagmanager.com/gtm.js?id=GTM-MZVGJMWL` script, `dataLayer` (`gtm.start` + `gtag`) initialization in `<head>`, and GTM `<noscript>` iframe fallback inside `<body>`.
  - Updated [src/state.jsx](../../src/state.jsx): Pushed `{ event: 'page_view', page_path, page_title, route_id }` to `window.dataLayer` inside `useRoute()` whenever `state.route` changes for Clean-URL SPA navigation tracking.

---

## [2026-11-18] — Fix CSS Diagnostics & Vendor Prefix Compatibility in `src/index.css`

- **Request**: Fix CSS issues reported in `src/index.css`.
- **Changes Implemented**:
  - Updated [src/index.css](../../src/index.css):
    - Moved `@keyframes fade`, `@keyframes pop`, and `@keyframes rise` out of `@theme` into top-level CSS so standard CSS parsers never flag nested `@keyframes` inside `@theme`.
    - Replaced `@apply bg-canvas text-zinc-300 antialiased;` inside `@layer base > body` with standard CSS properties (`background-color: var(--color-canvas)`, `color: #d4d4d8`, `font-family: var(--font-sans)`, font smoothing).
    - Added standard `appearance: none;` alongside `-webkit-appearance: none;` in `.range::-webkit-slider-thumb` and `input[type="number"]::-webkit-*-spin-button` (`css(vendorPrefix)` fix).
    - Added `-webkit-mask-image` before `mask-image` in `.bg-grid` for Safari/WebKit compatibility.
  - Added [.vscode/css-custom-data.json](../../.vscode/css-custom-data.json) and [.vscode/settings.json](../../.vscode/settings.json) so VS Code recognizes Tailwind CSS v4 directives (`@theme`, `@utility`, `@variant`, `@custom-variant`, `@source`, `@plugin`, `@apply`).

---

## [2026-11-18] — Clean History API URLs (`/`, `/plan`, ...) & Per-Page Naming Config

- **Request**: Explain why the home URL previously contained `#` and switch to customizable clean page names/paths without `#`.
- **Changes Implemented**:
  - Added `HOME_PAGE`, per-tool `path`, `aliases` (Vietnamese slugs such as `/ke-hoach`, `/lai-suat`, `/tinh-lai`, `/bac-thang`, `/tang-luong`, `/lam-phat`, `/uu-dai`), `pageTitle`, and helpers (`normalizePath`, `resolveRouteId`, `getRoutePath`, `getPageTitle`) in [src/tools.js](../../src/tools.js).
  - Replaced `Hash Router` (`window.location.hash` / `#/`) in [src/state.jsx](../../src/state.jsx) with a Clean History API Router (`readLocation`, `navigate`, `href`, `useRoute`), complete with automatic `#/...` legacy hash stripping, delegated same-origin link interception, `popstate` support, and automatic `document.title` updates per page.
  - Updated `sharePlan` in [src/pages/Planner.jsx](../../src/pages/Planner.jsx) to build share links via `${window.location.origin}${href('plan', query)}` so pathname segments never duplicate.
  - Updated [AGENTS.md](../../AGENTS.md), [INDEX.md](./INDEX.md), and [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## [2026-11-18] — Version 1.5.2 (UI): Visible Web Tool Version Badge & Release Notes Modal

- **Request**: Display and describe the current web tool version directly on the VnSavingPro website.
- **Changes Implemented**:
  - Updated [package.json](../../package.json) `"version"` to `"1.5.2"`.
  - Added single source of truth constants `APP_VERSION` (`v1.5.2`), `APP_VERSION_DATE` (`18/11/2026`), `APP_VERSION_LABEL`, and `VERSION_HIGHLIGHTS` in [src/tools.js](../../src/tools.js).
  - Created `VersionBadge` + `"Thông tin phiên bản VnSavingPro v1.5.2"` `Modal` in [src/components/Layout.jsx](../../src/components/Layout.jsx), rendered cleanly beside the brand logo in `TopNav` and beside `© 2026 VnSavingPro` in `Footer`. Also updated the footer privacy note to reflect Tier 1 serverless calculation.
  - Updated [src/components/DataModal.jsx](../../src/components/DataModal.jsx) to show `Phiên bản công cụ: v1.5.2 (18/11/2026)` and export dynamic `version` in JSON backups.

---

## [2026-11-18] — Version 1.5.2: Dedicated CakeBank Standard & Accumulate Scraper (Completing All 4 Banks Daily Sync)
- **Added**:
  - Created `scripts/scrape-cake.js` fetching both `https://cake.vn/tien-gui/tien-gui-tieu-chuan` (17 terms, effective `21/10/2026`, bonus `+2.2%`) and `https://cake.vn/tien-gui/tien-gui-co-ky-han-tich-luy` (`6.70%` accumulative tier & promo highlights).
  - Updated `src/data/bankPackagesData.js` (`cake-standard`, `cake-accumulate`), `src/data/banksData.js`, and generated `src/data/scraped/cake-latest.json`.
  - Wired CakeBank into `scripts/scrape-all.js`, `package.json` (`scrape:cake`), `.github/workflows/daily-rates-sync.yml`, and `api/cron/sync-rates.js` so all 4 digital banks sync daily at 09:00 AM (UTC+7).

## [2026-11-18] — Version 1.5.1: Dedicated LioBank Default Tariff & Dynamic CTKM Promo PDF Scraper
- **Added**:
  - Created `scripts/scrape-liobank.js` to scrape LioBank's default tariffs (`https://liobank.vn/vn/deposit-tariffs`, 15 terms effective `11/11/2026`) AND dynamically discover & parse the latest CTKM promo PDF (`Liobank_The_Le_CTKM_Cong_Lai_suat_Tiet_kiem_11.11.2026.pdf`, 10 terms: `6–9M: 8.00%`, `10–12M: 8.20%`, `15–24M: 7.70%`) using built-in `node:zlib`.
  - Updated `scripts/scrape-all.js`, `package.json` (`scrape:liobank`), `.github/workflows/daily-rates-sync.yml`, and `api/cron/sync-rates.js` to sync LioBank daily at 09:00 AM alongside TNEX & TIMO.
  - Updated `src/pages/Rates.jsx` to display live CTKM promo badges and clickable `Thể lệ CTKM (PDF)` links on LioBank rate cards and packages.

## [2026-11-18] — Version 1.5: Dedicated Daily 9:00 AM TNEX & TIMO Rate Scrapers
- **Added**:
  - Created `scripts/_lib/rateUpdater.js`, `scripts/scrape-tnex.js` (`https://www.tnex.vn/san-pham/tiet-kiem`), `scripts/scrape-timo.js` (`https://timo.vn/tiet-kiem-co-ky-han/`), `scripts/scrape-all.js`, and npm scripts (`scrape:tnex`, `scrape:timo`, `scrape:all`).
  - Added 3 daily 09:00 AM (`Asia/Ho_Chi_Minh`) automation runners: `.github/workflows/daily-rates-sync.yml` (`cron: '0 2 * * *'`), Vercel Cron endpoint `api/cron/sync-rates.js` + `api/_lib/liveRatesCache.js` (`vercel.json` `crons`), and `scripts/register-daily-9am-task.ps1` for local Windows Task Scheduler.
  - Saved live-parsed snapshots in `src/data/scraped/{tnex,timo}-latest.json` and updated `src/data/banksData.js` & `src/data/bankPackagesData.js`.

## [2026-11-18] — Version 1.4: Basic/Advanced Inputs, Google Docs Integration, Rating & Feedback Backup, UI/UX Polish
- **Added**:
  - Created `src/utils/googleDocsExporter.js` and Google Docs export modal in `src/pages/Planner.jsx` (`docs.new` rich-HTML copy-paste + `.doc` download).
  - Created `src/components/FeedbackWidget.jsx` and `api/feedback.js` (`GET`/`POST /api/feedback` + `api/_lib/http.js`) for post-result star ratings, feedback tags, and comments across `Planner`, `Calculator`, `Ladder`, `Career`, and `Inflation`.
  - Added `USER_FEEDBACK_LOG` backup/restore and CSV feedback export inside `src/components/DataModal.jsx`.
- **Changed**:
  - Added `Cơ bản` / `Nâng cao` input mode split to `Planner.jsx`, `Calculator.jsx`, and `Ladder.jsx`.
  - Refined UI/UX: scrollable sticky sidebar (`lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto`), moved Feasibility insights below KPI stats in `Planner.jsx`, active secondary tool name in `Layout.jsx` `MoreMenu`, and compact `MoneyField` spacing in `ui.jsx`.

## [2026-11-18] — Version 1.3: Tier 1 Serverless + Secret Server Engine + Digital Bank Rate & UX Upgrade
- **Security & Architecture**:
  - Moved `calculator.js` and `feasibilityEvaluator.js` out of `src/utils/` into server-only `api/_lib/` so proprietary financial and scoring algorithms never ship to the browser bundle (`build.sourcemap: false` in `vite.config.js`).
  - Added `api/calculate.js` (`POST /api/calculate` with per-IP rate limiting) and `api/rates.js` (`GET /api/rates` with Edge cache headers).
  - Created `src/utils/apiClient.js` (`useServerCalc` with 50ms debounce + Map cache, plus `loadSavedPlannerState()`).
  - Added `vercelApiPlugin()` in `vite.config.js` and `/api/(.*)` routing in `vercel.json` for local dev/preview and Vercel parity.
- **Data & UI/UX**:
  - Updated all 4 digital banks (`CakeBank`, `Timo`, `LioBank`, `TNEX`) in `src/data/banksData.js` and `src/data/bankPackagesData.js` to SBV-compliant caps and latest market rates (`RATES_UPDATED_AT = "18/11/2026"`).
  - Fixed `NumberInput` caret jump in `src/components/ui.jsx`, added mobile sticky summary bar in `Planner.jsx`, added cross-tool `PLANNER_STATE` pre-fill, added `"Lập kế hoạch"` CTAs in `Rates.jsx`, and expanded `@media print` tables in `src/index.css`.

## [2026-11-17] — Pushed v1.2 to GitHub (`marcustranvnnb/vnsavingpro`)
- **Deployed**:
  - Initialized Git repository, set remote `origin` to `https://github.com/marcustranvnnb/vnsavingpro.git`, and pushed `main` branch (`23b79a2`).

## [2026-11-17] — Version 1.2 Implemented & Verified
- **Removed**:
  - Deleted 11 orphaned v1 files (`src/components/{Header,PassiveIncomePlanner,BankRateMatrix,BankInfoHub,InterestCalculatorPanel,LadderStrategyPlanner,CareerSalaryPlanner,MacroEconomicMode,ReferralHub}.jsx` and `src/utils/{pdfExporter,translations}.js`).
- **Updated**:
  - Modernized `vercel.json` to use `"framework": "vite"`, bumped `package.json` to `"1.2.0"`, and added `.vercel/` to `.gitignore`.
  - Updated `src/utils/calculator.js`: wired `calculationMode` (`NOMINAL_MONTHS` vs `ACTUAL_DAYS` 30/365) and full monthly logging in `calculatePassiveIncomeRoadmap`; added `fisherRealRate` in `calculateInflationImpact`; added `calculateEarlyWithdrawalComparison`; fixed rollover and custom rate priority in `simulateLadderingMatrix`.
  - Updated `src/pages/Planner.jsx` & `src/components/DataModal.jsx`: persisted `PLANNER_STATE` in `cryptoStorage`, added Shareable Deep-Link button, Print/PDF button (`@media print` in `src/index.css`), and calculation basis toggle.
  - Updated `src/pages/Calculator.jsx`: added interactive Partial vs. Full Early Withdrawal Breakeven simulator.
  - Updated `src/pages/Ladder.jsx`: added 4th `"CUSTOM"` 2-term split strategy with interactive term pills and percentage slider.
  - Updated `src/pages/Rates.jsx`, `src/data/banksData.js`, `src/data/bankPackagesData.js`: reconciled Cake accumulate rates (`6.70%`), added `partialWithdrawal` badges and `rateTierNote` annotations.
  - Updated `src/pages/Career.jsx` (connected `BankPicker` + `useRates`) and `src/pages/Inflation.jsx` (displayed exact Fisher real rate).

## [2026-11-17] — Version 1.2 Audit & Improvement Plan Prepared
- **Audited**:
  - Completed full v2 audit across all 8 pages (`Home`, `Planner`, `Rates`, `Calculator`, `Ladder`, `Career`, `Inflation`, `Referral`) and utilities (`calculator.js`, `feasibilityEvaluator.js`, `cryptoStorage.js`).
  - Formulated the 5-phase **Version 1.2 Improvement Plan** (`v1_2_improvement_plan.md`) covering dead v1 code removal, math/logging fixes, planner state persistence & deep-link sharing, print/PDF support, custom ladder splits, and partial early withdrawal simulation.

## [2026-11-17] — Living Brain & Deployment Planning Initialized
- **Added**:
  - Created `AGENTS.md` at workspace root to enforce automatic consultation and synchronization of the Living Brain on every turn.
  - Created `docs/knowledge-base/` (`INDEX.md`, `ARCHITECTURE.md`, `DOMAIN_AND_FORMULAS.md`, `REVIEW_CHECKLIST.md`, `CHANGELOG_AND_DECISIONS.md`).
  - Created `.agents/skills/project-brain/SKILL.md` and `.agents/skills/project-brain/scripts/snapshot.ps1` to verify live file timestamps and detect drift before any review or feedback session.
- **Audited**:
  - Mapped the entire v2 architecture (`src/pages/*`, `src/state.jsx`, `src/tools.js`, `src/components/ui.jsx`) and documented the 11 orphaned v1 files (`src/components/Header.jsx`, `PassiveIncomePlanner.jsx`, etc.) so future reviews never confuse v1 dead code with v2 active pages.
  - Prepared GitHub & Vercel deployment plan (`implementation_plan.md`).

## [2026-10-16] — v2 Architecture Refactor (Multi-Page Hash Router & Tailwind v4)
- **Changed**:
  - Replaced monolithic v1 tab-based components with code-split pages in `src/pages/` (`Home`, `Planner`, `Rates`, `Calculator`, `Ladder`, `Career`, `Inflation`, `Referral`).
  - Introduced `src/state.jsx` with a zero-config hash router (`#/plan`, `#/rates`, etc.), `RatesCtx` (with `localStorage` custom rate overrides), and `ToastCtx`.
  - Built cohesive dark UI primitives in `src/components/ui.jsx` and responsive navigation in `src/components/Layout.jsx` (`TopNav` + `MobileTabBar`).
  - Added Cloudflare Wrangler static config (`wrangler.jsonc`).

## [2026-09-30] — v1 Initial Prototype
- **Added**:
  - Core financial calculation engine (`src/utils/calculator.js`, `feasibilityEvaluator.js`, `cryptoStorage.js`).
  - Digital bank rate datasets (`src/data/banksData.js`, `src/data/bankPackagesData.js`).
  - Initial single-page components in `src/components/` and legacy `vercel.json`.
