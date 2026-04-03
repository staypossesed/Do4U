$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env.local'

function Get-EnvValue([string]$name) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
    if ($line -match "^\s*$([regex]::Escape($name))\s*=\s*(.*)\s*$") {
      $v = $Matches[1].Trim()
      if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
      return $v
    }
  }
  return $null
}

$url = Get-EnvValue 'DIRECT_URL'
if (-not $url) { Write-Error 'DIRECT_URL missing'; exit 1 }

function Run-Sql([string]$sql) {
  $tmp = [System.IO.Path]::GetTempFileName() + '.sql'
  [System.IO.File]::WriteAllText($tmp, $sql, (New-Object System.Text.UTF8Encoding $false))
  Write-Host "--- $($sql.Substring(0, [Math]::Min(70, $sql.Length)))..."
  npx --yes supabase db query --db-url $url --agent=no -o table -f $tmp
  Remove-Item $tmp -Force
  if ($LASTEXITCODE -ne 0) { Write-Error "SQL failed"; exit 1 }
}

# Tables already created from previous run; safe to re-run with IF NOT EXISTS
Run-Sql "create table if not exists public.platform_connections (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, platform_slug text not null, access_token text not null, refresh_token text, token_expires_at timestamptz, platform_user_id text, platform_user_name text, extra jsonb default '{}'::jsonb, status text not null default 'connected' check (status in ('connected','disconnected','expired','error')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, platform_slug));"

Run-Sql 'alter table public.platform_connections enable row level security;'

Run-Sql 'drop policy if exists "Users manage own connections" on public.platform_connections;'
Run-Sql 'create policy "Users manage own connections" on public.platform_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);'

Run-Sql "create table if not exists public.external_posts (id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listings(id) on delete cascade, platform_slug text not null, external_id text, external_url text, status text not null default 'pending' check (status in ('pending','posted','failed','removed')), error text, posted_at timestamptz, created_at timestamptz not null default now(), unique (listing_id, platform_slug));"

Run-Sql 'alter table public.external_posts enable row level security;'

Run-Sql 'drop policy if exists "Users manage own external posts" on public.external_posts;'
Run-Sql 'create policy "Users manage own external posts" on public.external_posts for all using (listing_id in (select id from public.listings where user_id = auth.uid())) with check (listing_id in (select id from public.listings where user_id = auth.uid()));'

Run-Sql "create table if not exists public.external_messages (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, listing_id uuid references public.listings(id) on delete set null, external_post_id uuid references public.external_posts(id) on delete set null, platform_slug text not null, sender_name text not null default '', sender_platform_id text, text text not null, is_incoming boolean not null default true, read boolean not null default false, platform_chat_id text, created_at timestamptz not null default now());"

Run-Sql 'alter table public.external_messages enable row level security;'

Run-Sql 'drop policy if exists "Users see own external messages" on public.external_messages;'
Run-Sql 'create policy "Users see own external messages" on public.external_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);'

Run-Sql "do $$ begin alter publication supabase_realtime add table public.external_messages; exception when duplicate_object then null; end $$;"

Write-Host '=== Migration 008 complete ==='
