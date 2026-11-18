// ============================================================================
// Server-only Resend REST API client (Zero external dependencies)
// Used for transactional notifications or custom email delivery from Vercel `api/`.
// ============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 5000;

export function getResendConfig() {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || 'VnSavingPro <onboarding@resend.dev>').trim();
  return { apiKey, from };
}

export function isResendConfigured() {
  const { apiKey } = getResendConfig();
  return Boolean(apiKey && apiKey.startsWith('re_') && !apiKey.includes('your-'));
}

export async function sendResendEmail({ to, subject, html, text, replyTo } = {}) {
  if (!isResendConfigured()) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }
  const { apiKey, from } = getResendConfig();

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject: String(subject || '').slice(0, 200),
        html,
        text,
        reply_to: replyTo,
      }),
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(DEFAULT_TIMEOUT_MS) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.message || `Resend HTTP ${res.status}` };
    }
    return { ok: true, id: data?.id || null };
  } catch (err) {
    return { ok: false, error: err?.message || 'Resend request failed' };
  }
}
