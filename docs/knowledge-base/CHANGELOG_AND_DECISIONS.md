# VnSavingPro — Changelog & Architecture Decision Records (ADRs)

All notable architectural changes, reviews, and configuration updates are recorded here chronologically.

---

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
