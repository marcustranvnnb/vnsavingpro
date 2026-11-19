import React from 'react';
import { HardDriveDownload, RefreshCw, Rocket, ShieldAlert, X } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { Badge, Button, Card } from './ui.jsx';

export function PocValidationOverlay({
  open,
  info,
  isPreview = false,
  onClosePreview,
  onOpenData,
}) {
  const { lang, tx } = useI18n();
  if (!open) return null;

  const enMsg =
    info?.message ||
    'This product has reached the POC Validation Phase. The business owner is preparing for an upgrade to have a better experience. Please accept our apologies.';
  const viMsg =
    info?.messageVi ||
    'Sản phẩm đã đạt đến giai đoạn xác thực POC (POC Validation Phase). Chủ sở hữu dự án đang chuẩn bị nâng cấp hạ tầng để mang lại trải nghiệm tốt hơn. Rất mong bạn thông cảm cho sự bất tiện này.';
  const jaMsg =
    '本プロダクトはPOC検証フェーズ（POC Validation Phase）の上限に達しました。より良い体験をお届けするため、開発者がインフラのアップグレード準備を進めております。ご不便をおかけし申し訳ございません。';

  const primaryTitle =
    lang === 'ja'
      ? '本プロダクトはPOC検証フェーズに達しました'
      : 'This product has reached the POC Validation Phase';
  const primaryMsg = lang === 'ja' ? jaMsg : enMsg;
  const secondaryMsg = lang === 'en' ? viMsg : lang === 'ja' ? enMsg : viMsg;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="poc-validation-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 px-4 py-8 backdrop-blur-xl"
    >
      <Card className="relative w-full max-w-xl animate-pop border-amber-400/25 bg-surface/95 p-6 shadow-2xl sm:p-8">
        {isPreview && onClosePreview && (
          <button
            type="button"
            onClick={onClosePreview}
            aria-label={tx('Đóng xem trước POC', 'Close POC preview', 'POCプレビューを閉じる')}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="VnSavingPro"
              width={36}
              height={36}
              className="size-9 rounded-xl object-cover ring-1 ring-white/15"
            />
            <span className="text-base font-semibold tracking-tight text-white">
              VnSaving<span className="text-indigo-300">Pro</span>
            </span>
          </div>
          <Badge tone="warning" className="gap-1.5">
            <Rocket className="size-3.5" />
            POC Validation Phase
          </Badge>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-300" />
            <div>
              <h1 id="poc-validation-heading" className="text-lg font-semibold leading-snug text-white sm:text-xl">
                {primaryTitle}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{primaryMsg}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300 ring-1 ring-inset ring-white/[0.06]">
          {secondaryMsg}
        </p>

        {isPreview && (
          <p className="mt-3 text-xs text-indigo-300">
            {tx(
              '* Chế độ xem trước (`?preview_poc=1`) — Hạn mức gói Free hiện tại vẫn đang hoạt động bình thường.',
              '* Preview mode (`?preview_poc=1`) — Current Free-tier quota is still active.',
              '* プレビューモード（`?preview_poc=1`）— 現在の無料枠クォータは通常どおり稼働中です。'
            )}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          {onOpenData && (
            <Button variant="primary" onClick={onOpenData} className="flex-1 sm:flex-none">
              <HardDriveDownload className="size-4" />{' '}
              {tx('Sao lưu dữ liệu cục bộ (.JSON)', 'Export Local Backup (.JSON)', 'ローカルバックアップ (.JSON)')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" /> {tx('Kiểm tra lại', 'Retry', '再読み込み')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
