# ⚡ CHECKLIST ACTUALIZADO: NUEVO CLIENTE EN 60 MINUTOS

**Versión:** 2.0.0 - ACTUALIZADO CON CORRECCIONES  
**Última actualización:** 4 de octubre de 2025  
**Cambios:** Incluye todas las correcciones de bugs y mejoras implementadas  
**Objetivo:** Implementar cliente nuevo desde 0 hasta producción funcionando al 100%

---

## 🆕 CAMBIOS EN ESTA VERSIÓN 2.0.0

### ✅ Correcciones Críticas Implementadas

1. **Script de Inyección de CLIENT_ID** (NUEVO)
   - Script post-build automático que inyecta `window.__CLIENT_ID`
   - Solución al problema de tenant slug incorrecto

2. **Interceptor Tenant Corregido**
   - Prioriza `window.__CLIENT_ID` sobre hostname
   - Detecta deployments temporales de Vercel
   - No usa URLs de deployment como tenant slug

3. **Template HTML Actualizado**
   - Placeholder `__VITE_CLIENT_ID__` para reemplazo automático
   - Script de inyección simplificado

4. **Routing SPA en Vercel**
   - Configuración correcta para evitar 404 al refrescar

5. **Proceso de Deployment Mejorado**
   - Copia correcta de builds
   - Creación de index.html desde index.csr.html
   - Verificación de CLIENT_ID antes de deploy

---

## 🎯 INFORMACIÓN PREVIA REQUERIDA

Antes de empezar, asegúrate de tener TODA esta información:

```yaml
✅ cliente_id: "actifisio"                    # minúsculas, sin espacios, sin guiones
✅ nombre_completo: "Actifisio"
✅ nombre_corto: "Actifisio"
✅ color_primario: "#ff6b35"                 # Hex con #
✅ color_secundario: "#f7b731"               # Hex con #
✅ color_acento: "#5f27cd"                   # Hex con #
✅ logo_archivo: "actifisio-logo.png"        # 512x512px, PNG
✅ telefono: "+34 XXX XXX XXX"
✅ email: "contacto@actifisio.com"
✅ direccion: "Avenida Principal, 456"
✅ ciudad: "Barcelona"
✅ codigo_postal: "08001"
✅ provincia: "Barcelona"
✅ url_deseada: "actifisio.vercel.app"       # Sin https://
```

---

## 📊 TIMELINE ACTUALIZADO

| Fase | Tarea | Tiempo | Acumulado |
|------|-------|--------|-----------|
| 1 | Preparación de Assets | 5 min | 5 min |
| 2 | Configuración Frontend | 15 min | 20 min |
| 3 | Base de Datos (Supabase) | 15 min | 35 min |
| 4 | Build del Cliente | 15 min | 50 min |
| 5 | Deploy a Vercel | 10 min | 60 min |
| 6 | Testing y Validación | 15 min | 75 min |

**Total:** 60-75 minutos

---

## ✅ FASE 1: PREPARACIÓN DE ASSETS (5 min)

### 1.1 Crear Carpeta y Copiar Logo

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend\src\assets\clients

# Crear carpeta del cliente
mkdir actifisio

# Copiar logo (DEBE ser 512x512px PNG)
Copy-Item "C:\Downloads\actifisio-logo.png" -Destination ".\actifisio\logo.png"

# Verificar tamaño y formato
ls actifisio\logo.png
```

**✅ Checklist:**
- [ ] Logo es PNG
- [ ] Logo es 512x512 píxeles (verificar en propiedades)
- [ ] Logo tiene fondo transparente o blanco
- [ ] Logo se ve bien en fondo blanco y oscuro

---

## ✅ FASE 2: CONFIGURACIÓN FRONTEND (15 min)

### 2.1 Crear Archivo de Configuración del Cliente

**Archivo:** `frontend/src/config/clients/actifisio.config.ts`

```typescript
import { ClientConfig } from '../client-config.interface';

/**
 * Configuración del Cliente: Actifisio
 * Tema: Naranja/Amarillo
 */
export const actifisioConfig: ClientConfig = {
  // Identificador único para el backend (X-Tenant-Slug)
  tenantSlug: 'actifisio',
  
  // Información de la clínica
  info: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    phone: '+34 XXX XXX XXX',
    email: 'contacto@actifisio.com',
    address: 'Avenida Principal, 456',
    city: 'Barcelona',
    postalCode: '08001',
    province: 'Barcelona',
    website: 'https://actifisio.com',
    socialMedia: {
      instagram: 'https://instagram.com/actifisio'
    }
  },
  
  // Tema visual: Naranja y Amarillo
  theme: {
    primary: '#ff6b35',        // Naranja vibrante
    secondary: '#f7b731',      // Amarillo cálido
    accent: '#5f27cd',         // Morado oscuro de acento
    headerGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7b731 100%)',
    buttonColor: '#ff6b35',
    buttonHover: '#e55a2b'
  },
  
  // Rutas de assets
  assets: {
    logo: 'assets/clients/actifisio/logo.png',
    favicon: 'assets/clients/actifisio/logo.png',
    appleTouchIcon: 'assets/clients/actifisio/logo.png'
  },
  
  // Configuración de backend (API compartida)
  backend: {
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'
  },
  
  // Configuración de PWA
  pwa: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    description: 'Gestión de clínica - Actifisio',
    themeColor: '#ff6b35',
    backgroundColor: '#ffffff'
  },
  
  // Features habilitadas
  features: {
    appointments: true,
    patients: true,
    credits: true,
    backup: true,
    analytics: true
  }
};
```

**✅ Checklist:**
- [ ] Archivo creado en `frontend/src/config/clients/[cliente].config.ts`
- [ ] `tenantSlug` coincide con `cliente_id` (minúsculas, sin espacios)
- [ ] Colores son códigos hex válidos (#xxxxxx)
- [ ] Logo path apunta a carpeta correcta

---

### 2.2 Registrar Cliente en Config Loader

**Archivo:** `frontend/src/config/config.loader.ts`

```typescript
// ... imports existentes ...
import { actifisioConfig } from './clients/actifisio.config';

const clientConfigs: Record<string, ClientConfig> = {
  masajecorporaldeportivo: masajecorporalDeportivoConfig,
  actifisio: actifisioConfig,  // ← AGREGAR ESTA LÍNEA
};
```

**✅ Checklist:**
- [ ] Import agregado al inicio del archivo
- [ ] Cliente registrado en `clientConfigs`
- [ ] Key coincide exactamente con `tenantSlug`

---

### 2.3 Verificar Scripts de Package.json

**Archivo:** `frontend/package.json`

Asegúrate de que existen estos scripts:

```json
{
  "scripts": {
    "prebuild": "npm run generate:manifest",
    "build": "ng build",
    "postbuild": "node scripts/inject-client-id-postbuild.js",
    "generate:manifest": "node scripts/generate-manifest.js",
    "build:masajecorporal": "cross-env VITE_CLIENT_ID=masajecorporaldeportivo npm run build",
    "build:actifisio": "cross-env VITE_CLIENT_ID=actifisio npm run build"
  }
}
```

**✅ Checklist:**
- [ ] Script `postbuild` existe (inyección de CLIENT_ID)
- [ ] Script `prebuild` existe (generación de manifest)
- [ ] Script `build:actifisio` agregado

**⚠️ IMPORTANTE:** Si `cross-env` no está instalado:
```powershell
cd frontend
npm install --save-dev cross-env
```

---

### 2.4 Verificar Script de Inyección CLIENT_ID

**Archivo:** `frontend/scripts/inject-client-id-postbuild.js`

Este archivo DEBE existir (creado en correcciones anteriores):

```javascript
/**
 * Script post-build para inyectar CLIENT_ID en index.html y index.csr.html
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientId = process.env.VITE_CLIENT_ID || 'masajecorporaldeportivo';
const distPath = join(__dirname, '..', 'dist', 'clinic-frontend', 'browser');

console.log('\n🔧 ============================================');
console.log('   Post-Build: Inyección de CLIENT_ID');
console.log('============================================\n');
console.log(`📌 CLIENT_ID: ${clientId}`);
console.log(`📁 Dist path: ${distPath}\n`);

// Archivos a procesar
const files = ['index.html', 'index.csr.html'];

files.forEach(fileName => {
  const filePath = join(distPath, fileName);
  
  if (!existsSync(filePath)) {
    console.log(`⚠️  Archivo no encontrado: ${fileName}`);
    return;
  }
  
  try {
    // Leer archivo
    let content = readFileSync(filePath, 'utf8');
    
    // Reemplazar placeholder
    const originalContent = content;
    content = content.replace(/__VITE_CLIENT_ID__/g, clientId);
    
    // Verificar que se hizo el reemplazo
    if (content === originalContent) {
      console.log(`⚠️  ${fileName}: No se encontró el placeholder __VITE_CLIENT_ID__`);
    } else {
      // Guardar archivo modificado
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${fileName}: CLIENT_ID inyectado correctamente`);
      
      // Verificar que el reemplazo fue exitoso
      const verification = readFileSync(filePath, 'utf8');
      if (verification.includes(`window.__CLIENT_ID = '${clientId}'`)) {
        console.log(`   ✓ Verificado: window.__CLIENT_ID = '${clientId}'`);
      } else {
        console.log(`   ⚠️  Advertencia: No se pudo verificar la inyección`);
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando ${fileName}:`, error.message);
  }
});

console.log('\n🎉 Inyección completada\n');
```

**✅ Checklist:**
- [ ] Archivo existe en `frontend/scripts/inject-client-id-postbuild.js`
- [ ] Tiene permisos de ejecución
- [ ] Usa ES modules (import/export)

---

### 2.5 Verificar Template HTML con Placeholder

**Archivo:** `frontend/src/index.html`

Verifica que el `<head>` contiene el script de inyección:

```html
<head>
  <!-- ... otros meta tags ... -->
  
  <!-- =============================================
       INYECCIÓN DE CLIENT_ID PARA MULTI-TENANT
       Este script debe estar ANTES del cierre de </head>
       ============================================= -->
  <script>
    // Inyectar CLIENT_ID desde variable de entorno de build
    // El placeholder __VITE_CLIENT_ID__ se reemplaza en postbuild
    // Por defecto: 'masajecorporaldeportivo'
    // Para Actifisio: buildear con VITE_CLIENT_ID=actifisio
    window.__CLIENT_ID = '__VITE_CLIENT_ID__';
    console.log('[index.html] CLIENT_ID inyectado:', window.__CLIENT_ID);
  </script>
</head>
```

**✅ Checklist:**
- [ ] Script existe en `src/index.html`
- [ ] Contiene placeholder `__VITE_CLIENT_ID__`
- [ ] Script está ANTES del cierre `</head>`

---

### 2.6 Verificar Interceptor de Tenant

**Archivo:** `frontend/src/app/interceptors/tenant.interceptor.ts`

Verifica que el interceptor prioriza `window.__CLIENT_ID`:

```typescript
function getTenantSlug(): string {
  // 1. PRIORIDAD MÁXIMA: Usar window.__CLIENT_ID inyectado en el HTML
  // Este valor se inyecta en tiempo de build para cada cliente
  const injectedClientId = (window as any).__CLIENT_ID;
  if (injectedClientId && typeof injectedClientId === 'string') {
    return injectedClientId;
  }

  // 2. Intentar desde variable de entorno de Vite (desarrollo)
  const envClientId = getClientIdFromEnv();
  if (envClientId && envClientId !== 'masajecorporaldeportivo') {
    return envClientId;
  }

  // 3. Intentar desde hostname de la URL actual
  const hostname = window.location.hostname;
  
  if (hostname.includes('.vercel.app')) {
    const parts = hostname.split('.');
    const firstPart = parts[0];
    
    // Si es un deployment temporal de Vercel (browser-xyz, clinic-frontend-xyz),
    // NO usar como tenant slug, usar el inyectado
    if (firstPart.startsWith('clinic-frontend') || 
        firstPart.startsWith('browser') || 
        firstPart.includes('-') && firstPart.split('-').length > 2) {
      // Es un deployment temporal, usar variable de entorno
      return getClientIdFromEnv();
    }
    
    // Si es un dominio personalizado, usar la primera parte como slug
    return firstPart;
  }
  
  // 4. Para localhost, usar VITE_CLIENT_ID
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return getClientIdFromEnv();
  }
  
  // 5. Último fallback
  return getClientIdFromEnv();
}
```

**✅ Checklist:**
- [ ] Interceptor prioriza `window.__CLIENT_ID` (línea ~40)
- [ ] Detecta deployments temporales de Vercel
- [ ] No usa URLs de deployment como tenant slug

---

## ✅ FASE 3: BASE DE DATOS SUPABASE (15 min)

### 3.1 Crear Tablas del Nuevo Cliente

**Ejecutar en Supabase SQL Editor:**

```sql
-- =============================================
-- CREAR TABLAS PARA CLIENTE: actifisio
-- =============================================

-- 1. Tabla de Pacientes
CREATE TABLE IF NOT EXISTS patients_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni VARCHAR(20) UNIQUE NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    cp VARCHAR(10),
    city VARCHAR(100),
    province VARCHAR(100),
    "birthDate" TIMESTAMP,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    family_contact VARCHAR(200),
    "fechaRegistro" TIMESTAMP
);

-- 2. Tabla de Citas
CREATE TABLE IF NOT EXISTS appointments_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL REFERENCES patients_actifisio(id) ON DELETE CASCADE,
    start TIMESTAMP WITH TIME ZONE NOT NULL,
    "end" TIMESTAMP WITH TIME ZONE NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER,
    status VARCHAR(20) DEFAULT 'BOOKED',
    notes TEXT,
    "consumesCredit" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 3. Tabla de Paquetes de Créditos
CREATE TABLE IF NOT EXISTS credit_packs_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL REFERENCES patients_actifisio(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    "unitsTotal" INTEGER NOT NULL,
    "unitMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER DEFAULT 0,
    "unitsRemaining" INTEGER NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 4. Tabla de Redenciones de Créditos
CREATE TABLE IF NOT EXISTS credit_redemptions_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "creditPackId" UUID NOT NULL REFERENCES credit_packs_actifisio(id) ON DELETE CASCADE,
    "appointmentId" UUID NOT NULL REFERENCES appointments_actifisio(id) ON DELETE CASCADE,
    "unitsUsed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 5. Tabla de Archivos
CREATE TABLE IF NOT EXISTS files_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" UUID NOT NULL REFERENCES patients_actifisio(id) ON DELETE CASCADE,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(50) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    notes TEXT,
    "uploadedAt" TIMESTAMP DEFAULT NOW()
);

-- 6. Tabla de Configuración
CREATE TABLE IF NOT EXISTS configuration_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 7. Tabla de Respaldos
CREATE TABLE IF NOT EXISTS backups_actifisio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

CREATE INDEX IF NOT EXISTS idx_patients_actifisio_dni ON patients_actifisio(dni);
CREATE INDEX IF NOT EXISTS idx_appointments_actifisio_patient ON appointments_actifisio("patientId");
CREATE INDEX IF NOT EXISTS idx_appointments_actifisio_start ON appointments_actifisio(start);
CREATE INDEX IF NOT EXISTS idx_credit_packs_actifisio_patient ON credit_packs_actifisio("patientId");
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_actifisio_pack ON credit_redemptions_actifisio("creditPackId");
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_actifisio_appointment ON credit_redemptions_actifisio("appointmentId");
CREATE INDEX IF NOT EXISTS idx_files_actifisio_patient ON files_actifisio("patientId");
```

**✅ Checklist:**
- [ ] 7 tablas creadas con sufijo `_actifisio`
- [ ] Todas las foreign keys creadas
- [ ] Índices creados para optimización
- [ ] Sin errores en SQL Editor

---

### 3.2 Configurar RLS (Row Level Security)

```sql
-- =============================================
-- RLS PARA ACTIFISIO
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE patients_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE files_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups_actifisio ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas para service_role (backend)
CREATE POLICY "Allow all for service role" ON patients_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON appointments_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON credit_packs_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON credit_redemptions_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON files_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON configuration_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON backups_actifisio FOR ALL USING (true);
```

**✅ Checklist:**
- [ ] RLS habilitado en las 7 tablas
- [ ] Políticas creadas correctamente
- [ ] Sin errores en SQL Editor

---

### 3.3 Insertar Datos de Prueba (Opcional)

```sql
-- Insertar un paciente de prueba
INSERT INTO patients_actifisio (dni, "firstName", "lastName", phone, email, city)
VALUES ('12345678Z', 'Juan', 'Pérez', '666555444', 'juan@example.com', 'Barcelona');

-- Verificar
SELECT * FROM patients_actifisio;
```

**✅ Checklist:**
- [ ] Paciente de prueba insertado
- [ ] SELECT retorna el paciente

---

## ✅ FASE 4: BUILD DEL CLIENTE (15 min)

### 4.1 Limpiar Builds Anteriores

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend

# Limpiar dist completo
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Limpiar node_modules/.cache (opcional pero recomendado)
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
```

---

### 4.2 Buildear Cliente con Inyección Automática

```powershell
# Setear variable de entorno
$env:VITE_CLIENT_ID="actifisio"

# Build con scripts automáticos
npm run build
```

**Verifica en la salida:**
```
✅ Usando cliente desde VITE_CLIENT_ID: actifisio
✅ Logo verificado: assets/clients/actifisio/logo.png
✅ Manifest generado exitosamente

🔧 Post-Build: Inyección de CLIENT_ID
📌 CLIENT_ID: actifisio
✅ index.csr.html: CLIENT_ID inyectado correctamente
   ✓ Verificado: window.__CLIENT_ID = 'actifisio'
```

**✅ Checklist:**
- [ ] Build completa sin errores
- [ ] Manifest generado para actifisio
- [ ] CLIENT_ID inyectado en index.csr.html
- [ ] Verificación exitosa

---

### 4.3 Copiar Build a Carpeta de Deployment

```powershell
# Eliminar build anterior si existe
Remove-Item -Path "dist\actifisio-build" -Recurse -Force -ErrorAction SilentlyContinue

# Copiar build de clinic-frontend a actifisio-build
Copy-Item -Path "dist\clinic-frontend" -Destination "dist\actifisio-build" -Recurse

# Crear index.html desde index.csr.html
Copy-Item -Path "dist\actifisio-build\browser\index.csr.html" -Destination "dist\actifisio-build\browser\index.html" -Force

Write-Host "✅ Build copiado y index.html creado" -ForegroundColor Green
```

**✅ Checklist:**
- [ ] Carpeta `dist\actifisio-build` creada
- [ ] Archivos copiados (browser/, server/, etc.)
- [ ] `index.html` existe en `dist\actifisio-build\browser\`

---

### 4.4 Verificar CLIENT_ID en HTML Generado

```powershell
# Buscar CLIENT_ID en index.html
Select-String -Path "dist\actifisio-build\browser\index.html" -Pattern "window.__CLIENT_ID = 'actifisio'" -Context 1
```

**Resultado esperado:**
```
  <script>
>   window.__CLIENT_ID = 'actifisio';
    console.log('[index.html] CLIENT_ID inyectado:', window.__CLIENT_ID);
```

**✅ Checklist:**
- [ ] `window.__CLIENT_ID = 'actifisio'` presente en HTML
- [ ] NO dice `'masajecorporaldeportivo'`
- [ ] NO dice `'__VITE_CLIENT_ID__'` (placeholder debe estar reemplazado)

---

### 4.5 Crear/Verificar vercel.json

**Archivo:** `dist\actifisio-build\browser\vercel.json`

```json
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

**Crear si no existe:**
```powershell
@'
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
'@ | Out-File -FilePath "dist\actifisio-build\browser\vercel.json" -Encoding utf8 -NoNewline
```

**✅ Checklist:**
- [ ] `vercel.json` existe en `dist\actifisio-build\browser\`
- [ ] Routing SPA configurado correctamente
- [ ] JSON válido (sin errores de sintaxis)

---

## ✅ FASE 5: DEPLOY A VERCEL (10 min)

### 5.1 Deploy a Producción

```powershell
cd dist\actifisio-build\browser

# Deploy con Vercel CLI
vercel --prod --scope davids-projects-8fa96e54 --yes
```

**Resultado esperado:**
```
🔗  Linked to davids-projects-8fa96e54/browser
🔍  Inspect: https://vercel.com/.../[ID]
✅  Production: https://browser-[HASH]-davids-projects-8fa96e54.vercel.app
```

**Copiar la URL del deployment** (ejemplo: `browser-abc123xyz-...`)

**✅ Checklist:**
- [ ] Deployment exitoso (✅ Production)
- [ ] URL de deployment copiada

---

### 5.2 Configurar Alias Personalizado

```powershell
# Reemplazar [DEPLOYMENT_URL] con la URL que copiaste
vercel alias set [DEPLOYMENT_URL] actifisio.vercel.app --scope davids-projects-8fa96e54
```

**Ejemplo:**
```powershell
vercel alias set browser-abc123xyz-davids-projects-8fa96e54.vercel.app actifisio.vercel.app --scope davids-projects-8fa96e54
```

**Resultado esperado:**
```
✅ Success! https://actifisio.vercel.app now points to https://browser-abc123xyz-...
```

**✅ Checklist:**
- [ ] Alias configurado exitosamente
- [ ] URL accesible: `https://actifisio.vercel.app`

---

### 5.3 Esperar Propagación (1-2 minutos)

```powershell
# Esperar 2 minutos para propagación CDN
Start-Sleep -Seconds 120

Write-Host "✅ Esperando propagación CDN completa..." -ForegroundColor Yellow
```

---

## ✅ FASE 6: TESTING Y VALIDACIÓN (15 min)

### 6.1 Verificar CLIENT_ID Remoto

```powershell
# Verificar que CLIENT_ID está inyectado correctamente
$html = (Invoke-WebRequest -Uri "https://actifisio.vercel.app" -UseBasicParsing).Content

if ($html -match "window.__CLIENT_ID = 'actifisio'") {
    Write-Host "✅ CLIENT_ID CORRECTO: actifisio" -ForegroundColor Green
} else {
    Write-Host "❌ CLIENT_ID INCORRECTO" -ForegroundColor Red
    $html | Select-String -Pattern "CLIENT_ID" -Context 1
}
```

**✅ Checklist:**
- [ ] Mensaje: "✅ CLIENT_ID CORRECTO: actifisio"

---

### 6.2 Abrir en Navegador (Modo Incógnito)

```powershell
# Abrir en modo incógnito para evitar caché
Start-Process msedge -ArgumentList "-inprivate","https://actifisio.vercel.app"
```

**Verificar visualmente:**
- [ ] Colores: Naranja/Amarillo (NO azul/púrpura)
- [ ] Logo: Actifisio (NO Masaje Corporal)
- [ ] Título de pestaña: "Actifisio" o similar

---

### 6.3 Verificar Consola del Navegador

**Presiona F12 → Console**

**Deberías ver:**
```javascript
[index.html] CLIENT_ID inyectado: actifisio
✅ Configuración cargada para cliente: actifisio
🏢 ClientConfigService inicializado
   Cliente: Actifisio
   Tenant Slug: actifisio
   Tema primario: #ff6b35
🎨 Tema aplicado: Object
🖼️ Favicon actualizado: assets/clients/actifisio/logo.png
```

**✅ Checklist:**
- [ ] `CLIENT_ID inyectado: actifisio` ✓
- [ ] `Cliente: Actifisio` ✓
- [ ] `Tema primario: #ff6b35` ✓ (naranja)
- [ ] NO dice "masajecorporaldeportivo"

---

### 6.4 Verificar Headers HTTP (Network Tab)

**F12 → Network → Filtrar por `/api/`**

Selecciona cualquier petición a la API (ej: `/api/patients`)

**En Headers, buscar:**
```
Request Headers:
  X-Tenant-Slug: actifisio
```

**✅ Checklist:**
- [ ] Header `X-Tenant-Slug: actifisio` presente
- [ ] NO dice otro cliente

---

### 6.5 Probar Funcionalidades Básicas

1. **Dashboard:**
   - [ ] Carga sin errores
   - [ ] Muestra datos (si hay pacientes de prueba)

2. **Agenda:**
   - [ ] Calendario se muestra
   - [ ] Colores naranja/amarillo visibles
   - [ ] Botones tienen color correcto

3. **Pacientes:**
   - [ ] Lista carga (vacía o con datos de prueba)
   - [ ] Puede crear paciente nuevo

4. **Navegación:**
   - [ ] Ir a `/inicio` y presionar F5 → NO da 404
   - [ ] Ir a `/pacientes` y presionar F5 → NO da 404
   - [ ] Ir a `/agenda` y presionar F5 → NO da 404

**✅ Checklist:**
- [ ] Dashboard funciona
- [ ] Agenda funciona
- [ ] Pacientes funciona
- [ ] Routing SPA funciona (F5 no da 404)

---

### 6.6 Probar PWA en Móvil (Opcional)

**En Android/iOS:**

1. Abrir `https://actifisio.vercel.app` en Chrome/Safari
2. Buscar opción "Agregar a pantalla de inicio"
3. Instalar PWA
4. Verificar:
   - [ ] Ícono usa logo de Actifisio
   - [ ] Colores de splash screen correctos
   - [ ] App funciona standalone

---

## ✅ CHECKLIST FINAL DE VERIFICACIÓN

### Frontend

- [ ] ✅ Configuración creada en `config/clients/actifisio.config.ts`
- [ ] ✅ Cliente registrado en `config.loader.ts`
- [ ] ✅ Logo copiado a `assets/clients/actifisio/logo.png`
- [ ] ✅ Script de inyección existe: `scripts/inject-client-id-postbuild.js`
- [ ] ✅ Template HTML tiene placeholder: `__VITE_CLIENT_ID__`
- [ ] ✅ Interceptor prioriza `window.__CLIENT_ID`
- [ ] ✅ Build exitoso con CLIENT_ID inyectado
- [ ] ✅ `vercel.json` configurado para SPA

### Base de Datos

- [ ] ✅ 7 tablas creadas con sufijo `_actifisio`
- [ ] ✅ Foreign keys configuradas
- [ ] ✅ Índices creados
- [ ] ✅ RLS habilitado y políticas creadas
- [ ] ✅ Datos de prueba insertados (opcional)

### Deployment

- [ ] ✅ Deployment a Vercel exitoso
- [ ] ✅ Alias configurado: `actifisio.vercel.app`
- [ ] ✅ CLIENT_ID correcto en HTML remoto
- [ ] ✅ Colores naranja/amarillo visibles
- [ ] ✅ Logo de Actifisio mostrado
- [ ] ✅ Headers `X-Tenant-Slug: actifisio` correctos
- [ ] ✅ Routing SPA funciona (F5 no da 404)

### Funcionalidad

- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Agenda funciona
- [ ] ✅ Pacientes funciona
- [ ] ✅ API responde con datos correctos
- [ ] ✅ Temas dinámicos aplicados
- [ ] ✅ PWA instalable (opcional)

---

## 🐛 TROUBLESHOOTING

### Problema: CLIENT_ID inyectado incorrectamente

**Síntoma:**
```javascript
window.__CLIENT_ID = 'masajecorporaldeportivo'  // ← Incorrecto
```

**Solución:**
1. Verificar variable de entorno antes de build:
   ```powershell
   $env:VITE_CLIENT_ID="actifisio"
   ```
2. Rebuild completo:
   ```powershell
   Remove-Item -Path "dist" -Recurse -Force
   npm run build
   ```
3. Verificar en HTML generado antes de deploy

---

### Problema: Navegador muestra cliente antiguo

**Síntoma:** Colores azules en lugar de naranja

**Solución:**
1. **Limpiar caché del navegador:**
   - `Ctrl + Shift + Delete`
   - Seleccionar "Desde siempre"
   - Borrar cookies, caché y datos de aplicaciones
   - Cerrar TODAS las ventanas del navegador
   - Reabrir y probar

2. **O usar modo incógnito:**
   ```powershell
   Start-Process msedge -ArgumentList "-inprivate","https://actifisio.vercel.app"
   ```

---

### Problema: 404 al refrescar (F5)

**Síntoma:** `GET /inicio 404 (Not Found)`

**Solución:**
1. Verificar que `vercel.json` existe en `dist/actifisio-build/browser/`
2. Verificar contenido del archivo (routing SPA)
3. Redesplegar:
   ```powershell
   cd dist\actifisio-build\browser
   vercel --prod --scope davids-projects-8fa96e54 --yes
   ```

---

### Problema: X-Tenant-Slug incorrecto

**Síntoma:**
```
[TenantInterceptor] Agregando header X-Tenant-Slug: browser-abc123xyz
```

**Solución:**
1. Verificar que el interceptor está actualizado (prioriza `window.__CLIENT_ID`)
2. Verificar que CLIENT_ID está en el HTML:
   ```powershell
   Select-String -Path "dist\actifisio-build\browser\index.html" -Pattern "CLIENT_ID"
   ```
3. Rebuild y redeploy

---

### Problema: API da 404 o 500

**Síntoma:**
```
Failed to load resource: the server responded with a status of 404 ()
```

**Solución:**
1. Verificar que las tablas existen en Supabase:
   ```sql
   SELECT * FROM patients_actifisio LIMIT 1;
   ```
2. Verificar que el backend está desplegado
3. Verificar que RLS está configurado correctamente

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

### Archivos Clave Creados/Modificados

1. **`frontend/src/config/clients/actifisio.config.ts`** - Configuración del cliente
2. **`frontend/src/config/config.loader.ts`** - Registro del cliente
3. **`frontend/src/assets/clients/actifisio/logo.png`** - Logo del cliente
4. **`frontend/scripts/inject-client-id-postbuild.js`** - Script de inyección (NUEVO)
5. **`frontend/src/index.html`** - Template con placeholder (MODIFICADO)
6. **`frontend/src/app/interceptors/tenant.interceptor.ts`** - Interceptor corregido (MODIFICADO)
7. **`frontend/package.json`** - Scripts de build (MODIFICADO)
8. **Supabase:** 7 tablas con sufijo `_actifisio`

### Documentos Relacionados

- **TEMPLATE_NUEVO_CLIENTE_COMPLETO.md** - Guía exhaustiva detallada
- **LECCIONES_APRENDIDAS_ACTIFISIO.md** - Bugs y soluciones del primer cliente
- **CORRECCION_X_TENANT_SLUG_V2.4.13.md** - Corrección del tenant slug
- **SOLUCION_CACHE_ACTIFISIO.md** - Solución de problemas de caché

---

## 🎉 ¡COMPLETADO!

Si llegaste aquí y todos los checks están ✅, tu nuevo cliente **Actifisio** está:

- ✅ Configurado completamente en el frontend
- ✅ Con base de datos propia en Supabase
- ✅ Desplegado en producción en Vercel
- ✅ Funcionando al 100% con CLIENT_ID correcto
- ✅ Con colores y branding personalizados
- ✅ Listo para usar en producción

**Tiempo total invertido:** ~60-75 minutos

**URL final:** https://actifisio.vercel.app

---

**Última actualización:** 4 de octubre de 2025  
**Versión:** 2.0.0  
**Cambios:** Incluye todas las correcciones críticas implementadas durante el deployment de Actifisio
