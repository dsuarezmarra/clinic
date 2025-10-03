# ============================================================================
# ⚙️ Script para Configurar Variables de Entorno del Frontend en Vercel
# ============================================================================
# 
# PREREQUISITO: Tener Vercel CLI instalado y autenticado
#   npm install -g vercel
#   vercel login
# 
# USO:
#   .\scripts\setup-frontend-vercel-env.ps1 [clientId]
# 
# EJEMPLOS:
#   .\scripts\setup-frontend-vercel-env.ps1 masajecorporaldeportivo
#   .\scripts\setup-frontend-vercel-env.ps1 actifisio
# 
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("masajecorporaldeportivo", "actifisio")]
    [string]$ClientId
)

# Configuración de proyectos
$VERCEL_PROJECTS = @{
    masajecorporaldeportivo = @{
        ProjectName = "masajecorporaldeportivo-web"
        ApiUrl = "https://masajecorporaldeportivo-api.vercel.app/api"
    }
    actifisio = @{
        ProjectName = "actifisio-web"
        ApiUrl = "https://actifisio-api.vercel.app/api"  # TODO: Actualizar con URL real
    }
}

function Write-Header {
    Write-Host ""
    Write-Host "⚙️  ============================================" -ForegroundColor Cyan
    Write-Host "   Variables de Entorno Frontend - Vercel" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Header

$projectConfig = $VERCEL_PROJECTS[$ClientId]
$projectName = $projectConfig.ProjectName

Write-Host "📋 Cliente: $ClientId" -ForegroundColor Cyan
Write-Host "📋 Proyecto: $projectName" -ForegroundColor Cyan
Write-Host ""

# Variables de entorno
$envVars = @{
    "VITE_CLIENT_ID" = $ClientId
    "VITE_API_URL" = $projectConfig.ApiUrl
}

Write-Host "📦 Variables a configurar:" -ForegroundColor Cyan
foreach ($key in $envVars.Keys) {
    Write-Host "   $key = $($envVars[$key])" -ForegroundColor Gray
}
Write-Host ""

# Instrucciones para Dashboard
Write-Host "🌐 Configuración en Vercel Dashboard:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Proyecto: $projectName" -ForegroundColor White
Write-Host "3. Settings → Environment Variables" -ForegroundColor White
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "   Variable: $key" -ForegroundColor Cyan
    Write-Host "   Value: $($envVars[$key])" -ForegroundColor Green
    Write-Host "   Environments: ✅ Production ✅ Preview ✅ Development" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "4. Guardar cambios y redeploy" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Configuración lista" -ForegroundColor Green
Write-Host ""
