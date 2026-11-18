import React, { useEffect, useState } from 'react';
import { Cookie, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import {
  getActiveCookiesList,
  getCookieConsent,
  saveCookieConsent,
} from '../utils/cookieManager.js';
import { useToast } from '../state.jsx';
import { Badge, Button, Modal, cx } from './ui.jsx';

function CookieToggle({ title, desc, checked, disabled = false, onChange, badge }) {
  return (
    <label
      className={cx(
        'flex items-start justify-between gap-4 rounded-xl bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06]',
        !disabled && 'cursor-pointer hover:bg-white/[0.04]'
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && <Badge tone={disabled ? 'success' : 'brand'}>{badge}</Badge>}
        </div>
        <p className="text-xs leading-relaxed text-zinc-400">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 size-4 shrink-0 accent-indigo-500"
      />
    </label>
  );
}

export function CookieBanner({ settingsOpen, onCloseSettings, onOpenSettings }) {
  const notify = useToast();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [prefsEnabled, setPrefsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [activeCookies, setActiveCookies] = useState([]);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      setBannerVisible(true);
    } else {
      setPrefsEnabled(existing.preferences);
      setAnalyticsEnabled(existing.analytics);
    }
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      const existing = getCookieConsent();
      if (existing) {
        setPrefsEnabled(existing.preferences);
        setAnalyticsEnabled(existing.analytics);
      }
      setActiveCookies(getActiveCookiesList());
    }
  }, [settingsOpen]);

  const applyConsent = (preferences, analytics, msg) => {
    saveCookieConsent({ preferences, analytics });
    setPrefsEnabled(preferences);
    setAnalyticsEnabled(analytics);
    setBannerVisible(false);
    setActiveCookies(getActiveCookiesList());
    onCloseSettings?.();
    if (msg) notify(msg);
  };

  return (
    <>
      {bannerVisible && !settingsOpen && (
        <div
          role="region"
          aria-label="Cài đặt Cookie"
          className="print-hidden fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-3xl animate-pop md:bottom-5"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-elevated/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-400/25">
                <Cookie className="size-4" />
              </span>
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-white">VnSavingPro sử dụng Cookie trên trình duyệt</div>
                <p className="leading-relaxed text-zinc-400">
                  Cookie giúp ghi nhớ ngân hàng, kỳ hạn bạn chọn và đo lường trải nghiệm trang. Số liệu tài chính cá nhân
                  của bạn vẫn chỉ được lưu cục bộ trên thiết bị.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenSettings?.()}
              >
                <SlidersHorizontal className="size-3.5" /> Tuỳ chỉnh
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => applyConsent(false, false, 'Đã lưu: chỉ sử dụng cookie thiết yếu')}
              >
                Chỉ thiết yếu
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => applyConsent(true, true, 'Đã chấp nhận cookie ghi nhớ & phân tích')}
              >
                Chấp nhận tất cả
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={settingsOpen} onClose={onCloseSettings} title="Cài đặt & Quản lý Cookie" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-zinc-400">
            Bạn có toàn quyền bật hoặc tắt các nhóm cookie không thiết yếu dưới đây. Thay đổi có hiệu lực ngay lập tức trên
            trình duyệt này.
          </p>

          <div className="space-y-2.5">
            <CookieToggle
              title="Cookie thiết yếu (vnsaving_cookie_consent)"
              badge="Luôn bật"
              checked
              disabled
              desc="Lưu trạng thái cài đặt cookie để hệ thống không hỏi lại trong các lần truy cập sau."
            />
            <CookieToggle
              title="Cookie ghi nhớ tuỳ chọn (vnsaving_prefs)"
              badge={prefsEnabled ? 'Đang bật' : 'Đã tắt'}
              checked={prefsEnabled}
              onChange={setPrefsEnabled}
              desc="Ghi nhớ nhanh ngân hàng số yêu thích, kỳ hạn mặc định và chế độ Cơ bản / Chuyên sâu."
            />
            <CookieToggle
              title="Cookie đo lường & Google Tag Manager (vnsaving_analytics)"
              badge={analyticsEnabled ? 'Đang bật' : 'Đã tắt'}
              checked={analyticsEnabled}
              onChange={setAnalyticsEnabled}
              desc="Cho phép thống kê ẩn danh lượt truy cập trang (page_view) nhằm cải thiện chất lượng công cụ."
            />
          </div>

          <div className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.06]">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-400" /> Cookie đang hoạt động trên trình duyệt
              </span>
              <span className="text-[11px] tabular-nums text-zinc-500">{activeCookies.length} cookie</span>
            </div>
            {activeCookies.length === 0 ? (
              <p className="text-[11px] text-zinc-500">Chưa có cookie nào được thiết lập.</p>
            ) : (
              <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1 text-[11px]">
                {activeCookies.map((c) => (
                  <div key={c.name} className="flex items-start justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1.5">
                    <div className="min-w-0">
                      <div className="font-mono font-medium text-indigo-200">{c.name}</div>
                      <div className="truncate text-zinc-500">{c.valuePreview}</div>
                    </div>
                    <Badge tone="neutral" className="shrink-0">{c.category}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => applyConsent(prefsEnabled, analyticsEnabled, 'Đã lưu cài đặt Cookie')}
            >
              Lưu lựa chọn
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => applyConsent(true, true, 'Đã bật tất cả cookie hỗ trợ')}
            >
              Chấp nhận tất cả
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
