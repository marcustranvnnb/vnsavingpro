import React, { useRef, useState } from 'react';
import {
  Check,
  Cloud,
  CloudOff,
  Copy,
  Download,
  DownloadCloud,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge, Button, Callout, Modal } from './ui.jsx';
import { exportFeedbackCSV } from './FeedbackWidget.jsx';
import { fetchCloudPlanFromApi, saveCloudPlanToApi } from '../utils/apiClient.js';
import { cryptoStorage, isPlainObject } from '../utils/cryptoStorage.js';
import { useI18n } from '../i18n/index.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { href, useRates, useToast } from '../state.jsx';
import { APP_VERSION, APP_VERSION_DATE } from '../tools.js';

const CLOUD_CODE_KEY = 'vnsaving_cloud_code';
const CLOUD_CODE_RE = /^[A-Z0-9]{6,12}$/;
const today = () => new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');

function readSavedCloudCode() {
  try {
    const raw = window.localStorage?.getItem(CLOUD_CODE_KEY) || '';
    const clean = raw.trim().toUpperCase();
    return CLOUD_CODE_RE.test(clean) ? clean : '';
  } catch {
    return '';
  }
}

function saveCloudCodeLocal(code) {
  try {
    if (CLOUD_CODE_RE.test(code)) {
      window.localStorage?.setItem(CLOUD_CODE_KEY, code);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function DataModal({ open, onClose, onOpenAuth }) {
  const { customRates, replaceAll, ratesSyncMeta } = useRates();
  const { user, getAccessToken } = useAuth();
  const { lang, tx } = useI18n();
  const notify = useToast();
  const fileRef = useRef(null);

  const [cloudCode, setCloudCode] = useState(readSavedCloudCode);
  const [inputCode, setInputCode] = useState(readSavedCloudCode);
  const [cloudBusy, setCloudBusy] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const supabaseConnected = Boolean(ratesSyncMeta?.supabaseConnected);
  const referralCount = Object.keys(cryptoStorage.load('CUSTOM_REFERRAL_CODES', {})).length;
  const hasSavedPlan = Boolean(cryptoStorage.load('PLANNER_STATE', null));
  const feedbackLog = cryptoStorage.load('USER_FEEDBACK_LOG', []);
  const feedbackCount = Array.isArray(feedbackLog) ? feedbackLog.length : 0;

  const handleSaveCloud = async () => {
    setCloudBusy('save');
    setCloudStatus(null);
    try {
      const plannerState = cryptoStorage.load('PLANNER_STATE', null);
      const savedCustomRates = cryptoStorage.load('CUSTOM_RATES', {});
      const fxPortfolio = cryptoStorage.load('FX_PORTFOLIO_STATE', null);
      const salaryState = cryptoStorage.load('SALARY_STATE', null);
      const activePassbooks = cryptoStorage.load('ACTIVE_PASSBOOKS_STATE', []);
      const cicLoanState = cryptoStorage.load('CIC_LOAN_STATE', null);
      const wealthTrees = cryptoStorage.load('WEALTH_TREES_STATE', []);
      const res = await saveCloudPlanToApi({
        title: tx('Kế hoạch VnSavingPro', 'VnSavingPro Plan', 'VnSavingPro プラン'),
        shareCode: cloudCode || undefined,
        accessToken: getAccessToken(),
        payload: {
          plan: isPlainObject(plannerState) ? plannerState : {},
          customRates: isPlainObject(savedCustomRates) ? savedCustomRates : {},
          fxPortfolio: isPlainObject(fxPortfolio) ? fxPortfolio : {},
          salaryState: isPlainObject(salaryState) ? salaryState : {},
          activePassbooks: Array.isArray(activePassbooks) ? activePassbooks : [],
          cicLoanState: isPlainObject(cicLoanState) ? cicLoanState : {},
          wealthTrees: Array.isArray(wealthTrees) ? wealthTrees : [],
        },
      });
      setCloudCode(res.shareCode);
      setInputCode(res.shareCode);
      saveCloudCodeLocal(res.shareCode);
      const storageLabel =
        res.storage === 'supabase'
          ? tx('Supabase Postgres (vĩnh viễn)', 'Supabase Postgres (permanent)', 'Supabase Postgres（永続保存）')
          : tx('bộ nhớ tạm Serverless (fallback)', 'Serverless cache (fallback)', 'サーバーレス一時キャッシュ');
      setCloudStatus({
        tone: 'success',
        message: tx(
          `Đã lưu kế hoạch lên ${storageLabel}. Mã chia sẻ: ${res.shareCode}`,
          `Saved plan to ${storageLabel}. Share code: ${res.shareCode}`,
          `${storageLabel} に保存しました。共有コード：${res.shareCode}`
        ),
        needsReload: false,
      });
      notify(tx(`Đã đồng bộ Cloud — Mã: ${res.shareCode}`, `Synced to Cloud — Code: ${res.shareCode}`, `クラウド同期完了 — コード：${res.shareCode}`));
    } catch (err) {
      setCloudStatus({
        tone: 'danger',
        message: err?.message || tx('Không thể lưu kế hoạch lên Cloud lúc này.', 'Could not save plan to Cloud right now.', '現在クラウドへ保存できませんでした。'),
        needsReload: false,
      });
    } finally {
      setCloudBusy(null);
    }
  };

  const handleLoadCloud = async (e) => {
    e?.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!CLOUD_CODE_RE.test(clean)) {
      setCloudStatus({
        tone: 'danger',
        message: tx(
          'Mã Cloud hợp lệ gồm 6–12 ký tự chữ hoặc số (VD: A7K9P2).',
          'Valid Cloud codes are 6–12 alphanumeric characters (e.g. A7K9P2).',
          '有効なクラウドコードは6〜12文字の英数字です（例：A7K9P2）。'
        ),
        needsReload: false,
      });
      return;
    }
    setCloudBusy('load');
    setCloudStatus(null);
    try {
      const res = await fetchCloudPlanFromApi(clean, getAccessToken());
      const payload = res.plan?.payload;
      if (isPlainObject(payload?.customRates)) {
        replaceAll(payload.customRates);
      }
      if (isPlainObject(payload?.plan) && Object.keys(payload.plan).length > 0) {
        cryptoStorage.save('PLANNER_STATE', payload.plan);
      }
      if (isPlainObject(payload?.fxPortfolio) && Object.keys(payload.fxPortfolio).length > 0) {
        cryptoStorage.save('FX_PORTFOLIO_STATE', payload.fxPortfolio);
      }
      if (isPlainObject(payload?.salaryState) && Object.keys(payload.salaryState).length > 0) {
        cryptoStorage.save('SALARY_STATE', payload.salaryState);
      }
      if (Array.isArray(payload?.activePassbooks) && payload.activePassbooks.length > 0) {
        cryptoStorage.save('ACTIVE_PASSBOOKS_STATE', payload.activePassbooks);
      }
      if (isPlainObject(payload?.cicLoanState) && Object.keys(payload.cicLoanState).length > 0) {
        cryptoStorage.save('CIC_LOAN_STATE', payload.cicLoanState);
      }
      if (Array.isArray(payload?.wealthTrees) && payload.wealthTrees.length > 0) {
        cryptoStorage.save('WEALTH_TREES_STATE', payload.wealthTrees);
      }
      const loadedCode = res.plan?.shareCode || clean;
      setCloudCode(loadedCode);
      setInputCode(loadedCode);
      saveCloudCodeLocal(loadedCode);
      setCloudStatus({
        tone: 'success',
        message: tx(
          `Đã khôi phục kế hoạch từ mã ${loadedCode} (${res.storage === 'supabase' ? 'Supabase Postgres' : 'Memory'}).`,
          `Restored plan from code ${loadedCode} (${res.storage === 'supabase' ? 'Supabase Postgres' : 'Memory'}).`,
          `コード ${loadedCode} からプランを復元しました。`
        ),
        needsReload: true,
      });
      notify(tx(`Đã khôi phục kế hoạch từ mã ${loadedCode}`, `Restored plan from ${loadedCode}`, `コード ${loadedCode} から復元しました`));
    } catch (err) {
      setCloudStatus({
        tone: 'danger',
        message: err?.message || tx('Không tìm thấy mã kế hoạch trên Cloud.', 'Plan code not found on Cloud.', 'クラウド上にプランコードが見つかりません。'),
        needsReload: false,
      });
    } finally {
      setCloudBusy(null);
    }
  };

  const handleCopyCode = async () => {
    if (!cloudCode) return;
    try {
      await navigator.clipboard?.writeText(cloudCode);
      setCopiedCode(true);
      notify(tx(`Đã sao chép mã Cloud: ${cloudCode}`, `Copied Cloud code: ${cloudCode}`, `コードをコピーしました：${cloudCode}`));
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      notify(tx(`Mã Cloud của bạn: ${cloudCode}`, `Your Cloud code: ${cloudCode}`, `クラウドコード：${cloudCode}`));
    }
  };

  const exportBackup = () => {
    const data = {
      app: 'VnSavingPro',
      version: APP_VERSION.replace(/^v/, ''),
      exportedAt: new Date().toISOString(),
      customRates: cryptoStorage.load('CUSTOM_RATES', {}),
      customReferralCodes: cryptoStorage.load('CUSTOM_REFERRAL_CODES', {}),
      plannerState: cryptoStorage.load('PLANNER_STATE', null),
      fxPortfolio: cryptoStorage.load('FX_PORTFOLIO_STATE', null),
      salaryState: cryptoStorage.load('SALARY_STATE', null),
      activePassbooks: cryptoStorage.load('ACTIVE_PASSBOOKS_STATE', []),
      cicLoanState: cryptoStorage.load('CIC_LOAN_STATE', null),
      wealthTrees: cryptoStorage.load('WEALTH_TREES_STATE', []),
      feedbackLog: Array.isArray(feedbackLog) ? feedbackLog : [],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `VnSavingPro_Backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(tx('Đã tải file sao lưu', 'Downloaded backup JSON', 'バックアップファイルを保存しました'));
  };

  const importBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(tx('File sao lưu vượt quá giới hạn 2 MB.', 'Backup file exceeds the 2 MB limit.', 'バックアップファイルが2MBの上限を超えています。'));
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('invalid');
      replaceAll(data.customRates && typeof data.customRates === 'object' ? data.customRates : {});
      if (data.customReferralCodes && typeof data.customReferralCodes === 'object') {
        cryptoStorage.save('CUSTOM_REFERRAL_CODES', data.customReferralCodes);
      }
      if (data.plannerState && typeof data.plannerState === 'object') {
        cryptoStorage.save('PLANNER_STATE', data.plannerState);
      }
      if (data.fxPortfolio && typeof data.fxPortfolio === 'object') {
        cryptoStorage.save('FX_PORTFOLIO_STATE', data.fxPortfolio);
      }
      if (data.salaryState && typeof data.salaryState === 'object') {
        cryptoStorage.save('SALARY_STATE', data.salaryState);
      }
      if (Array.isArray(data.activePassbooks)) {
        cryptoStorage.save('ACTIVE_PASSBOOKS_STATE', data.activePassbooks);
      }
      if (data.cicLoanState && typeof data.cicLoanState === 'object') {
        cryptoStorage.save('CIC_LOAN_STATE', data.cicLoanState);
      }
      if (Array.isArray(data.wealthTrees)) {
        cryptoStorage.save('WEALTH_TREES_STATE', data.wealthTrees);
      }
      if (Array.isArray(data.feedbackLog)) {
        cryptoStorage.save('USER_FEEDBACK_LOG', data.feedbackLog);
      }
      notify(tx('Đã kiểm tra an toàn & khôi phục dữ liệu', 'Verified & restored local backup', 'データを検証・復元しました'));
      onClose();
    } catch {
      alert(tx('File sao lưu không hợp lệ.', 'Invalid backup file.', '無効なバックアップファイルです。'));
    }
  };

  const clearAll = () => {
    if (
      !confirm(
        tx(
          'Xoá toàn bộ dữ liệu đã lưu trên thiết bị này? Hành động này không thể hoàn tác.',
          'Erase all saved data on this device? This action cannot be undone.',
          'この端末に保存されたすべてのデータを消去しますか？この操作は取り消せません。'
        )
      )
    ) {
      return;
    }
    cryptoStorage.clearAll();
    try {
      window.localStorage?.removeItem(CLOUD_CODE_KEY);
    } catch {
      // Ignore storage error
    }
    setCloudCode('');
    setInputCode('');
    replaceAll({});
    notify(tx('Đã xoá dữ liệu trên thiết bị', 'Cleared local device data', '端末のデータを削除しました'));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={tx('Dữ liệu & Đồng bộ Cloud', 'Data & Cloud Sync', 'データ管理・クラウド同期')}>
      {/* Supabase Cloud Sync Card */}
      <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            {supabaseConnected ? (
              <Cloud className="size-4 text-emerald-400" />
            ) : (
              <CloudOff className="size-4 text-amber-400" />
            )}
            Supabase Cloud Sync
          </div>
          <Badge tone={supabaseConnected ? 'success' : 'warning'}>
            {supabaseConnected
              ? tx('Supabase Cloud: Đã kết nối', 'Supabase Cloud: Connected', 'Supabase 接続済み')
              : tx('Chế độ Local Fallback (Chưa gắn khóa Supabase)', 'Local Fallback Mode', 'ローカルフォールバック中')}
          </Badge>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          {supabaseConnected
            ? tx(
                'Lãi suất cập nhật đầu mỗi tháng (mùng 1 lúc 09:00), góp ý người dùng và kế hoạch tiết kiệm được lưu vĩnh viễn trên PostgreSQL Supabase.',
                'Monthly 1st (09:00 AM) bank rates, feedback, and shared savings plans are persisted on Supabase PostgreSQL.',
                '毎月1日09:00の金利データや共有プランはSupabase PostgreSQLに永続保存されます。'
              )
            : tx(
                'Máy chủ đang chạy ở chế độ tạm. Khi cấu hình Supabase trong biến môi trường, mọi dữ liệu sẽ lưu vĩnh viễn.',
                'Running in temporary fallback mode until Supabase env variables are connected.',
                '環境変数設定前の一時フォールバックモードで稼働しています。'
              )}
        </p>

        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleSaveCloud}
              disabled={cloudBusy !== null}
            >
              <Cloud className="size-3.5" />
              {cloudBusy === 'save'
                ? tx('Đang đồng bộ...', 'Syncing...', '同期中...')
                : cloudCode
                  ? tx('Cập nhật kế hoạch lên Cloud', 'Update Plan on Cloud', 'クラウドのプランを更新')
                  : tx('Lưu kế hoạch lên Cloud & Tạo mã chia sẻ', 'Save to Cloud & Create Code', 'クラウドに保存してコード生成')}
            </Button>

            {cloudCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                title={tx('Sao chép mã chia sẻ', 'Copy share code', '共有コードをコピー')}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3 font-mono text-xs font-semibold tracking-wider text-indigo-200 transition hover:bg-indigo-500/25"
              >
                {cloudCode}
                {copiedCode ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
              </button>
            )}
          </div>

          <form onSubmit={handleLoadCloud} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
              placeholder={tx('Nhập mã Cloud 6 ký tự (VD: A7K9P2)', 'Enter 6-char Cloud code (e.g. A7K9P2)', '6文字のコードを入力 (例: A7K9P2)')}
              aria-label={tx('Mã kế hoạch từ Cloud', 'Cloud plan code', 'クラウドプランコード')}
              className="h-10 w-full flex-1 rounded-xl border border-white/10 bg-canvas/80 px-3 font-mono text-base uppercase tracking-wider text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none sm:h-9 sm:text-xs"
            />
            <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={cloudBusy !== null}>
              <DownloadCloud className="size-3.5" />
              {cloudBusy === 'load'
                ? tx('Đang tải...', 'Loading...', '読込中...')
                : tx('Tải kế hoạch từ mã Cloud', 'Load Plan from Code', 'コードから読込')}
            </Button>
          </form>

          {cloudStatus && (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs ${
                cloudStatus.tone === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/20'
              }`}
            >
              <span>{cloudStatus.message}</span>
              {cloudStatus.needsReload && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1 font-medium text-white underline underline-offset-2 hover:text-emerald-200"
                >
                  <RefreshCw className="size-3" /> {tx('Áp dụng ngay', 'Reload & apply', '今すぐ反映')}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5 text-[11px] text-zinc-400">
            {user ? (
              <>
                <span>
                  {tx('Đang đăng nhập:', 'Signed in:', 'ログイン中：')} {user.email}
                </span>
                <a href={href('profile')} onClick={onClose} className="font-medium text-indigo-300 hover:text-indigo-200">
                  {tx('Mở Hồ sơ & Kịch bản →', 'Open Profile & Plans →', 'プロフィールを開く →')}
                </a>
              </>
            ) : (
              <>
                <span>
                  {tx(
                    'Đăng nhập để lưu nhiều kịch bản riêng tư',
                    'Sign in to save multiple private scenarios',
                    'ログインして複数の非公開プランを保存'
                  )}
                </span>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    {tx('Đăng nhập / Google →', 'Sign in / Google →', 'ログイン / Google →')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Callout icon={ShieldCheck} tone="brand" className="mb-4">
        {tx(
          'Dữ liệu cá nhân trên thiết bị luôn được mã hoá cục bộ. Chỉ khi bạn chủ động bấm lưu Cloud hoặc gửi góp ý, bản sao mới được đồng bộ qua API máy chủ.',
          'Device data is always locally encrypted. Nothing syncs to Cloud servers unless you explicitly click Save to Cloud or submit feedback.',
          '端末内の個人データは常に暗号化保存されます。クラウド保存や評価送信を押さない限りサーバーへ送信されません。'
        )}
      </Callout>

      <dl className="mb-5 divide-y divide-white/[0.05] rounded-xl ring-1 ring-inset ring-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">{tx('Lãi suất tự chỉnh', 'Custom interest overrides', 'カスタム金利設定数')}</dt>
          <dd className="font-medium tabular-nums text-white">{Object.keys(customRates).length}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">{tx('Mã giới thiệu của bạn', 'Saved referral codes', '保存済み紹介コード')}</dt>
          <dd className="font-medium tabular-nums text-white">{referralCount}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">{tx('Kế hoạch thu nhập thụ động', 'Passive income plan', '不労所得プラン')}</dt>
          <dd className="font-medium text-emerald-300">
            {hasSavedPlan ? tx('Đã lưu tự động', 'Auto-saved', '自動保存済み') : tx('Chưa lưu', 'Not saved yet', '未保存')}
          </dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">{tx('Đánh giá & góp ý đã lưu', 'Saved feedback items', '保存済みフィードバック')}</dt>
          <dd className="font-medium tabular-nums text-white">{feedbackCount}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">{tx('Phiên bản công cụ', 'App version', 'バージョン')}</dt>
          <dd className="font-medium tabular-nums text-indigo-300">
            {APP_VERSION} ({APP_VERSION_DATE})
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportBackup}>
          <Download className="size-4" /> {tx('Sao lưu JSON', 'Export JSON', 'JSON出力')}
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> {tx('Khôi phục', 'Restore', '復元')}
        </Button>
        {feedbackCount > 0 && (
          <Button
            className="col-span-2"
            onClick={() => {
              if (exportFeedbackCSV(lang)) {
                notify(tx('Đã xuất lịch sử đánh giá & góp ý (.CSV)', 'Exported feedback history (.CSV)', 'フィードバック履歴 (.CSV) を出力しました'));
              }
            }}
          >
            <MessageSquareText className="size-4" /> {tx('Xuất lịch sử Feedback (.CSV)', 'Export Feedback Log (.CSV)', 'フィードバック履歴出力 (.CSV)')}
          </Button>
        )}
        <Button variant="danger" className="col-span-2" onClick={clearAll}>
          <Trash2 className="size-4" /> {tx('Xoá toàn bộ dữ liệu', 'Clear All Device Data', '全データを削除')}
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importBackup} />
    </Modal>
  );
}
