// Unified Data Service for ASTRAFLAME
// Handles data retrieval, persistence, and CRUD operations across Supabase and PostgreSQL.
// Falls back seamlessly to curated seed records when external DB is not yet connected.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, isPostgresConfigured } from '../db/postgres.ts';
import { supabaseAdmin, supabasePublic } from '../db/supabaseAdmin.ts';
import { queueOutboxEvent } from './syncService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback seed data
const fallbackRecordsPath = path.resolve(__dirname, '../../src/data/records.json');
const fallbackSourcesPath = path.resolve(__dirname, '../../src/data/sources.json');

let seedRecords: any[] = [];
let seedSources: any[] = [];

try {
  seedRecords = JSON.parse(fs.readFileSync(fallbackRecordsPath, 'utf-8'));
  seedSources = JSON.parse(fs.readFileSync(fallbackSourcesPath, 'utf-8'));
} catch (e) {
  console.warn('[DataService] Notice: Could not read static seed files from disk:', e);
}

// In-memory runtime cache/store for new records created during dev when no DB is connected
const memoryRecords = [...seedRecords];
const memoryScenarios: any[] = [
  {
    id: 'preset-iss-cabin',
    title: 'ISS Cabin',
    description: 'International Space Station nominal atmosphere',
    gravity_category: 'microgravity',
    gravity_g: 0.0001,
    oxygen_pct: 21,
    total_pressure_kpa: 101.3,
    airflow_cm_s: 20,
    flow_direction: 'concurrent',
    material_family: 'sib',
    material_type: 'SIBAL fabric',
    geometry: 'flat-sheet',
    thickness_mm: 2.1,
    configuration: { preset: 'iss-cabin' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'preset-lunar-habitat',
    title: 'Lunar Habitat',
    description: 'Artemis lunar surface habitat baseline',
    gravity_category: 'lunar',
    gravity_g: 0.16,
    oxygen_pct: 21,
    total_pressure_kpa: 50,
    airflow_cm_s: 20,
    flow_direction: 'concurrent',
    material_family: 'sib',
    material_type: 'SIBAL fabric',
    geometry: 'flat-sheet',
    thickness_mm: 2.1,
    configuration: { preset: 'lunar-habitat' },
    created_at: new Date().toISOString(),
  },
];
const memoryAuditLogs: any[] = [];

// ==============================================================================
// 1. AUDIT LOGGING
// ==============================================================================
export async function recordAuditLog(
  action: string,
  tableName: string,
  recordId: string,
  details: any = {},
  userId?: string,
  ipAddress?: string
) {
  const logEntry = {
    user_id: userId || null,
    action,
    table_name: tableName,
    record_id: recordId,
    details,
    ip_address: ipAddress || null,
    created_at: new Date().toISOString(),
  };

  if (isPostgresConfigured) {
    try {
      await query(
        `INSERT INTO public.audit_logs (user_id, action, table_name, record_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [logEntry.user_id, logEntry.action, logEntry.table_name, logEntry.record_id, JSON.stringify(logEntry.details), logEntry.ip_address]
      );
      return;
    } catch (e: any) {
      console.warn('[AuditLog] Direct DB insert failed, falling back to memory/supabase:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      await client.from('audit_logs').insert([logEntry]);
      return;
    } catch (e: any) {
      console.warn('[AuditLog] Supabase insert failed:', e.message);
    }
  }

  memoryAuditLogs.unshift({ id: `mem-${Date.now()}`, ...logEntry });
}

// ==============================================================================
// 2. EVIDENCE RECORDS (CRUD)
// ==============================================================================

export async function fetchEvidenceRecords(): Promise<any[]> {
  // Strategy 1: PostgreSQL direct via pool
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.evidence_records ORDER BY record_id ASC');
      if (res.rows.length > 0) return res.rows;
    } catch (e: any) {
      console.warn('[DataService] Direct PostgreSQL fetch error, falling back:', e.message);
    }
  }

  // Strategy 2: Supabase API
  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('evidence_records').select('*').order('record_id', { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetch error, falling back:', e.message);
    }
  }

  // Strategy 3: In-memory fallback
  return memoryRecords;
}

export async function fetchEvidenceRecordById(recordId: string): Promise<any | null> {
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.evidence_records WHERE record_id = $1 LIMIT 1', [recordId]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL fetch by id error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('evidence_records').select('*').eq('record_id', recordId).single();
      if (!error && data) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetch by id error:', e.message);
    }
  }

  return memoryRecords.find((r) => r.record_id === recordId) || null;
}

export async function insertEvidenceRecord(record: any, clientIp?: string): Promise<any> {
  const recordId = record.record_id;

  if (isPostgresConfigured) {
    try {
      const fields = [
        'record_id', 'investigation', 'sample_id', 'material_family', 'material_type',
        'geometry', 'gravity_category', 'gravity_g', 'oxygen_pct', 'total_pressure_kpa',
        'airflow_cm_s', 'flow_direction', 'thickness_mm', 'width_cm', 'length_cm',
        'free_volume_m3', 'spread_rate_mm_s', 'burn_length_cm', 'heat_release_peak_w',
        'co_increase_ppm', 'co2_increase_ppm', 'outcome', 'confidence', 'tier',
        'review_status', 'source_id', 'notes'
      ];
      const values = fields.map((f) => {
        const val = record[f];
        return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
      });
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

      const res = await query(
        `INSERT INTO public.evidence_records (${fields.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );

      await recordAuditLog('INSERT', 'evidence_records', recordId, { investigation: record.investigation }, undefined, clientIp);
      queueOutboxEvent('evidence_record', recordId, 'INSERT', res.rows[0]).catch(() => {});
      return res.rows[0];
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL insert failed, trying Supabase:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('evidence_records').insert([record]).select().single();
      if (!error && data) {
        await recordAuditLog('INSERT', 'evidence_records', recordId, { investigation: record.investigation }, undefined, clientIp);
        queueOutboxEvent('evidence_record', recordId, 'INSERT', data).catch(() => {});
        return data;
      }
    } catch (e: any) {
      console.warn('[DataService] Supabase insert failed:', e.message);
    }
  }

  // Memory fallback
  const existingIdx = memoryRecords.findIndex((r) => r.record_id === recordId);
  if (existingIdx >= 0) {
    memoryRecords[existingIdx] = record;
  } else {
    memoryRecords.push(record);
  }
  await recordAuditLog('INSERT', 'evidence_records', recordId, { storage: 'memory' }, undefined, clientIp);
  queueOutboxEvent('evidence_record', recordId, 'INSERT', record).catch(() => {});
  return record;
}

export async function updateEvidenceRecord(recordId: string, updates: any, clientIp?: string): Promise<any> {
  if (isPostgresConfigured) {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let i = 1;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'id' || key === 'record_id' || key === 'created_at') continue;
        setClauses.push(`${key} = $${i++}`);
        values.push(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
      }
      values.push(recordId);

      const res = await query(
        `UPDATE public.evidence_records SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE record_id = $${i}
         RETURNING *`,
        values
      );

      if (res.rows.length > 0) {
        await recordAuditLog('UPDATE', 'evidence_records', recordId, updates, undefined, clientIp);
        queueOutboxEvent('evidence_record', recordId, 'UPDATE', res.rows[0]).catch(() => {});
        return res.rows[0];
      }
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL update error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client
        .from('evidence_records')
        .update(updates)
        .eq('record_id', recordId)
        .select()
        .single();
      if (!error && data) {
        await recordAuditLog('UPDATE', 'evidence_records', recordId, updates, undefined, clientIp);
        queueOutboxEvent('evidence_record', recordId, 'UPDATE', data).catch(() => {});
        return data;
      }
    } catch (e: any) {
      console.warn('[DataService] Supabase update error:', e.message);
    }
  }

  const idx = memoryRecords.findIndex((r) => r.record_id === recordId);
  if (idx >= 0) {
    memoryRecords[idx] = { ...memoryRecords[idx], ...updates };
    await recordAuditLog('UPDATE', 'evidence_records', recordId, updates, undefined, clientIp);
    queueOutboxEvent('evidence_record', recordId, 'UPDATE', memoryRecords[idx]).catch(() => {});
    return memoryRecords[idx];
  }

  throw new Error(`Record ${recordId} not found`);
}

export async function deleteEvidenceRecord(recordId: string, clientIp?: string): Promise<boolean> {
  if (isPostgresConfigured) {
    try {
      await query('DELETE FROM public.evidence_records WHERE record_id = $1', [recordId]);
      await recordAuditLog('DELETE', 'evidence_records', recordId, {}, undefined, clientIp);
      queueOutboxEvent('evidence_record', recordId, 'DELETE', { recordId }).catch(() => {});
      return true;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL delete error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { error } = await client.from('evidence_records').delete().eq('record_id', recordId);
      if (!error) {
        await recordAuditLog('DELETE', 'evidence_records', recordId, {}, undefined, clientIp);
        queueOutboxEvent('evidence_record', recordId, 'DELETE', { recordId }).catch(() => {});
        return true;
      }
    } catch (e: any) {
      console.warn('[DataService] Supabase delete error:', e.message);
    }
  }

  const idx = memoryRecords.findIndex((r) => r.record_id === recordId);
  if (idx >= 0) {
    memoryRecords.splice(idx, 1);
    await recordAuditLog('DELETE', 'evidence_records', recordId, {}, undefined, clientIp);
    queueOutboxEvent('evidence_record', recordId, 'DELETE', { recordId }).catch(() => {});
    return true;
  }

  return false;
}

// ==============================================================================
// 3. SOURCES
// ==============================================================================

export async function fetchSources(): Promise<any[]> {
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.sources ORDER BY year DESC, source_id ASC');
      if (res.rows.length > 0) return res.rows;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL fetchSources error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('sources').select('*').order('year', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetchSources error:', e.message);
    }
  }

  return seedSources;
}

// ==============================================================================
// 4. EXPERIMENTS & MATERIALS
// ==============================================================================

export async function fetchExperiments(): Promise<any[]> {
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.experiments ORDER BY title ASC');
      if (res.rows.length > 0) return res.rows;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL fetchExperiments error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('experiments').select('*');
      if (!error && data && data.length > 0) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetchExperiments error:', e.message);
    }
  }

  return [
    { title: 'Saffire-II', experiment_type: 'orbital-flight', status: 'completed' },
    { title: 'Saffire-VI', experiment_type: 'orbital-flight', status: 'completed' },
    { title: 'Partial-Gravity Literature', experiment_type: 'partial-gravity-research', status: 'completed' },
    { title: '1g Ground Reference', experiment_type: 'ground-reference', status: 'completed' },
  ];
}

export async function fetchMaterials(): Promise<any[]> {
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.materials ORDER BY family ASC');
      if (res.rows.length > 0) return res.rows;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL fetchMaterials error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('materials').select('*');
      if (!error && data && data.length > 0) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetchMaterials error:', e.message);
    }
  }

  return [
    { family: 'silicone', name: 'Silicone elastomer' },
    { family: 'sib', name: 'SIBAL fabric' },
    { family: 'pmma', name: 'PMMA slab' },
    { family: 'cellulose', name: 'Cellulosic material' },
  ];
}

// ==============================================================================
// 5. SCENARIOS (CRUD)
// ==============================================================================

export async function fetchScenarios(): Promise<any[]> {
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.scenarios ORDER BY created_at DESC');
      if (res.rows.length > 0) return res.rows;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL fetchScenarios error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('scenarios').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetchScenarios error:', e.message);
    }
  }

  return memoryScenarios;
}

export async function insertScenario(scenario: any, clientIp?: string): Promise<any> {
  const id = scenario.id || `scen-${Date.now()}`;

  if (isPostgresConfigured) {
    try {
      const res = await query(
        `INSERT INTO public.scenarios (
           title, description, gravity_category, gravity_g, oxygen_pct,
           total_pressure_kpa, airflow_cm_s, flow_direction, material_family,
           material_type, geometry, thickness_mm, configuration
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          scenario.title,
          scenario.description || null,
          scenario.gravity_category,
          scenario.gravity_g,
          scenario.oxygen_pct,
          scenario.total_pressure_kpa,
          scenario.airflow_cm_s,
          scenario.flow_direction,
          scenario.material_family,
          scenario.material_type,
          scenario.geometry,
          scenario.thickness_mm,
          JSON.stringify(scenario.configuration || {}),
        ]
      );
      await recordAuditLog('INSERT', 'scenarios', res.rows[0].id, { title: scenario.title }, undefined, clientIp);
      queueOutboxEvent('scenario', res.rows[0].id, 'INSERT', res.rows[0]).catch(() => {});
      return res.rows[0];
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL scenario insert failed:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client.from('scenarios').insert([scenario]).select().single();
      if (!error && data) {
        await recordAuditLog('INSERT', 'scenarios', data.id, { title: scenario.title }, undefined, clientIp);
        queueOutboxEvent('scenario', data.id, 'INSERT', data).catch(() => {});
        return data;
      }
    } catch (e: any) {
      console.warn('[DataService] Supabase scenario insert failed:', e.message);
    }
  }

  const newScen = { ...scenario, id, created_at: new Date().toISOString() };
  memoryScenarios.unshift(newScen);
  await recordAuditLog('INSERT', 'scenarios', id, { title: scenario.title }, undefined, clientIp);
  queueOutboxEvent('scenario', id, 'INSERT', newScen).catch(() => {});
  return newScen;
}

export async function deleteScenario(scenarioId: string, clientIp?: string): Promise<boolean> {
  if (isPostgresConfigured) {
    try {
      await query('DELETE FROM public.scenarios WHERE id = $1', [scenarioId]);
      await recordAuditLog('DELETE', 'scenarios', scenarioId, {}, undefined, clientIp);
      queueOutboxEvent('scenario', scenarioId, 'DELETE', { id: scenarioId }).catch(() => {});
      return true;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL delete scenario error:', e.message);
    }
  }

  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { error } = await client.from('scenarios').delete().eq('id', scenarioId);
      if (!error) {
        await recordAuditLog('DELETE', 'scenarios', scenarioId, {}, undefined, clientIp);
        queueOutboxEvent('scenario', scenarioId, 'DELETE', { id: scenarioId }).catch(() => {});
        return true;
      }
    } catch (e: any) {
      console.warn('[DataService] Supabase delete scenario error:', e.message);
    }
  }

  const idx = memoryScenarios.findIndex((s) => s.id === scenarioId);
  if (idx >= 0) {
    memoryScenarios.splice(idx, 1);
    await recordAuditLog('DELETE', 'scenarios', scenarioId, {}, undefined, clientIp);
    queueOutboxEvent('scenario', scenarioId, 'DELETE', { id: scenarioId }).catch(() => {});
    return true;
  }

  return false;
}

// ==============================================================================
// 6. AUDIT LOGS RETRIEVAL
// ==============================================================================

export async function fetchAuditLogs(limit = 50): Promise<any[]> {
  if (isPostgresConfigured) {
    try {
      const res = await query('SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
      if (res.rows.length > 0) return res.rows;
    } catch (e: any) {
      console.warn('[DataService] PostgreSQL fetchAuditLogs error:', e.message);
    }
  }

  const client = supabaseAdmin;
  if (client) {
    try {
      const { data, error } = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
      if (!error && data) return data;
    } catch (e: any) {
      console.warn('[DataService] Supabase fetchAuditLogs error:', e.message);
    }
  }

  return memoryAuditLogs.slice(0, limit);
}
