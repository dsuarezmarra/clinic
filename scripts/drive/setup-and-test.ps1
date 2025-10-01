# setup-and-test.ps1
# Helper simple para comprobar rclone y el JSON de service account.
# Ejecutar desde la raíz del repo: .\scripts\drive\setup-and-test.ps1

param(
    [string]$ServiceAccountRelative = '.\scripts\drive\drive-sa.json',
    [string]$FolderId = '1xJfMrG9dYct4FPo3gFhYyoRQQvX3-JJe',
    [switch]$AutoInstall
)

function ok([string]$m) { Write-Host "[OK] $m" -ForegroundColor Green }
function note([string]$m) { Write-Host "[NOTE] $m" -ForegroundColor Cyan }
function err([string]$m) { Write-Host "[ERROR] $m" -ForegroundColor Red }

Write-Host "Drive setup helper - comprobaciones rápidas"

# Resolve paths
$servicePathObj = Resolve-Path -Path $ServiceAccountRelative -ErrorAction SilentlyContinue
if ($servicePathObj) { $servicePath = $servicePathObj.Path } else { $servicePath = Join-Path (Get-Location) $ServiceAccountRelative }

# Check rclone
$rcloneCmd = Get-Command rclone -ErrorAction SilentlyContinue
if (-not $rcloneCmd) {
    if ($AutoInstall) {
        note 'rclone no está en PATH. Intentando descarga local en scripts/drive/bin...'
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
        $binDir = Join-Path $scriptDir 'bin'
        if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir | Out-Null }
        $zipPath = Join-Path $binDir 'rclone.zip'
        $url = 'https://downloads.rclone.org/rclone-current-windows-amd64.zip'
        try {
            Write-Host "Descargando rclone desde $url ..."
            Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
            Write-Host 'Extrayendo...'
            Expand-Archive -LiteralPath $zipPath -DestinationPath $binDir -Force
            # localizar rclone.exe dentro de la carpeta extraída
            $exe = Get-ChildItem -Path $binDir -Filter rclone.exe -Recurse -File | Select-Object -First 1
            if ($exe) {
                $rclonePath = $exe.FullName
                ok "rclone instalado localmente en: $rclonePath"
                Write-Host "Usar el binario con: & '$rclonePath' <comando>"
            } else {
                err 'No se encontró rclone.exe después de la extracción.'
                exit 2
            }
        } catch {
            err "Error descargando/instalando rclone: $_"
            exit 2
        }
    } else {
        err 'rclone no está instalado o no está en PATH. Instálalo: https://rclone.org/downloads/ o vuelve a ejecutar con -AutoInstall para descargar localmente.'
        exit 2
    }
} else {
    ok "rclone: $($rcloneCmd.Path)"
}

# Check sqlite3 (optional)
$sqliteCmd = Get-Command sqlite3 -ErrorAction SilentlyContinue
if ($sqliteCmd) { ok "sqlite3: $($sqliteCmd.Path)" } else { note 'sqlite3 no detectado: la comprobación de integridad se omitirá si no está disponible.' }

if (-not (Test-Path $servicePath)) {
    err "No se encontró el JSON de service account en: $servicePath"
    Write-Host 'Opciones:'
    Write-Host "  1) Descarga el JSON desde Google Cloud Console y cópialo a: $ServiceAccountRelative"
    Write-Host "  2) Configura un remote rclone interactivo y usa ese remote en los scripts"
    Write-Host "Ejemplo (PowerShell): Copy-Item -Path 'C:\ruta\a\tu-sa.json' -Destination '$ServiceAccountRelative' -Force"
    exit 3
}

ok "Encontrado JSON de cuenta de servicio: $servicePath"

try {
    $json = Get-Content -Raw -Path $servicePath | ConvertFrom-Json
    $clientEmail = $json.client_email
    if (-not $clientEmail) { throw 'client_email no encontrado en JSON' }
    ok "client_email: $clientEmail"
    Write-Host 'Comparte la carpeta Drive con ese email (Editor) desde la UI de Google Drive.'
} catch {
    err "Error leyendo el JSON o client_email ausente: $_"
    exit 4
}

Write-Host ''
Write-Host 'Pruebas sugeridas (ejecuta manualmente y pega la salida si hay errores):'
Write-Host ''
Write-Host '1) Listar por folder-id con la cuenta de servicio:'
Write-Host "   rclone --drive-service-account-file '$servicePath' lsf drive: --drive-root-folder-id $FolderId"
Write-Host ''
Write-Host '2) (Opcional) Crear remote apuntando a esa carpeta para usar en scripts sin pasar --drive-service-account-file:'
Write-Host "   rclone config create clinicdrive drive service_account_file $servicePath root_folder_id $FolderId"
Write-Host "   rclone lsf clinicdrive:"
Write-Host ''
Write-Host '3) Restaurar ejemplo (local):'
Write-Host "   .\scripts\drive\restore-latest.ps1 -ServiceAccountFile '$servicePath' -RemoteRoot 'clinicdrive:' -StopBackend"
Write-Host ''
Write-Host '4) Subir backup ejemplo (local):'
Write-Host "   .\scripts\drive\backup-and-upload.ps1 -ServiceAccountFile '$servicePath' -RemoteRoot 'clinicdrive:' -StopBackend"
Write-Host ''
ok 'Helper listo. Ejecuta las pruebas indicadas y pega aquí cualquier salida si necesitas ayuda para depurarlas.'
