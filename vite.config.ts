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
      name: 'api-server',
      configureServer(server) {
        const app = express();
        app.use(cors());
        app.use(express.json());
        app.use('/api', apiRouter);
        server.middlewares.use(app);
      },
    },
  ],
  server: {
    port: 5173,
  },
});
