-- Idempotent: safe if 004_marketplace_platforms_and_geo.sql already ran.
-- Use when profile "Save selling location" fails with unknown column errors
-- (project applied 001–003 but skipped 004).
-- Note: `supabase db query -f` runs one statement per call; run this file in SQL Editor, or use scripts/verify-supabase-geo.ps1.

alter table public.users
  add column if not exists country_code varchar(2),
  add column if not exists city text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.users.country_code is 'ISO 3166-1 alpha-2, from IP/GPS or profile';
comment on column public.users.city is 'City for local market / AI context';
