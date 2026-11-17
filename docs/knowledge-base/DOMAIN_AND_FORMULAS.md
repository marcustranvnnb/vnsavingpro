# VnSavingPro — Financial Domain & Formulas Reference

## 1. Core Financial Calculation Engine (`src/utils/calculator.js`)

### A. Single Deposit Interest (`calculateInterest`)
Supports two calculation modes and multiple payout methods:
1. **`ACTUAL_DAYS` (Chuẩn Thông tư 14/2017/TT-NHNN)**:
   $$\text{Interest} = \frac{P \times (r / 100) \times \text{days}}{365}$$
   - Standard day mapping (`TENURE_DAYS_MAP`): `1W`=7, `2W`=14, `3W`=21, `1M`=30, `3M`=90, `6M`=180, `9M`=270, `12M`=365, `18M`=540, `24M`=730, `36M`=1095.
2. **`NOMINAL_MONTHS` (Tháng tròn / 12)**:
   $$\text{Interest} = \frac{P \times (r / 100) \times \text{months}}{12}$$
3. **Monthly Compounding** (computed directly in `src/pages/Calculator.jsx`):
   $$\text{Total} = P \times \left(1 + \frac{r / 100}{12}\right)^{\text{months}}$$

### B. Passive Income Roadmap Solver (`calculatePassiveIncomeRoadmap`)
Solves for the required nest egg principal ($P_{\text{target}}$) and the exact number of months needed to reach it given initial capital ($P_0$), monthly savings ($M$), annual interest rate ($r\%$), and `calculationMode` (`NOMINAL_MONTHS` vs `ACTUAL_DAYS`):
1. **Monthly Factor**:
   - `NOMINAL_MONTHS`: $\text{monthlyFactor} = \frac{1}{12}$
   - `ACTUAL_DAYS` (Circular 14 conservative 30-day month): $\text{monthlyFactor} = \frac{30}{365}$
2. **Required Principal**:
   $$P_{\text{target}} = \text{round}\left(\frac{\text{targetMonthlyInterest}}{(r / 100) \times \text{monthlyFactor}}\right)$$
3. **Monthly Compounding Loop**:
   - Monthly rate $i = (r / 100) \times \text{monthlyFactor}$.
   - Each month $m$: $\text{balance}_m = \text{balance}_{m-1} \times (1 + i) + M$.
   - Logs **every single month** up to `monthsNeeded` (capped at `720` months / 60 years).

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

## 2. Feasibility Score Engine (`src/utils/feasibilityEvaluator.js`)

Starts at baseline `70` (clamped `[10, 100]`):
- **Savings-to-Income Ratio (`monthlySavings / monthlySalary`)**:
  - `< 5%`: `-15` pts (warning: too low)
  - `15% – 35%`: `+15` pts (strength: ideal balance)
  - `> 50%`: `-10` pts (warning: high financial stress risk)
- **Timeline (`yearsToGoal`)**:
  - `> 30` years: `-20` pts
  - `<= 12` years: `+15` pts
- **Strategy Liquidity**: `+10` pts if using `ROLLING_1M`, `SPLIT_50_50`, or `TNEX_PROMO_30_70`.
- **Real Yield Protection**: `+10` pts if `realYieldRate >= 4.0%`.

---

## 3. Baseline Digital Bank Data (`src/data/banksData.js` & `bankPackagesData.js`)

| Bank | ID | Parent Bank | Key 1M Rate | Key 6M Rate | Key 12M Rate | Peak Rate | Flagship Product |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TNEX** | `tnex` | MSB | 5.50% | 7.00% | **8.60%** | 8.60% (12M) | Tiết kiệm Flex (4.0% demand), Kỳ hạn 12M промо 8.6% |
| **LioBank** | `liobank` | OCB | 4.75% | 6.40% | 6.70% | 6.80% (24M/36M) | Ống heo Pigg (4.75% không kỳ hạn) |
| **CakeBank** | `cake` | VPBank | 4.75% | 5.20% | 5.80% | 5.90% (18M–36M) / 6.7% tích lũy | Tiết kiệm tích lũy, Trả lãi đầu kỳ, Rút gốc từng phần |
| **Timo** | `timo` | BVBank | 4.80% | 5.80% | 6.20% | 6.30% (18M–36M) | Hũ tiết kiệm Smart, Chia nhỏ sổ (4 sổ tự động) |
