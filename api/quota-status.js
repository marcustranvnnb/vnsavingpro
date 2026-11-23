import { checkAndTrackQuota, POC_VALIDATION_PAYLOAD } from './_lib/quotaGuard.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = String(req.headers?.authorization || '');
  const isAdmin =
    Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    Boolean(serviceKey && authHeader === `Bearer ${serviceKey}`);

  const forceRefresh = isAdmin || req.url?.includes('refresh=1');
  res.setHeader(
    'Cache-Control',
    isAdmin || forceRefresh ? 'no-store' : 'public, s-maxage=300, stale-while-revalidate=600'
  );
  const status = await checkAndTrackQuota({
    trackApiHit: false,
    forceRefresh: Boolean(forceRefresh),
  });

  const payload = {
    ok: !status.pocValidationReached,
    freeTierOnly: true,
    pocValidationReached: status.pocValidationReached,
    maxUsagePct: status.maxUsagePct,
    code: status.pocValidationReached ? POC_VALIDATION_PAYLOAD.code : 'OK',
    message: status.pocValidationReached ? POC_VALIDATION_PAYLOAD.message : 'All free-tier quotas healthy',
    messageVi: status.pocValidationReached
      ? POC_VALIDATION_PAYLOAD.messageVi
      : 'Hệ thống đang hoạt động ổn định trong hạn mức gói Miễn phí.',
  };

  if (isAdmin) {
    payload.metrics = status.metrics;
    payload.alertsTriggered = status.alertsTriggered;
    payload.syncedAt = status.syncedAt || new Date().toISOString();
  }

  return res.status(status.pocValidationReached ? 503 : 200).json(payload);
}
