// Express API Router for ASTRAFLAME backend
// Handles database operations, CRUD endpoints, and health checks.

import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkPostgresHealth, pool, isPostgresConfigured } from '../db/postgres.ts';
import { checkSecondaryPostgresHealth } from '../db/secondaryPostgres.ts';
import { checkSupabaseHealth, isSupabaseAdminConfigured } from '../db/supabaseAdmin.ts';
import { checkPrismaHealth } from '../db/prisma.ts';
import { getRoutingStatus, getFlammabilityAggregates } from '../db/router.ts';
import { getSyncStatus, processSyncQueue } from '../services/syncService.ts';
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

  const liveConfigured = isPostgresConfigured || isSupabaseAdminConfigured;
  const overallOk = pgHealth.ok || sbHealth.ok;

  res.status(200).json({
    status: overallOk ? 'healthy' : liveConfigured ? 'degraded' : 'standby',
    service: 'ASTRAFLAME Spacecraft Fire Intelligence API',
    timestamp: new Date().toISOString(),
    database: {
      primary: 'Supabase PostgreSQL',
      direct_orm: 'Prisma / PostgreSQL Pooler',
      supabase: sbHealth,
      postgres_direct: pgHealth,
      prisma: prismaHealth,
    },
    mode: liveConfigured ? 'live_database' : 'development_fallback',
  });
});

apiRouter.get('/health/database', async (_req: Request, res: Response) => {
  try {
    const [primaryPg, primarySb, secondaryPg, syncStatus, routing] = await Promise.all([
      checkPostgresHealth(),
      checkSupabaseHealth(),
      checkSecondaryPostgresHealth(),
      getSyncStatus(),
      getRoutingStatus(),
    ]);

    const isPrimaryHealthy = primaryPg.ok || primarySb.ok;
    const isSecondaryHealthy = secondaryPg.connected;

    res.json({
      success: true,
      status: isPrimaryHealthy ? 'healthy' : (isSecondaryHealthy ? 'degraded' : 'standby'),
      timestamp: new Date().toISOString(),
      primary: {
        provider: 'supabase_postgres',
        connected: isPrimaryHealthy,
        latencyMs: primaryPg.latencyMs || primarySb.latencyMs,
        details: {
          postgresPool: primaryPg,
          supabaseClient: primarySb,
        },
      },
      secondary: {
        provider: 'analytical_postgres',
        connected: isSecondaryHealthy,
        latencyMs: secondaryPg.latencyMs,
        pool: secondaryPg.pool,
        message: secondaryPg.message,
      },
      synchronization: syncStatus,
      routing,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// 1B. ANALYTICS & SYNCHRONIZATION ENDPOINTS
// ==============================================================================
apiRouter.get('/analytics/flammability', async (req: Request, res: Response) => {
  try {
    const materialId = req.query.materialId as string | undefined;
    const gravityLevel = req.query.gravityLevel as string | undefined;
    const data = await getFlammabilityAggregates({ materialId, gravityLevel });
    res.json({ success: true, count: data.length, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/sync/status', async (_req: Request, res: Response) => {
  try {
    const status = await getSyncStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/sync/trigger', async (_req: Request, res: Response) => {
  try {
    const result = await processSyncQueue();
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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

