-- Marketplace platforms per country + user geo fields for Do4U global routing

-- ============================================
-- USER GEO (explicit fields + existing PostGIS location)
-- ============================================
alter table public.users
  add column if not exists country_code varchar(2),
  add column if not exists city text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.users.country_code is 'ISO 3166-1 alpha-2, from IP/GPS bootstrap';
comment on column public.users.city is 'City name from reverse geocode or IP database';

-- ============================================
-- MARKETPLACE_PLATFORMS
-- ============================================
create table if not exists public.marketplace_platforms (
  id uuid primary key default gen_random_uuid(),
  country_code varchar(2) not null,
  name text not null,
  slug text not null,
  is_api_available boolean not null default false,
  posting_method text not null default 'template'
    check (posting_method in ('api', 'template', 'manual')),
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (country_code, slug)
);

create index if not exists idx_marketplace_platforms_country
  on public.marketplace_platforms (country_code, sort_order);

alter table public.marketplace_platforms enable row level security;

-- Reference data: readable by any authenticated user
create policy "marketplace_platforms_select_authenticated"
  on public.marketplace_platforms
  for select
  to authenticated
  using (true);

-- ============================================
-- SEED (US, RU, DE, FR, GB, ES, IT, PL)
-- ============================================
insert into public.marketplace_platforms
  (country_code, name, slug, is_api_available, posting_method, description, sort_order)
values
  -- United States
  ('US', 'eBay', 'ebay', true, 'api', 'Automatic posting via API (planned)', 1),
  ('US', 'Facebook Marketplace', 'facebook_marketplace', false, 'template', 'Copy template and publish manually on Facebook', 2),
  ('US', 'OfferUp', 'offerup', false, 'template', 'Copy template for OfferUp', 3),
  ('US', 'Craigslist', 'craigslist', false, 'template', 'Copy template for Craigslist', 4),
  -- Russia
  ('RU', 'Avito', 'avito', false, 'template', 'Копировать шаблон для Авито', 1),
  ('RU', 'VK Маркет', 'vk_marketplace', false, 'template', 'Шаблон для VK Маркет', 2),
  ('RU', 'Юла', 'yula', false, 'template', 'Шаблон для Юлы', 3),
  -- Germany
  ('DE', 'Kleinanzeigen', 'kleinanzeigen', false, 'template', 'Vorlage für Kleinanzeigen', 1),
  ('DE', 'Vinted', 'vinted', false, 'template', 'Vorlage für Vinted', 2),
  -- France
  ('FR', 'Leboncoin', 'leboncoin', false, 'template', 'Modèle pour Leboncoin', 1),
  ('FR', 'Vinted', 'vinted_fr', false, 'template', 'Modèle pour Vinted', 2),
  -- United Kingdom (ISO: GB)
  ('GB', 'Gumtree', 'gumtree', false, 'template', 'Template for Gumtree UK', 1),
  ('GB', 'Vinted', 'vinted_gb', false, 'template', 'Template for Vinted', 2),
  -- Spain
  ('ES', 'Wallapop', 'wallapop', false, 'template', 'Plantilla para Wallapop', 1),
  ('ES', 'Milanuncios', 'milanuncios', false, 'template', 'Plantilla para Milanuncios', 2),
  -- Italy
  ('IT', 'Subito', 'subito', false, 'template', 'Template per Subito.it', 1),
  ('IT', 'Vinted', 'vinted_it', false, 'template', 'Template per Vinted', 2),
  -- Poland
  ('PL', 'OLX', 'olx_pl', false, 'template', 'Szablon dla OLX', 1),
  ('PL', 'Allegro', 'allegro', false, 'template', 'Szablon dla Allegro Lokalnie / ogłoszenia', 2)
on conflict (country_code, slug) do nothing;
