-- ==============================================================================
-- ASTRAFLAME Database Security Migration
-- 000003: Row Level Security (RLS) Policies & Access Controls
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. USERS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view their own user profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own user profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Service role has full management access to users
DROP POLICY IF EXISTS "Service role full user access" ON public.users;
CREATE POLICY "Service role full user access"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. PUBLIC READ POLICIES FOR RESEARCH DATA
-- (Curated scientific datasets are publicly readable)
-- ------------------------------------------------------------------------------

-- Experiments
DROP POLICY IF EXISTS "Public can view experiments" ON public.experiments;
CREATE POLICY "Public can view experiments"
    ON public.experiments
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role can modify experiments" ON public.experiments;
CREATE POLICY "Service role can modify experiments"
    ON public.experiments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Sources
DROP POLICY IF EXISTS "Public can view sources" ON public.sources;
CREATE POLICY "Public can view sources"
    ON public.sources
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role can modify sources" ON public.sources;
CREATE POLICY "Service role can modify sources"
    ON public.sources
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Materials
DROP POLICY IF EXISTS "Public can view materials" ON public.materials;
CREATE POLICY "Public can view materials"
    ON public.materials
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role can modify materials" ON public.materials;
CREATE POLICY "Service role can modify materials"
    ON public.materials
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Evidence Records
DROP POLICY IF EXISTS "Public can view evidence records" ON public.evidence_records;
CREATE POLICY "Public can view evidence records"
    ON public.evidence_records
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role can modify evidence records" ON public.evidence_records;
CREATE POLICY "Service role can modify evidence records"
    ON public.evidence_records
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Measurements
DROP POLICY IF EXISTS "Public can view measurements" ON public.measurements;
CREATE POLICY "Public can view measurements"
    ON public.measurements
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Service role can modify measurements" ON public.measurements;
CREATE POLICY "Service role can modify measurements"
    ON public.measurements
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. SCENARIOS POLICIES (Preset Scenarios + User Custom Scenarios)
-- ------------------------------------------------------------------------------

-- Anyone can read public presets (user_id IS NULL) or their own created scenarios
DROP POLICY IF EXISTS "Users can read public presets and own scenarios" ON public.scenarios;
CREATE POLICY "Users can read public presets and own scenarios"
    ON public.scenarios
    FOR SELECT
    TO anon, authenticated, service_role
    USING (user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

-- Users can insert custom scenarios
DROP POLICY IF EXISTS "Users can create scenarios" ON public.scenarios;
CREATE POLICY "Users can create scenarios"
    ON public.scenarios
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

-- Users can update their own scenarios
DROP POLICY IF EXISTS "Users can update own scenarios" ON public.scenarios;
CREATE POLICY "Users can update own scenarios"
    ON public.scenarios
    FOR UPDATE
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can delete their own scenarios
DROP POLICY IF EXISTS "Users can delete own scenarios" ON public.scenarios;
CREATE POLICY "Users can delete own scenarios"
    ON public.scenarios
    FOR DELETE
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Service role full access to scenarios
DROP POLICY IF EXISTS "Service role full access to scenarios" ON public.scenarios;
CREATE POLICY "Service role full access to scenarios"
    ON public.scenarios
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. AUDIT LOGS POLICIES (Provenance & Security)
-- ------------------------------------------------------------------------------

-- Audit logs are strictly protected; only service_role can read all audit logs
DROP POLICY IF EXISTS "Service role read audit logs" ON public.audit_logs;
CREATE POLICY "Service role read audit logs"
    ON public.audit_logs
    FOR SELECT
    TO service_role
    USING (true);

-- Backend / Service role can insert audit logs
DROP POLICY IF EXISTS "Service role insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO service_role, authenticated, anon
    WITH CHECK (true);

