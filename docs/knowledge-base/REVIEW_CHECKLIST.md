# VnSavingPro — Living Review Checklist & Technical Backlog

Use this document whenever reviewing the codebase, auditing financial calculations, or providing product/UX feedback. Update item statuses as issues are fixed or new findings emerge.

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

## 3. Future Backlog (v1.4+ Ideas)

- **Multi-Goal Portfolio Tracking**: Allow users to track multiple active savings books (e.g., entering actual start dates and maturity dates) with maturity reminders.
- **Automated Bank Rate Scraper / GitHub Action**: Periodically verify bank website rate tables and trigger redeploy or KV update automatically.
- **Automated Unit Tests**: Add Vitest suite for `api/_lib/calculator.js` and `api/_lib/feasibilityEvaluator.js`.
