-- Add structured time ranges for calendar events

alter table public.events
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists timezone text not null default 'EST';
