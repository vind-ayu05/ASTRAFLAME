-- Migration: 20261112000001_create_sync_outbox.sql
-- Description: Creates the transactional outbox table on Primary Supabase PostgreSQL
-- for asynchronous, reliable synchronization to the Secondary Analytical PostgreSQL database.

CREATE TABLE IF NOT EXISTS sync_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(64) NOT NULL,
    source_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_source ON sync_outbox(source_id, entity_type);

-- RLS: Only service_role can read/write the sync outbox
ALTER TABLE sync_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on sync_outbox"
    ON sync_outbox
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
