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
      const res = await saveCloudPlanToApi({
        title: 'Kế hoạch VnSavingPro',
        shareCode: cloudCode || undefined,
        accessToken: getAccessToken(),
        payload: {
          plan: isPlainObject(plannerState) ? plannerState : {},
          customRates: isPlainObject(savedCustomRates) ? savedCustomRates : {},
        },
      });
      setCloudCode(res.shareCode);
      setInputCode(res.shareCode);
      saveCloudCodeLocal(res.shareCode);
      const storageLabel =
        res.storage === 'supabase'
          ? 'Supabase Postgres (vĩnh viễn)'
          : 'bộ nhớ tạm Serverless (fallback)';
      setCloudStatus({
        tone: 'success',
        message: `Đã lưu kế hoạch lên ${storageLabel}. Mã chia sẻ: ${res.shareCode}`,
        needsReload: false,
      });
      notify(`Đã đồng bộ Cloud — Mã: ${res.shareCode}`);
    } catch (err) {
      setCloudStatus({
        tone: 'danger',
        message: err?.message || 'Không thể lưu kế hoạch lên Cloud lúc này.',
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
        message: 'Mã Cloud hợp lệ gồm 6–12 ký tự chữ hoặc số (VD: A7K9P2).',
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
      const loadedCode = res.plan?.shareCode || clean;
      setCloudCode(loadedCode);
      setInputCode(loadedCode);
      saveCloudCodeLocal(loadedCode);
      setCloudStatus({
        tone: 'success',
        message: `Đã khôi phục kế hoạch từ mã ${loadedCode} (${res.storage === 'supabase' ? 'Supabase Postgres' : 'Memory'}).`,
        needsReload: true,
      });
      notify(`Đã khôi phục kế hoạch từ mã ${loadedCode}`);
    } catch (err) {
      setCloudStatus({
        tone: 'danger',
        message: err?.message || 'Không tìm thấy mã kế hoạch trên Cloud.',
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
      notify(`Đã sao chép mã Cloud: ${cloudCode}`);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      notify(`Mã Cloud của bạn: ${cloudCode}`);
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
      feedbackLog: Array.isArray(feedbackLog) ? feedbackLog : [],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `VnSavingPro_Backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Đã tải file sao lưu');
  };

  const importBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File sao lưu vượt quá giới hạn 2 MB.');
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
      if (Array.isArray(data.feedbackLog)) {
        cryptoStorage.save('USER_FEEDBACK_LOG', data.feedbackLog);
      }
      notify('Đã kiểm tra an toàn & khôi phục dữ liệu');
      onClose();
    } catch {
      alert('File sao lưu không hợp lệ.');
    }
  };

  const clearAll = () => {
    if (!confirm('Xoá toàn bộ dữ liệu đã lưu trên thiết bị này? Hành động này không thể hoàn tác.')) return;
    cryptoStorage.clearAll();
    try {
      window.localStorage?.removeItem(CLOUD_CODE_KEY);
    } catch {
      // Ignore storage error
    }
    setCloudCode('');
    setInputCode('');
    replaceAll({});
    notify('Đã xoá dữ liệu trên thiết bị');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Dữ liệu & Đồng bộ Cloud">
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
              ? 'Supabase Cloud: Đã kết nối'
              : 'Chế độ Local Fallback (Chưa gắn khóa Supabase)'}
          </Badge>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          {supabaseConnected
            ? 'Lãi suất cập nhật 09:00 hằng ngày, góp ý người dùng và kế hoạch tiết kiệm được lưu vĩnh viễn trên PostgreSQL Supabase.'
            : 'Máy chủ đang chạy ở chế độ tạm. Khi cấu hình dự án Supabase trong .env.local hoặc Vercel Environment Variables, mọi dữ liệu sẽ tự động lưu vĩnh viễn trên PostgreSQL.'}
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
                ? 'Đang đồng bộ...'
                : cloudCode
                ? 'Cập nhật kế hoạch lên Cloud'
                : 'Lưu kế hoạch lên Cloud & Tạo mã chia sẻ'}
            </Button>

            {cloudCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                title="Sao chép mã chia sẻ"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3 font-mono text-xs font-semibold tracking-wider text-indigo-200 transition hover:bg-indigo-500/25"
              >
                {cloudCode}
                {copiedCode ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
              </button>
            )}
          </div>

          <form onSubmit={handleLoadCloud} className="flex items-center gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
              placeholder="Nhập mã Cloud 6 ký tự (VD: A7K9P2)"
              aria-label="Mã kế hoạch từ Cloud"
              className="h-9 flex-1 rounded-xl border border-white/10 bg-canvas/80 px-3 font-mono text-xs uppercase tracking-wider text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
            />
            <Button type="submit" size="sm" disabled={cloudBusy !== null}>
              <DownloadCloud className="size-3.5" />
              {cloudBusy === 'load' ? 'Đang tải...' : 'Tải kế hoạch từ mã Cloud'}
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
                  <RefreshCw className="size-3" /> Áp dụng ngay
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-[11px] text-zinc-400">
            {user ? (
              <>
                <span>Đang đăng nhập: {user.email}</span>
                <a href={href('profile')} onClick={onClose} className="font-medium text-indigo-300 hover:text-indigo-200">
                  Mở Hồ sơ &amp; Kịch bản →
                </a>
              </>
            ) : (
              <>
                <span>Đăng nhập để lưu nhiều kịch bản riêng tư</span>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    Đăng nhập / Google →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Callout icon={ShieldCheck} tone="brand" className="mb-4">
        Dữ liệu cá nhân trên thiết bị luôn được mã hoá cục bộ. Chỉ khi bạn chủ động bấm lưu Cloud hoặc gửi góp ý, bản
        sao mới được đồng bộ qua API máy chủ.
      </Callout>

      <dl className="mb-5 divide-y divide-white/[0.05] rounded-xl ring-1 ring-inset ring-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Lãi suất tự chỉnh</dt>
          <dd className="font-medium tabular-nums text-white">{Object.keys(customRates).length}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Mã giới thiệu của bạn</dt>
          <dd className="font-medium tabular-nums text-white">{referralCount}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Kế hoạch thu nhập thụ động</dt>
          <dd className="font-medium text-emerald-300">{hasSavedPlan ? 'Đã lưu tự động' : 'Chưa lưu'}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Đánh giá &amp; góp ý đã lưu</dt>
          <dd className="font-medium tabular-nums text-white">{feedbackCount}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <dt className="text-zinc-400">Phiên bản công cụ</dt>
          <dd className="font-medium tabular-nums text-indigo-300">
            {APP_VERSION} ({APP_VERSION_DATE})
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportBackup}>
          <Download className="size-4" /> Sao lưu JSON
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Khôi phục
        </Button>
        {feedbackCount > 0 && (
          <Button
            className="col-span-2"
            onClick={() => {
              if (exportFeedbackCSV()) notify('Đã xuất lịch sử đánh giá & góp ý (.CSV)');
            }}
          >
            <MessageSquareText className="size-4" /> Xuất lịch sử Feedback (.CSV)
          </Button>
        )}
        <Button variant="danger" className="col-span-2" onClick={clearAll}>
          <Trash2 className="size-4" /> Xoá toàn bộ dữ liệu
        </Button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importBackup} />
    </Modal>
  );
}
