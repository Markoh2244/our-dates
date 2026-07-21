# Supabase + GitHub + Vercel setup

Project ref: `xhgirwmvciumynakljen`  
Supabase URL: `https://xhgirwmvciumynakljen.supabase.co`  
GitHub repo: `Markoh2244/our-dates`  
Vercel project: `our-dates` → https://our-dates-drab.vercel.app

## What is already done

- GitHub repo is connected in Supabase (Integrations → GitHub).
- Migration files live in `supabase/migrations/` (Supabase applies these on push to `main`).
- Vercel env vars added:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `CALENDAR_ACCESS_CODE` = `liv-and-marko` (change in Vercel if you prefer)

## Finish in Supabase (2 minutes)

### 1. Enable the production branch

In Supabase → **Project Settings → Integrations → GitHub**:

1. Confirm repository is `Markoh2244/our-dates`.
2. Set **Production branch** to `main`.
3. Turn on **Deploy migrations on push** (or similar).

After the next push to `main`, the dashboard should show a migration instead of “No migrations”.

### 2. Connect Vercel (adds the service role key)

In Supabase → **Project Settings → Integrations → Vercel** (or “Get connected”):

1. Click **Connect Vercel**.
2. Choose the **our-dates** project under your Vercel account.
3. Confirm — this injects `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into Vercel.

**Or manually:** Supabase → **Project Settings → API** → copy **service_role** secret → Vercel → **our-dates → Settings → Environment Variables** → add `SUPABASE_SERVICE_ROLE_KEY` for Production, Preview, and Development.

### 3. Redeploy Vercel

After env vars are complete:

```bash
cd our-dates && npx vercel --prod
```

Or push any commit to `main` (GitHub auto-deploy).

## Verify it works

1. Open https://our-dates-drab.vercel.app/api/cloud  
   Should return `"cloudEnabled": true` and empty `missing` array.

2. On the site, enter access code **`liv-and-marko`** → **Unlock cloud**.

3. In Supabase → **Table Editor → events** — you should see 9 seeded timeline events after first unlock.

4. Edit an event on the site — the row should update in Supabase.

## Local development

```bash
cp .env.example .env.local
# Fill in keys from Supabase → Project Settings → API
npm run dev
```
