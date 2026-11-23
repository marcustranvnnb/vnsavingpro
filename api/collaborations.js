import { randomBytes, randomUUID } from 'node:crypto';
import { readJsonBody } from './_lib/http.js';
import {
  getUserFromBearerToken,
  isSupabaseConfigured,
  sbDelete,
  sbInsert,
  sbPatch,
  sbSelect,
} from './_lib/supabase.js';
import { isResendConfigured, sendResendEmail } from './_lib/resend.js';
import { checkAndTrackQuota, sendPocQuotaResponse, trackEmailSentQuota } from './_lib/quotaGuard.js';
import { createRateLimiter } from './_lib/rateLimit.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ALLOWED_MODES = new Set(['COUPLE', 'FAMILY']);
const ALLOWED_ROLES = new Set(['partner', 'family_member', 'viewer']);
const MAX_COLLABS_PER_OWNER = 15;
const collabLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 45, maxEntries: 2000 });

// In-memory store keyed by inviteCode for local dev or when Supabase table hasn't been migrated yet
const memoryCollabs = new Map();

function cleanStr(val, maxLen = 140) {
  return String(val ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function generateInviteCode(length = 8) {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

function normalizeEmail(raw) {
  const cleaned = cleanStr(raw, 160).toLowerCase();
  if (!cleaned) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return null;
  return cleaned;
}

function sanitizePayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  try {
    const json = JSON.stringify(raw);
    if (json.length <= 24_000) return JSON.parse(json);
  } catch {
    // fallback below
  }
  return {};
}

function formatCollabRow(row) {
  return {
    id: row.id,
    inviteCode: row.invite_code || row.inviteCode,
    ownerUserId: row.owner_user_id || row.ownerUserId,
    ownerDisplayName: row.owner_display_name || row.ownerDisplayName || '',
    memberUserId: row.member_user_id || row.memberUserId || null,
    memberDisplayName: row.member_display_name || row.memberDisplayName || '',
    invitedEmail: row.invited_email || row.invitedEmail || '',
    householdMode: row.household_mode || row.householdMode || 'COUPLE',
    role: row.role || 'partner',
    title: row.title || 'Kế hoạch tài chính chung',
    shareCode: row.share_code || row.shareCode || '',
    planPayload: row.plan_payload || row.planPayload || {},
    status: row.status || 'pending',
    expiresAt: row.expires_at || row.expiresAt || null,
    acceptedAt: row.accepted_at || row.acceptedAt || null,
    updatedAt: row.updated_at || row.updatedAt || row.created_at || null,
    createdAt: row.created_at || row.createdAt || null,
  };
}

function formatSafePreview(row) {
  const c = formatCollabRow(row);
  return {
    inviteCode: c.inviteCode,
    ownerDisplayName: c.ownerDisplayName || 'Thành viên VnSavingPro',
    householdMode: c.householdMode,
    role: c.role,
    title: c.title,
    status: c.status,
    expiresAt: c.expiresAt,
  };
}

function getAppOrigin(req) {
  const host = cleanStr(req.headers['x-forwarded-host'] || req.headers.host || '', 120);
  const proto = cleanStr(req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https'), 10);
  if (host) return `${proto}://${host}`;
  return 'https://vnsavingpro.vercel.app';
}

function isExpired(row) {
  const exp = row?.expires_at || row?.expiresAt;
  if (!exp) return false;
  const ts = new Date(exp).getTime();
  return !Number.isNaN(ts) && ts < Date.now();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (collabLimiter(req)) {
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  // Public safe metadata preview (?preview=INVITECODE) — omits PII & financial payloads
  if (req.method === 'GET' && req.query?.preview) {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) return sendPocQuotaResponse(res, quotaGuard);

    const previewCode = cleanStr(req.query.preview, 12).toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(previewCode)) {
      return res.status(400).json({ ok: false, error: 'Mã mời không hợp lệ.' });
    }

    let found = memoryCollabs.get(previewCode) || null;
    if (isSupabaseConfigured()) {
      const sbRes = await sbSelect(
        'household_collaborations',
        `invite_code=eq.${encodeURIComponent(previewCode)}&select=id,invite_code,owner_display_name,household_mode,role,title,status,expires_at&limit=1`
      );
      if (sbRes.ok && Array.isArray(sbRes.data) && sbRes.data[0]) {
        found = sbRes.data[0];
      }
    }

    if (!found || found.status === 'revoked' || isExpired(found)) {
      return res.status(404).json({ ok: false, error: 'Lời mời không tồn tại hoặc đã hết hạn.' });
    }

    return res.status(200).json({
      ok: true,
      preview: formatSafePreview(found),
    });
  }

  // All authenticated routes require a verified Supabase Bearer JWT
  const auth = await getUserFromBearerToken(req);
  if (!auth.ok || !auth.user?.id) {
    return res.status(401).json({ ok: false, error: 'Vui lòng đăng nhập để quản lý kế hoạch chung.' });
  }

  const user = auth.user;
  const userId = user.id;
  const userDisplayName =
    cleanStr(user.user_metadata?.full_name || user.email?.split('@')[0] || '', 80) || 'Thành viên VnSavingPro';
  const supabaseConnected = isSupabaseConfigured();

  if (req.method === 'GET') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) return sendPocQuotaResponse(res, quotaGuard);

    const memList = Array.from(memoryCollabs.values())
      .filter((r) => (r.owner_user_id === userId || r.member_user_id === userId) && r.status !== 'revoked')
      .map(formatCollabRow);

    if (supabaseConnected) {
      const sbRes = await sbSelect(
        'household_collaborations',
        `or=(owner_user_id.eq.${encodeURIComponent(userId)},member_user_id.eq.${encodeURIComponent(userId)})&status=neq.revoked&order=updated_at.desc&limit=30`
      );
      if (sbRes.ok && Array.isArray(sbRes.data)) {
        const items = sbRes.data.map(formatCollabRow);
        for (const row of sbRes.data) {
          memoryCollabs.set(row.invite_code, row);
        }
        return res.status(200).json({ ok: true, items, storage: 'supabase' });
      }
    }

    memList.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    return res.status(200).json({ ok: true, items: memList, storage: 'memory' });
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

    const action = cleanStr(body?.action || 'create', 24).toLowerCase();

    if (action === 'create') {
      const rawMode = cleanStr(body.householdMode || 'COUPLE', 20).toUpperCase();
      const householdMode = ALLOWED_MODES.has(rawMode) ? rawMode : 'COUPLE';
      const rawRole = cleanStr(body.role || 'partner', 24).toLowerCase();
      const role = ALLOWED_ROLES.has(rawRole) ? rawRole : 'partner';
      const title =
        cleanStr(body.title, 120) ||
        (householdMode === 'FAMILY' ? 'Kế hoạch Gia đình chung' : 'Kế hoạch Cặp đôi chung');
      const invitedEmail = normalizeEmail(body.invitedEmail || '');
      if (invitedEmail === null) {
        return res.status(400).json({ ok: false, error: 'Email người được mời không đúng định dạng.' });
      }
      const shareCode = cleanStr(body.shareCode || '', 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const planPayload = sanitizePayload(body.planPayload);

      // Enforce per-owner cap to keep storage predictable
      if (supabaseConnected) {
        const countRes = await sbSelect(
          'household_collaborations',
          `owner_user_id=eq.${encodeURIComponent(userId)}&status=neq.revoked&select=id`
        );
        if (countRes.ok && Array.isArray(countRes.data) && countRes.data.length >= MAX_COLLABS_PER_OWNER) {
          return res.status(400).json({
            ok: false,
            error: `Bạn đã tạo tối đa ${MAX_COLLABS_PER_OWNER} lời mời đang hoạt động. Vui lòng thu hồi bớt lời mời cũ.`,
          });
        }
      }

      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
      const inviteCode = generateInviteCode(8);
      const row = {
        id: `collab_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        invite_code: inviteCode,
        owner_user_id: userId,
        owner_display_name: userDisplayName,
        member_user_id: null,
        member_display_name: '',
        invited_email: invitedEmail,
        household_mode: householdMode,
        role,
        title,
        share_code: shareCode,
        plan_payload: planPayload,
        status: 'pending',
        expires_at: expiresAt,
        accepted_at: null,
        updated_at: nowIso,
        created_at: nowIso,
      };

      let saved = row;
      let storage = 'memory';
      memoryCollabs.set(inviteCode, row);

      if (supabaseConnected) {
        const insRes = await sbInsert('household_collaborations', row, true);
        if (insRes.ok && Array.isArray(insRes.data) && insRes.data[0]) {
          saved = insRes.data[0];
          memoryCollabs.set(saved.invite_code, saved);
          storage = 'supabase';
        }
      }

      let emailSent = false;
      const origin = getAppOrigin(req);
      const inviteUrl = `${origin}/profile?invite=${inviteCode}`;

      if (invitedEmail && isResendConfigured()) {
        try {
          const emailRes = await sendResendEmail({
            to: invitedEmail,
            subject: `[VnSavingPro] ${userDisplayName} mời bạn cùng lập "${title}"`,
            text: `${userDisplayName} mời bạn tham gia kế hoạch tiết kiệm chung "${title}" (${householdMode}) trên VnSavingPro.\n\nMã lời mời: ${inviteCode}\nMở liên kết để tham gia: ${inviteUrl}\n\nLời mời có hiệu lực trong 14 ngày.`,
            html: `
              <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#09090b;color:#f4f4f5;border-radius:16px;border:1px solid #27272a">
                <h2 style="margin:0 0 8px;color:#ffffff">Lời mời lập kế hoạch tài chính chung</h2>
                <p style="color:#a1a1aa;font-size:14px;line-height:1.6">
                  <strong style="color:#ffffff">${escapeHtml(userDisplayName)}</strong> đã mời bạn cùng hoạch định lộ trình
                  <strong style="color:#a5b4fc">${escapeHtml(title)}</strong> trên VnSavingPro.
                </p>
                <div style="margin:20px 0;padding:14px;background:#18181b;border-radius:12px;border:1px solid #27272a;text-align:center">
                  <div style="font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px">Mã lời mời</div>
                  <div style="font-size:24px;font-weight:700;letter-spacing:3px;color:#34d399;margin-top:4px">${inviteCode}</div>
                </div>
                <p style="text-align:center;margin:20px 0">
                  <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 22px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
                    Tham gia kế hoạch chung
                  </a>
                </p>
                <p style="font-size:12px;color:#71717a;margin:16px 0 0">Lời mời có hiệu lực 14 ngày.</p>
              </div>
            `,
          });
          if (emailRes?.ok) {
            emailSent = true;
            await trackEmailSentQuota();
          }
        } catch {
          // Non-fatal: link + inviteCode still returned to owner
        }
      }

      return res.status(200).json({
        ok: true,
        item: formatCollabRow(saved),
        inviteUrl,
        emailSent,
        storage,
      });
    }

    if (action === 'accept') {
      const inviteCode = cleanStr(body.inviteCode, 12).toUpperCase();
      if (!/^[A-Z0-9]{6,10}$/.test(inviteCode)) {
        return res.status(400).json({ ok: false, error: 'Mã lời mời không hợp lệ.' });
      }

      let target = memoryCollabs.get(inviteCode) || null;
      if (supabaseConnected) {
        const sbRes = await sbSelect(
          'household_collaborations',
          `invite_code=eq.${encodeURIComponent(inviteCode)}&limit=1`
        );
        if (sbRes.ok && Array.isArray(sbRes.data) && sbRes.data[0]) {
          target = sbRes.data[0];
        }
      }

      if (!target || target.status === 'revoked' || isExpired(target)) {
        return res.status(404).json({ ok: false, error: 'Lời mời không tồn tại, đã hết hạn hoặc bị thu hồi.' });
      }
      if (target.owner_user_id === userId) {
        return res.status(400).json({ ok: false, error: 'Bạn là người tạo lời mời này. Hãy gửi link hoặc mã này cho người đồng hành.' });
      }
      if (target.member_user_id && target.member_user_id !== userId) {
        return res.status(409).json({ ok: false, error: 'Lời mời này đã được một thành viên khác tham gia.' });
      }

      const nowIso = new Date().toISOString();
      const updatedMem = {
        ...target,
        member_user_id: userId,
        member_display_name: userDisplayName,
        status: 'active',
        accepted_at: nowIso,
        updated_at: nowIso,
      };
      memoryCollabs.set(inviteCode, updatedMem);

      let saved = updatedMem;
      let storage = 'memory';
      if (supabaseConnected) {
        const patchRes = await sbPatch(
          'household_collaborations',
          `invite_code=eq.${encodeURIComponent(inviteCode)}&status=neq.revoked`,
          {
            member_user_id: userId,
            member_display_name: userDisplayName,
            status: 'active',
            accepted_at: nowIso,
            updated_at: nowIso,
          }
        );
        if (patchRes.ok && Array.isArray(patchRes.data) && patchRes.data[0]) {
          saved = patchRes.data[0];
          memoryCollabs.set(inviteCode, saved);
          storage = 'supabase';
        }
      }

      return res.status(200).json({
        ok: true,
        item: formatCollabRow(saved),
        storage,
      });
    }

    if (action === 'sync') {
      const collabId = cleanStr(body.collabId, 80);
      if (!collabId) {
        return res.status(400).json({ ok: false, error: 'Missing collabId' });
      }

      let existing =
        Array.from(memoryCollabs.values()).find((r) => r.id === collabId) || null;

      if (supabaseConnected) {
        const sbRes = await sbSelect(
          'household_collaborations',
          `id=eq.${encodeURIComponent(collabId)}&or=(owner_user_id.eq.${encodeURIComponent(userId)},member_user_id.eq.${encodeURIComponent(userId)})&limit=1`
        );
        if (sbRes.ok && Array.isArray(sbRes.data) && sbRes.data[0]) {
          existing = sbRes.data[0];
        }
      }

      if (!existing || existing.status === 'revoked') {
        return res.status(404).json({ ok: false, error: 'Không tìm thấy không gian kế hoạch chung.' });
      }
      if (existing.owner_user_id !== userId && existing.member_user_id !== userId) {
        return res.status(403).json({ ok: false, error: 'Bạn không có quyền đồng bộ kế hoạch này.' });
      }
      if (existing.owner_user_id !== userId && existing.role === 'viewer') {
        return res.status(403).json({ ok: false, error: 'Vai trò của bạn chỉ được phép xem kế hoạch chung.' });
      }

      const nowIso = new Date().toISOString();
      const nextFields = {
        updated_at: nowIso,
      };
      if (body.planPayload && typeof body.planPayload === 'object') {
        nextFields.plan_payload = sanitizePayload(body.planPayload);
      }
      if (body.title) {
        nextFields.title = cleanStr(body.title, 120) || existing.title;
      }
      if (body.shareCode !== undefined) {
        nextFields.share_code = cleanStr(body.shareCode, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
      }

      const merged = { ...existing, ...nextFields };
      if (merged.invite_code) memoryCollabs.set(merged.invite_code, merged);

      let saved = merged;
      let storage = 'memory';
      if (supabaseConnected) {
        const patchRes = await sbPatch(
          'household_collaborations',
          `id=eq.${encodeURIComponent(collabId)}`,
          nextFields
        );
        if (patchRes.ok && Array.isArray(patchRes.data) && patchRes.data[0]) {
          saved = patchRes.data[0];
          memoryCollabs.set(saved.invite_code, saved);
          storage = 'supabase';
        }
      }

      return res.status(200).json({ ok: true, item: formatCollabRow(saved), storage });
    }

    return res.status(400).json({ ok: false, error: 'Unsupported action' });
  }

  if (req.method === 'DELETE') {
    const quotaGuard = await checkAndTrackQuota({ trackApiHit: true });
    if (quotaGuard.blocked) return sendPocQuotaResponse(res, quotaGuard);

    const id = cleanStr(req.query?.id, 80);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Missing id query parameter' });
    }

    for (const [code, row] of memoryCollabs.entries()) {
      if (row.id === id && (row.owner_user_id === userId || row.member_user_id === userId)) {
        memoryCollabs.delete(code);
      }
    }

    if (supabaseConnected) {
      const checkRes = await sbSelect(
        'household_collaborations',
        `id=eq.${encodeURIComponent(id)}&select=id,owner_user_id,member_user_id&limit=1`
      );
      const row = checkRes.ok && Array.isArray(checkRes.data) ? checkRes.data[0] : null;
      if (row) {
        if (row.owner_user_id === userId) {
          await sbDelete('household_collaborations', `id=eq.${encodeURIComponent(id)}&owner_user_id=eq.${encodeURIComponent(userId)}`);
        } else if (row.member_user_id === userId) {
          await sbPatch('household_collaborations', `id=eq.${encodeURIComponent(id)}&member_user_id=eq.${encodeURIComponent(userId)}`, {
            status: 'revoked',
            updated_at: new Date().toISOString(),
          });
        } else {
          return res.status(403).json({ ok: false, error: 'Không có quyền thu hồi lời mời này.' });
        }
      }
    }

    return res.status(200).json({ ok: true, deletedId: id });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
