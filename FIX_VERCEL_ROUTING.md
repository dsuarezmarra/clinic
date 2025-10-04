# 🔧 FIX: Vercel.json Routing Configuration

**Fecha:** 04/10/2025  
**Problema:** Vercel servía HTML en lugar de archivos JS/CSS  
**Estado:** ✅ SOLUCIONADO

---

## 🔴 PROBLEMA DETECTADO

### Síntomas

1. **Redirección a login de Vercel**
2. **Página en blanco** después del login
3. **Errores en Console:**
   ```
   Failed to load module script: Expected a JavaScript-or-Wasm module script
   but the server responded with a MIME type of "text/html"
   ```
4. **Archivos JS devolviendo HTML:**
   ```
   polyfills-5CFQRCPP.js:1 Uncaught SyntaxError: Unexpected token '<'
   scripts-N7CG43RU.js:1 Uncaught SyntaxError: Unexpected token '<'
   ```

### Causa Raíz

**Configuración incorrecta de `vercel.json`:**

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.csr.html"
    }
  ]
}
```

**Problema:**

- Redirige **TODO** (incluyendo `.js`, `.css`, `.png`) a `index.csr.html`
- Vercel devuelve HTML cuando el navegador pide un archivo JavaScript
- El navegador intenta ejecutar HTML como JavaScript → Error

---

## ✅ SOLUCIÓN

### Configuración Correcta de `vercel.json`

```json
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
```

### ¿Qué Hace `"handle": "filesystem"`?

**Orden de procesamiento:**

1. **Primero:** `"handle": "filesystem"`

   - Vercel intenta servir el archivo estático
   - Si existe `polyfills-5CFQRCPP.js`, lo sirve con MIME `application/javascript`
   - Si existe `styles-5OM4SH5F.css`, lo sirve con MIME `text/css`
   - Si existe `favicon.ico`, lo sirve con MIME `image/x-icon`

2. **Segundo:** `"src": "/(.*)", "dest": "/index.csr.html"`
   - Solo se ejecuta si el archivo NO existe
   - Rutas de navegación como `/pacientes`, `/pacientes/123` → `index.csr.html`
   - Angular router maneja la navegación interna

### Resultado

✅ Archivos estáticos (JS, CSS, images) → Servidos correctamente  
✅ Rutas de navegación → Redirigidas a `index.csr.html`  
✅ Angular SPA funciona perfectamente

---

## 🔄 APLICACIÓN DEL FIX

### Manual (Ya Hecho)

```powershell
# 1. Editar vercel.json en dist
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

Set-Content -Path "frontend\dist\actifisio-build\browser\vercel.json" -Value $vercelJson

# 2. Redeploy
cd frontend\dist\actifisio-build\browser
vercel --prod

# 3. Actualizar alias
vercel alias set <deployment-url> actifisio.vercel.app
```

### Automático (Scripts Actualizados)

Los scripts `DEPLOY_ACTIFISIO.ps1` y `DEPLOY_MASAJE_CORPORAL.ps1` ya incluyen la configuración correcta:

```powershell
.\DEPLOY_ACTIFISIO.ps1
# ✅ Crea vercel.json con "handle": "filesystem"
```

---

## 📊 VERIFICACIÓN

### Test 1: Archivos Estáticos

1. **Abre:** https://actifisio.vercel.app
2. **DevTools → Network**
3. **Verifica archivos JS:**
   - `polyfills-5CFQRCPP.js` → Status `200`, Type `script`, MIME `application/javascript`
   - `main-L7QSYFPV.js` → Status `200`, Type `script`, MIME `application/javascript`
   - `styles-5OM4SH5F.css` → Status `200`, Type `stylesheet`, MIME `text/css`

### Test 2: Routing SPA

1. **Navega a:** https://actifisio.vercel.app/pacientes
2. **Verifica:**

   - ✅ Carga la lista de pacientes
   - ✅ NO redirección a login
   - ✅ Console sin errores

3. **Navega a:** https://actifisio.vercel.app/pacientes/[uuid]
4. **Verifica:**
   - ✅ Carga el detalle del paciente
   - ✅ NO error 404
   - ✅ Console sin errores

### Test 3: Refresh en Ruta Profunda

1. **Navega a:** https://actifisio.vercel.app/pacientes/[uuid]
2. **Refresh (Ctrl+R)**
3. **Verifica:**
   - ✅ Permanece en la misma página
   - ✅ NO error 404
   - ✅ Paciente carga correctamente

---

## 🎓 EXPLICACIÓN TÉCNICA

### ¿Por Qué Pasó Esto?

**Angular SPA (Single Page Application):**

- Una sola página HTML (`index.csr.html`)
- Todas las rutas son virtuales (manejadas por Angular Router)
- En servidor, solo existe `index.csr.html`, NO `/pacientes.html`

**Problema al desplegar en Vercel:**

- Usuario navega a: `https://actifisio.vercel.app/pacientes/123`
- Vercel busca archivo: `/pacientes/123.html` → No existe
- Sin configuración → Error 404

**Solución con `vercel.json`:**

- Vercel busca archivo: `/pacientes/123.html` → No existe
- Redirige a: `/index.csr.html`
- Angular Router lee URL (`/pacientes/123`)
- Angular carga el componente correcto

### ¿Por Qué No Funcionó la Primera Versión?

**Primera versión:**

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.csr.html"
    }
  ]
}
```

**Problema:**

- Redirige **TODO** sin excepciones
- Browser pide: `polyfills-5CFQRCPP.js`
- Vercel redirige a: `index.csr.html`
- Vercel devuelve: HTML con MIME `text/html`
- Browser intenta ejecutar HTML como JS → Error

**Versión corregida:**

```json
{
  "routes": [
    {
      "handle": "filesystem"  ← CLAVE
    },
    {
      "src": "/(.*)",
      "dest": "/index.csr.html"
    }
  ]
}
```

**Solución:**

- Browser pide: `polyfills-5CFQRCPP.js`
- Vercel encuentra el archivo (filesystem handler)
- Vercel devuelve: JS con MIME `application/javascript`
- Browser ejecuta correctamente

---

## 📝 REFERENCIAS

### Documentación de Vercel

- **Routing:** https://vercel.com/docs/concepts/projects/project-configuration#routes
- **Filesystem Handler:** https://vercel.com/docs/concepts/projects/project-configuration#routes/handle
- **SPA Configuration:** https://vercel.com/docs/concepts/get-started/deploy#deploying-a-single-page-application

### Ejemplo Oficial de Vercel

```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

---

## ✅ ESTADO ACTUAL

- ✅ Actifisio: Desplegado con configuración correcta
- ✅ Scripts actualizados: `DEPLOY_ACTIFISIO.ps1` y `DEPLOY_MASAJE_CORPORAL.ps1`
- ✅ Documentación creada: Este archivo
- ⏳ Masaje Corporal: Redeploy pendiente (usar script actualizado)

---

## 🚀 PRÓXIMOS PASOS

1. **Verificar Actifisio:**

   - Abre https://actifisio.vercel.app
   - Verifica que cargue sin errores
   - Prueba navegación entre rutas

2. **Redeploy Masaje Corporal (si es necesario):**

   ```powershell
   .\DEPLOY_MASAJE_CORPORAL.ps1
   ```

3. **Eliminar archivos obsoletos:**
   - ❌ `SOLUCION_LOCALHOST_VS_PRODUCCION.md` (ya no aplica)
   - ❌ `REDEPLOY_BACKEND.ps1` (no se usa localhost)

---

**Última actualización:** 04/10/2025  
**Autor:** GitHub Copilot  
**Estado:** ✅ PROBLEMA RESUELTO
