# VnSavingPro — Living Brain Index

> **Last Synced**: 2026-11-23 15:23 (Version 1.10.0.0: Monthly 1st Rate Sync `0 2 1 * *`, Manual Run CTA + Lazy Loading across all 5 tools, Profile Plan/Run History `api/history.js` & Guest Save Prompt)
> **Current Architecture Version**: v1.10.0.0 (Monthly 1st Rate Sync + Explicit Tool Run CTA & CalculationLoader + Profile Run History & Guest Save Prompt + Swipeable Stage Explorer + Community Hall of Fame + Unified Adaptive Multi-Screen + Trilingual VI/EN/JA SPA + Vercel Serverless API + Supabase Free Tier Postgres `gvgyztwpjvjvztwhwnue`)
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
| `/` | `home` | [src/pages/Home.jsx](../../src/pages/Home.jsx) | Refreshed landing page with Household QuickEstimate, 3-mode overview cards (Cá nhân/Cặp đôi/Gia đình), 12M rate leaderboard, Cloud/Google sync card & tool grid |
| `/plan` | `plan` | [src/pages/Planner.jsx](../../src/pages/Planner.jsx) | Flagship Passive Income & Household Roadmap solver (Cá nhân/Cặp đôi/Gia đình, Fund-First EF, stress test), feasibility score, Chart.js projection, and Google Docs/CSV export |
| `/rates` | `rates` | [src/pages/Rates.jsx](../../src/pages/Rates.jsx) | Interactive rate comparison matrix across 11 tenures (`1W`–`36M`), inline custom rate overrides, and detailed digital bank product packages |
| `/calculator` | `calculator` | [src/pages/Calculator.jsx](../../src/pages/Calculator.jsx) | Side-by-side comparison of 3 interest calculation methods: Actual Days/365 (SBV Circular 14), Nominal Months/12, and Monthly Compounding |
| `/ladder` | `ladder` | [src/pages/Ladder.jsx](../../src/pages/Ladder.jsx) | Multi-tranche Savings Ladder simulator with household 1M–3M Emergency Fund liquidity coverage & 2-earner split |
| `/career` | `career` | [src/pages/Career.jsx](../../src/pages/Career.jsx) | Models how annual raises vs. job hopping accelerate financial freedom for 1 or 2 earners (`SAME`/`STATIC`) |
| `/inflation` | `inflation` | [src/pages/Inflation.jsx](../../src/pages/Inflation.jsx) | Real interest rate & future purchasing power erosion calculator |
| `/contributors` | `contributors` | [src/pages/Contributors.jsx](../../src/pages/Contributors.jsx) | Community Hall of Fame honoring opt-in contributors, transparent feedback-to-shipped timeline, and Unikorn showcase |
| `/referral` *(hidden)* | `referral` | [src/pages/Referral.jsx](../../src/pages/Referral.jsx) | Temporarily hidden (`hidden: true` in `src/tools.js`) — redirects cleanly to `/` |

---

## File Registry (v1.10.0.0 Monthly Rate Sync, Tool Run CTA + Lazy Loading, Profile Run History & Community Serverless)

- **Database & Schema (`supabase/`)**: `supabase/schema.sql` (`bank_rate_snapshots`, `user_feedback`, `saved_plans`, `profiles`, `calculation_history`, `usage_quotas`, `quota_alerts_log` + RLS policies), `supabase/email-templates/`, `.env.example`
- **Serverless API (`api/`)**: `api/rates.js`, `api/calculate.js`, `api/feedback.js`, `api/plans.js`, `api/history.js`, `api/quota-status.js`, `api/cron/sync-rates.js`, `api/_lib/{calculator,feasibilityEvaluator,householdAnalytics,http,liveRatesCache,supabase,resend,quotaGuard}.js`
- **Automated Scrapers, Versioning & Scheduling (`scripts/`, `.github/`)**: `scripts/scrape-tnex.js`, `scripts/scrape-timo.js`, `scripts/scrape-liobank.js`, `scripts/scrape-cake.js`, `scripts/scrape-all.js`, `scripts/bump-version.js`, `scripts/_lib/rateUpdater.js`, `scripts/register-daily-9am-task.ps1` (Monthly 1st `09:00`), `.github/workflows/daily-rates-sync.yml` (`0 2 1 * *`)
- **Root, i18n, Layout & State (`src/`)**: `src/main.jsx`, `src/App.jsx`, `src/state.jsx`, `src/tools.js`, `src/version.json`, `src/index.css`, `src/i18n/index.jsx`, `src/layout/{DisplayModeContext.jsx,viewportMetrics.js}`
- **Pages (`src/pages/`)**: `src/pages/{Home,Planner,Rates,Calculator,Ladder,Career,Inflation,Contributors,Auth,Profile}.jsx` (`Referral.jsx` hidden)
- **Shared Components**: `src/components/{Layout,AdaptiveLayout,StageCarousel,SavePlanPromptCard,ui,BankPicker,GrowthChart,DataModal,FeedbackWidget,CookieBanner,AuthModal,PocValidationOverlay,HouseholdModeSwitch,HouseholdInsightsCard}.jsx`
- **Data**: `src/data/{banksData,bankPackagesData,contributorsData}.js`, `src/data/scraped/{tnex-latest,timo-latest,liobank-latest,cake-latest}.json`
- **Client Utilities**: `src/utils/{apiClient,googleDocsExporter,format,cryptoStorage,cookieManager}.js`
