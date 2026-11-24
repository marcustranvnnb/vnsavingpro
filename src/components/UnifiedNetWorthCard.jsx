import React, { useMemo } from 'react';
import { ArrowRight, Landmark, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { AdaptiveGrid } from './AdaptiveLayout.jsx';
import { Badge, Button, Card, CardHeader, Progress, cx } from './ui.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href } from '../state.jsx';
import {
  loadActivePassbooks,
  loadSavedCicLoanState,
  loadSavedFxState,
  loadSavedPlannerState,
  loadSavedSalaryState,
} from '../utils/apiClient.js';
import { compact, vnd } from '../utils/format.js';

const REFERENCE_FX_TO_VND = {
  USD: 25_450,
  EUR: 27_150,
  JPY: 166,
  GBP: 32_350,
  SGD: 18_950,
  AUD: 16_620,
  CAD: 18_120,
  CHF: 28_680,
  KRW: 18.2,
  CNY: 3_510,
};

export function UnifiedNetWorthCard({ compact: isCompact = false, className }) {
  const { lang, tx } = useI18n();

  const summary = useMemo(() => {
    const plan = loadSavedPlannerState() || {};
    const passbooks = loadActivePassbooks();
    const fx = loadSavedFxState() || {};
    const salary = loadSavedSalaryState() || {};
    const cic = loadSavedCicLoanState() || {};

    const passbooksVnd = passbooks.reduce((s, p) => s + (Number(p.principal) || 0), 0);
    const planCapitalVnd = Number(plan.capital) || 0;
    const vndSavingsCapital = Math.max(passbooksVnd, planCapitalVnd);

    const fxHoldings = Array.isArray(fx.holdings) ? fx.holdings : [];
    const fxTotalVnd = fxHoldings.reduce((sum, h) => {
      const rate = REFERENCE_FX_TO_VND[String(h.code || '').toUpperCase()] || 25_450;
      return sum + Math.round((Number(h.amount) || 0) * rate);
    }, 0);

    const totalLiquidWealthVnd = vndSavingsCapital + fxTotalVnd;

    const grossIncomeMonthly =
      Number(salary.amount) > 0
        ? Number(salary.amount) + Number(salary.partnerAmount || 0)
        : Number(plan.salaryFullTime || 25_000_000) + Number(plan.partnerSalaryFullTime || 0);
    const estNetMonthly = Math.round(grossIncomeMonthly * 0.85);
    const monthlySaving = Number(plan.saving) || 5_000_000;
    const savingRatePct = estNetMonthly > 0 ? Math.min(100, Math.round((monthlySaving / estNetMonthly) * 100)) : 0;

    const fixedExpense = Math.max(1, (Number(plan.monthlyFixedExpense) || 12_000_000) + (Number(plan.monthlyDependentsCost) || 0));
    const emergencyVnd = passbooks.filter((p) => p.fundTag === 'EMERGENCY').reduce((s, p) => s + p.principal, 0) || Math.round(vndSavingsCapital * 0.35);
    const emergencyMonths = Number((emergencyVnd / fixedExpense).toFixed(1));

    const existingDebt = Number(cic.existingMonthlyDebtPayment) || 0;
    const dtiPct = estNetMonthly > 0 ? Number(((existingDebt / estNetMonthly) * 100).toFixed(1)) : 0;

    // 0-100 Wealth Health Score (4 equal 25-pt dimensions)
    const efScore = Math.min(25, Math.round((emergencyMonths / 6) * 25));
    const savScore = Math.min(25, Math.round((savingRatePct / 25) * 25));
    const divScore =
      passbooks.length >= 2 && fxTotalVnd > 0 ? 25 : passbooks.length >= 1 || fxTotalVnd > 0 ? 18 : 12;
    const dtiScore = dtiPct <= 25 ? 25 : dtiPct <= 40 ? 20 : dtiPct <= 55 ? 10 : 4;
    const healthScore = efScore + savScore + divScore + dtiScore;

    return {
      vndSavingsCapital,
      passbooksVnd,
      passbooksCount: passbooks.length,
      fxTotalVnd,
      fxCount: fxHoldings.length,
      totalLiquidWealthVnd,
      estNetMonthly,
      monthlySaving,
      savingRatePct,
      emergencyMonths,
      dtiPct,
      healthScore,
    };
  }, []);

  return (
    <Card className={cx('border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.07] via-surface to-emerald-500/[0.04] p-5', className)}>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Wallet className="size-4 text-indigo-300" />
            {tx('Bảng Cân Đối Tài Sản 360° Hợp Nhất', '360° Unified Household Net Worth', '360° 統合世帯資産バランス')}
          </span>
        }
        description={
          !isCompact
            ? tx(
                'Tự động gộp vốn Sổ tiết kiệm VND, danh mục Ngoại tệ FX quy đổi VND và dòng tiền Lương Net 2026.',
                'Consolidates VND savings capital, converted FX holdings, 2026 Net Salary flow, and debt safety.',
                'VND預金残高・外貨資産・2026年手取り収入・債務安全度をリアルタイムに統合表示します。'
              )
            : undefined
        }
        right={
          <Badge tone={summary.healthScore >= 75 ? 'success' : summary.healthScore >= 50 ? 'brand' : 'warning'}>
            <Sparkles className="size-3" />
            {tx(`Sức khỏe Tài sản: ${summary.healthScore}/100`, `Wealth Score: ${summary.healthScore}/100`, `資産健全度: ${summary.healthScore}/100`)}
          </Badge>
        }
      />

      <div className="mt-3">
        <Progress value={summary.healthScore} tone={summary.healthScore >= 75 ? 'emerald' : 'indigo'} />
      </div>

      <AdaptiveGrid cols={{ mobile: 2, tablet: 4, duo: 4, desktop: 4 }} className="mt-4">
        <div className="rounded-xl border border-white/[0.07] bg-canvas/55 p-3">
          <div className="text-[11px] text-zinc-500">{tx('Tổng Tài Sản Thanh Khoản', 'Total Liquid Wealth', '総流動資産（VND換算）')}</div>
          <div className="mt-1 text-lg font-bold text-white tabular-nums">{compact(summary.totalLiquidWealthVnd, lang)}</div>
          <div className="mt-0.5 text-[11px] text-emerald-300">
            VND {compact(summary.vndSavingsCapital, lang)} + FX {compact(summary.fxTotalVnd, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-canvas/55 p-3">
          <div className="text-[11px] text-zinc-500">{tx('Dòng tiền / Tỷ lệ Tiết kiệm', 'Est. Net & Saving Rate', '手取り・貯蓄率')}</div>
          <div className="mt-1 text-lg font-bold text-emerald-300 tabular-nums">{summary.savingRatePct}%</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            {compact(summary.monthlySaving, lang)} / {compact(summary.estNetMonthly, lang)}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-canvas/55 p-3">
          <div className="text-[11px] text-zinc-500">{tx('Độ phủ Quỹ dự phòng', 'Emergency Buffer', '緊急資金カバー')}</div>
          <div className="mt-1 text-lg font-bold text-indigo-300 tabular-nums">
            {summary.emergencyMonths} {tx('tháng', 'mo', 'ヶ月')}
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            {summary.passbooksCount > 0
              ? tx(`${summary.passbooksCount} sổ thực tế`, `${summary.passbooksCount} real passbooks`, `${summary.passbooksCount}件の預金`)
              : tx('Dựa trên vốn kế hoạch', 'From planner capital', '計画元本ベース')}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-canvas/55 p-3">
          <div className="text-[11px] text-zinc-500">{tx('Áp lực nợ (DTI)', 'Debt Burden (DTI)', '返済負担率')}</div>
          <div className="mt-1 text-lg font-bold text-amber-300 tabular-nums">{summary.dtiPct}%</div>
          <div className="mt-0.5 text-[11px] text-zinc-400">
            {summary.dtiPct <= 40
              ? tx('Trong ngưỡng an toàn', 'Healthy (<40%)', '安全圏 (<40%)')
              : tx('Nên giảm dư nợ', 'Trim debt load', '債務圧縮推奨')}
          </div>
        </div>
      </AdaptiveGrid>

      {!isCompact && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
          <Button as="a" href={href('plan')} size="sm" variant="secondary">
            {tx('Điều chỉnh /plan', 'Edit /plan', '/plan 調整')} <ArrowRight className="size-3" />
          </Button>
          <Button as="a" href={href('fx')} size="sm" variant="secondary">
            {tx('Cập nhật Ngoại tệ /fx', 'Update /fx', '/fx 更新')} <ArrowRight className="size-3" />
          </Button>
          <Button as="a" href={href('salary')} size="sm" variant="secondary">
            {tx('Tính Lương Net /salary', 'Calc /salary', '/salary 試算')} <ArrowRight className="size-3" />
          </Button>
          <Button as="a" href={href('cic')} size="sm" variant="secondary">
            <Landmark className="size-3 text-emerald-300" />
            {tx('Điểm CIC & Vay mua nhà /cic', 'CIC & Home Loan /cic', 'CIC・住宅ローン /cic')}
          </Button>
        </div>
      )}
    </Card>
  );
}
