// Evidence page: filterable list of all records.
// Desktop: EvidenceTable. Mobile: EvidenceCard list.
// Up to 3 records can be selected for comparison with hard-stop gravity/flow warning.

import { useState, useMemo } from 'react';
import { records } from '../data/records.ts';
import { useDatabase } from '../context/DatabaseContext.tsx';
import { EvidenceTable } from '../components/EvidenceTable.tsx';
import { EvidenceCard } from '../components/EvidenceCard.tsx';
import { SourceDrawer } from '../components/SourcePanel.tsx';
import type { ExperimentRecord, GravityCategory, MaterialFamily, ReviewStatus } from '../types/index.ts';

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

type ReviewStatusFilter = 'all' | ReviewStatus;

const REVIEW_STATUS_OPTIONS: { value: ReviewStatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'source-checked', label: 'Source Checked' },
  { value: 'values-verified', label: 'Values Verified' },
  { value: 'approved', label: 'Approved' },
];

export function Evidence() {
  const { records: dbRecords } = useDatabase();
  const allRecords = dbRecords.length > 0 ? dbRecords : records;

  const [search, setSearch] = useState('');
  const [filterGravity, setFilterGravity] = useState<GravityCategory | ''>('');
  const [filterMaterial, setFilterMaterial] = useState<MaterialFamily | ''>('');
  const [filterTier, setFilterTier] = useState<'' | '1' | '2'>('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionWarning, setSelectionWarning] = useState('');
  const [drawerSourceId, setDrawerSourceId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (filterGravity && r.gravity_category !== filterGravity) return false;
      if (filterMaterial && r.material_family !== filterMaterial) return false;
      if (filterTier && String(r.tier) !== filterTier) return false;
      if (reviewStatusFilter !== 'all' && r.review_status !== reviewStatusFilter) return false;
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
  }, [allRecords, search, filterGravity, filterMaterial, filterTier, reviewStatusFilter]);

  function toggleSelect(id: string) {
    const check = canToggleSelect(selectedIds, id, allRecords);
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

          <label className="sr-only" htmlFor="ev-status">Filter by verification status</label>
          <select
            id="ev-status"
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value as ReviewStatusFilter)}
            className={selectCls}
            aria-label="Verification Status"
          >
            {REVIEW_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </section>

        <p className="mb-3 text-sm text-text-muted">{filtered.length} record{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== allRecords.length && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterGravity('');
                setFilterMaterial('');
                setFilterTier('');
                setReviewStatusFilter('all');
              }}
              className="ml-3 text-xs text-brand-orange hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
            >
              Clear filters
            </button>
          )}
        </p>

        {/* Desktop table */}
        <div className="hidden md:block">
          <EvidenceTable
            records={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            selectionWarning={selectionWarning || undefined}
            onSourceClick={(sourceId) => setDrawerSourceId(sourceId)}
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

      {/* Source Drawer — Evidence Explorer only */}
      <SourceDrawer
        sourceId={drawerSourceId ?? ''}
        open={drawerSourceId !== null}
        onClose={() => setDrawerSourceId(null)}
        relatedRecords={records.filter((r) => r.source_id === drawerSourceId)}
      />
    </main>
  );
}
