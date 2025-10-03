# =====================================================
# SCRIPT DE DEPLOYMENT: ACTIFISIO A VERCEL
# =====================================================
# Fecha: 03/10/2025
# Propósito: Desplegar Actifisio en Vercel con URL estática
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYMENT DE ACTIFISIO A VERCEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
Write-Host "📁 Directorio actual: $currentDir" -ForegroundColor Yellow

# Verificar que Vercel CLI está instalado
Write-Host ""
Write-Host "🔍 Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI no está instalado" -ForegroundColor Red
    Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando Vercel CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Vercel CLI disponible" -ForegroundColor Green

# Navegar a frontend
Write-Host ""
Write-Host "📂 Navegando a frontend..." -ForegroundColor Yellow
Set-Location frontend

# Verificar que package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json no encontrado en frontend/" -ForegroundColor Red
    exit 1
}

# Generar manifest para Actifisio
Write-Host ""
Write-Host "📝 Generando manifest para Actifisio..." -ForegroundColor Yellow
$env:VITE_CLIENT_ID = "actifisio"
node scripts/generate-manifest.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Error generando manifest (continuando...)" -ForegroundColor Yellow
}

# Build de producción para Actifisio
Write-Host ""
Write-Host "🏗️ Building Actifisio..." -ForegroundColor Yellow
Write-Host "   Client ID: actifisio" -ForegroundColor Cyan
$env:VITE_CLIENT_ID = "actifisio"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build exitoso" -ForegroundColor Green

# Deploy a Vercel
Write-Host ""
Write-Host "🚀 Desplegando a Vercel..." -ForegroundColor Yellow
Write-Host "   Proyecto: actifisio" -ForegroundColor Cyan
Write-Host "   Entorno: Production" -ForegroundColor Cyan

# Deploy con configuración específica
vercel --prod `
    --name actifisio `
    --yes `
    --env VITE_CLIENT_ID=actifisio

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el deployment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT EXITOSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs de Actifisio:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend: https://actifisio.vercel.app" -ForegroundColor White
Write-Host "   🔌 Backend: https://masajecorporaldeportivo-api.vercel.app/api" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para probar:" -ForegroundColor Yellow
Write-Host "   1. Abrir: https://actifisio.vercel.app" -ForegroundColor White
Write-Host "   2. Crear un paciente de prueba" -ForegroundColor White
Write-Host "   3. Crear una cita" -ForegroundColor White
Write-Host "   4. Verificar que los datos NO aparecen en Masaje Corporal" -ForegroundColor White
Write-Host ""
Write-Host "📊 Para verificar tablas en Supabase:" -ForegroundColor Yellow
Write-Host "   - Datos en: patients_actifisio" -ForegroundColor White
Write-Host "   - Citas en: appointments_actifisio" -ForegroundColor White
Write-Host ""

# Volver al directorio original
Set-Location $currentDir
