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
import { href, useRates, useToast } from '../state.jsx';
import { TENURE_LABELS } from '../data/banksData.js';
import { DIGITAL_BANKS } from '../data/bankPackagesData.js';
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
  Segmented,
  Table,
  cx,
} from '../components/ui.jsx';

const TENURES = ['1W', '2W', '3W', '1M', '3M', '6M', '9M', '12M', '18M', '24M', '36M'];
const KEY_TENURES = ['1M', '3M', '6M', '9M', '12M', '18M', '24M'];

const PAYOUT_LABELS = {
  MATURITY: 'Cuối kỳ',
  UPFRONT: 'Đầu kỳ',
  MONTHLY: 'Hàng tháng',
  QUARTERLY: 'Hàng quý',
  FLEXIBLE: 'Linh hoạt',
  ACCUMULATIVE: 'Tích luỹ',
};

const TYPE_LABELS = {
  term: 'Có kỳ hạn',
  demand: 'Không kỳ hạn',
  'auto-savings': 'Tự động sinh lời',
  'goal-savings': 'Theo mục tiêu',
  accumulate: 'Tích luỹ góp thêm',
  mixed: 'Linh hoạt + Kỳ hạn',
};

function PackageItem({ pkg }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] transition-colors hover:border-white/[0.12]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{pkg.name}</span>
            <Badge tone="neutral">{TYPE_LABELS[pkg.type] || pkg.type}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{pkg.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {pkg.bestRate && (
            <Badge tone="success">
              Đến {pct(pkg.bestRate)}/năm
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
                    <th className="px-3 py-2 font-medium">Kỳ hạn</th>
                    <th className="px-3 py-2 text-right font-medium">Lãi suất (%/năm)</th>
                    <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] tabular-nums">
                  {pkg.rates.map((r, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium text-zinc-200">{r.term}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-300">{pct(r.endRate)}</td>
                      <td className="hidden px-3 py-2 text-right text-zinc-500 sm:table-cell">
                        {r.note || (r.startRate ? `Trả trước: ${pct(r.startRate)}` : r.monthlyRate ? `Hàng tháng: ${pct(r.monthlyRate)}` : '—')}
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
                  <CheckCircle2 className="size-3.5" /> Ưu điểm nổi bật
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
                  <Shield className="size-3.5" /> Điều kiện & rút trước hạn
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
                      <span>Tối thiểu: <strong className="text-zinc-200">{fmt(pkg.minDeposit)} ₫</strong></span>
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-3 text-xs text-zinc-500">
            <span>Cập nhật: {pkg.lastUpdated}</span>
            {pkg.sourceUrl && (
              <a
                href={pkg.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
              >
                Nguồn chính thức <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Rates() {
  const { banks, updatedAt, getRate, isCustom, setRate, resetRate } = useRates();
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
    notify(`Đã lưu lãi suất ${editTarget.bank.name} (${TENURE_LABELS[editTarget.tenure]})`);
    setEditTarget(null);
  };

  const resetEdit = () => {
    if (!editTarget) return;
    resetRate(editTarget.bank, editTarget.tenure);
    notify(`Đã khôi phục lãi suất mặc định`);
    setEditTarget(null);
  };

  return (
    <>
      <PageHeader
        icon={BarChart3}
        eyebrow={`Dữ liệu lãi suất ${updatedAt}`}
        title="So sánh lãi suất ngân hàng số"
        description="Bảng lãi suất niêm yết của Cake, Timo, LioBank và TNEX. Nhấn vào bất kỳ mức lãi suất nào để cập nhật theo chương trình ưu đãi riêng của bạn."
        actions={
          <Segmented
            value={section}
            onChange={setSection}
            options={[
              { value: 'matrix', label: 'Bảng so sánh' },
              { value: 'packages', label: 'Chi tiết gói gửi' },
            ]}
          />
        }
      />

      {section === 'matrix' ? (
        <div className="space-y-6">
          {/* Tenure selector pills */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-400">Chọn kỳ hạn để xếp hạng</span>
              <span className="text-xs text-zinc-500">Đơn vị: %/năm</span>
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
                      'rounded-xl px-3 py-1.5 text-xs font-medium transition-all',
                      active
                        ? 'bg-indigo-500 text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.7)]'
                        : 'bg-white/[0.03] text-zinc-400 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    {TENURE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Ranked cards for selected tenure */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sorted.map(({ bank, rate, custom }, idx) => (
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
                        <div className="text-xs text-zinc-500">{bank.fullName.replace(/^Ngân hàng số\s*/i, '')}</div>
                      </div>
                    </div>
                    {idx === 0 && (
                      <Badge tone="success">
                        <Sparkles className="size-3" /> Cao nhất
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5 flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-zinc-500">Kỳ hạn {TENURE_LABELS[tenure]}</div>
                      <div
                        className={cx(
                          'mt-1 text-3xl font-semibold tracking-tight tabular-nums',
                          idx === 0 ? 'text-emerald-300' : 'text-white'
                        )}
                      >
                        {pct(rate)}
                        <span className="ml-1 text-xs font-normal text-zinc-500">/năm</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditor(bank, tenure)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                    >
                      <Pencil className="size-3" /> {custom ? 'Đã sửa' : 'Sửa'}
                    </button>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-zinc-400">{bank.notes}</p>
                  {bank.rateTierNote && (
                    <p className="mt-1.5 text-[11px] text-indigo-300/80">• {bank.rateTierNote}</p>
                  )}
                </div>

                <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-3">
                  <div className="flex flex-wrap gap-1">
                    {bank.partialWithdrawal && (
                      <Badge tone="brand">Rút gốc từng phần</Badge>
                    )}
                    {bank.payoutMethods.map((m) => (
                      <Badge key={m} tone="neutral">
                        {PAYOUT_LABELS[m] || m}
                      </Badge>
                    ))}
                  </div>
                  <a
                    href={href('plan', { bank: bank.id, tenure })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    Lập kế hoạch với lãi suất này <ArrowRight className="size-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>

          {/* Full cross-tenure matrix */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Ma trận toàn bộ kỳ hạn"
              description="Nhấn vào một ô bất kỳ để chỉnh lãi suất tương ứng."
            />
            <Table
              className="mt-5"
              head={['Ngân hàng', ...KEY_TENURES.map((t) => TENURE_LABELS[t])]}
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
                          {pct(r)}
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BankMark bank={matched} size="lg" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">{b.name}</h3>
                        <Badge tone="brand">{b.partner}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">{b.description}</p>
                    </div>
                  </div>
                  <a
                    href={b.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-zinc-300 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                  >
                    Website <ExternalLink className="size-3" />
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

      {/* Edit Rate Modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Chỉnh lãi suất ${editTarget.bank.name} (${TENURE_LABELS[editTarget.tenure]})` : ''}
      >
        {editTarget && (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-zinc-400">
              Nếu bạn có mã cộng lãi suất hoặc ưu đãi hạng hội viên tại {editTarget.bank.name}, hãy cập nhật tại đây. Mức
              lãi suất này sẽ tự động áp dụng cho các công cụ tính toán khác.
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">Lãi suất mới (%/năm)</label>
              <DecimalInput
                value={editValue}
                onChange={setEditValue}
                suffix="%/năm"
                min={0.1}
                max={25}
                step={0.05}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" className="flex-1" onClick={saveEdit}>
                Lưu thay đổi
              </Button>
              {isCustom(editTarget.bank, editTarget.tenure) && (
                <Button variant="secondary" onClick={resetEdit}>
                  <RotateCcw className="size-4" /> Mặc định
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
