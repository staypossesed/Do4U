# Reads DIRECT_URL from .env.local (does not print it). Verifies user geo columns; optional apply 007.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env.local'
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found at $envFile"
  exit 1
}

function Get-EnvValue([string]$name) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
    if ($line -match "^\s*$([regex]::Escape($name))\s*=\s*(.*)\s*$") {
      $v = $Matches[1].Trim()
      if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
      if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length - 2) }
      return $v
    }
  }
  return $null
}

$directUrl = Get-EnvValue 'DIRECT_URL'
if ([string]::IsNullOrWhiteSpace($directUrl)) {
  Write-Host 'DIRECT_URL is missing in .env.local. Uncomment the DIRECT_URL line and set YOUR_PASSWORD.'
  exit 1
}
if ($directUrl -match 'YOUR_PASSWORD|\[YOUR-PASSWORD\]') {
  Write-Host 'DIRECT_URL still contains a placeholder password. Replace with your real DB password.'
  exit 1
}

Set-Location $root

# supabase db query -f rejects multi-statement files; mirror 007 as separate one-shot queries.
Write-Host '--- Ensuring user geo columns (007, idempotent) ---'
$alterGeo = 'alter table public.users add column if not exists country_code varchar(2), add column if not exists city text, add column if not exists latitude double precision, add column if not exists longitude double precision;'
npx --yes supabase db query --db-url $directUrl --agent=no -o table "$alterGeo"
if ($LASTEXITCODE -ne 0) {
  Write-Host 'ALTER users geo columns failed (check DIRECT_URL and URL-encode special chars in password).'
  exit $LASTEXITCODE
}
npx --yes supabase db query --db-url $directUrl --agent=no -o table "comment on column public.users.country_code is 'ISO 3166-1 alpha-2, from IP/GPS or profile';"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx --yes supabase db query --db-url $directUrl --agent=no -o table "comment on column public.users.city is 'City for local market / AI context';"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$sql1 = "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name in ('country_code','city','latitude','longitude') order by 1;"
Write-Host '--- Geo columns on public.users ---'
npx --yes supabase db query --db-url $directUrl --agent=no -o table "$sql1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$sql2 = 'select count(*) as marketplace_platforms_count from public.marketplace_platforms;'
Write-Host '--- marketplace_platforms row count ---'
npx --yes supabase db query --db-url $directUrl --agent=no -o table "$sql2"
exit $LASTEXITCODE
