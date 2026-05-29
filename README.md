# HNA Foreign Rounds Form (Next.js + Supabase)

Public form for golfers to submit foreign rounds. Submissions are stored in Supabase (Postgres) so support staff can process them.

## 1) Supabase database

Table **`foreign_round_submissions`** is created in project **HNA Foreign Form Project** with all form fields plus staff workflow columns.

To recreate or deploy elsewhere, run `supabase/schema.sql` in the Supabase SQL editor.

### Column map (form → database)

| Form field | Column | Type |
|------------|--------|------|
| HNA Player ID | `player_id` | text |
| Full Name | `full_name` | text |
| Email (optional) | `email` | text |
| Date Played | `date_played` | date |
| Country | `country` | text |
| Course Name | `course_name` | text |
| Course Rating | `course_rating` | numeric |
| Slope Rating | `slope_rating` | smallint |
| Par | `par` | smallint |
| Gross Score | `gross_score` | smallint |
| *(calculated)* | `estimated_score_differential` | numeric (auto) |
| — | `status` | text (`new`, `in_progress`, …) |
| — | `assigned_to`, `notes`, `processed_at` | staff workflow |

Support staff can query the view **`foreign_round_submissions_queue`** for a sorted list.

## 2) Configure environment variables

Next.js loads env files in this order (later files override earlier ones):

1. `.env` — base defaults (in repo)
2. `.env.local` — your local secrets (**gitignored**; use this for real keys)

In [Supabase Dashboard](https://supabase.com/dashboard) → **Project Settings** → **API**, copy:

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (server-only; never expose in the browser) |

Paste them into `.env.local`, then restart `npm run dev`.

## 3) Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

Add the same environment variables in your Vercel project settings, then deploy.

