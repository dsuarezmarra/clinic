# 🔧 FIX URGENTE: ACTIFISIO PANTALLA EN BLANCO

**Fecha:** 03/10/2025  
**Problema:** `Cannot read properties of undefined (reading 'VITE_CLIENT_ID')`  
**Causa:** Variable de entorno no disponible en runtime  
**Prioridad:** 🔴 CRÍTICA

---

## 🎯 SOLUCIÓN RÁPIDA (5 MINUTOS)

### Paso 1: Configurar Variable en Vercel Dashboard

1. **Abrir Vercel Dashboard:**

   ```
   https://vercel.com/davids-projects-8fa96e54/clinic-frontend/settings/environment-variables
   ```

2. **Buscar variable `VITE_CLIENT_ID`**

3. **Editar la variable:**
   - Click en los 3 puntos (⋮) al lado de `VITE_CLIENT_ID`
   - Click en "Edit"
   - Cambiar valor a: `actifisio`
   - Seleccionar ambiente: ✅ **Production**
   - Guardar

### Paso 2: Redeploy

**Opción A - Desde Dashboard (Más fácil):**

1. Ir a: https://vercel.com/davids-projects-8fa96e54/clinic-frontend
2. Tab "Deployments"
3. Click en el último deployment
4. Click "⋮" → "Redeploy"
5. Confirmar

**Opción B - Desde CLI:**

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend
$env:VITE_CLIENT_ID = "actifisio"
vercel --prod --yes
```

### Paso 3: Actualizar Alias

```powershell
vercel alias set <nuevo-deployment-url> actifisio.vercel.app
```

---

## 🔍 DIAGNÓSTICO DEL PROBLEMA

### Error en Consola

```javascript
Uncaught TypeError: Cannot read properties of undefined (reading 'VITE_CLIENT_ID')
    at fw (chunk-R4ZXIDRI.js:5:24056)
```

**Traducción:**  
El código intenta leer `import.meta.env.VITE_CLIENT_ID` pero `import.meta.env` es `undefined`.

### Causas Posibles

1. ✅ **Variable no configurada en Vercel** (MÁS PROBABLE)

   - Solución: Configurar en Dashboard

2. ✅ **Variable configurada para otro proyecto**

   - El proyecto actual podría no tener acceso
   - Solución: Verificar proyecto correcto en Vercel

3. ✅ **Build sin variable de entorno**
   - El build se hizo sin `VITE_CLIENT_ID`
   - Solución: Redeploy con variable configurada

---

## 📋 VERIFICACIÓN POST-FIX

### 1. Verificar Variable en Vercel

```bash
vercel env ls
```

**Resultado esperado:**

```
VITE_CLIENT_ID     actifisio     Production
```

### 2. Verificar en Browser

1. Abrir: https://actifisio.vercel.app
2. Abrir DevTools (F12)
3. Ejecutar en Console:
   ```javascript
   // Esto debería funcionar después del fix
   console.log(window.location.hostname);
   ```
4. Verificar que la app carga

### 3. Verificar Título

**Antes del fix:**

```
Título: "Masaje Corporal Deportivo" ❌
```

**Después del fix:**

```
Título: "Actifisio" ✅
```

---

## 🚨 ALTERNATIVA: PROYECTO SEPARADO

Si el fix anterior no funciona, crear proyecto dedicado:

### Paso 1: Crear Nuevo Proyecto en Vercel

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend

# Link a nuevo proyecto
vercel link

# Responder:
# - Crear nuevo proyecto: Yes
# - Nombre: actifisio-app
# - Directory: . (actual)
```

### Paso 2: Configurar Variable

```powershell
vercel env add VITE_CLIENT_ID production
# Cuando pregunte el valor, escribir: actifisio
```

### Paso 3: Deploy

```powershell
$env:VITE_CLIENT_ID = "actifisio"
npm run build:actifisio
vercel --prod
```

### Paso 4: Configurar Alias

```powershell
vercel alias set <deployment-url> actifisio.vercel.app
```

---

## 💡 DEBUGGING AVANZADO

### Verificar Build Logs

1. Ir a: https://vercel.com/davids-projects-8fa96e54/clinic-frontend
2. Click en último deployment
3. Tab "Build Logs"
4. Buscar: `VITE_CLIENT_ID`

**Debería aparecer:**

```
VITE_CLIENT_ID: actifisio
```

### Verificar Runtime Logs

1. Tab "Runtime Logs"
2. Buscar errores relacionados con `import.meta.env`

### Verificar Source Code

En el deployment, verificar que el código build tiene:

```javascript
// Debería estar embebido en el bundle
const clientId = "actifisio"; // No undefined
```

---

## 🎯 SOLUCIÓN DEFINITIVA

### Crear Script de Deploy Correcto

**Archivo: `frontend/deploy-actifisio.ps1`**

```powershell
#!/usr/bin/env pwsh

# Configurar variables de entorno
$env:VITE_CLIENT_ID = "actifisio"
$env:NODE_ENV = "production"

# Generar manifest
npm run generate:manifest

# Build
Write-Host "🏗️ Building Actifisio..." -ForegroundColor Yellow
npm run build:actifisio

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod --yes `
    --env VITE_CLIENT_ID=actifisio `
    --name actifisio-app

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deploy failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host "🌐 URL: https://actifisio.vercel.app" -ForegroundColor Cyan
```

**Ejecutar:**

```powershell
cd frontend
.\deploy-actifisio.ps1
```

---

## ✅ CHECKLIST DE SOLUCIÓN

- [ ] Variable `VITE_CLIENT_ID` configurada en Vercel Dashboard
- [ ] Valor correcto: `actifisio` (no `masajecorporaldeportivo`)
- [ ] Ambiente: Production ✅
- [ ] Redeploy realizado
- [ ] Alias `actifisio.vercel.app` apunta al nuevo deployment
- [ ] App carga sin errores en consola
- [ ] Título muestra "Actifisio"
- [ ] Logo y tema naranja visible

---

## 🔗 URLS ÚTILES

**Vercel Dashboard:**

```
https://vercel.com/davids-projects-8fa96e54/clinic-frontend
```

**Environment Variables:**

```
https://vercel.com/davids-projects-8fa96e54/clinic-frontend/settings/environment-variables
```

**Deployments:**

```
https://vercel.com/davids-projects-8fa96e54/clinic-frontend/deployments
```

**Actifisio (después del fix):**

```
https://actifisio.vercel.app
```

---

## 📞 SI NADA FUNCIONA

### Último Recurso: Deploy Manual

1. Hacer build local:

   ```powershell
   cd frontend
   $env:VITE_CLIENT_ID = "actifisio"
   npm run build:actifisio
   ```

2. Verificar que el build tiene el clientId correcto:

   ```powershell
   # Buscar en los archivos compilados
   Select-String -Path "dist/**/*.js" -Pattern "actifisio" -SimpleMatch
   ```

3. Deploy manual:

   ```powershell
   vercel --prod --yes
   ```

4. Configurar alias:
   ```powershell
   vercel alias set <url> actifisio.vercel.app
   ```

---

**Estado actual:** ❌ ACTIFISIO NO FUNCIONA  
**Acción requerida:** Configurar `VITE_CLIENT_ID=actifisio` en Vercel  
**Tiempo estimado:** 5 minutos  
**Prioridad:** 🔴 CRÍTICA
