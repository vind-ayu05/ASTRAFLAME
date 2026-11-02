import sourcesRaw from './sources.json';
import type { SourceRecord } from '../types/index.ts';

/** Curated source registry, cast to the typed interface. */
export const sources: SourceRecord[] = sourcesRaw as SourceRecord[];

/** Look up a single source by its stable `source_id`. */
export function getSource(id: string): SourceRecord | undefined {
  return sources.find((s) => s.source_id === id);
}
