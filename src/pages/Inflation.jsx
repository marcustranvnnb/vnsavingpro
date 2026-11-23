import React, { useMemo, useState } from 'react';
import { AlertTriangle, TrendingDown, ShieldCheck, Percent, Coins } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useRates } from '../state.jsx';
import { consumeToolRestoreState, loadSavedPlannerState, recordToolRun, useServerCalc } from '../utils/apiClient.js';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import { SavePlanPromptCard } from '../components/SavePlanPromptCard.jsx';
import { AdaptiveGrid, WorkspaceSplit } from '../components/AdaptiveLayout.jsx';
import { chip, compact, fmt, pct, vnd } from '../utils/format.js';
import {
  CalculationLoader,
  Callout,
  Card,
  CardHeader,
  MoneyField,
  PageHeader,
  Progress,
  SliderField,
  Stat,
  Table,
} from '../components/ui.jsx';

const INITIAL_INFLATION_DATA = {
  impact: {
    realRate: 3.4,
    fisherRealRate: 3.29,
    equivalentCurrentValue: 0,
    inflationLossAmount: 0,
    purchasingPowerRetainedPercent: 0,
  },
  futureNominalNeeded: 0,
  rows: [],
};

export default function Inflation() {
  const { banks, getRate } = useRates();
  const { getAccessToken } = useAuth();
  const { lang, tx } = useI18n();
  const saved = useMemo(() => loadSavedPlannerState(), []);
  const restored = useMemo(() => consumeToolRestoreState('inflation'), []);

  const initialBank = banks.find((b) => b.id === (saved.bankId || 'cake')) || banks[0];
  const initialRate =
    restored?.nominalRate !== undefined
      ? Number(restored.nominalRate)
      : saved.customRate !== '' && Number(saved.customRate) > 0
        ? Number(saved.customRate)
        : getRate(initialBank, saved.tenure || '12M') || 6.9;

  const [targetIncome, setTargetIncome] = useState(() => Number(restored?.targetIncome) || Number(saved.target) || 10_000_000);
  const [nominalRate, setNominalRate] = useState(initialRate);
  const [inflationRate, setInflationRate] = useState(() =>
    restored?.inflationRate !== undefined ? Number(restored.inflationRate) : 3.5
  );
  const [years, setYears] = useState(() => Number(restored?.years) || 10);

  const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v, lang) }));

  const inflationPayload = useMemo(
    () => ({
      nominalRate,
      inflationRate,
      targetPassiveIncome: targetIncome,
      years,
    }),
    [nominalRate, inflationRate, targetIncome, years]
  );

  const {
    data: inflationBundle,
    loading,
    isDirty,
    run,
  } = useServerCalc('inflation', inflationPayload, INITIAL_INFLATION_DATA, {
    mode: 'manual',
    minLoadingMs: 320,
    onSuccess: (resData) => {
      const imp = resData?.impact || {};
      recordToolRun({
        tool: 'inflation',
        title: `${compact(targetIncome, lang)}${tx('/th', '/mo', '/月')} · ${years} ${tx('năm', 'yrs', '年')} (CPI ${pct(inflationRate, 1, lang)})`,
        householdMode: 'INDIVIDUAL',
        summary: `${tx('Lãi thực:', 'Real yield:', '実質利回り：')} ${pct(imp.fisherRealRate || 0, 2, lang)} · ${tx('Sức mua:', 'Power:', '実質購買力：')} ${compact(imp.equivalentCurrentValue || 0, lang)}`,
        metrics: [
          { label: tx('Lãi thực Fisher', 'Fisher Real', '実質利回り'), value: pct(imp.fisherRealRate || 0, 2, lang), tone: 'emerald' },
          { label: tx('Sức mua sau này', 'Future Power', '実質購買力'), value: compact(imp.equivalentCurrentValue || 0, lang), tone: 'indigo' },
          { label: tx('Cần điều chỉnh lên', 'Adj. Target', '調整後目標'), value: compact(resData?.futureNominalNeeded || 0, lang), tone: 'amber' },
        ],
        inputs: {
          targetIncome,
          nominalRate,
          inflationRate,
          years,
        },
        accessToken: getAccessToken(),
      });
    },
  });
  const { impact, futureNominalNeeded, rows } = inflationBundle;

  return (
    <>
      <PageHeader
        icon={TrendingDown}
        eyebrow={tx('Lạm phát & sức mua', 'Inflation & Purchasing Power', 'インフレ率と実質購買力')}
        title={tx('Lãi suất thực & sự bào mòn của lạm phát', 'Real Interest Rate & Inflation Erosion', '実質利回りとインフレによる購買力低下')}
        description={tx(
          'Kiểm tra xem khoản thu nhập thụ động bạn dự kiến nhận trong tương lai sẽ tương đương bao nhiêu tiền theo mặt bằng giá hôm nay.',
          'Check how much your future monthly passive income will actually buy in today’s purchasing power.',
          '将来の毎月の不労所得が、現在の物価水準に換算するといくらに相当するかを試算します。'
        )}
      />

      <WorkspaceSplit
        resultsId="inflation-results"
        runAction={{
          onRun: run,
          isDirty,
          loading,
          label: tx('Tính sức mua thực tế', 'Run Inflation Model', '実質購買力を計算'),
          loadingLabel: tx('Đang tính lãi thực & sức mua...', 'Computing Purchasing Power...', '実質購買力を計算中...'),
          dirtyLabel: tx(
            'Lãi suất, lạm phát hoặc số năm đã thay đổi — bấm "Tính sức mua thực tế" để cập nhật.',
            'Rate or inflation changed — press "Run Inflation Model" to refresh.',
            '条件が変更されました。「実質購買力を計算」を押してください。'
          ),
        }}
        mobileSummary={{
          eyebrow: tx('Sức mua thực tế sau lạm phát', 'Real Purchasing Power', '実質購買力'),
          value: `${compact(impact.equivalentCurrentValue, lang)} · ${tx('Thực:', 'Real:', '実質：')} ${pct(impact.fisherRealRate, 2, lang)}`,
        }}
        controls={
          <div className="space-y-6">
            <MoneyField
              label={tx('Thu nhập thụ động mục tiêu / tháng', 'Target Monthly Passive Income', '目標とする毎月の不労所得')}
              value={targetIncome}
              onChange={setTargetIncome}
              min={2_000_000}
              max={100_000_000}
              step={1_000_000}
              inputMax={1_000_000_000}
              presets={presets([5_000_000, 10_000_000, 20_000_000, 30_000_000])}
            />

            <SliderField
              label={tx('Lãi suất tiết kiệm danh nghĩa', 'Nominal Savings Interest Rate', '名目預金金利')}
              display={`${pct(nominalRate, 1, lang)}${tx('/năm', '/yr', '/年')}`}
              value={nominalRate}
              onChange={setNominalRate}
              min={1}
              max={15}
              step={0.1}
            />

            <SliderField
              label={tx('Tỷ lệ lạm phát dự kiến', 'Expected Annual Inflation', '予想インフレ率（年率）')}
              display={`${pct(inflationRate, 1, lang)}${tx('/năm', '/yr', '/年')}`}
              value={inflationRate}
              onChange={setInflationRate}
              min={0.5}
              max={12}
              step={0.1}
              hint={tx(
                'Lạm phát bình quân tại Việt Nam giai đoạn gần đây dao động khoảng 3,2% – 4,0%/năm.',
                'Average CPI inflation in Vietnam in recent years typically ranges around 3.2% – 4.0% per year.',
                '近年のベトナムの消費者物価インフレ率は概ね年3.2%〜4.0%程度で推移しています。'
              )}
            />

            <SliderField
              label={tx('Số năm dự phóng', 'Projection Horizon', '試算年数')}
              display={`${years} ${tx('năm', years === 1 ? 'year' : 'years', '年')}`}
              value={years}
              onChange={setYears}
              min={1}
              max={30}
              step={1}
            />
          </div>
        }
        results={
          loading ? (
            <CalculationLoader
              title={tx('Đang phân tích lãi thực Fisher & sức mua từng năm...', 'Calculating Fisher real yield & purchasing power...', 'フィッシャー実質金利と購買力を分析中...')}
            />
          ) : (
            <div className="space-y-5 animate-fade">
              <AdaptiveGrid cols={{ mobile: 2, tablet: 2, duo: 2, desktop: 4 }}>
              <Stat
                icon={Percent}
                label={tx('Lãi suất thực (Fisher chuẩn)', 'Real Yield (Fisher Exact)', '実質利回り (Fisher)')}
                tone={impact.fisherRealRate >= 3 ? 'emerald' : impact.fisherRealRate >= 0 ? 'amber' : 'red'}
                value={pct(impact.fisherRealRate, 2, lang)}
                hint={tx(
                  `Trừ đơn giản: ${pct(impact.realRate, 1, lang)} (${pct(nominalRate, 1, lang)} − ${pct(inflationRate, 1, lang)})`,
                  `Simple spread: ${pct(impact.realRate, 1, lang)} (${pct(nominalRate, 1, lang)} − ${pct(inflationRate, 1, lang)})`,
                  `単純差：${pct(impact.realRate, 1, lang)}`
                )}
              />
              <Stat
                icon={Coins}
                label={tx(`Sức mua sau ${years} năm`, `Buying Power in ${years} Yrs`, `${years}年後の実質購買力`)}
                value={compact(impact.equivalentCurrentValue, lang)}
                hint={tx(
                  `Giữ được ${pct(impact.purchasingPowerRetainedPercent, 1, lang)} giá trị`,
                  `Retains ${pct(impact.purchasingPowerRetainedPercent, 1, lang)} of value`,
                  `価値の ${pct(impact.purchasingPowerRetainedPercent, 1, lang)} を維持`
                )}
              />
              <Stat
                icon={TrendingDown}
                label={tx('Sức mua bị hao hụt', 'Purchasing Power Lost', 'インフレによる目減り額')}
                tone="amber"
                value={`-${compact(impact.inflationLossAmount, lang)}`}
                hint={tx('so với mệnh giá hôm nay', 'vs. nominal value today', '現在の額面価値と比較')}
              />
              <Stat
                icon={ShieldCheck}
                label={tx('Mục tiêu cần điều chỉnh', 'Inflation-Adjusted Target', 'インフレ調整後目標')}
                tone="indigo"
                value={compact(futureNominalNeeded, lang)}
                hint={tx(
                  `để ngang bằng ${compact(targetIncome, lang)} hôm nay`,
                  `to equal ${compact(targetIncome, lang)} today`,
                  `現在の${compact(targetIncome, lang)}相当`
                )}
              />
            </AdaptiveGrid>

            {impact.realRate < 0 && (
              <Callout icon={AlertTriangle} tone="warning">
                <strong>{tx('Cảnh báo lãi suất thực âm:', 'Negative Real Interest Warning:', '実質マイナス金利の警告：')}</strong>{' '}
                {tx(
                  `Lạm phát (${pct(inflationRate, 1, lang)}) đang cao hơn lãi suất gửi tiết kiệm (${pct(nominalRate, 1, lang)}). Bạn nên ưu tiên các gói kỳ hạn dài lãi suất cao hơn để bảo toàn sức mua.`,
                  `Inflation (${pct(inflationRate, 1, lang)}) exceeds your nominal deposit rate (${pct(nominalRate, 1, lang)}). Prioritize longer tenures with higher yields to preserve purchasing power.`,
                  `インフレ率 (${pct(inflationRate, 1, lang)}) が名目預金金利 (${pct(nominalRate, 1, lang)}) を上回っています。購買力を守るため高金利の長期定期をご検討ください。`
                )}
              </Callout>
            )}

            <Card className="p-5 sm:p-6">
              <CardHeader
                title={tx('Bảng suy giảm sức mua qua từng năm', 'Year-by-Year Purchasing Power Table', '年別 購買力推移テーブル')}
                description={tx(
                  `Mệnh giá ${vnd(targetIncome, lang)}/tháng thay đổi sức mua như thế nào khi lạm phát ở mức ${pct(inflationRate, 1, lang)}/năm:`,
                  `How ${vnd(targetIncome, lang)}/month changes in real value at ${pct(inflationRate, 1, lang)}/yr inflation:`,
                  `年率 ${pct(inflationRate, 1, lang)} のインフレ下で毎月 ${vnd(targetIncome, lang)} の実質価値がどう推移するか：`
                )}
              />

              <Table
                className="mt-5 max-h-[480px]"
                head={[
                  tx('Năm', 'Year', '年次'),
                  tx('Mệnh giá nhận', 'Nominal Payout', '名目受取額'),
                  tx('Sức mua thực tế (giá hôm nay)', 'Real Value (Today)', '実質購買力（現在価値）'),
                  tx('Cần nhận để giữ nguyên sức mua', 'Nominal Needed to Match', '購買力維持に必要な額'),
                  tx('Tỷ lệ sức mua còn lại', 'Retained Power', '残存購買力率'),
                ]}
              >
                {rows.map((r) => (
                  <tr key={r.year} className="hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                      {tx(`Năm ${r.year}`, `Year ${r.year}`, `${r.year}年目`)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">{fmt(r.nominal, lang)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-300">{fmt(r.realValue, lang)}</td>
                    <td className="px-4 py-3 text-right font-medium text-indigo-300">{fmt(r.neededForSamePower, lang)}</td>
                    <td className="w-40 px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={r.retainedPct} className="w-16" />
                        <span className="w-11 text-right text-xs text-zinc-400">{pct(r.retainedPct, 1, lang)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>

            <SavePlanPromptCard />

            <FeedbackWidget
              toolId="inflation"
              toolLabel={tx('Lạm phát & sức mua', 'Inflation & Purchasing Power', 'インフレ実質値')}
              snapshot={{ targetIncome, nominalRate, inflationRate, years, fisherRealRate: impact.fisherRealRate }}
            />
          </div>
          )
        }
      />
    </>
  );
}
