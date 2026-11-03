// Evidence page: filterable list of all records.
// Desktop: EvidenceTable. Mobile: EvidenceCard list.
// Up to 3 records can be selected for comparison with hard-stop gravity/flow warning.

import { useState, useMemo } from 'react';
import { records } from '../data/records.ts';
import { EvidenceTable } from '../components/EvidenceTable.tsx';
import { EvidenceCard } from '../components/EvidenceCard.tsx';
import type { ExperimentRecord, GravityCategory, MaterialFamily } from '../types/index.ts';

function canToggleSelect(
  current: string[],
  id: string,
  allRecords: ExperimentRecord[],
): { allowed: boolean; warning?: string } {
  if (current.includes(id)) return { allowed: true };
  if (current.length >= 3) return { allowed: false, warning: 'You can compare up to 3 records at a time. Deselect one first.' };

  const newSet = [...current, id];
  const selected = allRecords.filter((r) => newSet.includes(r.record_id));
  const gravities = new Set(selected.map((r) => r.gravity_category));
  if (gravities.size > 1) {
    return { allowed: false, warning: 'Cannot compare records across different gravity categories.' };
  }
  const flows = new Set(
    selected.filter((r) => r.flow_direction === 'concurrent' || r.flow_direction === 'opposed').map((r) => r.flow_direction),
  );
  if (flows.size > 1) {
    return { allowed: false, warning: 'Cannot compare records with different flow directions (concurrent vs opposed).' };
  }
  return { allowed: true };
}

const ALL_GRAVITIES: GravityCategory[] = ['microgravity', 'partial', 'lunar', 'mars', '1g'];
const ALL_MATERIALS: MaterialFamily[] = ['sib', 'pmma', 'silicone', 'cellulose'];

export function Evidence() {
  const [search, setSearch] = useState('');
  const [filterGravity, setFilterGravity] = useState<GravityCategory | ''>('');
  const [filterMaterial, setFilterMaterial] = useState<MaterialFamily | ''>('');
  const [filterTier, setFilterTier] = useState<'' | '1' | '2'>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionWarning, setSelectionWarning] = useState('');

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterGravity && r.gravity_category !== filterGravity) return false;
      if (filterMaterial && r.material_family !== filterMaterial) return false;
      if (filterTier && String(r.tier) !== filterTier) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.record_id.toLowerCase().includes(q) ||
          r.material_type.toLowerCase().includes(q) ||
          r.investigation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, filterGravity, filterMaterial, filterTier]);

  function toggleSelect(id: string) {
    const check = canToggleSelect(selectedIds, id, records);
    if (!check.allowed) {
      setSelectionWarning(check.warning ?? '');
      return;
    }
    setSelectionWarning('');
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const selectCls = 'rounded-md border border-subtle bg-bg-elevated px-3 py-1.5 text-sm text-text-primary';

  return (
    <main id="main" aria-label="Evidence database">
      <div className="container-page py-8">
        <h1 className="mb-5 font-display text-2xl font-semibold text-text-primary">Evidence Database</h1>

        {/* Filters */}
        <section aria-label="Filters" className="mb-6 flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="ev-search">Search records</label>
          <input
            id="ev-search"
            type="search"
            placeholder="Search ID, material, investigation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-md border border-subtle bg-bg-elevated px-3 py-1.5 text-sm text-text-primary"
          />

          <label className="sr-only" htmlFor="ev-gravity">Filter by gravity</label>
          <select id="ev-gravity" value={filterGravity} onChange={(e) => setFilterGravity(e.target.value as GravityCategory | '')} className={selectCls}>
            <option value="">All gravity</option>
            {ALL_GRAVITIES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          <label className="sr-only" htmlFor="ev-material">Filter by material</label>
          <select id="ev-material" value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value as MaterialFamily | '')} className={selectCls}>
            <option value="">All materials</option>
            {ALL_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <label className="sr-only" htmlFor="ev-tier">Filter by tier</label>
          <select id="ev-tier" value={filterTier} onChange={(e) => setFilterTier(e.target.value as '' | '1' | '2')} className={selectCls}>
            <option value="">All tiers</option>
            <option value="1">Tier 1 (NASA PSI)</option>
            <option value="2">Tier 2 (Literature)</option>
          </select>
        </section>

        <p className="mb-3 text-sm text-text-muted">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>

        {/* Desktop table */}
        <div className="hidden md:block">
          <EvidenceTable
            records={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            selectionWarning={selectionWarning || undefined}
          />
        </div>

        {/* Mobile cards */}
        <div className="grid gap-4 md:hidden">
          {filtered.map((r) => (
            <EvidenceCard
              key={r.record_id}
              record={r}
              selected={selectedIds.includes(r.record_id)}
              onToggleSelect={toggleSelect}
              selectionWarning={selectionWarning || undefined}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">No records match the current filters.</p>
          )}
        </div>
      </div>
    </main>
  );
}
