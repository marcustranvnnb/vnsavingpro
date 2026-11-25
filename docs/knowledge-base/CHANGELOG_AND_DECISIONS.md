# VnSavingPro — Changelog & Architecture Decision Records (ADRs)

All notable architectural changes, reviews, and configuration updates are recorded here chronologically.

---

## [2026-11-25] — Version 2.6.0.0: Personal 2.5D Isometric Sky Island Garden (`/garden`)

- **Request**: Upgrade the virtual garden concept into a personal, farm-game-inspired floating island garden (like *Khu vườn trên mây 2*) where users can see and arrange their personal garden.
- **Changes Implemented**:
  - **Version Bump (`v2.6.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), and [src/tools.js](../../src/tools.js).
  - **2.5D Isometric Sky Island (`IsometricSkyIsland.jsx`)**: Built [src/components/IsometricSkyIsland.jsx](../../src/components/IsometricSkyIsland.jsx) with 2.5D voxel island cliffs, animated waterfall & lotus pond, thatched pavilion, crystal fountain, mystic portal, 12 interactive 3D soil plots (`plotIndex` saved via [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js)), Move-Plot rearrangement, Game HUD bar (Island Level, XP, Gems 💎, Gold 🪙, Weather & Zoom), left wooden action dock, and customizable Garden Name + Island Decorations modal (`vnsaving_sky_island_decor_v1`).
  - **Orchard Integration**: Wired `<IsometricSkyIsland />` cleanly into [src/components/WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx) and [src/pages/Garden.jsx](../../src/pages/Garden.jsx).

---

## [2026-11-24] — Version 2.5.1.0: Full Platform Version Sync, 1-Click Demo Account (`demo@vnsavingpro.vn`) & Production Deploy

- **Request**: Update all website pages and version labels across the site, create a working Demo Account, and deploy the latest release.
- **Changes Implemented**:
  - **Version Bump (`v2.5.1.0`)**: Ran `node scripts/bump-version.js patch`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), and [src/tools.js](../../src/tools.js) (`APP_VERSION` dynamic titles & `v2.5.1.0` highlights).
  - **1-Click Demo Account (`demo@vnsavingpro.vn` / `VnSavingDemo2026!`)**: Implemented `DEMO_ACCOUNT_CREDENTIALS`, `signInAsDemo()`, `isDemoSession`, and automatic demo orchard/passbook/planner pre-seeding inside [src/contexts/AuthContext.jsx](../../src/contexts/AuthContext.jsx), surfaced via 1-click Demo card inside [src/components/AuthModal.jsx](../../src/components/AuthModal.jsx), [src/pages/Home.jsx](../../src/pages/Home.jsx), [src/components/Layout.jsx](../../src/components/Layout.jsx), and [src/pages/Profile.jsx](../../src/pages/Profile.jsx).
  - **Cross-Page Version Sync**: Synced `APP_VERSION` (`v2.5.1.0`) across [src/pages/Ecosystem.jsx](../../src/pages/Ecosystem.jsx), [src/pages/Profile.jsx](../../src/pages/Profile.jsx), and [src/pages/Home.jsx](../../src/pages/Home.jsx) hero metrics & copy.

---

## [2026-11-24] — Version 2.5.0.0: Interactive 3-Weather Virtual Orchard & 14 Native Vietnamese Tree Species (`/garden`)

- **Request**: Add more Vietnamese tree varieties and elevate the garden into an interactive Virtual Orchard (*khu vườn ảo*) where users can enter and see all of their trees growing together.
- **Changes Implemented**:
  - **Version Bump (`v2.5.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), and [src/tools.js](../../src/tools.js) (`v2.5.0.0` trilingual release highlights & `/garden` virtual orchard label).
  - **14 Vietnamese Species & 14 Mystery Fruits**: Expanded [src/data/wealthTreesData.js](../../src/data/wealthTreesData.js) and [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js) to 14 native trees spanning 0.25–40 years (*Sen Hồng Đồng Tháp, Quất Tứ Liên, Thanh Long, Đào Bích Nhật Tân, Dừa Xiêm Bến Tre, Cà Phê Tây Nguyên, Vải Thiều Lục Ngạn, Xoài Cát Hòa Lộc, Vú Sữa Lò Rèn, Bưởi Da Xanh, Sầu Riêng Ri6, Chè Shan Tuyết Cổ Thụ, Tre Ngà Thánh Gióng, Mai Vàng & Trầm Hương*) across 8 SVG silhouettes (`lotus`, `palm`, `bamboo`, `pillar`, `bushy`, `broad`, `tall`, `bonsai`).
  - **Virtual Orchard Panorama**: Added `<VirtualOrchardScene />`, `<TreeCanopyGlyph />`, 3 weather themes (`ORCHARD_THEMES`), 4-tree Bot Demo generator, and 14-Species Botanical Almanac modal inside [src/components/WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx) and [src/pages/Garden.jsx](../../src/pages/Garden.jsx).

---

## [2026-11-24] — Version 2.4.0.0: Lucky Fortune Cat Mascot ("Mèo Chiêu Tài Miu Vàng") & Cute Wealth Experience

- **Request**: Make VnSavingPro cuter and friendlier with a Lucky Fortune Cat (*Mèo Chiêu Tài* / *Maneki-neko*) as the mascot.
- **Changes Implemented**:
  - **Version Bump (`v2.4.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), and [src/tools.js](../../src/tools.js) (`v2.4.0.0` trilingual highlights & version labels).
  - **Animations & Mascot Library**: Added `@keyframes pawWave`, `catFloat`, `coinSparkle`, and `.cute-cat-card` in [src/index.css](../../src/index.css); created [src/components/LuckyCatMascot.jsx](../../src/components/LuckyCatMascot.jsx) with 5 SVG moods (`wave`, `gardener`, `scholar`, `celebrate`, `cheer`), interactive Pet-the-Cat lucky counter, `<LuckyCatTipCard />`, `<LuckyCatHeaderButton />`, and `<LuckyCatFortuneModal />` (8 trilingual wealth fortunes).
  - **Cross-App Mascot Presence**: Integrated Miu Vang into [src/components/SplashScreen.jsx](../../src/components/SplashScreen.jsx), [src/components/Layout.jsx](../../src/components/Layout.jsx) (`TopNav` + `Footer`), [src/pages/Home.jsx](../../src/pages/Home.jsx), [src/components/WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx) (gardener inside `<VietnameseTreeSvg />` + Mystery Fruit modal celebration), [src/components/OnboardingModal.jsx](../../src/components/OnboardingModal.jsx), and [src/pages/Planner.jsx](../../src/pages/Planner.jsx).

---

## [2026-11-24] — Version 2.3.0.0: Vietnamese Wealth Tree Garden & Mystery Fruit Harvest (`/garden`)

- **Request**: Gamify financial plans as living Vietnamese fruit & blossom trees — applying/following a plan plants a seed, verified deposits make the tree grow across stages, over-depositing accelerates growth speed, users can follow multiple plans and pick native Vietnamese trees matched to plan horizon years, and completing a goal unlocks a Mystery Fruit.
- **Changes Implemented**:
  - **Version Bump (`v2.3.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), [src/tools.js](../../src/tools.js) (`/garden` route + trilingual `v2.3.0.0` highlights), and [src/App.jsx](../../src/App.jsx).
  - **Storage & Cloud/JSON Backup**: Added `WEALTH_TREES_STATE` schema validator in [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js), state helpers in [src/utils/apiClient.js](../../src/utils/apiClient.js), and backup coverage in [src/components/DataModal.jsx](../../src/components/DataModal.jsx).
  - **Tree Species, SVG Stage Visualizer & Multi-Plan Orchard**: Created [src/data/wealthTreesData.js](../../src/data/wealthTreesData.js), [src/components/WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx), and [src/pages/Garden.jsx](../../src/pages/Garden.jsx); integrated 1-click seed planting inside [src/pages/Planner.jsx](../../src/pages/Planner.jsx) and compact orchard overview inside [src/pages/Profile.jsx](../../src/pages/Profile.jsx).

---

## [2026-11-24] — Version 2.2.0.1: Transparent Bot-Created & Dummy Reference Data Labeling

- **Request**: Explicitly mark all bot-created / seeded / dummy reference data across the platform so users clearly know what is synthetic reference vs. real data.
- **Changes Implemented**:
  - **Version Bump (`v2.2.0.1`)**: Ran `node scripts/bump-version.js build` and updated [src/tools.js](../../src/tools.js).
  - **Ecosystem Seeds**: Marked `SEED_EXPERTS` & `SEED_TEMPLATES` with `isDummyData`/`isBotCreated`, prefixed demo titles/names/certificates (`DEMO-BOT-*`), and rendered 🤖 Bot-Created callouts + badges in [api/ecosystem.js](../../api/ecosystem.js) and [src/pages/Ecosystem.jsx](../../src/pages/Ecosystem.jsx).
  - **Blog, Passbooks, FX, Referral & Contributors**: Standardized `author` to `🤖 VnSavingPro AI Bot` in [src/data/blogData.js](../../src/data/blogData.js) + badges in [src/pages/Blog.jsx](../../src/pages/Blog.jsx); badged sample passbooks in [src/components/ActivePassbooksTracker.jsx](../../src/components/ActivePassbooksTracker.jsx), starter FX holdings in [src/pages/FxManager.jsx](../../src/pages/FxManager.jsx), placeholder referral codes in [src/pages/Rates.jsx](../../src/pages/Rates.jsx), and placeholder community groups in [src/data/contributorsData.js](../../src/data/contributorsData.js) & [src/pages/Contributors.jsx](../../src/pages/Contributors.jsx).

---

## [2026-11-24] — Version 2.2.0.0: Batch 1 & 2 — Real Passbooks Tracker (.ics), 360° Unified Net Worth, CIC Credit & 2-Stage Home Loan (`/cic`) & Interactive Blog Widgets

- **Request**: Implement Batch 1 & Batch 2 from the v2.2 roadmap (`ACTIVE_PASSBOOKS_STATE` + `.ics` calendar, 360° Unified Net Worth card, server-backed Blog mini-calculators, and `/cic` Credit Health + Passbook Pledge + 2-Stage Mortgage vs. Rent simulator).
- **Changes Implemented**:
  - **Version Bump (`v2.2.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), [src/tools.js](../../src/tools.js) (adding `/cic` route & trilingual `v2.2.0.0` highlights), and [src/App.jsx](../../src/App.jsx).
  - **Server-Only CIC & 2-Stage Loan Engine**: Created [api/_lib/cicAndLoanVietnam.js](../../api/_lib/cicAndLoanVietnam.js) and wired `action: 'cic_loan_bundle'` into [api/calculate.js](../../api/calculate.js) & `'cic'` into [api/history.js](../../api/history.js) (`0` new Vercel Serverless Functions, staying at `10 / 12`).
  - **Storage & Backup Schema**: Added `ACTIVE_PASSBOOKS_STATE` & `CIC_LOAN_STATE` schema validators in [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js), state helpers in [src/utils/apiClient.js](../../src/utils/apiClient.js), and Cloud/JSON backup support in [src/components/DataModal.jsx](../../src/components/DataModal.jsx).
  - **Frontend Modules**: Built [src/pages/CicLoanSimulator.jsx](../../src/pages/CicLoanSimulator.jsx), [src/components/ActivePassbooksTracker.jsx](../../src/components/ActivePassbooksTracker.jsx) (with `.ics` calendar export), and [src/components/UnifiedNetWorthCard.jsx](../../src/components/UnifiedNetWorthCard.jsx), integrated into [src/pages/Profile.jsx](../../src/pages/Profile.jsx) and [src/pages/Planner.jsx](../../src/pages/Planner.jsx); added server-backed `<InlineBlogWidget />` to [src/pages/Blog.jsx](../../src/pages/Blog.jsx).

---

## [2026-11-24] — Version 2.1.0.0: Digital Bank Security & Account-Opening Perks, Financial Blog (`/blog`) & v2.0 Stability Hardening

- **Request**: Add Digital Bank Security & Account-Opening Offers ("bảo mật và ưu đãi mở tài khoản của các ngân hàng số") plus a Financial Blog (`/blog`), alongside fixes from the `v2.0.0.0` audit.
- **Changes Implemented**:
  - **Version Bump (`v2.1.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), and prepended trilingual `v2.1.0.0` release highlights + `/blog` & `/referral` routes in [src/tools.js](../../src/tools.js) and [src/App.jsx](../../src/App.jsx).
  - **Digital Bank Security & Account Perks**: Created [src/data/bankSecurityAndPerksData.js](../../src/data/bankSecurityAndPerksData.js) (4 legal/technical safeguards: SBV parent commercial bank licenses, Deposit Insurance DIV, SBV Decision 2345 NFC chip-ID biometrics & Smart OTP, Closed-Loop Principal Settlement; per-bank welcome bonus specs & 4-step eKYC onboarding; 5-step user security self-check) and built Tab 3 (`security_perks`) inside [src/pages/Rates.jsx](../../src/pages/Rates.jsx) with 1-click referral copy, QR toggle, editable `CUSTOM_REFERRAL_CODES` storage, and interactive security score checklist.
  - **Financial Knowledge & Strategy Blog (`/blog`)**: Created [src/data/blogData.js](../../src/data/blogData.js) & lazy-loaded [src/pages/Blog.jsx](../../src/pages/Blog.jsx) with 7 trilingual (`VI/EN/JA`) deep-dive guides across 4 categories, keyword search, bookmarking, key-takeaway highlights, comparison tables, direct tool CTAs, and Homepage spotlight in [src/pages/Home.jsx](../../src/pages/Home.jsx).
  - **v2.0 Post-Audit Fixes & Advisor SQL**:
    - Fixed user-published `tpl_<uuid>` template persistence in [api/ecosystem.js](../../api/ecosystem.js) (`!SEED_TEMPLATE_IDS.has(templateId)`).
    - Added 2-way `sync_steward_snapshot` in [api/ecosystem.js](../../api/ecosystem.js), `syncStewardMandateSnapshot` in [src/utils/apiClient.js](../../src/utils/apiClient.js), and `"Đồng bộ lên hồ sơ"` in [src/pages/Ecosystem.jsx](../../src/pages/Ecosystem.jsx).
    - Fixed Tab 2 (`social_benefits`) history restore in [src/pages/SalaryInsurance.jsx](../../src/pages/SalaryInsurance.jsx).
    - Included `FX_PORTFOLIO_STATE` & `SALARY_STATE` in Cloud Share Codes and JSON backups in [src/components/DataModal.jsx](../../src/components/DataModal.jsx).
    - Added [supabase/migrations/20261124_v210_advisor_hardening.sql](../../supabase/migrations/20261124_v210_advisor_hardening.sql).

---

## [2026-11-23] — Version 2.0.0.0: Personal, Couple & Family Wealth Platform (4 Roles, Community Cloning, Live FX Manager & Vietnam 2026 Payroll/PIT/BHXH)

- **Request**: Reposition VnSavingPro as a Personal, Couple & Family Wealth Management Platform with 4 user roles/journeys (`Individual` with Couple-switching and Couple→Family upgrades, `Verified Financial Expert`, `Community-Voted Planner` with cloneable realistic templates — also earnable by Experts, and `Financial Steward`), upgraded Digital Bank Savings tools, an FX Exchange Rate Management suite, and a Vietnam 2026 Statutory Payroll / PIT / Social Insurance suite.
- **Changes Implemented**:
  - **Major Version Bump (`v2.0.0.0`)**: Ran `node scripts/bump-version.js major`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), [index.html](../../index.html), and [src/tools.js](../../src/tools.js) (adding `/fx`, `/salary`, `/ecosystem` routes + trilingual metadata & `v2.0.0.0` highlights).
  - **Database Schema (`supabase/`)**: Created [supabase/migrations/20261123_v200_wealth_platform.sql](../../supabase/migrations/20261123_v200_wealth_platform.sql) & mirrored in [supabase/schema.sql](../../supabase/schema.sql) (extending `profiles` & `calculation_history` and adding RLS-hardened `household_spaces`, `community_plan_templates`, `community_template_votes`, and `steward_mandates`); updated [AuthContext.jsx](../../src/contexts/AuthContext.jsx) with graceful fallback column loading.
  - **Serverless Engines & Endpoints (`10 / 12` Vercel Free-Tier Functions)**:
    - Built FX engine ([fxRatesCache.js](../../api/_lib/fxRatesCache.js), [fxCalculator.js](../../api/_lib/fxCalculator.js), [api/fx.js](../../api/fx.js)) pulling Vietcombank XML with `s-maxage=900` Edge caching and VND deposit hurdle comparisons.
    - Built Vietnam 2026 statutory engine ([salaryVietnam.js](../../api/_lib/salaryVietnam.js)) covering `2026_H2` (`NQ 110/2025`, 5-bracket `Luật 109/2025`, `NĐ 161/2026`, `NĐ 293/2025`, `Luật BHXH 41/2024`, `Luật Việc làm 74/2025`), `2027` forecast (`NĐ 399/2026`), and `2025` legacy comparison, wired via [api/calculate.js](../../api/calculate.js) & [api/history.js](../../api/history.js).
    - Built Ecosystem hub ([api/ecosystem.js](../../api/ecosystem.js)) handling templates, realism voting, 1-click cloning, Verified Expert applications, Couple switching / Couple→Family upgrades, and Financial Steward mandates; registered routes in [vite.config.js](../../vite.config.js).
  - **Frontend Suites, Profile Lifecycle & Navigation**: Created [FxManager.jsx](../../src/pages/FxManager.jsx), [SalaryInsurance.jsx](../../src/pages/SalaryInsurance.jsx), and [Ecosystem.jsx](../../src/pages/Ecosystem.jsx); updated [App.jsx](../../src/App.jsx), [cryptoStorage.js](../../src/utils/cryptoStorage.js), [apiClient.js](../../src/utils/apiClient.js), [Layout.jsx](../../src/components/Layout.jsx), [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx), [Home.jsx](../../src/pages/Home.jsx), and [Profile.jsx](../../src/pages/Profile.jsx) (`v2.0` roles, Couple/Family lifecycle buttons, `fx`/`salary` history tabs).

---

## [2026-11-23] — Version 1.12.0.0: Streamlined Header, Branded Splash Screen, 3-Step Onboarding, Collaborative Household Planning & CIC/Advisor Roadmap

- **Request**: Hide manual screen-mode selector UI, streamline cluttered header while highlighting key tools, add a branded initial entry loading splash screen, remove repetitive planning CTAs on Homepage, add partner/family collaborative planning inside Profile, design a structured 3-step onboarding flow, plan CIC credit scoring, and plan a financial advisor/butler connector backed by Vietnam market research.
- **Changes Implemented**:
  - **Version Bump (`v1.12.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), and prepended `v1.12.0.0` highlights in [src/tools.js](../../src/tools.js) (`vi`/`en`/`ja`).
  - **Silent Adaptive Layout**: Updated [DisplayModeContext.jsx](../../src/layout/DisplayModeContext.jsx) so manual overrides require explicit QA `?layout=` / `?posture=` query params, removed `DisplayModeSwitcher` and manual layout pills from [Layout.jsx](../../src/components/Layout.jsx) (`TopNav`, `LayoutModeBanner`, `MobileTabBar`, `Footer`), removed the layout card from [Profile.jsx](../../src/pages/Profile.jsx), and updated screen-mode copy in [Home.jsx](../../src/pages/Home.jsx).
  - **Streamlined Header + Flagship Spotlights ([Layout.jsx](../../src/components/Layout.jsx))**: Consolidated Desktop/Duo/Tablet headers to 3 featured links (`Lập kế hoạch` gradient spotlight, `Lãi suất` live 12M yield badge, `Tính lãi`), moved remaining items + Onboarding + Data actions into `Khám phá` (`MoreMenu`), `UserMenu`, and `MobileTabBar` sheet.
  - **Branded Entry Splash & 3-Step Onboarding**: Built [SplashScreen.jsx](../../src/components/SplashScreen.jsx) (`z-[95]`, reduced-motion aware), built [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx) (`Profile -> Goal -> Starter Figures`), added `ONBOARDING_STATE` + fixed `raw` variable bug in [cryptoStorage.js](../../src/utils/cryptoStorage.js), added `OPEN_ONBOARDING_EVENT` / `applyOnboardingStarter` (aligned with `PLANNER_STATE` keys) in [apiClient.js](../../src/utils/apiClient.js), and wired gentle auto-launch in [App.jsx](../../src/App.jsx).
  - **Homepage CTA Deduplication ([Home.jsx](../../src/pages/Home.jsx))**: Replaced Hero primary button with `"Thiết lập nhanh trong 30 giây"`, individualized Household card CTAs and primary Toolkit card CTAs, and highlighted `plan` (`Nổi bật`) & `rates` (top 12M %).
  - **Collaborative Household Planning (Couples & Families)**: Added `public.household_collaborations` DDL & hardened RLS in [20261123_v112_collaborative_planning.sql](../../supabase/migrations/20261123_v112_collaborative_planning.sql) & [schema.sql](../../supabase/schema.sql), added `sbPatch` in [api/_lib/supabase.js](../../api/_lib/supabase.js), built [api/collaborations.js](../../api/collaborations.js) & registered in [vite.config.js](../../vite.config.js), and added guest invite preview + full invite/accept/sync/revoke UI in [Profile.jsx](../../src/pages/Profile.jsx).
  - **Strategic CIC & Vietnam Advisor Roadmap**: Authored [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md) detailing the `/cic` estimator (5 weights, 403–706 / Rank 1–10, Debt Groups 1–5, Decree 13 PII safety) and verified Vietnam market landscape (`FIDT`, `AFA Capital`, `FinPeace`, `TOPI`, `MoneyGain`, `VWA/VWAS`, `Private Banking`) + `/advisors` connector architecture.

---

## [2026-11-23] — Version 1.11.0.0: Free-Tier Cost Optimization, -40%+ Entry JS Bundle, Hardened RLS & Anti-Pause Infrastructure

- **Request**: Audit entire infrastructure, architecture, and MCP connections, then execute a 4-phase upgrade minimizing Free-Tier cost and maximizing performance/security.
- **Changes Implemented**:
  - **Version Bump (`v1.11.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), and [src/tools.js](../../src/tools.js).
  - **Phase 1 — Vercel & Supabase Free-Tier Invocation Savings**: Created bounded [api/_lib/rateLimit.js](../../api/_lib/rateLimit.js) protecting [calculate.js](../../api/calculate.js), [feedback.js](../../api/feedback.js), [plans.js](../../api/plans.js), and [history.js](../../api/history.js); tuned [quotaGuard.js](../../api/_lib/quotaGuard.js) to 5-minute snapshot caching + 50-hit batched increments; upgraded [api/rates.js](../../api/rates.js) to `s-maxage=86400, stale-while-revalidate=604800` with `pocValidationReached` and server-computed `defaultQuickEstimate` (`vi`/`en`/`ja`); cached non-admin [api/quota-status.js](../../api/quota-status.js) (`s-maxage=300`); removed redundant `/api/quota-status` mount call in [App.jsx](../../src/App.jsx) and avoided mount `/api/calculate` calls on `/` via seeded defaults in [state.jsx](../../src/state.jsx), [apiClient.js](../../src/utils/apiClient.js), and [Home.jsx](../../src/pages/Home.jsx).
  - **Phase 2 — Database Security, Retention Caps & 5-Day Keepalive**: Authored [supabase/migrations/20261123_v111_security_and_history.sql](../../supabase/migrations/20261123_v111_security_and_history.sql) & tightened [supabase/schema.sql](../../supabase/schema.sql) (adding `calculation_history`, revoking `anon` direct Data API table access on `saved_plans`/`user_feedback`, dropping unused `idx_bank_rate_snapshots_updated_date`); enforced admin Bearer authorization on raw `GET /api/feedback` + `s-maxage=300` on `?public=1`; added 50-row/user cap in [api/history.js](../../api/history.js) & 24-row snapshot cap in [liveRatesCache.js](../../api/_lib/liveRatesCache.js); added [.github/workflows/keepalive-supabase.yml](../../.github/workflows/keepalive-supabase.yml) pinging `/api/rates?keepalive=1` every 5 days.
  - **Phase 3 — Bundle Size Reduction (`-40%+`) & Rendering Speed**: Refactored [supabaseClient.js](../../src/utils/supabaseClient.js), [AuthContext.jsx](../../src/contexts/AuthContext.jsx), and [AuthModal.jsx](../../src/components/AuthModal.jsx) to dynamically import `@supabase/supabase-js` into its own `supabase` chunk ([vite.config.js](../../vite.config.js)) and defer `/auth/v1/settings` OAuth probing until auth UI opens; deferred GTM injection behind cookie consent & idle scheduling in [index.html](../../index.html), [cookieManager.js](../../src/utils/cookieManager.js), and [App.jsx](../../src/App.jsx); added 1-year `immutable` caching on `/assets/(.*)` in [vercel.json](../../vercel.json).
  - **Phase 4 — Unified Cron & Node 24 LTS Cleanup**: Upgraded [.github/workflows/daily-rates-sync.yml](../../.github/workflows/daily-rates-sync.yml) to **Node 24 LTS** + Supabase secrets env support, removed duplicate `"crons"` from [vercel.json](../../vercel.json), updated [scripts/scrape-all.js](../../scripts/scrape-all.js), pinned `"engines": { "node": "24.x" }` in [package.json](../../package.json), deleted legacy Cloudflare configs (`wrangler.jsonc`, `public/_redirects`, `public/_headers`), and ignored `unikorn-assets/` in [.gitignore](../../.gitignore).

---

## [2026-11-23] — Version 1.10.0.0: Monthly 1st Rate Sync, Explicit Run CTA + Lazy Loading, Profile Run History & Guest Save Prompt

- **Request**: Switch digital bank rate sync cadence to once a month at the start of the month, add an explicit Run CTA whenever input fields change across calculation tools with a lazy-loading effect during computation, store previous Planner/tool runs inside authenticated Profile history with reload capability, and display an inviting save CTA for guest users.
- **Changes Implemented**:
  - **Version Bump (`v1.10.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), and prepended `v1.10.0.0` highlights in [src/tools.js](../../src/tools.js) (`vi`/`en`/`ja`).
  - **Monthly Day-1 Rate Sync (`0 2 1 * *`)**: Updated cron schedules & copy in [vercel.json](../../vercel.json), [.github/workflows/daily-rates-sync.yml](../../.github/workflows/daily-rates-sync.yml), [scripts/register-daily-9am-task.ps1](../../scripts/register-daily-9am-task.ps1) (monthly Day-1 `schtasks`), [api/rates.js](../../api/rates.js) (`syncSchedule: 'monthly_day_1'`, 1h CDN cache), [api/cron/sync-rates.js](../../api/cron/sync-rates.js), [api/_lib/liveRatesCache.js](../../api/_lib/liveRatesCache.js) (1h server TTL), [index.html](../../index.html), [Home.jsx](../../src/pages/Home.jsx), [Rates.jsx](../../src/pages/Rates.jsx), [DataModal.jsx](../../src/components/DataModal.jsx), [ui.jsx](../../src/components/ui.jsx) (`RateDisclaimer`), and [Contributors.jsx](../../src/pages/Contributors.jsx).
  - **Explicit Run CTA & Lazy Loading (`useServerCalc` Manual Mode)**: Upgraded [src/utils/apiClient.js](../../src/utils/apiClient.js) with `mode: 'manual'`, `isDirty`, `run()`, `minLoadingMs: 320`, and `onSuccess`; added `CalculationLoader` in [src/components/ui.jsx](../../src/components/ui.jsx); enhanced `WorkspaceSplit` & `StickyResultBar` in [src/components/AdaptiveLayout.jsx](../../src/components/AdaptiveLayout.jsx) with `runAction` sticky footer CTA & top dirty-results banner across all 4 screen modes; integrated across [Planner.jsx](../../src/pages/Planner.jsx), [Calculator.jsx](../../src/pages/Calculator.jsx), [Ladder.jsx](../../src/pages/Ladder.jsx), [Career.jsx](../../src/pages/Career.jsx), and [Inflation.jsx](../../src/pages/Inflation.jsx) while keeping `Home.jsx` `QuickEstimate` live in `auto` mode.
  - **Profile Run History, Guest Save Prompt & Supabase Persistence**: Defined `public.calculation_history` DDL + indexes + `(select auth.uid())` RLS policies in [supabase/schema.sql](../../supabase/schema.sql), implemented authenticated `GET`/`POST`/`DELETE /api/history` in [api/history.js](../../api/history.js) + [vite.config.js](../../vite.config.js), added encrypted `CALC_HISTORY_LOG` & `TOOL_RESTORE_STATE` validation in [cryptoStorage.js](../../src/utils/cryptoStorage.js), built [SavePlanPromptCard.jsx](../../src/components/SavePlanPromptCard.jsx), wired `OPEN_AUTH_EVENT` & login history cloud sync in [App.jsx](../../src/App.jsx), and upgraded [Profile.jsx](../../src/pages/Profile.jsx) with tool-filtered Run History cards (*Mở lại* / *Xoá*) and the guest Save CTA.

---

## [2026-11-20] — Version 1.9.0.0: Swipeable Stage Explorer, Contributors Hall of Fame (`/contributors`) & Unikorn Showcase

- **Request**: Allow users to slide or swipe left/right through yearly milestones inside Stage Details & Portfolio, build a dedicated page honoring community feedback contributors, embed the official Unikorn badge in Footer, and feature a Unikorn community & support section on Home (`https://unikorn.vn/p/vnsavingpro`).
- **Changes Implemented**:
  - **Version Bump & Routing (`v1.9.0.0`)**: Ran `node scripts/bump-version.js minor`, updated [src/version.json](../../src/version.json), [package.json](../../package.json), and registered `/contributors` (`aliases`: `/vinh-danh`, `/cong-dong`, `/dong-gop`, `/hall-of-fame`) plus trilingual `VERSION_HIGHLIGHTS` in [src/tools.js](../../src/tools.js) and [src/App.jsx](../../src/App.jsx).
  - **Swipeable / Slidable Stage Timeline**: Created [src/components/StageCarousel.jsx](../../src/components/StageCarousel.jsx) (`StageCarousel` with horizontal snap/touch swipe, desktop pointer drag-scroll, left/right chevron buttons, continuous year scrubber slider & keyboard arrows; plus `SwipeableStageBody` with swipe-safe table guard) and integrated into [Planner.jsx](../../src/pages/Planner.jsx) (`RoadmapPackageExplorer`) and [Ladder.jsx](../../src/pages/Ladder.jsx) (`LadderPackageExplorer`).
  - **Privacy-Safe Opt-In Public Feedback**: Extended [api/feedback.js](../../api/feedback.js) (`GET /api/feedback?public=1` returning only `{ id, name, url, tool, toolLabel, rating, tags, comment, createdAt }` for `showPublicly === true` rows while stripping all financial figures), [cryptoStorage.js](../../src/utils/cryptoStorage.js), and [FeedbackWidget.jsx](../../src/components/FeedbackWidget.jsx).
  - **Contributors Hall of Fame & Unikorn Integration**: Created [src/data/contributorsData.js](../../src/data/contributorsData.js) and [src/pages/Contributors.jsx](../../src/pages/Contributors.jsx) (`Contributors` Hall of Fame, feedback-to-shipped timeline, opt-in contribution form, and Unikorn card), embedded the official `256×64` Unikorn badge in `Footer` ([Layout.jsx](../../src/components/Layout.jsx)), and added the **Live on Unikorn.vn** showcase section on [Home.jsx](../../src/pages/Home.jsx) (Feedback input, Clap, Review, Support & Donate).

---

## [2026-11-20] — Version 1.8.0.0: Unified Adaptive Multi-Screen Layout System (Mobile · Tablet · Duo/Fold · Desktop)

- **Request**: Unify the UI layout across Mobile, Tablet, and PC/Desktop with a shared adaptive layout system that propagates changes consistently across all screens, and add explicit Duo / Foldable support (similar to iPhone Duo/Fold, Samsung Galaxy Z Fold, Pixel Fold, Surface Duo).
- **Changes Implemented**:
  - **Version Bump (`v1.8.0.0`)**: Ran `node scripts/bump-version.js minor` updating [src/version.json](../../src/version.json), [package.json](../../package.json), and prepended `v1.8.0.0` release highlights in [src/tools.js](../../src/tools.js) (`vi`, `en`, `ja`).
  - **Adaptive Display & Foldable Detection Engine**: Created [src/layout/DisplayModeContext.jsx](../../src/layout/DisplayModeContext.jsx) (`DisplayModeProvider`, `useDisplayMode`, pure `detectViewportMetrics()`) supporting `Auto | Mobile | Tablet | Duo / Fold | Desktop` selection plus `Auto | Book | Flex / Tabletop` Duo postures, automatic W3C Viewport Segments / foldable inner-screen detection (`<=390px` cover-screen tuning), CSS variable & `data-layout-*` synchronization, and cookie/localStorage persistence ([cookieManager.js](../../src/utils/cookieManager.js)).
  - **Foldable CSS & Unified Layout Primitives**: Added W3C `@media (horizontal-viewport-segments: 2)` / `(vertical-viewport-segments: 2)`, `.duo-book-grid`, `.duo-hinge-vertical`, `.duo-hinge-horizontal`, and `.duo-pane-scroll` in [src/index.css](../../src/index.css); created [src/components/AdaptiveLayout.jsx](../../src/components/AdaptiveLayout.jsx) (`PageContainer`, `WorkspaceSplit`, `DualPaneSection`, `AdaptiveGrid`, `StickyResultBar`).
  - **Adaptive Shell, Navigation, Modals & Toasts**: Updated [src/components/Layout.jsx](../../src/components/Layout.jsx) (`DisplayModeSwitcher`, `LayoutModeBanner`, `TabletToolBar`, hinge-safe Duo Book `TopNav`, updated `MobileTabBar` & `Footer`), [src/components/ui.jsx](../../src/components/ui.jsx) (mode-aware `Modal` bottom sheet vs. right-pane Duo Book docking, `MoneyField`, `PageHeader`, skeletons), [src/state.jsx](../../src/state.jsx) (`ToastViewport`), and [src/App.jsx](../../src/App.jsx) (`DisplayModeProvider`, constrained preview frame).
  - **All Pages Migrated to Unified Primitives**: Updated [Home.jsx](../../src/pages/Home.jsx), [Planner.jsx](../../src/pages/Planner.jsx), [Calculator.jsx](../../src/pages/Calculator.jsx), [Ladder.jsx](../../src/pages/Ladder.jsx), [Career.jsx](../../src/pages/Career.jsx), [Inflation.jsx](../../src/pages/Inflation.jsx), [Rates.jsx](../../src/pages/Rates.jsx), and [Profile.jsx](../../src/pages/Profile.jsx).

---

## [2026-11-19] — Version 1.7.0.0: Full 3-Language Support (Tiếng Việt · English · 日本語)

- **Request**: Support 3 languages (`vi` Vietnamese, `en` English, `ja` Japanese) directly across the entire VnSavingPro web app and serverless calculation responses.
- **Changes Implemented**:
  - **Version Bump (`v1.7.0.0`)**: Ran `node scripts/bump-version.js minor` updating [src/version.json](../../src/version.json), [package.json](../../package.json), and prepended `v1.7.0.0` entry in [src/tools.js](../../src/tools.js) (`getLocalizedTools`, `getLocalizedPageTitle`, `getLocalizedVersionLabel`, `getLocalizedVersionHighlights`).
  - **Client i18n Engine, Formatting & Fonts**: Created [src/i18n/index.jsx](../../src/i18n/index.jsx) (`I18nProvider`, `useI18n`, `tx(vi, en, ja)`, `formatTenure`, `getBankCopy`, synced via `localStorage` `vnsaving_lang`, `?lang=`, `vnsaving_prefs` cookie, and `<html lang>`), updated [src/index.css](../../src/index.css) with Japanese font fallbacks (`Hiragino Sans`, `Yu Gothic UI`, `Meiryo`), and localized [src/utils/format.js](../../src/utils/format.js) (`tỷ/triệu` vs `B/M/K` vs `億/万`, `duration`, `formatTenure`, `pct`), [src/utils/cookieManager.js](../../src/utils/cookieManager.js), and [src/utils/googleDocsExporter.js](../../src/utils/googleDocsExporter.js).
  - **Server-Side API Localization (`api/`)**: Updated [src/utils/apiClient.js](../../src/utils/apiClient.js) (`lang` query/payload propagation and cache key isolation) and localized [api/calculate.js](../../api/calculate.js), [api/_lib/calculator.js](../../api/_lib/calculator.js), [api/_lib/householdAnalytics.js](../../api/_lib/householdAnalytics.js), and [api/_lib/feasibilityEvaluator.js](../../api/_lib/feasibilityEvaluator.js) for `vi`, `en`, and `ja` without exposing calculation logic to the client bundle.
  - **Shell, Components & Pages**: Wrapped [src/App.jsx](../../src/App.jsx) in `I18nProvider`, added `LanguageSwitcher` (`VI | EN | JA`) in [Layout.jsx](../../src/components/Layout.jsx) (Desktop top bar, Mobile `Thêm` sheet, Footer), updated [src/state.jsx](../../src/state.jsx) document titles, and localized all components ([ui.jsx](../../src/components/ui.jsx), [HouseholdModeSwitch.jsx](../../src/components/HouseholdModeSwitch.jsx), [HouseholdInsightsCard.jsx](../../src/components/HouseholdInsightsCard.jsx), [BankPicker.jsx](../../src/components/BankPicker.jsx), [GrowthChart.jsx](../../src/components/GrowthChart.jsx), [DataModal.jsx](../../src/components/DataModal.jsx), [AuthModal.jsx](../../src/components/AuthModal.jsx), [CookieBanner.jsx](../../src/components/CookieBanner.jsx), [FeedbackWidget.jsx](../../src/components/FeedbackWidget.jsx), [PocValidationOverlay.jsx](../../src/components/PocValidationOverlay.jsx)) and all pages ([Home.jsx](../../src/pages/Home.jsx), [Planner.jsx](../../src/pages/Planner.jsx), [Rates.jsx](../../src/pages/Rates.jsx), [Calculator.jsx](../../src/pages/Calculator.jsx), [Ladder.jsx](../../src/pages/Ladder.jsx), [Career.jsx](../../src/pages/Career.jsx), [Inflation.jsx](../../src/pages/Inflation.jsx), [Auth.jsx](../../src/pages/Auth.jsx), [Profile.jsx](../../src/pages/Profile.jsx)).

---

## [2026-11-19] — Version 1.6.0.0: Homepage Refresh, Mobile/Tablet/PC Responsive UX & 4-Part Auto-Versioning

- **Request**: Refresh Homepage content to reflect current capabilities, polish responsive UI/UX across Mobile browsers, Tablets, and PC/Desktop, set app version to `1.6.0.0`, and enforce automatic version bumping on every small update.
- **Changes Implemented**:
  - **4-Part Versioning & Rule**: Created [src/version.json](../../src/version.json) (`1.6.0.0`), [scripts/bump-version.js](../../scripts/bump-version.js), added `appVersion` + `version:bump` in [package.json](../../package.json), wired `src/version.json` into [src/tools.js](../../src/tools.js) with updated `VERSION_HIGHLIGHTS` (`v1.6.0.0`, `v1.5.5`) and `ALL_TOOLS` descriptions, and added Mandatory App Versioning Rule to [AGENTS.md](../../AGENTS.md).
  - **Homepage Refresh**: Updated [src/pages/Home.jsx](../../src/pages/Home.jsx), [index.html](../../index.html), and [src/App.jsx](../../src/App.jsx) with compact `HouseholdModeSwitch` + 4 savings presets in `QuickEstimate`, dedicated 3-mode Household showcase (`Cá nhân`, `Cặp đôi`, `Gia đình`), auto-sync `09:00` badges, and a modernized *Bảo mật, Đồng bộ Cloud & Báo cáo* section with Google/Email Auth and Cloud backup actions.
  - **Responsive UI/UX**: Updated [src/index.css](../../src/index.css) (`overflow-x: clip`, coarse-pointer slider thumbs, `prefers-reduced-motion`), [ui.jsx](../../src/components/ui.jsx) (`MoneyField` mobile stacking, `text-base sm:text-sm` inputs preventing iOS zoom, `overscroll-x-contain` tables, `max-h-[90dvh]` modal bottom-sheet handle), [Layout.jsx](../../src/components/Layout.jsx) (uncluttered tablet header, mobile quick-action `"Thêm"` sheet with account/Cloud/version access, `pb-36 md:pb-20 lg:pb-0` footer clearance), [state.jsx](../../src/state.jsx) (`bottom-36` toast), [HouseholdModeSwitch.jsx](../../src/components/HouseholdModeSwitch.jsx), [HouseholdInsightsCard.jsx](../../src/components/HouseholdInsightsCard.jsx), [DataModal.jsx](../../src/components/DataModal.jsx), [AuthModal.jsx](../../src/components/AuthModal.jsx), [FeedbackWidget.jsx](../../src/components/FeedbackWidget.jsx), and pages ([Planner.jsx](../../src/pages/Planner.jsx), [Calculator.jsx](../../src/pages/Calculator.jsx), [Ladder.jsx](../../src/pages/Ladder.jsx), [Rates.jsx](../../src/pages/Rates.jsx), [Career.jsx](../../src/pages/Career.jsx), [Inflation.jsx](../../src/pages/Inflation.jsx), [Profile.jsx](../../src/pages/Profile.jsx)).

---

## [2026-11-19] — Deep Individual / Couple / Family Planning (`Cá nhân` | `Cặp đôi` | `Gia đình`)

- **Request**: Expand financial calculations to support Individual, Couple, and Family modes across Planner, Ladder, Career, Profile, and exports, covering both Basic and Pro details, per-earner contribution splits, stress tests, and Parallel + Fund-First Emergency Fund modes.
- **Changes Implemented**:
  - **Database & Profile**: Applied Supabase migration `add_household_profile_pref` (`profiles.default_household_mode`), synced [supabase/schema.sql](../../supabase/schema.sql), [AuthContext.jsx](../../src/contexts/AuthContext.jsx), [Profile.jsx](../../src/pages/Profile.jsx), and extended `PLANNER_STATE` validation in [cryptoStorage.js](../../src/utils/cryptoStorage.js).
  - **Server-Only Financial Engine**: Created [householdAnalytics.js](../../api/_lib/householdAnalytics.js) (`computeHouseholdAnalysis`, Emergency Fund fill simulator, 2-earner contribution split, breadwinner stress test); extended [calculator.js](../../api/_lib/calculator.js) (`prioritizeEmergencyFund` Fund-First two-phase simulation for `TIME` & binary-searched `SAVING` + dual-earner `calculateCareerGrowthImpact`), [feasibilityEvaluator.js](../../api/_lib/feasibilityEvaluator.js), and [api/calculate.js](../../api/calculate.js).
  - **Frontend Experience**: Created [HouseholdModeSwitch.jsx](../../src/components/HouseholdModeSwitch.jsx) & [HouseholdInsightsCard.jsx](../../src/components/HouseholdInsightsCard.jsx), and integrated across [Planner.jsx](../../src/pages/Planner.jsx) (both Basic & Advanced inputs, 2-earner inputs, dependents, split rule, Fund-First toggle), [Ladder.jsx](../../src/pages/Ladder.jsx) (household liquidity coverage & partner split), [Career.jsx](../../src/pages/Career.jsx) (dual-earner salary & growth toggle), and [googleDocsExporter.js](../../src/utils/googleDocsExporter.js).

---

## [2026-11-19] — Live Google OAuth Enabled & Verified via Supabase Management API

- **Request**: Configure Google OAuth Client ID & Secret, Redirect URLs, and Vietnamese Auth email templates on live Supabase project `gvgyztwpjvjvztwhwnue`.
- **Changes & Verification**:
  - Updated Supabase project Auth config via `PATCH /v1/projects/gvgyztwpjvjvztwhwnue/config/auth`: enabled `external_google_enabled: true`, configured `site_url` (`https://vnsavingpro.vercel.app`) & `uri_allow_list` (`https://vnsavingpro.vercel.app/**,http://localhost:3000/**`), and applied Vietnamese confirmation & password recovery email subjects/HTML templates ([confirm-signup.html](../../supabase/email-templates/confirm-signup.html), [reset-password.html](../../supabase/email-templates/reset-password.html)).
  - Verified live `/auth/v1/settings` (`external.google === true`) and `GET /auth/v1/authorize?provider=google&redirect_to=https://vnsavingpro.vercel.app/auth` returns HTTP `302` redirecting to `https://accounts.google.com/o/oauth2/v2/auth`.

---

## [2026-11-19] — Google OAuth PKCE Hardening & Live Auth Audit

- **Request**: Inspect and harden Google Sign-In / Sign-Up OAuth setup.
- **Findings & Changes Implemented**:
  - Audited live `https://gvgyztwpjvjvztwhwnue.supabase.co/auth/v1/settings`: verified `external.email: true`, `disable_signup: false`, while `external.google` is `false` (awaiting Google Client ID/Secret on Supabase Dashboard).
  - Upgraded [src/utils/supabaseClient.js](../../src/utils/supabaseClient.js) to `flowType: 'pkce'`.
  - Upgraded [src/contexts/AuthContext.jsx](../../src/contexts/AuthContext.jsx): added live `googleEnabled` probe (`/auth/v1/settings`), dedicated `${origin}/auth` callback redirect with `prompt: 'select_account'`, and `sessionStorage` return-path restoration (`consumeAuthReturnPath`).
  - Upgraded [src/components/AuthModal.jsx](../../src/components/AuthModal.jsx) & [src/pages/Auth.jsx](../../src/pages/Auth.jsx): dynamic sign-in/sign-up Google CTA label, live activation notice when `googleEnabled === false`, PKCE `?code=` exchange spinner, and OAuth callback error handling.

---

## [2026-11-19] — Free-Tier Audit Verification, 80%/90%/95% Resend Alerts & POC Validation Phase Lock

- **Request**: Verify all packages & infrastructure stay strictly on Free Tier, alert owner email (`tranlinhmarcus2406@gmail.com`) via Resend at 80%, 90%, 95%, and 100% quota thresholds, and show a respectful POC Validation Phase screen when any quota hits its cap.
- **Changes Implemented**:
  - **Infrastructure Audit**: Confirmed Vercel team `phaheviet` is on **Hobby (Free)** (`excessBillingEnabled: false`), Supabase org `marcustranvnnb` is on **Free Tier** (`~11 MB / 500 MB`, `0 / 50,000 MAU`), and all `package.json` packages are open-source MIT/ISC.
  - **Supabase Migration (`add_free_tier_quota_guardian`)**: Added `public.usage_quotas`, `public.quota_alerts_log` (deduplication), and `service_role`-only RPCs `increment_quota_counter()` & `get_free_tier_usage_snapshot()` (`0` security advisor lints).
  - **Quota Guardian & Resend Alerts**: Created [api/_lib/quotaGuard.js](../../api/_lib/quotaGuard.js) & [api/quota-status.js](../../api/quota-status.js), upgraded [api/_lib/resend.js](../../api/_lib/resend.js) (`getOwnerAlertEmail`, auto-normalizing free webmail sender domains to `onboarding@resend.dev`, `sendOwnerQuotaAlertEmail`) & [api/_lib/supabase.js](../../api/_lib/supabase.js) (`sbRpc`), and guarded `api/calculate.js`, `api/rates.js`, `api/plans.js`, `api/feedback.js`, and `api/cron/sync-rates.js`.
  - **User-Facing POC Validation Phase Screen**: Created [src/components/PocValidationOverlay.jsx](../../src/components/PocValidationOverlay.jsx) and wired HTTP `503 POC_QUOTA_REACHED` detection across [src/utils/apiClient.js](../../src/utils/apiClient.js) and [src/App.jsx](../../src/App.jsx) (with `?preview_poc=1` preview support and JSON local backup access).
  - **Vercel Env Sync**: Configured `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `OWNER_ALERT_EMAIL` on Vercel project `vnsavingpro`.

---

## [2026-11-19] — Resend Email Helper & Supabase Custom SMTP Templates

- **Request**: Prepare Resend integration and configuration for Supabase Auth emails.
- **Changes Implemented**:
  - Created server-only [api/_lib/resend.js](../../api/_lib/resend.js) (`isResendConfigured`, `sendResendEmail`) using Resend REST API (`https://api.resend.com/emails`).
  - Created Vietnamese HTML Auth email templates in [supabase/email-templates/confirm-signup.html](../../supabase/email-templates/confirm-signup.html) and [supabase/email-templates/reset-password.html](../../supabase/email-templates/reset-password.html).
  - Updated [.env.example](../../.env.example) and [.env.local](../../.env.local) with `RESEND_API_KEY` and `RESEND_FROM_EMAIL` placeholders.

---

## [2026-11-19] — Supabase Authentication (Google OAuth + Email/Password) & User Profile (`/auth`, `/profile`)

- **Request**: Implement user authentication (Sign in / Sign up with Google and Email/Password, password reset) and user profile management with saved plans.
- **Changes Implemented**:
  - Applied Supabase migration `add_auth_profiles_and_user_plans` (and synced [supabase/schema.sql](../../supabase/schema.sql)): Added `public.profiles`, `public.handle_new_user()` trigger on `auth.users`, `user_id` & `is_shared` columns on `public.saved_plans`, and strict `(select auth.uid())` RLS policies (`0` security advisor lints).
  - Installed pinned `@supabase/supabase-js` in `package.json`, configured `VITE_SUPABASE_URL` & `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, `.env.example`, and Vercel, and updated CSP `connect-src` in [vercel.json](../../vercel.json), [public/_headers](../../public/_headers), and [vite.config.js](../../vite.config.js).
  - Created [src/utils/supabaseClient.js](../../src/utils/supabaseClient.js), [src/contexts/AuthContext.jsx](../../src/contexts/AuthContext.jsx), [src/components/AuthModal.jsx](../../src/components/AuthModal.jsx), [src/pages/Auth.jsx](../../src/pages/Auth.jsx) (`/auth`), and [src/pages/Profile.jsx](../../src/pages/Profile.jsx) (`/profile`).
  - Upgraded [api/_lib/supabase.js](../../api/_lib/supabase.js) (`getUserFromBearerToken`, `sbDelete`) and [api/plans.js](../../api/plans.js) (`GET ?mine=1`, owner-scoped `POST` & `DELETE`), plus wired `AuthProvider` and `UserMenu` into [src/App.jsx](../../src/App.jsx), [src/components/Layout.jsx](../../src/components/Layout.jsx), [src/components/DataModal.jsx](../../src/components/DataModal.jsx), and [src/tools.js](../../src/tools.js).

---

## [2026-11-19] — Updated Website Favicon & Brand Logo Assets

- **Request**: Update the website's favicon and navigation logo with the newly designed VnSavingPro icon.
- **Changes Implemented**:
  - Generated optimized web icons in `public/`: [favicon.png](../../public/favicon.png) (`64x64`), [apple-touch-icon.png](../../public/apple-touch-icon.png) (`180x180`), and [logo.png](../../public/logo.png) (`256x256`).
  - Updated [index.html](../../index.html): Replaced inline SVG data-URI favicon with `/favicon.png`, `/apple-touch-icon.png`, and `og:image` (`/logo.png`).
  - Updated [src/components/Layout.jsx](../../src/components/Layout.jsx): Replaced `<Logo />` placeholder `TrendingUp` badge with `/logo.png` (`32x32`, rounded `[10px]`, ring & glow).

---

## [2026-11-18] — Supabase Free Tier Integration (Postgres Persistence, Cloud Plan Sync & Scraper Push)

- **Request**: Connect and set up VnSavingPro with Supabase Free Tier to elevate persistence beyond ephemeral serverless memory.
- **Changes Implemented**:
  - Added [supabase/schema.sql](../../supabase/schema.sql) (`public.bank_rate_snapshots`, `public.user_feedback`, `public.saved_plans` + Row Level Security policies) and [.env.example](../../.env.example).
  - Created server-only zero-dependency PostgREST helper [api/_lib/supabase.js](../../api/_lib/supabase.js) (`getSupabaseConfig`, `isSupabaseConfigured`, `sbSelect`, `sbInsert`, `sbUpsert`).
  - Upgraded [api/_lib/liveRatesCache.js](../../api/_lib/liveRatesCache.js), [api/rates.js](../../api/rates.js), [api/cron/sync-rates.js](../../api/cron/sync-rates.js), and [scripts/scrape-all.js](../../scripts/scrape-all.js) to read/write bank rate snapshots to Supabase Postgres with automatic fallback to bundled `INITIAL_BANKS_DATA`.
  - Upgraded [api/feedback.js](../../api/feedback.js) to persist feedback entries and summaries to `public.user_feedback` in Supabase.
  - Created [api/plans.js](../../api/plans.js) (`GET`/`POST /api/plans`), updated [vite.config.js](../../vite.config.js) (`loadEnv` + `/api/plans` dev parity), [src/utils/apiClient.js](../../src/utils/apiClient.js) (`fetchLiveRatesFromApi`, `saveCloudPlanToApi`, `fetchCloudPlanFromApi`), [src/state.jsx](../../src/state.jsx) (`ratesSyncMeta`), and [src/components/DataModal.jsx](../../src/components/DataModal.jsx) (Supabase Cloud Sync status badge, save/share 6-character code, and cloud plan restore).
  - **Live Supabase Provisioning (via Supabase MCP)**: Created Free Tier project **`vnsavingpro`** (`gvgyztwpjvjvztwhwnue`, region `ap-southeast-1` Singapore, org `marcustranvnnb`), applied `create_vnsavingpro_tables` DDL + explicit Data API `GRANT` + RLS policies (verified `0` security advisor lints via `get_advisors`), seeded initial 4 digital banks snapshot in `public.bank_rate_snapshots`, configured `.env.local` (git-ignored), and verified live end-to-end persistence for `/api/rates`, `/api/plans`, and `/api/feedback`.

---

## [2026-11-18] — Unified UI (`Calculator`, `Ladder`), Hidden Referral, Animations & Skeletons, Cookie Manager & Rate Disclaimer

- **Request**: Temporarily hide `Ưu đãi mở tài khoản`, apply `Planner` UI style & Option 4 breakdown to `Calculator` and `Ladder`, add animations & skeleton loading states, implement Cookie setting banner/modal, and add an official public-rate disclaimer advising users to check bank apps for exact promo details.
- **Changes Implemented**:
  - Updated [src/tools.js](../../src/tools.js) & [src/App.jsx](../../src/App.jsx): Marked `referral` as `hidden: true` so it is omitted from navigation and routes redirect cleanly to `/`; wired `PageSkeleton` and `CookieBanner`.
  - Updated [src/index.css](../../src/index.css) & [src/components/ui.jsx](../../src/components/ui.jsx): Added `shimmer`, `pulseGlow`, `.skeleton-shimmer`, `.loading-bar`, `.card-interactive`, `Skeleton`, `ResultsSkeleton`, `PageSkeleton`, and `RateDisclaimer`.
  - Created [src/utils/cookieManager.js](../../src/utils/cookieManager.js) & [src/components/CookieBanner.jsx](../../src/components/CookieBanner.jsx), integrated with [src/state.jsx](../../src/state.jsx) & `Footer` in [src/components/Layout.jsx](../../src/components/Layout.jsx) (`vnsaving_cookie_consent`, `vnsaving_prefs`, `vnsaving_analytics`).
  - Updated [api/_lib/calculator.js](../../api/_lib/calculator.js) (`simulateLadderingMatrix` now emits per-month `cohorts` & individual `packages`), [src/pages/Ladder.jsx](../../src/pages/Ladder.jsx) (sticky left controls, Headline hero, 4 KPI Stats, Option 4 `LadderPackageExplorer` + mobile bar + disclaimer), [src/pages/Calculator.jsx](../../src/pages/Calculator.jsx) (sticky left controls, Headline hero, 4 KPI Stats, animations/skeletons + mobile bar + disclaimer), [src/pages/Planner.jsx](../../src/pages/Planner.jsx), [src/pages/Rates.jsx](../../src/pages/Rates.jsx), and [src/pages/Home.jsx](../../src/pages/Home.jsx).

---

## [2026-11-18] — Option 4: Interactive Stage Passbook Shelf & Expandable 2-Level Roadmap Explorer

- **Request**: Upgrade roadmap details to visually show how many savings passbooks/packages a user holds at each stage, how much interest each package generates, and provide Option 4 combining an interactive Passbook Shelf + Expandable Matrix with switching between Cohort Grouping (`Gộp theo lô / đợt`) and Individual Passbooks (`Sổ #1, #2...`).
- **Changes Implemented**:
  - Updated [api/_lib/calculator.js](../../api/_lib/calculator.js) & [api/calculate.js](../../api/calculate.js): Added `tenureCode` tracking, per-row `activePackagesCount`/`rolledOverPackagesCount`, and `buildStagePackageSnapshot()` producing `stageSnapshots` with reconciled `cohorts` (`INITIAL`, `YEAR_k`, `BONUS_k`) and up to 120 `packages` (`Sổ #k`, rollover counts, next maturity, per-package balance & monthly interest).
  - Updated [src/pages/Planner.jsx](../../src/pages/Planner.jsx): Added `RoadmapPackageExplorer` + `StagePackageDetails` supporting `Kệ sổ theo giai đoạn` (timeline pills, 4 KPIs, stacked contribution bar) & `Bảng phân tầng` (6-column accordion table expanding any stage row), plus live switching between `Gộp theo lô / đợt` and `Từng sổ lẻ` with group filters.
  - Updated [DOMAIN_AND_FORMULAS.md](./DOMAIN_AND_FORMULAS.md), [INDEX.md](./INDEX.md).

---

## [2026-11-18] — Detailed Monthly Income Breakdown (`Full-time`, `Freelance Min–Max`, `Investment Min–Max`, `Total Income`) in Basic & Advanced Modes

- **Request**: Surface monthly income in both `Cơ bản` and `Chuyên sâu` planner modes with breakdown into main full-time job, freelance/part-time range (Min–Max), investment income range (Min–Max), and computed total monthly income.
- **Changes Implemented**:
  - Updated [src/pages/Planner.jsx](../../src/pages/Planner.jsx): Added `IncomeRangeField` component and **3. Thu nhập hàng tháng** block visible in both `Cơ bản` and `Chuyên sâu` modes, computing `totalIncomeMin`, `totalIncomeMax`, and `totalIncomeAvg`, displaying total income summary (`Tổng thu nhập hàng tháng`), savings rate %, and remaining spending budget, while removing the duplicate `advanced`-only single salary input.
  - Updated [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js): Extended `PLANNER_STATE` schema validation to persist and sanitize `salaryFullTime`, `freelanceIncomeMin`, `freelanceIncomeMax`, `investIncomeMin`, `investIncomeMax`, and `salary`.
  - Updated [api/_lib/feasibilityEvaluator.js](../../api/_lib/feasibilityEvaluator.js) & [api/calculate.js](../../api/calculate.js): Added income diversification bonus (`hasExtraIncome`) and low-month cashflow buffer warning (`safeSavings > safeIncomeMin`).
  - Updated [src/utils/googleDocsExporter.js](../../src/utils/googleDocsExporter.js) to export full income breakdown tables & text.

---

## [2026-11-18] — Fix HTML, CSS & Webhint Problems (`index.html`, `src/index.css`, `.hintrc`)

- **Request**: Resolve all IDE Problems reported in `index.html` and `src/index.css`.
- **Changes Implemented**:
  - Updated [index.html](../../index.html): Removed `<meta name="theme-color" content="#08090b" />` (`compat-api/html`), added `title="Google Tag Manager"` (`axe/text-alternatives`), and replaced inline `style="display:none;visibility:hidden"` on the GTM `<noscript><iframe>` with `class="gtm-noscript" hidden` (`no-inline-styles`).
  - Updated [src/index.css](../../src/index.css): Added `.gtm-noscript` utility rule and reordered `-webkit-appearance: none;` before `appearance: none;` in `.range` and `.select` (`css-prefix-order`).
  - Added [.hintrc](../../.hintrc) configuring Webhint hints for the Vite + React + Tailwind CSS v4 workspace.

---

## [2026-11-18] — Comprehensive Security Hardening (Storage Integrity, Anti-NaN/Infinity, ErrorBoundary, CSP & Build SRI)

- **Request**: Remediate findings from the security / resilience audit (localStorage JSON poisoning, NaN/Infinity injection, XSS polyglot persistence, missing CSP/security headers, and missing Subresource Integrity hashes).
- **Changes Implemented**:
  - Rewrote [src/utils/cryptoStorage.js](../../src/utils/cryptoStorage.js): Implemented strict key allowlist (`CUSTOM_RATES`, `CUSTOM_REFERRAL_CODES`, `PLANNER_STATE`, `USER_FEEDBACK_LOG`), signed device-keyed cipher envelopes (`v2.<nonce>.<sig>.<cipherB64>`), circular-reference-safe `safeStringify`, XSS stripping (`sanitizeText`, `sanitizeReferralCode`), strict per-key schema validators, `auditAndCleanStorage()` foreign-key flood purge, `safeExternalUrl()`, and automatic self-healing removal of tampered entries.
  - Updated [src/utils/format.js](../../src/utils/format.js), [api/_lib/calculator.js](../../api/_lib/calculator.js), and [api/_lib/feasibilityEvaluator.js](../../api/_lib/feasibilityEvaluator.js): Replaced `Number(...) || 0` patterns with finite-checked `safeNum` / `num` helpers blocking `NaN`, `Infinity`, `-Infinity`, and extreme numbers.
  - Updated [src/App.jsx](../../src/App.jsx), [src/state.jsx](../../src/state.jsx), [src/pages/Referral.jsx](../../src/pages/Referral.jsx), [src/pages/Rates.jsx](../../src/pages/Rates.jsx), [src/components/FeedbackWidget.jsx](../../src/components/FeedbackWidget.jsx), and [src/components/DataModal.jsx](../../src/components/DataModal.jsx): Added `AppErrorBoundary` recovery UI, state object/range guards, XSS input sanitization, 2 MB backup import cap, and `safeExternalUrl` enforcement on all `target="_blank" rel="noopener noreferrer"` links.
  - Updated [vercel.json](../../vercel.json), created [public/_headers](../../public/_headers), and updated [vite.config.js](../../vite.config.js): Enforced `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, plus `viteSriPlugin()` injecting `sha384-...` SRI hashes into `dist/index.html`.
  - Updated [ARCHITECTURE.md](./ARCHITECTURE.md) and [INDEX.md](./INDEX.md).

---

## [2026-11-18] — Planner Option 3: Dual Goal Modes, Bidirectional Solver & `Cơ bản` | `Chuyên sâu` Versions

- **Request**: Implement Option 3 on `/plan` with 2 distinct goal targets and 2 input versions (`Cơ bản` vs `Chuyên sâu`) to calculate both timeline and monthly saving plan.
- **Changes Implemented**:
  - Updated [api/_lib/calculator.js](../../api/_lib/calculator.js): Extended `calculatePassiveIncomeRoadmap` (while keeping `quick_estimate` backward compatibility) to support `goalType` (`PASSIVE_INCOME` vs `TARGET_AMOUNT`), bidirectional `solveMode` (`TIME` vs `SAVING`), plus Pro levers (`annualStepUpPct`, `annualBonusAmount`, `inflationRatePct`).
  - Updated [api/calculate.js](../../api/calculate.js): Extended `planner_bundle` to generate mode-aware `scenarios`, sorted `bankRuns` (`monthsNeeded` or `requiredMonthlyDeposit`), and inflation-adjusted `evaluatePlanFeasibility` scoring.
  - Updated [src/pages/Planner.jsx](../../src/pages/Planner.jsx): Redesigned the input panel into `Cơ bản (Nhanh)` vs `Chuyên sâu (Thực tế)`, added independent goal switcher (`Lãi thụ động / tháng` vs `Số tiền mục tiêu`), bidirectional solver toggle (`Tính thời gian đạt` vs `Tính tiền gửi / tháng`), Pro controls (annual step-up %, annual bonus, inflation compensation, income & TT14), and updated stats/charts/bank ranking/what-if scenarios/mobile summary bar.
  - Updated [src/utils/googleDocsExporter.js](../../src/utils/googleDocsExporter.js) and [DOMAIN_AND_FORMULAS.md](./DOMAIN_AND_FORMULAS.md).

---

## [2026-11-18] — Add Google Tag Manager (`GTM-MZVGJMWL`) & SPA `page_view` Tracking

- **Request**: Integrate Google Tag Manager snippet (`GTM-MZVGJMWL`) into VnSavingPro.
- **Changes Implemented**:
  - Updated [index.html](../../index.html): Added async `https://www.googletagmanager.com/gtm.js?id=GTM-MZVGJMWL` script, `dataLayer` (`gtm.start` + `gtag`) initialization in `<head>`, and GTM `<noscript>` iframe fallback inside `<body>`.
  - Updated [src/state.jsx](../../src/state.jsx): Pushed `{ event: 'page_view', page_path, page_title, route_id }` to `window.dataLayer` inside `useRoute()` whenever `state.route` changes for Clean-URL SPA navigation tracking.

---

## [2026-11-18] — Fix CSS Diagnostics & Vendor Prefix Compatibility in `src/index.css`

- **Request**: Fix CSS issues reported in `src/index.css`.
- **Changes Implemented**:
  - Updated [src/index.css](../../src/index.css):
    - Moved `@keyframes fade`, `@keyframes pop`, and `@keyframes rise` out of `@theme` into top-level CSS so standard CSS parsers never flag nested `@keyframes` inside `@theme`.
    - Replaced `@apply bg-canvas text-zinc-300 antialiased;` inside `@layer base > body` with standard CSS properties (`background-color: var(--color-canvas)`, `color: #d4d4d8`, `font-family: var(--font-sans)`, font smoothing).
    - Added standard `appearance: none;` alongside `-webkit-appearance: none;` in `.range::-webkit-slider-thumb` and `input[type="number"]::-webkit-*-spin-button` (`css(vendorPrefix)` fix).
    - Added `-webkit-mask-image` before `mask-image` in `.bg-grid` for Safari/WebKit compatibility.
  - Added [.vscode/css-custom-data.json](../../.vscode/css-custom-data.json) and [.vscode/settings.json](../../.vscode/settings.json) so VS Code recognizes Tailwind CSS v4 directives (`@theme`, `@utility`, `@variant`, `@custom-variant`, `@source`, `@plugin`, `@apply`).

---

## [2026-11-18] — Clean History API URLs (`/`, `/plan`, ...) & Per-Page Naming Config

- **Request**: Explain why the home URL previously contained `#` and switch to customizable clean page names/paths without `#`.
- **Changes Implemented**:
  - Added `HOME_PAGE`, per-tool `path`, `aliases` (Vietnamese slugs such as `/ke-hoach`, `/lai-suat`, `/tinh-lai`, `/bac-thang`, `/tang-luong`, `/lam-phat`, `/uu-dai`), `pageTitle`, and helpers (`normalizePath`, `resolveRouteId`, `getRoutePath`, `getPageTitle`) in [src/tools.js](../../src/tools.js).
  - Replaced `Hash Router` (`window.location.hash` / `#/`) in [src/state.jsx](../../src/state.jsx) with a Clean History API Router (`readLocation`, `navigate`, `href`, `useRoute`), complete with automatic `#/...` legacy hash stripping, delegated same-origin link interception, `popstate` support, and automatic `document.title` updates per page.
  - Updated `sharePlan` in [src/pages/Planner.jsx](../../src/pages/Planner.jsx) to build share links via `${window.location.origin}${href('plan', query)}` so pathname segments never duplicate.
  - Updated [AGENTS.md](../../AGENTS.md), [INDEX.md](./INDEX.md), and [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## [2026-11-18] — Version 1.5.2 (UI): Visible Web Tool Version Badge & Release Notes Modal

- **Request**: Display and describe the current web tool version directly on the VnSavingPro website.
- **Changes Implemented**:
  - Updated [package.json](../../package.json) `"version"` to `"1.5.2"`.
  - Added single source of truth constants `APP_VERSION` (`v1.5.2`), `APP_VERSION_DATE` (`18/11/2026`), `APP_VERSION_LABEL`, and `VERSION_HIGHLIGHTS` in [src/tools.js](../../src/tools.js).
  - Created `VersionBadge` + `"Thông tin phiên bản VnSavingPro v1.5.2"` `Modal` in [src/components/Layout.jsx](../../src/components/Layout.jsx), rendered cleanly beside the brand logo in `TopNav` and beside `© 2026 VnSavingPro` in `Footer`. Also updated the footer privacy note to reflect Tier 1 serverless calculation.
  - Updated [src/components/DataModal.jsx](../../src/components/DataModal.jsx) to show `Phiên bản công cụ: v1.5.2 (18/11/2026)` and export dynamic `version` in JSON backups.

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
