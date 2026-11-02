import recordsRaw from './records.json';
import type { ExperimentRecord } from '../types/index.ts';

/**
 * The full seed dataset, cast to the typed interface. records.json is the
 * single source of truth; this module only attaches types and lookups.
 */
export const records: ExperimentRecord[] = recordsRaw as ExperimentRecord[];

/** Look up a single record by its stable `record_id`. */
export function getRecord(id: string): ExperimentRecord | undefined {
  return records.find((r) => r.record_id === id);
}

/** All records belonging to a named investigation (e.g. "Saffire-II"). */
export function recordsByInvestigation(name: string): ExperimentRecord[] {
  return records.filter((r) => r.investigation === name);
}
