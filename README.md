# Liv & Marko Calendar

Our romantic memory calendar — events, addresses, photos, and notes for both of us.

**Live site:** [https://our-dates-drab.vercel.app](https://our-dates-drab.vercel.app)

## Features

- Real month calendar with our hardcoded timeline
- Liv note + Marko note on every event
- Addresses with map links
- Event types with color coding (walk, food, faith, adventure, etc.)
- Season-based romantic styling (warmer in summer)
- Free cloud persistence via Supabase (events + private photos)
- Local fallback when cloud is not configured yet

## How storage works

1. **Without cloud env vars:** saves in the browser (`localStorage`)
2. **With Supabase configured:** events go to Postgres, photos go to a private Storage bucket
3. Access is protected by a shared **access code** Liv and Marko both know
4. Photos are never public — the API creates signed URLs

## Free cloud setup (about 5 minutes)

### 1. Create a free Supabase project

Go to [https://supabase.com](https://supabase.com) → New project.

### 2. Run the SQL schema

In Supabase → **SQL Editor**, paste and run:

`supabase/schema.sql`

### 3. Add env vars locally

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CALENDAR_ACCESS_CODE=pick-a-secret-only-we-know
NEXT_PUBLIC_CLOUD_ENABLED=true
```

Find the keys in Supabase → **Project Settings → API**.

### 4. Add the same env vars on Vercel

Vercel project → **Settings → Environment Variables** → add the same keys for Production → Redeploy.

### 5. Unlock on the site

Open the live site → enter the shared access code → **Unlock cloud**.

After that, edits and photo uploads sync for both of us across devices.

## Local development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
npx vercel --prod
```

## Tech

Next.js · TypeScript · Tailwind CSS · Supabase (Postgres + Storage) · localStorage fallback
