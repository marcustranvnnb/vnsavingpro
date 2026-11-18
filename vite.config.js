import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Local dev/preview adapter so `/api/rates` and `/api/calculate` work identically
 * under `vite dev` / `vite preview` and in Vercel Serverless Functions.
 */
function vercelApiPlugin() {
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || (!req.url.startsWith('/api/rates') && !req.url.startsWith('/api/calculate'))) {
        return next();
      }
      const route = req.url.split('?')[0];
      const file = route === '/api/rates' ? 'api/rates.js' : 'api/calculate.js';
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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApiPlugin()],
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
        },
      },
    },
  },
});
