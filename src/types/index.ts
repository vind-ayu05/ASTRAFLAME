// ASTRAFLAME type model.
//
// Constrained by tsconfig.app.json:
//   - verbatimModuleSyntax: true   -> use `import type` for type-only imports.
//   - erableSyntaxOnly: true       -> NO `enum`, NO constructor parameter
//                                     properties. Use string/number literal
//                                     union types and `type`/`interface`.
//
// Missing values are modelled explicitly so a measurement is NEVER silently
// displayed as 0. A MissingValue object replaces the numeric wherever an
// experiment did not report, did not measure, or cannot measure a quantity.

/** Discriminated object representing an explicitly missing value. */
export interface MissingValue {
  state:
    | 'not_reported'
    | 'not_measured'
    | 'not_applicable'
    | 'unknown'
    | 'estimated';
}

/** A value that may be a real number (or T) or an explicit MissingValue. */
export type MaybeValue<T = number> = T | MissingValue;

// --- Literal-union alias types ---------------------------------------------

/** Material family investigated in a combustion experiment. */
export type MaterialFamily =
  | 'silicone'
  | 'sib'
  | 'pmma'
  | 'cellulose';

/** Gravity regime. Microgravity is NOT lunar or Martian gravity. */
export type GravityCategory =
  | 'microgravity'
  | 'lunar'
  | 'mars'
  | '1g'
  | 'partial';

/** Direction of the forced airflow relative to flame spread. */
export type FlowDirection =
  | 'concurrent'
  | 'opposed'
  | 'quiescent';

/** Sample geometry; exact-match is used for cohort grouping. */
export type Geometry =
  | 'flat-sheet'
  | 'rod'
  | 'cylinder'
  | 'other';

/** Evidence tier. Tier 1 = NASA PSI flight data; Tier 2 = literature. */
export type Tier = 1 | 2;

/** Editorial review status of a record. */
export type ReviewStatus = 'draft' | 'source-checked' | 'values-verified' | 'approved';

/**
 * Verification status — identical to ReviewStatus, aliased for clarity when
 * computing an aggregate status across multiple records for a source.
 */
export type VerificationStatus = ReviewStatus;

/** Curator-assessed confidence in the extracted value. */
export type Confidence = 'high' | 'medium' | 'low';

/** Qualitative outcome label for the burning result. */
export type Outcome =
  | 'burning'
  | 'self-extinguished'
  | 'no-ignition';

// --- Records ----------------------------------------------------------------

/** A single combustion experiment record (seed data row). */
export interface ExperimentRecord {
  /** Stable record identifier, e.g. "SF2-2-5". */
  record_id: string;
  /** Investigation / campaign name, e.g. "Saffire-II". */
  investigation: string;
  /** Free-text sample identifier within the investigation. */
  sample_id: string;
  /** Material family coarse classification. */
  material_family: MaterialFamily;
  /** Specific material / sample name, e.g. "SIBAL", "PMMA". */
  material_type: string;
  /** Sample geometry. */
  geometry: Geometry;
  /** Gravity category. Cohorts never blend categories. */
  gravity_category: GravityCategory;
  /** Numeric gravity level in g (0.0001 microgravity, 0.16 lunar, etc.). */
  gravity_g: number;
  /** Oxygen concentration (% volume). */
  oxygen_pct: MaybeValue<number>;
  /** Total pressure in kPa. */
  total_pressure_kpa: MaybeValue<number>;
  /** Forced airflow velocity in cm/s. */
  airflow_cm_s: MaybeValue<number>;
  /** Flow direction relative to flame spread. */
  flow_direction: FlowDirection;
  /** Sample thickness in mm. */
  thickness_mm: MaybeValue<number>;
  /** Sample width in cm. */
  width_cm?: MaybeValue<number>;
  /** Sample length in cm. */
  length_cm?: MaybeValue<number>;
  /** Cabin / chamber free volume in m^3 (Saffire-VI reduced pressure). */
  free_volume_m3?: MaybeValue<number>;
  /** Flame spread rate in mm/s. */
  spread_rate_mm_s: MaybeValue<number>;
  /** Burn length in cm. */
  burn_length_cm?: MaybeValue<number>;
  /** Peak heat release rate in W. */
  heat_release_peak_w?: MaybeValue<number>;
  /** CO increase in ppm (Saffire-VI reduced-pressure tests). */
  co_increase_ppm?: MaybeValue<number>;
  /** CO2 increase in ppm (Saffire-VI reduced-pressure tests). */
  co2_increase_ppm?: MaybeValue<number>;
  /** Burning outcome label. */
  outcome: Outcome;
  /** Curator confidence in the extracted value set. */
  confidence: Confidence;
  /** Evidence tier (1 = NASA PSI flight, 2 = literature). */
  tier: Tier;
  /** Editorial review status (all seed records start as "draft"). */
  review_status: ReviewStatus;
  /** Source identifier linking into sources.json. */
  source_id: string;
  /** Free-text curator note, e.g. "Paired ground reference for SF2-2-5". */
  notes?: string;
}

// --- Source registry --------------------------------------------------------

/** Curated reference backing one or more records. */
export interface SourceRecord {
  /** Stable source identifier matching ExperimentRecord.source_id. */
  source_id: string;
  /** Paper / report title. */
  title: string;
  /** Authors, when known. */
  authors?: string;
  /** Publication year. */
  year?: number;
  /** NASA Technical Reports Server ID (NTRS-style placeholder). */
  ntrs_id?: string;
  /** Digital Object Identifier, when no NTRS ID applies. */
  doi?: string;
  /** Page reference, e.g. "12". */
  page_ref?: string;
  /** Table reference, e.g. "Table 3". */
  table_ref?: string;
  /** External URL to the paper / report. */
  url?: string;
}
