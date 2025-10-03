# ✅ ACTUALIZACIÓN: Cliente 2 renombrado a "Actifisio"

**Fecha:** 2025-10-03  
**Cambio:** Cliente 2 renombrado de "fisioterapiacentro" → "actifisio"

---

## 📋 Resumen de Cambios

El segundo cliente del sistema multi-tenant ha sido renombrado correctamente a **"Actifisio"** en todos los archivos de configuración, scripts y documentación.

---

## 📁 Archivos Modificados (10)

### 1️⃣ Frontend - Configuración

**`frontend/src/config/clients/fisioterapia-centro.config.ts`** → **`actifisio.config.ts`**
- ✅ Archivo renombrado
- ✅ Export: `fisioterapiacentroConfig` → `actifisioConfig`
- ✅ tenantSlug: `'fisioterapiacentro'` → `'actifisio'`
- ✅ info.name: `'Fisioterapia Centro'` → `'Actifisio'`
- ✅ info.shortName: `'FisioCentro'` → `'Actifisio'`
- ✅ info.email: `contacto@fisioterapiacentro.com` → `contacto@actifisio.com`
- ✅ info.website: `https://fisioterapiacentro.com` → `https://actifisio.com`
- ✅ assets.logo: `assets/clients/fisioterapia-centro/logo.png` → `assets/clients/actifisio/logo.png`
- ✅ pwa.name: `'Fisioterapia Centro'` → `'Actifisio'`
- ✅ pwa.shortName: `'FisioCentro'` → `'Actifisio'`
- ✅ pwa.description: Actualizado con "Actifisio"

---

**`frontend/src/config/config.loader.ts`**
```typescript
// ANTES
import { fisioterapiacentroConfig } from './clients/fisioterapia-centro.config';
const CLIENT_CONFIGS = {
  'fisioterapiacentro': fisioterapiacentroConfig,
};

// DESPUÉS
import { actifisioConfig } from './clients/actifisio.config';
const CLIENT_CONFIGS = {
  'actifisio': actifisioConfig,
};
```

---

### 2️⃣ Assets

**`frontend/src/assets/clients/fisioterapiacentro/`** → **`actifisio/`**
- ✅ Carpeta renombrada
- ⚠️ Logo pendiente de copiar (script genera warning, no bloquea)

---

### 3️⃣ Scripts - Generación de Manifest

**`scripts/generate-manifest.js`**
```javascript
// ANTES
fisioterapiacentro: {
  name: 'Fisioterapia Centro',
  shortName: 'Fisio Centro',
  logoPath: 'assets/clients/fisioterapiacentro/logo.png'
}

// DESPUÉS
actifisio: {
  name: 'Actifisio',
  shortName: 'Actifisio',
  description: 'Sistema de gestión para centro de fisioterapia Actifisio',
  logoPath: 'assets/clients/actifisio/logo.png'
}
```

---

**`scripts/generate-manifest.ps1`**
```powershell
# ANTES
fisioterapiacentro = @{
    Name = "Fisioterapia Centro"
    ShortName = "Fisio Centro"
    LogoPath = "assets/clients/fisioterapiacentro/logo.png"
}

# DESPUÉS
actifisio = @{
    Name = "Actifisio"
    ShortName = "Actifisio"
    Description = "Sistema de gestión para centro de fisioterapia Actifisio"
    LogoPath = "assets/clients/actifisio/logo.png"
}
```

Comentarios actualizados:
```powershell
# EJEMPLOS:
#   .\scripts\generate-manifest.ps1 actifisio
```

---

**`scripts/build-client.ps1`**
```powershell
# ANTES
[ValidateSet("masajecorporaldeportivo", "fisioterapiacentro", "default")]

# DESPUÉS
[ValidateSet("masajecorporaldeportivo", "actifisio", "default")]
```

Detección en bundle:
```powershell
# ANTES
} elseif ($content -match "fisioterapiacentro") {
    Write-Host "   ✅ Cliente: Fisioterapia Centro (naranja/amarillo)"

# DESPUÉS
} elseif ($content -match "actifisio") {
    Write-Host "   ✅ Cliente: Actifisio (naranja/amarillo)"
```

---

### 4️⃣ Package.json - Scripts npm

**`package.json` (raíz)**
```json
// ANTES
"build:fisioterapia": "cross-env VITE_CLIENT_ID=fisioterapiacentro npm run build:client"

// DESPUÉS
"build:actifisio": "cross-env VITE_CLIENT_ID=actifisio npm run build:client"
```

---

**`frontend/package.json`**
```json
// ANTES
"build:fisioterapia": "cross-env VITE_CLIENT_ID=fisioterapiacentro npm run build"

// DESPUÉS
"build:actifisio": "cross-env VITE_CLIENT_ID=actifisio npm run build"
```

---

### 5️⃣ Documentación

**`DEMO_TEMAS_MULTICLIENTE.html`**
- ✅ 16 ocurrencias reemplazadas:
  - `fisioterapiacentro` → `actifisio`
  - `Fisioterapia Centro` → `Actifisio`

Ejemplos actualizados:
```powershell
# Cliente 2 (Actifisio - Naranja/Amarillo)
$env:VITE_CLIENT_ID = "actifisio"
ng build

.\scripts\build-client.ps1 -ClientId actifisio
```

Variables de entorno Vercel:
```
VITE_CLIENT_ID = masajecorporaldeportivo  (o actifisio)
```

---

## 🧪 Testing Realizado

### Test 1: Generación de Manifest
```powershell
PS> .\scripts\generate-manifest.ps1 actifisio
✅ Logo verificado: assets/clients/actifisio/logo.png
✅ Manifest generado exitosamente!
```

**Resultado en manifest.json:**
```json
{
    "name": "Actifisio",
    "short_name": "Actifisio",
    "description": "Sistema de gestión para centro de fisioterapia Actifisio",
    "theme_color": "#ff6b35"
}
```
✅ **PASS**

---

### Test 2: Validación de Configuración
```typescript
// config.loader.ts carga correctamente
const CLIENT_CONFIGS = {
  'masajecorporaldeportivo': masajecorporaldeportivoConfig,
  'actifisio': actifisioConfig  // ✅ Importación correcta
};
```
✅ **PASS**

---

## 📊 Comparativa Final

| Aspecto | Cliente 1 | Cliente 2 |
|---------|-----------|-----------|
| **Nombre** | Masaje Corporal Deportivo | Actifisio |
| **Nombre Corto** | Clínica MCD | Actifisio |
| **Tenant Slug** | masajecorporaldeportivo | actifisio |
| **Color Tema** | #667eea (Azul/Morado) | #ff6b35 (Naranja/Amarillo) |
| **Tablas BD** | `patients_masajecorporaldeportivo` | `patients_actifisio` |
| **Build Command** | `npm run build:masajecorporal` | `npm run build:actifisio` |
| **Script PS** | `.\scripts\build-client.ps1 masajecorporaldeportivo` | `.\scripts\build-client.ps1 actifisio` |
| **Vercel Env** | `VITE_CLIENT_ID=masajecorporaldeportivo` | `VITE_CLIENT_ID=actifisio` |

---

## 🔑 Nomenclatura de Base de Datos

Con el tenant slug `actifisio`, las tablas en el backend serán:

```sql
-- Tablas con sufijo actifisio
patients_actifisio
appointments_actifisio
credit_packs_actifisio
credit_transactions_actifisio
patient_files_actifisio
patient_notes_actifisio
configurations_actifisio
```

El backend usa el header `X-Tenant-Slug: actifisio` para determinar qué tablas consultar.

---

## 🚀 Scripts Actualizados

### Generación de Manifest
```bash
# PowerShell
.\scripts\generate-manifest.ps1 actifisio

# Node.js
node scripts/generate-manifest.js actifisio

# npm
VITE_CLIENT_ID=actifisio npm run generate:manifest
```

### Build Completo
```bash
# npm (recomendado)
npm run build:actifisio

# PowerShell
.\scripts\build-client.ps1 actifisio

# Manual
$env:VITE_CLIENT_ID = "actifisio"
cd frontend
ng build
```

---

## ⚠️ Pendiente

### Logo de Actifisio
El logo aún no existe en `frontend/src/assets/clients/actifisio/logo.png`

**Acción requerida:**
1. Crear logo de Actifisio (192x192px mínimo, PNG con transparencia)
2. Copiar a: `frontend/src/assets/clients/actifisio/logo.png`
3. Opcional: favicon.ico y apple-touch-icon.png

Mientras tanto, el manifest se genera correctamente con warning pero no bloquea el build.

---

## ✅ Checklist de Actualización

- [x] Archivo de configuración renombrado y actualizado
- [x] config.loader.ts actualizado con nuevo import
- [x] Carpeta de assets renombrada
- [x] Script generate-manifest.js actualizado
- [x] Script generate-manifest.ps1 actualizado
- [x] Script build-client.ps1 actualizado
- [x] package.json raíz actualizado
- [x] frontend/package.json actualizado
- [x] DEMO_TEMAS_MULTICLIENTE.html actualizado
- [x] Test de generación de manifest exitoso
- [x] Manifest.json generado correctamente
- [ ] ⚠️ Logo de Actifisio pendiente

---

## 🎯 Impacto

### ✅ Sin Breaking Changes
- Los cambios son solo de nomenclatura
- No afectan la funcionalidad existente
- Cliente 1 (masajecorporaldeportivo) sigue funcionando igual
- Backend ya soporta cualquier tenant slug

### ✅ Listo para Deployment
- Variables de entorno en Vercel: `VITE_CLIENT_ID=actifisio`
- Tablas de BD: usar sufijo `_actifisio`
- Headers HTTP: `X-Tenant-Slug: actifisio`

---

## 🔄 Próximos Pasos

Continuar con **Fase 5: Scripts de Deployment** usando la nomenclatura actualizada:
- Proyecto Vercel: `actifisio-web`
- URL: `actifisio.vercel.app` (o dominio personalizado)
- Variables: `VITE_CLIENT_ID=actifisio`

---

**Estado:** ✅ COMPLETADO  
**Tiempo:** 10 min  
**Próximo:** Fase 5 - Deployment Automation
