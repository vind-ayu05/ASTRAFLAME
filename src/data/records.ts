import recordsRaw from './records.json';
import type { ExperimentRecord } from '../types/index.ts';

/**
 * The full combustion dataset. Initialized with verified seed records,
 * and synchronized dynamically with Supabase and PostgreSQL at runtime.
 */
export const records: ExperimentRecord[] = [...(recordsRaw as ExperimentRecord[])];

/**
 * Updates the in-memory singleton records array with fresh data from the database.
 * Mutates in-place so all existing imported references remain updated.
 */
export function setDynamicRecords(newRecords: ExperimentRecord[]): void {
  records.length = 0;
  records.push(...newRecords);
}

/** Look up a single record by its stable `record_id`. */
export function getRecord(id: string): ExperimentRecord | undefined {
  return records.find((r) => r.record_id === id);
}

/** All records belonging to a named investigation (e.g. "Saffire-II"). */
export function recordsByInvestigation(name: string): ExperimentRecord[] {
  return records.filter((r) => r.investigation === name);
}
