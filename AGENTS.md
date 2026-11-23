# VnSavingPro — Living Brain & Workspace Rules

This workspace maintains a **Living Brain** in `docs/knowledge-base/` so that every review, feedback session, architectural decision, or feature implementation operates on the **latest ground-truth state** of the project.

## 1. Mandatory Pre-Review & Feedback Protocol

Whenever the user asks to **review**, **audit**, **give feedback**, **check current status**, or **plan changes**:
1. **Read the Living Brain First**: Start by reading [INDEX.md](./docs/knowledge-base/INDEX.md) and any relevant domain/architecture docs in `docs/knowledge-base/`.
2. **Verify Live Ground Truth**: Activate the `project-brain` skill (`.agents/skills/project-brain/SKILL.md`) or run its snapshot check to verify if any files in `src/` were modified more recently than the knowledge base.
   - **Target Only the Active Architecture (v1.12.0.0 Streamlined Header, Branded Splash, 3-Step Onboarding, Shared Household Planning & Strategic CIC/Advisor Roadmap)**:
     - **Frontend (`src/`)**: `src/App.jsx`, `src/state.jsx`, `src/tools.js`, `src/version.json`, `src/i18n/index.jsx`, `src/layout/{DisplayModeContext.jsx,viewportMetrics.js}`, `src/pages/*.jsx`, `src/components/{Layout,AdaptiveLayout,SplashScreen,OnboardingModal,StageCarousel,SavePlanPromptCard,ui,BankPicker,GrowthChart,DataModal,FeedbackWidget,HouseholdModeSwitch,HouseholdInsightsCard,CookieBanner,AuthModal,PocValidationOverlay}.jsx`, `src/data/*.js`, `src/data/scraped/*.json`, and `src/utils/{apiClient,supabaseClient,googleDocsExporter,format,cryptoStorage,cookieManager}.js`.
     - **Backend / Serverless (`api/`)**: `api/rates.js`, `api/calculate.js`, `api/feedback.js`, `api/plans.js`, `api/history.js`, `api/collaborations.js`, `api/quota-status.js`, `api/cron/sync-rates.js`, and server-only modules `api/_lib/{calculator,feasibilityEvaluator,householdAnalytics,http,liveRatesCache,rateLimit,supabase,resend,quotaGuard}.js`. **NEVER** move proprietary calculation or feasibility scoring logic back into `src/` so algorithms stay private on Vercel.
     - **Automated Monthly Scrapers & Keepalive (`scripts/` & `.github/workflows/`)**: `scripts/scrape-tnex.js` (`https://www.tnex.vn/san-pham/tiet-kiem`), `scripts/scrape-timo.js` (`https://timo.vn/tiet-kiem-co-ky-han/`), `scripts/scrape-liobank.js` (`https://liobank.vn/vn/deposit-tariffs` + auto-discovered latest CTKM promo PDF), `scripts/scrape-cake.js` (`https://cake.vn/tien-gui/tien-gui-tieu-chuan` & `tien-gui-co-ky-han-tich-luy`), `scripts/scrape-all.js`, `scripts/bump-version.js`, `scripts/_lib/rateUpdater.js`, `scripts/register-daily-9am-task.ps1` (Day-1 monthly schedule), `.github/workflows/daily-rates-sync.yml` (`0 2 1 * *` UTC = 09:00 AM UTC+7 on Node 24 LTS), and `.github/workflows/keepalive-supabase.yml` (`0 3 */5 * *`).

## 2. Mandatory Post-Change Sync Rule (Keep the Brain Alive)

Whenever you modify code, formulas, bank rates, UI components, or deployment configuration in this repository:
1. **Update the corresponding doc** in `docs/knowledge-base/` (`INDEX.md`, `ARCHITECTURE.md`, `DOMAIN_AND_FORMULAS.md`, or `REVIEW_CHECKLIST.md`) in the **same turn**.
2. **Log the change** in [CHANGELOG_AND_DECISIONS.md](./docs/knowledge-base/CHANGELOG_AND_DECISIONS.md) with the date, summary, and files touched.

## 3. Mandatory App Versioning Rule (`MAJOR.MINOR.PATCH.BUILD`)

Every update committed to this repository **MUST** bump the 4-part app version starting from `1.6.0.0`:
- **Small fix / tweak / copy or UI adjustment (`BUILD`)**: Run `npm run version:bump` (or `node scripts/bump-version.js build`) -> e.g., `1.6.0.0` -> `1.6.0.1`.
- **Medium patch (`PATCH`)**: Run `node scripts/bump-version.js patch` -> resets `BUILD` to `0`.
- **Feature release (`MINOR`)**: Run `node scripts/bump-version.js minor` -> resets `PATCH` and `BUILD` to `0`.
- **Breaking / major overhaul (`MAJOR`)**: Run `node scripts/bump-version.js major`.
After bumping `src/version.json` & `package.json`, prepend/update the changelog item in `VERSION_HIGHLIGHTS` (`src/tools.js`) and reflect the new version in `docs/knowledge-base/INDEX.md` and `docs/knowledge-base/CHANGELOG_AND_DECISIONS.md`.

## 4. Coding & Design Conventions

- **Stack**: React 18 + Vite 5 + Tailwind CSS v4 (`@tailwindcss/vite`) + `chart.js` / `react-chartjs-2` + `lucide-react`.
- **Routing**: Clean History API router (`/`, `/plan`, `/rates`, `/calculator`, `/ladder`, `/career`, `/inflation`, `/referral`) configured in `src/tools.js` (`HOME_PAGE` & `TOOLS` with `path`, `aliases`, `pageTitle`) and handled in `src/state.jsx` with automatic legacy `#/...` migration.
- **UI Primitives**: Always reuse primitives from `src/components/ui.jsx` (`Card`, `Button`, `Badge`, `Chip`, `Segmented`, `MoneyField`, `DecimalInput`, `NumberInput`, `SliderField`, `Stat`, `Table`, `Modal`, `PageHeader`) rather than inline styles.
- **Formatting**: Format all VND amounts, percentages, and durations through `src/utils/format.js` (`vnd`, `compact`, `chip`, `pct`, `duration`, `fmt`) with `tabular-nums`.
