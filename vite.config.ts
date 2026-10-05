import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-proxy-and-admin-rewrite',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            const pathOnly = url.split('?')[0].split('#')[0];

            if (pathOnly === '/api/products') {
              res.setHeader('Content-Type', 'application/json');
              try {
                const targetUrl = 'https://egdbegaujzrzsbbstzsr.supabase.co/rest/v1/products?select=*&order=created_at.desc';
                const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')
                  ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
                  : 'sb_publishable_NFG335bM--1HEo9Mx27mmA_Rcw4qF_Q';
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

            if (pathOnly === '/api/categories') {
              res.setHeader('Content-Type', 'application/json');
              try {
                const targetUrl = 'https://egdbegaujzrzsbbstzsr.supabase.co/rest/v1/categories?select=*';
                const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')
                  ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
                  : 'sb_publishable_NFG335bM--1HEo9Mx27mmA_Rcw4qF_Q';
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

            if (pathOnly === '/admin' || pathOnly === '/admin/' || pathOnly.startsWith('/admin/')) {
              req.url = '/admin.html';
            }
            next();
          });
        },
      },
    ],
    build: {
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
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
