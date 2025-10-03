# =====================================================
# CONFIGURAR VARIABLES DE ENTORNO PARA ACTIFISIO
# =====================================================
# Propósito: Configurar VITE_CLIENT_ID correctamente
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 CONFIGURAR VARIABLES DE ENTORNO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️ IMPORTANTE: El deployment actual tiene un problema" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Diagnóstico:" -ForegroundColor Cyan
Write-Host "   - URL: actifisio.vercel.app" -ForegroundColor White
Write-Host "   - Problema: VITE_CLIENT_ID no está definido en runtime" -ForegroundColor Red
Write-Host "   - Causa: Variable de entorno no configurada correctamente" -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 SOLUCIONES POSIBLES:" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPCIÓN 1: Configurar en Vercel Dashboard (RECOMENDADO)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "1. Abrir: https://vercel.com/davids-projects-8fa96e54/clinic-frontend" -ForegroundColor White
Write-Host "2. Ir a: Settings → Environment Variables" -ForegroundColor White
Write-Host "3. Buscar: VITE_CLIENT_ID" -ForegroundColor White
Write-Host "4. Editar y cambiar valor a: actifisio" -ForegroundColor White
Write-Host "5. Seleccionar: Production" -ForegroundColor White
Write-Host "6. Guardar" -ForegroundColor White
Write-Host "7. Redeploy: vercel --prod" -ForegroundColor White
Write-Host ""

Write-Host "OPCIÓN 2: Crear proyecto separado para Actifisio" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "1. Crear nuevo proyecto en Vercel: actifisio-app" -ForegroundColor White
Write-Host "2. Configurar VITE_CLIENT_ID=actifisio" -ForegroundColor White
Write-Host "3. Deploy a ese proyecto" -ForegroundColor White
Write-Host "4. Configurar alias: actifisio.vercel.app" -ForegroundColor White
Write-Host ""

Write-Host "OPCIÓN 3: Usar vercel.json con diferentes configs" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Crear vercel.actifisio.json con env específico" -ForegroundColor White
Write-Host ""

Write-Host "🚀 EJECUTAR OPCIÓN 1 MANUALMENTE:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Paso 1: Eliminar variable actual" -ForegroundColor Yellow
Write-Host 'vercel env rm VITE_CLIENT_ID' -ForegroundColor White
Write-Host ""
Write-Host "# Paso 2: Agregar con valor correcto" -ForegroundColor Yellow
Write-Host 'echo "actifisio" | vercel env add VITE_CLIENT_ID production' -ForegroundColor White
Write-Host ""
Write-Host "# Paso 3: Redeploy" -ForegroundColor Yellow
Write-Host 'cd frontend' -ForegroundColor White
Write-Host '$env:VITE_CLIENT_ID="actifisio"' -ForegroundColor White
Write-Host 'npm run build' -ForegroundColor White
Write-Host 'vercel --prod' -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "💡 RECOMENDACIÓN" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Usar Vercel Dashboard es más seguro y visual." -ForegroundColor White
Write-Host "URL: https://vercel.com/davids-projects-8fa96e54/clinic-frontend/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
