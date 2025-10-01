# Restore latest clinic DB from remote (rclone). Performs integrity check and replaces local DB safely.
# Usage: .\restore-latest.ps1 [-LocalDbPath <path>] [-RemoteRoot "drive:clinic-backups"] [-StopBackend] [-ServiceAccountFile <path>]

param(
    [string]$LocalDbPath = "${PSScriptRoot}\..\..\backend\prisma\clinic.db",
    [string]$RemoteRoot = "drive:clinic-backups",
    [switch]$StopBackend,
    [switch]$Decrypt,
    [string]$ServiceAccountFile
)

function Resolve-LocalPath($p) {
    try { return (Resolve-Path -Path $p).Path } catch { return $p }
}

$LocalDbPath = Resolve-LocalPath $LocalDbPath
$remote = "$RemoteRoot"
$remoteLatest = "$remote/clinic-latest.db"
$remoteLock = "$remote/clinic.lock"

Write-Host "Local DB: $LocalDbPath"
Write-Host "Remote root: $remote"

# Prepare optional global rclone args when using a service account JSON
$rcloneGlobal = @()
if ($ServiceAccountFile) {
    $rcloneGlobal += "--drive-service-account-file"
    $rcloneGlobal += $ServiceAccountFile
}

# Check remote latest exists
try {
    $info = & rclone @rcloneGlobal lsjson "$remoteLatest" 2>$null | ConvertFrom-Json
} catch { $info = $null }
if (-not $info) {
    Write-Host "No latest file on remote. Attempting to list backups..."
    $files = & rclone @rcloneGlobal lsf "$remote" "--files-only" | Where-Object { $_ -match 'clinic-db-' } | Sort-Object
    if (-not $files -or $files.Count -eq 0) { Write-Host "No backups found on remote. Aborting."; exit 1 }
    $latest = $files[-1]
    $remoteLatest = "$remote/$latest"
}

# Simple check for remote lock
try {
    $lockInfo = & rclone @rcloneGlobal lsjson "$remoteLock" 2>$null | ConvertFrom-Json
    if ($lockInfo) {
        $mod = [datetime]$lockInfo.ModTime
        $age = (Get-Date) - $mod
        if ($age.TotalMinutes -lt 15) { Write-Host "Remote lock is recent ($([int]$age.TotalMinutes) minutes). Aborting."; exit 1 }
        else { Write-Host "Remote lock is old; continuing." }
    }
} catch {}

if ($StopBackend) { Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue }

$tmpDownload = Join-Path $env:TEMP "clinic-latest-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
Write-Host "Downloading $remoteLatest -> $tmpDownload"
& rclone @rcloneGlobal copyto "$remoteLatest" "$tmpDownload" -P
if ($LASTEXITCODE -ne 0) { Write-Host "Download failed."; exit 1 }

# Optional decrypt step would go here if using gpg

# Integrity check
try {
    $check = & sqlite3 "$tmpDownload" "PRAGMA integrity_check;" 2>$null
    if (-not ($check -and ($check -match 'ok'))) { Write-Host "Integrity check failed: $check"; exit 1 }
} catch { Write-Host "sqlite3 not available; skipping integrity check." }

# Backup current DB locally
if (Test-Path $LocalDbPath) {
    $bak = "$LocalDbPath.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $LocalDbPath $bak -Force
    Write-Host "Existing DB backed up to $bak"
}

Copy-Item $tmpDownload $LocalDbPath -Force
Write-Host "Restored latest DB to $LocalDbPath"
