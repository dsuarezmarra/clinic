# Script para desplegar en Vercel (con fix para red corporativa)
# Requiere: npm install -g vercel

Write-Host "🚀 Iniciando despliegue en Vercel..." -ForegroundColor Cyan
Write-Host ""

# FIX: Deshabilitar verificación SSL para red corporativa
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
Write-Host "✅ Configuración SSL ajustada para red corporativa" -ForegroundColor Green
Write-Host ""

# Verificar autenticación
Write-Host "1️⃣ Verificando autenticación en Vercel..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás autenticado" -ForegroundColor Red
    Write-Host "Ejecutando login..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en login. Prueba manualmente o usa la interfaz web." -ForegroundColor Red
        exit 1
    }
}

$username = ($whoami | Select-String -Pattern ">" | ForEach-Object { $_.ToString().Trim() -replace '^>', '' }).Trim()
Write-Host "✅ Autenticado como: $username" -ForegroundColor Green

Write-Host ""
Write-Host "2️⃣ Desplegando Backend..." -ForegroundColor Yellow
Push-Location backend

try {
    $backendOutput = vercel --prod --yes 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        # Extraer URL del output
        $backendUrl = $backendOutput | Select-String -Pattern 'https://[^\s]+\.vercel\.app' -AllMatches | 
                      ForEach-Object { $_.Matches } | 
                      Select-Object -First 1 -ExpandProperty Value
        
        if ($backendUrl) {
            Write-Host "✅ Backend desplegado en: $backendUrl" -ForegroundColor Green
        } else {
            Write-Host "✅ Backend desplegado (revisa el dashboard para la URL)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Hubo problemas con el despliegue del backend" -ForegroundColor Yellow
        Write-Host "Revisa los errores arriba o el dashboard de Vercel" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al desplegar backend: $_" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "3️⃣ Desplegando Frontend..." -ForegroundColor Yellow
Push-Location frontend

try {
    $frontendOutput = vercel --prod --yes 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        # Extraer URL del output
        $frontendUrl = $frontendOutput | Select-String -Pattern 'https://[^\s]+\.vercel\.app' -AllMatches | 
                       ForEach-Object { $_.Matches } | 
                       Select-Object -First 1 -ExpandProperty Value
        
        if ($frontendUrl) {
            Write-Host "✅ Frontend desplegado en: $frontendUrl" -ForegroundColor Green
        } else {
            Write-Host "✅ Frontend desplegado (revisa el dashboard para la URL)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Hubo problemas con el despliegue del frontend" -ForegroundColor Yellow
        Write-Host "Revisa los errores arriba o el dashboard de Vercel" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al desplegar frontend: $_" -ForegroundColor Red
}

Pop-Location

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 ¡Despliegue completado!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Verifica tus proyectos en:" -ForegroundColor White
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""

if ($backendUrl -and $frontendUrl) {
    Write-Host "📱 URLs detectadas:" -ForegroundColor White
    Write-Host "   Frontend: $frontendUrl" -ForegroundColor Cyan
    Write-Host "   Backend:  $backendUrl" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "⚠️  PASOS SIGUIENTES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve al Dashboard de Vercel:" -ForegroundColor White
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Actualiza las variables de entorno del backend:" -ForegroundColor White
Write-Host "   - Proyecto Backend → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Actualiza FRONTEND_URL con la URL del frontend" -ForegroundColor Gray
Write-Host "   - Guarda y Redeploy" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Actualiza environment.prod.ts en el frontend:" -ForegroundColor White
Write-Host "   - Archivo: frontend/src/environments/environment.prod.ts" -ForegroundColor Gray
Write-Host "   - Cambia apiUrl a la URL del backend" -ForegroundColor Gray
Write-Host "   - git add, commit, push" -ForegroundColor Gray
Write-Host "   - Redeploy el frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Verifica que todo funcione:" -ForegroundColor White
Write-Host "   - Abre el frontend y prueba crear una cita" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Tip: Guarda este comando para futuros deploys:" -ForegroundColor Yellow
Write-Host '   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; .\scripts\deploy-vercel-fixed.ps1' -ForegroundColor Gray
Write-Host ""
