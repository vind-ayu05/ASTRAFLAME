-- ==============================================================================
-- ASTRAFLAME Database Schema Migration
-- 000001: Initial Core Schema
-- Tables: users, experiments, sources, materials, evidence_records,
--         measurements, scenarios, audit_logs
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. EXPERIMENTS (Campaigns & Investigations: Saffire-II, Saffire-VI, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT UNIQUE NOT NULL,
    description TEXT,
    experiment_type TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. SOURCES (Curated literature & NASA technical reports)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    authors TEXT,
    year INTEGER,
    ntrs_id TEXT,
    doi TEXT,
    page_ref TEXT,
    table_ref TEXT,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. MATERIALS (Tested spacecraft materials)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family TEXT NOT NULL, -- silicone, sib, pmma, cellulose
    name TEXT NOT NULL,   -- e.g. SIBAL fabric, PMMA slab
    description TEXT,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. EVIDENCE_RECORDS (Core combustion records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT UNIQUE NOT NULL,
    experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
    investigation TEXT NOT NULL,
    sample_id TEXT NOT NULL,
    material_family TEXT NOT NULL,
    material_type TEXT NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    geometry TEXT NOT NULL,
    gravity_category TEXT NOT NULL,
    gravity_g DOUBLE PRECISION NOT NULL,
    oxygen_pct JSONB NOT NULL,
    total_pressure_kpa JSONB NOT NULL,
    airflow_cm_s JSONB NOT NULL,
    flow_direction TEXT NOT NULL,
    thickness_mm JSONB NOT NULL,
    width_cm JSONB,
    length_cm JSONB,
    free_volume_m3 JSONB,
    spread_rate_mm_s JSONB NOT NULL,
    burn_length_cm JSONB,
    heat_release_peak_w JSONB,
    co_increase_ppm JSONB,
    co2_increase_ppm JSONB,
    outcome TEXT NOT NULL,
    confidence TEXT NOT NULL,
    tier INTEGER NOT NULL,
    review_status TEXT NOT NULL,
    source_id TEXT NOT NULL,
    source_uuid UUID REFERENCES public.sources(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 6. MEASUREMENTS (Normalized experimental parameters & states)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT NOT NULL,
    evidence_record_id UUID REFERENCES public.evidence_records(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    parameter_value DOUBLE PRECISION,
    missing_state TEXT, -- 'not_reported', 'not_measured', 'not_applicable', 'unknown', 'estimated'
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. SCENARIOS (User saved and preset mission scenarios)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    gravity_category TEXT NOT NULL,
    gravity_g DOUBLE PRECISION NOT NULL,
    oxygen_pct DOUBLE PRECISION NOT NULL,
    total_pressure_kpa DOUBLE PRECISION NOT NULL,
    airflow_cm_s DOUBLE PRECISION NOT NULL,
    flow_direction TEXT NOT NULL,
    material_family TEXT NOT NULL,
    material_type TEXT NOT NULL,
    geometry TEXT NOT NULL,
    thickness_mm DOUBLE PRECISION NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. AUDIT_LOGS (Action logging for research provenance & integrity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & RETRIEVAL
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_evidence_records_gravity ON public.evidence_records(gravity_category);
CREATE INDEX IF NOT EXISTS idx_evidence_records_material ON public.evidence_records(material_family);
CREATE INDEX IF NOT EXISTS idx_evidence_records_flow ON public.evidence_records(flow_direction);
CREATE INDEX IF NOT EXISTS idx_evidence_records_source_id ON public.evidence_records(source_id);
CREATE INDEX IF NOT EXISTS idx_measurements_record_id ON public.measurements(record_id);
CREATE INDEX IF NOT EXISTS idx_measurements_param ON public.measurements(parameter_name);
CREATE INDEX IF NOT EXISTS idx_scenarios_gravity ON public.scenarios(gravity_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at_experiments ON public.experiments;
CREATE TRIGGER set_updated_at_experiments
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_evidence_records ON public.evidence_records;
CREATE TRIGGER set_updated_at_evidence_records
    BEFORE UPDATE ON public.evidence_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_scenarios ON public.scenarios;
CREATE TRIGGER set_updated_at_scenarios
    BEFORE UPDATE ON public.scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

