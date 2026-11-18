# VnSavingPro — Living Review Checklist & Technical Backlog

Use this document whenever reviewing the codebase, auditing financial calculations, or providing product/UX feedback. Update item statuses as issues are fixed or new findings emerge.

---

## 1. Completed in Version 1.3 (2026-11-18)

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
