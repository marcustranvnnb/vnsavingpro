import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowUpRight,
  BellRing,
  Globe2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { AdaptiveGrid, WorkspaceSplit } from '../components/AdaptiveLayout.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import { SavePlanPromptCard } from '../components/SavePlanPromptCard.jsx';
import {
  Badge,
  Button,
  CalculationLoader,
  Callout,
  Card,
  CardHeader,
  Chip,
  DecimalInput,
  NumberInput,
  PageHeader,
  Progress,
  Segmented,
  Stat,
  Table,
  cx,
} from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, useRates, useToast } from '../state.jsx';
import {
  consumeToolRestoreState,
  fetchFxRatesFromApi,
  loadSavedFxState,
  recordToolRun,
  saveFxState,
  useServerCalc,
} from '../utils/apiClient.js';
import { compact, fmt, pct, vnd } from '../utils/format.js';

const INITIAL_FX_CALC = {
  conversion: {
    fromCode: 'USD',
    toCode: 'VND',
    amount: 1000,
    rateType: 'transfer',
    convertedAmount: 25_600_000,
    unitRate: 25600,
    fromVndRate: 25600,
    toVndRate: 1,
    conversionSpreadPct: 0.74,
  },
  portfolio: {
    totalVndLiquidation: 0,
    totalVndReplacement: 0,
    totalVndMid: 0,
    nonVndVndValue: 0,
    fxExposurePct: 0,
    avgFxSpreadPct: 0,
    spreadLossVnd: 0,
    vndRateBenchmark: 6.9,
    vnd1YearBankInterest: 0,
    breakEvenFxAppreciationPct: 0,
    holdingsCount: 0,
  },
  breakdown: [],
  sensitivity: [],
  alerts: [],
  insights: [],
  fxUpdatedAt: '',
  fxSource: '',
};

const DEFAULT_FX_STATE = {
  convertFrom: 'USD',
  convertTo: 'VND',
  convertAmount: 1000,
  rateType: 'transfer',
  benchmarkVndRate: 6.9,
  holdings: [
    { code: 'USD', amount: 2500, note: '🤖 [Mẫu Bot / Dummy] Quỹ dự phòng USD tham khảo' },
    { code: 'JPY', amount: 150000, note: '🤖 [Mẫu Bot / Dummy] Tích luỹ Yên Nhật tham khảo' },
    { code: 'VND', amount: 120_000_000, note: 'Tiền gửi số 12T' },
  ],
  targetRates: [
    { code: 'USD', targetRate: 26200, direction: 'above' },
    { code: 'JPY', targetRate: 160, direction: 'below' },
  ],
};

function formatFxNumber(val, code, lang) {
  const locale = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'vi-VN';
  const decimals = code === 'VND' ? 0 : Number(val) < 10 ? 4 : 2;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number(val) || 0);
}

export default function FxManager() {
  const { lang, tx } = useI18n();
  const { user, getAccessToken } = useAuth();
  const { best } = useRates();
  const notify = useToast();
  const top12 = best('12M');

  const [fxFeed, setFxFeed] = useState({
    currencies: [],
    updatedAt: '',
    source: 'vietcombank_reference',
    loading: true,
  });

  const [formState, setFormState] = useState(() => {
    const restored = consumeToolRestoreState('fx');
    if (restored && typeof restored === 'object') {
      return { ...DEFAULT_FX_STATE, ...restored };
    }
    const saved = loadSavedFxState();
    if (saved && Object.keys(saved).length > 0) {
      return { ...DEFAULT_FX_STATE, ...saved };
    }
    return {
      ...DEFAULT_FX_STATE,
      benchmarkVndRate: Number(top12?.rate) || 6.9,
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [newCode, setNewCode] = useState('USD');
  const [newAmount, setNewAmount] = useState(1000);
  const [newNote, setNewNote] = useState('');
  const [newAlertCode, setNewAlertCode] = useState('USD');
  const [newAlertTarget, setNewAlertTarget] = useState(26000);
  const [newAlertDir, setNewAlertDir] = useState('above');

  const loadFeed = useCallback(
    async (force = false) => {
      setFxFeed((prev) => ({ ...prev, loading: true }));
      try {
        const res = await fetchFxRatesFromApi(force);
        setFxFeed({
          currencies: res.currencies || [],
          updatedAt: res.updatedAt || '',
          source: res.source || 'vietcombank_live',
          loading: false,
        });
        if (force) {
          notify(tx('Đã đồng bộ tỷ giá Vietcombank mới nhất', 'Synced live Vietcombank FX rates', '最新Vietcombank為替レートを同期しました'));
        }
      } catch {
        setFxFeed((prev) => ({ ...prev, loading: false }));
      }
    },
    [notify, tx]
  );

  useEffect(() => {
    loadFeed(false);
  }, [loadFeed]);

  useEffect(() => {
    saveFxState(formState);
  }, [formState]);

  const currencyOptions = useMemo(() => {
    const codes = ['VND', ...(fxFeed.currencies || []).map((c) => c.code)];
    return Array.from(new Set(codes.length > 1 ? codes : ['VND', 'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'SGD']));
  }, [fxFeed.currencies]);

  const filteredTableRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = fxFeed.currencies || [];
    if (!q) return list;
    return list.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [fxFeed.currencies, searchTerm]);

  const { data: res, loading, isDirty, run } = useServerCalc(
    'fx_portfolio',
    {
      holdings: formState.holdings,
      convertFrom: formState.convertFrom,
      convertTo: formState.convertTo,
      convertAmount: formState.convertAmount,
      rateType: formState.rateType,
      targetRates: formState.targetRates,
      benchmarkVndRate: formState.benchmarkVndRate,
    },
    INITIAL_FX_CALC,
    {
      mode: 'manual',
      minLoadingMs: 320,
      onSuccess: (calcJson, payload) => {
        const totalVnd = calcJson?.portfolio?.totalVndLiquidation || 0;
        const conv = calcJson?.conversion || {};
        recordToolRun({
          tool: 'fx',
          title: tx(
            `Danh mục ngoại tệ (${calcJson?.portfolio?.holdingsCount || 0} khoản · ${conv.fromCode}->${conv.toCode})`,
            `FX Portfolio (${calcJson?.portfolio?.holdingsCount || 0} assets · ${conv.fromCode}->${conv.toCode})`,
            `外貨ポートフォリオ（${calcJson?.portfolio?.holdingsCount || 0}件）`
          ),
          summary: tx(
            `Tổng quy đổi: ${compact(totalVnd, lang)} · Ngưỡng hoà vốn so với VND: +${calcJson?.portfolio?.breakEvenFxAppreciationPct || 0}%/năm`,
            `Converted Wealth: ${compact(totalVnd, lang)} · Hurdle vs VND Savings: +${calcJson?.portfolio?.breakEvenFxAppreciationPct || 0}% p.a.`,
            `総評価額：${compact(totalVnd, lang)}・VND預金損益分岐：年+${calcJson?.portfolio?.breakEvenFxAppreciationPct || 0}%`
          ),
          metrics: [
            { label: tx('Tổng quy đổi VND', 'Converted VND', 'VND換算総額'), value: compact(totalVnd, lang), tone: 'emerald' },
            { label: tx('Tỷ trọng ngoại tệ', 'FX Exposure', '外貨比率'), value: `${calcJson?.portfolio?.fxExposurePct || 0}%`, tone: 'indigo' },
            { label: tx('Hurdle vs Tiết kiệm VND', 'VND Hurdle', 'VND預金損益分岐'), value: `+${calcJson?.portfolio?.breakEvenFxAppreciationPct || 0}%`, tone: 'amber' },
          ],
          inputs: payload,
          accessToken: user ? getAccessToken() : null,
        });
      },
    }
  );

  const handleSwapPair = () => {
    setFormState((prev) => ({
      ...prev,
      convertFrom: prev.convertTo,
      convertTo: prev.convertFrom,
    }));
  };

  const handleAddHolding = (e) => {
    e.preventDefault();
    const amt = Number(newAmount) || 0;
    if (amt <= 0) return;
    setFormState((prev) => ({
      ...prev,
      holdings: [
        ...prev.holdings,
        { code: newCode, amount: amt, note: newNote.trim().slice(0, 60) },
      ],
    }));
    setNewNote('');
  };

  const handleRemoveHolding = (idx) => {
    setFormState((prev) => ({
      ...prev,
      holdings: prev.holdings.filter((_, i) => i !== idx),
    }));
  };

  const handleAddAlert = (e) => {
    e.preventDefault();
    const targetVal = Number(newAlertTarget) || 0;
    if (targetVal <= 0 || newAlertCode === 'VND') return;
    setFormState((prev) => ({
      ...prev,
      targetRates: [
        ...(prev.targetRates || []).filter((t) => t.code !== newAlertCode),
        { code: newAlertCode, targetRate: targetVal, direction: newAlertDir },
      ],
    }));
  };

  const conv = res.conversion || INITIAL_FX_CALC.conversion;
  const port = res.portfolio || INITIAL_FX_CALC.portfolio;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ArrowLeftRight}
        eyebrow={tx('Bộ Công Cụ 2 · Quản Trị Ngoại Tệ', 'Suite 2 · FX & Currency Management', 'ツール群2・外貨・為替管理')}
        title={tx('Theo dõi tỷ giá & Quản trị tài sản Ngoại tệ', 'Live Exchange Rates & FX Wealth Manager', 'リアルタイム為替・外貨資産管理')}
        description={tx(
          'Đồng bộ tỷ giá Vietcombank trực tiếp, quy đổi đa ngoại tệ tức thì, định giá danh mục tài sản quy đổi VND, Stress-test biến động và so sánh ngưỡng hoà vốn với gửi tiết kiệm VND.',
          'Live Vietcombank FX feed, instant multi-currency conversion, VND wealth valuation, exchange-rate sensitivity testing, and yield-hurdle comparison against VND bank deposits.',
          'Vietcombank公式為替レートと連携し、多通貨資産の評価・ストレステスト・VND定期預金との損益分岐比較を行えます。'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={fxFeed.source === 'vietcombank_live' ? 'success' : 'brand'}>
              {fxFeed.source === 'vietcombank_live'
                ? tx('Vietcombank Live', 'Vietcombank Live', 'VCBライブ')
                : tx('Tham chiếu Vietcombank', 'VCB Reference', 'VCB基準レート')}
              {fxFeed.updatedAt ? ` · ${fxFeed.updatedAt}` : ''}
            </Badge>
            <Button type="button" size="sm" variant="secondary" disabled={fxFeed.loading} onClick={() => loadFeed(true)}>
              <RefreshCw className={cx('size-3.5', fxFeed.loading && 'animate-spin')} />
              {tx('Làm mới tỷ giá', 'Refresh FX', 'レート更新')}
            </Button>
          </div>
        }
      />

      <WorkspaceSplit
        resultsId="fx-results"
        mobileSummary={{
          eyebrow: tx('Tổng quy đổi danh mục', 'Total Portfolio (VND)', '総資産評価額'),
          value: compact(port.totalVndLiquidation, lang),
          ctaLabel: tx('Xem phân tích', 'Inspect', '詳細を見る'),
        }}
        runAction={{
          isDirty,
          loading,
          onRun: run,
          label: tx('Phân tích danh mục & Quy đổi FX', 'Analyze FX Portfolio', '外貨ポートフォリオ計算'),
        }}
        controls={
          <div className="space-y-5">
            {/* Converter controls */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                {tx('1. Quy đổi ngoại tệ nhanh', '1. Quick FX Converter', '1. 通貨換算')}
              </h3>
              <div className="mt-3 space-y-3">
                <NumberInput
                  value={formState.convertAmount}
                  onChange={(val) => setFormState((prev) => ({ ...prev, convertAmount: val }))}
                  max={100_000_000_000}
                  suffix={formState.convertFrom}
                  ariaLabel={tx('Số tiền cần quy đổi', 'Amount to convert', '換算金額')}
                />
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <select
                    value={formState.convertFrom}
                    onChange={(e) => setFormState((prev) => ({ ...prev, convertFrom: e.target.value }))}
                    className="select h-10 rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-sm font-medium text-white focus:border-indigo-400/60 focus:outline-none"
                  >
                    {currencyOptions.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSwapPair}
                    title={tx('Đảo cặp tiền tệ', 'Swap pair', '通貨入替')}
                    className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-indigo-300 transition hover:bg-indigo-500/20 hover:text-white"
                  >
                    <ArrowLeftRight className="size-4" />
                  </button>
                  <select
                    value={formState.convertTo}
                    onChange={(e) => setFormState((prev) => ({ ...prev, convertTo: e.target.value }))}
                    className="select h-10 rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-sm font-medium text-white focus:border-indigo-400/60 focus:outline-none"
                  >
                    {currencyOptions.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] text-zinc-400">
                    {tx('Loại tỷ giá mua áp dụng:', 'Buy-rate basis:', '適用買取レート：')}
                  </div>
                  <Segmented
                    size="sm"
                    value={formState.rateType}
                    onChange={(val) => setFormState((prev) => ({ ...prev, rateType: val }))}
                    options={[
                      { value: 'transfer', label: tx('Chuyển khoản', 'Transfer', '振込') },
                      { value: 'cash', label: tx('Tiền mặt', 'Cash', '現金') },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Holdings */}
            <div className="border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  {tx('2. Danh mục nắm giữ (VND & Ngoại tệ)', '2. Multi-Currency Holdings', '2. 保有通貨資産')}
                </h3>
                <div className="flex items-center gap-1.5">
                  {formState.holdings.some((h) => String(h.note || '').includes('[Mẫu Bot')) && (
                    <Badge tone="neutral">🤖 {tx('Có dòng mẫu', 'Includes Dummy', 'サンプル含む')}</Badge>
                  )}
                  <Badge tone="neutral">{formState.holdings.length}</Badge>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {formState.holdings.map((h, idx) => (
                  <div
                    key={`${h.code}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono font-semibold text-indigo-200">
                          {h.code}
                        </span>
                        <span className="truncate font-semibold tabular-nums text-white">
                          {formatFxNumber(h.amount, h.code, lang)}
                        </span>
                      </div>
                      {h.note && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{h.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveHolding(idx)}
                      className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/15 hover:text-red-300"
                      aria-label={tx('Xoá khoản nắm giữ', 'Remove holding', '削除')}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddHolding} className="mt-3 space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="select h-9 rounded-lg border border-white/10 bg-canvas/80 px-2.5 text-xs text-white focus:outline-none"
                  >
                    {currencyOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <NumberInput
                    value={newAmount}
                    onChange={setNewAmount}
                    max={100_000_000_000}
                    className="h-9"
                    ariaLabel={tx('Số lượng ngoại tệ', 'Holding amount', '保有量')}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    maxLength={60}
                    placeholder={tx('Ghi chú (VD: Dự phòng du học)', 'Note (optional)', 'メモ（任意）')}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-canvas/80 px-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    <Plus className="size-3.5" /> {tx('Thêm', 'Add', '追加')}
                  </Button>
                </div>
              </form>
            </div>

            {/* VND Benchmark */}
            <div className="border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-300">
                  {tx('Lãi suất VND đối chiếu (%/năm)', 'VND 12M Benchmark Yield (%)', '比較用VND定期金利 (%)')}
                </span>
                <button
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, benchmarkVndRate: Number(top12.rate) || 6.9 }))}
                  className="text-[11px] text-emerald-300 hover:underline"
                >
                  {top12.bank.name} ({pct(top12.rate, 2, lang)})
                </button>
              </div>
              <div className="mt-2">
                <DecimalInput
                  value={formState.benchmarkVndRate}
                  onChange={(val) => setFormState((prev) => ({ ...prev, benchmarkVndRate: val }))}
                  suffix="%/năm"
                  min={0}
                  max={25}
                  step={0.1}
                />
              </div>
            </div>

            {/* Target Alerts */}
            <div className="border-t border-white/[0.07] pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <BellRing className="size-3.5" />
                {tx('3. Mốc tỷ giá theo dõi (Watchlist)', '3. Target Rate Watchlist', '3. 目標レート監視')}
              </div>
              <form onSubmit={handleAddAlert} className="mt-2.5 grid grid-cols-3 gap-1.5">
                <select
                  value={newAlertCode}
                  onChange={(e) => setNewAlertCode(e.target.value)}
                  className="select h-9 rounded-lg border border-white/10 bg-canvas/80 px-2 text-xs text-white"
                >
                  {currencyOptions
                    .filter((c) => c !== 'VND')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
                <select
                  value={newAlertDir}
                  onChange={(e) => setNewAlertDir(e.target.value)}
                  className="select h-9 rounded-lg border border-white/10 bg-canvas/80 px-2 text-xs text-white"
                >
                  <option value="above">{tx('Bán >=', 'Sell >=', '以上')}</option>
                  <option value="below">{tx('Mua <=', 'Buy <=', '以下')}</option>
                </select>
                <NumberInput value={newAlertTarget} onChange={setNewAlertTarget} max={10_000_000} className="h-9" />
                <Button type="submit" size="sm" variant="secondary" className="col-span-3">
                  <Plus className="size-3.5" /> {tx('Đặt mốc cảnh báo tỷ giá', 'Set Rate Target', '目標レートを設定')}
                </Button>
              </form>
            </div>
          </div>
        }
        results={
          <div className="space-y-6">
            <CalculationLoader loading={loading} label={tx('Đang phân tích danh mục ngoại tệ & tỷ giá Vietcombank...', 'Analyzing multi-currency FX portfolio...', '為替レートと外貨資産を分析中...')} />

            {/* Top Conversion + Portfolio KPIs */}
            <Card className="border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] via-surface to-emerald-500/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-zinc-400">
                    {tx('Kết quả quy đổi theo tỷ giá Vietcombank', 'Live Conversion Estimate', 'リアルタイム両替試算')}
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-lg font-medium text-zinc-300 tabular-nums">
                      {formatFxNumber(conv.amount, conv.fromCode, lang)} {conv.fromCode} =
                    </span>
                    <span className="text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
                      {formatFxNumber(conv.convertedAmount, conv.toCode, lang)} {conv.toCode}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 tabular-nums">
                    1 {conv.fromCode} ≈ {formatFxNumber(conv.unitRate, conv.toCode, lang)} {conv.toCode} ·{' '}
                    {tx('Chênh lệch spread ước tính:', 'Est. spread cost:', '推定スプレッド：')} {conv.conversionSpreadPct}%
                  </p>
                </div>
                <Button as="a" href={href('plan')} size="sm" variant="secondary">
                  {tx('Gửi VND vào Kế hoạch', 'Route to Planner', 'プランへ反映')} <ArrowUpRight className="size-3.5" />
                </Button>
              </div>
            </Card>

            <AdaptiveGrid cols={{ mobile: 2, tablet: 4, duo: 2, desktop: 4 }}>
              <Stat
                label={tx('Tổng tài sản quy đổi VND', 'Converted Wealth (Sell Price)', '総資産額（VND売却換算）')}
                value={compact(port.totalVndLiquidation, lang)}
                hint={vnd(port.totalVndLiquidation, lang)}
                tone="emerald"
              />
              <Stat
                label={tx('Tỷ trọng Ngoại tệ', 'FX Exposure Share', '外貨エクスポージャー')}
                value={`${port.fxExposurePct}%`}
                hint={compact(port.nonVndVndValue, lang)}
                tone="indigo"
              />
              <Stat
                label={tx('Ngưỡng hoà vốn vs VND', 'Hurdle vs VND Deposit', 'VND定期との損益分岐')}
                value={`+${port.breakEvenFxAppreciationPct}%`}
                hint={tx(`Gồm ${port.vndRateBenchmark}% lãi + ${port.avgFxSpreadPct}% spread`, `${port.vndRateBenchmark}% bank yield + ${port.avgFxSpreadPct}% spread`, `預金${port.vndRateBenchmark}%+スプレッド${port.avgFxSpreadPct}%`)}
                tone="amber"
              />
              <Stat
                label={tx('Tiền lãi VND đối chiếu / năm', '12M VND Bank Benchmark', 'VND12ヶ月運用比較利息')}
                value={`+${compact(port.vnd1YearBankInterest, lang)}`}
                hint={tx('Nếu giữ toàn bộ bằng VND', 'If 100% held in VND term deposit', '全額をVND定期預金にした場合')}
              />
            </AdaptiveGrid>

            {/* Insights */}
            {Array.isArray(res.insights) && res.insights.length > 0 && (
              <div className="space-y-2.5">
                {res.insights.map((msg, i) => (
                  <Callout key={i} icon={i === 0 ? AlertTriangle : Sparkles} tone={i === 0 ? 'warning' : 'brand'}>
                    {msg}
                  </Callout>
                ))}
              </div>
            )}

            {/* Watchlist Alerts */}
            {Array.isArray(res.alerts) && res.alerts.length > 0 && (
              <Card className="p-5">
                <CardHeader
                  title={tx('Theo dõi mốc tỷ giá mục tiêu', 'Target Exchange Rate Watchlist', '目標為替レート監視')}
                  description={tx(
                    'Hệ thống tự đối chiếu tỷ giá mua/bán Vietcombank với ngưỡng kỳ vọng của bạn.',
                    'Compares current Vietcombank buy/sell levels against your target thresholds.',
                    'Vietcombankの実勢レートと目標ラインを比較します。'
                  )}
                  right={<BellRing className="size-4 text-amber-300" />}
                />
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {res.alerts.map((a) => (
                    <div
                      key={a.code}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-white">{a.code}/VND</span>
                          <Badge
                            tone={
                              a.status === 'reached' ? 'success' : a.status === 'close' ? 'warning' : 'neutral'
                            }
                          >
                            {a.status === 'reached'
                              ? tx('Đã chạm mốc!', 'Reached!', '達成！')
                              : a.status === 'close'
                                ? tx('Sắp chạm', 'Near Target', '接近中')
                                : tx('Đang theo dõi', 'Watching', '監視中')}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400 tabular-nums">
                          {tx('Hiện tại:', 'Live:', '現在：')} {fmt(a.currentRate)} ₫ · {tx('Mục tiêu:', 'Target:', '目標：')} {fmt(a.targetRate)} ₫
                        </p>
                      </div>
                      <span
                        className={cx(
                          'text-xs font-semibold tabular-nums',
                          a.status === 'reached' ? 'text-emerald-300' : 'text-zinc-400'
                        )}
                      >
                        {a.gapPct > 0 ? `+${a.gapPct}%` : `${a.gapPct}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Breakdown & Stress Test */}
            <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
              <Card className="p-5">
                <CardHeader
                  title={tx('Cơ cấu phân bổ tiền tệ', 'Currency Allocation Weights', '通貨別資産構成比')}
                  right={<ShieldCheck className="size-4 text-emerald-300" />}
                />
                <div className="mt-4 space-y-3.5">
                  {(res.breakdown || []).map((b) => (
                    <div key={`${b.code}-${b.note}`}>
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="font-medium text-white">
                          {b.code}{' '}
                          <span className="text-zinc-500">
                            ({formatFxNumber(b.amount, b.code, lang)}
                            {b.note ? ` · ${b.note}` : ''})
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums text-emerald-300">
                          {compact(b.vndLiquidation, lang)} ({b.sharePct}%)
                        </span>
                      </div>
                      <Progress
                        value={b.sharePct}
                        tone={b.code === 'VND' ? 'emerald' : 'indigo'}
                        className="mt-1.5"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <CardHeader
                  title={tx('Stress-Test biến động tỷ giá', 'FX Sensitivity Stress-Test', '為替変動ストレステスト')}
                  description={tx(
                    'Ước tính tác động lên tổng tài sản khi tỷ giá ngoại tệ biến động ±2% đến +10%.',
                    'Impact on converted net worth if foreign currencies move -5% to +10% against VND.',
                    '外貨が対VNDで-5%〜+10%変動した場合の資産額シミュレーション。'
                  )}
                  right={<TrendingUp className="size-4 text-indigo-300" />}
                />
                <div className="mt-4 space-y-2">
                  {(res.sensitivity || []).map((s) => (
                    <div
                      key={s.shiftPct}
                      className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2 text-xs tabular-nums"
                    >
                      <span className="font-medium text-zinc-300">
                        {s.shiftPct === 0
                          ? tx('Tỷ giá hiện tại (0%)', 'Current Spot (0%)', '現在レート (0%)')
                          : `${s.shiftPct > 0 ? `+${s.shiftPct}` : s.shiftPct}%`}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{compact(s.projectedTotalVnd, lang)}</span>
                        <span
                          className={cx(
                            'w-24 text-right font-medium',
                            s.deltaVnd > 0 ? 'text-emerald-300' : s.deltaVnd < 0 ? 'text-red-300' : 'text-zinc-500'
                          )}
                        >
                          {s.deltaVnd > 0 ? `+${compact(s.deltaVnd, lang)}` : s.deltaVnd < 0 ? compact(s.deltaVnd, lang) : '0 ₫'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </AdaptiveGrid>

            {/* Live VCB Exchange Rate Board */}
            <Card className="p-5">
              <CardHeader
                title={tx('Bảng tỷ giá Vietcombank chính thức', 'Official Vietcombank FX Board', 'Vietcombank 公式為替レート一覧')}
                description={tx(
                  'Đơn vị: VND / 1 đơn vị ngoại tệ · Nguồn XML công khai của Vietcombank.',
                  'Unit: VND per 1 unit of foreign currency · Sourced from Vietcombank public feed.',
                  '単位：1外貨あたりのVND価格（Vietcombank公開フィード準拠）'
                )}
                right={
                  <div className="relative w-44 sm:w-56">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-zinc-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={tx('Tìm USD, JPY, EUR...', 'Filter currency...', '通貨を検索...')}
                      className="h-8 w-full rounded-lg border border-white/10 bg-canvas/80 pl-8 pr-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
                    />
                  </div>
                }
              />
              <div className="mt-4">
                <Table
                  head={[
                    tx('Mã ngoại tệ', 'Currency', '通貨'),
                    tx('Mua tiền mặt', 'Cash Buy', '現金買'),
                    tx('Mua chuyển khoản', 'Transfer Buy', '電信買'),
                    tx('Bán ra', 'Bank Sell', '売却'),
                    tx('Spread', 'Spread', 'スプレッド'),
                  ]}
                >
                  {filteredTableRows.map((c) => (
                    <tr key={c.code} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 sm:px-4">
                        <div className="flex items-center gap-2">
                          <Globe2 className="size-3.5 text-indigo-300" />
                          <div>
                            <div className="font-mono font-semibold text-white">{c.code}</div>
                            <div className="text-[11px] text-zinc-500">{c.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-zinc-300 sm:px-4">{fmt(c.buy)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-emerald-300 sm:px-4">{fmt(c.transfer)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-white sm:px-4">{fmt(c.sell)}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-400 sm:px-4">{c.spreadPct}%</td>
                    </tr>
                  ))}
                </Table>
              </div>
            </Card>

            <SavePlanPromptCard />
            <FeedbackWidget
              tool="fx"
              toolLabel={tx('Quản trị ngoại tệ FX', 'FX Currency Manager', '外貨FX管理')}
              snapshot={{ holdings: formState.holdings.length, benchmark: formState.benchmarkVndRate }}
            />
          </div>
        }
      />
    </div>
  );
}
