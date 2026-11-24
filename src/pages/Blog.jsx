import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { BLOG_CATEGORIES, BLOG_POSTS, getBlogPostBySlug } from '../data/blogData.js';
import { AdaptiveGrid } from '../components/AdaptiveLayout.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import { Badge, Button, Callout, Card, CardHeader, Chip, MoneyField, PageHeader, SliderField, Stat, cx } from '../components/ui.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate, useRoute, useToast } from '../state.jsx';
import { useServerCalc } from '../utils/apiClient.js';
import { compact, pct, vnd } from '../utils/format.js';

const BOOKMARK_KEY = 'vnsaving_blog_bookmarks';

function loadBookmarks() {
  try {
    const raw = window.localStorage?.getItem(BOOKMARK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(slugs) {
  try {
    window.localStorage?.setItem(BOOKMARK_KEY, JSON.stringify(slugs.slice(0, 50)));
  } catch {
    // ignore storage errors
  }
}

function InlineBlogWidget({ category }) {
  const { lang, tx } = useI18n();
  const [gross, setGross] = useState(30_000_000);
  const [dependents, setDependents] = useState(1);
  const [savingAmt, setSavingAmt] = useState(10_000_000);
  const [targetMonthly, setTargetMonthly] = useState(15_000_000);
  const [inflPct, setInflPct] = useState(3.5);
  const [nomRatePct, setNomRatePct] = useState(8.6);

  const taxPayload = useMemo(
    () => ({
      mode: 'GROSS_TO_NET',
      amount: gross,
      dependents,
      regime: '2026_H2',
      region: 1,
      insuranceBaseMode: 'FULL',
    }),
    [gross, dependents]
  );
  const taxSim = useServerCalc(
    'salary_gross_net',
    taxPayload,
    {
      primary: { net: 26_122_500, employee: { pit: 727_500, totalInsurance: 3_150_000 } },
      comparisonVs2025: { pitSavingsMonthly: 992_500, pitSavingsAnnual: 11_910_000 },
    },
    { enabled: category === 'tax_bhxh' }
  );

  const savPayload = useMemo(
    () => ({
      targetMonthlyInterest: targetMonthly,
      monthlySavingsAmount: savingAmt,
      initialCapital: 100_000_000,
      annualInterestRate: 8.6,
    }),
    [targetMonthly, savingAmt]
  );
  const savSim = useServerCalc(
    'quick_estimate',
    savPayload,
    { timeText: '8 năm 4 tháng', requiredPrincipal: 2_093_000_000, compoundSharePct: 31 },
    { enabled: category === 'savings' || category === 'family_wealth' }
  );

  const inflPayload = useMemo(
    () => ({
      nominalRate: nomRatePct,
      inflationRate: inflPct,
      targetPassiveIncome: 15_000_000,
      years: 10,
    }),
    [nomRatePct, inflPct]
  );
  const inflSim = useServerCalc(
    'inflation',
    inflPayload,
    { impact: { realInterestRate: 4.93 }, futureNominalNeeded: 21_158_981 },
    { enabled: category === 'fx_macro' }
  );

  if (category === 'tax_bhxh') {
    const net = taxSim.data?.primary?.net || 0;
    const savedMo = taxSim.data?.comparisonVs2025?.pitSavingsMonthly || 0;
    const savedYr = taxSim.data?.comparisonVs2025?.pitSavingsAnnual || 0;
    return (
      <Card className="border-emerald-400/25 bg-emerald-500/[0.04] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <Sparkles className="size-3.5" />
            {tx('Tính thử Thuế TNCN 5 bậc 2026 ngay trong bài', 'Live 2026 5-Bracket PIT Sandbox', '記事内で2026年新税制をリアルタイム試算')}
          </span>
          <Badge tone="success">NQ 110 · 15,5tr / 6,2tr</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            label={tx('Lương Gross/tháng', 'Monthly Gross', '月額Gross給与')}
            value={gross}
            onChange={setGross}
            min={10_000_000}
            max={120_000_000}
            step={1_000_000}
          />
          <SliderField
            label={tx('Số người phụ thuộc', 'Dependents', '扶養人数')}
            display={`${dependents} ${tx('người', 'ppl', '人')}`}
            value={dependents}
            onChange={setDependents}
            min={0}
            max={6}
            step={1}
          />
        </div>
        <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 3, desktop: 3 }}>
          <Stat label={tx('Thực nhận Net 2026', '2026 Net Pay', '2026年手取り')} value={vnd(net, lang)} tone="indigo" />
          <Stat label={tx('Thuế giảm mỗi tháng', 'Monthly Tax Saved', '毎月減税額')} value={vnd(savedMo, lang)} tone="emerald" />
          <Stat label={tx('Tiết kiệm cả năm', 'Annual Tax Saved', '年間節税額')} value={compact(savedYr, lang)} tone="amber" />
        </AdaptiveGrid>
      </Card>
    );
  }

  if (category === 'fx_macro') {
    const realRate = inflSim.data?.impact?.realInterestRate ?? 0;
    const futureNeeded = inflSim.data?.futureNominalNeeded ?? 0;
    return (
      <Card className="border-indigo-400/25 bg-indigo-500/[0.04] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Sparkles className="size-3.5" />
            {tx('Kiểm tra Lãi thực Fisher ngay trong bài viết', 'Live Fisher Real Yield Sandbox', '記事内で実質利回り（フィッシャー）を試算')}
          </span>
          <Badge tone="brand">API Live</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            label={tx('Lãi suất danh nghĩa (%/năm)', 'Nominal Rate %', '名目金利 %')}
            display={pct(nomRatePct, 2, lang)}
            value={nomRatePct}
            onChange={setNomRatePct}
            min={3}
            max={12}
            step={0.1}
          />
          <SliderField
            label={tx('Lạm phát kỳ vọng (%/năm)', 'Expected Inflation %', '予想インフレ率 %')}
            display={pct(inflPct, 1, lang)}
            value={inflPct}
            onChange={setInflPct}
            min={1}
            max={10}
            step={0.2}
          />
        </div>
        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
          <Stat label={tx('Lãi thực dương sau lạm phát', 'Fisher Real Yield', '実質利回り')} value={pct(realRate, 2, lang)} tone="emerald" />
          <Stat label={tx('Mức chi tiêu 15tr sau 10 năm cần', '15M Spending in 10 Yrs', '10年後の1,500万VND相当額')} value={vnd(futureNeeded, lang)} tone="amber" />
        </AdaptiveGrid>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-400/25 bg-indigo-500/[0.04] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
          <Sparkles className="size-3.5" />
          {tx('Ước tính nhanh Lộ trình Tiết kiệm 8.6%/năm ngay trong bài', 'Live 8.6% Savings Quick Sandbox', '記事内で8.6%複利積立を試算')}
        </span>
        <Badge tone="brand">API Live</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField
          label={tx('Tiết kiệm đều hàng tháng', 'Monthly Deposit', '毎月の積立額')}
          value={savingAmt}
          onChange={setSavingAmt}
          min={2_000_000}
          max={50_000_000}
          step={1_000_000}
        />
        <MoneyField
          label={tx('Thu nhập thụ động mục tiêu/tháng', 'Target Passive / mo', '目標不労所得/月')}
          value={targetMonthly}
          onChange={setTargetMonthly}
          min={5_000_000}
          max={40_000_000}
          step={1_000_000}
        />
      </div>
      <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 3, desktop: 3 }}>
        <Stat label={tx('Thời gian đạt mục tiêu', 'Time Needed', '達成期間')} value={savSim.data?.timeText || '...'} tone="indigo" />
        <Stat label={tx('Vốn mục tiêu cần có', 'Required Capital', '必要元本')} value={compact(savSim.data?.requiredPrincipal || 0, lang)} tone="emerald" />
        <Stat label={tx('Tỷ trọng lãi kép đóng góp', 'Compound Share', '複利利息の割合')} value={`${savSim.data?.compoundSharePct ?? 0}%`} tone="amber" />
      </AdaptiveGrid>
    </Card>
  );
}

export default function Blog({ params: propParams }) {
  const { params: routeParams } = useRoute();
  const params = propParams || routeParams || {};
  const { lang, tx } = useI18n();
  const notify = useToast();

  const [category, setCategory] = useState(() => params?.category || 'all');
  const [query, setQuery] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [copiedSlug, setCopiedSlug] = useState('');

  const activePost = useMemo(() => (params?.post ? getBlogPostBySlug(params.post) : null), [params?.post]);

  const toggleBookmark = (slug) => {
    setBookmarks((prev) => {
      const exists = prev.includes(slug);
      const next = exists ? prev.filter((s) => s !== slug) : [slug, ...prev];
      saveBookmarks(next);
      notify(
        exists
          ? tx('Đã bỏ lưu bài viết', 'Removed from saved articles', '保存済みから削除しました')
          : tx('Đã lưu bài viết vào danh sách đọc', 'Saved article for later', 'あとで読むに追加しました')
      );
      return next;
    });
  };

  const handleSharePost = async (post) => {
    const url = `${window.location.origin}${href('blog', { post: post.slug })}`;
    try {
      await navigator.clipboard?.writeText(url);
      setCopiedSlug(post.slug);
      notify(tx('Đã sao chép liên kết bài viết!', 'Copied article link!', '記事URLをコピーしました！'));
      window.setTimeout(() => setCopiedSlug((p) => (p === post.slug ? '' : p)), 1800);
    } catch {
      notify(url);
    }
  };

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOG_POSTS.filter((p) => {
      if (onlySaved && !bookmarks.includes(p.slug)) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      const title = (p.title[lang] || p.title.vi).toLowerCase();
      const excerpt = (p.excerpt[lang] || p.excerpt.vi).toLowerCase();
      const badge = (p.badge[lang] || p.badge.vi).toLowerCase();
      return title.includes(q) || excerpt.includes(q) || badge.includes(q);
    });
  }, [category, query, onlySaved, bookmarks, lang]);

  const categoryLabel = (catId) => {
    const entry = BLOG_CATEGORIES.find((c) => c.id === catId);
    return entry ? entry.label[lang] || entry.label.vi : catId;
  };

  if (activePost) {
    const isSaved = bookmarks.includes(activePost.slug);
    const title = activePost.title[lang] || activePost.title.vi;
    const excerpt = activePost.excerpt[lang] || activePost.excerpt.vi;
    const takeaways = activePost.keyTakeaways?.[lang] || activePost.keyTakeaways?.vi || [];
    const sections = activePost.sections?.[lang] || activePost.sections?.vi || [];
    const related = BLOG_POSTS.filter(
      (p) => p.slug !== activePost.slug && (p.category === activePost.category || p.featured)
    ).slice(0, 3);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate(href('blog'))}>
            <ArrowLeft className="size-3.5" />
            {tx('Tất cả bài viết Blog', 'All Blog Articles', 'ブログ一覧に戻る')}
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => toggleBookmark(activePost.slug)}>
              <Bookmark className={cx('size-3.5', isSaved && 'fill-amber-300 text-amber-300')} />
              {isSaved ? tx('Đã lưu', 'Saved', '保存済') : tx('Lưu bài', 'Save', '保存')}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => handleSharePost(activePost)}>
              {copiedSlug === activePost.slug ? <Check className="size-3.5 text-emerald-300" /> : <Share2 className="size-3.5" />}
              {tx('Chia sẻ link', 'Copy Link', '共有')}
            </Button>
          </div>
        </div>

        <Card className="space-y-6 p-5 sm:p-8">
          <div className="space-y-3 border-b border-white/[0.06] pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{categoryLabel(activePost.category)}</Badge>
              <Badge tone="success">{activePost.badge[lang] || activePost.badge.vi}</Badge>
              {(activePost.isBotCreated || activePost.isDummyReference) && (
                <Badge tone="neutral">
                  🤖 {tx('Bot biên soạn · Kịch bản mẫu tham khảo', 'Bot-Created · Reference Scenario', 'Bot作成・参考シナリオ')}
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="size-3.5" /> {activePost.readMinutes} {tx('phút đọc', 'min read', '分で読める')}
              </span>
              <span className="text-xs text-zinc-500">· {activePost.publishedAt}</span>
            </div>

            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-300 sm:text-[15px]">{excerpt}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-400">
              <User className="size-3.5 text-indigo-300" />
              <span className="font-medium text-zinc-200">{activePost.author}</span>
              <span>· {activePost.authorRole}</span>
            </div>
          </div>

          {takeaways.length > 0 && (
            <div className="rounded-2xl border border-indigo-400/25 bg-indigo-500/[0.07] p-4 sm:p-5">
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200">
                <Sparkles className="size-3.5" />
                {tx('3 Điểm Cốt Lõi Cần Nhớ', '3 Key Takeaways', '3つの重要ポイント')}
              </div>
              <ul className="space-y-2 text-xs leading-relaxed text-zinc-200 sm:text-sm">
                {takeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {sections.map((sec, sIdx) => (
              <section key={sIdx} className="space-y-3">
                <h2 className="text-lg font-semibold text-white sm:text-xl">{sec.heading}</h2>
                {sec.paragraphs?.map((para, pIdx) => (
                  <p key={pIdx} className="text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                    {para}
                  </p>
                ))}
                {sec.bullets?.length > 0 && (
                  <ul className="space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <span className="text-indigo-400">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {sec.metricTable && (
                  <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-white/[0.08]">
                    <table className="w-full min-w-[520px] text-left text-xs sm:text-[13px]">
                      <thead className="bg-white/[0.04] text-zinc-300">
                        <tr>
                          {sec.metricTable.headers.map((h) => (
                            <th key={h} className="px-3.5 py-2.5 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05] text-zinc-300">
                        {sec.metricTable.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/[0.02]">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={cx('px-3.5 py-2.5', cIdx === 0 && 'font-medium text-white')}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {sec.callout && (
                  <Callout icon={ShieldCheck} tone={sec.callout.tone || 'brand'}>
                    {sec.callout.text}
                  </Callout>
                )}
              </section>
            ))}
          </div>

          <InlineBlogWidget category={activePost.category} />

          {activePost.cta && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.08] to-indigo-500/[0.08] p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  {tx('Áp dụng ngay vào số liệu của bạn', 'Apply Directly With Your Numbers', '自分の数字ですぐ試算する')}
                </div>
                <p className="mt-1 text-sm text-zinc-200">
                  {tx(
                    'Chuyển sang công cụ tương tác của VnSavingPro để tính toán theo kịch bản thực tế.',
                    'Jump straight into the interactive VnSavingPro calculator with your personal data.',
                    '記事の内容をインタラクティブな計算ツールで即座に検証できます。'
                  )}
                </p>
              </div>
              <Button as="a" href={href(activePost.cta.route, activePost.cta.params)} variant="primary" size="md">
                {activePost.cta.label[lang] || activePost.cta.label.vi}
              </Button>
            </div>
          )}
        </Card>

        {related.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">
              {tx('Bài viết liên quan', 'Related Articles', '関連記事')}
            </h3>
            <AdaptiveGrid cols={{ mobile: 1, tablet: 3, duo: 3, desktop: 3 }} hingeAligned>
              {related.map((post) => (
                <a
                  key={post.slug}
                  href={href('blog', { post: post.slug })}
                  className="card-interactive flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-surface p-4 hover:border-indigo-400/40 hover:bg-elevated"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="neutral">{post.badge[lang] || post.badge.vi}</Badge>
                      <span className="text-[11px] text-zinc-500">{post.readMinutes}m</span>
                    </div>
                    <h4 className="mt-3 line-clamp-2 text-sm font-semibold text-white">
                      {post.title[lang] || post.title.vi}
                    </h4>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-300">
                    {tx('Đọc bài', 'Read', '読む')} <ArrowRight className="size-3" />
                  </span>
                </a>
              ))}
            </AdaptiveGrid>
          </div>
        )}

        <FeedbackWidget
          tool="blog"
          toolLabel={tx('Blog Kiến Thức Tài Chính', 'Financial Blog', '資産形成ブログ')}
        />
      </div>
    );
  }

  const featuredLead = filteredPosts.find((p) => p.featured) || filteredPosts[0] || null;
  const gridPosts = featuredLead ? filteredPosts.filter((p) => p.slug !== featuredLead.slug) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        eyebrow={tx('Cẩm nang Tài sản · Pháp lý 2026 · Ngân hàng số', 'Wealth Journal · 2026 Laws · Digital Banking', '資産形成ブログ · 2026法制 · ネット銀行')}
        title={tx('Blog Kiến Thức & Chiến Lược Tài Chính VnSavingPro', 'VnSavingPro Financial Knowledge & Strategy Blog', 'VnSavingPro 資産運用・法制ナレッジブログ')}
        description={tx(
          'Phân tích thực tế về bảo mật ngân hàng số, săn ưu đãi mở tài khoản, chiến lược gửi bậc thang, Thuế TNCN 5 bậc – BHXH 2026 và quản trị tài sản Cặp đôi / Gia đình.',
          'Actionable guides on digital bank security, account-opening perks, savings ladders, 2026 5-bracket PIT & BHXH, FX hedging, and household wealth governance.',
          'ネット銀行の安全性・開設特典、ラダー預金、2026年新所得税＆社会保険、外貨FX、カップル・家族資産管理を体系的に解説します。'
        )}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button as="a" href={href('rates', { tab: 'security' })} variant="secondary" size="sm">
              <ShieldCheck className="size-3.5 text-emerald-300" />
              {tx('Bảo mật & Ưu đãi NH số', 'Bank Security & Perks', '銀行の安全性・特典')}
            </Button>
            <Badge tone="brand" className="px-3 py-1">
              {BLOG_POSTS.length} {tx('bài chuyên sâu', 'in-depth guides', '本のガイド')}
            </Badge>
          </div>
        }
      />

      {/* Category & Search Toolbar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {BLOG_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                active={!onlySaved && category === cat.id}
                onClick={() => {
                  setOnlySaved(false);
                  setCategory(cat.id);
                }}
              >
                {cat.label[lang] || cat.label.vi}
              </Chip>
            ))}
            <Chip
              active={onlySaved}
              onClick={() => setOnlySaved((v) => !v)}
            >
              <Bookmark className="mr-1 inline size-3" />
              {tx(`Đã lưu (${bookmarks.length})`, `Saved (${bookmarks.length})`, `保存済 (${bookmarks.length})`)}
            </Chip>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx('Tìm theo từ khóa (VD: QĐ 2345, TNCN, FX...)', 'Search topics (e.g. 2345, PIT, FX...)', 'キーワード検索（例: 2345, 税, FX...）')}
              className="h-9 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-indigo-400/60"
            />
          </div>
        </div>
      </Card>

      {/* Featured Lead Post */}
      {featuredLead && (
        <Card className="relative overflow-hidden border-indigo-400/30 bg-gradient-to-br from-indigo-500/[0.09] via-surface to-emerald-500/[0.04] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">
                <Sparkles className="size-3" /> {tx('Tiêu điểm', 'Featured', '注目記事')}
              </Badge>
              <Badge tone="brand">{categoryLabel(featuredLead.category)}</Badge>
              {(featuredLead.isBotCreated || featuredLead.isDummyReference) && (
                <Badge tone="neutral">
                  🤖 {tx('Bot biên soạn · Kịch bản mẫu tham khảo', 'Bot-Created · Dummy Reference', 'Bot作成・参考ガイド')}
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="size-3.5" /> {featuredLead.readMinutes} {tx('phút đọc', 'min read', '分')} · {featuredLead.publishedAt}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggleBookmark(featuredLead.slug)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08]"
            >
              <Bookmark className={cx('size-3.5', bookmarks.includes(featuredLead.slug) && 'fill-amber-300 text-amber-300')} />
              {bookmarks.includes(featuredLead.slug) ? tx('Đã lưu', 'Saved', '保存済') : tx('Lưu', 'Save', '保存')}
            </button>
          </div>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            <a href={href('blog', { post: featuredLead.slug })} className="hover:text-indigo-200">
              {featuredLead.title[lang] || featuredLead.title.vi}
            </a>
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
            {featuredLead.excerpt[lang] || featuredLead.excerpt.vi}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(featuredLead.keyTakeaways?.[lang] || featuredLead.keyTakeaways?.vi || []).slice(0, 3).map((k, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-canvas/60 p-3 text-xs leading-relaxed text-zinc-300">
                <CheckCircle2 className="mb-1 size-3.5 text-emerald-400" />
                {k}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button as="a" href={href('blog', { post: featuredLead.slug })} variant="primary" size="sm">
              {tx('Đọc bài phân tích đầy đủ', 'Read Full Article', '記事全文を読む')} <ArrowRight className="size-3.5" />
            </Button>
            {featuredLead.cta && (
              <Button
                as="a"
                href={href(featuredLead.cta.route, featuredLead.cta.params)}
                variant="secondary"
                size="sm"
              >
                {featuredLead.cta.label[lang] || featuredLead.cta.label.vi}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Article Cards Grid */}
      {filteredPosts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-zinc-400">
          {tx('Không tìm thấy bài viết phù hợp với bộ lọc hiện tại.', 'No matching articles for this filter.', '条件に一致する記事が見つかりませんでした。')}
        </Card>
      ) : (
        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 3 }} hingeAligned gap="gap-5">
          {gridPosts.map((post) => {
            const isSaved = bookmarks.includes(post.slug);
            return (
              <Card key={post.slug} className="flex flex-col justify-between p-5 transition-colors hover:border-white/[0.15]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{categoryLabel(post.category)}</Badge>
                      {(post.isBotCreated || post.isDummyReference) && (
                        <Badge tone="neutral">🤖 {tx('Bot mẫu', 'Bot Ref', 'Bot参考')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <Clock className="size-3" /> {post.readMinutes}m
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(post.slug)}
                        aria-label={tx('Lưu bài viết', 'Bookmark article', '記事を保存')}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Bookmark className={cx('size-3.5', isSaved && 'fill-amber-300 text-amber-300')} />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-semibold leading-snug text-white">
                    <a href={href('blog', { post: post.slug })} className="hover:text-indigo-200">
                      {post.title[lang] || post.title.vi}
                    </a>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                    {post.excerpt[lang] || post.excerpt.vi}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                  <span className="text-zinc-500">{post.publishedAt}</span>
                  <a
                    href={href('blog', { post: post.slug })}
                    className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    {tx('Đọc chi tiết', 'Read article', '記事を読む')} <ArrowRight className="size-3" />
                  </a>
                </div>
              </Card>
            );
          })}
        </AdaptiveGrid>
      )}

      <FeedbackWidget
        tool="blog"
        toolLabel={tx('Blog Kiến Thức Tài Chính', 'Financial Blog', '資産形成ブログ')}
      />
    </div>
  );
}
