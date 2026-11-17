# VnSavingPro — Living Review Checklist & Technical Backlog

Use this document whenever reviewing the codebase, auditing financial calculations, or providing product/UX feedback. Update item statuses as issues are fixed or new findings emerge.

---

## 1. Completed in Version 1.2 (2026-11-17)

- [x] **Dead v1 Files Cleanup**: Removed all 11 orphaned v1 files (`src/components/{Header,PassiveIncomePlanner,BankRateMatrix,BankInfoHub,InterestCalculatorPanel,LadderStrategyPlanner,CareerSalaryPlanner,MacroEconomicMode,ReferralHub}.jsx` and `src/utils/{pdfExporter,translations}.js`).
- [x] **Modernized `vercel.json` & `.gitignore`**: Updated `vercel.json` to `"framework": "vite"` and bumped `package.json` to `1.2.0`.
- [x] **`calculatePassiveIncomeRoadmap` Calculation Mode & Full Monthly Log**: Wired `calculationMode` (`NOMINAL_MONTHS` 1/12 vs `ACTUAL_DAYS` 30/365) and removed 24-month truncation in `monthByMonthLog`.
- [x] **Planner State Persistence, Shareable Link & Print/PDF**: Added `PLANNER_STATE` auto-save in `cryptoStorage`, included in `DataModal.jsx` backup/restore, added deep-link sharing and `@media print` styling.
- [x] **Custom Savings Ladder Split (`Ladder.jsx`)**: Exposed `"CUSTOM"` 2-term allocation strategy in UI.
- [x] **Partial vs. Full Early Withdrawal Simulator (`Calculator.jsx`)**: Added `calculateEarlyWithdrawalComparison` and interactive breakeven UI.
- [x] **Fisher Real Interest Rate (`Inflation.jsx`) & BankPicker in `Career.jsx`**: Added exact Fisher equation display and connected `Career.jsx` to `useRates()`.
- [x] **Rate Transparency (`Rates.jsx`, `banksData.js`, `bankPackagesData.js`)**: Reconciled Cake accumulate 6.70% rates, added `partialWithdrawal` badges and `rateTierNote`.

---

## 2. Future Backlog (v1.3+ Ideas)

- **Multi-Goal Portfolio Tracking**: Allow users to track multiple active savings books (e.g., entering actual start dates and maturity dates) with maturity reminders.
- **Historical Bank Rate Chart**: Track how digital bank rates (TNEX, LioBank, Cake, Timo) change month-over-month.
- **Automated Unit Tests**: Add Vitest suite for `src/utils/calculator.js` and `src/utils/feasibilityEvaluator.js`.
