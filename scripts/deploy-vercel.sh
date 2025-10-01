#!/bin/bash

# Script para desplegar en Vercel usando CLI
# Requiere: npm install -g vercel

echo "🚀 Iniciando despliegue en Vercel..."

# Login en Vercel (solo necesario la primera vez)
echo "1️⃣ Verificando autenticación en Vercel..."
vercel whoami || vercel login

echo ""
echo "2️⃣ Desplegando Backend..."
cd backend
vercel --prod --yes
BACKEND_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^/]+\.vercel\.app' | tail -1)
echo "✅ Backend desplegado en: $BACKEND_URL"

echo ""
echo "3️⃣ Actualizando URL del backend en el frontend..."
cd ../frontend/src/environments
sed -i "s|https://tu-backend.vercel.app|$BACKEND_URL|g" environment.prod.ts

echo ""
echo "4️⃣ Desplegando Frontend..."
cd ../../..
cd frontend
vercel --prod --yes
FRONTEND_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^/]+\.vercel\.app' | tail -1)
echo "✅ Frontend desplegado en: $FRONTEND_URL"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ¡Despliegue completado!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs de tu aplicación:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL/api"
echo ""
echo "⚠️  IMPORTANTE: Actualiza la variable FRONTEND_URL en Vercel:"
echo "   1. Ve a: https://vercel.com/dashboard"
echo "   2. Selecciona el proyecto backend"
echo "   3. Settings → Environment Variables"
echo "   4. Actualiza FRONTEND_URL=$FRONTEND_URL"
echo "   5. Redeploy el backend"
echo ""
echo "✅ Verifica que todo funcione:"
echo "   curl $BACKEND_URL/health"
echo ""
