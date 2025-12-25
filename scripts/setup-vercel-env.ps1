# Script para configurar variables de entorno en Vercel
# Lee el archivo .env del backend y las sube a Vercel

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "ð§ CONFIGURACIÃN DE VARIABLES DE ENTORNO" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Leer archivo .env
$envFile = Join-Path $PSScriptRoot ".." "backend" ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "â Error: No se encuentra el archivo backend/.env" -ForegroundColor Red
    exit 1
}

Write-Host "📖 Leyendo variables desde: backend/.env`n" -ForegroundColor Yellow

# Variables críticas que necesitamos
$requiredVars = @(
    "DATABASE_URL",
    "SUPABASE_URL", 
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY"
)

# Leer y parsear archivo .env
$envVars = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Z_]+=.+' } | ForEach-Object {
    $parts = $_ -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    $envVars[$key] = $value
}

# Agregar variables adicionales necesarias para producción
$envVars["NODE_ENV"] = "production"
$envVars["USE_SUPABASE"] = "true"
$envVars["DB_TYPE"] = "postgresql"
$envVars["FRONTEND_URL"] = "https://masajecorporaldeportivo.vercel.app"

# Verificar que existen las variables críticas
$missing = @()
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Error: Faltan las siguientes variables críticas en .env:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "â Variables encontradas:" -ForegroundColor Green
$envVars.Keys | Sort-Object | ForEach-Object {
    $value = $envVars[$_]
    $maskedValue = if ($_ -match "KEY|PASSWORD|SECRET|TOKEN") {
        $value.Substring(0, [Math]::Min(20, $value.Length)) + "..."
    } else {
        $value
    }
    Write-Host "   $_ = $maskedValue" -ForegroundColor White
}

if ($DryRun) {
    Write-Host "`nâ Dry run completado. No se subieron variables." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nð¤ Subiendo variables a Vercel..." -ForegroundColor Yellow
Write-Host "â³ Esto puede tardar un momento...`n" -ForegroundColor Gray

$success = 0
$failed = 0
$projectPath = Join-Path $PSScriptRoot ".." "backend"

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    
    Write-Host "   Configurando $key..." -NoNewline
    
    try {
        # Usar vercel env add para cada variable
        $tempFile = "$env:TEMP\vercel_env_value_$key.txt"
        $value | Set-Content -Path $tempFile -NoNewline
        
        Push-Location $projectPath
        $output = Get-Content $tempFile | vercel env add $key production --yes 2>&1
        Pop-Location
        
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " â" -ForegroundColor Green
            $success++
        } else {
            Write-Host " â ï¸  (puede que ya exista)" -ForegroundColor Yellow
            $success++
        }
    } catch {
        Write-Host " â" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "ð RESUMEN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Variables configuradas: $success" -ForegroundColor Green
Write-Host "   Variables fallidas: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -eq 0) {
    Write-Host "`nâ Â¡Todas las variables configuradas correctamente!" -ForegroundColor Green
    Write-Host "`nð SIGUIENTE PASO: Redeploy el backend" -ForegroundColor Yellow
    Write-Host "   Ejecuta: cd backend; vercel --prod`n" -ForegroundColor White
} else {
    Write-Host "`n??  Algunas variables fallaron. Configúralas manualmente en:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/dsuarezmarras-projects/api-clinic-personal/settings/environment-variables`n" -ForegroundColor White
}
