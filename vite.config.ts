import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import express from 'express';
import cors from 'cors';
import { apiRouter } from './server/api/routes.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-fallback',
      configureServer(server) {
        const app = express();
        app.use(cors());
        app.use(express.json());
        app.use('/api', apiRouter);

        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            try {
              const check = await fetch('http://localhost:5000/api/health', { signal: AbortSignal.timeout(200) });
              if (check.ok) {
                return next();
              }
            } catch {
              return app(req as any, res as any, next);
            }
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
