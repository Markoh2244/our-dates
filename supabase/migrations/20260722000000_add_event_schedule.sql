-- Separate itinerary / schedule text from the shared memory field

alter table public.events
  add column if not exists schedule text;
