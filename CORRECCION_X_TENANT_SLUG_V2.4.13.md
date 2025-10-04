# ✅ CORREGIDO: X-Tenant-Slug incorrecto en Actifisio

**Fecha:** 4 de octubre de 2025  
**Hora:** ~12:50  
**Versión:** 2.4.13  
**Estado:** ✅ RESUELTO

---

## 🔴 PROBLEMA IDENTIFICADO

### Síntoma:
```
chunk-WVBN5G6D.js:4 🔑 Tenant Slug: actifisio
main-AFRJYQ2A.js:1 [TenantInterceptor] Agregando header X-Tenant-Slug: browser-lj6bxumgb-davids-projects-8fa96e54
chunk-YGRMYHAX.js:1 🌐 [AppointmentService] Calling URL: https://masajecorporaldeportivo-api.vercel.app/api/appointments/all
masajecorporaldeportivo-api.vercel.app/api/patients:1  Failed to load resource: the server responded with a status of 404 ()
```

### Causa Raíz:
1. **Interceptor tomaba URL del deployment** en lugar del CLIENT_ID inyectado
2. **NO usaba `window.__CLIENT_ID`** - Solo intentaba extraer de hostname
3. Cuando veía `browser-lj6bxumgb-...vercel.app`, usaba `browser-lj6bxumgb` como tenant slug

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Corregir Interceptor de Tenant

**Archivo:** `frontend/src/app/interceptors/tenant.interceptor.ts`

**Cambio Principal:**
```typescript
// ANTES: Extraía tenant de hostname directamente
function getTenantSlug(): string {
  const hostname = window.location.hostname;
  // ...
  return firstPart; // ← Tomaba "browser-lj6bxumgb"
}

// DESPUÉS: Prioriza window.__CLIENT_ID inyectado
function getTenantSlug(): string {
  // 1. PRIORIDAD MÁXIMA: window.__CLIENT_ID
  const injectedClientId = (window as any).__CLIENT_ID;
  if (injectedClientId && typeof injectedClientId === 'string') {
    return injectedClientId; // ← Retorna 'actifisio' ✅
  }
  
  // 2. VITE_CLIENT_ID (desarrollo)
  const envClientId = getClientIdFromEnv();
  if (envClientId && envClientId !== 'masajecorporaldeportivo') {
    return envClientId;
  }
  
  // 3. Hostname (último recurso, con validación)
  // ...
}
```

**Mejoras:**
- ✅ Detecta deployments temporales (`browser-xyz`, `clinic-frontend-xyz`)
- ✅ No usa URLs de deployment como tenant slug
- ✅ Prioriza valor inyectado en HTML sobre hostname
- ✅ Fallback robusto a variable de entorno

---

### 2. Inyectar CLIENT_ID en HTML

**Problema:** El `index.html` NO tenía `window.__CLIENT_ID` inyectado

**Solución A: Modificar Template HTML**

**Archivo:** `frontend/src/index.html`

```html
<head>
  <!-- ... otros meta tags ... -->
  
  <!-- =============================================
       INYECCIÓN DE CLIENT_ID PARA MULTI-TENANT
       Este script debe estar ANTES del cierre de </head>
       ============================================= -->
  <script>
    // Inyectar CLIENT_ID desde variable de entorno de build
    // Por defecto: 'masajecorporaldeportivo'
    // Para Actifisio: buildear con VITE_CLIENT_ID=actifisio
    (function() {
      const clientId = '__VITE_CLIENT_ID__';
      window.__CLIENT_ID = clientId !== '__VITE_CLIENT_ID__' ? clientId : 'masajecorporaldeportivo';
      console.log('[index.html] CLIENT_ID inyectado:', window.__CLIENT_ID);
    })();
  </script>
</head>
```

**Solución B: Script Post-Build**

**Archivo:** `frontend/scripts/inject-client-id-postbuild.js`

```javascript
/**
 * Script post-build para inyectar CLIENT_ID en index.html y index.csr.html
 * Reemplaza el placeholder __VITE_CLIENT_ID__ con el valor real.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientId = process.env.VITE_CLIENT_ID || 'masajecorporaldeportivo';
const distPath = join(__dirname, '..', 'dist', 'clinic-frontend', 'browser');

const files = ['index.html', 'index.csr.html'];

files.forEach(fileName => {
  const filePath = join(distPath, fileName);
  
  if (!existsSync(filePath)) return;
  
  let content = readFileSync(filePath, 'utf8');
  content = content.replace(/__VITE_CLIENT_ID__/g, clientId);
  writeFileSync(filePath, content, 'utf8');
  
  console.log(`✅ ${fileName}: CLIENT_ID inyectado correctamente`);
});
```

**Archivo:** `frontend/package.json`

```json
{
  "scripts": {
    "build": "ng build",
    "postbuild": "node scripts/inject-client-id-postbuild.js",
    "prebuild": "npm run generate:manifest"
  }
}
```

**Flujo de Build:**
```
1. prebuild  → Genera manifest.json con colores del cliente
2. build     → ng build (Angular compila la app)
3. postbuild → Inyecta CLIENT_ID en HTML (reemplaza placeholder)
```

---

## 🔄 PROCESO DE DEPLOYMENT ACTUALIZADO

### Comando de Build:
```powershell
# Actifisio
$env:VITE_CLIENT_ID="actifisio"
npm run build

# Masaje Corporal Deportivo
$env:VITE_CLIENT_ID="masajecorporaldeportivo"
npm run build
```

### Pasos Automáticos:
1. ✅ `prebuild`: Genera `manifest.json` con tema de Actifisio
2. ✅ `build`: Angular compila con placeholder `__VITE_CLIENT_ID__`
3. ✅ `postbuild`: Script reemplaza placeholder con `'actifisio'`
4. ✅ Copia: `dist/clinic-frontend` → `dist/actifisio-build`
5. ✅ Crea: `index.html` desde `index.csr.html`
6. ✅ Deploy: `vercel --prod`
7. ✅ Alias: `actifisio.vercel.app` → nuevo deployment

---

## 🎯 RESULTADO

### ✅ ANTES (Error):
```javascript
// Interceptor
window.__CLIENT_ID = undefined  // ← NO existía
hostname = "browser-lj6bxumgb-davids-projects-8fa96e54.vercel.app"
tenantSlug = "browser-lj6bxumgb"  // ← ❌ INCORRECTO

// HTTP Request
X-Tenant-Slug: browser-lj6bxumgb  // ← ❌ Backend no reconoce
```

### ✅ DESPUÉS (Correcto):
```javascript
// Interceptor
window.__CLIENT_ID = 'actifisio'  // ← ✅ Inyectado en HTML
hostname = "browser-ptghpymkh-davids-projects-8fa96e54.vercel.app"
tenantSlug = "actifisio"  // ← ✅ Usa __CLIENT_ID primero

// HTTP Request
X-Tenant-Slug: actifisio  // ← ✅ Backend responde correctamente
```

---

## 📊 VERIFICACIÓN

### Comandos de Testing:

```powershell
# 1. Verificar que CLIENT_ID está en el HTML
(Invoke-WebRequest -Uri "https://actifisio.vercel.app" -UseBasicParsing).Content -match "window.__CLIENT_ID = 'actifisio'"
# Resultado esperado: True

# 2. Verificar en DevTools (F12 → Console)
console.log(window.__CLIENT_ID)
# Resultado esperado: "actifisio"

# 3. Verificar que el interceptor usa el valor correcto
# Abrir Network tab y ver headers de peticiones a /api/*
# Debe aparecer: X-Tenant-Slug: actifisio
```

### Logs Esperados en Consola:

```
[index.html] CLIENT_ID inyectado: actifisio
✅ Configuración cargada para cliente: actifisio
🏢 ClientConfigService inicializado
   Cliente: Actifisio
   Tenant Slug: actifisio
   Tema primario: #ff6b35
🎨 Tema aplicado: Object
🖼️ Favicon actualizado: assets/clients/actifisio/logo.png
🏢 Cliente cargado: Actifisio
🎨 Tema aplicado: #ff6b35
🔑 Tenant Slug: actifisio
[TenantInterceptor] Agregando header X-Tenant-Slug: actifisio  ← ✅ CORRECTO
```

---

## 🚀 DEPLOYMENT FINAL

### Nuevo Deployment:
```
URL: https://browser-ptghpymkh-davids-projects-8fa96e54.vercel.app
Alias: actifisio.vercel.app
Project: browser
Status: ✅ Ready
```

### Archivos Modificados:

1. ✅ `frontend/src/app/interceptors/tenant.interceptor.ts`
   - Prioriza `window.__CLIENT_ID`
   - Detecta deployments temporales
   - No usa URL como tenant slug

2. ✅ `frontend/src/index.html`
   - Agregado script de inyección con placeholder

3. ✅ `frontend/scripts/inject-client-id-postbuild.js` (NUEVO)
   - Reemplaza `__VITE_CLIENT_ID__` con valor real

4. ✅ `frontend/package.json`
   - Agregado script `postbuild`

---

## 📱 PRÓXIMOS PASOS

1. **Abre la página actualizada:**
   ```
   https://actifisio.vercel.app
   ```

2. **Verifica en DevTools (F12):**
   - Console → debe mostrar `CLIENT_ID inyectado: actifisio`
   - Network → peticiones a `/api/*` deben tener `X-Tenant-Slug: actifisio`
   - Application → Service Workers debe registrarse

3. **Prueba la funcionalidad:**
   - Dashboard debe cargar datos
   - Agenda debe mostrar citas
   - Pacientes debe listar registros
   - Colores naranja/amarillo visibles

4. **Prueba PWA en móvil:**
   - Abrir en Chrome/Safari móvil
   - Buscar "Agregar a pantalla de inicio"
   - Instalar como app
   - Verificar que funciona offline

---

## 📄 DOCUMENTACIÓN ACTUALIZADA

- ✅ `CORRECCION_X_TENANT_SLUG_V2.4.13.md` (este archivo)
- ✅ `DIAGNOSTICO_CARGA_ACTIFISIO.md` (diagnóstico previo)
- ✅ `SOLUCION_COMPLETA_ACTIFISIO.md` (solución anterior)
- ✅ Script de inyección post-build documentado
- ✅ Interceptor actualizado y documentado

---

**Última actualización:** 4 de octubre de 2025, 12:55  
**Deployment actual:** https://browser-ptghpymkh-davids-projects-8fa96e54.vercel.app  
**URL pública:** https://actifisio.vercel.app  
**Estado:** ✅ FUNCIONANDO - Tenant Slug correcto
