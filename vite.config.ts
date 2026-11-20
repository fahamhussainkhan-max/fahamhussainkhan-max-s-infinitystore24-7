import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type ViteDevServer } from 'vite';

const MAX_API_BODY_BYTES = 8 * 1024 * 1024; // 8MB (supports product image uploads)

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_API_BODY_BYTES) {
        reject(Object.assign(new Error('Request payload too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('Invalid JSON request body.'), { statusCode: 400 }));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function createServerlessResponseAdapter(res: ServerResponse) {
  let statusCode = 200;
  const adapter = {
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return adapter;
    },
    setHeader(name: string, value: string) {
      if (!res.headersSent) {
        res.setHeader(name, value);
      }
    },
    json(data: any) {
      if (res.writableEnded) return;
      res.statusCode = statusCode;
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(data));
    },
    end(chunk?: any) {
      if (res.writableEnded) return;
      res.statusCode = statusCode;
      res.end(chunk);
    },
  };
  return adapter;
}

export default defineConfig(({ mode }) => {
  // Load server-side env vars (.env / .env.local) into Node process.env ONLY.
  // Vite still only exposes VITE_* variables to the client browser bundle.
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(loadedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-serverless-and-admin-rewrite',
        configureServer(server: ViteDevServer) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            const pathOnly = url.split('?')[0].split('#')[0];

            // 1. Mount /api/admin-action using the exact same Vercel serverless handler
            if (pathOnly === '/api/admin-action' || pathOnly === '/api/admin-action/') {
              const resAdapter = createServerlessResponseAdapter(res);
              try {
                const body = req.method === 'POST' ? await readJsonBody(req) : {};
                const mod = await server.ssrLoadModule('/api/admin-action.ts');
                const handler = mod?.default;
                if (typeof handler !== 'function') {
                  resAdapter.status(500).json({ error: 'Admin API handler failed to load.' });
                  return;
                }
                const queryObj: Record<string, string> = {};
                try {
                  const parsed = new URL(url, 'http://localhost');
                  parsed.searchParams.forEach((v, k) => {
                    queryObj[k] = v;
                  });
                } catch {}

                await handler(
                  {
                    method: req.method,
                    headers: req.headers,
                    body,
                    query: queryObj,
                  },
                  resAdapter
                );
                return;
              } catch (err: any) {
                const code = Number(err?.statusCode || 500);
                resAdapter.status(code).json({
                  error: err?.message || 'Admin API middleware error.',
                });
                return;
              }
            }

            // 2. Public storefront catalog proxy: /api/products
            if (pathOnly === '/api/products') {
              res.setHeader('Content-Type', 'application/json');
              try {
                const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
                  .trim()
                  .replace(/\/$/, '');
                const key = (
                  process.env.SUPABASE_SERVICE_ROLE_KEY ||
                  process.env.VITE_SUPABASE_ANON_KEY ||
                  ''
                ).trim();
                if (!supabaseUrl || !supabaseUrl.startsWith('http') || !key) {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ products: [] }));
                  return;
                }
                const targetUrl = `${supabaseUrl}/rest/v1/products?select=*&order=created_at.desc`;
                const resp = await fetch(targetUrl, {
                  headers: {
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                  },
                });
                const data = await resp.json();
                res.statusCode = resp.ok ? 200 : 500;
                res.end(JSON.stringify({ products: Array.isArray(data) ? data : [] }));
                return;
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || 'Failed to fetch products' }));
                return;
              }
            }

            // 3. Public storefront categories proxy: /api/categories
            if (pathOnly === '/api/categories') {
              res.setHeader('Content-Type', 'application/json');
              try {
                const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
                  .trim()
                  .replace(/\/$/, '');
                const key = (
                  process.env.SUPABASE_SERVICE_ROLE_KEY ||
                  process.env.VITE_SUPABASE_ANON_KEY ||
                  ''
                ).trim();
                if (!supabaseUrl || !supabaseUrl.startsWith('http') || !key) {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ categories: [] }));
                  return;
                }
                const targetUrl = `${supabaseUrl}/rest/v1/categories?select=*`;
                const resp = await fetch(targetUrl, {
                  headers: {
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                  },
                });
                const data = await resp.json();
                res.statusCode = resp.ok ? 200 : 500;
                res.end(JSON.stringify({ categories: Array.isArray(data) ? data : [] }));
                return;
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || 'Failed to fetch categories' }));
                return;
              }
            }

            // 4. Dedicated /admin entry point rewrite
            if (pathOnly === '/admin' || pathOnly === '/admin/' || pathOnly.startsWith('/admin/')) {
              req.url = '/admin.html';
            }
            next();
          });
        },
      },
    ],
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, 'index.html'),
          admin: path.resolve(import.meta.dirname, 'admin.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        react: path.resolve(import.meta.dirname, 'node_modules/react'),
        'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion', 'motion/react', 'motion'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
