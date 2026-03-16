-- ============================================================
-- Supabase Admin Setup — Students Research Lab Admin Portal
-- Run QUERY 1 first, then QUERY 2 in the Supabase SQL Editor.
-- ============================================================

-- ── QUERY 1 ─────────────────────────────────────────────────
-- Adds the login_password column. Safe to run multiple times.
-- Run this alone first, wait for "Success", then run Query 2.
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.students_details
  ADD COLUMN IF NOT EXISTS login_password text;


-- ── QUERY 2 ─────────────────────────────────────────────────
-- Removes any partial admin row from previous attempts, then
-- inserts a clean SRL Admin row.
-- Run this AFTER Query 1 has succeeded.
-- ────────────────────────────────────────────────────────────
DELETE FROM public.students_details
WHERE email = 'adminsrl@gmail.com'
   OR enrollment_no = 'Adminsrl';

INSERT INTO public.students_details (
  student_name, enrollment_no, email, member_type, login_password,
  institute_name, department, semester, division, batch, gender, contact_no
)
VALUES (
  'SRL Admin', 'Adminsrl', 'adminsrl@gmail.com', 'admin', 'Admin@SRL',
  'N/A', 'N/A', 0, 'N/A', 'N/A', 'other', 'N/A'
);

-- ── DONE ────────────────────────────────────────────────────
-- Login credentials:
--   Email    : adminsrl@gmail.com
--   Password : Admin@SRL
-- The app excludes member_type = 'admin' rows from student
-- lists, leaderboard, attendance, and CV member selection.
-- ────────────────────────────────────────────────────────────