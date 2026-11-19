import React, { useState } from 'react';
import { CheckCircle2, Download, MessageSquarePlus, Send, Star } from 'lucide-react';
import { cryptoStorage, sanitizeText } from '../utils/cryptoStorage.js';
import { useToast } from '../state.jsx';
import { Badge, Button, Card, CardHeader, Chip, cx } from './ui.jsx';

const FEEDBACK_TAGS = [
  'Kết quả chính xác',
  'Dễ hiểu & trực quan',
  'Cần thêm ngân hàng',
  'Giao diện cần gọn hơn',
  'Muốn thêm tính năng',
];

export function exportFeedbackCSV() {
  const list = cryptoStorage.load('USER_FEEDBACK_LOG', []);
  if (!Array.isArray(list) || list.length === 0) return false;
  const escCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Thời gian', 'Công cụ', 'Đánh giá (Sao)', 'Nhãn góp ý', 'Nhận xét chi tiết', 'Thông số'];
  const rows = list.map((item) => [
    escCsv(item.createdAt),
    escCsv(item.toolLabel || item.tool),
    escCsv(item.rating),
    escCsv((item.tags || []).join(' | ')),
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
  const notify = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
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
      notify('Vui lòng chọn số sao đánh giá trước khi gửi');
      return;
    }
    setSubmitting(true);

    const entry = {
      id: `${Date.now()}`,
      tool: sanitizeText(toolId, 32),
      toolLabel: sanitizeText(toolLabel, 100),
      rating: Math.min(5, Math.max(1, Math.round(Number(rating) || 1))),
      tags: tags.map((t) => sanitizeText(t, 60)).filter(Boolean),
      comment: sanitizeText(comment, 800),
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
    notify('Cảm ơn bạn! Đánh giá đã được sao lưu.');
  };

  const resetForm = () => {
    setRating(0);
    setTags([]);
    setComment('');
    setSubmitted(false);
  };

  const activeStars = hoverRating || rating;

  return (
    <Card className="print-hidden p-5 sm:p-6">
      <CardHeader
        title="Đánh giá & góp ý kết quả này"
        description="Phản hồi của bạn được sao lưu ngay trên thiết bị (có thể xuất JSON/CSV) và gửi ẩn danh để cải thiện thuật toán."
        right={
          savedCount > 0 && (
            <Badge tone="neutral">Đã lưu {savedCount} đánh giá</Badge>
          )
        }
      />

      {submitted ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-emerald-500/[0.06] p-4 ring-1 ring-inset ring-emerald-400/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div>
              <div className="font-medium">Đã ghi nhận đánh giá {rating}/5 sao cho {toolLabel}!</div>
              <div className="mt-0.5 text-xs text-emerald-300/80">
                Bạn có thể xem hoặc sao lưu toàn bộ lịch sử đánh giá trong mục "Dữ liệu của bạn".
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => exportFeedbackCSV()}>
              <Download className="size-3.5" /> Xuất CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              <MessageSquarePlus className="size-3.5" /> Gửi thêm
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">Mức độ hài lòng:</span>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={`Đánh giá ${star} sao`}
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
              <span className="text-xs font-medium text-amber-300">
                {['Rất tệ', 'Chưa ổn', 'Bình thường', 'Hài lòng', 'Tuyệt vời'][rating - 1]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_TAGS.map((tag) => (
              <Chip key={tag} active={tags.includes(tag)} onClick={() => toggleTag(tag)}>
                {tag}
              </Chip>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Góp ý thêm về số liệu, giao diện hoặc tính năng bạn muốn có..."
              maxLength={800}
              className="h-10 flex-1 rounded-xl bg-black/30 px-3 text-base text-white placeholder:text-zinc-600 ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60 sm:text-sm"
            />
            <Button type="submit" variant="primary" disabled={submitting}>
              <Send className="size-3.5" /> {submitting ? 'Đang lưu...' : 'Gửi & Sao lưu'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
