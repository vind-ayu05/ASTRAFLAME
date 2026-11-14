// Express API Router for ASTRAFLAME backend
// Handles database operations, CRUD endpoints, security guards, and health checks.

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
import { chatRouter } from '../routes/chatRoutes.ts';
import { rateLimiter, adminRateLimiter } from '../middleware/rateLimiter.ts';
import { requireAuth, optionalAuth, requireRole } from '../middleware/authMiddleware.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { validateEvidenceInput, validateScenarioInput } from '../middleware/validation.ts';
import { cacheMiddleware, analyticsCacheMiddleware, getCacheStats, invalidateCache } from '../middleware/cache.ts';
import { getBlocklist, unblockIp } from '../middleware/ipBlocklist.ts';
import { getMonitorStats } from '../middleware/securityMonitor.ts';
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

// Apply global rate limiting & modular routes
apiRouter.use(rateLimiter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/storage', storageRouter);
apiRouter.use('/chat', chatRouter);

// ==============================================================================
// 1. HEALTH CHECK & STATUS ENDPOINT
// ==============================================================================
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
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
  } catch {
    res.status(500).json({
      status: 'error',
      service: 'ASTRAFLAME Spacecraft Fire Intelligence API',
      timestamp: new Date().toISOString(),
    });
  }
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
      status: isPrimaryHealthy ? 'healthy' : isSecondaryHealthy ? 'degraded' : 'standby',
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
  } catch {
    res.status(500).json({ success: false, error: 'Database diagnostics check failed.' });
  }
});

// ==============================================================================
// 1B. ANALYTICS & SYNCHRONIZATION ENDPOINTS
// ==============================================================================
apiRouter.get('/analytics/flammability', analyticsCacheMiddleware(), async (req: Request, res: Response) => {
  try {
    const materialId = req.query.materialId as string | undefined;
    const gravityLevel = req.query.gravityLevel as string | undefined;
    const data = await getFlammabilityAggregates({ materialId, gravityLevel });
    res.json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to retrieve flammability analytics.' });
  }
});

apiRouter.get('/sync/status', async (_req: Request, res: Response) => {
  try {
    const status = await getSyncStatus();
    res.json({ success: true, data: status });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to retrieve synchronization status.' });
  }
});

// Trigger synchronization requires curator or admin privileges
apiRouter.post(
  '/sync/trigger',
  requireAuth,
  requireRole('admin', 'curator'),
  adminRateLimiter,
  async (_req: Request, res: Response) => {
    try {
      const result = await processSyncQueue();
      res.json({ success: true, data: result });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to trigger synchronization queue.' });
    }
  }
);

// ==============================================================================
// 2. EVIDENCE RECORDS CRUD
// ==============================================================================
// Public read access for scientific evidence records
apiRouter.get('/evidence', cacheMiddleware(), async (_req: Request, res: Response) => {
  try {
    const data = await fetchEvidenceRecords();
    res.json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch evidence records.' });
  }
});

apiRouter.get('/evidence/:recordId', async (req: Request, res: Response) => {
  try {
    const record = await fetchEvidenceRecordById(String(req.params.recordId));
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: record });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch evidence record.' });
  }
});

// Creation requires authenticated admin or curator role
apiRouter.post(
  '/evidence',
  requireAuth,
  requireRole('admin', 'curator'),
  validateEvidenceInput,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = req.body;
      const created = await insertEvidenceRecord(body, req.ip);
      invalidateCache('/api/evidence');
      res.status(201).json({ success: true, data: created });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to create evidence record.' });
    }
  }
);

// Updates require authenticated admin or curator role
apiRouter.put(
  '/evidence/:recordId',
  requireAuth,
  requireRole('admin', 'curator'),
  validateEvidenceInput,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await updateEvidenceRecord(String(req.params.recordId), req.body, req.ip);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      res.status(500).json({ success: false, error: 'Failed to update evidence record.' });
    }
  }
);

// Deletions require authenticated admin or curator role
apiRouter.delete(
  '/evidence/:recordId',
  requireAuth,
  requireRole('admin', 'curator'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await deleteEvidenceRecord(String(req.params.recordId), req.ip);
      res.json({ success });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to delete evidence record.' });
    }
  }
);

// ==============================================================================
// 3. SOURCES
// ==============================================================================
apiRouter.get('/sources', cacheMiddleware(), async (_req: Request, res: Response) => {
  try {
    const data = await fetchSources();
    res.json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch sources.' });
  }
});

// ==============================================================================
// 4. EXPERIMENTS & MATERIALS
// ==============================================================================
apiRouter.get('/experiments', cacheMiddleware(), async (_req: Request, res: Response) => {
  try {
    const data = await fetchExperiments();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch experiments.' });
  }
});

apiRouter.get('/materials', cacheMiddleware(), async (_req: Request, res: Response) => {
  try {
    const data = await fetchMaterials();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch materials.' });
  }
});

// ==============================================================================
// 5. SCENARIOS CRUD
// ==============================================================================
apiRouter.get('/scenarios', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const data = await fetchScenarios();
    res.json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch scenarios.' });
  }
});

apiRouter.post('/scenarios', optionalAuth, validateScenarioInput, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    if (req.user?.id) {
      body.user_id = req.user.id;
    }
    const created = await insertScenario(body, req.ip);
    res.status(201).json({ success: true, data: created });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to save scenario.' });
  }
});

apiRouter.delete('/scenarios/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await deleteScenario(String(req.params.id), req.ip);
    res.json({ success });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete scenario.' });
  }
});

// ==============================================================================
// 6. AUDIT LOGS (Restricted to Administrators & Curators)
// ==============================================================================
apiRouter.get(
  '/audit-logs',
  requireAuth,
  requireRole('admin', 'curator'),
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
      const data = await fetchAuditLogs(limit);
      res.json({ success: true, count: data.length, data });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
    }
  }
);

// ==============================================================================
// 7. DATABASE MIGRATIONS RUNNER (Strictly restricted to Admin role)
// ==============================================================================
apiRouter.post(
  '/database/migrate',
  requireAuth,
  requireRole('admin'),
  adminRateLimiter,
  async (_req: Request, res: Response) => {
    if (!isPostgresConfigured) {
      return res.status(400).json({
        success: false,
        error: 'DATABASE_URL or DIRECT_URL is not configured in .env.',
      });
    }

    const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
    const migrationFiles = [
      '20261111000001_create_astraflame_schema.sql',
      '20261111000002_seed_astraflame_data.sql',
      '20261111000003_rls_and_security.sql',
      '20261114000001_security_hardening.sql',
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
      res.status(500).json({
        success: false,
        error: 'Database migration execution failed.',
        code: 'MIGRATION_ERROR',
      });
    }
  }
);


// ==============================================================================
// 8. ADMIN SECURITY MANAGEMENT ENDPOINTS
// ==============================================================================

// GET  /api/admin/blocklist  – List currently blocked IPs
apiRouter.get(
  '/admin/blocklist',
  requireAuth,
  requireRole('admin'),
  adminRateLimiter,
  (_req: Request, res: Response) => {
    res.json({ success: true, data: getBlocklist() });
  }
);

// DELETE /api/admin/blocklist/:ip – Manually unblock an IP
apiRouter.delete(
  '/admin/blocklist/:ip',
  requireAuth,
  requireRole('admin'),
  adminRateLimiter,
  (req: Request, res: Response) => {
    const ip = decodeURIComponent(String(req.params.ip));
    const removed = unblockIp(ip);
    res.json({ success: true, unblocked: removed });
  }
);

// GET /api/admin/security/stats – Security monitor + cache stats
apiRouter.get(
  '/admin/security/stats',
  requireAuth,
  requireRole('admin'),
  adminRateLimiter,
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        monitor: getMonitorStats(),
        cache: getCacheStats(),
        blocklist: { count: getBlocklist().length },
      },
    });
  }
);
