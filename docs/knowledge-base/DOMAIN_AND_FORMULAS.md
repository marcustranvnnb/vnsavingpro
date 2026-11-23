# VnSavingPro — Financial Domain & Formulas Reference

## 1. Core Financial Calculation Engine (Server-Only: `api/_lib/calculator.js`)

All financial algorithms reside exclusively on the server (`api/_lib/calculator.js` + `api/_lib/feasibilityEvaluator.js`) and are invoked via `POST /api/calculate` (`api/calculate.js`).

### A. Single Deposit Interest (`calculateInterest`)
Supports two calculation modes and multiple payout methods:
1. **`ACTUAL_DAYS` (Chuẩn Thông tư 14/2017/TT-NHNN)**:
   $$\text{Interest} = \frac{P \times (r / 100) \times \text{days}}{365}$$
   - Standard day mapping (`TENURE_DAYS_MAP`): `1W`=7, `2W`=14, `3W`=21, `1M`=30, `3M`=90, `6M`=180, `9M`=270, `12M`=365, `18M`=540, `24M`=730, `36M`=1095.
2. **`NOMINAL_MONTHS` (Tháng tròn / 12)**:
   $$\text{Interest} = \frac{P \times (r / 100) \times \text{months}}{12}$$
3. **Monthly Compounding** (computed directly in `src/pages/Calculator.jsx`):
   $$\text{Total} = P \times \left(1 + \frac{r / 100}{12}\right)^{\text{months}}$$

### B. Bidirectional Savings & Passive Income Roadmap Solver (`calculatePassiveIncomeRoadmap`)
Supports two independent goal modes (`goalType`), two solving directions (`solveMode`), and optional Chuyên sâu (Pro) financial levers:
1. **Goal Modes (`goalType`)**:
   - `PASSIVE_INCOME`: User targets desired monthly passive interest; $P_{\text{nominal}} = \text{round}\left(\frac{\text{targetMonthlyInterest}}{(r / 100) \times \text{monthlyFactor}}\right)$.
   - `TARGET_AMOUNT`: User targets a direct savings milestone ($P_{\text{nominal}} = \text{targetAmount}$), and monthly interest at maturity is computed as $P_{\text{target}} \times i$.
2. **Bidirectional Solving (`solveMode`)**:
   - `TIME`: Given `monthlySavingsAmount` ($M_0$), simulates monthly compounding with optional annual deposit step-up ($M_m = M_0 (1 + \text{stepUp})^{\lfloor (m-1)/12 \rfloor}$), year-end bonus deposits ($B$ every 12 months), and inflation-indexed targets ($P_{\text{nominal}} (1 + \pi)^{m/12}$) until `currentBalance >= targetAtMonth` (capped at `720` months).
   - `SAVING`: Given `targetYears` ($T = 12 \times \text{targetYears}$), computes inflation-adjusted target $P_{\text{target}} = P_{\text{nominal}}(1 + \pi)^{\text{years}}$ and solves linearly for the required initial monthly deposit:
     $$M_0 = \left\lceil \frac{P_{\text{target}} - \text{baseBalance}(p_0, B)}{\text{unitFactor}(1, \text{stepUp}, i, T)} \right\rceil$$
3. **Monthly Factor**:
   - `NOMINAL_MONTHS`: $\text{monthlyFactor} = \frac{1}{12}$
   - `ACTUAL_DAYS` (Circular 14 conservative 30-day month): $\text{monthlyFactor} = \frac{30}{365}$
4. **Per-Stage Passbook & Cohort Breakdown (`buildStagePackageSnapshot`)**:
   - Tracks every individual deposit (`Sổ #1`, `Sổ #2`, ...) opened at month $m_0$ (`INITIAL`, `MONTHLY`, `BONUS`), its rollover cycles $\lfloor (\text{stageMonth} - m_0) / \text{tenureMonths} \rfloor$, next maturity month, current compounded balance $A_0 (1 + i)^{\text{age}}$, and monthly interest yield.
   - Groups passbooks into cohorts (`INITIAL`, `YEAR_1..N`, `BONUS_1..N`) with exact Dong-level reconciliation against `stageTotalBalance` and `stageMonthlyInterest`.
   - Emits `activePackagesCount` / `rolledOverPackagesCount` per log row and `stageSnapshots` for Option 4's Interactive Passbook Shelf and Expandable Matrix.

### F. Partial vs. Full Early Withdrawal Breakeven (`calculateEarlyWithdrawalComparison`)
Compares holding to maturity vs. breaking the entire deposit at `daysHeld` (receiving `nonTermRate = 0.5%/yr` on 100% of principal) vs. partial early withdrawal / split deposits (only `withdrawAmount` gets `nonTermRate` for `daysHeld`, while `remainingPrincipal` keeps `ratePercent` until `totalDays`).

### C. Savings Laddering Simulator (`simulateLadderingMatrix`)
Simulates monthly contributions split across multiple term packages (`1M`, `3M`, `6M`, `12M`) over `totalMonths`:
- **Built-in Strategies**:
  - `ROLLING_1M`: 100% into 1M revolving packages.
  - `SPLIT_50_50`: 50% into 1M + 50% into 3M.
  - `TNEX_PROMO_30_70`: 30% into 1M + 70% into 6M.
  - `CUSTOM`: User-defined array of `{ term, percent, rate }`.
- When a package reaches `maturityMonth === m`, its principal + earned interest (`calculateInterest` in `ACTUAL_DAYS` mode) automatically rolls over into a new package of the same term.

### D. Career & Salary Growth Engine (`calculateCareerGrowthImpact`)
Models time to reach $P_{\text{target}}$ when monthly savings is a fixed percentage (`savingsRatePercent`) of a growing salary (capped at 360 months):
- `FIXED_RAISE`: `+2,000,000 VND/month` every 12 months (`monthsCount % 12 === 1`).
- `PERCENT_RAISE`: `+10%` salary every 12 months.
- `JOB_HOPPING`: `+30%` salary jump every 24 months (`monthsCount % 24 === 1`).

### E. Inflation & Purchasing Power (`calculateInflationImpact`)
- **Simple Difference Real Rate**: $\text{realRate} = r_{\text{nominal}} - r_{\text{inflation}}$ *(see `REVIEW_CHECKLIST.md` regarding Fisher equation comparison)*.
- **Future Purchasing Power Ratio**: $\frac{1}{(1 + r_{\text{inflation}} / 100)^{\text{years}}}$.

---

## 2. Feasibility Score & Household Engine (`api/_lib/feasibilityEvaluator.js` & `api/_lib/householdAnalytics.js`)

Supports 3 household profiles (`INDIVIDUAL`, `COUPLE`, `FAMILY`) across Basic & Advanced modes:
- **Emergency Fund Target**: `4` months of total expenses (`INDIVIDUAL`), `6` months (`COUPLE`), `min(12, 6 + round(dependentsCount * 1.5))` months (`FAMILY`), or user custom months (`3–18`). Supports **Parallel Tracking** (`prioritizeEmergencyFund = false`) and **Fund-First Priority** (`prioritizeEmergencyFund = true`: fills emergency shortfall first at liquid `1M–3M` rate before compounding remaining capital & deposits toward primary goal, using binary search in `SAVING` solve mode).
- **2-Earner Split**: `PROPORTIONAL` (by income ratio), `SPLIT_50_50`, or `CUSTOM` (`earner1SharePct`).
- **Breadwinner Stress-Test**: Simulates `ifEarner1Stops` & `ifEarner2Stops` monthly expense gap/surplus and capital/emergency-fund runway months.

Feasibility starts at baseline `70` (clamped `[10, 100]`):
- **Savings-to-Income Ratio (`monthlySavings / monthlySalary`)**:
  - `< 5%`: `-15` pts (warning: too low)
  - `15% – 35%`: `+15` pts (strength: ideal balance)
  - `> 50%`: `-10` pts (warning: high financial stress risk)
- **Household Cashflow & Emergency Adjustments**:
  - Negative `freeCashFlow`: `-15` pts; `expenseCoveragePct >= 100%`: `+5` pts.
  - Emergency Fund coverage `>= 100%`: `+8` pts; `< 50%` without fund-first: `-8` pts.
  - Family breadwinner concentration `>= 75%` with dependents: warning alert.
- **Timeline (`yearsToGoal`)**:
  - `> 30` years: `-20` pts
  - `<= 12` years: `+15` pts
- **Strategy Liquidity**: `+10` pts if using `ROLLING_1M`, `SPLIT_50_50`, or `TNEX_PROMO_30_70`.
- **Real Yield Protection**: `+10` pts if `realYieldRate >= 4.0%`.

---

## 3. Baseline Digital Bank Data (`src/data/banksData.js` & `bankPackagesData.js` — Live Synced 18/11/2026)

All 4 banks comply with SBV ceiling caps (`0.50%/yr` non-term, `4.75%/yr` for `1M–5M` terms). TNEX and Timo are automatically refreshed daily at 09:00 AM (UTC+7) from their official product pages (`tnex.vn/san-pham/tiet-kiem`, `timo.vn/tiet-kiem-co-ky-han/`):

| Bank | ID | Parent Bank | 1M Rate | 6M Rate | 12M Rate | Peak Rate | Flagship Product & Live Sync Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TNEX** | `tnex` | MSB | 4.75% | **8.40%** | **8.60%** | **8.60%** (12M–36M) | Auto-scraped from `tnex.vn/san-pham/tiet-kiem` (`1–<6M`: `4.75%`, `6–<12M`: `8.40%`, `12M+`: `8.60%`) |
| **CakeBank** | `cake` | VPBank | 4.75% | 6.90% | 6.90% | 6.90% (6M–24M) / 9.1% ưu đãi | Auto-scraped from `cake.vn/tien-gui/tien-gui-tieu-chuan` (17 terms, `21/10/2026`) & `tien-gui-co-ky-han-tich-luy` (`6.70%`), Rút gốc từng phần |
| **Timo** | `timo` | BVBank | 4.75% | 6.70% | 6.90% | 6.90% (12M) | Auto-scraped from `timo.vn/tiet-kiem-co-ky-han/` (`6–11M`: `6.70%`, `12M`: `6.90%`, `15–24M`: `6.70%`) |
| **LioBank** | `liobank` | OCB | 4.75% | 5.90% | 6.20% | 6.20% mặc định / **8.20%** CTKM | Auto-scraped from `deposit-tariffs` (effective `11/11/2026`) + dynamic CTKM PDF (`6–9M: 8.00%`, `10–12M: 8.20%`, `15–24M: 7.70%`), Ống heo Pigg `4.75%` |

---

## 4. Foreign Exchange (FX) Management Engine (`api/_lib/fxRatesCache.js` & `api/_lib/fxCalculator.js`)

- **Data Source**: Vietcombank official public XML feed (`portal.vietcombank.com.vn/UserControls/TVPortal.TyGia/pXML.aspx`), cached 15 minutes (`s-maxage=900`) with Nov 2026 reference fallback.
- **Conversion Basis**: `FX → VND` applies bank `transfer` (or `buy` cash) rate; `VND → FX` applies bank `sell` rate; `FX_A → FX_B` routes through VND `(amount × A_buy) / B_sell`.
- **Break-Even vs VND Digital Bank Savings**:
  $$\text{Hurdle \%/yr} = r_{\text{VND 12M benchmark}} + \overline{\text{Spread}}_{\text{buy-sell \%}}$$
- **Stress-Test**: Simulates `-5%`, `-2%`, `+2%`, `+5%`, `+10%` spot shifts across non-VND currency holdings while keeping VND cash 1:1.

---

## 5. Vietnam 2026 Statutory Payroll, 5-Bracket PIT & Social Insurance (`api/_lib/salaryVietnam.js`)

Supports **3 statutory regimes**: `2026_H2` (active default from 01/07/2026), `2027` (NĐ 399/2026/NĐ-CP forecast from 01/01/2027), and `2025` (legacy comparison):
- **Personal & Dependent Deductions (`NQ 110/2025/UBTVQH15`)**: `15,500,000 VND/month` taxpayer + `6,200,000 VND/month` per dependent (replacing `11M` / `4.4M`).
- **5-Bracket Progressive PIT (`Luật Thuế TNCN 109/2025/QH15`)**:
  - Bracket 1 (`0–10M`): `5%`
  - Bracket 2 (`10M–30M`): `10%`
  - Bracket 3 (`30M–60M`): `20%`
  - Bracket 4 (`60M–100M`): `30%`
  - Bracket 5 (`>100M`): `35%`
- **Reference Salary & Caps**: `2,530,000 VND/month` (`NĐ 161/2026/NĐ-CP` & `Luật BHXH 41/2024/QH15`), capping BHXH (8%) & BHYT (1.5%) base at `20 × 2,530,000 = 50,600,000 VND`; BHTN (1%) capped at `20 × LTTV`.
- **Regional Minimum Wages**:
  - `2026` (`NĐ 293/2025/NĐ-CP`): `5.31M / 4.73M / 4.14M / 3.70M`
  - `2027` (`NĐ 399/2026/NĐ-CP`): `5.70M / 5.08M / 4.45M / 4.04M`
- **Social Benefits**:
  - **Unemployment (`Luật Việc làm 74/2025/QH15`)**: `60% × avgSalary6m`, capped uniformly at `5 × LTTV` across all sectors (`26.55M` Region I in 2026; `28.50M` in 2027).
  - **Maternity (`Luật BHXH 41/2024/QH15`)**: Voluntary birth grant `2,000,000 VND/child` (Điều 95); Mandatory birth lump-sum `2 × referenceLevel` (`5,060,000 VND/child`) + 6m salary replacement + recovery/father leave.
  - **BHXH Lump-Sum (Điều 70)**: Preserves 12-month standard withdrawal only for pre-01/07/2025 contributors; post-01/07/2025 contributors require statutory exceptions (`(1.5 × yearsBefore2014 + 2 × yearsFrom2014) × avgSalaryTotal`).
