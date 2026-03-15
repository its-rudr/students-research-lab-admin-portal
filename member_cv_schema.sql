-- Member CV schema for Students Research Lab Admin Portal
-- Run this in Supabase SQL Editor

create table if not exists public.member_cv_profiles (
  id bigserial primary key,
  enrollment_no text not null unique,
  student_name text not null,
  research_work_summary text,
  research_area text,
  hackathons jsonb not null default '[]'::jsonb,
  research_papers jsonb not null default '[]'::jsonb,
  patents jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_member_cv_profiles_enrollment_no
  on public.member_cv_profiles (enrollment_no);

create or replace function public.update_member_cv_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_member_cv_profiles_updated_at on public.member_cv_profiles;

create trigger trg_member_cv_profiles_updated_at
before update on public.member_cv_profiles
for each row
execute function public.update_member_cv_timestamp();

-- Initialize profile rows from students_details.
-- This keeps member name and enrollment prefilled and non-editable in UI.
insert into public.member_cv_profiles (enrollment_no, student_name)
select sd.enrollment_no, sd.student_name
from public.students_details sd
where sd.enrollment_no is not null
on conflict (enrollment_no)
do update set student_name = excluded.student_name;
