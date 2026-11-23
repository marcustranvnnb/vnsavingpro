# VnSavingPro — Living Brain Index

> **Last Synced**: 2026-11-23 17:48 (Version 2.0.0.0: Personal/Couple/Family Wealth Platform · 4 User Roles · Community Plan Cloning · FX Manager · Vietnam 2026 Salary/PIT/BHXH)
> **Current Architecture Version**: v2.0.0.0 (3 Connected Suites: Digital Savings + Live Vietcombank FX Manager + Vietnam 2026 Statutory Payroll/5-Bracket PIT/BHXH + 4-Role Ecosystem `/ecosystem` + Household Lifecycle `/profile` · 10/12 Vercel Functions + Deferred Supabase Auth Chunk)
> **Deployment Status**: Migrated from `#/` hash routing to Clean URLs (`/`, `/plan`, `/fx`, `/salary`, `/ecosystem`, ...) and pushed to GitHub (`https://github.com/marcustranvnnb/vnsavingpro.git`, branch `main`).

---

## Knowledge Base Map

| Document | Purpose | When to Read |
| :--- | :--- | :--- |
| [INDEX.md](./INDEX.md) | Master project snapshot, route map, and active vs. legacy file registry | Start of every review, feedback, or planning task |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Active v2 component tree, state management, routing, build chunks, and UI system | Before modifying UI, pages, state, or build/deployment configs |
| [DOMAIN_AND_FORMULAS.md](./DOMAIN_AND_FORMULAS.md) | Financial formulas (SBV Circular 14, passive income solver, ladder matrix) & bank data | Before reviewing calculations, financial accuracy, or bank rates |
| [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md) | Living audit rubric, known technical debt, UX/financial feedback items, and backlog | When asked to review the project or suggest improvements |
| [CHANGELOG_AND_DECISIONS.md](./CHANGELOG_AND_DECISIONS.md) | Chronological Architecture Decision Records (ADRs) and change history | To understand why past changes were made and log new updates |
| [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md) | Strategic design for CIC Credit Health estimator (`/cic`) & Vietnam Advisor/Butler connector (`/advisors`) + domestic competitor benchmark | Before building or scoping CIC scoring or financial advisor integrations |

---

## Product Summary

**VnSavingPro v2.0** is a Vietnamese **Personal, Couple & Family Wealth Management Platform** structured around **4 User Roles** (`Individual` with Couple/Family switching & upgrades, `Verified Financial Expert`, `Community-Voted Planner` with 1-click plan cloning — also earnable by Experts, and `Financial Steward`) and **3 Tool Suites** (**Digital Bank Savings**, **Live FX Currency Management**, and **Vietnam 2026 Statutory Payroll, 5-Bracket PIT & Social Insurance**).

### Active Routes & Feature Modules (`src/pages/`)

| Route | Tool ID | Active File | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `home` | [src/pages/Home.jsx](../../src/pages/Home.jsx) | Platform landing page featuring 3 Tool Suites, 4 User Roles, Household QuickEstimate & Unikorn Showcase |
| `/plan` | `plan` | [src/pages/Planner.jsx](../../src/pages/Planner.jsx) | Flagship Passive Income & Household Roadmap solver (Cá nhân/Cặp đôi/Gia đình, Fund-First EF, stress test), feasibility score, Chart.js projection, and Google Docs/CSV export |
| `/fx` | `fx` | [src/pages/FxManager.jsx](../../src/pages/FxManager.jsx) | Live Vietcombank FX rates, bidirectional Cash/Transfer/Sell converter, multi-currency wealth valuation, `-5%..+10%` stress-test, target watchlist & VND bank savings hurdle |
| `/salary` | `salary` | [src/pages/SalaryInsurance.jsx](../../src/pages/SalaryInsurance.jsx) | Vietnam 2026 Gross↔Net, 5-bracket PIT (`Law 109/2025` + `NQ 110/2025`), `2.53M` reference salary (`NĐ 161/2026`), regional wages (`NĐ 293/2025` / `NĐ 399/2026`), BHTN (`74/2025`), Maternity & Lump-Sum (`41/2024`) |
| `/ecosystem` | `ecosystem` | [src/pages/Ecosystem.jsx](../../src/pages/Ecosystem.jsx) | 4-Role Ecosystem hub: vote & 1-click Clone community-voted plan templates, browse/apply Verified Experts, and issue/accept Financial Steward mandates |
| `/rates` | `rates` | [src/pages/Rates.jsx](../../src/pages/Rates.jsx) | Interactive rate comparison matrix across 11 tenures (`1W`–`36M`), inline custom rate overrides, and detailed digital bank product packages |
| `/calculator` | `calculator` | [src/pages/Calculator.jsx](../../src/pages/Calculator.jsx) | Side-by-side comparison of 3 interest calculation methods: Actual Days/365 (SBV Circular 14), Nominal Months/12, and Monthly Compounding |
| `/ladder` | `ladder` | [src/pages/Ladder.jsx](../../src/pages/Ladder.jsx) | Multi-tranche Savings Ladder simulator with household 1M–3M Emergency Fund liquidity coverage & 2-earner split |
| `/career` | `career` | [src/pages/Career.jsx](../../src/pages/Career.jsx) | Models how annual raises vs. job hopping accelerate financial freedom for 1 or 2 earners (`SAME`/`STATIC`) |
| `/inflation` | `inflation` | [src/pages/Inflation.jsx](../../src/pages/Inflation.jsx) | Real interest rate & future purchasing power erosion calculator |
| `/contributors` | `contributors` | [src/pages/Contributors.jsx](../../src/pages/Contributors.jsx) | Community Hall of Fame honoring opt-in contributors, transparent feedback-to-shipped timeline, and Unikorn showcase |
| `/profile` | `profile` | [src/pages/Profile.jsx](../../src/pages/Profile.jsx) | Personal profile, v2.0 role progress & badges, Couple switch / Couple→Family upgrade lifecycle, shared invites & multi-tool run history |

---

## File Registry (v2.0.0.0 Wealth Management Platform · 4 Roles · FX · Salary 2026)

- **Database & Schema (`supabase/`)**: `supabase/schema.sql`, `supabase/migrations/{20261123_v111_security_and_history,20261123_v112_collaborative_planning,20261123_v200_wealth_platform}.sql` (`bank_rate_snapshots`, `user_feedback`, `saved_plans`, `profiles`, `calculation_history`, `household_collaborations`, `household_spaces`, `community_plan_templates`, `community_template_votes`, `steward_mandates`, `usage_quotas`, `quota_alerts_log` + hardened RLS policies)
- **Serverless API (`api/`, `10/12` Vercel Free-Tier functions)**: `api/rates.js`, `api/fx.js`, `api/calculate.js`, `api/ecosystem.js`, `api/feedback.js`, `api/plans.js`, `api/history.js`, `api/collaborations.js`, `api/quota-status.js`, `api/cron/sync-rates.js`, `api/_lib/{calculator,feasibilityEvaluator,householdAnalytics,fxRatesCache,fxCalculator,salaryVietnam,http,liveRatesCache,rateLimit,supabase,resend,quotaGuard}.js`
- **Automated Scrapers, Keepalive & Scheduling (`scripts/`, `.github/`)**: `scripts/scrape-tnex.js`, `scripts/scrape-timo.js`, `scripts/scrape-liobank.js`, `scripts/scrape-cake.js`, `scripts/scrape-all.js`, `scripts/bump-version.js`, `scripts/_lib/rateUpdater.js`, `scripts/register-daily-9am-task.ps1` (Monthly 1st `09:00`), `.github/workflows/daily-rates-sync.yml` (`0 2 1 * *`, Node 24 LTS), `.github/workflows/keepalive-supabase.yml` (`0 3 */5 * *`)
- **Root, i18n, Layout & State (`src/`)**: `src/main.jsx`, `src/App.jsx`, `src/state.jsx`, `src/tools.js`, `src/version.json`, `src/index.css`, `src/i18n/index.jsx`, `src/layout/{DisplayModeContext.jsx,viewportMetrics.js}`
- **Pages (`src/pages/`)**: `src/pages/{Home,Planner,FxManager,SalaryInsurance,Ecosystem,Rates,Calculator,Ladder,Career,Inflation,Contributors,Auth,Profile}.jsx` (`Referral.jsx` hidden)
- **Shared Components**: `src/components/{Layout,AdaptiveLayout,SplashScreen,OnboardingModal,StageCarousel,SavePlanPromptCard,ui,BankPicker,GrowthChart,DataModal,FeedbackWidget,CookieBanner,AuthModal,PocValidationOverlay,HouseholdModeSwitch,HouseholdInsightsCard}.jsx`
- **Data**: `src/data/{banksData,bankPackagesData,contributorsData}.js`, `src/data/scraped/{tnex-latest,timo-latest,liobank-latest,cake-latest}.json`
- **Client Utilities**: `src/utils/{apiClient,supabaseClient,googleDocsExporter,format,cryptoStorage,cookieManager}.js`
