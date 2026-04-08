-- ============================================================
-- Timeline RLS Protection (Supabase)
-- ============================================================
-- This script protects timeline_entries so non-admin users cannot
-- insert/update/delete rows.
--
-- IMPORTANT:
-- These policies require Supabase Auth JWT claims (auth.email()).
-- If your frontend uses only the anonymous key without Supabase Auth,
-- all write operations will be blocked for everyone.
-- ============================================================

ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;

-- Cleanup old policies if they exist
DROP POLICY IF EXISTS timeline_entries_select_active ON public.timeline_entries;
DROP POLICY IF EXISTS timeline_entries_select_admin ON public.timeline_entries;
DROP POLICY IF EXISTS timeline_entries_insert_admin ON public.timeline_entries;
DROP POLICY IF EXISTS timeline_entries_update_admin ON public.timeline_entries;
DROP POLICY IF EXISTS timeline_entries_delete_admin ON public.timeline_entries;

-- Public can read active timeline rows (main website + admin portal)
CREATE POLICY timeline_entries_select_active
ON public.timeline_entries
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin can read all timeline rows in admin portal
CREATE POLICY timeline_entries_select_admin
ON public.timeline_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students_details sd
    WHERE lower(sd.email) = lower(auth.email())
      AND lower(coalesce(sd.member_type, 'member')) = 'admin'
  )
);

-- Admin-only writes
CREATE POLICY timeline_entries_insert_admin
ON public.timeline_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students_details sd
    WHERE lower(sd.email) = lower(auth.email())
      AND lower(coalesce(sd.member_type, 'member')) = 'admin'
  )
);

CREATE POLICY timeline_entries_update_admin
ON public.timeline_entries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students_details sd
    WHERE lower(sd.email) = lower(auth.email())
      AND lower(coalesce(sd.member_type, 'member')) = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students_details sd
    WHERE lower(sd.email) = lower(auth.email())
      AND lower(coalesce(sd.member_type, 'member')) = 'admin'
  )
);

CREATE POLICY timeline_entries_delete_admin
ON public.timeline_entries
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students_details sd
    WHERE lower(sd.email) = lower(auth.email())
      AND lower(coalesce(sd.member_type, 'member')) = 'admin'
  )
);
