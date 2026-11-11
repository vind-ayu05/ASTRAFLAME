import sourcesRaw from './sources.json';
import type { SourceRecord } from '../types/index.ts';

/** Curated source registry, synchronized with database at runtime. */
export const sources: SourceRecord[] = [...(sourcesRaw as SourceRecord[])];

/**
 * Updates the in-memory singleton sources array with fresh data from the database.
 */
export function setDynamicSources(newSources: SourceRecord[]): void {
  sources.length = 0;
  sources.push(...newSources);
}

/** Look up a single source by its stable `source_id`. */
export function getSource(id: string): SourceRecord | undefined {
  return sources.find((s) => s.source_id === id);
}
