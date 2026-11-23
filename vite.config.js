import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEV_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' ws: wss: https://gvgyztwpjvjvztwhwnue.supabase.co https://www.googletagmanager.com https://www.google-analytics.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";

/**
 * Attaches security headers + routes `/api/*` locally to Vercel serverless handlers.
 */
function vercelApiPlugin() {
  const routes = {
    '/api/rates': 'api/rates.js',
    '/api/calculate': 'api/calculate.js',
    '/api/feedback': 'api/feedback.js',
    '/api/plans': 'api/plans.js',
    '/api/history': 'api/history.js',
    '/api/quota-status': 'api/quota-status.js',
    '/api/cron/sync-rates': 'api/cron/sync-rates.js',
  };
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      res.setHeader('Content-Security-Policy', DEV_CSP);
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

      const route = req.url?.split('?')[0];
      const file = route ? routes[route] : null;
      if (!file) {
        return next();
      }
      const modUrl = pathToFileURL(path.resolve(process.cwd(), file)).href;
      try {
        const mod = await import(modUrl);
        const adapterRes = {
          setHeader: (k, v) => res.setHeader(k, v),
          status(code) {
            res.statusCode = code;
            return adapterRes;
          },
          json(obj) {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            res.end(JSON.stringify(obj));
            return adapterRes;
          },
        };
        await mod.default(req, adapterRes);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
      }
    });
  };
  return {
    name: 'vercel-api-local',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

/**
 * Generates Subresource Integrity (`sha384-...`) hashes for all local JS/CSS bundles
 * emitted into `dist/index.html` after Vite finishes writing output files.
 */
function viteSriPlugin() {
  const sriForAsset = (distDir, assetUrl) => {
    const cleanRel = assetUrl.replace(/^\//, '').split('?')[0];
    const absPath = path.resolve(distDir, cleanRel);
    if (!absPath.startsWith(distDir) || !fs.existsSync(absPath)) return null;
    const hash = crypto.createHash('sha384').update(fs.readFileSync(absPath)).digest('base64');
    return `sha384-${hash}`;
  };

  return {
    name: 'vite-build-sri',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      let html = fs.readFileSync(indexHtmlPath, 'utf8');

      html = html.replace(/<script\b([^>]*?)\bsrc="(\/assets\/[^"]+)"([^>]*)>/g, (full, pre, src, post) => {
        if (/\bintegrity="/.test(full)) return full;
        const integrity = sriForAsset(distDir, src);
        if (!integrity) return full;
        const hasCrossOrigin = /\bcrossorigin\b/.test(full);
        const corsAttr = hasCrossOrigin ? '' : ' crossorigin="anonymous"';
        return `<script${pre}src="${src}"${post} integrity="${integrity}"${corsAttr}>`;
      });

      html = html.replace(/<link\b([^>]*?)\bhref="(\/assets\/[^"]+)"([^>]*)>/g, (full, pre, href, post) => {
        if (!/\brel="(?:stylesheet|modulepreload)"/.test(full) || /\bintegrity="/.test(full)) return full;
        const integrity = sriForAsset(distDir, href);
        if (!integrity) return full;
        const hasCrossOrigin = /\bcrossorigin\b/.test(full);
        const corsAttr = hasCrossOrigin ? '' : ' crossorigin="anonymous"';
        return `<link${pre}href="${href}"${post} integrity="${integrity}"${corsAttr}>`;
      });

      fs.writeFileSync(indexHtmlPath, html, 'utf8');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'OWNER_ALERT_EMAIL',
    'POC_FORCE_LOCK',
  ]) {
    if (env[key] && !process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [react(), tailwindcss(), vercelApiPlugin(), viteSriPlugin()],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            charts: ['chart.js', 'react-chartjs-2'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
