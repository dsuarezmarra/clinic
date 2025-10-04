# ============================================================
# SCRIPT: Build y Deploy Completo de Masaje Corporal Deportivo
# ============================================================
# Este script hace todo el proceso de build y deploy en un solo comando
# ============================================================

Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host "   BUILD Y DEPLOY: MASAJE CORPORAL DEPORTIVO" -ForegroundColor Cyan
Write-Host "   ============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 1. Navegar al directorio frontend
Write-Host "📁 Navegando al directorio frontend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
Write-Host "   ✅ Directorio: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 2. Limpiar build anterior
Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
if (Test-Path "dist\masajecorporaldeportivo-build") {
    Remove-Item -Path "dist\masajecorporaldeportivo-build" -Recurse -Force
    Write-Host "   ✅ Build anterior eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay build anterior" -ForegroundColor Gray
}
Write-Host ""

# 3. Build de producción
Write-Host "🔨 Construyendo Masaje Corporal Deportivo..." -ForegroundColor Yellow
$env:VITE_CLIENT_ID = "masajecorporaldeportivo"
ng build --output-path=dist/masajecorporaldeportivo-build --configuration=production

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ ERROR en build" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Build exitoso" -ForegroundColor Green
Write-Host ""

# 4. Inyectar CLIENT_ID en HTML
Write-Host "💉 Inyectando CLIENT_ID en HTML..." -ForegroundColor Yellow
$indexPath = "dist\masajecorporaldeportivo-build\browser\index.csr.html"

if (Test-Path $indexPath) {
    $html = Get-Content $indexPath -Raw
    $injection = "  <script>window.__CLIENT_ID = 'masajecorporaldeportivo';</script>`n"
    
    if ($html -match 'window\.__CLIENT_ID') {
        $html = $html -replace '<script>window\.__CLIENT_ID = ''.*?'';</script>', $injection.Trim()
        Write-Host "   ⚠️  CLIENT_ID existente reemplazado" -ForegroundColor Yellow
    } else {
        $html = $html -replace '</head>', "$injection</head>"
        Write-Host "   ✅ CLIENT_ID inyectado" -ForegroundColor Green
    }
    
    Set-Content -Path $indexPath -Value $html
} else {
    Write-Host "   ❌ ERROR: No se encontró index.csr.html" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 5. Crear vercel.json para routing SPA
Write-Host "⚙️  Creando configuración de Vercel..." -ForegroundColor Yellow
$vercelJson = @"
{
  "version": 2,
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.csr.html"
    }
  ]
}
"@

Set-Content -Path "dist\masajecorporaldeportivo-build\browser\vercel.json" -Value $vercelJson
Write-Host "   ✅ vercel.json creado (con filesystem handler)" -ForegroundColor Green
Write-Host ""

# 6. Deploy a Vercel
Write-Host "☁️  Desplegando a Vercel..." -ForegroundColor Yellow
Set-Location -Path "dist\masajecorporaldeportivo-build\browser"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# Deploy
$deployOutput = vercel --prod --yes 2>&1 | Out-String
Write-Host $deployOutput -ForegroundColor Gray

# Extraer URL del deployment
if ($deployOutput -match 'Production: (https://[^\s]+)') {
    $deploymentUrl = $matches[1]
    Write-Host "   ✅ Deployment exitoso" -ForegroundColor Green
    Write-Host "   📦 URL: $deploymentUrl" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ ERROR: No se pudo obtener URL de deployment" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 7. Actualizar alias
Write-Host "🔗 Actualizando alias masajecorporaldeportivo.vercel.app..." -ForegroundColor Yellow
$aliasOutput = vercel alias set $deploymentUrl masajecorporaldeportivo.vercel.app 2>&1 | Out-String
Write-Host $aliasOutput -ForegroundColor Gray

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Alias actualizado" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR actualizando alias" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 8. Resumen final
Write-Host "✅ ============================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "   ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs de Masaje Corporal Deportivo:" -ForegroundColor Cyan
Write-Host "   Producción: https://masajecorporaldeportivo.vercel.app" -ForegroundColor White
Write-Host "   Deployment: $deploymentUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Testing:" -ForegroundColor Cyan
Write-Host "   1. Abre: https://masajecorporaldeportivo.vercel.app" -ForegroundColor White
Write-Host "   2. Verifica que cargue sin errores 404" -ForegroundColor White
Write-Host "   3. Navega a detalle de paciente (debe funcionar)" -ForegroundColor White
Write-Host "   4. Crea/edita/elimina sesiones" -ForegroundColor White
Write-Host ""

# Volver al directorio raíz
Set-Location -Path $PSScriptRoot
