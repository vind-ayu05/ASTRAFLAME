// ASTRAFLAME Data Synchronization Engine
// Implements Transactional Outbox Pattern, Idempotency, Retries, and Deduplication between
// Primary (Supabase PostgreSQL) and Secondary (Analytical PostgreSQL).

import crypto from 'crypto';
import { config } from '../config/index.ts';
import { query as queryPrimary, isPostgresConfigured as isPrimaryConfigured } from '../db/postgres.ts';
import { querySecondary, isSecondaryConfigured } from '../db/secondaryPostgres.ts';
import { fetchEvidenceRecords, fetchMaterials, fetchExperiments } from './dataService.ts';

export interface OutboxItem {
  id: string;
  entityType: string;
  sourceId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
  syncedAt: Date | null;
}

// In-memory outbox queue for standby mode and fast fallback tracking
const memoryOutboxQueue: OutboxItem[] = [];
let lastSyncTimestamp: Date | null = null;
let syncWorkerTimer: NodeJS.Timeout | null = null;
let isSyncRunning = false;

function computeHash(payload: any): string {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 32);
}

/**
 * Enqueue a change event into the transactional outbox on Primary.
 */
export async function queueOutboxEvent(
  entityType: string,
  sourceId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  payload: any = {}
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  if (isPrimaryConfigured) {
    try {
      await queryPrimary(
        `INSERT INTO sync_outbox (id, entity_type, source_id, action, payload, status, retry_count, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', 0, $6)`,
        [id, entityType, sourceId, action, JSON.stringify(payload), now]
      );
      return id;
    } catch (err: any) {
      console.warn('[Sync Outbox] Failed to write to DB outbox, falling back to memory queue:', err.message);
    }
  }

  // Standby in-memory fallback
  memoryOutboxQueue.push({
    id,
    entityType,
    sourceId,
    action,
    payload,
    status: 'pending',
    retryCount: 0,
    lastError: null,
    createdAt: now,
    syncedAt: null,
  });

  return id;
}

/**
 * Process pending outbox events and synchronize aggregates into the Secondary database.
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  if (isSyncRunning) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  isSyncRunning = true;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    let pendingItems: OutboxItem[] = [];

    if (isPrimaryConfigured) {
      try {
        const res = await queryPrimary<OutboxItem>(
          `SELECT id, entity_type as "entityType", source_id as "sourceId", action, payload, status,
                  retry_count as "retryCount", last_error as "lastError", created_at as "createdAt", synced_at as "syncedAt"
           FROM sync_outbox
           WHERE status = 'pending' AND retry_count < $1
           ORDER BY created_at ASC
           LIMIT $2`,
          [config.sync.maxRetries, config.sync.batchSize]
        );
        pendingItems = res.rows;
      } catch (err: any) {
        console.warn('[Sync Worker] Error reading outbox table:', err.message);
      }
    }

    // Merge in-memory queue items
    const memoryPending = memoryOutboxQueue.filter(
      (item) => item.status === 'pending' && item.retryCount < config.sync.maxRetries
    );
    pendingItems = [...pendingItems, ...memoryPending].slice(0, config.sync.batchSize);

    if (pendingItems.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    for (const item of pendingItems) {
      processed++;
      const payloadHash = computeHash(item.payload);

      try {
        if (isSecondaryConfigured) {
          // 1. Check idempotency: avoid reprocessing duplicate hashes
          const existingSync = await querySecondary(
            `SELECT id FROM analytics_sync_log WHERE source_record_id = $1 AND payload_hash = $2`,
            [item.sourceId, payloadHash]
          );

          if (existingSync.rows.length === 0) {
            // 2. Perform aggregate updates in Secondary Database
            if (item.entityType === 'evidence_record') {
              const p = item.payload;
              const materialId = p.material_id || p.materialId || 'unknown';
              const gravityLevel = p.gravity_level || p.gravityLevel || 'unknown';
              const flowSpeed = parseFloat(p.flow_speed_cms || p.flowSpeed || '0') || 0;
              const oxygenPct = parseFloat(p.oxygen_pct || p.oxygenPct || '0') || 0;
              const spreadRate = parseFloat(p.flame_spread_rate || p.spreadRate || '0') || 0;

              // Upsert flammability aggregates
              await querySecondary(
                `INSERT INTO flammability_aggregates 
                  (material_id, gravity_level, flow_speed_cms, oxygen_pct, record_count, avg_flame_spread_rate, min_flame_spread_rate, max_flame_spread_rate, last_synced_at)
                 VALUES ($1, $2, $3, $4, 1, $5, $5, $5, NOW())
                 ON CONFLICT (material_id, gravity_level, flow_speed_cms, oxygen_pct)
                 DO UPDATE SET
                   record_count = flammability_aggregates.record_count + 1,
                   avg_flame_spread_rate = (flammability_aggregates.avg_flame_spread_rate * flammability_aggregates.record_count + EXCLUDED.avg_flame_spread_rate) / (flammability_aggregates.record_count + 1),
                   min_flame_spread_rate = LEAST(flammability_aggregates.min_flame_spread_rate, EXCLUDED.min_flame_spread_rate),
                   max_flame_spread_rate = GREATEST(flammability_aggregates.max_flame_spread_rate, EXCLUDED.max_flame_spread_rate),
                   last_synced_at = NOW()`,
                [materialId, gravityLevel, flowSpeed, oxygenPct, spreadRate]
              );
            }

            // Refresh dashboard metrics summary on secondary
            const allRecords = await fetchEvidenceRecords();
            const allMaterials = await fetchMaterials();
            const allExperiments = await fetchExperiments();

            const total = allRecords.length;
            const verified = allRecords.filter((r) => r.verification_status === 'approved').length;
            const microG = allRecords.filter((r) => r.gravity_level === 'microgravity').length;
            const normalG = allRecords.filter((r) => r.gravity_level === '1g').length;

            await querySecondary(
              `INSERT INTO dashboard_metrics_summary
                (id, total_records, verified_records, microgravity_records, normal_gravity_records, total_materials, total_experiments, updated_at)
               VALUES ('primary_summary', $1, $2, $3, $4, $5, $6, NOW())
               ON CONFLICT (id)
               DO UPDATE SET
                total_records = EXCLUDED.total_records,
                verified_records = EXCLUDED.verified_records,
                microgravity_records = EXCLUDED.microgravity_records,
                normal_gravity_records = EXCLUDED.normal_gravity_records,
                total_materials = EXCLUDED.total_materials,
                total_experiments = EXCLUDED.total_experiments,
                updated_at = NOW()`,
              [total, verified, microG, normalG, allMaterials.length, allExperiments.length]
            );

            // Log successful sync
            await querySecondary(
              `INSERT INTO analytics_sync_log (source_record_id, entity_type, action, payload_hash, synced_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [item.sourceId, item.entityType, item.action, payloadHash]
            );
          }
        }

        // Mark item as synced in primary
        if (isPrimaryConfigured) {
          await queryPrimary(
            `UPDATE sync_outbox SET status = 'synced', synced_at = NOW(), last_error = NULL WHERE id = $1`,
            [item.id]
          );
        }

        item.status = 'synced';
        item.syncedAt = new Date();
        succeeded++;
      } catch (err: any) {
        failed++;
        const newRetry = item.retryCount + 1;
        const newStatus = newRetry >= config.sync.maxRetries ? 'failed' : 'pending';

        if (isPrimaryConfigured) {
          await queryPrimary(
            `UPDATE sync_outbox SET retry_count = $1, status = $2, last_error = $3 WHERE id = $4`,
            [newRetry, newStatus, err.message, item.id]
          );
        }

        item.retryCount = newRetry;
        item.status = newStatus;
        item.lastError = err.message;
        console.warn(`[Sync Worker] Item ${item.id} sync failed (retry ${newRetry}):`, err.message);
      }
    }

    lastSyncTimestamp = new Date();
  } finally {
    isSyncRunning = false;
  }

  return { processed, succeeded, failed };
}

/**
 * Return current sync engine health, pending counts, and timestamp.
 */
export async function getSyncStatus(): Promise<{
  status: 'active' | 'standby' | 'idle';
  pendingJobs: number;
  failedJobs: number;
  syncedJobs: number;
  lastSyncTimestamp: string | null;
  mode: string;
}> {
  let pendingCount = 0;
  let failedCount = 0;
  let syncedCount = 0;

  if (isPrimaryConfigured) {
    try {
      const res = await queryPrimary<{ status: string; count: string }>(
        `SELECT status, count(*) as count FROM sync_outbox GROUP BY status`
      );
      for (const row of res.rows) {
        if (row.status === 'pending') pendingCount += parseInt(row.count, 10);
        if (row.status === 'failed') failedCount += parseInt(row.count, 10);
        if (row.status === 'synced') syncedCount += parseInt(row.count, 10);
      }
    } catch (err: any) {
      console.warn('[Sync Status] Primary query error:', err.message);
    }
  }

  // Include in-memory numbers
  for (const item of memoryOutboxQueue) {
    if (item.status === 'pending') pendingCount++;
    if (item.status === 'failed') failedCount++;
    if (item.status === 'synced') syncedCount++;
  }

  const isConfigured = isPrimaryConfigured && isSecondaryConfigured;

  return {
    status: isConfigured ? (isSyncRunning ? 'active' : 'idle') : 'standby',
    pendingJobs: pendingCount,
    failedJobs: failedCount,
    syncedJobs: syncedCount,
    lastSyncTimestamp: lastSyncTimestamp ? lastSyncTimestamp.toISOString() : null,
    mode: isConfigured ? 'Dual-Database Outbox Worker' : 'Standby In-Memory Queue',
  };
}

/**
 * Start non-blocking periodic background sync worker.
 */
export function startSyncWorker(): void {
  if (syncWorkerTimer) return;
  syncWorkerTimer = setInterval(() => {
    processSyncQueue().catch((err) => {
      console.warn('[Sync Worker Background Error]:', err.message);
    });
  }, config.sync.intervalMs);
  console.log(`[Sync Worker] Started with interval: ${config.sync.intervalMs}ms`);
}

/**
 * Stop background sync worker.
 */
export function stopSyncWorker(): void {
  if (syncWorkerTimer) {
    clearInterval(syncWorkerTimer);
    syncWorkerTimer = null;
    console.log('[Sync Worker] Stopped.');
  }
}

