-- Liv & Marko calendar — free Supabase persistence
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null default '',
  schedule text,
  slug text,
  season text not null default 'anytime',
  status text not null default 'wishlist',
  event_type text not null default 'cozy',
  address text,
  liv_note text,
  marko_note text,
  image_url text,
  image_name text,
  planned_for date,
  start_time text,
  end_time text,
  timezone text not null default 'EST',
  updated_at timestamptz not null default now()
);

create index if not exists events_planned_for_idx on public.events (planned_for);

-- Lock down direct public access (our Next.js API uses the service role)
alter table public.events enable row level security;

-- Storage bucket for event photos (private; served via signed URLs)
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;

-- No public storage policies: only service role (API) can read/write objects
;