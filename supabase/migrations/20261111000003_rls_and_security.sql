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

-- Helper function for role check
CREATE OR REPLACE FUNCTION public.is_admin_or_curator()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') IN ('admin', 'curator')
    OR
    (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') IN ('admin', 'curator')
    OR
    (current_setting('role', true) = 'service_role')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. USERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

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

DROP POLICY IF EXISTS "Curators manage experiments" ON public.experiments;
CREATE POLICY "Curators manage experiments"
    ON public.experiments
    FOR ALL
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

-- Sources
DROP POLICY IF EXISTS "Public can view sources" ON public.sources;
CREATE POLICY "Public can view sources"
    ON public.sources
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Curators manage sources" ON public.sources;
CREATE POLICY "Curators manage sources"
    ON public.sources
    FOR ALL
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

-- Materials
DROP POLICY IF EXISTS "Public can view materials" ON public.materials;
CREATE POLICY "Public can view materials"
    ON public.materials
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Curators manage materials" ON public.materials;
CREATE POLICY "Curators manage materials"
    ON public.materials
    FOR ALL
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

-- Evidence Records
DROP POLICY IF EXISTS "Public can view evidence records" ON public.evidence_records;
DROP POLICY IF EXISTS "Public can read published research records" ON public.evidence_records;
CREATE POLICY "Public can read published research records"
    ON public.evidence_records
    FOR SELECT
    TO anon, authenticated, service_role
    USING (review_status IN ('reviewed', 'draft'));

DROP POLICY IF EXISTS "Curators can insert evidence records" ON public.evidence_records;
CREATE POLICY "Curators can insert evidence records"
    ON public.evidence_records
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Curators can update evidence records" ON public.evidence_records;
CREATE POLICY "Curators can update evidence records"
    ON public.evidence_records
    FOR UPDATE
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Admins can delete evidence records" ON public.evidence_records;
CREATE POLICY "Admins can delete evidence records"
    ON public.evidence_records
    FOR DELETE
    TO authenticated, service_role
    USING (
      (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'admin'
      OR (current_setting('role', true) = 'service_role')
    );

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

DROP POLICY IF EXISTS "Service role read audit logs" ON public.audit_logs;
CREATE POLICY "Service role read audit logs"
    ON public.audit_logs
    FOR SELECT
    TO service_role
    USING (true);

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Service role insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO service_role, authenticated, anon
    WITH CHECK (true);
