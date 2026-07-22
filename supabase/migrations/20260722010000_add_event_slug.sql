-- Human-readable share slugs, e.g. 07252026themet

alter table public.events
  add column if not exists slug text;

create unique index if not exists events_slug_uidx
  on public.events (slug)
  where slug is not null;
