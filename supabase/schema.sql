-- Foreign round submissions table
create table if not exists public.foreign_round_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  player_id text not null,
  full_name text not null,
  email text null,

  date_played date not null,
  country text not null,
  course_name text not null,

  course_rating numeric(4,1) not null,
  slope_rating int not null,
  par int not null,
  gross_score int not null,

  submitted_at timestamptz not null,
  source text not null default 'public_form',

  status text not null default 'new',
  assigned_to uuid null,
  notes text null
);

-- Helpful indexes for staff triage
create index if not exists foreign_round_submissions_created_at_idx
  on public.foreign_round_submissions (created_at desc);

create index if not exists foreign_round_submissions_status_idx
  on public.foreign_round_submissions (status, created_at desc);

create index if not exists foreign_round_submissions_player_id_idx
  on public.foreign_round_submissions (player_id);

-- Enable RLS and allow public INSERT only
alter table public.foreign_round_submissions enable row level security;

drop policy if exists "public can insert foreign round submissions"
  on public.foreign_round_submissions;
create policy "public can insert foreign round submissions"
  on public.foreign_round_submissions
  for insert
  to anon
  with check (true);

-- No public reads/updates/deletes by default (only service role or future staff policies)

