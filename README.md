# HNA Foreign Rounds Form (Next.js + Supabase)

Public form for golfers to submit foreign rounds. Submissions are stored in Supabase (Postgres) so support staff can process them.

## 1) Create the Supabase table

In your Supabase SQL editor, run:

- `supabase/schema.sql`

## 2) Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; for the API route)

## 3) Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

Add the same environment variables in your Vercel project settings, then deploy.

