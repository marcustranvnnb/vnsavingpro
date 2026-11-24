import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Download, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { AdaptiveGrid } from './AdaptiveLayout.jsx';
import { Badge, BankMark, Button, Card, CardHeader, Progress, cx } from './ui.jsx';
import { useI18n } from '../i18n/index.jsx';
import { useRates, useToast } from '../state.jsx';
import {
  loadActivePassbooks,
  loadSavedPlannerState,
  saveActivePassbooks,
} from '../utils/apiClient.js';
import { compact, pct, vnd } from '../utils/format.js';

const TENURE_OPTIONS = [1, 3, 6, 9, 12, 18, 24, 36];

function addMonthsIso(isoDate, months) {
  const [y, m, d] = String(isoDate || '2026-10-01').split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1 + months, d || 1));
  return dt.toISOString().slice(0, 10);
}

function diffDays(fromIso, toIso) {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function computePassbookMetrics(pb, today) {
  const maturityDate = addMonthsIso(pb.openDate, pb.tenureMonths);
  const totalDays = Math.max(1, diffDays(pb.openDate, maturityDate));
  const rawElapsed = diffDays(pb.openDate, today);
  const daysElapsed = Math.max(0, Math.min(totalDays, rawElapsed));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progressPct = Math.round((daysElapsed / totalDays) * 100);
  const accruedInterestToday = Math.round(pb.principal * (pb.ratePct / 100) * (daysElapsed / 365));
  const expectedMaturityInterest = Math.round(pb.principal * (pb.ratePct / 100) * (totalDays / 365));

  let status = 'active';
  if (rawElapsed >= totalDays) status = 'matured';
  else if (daysRemaining <= 14) status = 'maturing_soon';

  return {
    ...pb,
    maturityDate,
    totalDays,
    daysElapsed,
    daysRemaining,
    progressPct,
    accruedInterestToday,
    expectedMaturityInterest,
    status,
  };
}

function formatIcsDate(isoDate) {
  return String(isoDate || '').replace(/-/g, '');
}

export function ActivePassbooksTracker() {
  const { lang, tx } = useI18n();
  const { banks, getRate } = useRates();
  const notify = useToast();

  const [passbooks, setPassbooks] = useState(loadActivePassbooks);
  const [showForm, setShowForm] = useState(false);

  const [bankId, setBankId] = useState('tnex');
  const [label, setLabel] = useState('');
  const [owner, setOwner] = useState('SELF');
  const [fundTag, setFundTag] = useState('GOAL');
  const [principal, setPrincipal] = useState(100_000_000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [ratePct, setRatePct] = useState(8.6);
  const [openDate, setOpenDate] = useState(todayIso);

  const today = todayIso();

  const enriched = useMemo(
    () =>
      passbooks
        .map((pb) => computePassbookMetrics(pb, today))
        .sort((a, b) => a.daysRemaining - b.daysRemaining),
    [passbooks, today]
  );

  const totals = useMemo(() => {
    const totalPrincipal = enriched.reduce((s, x) => s + x.principal, 0);
    const totalAccrued = enriched.reduce((s, x) => s + x.accruedInterestToday, 0);
    const totalExpected = enriched.reduce((s, x) => s + x.expectedMaturityInterest, 0);
    const emergencyTotal = enriched.filter((x) => x.fundTag === 'EMERGENCY').reduce((s, x) => s + x.principal, 0);
    const maturingSoonCount = enriched.filter((x) => x.status === 'maturing_soon' || x.status === 'matured').length;
    return { totalPrincipal, totalAccrued, totalExpected, emergencyTotal, maturingSoonCount };
  }, [enriched]);

  const plan = useMemo(() => loadSavedPlannerState() || {}, []);
  const planGoalAmount = Number(plan.targetAmount) || 500_000_000;
  const planProgressPct = Math.min(100, Math.round((totals.totalPrincipal / Math.max(1, planGoalAmount)) * 100));

  const persistPassbooks = (next) => {
    saveActivePassbooks(next);
    setPassbooks(loadActivePassbooks());
  };

  const handleBankChange = (nextBankId) => {
    setBankId(nextBankId);
    const bankObj = banks.find((b) => b.id === nextBankId);
    if (bankObj) {
      const tenureKey = `${tenureMonths}M`;
      const suggested = getRate(bankObj, tenureKey);
      if (suggested > 0) setRatePct(suggested);
    }
  };

  const handleTenureChange = (m) => {
    setTenureMonths(m);
    const bankObj = banks.find((b) => b.id === bankId);
    if (bankObj) {
      const suggested = getRate(bankObj, `${m}M`);
      if (suggested > 0) setRatePct(suggested);
    }
  };

  const handleAddPassbook = (e) => {
    e.preventDefault();
    const newItem = {
      id: `pb_${Date.now().toString(36)}`,
      bankId,
      label: label.trim() || `${banks.find((b) => b.id === bankId)?.name || bankId} ${tenureMonths}M`,
      owner,
      fundTag,
      principal: Math.max(100_000, Number(principal) || 10_000_000),
      ratePct: Math.max(0.1, Number(ratePct) || 6.9),
      tenureMonths,
      openDate: openDate || today,
      renewMode: 'PRINCIPAL_AND_INTEREST',
    };
    persistPassbooks([newItem, ...passbooks]);
    setLabel('');
    setShowForm(false);
    notify(tx('Đã thêm sổ tiết kiệm thực tế vào Kệ theo dõi!', 'Added real passbook to tracker!', '定期預金帳簿を追加しました！'));
  };

  const handleSeedFromPlan = () => {
    const baseCap = Number(plan.capital) >= 20_000_000 ? Number(plan.capital) : 150_000_000;
    const d1 = new Date();
    d1.setDate(d1.getDate() - 45);
    const d2 = new Date();
    d2.setDate(d2.getDate() - 180);
    const sample = [
      {
        id: `pb_ef_${Date.now().toString(36)}`,
        bankId: 'timo',
        label: tx('[Mẫu Bot / Dummy] Quỹ dự phòng Timo (4 sổ)', '[Bot Dummy] Timo Emergency Buffer', '[Bot参考ダミー] Timo緊急防衛資金'),
        owner: plan.householdMode === 'INDIVIDUAL' ? 'SELF' : 'JOINT',
        fundTag: 'EMERGENCY',
        principal: Math.round(baseCap * 0.4),
        ratePct: 6.7,
        tenureMonths: 6,
        openDate: d2.toISOString().slice(0, 10),
        renewMode: 'PRINCIPAL_AND_INTEREST',
      },
      {
        id: `pb_goal_${Date.now().toString(36)}`,
        bankId: 'tnex',
        label: tx('[Mẫu Bot / Dummy] Sổ mục tiêu TNEX', '[Bot Dummy] TNEX Goal Passbook', '[Bot参考ダミー] TNEX目標積立'),
        owner: 'SELF',
        fundTag: 'GOAL',
        principal: Math.round(baseCap * 0.6),
        ratePct: 8.6,
        tenureMonths: 12,
        openDate: d1.toISOString().slice(0, 10),
        renewMode: 'PRINCIPAL_AND_INTEREST',
      },
    ];
    persistPassbooks([...sample, ...passbooks]);
    notify(tx('Đã tạo 2 sổ tiết kiệm mẫu từ kế hoạch hiện tại!', 'Seeded 2 sample passbooks from your plan!', '現在のプランから2件のサンプル預金を作成しました！'));
  };

  const handleDelete = (id) => {
    persistPassbooks(passbooks.filter((p) => p.id !== id));
    notify(tx('Đã xoá sổ khỏi kệ theo dõi', 'Removed passbook', '預金帳簿を削除しました'));
  };

  const exportPassbooksIcs = () => {
    if (enriched.length === 0) return;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VnSavingPro//Passbook Maturity Calendar//VI',
      'CALSCALE:GREGORIAN',
    ];
    for (const pb of enriched) {
      const bankName = banks.find((b) => b.id === pb.bankId)?.name || pb.bankId;
      const dtStart = formatIcsDate(pb.maturityDate);
      const dtEnd = formatIcsDate(addMonthsIso(pb.maturityDate, 0));
      lines.push(
        'BEGIN:VEVENT',
        `UID:${pb.id}@vnsavingpro.vn`,
        `DTSTAMP:${formatIcsDate(today)}T090000Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[VnSavingPro] Đáo hạn sổ ${pb.label} (${bankName})`,
        `DESCRIPTION:Gốc: ${vnd(pb.principal, 'vi')} | Lãi dự kiến: ${vnd(pb.expectedMaturityInterest, 'vi')} (${pb.ratePct}%/năm)`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:Sổ tiết kiệm ${pb.label} đáo hạn vào ngày mai!`,
        'END:VALARM',
        'END:VEVENT'
      );
    }
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VnSavingPro_LichDaoHan_${today}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    notify(
      tx(
        'Đã tải file lịch .ics (Nhắc trước 1 ngày cho Google/Apple Calendar)!',
        'Downloaded .ics Maturity Calendar with 1-day reminders!',
        '満期リマインダー付き .ics カレンダーをダウンロードしました！'
      )
    );
  };

  return (
    <Card className="p-5 space-y-5">
      <CardHeader
        title={tx('Kệ Sổ Tiết Kiệm Thực Tế & Lịch Đáo Hạn (.ics)', 'Real Passbooks Tracker & Maturity Calendar (.ics)', '保有定期預金トラッカー＆満期カレンダー (.ics)')}
        description={tx(
          'Theo dõi sổ đang gửi tại Cake, Timo, LioBank, TNEX; tính lãi thực tế đến hôm nay và tải lịch nhắc đáo hạn về điện thoại.',
          'Track active passbooks at Cake, Timo, LioBank, and TNEX; compute live accrued Circular-14 interest and export .ics reminders.',
          '実際に保有中の定期預金の経過利息を日割りで算出し、スマホ用満期リマインダー(.ics)を書き出します。'
        )}
        right={
          <div className="flex flex-wrap gap-2">
            {enriched.length > 0 && (
              <Button type="button" size="sm" variant="secondary" onClick={exportPassbooksIcs}>
                <Download className="size-3.5 text-emerald-300" />
                {tx('Xuất lịch .ics', 'Export .ics', '.ics出力')}
              </Button>
            )}
            <Button type="button" size="sm" variant="primary" onClick={() => setShowForm((v) => !v)}>
              <Plus className="size-3.5" />
              {tx('Thêm sổ mới', 'Add Passbook', '預金を追加')}
            </Button>
          </div>
        }
      />

      {showForm && (
        <form onSubmit={handleAddPassbook} className="rounded-xl border border-indigo-400/25 bg-indigo-500/[0.04] p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">{tx('Ngân hàng số', 'Digital Bank', 'ネット銀行')}</label>
              <select
                value={bankId}
                onChange={(e) => handleBankChange(e.target.value)}
                className="select h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">{tx('Tên gợi nhớ của sổ', 'Passbook Label', '預金メモ名')}</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
                placeholder={tx('VD: Sổ mua nhà GĐ1', 'e.g. House Fund #1', '例：マイホーム資金1')}
                className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">{tx('Số tiền gốc (₫)', 'Principal (VND)', '元本 (VND)')}</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                min={50000}
                step={1000000}
                className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white tabular-nums"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Kỳ hạn', 'Tenure', '期間')}</label>
                <select
                  value={tenureMonths}
                  onChange={(e) => handleTenureChange(Number(e.target.value))}
                  className="select h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                >
                  {TENURE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m} {tx('tháng', 'M', 'ヶ月')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Lãi suất chốt (%)', 'Locked Rate %', '契約金利 %')}</label>
                <input
                  type="number"
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  step={0.05}
                  min={0.1}
                  max={25}
                  className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">{tx('Ngày mở sổ', 'Open Date', '預入日')}</label>
              <input
                type="date"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
                className="h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Người đứng tên', 'Owner', '名義')}</label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="select h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                >
                  <option value="SELF">{tx('Bản thân', 'Self', '本人')}</option>
                  <option value="PARTNER">{tx('Bạn đời', 'Partner', 'パートナー')}</option>
                  <option value="JOINT">{tx('Quỹ chung', 'Joint', '共有')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">{tx('Mục đích quỹ', 'Purpose', '目的')}</label>
                <select
                  value={fundTag}
                  onChange={(e) => setFundTag(e.target.value)}
                  className="select h-9 w-full rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                >
                  <option value="GOAL">{tx('Mục tiêu tài sản', 'Wealth Goal', '資産目標')}</option>
                  <option value="EMERGENCY">{tx('Quỹ dự phòng', 'Emergency Fund', '緊急防衛資金')}</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              {tx('Huỷ', 'Cancel', 'キャンセル')}
            </Button>
            <Button type="submit" size="sm" variant="primary">
              {tx('Lưu sổ vào Kệ', 'Save Passbook', '保存する')}
            </Button>
          </div>
        </form>
      )}

      {enriched.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.06]">
              <div className="text-[11px] text-zinc-500">{tx('Tổng gốc thực tế', 'Real Principal', '保有元本合計')}</div>
              <div className="mt-1 text-base font-semibold text-white tabular-nums">{compact(totals.totalPrincipal, lang)}</div>
            </div>
            <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.06]">
              <div className="text-[11px] text-zinc-500">{tx('Lãi tích lũy tới hôm nay', 'Accrued To Date', '本日迄経過利息')}</div>
              <div className="mt-1 text-base font-semibold text-emerald-300 tabular-nums">{vnd(totals.totalAccrued, lang)}</div>
            </div>
            <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.06]">
              <div className="text-[11px] text-zinc-500">{tx('Tổng lãi khi đáo hạn', 'Maturity Interest', '満期受取見込利息')}</div>
              <div className="mt-1 text-base font-semibold text-indigo-300 tabular-nums">{vnd(totals.totalExpected, lang)}</div>
            </div>
            <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.06]">
              <div className="text-[11px] text-zinc-500">{tx('So với mục tiêu /plan', 'Vs. Plan Target', '計画達成率')}</div>
              <div className="mt-1 text-base font-semibold text-amber-300 tabular-nums">{planProgressPct}%</div>
            </div>
          </div>

          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
            {enriched.map((pb) => {
              const bankObj = banks.find((b) => b.id === pb.bankId) || { color: '#6366f1', logoText: pb.bankId.toUpperCase() };
              const isDummyPassbook =
                String(pb.id).startsWith('pb_ef_') ||
                String(pb.id).startsWith('pb_goal_') ||
                pb.label?.includes('[Mẫu Bot') ||
                pb.label?.includes('Dummy');
              return (
                <div
                  key={pb.id}
                  className={cx(
                    'rounded-xl border p-4 space-y-3',
                    pb.status === 'maturing_soon'
                      ? 'border-amber-400/35 bg-amber-500/[0.05]'
                      : pb.status === 'matured'
                        ? 'border-emerald-400/35 bg-emerald-500/[0.05]'
                        : 'border-white/[0.07] bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BankMark bank={bankObj} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-white">{pb.label}</span>
                          {isDummyPassbook && (
                            <Badge tone="neutral">🤖 {tx('Sổ mẫu tham khảo', 'Bot Dummy', '参考ダミー')}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                          <span>{pb.tenureMonths}M · {pct(pb.ratePct, 2, lang)}</span>
                          <span>·</span>
                          <span>{pb.fundTag === 'EMERGENCY' ? tx('Quỹ dự phòng', 'Emergency', '緊急資金') : tx('Mục tiêu', 'Goal', '目標')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge tone={pb.status === 'matured' ? 'success' : pb.status === 'maturing_soon' ? 'warning' : 'brand'}>
                        <Clock className="size-3" />
                        {pb.status === 'matured'
                          ? tx('Đã đáo hạn', 'Matured', '満期到達')
                          : tx(`Còn ${pb.daysRemaining} ngày`, `${pb.daysRemaining}d left`, `残${pb.daysRemaining}日`)}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleDelete(pb.id)}
                        className="rounded-lg p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-300"
                        aria-label={tx('Xoá sổ', 'Remove', '削除')}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between text-xs tabular-nums">
                    <span className="font-semibold text-white">{vnd(pb.principal, lang)}</span>
                    <span className="text-emerald-300">
                      +{vnd(pb.accruedInterestToday, lang)} / {vnd(pb.expectedMaturityInterest, lang)}
                    </span>
                  </div>

                  <Progress value={pb.progressPct} tone={pb.status === 'matured' ? 'emerald' : 'indigo'} />

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{tx('Mở:', 'Open:', '預入：')} {pb.openDate}</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" /> {tx('Đáo hạn:', 'Matures:', '満期：')} {pb.maturityDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </AdaptiveGrid>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 p-6 text-center space-y-3">
          <p className="text-xs leading-relaxed text-zinc-400">
            {tx(
              'Bạn chưa thêm cuốn sổ tiết kiệm thực tế nào. Hãy nhập sổ đang mở trên Cake, Timo, LioBank, TNEX hoặc tạo nhanh 2 sổ mẫu từ kế hoạch hiện tại để theo dõi lãi thực tế mỗi ngày & xuất lịch nhắc .ics.',
              'No active passbooks tracked yet. Add your real deposits or generate 2 starter passbooks from your current roadmap to track live accrued interest and export .ics maturity reminders.',
              '保有中の定期預金はまだ登録されていません。手動追加または現在のプランからサンプルを自動作成して経過利息と満期リマインダーを追跡できます。'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" variant="primary" onClick={handleSeedFromPlan}>
              <Sparkles className="size-3.5" />
              {tx('Tạo 2 sổ mẫu từ Kế hoạch', 'Seed 2 Sample Passbooks', 'プランから2件作成')}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="size-3.5" />
              {tx('Tự nhập sổ của tôi', 'Enter My Passbook', '自分で入力')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
