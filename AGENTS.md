# VnSavingPro — Living Brain & Workspace Rules

This workspace maintains a **Living Brain** in `docs/knowledge-base/` so that every review, feedback session, architectural decision, or feature implementation operates on the **latest ground-truth state** of the project.

## 1. Mandatory Pre-Review & Feedback Protocol

Whenever the user asks to **review**, **audit**, **give feedback**, **check current status**, or **plan changes**:
1. **Read the Living Brain First**: Start by reading [INDEX.md](./docs/knowledge-base/INDEX.md) and any relevant domain/architecture docs in `docs/knowledge-base/`.
2. **Verify Live Ground Truth**: Activate the `project-brain` skill (`.agents/skills/project-brain/SKILL.md`) or run its snapshot check to verify if any files in `src/` were modified more recently than the knowledge base.
3. **Target Only the Active Architecture (v1.3 Tier 1 Serverless)**:
   - **Frontend (`src/`)**: `src/App.jsx`, `src/state.jsx`, `src/tools.js`, `src/pages/*.jsx`, `src/components/{Layout,ui,BankPicker,GrowthChart,DataModal}.jsx`, `src/data/*.js`, and `src/utils/{apiClient,format,cryptoStorage}.js`.
   - **Backend / Serverless (`api/`)**: `api/rates.js`, `api/calculate.js`, and server-only calculation modules `api/_lib/{calculator,feasibilityEvaluator}.js`. **NEVER** move proprietary calculation or feasibility scoring logic back into `src/` so algorithms stay private on Vercel.
   - **Legacy Note**: All v1 legacy dead files have already been removed in v1.2, and client-side `calculator.js` / `feasibilityEvaluator.js` were moved to `api/_lib/` in v1.3.

## 2. Mandatory Post-Change Sync Rule (Keep the Brain Alive)

Whenever you modify code, formulas, bank rates, UI components, or deployment configuration in this repository:
1. **Update the corresponding doc** in `docs/knowledge-base/` (`INDEX.md`, `ARCHITECTURE.md`, `DOMAIN_AND_FORMULAS.md`, or `REVIEW_CHECKLIST.md`) in the **same turn**.
2. **Log the change** in [CHANGELOG_AND_DECISIONS.md](./docs/knowledge-base/CHANGELOG_AND_DECISIONS.md) with the date, summary, and files touched.

## 3. Coding & Design Conventions

- **Stack**: React 18 + Vite 5 + Tailwind CSS v4 (`@tailwindcss/vite`) + `chart.js` / `react-chartjs-2` + `lucide-react`.
- **Routing**: Hash-based router (`#/`, `#/plan`, `#/rates`, `#/calculator`, `#/ladder`, `#/career`, `#/inflation`, `#/referral`) in `src/state.jsx` for zero-rewrite static hosting compatibility.
- **UI Primitives**: Always reuse primitives from `src/components/ui.jsx` (`Card`, `Button`, `Badge`, `Chip`, `Segmented`, `MoneyField`, `DecimalInput`, `NumberInput`, `SliderField`, `Stat`, `Table`, `Modal`, `PageHeader`) rather than inline styles.
- **Formatting**: Format all VND amounts, percentages, and durations through `src/utils/format.js` (`vnd`, `compact`, `chip`, `pct`, `duration`, `fmt`) with `tabular-nums`.
