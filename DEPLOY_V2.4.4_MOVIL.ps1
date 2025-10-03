# 🚀 Deployment v2.4.4 - Fix Móvil Android
# ============================================
# Este script despliega los cambios para solucionar problemas en móvil

Write-Host "`n🧹 PASO 1: Limpiando cachés locales..." -ForegroundColor Cyan
Set-Location "c:\Users\dsuarez1\git\clinic\frontend"

# Limpiar directorios de caché
if (Test-Path ".vercel") {
    Remove-Item -Recurse -Force ".vercel"
    Write-Host "✅ Caché de Vercel limpiada" -ForegroundColor Green
}

if (Test-Path ".angular") {
    Remove-Item -Recurse -Force ".angular"
    Write-Host "✅ Caché de Angular limpiada" -ForegroundColor Green
}

if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Directorio dist limpiado" -ForegroundColor Green
}

Write-Host "`n📦 PASO 2: Instalando dependencias..." -ForegroundColor Cyan
npm install --legacy-peer-deps --force

Write-Host "`n🔨 PASO 3: Construyendo proyecto..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error en build, abortando deployment" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 PASO 4: Desplegando a Vercel (producción)..." -ForegroundColor Cyan
vercel deploy --prod --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error en deployment" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host ""
Write-Host "📱 INSTRUCCIONES PARA PROBAR EN MÓVIL:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. En Chrome móvil, ve a:" -ForegroundColor White
Write-Host "   Menú (⋮) → Configuración → Privacidad y Seguridad" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Presiona 'Borrar datos de navegación'" -ForegroundColor White
Write-Host ""
Write-Host "3. Selecciona:" -ForegroundColor White
Write-Host "   ✅ Cookies y datos de sitios" -ForegroundColor Green
Write-Host "   ✅ Imágenes y archivos en caché" -ForegroundColor Green
Write-Host "   ✅ Datos alojados de aplicaciones" -ForegroundColor Green
Write-Host ""
Write-Host "4. Rango: 'Últimas 24 horas'" -ForegroundColor White
Write-Host ""
Write-Host "5. Presiona 'Borrar datos'" -ForegroundColor White
Write-Host ""
Write-Host "6. CIERRA Chrome completamente (no solo la pestaña)" -ForegroundColor Red
Write-Host ""
Write-Host "7. Abre Chrome y accede a:" -ForegroundColor White
Write-Host "   https://masajecorporaldeportivo.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏱️  Espera 2-5 minutos para propagación CDN completa" -ForegroundColor Magenta
Write-Host ""

Write-Host "`n==== CAMBIOS APLICADOS EN v2.4.4 ====" -ForegroundColor Yellow
Write-Host "Headers Cache-Control estrictos para index.html" -ForegroundColor Green
Write-Host "Meta tags optimizados para movil" -ForegroundColor Green
Write-Host "Touch events anadidos a todos los botones" -ForegroundColor Green
Write-Host "Altura minima 44px en botones Apple HIG" -ForegroundColor Green
Write-Host "z-index eliminado de inputs problematicos" -ForegroundColor Green
Write-Host "Scroll optimizado con webkit-overflow-scrolling" -ForegroundColor Green
Write-Host "Tamanos de fuente y padding aumentados en movil" -ForegroundColor Green
Write-Host "touch-action manipulation para evitar delay" -ForegroundColor Green
Write-Host ""
