# VnSavingPro — Changelog & Architecture Decision Records (ADRs)

All notable architectural changes, reviews, and configuration updates are recorded here chronologically.

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
