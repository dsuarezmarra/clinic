# ============================================================================
# 🚀 Script de Deployment a Vercel por Cliente
# ============================================================================
# 
# PREREQUISITO: Tener Vercel CLI instalado
#   npm install -g vercel
#   vercel login
# 
# USO:
#   .\scripts\deploy-to-vercel.ps1 [clientId] [environment]
# 
# EJEMPLOS:
#   .\scripts\deploy-to-vercel.ps1 masajecorporaldeportivo production
#   .\scripts\deploy-to-vercel.ps1 actifisio preview
#   .\scripts\deploy-to-vercel.ps1 masajecorporaldeportivo development
# 
# ENVIRONMENTS:
#   - production  : Deploy a producción (requiere confirmación)
#   - preview     : Deploy de preview/staging
#   - development : Deploy de desarrollo
# 
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("masajecorporaldeportivo", "actifisio")]
    [string]$ClientId,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "preview", "development")]
    [string]$Environment = "preview"
)

# Configuración de proyectos Vercel por cliente
$VERCEL_PROJECTS = @{
    masajecorporaldeportivo = @{
        ProjectName = "masajecorporaldeportivo-web"
        Domain      = "masajecorporaldeportivo.vercel.app"
        OrgId       = ""  # TODO: Actualizar con tu Vercel Team/Org ID
        CustomDomain = ""  # TODO: Opcional - dominio personalizado
    }
    actifisio = @{
        ProjectName = "actifisio-web"
        Domain      = "actifisio.vercel.app"
        OrgId       = ""  # TODO: Actualizar con tu Vercel Team/Org ID
        CustomDomain = ""  # TODO: Opcional - dominio personalizado
    }
}

# Colores para output
function Write-Header {
    Write-Host ""
    Write-Host "🚀 ============================================" -ForegroundColor Cyan
    Write-Host "   Deployment a Vercel - Multi-Cliente" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# ============================================================================
# Validaciones
# ============================================================================

Write-Header

Write-Step "Cliente: $ClientId"
Write-Step "Entorno: $Environment"
Write-Host ""

# 1. Verificar que Vercel CLI esté instalado
Write-Step "Verificando Vercel CLI..."
$vercelVersion = vercel --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Vercel CLI no está instalado"
    Write-Host "Por favor ejecuta: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}
Write-Success "Vercel CLI v$vercelVersion instalado"
Write-Host ""

# 2. Verificar autenticación
Write-Step "Verificando autenticación con Vercel..."
$vercelUser = vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "No estás autenticado en Vercel"
    Write-Host "Por favor ejecuta: vercel login" -ForegroundColor Yellow
    exit 1
}
Write-Success "Autenticado como: $vercelUser"
Write-Host ""

# 3. Obtener configuración del proyecto
$projectConfig = $VERCEL_PROJECTS[$ClientId]
$projectName = $projectConfig.ProjectName
$domain = $projectConfig.Domain

Write-Step "Proyecto Vercel: $projectName"
Write-Step "Dominio: $domain"
Write-Host ""

# ============================================================================
# Build Local
# ============================================================================

Write-Step "Paso 1: Generando manifest.json para $ClientId..."
& "$PSScriptRoot\generate-manifest.ps1" -ClientId $ClientId
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Error generando manifest"
    exit 1
}
Write-Host ""

Write-Step "Paso 2: Ejecutando build local..."
$env:VITE_CLIENT_ID = $ClientId

# Ir al directorio frontend
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
Push-Location $frontendPath

try {
    # Ejecutar build
    Write-Host "🔨 Compilando aplicación Angular..." -ForegroundColor Cyan
    ng build --configuration production
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error en el build"
        Pop-Location
        exit 1
    }
    
    Write-Success "Build completado exitosamente"
    Write-Host ""
    
} finally {
    Pop-Location
    Remove-Item Env:\VITE_CLIENT_ID -ErrorAction SilentlyContinue
}

# ============================================================================
# Deployment a Vercel
# ============================================================================

Write-Step "Paso 3: Desplegando a Vercel..."
Write-Host ""

# Construir comando de Vercel
$vercelArgs = @(
    "--cwd", $frontendPath,
    "--yes"  # Skip confirmation prompts
)

# Agregar flag de entorno
switch ($Environment) {
    "production" {
        Write-Warning "⚠️  DEPLOYMENT A PRODUCCIÓN"
        Write-Host "   Este deployment se publicará en: $domain" -ForegroundColor Yellow
        $confirmation = Read-Host "¿Estás seguro? (y/n)"
        if ($confirmation -ne "y") {
            Write-Host "Deployment cancelado" -ForegroundColor Yellow
            exit 0
        }
        $vercelArgs += "--prod"
    }
    "development" {
        Write-Host "📦 Deployment de desarrollo" -ForegroundColor Cyan
        # No se agrega flag adicional para development
    }
    default {
        Write-Host "🔍 Deployment de preview" -ForegroundColor Cyan
        # No se agrega flag adicional para preview
    }
}

# Establecer variables de entorno para el deployment
$env:VITE_CLIENT_ID = $ClientId

# Ejecutar deployment
Write-Host "🚀 Ejecutando: vercel $($vercelArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

$deployOutput = vercel @vercelArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Success "✨ Deployment exitoso!"
    Write-Host ""
    Write-Host "🌐 URL del deployment:" -ForegroundColor Cyan
    
    # Extraer URL del output
    $deployUrl = $deployOutput | Select-String -Pattern "https://.*\.vercel\.app" | Select-Object -First 1
    if ($deployUrl) {
        Write-Host "   $($deployUrl.Matches.Value)" -ForegroundColor Green
    }
    
    if ($Environment -eq "production") {
        Write-Host "   $domain" -ForegroundColor Green
    }
    
    Write-Host ""
    
    # Mostrar próximos pasos
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Verificar que la aplicación cargue correctamente" -ForegroundColor Gray
    Write-Host "   2. Probar el tema y configuración del cliente $ClientId" -ForegroundColor Gray
    Write-Host "   3. Verificar que el header X-Tenant-Slug se envíe correctamente" -ForegroundColor Gray
    
    if ($projectConfig.CustomDomain) {
        Write-Host "   4. Configurar dominio personalizado: $($projectConfig.CustomDomain)" -ForegroundColor Gray
    }
    
} else {
    Write-Host ""
    Write-Error-Custom "Error en el deployment"
    Write-Host $deployOutput
    exit 1
}

# Limpiar variables de entorno
Remove-Item Env:\VITE_CLIENT_ID -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 ¡Proceso completado!" -ForegroundColor Green
Write-Host ""
