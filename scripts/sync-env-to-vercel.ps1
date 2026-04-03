# Sync selected keys from .env.local to linked Vercel project (run from repo root).
# Requires: Vercel CLI on PATH (npm i -g vercel). Avoids npx when npm reports ECOMPROMISED.
# Run once: vercel link --project <slug> --scope <team> --yes
# Does not print secret values.
# Sensitive vars are not pushed to Vercel "Development" (API forbids); use .env.local for vercel dev.

# Vercel CLI writes progress to stderr; 'Stop' makes PowerShell treat it as a terminating error.
$ErrorActionPreference = 'Continue'
# Non-interactive / no TTY: avoids rare hangs on `vercel env add` in automation.
$env:CI = 'true'
$root = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $root '.env.local'
if (-not (Test-Path -LiteralPath $envFile)) {
  Write-Error "Missing $envFile"
  exit 1
}

Set-Location $root
if (-not (Test-Path -LiteralPath (Join-Path $root '.vercel/project.json'))) {
  Write-Error 'Run: vercel link --project do4-u --scope do4-u --yes'
  exit 1
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Error 'Node.js not found on PATH.'
  exit 1
}
$vercelJs = Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'npm\node_modules\vercel\dist\vc.js'
if (-not (Test-Path -LiteralPath $vercelJs)) {
  $npmGlobal = npm root -g 2>$null
  if ($npmGlobal) {
    $alt = Join-Path ($npmGlobal.Trim()) 'vercel\dist\vc.js'
    if (Test-Path -LiteralPath $alt) { $vercelJs = $alt }
  }
}
if (-not (Test-Path -LiteralPath $vercelJs)) {
  Write-Error 'Global Vercel CLI not found (npm i -g vercel).'
  exit 1
}
# CLI quirk: non-interactive "all Preview branches" needs a doubled-quote argv (see vercel/vercel#15415).
$previewBranchHack = [char]34 + [char]34

function Invoke-VercelCli {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$VercelArgv,
    [switch]$Quiet
  )
  # `vercel env add` can leave stdio handles open so the parent shell never resumes after `& node`.
  # Running the CLI in a job and collecting output with `@( ... 2>&1 )` avoids that hang.
  # Do not use `-ArgumentList` for string[] — deserialization breaks splatting (`@Va`); use `$Using:`.
  $workDir = (Get-Location).Path
  $jsLocal = $vercelJs
  $argvLocal = @($VercelArgv)
  $job = Start-Job -ScriptBlock {
    $env:CI = 'true'
    Set-Location -LiteralPath $Using:workDir
    $lines = @(& node $Using:jsLocal @Using:argvLocal 2>&1)
    return @{ Lines = $lines; Code = $LASTEXITCODE }
  }

  $null = Wait-Job $job -Timeout 300
  if ($job.State -ne 'Completed') {
    Stop-Job $job -Force -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    Write-Warning "Vercel CLI timed out (300s). Args: $($VercelArgv[0..[Math]::Min(2, $VercelArgv.Length - 1)] -join ' ') ..."
    return 124
  }

  $bag = Receive-Job $job -ErrorAction Continue
  Remove-Job $job -Force -ErrorAction SilentlyContinue
  if (-not $bag -or $null -eq $bag.Code) { return 1 }
  $code = [int]$bag.Code

  if (-not $Quiet -and $bag.Lines) {
    foreach ($line in $bag.Lines) {
      if ($line -is [System.Management.Automation.ErrorRecord]) { Write-Host $line }
      else { Write-Host $line }
    }
  }

  return $code
}

function Parse-EnvFile([string]$Path) {
  $out = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $name = $line.Substring(0, $eq).Trim()
    $val = $line.Substring($eq + 1).Trim()
    if ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    if ($val.Length -ge 2 -and $val.StartsWith("'") -and $val.EndsWith("'")) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    $out[$name] = $val
  }
  $out
}

$e = Parse-EnvFile $envFile
$keys = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROK_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'DIRECT_URL',
  'AVITO_CLIENT_ID','AVITO_CLIENT_SECRET','VK_APP_ID','VK_APP_SECRET',
  'EBAY_CLIENT_ID','EBAY_CLIENT_SECRET','OLX_CLIENT_ID','OLX_CLIENT_SECRET','OLX_API_KEY'
)
$sensitive = [string[]]@(
  'SUPABASE_SERVICE_ROLE_KEY','GROK_API_KEY','OPENAI_API_KEY','DATABASE_URL','DIRECT_URL',
  'AVITO_CLIENT_SECRET','VK_APP_SECRET','EBAY_CLIENT_SECRET','OLX_CLIENT_SECRET','OLX_API_KEY'
)

$productionUrl = 'https://do4-u.vercel.app'

foreach ($k in $keys) {
  if (-not $e.ContainsKey($k)) { continue }
  $v = $e[$k]
  if ([string]::IsNullOrWhiteSpace($v)) { continue }
  $sens = $sensitive -contains $k

  foreach ($target in @('production','preview','development')) {
    if ($sens -and $target -eq 'development') { continue }
    $valUse = $v
    if ($k -eq 'NEXT_PUBLIC_APP_URL' -and $valUse -match 'localhost') {
      if ($target -eq 'production') { $valUse = $productionUrl }
      elseif ($target -eq 'preview') { $valUse = $productionUrl }
    }

    Write-Host "vercel env: $k @ $target"
    $null = Invoke-VercelCli -VercelArgv @('env', 'rm', $k, $target, '--yes') -Quiet

    $argv = [System.Collections.ArrayList]@('env', 'add', $k, $target, '--value', $valUse, '--yes', '--force', '--non-interactive')
    if ($sens) { [void]$argv.Add('--sensitive') }
    if ($target -eq 'preview') { [void]$argv.Add($previewBranchHack) }

    $code = Invoke-VercelCli -VercelArgv ([string[]]$argv.ToArray())
    if ($code -ne 0) {
      Write-Warning "Failed $k ($target) exit code $code"
    }
  }
}

Write-Host 'Done.'
