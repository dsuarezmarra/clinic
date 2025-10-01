# Script PowerShell para desplegar en Vercel
# Requiere: npm install -g vercel

Write-Host "🚀 Iniciando despliegue en Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Vercel CLI está instalado
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Vercel CLI no está instalado" -ForegroundColor Red
    Write-Host "Instala con: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Login en Vercel (solo necesario la primera vez)
Write-Host "1️⃣ Verificando autenticación en Vercel..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "No estás autenticado. Abriendo login..." -ForegroundColor Yellow
    vercel login
}

Write-Host ""
Write-Host "2️⃣ Desplegando Backend..." -ForegroundColor Yellow
Push-Location backend
$backendOutput = vercel --prod --yes 2>&1 | Out-String
$backendUrl = if ($backendOutput -match 'https://[^\s/]+\.vercel\.app') { $matches[0] } else { "URL_NO_DETECTADA" }
Write-Host "✅ Backend desplegado en: $backendUrl" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "3️⃣ Desplegando Frontend..." -ForegroundColor Yellow
Push-Location frontend
$frontendOutput = vercel --prod --yes 2>&1 | Out-String
$frontendUrl = if ($frontendOutput -match 'https://[^\s/]+\.vercel\.app') { $matches[0] } else { "URL_NO_DETECTADA" }
Write-Host "✅ Frontend desplegado en: $frontendUrl" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 ¡Despliegue completado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 URLs de tu aplicación:" -ForegroundColor White
Write-Host "   Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host "   Backend:  $backendUrl/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  PASOS SIGUIENTES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Actualiza la URL del backend en el código del frontend:" -ForegroundColor White
Write-Host "   - Archivo: frontend/src/environments/environment.prod.ts" -ForegroundColor Gray
Write-Host "   - Cambia: apiUrl: '$backendUrl/api'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Actualiza las variables de entorno en Vercel Dashboard:" -ForegroundColor White
Write-Host "   - Ve a: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   - Proyecto Backend → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Actualiza: FRONTEND_URL=$frontendUrl" -ForegroundColor Gray
Write-Host "   - Guarda y Redeploy" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Redeploy el frontend con la URL actualizada:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Verifica que todo funcione:" -ForegroundColor White
Write-Host "   Invoke-WebRequest -Uri '$backendUrl/health' | Select-Object -Expand Content" -ForegroundColor Gray
Write-Host ""
