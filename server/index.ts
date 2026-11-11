// ASTRAFLAME Express Backend Server
import express from 'express';
import cors from 'cors';
import { config } from './config/index.ts';
import { apiRouter } from './api/routes.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();
const PORT = config.port;

app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));

// Mount API router
app.use('/api', apiRouter);

// Centralized error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[ASTRAFLAME Backend] Running on http://localhost:${PORT}`);
    console.log(`[ASTRAFLAME Backend] Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`[ASTRAFLAME Backend] Dashboard stats: http://localhost:${PORT}/api/dashboard/stats`);
  });
}

export default app;

