-- HNA Foreign Round form — run in Supabase SQL Editor (or via migration)
-- Project: foreign_round_submissions

-- ---------------------------------------------------------------------------
-- Table: all golfer form fields + staff workflow columns
-- ---------------------------------------------------------------------------
create table if not exists public.foreign_round_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Your Details (form)
  player_id text not null,
  full_name text not null,
  email text null,

  -- Round Details (form)
  date_played date not null,
  country text not null,
  course_name text not null,

  -- Course Information (form)
  course_rating numeric(4, 1) not null
    constraint foreign_round_course_rating_range
    check (course_rating >= 50 and course_rating <= 90),
  slope_rating smallint not null
    constraint foreign_round_slope_rating_range
    check (slope_rating >= 55 and slope_rating <= 155),
  par smallint not null
    constraint foreign_round_par_range
    check (par >= 60 and par <= 80),
  gross_score smallint not null
    constraint foreign_round_gross_score_range
    check (gross_score >= 40 and gross_score <= 200),

  -- Calculated on form: (Gross − Course Rating) × 113 ÷ Slope
  estimated_score_differential numeric(5, 1) generated always as (
    round(
      ((gross_score::numeric - course_rating) * 113.0 / slope_rating::numeric)::numeric,
      1
    )
  ) stored,

  -- Submission metadata
  submitted_at timestamptz not null default now(),
  source text not null default 'public_form',

  -- Staff triage (support queue)
  status text not null default 'new'
    constraint foreign_round_status_values
    check (status in ('new', 'in_progress', 'completed', 'rejected', 'needs_info')),
  assigned_to uuid null references auth.users (id) on delete set null,
  notes text null,
  processed_at timestamptz null
);

comment on table public.foreign_round_submissions is
  'Foreign round submissions from the public HNA form.';

comment on column public.foreign_round_submissions.player_id is 'HNA Player ID';
comment on column public.foreign_round_submissions.full_name is 'Golfer full name';
comment on column public.foreign_round_submissions.email is 'Optional confirmation email';
comment on column public.foreign_round_submissions.date_played is 'Date the round was played';
comment on column public.foreign_round_submissions.country is 'Country where the round was played';
comment on column public.foreign_round_submissions.course_name is 'Course name';
comment on column public.foreign_round_submissions.course_rating is 'Course rating from scorecard';
comment on column public.foreign_round_submissions.slope_rating is 'Slope rating from scorecard (55–155)';
comment on column public.foreign_round_submissions.par is 'Course par';
comment on column public.foreign_round_submissions.gross_score is 'Total strokes for the round';
comment on column public.foreign_round_submissions.estimated_score_differential is
  'Auto-calculated: (gross_score - course_rating) * 113 / slope_rating';
comment on column public.foreign_round_submissions.status is 'Support workflow status';
comment on column public.foreign_round_submissions.assigned_to is 'Staff user assigned (auth.users)';
comment on column public.foreign_round_submissions.notes is 'Internal staff notes';

-- ---------------------------------------------------------------------------
-- Indexes (staff list / filtering)
-- ---------------------------------------------------------------------------
create index if not exists foreign_round_submissions_created_at_idx
  on public.foreign_round_submissions (created_at desc);

create index if not exists foreign_round_submissions_status_idx
  on public.foreign_round_submissions (status, created_at desc);

create index if not exists foreign_round_submissions_player_id_idx
  on public.foreign_round_submissions (player_id);

create index if not exists foreign_round_submissions_date_played_idx
  on public.foreign_round_submissions (date_played desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — public can INSERT only (reads via service role / staff)
-- ---------------------------------------------------------------------------
alter table public.foreign_round_submissions enable row level security;

drop policy if exists "public can insert foreign round submissions"
  on public.foreign_round_submissions;

create policy "public can insert foreign round submissions"
  on public.foreign_round_submissions
  for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Staff list view (read-only for authenticated users; extend with role checks later)
-- ---------------------------------------------------------------------------
create or replace view public.foreign_round_submissions_queue
with (security_invoker = true)
as
select
  id,
  created_at,
  status,
  assigned_to,
  player_id,
  full_name,
  email,
  date_played,
  country,
  course_name,
  course_rating,
  slope_rating,
  par,
  gross_score,
  estimated_score_differential,
  submitted_at,
  notes,
  processed_at
from public.foreign_round_submissions
order by created_at desc;

comment on view public.foreign_round_submissions_queue is
  'Support queue view for triaging foreign round submissions.';
