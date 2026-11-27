# VnSavingPro — Living Review Checklist & Technical Backlog

Use this document whenever reviewing the codebase, auditing financial calculations, or providing product/UX feedback. Update item statuses as issues are fixed or new findings emerge.

---

## 0k. Completed in Version 2.7.1.0 (2026-11-27 — Zero Direct DB Access Lockout & Full API Security Hardening)

- [x] **Zero Direct Client DB Access ([supabase/migrations/20261127_v271_zero_direct_db_access.sql](../../supabase/migrations/20261127_v271_zero_direct_db_access.sql), [src/contexts/AuthContext.jsx](../../src/contexts/AuthContext.jsx), [api/ecosystem.js](../../api/ecosystem.js))**: Migrated `profiles` reads/updates out of browser Supabase client to authenticated Vercel API (`/api/ecosystem?resource=profile` + `action: 'update_profile'`) with 4-column whitelist; revoked all `anon`/`authenticated` grants on `public` schema, tables, sequences, and routines; enabled `service_role` RLS policies across all 12 tables (resolving `rls_enabled_no_policy` on `user_feedback`).
- [x] **Anti-DoS & Fail-Closed Infrastructure ([api/_lib/http.js](../../api/_lib/http.js), [api/_lib/rateLimit.js](../../api/_lib/rateLimit.js), [api/_lib/quotaGuard.js](../../api/_lib/quotaGuard.js), [api/cron/sync-rates.js](../../api/cron/sync-rates.js), [api/quota-status.js](../../api/quota-status.js), [api/rates.js](../../api/rates.js), [api/fx.js](../../api/fx.js))**: Bounded JSON body stream to 128KB, prioritized Vercel edge IP headers, separated `resend_daily`/`resend_monthly` (`emailQuotaBlocked`) from global site lockdown, required non-empty `CRON_SECRET` fail-closed on cron sync, and locked unauthenticated cache-busting query params.
- [x] **Anti-Hijacking on Collaborative & Financial APIs ([api/plans.js](../../api/plans.js), [api/collaborations.js](../../api/collaborations.js), [api/ecosystem.js](../../api/ecosystem.js))**: Cryptographic 8-char share codes + immutable anonymous plans, fixed `PUBLIC_APP_ORIGIN` (no Host Header Injection), `invited_email` matching on invite accept, `accept_steward_mandate` anti-overwrite/expiry/email guards, DB-authoritative vote aggregation, and per-user row/email caps.
- [ ] **Manual Auth Setting Recommended (Supabase Dashboard)**: Enable **Leaked Password Protection** (`auth_leaked_password_protection` WARN in Security Advisor) via Supabase Auth settings.

---

## 0j. Completed in Version 2.7.0.1 (2026-11-26 — Modal Portal Viewport Fix, Garden Card Import & Demo Seeding)

- [x] **Modal Viewport Centering via Portal ([ui.jsx](../../src/components/ui.jsx))**: Wrapped `<Modal>` output in `createPortal(modalContent, document.body)` so `position: fixed` overlays always center in the viewport on tall pages using `animate-fade` (`transform` containing block), including the `/garden` House Upgrade modal.
- [x] **Garden `Card` Import & Demo Workspace Pre-Seeding Hotfix ([IsometricSkyIsland.jsx](../../src/components/IsometricSkyIsland.jsx), [AuthContext.jsx](../../src/contexts/AuthContext.jsx))**: Restored missing `Card` import in `IsometricSkyIsland.jsx` and switched Demo workspace seeding to `cryptoStorage.load`/`save` with `plotIndex` and `monthlyFixedExpense`.
- [x] **Headless CDP Smoke-Test Verification**: Verified `/`, `/garden`, House Upgrade Modal (`Lv.1–5`), and `/profile` end-to-end after Demo 1-click sign-in via headless CDP capture with zero console or page errors.

---

## 0i. Completed in Version 2.7.0.0 (2026-11-25 — 2.5D Sky Island Asset Pack, 8-Stage Tree Evolution, Core-Linked Homes & Live FX)

- [x] **63 Transparent 2.5D Game Assets (`scripts/slice-garden-assets.ps1`, `public/assets/garden/`)**: Sliced & edge flood-fill background-removed `sky-island-map.jpg`, 14 mature Vietnamese tree PNGs, 28 stage 1–7 progression sprites across 4 botanical families (`fruit`, `bonsai`, `tropical`, `lotus`), 5 evolving Vietnamese House PNGs (`house_lv1..5.png`) + locked plot sprite (`plot_locked.png`), 4 3D chibi Miu Vang poses (`mascot/miu_*.png`), and Mystery Fruits + Garden Props (`props/*.png`).
- [x] **8 Biological Growth Stages & Core-Linked House Upgrades ([wealthTreesData.js](../../src/data/wealthTreesData.js), [islandProgressionData.js](../../src/data/islandProgressionData.js), [IsometricSkyIsland.jsx](../../src/components/IsometricSkyIsland.jsx), [WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx), [LuckyCatMascot.jsx](../../src/components/LuckyCatMascot.jsx))**: Upgraded to 8 stages (`SEED`, `SPROUT`, `SEEDLING`, `SAPLING`, `MATURE`, `FLOWERING`, `YOUNG_FRUIT`, `HARVEST`) with clickable 1–8 stage preview; linked House Lv.1–5 (`6→12` plots) and 4 Island Landmarks directly to `/plan`, Real Passbooks, `/fx`, and `/cic`; added live `.animate-tree-sway`, watering-can pour + floating `+VND` reward FX, rain streaks, and starry fireflies.

---

## 0h. Completed in Version 2.6.0.0 (2026-11-25 — Personal 2.5D Isometric Sky Island Garden `/garden`)

- [x] **2.5D Isometric Sky Island Scene ([IsometricSkyIsland.jsx](../../src/components/IsometricSkyIsland.jsx))**: Implemented painter-sorted 2.5D isometric cube terrain (`isoProject`, `<IsoVoxel />`) floating on clouds with a cascading cliff waterfall, lotus water stream, Vietnamese thatched hut, crystal fountain, mystic portal, 12 interactive 3D farm plots (`plotIndex` persisted in [cryptoStorage.js](../../src/utils/cryptoStorage.js)), Move-Plot rearrangement mode, top Wooden Game HUD (Island Level ★, XP progress, Mystery Fruit gems 💎, VND gold 🪙, 3 weather modes, zoom), left wooden action dock, and Island Decoration / Custom Garden Name modal.
- [x] **Connected Sky Island to 14 Species & Mystery Fruit Flow ([WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx), [Garden.jsx](../../src/pages/Garden.jsx))**: Empty island plots open targeted planting (`targetPlotIndex`), dock actions scroll to deposit check-ins / open Mystery Fruit harvest / open Lucky Cat Fortune modal, and Miu Vang stands beside the selected tree plot.

---

## 0g. Completed in Version 2.5.1.0 (2026-11-24 — Platform Version Sync & 1-Click Demo Account)

- [x] **1-Click Interactive Demo Account (`demo@vnsavingpro.vn` / `VnSavingDemo2026!`) ([AuthContext.jsx](../../src/contexts/AuthContext.jsx), [AuthModal.jsx](../../src/components/AuthModal.jsx), [Layout.jsx](../../src/components/Layout.jsx), [Profile.jsx](../../src/pages/Profile.jsx), [Home.jsx](../../src/pages/Home.jsx))**: Added instant 1-click Demo sign-in (and direct credential match) stored cleanly in `sessionStorage` (`vnsaving_demo_session_v1`), automatically pre-seeding 4 Vietnamese Virtual Orchard trees (`/garden`), sample Couple roadmap (`PLANNER_STATE`), and 2 demo passbooks (`ACTIVE_PASSBOOKS_STATE`), badged `Demo` in Header/Profile with zero impact on live Supabase tables or RLS.
- [x] **Dynamic Version & Cross-Page Copy Sync ([tools.js](../../src/tools.js), [index.html](../../index.html), [Ecosystem.jsx](../../src/pages/Ecosystem.jsx), [Home.jsx](../../src/pages/Home.jsx), [Profile.jsx](../../src/pages/Profile.jsx))**: Replaced remaining hardcoded `v2.0` strings with dynamic `APP_VERSION` (`v2.5.1.0`) and refreshed Home hero showcase & stats to surface the 14-Tree Virtual Orchard, Miu Vang Mascot, CIC Simulator, 360° Net Worth, Security & Blog.

---

## 0f. Completed in Version 2.5.0.0 (2026-11-24 — Interactive 3-Weather Virtual Orchard & 14 Native Vietnamese Tree Species)

- [x] **14 Native Vietnamese Tree Species & 14 Mystery Fruits ([wealthTreesData.js](../../src/data/wealthTreesData.js), [cryptoStorage.js](../../src/utils/cryptoStorage.js))**: Expanded from 6 to 14 regional Vietnamese trees (`sen_dong_thap`, `quat_tu_lien`, `thanh_long`, `dao_nhat_tan`, `dua_xiem_ben_tre`, `ca_phe`, `vai_thieu_luc_ngan`, `xoai_hoa_loc`, `vusua_lo_ren`, `buoi_da_xanh`, `sau_rieng_ri6`, `che_shan_tuyet`, `tre_nga_thanh_giong`, `mai_tram_huong`) across 8 distinct botanical SVG styles (`lotus`, `bushy`, `pillar`, `bonsai`, `palm`, `broad`, `tall`, `bamboo`) and expanded `WEALTH_TREES_STATE` cap to 30 trees.
- [x] **Interactive 3-Weather Virtual Orchard Panorama & Botanical Almanac ([WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx), [Garden.jsx](../../src/pages/Garden.jsx))**: Built `<VirtualOrchardScene />` showing all followed plan trees side-by-side across 3 toggleable atmospheres (`SUNNY_MORNING`, `NOURISHING_RAIN`, `STARRY_FIREFLY`), with Miu Vang patrolling the selected plot, 1-click plot inspection, 4-tree Bot Demo orchard generator, and a 14-Species Botanical & Mystery Fruit Almanac modal.

---

## 0e. Completed in Version 2.4.0.0 (2026-11-24 — Lucky Fortune Cat Mascot "Miu Vàng" & Cute Wealth UX)

- [x] **Animated SVG Lucky Fortune Cat Mascot ([LuckyCatMascot.jsx](../../src/components/LuckyCatMascot.jsx), [index.css](../../src/index.css))**: Built zero-external-asset animated Maneki-neko SVG mascot ("Mèo Chiêu Tài Miu Vàng") with 5 expressive moods (`wave`, `gardener`, `scholar`, `celebrate`, `cheer`), CSS `.animate-paw-wave`, `.animate-cat-float`, `.animate-coin-sparkle`, and warm `.cute-cat-card` styling.
- [x] **Interactive Petting, Daily Lucky Fortune & Cross-App Integration ([Home.jsx](../../src/pages/Home.jsx), [Layout.jsx](../../src/components/Layout.jsx), [SplashScreen.jsx](../../src/components/SplashScreen.jsx), [WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx), [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx), [Planner.jsx](../../src/pages/Planner.jsx))**: Added pettable lucky pat counter (`vnsaving_lucky_cat_pats_v1`), 8 trilingual Daily Lucky Wealth Fortunes in `<LuckyCatFortuneModal />` accessible from `TopNav`, `Footer`, and `Home`, waving Miu Vang on `SplashScreen`, gardener Miu Vang inside the `/garden` Vietnamese tree illustration & Mystery Fruit harvest modal, and scholar Miu Vang guiding `OnboardingModal`.

---

## 0d. Completed in Version 2.3.0.0 (2026-11-24 — Vietnamese Wealth Tree Garden & Mystery Fruit Harvest `/garden`)

- [x] **Vietnamese Heritage Wealth Tree Dataset & Accelerated Growth Engine ([wealthTreesData.js](../../src/data/wealthTreesData.js))**: Added 6 native Vietnamese trees mapped by goal horizon (`Thanh Long 1–2Y`, `Cà Phê Tây Nguyên 2–4Y`, `Xoài Cát Hòa Lộc 3–5Y`, `Bưởi Da Xanh Bến Tre 4–7Y`, `Sầu Riêng Ri6 5–10Y`, `Mai Vàng & Trầm Hương 10+Y`), 6 growth stages (`SEED` → `HARVEST`), over-deposit multiplier (`1.0x–2.0x`), months-shortened tracker, and 6 rare Mystery Fruits.
- [x] **Interactive SVG Orchard, Deposit Verification & Mystery Fruit Unboxing ([WealthTreeGarden.jsx](../../src/components/WealthTreeGarden.jsx), [Garden.jsx](../../src/pages/Garden.jsx), [Planner.jsx](../../src/pages/Planner.jsx), [Profile.jsx](../../src/pages/Profile.jsx))**: Supports following multiple plan trees simultaneously (`WEALTH_TREES_STATE` in [cryptoStorage.js](../../src/utils/cryptoStorage.js) & [DataModal.jsx](../../src/components/DataModal.jsx)), 1-click seeding from `/plan`, passbook verification check-ins (and sync with Real Passbooks), `🤖 Bot Dummy` demo orchard option, and Mystery Fruit celebration unboxing modal.

---

## 0c. Completed in Version 2.2.0.1 (2026-11-24 — Bot-Created & Dummy Reference Data Transparency)

- [x] **Explicit Bot / Dummy Reference Badges Across Platform**: Tagged all `SEED_EXPERTS` & `SEED_TEMPLATES` in [ecosystem.js](../../api/ecosystem.js) and [Ecosystem.jsx](../../src/pages/Ecosystem.jsx) (`isDummyData`/`isBotCreated`), standardized all [blogData.js](../../src/data/blogData.js) posts & [Blog.jsx](../../src/pages/Blog.jsx) cards to `🤖 VnSavingPro AI Bot` / `Bot biên soạn · Kịch bản mẫu tham khảo`, and badged seeded sample passbooks ([ActivePassbooksTracker.jsx](../../src/components/ActivePassbooksTracker.jsx)), starter FX holdings ([FxManager.jsx](../../src/pages/FxManager.jsx)), placeholder referral codes ([Rates.jsx](../../src/pages/Rates.jsx)), and placeholder contributor groups ([contributorsData.js](../../src/data/contributorsData.js), [Contributors.jsx](../../src/pages/Contributors.jsx)).

---

## 0b. Completed in Version 2.2.0.0 (2026-11-24 — Real Passbooks Tracker (.ics), 360° Unified Net Worth, CIC & 2-Stage Home Loan `/cic` & Interactive Blog Widgets)

- [x] **Real Passbooks Tracker & `.ics` Maturity Calendar ([ActivePassbooksTracker.jsx](../../src/components/ActivePassbooksTracker.jsx), `ACTIVE_PASSBOOKS_STATE`)**: Tracks actual digital bank deposits across Cake, Timo, LioBank, and TNEX with live Circular-14 accrued interest to today, maturity countdowns, Plan vs. Actual % tracking, and RFC-5545 `.ics` calendar export (1-day `VALARM`).
- [x] **360° Unified Household Net Worth & 0–100 Health Score ([UnifiedNetWorthCard.jsx](../../src/components/UnifiedNetWorthCard.jsx), [Profile.jsx](../../src/pages/Profile.jsx), [Planner.jsx](../../src/pages/Planner.jsx))**: Consolidates VND savings capital, converted FX holdings, 2026 Net salary savings rate, Emergency Fund coverage, and DTI burden into one unified cockpit.
- [x] **Zero-PII CIC Credit Health, Passbook Pledge & 2-Stage Home Loan Simulator ([cicAndLoanVietnam.js](../../api/_lib/cicAndLoanVietnam.js), [CicLoanSimulator.jsx](../../src/pages/CicLoanSimulator.jsx), `/cic`)**: Server-only 5-pillar CIC scoring (`403–706`, Rank `1–10`, SBV Debt Groups `1–5`), 90-day What-If boost, Passbook Pledge vs. Early Break arbitrage, and Vietnam 2-stage mortgage vs. Rent-and-Save modeling with zero additional Vercel functions (`10 / 12`).
- [x] **Interactive Server-Backed Blog Mini-Calculators ([Blog.jsx](../../src/pages/Blog.jsx))**: Embedded live `useServerCalc` sandboxes inside Blog articles (`salary_gross_net` for 2026 5-bracket PIT, `inflation` for Fisher real yield, and `quick_estimate` for savings compounding).

---

## 0a. Completed in Version 2.1.0.0 (2026-11-24 — Digital Bank Security & Account Perks, Trilingual Blog `/blog` & v2.0 Stability Fixes)

- [x] **Digital Bank Security & Account-Opening Perks ([bankSecurityAndPerksData.js](../../src/data/bankSecurityAndPerksData.js), [Rates.jsx](../../src/pages/Rates.jsx), `/referral`)**: Added Tab 3 (`Bảo mật & Ưu đãi mở TK`) + `/referral` route detailing 4 legal/technical protection pillars (SBV commercial bank parent licenses, Deposit Insurance DIV, SBV Decision 2345 / Circular 17/2024 NFC biometrics, closed-loop principal settlement), per-bank welcome bonus breakdowns, 1-click referral copy, QR preview, editable `CUSTOM_REFERRAL_CODES` manager, and 5-step interactive user security self-check.
- [x] **Financial Knowledge & Strategy Blog ([blogData.js](../../src/data/blogData.js), [Blog.jsx](../../src/pages/Blog.jsx), `/blog`)**: Created 7 comprehensive trilingual (`VI/EN/JA`) deep-dive articles across 4 categories (`savings`, `tax_bhxh`, `fx_macro`, `family_wealth`) with keyword search, reading bookmarks, key takeaways cards, metric tables, deep-linked reader mode (`/blog?post=<slug>`), and interactive tool CTAs, highlighted on [Home.jsx](../../src/pages/Home.jsx).
- [x] **v2.0 Post-Audit Bug Fixes ([ecosystem.js](../../api/ecosystem.js), [SalaryInsurance.jsx](../../src/pages/SalaryInsurance.jsx), [Ecosystem.jsx](../../src/pages/Ecosystem.jsx), [DataModal.jsx](../../src/components/DataModal.jsx))**: Replaced `!templateId.startsWith('tpl_')` with `!SEED_TEMPLATE_IDS.has(templateId)` so user-published templates persist votes/clones/planner promotions to Supabase; fixed `consumeToolRestoreState('salary')` Tab 2 (`social_benefits`) history reopen; implemented 2-way `sync_steward_snapshot` mandate sync; and added `FX_PORTFOLIO_STATE` & `SALARY_STATE` to Cloud Share Codes & JSON backup/restore.
- [ ] **Optional DB Advisor Polish (`gvgyztwpjvjvztwhwnue`)**: Run [supabase/migrations/20261124_v210_advisor_hardening.sql](../../supabase/migrations/20261124_v210_advisor_hardening.sql) in Supabase SQL Editor (`idx_community_template_votes_voter` + explicit `service_role` policy on `user_feedback`).

---

## 0. Completed in Version 2.0.0.0 (2026-11-23 — Wealth Platform, 4 Roles, FX Manager & Vietnam 2026 Statutory Payroll/BHXH)

- [x] **4-Role Ecosystem (`/ecosystem`, [api/ecosystem.js](../../api/ecosystem.js))**: Built Individual (with Couple switching & Couple→Family upgrade via `household_spaces`), Verified Financial Expert (degrees/certifications verification + Expert eligibility to also earn Community-Voted Planner status), Community-Voted Planner (`proofVerified + >=10 votes + >=4.2★ + >=3 clones` enabling 1-click template cloning into `/plan`), and Financial Steward (revocable delegation mandates via `steward_mandates`).
- [x] **FX Currency & Exchange Rate Manager (`/fx`, [FxManager.jsx](../../src/pages/FxManager.jsx), [api/fx.js](../../api/fx.js))**: Live Vietcombank XML feed (`15m` Edge cache), Cash/Transfer/Sell converter, multi-currency holdings portfolio (`FX_PORTFOLIO_STATE`), `-5%..+10%` sensitivity stress-test, target rate watchlist & VND bank savings hurdle.
- [x] **Vietnam 2026 Salary, PIT & Social Insurance Calculator (`/salary`, [SalaryInsurance.jsx](../../src/pages/SalaryInsurance.jsx), [salaryVietnam.js](../../api/_lib/salaryVietnam.js))**: Implements NQ 110/2025 (`15.5M/6.2M`), 5-bracket PIT Law 109/2025 (+ comparison vs 2025 7-bracket tax savings), Decree 161/2026 (`2.53M` reference salary), Decrees 293/2025 & 399/2026 regional minimum wages, Employment Law 74/2025 (`5×` UI cap), and BHXH Law 41/2024 (Maternity + Điều 70 Lump-Sum) with 1-click Net-to-Planner transfer.
- [x] **Profile Lifecycle & Multi-Suite History ([Profile.jsx](../../src/pages/Profile.jsx), [Home.jsx](../../src/pages/Home.jsx), [Layout.jsx](../../src/components/Layout.jsx), [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx))**: Added v2.0 role badges, Couple switch / Couple→Family upgrade controls, `fx`/`salary` history filters, and updated Home/Header/Onboarding across `vi`/`en`/`ja`.
- [x] **Verified Live in Supabase (`gvgyztwpjvjvztwhwnue`)**: Confirmed all 12 RLS-enabled tables live via `supabase_mcp:list_tables` (`bank_rate_snapshots`, `user_feedback`, `saved_plans`, `profiles`, `usage_quotas`, `quota_alerts_log`, `calculation_history`, `household_collaborations`, `household_spaces`, `community_plan_templates`, `community_template_votes`, `steward_mandates`).

---

## 0a. Completed in Version 1.12.0.0 (2026-11-23 — Silent Auto-Layout, Highlighted Header, Branded Splash, Onboarding, Shared Household Planning & CIC/Advisors Roadmap)

- [x] **Hidden Display Mode Selector (`v1.12.0.0`)**: Removed manual `DisplayModeSwitcher`, Footer display pills, `MobileTabBar` display grid, and `Profile` display card; restricted [DisplayModeContext.jsx](../../src/layout/DisplayModeContext.jsx) & `LayoutModeBanner` strictly to QA `?layout=`/`?posture=` query params so responsive/foldable layouts adapt silently.
- [x] **Streamlined Header & Flagship Spotlights ([Layout.jsx](../../src/components/Layout.jsx))**: Consolidated Desktop/Duo/Tablet `TopNav` to highlight **Lập kế hoạch** (gradient pill) and **Lãi suất** (live 12M yield badge) alongside `Khám phá`, `LanguageSwitcher`, and `UserMenu`.
- [x] **Branded Initial Splash & 3-Step Onboarding ([SplashScreen.jsx](../../src/components/SplashScreen.jsx), [OnboardingModal.jsx](../../src/components/OnboardingModal.jsx), [App.jsx](../../src/App.jsx))**: Added smooth initial loading overlay for all visitors plus gentle first-visit 3-step setup wizard persisted in `ONBOARDING_STATE` & `PLANNER_STATE` ([cryptoStorage.js](../../src/utils/cryptoStorage.js) `raw` schema validator).
- [x] **Deduplicated Homepage CTAs ([Home.jsx](../../src/pages/Home.jsx))**: Replaced repetitive Hero/Household/Toolkit "Lập kế hoạch" labels with `"Thiết lập nhanh trong 30 giây"` + distinct per-card action copy and highlighted flagship cards.
- [x] **Collaborative Household Planning (`Cặp đôi` · `Gia đình`)**: Added [20261123_v112_collaborative_planning.sql](../../supabase/migrations/20261123_v112_collaborative_planning.sql), [api/collaborations.js](../../api/collaborations.js) (`GET ?preview=`, auth-gated `GET`/`POST`/`DELETE`, Resend invite email, memory fallback), [vite.config.js](../../vite.config.js) route, [apiClient.js](../../src/utils/apiClient.js) helpers, and [Profile.jsx](../../src/pages/Profile.jsx) invite/accept/sync UI.
- [x] **Strategic Roadmap & Vietnam Advisor Research**: Published [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md) covering the 5-factor CIC estimator (`/cic`) and Vietnam Wealth Advisor research (`FIDT`, `AFA Capital`, `FinPeace`, `TOPI`, `MoneyGain`, `VWA/VWAS`, `Private Banking`) + `/advisors` connector plan.
- [ ] **Manual Owner SQL Action Pending**:
  - Run [supabase/migrations/20261123_v112_collaborative_planning.sql](../../supabase/migrations/20261123_v112_collaborative_planning.sql) (and `v1.11.0.0` migration if not yet applied) in Supabase SQL Editor (`gvgyztwpjvjvztwhwnue`).

---

## 0b. Completed in Version 1.11.0.0 (2026-11-23 — Infrastructure, Cost, Security & Bundle Optimization)

- [x] **Free-Tier Invocation & DB RPC Reduction (`Phase 1`)**: Edge cached `/api/rates` (`24h` CDN + `6h` memory + pre-computed `defaultQuickEstimate`), removed redundant `/api/quota-status` mount call in `App.jsx`, batched `quotaGuard.js` (`5m` window / `50` hits), and added bounded sliding-window rate limiters ([rateLimit.js](../../api/_lib/rateLimit.js)) across `calculate`, `feedback`, `plans`, and `history`.
- [x] **Database Security, Retention & Keepalive (`Phase 2`)**: Created [20261123_v111_security_and_history.sql](../../supabase/migrations/20261123_v111_security_and_history.sql) & updated [schema.sql](../../supabase/schema.sql) (adding `calculation_history`, revoking `anon` direct Data API table access on `saved_plans`/`user_feedback`, dropping unused `idx_bank_rate_snapshots_updated_date`), locked unauthenticated admin `GET /api/feedback`, enforced retention caps (50 runs/user, 24 rate snapshots), and added [keepalive-supabase.yml](../../.github/workflows/keepalive-supabase.yml) (5-day ping).
- [x] **Entry JS Reduction `-40%+` & CDN Cache (`Phase 3`)**: Lazy-loaded `@supabase/supabase-js` into deferred `supabase` chunk only when stored session/callback or auth prompt opens, lazy-probed Google OAuth provider settings in `AuthModal.jsx`, deferred GTM behind `initAnalyticsIfAllowed()` cookie consent check, and enabled 1-year `immutable` cache on `/assets/(.*)` in `vercel.json`.
- [x] **CI/CD & Runtime Cleanup (`Phase 4`)**: Upgraded GitHub Actions workflow to **Node.js 24 LTS** + `engines.node = "24.x"`, consolidated monthly Day-1 sync on GitHub Actions, removed unused Cloudflare config (`wrangler.jsonc`, `public/_redirects`, `public/_headers`, `cf:*` scripts), and ignored `unikorn-assets/`.
- [ ] **Manual Owner Dashboard Actions Pending**:
  - Run [supabase/migrations/20261123_v111_security_and_history.sql](../../supabase/migrations/20261123_v111_security_and_history.sql) in Supabase SQL Editor (`gvgyztwpjvjvztwhwnue`).
  - Enable **Leaked Password Protection** under Supabase Auth Settings (`auth_leaked_password_protection`).
  - Reconnect the **Vercel** plugin account in Plugins Manager to restore MCP visibility.

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

## 3. Future Backlog (`v1.13+` Roadmap)

- **CIC Credit Health & Loan Readiness Simulator (`/cic`)**: 5-pillar weighted simulator (`403–706` / Rank 1–10 + SBV Debt Groups 1–5) integrated with `/plan` passbooks; full spec in [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md).
- **Vietnam Financial Advisor & Wealth Butler Connector (`/advisors`)**: Verified advisor directory (`FIDT`, `FinPeace`, `AFA Capital`, VWA/CFP/CFA independents) with 1-click anonymized read-only snapshot sharing; full benchmark & architecture in [PRODUCT_ROADMAP_CIC_AND_ADVISORS.md](./PRODUCT_ROADMAP_CIC_AND_ADVISORS.md).
- **Multi-Goal Portfolio Tracking**: Allow users to track multiple active savings books (e.g., entering actual start dates and maturity dates) with maturity reminders.
- **Automated Unit Tests**: Add Vitest suite for `api/_lib/calculator.js` and `api/_lib/feasibilityEvaluator.js`.
