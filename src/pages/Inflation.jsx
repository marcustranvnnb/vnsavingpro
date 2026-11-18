import React, { useMemo, useState } from 'react';
import { AlertTriangle, TrendingDown, ShieldCheck, Percent, Coins } from 'lucide-react';
import { useRates } from '../state.jsx';
import { loadSavedPlannerState, useServerCalc } from '../utils/apiClient.js';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import { chip, compact, fmt, pct, vnd } from '../utils/format.js';
import {
  Callout,
  Card,
  CardHeader,
  MoneyField,
  PageHeader,
  Progress,
  SliderField,
  Stat,
  Table,
  cx,
} from '../components/ui.jsx';

const presets = (arr) => arr.map((v) => ({ value: v, label: chip(v) }));

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
  const saved = useMemo(() => loadSavedPlannerState(), []);

  const initialBank = banks.find((b) => b.id === (saved.bankId || 'cake')) || banks[0];
  const initialRate =
    saved.customRate !== '' && Number(saved.customRate) > 0
      ? Number(saved.customRate)
      : getRate(initialBank, saved.tenure || '12M') || 6.9;

  const [targetIncome, setTargetIncome] = useState(() => Number(saved.target) || 10_000_000);
  const [nominalRate, setNominalRate] = useState(initialRate);
  const [inflationRate, setInflationRate] = useState(3.5);
  const [years, setYears] = useState(10);

  const inflationPayload = useMemo(
    () => ({
      nominalRate,
      inflationRate,
      targetPassiveIncome: targetIncome,
      years,
    }),
    [nominalRate, inflationRate, targetIncome, years]
  );

  const { data: inflationBundle, loading } = useServerCalc('inflation', inflationPayload, INITIAL_INFLATION_DATA);
  const { impact, futureNominalNeeded, rows } = inflationBundle;

  return (
    <>
      <PageHeader
        icon={TrendingDown}
        eyebrow="Lạm phát & sức mua"
        title="Lãi suất thực & sự bào mòn của lạm phát"
        description="Kiểm tra xem khoản thu nhập thụ động bạn dự kiến nhận trong tương lai sẽ tương đương bao nhiêu tiền theo mặt bằng giá hôm nay."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Controls */}
        <Card className="space-y-6 p-5 sm:p-6">
          <MoneyField
            label="Thu nhập thụ động mục tiêu / tháng"
            value={targetIncome}
            onChange={setTargetIncome}
            min={2_000_000}
            max={100_000_000}
            step={1_000_000}
            inputMax={1_000_000_000}
            presets={presets([5_000_000, 10_000_000, 20_000_000, 30_000_000])}
          />

          <SliderField
            label="Lãi suất tiết kiệm danh nghĩa"
            display={`${pct(nominalRate, 1)}/năm`}
            value={nominalRate}
            onChange={setNominalRate}
            min={1}
            max={15}
            step={0.1}
          />

          <SliderField
            label="Tỷ lệ lạm phát dự kiến"
            display={`${pct(inflationRate, 1)}/năm`}
            value={inflationRate}
            onChange={setInflationRate}
            min={0.5}
            max={12}
            step={0.1}
            hint="Lạm phát bình quân tại Việt Nam giai đoạn gần đây dao động khoảng 3,2% – 4,0%/năm."
          />

          <SliderField
            label="Số năm dự phóng"
            display={`${years} năm`}
            value={years}
            onChange={setYears}
            min={1}
            max={30}
            step={1}
          />
        </Card>

        {/* Results */}
        <div className={cx('min-w-0 space-y-5 transition-opacity', loading && 'opacity-75')}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat
              icon={Percent}
              label="Lãi suất thực (Fisher chuẩn)"
              tone={impact.fisherRealRate >= 3 ? 'emerald' : impact.fisherRealRate >= 0 ? 'amber' : 'red'}
              value={pct(impact.fisherRealRate, 2)}
              hint={`Trừ đơn giản: ${pct(impact.realRate, 1)} (${pct(nominalRate, 1)} − ${pct(inflationRate, 1)})`}
            />
            <Stat
              icon={Coins}
              label={`Sức mua sau ${years} năm`}
              value={compact(impact.equivalentCurrentValue)}
              hint={`Giữ được ${pct(impact.purchasingPowerRetainedPercent, 1)} giá trị`}
            />
            <Stat
              icon={TrendingDown}
              label="Sức mua bị hao hụt"
              tone="amber"
              value={`-${compact(impact.inflationLossAmount)}`}
              hint="so với mệnh giá hôm nay"
            />
            <Stat
              icon={ShieldCheck}
              label="Mục tiêu cần điều chỉnh"
              tone="indigo"
              value={compact(futureNominalNeeded)}
              hint={`để ngang bằng ${compact(targetIncome)} hôm nay`}
            />
          </div>

          {impact.realRate < 0 && (
            <Callout icon={AlertTriangle} tone="warning">
              <strong>Cảnh báo lãi suất thực âm:</strong> Lạm phát ({pct(inflationRate, 1)}) đang cao hơn lãi suất gửi
              tiết kiệm ({pct(nominalRate, 1)}). Bạn nên ưu tiên các gói kỳ hạn dài lãi suất cao hơn để bảo toàn sức
              mua.
            </Callout>
          )}

          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Bảng suy giảm sức mua qua từng năm"
              description={`Mệnh giá ${vnd(targetIncome)}/tháng thay đổi sức mua như thế nào khi lạm phát ở mức ${pct(inflationRate, 1)}/năm:`}
            />

            <Table
              className="mt-5 max-h-[480px]"
              head={[
                'Năm',
                'Mệnh giá nhận',
                'Sức mua thực tế (giá hôm nay)',
                'Cần nhận để giữ nguyên sức mua',
                'Tỷ lệ sức mua còn lại',
              ]}
            >
              {rows.map((r) => (
                <tr key={r.year} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-white">Năm {r.year}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{fmt(r.nominal)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-300">{fmt(r.realValue)}</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-300">{fmt(r.neededForSamePower)}</td>
                  <td className="w-40 px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Progress value={r.retainedPct} className="w-16" />
                      <span className="w-11 text-right text-xs text-zinc-400">{pct(r.retainedPct, 1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          <FeedbackWidget
            toolId="inflation"
            toolLabel="Lạm phát & sức mua"
            snapshot={{ targetIncome, nominalRate, inflationRate, years, fisherRealRate: impact.fisherRealRate }}
          />
        </div>
      </div>
    </>
  );
}
