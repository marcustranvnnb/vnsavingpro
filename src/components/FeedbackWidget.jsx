import React, { useState } from 'react';
import { Award, CheckCircle2, Download, ExternalLink, MessageSquarePlus, Send, Star } from 'lucide-react';
import { cryptoStorage, sanitizeText } from '../utils/cryptoStorage.js';
import { getFormatLang } from '../utils/format.js';
import { UNIKORN_PRODUCT_URL } from '../data/contributorsData.js';
import { useI18n } from '../i18n/index.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { href, useToast } from '../state.jsx';
import { Badge, Button, Card, CardHeader, Chip, cx } from './ui.jsx';

const FEEDBACK_TAGS = [
  { vi: 'Kết quả chính xác', en: 'Accurate results', ja: '結果が正確' },
  { vi: 'Dễ hiểu & trực quan', en: 'Clear & intuitive', ja: '見やすく直感的' },
  { vi: 'Cần thêm ngân hàng', en: 'Add more banks', ja: '銀行を増やしてほしい' },
  { vi: 'Giao diện cần gọn hơn', en: 'More compact UI', ja: 'UIをもっと簡潔に' },
  { vi: 'Muốn thêm tính năng', en: 'Feature request', ja: '新機能のリクエスト' },
];

export function exportFeedbackCSV(langOverride) {
  const lang = langOverride || getFormatLang();
  const list = cryptoStorage.load('USER_FEEDBACK_LOG', []);
  if (!Array.isArray(list) || list.length === 0) return false;
  const escCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head =
    lang === 'en'
      ? ['Timestamp', 'Tool', 'Rating (Stars)', 'Tags', 'Contributor', 'Comment', 'Snapshot']
      : lang === 'ja'
        ? ['日時', 'ツール', '評価（星）', 'タグ', '貢献者名', 'コメント', 'スナップショット']
        : ['Thời gian', 'Công cụ', 'Đánh giá (Sao)', 'Nhãn góp ý', 'Người đóng góp', 'Nhận xét chi tiết', 'Thông số'];
  const rows = list.map((item) => [
    escCsv(item.createdAt),
    escCsv(item.toolLabel || item.tool),
    escCsv(item.rating),
    escCsv((item.tags || []).join(' | ')),
    escCsv(item.contributorName || ''),
    escCsv(item.comment || ''),
    escCsv(item.snapshot ? JSON.stringify(item.snapshot) : ''),
  ]);
  const csv = '\uFEFF' + [head.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `VnSavingPro_Feedback_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function FeedbackWidget({ toolId, toolLabel, snapshot }) {
  const { lang, tx } = useI18n();
  const { user, profile } = useAuth();
  const notify = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [showPublicly, setShowPublicly] = useState(false);
  const [contributorName, setContributorName] = useState(
    () => profile?.full_name || user?.email?.split('@')[0] || ''
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedCount, setSavedCount] = useState(() => {
    const existing = cryptoStorage.load('USER_FEEDBACK_LOG', []);
    return Array.isArray(existing) ? existing.length : 0;
  });

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      notify(tx('Vui lòng chọn số sao đánh giá trước khi gửi', 'Please pick a star rating before sending', '送信前に星評価を選択してください'));
      return;
    }
    setSubmitting(true);

    const safeName = sanitizeText(contributorName, 60);
    const entry = {
      id: `${Date.now()}`,
      tool: sanitizeText(toolId, 32),
      toolLabel: sanitizeText(toolLabel, 100),
      rating: Math.min(5, Math.max(1, Math.round(Number(rating) || 1))),
      tags: tags.map((t) => sanitizeText(t, 60)).filter(Boolean),
      comment: sanitizeText(comment, 800),
      contributorName: showPublicly ? safeName : '',
      showPublicly: Boolean(showPublicly),
      snapshot: snapshot || null,
      createdAt: new Date().toISOString(),
    };

    const existing = cryptoStorage.load('USER_FEEDBACK_LOG', []);
    const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, 200);
    cryptoStorage.save('USER_FEEDBACK_LOG', next);
    setSavedCount(next.length);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // Local backup already saved even if offline
    }

    setSubmitting(false);
    setSubmitted(true);
    notify(
      showPublicly
        ? tx(
            'Cảm ơn bạn! Đánh giá đã được gửi & ghi danh lên Bảng Vinh Danh.',
            'Thank you! Feedback saved & listed on our Community Hall of Fame.',
            'ありがとうございます！評価を保存し、貢献者ボードへ掲載しました。'
          )
        : tx('Cảm ơn bạn! Đánh giá đã được sao lưu.', 'Thank you! Feedback has been saved.', 'ご意見ありがとうございます！評価を保存しました。')
    );
  };

  const resetForm = () => {
    setRating(0);
    setTags([]);
    setComment('');
    setSubmitted(false);
  };

  const activeStars = hoverRating || rating;
  const ratingWords = [
    tx('Rất tệ', 'Poor', '非常に不満'),
    tx('Chưa ổn', 'Fair', 'やや不満'),
    tx('Bình thường', 'Okay', '普通'),
    tx('Hài lòng', 'Good', '満足'),
    tx('Tuyệt vời', 'Excellent', '素晴らしい'),
  ];

  return (
    <Card className="print-hidden p-5 sm:p-6">
      <CardHeader
        title={tx('Đánh giá & góp ý kết quả này', 'Rate & Share Feedback', '計算結果の評価・フィードバック')}
        description={tx(
          'Phản hồi của bạn giúp VnSavingPro cải thiện từng phiên bản — có thể chọn hiển thị tên lên Bảng Vinh Danh hoặc góp ý thêm trên Unikorn.',
          'Your feedback guides upcoming releases — optionally credit your name on our Hall of Fame or share on Unikorn.',
          'ご意見は今後の改善に反映されます。希望者は貢献者ボードへお名前を掲載することもできます。'
        )}
        right={
          savedCount > 0 && (
            <Badge tone="neutral">
              {tx(`Đã lưu ${savedCount} đánh giá`, `${savedCount} saved`, `${savedCount}件保存済み`)}
            </Badge>
          )
        }
      />

      {submitted ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-emerald-500/[0.06] p-4 ring-1 ring-inset ring-emerald-400/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div>
              <div className="font-medium">
                {tx(
                  `Đã ghi nhận đánh giá ${rating}/5 sao cho ${toolLabel}!`,
                  `Recorded ${rating}/5 stars for ${toolLabel}!`,
                  `${toolLabel} への ${rating}/5 星評価を保存しました！`
                )}
              </div>
              <div className="mt-0.5 text-xs text-emerald-300/80">
                {showPublicly ? (
                  <a href={href('contributors')} className="underline hover:text-white">
                    {tx('Xem Bảng Vinh Danh Cộng Đồng →', 'View Community Hall of Fame →', '貢献者表彰ページを見る →')}
                  </a>
                ) : (
                  tx(
                    'Bạn có thể xem hoặc sao lưu toàn bộ lịch sử đánh giá trong mục "Dữ liệu của bạn".',
                    'You can export your full feedback log anytime from the Data modal.',
                    '履歴全体は「データ」メニューからいつでもCSV出力できます。'
                  )
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => exportFeedbackCSV(lang)}>
              <Download className="size-3.5" /> {tx('Xuất CSV', 'Export CSV', 'CSV出力')}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              <MessageSquarePlus className="size-3.5" /> {tx('Gửi thêm', 'Send another', '追加送信')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">
              {tx('Mức độ hài lòng:', 'Satisfaction:', '満足度：')}
            </span>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={tx(`Đánh giá ${star} sao`, `Rate ${star} stars`, `${star}つ星で評価`)}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cx(
                      'size-5 transition-colors',
                      star <= activeStars ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="text-xs font-medium text-amber-300">{ratingWords[rating - 1]}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_TAGS.map((item) => {
              const label = tx(item.vi, item.en, item.ja);
              return (
                <Chip key={item.vi} active={tags.includes(label)} onClick={() => toggleTag(label)}>
                  {label}
                </Chip>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={tx(
                'Góp ý thêm về số liệu, giao diện hoặc tính năng bạn muốn có...',
                'Any extra feedback on numbers, UI, or requested features...',
                '数値やUI、追加してほしい機能などへのご意見...'
              )}
              maxLength={800}
              className="h-10 flex-1 rounded-xl bg-black/30 px-3 text-base text-white placeholder:text-zinc-600 ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60 sm:text-sm"
            />
            <Button type="submit" variant="primary" disabled={submitting}>
              <Send className="size-3.5" />{' '}
              {submitting
                ? tx('Đang lưu...', 'Saving...', '保存中...')
                : tx('Gửi & Sao lưu', 'Send & Save', '送信して保存')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={showPublicly}
                onChange={(e) => setShowPublicly(e.target.checked)}
                className="size-3.5 accent-indigo-500"
              />
              <span>
                {tx(
                  'Cho phép vinh danh tên tôi trên Bảng Cộng Đồng (chỉ hiển thị tên & nhận xét, ẩn toàn bộ số tiền)',
                  'Credit my name on Community Hall of Fame (hides all financial numbers)',
                  '貢献者ボードへの名前掲載を許可（金額などの個人データは完全非公開）'
                )}
              </span>
            </label>
            <div className="flex items-center gap-3 text-[11px]">
              <a href={href('contributors')} className="inline-flex items-center gap-1 text-indigo-300 hover:underline">
                <Award className="size-3" /> {tx('Bảng Vinh Danh', 'Hall of Fame', '表彰ページ')}
              </a>
              <a
                href={UNIKORN_PRODUCT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 hover:underline"
              >
                Unikorn <ExternalLink className="size-2.5" />
              </a>
            </div>
          </div>

          {showPublicly && (
            <input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              maxLength={60}
              placeholder={tx(
                'Tên / Biệt danh của bạn (VD: Minh Anh · Unikorn Explorer)',
                'Your display name or handle (e.g. Alex · Unikorn Explorer)',
                '表示名 / ニックネーム（例：Kenji · Unikorn Explorer）'
              )}
              className="h-9 w-full rounded-xl bg-black/30 px-3 text-base text-white placeholder:text-zinc-600 ring-1 ring-inset ring-indigo-400/30 outline-none focus:ring-indigo-400/70 sm:text-xs"
            />
          )}
        </form>
      )}
    </Card>
  );
}
