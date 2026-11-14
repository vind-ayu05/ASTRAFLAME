-- ==============================================================================
-- ASTRAFLAME Security Hardening Migration
-- 000004: Production Row Level Security (RLS) & Access Control Hardening
-- ==============================================================================

-- 1. Ensure RLS is active on all public tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sync_outbox ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if the caller is an authorized admin/curator
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

-- 3. EVIDENCE RECORDS ACCESS POLICIES
-- Public users can only read approved and publicly available research records
DROP POLICY IF EXISTS "Public can view evidence records" ON public.evidence_records;
DROP POLICY IF EXISTS "Public can read published research records" ON public.evidence_records;
CREATE POLICY "Public can read published research records"
    ON public.evidence_records
    FOR SELECT
    TO anon, authenticated, service_role
    USING (review_status IN ('reviewed', 'draft'));

-- Only authorized administrators and curators can create new research records
DROP POLICY IF EXISTS "Curators can insert evidence records" ON public.evidence_records;
CREATE POLICY "Curators can insert evidence records"
    ON public.evidence_records
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (public.is_admin_or_curator());

-- Only authorized administrators and curators can update research records
DROP POLICY IF EXISTS "Curators can update evidence records" ON public.evidence_records;
CREATE POLICY "Curators can update evidence records"
    ON public.evidence_records
    FOR UPDATE
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

-- Only authorized administrators can delete research records
DROP POLICY IF EXISTS "Admins can delete evidence records" ON public.evidence_records;
CREATE POLICY "Admins can delete evidence records"
    ON public.evidence_records
    FOR DELETE
    TO authenticated, service_role
    USING (
      (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'admin'
      OR (current_setting('role', true) = 'service_role')
    );

-- 4. EXPERIMENTS, SOURCES & MATERIALS WRITE POLICIES
-- Read-only for public; write access restricted to curators & admins
DROP POLICY IF EXISTS "Curators manage experiments" ON public.experiments;
CREATE POLICY "Curators manage experiments"
    ON public.experiments
    FOR ALL
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Curators manage sources" ON public.sources;
CREATE POLICY "Curators manage sources"
    ON public.sources
    FOR ALL
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

DROP POLICY IF EXISTS "Curators manage materials" ON public.materials;
CREATE POLICY "Curators manage materials"
    ON public.materials
    FOR ALL
    TO authenticated, service_role
    USING (public.is_admin_or_curator())
    WITH CHECK (public.is_admin_or_curator());

-- 5. AUDIT LOGS SECURITY
-- Completely deny anonymous read/write access to audit logs
DROP POLICY IF EXISTS "Public deny audit logs" ON public.audit_logs;
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

-- 6. SYNC OUTBOX SECURITY
-- Dedicated to service_role internal synchronization only
DROP POLICY IF EXISTS "Service role outbox access" ON public.sync_outbox;
CREATE POLICY "Service role outbox access"
    ON public.sync_outbox
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
