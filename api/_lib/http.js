/**
 * Parses JSON request bodies cleanly across both Vercel Serverless Runtime (req.body pre-parsed)
 * and raw Node IncomingMessage streams (Vite dev/preview middleware).
 */
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}
