import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Copy,
  Crown,
  ExternalLink,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  Vote,
} from 'lucide-react';
import { AdaptiveGrid } from '../components/AdaptiveLayout.jsx';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
  Chip,
  PageHeader,
  Progress,
  Segmented,
  Stat,
  cx,
} from '../components/ui.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href, navigate, useToast } from '../state.jsx';
import { APP_VERSION } from '../tools.js';
import {
  applyExpertToApi,
  cloneTemplateFromApi,
  fetchEcosystemOverviewFromApi,
  manageStewardMandateApi,
  openAuthPrompt,
  publishTemplateToApi,
  syncStewardMandateSnapshot,
  voteTemplateToApi,
} from '../utils/apiClient.js';
import { cryptoStorage, isPlainObject } from '../utils/cryptoStorage.js';
import { compact } from '../utils/format.js';

export default function Ecosystem() {
  const { tx } = useI18n();
  const { user, getAccessToken } = useAuth();
  const notify = useToast();

  const [tab, setTab] = useState('templates');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    thresholds: { minVotes: 10, minScore: 4.2, minClones: 3 },
    templates: [],
    experts: [],
    myMandates: [],
    myStatus: null,
  });

  // Publish template form
  const [tplTitle, setTplTitle] = useState('');
  const [tplSummary, setTplSummary] = useState('');
  const [tplProof, setTplProof] = useState('');
  const [tplMode, setTplMode] = useState('INDIVIDUAL');
  const [publishing, setPublishing] = useState(false);
  const [cloningId, setCloningId] = useState('');

  // Expert application form
  const [expDegree, setExpDegree] = useState('');
  const [expCerts, setExpCerts] = useState('');
  const [expOrg, setExpOrg] = useState('');
  const [expLicense, setExpLicense] = useState('');
  const [expYears, setExpYears] = useState(3);
  const [expBio, setExpBio] = useState('');
  const [applyingExp, setApplyingExp] = useState(false);

  // Steward mandate forms
  const [mandateTitle, setMandateTitle] = useState('');
  const [mandateMode, setMandateMode] = useState('FAMILY');
  const [mandateScope, setMandateScope] = useState('budget_co_manage');
  const [creatingMandate, setCreatingMandate] = useState(false);
  const [acceptMandateCode, setAcceptMandateCode] = useState('');
  const [acceptingMandate, setAcceptingMandate] = useState(false);

  const loadEcosystem = useCallback(async () => {
    setLoading(true);
    try {
      const token = user ? getAccessToken() : null;
      const res = await fetchEcosystemOverviewFromApi(token, 'overview');
      setData({
        thresholds: res.thresholds || { minVotes: 10, minScore: 4.2, minClones: 3 },
        templates: res.templates || [],
        experts: res.experts || [],
        myMandates: res.myMandates || [],
        myStatus: res.myStatus || null,
      });
    } catch {
      // ignore transient failures
    } finally {
      setLoading(false);
    }
  }, [user, getAccessToken]);

  useEffect(() => {
    loadEcosystem();
  }, [loadEcosystem]);

  const handleCloneTemplate = async (tpl) => {
    setCloningId(tpl.id);
    try {
      const token = user ? getAccessToken() : null;
      const res = await cloneTemplateFromApi(tpl.id, token);
      const prev = cryptoStorage.load('PLANNER_STATE', {}) || {};
      cryptoStorage.save('PLANNER_STATE', {
        ...prev,
        ...(isPlainObject(res.planPayload) ? res.planPayload : {}),
      });
      setData((prevData) => ({
        ...prevData,
        templates: prevData.templates.map((t) =>
          t.id === tpl.id ? { ...t, cloneCount: (t.cloneCount || 0) + 1 } : t
        ),
      }));
      notify(
        tx(
          `Đã Clone mẫu "${tpl.title}"! Đang mở trang Lập kế hoạch với thông số thực tế.`,
          `Cloned "${tpl.title}" into your Roadmap Planner!`,
          `「${tpl.title}」を複製してプランナーを開きます！`
        )
      );
      navigate(href('plan', { hh: tpl.householdMode || 'INDIVIDUAL' }));
    } catch (err) {
      notify(err?.message || tx('Không thể clone mẫu kế hoạch', 'Could not clone template', '複製できませんでした'));
    } finally {
      setCloningId('');
    }
  };

  const handleVoteTemplate = async (tpl, rating = 5) => {
    if (!user) {
      openAuthPrompt('login');
      return;
    }
    try {
      const token = getAccessToken();
      const res = await voteTemplateToApi({ templateId: tpl.id, realismRating: rating }, token);
      setData((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === tpl.id ? res.template : t)),
      }));
      notify(tx(`Đã bình chọn ${rating}★ tính thực tế cho "${tpl.title}"`, `Voted ${rating}★ realism!`, `${rating}★を投票しました！`));
    } catch (err) {
      notify(err?.message || tx('Không thể bình chọn lúc này', 'Vote failed', '投票エラー'));
    }
  };

  const handlePublishTemplate = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthPrompt('login');
      return;
    }
    setPublishing(true);
    try {
      const token = getAccessToken();
      const plannerState = cryptoStorage.load('PLANNER_STATE', {});
      const res = await publishTemplateToApi(
        {
          title: tplTitle,
          summary: tplSummary,
          proofNotes: tplProof,
          householdMode: tplMode,
          tags: [tplMode === 'COUPLE' ? 'Cặp đôi' : tplMode === 'FAMILY' ? 'Gia đình' : 'Cá nhân', 'Thực tế'],
          planPayload: { ...plannerState, householdMode: tplMode },
        },
        token
      );
      setTplTitle('');
      setTplSummary('');
      setTplProof('');
      setData((prev) => ({ ...prev, templates: [res.template, ...prev.templates] }));
      notify(tx('Đã đăng mẫu kế hoạch để cộng đồng bình chọn & Clone!', 'Template published for community voting!', 'プランテンプレートを公開しました！'));
    } catch (err) {
      notify(err?.message || tx('Không thể đăng mẫu kế hoạch', 'Publish failed', '公開に失敗しました'));
    } finally {
      setPublishing(false);
    }
  };

  const handleApplyExpert = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthPrompt('login');
      return;
    }
    setApplyingExp(true);
    try {
      const token = getAccessToken();
      const certs = expCerts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await applyExpertToApi(
        {
          degree: expDegree,
          certificates: certs,
          organization: expOrg,
          licenseId: expLicense,
          yearsExperience: expYears,
          bio: expBio,
        },
        token
      );
      setData((prev) => ({
        ...prev,
        myStatus: {
          ...(prev.myStatus || {}),
          expertVerificationStatus: res.expertVerificationStatus,
          expertCredentials: res.expertCredentials,
        },
      }));
      notify(tx('Đã gửi hồ sơ bằng cấp & chứng chỉ Chuyên gia để xác thực!', 'Expert credentials submitted for verification!', '専門家認証申請を送信しました！'));
    } catch (err) {
      notify(err?.message || tx('Không thể gửi hồ sơ chuyên gia', 'Submission failed', '送信に失敗しました'));
    } finally {
      setApplyingExp(false);
    }
  };

  const handleCreateMandate = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthPrompt('login');
      return;
    }
    setCreatingMandate(true);
    try {
      const token = getAccessToken();
      const plannerState = cryptoStorage.load('PLANNER_STATE', {});
      const res = await manageStewardMandateApi(
        {
          action: 'create_steward_mandate',
          title: mandateTitle,
          householdMode: mandateMode,
          scope: mandateScope,
          snapshotPayload: plannerState,
        },
        token
      );
      setMandateTitle('');
      setData((prev) => ({ ...prev, myMandates: [res.mandate, ...prev.myMandates] }));
      notify(tx(`Đã tạo mã ủy quyền Quản trị tài chính: ${res.mandate.mandateCode}`, `Mandate ${res.mandate.mandateCode} created`, `委任コード ${res.mandate.mandateCode} を発行`));
    } catch (err) {
      notify(err?.message || tx('Không thể tạo mã ủy quyền', 'Create mandate failed', '作成エラー'));
    } finally {
      setCreatingMandate(false);
    }
  };

  const handleAcceptMandate = async () => {
    if (!user) {
      openAuthPrompt('login');
      return;
    }
    setAcceptingMandate(true);
    try {
      const token = getAccessToken();
      const res = await manageStewardMandateApi(
        { action: 'accept_steward_mandate', mandateCode: acceptMandateCode },
        token
      );
      setAcceptMandateCode('');
      setData((prev) => ({ ...prev, myMandates: [res.mandate, ...prev.myMandates.filter((m) => m.id !== res.mandate.id)] }));
      notify(tx(`Đã nhận ủy quyền quản trị tài sản cho "${res.mandate.title}"`, `Accepted steward mandate for "${res.mandate.title}"`, `「${res.mandate.title}」の管理委任を受諾しました`));
    } catch (err) {
      notify(err?.message || tx('Mã ủy quyền không hợp lệ', 'Invalid mandate code', '無効な委任コード'));
    } finally {
      setAcceptingMandate(false);
    }
  };

  const handleRevokeMandate = async (id) => {
    const token = getAccessToken();
    if (!token) return;
    await manageStewardMandateApi({ action: 'revoke_steward_mandate', id }, token);
    setData((prev) => ({ ...prev, myMandates: prev.myMandates.filter((m) => m.id !== id) }));
    notify(tx('Đã thu hồi ủy quyền quản trị', 'Mandate revoked', '委任を取り消しました'));
  };

  const handleSyncMandateSnapshot = async (mandate) => {
    const token = getAccessToken();
    if (!token) {
      openAuthPrompt('login');
      return;
    }
    try {
      const plannerState = cryptoStorage.load('PLANNER_STATE', {});
      const res = await syncStewardMandateSnapshot(
        { mandateId: mandate.id, snapshotPayload: plannerState },
        token
      );
      setData((prev) => ({
        ...prev,
        myMandates: prev.myMandates.map((m) => (m.id === mandate.id ? res.mandate : m)),
      }));
      notify(
        tx(
          `Đã đồng bộ kế hoạch hiện tại lên hồ sơ "${mandate.title}"`,
          `Synced current plan to "${mandate.title}"`,
          `「${mandate.title}」へ最新プランを同期しました`
        )
      );
    } catch (err) {
      notify(err?.message || tx('Không thể đồng bộ hồ sơ ủy quyền', 'Sync failed', '同期エラー'));
    }
  };

  const filteredTemplates = (data.templates || []).filter((t) => {
    if (modeFilter === 'EXPERT') return t.authorIsExpert;
    if (modeFilter === 'ALL') return true;
    return t.householdMode === modeFilter;
  });

  const myStatus = data.myStatus;
  const th = data.thresholds || { minVotes: 10, minScore: 4.2, minClones: 3 };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        eyebrow={tx(`Hệ Sinh Thái VnSavingPro ${APP_VERSION}`, `VnSavingPro ${APP_VERSION} Ecosystem`, `VnSavingPro ${APP_VERSION} エコシステム`)}
        title={tx('4 Vai trò Tài sản · Cộng đồng Bình chọn · Chuyên gia · Quản trị viên', '4 Wealth Roles · Voted Templates · Verified Experts · Financial Stewards', '4役割・人気プラン複製・認定専門家・資産管理委任')}
        description={tx(
          'Khám phá và Clone 1 chạm các mẫu kế hoạch thực tế được cộng đồng bình chọn (từ Cá nhân xuất sắc & Chuyên gia), kết nối Chuyên gia tài chính có bằng cấp xác thực, hoặc ủy quyền cho Người quản trị tài chính hộ gia đình.',
          'Browse and 1-click Clone community-voted real plans (by standout Individuals & Verified Experts), inspect certified Experts, or delegate portfolio governance to a Financial Steward.',
          'コミュニティ選出の実証プランの1クリック複製、認定ファイナンシャル専門家との連携、世帯資産のスチュワード管理委任を統合。'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={loadEcosystem}>
              <RefreshCw className={cx('size-3.5', loading && 'animate-spin')} /> {tx('Làm mới', 'Refresh', '更新')}
            </Button>
          </div>
        }
      />

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'templates', label: tx('Mẫu cộng đồng bình chọn (Clone)', 'Voted Plans (Clone)', '人気プラン複製') },
          { value: 'experts', label: tx('Chuyên gia xác thực', 'Verified Experts', '認定専門家') },
          { value: 'stewards', label: tx('Người Quản trị Tài chính', 'Financial Stewards', '資産管理スチュワード') },
          { value: 'roles', label: tx('4 Vai trò & Nâng cấp', '4 Roles Guide', '4つの役割と昇格条件') },
        ]}
      />

      {/* TAB 1: Community Templates + Clone + Vote */}
      {tab === 'templates' && (
        <div className="space-y-6">
          <Callout icon={Sparkles} tone="neutral">
            {tx(
              'Lưu ý minh bạch: Các mẫu gắn nhãn 🤖 "Bot tạo · Dữ liệu mẫu tham khảo" là kịch bản mẫu do hệ thống khởi tạo sẵn để bạn thử nghiệm tính năng Clone 1 chạm; các mẫu do thành viên đăng tải sau này sẽ không gắn nhãn này.',
              'Transparency note: Items badged 🤖 "Bot-Created · Dummy Reference" are pre-seeded demo templates so you can test 1-click cloning safely; real user-submitted templates will not carry this badge.',
              '透明性について：🤖「Bot作成・参考ダミーデータ」バッジ付きのプランはワンクリック複製を試すための初期サンプルであり、実ユーザー投稿とは明確に区別されています。'
            )}
          </Callout>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: tx('Tất cả mẫu', 'All Plans', 'すべて') },
                { id: 'INDIVIDUAL', label: tx('Cá nhân', 'Individual', '個人') },
                { id: 'COUPLE', label: tx('Cặp đôi', 'Couple', 'カップル') },
                { id: 'FAMILY', label: tx('Gia đình', 'Family', '家族') },
                { id: 'EXPERT', label: tx('Chuyên gia · Cộng đồng bình chọn', 'Experts · Community Voted', '専門家×選出') },
              ].map((f) => (
                <Chip key={f.id} active={modeFilter === f.id} onClick={() => setModeFilter(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <Badge tone="brand">
              {tx(
                `Chuẩn Cộng đồng Bình chọn: >=${th.minVotes} phiếu · >=${th.minScore}★ · >=${th.minClones} lượt Clone`,
                `Badge Rule: >=${th.minVotes} votes · >=${th.minScore}★ · >=${th.minClones} clones`,
                `認定基準：${th.minVotes}票以上・${th.minScore}★以上・複製${th.minClones}件以上`
              )}
            </Badge>
          </div>

          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
            {filteredTemplates.map((tpl) => (
              <Card key={tpl.id} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="brand">
                      {tpl.householdMode === 'COUPLE'
                        ? tx('Cặp đôi', 'Couple', 'カップル')
                        : tpl.householdMode === 'FAMILY'
                          ? tx('Gia đình', 'Family', '家族')
                          : tx('Cá nhân', 'Individual', '個人')}
                    </Badge>
                    {tpl.authorIsExpert && (
                      <Badge tone="success">
                        <UserCheck className="size-3" /> {tx('Chuyên gia xác thực', 'Verified Expert', '認定専門家')}
                      </Badge>
                    )}
                    {tpl.authorIsCommunityVoted && (
                      <Badge tone="warning">
                        <Crown className="size-3" /> {tx('Cộng đồng bình chọn', 'Community Voted', 'コミュニティ選出')}
                      </Badge>
                    )}
                    {(tpl.isDummyData || tpl.isBotCreated) && (
                      <Badge tone="neutral">
                        🤖 {tx('Bot tạo · Dữ liệu mẫu tham khảo', 'Bot-Created · Dummy Reference', 'Bot作成・参考ダミーデータ')}
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-white">{tpl.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{tpl.summary}</p>

                  {tpl.proofNotes && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05] px-3 py-2 text-xs text-emerald-200/90">
                      <span className="font-semibold text-emerald-300">{tx('Minh chứng thực tế:', 'Verified Proof:', '実績証明：')}</span>{' '}
                      {tpl.proofNotes}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(tpl.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                    <span>
                      {tx('Tác giả:', 'Author:', '作成者：')} <strong className="text-white">{tpl.authorName}</strong>
                    </span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="flex items-center gap-1 text-amber-300">
                        <Star className="size-3.5 fill-current" /> {Number(tpl.realismScore || 0).toFixed(2)} ({tpl.votesCount})
                      </span>
                      <span className="text-indigo-300">{tpl.cloneCount} Clone</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      disabled={cloningId === tpl.id}
                      onClick={() => handleCloneTemplate(tpl)}
                    >
                      <Copy className="size-3.5" />
                      {tx('Clone mẫu này vào Kế hoạch', 'Clone Into My Planner', 'この型をプランへ複製')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleVoteTemplate(tpl, 5)}
                      title={tx('Đánh giá 5 sao tính thực tế', 'Vote 5★ realistic', '5★評価する')}
                    >
                      <Vote className="size-3.5 text-amber-300" /> {tx('Bình chọn thực tế', 'Vote Realistic', '実効性を投票')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </AdaptiveGrid>

          {/* Publish own realistic template */}
          <Card className="p-5">
            <CardHeader
              title={tx('Chia sẻ kế hoạch thực tế của bạn để cộng đồng bình chọn', 'Publish Your Plan for Community Voting', '実証プランを公開してコミュニティ投票を受ける')}
              description={tx(
                `Khi kế hoạch có minh chứng thực tế đạt >= ${th.minVotes} phiếu, điểm >= ${th.minScore}★ và >= ${th.minClones} lượt Clone, tài khoản sẽ tự động nâng cấp danh hiệu Người lập kế hoạch được cộng đồng bình chọn.`,
                `Publish your real roadmap with proof notes. Reaching ${th.minVotes}+ votes, >= ${th.minScore}★ realism, and ${th.minClones}+ clones unlocks Community-Voted Planner status.`,
                `実績証明つきで自分のプランを公開し、基準（${th.minVotes}票・${th.minScore}★・${th.minClones}複製）を満たすと「コミュニティ選出プランナー」へ昇格できます。`
              )}
              right={<Award className="size-4 text-amber-300" />}
            />

            {myStatus && (
              <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.05] p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-white">
                    {tx('Tiến độ danh hiệu Cộng đồng bình chọn của bạn:', 'Your Community Planner Progress:', '認定進捗状況：')}
                  </span>
                  <Badge tone={myStatus.isCommunityVotedPlanner ? 'success' : 'brand'}>
                    {myStatus.isCommunityVotedPlanner
                      ? tx('Đã đạt danh hiệu Cộng đồng bình chọn!', 'Community-Voted Unlocked!', '認定済み！')
                      : `${myStatus.communityTotalVotes}/${th.minVotes} Votes · ${myStatus.communityTotalClones}/${th.minClones} Clones`}
                  </Badge>
                </div>
                <Progress
                  value={Math.min(100, Math.round((myStatus.communityTotalVotes / Math.max(1, th.minVotes)) * 100))}
                  tone="emerald"
                  className="mt-2"
                />
              </div>
            )}

            <form onSubmit={handlePublishTemplate} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  maxLength={140}
                  required
                  placeholder={tx('Tiêu đề (VD: Cặp đôi 26 tuổi tích luỹ 800tr sau 4 năm)', 'Template Title', 'テンプレート名')}
                  className="h-10 rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
                />
                <Segmented
                  size="sm"
                  value={tplMode}
                  onChange={setTplMode}
                  options={[
                    { value: 'INDIVIDUAL', label: tx('Cá nhân', 'Individual', '個人') },
                    { value: 'COUPLE', label: tx('Cặp đôi', 'Couple', 'カップル') },
                    { value: 'FAMILY', label: tx('Gia đình', 'Family', '家族') },
                  ]}
                />
              </div>
              <input
                type="text"
                value={tplSummary}
                onChange={(e) => setTplSummary(e.target.value)}
                maxLength={320}
                placeholder={tx('Tóm tắt tỷ lệ thu nhập, quỹ dự phòng và chiến lược gửi góp...', 'Short summary of savings rule & emergency fund...', '収入・貯蓄配分の概要...')}
                className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
              />
              <textarea
                rows={2}
                value={tplProof}
                onChange={(e) => setTplProof(e.target.value)}
                maxLength={400}
                required
                placeholder={tx('Minh chứng tính thực tế (VD: Đã gửi đều đặn 14 tháng tại Cake & Timo, tổng số dư đạt 280 triệu)...', 'Real-world proof notes (tenure completed, realized milestones)...', '実績の根拠（例：Cake・Timoで14ヶ月継続達成）...')}
                className="w-full rounded-xl border border-white/10 bg-canvas/80 p-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-400/60 focus:outline-none"
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={publishing}>
                  <Plus className="size-3.5" />
                  {publishing
                    ? tx('Đang đăng tải...', 'Publishing...', '公開中...')
                    : tx('Đăng mẫu từ thông số Kế hoạch hiện tại', 'Publish Active Plan Template', '現在のプランからテンプレート公開')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 2: Verified Experts (+ Dual Community-Voted Badge) */}
      {tab === 'experts' && (
        <div className="space-y-6">
          <Callout icon={ShieldCheck} tone="neutral">
            {tx(
              'Lưu ý minh bạch: Các hồ sơ gắn nhãn 🤖 "Bot tạo · Dữ liệu mẫu tham khảo" là hồ sơ chuyên gia giả lập minh họa giao diện (không phải cố vấn tài chính thực tế). Chuyên gia thật sau khi được kiểm duyệt bằng cấp sẽ hiển thị không kèm nhãn Bot.',
              'Transparency note: Cards marked 🤖 "Bot-Created · Dummy Reference" are synthetic demo expert profiles for reference only (not real financial advisors). Approved real practitioners appear without this badge.',
              '透明性について：🤖「Bot作成・参考ダミーデータ」バッジ付きのプロフィールは画面表示用のサンプルであり、実在のアドバイザーではありません。'
            )}
          </Callout>

          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 3 }}>
            {(data.experts || []).map((exp) => (
              <Card key={exp.id} className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="success">
                      <ShieldCheck className="size-3" /> {tx('Chuyên gia xác thực', 'Verified Expert', '認定専門家')}
                    </Badge>
                    {exp.isCommunityVotedPlanner && (
                      <Badge tone="warning">
                        <Crown className="size-3" /> {tx('Cộng đồng bình chọn', 'Community Voted', 'コミュニティ選出')}
                      </Badge>
                    )}
                    {(exp.isDummyData || exp.isBotCreated || String(exp.id).startsWith('exp_')) && (
                      <Badge tone="neutral">
                        🤖 {tx('Bot tạo · Dữ liệu mẫu tham khảo', 'Bot-Created · Dummy Reference', 'Bot作成・参考ダミーデータ')}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">{exp.fullName}</h3>
                  <p className="text-xs text-indigo-300">{exp.organization} · {exp.yearsExperience} {tx('năm KN', 'yrs exp', '年経験')}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{exp.bio}</p>

                  <div className="mt-3 space-y-1.5 rounded-xl bg-white/[0.02] p-3 text-xs ring-1 ring-inset ring-white/[0.05]">
                    {exp.credentials?.degree && (
                      <div className="text-zinc-300">
                        <span className="text-zinc-500">{tx('Bằng cấp:', 'Degree:', '学位：')}</span> {exp.credentials.degree}
                      </div>
                    )}
                    {Array.isArray(exp.credentials?.certificates) && exp.credentials.certificates.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {exp.credentials.certificates.map((c) => (
                          <span key={c} className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-medium text-indigo-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-white/[0.06] pt-3">
                  {exp.isCommunityVotedPlanner ? (
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-current" /> {exp.communityPlannerScore}★ ({exp.communityTotalVotes} votes)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setModeFilter('EXPERT');
                          setTab('templates');
                        }}
                        className="font-medium text-indigo-300 hover:underline"
                      >
                        {tx('Xem mẫu để Clone →', 'View Templates →', 'プランを見る →')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      {tx('Chuyên gia tư vấn chuyên sâu Cá nhân, Cặp đôi & Gia đình', 'Specialist advisor for Individuals, Couples & Families', '個人・カップル・家族向け専門アドバイザー')}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </AdaptiveGrid>

          <Card className="p-5">
            <CardHeader
              title={tx('Đăng ký xác thực tài khoản Chuyên gia Tài chính', 'Apply for Verified Financial Expert Status', 'ファイナンシャル専門家認証の申請')}
              description={tx(
                'Dành cho cố vấn có bằng cấp chuyên ngành, chứng chỉ (CFP, CFA, CWP, chứng chỉ hành nghề) và kinh nghiệm thực tế. Sau khi xác thực, bạn cũng có thể nhận huy hiệu Người lập kế hoạch được cộng đồng bình chọn.',
                'For advisors with verified academic degrees, financial credentials (CFP, CFA, CWP), and proven experience.',
                '学位・資格（CFP・CFA・CWP等）・実務経験をお持ちの専門家向け認証フォームです。'
              )}
              right={
                <Badge tone={myStatus?.expertVerificationStatus === 'verified' ? 'success' : myStatus?.expertVerificationStatus === 'pending' ? 'warning' : 'neutral'}>
                  {myStatus?.expertVerificationStatus === 'verified'
                    ? tx('Đã xác thực', 'Verified', '認証済み')
                    : myStatus?.expertVerificationStatus === 'pending'
                      ? tx('Đang chờ thẩm định', 'Pending Review', '審査中')
                      : tx('Chưa đăng ký', 'Not Applied', '未申請')}
                </Badge>
              }
            />
            <form onSubmit={handleApplyExpert} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={expDegree}
                onChange={(e) => setExpDegree(e.target.value)}
                required
                placeholder={tx('Bằng cấp (VD: Thạc sĩ Tài chính – ĐH Kinh tế)', 'Academic Degree', '最終学歴・学位')}
                className="h-10 rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <input
                type="text"
                value={expCerts}
                onChange={(e) => setExpCerts(e.target.value)}
                placeholder={tx('Chứng chỉ (cách nhau dấu phẩy: CFP, CFA, CWP)', 'Certifications (CFP, CFA, CWP)', '資格（CFP, CFAなど）')}
                className="h-10 rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <input
                type="text"
                value={expOrg}
                onChange={(e) => setExpOrg(e.target.value)}
                placeholder={tx('Đơn vị công tác / Độc lập', 'Organization or Independent', '所属機関')}
                className="h-10 rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={expLicense}
                  onChange={(e) => setExpLicense(e.target.value)}
                  placeholder={tx('Mã chứng chỉ / Hồ sơ kiểm chứng', 'License / Credential ID', '登録番号')}
                  className="h-10 flex-1 rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={expYears}
                  onChange={(e) => setExpYears(Number(e.target.value))}
                  className="h-10 w-20 rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-center text-sm text-white"
                  title={tx('Số năm kinh nghiệm', 'Years of experience', '経験年数')}
                />
              </div>
              <textarea
                rows={2}
                value={expBio}
                onChange={(e) => setExpBio(e.target.value)}
                placeholder={tx('Giới thiệu kinh nghiệm hoạch định tài sản & chuyên môn tư vấn...', 'Advisory bio & experience...', '経歴・専門分野...')}
                className="rounded-xl border border-white/10 bg-canvas/80 p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none sm:col-span-2"
              />
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" variant="primary" size="sm" disabled={applyingExp}>
                  <UserCheck className="size-3.5" />
                  {applyingExp ? tx('Đang gửi...', 'Submitting...', '送信中...') : tx('Gửi hồ sơ xác thực Chuyên gia', 'Submit Expert Credentials', '専門家認証を申請')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 3: Financial Steward / Manager */}
      {tab === 'stewards' && (
        <div className="space-y-6">
          <Callout icon={ShieldCheck} tone="brand">
            {tx(
              'Vai trò Người Quản trị Tài chính (Financial Steward) cho phép Cá nhân, Cặp đôi hoặc Gia đình cấp quyền theo dõi & phối hợp vận hành danh mục tài sản an toàn bằng mã ủy quyền có thời hạn và có thể thu hồi bất kỳ lúc nào.',
              'Financial Stewards help Individuals, Couples, or Families oversee and co-manage portfolios via revocable scoped mandates.',
              '資産管理スチュワードは、期限付き・随時取消可能な委任コードを通じて個人・カップル・家族の資産設計を支援できます。'
            )}
          </Callout>

          <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
            <Card className="p-5">
              <CardHeader
                title={tx('Dành cho Chủ tài sản: Tạo mã ủy quyền Quản trị', 'For Asset Owners: Create Steward Mandate', '資産オーナー用：委任コード発行')}
                description={tx(
                  'Cấp quyền cho người quản trị tài chính quản lý kế hoạch Cá nhân, Cặp đôi hoặc Gia đình của bạn.',
                  'Delegate Individual, Couple, or Family wealth oversight safely.',
                  '管理権限範囲を指定して委任コードを発行します。'
                )}
              />
              <form onSubmit={handleCreateMandate} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={mandateTitle}
                  onChange={(e) => setMandateTitle(e.target.value)}
                  maxLength={120}
                  placeholder={tx('Tên không gian ủy quyền (VD: Quản trị quỹ Gia đình)', 'Mandate label', '委任名')}
                  className="h-10 w-full rounded-xl border border-white/10 bg-canvas/80 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mandateMode}
                    onChange={(e) => setMandateMode(e.target.value)}
                    className="select h-9 rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                  >
                    <option value="INDIVIDUAL">{tx('Cá nhân', 'Individual', '個人')}</option>
                    <option value="COUPLE">{tx('Cặp đôi', 'Couple', 'カップル')}</option>
                    <option value="FAMILY">{tx('Gia đình', 'Family', '家族')}</option>
                  </select>
                  <select
                    value={mandateScope}
                    onChange={(e) => setMandateScope(e.target.value)}
                    className="select h-9 rounded-xl border border-white/10 bg-canvas/80 px-2.5 text-xs text-white"
                  >
                    <option value="read_only">{tx('Chỉ xem & đánh giá', 'Read-only review', '閲覧のみ')}</option>
                    <option value="budget_co_manage">{tx('Quản trị ngân sách & kế hoạch', 'Co-manage plan', '共同プラン管理')}</option>
                    <option value="full_steward">{tx('Quản trị toàn diện tài sản', 'Full steward', '総合管理')}</option>
                  </select>
                </div>
                <Button type="submit" variant="primary" size="sm" className="w-full" disabled={creatingMandate}>
                  <KeyRound className="size-3.5" />
                  {creatingMandate ? tx('Đang tạo...', 'Creating...', '発行中...') : tx('Tạo mã ủy quyền Quản trị', 'Generate Mandate Code', '委任コードを発行')}
                </Button>
              </form>
            </Card>

            <Card className="p-5">
              <CardHeader
                title={tx('Dành cho Người Quản trị: Nhận ủy quyền qua mã', 'For Financial Stewards: Accept Mandate Code', 'スチュワード用：委任コードで参加')}
                description={tx(
                  'Nhập mã ủy quyền nhận từ Cá nhân, Cặp đôi hoặc Gia đình để mở dashboard quản lý danh mục.',
                  'Enter an 8-character mandate code to oversee a household portfolio.',
                  '招待元から受け取った委任コードを入力して管理スペースへ参加します。'
                )}
              />
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={acceptMandateCode}
                  onChange={(e) => setAcceptMandateCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  placeholder={tx('Nhập mã ủy quyền (VD: M9P4K7T2)', 'Enter mandate code', '委任コード入力')}
                  className="h-10 flex-1 rounded-xl border border-white/10 bg-canvas/80 px-3 font-mono text-sm uppercase text-white placeholder:font-sans placeholder:normal-case placeholder:text-zinc-500 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={acceptingMandate || acceptMandateCode.trim().length < 6}
                  onClick={handleAcceptMandate}
                >
                  <CheckCircle2 className="size-3.5" /> {tx('Xác nhận', 'Accept', '受諾')}
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {(data.myMandates || []).map((m) => (
                  <div
                    key={m.id || m.mandateCode}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-white">{m.title}</span>
                        <Badge tone="brand">{m.mandateCode}</Badge>
                        <Badge tone={m.status === 'active' ? 'success' : 'warning'}>{m.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-zinc-400">
                        {m.householdMode} · {m.scope}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (isPlainObject(m.snapshotPayload) && Object.keys(m.snapshotPayload).length > 0) {
                            cryptoStorage.save('PLANNER_STATE', m.snapshotPayload);
                          }
                          navigate(href('plan', { hh: m.householdMode }));
                        }}
                      >
                        <ExternalLink className="size-3" /> {tx('Mở kế hoạch', 'Open Plan', '開く')}
                      </Button>
                      {(m.ownerUserId === user?.id || ['budget_co_manage', 'full_steward'].includes(m.scope)) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSyncMandateSnapshot(m)}
                        >
                          <RefreshCw className="size-3" /> {tx('Đồng bộ lên hồ sơ', 'Sync Plan', '同期')}
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleRevokeMandate(m.id)}>
                        {tx('Thu hồi', 'Revoke', '解除')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </AdaptiveGrid>
        </div>
      )}

      {/* TAB 4: 4-Role Roadmap */}
      {tab === 'roles' && (
        <AdaptiveGrid cols={{ mobile: 1, tablet: 2, duo: 2, desktop: 2 }}>
          {[
            {
              badge: tx('Vai trò 1', 'Role 1', '役割 1'),
              title: tx('Cá nhân (Hỗ trợ Cặp đôi & Gia đình linh hoạt)', 'Individual (Couple & Family Lifecycle)', '個人（カップル・家族移行対応）'),
              desc: tx(
                'Bắt đầu ở chế độ Cá nhân, lập hoặc chuyển đổi Cặp đôi bất kỳ lúc nào (lưu trữ Cặp đôi cũ gọn gàng), tạo Gia đình từ đầu hoặc nâng cấp trực tiếp từ Cặp đôi lên Gia đình giữ nguyên toàn bộ vốn và lộ trình.',
                'Start Solo, join or switch Couples (preserving history), create a Family space directly, or seamlessly upgrade a Couple into a Family space.',
                '個人から始め、パートナー変更・新規家族作成・カップルから家族への昇格をシームレスに切り替えられます。'
              ),
              cta: tx('Quản lý trong Hồ sơ →', 'Manage in Profile →', 'プロフィールへ →'),
              to: href('profile'),
            },
            {
              badge: tx('Vai trò 2', 'Role 2', '役割 2'),
              title: tx('Chuyên gia Tài chính Chuyên nghiệp', 'Verified Financial Expert', '認定ファイナンシャル専門家'),
              desc: tx(
                'Tài khoản dành cho chuyên gia có bằng cấp, chứng chỉ hành nghề (CFP, CFA, CWP...) và kinh nghiệm kiểm chứng. Chuyên gia cũng có thêm mục đạt chuẩn Người lập kế hoạch được cộng đồng bình chọn.',
                'Verified practitioners holding degrees, certifications, and advisory credentials—and eligible to earn the Community-Voted Planner distinction.',
                '学位・専門資格の認証を受けた専門家アカウント。コミュニティ選出バッジの併有も可能です。'
              ),
              cta: tx('Xem & Đăng ký Chuyên gia →', 'Experts Tab →', '専門家タブ →'),
              action: () => setTab('experts'),
            },
            {
              badge: tx('Vai trò 3', 'Role 3', '役割 3'),
              title: tx('Người lập kế hoạch được Cộng đồng Bình chọn', 'Community-Voted Financial Planner', 'コミュニティ選出プランナー'),
              desc: tx(
                'Cá nhân chứng minh được tính thực tế của kế hoạch qua minh chứng & đánh giá từ cộng đồng sẽ mở khoá huy hiệu danh dự và cho phép mọi thành viên Clone mẫu kế hoạch thực tế chỉ với 1 chạm.',
                'Unlocked when peers validate your real-world plan proof with high realism votes and clones, letting anyone Clone your blueprint.',
                '実証済みプランが高い現実性評価と複製数を獲得すると認定され、他ユーザーが1クリックで複製可能になります。'
              ),
              cta: tx('Xem & Clone mẫu thực tế →', 'Browse Voted Plans →', 'プラン一覧 →'),
              action: () => setTab('templates'),
            },
            {
              badge: tx('Vai trò 4', 'Role 4', '役割 4'),
              title: tx('Người Quản trị Tài chính (Financial Steward)', 'Household Financial Steward', '資産管理スチュワード'),
              desc: tx(
                'Nhận ủy quyền hợp lệ để quản trị danh mục tài sản, ngân sách và tiến độ tiết kiệm thay mặt cho Cá nhân, Cặp đôi hoặc Gia đình bận rộn.',
                'Accept scoped mandates to govern and optimize savings & cash flow for busy Individuals, Couples, or Families.',
                '委任コードを通じて個人・カップル・家族のポートフォリオと貯蓄計画を代行・共同管理できます。'
              ),
              cta: tx('Mở cổng Quản trị →', 'Steward Console →', '管理コンソール →'),
              action: () => setTab('stewards'),
            },
          ].map((role) => (
            <Card key={role.title} className="flex flex-col justify-between p-5">
              <div>
                <Badge tone="brand">{role.badge}</Badge>
                <h3 className="mt-3 text-base font-semibold text-white">{role.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{role.desc}</p>
              </div>
              <div className="mt-4 pt-3">
                {role.to ? (
                  <Button as="a" href={role.to} size="sm" variant="secondary">
                    {role.cta}
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={role.action}>
                    {role.cta}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </AdaptiveGrid>
      )}

      <FeedbackWidget
        tool="ecosystem"
        toolLabel={tx('Hệ sinh thái & Chuyên gia', 'Ecosystem & Roles', 'エコシステム')}
      />
    </div>
  );
}
