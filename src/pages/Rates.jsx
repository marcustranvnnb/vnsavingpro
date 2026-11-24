import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Gift,
  KeyRound,
  Lock,
  Pencil,
  PhoneCall,
  QrCode,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getBankCopy, useI18n } from '../i18n/index.jsx';
import { href, useRates, useRoute, useToast } from '../state.jsx';
import { DIGITAL_BANKS } from '../data/bankPackagesData.js';
import {
  BANK_SECURITY_PILLARS,
  BANK_SECURITY_PROFILES,
  USER_SECURITY_CHECKLIST,
} from '../data/bankSecurityAndPerksData.js';
import {
  cryptoStorage,
  isPlainObject,
  safeExternalUrl,
  sanitizeReferralCode,
} from '../utils/cryptoStorage.js';
import { fmt, pct } from '../utils/format.js';
import {
  Badge,
  BankMark,
  Button,
  Callout,
  Card,
  CardHeader,
  DecimalInput,
  Modal,
  PageHeader,
  Progress,
  RateDisclaimer,
  Segmented,
  Table,
  cx,
} from '../components/ui.jsx';
import { AdaptiveGrid } from '../components/AdaptiveLayout.jsx';

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

export default function Rates({ params: propParams }) {
  const { banks, updatedAt, getRate, isCustom, setRate, resetRate } = useRates();
  const { route, params: routeParams } = useRoute();
  const params = propParams || routeParams || {};
  const { lang, tx, formatTenure } = useI18n();
  const notify = useToast();

  const resolveInitialSection = () => {
    const t = String(params?.tab || '').toLowerCase();
    if (route === 'referral' || t === 'security' || t === 'perks' || t === 'security_perks' || t === 'referral') {
      return 'security_perks';
    }
    if (t === 'packages') return 'packages';
    return 'matrix';
  };

  const [tenure, setTenure] = useState('12M');
  const [section, setSection] = useState(resolveInitialSection); // 'matrix' | 'packages' | 'security_perks'
  const [editTarget, setEditTarget] = useState(null); // { bank, tenure }
  const [editValue, setEditValue] = useState('');

  // Custom referral codes & security checklist state
  const [customReferrals, setCustomReferrals] = useState(() => {
    const loaded = cryptoStorage.load('CUSTOM_REFERRAL_CODES', {});
    return isPlainObject(loaded) ? loaded : {};
  });
  const [copiedBankId, setCopiedBankId] = useState('');
  const [openQrBankId, setOpenQrBankId] = useState('');
  const [refEditTarget, setRefEditTarget] = useState(null);
  const [refEditValue, setRefEditValue] = useState('');
  const [securityChecks, setSecurityChecks] = useState({});

  useEffect(() => {
    const t = String(params?.tab || '').toLowerCase();
    if (route === 'referral' || t === 'security' || t === 'perks' || t === 'security_perks' || t === 'referral') {
      setSection('security_perks');
    } else if (t === 'packages') {
      setSection('packages');
    } else if (t === 'matrix') {
      setSection('matrix');
    }
  }, [route, params?.tab]);

  const activeChecklistCount = USER_SECURITY_CHECKLIST.filter((c) => securityChecks[c.id]).length;
  const securityScorePct = Math.round((activeChecklistCount / USER_SECURITY_CHECKLIST.length) * 100);

  const handleCopyReferral = async (bank, activeCode) => {
    try {
      await navigator.clipboard?.writeText(activeCode);
      setCopiedBankId(bank.id);
      notify(
        tx(
          `Đã sao chép mã giới thiệu ${bank.name}: ${activeCode}`,
          `Copied ${bank.name} referral code: ${activeCode}`,
          `${bank.name} の紹介コードをコピーしました：${activeCode}`
        )
      );
      window.setTimeout(() => setCopiedBankId((prev) => (prev === bank.id ? '' : prev)), 1800);
    } catch {
      notify(tx(`Mã giới thiệu ${bank.name}: ${activeCode}`, `${bank.name} code: ${activeCode}`, `コード：${activeCode}`));
    }
  };

  const openReferralEditor = (bank) => {
    setRefEditTarget(bank);
    setRefEditValue(customReferrals[bank.id] || bank.referralCode || '');
  };

  const saveReferralCode = () => {
    if (!refEditTarget) return;
    const clean = sanitizeReferralCode(refEditValue);
    if (clean.length < 2) {
      notify(tx('Mã giới thiệu cần ít nhất 2 ký tự chữ hoặc số.', 'Referral code needs at least 2 characters.', '2文字以上の英数字を入力してください。'));
      return;
    }
    const next = { ...customReferrals, [refEditTarget.id]: clean };
    cryptoStorage.save('CUSTOM_REFERRAL_CODES', next);
    setCustomReferrals(cryptoStorage.load('CUSTOM_REFERRAL_CODES', {}));
    notify(tx(`Đã lưu mã giới thiệu riêng cho ${refEditTarget.name}: ${clean}`, `Saved custom referral code for ${refEditTarget.name}`, `${refEditTarget.name} の紹介コードを保存しました`));
    setRefEditTarget(null);
  };

  const resetReferralCode = () => {
    if (!refEditTarget) return;
    const next = { ...customReferrals };
    delete next[refEditTarget.id];
    cryptoStorage.save('CUSTOM_REFERRAL_CODES', next);
    setCustomReferrals(cryptoStorage.load('CUSTOM_REFERRAL_CODES', {}));
    notify(tx(`Đã khôi phục mã mặc định của ${refEditTarget.name}`, `Restored default code for ${refEditTarget.name}`, 'デフォルトコードに戻しました'));
    setRefEditTarget(null);
  };

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
        icon={section === 'security_perks' ? ShieldCheck : BarChart3}
        eyebrow={
          section === 'security_perks'
            ? tx('Pháp lý NHNN · Sinh trắc học QĐ 2345 · Mã giới thiệu', 'SBV Licensed · Decision 2345 · Welcome Perks', '国家銀行認可 · 生体認証2345号 · 口座開設特典')
            : tx(`Cập nhật đầu mỗi tháng · ${updatedAt}`, `Monthly 1st Sync · ${updatedAt}`, `毎月1日自動同期 · ${updatedAt}`)
        }
        title={
          section === 'security_perks'
            ? tx('Bảo mật & Ưu đãi mở tài khoản Ngân hàng số', 'Digital Bank Security & Account-Opening Perks', 'ネット銀行の安全性＆口座開設特典')
            : tx('So sánh lãi suất ngân hàng số', 'Compare Digital Bank Interest Rates', 'ネット銀行 定期預金金利比較')
        }
        description={
          section === 'security_perks'
            ? tx(
                'Đối chiếu bảo chứng pháp lý ngân hàng mẹ, Bảo hiểm tiền gửi VN, chuẩn sinh trắc học QĐ 2345 và nhận mã ưu đãi mở tài khoản mới từ Cake, Timo, LioBank & TNEX.',
                'Review parent commercial bank licenses, DIV deposit protection, SBV biometric safeguards, and welcome perks across Cake, Timo, LioBank & TNEX.',
                '母体商業銀行の認可・預金保険（DIV）・生体認証ルールと、Cake・Timo・LioBank・TNEXの新規口座開設特典をまとめて確認できます。'
              )
            : tx(
                'Bảng lãi suất niêm yết của Cake, Timo, LioBank và TNEX. Nhấn vào bất kỳ mức lãi suất nào để cập nhật theo chương trình ưu đãi riêng của bạn.',
                'Official deposit tariffs from Cake, Timo, LioBank, and TNEX. Tap any rate cell to enter your personal promo or tier rate.',
                'Cake・Timo・LioBank・TNEXの公式金利一覧です。各セルをクリックすると独自の優遇金利へ上書き設定できます。'
              )
        }
        actions={
          <Segmented
            value={section}
            onChange={setSection}
            options={[
              { value: 'matrix', label: tx('Bảng so sánh', 'Comparison Matrix', '金利比較表') },
              { value: 'packages', label: tx('Chi tiết gói gửi', 'Product Packages', '商品詳細・特典') },
              { value: 'security_perks', label: tx('Bảo mật & Ưu đãi mở TK', 'Security & Perks', '安全性・開設特典') },
            ]}
          />
        }
      />

      {section === 'matrix' ? (
        <div className="space-y-6">
          <Callout icon={ShieldCheck} tone="brand" className="items-center justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {tx(
                  'Muốn kiểm tra tính pháp lý NHNN, Bảo hiểm tiền gửi & lấy mã quà mở tài khoản mới (20k–50k + cộng lãi)?',
                  'Want to verify SBV licensing, DIV deposit insurance & grab new-account welcome bonuses (20k–50k + boost)?',
                  '国家銀行認可・預金保険の解説や新規口座開設ボーナスコードを確認しますか？'
                )}
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSection('security_perks')}>
                <Gift className="size-3.5 text-emerald-300" />
                {tx('Mở Bảo mật & Ưu đãi', 'Open Security & Perks', '安全性・特典を見る')}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </Callout>
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
          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 4 }} hingeAligned>
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
          </AdaptiveGrid>

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
      ) : section === 'packages' ? (
        /* Detailed bank packages view */
        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }} hingeAligned gap="gap-5">
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
        </AdaptiveGrid>
      ) : (
        /* Security, Legal Safeguards & Account-Opening Offers */
        <div className="space-y-6">
          {/* 4 Regulatory & Technical Pillars */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={tx('4 Lớp Bảo Mật & Pháp Lý Của Ngân Hàng Số Việt Nam', '4 Legal & Technical Security Layers of Vietnam Digital Banks', 'ベトナム・ネット銀行の4重セキュリティ＆法的保護')}
              description={tx(
                'Vì sao gửi tiết kiệm tại Cake, Timo, LioBank và TNEX có mức độ bảo vệ tương đương ngân hàng truyền thống.',
                'Why deposits at Cake, Timo, LioBank, and TNEX carry the same statutory backing as traditional commercial banks.',
                'Cake・Timo・LioBank・TNEXの定期預金が大手商業銀行と同等の法的安全性を持つ理由です。'
              )}
              right={
                <a
                  href={href('blog', { post: 'bao-mat-ngan-hang-so-2026' })}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-200 ring-1 ring-inset ring-indigo-400/25 hover:bg-indigo-500/25"
                >
                  {tx('Đọc phân tích sâu trên Blog →', 'Read Deep-Dive on Blog →', 'ブログ解説を読む →')}
                </a>
              }
            />
            <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }} hingeAligned className="mt-5">
              {BANK_SECURITY_PILLARS.map((pillar) => (
                <div
                  key={pillar.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="brand">
                      <Lock className="size-3" /> {pillar.badge[lang] || pillar.badge.vi}
                    </Badge>
                    <ShieldCheck className="size-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{pillar.title[lang] || pillar.title.vi}</h3>
                  <p className="text-xs leading-relaxed text-zinc-400">{pillar.summary[lang] || pillar.summary.vi}</p>
                  <ul className="space-y-1 pt-1 text-xs text-zinc-300">
                    {(pillar.highlights[lang] || pillar.highlights.vi).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </AdaptiveGrid>
          </Card>

          {/* Per-bank Security Profile + Account-Opening Perks + Custom Referral Code */}
          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }} hingeAligned gap="gap-5">
            {banks.map((bank) => {
              const sec = BANK_SECURITY_PROFILES[bank.id];
              const digital = DIGITAL_BANKS[bank.id];
              const activeCode = customReferrals[bank.id] || bank.referralCode || '';
              const hasCustomCode = Boolean(customReferrals[bank.id]);
              const isCopied = copiedBankId === bank.id;
              const isQrOpen = openQrBankId === bank.id;
              const onboardingUrl = safeExternalUrl(digital?.appDownload || bank.referralUrl || digital?.website);
              const topRate = getRate(bank, '12M');

              return (
                <Card key={bank.id} className="flex flex-col justify-between space-y-4 p-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BankMark bank={bank} size="lg" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-white">{bank.name}</h3>
                            <Badge tone="success">12M: {pct(topRate, 2, lang)}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {sec?.parentBankFull?.[lang] || sec?.parentBankFull?.vi}
                          </p>
                        </div>
                      </div>
                      <Badge tone="neutral">{sec?.licenseRef}</Badge>
                    </div>

                    {/* Security Certifications & Verification */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                          <ShieldCheck className="size-3.5" />
                          {tx('Hồ sơ Bảo mật & Kiểm chứng', 'Security & Verification Specs', 'セキュリティ＆検証仕様')}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <PhoneCall className="size-3 text-indigo-300" /> {sec?.emergencyHotline}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sec?.securityCerts?.map((cert) => (
                          <Badge key={cert} tone="brand">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        <strong className="text-zinc-200">
                          {tx('Xác thực sổ:', 'Deposit Proof:', '預金証明：')}
                        </strong>{' '}
                        {sec?.depositVerification?.[lang] || sec?.depositVerification?.vi}
                      </p>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        <strong className="text-zinc-200">
                          {tx('Khóa khẩn cấp:', 'Emergency Lock:', '緊急停止：')}
                        </strong>{' '}
                        {sec?.cardLockFeature?.[lang] || sec?.cardLockFeature?.vi}
                      </p>
                    </div>

                    {/* Welcome Perks */}
                    {sec?.welcomeOffer && (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05] p-3.5 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                            <Gift className="size-3.5 text-amber-300" />
                            {sec.welcomeOffer.title[lang] || sec.welcomeOffer.title.vi}
                          </span>
                          <Badge tone="warning">
                            <Sparkles className="size-3" /> {sec.welcomeOffer.badge[lang] || sec.welcomeOffer.badge.vi}
                          </Badge>
                        </div>
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {(sec.welcomeOffer.highlights[lang] || sec.welcomeOffer.highlights.vi).map((h, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-white/[0.06] pt-2">
                          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                            {tx('4 bước mở tài khoản eKYC nhận ưu đãi', '4-Step eKYC Activation', '4ステップeKYC特典受取')}
                          </div>
                          <ol className="grid gap-1 text-xs text-zinc-400 sm:grid-cols-2">
                            {(sec.welcomeOffer.steps[lang] || sec.welcomeOffer.steps.vi).map((step, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-mono text-[11px] font-semibold text-indigo-300">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Referral Code Manager & QR */}
                    <div className="rounded-xl border border-white/[0.08] bg-canvas/60 p-3.5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                            <KeyRound className="size-3 text-indigo-300" />
                            {hasCustomCode
                              ? tx('Mã giới thiệu riêng của bạn', 'Your Custom Referral Code', '登録済みマイ紹介コード')
                              : tx('Mã giới thiệu mẫu minh họa', 'Placeholder Referral Code', 'サンプル紹介コード')}
                            {!hasCustomCode && (
                              <Badge tone="warning">
                                🤖 {tx('Mã mẫu Bot (Dummy) — Bấm Đổi mã để nhập mã thật', 'Bot Dummy Code — Click Edit for yours', '参考ダミーコード')}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 font-mono text-base font-bold tracking-wider text-white">
                            {activeCode || '—'}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            onClick={() => handleCopyReferral(bank, activeCode)}
                          >
                            {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                            {isCopied ? tx('Đã copy', 'Copied', 'コピー済') : tx('Copy mã', 'Copy', 'コピー')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openReferralEditor(bank)}
                          >
                            <Pencil className="size-3" /> {tx('Đổi mã', 'Edit Code', '変更')}
                          </Button>
                          {bank.qrImage && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setOpenQrBankId(isQrOpen ? '' : bank.id)}
                              aria-label={tx('Hiện mã QR', 'Toggle QR Code', 'QRコード表示')}
                            >
                              <QrCode className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isQrOpen && bank.qrImage && (
                        <div className="flex items-center gap-3 rounded-lg bg-white p-3 text-zinc-900">
                          <img
                            src={bank.qrImage}
                            alt={`QR ${bank.name}`}
                            width={96}
                            height={96}
                            className="size-24 shrink-0 rounded-md"
                          />
                          <div className="text-xs">
                            <p className="font-semibold text-zinc-900">
                              {tx(`Quét QR tải app ${bank.name} chính thức`, `Scan QR for official ${bank.name}`, `${bank.name} 公式アプリQR`)}
                            </p>
                            <p className="mt-1 text-zinc-600">
                              {tx(
                                `Nhập mã ${activeCode} khi đăng ký eKYC để ghi nhận ưu đãi mở tài khoản.`,
                                `Enter code ${activeCode} during eKYC signup to claim perks.`,
                                `eKYC登録時にコード ${activeCode} を入力してください。`
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                    <a
                      href={onboardingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      {tx(`Mở trang chính thức ${bank.name}`, `Official ${bank.name} Onboarding`, `${bank.name} 公式ページへ`)}
                      <ExternalLink className="size-3" />
                    </a>
                    <a
                      href={href('plan', { bank: bank.id, tenure: '12M' })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      {tx('Lập kế hoạch ngay', 'Plan with this bank', 'この銀行で設計')}
                      <ArrowRight className="size-3" />
                    </a>
                  </div>
                </Card>
              );
            })}
          </AdaptiveGrid>

          {/* Interactive 5-Step Digital Bank Security Self-Check */}
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={tx('Checklist Tự Kiểm Tra An Toàn Ngân Hàng Số (5 Bước)', '5-Step Personal Digital Bank Security Self-Check', 'ネット銀行セキュリティ 自己点検チェックリスト')}
              description={tx(
                'Đánh dấu các lớp bảo vệ bạn đã thiết lập để đánh giá mức độ an toàn tài khoản.',
                'Check off the safeguards you have enabled to audit your account security posture.',
                '設定済みの防衛対策にチェックを入れて安全スコアを確認しましょう。'
              )}
              right={
                <Badge tone={securityScorePct >= 80 ? 'success' : securityScorePct >= 40 ? 'warning' : 'neutral'}>
                  {activeChecklistCount} / {USER_SECURITY_CHECKLIST.length} ({securityScorePct}%)
                </Badge>
              }
            />
            <div className="mt-4">
              <Progress value={securityScorePct} tone={securityScorePct >= 80 ? 'emerald' : 'indigo'} />
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {USER_SECURITY_CHECKLIST.map((item) => {
                const checked = Boolean(securityChecks[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSecurityChecks((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className={cx(
                      'flex items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition',
                      checked
                        ? 'border-emerald-400/35 bg-emerald-500/[0.08] text-white'
                        : 'border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-white/[0.15]'
                    )}
                  >
                    <span
                      className={cx(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                        checked ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-zinc-500'
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    <span className="leading-relaxed">{item.label[lang] || item.label.vi}</span>
                  </button>
                );
              })}
            </div>
          </Card>
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

      {/* Customize Referral Code Modal */}
      <Modal
        open={Boolean(refEditTarget)}
        onClose={() => setRefEditTarget(null)}
        title={
          refEditTarget
            ? tx(
                `Tuỳ chỉnh mã giới thiệu ${refEditTarget.name}`,
                `Customize ${refEditTarget.name} Referral Code`,
                `${refEditTarget.name} 紹介コード設定`
              )
            : ''
        }
      >
        {refEditTarget && (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-zinc-400">
              {tx(
                `Lưu mã giới thiệu cá nhân của bạn cho ${refEditTarget.name} trên thiết bị (đồng bộ qua JSON Backup) để chia sẻ nhanh với bạn bè hoặc gia đình.`,
                `Save your personal ${refEditTarget.name} referral code locally (included in JSON backups) for quick sharing with friends and family.`,
                `${refEditTarget.name} の個人紹介コードを端末に保存（JSONバックアップ対象）し、家族や友人にすぐ共有できます。`
              )}
            </p>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                {tx('Mã giới thiệu (chữ & số, tối đa 32 ký tự)', 'Referral code (alphanumeric, up to 32 chars)', '紹介コード（英数字・最大32文字）')}
              </label>
              <input
                type="text"
                value={refEditValue}
                onChange={(e) => setRefEditValue(e.target.value)}
                maxLength={32}
                placeholder={refEditTarget.referralCode}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 font-mono text-sm text-white outline-none focus:border-indigo-400/60"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="primary" className="flex-1" onClick={saveReferralCode}>
                {tx('Lưu mã của tôi', 'Save My Code', '保存する')}
              </Button>
              {customReferrals[refEditTarget.id] && (
                <Button variant="secondary" onClick={resetReferralCode}>
                  <RotateCcw className="size-4" /> {tx('Mặc định', 'Reset', 'リセット')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
