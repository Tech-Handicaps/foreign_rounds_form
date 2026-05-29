-- Golf courses lookup (country → course names for searchable dropdown)
create table if not exists public.golf_courses (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint golf_courses_country_name_unique unique (country, name)
);

create index if not exists golf_courses_country_idx on public.golf_courses (country);
create index if not exists golf_courses_name_idx on public.golf_courses (name);

alter table public.golf_courses enable row level security;

drop policy if exists "public can read golf courses" on public.golf_courses;
create policy "public can read golf courses"
  on public.golf_courses
  for select
  to anon, authenticated
  using (true);

-- Starter seed (expand via Supabase Table Editor or CSV import)
insert into public.golf_courses (country, name) values
  ('United Kingdom', 'Royal Birkdale Golf Club'),
  ('United Kingdom', 'St Andrews Links (Old Course)'),
  ('United Kingdom', 'Royal Liverpool Golf Club'),
  ('United Kingdom', 'Wentworth Club'),
  ('United States', 'Pebble Beach Golf Links'),
  ('United States', 'Augusta National Golf Club'),
  ('United States', 'TPC Sawgrass'),
  ('United States', 'Pinehurst No. 2'),
  ('Australia', 'Royal Melbourne Golf Club'),
  ('Australia', 'Kingston Heath Golf Club'),
  ('Ireland', 'Ballybunion Golf Club'),
  ('Ireland', 'Royal County Down Golf Club'),
  ('Spain', 'Real Club Valderrama'),
  ('Spain', 'Club de Campo Villa de Madrid'),
  ('United Arab Emirates', 'Emirates Golf Club'),
  ('United Arab Emirates', 'Abu Dhabi Golf Club'),
  ('France', 'Le Golf National'),
  ('Germany', 'Golf Club München Eichenried'),
  ('Japan', 'Kasumigaseki Country Club'),
  ('Thailand', 'Alpine Golf Club'),
  ('Portugal', 'Oceânico Victoria Golf Course'),
  ('Mauritius', 'Heritage Golf Club'),
  ('Namibia', 'Windhoek Country Club'),
  ('Zimbabwe', 'Royal Harare Golf Club')
on conflict (country, name) do nothing;
