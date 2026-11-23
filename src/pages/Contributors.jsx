import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coffee,
  ExternalLink,
  Heart,
  MessageSquarePlus,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Users,
} from 'lucide-react';
import {
  COMMUNITY_MILESTONES,
  UNIKORN_BADGE_IMG_URL,
  UNIKORN_EMBED_URL,
  UNIKORN_PRODUCT_URL,
  VERIFIED_CONTRIBUTORS,
} from '../data/contributorsData.js';
import { useI18n } from '../i18n/index.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../state.jsx';
import { cryptoStorage, safeExternalUrl, sanitizeText } from '../utils/cryptoStorage.js';
import { AdaptiveGrid, DualPaneSection } from '../components/AdaptiveLayout.jsx';
import { Badge, Button, Card, CardHeader, Chip, PageHeader, Stat, cx } from '../components/ui.jsx';

const CATEGORY_CHIPS = [
  { vi: 'Giao diện & Trải nghiệm', en: 'UI & UX Polish', ja: 'UI・使いやすさ' },
  { vi: 'Công thức & Lãi suất', en: 'Math & Rates', ja: '計算式・金利' },
  { vi: 'Đa thiết bị / Fold', en: 'Multi-Device / Fold', ja: 'マルチ端末・折りたたみ' },
  { vi: 'Đề xuất tính năng mới', en: 'Feature Idea', ja: '新機能のアイデア' },
  { vi: 'Góp ý từ Unikorn', en: 'From Unikorn.vn', ja: 'Unikorn経由の意見' },
];

export default function Contributors() {
  const { lang, tx } = useI18n();
  const { user, profile } = useAuth();
  const notify = useToast();

  const [publicEntries, setPublicEntries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [contributorName, setContributorName] = useState(
    () => profile?.full_name || user?.email?.split('@')[0] || ''
  );
  const [contributorUrl, setContributorUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feedback?public=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.entries)) {
          setPublicEntries(data.entries);
        }
      })
      .catch(() => {
        // Fallback smoothly to local opted-in entries below
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedCommunityVoices = useMemo(() => {
    const localSaved = cryptoStorage.load('USER_FEEDBACK_LOG', []);
    const localOptedIn = (Array.isArray(localSaved) ? localSaved : [])
      .filter((item) => item?.showPublicly)
      .map((item) => ({
        id: item.id,
        name: sanitizeText(item.contributorName, 60) || 'VnSavingPro Contributor',
        url: item.contributorUrl ? safeExternalUrl(item.contributorUrl) : '',
        tool: item.tool,
        toolLabel: item.toolLabel,
        rating: item.rating,
        tags: Array.isArray(item.tags) ? item.tags : [],
        comment: item.comment,
        createdAt: item.createdAt,
      }));

    const seen = new Set();
    const combined = [];
    for (const item of [...publicEntries, ...localOptedIn]) {
      const key = item.id || `${item.name}:${item.createdAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(item);
    }
    return combined;
  }, [publicEntries]);

  const toggleTag = (label) => {
    setSelectedTags((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  };

  const handleSubmitContribution = async (e) => {
    e.preventDefault();
    const cleanComment = sanitizeText(comment, 800);
    if (!cleanComment) {
      notify(tx('Hãy viết vài dòng góp ý hoặc cảm nhận của bạn nhé', 'Please write a short comment or suggestion first', 'ご意見や感想をご入力ください'));
      return;
    }

    setSubmitting(true);
    const cleanName = sanitizeText(contributorName, 60) || tx('Thành viên ẩn danh', 'Anonymous Contributor', '匿名サポーター');
    const cleanUrl = safeExternalUrl(contributorUrl);
    const cleanTags = selectedTags.map((t) => sanitizeText(t, 60)).filter(Boolean);

    const payload = {
      id: `${Date.now()}`,
      tool: 'contributors',
      toolLabel: tx('Bảng Vinh Danh Cộng Đồng', 'Contributors Hall of Fame', 'コミュニティ表彰ボード'),
      rating: Math.min(5, Math.max(1, Math.round(Number(rating) || 5))),
      tags: cleanTags,
      comment: cleanComment,
      contributorName: cleanName,
      contributorUrl: cleanUrl,
      showPublicly: true,
      createdAt: new Date().toISOString(),
    };

    const existing = cryptoStorage.load('USER_FEEDBACK_LOG', []);
    const nextLocal = [payload, ...(Array.isArray(existing) ? existing : [])].slice(0, 200);
    cryptoStorage.save('USER_FEEDBACK_LOG', nextLocal);

    let savedEntry = {
      id: payload.id,
      name: cleanName,
      url: cleanUrl,
      tool: payload.tool,
      toolLabel: payload.toolLabel,
      rating: payload.rating,
      tags: cleanTags,
      comment: cleanComment,
      createdAt: payload.createdAt,
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.entry?.id) {
          savedEntry = {
            ...savedEntry,
            id: data.entry.id,
            name: data.entry.contributorName || cleanName,
            url: data.entry.contributorUrl || cleanUrl,
          };
        }
      }
    } catch {
      // Already saved locally
    }

    setPublicEntries((prev) => [savedEntry, ...prev]);
    setComment('');
    setSelectedTags([]);
    setSubmitting(false);
    notify(tx('Cảm ơn bạn đã góp ý! Tên bạn đã được ghi danh.', 'Thank you for contributing! Your credit is now live.', 'ご貢献ありがとうございます！表彰ボードへ掲載されました。'));
  };

  const locale = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'vi-VN';

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Trophy}
        eyebrow={tx('Cộng đồng & Tri ân', 'Community & Appreciation', 'コミュニティ・感謝')}
        title={tx('Vinh danh cộng đồng đồng hành cùng VnSavingPro', 'VnSavingPro Community Hall of Fame', 'VnSavingPro コミュニティ貢献者表彰')}
        description={tx(
          'Mỗi tính năng trên VnSavingPro — từ tính ngày TT14 NHNN, mô hình Gia đình, đa ngôn ngữ tới chế độ màn hình gập — đều được hoàn thiện nhờ những góp ý thực tế của người dùng và cộng đồng Unikorn.',
          'Every capability in VnSavingPro — from SBV day-count precision, Couple/Family models, and 3-language support to Foldable layouts — was shaped by real user feedback and the Unikorn community.',
          'VnSavingProの進化は、利用者の皆様およびUnikornコミュニティからの実践的なフィードバックによって支えられています。'
        )}
        actions={
          <>
            <Button
              as="a"
              href={UNIKORN_PRODUCT_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="sm"
            >
              <Sparkles className="size-3.5" /> Unikorn.vn <ExternalLink className="size-3" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById('contribute-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageSquarePlus className="size-3.5" /> {tx('Góp ý & Ghi danh', 'Add Your Feedback', 'フィードバックを登録')}
            </Button>
          </>
        }
      />

      {/* Community Impact Summary */}
      <AdaptiveGrid cols={{ mobile: 2, tablet: 2, duo: 2, desktop: 4 }}>
        <Stat
          icon={Sparkles}
          label={tx('Phiên bản đã phát hành', 'Shipped Releases', 'リリース回数')}
          tone="indigo"
          value="v1.9.0.0"
          hint={tx('cải tiến liên tục mỗi ngày', 'continuous community-led releases', '継続的なコミュニティ主導改善')}
        />
        <Stat
          icon={CheckCircle2}
          label={tx('Cột mốc từ góp ý', 'Feedback Milestones', '改善マイルストーン')}
          tone="emerald"
          value={`${COMMUNITY_MILESTONES.length}+`}
          hint={tx('tính năng cộng đồng đề xuất', 'user-requested upgrades shipped', '要望から実装された大型機能')}
        />
        <Stat
          icon={Users}
          label={tx('Tiếng nói cộng đồng', 'Community Voices', '公開フィードバック')}
          value={`${VERIFIED_CONTRIBUTORS.length + mergedCommunityVoices.length}`}
          hint={tx('ghi danh công khai bảo mật', 'opt-in honored contributors', '公開同意済みの貢献者数')}
        />
        <Stat
          icon={Award}
          label={tx('Nền tảng đồng hành', 'Launch Platform', '公開プラットフォーム')}
          tone="amber"
          value="Unikorn.vn"
          hint={tx('Clap · Review · Support · Donate', 'Clap · Review · Support · Donate', 'Clap · Review · Support · Donate')}
        />
      </AdaptiveGrid>

      {/* Honored Contributors Wall */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Award className="size-5 text-amber-300" />
              {tx('Bảng vàng ghi nhận đóng góp', 'Honored Contributors & Supporters', '貢献者・サポーター表彰ボード')}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {tx(
                'Tri ân các nhóm cộng đồng tiên phong và những người dùng đã để lại góp ý mang tính xây dựng.',
                'Celebrating founding community groups and users who opted in to share constructive feedback.',
                '初期開発を支えたコミュニティおよび建設的なフィードバックを寄せてくださった皆様に感謝します。'
              )}
            </p>
          </div>
        </div>

        {/* Founding Community Cards */}
        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }} hingeAligned gap="gap-4">
          {VERIFIED_CONTRIBUTORS.map((c) => (
            <Card key={c.id} className="card-interactive flex flex-col justify-between p-5">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-white">{c.name[lang]}</h3>
                    <p className="mt-0.5 text-xs text-indigo-300">{c.role[lang]}</p>
                  </div>
                  <Badge tone={c.badgeTone}>{c.tag[lang]}</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{c.impact[lang]}</p>
              </div>
              {c.link && (
                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 hover:underline"
                  >
                    {tx('Xem hành trình trên Unikorn.vn', 'View product journey on Unikorn.vn', 'Unikorn.vn で歩みを見る')}{' '}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </Card>
          ))}
        </AdaptiveGrid>

        {/* Live Opt-In Feedback Wall */}
        {loadingList ? (
          <Card className="p-6 text-center text-xs text-zinc-400">
            {tx('Đang tải danh sách đóng góp từ cộng đồng...', 'Loading community contributions...', 'コミュニティの声を読み込み中...')}
          </Card>
        ) : mergedCommunityVoices.length > 0 ? (
          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 3 }} hingeAligned gap="gap-3">
            {mergedCommunityVoices.map((item) => {
              const safeUrl = item.url ? safeExternalUrl(item.url) : '';
              return (
                <Card key={item.id} className="flex flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{item.name}</div>
                        <div className="mt-0.5 text-[11px] text-zinc-500">
                          {new Date(item.createdAt).toLocaleDateString(locale)}
                          {item.toolLabel ? ` · ${item.toolLabel}` : ''}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 text-amber-400" aria-label={`${item.rating}/5`}>
                        {Array.from({ length: item.rating }).map((_, idx) => (
                          <Star key={idx} className="size-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    {item.comment && (
                      <p className="mt-3 text-xs leading-relaxed text-zinc-300">“{item.comment}”</p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(item.tags || []).slice(0, 3).map((t) => (
                        <Badge key={t} tone="neutral">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    {safeUrl && (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:underline"
                      >
                        Profile <ExternalLink className="size-2.5" />
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </AdaptiveGrid>
        ) : (
          <Card className="border-dashed p-5 text-center text-xs text-zinc-400">
            {tx(
              'Hãy là những người đầu tiên để lại lời góp ý công khai ngay bên dưới — hoặc gửi nhận xét của bạn trực tiếp trên Unikorn!',
              'Be among the first to leave a public community shout-out below — or post a review directly on Unikorn!',
              'ぜひ下のフォームから最初の公開フィードバックをお寄せください（Unikorn上でのレビューも大歓迎です）。'
            )}
          </Card>
        )}
      </section>

      {/* Transparent Feedback-to-Shipped Timeline */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CheckCircle2 className="size-5 text-emerald-400" />
            {tx('Từ góp ý người dùng đến phiên bản thực tế', 'How Your Feedback Shapes Each Release', 'フィードバックから実現したアップデート履歴')}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {tx(
              'Theo dõi những cải tiến đã được hiện thực hoá — bạn có thể xem tiến độ và đề xuất thêm tính năng trực tiếp trên Unikorn.',
              'Track how community ideas become live upgrades — follow progress and suggest new improvements anytime on Unikorn.',
              '皆様の提案がどのように製品へ反映されたかをご覧いただけます。'
            )}
          </p>
        </div>

        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }} hingeAligned gap="gap-4">
          {COMMUNITY_MILESTONES.map((m) => (
            <Card key={m.version} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone="brand">{m.version}</Badge>
                  <Badge tone="success">{m.status[lang]}</Badge>
                </div>
                <span className="text-[11px] text-zinc-500">{m.date}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{m.title[lang]}</h3>
              <p className="mt-1 text-xs font-medium text-indigo-300/90">{m.feedbackSource[lang]}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{m.detail[lang]}</p>
            </Card>
          ))}
        </AdaptiveGrid>
      </section>

      {/* Contribution Form + Unikorn Showcase Panel */}
      <div id="contribute-form">
        <DualPaneSection
          ratio="balanced"
          left={
            <Card className="p-5 sm:p-6">
              <CardHeader
                title={tx('Gửi góp ý & Ghi danh lên Bảng Vinh Danh', 'Submit Feedback & Join the Wall', '改善提案を送り表彰ボードに掲載')}
                description={tx(
                  'Chỉ hiển thị tên / biệt danh và góp ý công khai — hệ thống tuyệt đối không thu thập hay công khai số liệu tài chính.',
                  'Only your display name and feedback are shown publicly — zero financial numbers are ever shared.',
                  '表示名とコメントのみが公開され、資産額や収支データは一切共有されません。'
                )}
              />

              <form onSubmit={handleSubmitContribution} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {tx('Tên / Biệt danh của bạn *', 'Your Display Name *', '表示名 / ニックネーム *')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder={tx('VD: Hoàng Nam · Explorer', 'e.g. Alex · Unikorn Explorer', '例：Taro · Unikorn')}
                      className="h-10 w-full rounded-xl bg-black/30 px-3 text-base text-white placeholder:text-zinc-600 ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                      {tx('Link Unikorn / Social (tuỳ chọn)', 'Unikorn / Social URL (optional)', 'Unikorn / SNS URL（任意）')}
                    </label>
                    <input
                      type="url"
                      maxLength={200}
                      value={contributorUrl}
                      onChange={(e) => setContributorUrl(e.target.value)}
                      placeholder="https://unikorn.vn/..."
                      className="h-10 w-full rounded-xl bg-black/30 px-3 text-base text-white placeholder:text-zinc-600 ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-zinc-400">
                    {tx('Đánh giá trải nghiệm:', 'Rating:', '評価：')}
                  </span>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        aria-label={`${star} stars`}
                        className="rounded-lg p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cx(
                            'size-5 transition-colors',
                            star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_CHIPS.map((item) => {
                    const label = item[lang] || item.vi;
                    return (
                      <Chip key={item.vi} active={selectedTags.includes(label)} onClick={() => toggleTag(label)}>
                        {label}
                      </Chip>
                    );
                  })}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-300">
                    {tx('Nội dung góp ý hoặc tính năng bạn mong muốn *', 'Your Feedback or Feature Suggestion *', 'ご意見・リクエスト内容 *')}
                  </label>
                  <textarea
                    required
                    rows={3}
                    maxLength={800}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={tx(
                      'Chia sẻ điều bạn thích, điểm cần cải thiện hoặc tính năng tiết kiệm bạn muốn thấy ở bản v2.0...',
                      'Share what helped you most, UX ideas, or financial tools you want to see next...',
                      '便利だった点や改善してほしい機能などをお聞かせください...'
                    )}
                    className="w-full rounded-xl bg-black/30 p-3 text-base text-white placeholder:text-zinc-600 ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60 sm:text-sm"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                  <Send className="size-4" />
                  {submitting
                    ? tx('Đang ghi nhận...', 'Submitting...', '送信中...')
                    : tx('Gửi góp ý & Ghi danh ngay', 'Submit & Join Hall of Fame', '送信して表彰ボードへ掲載')}
                </Button>
              </form>
            </Card>
          }
          right={
            <Card className="relative flex flex-col justify-between overflow-hidden p-5 sm:p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="relative space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge tone="warning">
                    <Sparkles className="size-3" /> Featured on Unikorn.vn
                  </Badge>
                  <a
                    href={UNIKORN_EMBED_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-xl transition hover:opacity-95"
                  >
                    <img
                      src={UNIKORN_BADGE_IMG_URL}
                      alt="VnSavingPro trên Unikorn.vn"
                      style={{ width: '256px', height: '64px' }}
                      width={256}
                      height={64}
                      loading="lazy"
                      className="max-w-full rounded-xl shadow-md"
                    />
                  </a>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {tx(
                      'Theo dõi hành trình & Tiếp sức VnSavingPro trên Unikorn',
                      'Follow Progress & Support VnSavingPro on Unikorn',
                      'Unikorn.vn で開発の歩みをチェック＆応援する'
                    )}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-[13px]">
                    {tx(
                      'Mọi phản hồi bạn gửi tại Unikorn đều được ghi nhận công khai để kiểm chứng xem sản phẩm đã được cải thiện và nâng cấp như thế nào qua từng bản phát hành.',
                      'Visit our Unikorn page to see how every piece of community feedback translates into shipped updates, share new ideas, or support the project.',
                      'Unikornページでは、フィードバックがどのようにアップデートへ反映されているかをリアルタイムで確認でき、応援やレビューも可能です。'
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <MessageSquarePlus className="size-3.5 text-indigo-300" />
                      {tx('Input Feedback', 'Input Feedback', '意見・要望を投稿')}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {tx('Đề xuất tính năng & theo dõi cập nhật', 'Propose ideas & track improvements', '機能提案と改善進捗を確認')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <ThumbsUp className="size-3.5 text-amber-300" />
                      {tx('Clap & Upvote', 'Clap & Upvote', 'Clap で応援')}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {tx('Lan toả công cụ tới cộng đồng tài chính Việt', 'Help more savers discover the toolkit', '日本の個人投資家や在住者にも共有')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Star className="size-3.5 text-emerald-300" />
                      {tx('Viết Review', 'Write a Review', 'レビューを書く')}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {tx('Đánh giá trải nghiệm sử dụng thực tế', 'Share your real-world planning story', '実際の使い勝手をレビュー')}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Coffee className="size-3.5 text-rose-300" />
                      {tx('Support / Donate', 'Support / Donate', 'サポート / 寄付')}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {tx('Tiếp sức duy trì server & cập nhật lãi suất đầu tháng', 'Support hosting & monthly 1st bank rate sync', 'サーバー維持と毎月1日の金利同期を支援')}
                    </p>
                  </div>
                </div>

                <Button
                  as="a"
                  href={UNIKORN_PRODUCT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="w-full"
                >
                  <Heart className="size-4" />
                  {tx('Mở trang VnSavingPro trên Unikorn.vn', 'Open VnSavingPro on Unikorn.vn', 'Unikorn.vn の製品ページを開く')}
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </Card>
          }
        />
      </div>
    </div>
  );
}
