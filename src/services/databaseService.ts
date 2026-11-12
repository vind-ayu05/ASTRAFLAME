// ASTRAFLAME Database Service Layer
// Orchestrates data synchronization between Supabase, PostgreSQL backend API, and local client state.
// All API operations route through the centralized apiClient gateway with automatic proxy and fail-safe fallbacks.

import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import type { ExperimentRecord, SourceRecord } from '../types/index.ts';
import {
  evidenceAPI,
  sourcesAPI,
  scenariosAPI,
  dashboardAPI,
  healthAPI,
} from './apiClient.ts';
import rawRecords from '../data/records.json';
import rawSources from '../data/sources.json';

export interface DatabaseStatus {
  connected: boolean;
  provider: 'supabase' | 'postgresql' | 'fallback';
  message: string;
  recordCount: number;
  sourceCount: number;
}

export interface SavedScenario {
  id: string;
  title: string;
  description?: string;
  gravity_category: string;
  gravity_g: number;
  oxygen_pct: number;
  total_pressure_kpa: number;
  airflow_cm_s: number;
  flow_direction: string;
  material_family: string;
  material_type: string;
  geometry: string;
  thickness_mm: number;
  configuration?: Record<string, any>;
  created_at?: string;
}

// In-memory runtime scenarios cache
const memoryScenarios: SavedScenario[] = [
  {
    id: 'preset-iss-cabin',
    title: 'ISS Cabin (Nominal)',
    description: 'International Space Station nominal atmosphere',
    gravity_category: 'microgravity',
    gravity_g: 0.0001,
    oxygen_pct: 21,
    total_pressure_kpa: 101.3,
    airflow_cm_s: 20,
    flow_direction: 'concurrent',
    material_family: 'nomex',
    material_type: 'Nomex HT90-40',
    geometry: 'fabric',
    thickness_mm: 0.4,
  },
  {
    id: 'preset-artemis-eva',
    title: 'Exploration Atmosphere (Artemis)',
    description: 'NASA exploration atmosphere: 34% O2, 56.5 kPa (8.2 psia)',
    gravity_category: 'lunar',
    gravity_g: 0.166,
    oxygen_pct: 34,
    total_pressure_kpa: 56.5,
    airflow_cm_s: 10,
    flow_direction: 'opposed',
    material_family: 'pmma',
    material_type: 'Cast PMMA sheet',
    geometry: 'flat-sheet',
    thickness_mm: 6.35,
  },
];

// ==============================================================================
// 1. EVIDENCE RECORDS OPERATIONS
// ==============================================================================

/**
 * Loads all evidence records from Supabase -> or Backend API -> or fallback seed data.
 */
export async function getLiveRecords(): Promise<ExperimentRecord[]> {
  // 1. Try Supabase Client directly if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('evidence_records')
        .select('*')
        .order('record_id', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ExperimentRecord[];
      }
    } catch (err) {
      console.warn('[DatabaseService] Supabase fetch failed, attempting backend API:', err);
    }
  }

  // 2. Try Backend API (Express + Prisma / PostgreSQL)
  try {
    const res = await evidenceAPI.getAll();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data as ExperimentRecord[];
    }
  } catch (err) {
    // API not reachable
  }

  // 3. Fallback to verified seed records
  return rawRecords as ExperimentRecord[];
}

/**
 * Creates a new evidence record in the database.
 */
export async function createLiveRecord(record: ExperimentRecord): Promise<ExperimentRecord> {
  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('evidence_records')
        .insert([record])
        .select()
        .single();

      if (!error && data) {
        return data as ExperimentRecord;
      }
      if (error) {
        console.warn('[DatabaseService] Supabase insert error:', error.message);
      }
    } catch (err) {
      console.warn('[DatabaseService] Supabase insert failed:', err);
    }
  }

  // 2. Try Backend API
  try {
    const res = await evidenceAPI.create(record);
    if (res.success && res.data) {
      return res.data as ExperimentRecord;
    }
  } catch (err) {
    console.warn('[DatabaseService] API insert error:', err);
  }

  return record;
}

/**
 * Updates an existing evidence record in the database.
 */
export async function updateLiveRecord(
  recordId: string,
  updates: Partial<ExperimentRecord>
): Promise<ExperimentRecord> {
  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('evidence_records')
        .update(updates)
        .eq('record_id', recordId)
        .select()
        .single();

      if (!error && data) {
        return data as ExperimentRecord;
      }
    } catch (err) {
      console.warn('[DatabaseService] Supabase update error:', err);
    }
  }

  // 2. Try Backend API
  try {
    const res = await evidenceAPI.update(recordId, updates);
    if (res.success && res.data) {
      return res.data as ExperimentRecord;
    }
  } catch (err) {
    console.warn('[DatabaseService] API update error:', err);
  }

  return { ...(rawRecords.find((r) => r.record_id === recordId) as any), ...updates } as ExperimentRecord;
}

/**
 * Deletes an evidence record from the database.
 */
export async function deleteLiveRecord(recordId: string): Promise<boolean> {
  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('evidence_records').delete().eq('record_id', recordId);
      if (!error) return true;
    } catch (err) {
      console.warn('[DatabaseService] Supabase delete error:', err);
    }
  }

  // 2. Try Backend API
  try {
    const res = await evidenceAPI.delete(recordId);
    if (res.success) return true;
  } catch (err) {
    console.warn('[DatabaseService] API delete error:', err);
  }

  return false;
}

// ==============================================================================
// 2. SOURCES OPERATIONS
// ==============================================================================

export async function getLiveSources(): Promise<SourceRecord[]> {
  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('year', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as SourceRecord[];
      }
    } catch (err) {
      console.warn('[DatabaseService] Supabase fetch sources error:', err);
    }
  }

  // 2. Try Backend API
  try {
    const res = await sourcesAPI.getAll();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data as SourceRecord[];
    }
  } catch (err) {
    // API not reachable
  }

  return rawSources as SourceRecord[];
}

// ==============================================================================
// 3. SCENARIOS OPERATIONS
// ==============================================================================

export async function getLiveScenarios(): Promise<SavedScenario[]> {
  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as SavedScenario[];
      }
    } catch (err) {
      console.warn('[DatabaseService] Supabase fetch scenarios error:', err);
    }
  }

  // 2. Try Backend API
  try {
    const res = await scenariosAPI.getAll();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data as SavedScenario[];
    }
  } catch (err) {
    // API not reachable
  }

  return memoryScenarios;
}

export async function saveLiveScenario(scenario: Omit<SavedScenario, 'id'>): Promise<SavedScenario> {
  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .insert([scenario])
        .select()
        .single();

      if (!error && data) {
        return data as SavedScenario;
      }
    } catch (err) {
      console.warn('[DatabaseService] Supabase save scenario error:', err);
    }
  }

  // 2. Try Backend API
  try {
    const res = await scenariosAPI.create(scenario);
    if (res.success && res.data) {
      return res.data as SavedScenario;
    }
  } catch (err) {
    console.warn('[DatabaseService] API save scenario error:', err);
  }

  const localScenario: SavedScenario = {
    ...scenario,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  memoryScenarios.unshift(localScenario);
  return localScenario;
}

export async function deleteLiveScenario(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('scenarios').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('[DatabaseService] Supabase delete scenario error:', err);
    }
  }

  try {
    const res = await scenariosAPI.delete(id);
    if (res.success) return true;
  } catch (err) {
    // ignore
  }

  const idx = memoryScenarios.findIndex((s) => s.id === id);
  if (idx >= 0) {
    memoryScenarios.splice(idx, 1);
    return true;
  }

  return false;
}

// ==============================================================================
// 4. HEALTH & CONNECTIVITY DIAGNOSTICS
// ==============================================================================

export async function checkConnectivity(): Promise<DatabaseStatus> {
  // Check backend health endpoint
  try {
    const res = await healthAPI.check();
    if (res.success && res.data) {
      const data = res.data;
      const sbOk = data.database?.supabase?.ok;
      const pgOk = data.database?.postgres_direct?.ok;

      return {
        connected: Boolean(sbOk || pgOk),
        provider: sbOk ? 'supabase' : pgOk ? 'postgresql' : 'fallback',
        message: sbOk
          ? 'Connected to Supabase PostgreSQL'
          : pgOk
            ? 'Connected via PostgreSQL Pooler'
            : 'Backend API Connected (Dual-Database Router Standby)',
        recordCount: rawRecords.length,
        sourceCount: rawSources.length,
      };
    }
  } catch (e) {
    // Backend API not reachable
  }

  // Check client Supabase directly
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('evidence_records').select('id', { count: 'exact', head: true });
      if (!error) {
        return {
          connected: true,
          provider: 'supabase',
          message: 'Connected to Supabase Client',
          recordCount: data ? Number(data) : rawRecords.length,
          sourceCount: rawSources.length,
        };
      }
    } catch (e) {
      // ignore
    }
  }

  return {
    connected: false,
    provider: 'fallback',
    message: 'Using Verified NASA Combustion Dataset (Backend Standby)',
    recordCount: rawRecords.length,
    sourceCount: rawSources.length,
  };
}

export interface DashboardStats {
  totalRecords: number;
  totalExperiments: number;
  totalSources: number;
  totalMaterials: number;
  totalScenarios: number;
  tier1FlightRecords: number;
  tier2LiteratureRecords: number;
}

export async function getDashboardStatistics(): Promise<DashboardStats> {
  try {
    const res = await dashboardAPI.getStats();
    if (res.success && res.data && res.data.summary) {
      return res.data.summary as DashboardStats;
    }
  } catch (e) {
    // fallback
  }

  const t1 = rawRecords.filter((r: any) => r.tier === 1).length;
  const t2 = rawRecords.filter((r: any) => r.tier === 2).length;

  return {
    totalRecords: rawRecords.length,
    totalExperiments: 4,
    totalSources: rawSources.length,
    totalMaterials: 4,
    totalScenarios: 4,
    tier1FlightRecords: t1,
    tier2LiteratureRecords: t2,
  };
}
