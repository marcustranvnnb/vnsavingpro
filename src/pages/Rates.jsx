import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pencil,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { getBankCopy, useI18n } from '../i18n/index.jsx';
import { href, useRates, useToast } from '../state.jsx';
import { DIGITAL_BANKS } from '../data/bankPackagesData.js';
import { safeExternalUrl } from '../utils/cryptoStorage.js';
import { fmt, pct } from '../utils/format.js';
import {
  Badge,
  BankMark,
  Button,
  Card,
  CardHeader,
  DecimalInput,
  Modal,
  PageHeader,
  RateDisclaimer,
  Segmented,
  Table,
  cx,
} from '../components/ui.jsx';

const TENURES = ['1W', '2W', '3W', '1M', '3M', '6M', '9M', '12M', '18M', '24M', '36M'];
const KEY_TENURES = ['1M', '3M', '6M', '9M', '12M', '18M', '24M'];

const PAYOUT_LABELS = {
  MATURITY: { vi: 'Cuối kỳ', en: 'At Maturity', ja: '満期一括' },
  UPFRONT: { vi: 'Đầu kỳ', en: 'Upfront', ja: '前払い' },
  MONTHLY: { vi: 'Hàng tháng', en: 'Monthly', ja: '毎月利払' },
  QUARTERLY: { vi: 'Hàng quý', en: 'Quarterly', ja: '四半期毎' },
  FLEXIBLE: { vi: 'Linh hoạt', en: 'Flexible', ja: '柔軟' },
  ACCUMULATIVE: { vi: 'Tích luỹ', en: 'Accumulative', ja: '積立' },
};

const TYPE_LABELS = {
  term: { vi: 'Có kỳ hạn', en: 'Fixed Term', ja: '定期預金' },
  demand: { vi: 'Không kỳ hạn', en: 'Demand', ja: '普通預金' },
  'auto-savings': { vi: 'Tự động sinh lời', en: 'Auto Savings', ja: '自動運用' },
  'goal-savings': { vi: 'Theo mục tiêu', en: 'Goal Based', ja: '目的別貯蓄' },
  accumulate: { vi: 'Tích luỹ góp thêm', en: 'Accumulative', ja: '積立追加可' },
  mixed: { vi: 'Linh hoạt + Kỳ hạn', en: 'Flexible + Term', ja: '混合プラン' },
};

function PackageItem({ pkg }) {
  const [open, setOpen] = useState(false);
  const { lang, tx } = useI18n();
  const typeEntry = TYPE_LABELS[pkg.type];
  const typeLabel = typeEntry ? typeEntry[lang] : pkg.type;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] transition-colors hover:border-white/[0.12]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-2.5 p-4 text-left sm:flex-nowrap sm:gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{pkg.name}</span>
            <Badge tone="neutral">{typeLabel}</Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500 sm:truncate">{pkg.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {pkg.bestRate && (
            <Badge tone="success">
              {tx(`Đến ${pct(pkg.bestRate, 2, lang)}/năm`, `Up to ${pct(pkg.bestRate, 2, lang)}/yr`, `最大 ${pct(pkg.bestRate, 2, lang)}/年`)}
            </Badge>
          )}
          {open ? <ChevronUp className="size-4 text-zinc-500" /> : <ChevronDown className="size-4 text-zinc-500" />}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/[0.06] px-4 pb-4 pt-4">
          {pkg.rates?.length > 0 && (
            <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/[0.06]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">{tx('Kỳ hạn', 'Tenure', '預入期間')}</th>
                    <th className="px-3 py-2 text-right font-medium">{tx('Lãi suất (%/năm)', 'Rate (% p.a.)', '金利 (年率%)')}</th>
                    <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">
                      {tx('Chi tiết', 'Details', '備考')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] tabular-nums">
                  {pkg.rates.map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium text-zinc-200">{r.term}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-300">{pct(r.endRate, 2, lang)}</td>
                      <td className="hidden px-3 py-2 text-right text-zinc-500 sm:table-cell">
                        {r.note ||
                          (r.startRate
                            ? `${tx('Trả trước:', 'Upfront:', '前払：')} ${pct(r.startRate, 2, lang)}`
                            : r.monthlyRate
                              ? `${tx('Hàng tháng:', 'Monthly:', '毎月：')} ${pct(r.monthlyRate, 2, lang)}`
                              : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {pkg.features?.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="size-3.5" /> {tx('Ưu điểm nổi bật', 'Key Highlights', '主な特徴')}
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pkg.conditions?.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-300">
                  <Shield className="size-3.5" /> {tx('Điều kiện & rút trước hạn', 'Conditions & Early Withdrawal', '条件・中途解約')}
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {pkg.conditions.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                  {pkg.minDeposit && (
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>
                        {tx('Tối thiểu:', 'Minimum:', '最低預入額：')}{' '}
                        <strong className="text-zinc-200">{fmt(pkg.minDeposit, lang)} ₫</strong>
                      </span>
                    </li>
                  )}
                  {pkg.earlyWithdrawal && (
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{pkg.earlyWithdrawal}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3 text-xs text-zinc-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>{tx('Cập nhật:', 'Updated:', '更新日：')} {pkg.lastUpdated}</span>
              {pkg.promotion && <Badge tone="success">{pkg.promotion}</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {pkg.promotionUrl && (
                <a
                  href={safeExternalUrl(pkg.promotionUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-emerald-300 hover:text-emerald-200"
                >
                  {tx('Thể lệ CTKM (PDF)', 'Promo Terms (PDF)', 'キャンペーン規約 (PDF)')} <ExternalLink className="size-3" />
                </a>
              )}
              {pkg.sourceUrl && (
                <a
                  href={safeExternalUrl(pkg.sourceUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                >
                  {tx('Nguồn chính thức', 'Official Source', '公式ページ')} <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Rates() {
  const { banks, updatedAt, getRate, isCustom, setRate, resetRate } = useRates();
  const { lang, tx, formatTenure } = useI18n();
  const notify = useToast();

  const [tenure, setTenure] = useState('12M');
  const [section, setSection] = useState('matrix'); // 'matrix' | 'packages'
  const [editTarget, setEditTarget] = useState(null); // { bank, tenure }
  const [editValue, setEditValue] = useState('');

  const sorted = useMemo(
    () =>
      [...banks]
        .map((bank) => ({
          bank,
          rate: getRate(bank, tenure),
          custom: isCustom(bank, tenure),
        }))
        .sort((a, b) => b.rate - a.rate),
    [banks, getRate, isCustom, tenure]
  );

  const openEditor = (bank, t) => {
    setEditTarget({ bank, tenure: t });
    setEditValue(getRate(bank, t));
  };

  const saveEdit = () => {
    if (!editTarget) return;
    const val = Number(editValue);
    if (!val || val <= 0) return;
    setRate(editTarget.bank, editTarget.tenure, val);
    notify(
      tx(
        `Đã lưu lãi suất ${editTarget.bank.name} (${formatTenure(editTarget.tenure)})`,
        `Saved ${editTarget.bank.name} (${formatTenure(editTarget.tenure)}) custom rate`,
        `${editTarget.bank.name} (${formatTenure(editTarget.tenure)}) のカスタム金利を保存しました`
      )
    );
    setEditTarget(null);
  };

  const resetEdit = () => {
    if (!editTarget) return;
    resetRate(editTarget.bank, editTarget.tenure);
    notify(tx('Đã khôi phục lãi suất mặc định', 'Restored default bank rate', '公式基準金利に戻しました'));
    setEditTarget(null);
  };

  return (
    <>
      <PageHeader
        icon={BarChart3}
        eyebrow={tx(`Dữ liệu lãi suất ${updatedAt}`, `Live Bank Rates · ${updatedAt}`, `最新金利データ · ${updatedAt}`)}
        title={tx('So sánh lãi suất ngân hàng số', 'Compare Digital Bank Interest Rates', 'ネット銀行 定期預金金利比較')}
        description={tx(
          'Bảng lãi suất niêm yết của Cake, Timo, LioBank và TNEX. Nhấn vào bất kỳ mức lãi suất nào để cập nhật theo chương trình ưu đãi riêng của bạn.',
          'Official deposit tariffs from Cake, Timo, LioBank, and TNEX. Tap any rate cell to enter your personal promo or tier rate.',
          'Cake・Timo・LioBank・TNEXの公式金利一覧です。各セルをクリックすると独自の優遇金利へ上書き設定できます。'
        )}
        actions={
          <Segmented
            value={section}
            onChange={setSection}
            options={[
              { value: 'matrix', label: tx('Bảng so sánh', 'Comparison Matrix', '金利比較表') },
              { value: 'packages', label: tx('Chi tiết gói gửi', 'Product Packages', '商品詳細・特典') },
            ]}
          />
        }
      />

      {section === 'matrix' ? (
        <div className="space-y-6">
          {/* Tenure selector pills */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-400">
                {tx('Chọn kỳ hạn để xếp hạng', 'Select tenure to rank', 'ランキングする預入期間を選択')}
              </span>
              <span className="text-xs text-zinc-500">
                {tx('Đơn vị: %/năm', 'Unit: % p.a.', '単位：年利 %')}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TENURES.map((t) => {
                const active = tenure === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTenure(t)}
                    className={cx(
                      'min-h-[34px] rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                      active
                        ? 'bg-indigo-500 text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.7)]'
                        : 'bg-white/[0.03] text-zinc-400 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    {formatTenure(t)}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Ranked cards for selected tenure */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sorted.map(({ bank, rate, custom }, idx) => {
              const copy = getBankCopy(bank, lang);
              return (
                <Card
                  key={bank.id}
                  className={cx(
                    'flex flex-col justify-between p-5 transition-colors',
                    idx === 0 && 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] to-surface'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <BankMark bank={bank} />
                        <div>
                          <div className="text-sm font-semibold text-white">{bank.name}</div>
                          <div className="text-xs text-zinc-500">
                            {copy.fullName.replace(/^Ngân hàng số\s*/i, '').replace(/Digital Bank\s*/i, '')}
                          </div>
                        </div>
                      </div>
                      {idx === 0 && (
                        <Badge tone="success">
                          <Sparkles className="size-3" /> {tx('Cao nhất', 'Best', '最高')}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-5 flex items-baseline justify-between">
                      <div>
                        <div className="text-xs text-zinc-500">
                          {tx('Kỳ hạn', 'Tenure:', '期間：')} {formatTenure(tenure)}
                        </div>
                        <div
                          className={cx(
                            'mt-1 text-3xl font-semibold tracking-tight tabular-nums',
                            idx === 0 ? 'text-emerald-300' : 'text-white'
                          )}
                        >
                          {pct(rate, 2, lang)}
                          <span className="ml-1 text-xs font-normal text-zinc-500">{tx('/năm', '/yr', '/年')}</span>
                        </div>
                        {bank.promoRates?.[tenure] > rate && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Badge tone="success">
                              {tx('CTKM:', 'Promo:', '特典：')} {pct(bank.promoRates[tenure], 2, lang)}
                            </Badge>
                            {bank.promoUrl && (
                              <a
                                href={safeExternalUrl(bank.promoUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-[11px] text-emerald-300 hover:underline"
                              >
                                PDF <ExternalLink className="size-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditor(bank, tenure)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                      >
                        <Pencil className="size-3" />{' '}
                        {custom ? tx('Đã sửa', 'Custom', '変更済') : tx('Sửa', 'Edit', '編集')}
                      </button>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-zinc-400">{copy.notes}</p>
                    {copy.rateTierNote && (
                      <p className="mt-1.5 text-[11px] text-indigo-300/80">• {copy.rateTierNote}</p>
                    )}
                  </div>

                  <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-3">
                    <div className="flex flex-wrap gap-1">
                      {bank.partialWithdrawal && (
                        <Badge tone="brand">{tx('Rút gốc từng phần', 'Partial withdrawal', '一部解約可')}</Badge>
                      )}
                      {bank.payoutMethods.map((m) => (
                        <Badge key={m} tone="neutral">
                          {PAYOUT_LABELS[m]?.[lang] || m}
                        </Badge>
                      ))}
                    </div>
                    <a
                      href={href('plan', { bank: bank.id, tenure })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                    >
                      {tx('Lập kế hoạch với lãi suất này', 'Plan with this rate', 'この金利で試算する')}{' '}
                      <ArrowRight className="size-3" />
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Full cross-tenure matrix */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={tx('Ma trận toàn bộ kỳ hạn', 'Full Cross-Tenure Matrix', '全期間 金利マトリクス')}
              description={tx('Nhấn vào một ô bất kỳ để chỉnh lãi suất tương ứng.', 'Click any cell to customize that bank & tenure rate.', 'セルをクリックすると各銀行・期間の金利を個別に設定できます。')}
            />
            <Table
              className="mt-5"
              head={[tx('Ngân hàng', 'Bank', '銀行'), ...KEY_TENURES.map((t) => formatTenure(t))]}
            >
              {banks.map((bank) => (
                <tr key={bank.id} className="hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <BankMark bank={bank} size="sm" />
                      <div>
                        <div className="font-medium text-white">{bank.name}</div>
                        <div className="text-xs text-zinc-500">{bank.code}</div>
                      </div>
                    </div>
                  </td>
                  {KEY_TENURES.map((t) => {
                    const r = getRate(bank, t);
                    const topForT = Math.max(...banks.map((b) => getRate(b, t)));
                    const isBest = r === topForT && r > 0;
                    const custom = isCustom(bank, t);
                    return (
                      <td key={t} className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditor(bank, t)}
                          className={cx(
                            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-white/[0.06]',
                            isBest ? 'bg-emerald-500/10 text-emerald-300' : 'text-zinc-200',
                            custom && 'ring-1 ring-amber-400/40'
                          )}
                        >
                          {pct(r, 2, lang)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      ) : (
        /* Detailed bank packages view */
        <div className="grid gap-5 lg:grid-cols-2">
          {Object.values(DIGITAL_BANKS).map((b) => {
            const matched = banks.find((x) => x.id === b.id) || { color: b.color, logoText: b.shortName };
            return (
              <Card key={b.id} className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BankMark bank={matched} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{b.name}</h3>
                        <Badge tone="brand">{b.partner}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {lang === 'en' || lang === 'ja' ? getBankCopy({ id: b.id }, lang).fullName : b.description}
                      </p>
                    </div>
                  </div>
                  <a
                    href={safeExternalUrl(b.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-300 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                  >
                    {tx('Website', 'Website', '公式サイト')} <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="space-y-2.5">
                  {b.packages.map((pkg) => (
                    <PackageItem key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RateDisclaimer className="mt-6" />

      {/* Edit Rate Modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={
          editTarget
            ? tx(
                `Chỉnh lãi suất ${editTarget.bank.name} (${formatTenure(editTarget.tenure)})`,
                `Edit ${editTarget.bank.name} Rate (${formatTenure(editTarget.tenure)})`,
                `${editTarget.bank.name} 金利設定（${formatTenure(editTarget.tenure)}）`
              )
            : ''
        }
      >
        {editTarget && (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-zinc-400">
              {tx(
                `Nếu bạn có mã cộng lãi suất hoặc ưu đãi hạng hội viên tại ${editTarget.bank.name}, hãy cập nhật tại đây. Mức lãi suất này sẽ tự động áp dụng cho các công cụ tính toán khác.`,
                `If you have a promo code or VIP rate tier at ${editTarget.bank.name}, customize it here. It will automatically carry across all calculators.`,
                `${editTarget.bank.name} の優遇金利コードや会員特典をお持ちの場合はここで上書きできます。すべての計算ツールに自動反映されます。`
              )}
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                {tx('Lãi suất mới (%/năm)', 'Custom rate (% p.a.)', '設定金利 (年率%)')}
              </label>
              <DecimalInput
                value={editValue}
                onChange={setEditValue}
                suffix={tx('%/năm', '%/yr', '%/年')}
                min={0.1}
                max={25}
                step={0.05}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" className="flex-1" onClick={saveEdit}>
                {tx('Lưu thay đổi', 'Save Override', '変更を保存')}
              </Button>
              {isCustom(editTarget.bank, editTarget.tenure) && (
                <Button variant="secondary" onClick={resetEdit}>
                  <RotateCcw className="size-4" /> {tx('Mặc định', 'Reset', '元に戻す')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
