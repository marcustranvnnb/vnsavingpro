/**
 * Parses JSON request bodies cleanly across both Vercel Serverless Runtime (req.body pre-parsed)
 * and raw Node IncomingMessage streams (Vite dev/preview middleware), enforcing a max payload size.
 */
export async function readJsonBody(req, { maxBytes = 128 * 1024 } = {}) {
  if (req.body && typeof req.body === 'object') {
    const encodedSize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    if (encodedSize > maxBytes) {
      const err = new Error('Payload too large');
      err.code = 'PAYLOAD_TOO_LARGE';
      throw err;
    }
    return req.body;
  }
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      const err = new Error('Payload too large');
      err.code = 'PAYLOAD_TOO_LARGE';
      throw err;
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}
