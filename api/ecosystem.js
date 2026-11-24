import { randomBytes, randomUUID } from 'node:crypto';
import { readJsonBody } from './_lib/http.js';
import {
  getUserFromBearerToken,
  isSupabaseConfigured,
  sbDelete,
  sbInsert,
  sbPatch,
  sbSelect,
  sbUpsert,
} from './_lib/supabase.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from './_lib/quotaGuard.js';
import { createRateLimiter } from './_lib/rateLimit.js';

const ecosystemLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60, maxEntries: 2000 });
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const COMMUNITY_THRESHOLDS = {
  minVotes: 10,
  minScore: 4.2,
  minClones: 3,
};

const SEED_EXPERTS = [
  {
    id: 'exp_minhanh_cfp',
    fullName: '[Mẫu Bot] Nguyễn Minh Anh, CFP® (Dữ liệu tham khảo)',
    organization: 'Hồ sơ minh họa Bot · Demo Advisory TP.HCM',
    accountRole: 'EXPERT',
    isVerifiedExpert: true,
    isCommunityVotedPlanner: true,
    isDummyData: true,
    isBotCreated: true,
    communityPlannerScore: 4.86,
    communityTotalVotes: 42,
    communityTotalClones: 128,
    yearsExperience: 9,
    credentials: {
      degree: '[Mẫu tham khảo] Thạc sĩ Tài chính – Ngân hàng',
      certificates: ['CFP® Sample', 'CWP Sample'],
      licenseId: 'DEMO-BOT-CFP-014',
    },
    specialties: ['Cặp đôi & Gia đình trẻ', 'Quỹ dự phòng 6–12 tháng', 'Tối ưu gửi bậc thang & Thuế TNCN'],
    bio: '[Dữ liệu mẫu do Bot tạo để tham khảo] Hồ sơ minh họa cách hiển thị Chuyên gia hoạch định dòng tiền gia đình.',
  },
  {
    id: 'exp_hoangnam_cfa',
    fullName: '[Mẫu Bot] Trần Hoàng Nam, CFA (Dữ liệu tham khảo)',
    organization: 'Hồ sơ minh họa Bot · Demo Asset Strategy',
    accountRole: 'EXPERT',
    isVerifiedExpert: true,
    isCommunityVotedPlanner: true,
    isDummyData: true,
    isBotCreated: true,
    communityPlannerScore: 4.74,
    communityTotalVotes: 29,
    communityTotalClones: 84,
    yearsExperience: 11,
    credentials: {
      degree: '[Mẫu tham khảo] Cử nhân Tài chính Định lượng',
      certificates: ['CFA Sample', 'Tư vấn Tài chính Mẫu'],
      licenseId: 'DEMO-BOT-CFA-884',
    },
    specialties: ['Phân bổ VND & Ngoại tệ FX', 'Lộ trình tự do tài chính sớm', 'Quản trị rủi ro thu nhập trụ cột'],
    bio: '[Dữ liệu mẫu do Bot tạo để tham khảo] Hồ sơ minh họa chuyên gia phân tích vĩ mô & phòng vệ tỷ giá đa tiền tệ.',
  },
  {
    id: 'exp_thuytrang_cwp',
    fullName: '[Mẫu Bot] Lê Thùy Trang, CWP (Dữ liệu tham khảo)',
    organization: 'Hồ sơ minh họa Bot · Demo Family Stewardship',
    accountRole: 'EXPERT',
    isVerifiedExpert: true,
    isCommunityVotedPlanner: false,
    isDummyData: true,
    isBotCreated: true,
    communityPlannerScore: 4.5,
    communityTotalVotes: 6,
    communityTotalClones: 14,
    yearsExperience: 7,
    credentials: {
      degree: '[Mẫu tham khảo] Thạc sĩ Quản trị Rủi ro Tài chính',
      certificates: ['CWP Sample', 'BHXH Tư vấn Mẫu'],
      licenseId: 'DEMO-BOT-CWP-071',
    },
    specialties: ['Nâng cấp Cặp đôi lên Gia đình', 'Kế hoạch thai sản & giáo dục con', 'Quản trị tài chính ủy quyền'],
    bio: '[Dữ liệu mẫu do Bot tạo để tham khảo] Hồ sơ minh họa chuyên gia tái cấu trúc dòng tiền hộ gia đình.',
  },
];

const SEED_TEMPLATES = [
  {
    id: 'tpl_couple_hcmc_5yr',
    authorUserId: 'seed_user_1',
    authorName: '🤖 [Mẫu Bot] Minh Khôi & Thảo Vy (Tham khảo)',
    authorRole: 'COMMUNITY_PLANNER',
    authorIsExpert: false,
    authorIsCommunityVoted: true,
    isDummyData: true,
    isBotCreated: true,
    title: '[Mẫu Bot] Cặp đôi 28 tuổi TP.HCM: Tích luỹ 1,2 tỷ trong 5 năm + Quỹ dự phòng 6 tháng',
    summary:
      'Kịch bản giả lập tham khảo: thu nhập tổng 48 triệu/tháng (chia góp 60/40), giữ 6 tháng dự phòng và gửi bậc thang 12M.',
    householdMode: 'COUPLE',
    proofNotes: '[Dữ liệu mẫu do Bot tạo để tham khảo] Kịch bản minh họa kiểm thử 18 tháng gửi góp liên tục trên Cake & Timo.',
    proofVerified: true,
    tags: ['🤖 Dữ liệu mẫu Bot', 'Cặp đôi', 'Quỹ dự phòng 6T'],
    realismScore: 4.91,
    votesCount: 64,
    cloneCount: 193,
    status: 'published',
    planPayload: {
      householdMode: 'COUPLE',
      goalType: 'TARGET_AMOUNT',
      targetAmount: 1_200_000_000,
      solveMode: 'TIME',
      capital: 180_000_000,
      saving: 16_000_000,
      salaryFullTime: 28_000_000,
      partnerSalaryFullTime: 20_000_000,
      monthlyFixedExpense: 22_000_000,
      contributionRule: 'PROPORTIONAL',
      prioritizeEmergencyFund: true,
      emergencyFundMonths: 6,
      bankId: 'cake',
      tenure: '12M',
      annualStepUpPct: 6,
    },
    createdAt: '2026-10-15T09:00:00.000Z',
  },
  {
    id: 'tpl_expert_minhanh_passive',
    authorUserId: 'seed_exp_minhanh',
    authorName: '🤖 [Mẫu Bot] Nguyễn Minh Anh, CFP® (Tham khảo)',
    authorRole: 'EXPERT',
    authorIsExpert: true,
    authorIsCommunityVoted: true,
    isDummyData: true,
    isBotCreated: true,
    title: '[Mẫu Bot] Lộ trình thu nhập thụ động 15 triệu/tháng cho nhân sự văn phòng',
    summary:
      'Kịch bản mẫu tham khảo: tăng mức gửi +7%/năm theo lương kết hợp tái tục kỳ hạn 12M lãi thực dương.',
    householdMode: 'INDIVIDUAL',
    proofNotes: '[Dữ liệu mẫu do Bot tạo để tham khảo] Bộ thông số mẫu giúp người dùng thử nghiệm tính năng Clone 1 chạm.',
    proofVerified: true,
    tags: ['🤖 Dữ liệu mẫu Bot', 'Mẫu Chuyên gia', 'Thu nhập thụ động'],
    realismScore: 4.86,
    votesCount: 42,
    cloneCount: 128,
    status: 'published',
    planPayload: {
      householdMode: 'INDIVIDUAL',
      goalType: 'PASSIVE_INCOME',
      target: 15_000_000,
      solveMode: 'TIME',
      capital: 120_000_000,
      saving: 14_000_000,
      salaryFullTime: 34_000_000,
      monthlyFixedExpense: 15_000_000,
      prioritizeEmergencyFund: true,
      emergencyFundMonths: 4,
      bankId: 'cake',
      tenure: '12M',
      annualStepUpPct: 7,
      inflationRatePct: 3.5,
    },
    createdAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'tpl_family_1child_fundfirst',
    authorUserId: 'seed_user_2',
    authorName: '🤖 [Mẫu Bot] Gia đình anh Đức Hạnh (Tham khảo)',
    authorRole: 'COMMUNITY_PLANNER',
    authorIsExpert: false,
    authorIsCommunityVoted: true,
    isDummyData: true,
    isBotCreated: true,
    title: '[Mẫu Bot] Gia đình 1 con nhỏ tại Hà Nội: Bảo vệ trụ cột & Quỹ giáo dục 2 tỷ',
    summary:
      'Kịch bản mẫu tham khảo: tách chi phí nuôi con 9 triệu/tháng, kích hoạt Fund-First lấp 9 tháng dự phòng.',
    householdMode: 'FAMILY',
    proofNotes: '[Dữ liệu mẫu do Bot tạo để tham khảo] Kịch bản giả lập hộ gia đình dùng để tham khảo cấu trúc Fund-First.',
    proofVerified: true,
    tags: ['🤖 Dữ liệu mẫu Bot', 'Gia đình', 'Fund-First 9T'],
    realismScore: 4.78,
    votesCount: 38,
    cloneCount: 112,
    status: 'published',
    planPayload: {
      householdMode: 'FAMILY',
      dependentsCount: 1,
      goalType: 'TARGET_AMOUNT',
      targetAmount: 2_000_000_000,
      solveMode: 'TIME',
      capital: 260_000_000,
      saving: 18_000_000,
      salaryFullTime: 35_000_000,
      partnerSalaryFullTime: 22_000_000,
      monthlyFixedExpense: 24_000_000,
      monthlyDependentsCost: 9_000_000,
      contributionRule: 'PROPORTIONAL',
      prioritizeEmergencyFund: true,
      emergencyFundMonths: 9,
      bankId: 'timo',
      tenure: '12M',
    },
    createdAt: '2026-11-08T10:30:00.000Z',
  },
  {
    id: 'tpl_expert_hoangnam_fx_vnd',
    authorUserId: 'seed_exp_hoangnam',
    authorName: '🤖 [Mẫu Bot] Trần Hoàng Nam, CFA (Tham khảo)',
    authorRole: 'EXPERT',
    authorIsExpert: true,
    authorIsCommunityVoted: true,
    isDummyData: true,
    isBotCreated: true,
    title: '[Mẫu Bot] Cân bằng Sổ tiết kiệm VND & phòng vệ Ngoại tệ cho thu nhập đa nguồn',
    summary:
      'Kịch bản mẫu tham khảo: kết hợp thu nhập chính + freelance, giữ 6 tháng dự phòng và bước tăng 8%/năm.',
    householdMode: 'INDIVIDUAL',
    proofNotes: '[Dữ liệu mẫu do Bot tạo để tham khảo] Kịch bản giả lập đa nguồn thu phục vụ đối chiếu trên Planner.',
    proofVerified: true,
    tags: ['🤖 Dữ liệu mẫu Bot', 'Mẫu Chuyên gia', 'Freelance'],
    realismScore: 4.74,
    votesCount: 29,
    cloneCount: 84,
    status: 'published',
    planPayload: {
      householdMode: 'INDIVIDUAL',
      inputMode: 'advanced',
      goalType: 'PASSIVE_INCOME',
      target: 20_000_000,
      solveMode: 'TIME',
      capital: 300_000_000,
      saving: 18_000_000,
      salaryFullTime: 30_000_000,
      freelanceIncomeMin: 6_000_000,
      freelanceIncomeMax: 15_000_000,
      monthlyFixedExpense: 18_000_000,
      prioritizeEmergencyFund: true,
      emergencyFundMonths: 6,
      bankId: 'liobank',
      tenure: '12M',
      annualStepUpPct: 8,
    },
    createdAt: '2026-11-15T14:00:00.000Z',
  },
];

const SEED_TEMPLATE_IDS = new Set(SEED_TEMPLATES.map((t) => t.id));
const SEED_EXPERT_IDS = new Set(SEED_EXPERTS.map((e) => e.id));

// In-memory state mirrors/fallbacks when Supabase tables haven't been migrated yet
const memoryTemplates = new Map(SEED_TEMPLATES.map((t) => [t.id, { ...t }]));
const memoryTemplateVotes = new Map(); // `${templateId}:${userId}` -> rating
const memorySpacesByUser = new Map(); // userId -> Array<space>
const memoryMandates = new Map(); // mandateCode -> mandate row
const memoryProfiles = new Map(); // userId -> extended v2 profile patch

function cleanStr(val, maxLen = 140) {
  return String(val ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function generateCode(len = 8) {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

function sanitizePlanPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  try {
    const s = JSON.stringify(raw);
    if (s.length <= 24_000) return JSON.parse(s);
  } catch {
    // ignore oversized/circular payloads
  }
  return {};
}

function sanitizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .slice(0, 6)
    .map((t) => cleanStr(t, 36))
    .filter(Boolean);
}

function formatTemplate(row) {
  return {
    id: row.id,
    authorUserId: row.author_user_id || row.authorUserId,
    authorName: row.author_name || row.authorName || 'Thành viên VnSavingPro',
    authorRole: row.author_role || row.authorRole || 'INDIVIDUAL',
    authorIsExpert: Boolean(row.author_is_expert ?? row.authorIsExpert),
    authorIsCommunityVoted: Boolean(row.author_is_community_voted ?? row.authorIsCommunityVoted),
    isDummyData: Boolean(row.isDummyData || SEED_TEMPLATE_IDS.has(row.id)),
    isBotCreated: Boolean(row.isBotCreated || SEED_TEMPLATE_IDS.has(row.id)),
    title: row.title,
    summary: row.summary || '',
    householdMode: row.household_mode || row.householdMode || 'INDIVIDUAL',
    proofNotes: row.proof_notes || row.proofNotes || '',
    proofVerified: Boolean(row.proof_verified ?? row.proofVerified),
    tags: Array.isArray(row.tags) ? row.tags : [],
    planPayload: row.plan_payload || row.planPayload || {},
    realismScore: Number(row.realism_score ?? row.realismScore ?? 0),
    votesCount: Number(row.votes_count ?? row.votesCount ?? 0),
    cloneCount: Number(row.clone_count ?? row.cloneCount ?? 0),
    status: row.status || 'published',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

function formatSpace(row) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id || row.ownerUserId,
    partnerUserId: row.partner_user_id || row.partnerUserId || null,
    householdMode: row.household_mode || row.householdMode || 'INDIVIDUAL',
    title: row.title || 'Không gian tài chính',
    status: row.status || 'active',
    previousSpaceId: row.previous_space_id || row.previousSpaceId || null,
    upgradedFromMode: row.upgraded_from_mode || row.upgradedFromMode || '',
    dependentsCount: Number(row.dependents_count ?? row.dependentsCount ?? 0),
    inviteCode: row.invite_code || row.inviteCode || '',
    planPayload: row.plan_payload || row.planPayload || {},
    archivedAt: row.archived_at || row.archivedAt || null,
    upgradedAt: row.upgraded_at || row.upgradedAt || null,
    updatedAt: row.updated_at || row.updatedAt || row.created_at || null,
    createdAt: row.created_at || row.createdAt || null,
  };
}

function formatMandate(row) {
  return {
    id: row.id,
    mandateCode: row.mandate_code || row.mandateCode,
    ownerUserId: row.owner_user_id || row.ownerUserId,
    ownerDisplayName: row.owner_display_name || row.ownerDisplayName || '',
    stewardUserId: row.steward_user_id || row.stewardUserId || null,
    stewardDisplayName: row.steward_display_name || row.stewardDisplayName || '',
    stewardEmail: row.steward_email || row.stewardEmail || '',
    householdSpaceId: row.household_space_id || row.householdSpaceId || '',
    householdMode: row.household_mode || row.householdMode || 'INDIVIDUAL',
    title: row.title || 'Ủy quyền quản trị tài chính',
    scope: row.scope || 'budget_co_manage',
    status: row.status || 'pending',
    snapshotPayload: row.snapshot_payload || row.snapshotPayload || {},
    expiresAt: row.expires_at || row.expiresAt || null,
    acceptedAt: row.accepted_at || row.acceptedAt || null,
    updatedAt: row.updated_at || row.updatedAt || null,
    createdAt: row.created_at || row.createdAt || null,
  };
}

async function listPublishedTemplates(supabaseConnected) {
  const byId = new Map();
  for (const t of memoryTemplates.values()) {
    byId.set(t.id, formatTemplate(t));
  }
  if (supabaseConnected) {
    const dbRes = await sbSelect(
      'community_plan_templates',
      'status=eq.published&order=realism_score.desc,clone_count.desc&limit=40'
    );
    if (dbRes.ok && Array.isArray(dbRes.data)) {
      for (const row of dbRes.data) {
        const formatted = formatTemplate(row);
        byId.set(formatted.id, formatted);
        memoryTemplates.set(formatted.id, formatted);
      }
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => b.realismScore * 10 + b.cloneCount - (a.realismScore * 10 + a.cloneCount)
  );
}

async function listExperts(supabaseConnected) {
  const byKey = new Map(SEED_EXPERTS.map((e) => [e.id, e]));
  if (supabaseConnected) {
    const dbRes = await sbSelect(
      'profiles',
      'or=(is_verified_expert.eq.true,expert_verification_status.eq.verified)&select=id,full_name,account_role,is_verified_expert,expert_verification_status,expert_credentials,is_community_voted_planner,community_planner_score,community_total_votes,community_total_clones&limit=30'
    );
    if (dbRes.ok && Array.isArray(dbRes.data)) {
      for (const row of dbRes.data) {
        const creds = row.expert_credentials || {};
        byKey.set(row.id, {
          id: row.id,
          fullName: row.full_name || 'Chuyên gia VnSavingPro',
          organization: creds.organization || 'Tư vấn Tài chính Độc lập',
          accountRole: row.account_role || 'EXPERT',
          isVerifiedExpert: Boolean(row.is_verified_expert || row.expert_verification_status === 'verified'),
          isCommunityVotedPlanner: Boolean(row.is_community_voted_planner),
          communityPlannerScore: Number(row.community_planner_score || 0),
          communityTotalVotes: Number(row.community_total_votes || 0),
          communityTotalClones: Number(row.community_total_clones || 0),
          yearsExperience: Number(creds.yearsExperience || 5),
          credentials: {
            degree: creds.degree || '',
            certificates: Array.isArray(creds.certificates) ? creds.certificates : [],
            licenseId: creds.licenseId || '',
          },
          specialties: Array.isArray(creds.specialties) ? creds.specialties : [],
          bio: creds.bio || '',
        });
      }
    }
  }
  return Array.from(byKey.values());
}

async function getMySpaces(userId, supabaseConnected) {
  if (supabaseConnected) {
    const dbRes = await sbSelect(
      'household_spaces',
      `or=(owner_user_id.eq.${encodeURIComponent(userId)},partner_user_id.eq.${encodeURIComponent(userId)})&order=created_at.desc&limit=25`
    );
    if (dbRes.ok && Array.isArray(dbRes.data)) {
      const formatted = dbRes.data.map(formatSpace);
      memorySpacesByUser.set(userId, formatted);
      return formatted;
    }
  }
  return memorySpacesByUser.get(userId) || [];
}

async function getMyMandates(userId, supabaseConnected) {
  if (supabaseConnected) {
    const dbRes = await sbSelect(
      'steward_mandates',
      `or=(owner_user_id.eq.${encodeURIComponent(userId)},steward_user_id.eq.${encodeURIComponent(userId)})&status=neq.revoked&order=updated_at.desc&limit=25`
    );
    if (dbRes.ok && Array.isArray(dbRes.data)) {
      const formatted = dbRes.data.map(formatMandate);
      for (const m of formatted) {
        memoryMandates.set(m.mandateCode, m);
      }
      return formatted;
    }
  }
  return Array.from(memoryMandates.values()).filter(
    (m) => (m.ownerUserId === userId || m.stewardUserId === userId) && m.status !== 'revoked'
  );
}

async function recomputeAuthorCommunityStats(authorUserId, supabaseConnected) {
  const templates = await listPublishedTemplates(supabaseConnected);
  const owned = templates.filter((t) => t.authorUserId === authorUserId);
  let totalVotes = 0;
  let weightedScore = 0;
  let totalClones = 0;
  let anyProof = false;

  for (const t of owned) {
    totalVotes += t.votesCount;
    weightedScore += t.realismScore * t.votesCount;
    totalClones += t.cloneCount;
    if (t.proofVerified || (t.proofNotes && t.proofNotes.length >= 20)) anyProof = true;
  }

  const avgScore = totalVotes > 0 ? Number((weightedScore / totalVotes).toFixed(2)) : 0;
  const qualified =
    anyProof &&
    totalVotes >= COMMUNITY_THRESHOLDS.minVotes &&
    avgScore >= COMMUNITY_THRESHOLDS.minScore &&
    totalClones >= COMMUNITY_THRESHOLDS.minClones;

  const existingMem = memoryProfiles.get(authorUserId) || {};
  const nextProfile = {
    ...existingMem,
    isCommunityVotedPlanner: qualified,
    communityPlannerScore: avgScore,
    communityTotalVotes: totalVotes,
    communityTotalClones: totalClones,
  };
  memoryProfiles.set(authorUserId, nextProfile);

  if (supabaseConnected) {
    await sbPatch('profiles', `id=eq.${encodeURIComponent(authorUserId)}`, {
      is_community_voted_planner: qualified,
      community_planner_score: avgScore,
      community_total_votes: totalVotes,
      community_total_clones: totalClones,
      updated_at: new Date().toISOString(),
    });
  }

  return nextProfile;
}

export default async function handler(req, res) {
  if (ecosystemLimiter(req)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  const supabaseConnected = isSupabaseConfigured();

  if (req.method === 'GET') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) return sendPocQuotaResponse(res, quotaGuard);

    const resource = cleanStr(req.query?.resource || 'overview', 30).toLowerCase();
    const hasAuthHeader = Boolean(req.headers?.authorization);
    const auth = hasAuthHeader ? await getUserFromBearerToken(req) : { ok: false, user: null };

    if (['households', 'stewards', 'my_status'].includes(resource) && (!auth.ok || !auth.user?.id)) {
      return res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập để truy cập dữ liệu cá nhân hoá.' });
    }

    const [templates, experts] = await Promise.all([
      resource === 'experts' ? Promise.resolve([]) : listPublishedTemplates(supabaseConnected),
      resource === 'templates' ? Promise.resolve([]) : listExperts(supabaseConnected),
    ]);

    let mySpaces = [];
    let myMandates = [];
    let myStatus = null;

    if (auth.ok && auth.user?.id) {
      const uid = auth.user.id;
      res.setHeader('Cache-Control', 'no-store');
      [mySpaces, myMandates] = await Promise.all([
        getMySpaces(uid, supabaseConnected),
        getMyMandates(uid, supabaseConnected),
      ]);

      let dbProfile = null;
      if (supabaseConnected) {
        const profRes = await sbSelect(
          'profiles',
          `id=eq.${encodeURIComponent(uid)}&select=id,full_name,account_role,is_verified_expert,expert_verification_status,expert_credentials,is_community_voted_planner,community_planner_score,community_total_votes,community_total_clones,steward_enabled&limit=1`
        );
        if (profRes.ok && Array.isArray(profRes.data) && profRes.data[0]) {
          dbProfile = profRes.data[0];
        }
      }
      const memProf = memoryProfiles.get(uid) || {};
      const ownTemplates = templates.filter((t) => t.authorUserId === uid);
      const totalVotes = dbProfile?.community_total_votes ?? memProf.communityTotalVotes ?? ownTemplates.reduce((s, t) => s + t.votesCount, 0);
      const totalClones = dbProfile?.community_total_clones ?? memProf.communityTotalClones ?? ownTemplates.reduce((s, t) => s + t.cloneCount, 0);
      const avgScore = Number(dbProfile?.community_planner_score ?? memProf.communityPlannerScore ?? 0);

      myStatus = {
        accountRole: dbProfile?.account_role || memProf.accountRole || 'INDIVIDUAL',
        isVerifiedExpert: Boolean(dbProfile?.is_verified_expert ?? memProf.isVerifiedExpert),
        expertVerificationStatus: dbProfile?.expert_verification_status || memProf.expertVerificationStatus || 'none',
        expertCredentials: dbProfile?.expert_credentials || memProf.expertCredentials || {},
        isCommunityVotedPlanner: Boolean(dbProfile?.is_community_voted_planner ?? memProf.isCommunityVotedPlanner),
        communityPlannerScore: avgScore,
        communityTotalVotes: totalVotes,
        communityTotalClones: totalClones,
        stewardEnabled: Boolean(dbProfile?.steward_enabled ?? memProf.stewardEnabled ?? myMandates.some((m) => m.stewardUserId === uid)),
        thresholds: COMMUNITY_THRESHOLDS,
      };
    } else {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }

    return res.status(200).json({
      ok: true,
      thresholds: COMMUNITY_THRESHOLDS,
      templates,
      experts,
      mySpaces,
      myMandates,
      myStatus,
    });
  }

  if (req.method === 'POST') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) return sendPocQuotaResponse(res, quotaGuard);

    let body = {};
    try {
      body = await readJsonBody(req);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
    }

    const action = cleanStr(body?.action || '', 40).toLowerCase();
    res.setHeader('Cache-Control', 'no-store');

    // Public or authenticated 1-click template cloning
    if (action === 'clone_template') {
      const templateId = cleanStr(body.templateId, 80);
      if (!templateId) {
        return res.status(400).json({ ok: false, error: 'Missing templateId' });
      }
      const list = await listPublishedTemplates(supabaseConnected);
      const target = list.find((t) => t.id === templateId);
      if (!target) {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy mẫu kế hoạch.' });
      }
      const nextCloneCount = target.cloneCount + 1;
      const updated = { ...target, cloneCount: nextCloneCount };
      memoryTemplates.set(target.id, updated);

      if (supabaseConnected && !SEED_TEMPLATE_IDS.has(templateId)) {
        await sbPatch('community_plan_templates', `id=eq.${encodeURIComponent(templateId)}`, {
          clone_count: nextCloneCount,
          updated_at: new Date().toISOString(),
        });
        await recomputeAuthorCommunityStats(target.authorUserId, true);
      }

      return res.status(200).json({
        ok: true,
        template: updated,
        planPayload: target.planPayload,
      });
    }

    // All remaining write actions strictly require authenticated Bearer JWT
    const auth = await getUserFromBearerToken(req);
    if (!auth.ok || !auth.user?.id) {
      return res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    }

    const user = auth.user;
    const userId = user.id;
    const userDisplayName =
      cleanStr(user.user_metadata?.full_name || user.email?.split('@')[0] || '', 80) || 'Thành viên VnSavingPro';
    const nowIso = new Date().toISOString();

    if (action === 'publish_template') {
      const title = cleanStr(body.title, 140);
      if (!title || title.length < 6) {
        return res.status(400).json({ ok: false, error: 'Vui lòng nhập tiêu đề kế hoạch từ 6 ký tự trở lên.' });
      }
      const summary = cleanStr(body.summary, 320);
      const proofNotes = cleanStr(body.proofNotes, 400);
      if (!proofNotes || proofNotes.length < 12) {
        return res.status(400).json({
          ok: false,
          error: 'Vui lòng ghi rõ minh chứng thực tế của kế hoạch (tối thiểu 12 ký tự) để cộng đồng thẩm định.',
        });
      }
      const hhMode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(body.householdMode)
        ? body.householdMode
        : 'INDIVIDUAL';
      const tags = sanitizeTags(body.tags);
      const planPayload = sanitizePlanPayload(body.planPayload);
      const memProf = memoryProfiles.get(userId) || {};

      let authorIsExpert = Boolean(memProf.isVerifiedExpert);
      let authorIsVoted = Boolean(memProf.isCommunityVotedPlanner);
      let authorRole = authorIsExpert ? 'EXPERT' : authorIsVoted ? 'COMMUNITY_PLANNER' : 'INDIVIDUAL';

      if (supabaseConnected) {
        const pRes = await sbSelect(
          'profiles',
          `id=eq.${encodeURIComponent(userId)}&select=account_role,is_verified_expert,is_community_voted_planner&limit=1`
        );
        if (pRes.ok && Array.isArray(pRes.data) && pRes.data[0]) {
          authorIsExpert = Boolean(pRes.data[0].is_verified_expert);
          authorIsVoted = Boolean(pRes.data[0].is_community_voted_planner);
          authorRole = pRes.data[0].account_role || authorRole;
        }
      }

      const tplRow = {
        id: `tpl_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
        author_user_id: userId,
        author_name: userDisplayName,
        author_role: authorRole,
        author_is_expert: authorIsExpert,
        author_is_community_voted: authorIsVoted,
        title,
        summary,
        household_mode: hhMode,
        proof_notes: proofNotes,
        proof_verified: proofNotes.length >= 25,
        tags: tags.length ? tags : [hhMode === 'COUPLE' ? 'Cặp đôi' : hhMode === 'FAMILY' ? 'Gia đình' : 'Cá nhân'],
        plan_payload: planPayload,
        realism_score: 5.0,
        votes_count: 1,
        clone_count: 0,
        status: 'published',
        updated_at: nowIso,
        created_at: nowIso,
      };

      const formatted = formatTemplate(tplRow);
      memoryTemplates.set(formatted.id, formatted);

      if (supabaseConnected) {
        const ins = await sbInsert('community_plan_templates', tplRow, true);
        if (ins.ok && Array.isArray(ins.data) && ins.data[0]) {
          const dbSaved = formatTemplate(ins.data[0]);
          memoryTemplates.set(dbSaved.id, dbSaved);
          return res.status(200).json({ ok: true, template: dbSaved, storage: 'supabase' });
        }
      }

      return res.status(200).json({ ok: true, template: formatted, storage: 'memory' });
    }

    if (action === 'vote_template') {
      const templateId = cleanStr(body.templateId, 80);
      const rating = Math.min(5, Math.max(1, Math.round(Number(body.realismRating) || 5)));
      const list = await listPublishedTemplates(supabaseConnected);
      const target = list.find((t) => t.id === templateId);
      if (!target) {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy mẫu kế hoạch.' });
      }

      const voteKey = `${templateId}:${userId}`;
      const previousVote = memoryTemplateVotes.get(voteKey);
      memoryTemplateVotes.set(voteKey, rating);

      let newVotes = target.votesCount;
      let totalStars = target.realismScore * target.votesCount;
      if (previousVote !== undefined) {
        totalStars = totalStars - previousVote + rating;
      } else {
        newVotes += 1;
        totalStars += rating;
      }
      const newScore = newVotes > 0 ? Number((totalStars / newVotes).toFixed(2)) : rating;
      const updated = { ...target, votesCount: newVotes, realismScore: newScore };
      memoryTemplates.set(target.id, updated);

      if (supabaseConnected && !SEED_TEMPLATE_IDS.has(templateId)) {
        await sbUpsert(
          'community_template_votes',
          {
            template_id: templateId,
            voter_user_id: userId,
            realism_rating: rating,
            comment: cleanStr(body.comment || '', 240),
          },
          'template_id,voter_user_id'
        );
        await sbPatch('community_plan_templates', `id=eq.${encodeURIComponent(templateId)}`, {
          votes_count: newVotes,
          realism_score: newScore,
          updated_at: nowIso,
        });
        await recomputeAuthorCommunityStats(target.authorUserId, true);
      }

      return res.status(200).json({ ok: true, template: updated });
    }

    if (action === 'apply_expert') {
      const degree = cleanStr(body.degree, 160);
      const certificates = sanitizeTags(body.certificates || []);
      const organization = cleanStr(body.organization, 120);
      const licenseId = cleanStr(body.licenseId, 80);
      const yearsExperience = Math.max(0, Math.min(50, Math.round(Number(body.yearsExperience) || 0)));
      const bio = cleanStr(body.bio, 400);
      const specialties = sanitizeTags(body.specialties || []);

      if (!degree && certificates.length === 0) {
        return res.status(400).json({
          ok: false,
          error: 'Vui lòng cung cấp ít nhất 1 bằng cấp chuyên môn hoặc chứng chỉ tài chính để thẩm định.',
        });
      }

      const creds = {
        degree,
        certificates,
        organization,
        licenseId,
        yearsExperience,
        bio,
        specialties,
        submittedAt: nowIso,
      };

      const memPrev = memoryProfiles.get(userId) || {};
      memoryProfiles.set(userId, {
        ...memPrev,
        expertVerificationStatus: 'pending',
        expertCredentials: creds,
      });

      if (supabaseConnected) {
        await sbPatch('profiles', `id=eq.${encodeURIComponent(userId)}`, {
          expert_verification_status: 'pending',
          expert_credentials: creds,
          updated_at: nowIso,
        });
      }

      return res.status(200).json({
        ok: true,
        expertVerificationStatus: 'pending',
        expertCredentials: creds,
      });
    }

    if (action === 'create_household' || action === 'switch_couple' || action === 'upgrade_couple_to_family') {
      const spaces = await getMySpaces(userId, supabaseConnected);
      const title = cleanStr(body.title, 120);
      const planPayload = sanitizePlanPayload(body.planPayload);
      const dependentsCount = Math.max(0, Math.min(12, Math.round(Number(body.dependentsCount) || 0)));

      if (action === 'switch_couple') {
        const activeCouple = spaces.find((s) => s.householdMode === 'COUPLE' && s.status === 'active');
        if (activeCouple) {
          activeCouple.status = 'archived';
          activeCouple.archivedAt = nowIso;
          if (supabaseConnected) {
            await sbPatch('household_spaces', `id=eq.${encodeURIComponent(activeCouple.id)}`, {
              status: 'archived',
              archived_at: nowIso,
              updated_at: nowIso,
            });
          }
        }
        const newSpace = {
          id: `space_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
          owner_user_id: userId,
          partner_user_id: null,
          household_mode: 'COUPLE',
          title: title || 'Không gian Cặp đôi mới',
          status: 'active',
          previous_space_id: activeCouple?.id || null,
          upgraded_from_mode: '',
          dependents_count: 0,
          invite_code: generateCode(8),
          plan_payload: { ...planPayload, householdMode: 'COUPLE' },
          updated_at: nowIso,
          created_at: nowIso,
        };
        const formatted = formatSpace(newSpace);
        memorySpacesByUser.set(userId, [formatted, ...spaces.filter((s) => s.id !== activeCouple?.id), ...(activeCouple ? [activeCouple] : [])]);
        if (supabaseConnected) {
          await sbInsert('household_spaces', newSpace, false);
        }
        return res.status(200).json({ ok: true, space: formatted, archivedSpaceId: activeCouple?.id || null });
      }

      if (action === 'upgrade_couple_to_family') {
        const activeCouple = spaces.find((s) => s.householdMode === 'COUPLE' && s.status === 'active');
        const inheritedPayload = {
          ...(activeCouple?.planPayload || {}),
          ...planPayload,
          householdMode: 'FAMILY',
          dependentsCount: Math.max(1, dependentsCount || 1),
          prioritizeEmergencyFund: true,
        };
        if (activeCouple) {
          activeCouple.status = 'upgraded';
          activeCouple.upgradedAt = nowIso;
          if (supabaseConnected) {
            await sbPatch('household_spaces', `id=eq.${encodeURIComponent(activeCouple.id)}`, {
              status: 'upgraded',
              upgraded_at: nowIso,
              updated_at: nowIso,
            });
          }
        }
        const familySpace = {
          id: `space_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
          owner_user_id: userId,
          partner_user_id: activeCouple?.partnerUserId || null,
          household_mode: 'FAMILY',
          title: title || (activeCouple ? `${activeCouple.title} → Gia đình` : 'Không gian Gia đình mới'),
          status: 'active',
          previous_space_id: activeCouple?.id || null,
          upgraded_from_mode: activeCouple ? 'COUPLE' : 'NEW_FAMILY',
          dependents_count: Math.max(1, dependentsCount || 1),
          invite_code: generateCode(8),
          plan_payload: inheritedPayload,
          updated_at: nowIso,
          created_at: nowIso,
        };
        const formatted = formatSpace(familySpace);
        memorySpacesByUser.set(userId, [formatted, ...spaces]);
        if (supabaseConnected) {
          await sbInsert('household_spaces', familySpace, false);
        }
        return res.status(200).json({ ok: true, space: formatted, upgradedFromId: activeCouple?.id || null });
      }

      // create_household
      const hhMode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(body.householdMode)
        ? body.householdMode
        : 'FAMILY';
      const createdSpace = {
        id: `space_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
        owner_user_id: userId,
        partner_user_id: null,
        household_mode: hhMode,
        title:
          title ||
          (hhMode === 'FAMILY'
            ? 'Không gian Gia đình'
            : hhMode === 'COUPLE'
              ? 'Không gian Cặp đôi'
              : 'Không gian Cá nhân'),
        status: 'active',
        previous_space_id: null,
        upgraded_from_mode: hhMode === 'FAMILY' ? 'SCRATCH' : '',
        dependents_count: hhMode === 'FAMILY' ? Math.max(1, dependentsCount || 1) : 0,
        invite_code: generateCode(8),
        plan_payload: { ...planPayload, householdMode: hhMode },
        updated_at: nowIso,
        created_at: nowIso,
      };
      const formatted = formatSpace(createdSpace);
      memorySpacesByUser.set(userId, [formatted, ...spaces]);
      if (supabaseConnected) {
        await sbInsert('household_spaces', createdSpace, false);
      }
      return res.status(200).json({ ok: true, space: formatted });
    }

    if (action === 'create_steward_mandate') {
      const hhMode = ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(body.householdMode)
        ? body.householdMode
        : 'INDIVIDUAL';
      const scope = ['read_only', 'budget_co_manage', 'full_steward'].includes(body.scope)
        ? body.scope
        : 'budget_co_manage';
      const mandateCode = generateCode(8);
      const row = {
        id: `mnd_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
        mandate_code: mandateCode,
        owner_user_id: userId,
        owner_display_name: userDisplayName,
        steward_user_id: null,
        steward_display_name: '',
        steward_email: cleanStr(body.stewardEmail || '', 140).toLowerCase(),
        household_space_id: cleanStr(body.householdSpaceId || '', 80),
        household_mode: hhMode,
        title: cleanStr(body.title, 120) || 'Ủy quyền quản trị tài chính hộ gia đình',
        scope,
        status: 'pending',
        snapshot_payload: sanitizePlanPayload(body.snapshotPayload),
        expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        accepted_at: null,
        updated_at: nowIso,
        created_at: nowIso,
      };
      const formatted = formatMandate(row);
      memoryMandates.set(mandateCode, formatted);
      if (supabaseConnected) {
        await sbInsert('steward_mandates', row, false);
      }
      return res.status(200).json({ ok: true, mandate: formatted });
    }

    if (action === 'accept_steward_mandate') {
      const code = cleanStr(body.mandateCode, 12).toUpperCase();
      if (!/^[A-Z0-9]{6,12}$/.test(code)) {
        return res.status(400).json({ ok: false, error: 'Mã ủy quyền không hợp lệ.' });
      }
      let target = memoryMandates.get(code) || null;
      if (supabaseConnected) {
        const resDb = await sbSelect('steward_mandates', `mandate_code=eq.${encodeURIComponent(code)}&limit=1`);
        if (resDb.ok && Array.isArray(resDb.data) && resDb.data[0]) {
          target = formatMandate(resDb.data[0]);
        }
      }
      if (!target || target.status === 'revoked') {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy mã ủy quyền hoặc đã bị thu hồi.' });
      }
      if (target.ownerUserId === userId) {
        return res.status(400).json({ ok: false, error: 'Bạn là chủ tài sản tạo mã ủy quyền này.' });
      }
      target.stewardUserId = userId;
      target.stewardDisplayName = userDisplayName;
      target.status = 'active';
      target.acceptedAt = nowIso;
      target.updatedAt = nowIso;
      memoryMandates.set(code, target);

      const memPrev = memoryProfiles.get(userId) || {};
      memoryProfiles.set(userId, { ...memPrev, stewardEnabled: true, accountRole: 'STEWARD' });

      if (supabaseConnected) {
        await sbPatch('steward_mandates', `mandate_code=eq.${encodeURIComponent(code)}`, {
          steward_user_id: userId,
          steward_display_name: userDisplayName,
          status: 'active',
          accepted_at: nowIso,
          updated_at: nowIso,
        });
        await sbPatch('profiles', `id=eq.${encodeURIComponent(userId)}`, {
          steward_enabled: true,
          updated_at: nowIso,
        });
      }
      return res.status(200).json({ ok: true, mandate: target });
    }

    if (action === 'revoke_steward_mandate') {
      const id = cleanStr(body.id, 80);
      for (const [c, m] of memoryMandates.entries()) {
        if (m.id === id && (m.ownerUserId === userId || m.stewardUserId === userId)) {
          memoryMandates.delete(c);
        }
      }
      if (supabaseConnected && id) {
        await sbDelete('steward_mandates', `id=eq.${encodeURIComponent(id)}&owner_user_id=eq.${encodeURIComponent(userId)}`);
      }
      return res.status(200).json({ ok: true, revokedId: id });
    }

    if (action === 'sync_steward_snapshot') {
      const mandateId = cleanStr(body.mandateId || body.id, 80);
      if (!mandateId) {
        return res.status(400).json({ ok: false, error: 'Missing mandateId' });
      }
      const nextPayload = sanitizePlanPayload(body.snapshotPayload);
      let target = null;

      for (const m of memoryMandates.values()) {
        if (m.id === mandateId) {
          target = m;
          break;
        }
      }

      if (supabaseConnected) {
        const resDb = await sbSelect('steward_mandates', `id=eq.${encodeURIComponent(mandateId)}&limit=1`);
        if (resDb.ok && Array.isArray(resDb.data) && resDb.data[0]) {
          target = formatMandate(resDb.data[0]);
        }
      }

      if (!target || target.status === 'revoked') {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy hồ sơ ủy quyền hợp lệ.' });
      }

      const isOwner = target.ownerUserId === userId;
      const isAuthorizedSteward =
        target.stewardUserId === userId &&
        target.status === 'active' &&
        ['budget_co_manage', 'full_steward'].includes(target.scope);

      if (!isOwner && !isAuthorizedSteward) {
        return res.status(403).json({
          ok: false,
          error: 'Bạn không có quyền ghi cập nhật snapshot cho hồ sơ ủy quyền này.',
        });
      }

      const updated = {
        ...target,
        snapshotPayload: nextPayload,
        updatedAt: nowIso,
      };
      if (updated.mandateCode) {
        memoryMandates.set(updated.mandateCode, updated);
      }

      if (supabaseConnected) {
        await sbPatch('steward_mandates', `id=eq.${encodeURIComponent(mandateId)}`, {
          snapshot_payload: nextPayload,
          updated_at: nowIso,
        });
      }

      return res.status(200).json({ ok: true, mandate: updated });
    }

    return res.status(400).json({ ok: false, error: 'Unsupported ecosystem action' });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
