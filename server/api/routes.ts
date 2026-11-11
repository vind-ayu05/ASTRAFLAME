// Express API Router for ASTRAFLAME backend
// Handles database operations, CRUD endpoints, and health checks.

import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkPostgresHealth, pool, isPostgresConfigured } from '../db/postgres.ts';
import { checkSupabaseHealth, isSupabaseAdminConfigured } from '../db/supabaseAdmin.ts';
import { checkPrismaHealth } from '../db/prisma.ts';
import { authRouter } from '../routes/authRoutes.ts';
import { dashboardRouter } from '../routes/dashboardRoutes.ts';
import { storageRouter } from '../routes/storageRoutes.ts';
import { rateLimiter } from '../middleware/rateLimiter.ts';
import {
  fetchEvidenceRecords,
  fetchEvidenceRecordById,
  insertEvidenceRecord,
  updateEvidenceRecord,
  deleteEvidenceRecord,
  fetchSources,
  fetchExperiments,
  fetchMaterials,
  fetchScenarios,
  insertScenario,
  deleteScenario,
  fetchAuditLogs,
} from '../services/dataService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const apiRouter = Router();

// Apply rate limiting & modular routes
apiRouter.use(rateLimiter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/storage', storageRouter);

// ==============================================================================
// 1. HEALTH CHECK & STATUS ENDPOINT
// ==============================================================================
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const [pgHealth, sbHealth, prismaHealth] = await Promise.all([
    checkPostgresHealth(),
    checkSupabaseHealth(),
    checkPrismaHealth(),
  ]);

  const overallOk = pgHealth.ok || sbHealth.ok;

  res.status(overallOk ? 200 : 503).json({
    status: overallOk ? 'healthy' : 'degraded',
    service: 'ASTRAFLAME Spacecraft Fire Intelligence API',
    timestamp: new Date().toISOString(),
    database: {
      primary: 'Supabase PostgreSQL',
      direct_orm: 'Prisma / PostgreSQL Pooler',
      supabase: sbHealth,
      postgres_direct: pgHealth,
      prisma: prismaHealth,
    },
    mode: isPostgresConfigured || isSupabaseAdminConfigured ? 'live_database' : 'development_fallback',
  });
});

// ==============================================================================
// 2. EVIDENCE RECORDS CRUD
// ==============================================================================
apiRouter.get('/evidence', async (_req: Request, res: Response) => {
  try {
    const data = await fetchEvidenceRecords();
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/evidence/:recordId', async (req: Request, res: Response) => {
  try {
    const record = await fetchEvidenceRecordById(String(req.params.recordId));
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/evidence', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || !body.record_id || !body.investigation) {
      return res.status(400).json({ success: false, error: 'Missing required fields (record_id, investigation)' });
    }
    const created = await insertEvidenceRecord(body, req.ip);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/evidence/:recordId', async (req: Request, res: Response) => {
  try {
    const updated = await updateEvidenceRecord(String(req.params.recordId), req.body, req.ip);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/evidence/:recordId', async (req: Request, res: Response) => {
  try {
    const success = await deleteEvidenceRecord(String(req.params.recordId), req.ip);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 3. SOURCES
// ==============================================================================
apiRouter.get('/sources', async (_req: Request, res: Response) => {
  try {
    const data = await fetchSources();
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 4. EXPERIMENTS & MATERIALS
// ==============================================================================
apiRouter.get('/experiments', async (_req: Request, res: Response) => {
  try {
    const data = await fetchExperiments();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/materials', async (_req: Request, res: Response) => {
  try {
    const data = await fetchMaterials();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 5. SCENARIOS CRUD
// ==============================================================================
apiRouter.get('/scenarios', async (_req: Request, res: Response) => {
  try {
    const data = await fetchScenarios();
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || !body.title || !body.gravity_category) {
      return res.status(400).json({ success: false, error: 'Missing required scenario fields (title, gravity_category)' });
    }
    const created = await insertScenario(body, req.ip);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const success = await deleteScenario(String(req.params.id), req.ip);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 6. AUDIT LOGS
// ==============================================================================
apiRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await fetchAuditLogs(limit);
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 7. DATABASE MIGRATIONS RUNNER
// ==============================================================================
apiRouter.post('/database/migrate', async (_req: Request, res: Response) => {
  if (!isPostgresConfigured) {
    return res.status(400).json({
      success: false,
      error: 'DATABASE_URL or DIRECT_URL is not configured. Please supply connection details in .env.',
    });
  }

  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
  const migrationFiles = [
    '20261111000001_create_astraflame_schema.sql',
    '20261111000002_seed_astraflame_data.sql',
    '20261111000003_rls_and_security.sql',
  ];

  const results: any[] = [];

  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf-8');
        await pool.query(sql);
        results.push({ file, status: 'applied' });
      } else {
        results.push({ file, status: 'not_found' });
      }
    }
    res.json({ success: true, applied: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, partial_results: results });
  }
});

