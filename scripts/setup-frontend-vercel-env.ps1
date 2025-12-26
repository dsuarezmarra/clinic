# ============================================================================
# âï¸ Script para Configurar Variables de Entorno del Frontend en Vercel
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
        ProjectName = "masajecorporaldeportivo"
        ApiUrl = "https://api-clinic-personal.vercel.app/api"
    }
    actifisio = @{
        ProjectName = "actifisio"
        ApiUrl = "https://api-clinic-personal.vercel.app/api"
    }
}

function Write-Header {
    Write-Host ""
    Write-Host "âï¸  ============================================" -ForegroundColor Cyan
    Write-Host "   Variables de Entorno Frontend - Vercel" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Header

$projectConfig = $VERCEL_PROJECTS[$ClientId]
$projectName = $projectConfig.ProjectName

Write-Host "ð Cliente: $ClientId" -ForegroundColor Cyan
Write-Host "ð Proyecto: $projectName" -ForegroundColor Cyan
Write-Host ""

# Variables de entorno
$envVars = @{
    "VITE_CLIENT_ID" = $ClientId
    "VITE_API_URL" = $projectConfig.ApiUrl
}

Write-Host "ð¦ Variables a configurar:" -ForegroundColor Cyan
foreach ($key in $envVars.Keys) {
    Write-Host "   $key = $($envVars[$key])" -ForegroundColor Gray
}
Write-Host ""

# Instrucciones para Dashboard
Write-Host "ð ConfiguraciÃ³n en Vercel Dashboard:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Proyecto: $projectName" -ForegroundColor White
Write-Host "3. Settings â Environment Variables" -ForegroundColor White
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "   Variable: $key" -ForegroundColor Cyan
    Write-Host "   Value: $($envVars[$key])" -ForegroundColor Green
    Write-Host "   Environments: â Production â Preview â Development" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "4. Guardar cambios y redeploy" -ForegroundColor White
Write-Host ""
Write-Host "ð ConfiguraciÃ³n lista" -ForegroundColor Green
Write-Host ""
