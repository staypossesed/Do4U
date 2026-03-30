-- ClawEverything: Initial Database Schema
-- Run this in Supabase SQL Editor or via CLI migration

-- Enable PostGIS for geolocation
create extension if not exists postgis;

-- ============================================
-- USERS
-- ============================================
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  location geography(point, 4326),
  preferences jsonb default '{}',
  style_examples text[] default '{}',
  locale text default 'ru' check (locale in ('ru', 'en')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- LISTINGS
-- ============================================
create type listing_status as enum ('draft', 'active', 'sold', 'archived', 'moderation');
create type listing_category as enum ('clothing', 'shoes', 'accessories', 'electronics', 'books', 'toys', 'furniture');

create table public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  title_en text,
  description text not null,
  description_en text,
  price numeric(12,2) not null check (price >= 0),
  suggested_price numeric(12,2),
  currency text default 'RUB',
  status listing_status default 'draft' not null,
  category listing_category not null,
  tags text[] default '{}',
  location geography(point, 4326),
  ai_metadata jsonb default '{}',
  voice_transcript text,
  views_count integer default 0,
  favorites_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.listings enable row level security;

create policy "Anyone can view active listings"
  on public.listings for select
  using (status = 'active' or auth.uid() = user_id);

create policy "Users can insert own listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = user_id);

create policy "Users can delete own listings"
  on public.listings for delete
  using (auth.uid() = user_id);

create index idx_listings_user on public.listings(user_id);
create index idx_listings_status on public.listings(status);
create index idx_listings_category on public.listings(category);
create index idx_listings_location on public.listings using gist(location);
create index idx_listings_created on public.listings(created_at desc);

-- ============================================
-- LISTING IMAGES
-- ============================================
create table public.listing_images (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  url_original text not null,
  url_enhanced text,
  "order" integer not null default 0,
  ai_analysis jsonb default '{}',
  created_at timestamptz default now() not null
);

alter table public.listing_images enable row level security;

create policy "Anyone can view images of visible listings"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
      and (l.status = 'active' or l.user_id = auth.uid())
    )
  );

create policy "Users can manage images of own listings"
  on public.listing_images for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

create index idx_listing_images_listing on public.listing_images(listing_id);

-- ============================================
-- CHATS
-- ============================================
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  buyer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  messages jsonb default '[]',
  last_message_at timestamptz,
  is_claw_managed boolean default true,
  status text default 'active' check (status in ('active', 'closed', 'blocked')),
  created_at timestamptz default now() not null
);

alter table public.chats enable row level security;

create policy "Chat participants can access their chats"
  on public.chats for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create chats"
  on public.chats for insert
  with check (auth.uid() = buyer_id);

create policy "Participants can update chats"
  on public.chats for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create index idx_chats_listing on public.chats(listing_id);
create index idx_chats_buyer on public.chats(buyer_id);
create index idx_chats_seller on public.chats(seller_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create index idx_notifications_user on public.notifications(user_id, read, created_at desc);

-- ============================================
-- MODERATION LOGS
-- ============================================
create type moderation_status as enum ('pending', 'approved', 'rejected', 'flagged');

create table public.moderation_logs (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  status moderation_status default 'pending' not null,
  ai_score numeric(3,2),
  ai_reason text,
  reviewer_id uuid references public.users(id),
  reviewer_notes text,
  created_at timestamptz default now() not null
);

alter table public.moderation_logs enable row level security;

create policy "Only admins and listing owners can view moderation logs"
  on public.moderation_logs for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

create index idx_moderation_listing on public.moderation_logs(listing_id);
create index idx_moderation_status on public.moderation_logs(status);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger update_listings_updated_at
  before update on public.listings
  for each row execute function public.update_updated_at();

-- ============================================
-- STORAGE BUCKETS (run separately or via dashboard)
-- ============================================
-- insert into storage.buckets (id, name, public)
-- values ('listing-images', 'listing-images', true);
--
-- create policy "Anyone can view listing images"
--   on storage.objects for select
--   using (bucket_id = 'listing-images');
--
-- create policy "Authenticated users can upload listing images"
--   on storage.objects for insert
--   with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
