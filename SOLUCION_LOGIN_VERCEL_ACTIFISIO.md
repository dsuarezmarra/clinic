# 🔓 SOLUCIÓN: Desactivar Protection en Actifisio

**Problema:** `actifisio.vercel.app` redirige a página de login de Vercel  
**Causa:** Deployment Protection activada en el proyecto `browser`  
**Fecha:** 4 de octubre de 2025

---

## 🚨 PROBLEMA IDENTIFICADO+

### Síntomas

1. ✅ `masajecorporaldeportivo.vercel.app` funciona sin login
2. ❌ `actifisio.vercel.app` pide autenticación de Vercel
3. ❌ PWA no se puede instalar en móvil (Android/iOS)

### Causa Raíz

El alias `actifisio.vercel.app` apunta al proyecto **`browser`** que tiene **Deployment Protection** activada. Esto requiere que los visitantes se autentiquen con Vercel.

---

## ✅ SOLUCIONES

### Opción 1: Desactivar Protection en el proyecto `browser` (RECOMENDADO)

```powershell
# 1. Ir a Vercel Dashboard
# https://vercel.com/davids-projects-8fa96e54/browser/settings/deployment-protection

# 2. En "Deployment Protection":
#    - Cambiar de "Standard Protection" a "Only Preview Deployments"
#    - O cambiar a "No Protection" (menos seguro pero más fácil)

# 3. Guardar cambios
```

### Opción 2: Cambiar alias a proyecto `clinic-frontend`

El proyecto `clinic-frontend` **NO** tiene protection activada, así que podemos apuntar el alias ahí:

```powershell
# 1. Hacer nuevo deployment de Actifisio en clinic-frontend
cd C:\Users\dsuarez1\git\clinic
.\DEPLOY_ACTIFISIO_CLINIC_FRONTEND.ps1  # Script a crear

# 2. El alias debería apuntar automáticamente al nuevo deployment
```

---

## 🔧 IMPLEMENTACIÓN (Opción 1 - Desactivar Protection)

### Paso 1: Acceder a Vercel Dashboard

```powershell
# Abrir en navegador
start https://vercel.com/davids-projects-8fa96e54/browser/settings/deployment-protection
```

### Paso 2: Cambiar configuración

1. **Standard Protection** → **Only Preview Deployments**

   - Esto permite que Production (actifisio.vercel.app) sea pública
   - Los preview deployments seguirán protegidos

2. **Guardar cambios**

### Paso 3: Verificar

```powershell
# Limpiar cache del navegador
# Ctrl+Shift+Delete → Borrar cache

# Abrir en modo incógnito
start msedge -inprivate https://actifisio.vercel.app
```

---

## 📱 SOLUCIÓN PWA (No se puede instalar)

### Problema

Cuando un sitio tiene Deployment Protection, el Service Worker no puede registrarse correctamente, impidiendo la instalación como PWA.

### Solución

Una vez desactivada la protection:

1. **En Android:**

   - Abrir Chrome/Edge
   - Ir a `https://actifisio.vercel.app`
   - Menú (3 puntos) → "Agregar a pantalla de inicio"
   - O "Instalar app"

2. **En iOS:**
   - Abrir Safari
   - Ir a `https://actifisio.vercel.app`
   - Botón compartir → "Agregar a pantalla de inicio"

---

## ⚙️ CONFIGURACIÓN RECOMENDADA EN VERCEL

### Para proyectos públicos (como clínicas):

```yaml
Deployment Protection: Only Preview Deployments
├── Production (actifisio.vercel.app): ✅ Sin protección
├── Preview (branch-xxx): 🔒 Con protección
└── Development: 🔒 Con protección
```

### Para proyectos privados/internos:

```yaml
Deployment Protection: Standard Protection
├── Production: 🔒 Requiere Vercel login
├── Preview: 🔒 Requiere Vercel login
└── Development: 🔒 Requiere Vercel login
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

Después de desactivar protection:

- [ ] Abrir `https://actifisio.vercel.app` en modo incógnito
- [ ] Verificar que NO pide login de Vercel
- [ ] Verificar que la app carga correctamente
- [ ] Verificar colores de Actifisio (naranja/amarillo)
- [ ] Probar en móvil (Android o iOS)
- [ ] Intentar "Agregar a pantalla de inicio"
- [ ] Verificar que muestra el prompt de instalación
- [ ] Instalar y probar la PWA

---

## 🔍 CÓMO VERIFICAR PROTECTION ACTUAL

```powershell
# Ver configuración del proyecto browser
vercel project ls --scope davids-projects-8fa96e54 | Select-String "browser"

# Ver configuración del proyecto clinic-frontend
vercel project ls --scope davids-projects-8fa96e54 | Select-String "clinic-frontend"
```

---

## 📚 DOCUMENTACIÓN OFICIAL

- Vercel Deployment Protection: https://vercel.com/docs/security/deployment-protection
- Desactivar protection: https://vercel.com/docs/security/deployment-protection#disabling-deployment-protection
- PWA y Service Workers: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing

---

## ✅ RESULTADO ESPERADO

Después de aplicar la solución:

```
✅ https://actifisio.vercel.app
   - Accesible sin login
   - Carga correctamente
   - Colores de Actifisio (naranja/amarillo)
   - PWA instalable en móvil
   - Service Worker registrado
   - Manifest.json accesible

✅ https://masajecorporaldeportivo.vercel.app
   - Sigue funcionando igual
   - Sin cambios
```

---

**Próximo paso:** Ir a Vercel Dashboard y desactivar Deployment Protection en el proyecto `browser`.
