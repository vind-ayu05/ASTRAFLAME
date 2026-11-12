// ASTRAFLAME Intelligent Database Router
// Routes operational writes & critical reads to Primary (Supabase PostgreSQL),
// and heavy analytical/reporting workloads to Secondary (Analytical PostgreSQL).
// Features automatic failure isolation, fallback routing, and in-memory TTL caching.

import { config } from '../config/index.ts';
import { querySecondary, isSecondaryConfigured, checkSecondaryPostgresHealth } from './secondaryPostgres.ts';
import {
  fetchEvidenceRecords,
  fetchMaterials,
  fetchExperiments,
} from '../services/dataService.ts';

export interface DashboardMetrics {
  totalRecords: number;
  verifiedRecords: number;
  microgravityRecords: number;
  normalGravityRecords: number;
  totalMaterials: number;
  totalExperiments: number;
  source: 'secondary_postgres' | 'primary_fallback' | 'cache' | 'standby_seed';
  cachedAt?: string;
}

export interface FlammabilityAggregate {
  materialId: string;
  gravityLevel: string;
  flowSpeedCms: number;
  oxygenPct: number;
  recordCount: number;
  avgFlameSpreadRate: number;
  minFlameSpreadRate: number;
  maxFlameSpreadRate: number;
}

// In-Memory TTL Cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  source: string;
}

const cache = new Map<string, CacheEntry<any>>();
let cacheHits = 0;
let cacheMisses = 0;
let lastFallbackActive = false;

export function invalidateRouterCache(): void {
  cache.clear();
}

/**
 * Route heavy dashboard analytical statistics:
 * 1. Checks in-memory TTL cache.
 * 2. Attempts Secondary Analytical Database.
 * 3. Falls back to Primary Database calculation if Secondary is unavailable.
 */
export async function getDashboardAnalytics(): Promise<DashboardMetrics> {
  const cacheKey = 'dashboard_metrics_summary';
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    cacheHits++;
    return {
      ...cached.data,
      source: 'cache',
      cachedAt: new Date(cached.expiresAt - config.cache.analyticsTtlMs).toISOString(),
    };
  }

  cacheMisses++;

  // 1. Attempt Secondary Analytical Database if configured
  if (isSecondaryConfigured) {
    try {
      const res = await querySecondary(
        `SELECT total_records as "totalRecords",
                verified_records as "verifiedRecords",
                microgravity_records as "microgravityRecords",
                normal_gravity_records as "normalGravityRecords",
                total_materials as "totalMaterials",
                total_experiments as "totalExperiments"
         FROM dashboard_metrics_summary
         WHERE id = 'primary_summary'
         LIMIT 1`
      );

      if (res.rows.length > 0) {
        lastFallbackActive = false;
        const metrics: DashboardMetrics = {
          totalRecords: parseInt(res.rows[0].totalRecords, 10),
          verifiedRecords: parseInt(res.rows[0].verifiedRecords, 10),
          microgravityRecords: parseInt(res.rows[0].microgravityRecords, 10),
          normalGravityRecords: parseInt(res.rows[0].normalGravityRecords, 10),
          totalMaterials: parseInt(res.rows[0].totalMaterials, 10),
          totalExperiments: parseInt(res.rows[0].totalExperiments, 10),
          source: 'secondary_postgres',
        };

        cache.set(cacheKey, {
          data: metrics,
          expiresAt: Date.now() + config.cache.analyticsTtlMs,
          source: 'secondary_postgres',
        });

        return metrics;
      }
    } catch (err: any) {
      console.warn('[DB Router] Secondary analytics query failed, falling back to Primary:', err.message);
      lastFallbackActive = true;
    }
  } else {
    lastFallbackActive = false;
  }

  // 2. Primary / Standby Fallback calculation
  const allRecords = await fetchEvidenceRecords();
  const allMaterials = await fetchMaterials();
  const allExperiments = await fetchExperiments();

  const totalRecords = allRecords.length;
  const verifiedRecords = allRecords.filter((r) => r.verification_status === 'approved').length;
  const microgravityRecords = allRecords.filter((r) => r.gravity_level === 'microgravity').length;
  const normalGravityRecords = allRecords.filter((r) => r.gravity_level === '1g').length;

  const metrics: DashboardMetrics = {
    totalRecords,
    verifiedRecords,
    microgravityRecords,
    normalGravityRecords,
    totalMaterials: allMaterials.length,
    totalExperiments: allExperiments.length,
    source: isSecondaryConfigured ? 'primary_fallback' : 'standby_seed',
  };

  cache.set(cacheKey, {
    data: metrics,
    expiresAt: Date.now() + config.cache.analyticsTtlMs,
    source: metrics.source,
  });

  return metrics;
}

/**
 * Route flammability spread rate distribution aggregates.
 */
export async function getFlammabilityAggregates(filters: {
  materialId?: string;
  gravityLevel?: string;
} = {}): Promise<FlammabilityAggregate[]> {
  if (isSecondaryConfigured) {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (filters.materialId) {
        conditions.push(`material_id = $${i++}`);
        values.push(filters.materialId);
      }
      if (filters.gravityLevel) {
        conditions.push(`gravity_level = $${i++}`);
        values.push(filters.gravityLevel);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `
        SELECT material_id as "materialId",
               gravity_level as "gravityLevel",
               flow_speed_cms as "flowSpeedCms",
               oxygen_pct as "oxygenPct",
               record_count as "recordCount",
               avg_flame_spread_rate as "avgFlameSpreadRate",
               min_flame_spread_rate as "minFlameSpreadRate",
               max_flame_spread_rate as "maxFlameSpreadRate"
        FROM flammability_aggregates
        ${whereClause}
        ORDER BY material_id, gravity_level, flow_speed_cms ASC`;

      const res = await querySecondary<FlammabilityAggregate>(sql, values);
      if (res.rows.length > 0) {
        return res.rows;
      }
    } catch (err: any) {
      console.warn('[DB Router] Flammability aggregates secondary read failed, computing from Primary:', err.message);
    }
  }

  // Fallback: Compute on-the-fly from Primary evidence records
  const allRecords = await fetchEvidenceRecords();
  const filtered = allRecords.filter((r) => {
    const m = (r.material_id || r.material_family || '').toLowerCase();
    const g = (r.gravity_level || r.gravity_category || '').toLowerCase();

    if (filters.materialId && m !== filters.materialId.toLowerCase()) return false;
    if (filters.gravityLevel && g !== filters.gravityLevel.toLowerCase()) return false;
    return true;
  });

  const groupMap = new Map<string, { count: number; sum: number; min: number; max: number; mId: string; gL: string; flow: number; oxy: number }>();

  for (const r of filtered) {
    const mId = r.material_id || r.material_family || 'unknown';
    const gL = r.gravity_level || r.gravity_category || 'unknown';
    const flow = typeof r.flow_speed_cms === 'object' ? r.flow_speed_cms.value || 0 : parseFloat(r.flow_speed_cms ?? r.airflow_cm_s ?? '0') || 0;
    const oxy = typeof r.oxygen_pct === 'object' ? r.oxygen_pct.value || 0 : parseFloat(r.oxygen_pct ?? '0') || 0;
    const spread = typeof r.flame_spread_rate === 'object' ? r.flame_spread_rate.value || 0 : parseFloat(r.flame_spread_rate ?? r.spread_rate_mm_s ?? '0') || 0;

    const key = `${mId}_${gL}_${flow}_${oxy}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { count: 1, sum: spread, min: spread, max: spread, mId, gL, flow, oxy });
    } else {
      const g = groupMap.get(key)!;
      g.count++;
      g.sum += spread;
      g.min = Math.min(g.min, spread);
      g.max = Math.max(g.max, spread);
    }
  }

  return Array.from(groupMap.values()).map((g) => ({
    materialId: g.mId,
    gravityLevel: g.gL,
    flowSpeedCms: g.flow,
    oxygenPct: g.oxy,
    recordCount: g.count,
    avgFlameSpreadRate: g.sum / g.count,
    minFlameSpreadRate: g.min,
    maxFlameSpreadRate: g.max,
  }));
}

/**
 * Return live router metadata, cache statistics, and active policies.
 */
export async function getRoutingStatus() {
  const secondaryHealth = await checkSecondaryPostgresHealth();

  return {
    primaryEngine: 'supabase_postgres',
    secondaryEngine: 'analytical_postgres',
    isSecondaryConfigured,
    isSecondaryHealthy: secondaryHealth.connected,
    fallbackActive: lastFallbackActive || (!isSecondaryConfigured && false),
    cacheStats: {
      hits: cacheHits,
      misses: cacheMisses,
      cachedKeys: cache.size,
      ttlMs: config.cache.analyticsTtlMs,
    },
    routingPolicies: {
      transactionalWrites: 'primary_authoritative',
      criticalReads: 'primary_authoritative',
      dashboardAnalytics: isSecondaryConfigured && secondaryHealth.connected ? 'secondary_analytical' : 'primary_fallback',
      historicalAggregates: isSecondaryConfigured && secondaryHealth.connected ? 'secondary_analytical' : 'primary_fallback',
    },
  };
}
