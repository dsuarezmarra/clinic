# ⚡ CHECKLIST ACTUALIZADO V3: NUEVO CLIENTE 0-100%

**Versión:** 3.0.0  
**Última actualización:** 4 de octubre de 2025, 13:30  
**Estado:** ✅ VALIDADO EN PRODUCCIÓN (Actifisio)  
**Objetivo:** Implementar cliente nuevo desde 0 hasta producción en 60 min

---

## 🚨 CAMBIOS CRÍTICOS EN ESTA VERSIÓN

### ✅ Nuevos Componentes (No existían ayer):

1. **`frontend/src/index.html`** → Script de inyección CLIENT_ID
2. **`frontend/scripts/inject-client-id-postbuild.js`** → Script post-build AUTOMÁTICO
3. **`frontend/package.json`** → Script `postbuild` agregado
4. **`tenant.interceptor.ts`** → Prioriza `window.__CLIENT_ID`

### 🔧 Correcciones Críticas:

- ❌ **ANTES:** CLIENT_ID no se inyectaba en HTML → Interceptor fallaba
- ✅ **AHORA:** Script post-build inyecta automáticamente → Todo funciona

### ⚠️ Problemas Resueltos:

1. ✅ X-Tenant-Slug incorrecto (usaba deployment URL)
2. ✅ Error 404 al refrescar (F5) en rutas SPA
3. ✅ Caché del navegador cargaba cliente antiguo
4. ✅ PWA no instalable sin Deployment Protection desactivada

---

## 🎯 INFORMACIÓN PREVIA REQUERIDA

```yaml
cliente_id: "nuevocliente" # minúsculas, sin espacios, sin guiones
nombre_completo: "Nombre Completo del Cliente"
nombre_corto: "NombreCorto"
color_primario: "#FF5733" # Hex color
color_secundario: "#C70039"
color_acento: "#900C3F"
logo_archivo: "logo-cliente.png" # 512x512px PNG
telefono: "+34 XXX XXX XXX"
email: "contacto@cliente.com"
direccion: "Calle Principal, 123"
ciudad: "Madrid"
codigo_postal: "28001"
provincia: "Madrid"
url_deseada: "nuevocliente.vercel.app"
```

---

## 📊 TIMELINE ACTUALIZADO

| Fase | Tarea                         | Tiempo | Acumulado |
| ---- | ----------------------------- | ------ | --------- |
| 0    | Verificación de Prerequisites | 2 min  | 2 min     |
| 1    | Preparación de Assets         | 5 min  | 7 min     |
| 2    | Configuración Frontend        | 15 min | 22 min    |
| 3    | Base de Datos (Supabase)      | 15 min | 37 min    |
| 4    | Scripts de Deployment         | 5 min  | 42 min    |
| 5    | Build y Deploy                | 15 min | 57 min    |
| 6    | Testing y Validación          | 10 min | 67 min    |
| 7    | Troubleshooting Caché         | 5 min  | 72 min    |

**Total:** ~70 minutos (incluyendo troubleshooting)

---

## ✅ FASE 0: VERIFICACIÓN DE PREREQUISITES (2 min)

### 0.1 Verificar Scripts Existen

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend

# Verificar script post-build
Test-Path "scripts\inject-client-id-postbuild.js"
# Debe retornar: True

# Verificar package.json tiene postbuild
Select-String -Path "package.json" -Pattern "postbuild"
# Debe mostrar: "postbuild": "node scripts/inject-client-id-postbuild.js"

# Verificar index.html tiene script de inyección
Select-String -Path "src\index.html" -Pattern "__CLIENT_ID"
# Debe mostrar: window.__CLIENT_ID = '__VITE_CLIENT_ID__';
```

**❌ Si alguno falta, DETENTE y crea los archivos primero.**

### 0.2 Verificar Tenant Interceptor Actualizado

```powershell
# Verificar que interceptor prioriza window.__CLIENT_ID
Select-String -Path "src\app\interceptors\tenant.interceptor.ts" -Pattern "window.__CLIENT_ID" -Context 2
```

**Debe contener:**

```typescript
const injectedClientId = (window as any).__CLIENT_ID;
if (injectedClientId && typeof injectedClientId === "string") {
  return injectedClientId;
}
```

---

## ✅ FASE 1: PREPARACIÓN DE ASSETS (5 min)

### 1.1 Crear Carpeta y Copiar Logo

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend\src\assets\clients

# Crear carpeta del cliente
mkdir nuevocliente

# Copiar logo (DEBE ser 512x512px PNG)
Copy-Item "C:\ruta\al\logo-cliente.png" -Destination ".\nuevocliente\logo.png"

# Verificar tamaño (debe ser ~50-200 KB)
Get-Item "nuevocliente\logo.png" | Select-Object Name, Length
```

**✅ Verificación:**

- Logo existe: `nuevocliente\logo.png`
- Tamaño: 50-200 KB (óptimo para web)
- Formato: PNG con transparencia

---

## ✅ FASE 2: CONFIGURACIÓN FRONTEND (15 min)

### 2.1 Crear Archivo de Configuración

**Archivo:** `frontend/src/config/clients/nuevocliente.config.ts`

```typescript
import { ClientConfig } from "../client-config.interface";

/**
 * Configuración del Cliente: [NOMBRE COMPLETO]
 * Tema: [Descripción colores]
 */
export const nuevoclienteConfig: ClientConfig = {
  // Identificador único para el backend (X-Tenant-Slug)
  tenantSlug: "nuevocliente",

  // Información de la clínica
  info: {
    name: "Nombre Completo del Cliente",
    shortName: "NombreCorto",
    phone: "+34 XXX XXX XXX",
    email: "contacto@cliente.com",
    address: "Calle Principal, 123",
    city: "Madrid",
    postalCode: "28001",
    province: "Madrid",
    website: "https://cliente.com",
    socialMedia: {
      instagram: "https://instagram.com/cliente",
    },
  },

  // Tema visual
  theme: {
    primary: "#FF5733", // Color primario
    secondary: "#C70039", // Color secundario
    accent: "#900C3F", // Color de acento
    headerGradient: "linear-gradient(135deg, #FF5733 0%, #C70039 100%)",
    buttonColor: "#FF5733",
    buttonHover: "#E54A2A", // 10% más oscuro que primary
  },

  // Rutas de assets
  assets: {
    logo: "assets/clients/nuevocliente/logo.png",
    favicon: "assets/clients/nuevocliente/logo.png",
    appleTouchIcon: "assets/clients/nuevocliente/logo.png",
  },

  // Configuración de backend (API compartida)
  backend: {
    apiUrl: "https://masajecorporaldeportivo-api.vercel.app/api", // API compartida
  },

  // Configuración de PWA
  pwa: {
    name: "Nombre Completo del Cliente",
    shortName: "NombreCorto",
    description: "Gestión de clínica - Nombre del Cliente",
    themeColor: "#FF5733",
    backgroundColor: "#FFFFFF",
  },

  // Configuración de features (opcional)
  features: {
    enableBonos: true,
    enableFamilyContact: true,
    enableNotes: true,
    enableExport: true,
  },
};
```

### 2.2 Registrar en Config Loader

**Archivo:** `frontend/src/config/config.loader.ts`

**BUSCAR:**

```typescript
import { actifisioConfig } from "./clients/actifisio.config";
```

**AGREGAR DESPUÉS:**

```typescript
import { nuevoclienteConfig } from "./clients/nuevocliente.config";
```

**BUSCAR:**

```typescript
const configMap: Record<string, ClientConfig> = {
  masajecorporaldeportivo: masajecorporaldeportivoConfig,
  actifisio: actifisioConfig,
  // Agregar aquí nuevos clientes
};
```

**MODIFICAR A:**

```typescript
const configMap: Record<string, ClientConfig> = {
  masajecorporaldeportivo: masajecorporaldeportivoConfig,
  actifisio: actifisioConfig,
  nuevocliente: nuevoclienteConfig, // ← NUEVO
  // Agregar aquí nuevos clientes
};
```

### 2.3 Actualizar Scripts en package.json

**Archivo:** `frontend/package.json`

**BUSCAR:**

```json
"scripts": {
  "build:masajecorporal": "cross-env VITE_CLIENT_ID=masajecorporaldeportivo npm run build",
  "build:actifisio": "cross-env VITE_CLIENT_ID=actifisio npm run build"
}
```

**AGREGAR:**

```json
"scripts": {
  "build:masajecorporal": "cross-env VITE_CLIENT_ID=masajecorporaldeportivo npm run build",
  "build:actifisio": "cross-env VITE_CLIENT_ID=actifisio npm run build",
  "build:nuevocliente": "cross-env VITE_CLIENT_ID=nuevocliente npm run build"
}
```

---

## ✅ FASE 3: BASE DE DATOS SUPABASE (15 min)

### 3.1 Crear Tablas Multi-Tenant

**Conectar a Supabase SQL Editor:**

```
https://supabase.com/dashboard/project/[PROJECT_ID]/sql
```

**Ejecutar Script SQL Completo:**

```sql
-- ============================================
-- NUEVO CLIENTE: nuevocliente
-- Fecha: 4 de octubre de 2025
-- ============================================

-- 1. TABLA: patients_nuevocliente
CREATE TABLE IF NOT EXISTS public.patients_nuevocliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    phone TEXT,
    phone2 TEXT,
    email TEXT,
    address TEXT,
    cp TEXT,
    city TEXT,
    province TEXT,
    "birthDate" TIMESTAMP,
    notes TEXT,
    family_contact TEXT,
    "fechaRegistro" DATE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. TABLA: appointments_nuevocliente
CREATE TABLE IF NOT EXISTS public.appointments_nuevocliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL REFERENCES public.patients_nuevocliente(id) ON DELETE CASCADE,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER,
    status TEXT NOT NULL DEFAULT 'BOOKED',
    notes TEXT,
    "consumesCredit" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. TABLA: credit_packs_nuevocliente
CREATE TABLE IF NOT EXISTS public.credit_packs_nuevocliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL REFERENCES public.patients_nuevocliente(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    "unitsTotal" INTEGER NOT NULL,
    "unitMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "unitsRemaining" INTEGER NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);

-- 4. TABLA: credit_redemptions_nuevocliente
CREATE TABLE IF NOT EXISTS public.credit_redemptions_nuevocliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "creditPackId" UUID NOT NULL REFERENCES public.credit_packs_nuevocliente(id) ON DELETE CASCADE,
    "appointmentId" UUID NOT NULL REFERENCES public.appointments_nuevocliente(id) ON DELETE CASCADE,
    "unitsUsed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 5. TABLA: files_nuevocliente
CREATE TABLE IF NOT EXISTS public.files_nuevocliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID REFERENCES public.patients_nuevocliente(id) ON DELETE CASCADE,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    description TEXT,
    "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- 6. ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_patients_nuevocliente_dni ON public.patients_nuevocliente(dni);
CREATE INDEX IF NOT EXISTS idx_patients_nuevocliente_phone ON public.patients_nuevocliente(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_nuevocliente_patient ON public.appointments_nuevocliente("patientId");
CREATE INDEX IF NOT EXISTS idx_appointments_nuevocliente_start ON public.appointments_nuevocliente(start);
CREATE INDEX IF NOT EXISTS idx_credit_packs_nuevocliente_patient ON public.credit_packs_nuevocliente("patientId");
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_nuevocliente_pack ON public.credit_redemptions_nuevocliente("creditPackId");
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_nuevocliente_appointment ON public.credit_redemptions_nuevocliente("appointmentId");
CREATE INDEX IF NOT EXISTS idx_files_nuevocliente_patient ON public.files_nuevocliente("patientId");

-- 7. ROW LEVEL SECURITY (RLS) - DESACTIVADO PARA DESARROLLO
ALTER TABLE public.patients_nuevocliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_nuevocliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs_nuevocliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions_nuevocliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files_nuevocliente ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (TODO: Implementar autenticación)
CREATE POLICY "Allow all for now - patients_nuevocliente"
    ON public.patients_nuevocliente FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for now - appointments_nuevocliente"
    ON public.appointments_nuevocliente FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for now - credit_packs_nuevocliente"
    ON public.credit_packs_nuevocliente FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for now - credit_redemptions_nuevocliente"
    ON public.credit_redemptions_nuevocliente FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for now - files_nuevocliente"
    ON public.files_nuevocliente FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ✅ TABLAS CREADAS EXITOSAMENTE
-- ============================================
```

### 3.2 Verificar Tablas Creadas

```sql
-- Listar todas las tablas del cliente
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%nuevocliente%'
ORDER BY tablename;

-- Resultado esperado (5 tablas):
-- appointments_nuevocliente
-- credit_packs_nuevocliente
-- credit_redemptions_nuevocliente
-- files_nuevocliente
-- patients_nuevocliente
```

### 3.3 Insertar Datos de Prueba (Opcional)

```sql
-- Paciente de prueba
INSERT INTO public.patients_nuevocliente
    ("firstName", "lastName", phone, email, city)
VALUES
    ('Juan', 'Pérez', '600123456', 'juan@test.com', 'Madrid');

-- Verificar
SELECT * FROM public.patients_nuevocliente;
```

---

## ✅ FASE 4: SCRIPTS DE DEPLOYMENT (5 min)

### 4.1 Actualizar generate-manifest.js

**Archivo:** `frontend/scripts/generate-manifest.js`

**BUSCAR:**

```javascript
const allowedClients = ["masajecorporaldeportivo", "actifisio"];
```

**MODIFICAR A:**

```javascript
const allowedClients = ["masajecorporaldeportivo", "actifisio", "nuevocliente"];
```

### 4.2 Actualizar generate-manifest.ps1 (PowerShell)

**Archivo:** `frontend/scripts/generate-manifest.ps1`

**BUSCAR:**

```powershell
$allowedClients = @('masajecorporaldeportivo', 'actifisio')
```

**MODIFICAR A:**

```powershell
$allowedClients = @('masajecorporaldeportivo', 'actifisio', 'nuevocliente')
```

---

## ✅ FASE 5: BUILD Y DEPLOY (15 min)

### 5.1 Build de Producción

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend

# Setear variable de entorno
$env:VITE_CLIENT_ID="nuevocliente"

# Build (prebuild + build + postbuild se ejecutan automáticamente)
npm run build
```

**✅ Verificar Logs del Build:**

```
> prebuild
✅ Usando cliente desde VITE_CLIENT_ID: nuevocliente
✅ Manifest generado exitosamente

> build
Browser bundles generated...

> postbuild
📌 CLIENT_ID: nuevocliente
✅ index.csr.html: CLIENT_ID inyectado correctamente
   ✓ Verificado: window.__CLIENT_ID = 'nuevocliente'
```

### 5.2 Preparar Carpeta de Deploy

```powershell
# Eliminar deployment anterior si existe
Remove-Item -Path "dist\nuevocliente-build" -Recurse -Force -ErrorAction SilentlyContinue

# Copiar build a carpeta específica del cliente
Copy-Item -Path "dist\clinic-frontend" -Destination "dist\nuevocliente-build" -Recurse

# Crear index.html desde index.csr.html (requerido por Vercel)
Copy-Item -Path "dist\nuevocliente-build\browser\index.csr.html" `
          -Destination "dist\nuevocliente-build\browser\index.html" -Force

# Verificar que CLIENT_ID está inyectado
Select-String -Path "dist\nuevocliente-build\browser\index.html" -Pattern "window.__CLIENT_ID"
```

**✅ Debe mostrar:**

```
window.__CLIENT_ID = 'nuevocliente';
```

### 5.3 Deploy a Vercel

```powershell
cd dist\nuevocliente-build\browser

# Deploy a producción
vercel --prod --scope davids-projects-8fa96e54 --yes
```

**✅ Resultado Esperado:**

```
✅ Production: https://browser-xxxxxxxx-davids-projects-8fa96e54.vercel.app
```

**Copiar la URL del deployment** (la necesitarás para el alias)

### 5.4 Configurar Alias Personalizado

```powershell
# Setear alias personalizado
vercel alias set browser-xxxxxxxx-davids-projects-8fa96e54.vercel.app nuevocliente.vercel.app --scope davids-projects-8fa96e54
```

**✅ Resultado:**

```
Success! https://nuevocliente.vercel.app now points to https://browser-xxxxxxxx...
```

### 5.5 Configurar Vercel Project Settings

**⚠️ CRÍTICO PARA PWA:**

1. Ir a: `https://vercel.com/davids-projects-8fa96e54/browser/settings/deployment-protection`
2. **Deployment Protection:** Cambiar a **"Only Preview Deployments"**
3. **Reason:** Service Workers de PWA no funcionan con autenticación

---

## ✅ FASE 6: TESTING Y VALIDACIÓN (10 min)

### 6.1 Verificar Deployment Directo

```powershell
# Verificar que CLIENT_ID está inyectado
$html = Invoke-WebRequest -Uri "https://browser-xxxxxxxx-davids-projects-8fa96e54.vercel.app" -UseBasicParsing
if ($html.Content -match "window.__CLIENT_ID = 'nuevocliente'") {
    Write-Host "✅ CLIENT_ID CORRECTO" -ForegroundColor Green
} else {
    Write-Host "❌ CLIENT_ID INCORRECTO" -ForegroundColor Red
}
```

### 6.2 Verificar Alias

```powershell
# Abrir en navegador (MODO INCÓGNITO recomendado)
Start-Process msedge -ArgumentList "-inprivate","https://nuevocliente.vercel.app"
```

### 6.3 Checklist de Verificación en Navegador

**Abrir DevTools (F12) → Console:**

```javascript
// Verificar CLIENT_ID inyectado
console.log(window.__CLIENT_ID);
// Debe mostrar: "nuevocliente"

// Verificar configuración cargada
// Debería aparecer en logs:
// ✅ Configuración cargada para cliente: nuevocliente
// 🏢 Cliente: [NOMBRE COMPLETO]
// 🔑 Tenant Slug: nuevocliente
// 🎨 Tema primario: [COLOR]
```

**Verificar Headers HTTP (F12 → Network → Filtrar por /api/):**

```
Request Headers:
  X-Tenant-Slug: nuevocliente  ← DEBE ser el slug correcto
```

**Verificar Colores y Branding:**

- ✅ Header: Muestra colores del cliente (no azul/púrpura default)
- ✅ Logo: Muestra logo del cliente
- ✅ Botones: Colores personalizados
- ✅ Favicon: Logo del cliente

**Verificar Navegación SPA:**

- ✅ Ir a: `/inicio`
- ✅ Presionar `F5` (recargar)
- ✅ **NO debe dar 404** → Debe recargar correctamente

**Verificar Datos:**

- ✅ Dashboard carga estadísticas
- ✅ Agenda muestra calendario
- ✅ Pacientes lista (vacío está OK)
- ✅ No hay errores 404 en Network tab

---

## ✅ FASE 7: TROUBLESHOOTING CACHÉ (5 min)

### 7.1 Limpiar Caché si Muestra Cliente Antiguo

**Síntoma:**

- Abre `nuevocliente.vercel.app`
- Muestra colores/logo de otro cliente (masajecorporaldeportivo o actifisio)

**Solución:**

```
1. Ctrl + Shift + Delete
2. Seleccionar:
   - ✅ Cookies y otros datos de sitios
   - ✅ Imágenes y archivos en caché
   - ✅ Datos de aplicaciones hospedadas
3. Rango: "Desde siempre"
4. Borrar
5. Cerrar TODAS las ventanas del navegador
6. Reabrir navegador
7. Probar: https://nuevocliente.vercel.app
```

**O usar Modo Incógnito:**

```
Ctrl + Shift + N → https://nuevocliente.vercel.app
```

### 7.2 Verificar Service Workers

**F12 → Application → Service Workers:**

- Si hay Service Workers registrados de otro cliente → **Unregister**
- Recargar página: `Ctrl + Shift + R`

---

## 📊 CHECKLIST FINAL DE VALIDACIÓN

### ✅ Frontend

- [ ] Logo copiado: `assets/clients/nuevocliente/logo.png`
- [ ] Config creado: `config/clients/nuevocliente.config.ts`
- [ ] Config registrado en `config.loader.ts`
- [ ] Script build agregado en `package.json`
- [ ] Build ejecutado sin errores
- [ ] CLIENT_ID inyectado en HTML
- [ ] `index.html` creado desde `index.csr.html`

### ✅ Backend/Database

- [ ] 5 tablas creadas en Supabase con sufijo `_nuevocliente`
- [ ] RLS habilitado con políticas permisivas
- [ ] Índices creados correctamente
- [ ] Foreign keys configuradas
- [ ] Datos de prueba insertados (opcional)

### ✅ Scripts

- [ ] `generate-manifest.js` actualizado
- [ ] `generate-manifest.ps1` actualizado
- [ ] Manifest generado con colores correctos
- [ ] Script `postbuild` ejecutado correctamente

### ✅ Deployment

- [ ] Build desplegado a Vercel
- [ ] Alias configurado: `nuevocliente.vercel.app`
- [ ] Deployment Protection: "Only Preview Deployments"
- [ ] Deployment responde HTTP 200
- [ ] CLIENT_ID correcto en HTML remoto

### ✅ Validación en Navegador

- [ ] Logo del cliente visible
- [ ] Colores personalizados aplicados
- [ ] Header con gradiente correcto
- [ ] Console muestra: `CLIENT_ID: nuevocliente`
- [ ] API calls usan header: `X-Tenant-Slug: nuevocliente`
- [ ] F5 no da 404 (routing SPA funciona)
- [ ] Dashboard carga sin errores
- [ ] No hay errores 404 en Network tab

### ✅ PWA (Opcional - Prueba en móvil)

- [ ] Manifest accesible: `/manifest.json`
- [ ] Service Worker se registra
- [ ] "Agregar a pantalla de inicio" aparece
- [ ] App se instala correctamente
- [ ] Ícono y colores correctos en app instalada

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: CLIENT_ID no se inyecta

**Síntoma:**

```javascript
console.log(window.__CLIENT_ID);
// undefined o 'masajecorporaldeportivo'
```

**Solución:**

```powershell
# Verificar que script postbuild existe
Test-Path "frontend\scripts\inject-client-id-postbuild.js"

# Verificar que package.json tiene postbuild
Select-String -Path "frontend\package.json" -Pattern "postbuild"

# Re-ejecutar build
cd frontend
$env:VITE_CLIENT_ID="nuevocliente"
npm run build

# Verificar inyección
Select-String -Path "dist\clinic-frontend\browser\index.csr.html" -Pattern "__CLIENT_ID"
```

### Problema 2: X-Tenant-Slug Incorrecto

**Síntoma:**

```
[TenantInterceptor] Agregando header X-Tenant-Slug: browser-xxxxxxxx
```

**Causa:** Interceptor usa deployment URL en lugar de CLIENT_ID inyectado

**Solución:**

1. Verificar que `tenant.interceptor.ts` tiene código actualizado (prioriza `window.__CLIENT_ID`)
2. Rebuild y redeploy
3. Limpiar caché del navegador

### Problema 3: Error 404 al Refrescar (F5)

**Síntoma:**

```
GET https://nuevocliente.vercel.app/inicio → 404
```

**Causa:** `vercel.json` falta o incorrecto

**Solución:**

```json
// Crear/Actualizar: dist/nuevocliente-build/browser/vercel.json
{
  "version": 2,
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

Redesplegar: `vercel --prod`

### Problema 4: Caché Muestra Cliente Antiguo

**Síntoma:**

- URL: `nuevocliente.vercel.app`
- Muestra: Logo/colores de otro cliente

**Solución:**

- Modo Incógnito: `Ctrl + Shift + N`
- O limpiar caché completo (ver Fase 7)

### Problema 5: API da 404 o 500

**Síntoma:**

```
GET /api/patients → 404 (Not Found)
```

**Causa:** Tablas no existen en Supabase o RLS bloquea acceso

**Solución:**

```sql
-- Verificar tablas
SELECT tablename FROM pg_tables
WHERE tablename LIKE '%nuevocliente%';

-- Si faltan tablas, ejecutar SQL de Fase 3

-- Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%nuevocliente%';

-- Si RLS está muy restrictivo, actualizar políticas
```

### Problema 6: Build Falla en postbuild

**Síntoma:**

```
> postbuild
⚠️ Archivo no encontrado: index.html
```

**Causa:** Angular genera `index.csr.html` pero no `index.html`

**Solución:**

- Esto es normal
- El script debe decir: "✅ index.csr.html: CLIENT_ID inyectado"
- Luego DEBES copiar: `index.csr.html` → `index.html` (Fase 5.2)

---

## 📄 ARCHIVOS CREADOS/MODIFICADOS

### Nuevos Archivos:

1. `frontend/src/assets/clients/nuevocliente/logo.png`
2. `frontend/src/config/clients/nuevocliente.config.ts`
3. `frontend/dist/nuevocliente-build/browser/index.html` (copiado)

### Archivos Modificados:

1. `frontend/src/config/config.loader.ts` (import + registro)
2. `frontend/package.json` (script build)
3. `frontend/scripts/generate-manifest.js` (allowedClients)
4. `frontend/scripts/generate-manifest.ps1` (allowedClients)

### Archivos en Supabase:

1. 5 tablas nuevas con sufijo `_nuevocliente`
2. Índices y políticas RLS

---

## 🚀 COMANDOS RÁPIDOS DE REFERENCIA

```powershell
# VARIABLES
$cliente = "nuevocliente"
$env:VITE_CLIENT_ID = $cliente

# BUILD
cd C:\Users\dsuarez1\git\clinic\frontend
npm run build

# PREPARAR DEPLOY
Remove-Item -Path "dist\$cliente-build" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "dist\clinic-frontend" -Destination "dist\$cliente-build" -Recurse
Copy-Item "dist\$cliente-build\browser\index.csr.html" "dist\$cliente-build\browser\index.html" -Force

# VERIFICAR CLIENT_ID
Select-String -Path "dist\$cliente-build\browser\index.html" -Pattern "__CLIENT_ID"

# DEPLOY
cd "dist\$cliente-build\browser"
vercel --prod --scope davids-projects-8fa96e54 --yes

# Copiar URL del deployment: browser-xxxxxxxx...

# ALIAS (reemplazar xxxxxxxx con tu deployment)
vercel alias set browser-xxxxxxxx-davids-projects-8fa96e54.vercel.app $cliente.vercel.app --scope davids-projects-8fa96e54

# VERIFICAR
Start-Process msedge -ArgumentList "-inprivate","https://$cliente.vercel.app"
```

---

## ✅ CONFIRMACIÓN FINAL

Después de completar todas las fases, deberías tener:

1. ✅ **URL pública funcionando:** `https://nuevocliente.vercel.app`
2. ✅ **Branding correcto:** Logo, colores, nombre del cliente
3. ✅ **Base de datos operativa:** 5 tablas en Supabase
4. ✅ **API funcionando:** X-Tenant-Slug correcto
5. ✅ **Routing SPA:** F5 no da 404
6. ✅ **PWA instalable:** (si Deployment Protection desactivada)
7. ✅ **Sin errores en Console:** Logs limpios

**🎉 ¡Cliente implementado exitosamente!**

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Guía completa:** `docs/implementacion-clientes/TEMPLATE_NUEVO_CLIENTE_COMPLETO.md`
- **Lecciones aprendidas:** `docs/implementacion-clientes/LECCIONES_APRENDIDAS_ACTIFISIO.md`
- **Crear tablas SQL:** `docs/implementacion-clientes/CREAR_TABLAS_NUEVO_CLIENTE.md`
- **Troubleshooting caché:** `SOLUCION_CACHE_ACTIFISIO.md`
- **Corrección tenant slug:** `CORRECCION_X_TENANT_SLUG_V2.4.13.md`

---

**Versión:** 3.0.0  
**Última validación:** 4 de octubre de 2025 - Cliente Actifisio ✅  
**Próxima actualización:** Según nuevos bugs/mejoras descubiertas
