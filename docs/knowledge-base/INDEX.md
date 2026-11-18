# VnSavingPro — Living Brain Index

> **Last Synced**: 2026-11-18 22:20 (Added Detailed Monthly Income Breakdown across Basic & Advanced Modes + Server Feasibility Range Check)
> **Current Architecture Version**: v1.5.2 (Clean-URL History API SPA + Hardened Security Layer + Vercel Serverless API + Daily 9AM Scrapers)
> **Deployment Status**: Migrated from `#/` hash routing to Clean URLs (`/`, `/plan`, ...) and pushed to GitHub (`https://github.com/marcustranvnnb/vnsavingpro.git`, branch `main`).

---

## Knowledge Base Map

| Document | Purpose | When to Read |
| :--- | :--- | :--- |
| [INDEX.md](./INDEX.md) | Master project snapshot, route map, and active vs. legacy file registry | Start of every review, feedback, or planning task |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Active v2 component tree, state management, routing, build chunks, and UI system | Before modifying UI, pages, state, or build/deployment configs |
| [DOMAIN_AND_FORMULAS.md](./DOMAIN_AND_FORMULAS.md) | Financial formulas (SBV Circular 14, passive income solver, ladder matrix) & bank data | Before reviewing calculations, financial accuracy, or bank rates |
| [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md) | Living audit rubric, known technical debt, UX/financial feedback items, and backlog | When asked to review the project or suggest improvements |
| [CHANGELOG_AND_DECISIONS.md](./CHANGELOG_AND_DECISIONS.md) | Chronological Architecture Decision Records (ADRs) and change history | To understand why past changes were made and log new updates |

---

## Product Summary

**VnSavingPro** is a Vietnamese client-side personal finance web application focused on **turning bank savings into predictable monthly passive income** and comparing **Vietnamese Digital Banks** (**TNEX**, **LioBank**, **Cake by VPBank**, **Timo by BVBank**).

### Active Routes & Feature Modules (`src/pages/`)

| Route | Tool ID | Active File | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `home` | [src/pages/Home.jsx](../../src/pages/Home.jsx) | Landing page with interactive `QuickEstimate` widget, 12M rate leaderboard, and tool grid |
| `/plan` | `plan` | [src/pages/Planner.jsx](../../src/pages/Planner.jsx) | Flagship Passive Income Roadmap solver, feasibility score, what-if scenarios, Chart.js projection, and CSV export |
| `/rates` | `rates` | [src/pages/Rates.jsx](../../src/pages/Rates.jsx) | Interactive rate comparison matrix across 11 tenures (`1W`–`36M`), inline custom rate overrides, and detailed digital bank product packages |
| `/calculator` | `calculator` | [src/pages/Calculator.jsx](../../src/pages/Calculator.jsx) | Side-by-side comparison of 3 interest calculation methods: Actual Days/365 (SBV Circular 14), Nominal Months/12, and Monthly Compounding |
| `/ladder` | `ladder` | [src/pages/Ladder.jsx](../../src/pages/Ladder.jsx) | Multi-tranche Savings Ladder simulator (`ROLLING_1M`, `SPLIT_50_50`, `TNEX_PROMO_30_70`) across 6–60 months |
| `/career` | `career` | [src/pages/Career.jsx](../../src/pages/Career.jsx) | Models how annual raises (+2M/yr, +10%/yr) vs. job hopping (+30% every 2 yrs) accelerate time to financial freedom |
| `/inflation` | `inflation` | [src/pages/Inflation.jsx](../../src/pages/Inflation.jsx) | Real interest rate & future purchasing power erosion calculator |
| `/referral` | `referral` | [src/pages/Referral.jsx](../../src/pages/Referral.jsx) | Digital bank account opening promotions, referral codes, and QR codes |

---

## File Registry (v1.5 Tier 1 Serverless + Daily Scrapers)

- **Serverless API (`api/`)**: `api/rates.js` (`GET /api/rates`), `api/calculate.js` (`POST /api/calculate`), `api/feedback.js` (`GET`/`POST /api/feedback`), `api/cron/sync-rates.js` (daily 09:00 AM VN Vercel cron), `api/_lib/{calculator,feasibilityEvaluator,http,liveRatesCache}.js`
- **Automated Scrapers & Scheduling (`scripts/`, `.github/`)**: `scripts/scrape-tnex.js`, `scripts/scrape-timo.js`, `scripts/scrape-liobank.js`, `scripts/scrape-cake.js`, `scripts/scrape-all.js`, `scripts/_lib/rateUpdater.js`, `scripts/register-daily-9am-task.ps1`, `.github/workflows/daily-rates-sync.yml`
- **Root & State (`src/`)**: `src/main.jsx`, `src/App.jsx`, `src/state.jsx`, `src/tools.js`, `src/index.css`
- **Pages (`src/pages/`)**: `src/pages/{Home,Planner,Rates,Calculator,Ladder,Career,Inflation,Referral}.jsx`
- **Shared Components**: `src/components/{Layout,ui,BankPicker,GrowthChart,DataModal,FeedbackWidget}.jsx`
- **Data**: `src/data/{banksData,bankPackagesData}.js`, `src/data/scraped/{tnex-latest,timo-latest,liobank-latest,cake-latest}.json`
- **Client Utilities**: `src/utils/{apiClient,googleDocsExporter,format,cryptoStorage}.js`
