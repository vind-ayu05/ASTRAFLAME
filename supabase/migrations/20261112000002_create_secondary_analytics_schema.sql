-- Migration: 20261112000002_create_secondary_analytics_schema.sql
-- Description: Creates the analytical models on the Secondary PostgreSQL instance.
-- Dedicated to heavy aggregations, historical summaries, and reporting workloads.

-- 1. Aggregated Dashboard Reporting Dataset
CREATE TABLE IF NOT EXISTS dashboard_metrics_summary (
    id VARCHAR(64) PRIMARY KEY,
    total_records INTEGER NOT NULL DEFAULT 0,
    verified_records INTEGER NOT NULL DEFAULT 0,
    microgravity_records INTEGER NOT NULL DEFAULT 0,
    normal_gravity_records INTEGER NOT NULL DEFAULT 0,
    total_materials INTEGER NOT NULL DEFAULT 0,
    total_experiments INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Flammability & Spread Rate Aggregates
CREATE TABLE IF NOT EXISTS flammability_aggregates (
    material_id VARCHAR(64) NOT NULL,
    gravity_level VARCHAR(32) NOT NULL,
    flow_speed_cms NUMERIC(8,2) NOT NULL,
    oxygen_pct NUMERIC(5,2) NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 1,
    avg_flame_spread_rate NUMERIC(10,4),
    min_flame_spread_rate NUMERIC(10,4),
    max_flame_spread_rate NUMERIC(10,4),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (material_id, gravity_level, flow_speed_cms, oxygen_pct)
);

CREATE INDEX IF NOT EXISTS idx_flammability_mat_grav ON flammability_aggregates(material_id, gravity_level);

-- 3. Historical Measurements & Sensor Summary
CREATE TABLE IF NOT EXISTS historical_measurements_summary (
    experiment_id VARCHAR(64) NOT NULL,
    parameter_name VARCHAR(128) NOT NULL,
    unit VARCHAR(32),
    reading_count INTEGER NOT NULL DEFAULT 0,
    mean_value NUMERIC(12,4),
    min_value NUMERIC(12,4),
    max_value NUMERIC(12,4),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (experiment_id, parameter_name)
);

CREATE INDEX IF NOT EXISTS idx_hist_meas_exp ON historical_measurements_summary(experiment_id);

-- 4. Analytical Sync Log & Deduplication
CREATE TABLE IF NOT EXISTS analytics_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_record_id VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_source ON analytics_sync_log(source_record_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_hash ON analytics_sync_log(payload_hash);
