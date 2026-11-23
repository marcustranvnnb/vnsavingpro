# VnSavingPro — Living Review Checklist & Technical Backlog

Use this document whenever reviewing the codebase, auditing financial calculations, or providing product/UX feedback. Update item statuses as issues are fixed or new findings emerge.

---

## 0. Completed in Version 2.0.0.0 (2026-11-23 — Wealth Platform, 4 Roles, FX Manager & Vietnam 2026 Statutory Payroll/BHXH)

- [x] **4-Role Ecosystem (`/ecosystem`, [api/ecosystem.js](../../api/ecosystem.js))**: Built Individual (with Couple switching & Couple→Family upgrade via `household_spaces`), Verified Financial Expert (degrees/certifications verification + Expert eligibility to also earn Community-Voted Planner status), Community-Voted Planner (`proofVerified + >=10 votes + >=4.2★ + >=3 clones` enabling 1-click template cloning into `/plan`), and Financial Steward (revocable delegation mandates via `steward_mandates`).
- [x] **FX Currency & Exchange Rate Manager (`/fx`, [FxManager.jsx](../../src/pages/FxManager.jsx), [api/fx.js](../../api/fx.js))**: Live Vietcombank XML feed (`15m` Edge cache), Cash/Transfer/Sell converter, multi-currency holdings portfolio (`FX_PORTFOLIO_STATE`), `-5%..+10%` sensitivity stress-test, target rate watchlist & VND bank savings hurdle.
- [x] **Vietnam 2026 Salary, PIT & Social Insurance Calculator (`/salary`, [SalaryInsurance.jsx](../../src/pages/SalaryInsurance.jsx), [salaryVietnam.js](../../api/_lib/salaryVietnam.js))**: Implements NQ 110/2025 (`15.5M/6.2M`), 5-bracket PIT Law 109/2025 (+ comparison vs 2025 7-bracket tax savings), Decree 161/2026 (`2.53M` reference salary), Decrees 293/2025 & 399/2026 regional minimum wages, Employment Law 74/2025 (`5×` UI cap), and BHXH Law 41/2024 (Maternity + Điều 70 Lump-Sum) with 1-click Net-to-Planner transfer.
- [x] **Profile Lifecycle & Multi-Suite History ([Profile.jsx](../../src/pages/Profile.jsx), [Home.jsx](../../src/pages/Home.jsx), [Layout.jsx](../../src/components/Layout.jsx), [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx))**: Added v2.0 role badges, Couple switch / Couple→Family upgrade controls, `fx`/`salary` history filters, and updated Home/Header/Onboarding across `vi`/`en`/`ja`.
- [ ] **Manual Owner SQL Action Pending**:
  - Run [supabase/migrations/20261123_v200_wealth_platform.sql](../../supabase/migrations/20261123_v200_wealth_platform.sql) (after `v1.11` & `v1.12` migrations if not yet applied) in Supabase SQL Editor (`gvgyztwpjvjvztwhwnue`).

---

## 0a. Completed in Version 1.12.0.0 (2026-11-23 — Silent Auto-Layout, Highlighted Header, Branded Splash, Onboarding, Shared Household Planning & CIC/Advisors Roadmap)

- [x] **Hidden Display Mode Selector (`v1.12.0.0`)**: Removed manual `DisplayModeSwitcher`, Footer display pills, `MobileTabBar` display grid, and `Profile` display card; restricted [DisplayModeContext.jsx](../../src/layout/DisplayModeContext.jsx) & `LayoutModeBanner` strictly to QA `?layout=`/`?posture=` query params so responsive/foldable layouts adapt silently.
- [x] **Streamlined Header & Flagship Spotlights ([Layout.jsx](../../src/components/Layout.jsx))**: Consolidated Desktop/Duo/Tablet `TopNav` to highlight **Lập kế hoạch** (gradient pill) and **Lãi suất** (live 12M yield badge) alongside `Khám phá`, `LanguageSwitcher`, and `UserMenu`.
- [x] **Branded Initial Splash & 3-Step Onboarding ([SplashScreen.jsx](../../src/components/SplashScreen.jsx), [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx), [App.jsx](../../src/App.jsx))**: Added smooth initial loading overlay for all visitors plus gentle first-visit 3-step setup wizard persisted in `ONBOARDING_STATE` & `PLANNER_STATE` ([cryptoStorage.js](../../src/utils/cryptoStorage.js) `raw` schema validator).
- [x] **Deduplicated Homepage CTAs ([Home.jsx](../../src/pages/Home.jsx))**: Replaced repetitive Hero/Household/Toolkit "Lập kế hoạch" labels with `"Thiết lập nhanh trong 30 giây"` + distinct per-card action copy and highlighted flagship cards.
- [x] **Collaborative Household Planning (`Cặp đôi` · `Gia đình`)**: Added [20261123_v112_collaborative_planning.sql](../../supabase/migrations/20261123_v112_collaborative_planning.sql), [api/collaborations.js](../../api/collaborations.js) (`GET ?preview=`, auth-gated `GET`/`POST`/`DELETE`, Resend invite email, memory fallback), [vite.config.js](../../vite.config.js) route, [apiClient.js](../../src/utils/apiClient.js) helpers, and [Profile.jsx](../../src/pages/Profile.jsx) invite/accept/sync UI.
- [x] **Strategic Roadmap & Vietnam Advisor Research**: Published [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md) covering the 5-factor CIC estimator (`/cic`) and Vietnam Wealth Advisor research (`FIDT`, `AFA Capital`, `FinPeace`, `TOPI`, `MoneyGain`, `VWA/VWAS`, `Private Banking`) + `/advisors` connector plan.
- [ ] **Manual Owner SQL Action Pending**:
  - Run [supabase/migrations/20261123_v112_collaborative_planning.sql](../../supabase/migrations/20261123_v112_collaborative_planning.sql) (and `v1.11.0.0` migration if not yet applied) in Supabase SQL Editor (`gvgyztwpjvjvztwhwnue`).

---

## 0b. Completed in Version 1.11.0.0 (2026-11-23 — Infrastructure, Cost, Security & Bundle Optimization)

- [x] **Free-Tier Invocation & DB RPC Reduction (`Phase 1`)**: Edge cached `/api/rates` (`24h` CDN + `6h` memory + pre-computed `defaultQuickEstimate`), removed redundant `/api/quota-status` mount call in `App.jsx`, batched `quotaGuard.js` (`5m` window / `50` hits), and added bounded sliding-window rate limiters ([rateLimit.js](../../api/_lib/rateLimit.js)) across `calculate`, `feedback`, `plans`, and `history`.
- [x] **Database Security, Retention & Keepalive (`Phase 2`)**: Created [20261123_v111_security_and_history.sql](../../supabase/migrations/20261123_v111_security_and_history.sql) & updated [schema.sql](../../supabase/schema.sql) (adding `calculation_history`, revoking `anon` direct Data API table access on `saved_plans`/`user_feedback`, dropping unused `idx_bank_rate_snapshots_updated_date`), locked unauthenticated admin `GET /api/feedback`, enforced retention caps (50 runs/user, 24 rate snapshots), and added [keepalive-supabase.yml](../../.github/workflows/keepalive-supabase.yml) (5-day ping).
- [x] **Entry JS Reduction `-40%+` & CDN Cache (`Phase 3`)**: Lazy-loaded `@supabase/supabase-js` into deferred `supabase` chunk only when stored session/callback or auth prompt opens, lazy-probed Google OAuth provider settings in `AuthModal.jsx`, deferred GTM behind `initAnalyticsIfAllowed()` cookie consent check, and enabled 1-year `immutable` cache on `/assets/(.*)` in `vercel.json`.
- [x] **CI/CD & Runtime Cleanup (`Phase 4`)**: Upgraded GitHub Actions workflow to **Node.js 24 LTS** + `engines.node = "24.x"`, consolidated monthly Day-1 sync on GitHub Actions, removed unused Cloudflare config (`wrangler.jsonc`, `public/_redirects`, `public/_headers`, `cf:*` scripts), and ignored `unikorn-assets/`.
- [ ] **Manual Owner Dashboard Actions Pending**:
  - Run [supabase/migrations/20261123_v111_security_and_history.sql](../../supabase/migrations/20261123_v111_security_and_history.sql) in Supabase SQL Editor (`gvgyztwpjvjvztwhwnue`).
  - Enable **Leaked Password Protection** under Supabase Auth Settings (`auth_leaked_password_protection`).
  - Reconnect the **Vercel** plugin account in Plugins Manager to restore MCP visibility.

---

## 1. Completed in Version 1.5 (2026-11-18)

- [x] **Dedicated TNEX Scraper (`scripts/scrape-tnex.js`)**: Scrapes `https://www.tnex.vn/san-pham/tiet-kiem` (`parseTnexHtml`, extracting 8 tenures `1M–36M` live: `4.75%`, `8.40%`, `8.60%`) and updates `banksData.js`, `bankPackagesData.js`, and `src/data/scraped/tnex-latest.json`.
- [x] **Dedicated TIMO Scraper (`scripts/scrape-timo.js`)**: Scrapes `https://timo.vn/tiet-kiem-co-ky-han/` (extracting 7 tenures live: `4.75%`, `6.70%`, `6.90%`) and updates `banksData.js`, `bankPackagesData.js`, and `src/data/scraped/timo-latest.json`.
- [x] **Dedicated LioBank Tariff + Dynamic Promo PDF Scraper (`scripts/scrape-liobank.js`)**: Scrapes `https://liobank.vn/vn/deposit-tariffs` (15 terms: `4.75%`, `5.90%`, `6.20%`), dynamically discovers & decompresses the latest CTKM promo PDF (`Liobank_The_Le_CTKM_Cong_Lai_suat_Tiet_kiem_11.11.2026.pdf`, 10 terms up to `8.20%`), and surfaces clickable `CTKM (PDF)` badges in `Rates.jsx`.
- [x] **Dedicated CakeBank Scraper (`scripts/scrape-cake.js`)**: Scrapes `https://cake.vn/tien-gui/tien-gui-tieu-chuan` (17 standard terms `4.75%–6.90%`, `36M: 6.30%`, bonus `+2.2%`) and `https://cake.vn/tien-gui/tien-gui-co-ky-han-tich-luy`, updating `banksData.js`, `bankPackagesData.js` (`cake-standard`, `cake-accumulate`), and `src/data/scraped/cake-latest.json`.
- [x] **Daily 9:00 AM Auto-Run Pipeline (All 4 Banks)**: Configured GitHub Actions workflow (`.github/workflows/daily-rates-sync.yml` at `0 2 * * *` UTC = 09:00 AM Vietnam time), Vercel Cron (`/api/cron/sync-rates` in `vercel.json` updating `api/_lib/liveRatesCache.js`), and local Windows Scheduled Task helper (`scripts/register-daily-9am-task.ps1`).

---

## 2. Completed in Version 1.4 (2026-11-18)

- [x] **Basic vs. Advanced Input Modes**: Added `Cơ bản` / `Nâng cao` toggle on `Planner.jsx`, `Calculator.jsx`, and `Ladder.jsx` (persisted in `PLANNER_STATE` on Planner) with compact collapsed summaries.
- [x] **Google Docs Export & Linking (`src/utils/googleDocsExporter.js`, `Planner.jsx`)**: Added rich HTML/text clipboard copy + 1-click `docs.new` launch and `.doc` file download compatible with Google Docs / Word.
- [x] **Post-Result Rating & Feedback Backup (`FeedbackWidget.jsx`, `api/feedback.js`, `DataModal.jsx`)**: Added interactive 1–5 star rating, feedback tags, comment box, serverless `/api/feedback` endpoint, local `USER_FEEDBACK_LOG` backup, and JSON/CSV export in `DataModal.jsx`.
- [x] **UI/UX Refinements**: Fixed sticky sidebar viewport height overflow (`lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto`), moved Feasibility insights directly below KPI stats in `Planner.jsx`, displayed active secondary tool names in `TopNav` `MoreMenu`, and tightened `MoneyField` spacing.

---

## 2. Completed in Version 1.3 (2026-11-18)

- [x] **Secret Server-Side Calculation Engine**: Moved `calculator.js` and `feasibilityEvaluator.js` from `src/utils/` into server-only `api/_lib/`, exposed via rate-limited `POST /api/calculate` (`api/calculate.js`) and `src/utils/apiClient.js`. Verified zero algorithm symbols or `.map` sourcemaps in `dist/assets/*.js`.
- [x] **Tier 1 Serverless Rate Feed (`GET /api/rates`)**: Added `api/rates.js` (Edge cached 1h) and updated `src/state.jsx` + `Home.jsx` + `Rates.jsx` to display a single `RATES_UPDATED_AT` (`18/11/2026`) timestamp.
- [x] **4 Digital Banks Market Rate & SBV Cap Audit**: Updated `CakeBank` (`6.90%` 6–24M + promo `9.1%` note), `Timo` (`4.75%` <6M cap, `6.20%–6.90%` + `8.20%` promo note), `LioBank` (`4.75%` 1M Pigg, `5.90%–6.70%`), and `TNEX` (`4.75%` <6M cap, `5.80%–6.50%` / `7.00%` special).
- [x] **6 UI/UX Fixes**: Added mobile sticky summary bar in `Planner.jsx`, cross-tool `PLANNER_STATE` pre-filling via `loadSavedPlannerState()`, caret-safe `NumberInput` in `ui.jsx`, direct `"Lập kế hoạch"` CTAs in `Rates.jsx`, expanded `@media print` tables in `index.css`, and unified `RATES_UPDATED_AT`.

---

## 2. Completed in Version 1.2 (2026-11-17)

- [x] **Dead v1 Files Cleanup**: Removed all 11 orphaned v1 files (`src/components/{Header,PassiveIncomePlanner,BankRateMatrix,BankInfoHub,InterestCalculatorPanel,LadderStrategyPlanner,CareerSalaryPlanner,MacroEconomicMode,ReferralHub}.jsx` and `src/utils/{pdfExporter,translations}.js`).
- [x] **Modernized `vercel.json` & `.gitignore`**: Updated `vercel.json` to `"framework": "vite"` and bumped `package.json` to `1.2.0`.
- [x] **`calculatePassiveIncomeRoadmap` Calculation Mode & Full Monthly Log**: Wired `calculationMode` (`NOMINAL_MONTHS` 1/12 vs `ACTUAL_DAYS` 30/365) and removed 24-month truncation in `monthByMonthLog`.
- [x] **Planner State Persistence, Shareable Link & Print/PDF**: Added `PLANNER_STATE` auto-save in `cryptoStorage`, included in `DataModal.jsx` backup/restore, added deep-link sharing and `@media print` styling.
- [x] **Custom Savings Ladder Split (`Ladder.jsx`)**: Exposed `"CUSTOM"` 2-term allocation strategy in UI.
- [x] **Partial vs. Full Early Withdrawal Simulator (`Calculator.jsx`)**: Added `calculateEarlyWithdrawalComparison` and interactive breakeven UI.
- [x] **Fisher Real Interest Rate (`Inflation.jsx`) & BankPicker in `Career.jsx`**: Added exact Fisher equation display and connected `Career.jsx` to `useRates()`.
- [x] **Rate Transparency (`Rates.jsx`, `banksData.js`, `bankPackagesData.js`)**: Reconciled Cake accumulate 6.70% rates, added `partialWithdrawal` badges and `rateTierNote`.

---

## 3. Future Backlog (`v1.13+` Roadmap)

- **CIC Credit Health & Loan Readiness Simulator (`/cic`)**: 5-pillar weighted simulator (`403–706` / Rank 1–10 + SBV Debt Groups 1–5) integrated with `/plan` passbooks; full spec in [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md).
- **Vietnam Financial Advisor & Wealth Butler Connector (`/advisors`)**: Verified advisor directory (`FIDT`, `FinPeace`, `AFA Capital`, VWA/CFP/CFA independents) with 1-click anonymized read-only snapshot sharing; full benchmark & architecture in [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md).
- **Multi-Goal Portfolio Tracking**: Allow users to track multiple active savings books (e.g., entering actual start dates and maturity dates) with maturity reminders.
- **Automated Unit Tests**: Add Vitest suite for `api/_lib/calculator.js` and `api/_lib/feasibilityEvaluator.js`.
