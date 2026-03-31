-- Platform OAuth connections: one row per user × platform.
-- Tokens are encrypted at rest by Supabase (vault or column-level if configured).
create table if not exists public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform_slug text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  platform_user_id text,
  platform_user_name text,
  extra jsonb default '{}',
  status text not null default 'connected' check (status in ('connected','disconnected','expired','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform_slug)
);

alter table public.platform_connections enable row level security;

create policy "Users manage own connections"
  on public.platform_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- External posts: tracks each listing → platform publication.
create table if not exists public.external_posts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  platform_slug text not null,
  external_id text,
  external_url text,
  status text not null default 'pending' check (status in ('pending','posted','failed','removed')),
  error text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, platform_slug)
);

alter table public.external_posts enable row level security;

create policy "Users manage own external posts"
  on public.external_posts for all
  using (
    listing_id in (select id from public.listings where user_id = auth.uid())
  )
  with check (
    listing_id in (select id from public.listings where user_id = auth.uid())
  );

-- External messages: buyer messages from all platforms in one place.
create table if not exists public.external_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  external_post_id uuid references public.external_posts(id) on delete set null,
  platform_slug text not null,
  sender_name text not null default '',
  sender_platform_id text,
  text text not null,
  is_incoming boolean not null default true,
  read boolean not null default false,
  platform_chat_id text,
  created_at timestamptz not null default now()
);

alter table public.external_messages enable row level security;

create policy "Users see own external messages"
  on public.external_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime for external messages
alter publication supabase_realtime add table public.external_messages;
