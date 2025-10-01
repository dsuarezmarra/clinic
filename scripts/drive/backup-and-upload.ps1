<
# Backup local SQLite DB, upload to Google Drive via rclone and update "latest" copy.
# Includes a simple remote lock to avoid concurrent edits from two devices.
# Prereqs: rclone (configured remote), sqlite3 (for integrity check), optional gpg for encryption.
# Usage: .\backup-and-upload.ps1 [-LocalDbPath <path>] [-RemoteRoot "drive:clinic-backups"] [-Keep 30] [-StopBackend]
>
param(
    [string]$LocalDbPath = "${PSScriptRoot}\..\..\backend\prisma\clinic.db",
    [string]$RemoteRoot = "drive:clinic-backups",
    [int]$Keep = 30,
    [switch]$StopBackend,
    [switch]$Encrypt,
    [string]$ServiceAccountFile
)

function Resolve-LocalPath($p) {
    try { return (Resolve-Path -Path $p).Path } catch { return $p }
}

$LocalDbPath = Resolve-LocalPath $LocalDbPath
$remote = "$RemoteRoot"
$rcloneGlobal = @()
if ($ServiceAccountFile) {
    $rcloneGlobal += "--drive-service-account-file"
    $rcloneGlobal += $ServiceAccountFile
}
$remoteLatest = "$remote/clinic-latest.db"
$remoteLock = "$remote/clinic.lock"

Write-Host "Local DB: $LocalDbPath"
Write-Host "Remote root: $remote"

function Remote-LockExists {
    param($lockPath)
    try {
        $json = & rclone @rcloneGlobal "lsjson" "--files-only" "--no-modtime" "$lockPath" 2>$null
        if ($LASTEXITCODE -ne 0 -or !$json) { return $false }
        return $true
    } catch { return $false }
}

function Acquire-RemoteLock {
    param($lockPath)
    $device = "$env:COMPUTERNAME/$env:USERNAME"
    $payload = @{ device = $device; ts = (Get-Date).ToString('o') } | ConvertTo-Json
    $tmp = Join-Path $env:TEMP "clinic.lock"
    $payload | Out-File -FilePath $tmp -Encoding utf8
    # Try to create the lock; if exists check age
    $exists = Remote-LockExists $lockPath
    if ($exists) {
        Write-Host "Lock exists on remote. Checking age..."
        try {
            $info = & rclone @rcloneGlobal "lsjson" "$lockPath" | ConvertFrom-Json
            $mod = [datetime]$info.ModTime
            $age = (Get-Date) - $mod
            if ($age.TotalMinutes -lt 60) {
                Write-Host "Remote lock is recent ($([int]$age.TotalMinutes) minutes). Aborting."; return $false
            } else {
                Write-Host "Remote lock is old ($([int]$age.TotalMinutes) minutes). Overriding."
            }
        } catch {
            Write-Host "Unable to read remote lock info; attempting to overwrite."
        }
    }
    # upload lock file
    & rclone @rcloneGlobal "copyto" "$tmp" "$lockPath" "--no-checksum" 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "Remote lock created."; return $true }
    Write-Host "Failed to create remote lock."; return $false
}

function Release-RemoteLock {
    param($lockPath)
    & rclone deletefile "$lockPath" 2>$null
    if ($LASTEXITCODE -eq 0) { Write-Host "Remote lock removed." } else { Write-Host "Warning: failed to remove remote lock (it may not exist)." }
}

if (!(Test-Path $LocalDbPath)) { Write-Host "DB not found at $LocalDbPath"; exit 1 }

if ($StopBackend) {
    Write-Host "Stopping Node backend processes (if any)..."
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

if (-not (Acquire-RemoteLock "$remote/clinic.lock")) { Write-Host "Could not acquire remote lock. Aborting."; exit 1 }

try {
    $now = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupName = "clinic-db-$now.db"
    $tmpBackup = Join-Path $env:TEMP $backupName
    Copy-Item -Path $LocalDbPath -Destination $tmpBackup -Force
    Write-Host "Created local temp backup: $tmpBackup"

    # Integrity check using sqlite3 if available
    $integrityOk = $false
    try {
        $check = & sqlite3 "$tmpBackup" "PRAGMA integrity_check;" 2>$null
        if ($check -and ($check -match 'ok')) { $integrityOk = $true }
    } catch { $integrityOk = $false }
    if (-not $integrityOk) { Write-Host "WARNING: integrity_check failed or sqlite3 not available. Proceed with caution." }

    # Optional: encrypt (not implemented here - placeholder)
    $uploadPath = $tmpBackup

    # Upload timestamped file
    Write-Host "Uploading $uploadPath -> $remote ..."
    & rclone @rcloneGlobal "copy" "$uploadPath" "$remote" "-P"
    if ($LASTEXITCODE -ne 0) { Write-Host "Upload failed."; throw }

    # Update latest copy (copyto to a known name)
    Write-Host "Updating latest copy on remote..."
    & rclone @rcloneGlobal "copyto" "$uploadPath" "$remoteLatest" "--no-checksum" "-P"
    if ($LASTEXITCODE -ne 0) { Write-Host "Updating latest failed."; throw }

    # Retention: remove old backups, keep $Keep
    Write-Host "Applying retention policy: keep last $Keep backups"
    $list = & rclone @rcloneGlobal "lsf" "$remote" "--files-only" | Where-Object { $_ -match 'clinic-db-' } | Sort-Object
    if ($list.Count -gt $Keep) {
        $toDelete = $list | Select-Object -First ($list.Count - $Keep)
        foreach ($f in $toDelete) {
            Write-Host "Deleting old remote backup: $f"
            & rclone @rcloneGlobal "deletefile" "$remote/$f"
        }
    }

    Write-Host "Backup and upload complete."
} finally {
    Release-RemoteLock "$remote/clinic.lock"
    # cleanup temp
    Try { Remove-Item $tmpBackup -ErrorAction SilentlyContinue } Catch {}
}
