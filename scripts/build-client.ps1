# 🎨 Script de Prueba Multi-Cliente
# Este script permite hacer builds con diferentes configuraciones de cliente

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("masajecorporaldeportivo", "actifisio", "default")]
    [string]$ClientId = "default"
)

Write-Host "`n🚀 BUILD MULTI-CLIENTE" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Ruta del proyecto
$projectPath = "c:\Users\dsuarez1\git\clinic\frontend"
Set-Location $projectPath

# 1. Generar manifest para el cliente
Write-Host "🎨 Paso 1: Generando manifest.json para cliente..." -ForegroundColor Cyan
if ($ClientId -eq "default") {
    & "$PSScriptRoot\generate-manifest.ps1"
} else {
    & "$PSScriptRoot\generate-manifest.ps1" -ClientId $ClientId
}

Write-Host ""

# 2. Build de Angular
if ($ClientId -eq "default") {
    Write-Host "📦 Paso 2: Build SIN variable de entorno (usará masajecorporaldeportivo por defecto)`n" -ForegroundColor Yellow
    ng build --configuration production
} else {
    Write-Host "📦 Paso 2: Build para cliente: $ClientId`n" -ForegroundColor Green
    $env:VITE_CLIENT_ID = $ClientId
    ng build --configuration production
    Remove-Item Env:\VITE_CLIENT_ID -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Build completado para cliente: $ClientId" -ForegroundColor Green
Write-Host "`n📁 Salida en: dist/clinic-frontend" -ForegroundColor Cyan

# Mostrar configuración aplicada
Write-Host "`n🔍 Verificando configuración cargada..." -ForegroundColor Cyan
$mainJs = Get-ChildItem -Path "dist/clinic-frontend/browser" -Filter "main*.js" | Select-Object -First 1
if ($mainJs) {
    $content = Get-Content $mainJs.FullName -Raw
    if ($content -match "masajecorporaldeportivo") {
        Write-Host "   ✅ Cliente: Masaje Corporal Deportivo (azul/morado)" -ForegroundColor Blue
    } elseif ($content -match "actifisio") {
        Write-Host "   ✅ Cliente: Actifisio (naranja/amarillo)" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  No se pudo detectar el cliente en el bundle" -ForegroundColor Yellow
    }
}

Write-Host "`n" -ForegroundColor White
