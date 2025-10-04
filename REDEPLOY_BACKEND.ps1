# ============================================================
# SCRIPT: Redeploy del Backend en Vercel
# ============================================================
# Este script fuerza un nuevo deployment del backend
# Útil cuando hay cambios en la base de datos o configuración
# ============================================================

Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host "   REDEPLOY BACKEND EN VERCEL" -ForegroundColor Cyan
Write-Host "   ============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Navegar al directorio del backend
Write-Host "📁 Navegando al directorio backend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"

# 2. Verificar que estamos en el directorio correcto
$currentPath = Get-Location
Write-Host "   Directorio actual: $currentPath" -ForegroundColor Gray
Write-Host ""

# 3. Hacer un cambio mínimo para forzar redeploy
Write-Host "✏️  Actualizando timestamp en api/index.js..." -ForegroundColor Yellow
$indexPath = "api\index.js"

if (Test-Path $indexPath) {
    # Leer el archivo
    $content = Get-Content $indexPath -Raw
    
    # Agregar un comentario con timestamp al final
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $newContent = $content + "`n// Redeploy: $timestamp`n"
    
    # Guardar el archivo
    Set-Content -Path $indexPath -Value $newContent
    Write-Host "   ✅ Timestamp agregado" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR: No se encontró $indexPath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Commit del cambio
Write-Host "📦 Haciendo commit del cambio..." -ForegroundColor Yellow
git add $indexPath
git commit -m "chore: Force backend redeploy - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "   ✅ Commit realizado" -ForegroundColor Green
Write-Host ""

# 5. Push a Git (trigger Vercel)
Write-Host "☁️  Pusheando a Git..." -ForegroundColor Yellow
git push
Write-Host "   ✅ Push completado" -ForegroundColor Green
Write-Host ""

# 6. Esperar a que Vercel detecte el cambio
Write-Host "⏳ Esperando 10 segundos para que Vercel detecte el cambio..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# 7. Abrir dashboard de Vercel
Write-Host "🌐 Abriendo dashboard de Vercel..." -ForegroundColor Yellow
Write-Host "   Verifica que el deployment esté en progreso" -ForegroundColor Gray
Start-Process "https://vercel.com/dashboard"
Write-Host ""

Write-Host "✅ ============================================" -ForegroundColor Green
Write-Host "   REDEPLOY INICIADO" -ForegroundColor Green
Write-Host "   ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Espera a que termine el deployment en Vercel (2-3 min)" -ForegroundColor White
Write-Host "   2. Verifica el deployment en:" -ForegroundColor White
Write-Host "      https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   3. Una vez completado, prueba:" -ForegroundColor White
Write-Host "      https://actifisio.vercel.app" -ForegroundColor Gray
Write-Host "   4. Verifica que NO haya errores 404 en console" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Monitorear logs del backend:" -ForegroundColor Cyan
Write-Host "   vercel logs masajecorporaldeportivo-api" -ForegroundColor Gray
Write-Host ""

# Volver al directorio raíz
Set-Location -Path $PSScriptRoot
