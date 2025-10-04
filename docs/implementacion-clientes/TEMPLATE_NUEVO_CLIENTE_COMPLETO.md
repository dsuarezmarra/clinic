# 🎯 TEMPLATE MAESTRO: NUEVO CLIENTE - GUÍA COMPLETA

**Versión:** 3.0.0 - Octubre 2025  
**Autor:** Sistema Multi-Cliente MCD/Actifisio  
**Tiempo Estimado:** 45-60 minutos  
**Prerequisitos:** Acceso a Supabase, Vercel CLI instalado, Git configurado

---

## 📋 INFORMACIÓN REQUERIDA DEL CLIENTE

Antes de empezar, recopilar TODA esta información del cliente:

### ✅ Checklist de Información

```yaml
cliente:
  # Identificador único (minúsculas, sin espacios, sin tildes)
  # Ejemplo: "actifisio", "fisioterapiacenter", "clinicasalud"
  id: "[RELLENAR]"
  
  # Información de la clínica
  nombre_completo: "[RELLENAR]"  # Ej: "Actifisio Centro de Fisioterapia"
  nombre_corto: "[RELLENAR]"      # Ej: "Actifisio"
  
  # Contacto
  telefono: "[RELLENAR]"          # Ej: "+34 XXX XXX XXX"
  email: "[RELLENAR]"             # Ej: "contacto@actifisio.com"
  direccion: "[RELLENAR]"         # Ej: "Avenida Principal, 456"
  ciudad: "[RELLENAR]"            # Ej: "Barcelona"
  codigo_postal: "[RELLENAR]"    # Ej: "08001"
  provincia: "[RELLENAR]"         # Ej: "Barcelona"
  
  # Web y redes sociales
  website: "[RELLENAR]"           # Ej: "https://actifisio.com"
  instagram: "[RELLENAR]"         # Ej: "https://instagram.com/actifisio"
  facebook: "[RELLENAR - OPCIONAL]"
  
  # Paleta de colores (códigos hexadecimales)
  colores:
    primario: "[RELLENAR]"        # Ej: "#ff6b35" (color principal de botones, header)
    secundario: "[RELLENAR]"      # Ej: "#f7b731" (color secundario, acentos)
    acento: "[RELLENAR]"          # Ej: "#5f27cd" (color de acento, opcional)
  
  # Logo (512x512px mínimo, PNG con fondo transparente)
  logo_archivo: "[RELLENAR]"      # Ej: "actifisio-logo.png"
  logo_ruta_temporal: "[RELLENAR]" # Ej: "C:\Users\Desktop\actifisio-logo.png"
  
  # URLs de deployment
  url_deseada: "[RELLENAR]"       # Ej: "actifisio.vercel.app"
```

---

## 🚀 PROCESO COMPLETO - PASO A PASO

### FASE 1: PREPARACIÓN DE ASSETS (5 min)

#### 1.1 Validar Logo del Cliente

```powershell
# Verificar dimensiones del logo (debe ser 512x512px mínimo)
# Puede usar herramientas online: tinypng.com, squoosh.app

# El logo debe ser:
# - Formato: PNG
# - Tamaño: 512x512px (ideal) o superior
# - Fondo: Transparente (recomendado)
# - Peso: < 200KB (optimizado)
```

#### 1.2 Crear Estructura de Carpetas

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend\src\assets\clients

# Crear carpeta del nuevo cliente
mkdir [CLIENTE_ID]
# Ejemplo: mkdir actifisio

# Copiar logo
Copy-Item "[RUTA_LOGO]" -Destination ".\[CLIENTE_ID]\logo.png"
# Ejemplo: Copy-Item "C:\Users\Desktop\actifisio-logo.png" -Destination ".\actifisio\logo.png"
```

✅ **Verificar:** Debe existir `frontend/src/assets/clients/[CLIENTE_ID]/logo.png`

---

### FASE 2: CONFIGURACIÓN FRONTEND (15 min)

#### 2.1 Crear Archivo de Configuración del Cliente

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend\src\config\clients

# Crear archivo [clienteId].config.ts
New-Item -Name "[CLIENTE_ID].config.ts" -ItemType File
```

**Contenido del archivo `[CLIENTE_ID].config.ts`:**

```typescript
import { ClientConfig } from '../client-config.interface';

/**
 * Configuración del Cliente: [NOMBRE_COMPLETO]
 * Tema: [DESCRIPCIÓN_COLORES] (Ej: Naranja/Amarillo, Azul/Verde)
 */
export const [CLIENTE_ID]Config: ClientConfig = {
  // Identificador único para el backend (X-Tenant-Slug)
  tenantSlug: '[CLIENTE_ID]',
  
  // Información de la clínica
  info: {
    name: '[NOMBRE_COMPLETO]',
    shortName: '[NOMBRE_CORTO]',
    phone: '[TELEFONO]',
    email: '[EMAIL]',
    address: '[DIRECCION]',
    city: '[CIUDAD]',
    postalCode: '[CODIGO_POSTAL]',
    province: '[PROVINCIA]',
    website: '[WEBSITE]',
    socialMedia: {
      instagram: '[INSTAGRAM]',
      // facebook: '[FACEBOOK]'  // Opcional
    }
  },
  
  // Tema visual
  theme: {
    primary: '[COLOR_PRIMARIO]',        // Ej: '#ff6b35'
    secondary: '[COLOR_SECUNDARIO]',    // Ej: '#f7b731'
    accent: '[COLOR_ACENTO]',           // Ej: '#5f27cd'
    headerGradient: 'linear-gradient(135deg, [COLOR_PRIMARIO] 0%, [COLOR_SECUNDARIO] 100%)',
    buttonColor: '[COLOR_PRIMARIO]',
    buttonHover: '[COLOR_PRIMARIO_OSCURO]'  // Usar herramienta: https://maketintsandshades.com/
  },
  
  // Rutas de assets
  assets: {
    logo: 'assets/clients/[CLIENTE_ID]/logo.png',
    favicon: 'assets/clients/[CLIENTE_ID]/logo.png',
    appleTouchIcon: 'assets/clients/[CLIENTE_ID]/logo.png'
  },
  
  // Configuración de backend (API compartida)
  backend: {
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'  // Producción (compartido por todos)
  },
  
  // Configuración de PWA
  pwa: {
    name: '[NOMBRE_COMPLETO]',
    shortName: '[NOMBRE_CORTO]',
    description: 'Sistema de gestión para [TIPO_CENTRO] [NOMBRE_CORTO]',
    themeColor: '[COLOR_PRIMARIO]',
    backgroundColor: '#ffffff'
  }
};
```

**Ejemplo Real (Actifisio):**

```typescript
import { ClientConfig } from '../client-config.interface';

export const actifisioConfig: ClientConfig = {
  tenantSlug: 'actifisio',
  
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
  
  theme: {
    primary: '#ff6b35',
    secondary: '#f7b731',
    accent: '#5f27cd',
    headerGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7b731 100%)',
    buttonColor: '#ff6b35',
    buttonHover: '#e55a2b'
  },
  
  assets: {
    logo: 'assets/clients/actifisio/logo.png',
    favicon: 'assets/clients/actifisio/logo.png',
    appleTouchIcon: 'assets/clients/actifisio/logo.png'
  },
  
  backend: {
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'
  },
  
  pwa: {
    name: 'Actifisio',
    shortName: 'Actifisio',
    description: 'Sistema de gestión para centro de fisioterapia Actifisio',
    themeColor: '#ff6b35',
    backgroundColor: '#ffffff'
  }
};
```

#### 2.2 Registrar Cliente en Config Loader

**Archivo:** `frontend/src/config/config.loader.ts`

```typescript
// 1. Agregar import al inicio
import { [CLIENTE_ID]Config } from './clients/[CLIENTE_ID].config';

// Ejemplo:
// import { actifisioConfig } from './clients/actifisio.config';

// 2. Agregar al objeto CLIENT_CONFIGS
const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  'masajecorporaldeportivo': masajecorporaldeportivoConfig,
  'actifisio': actifisioConfig,
  '[CLIENTE_ID]': [CLIENTE_ID]Config,  // ← AGREGAR ESTA LÍNEA
};
```

#### 2.3 Agregar Scripts de Build en package.json

**Archivo:** `frontend/package.json`

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve",
  "build": "ng build",
  "build:masajecorporal": "cross-env VITE_CLIENT_ID=masajecorporaldeportivo npm run build",
  "build:actifisio": "cross-env VITE_CLIENT_ID=actifisio npm run build",
  "build:[CLIENTE_ID]": "cross-env VITE_CLIENT_ID=[CLIENTE_ID] npm run build"
}
```

✅ **Verificar:** Compilación sin errores

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend
npm run build:[CLIENTE_ID]
```

---

### FASE 3: BASE DE DATOS - SUPABASE (15 min)

#### 3.1 Crear Tablas para el Nuevo Cliente

**Acceder a Supabase SQL Editor:**

1. Abrir https://app.supabase.com
2. Seleccionar proyecto
3. Ir a **SQL Editor** (icono `</>`)
4. Crear **New Query**

**Ejecutar este script SQL (reemplazar `[CLIENTE_ID]`):**

```sql
-- ============================================================
-- SCRIPT: CREAR TABLAS PARA CLIENTE [CLIENTE_ID]
-- Fecha: [FECHA_ACTUAL]
-- ============================================================

-- 1. TABLA: patients_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.patients_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    email text,
    birth_date date,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. TABLA: appointments_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.appointments_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES public.patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    notes text,
    status text DEFAULT 'scheduled',
    price_cents integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. TABLA: credit_packs_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.credit_packs_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES public.patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    total_credits integer NOT NULL,
    used_credits integer DEFAULT 0,
    remaining_credits integer GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    price_cents integer NOT NULL,
    paid boolean DEFAULT false,
    purchase_date timestamp with time zone DEFAULT now(),
    expiration_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. TABLA: credit_redemptions_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.credit_redemptions_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_pack_id uuid NOT NULL REFERENCES public.credit_packs_[CLIENTE_ID](id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES public.appointments_[CLIENTE_ID](id) ON DELETE SET NULL,
    credits_used integer NOT NULL DEFAULT 1,
    redeemed_at timestamp with time zone DEFAULT now()
);

-- 5. TABLA: patient_files_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.patient_files_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES public.patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    description text,
    uploaded_at timestamp with time zone DEFAULT now()
);

-- 6. TABLA: configurations_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.configurations_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_name text,
    clinic_address text,
    clinic_phone text,
    clinic_email text,
    default_duration integer DEFAULT 30,
    working_hours jsonb,
    prices jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. TABLA: backups_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.backups_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    created_at timestamp with time zone DEFAULT now(),
    backup_type text DEFAULT 'manual'
);

-- 8. TABLA: invoices_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.invoices_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES public.patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    invoice_number text NOT NULL UNIQUE,
    issue_date date NOT NULL,
    due_date date,
    subtotal_cents integer NOT NULL,
    tax_cents integer DEFAULT 0,
    total_cents integer NOT NULL,
    status text DEFAULT 'pending',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9. TABLA: invoice_items_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.invoice_items_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES public.invoices_[CLIENTE_ID](id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES public.appointments_[CLIENTE_ID](id) ON DELETE SET NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price_cents integer NOT NULL,
    total_cents integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_appointments_[CLIENTE_ID]_patient_id ON public.appointments_[CLIENTE_ID](patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_[CLIENTE_ID]_start_time ON public.appointments_[CLIENTE_ID](start_time);
CREATE INDEX IF NOT EXISTS idx_credit_packs_[CLIENTE_ID]_patient_id ON public.credit_packs_[CLIENTE_ID](patient_id);
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_[CLIENTE_ID]_pack_id ON public.credit_redemptions_[CLIENTE_ID](credit_pack_id);
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_[CLIENTE_ID]_appointment_id ON public.credit_redemptions_[CLIENTE_ID](appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_[CLIENTE_ID]_patient_id ON public.patient_files_[CLIENTE_ID](patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_[CLIENTE_ID]_patient_id ON public.invoices_[CLIENTE_ID](patient_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_[CLIENTE_ID]_invoice_id ON public.invoice_items_[CLIENTE_ID](invoice_id);

-- ============================================================
-- REGISTRAR TENANT EN TABLA COMPARTIDA
-- ============================================================

INSERT INTO public.tenants (slug, name, created_at)
VALUES ('[CLIENTE_ID]', '[NOMBRE_COMPLETO]', now())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - DESACTIVADO
-- ============================================================
-- Por ahora, RLS está desactivado para todas las tablas
-- El aislamiento se maneja por X-Tenant-Slug en el backend

ALTER TABLE public.patients_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurations_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- CONFIGURACIÓN INICIAL
-- ============================================================

-- Insertar configuración por defecto
INSERT INTO public.configurations_[CLIENTE_ID] (
    clinic_name,
    clinic_address,
    clinic_phone,
    clinic_email,
    default_duration,
    working_hours,
    prices
) VALUES (
    '[NOMBRE_COMPLETO]',
    '[DIRECCION], [CODIGO_POSTAL] [CIUDAD]',
    '[TELEFONO]',
    '[EMAIL]',
    30,
    '{
        "monday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}},
        "tuesday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}},
        "wednesday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}},
        "thursday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}},
        "friday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}},
        "saturday": {"enabled": false},
        "sunday": {"enabled": false}
    }'::jsonb,
    '{
        "30min": 3000,
        "45min": 4000,
        "60min": 5000,
        "90min": 7000
    }'::jsonb
);

-- ============================================================
-- VALIDACIÓN
-- ============================================================

-- Verificar que todas las tablas fueron creadas
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name LIKE '%[CLIENTE_ID]'
ORDER BY 
    table_name;

-- Verificar que el tenant fue registrado
SELECT * FROM public.tenants WHERE slug = '[CLIENTE_ID]';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
```

**Ejemplo Real para Actifisio:**

```sql
-- Reemplazar [CLIENTE_ID] → actifisio
-- Reemplazar [NOMBRE_COMPLETO] → Actifisio
-- Reemplazar [DIRECCION] → Avenida Principal, 456
-- etc.
```

✅ **Verificar:** 
- 9 tablas creadas con sufijo `_[CLIENTE_ID]`
- Tenant registrado en tabla `tenants`
- Configuración inicial insertada

---

### FASE 4: SCRIPTS DE DEPLOYMENT (10 min)

#### 4.1 Crear Script PowerShell de Deployment

**Archivo:** `DEPLOY_[CLIENTE_ID].ps1` (en raíz del proyecto)

```powershell
# ============================================================
# SCRIPT: Build y Deploy Completo de [NOMBRE_CLIENTE]
# ============================================================

Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host "   BUILD Y DEPLOY: [NOMBRE_CLIENTE_MAYUSCULAS]" -ForegroundColor Cyan
Write-Host "   ============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# 1. Navegar al directorio frontend
Write-Host "📁 Navegando al directorio frontend..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\frontend"
Write-Host "   ✅ Directorio: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 2. Limpiar build anterior
Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
if (Test-Path "dist\[CLIENTE_ID]-build") {
    Remove-Item -Path "dist\[CLIENTE_ID]-build" -Recurse -Force
    Write-Host "   ✅ Build anterior eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No hay build anterior" -ForegroundColor Gray
}
Write-Host ""

# 3. Build de producción
Write-Host "🔨 Construyendo [NOMBRE_CLIENTE]..." -ForegroundColor Yellow
$env:VITE_CLIENT_ID = "[CLIENTE_ID]"
ng build --output-path=dist/[CLIENTE_ID]-build --configuration=production

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ ERROR en build" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Build exitoso" -ForegroundColor Green
Write-Host ""

# 4. Inyectar CLIENT_ID en HTML
Write-Host "💉 Inyectando CLIENT_ID en HTML..." -ForegroundColor Yellow
$indexPath = "dist\[CLIENTE_ID]-build\browser\index.csr.html"

if (Test-Path $indexPath) {
    $html = Get-Content $indexPath -Raw
    $injection = "  <script>window.__CLIENT_ID = '[CLIENTE_ID]';</script>`n"
    
    if ($html -match 'window\.__CLIENT_ID') {
        $html = $html -replace '<script>window\.__CLIENT_ID = ''.*?'';</script>', $injection.Trim()
        Write-Host "   ⚠️  CLIENT_ID existente reemplazado" -ForegroundColor Yellow
    } else {
        $html = $html -replace '</head>', "$injection</head>"
        Write-Host "   ✅ CLIENT_ID inyectado" -ForegroundColor Green
    }
    
    Set-Content -Path $indexPath -Value $html
} else {
    Write-Host "   ❌ ERROR: No se encontró index.csr.html" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 5. Crear vercel.json para routing SPA
Write-Host "⚙️  Creando configuración de Vercel..." -ForegroundColor Yellow
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

Set-Content -Path "dist\[CLIENTE_ID]-build\browser\vercel.json" -Value $vercelJson
Write-Host "   ✅ vercel.json creado" -ForegroundColor Green
Write-Host ""

# 6. Deploy a Vercel
Write-Host "☁️  Desplegando a Vercel..." -ForegroundColor Yellow
Set-Location -Path "dist\[CLIENTE_ID]-build\browser"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

$deployOutput = vercel --prod --yes 2>&1 | Out-String
Write-Host $deployOutput -ForegroundColor Gray

if ($deployOutput -match 'Production: (https://[^\s]+)') {
    $deploymentUrl = $matches[1]
    Write-Host "   ✅ Deployment exitoso" -ForegroundColor Green
    Write-Host "   📦 URL: $deploymentUrl" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ ERROR: No se pudo obtener URL de deployment" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 7. Actualizar alias
Write-Host "🔗 Actualizando alias [CLIENTE_ID].vercel.app..." -ForegroundColor Yellow
$aliasOutput = vercel alias set $deploymentUrl [CLIENTE_ID].vercel.app 2>&1 | Out-String
Write-Host $aliasOutput -ForegroundColor Gray

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Alias actualizado" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERROR actualizando alias" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 8. Resumen final
Write-Host "✅ ============================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "   ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs de [NOMBRE_CLIENTE]:" -ForegroundColor Cyan
Write-Host "   Producción: https://[CLIENTE_ID].vercel.app" -ForegroundColor White
Write-Host "   Deployment: $deploymentUrl" -ForegroundColor Gray
Write-Host ""

Set-Location -Path $PSScriptRoot
```

#### 4.2 Actualizar Script de Generación de Manifest

**Archivo:** `scripts/generate-manifest.ps1`

Agregar configuración del nuevo cliente en `$CLIENT_CONFIGS`:

```powershell
$CLIENT_CONFIGS = @{
    masajecorporaldeportivo = @{
        Name        = "Masaje Corporal Deportivo"
        ShortName   = "Clínica MCD"
        Description = "Sistema de gestión para clínica de masaje corporal deportivo"
        ThemeColor  = "#667eea"
        LogoPath    = "assets/clients/masajecorporaldeportivo/logo.png"
    }
    actifisio = @{
        Name        = "Actifisio"
        ShortName   = "Actifisio"
        Description = "Sistema de gestión para centro de fisioterapia Actifisio"
        ThemeColor  = "#ff6b35"
        LogoPath    = "assets/clients/actifisio/logo.png"
    }
    [CLIENTE_ID] = @{
        Name        = "[NOMBRE_COMPLETO]"
        ShortName   = "[NOMBRE_CORTO]"
        Description = "Sistema de gestión para [TIPO_CENTRO] [NOMBRE_CORTO]"
        ThemeColor  = "[COLOR_PRIMARIO]"
        LogoPath    = "assets/clients/[CLIENTE_ID]/logo.png"
    }
}
```

---

### FASE 5: DEPLOYMENT A VERCEL (10 min)

#### 5.1 Ejecutar Build y Deploy Local

```powershell
cd C:\Users\dsuarez1\git\clinic

# Ejecutar script de deployment
.\DEPLOY_[CLIENTE_ID].ps1
```

**Proceso automático:**
1. ✅ Build de frontend con CLIENT_ID
2. ✅ Inyección de window.__CLIENT_ID en HTML
3. ✅ Creación de vercel.json
4. ✅ Deploy a Vercel producción
5. ✅ Actualización de alias

#### 5.2 Verificar Deployment

```powershell
# Abrir en navegador
Start-Process "https://[CLIENTE_ID].vercel.app"
```

**Checklist de verificación:**

- [ ] ✅ Página carga sin errores 404
- [ ] ✅ Logo correcto en header
- [ ] ✅ Colores del tema aplicados (header, botones)
- [ ] ✅ Nombre del cliente en header
- [ ] ✅ Favicon correcto en pestaña del navegador
- [ ] ✅ Navegación funciona (Inicio, Agenda, Pacientes, Configuración)
- [ ] ✅ Crear paciente funciona
- [ ] ✅ Crear cita funciona
- [ ] ✅ Botones usan colores del cliente (no azul Bootstrap)
- [ ] ✅ Pestañas de configuración usan colores del cliente
- [ ] ✅ Exportación CSV funciona (solo datos del cliente)

---

### FASE 6: TESTING COMPLETO (10 min)

#### 6.1 Testing Manual

**Test de Aislamiento Multi-Tenant:**

```powershell
# 1. Abrir cliente nuevo
Start-Process "https://[CLIENTE_ID].vercel.app"

# 2. Crear paciente de prueba
# Nombre: "Test [NOMBRE_CLIENTE]"
# Teléfono: "+34 000 000 001"

# 3. Crear cita para ese paciente
# Fecha: Hoy
# Hora: 10:00

# 4. Verificar que NO aparece en otros clientes
Start-Process "https://actifisio.vercel.app"
Start-Process "https://masajecorporaldeportivo.vercel.app"
```

**Test de Colores:**

```powershell
# Verificar elementos con colores dinámicos:
# - Header (gradiente)
# - Botones primarios (color primario)
# - Botones secundarios (color secundario)
# - Botones de vista (Día, Semana, Mes, Hoy) - todos los estados
# - Pestañas de configuración
# - Enlaces hover
```

**Test de CSV Export:**

```powershell
# 1. Crear 2-3 citas en el mes actual
# 2. Ir a vista mensual del calendario
# 3. Click en "Exportar CSV" > "Por Cita"
# 4. Verificar que archivo CSV solo contiene datos de este cliente
# 5. Verificar que header tiene tenant slug correcto en logs del navegador
```

#### 6.2 Testing de Browser Dev Tools

```javascript
// Abrir consola del navegador (F12)

// 1. Verificar CLIENT_ID
console.log('CLIENT_ID:', window.__CLIENT_ID);
// Debe mostrar: [CLIENTE_ID]

// 2. Verificar que tema se aplicó
const root = document.documentElement;
console.log('Primary Color:', getComputedStyle(root).getPropertyValue('--primary-color'));
console.log('Secondary Color:', getComputedStyle(root).getPropertyValue('--secondary-color'));
// Debe mostrar los colores configurados

// 3. Verificar requests HTTP
// En tab Network, filtrar por "Fetch/XHR"
// Verificar que todos los requests tienen header:
// X-Tenant-Slug: [CLIENTE_ID]
```

---

## 🎯 RESUMEN DE CAMBIOS IMPLEMENTADOS HOY (Actifisio)

### Cambios Críticos Identificados y Corregidos:

#### 1. **CSV Export Multi-Tenant Bug** ❌ → ✅

**Problema:** CSV exportaba datos de TODOS los clientes (bug de seguridad crítico)

**Archivos modificados:**
- `frontend/src/app/pages/agenda/calendar/calendar.component.ts`

**Cambios:**
```typescript
// ANTES (INCORRECTO):
const url = `${APP_CONFIG.apiUrl}/reports/billing?year=${year}&month=${month}`;
const resp = await fetch(url, {
    headers: {
        'X-Tenant-Slug': APP_CONFIG.clientId  // ❌ Hardcodeado
    }
});

// DESPUÉS (CORRECTO):
import { ClientConfigService } from '../../../services/client-config.service';

constructor(
    // ... otros servicios
    private clientConfigService: ClientConfigService  // ← Inyectar
) { }

async exportMonthCsv(...) {
    const apiUrl = this.clientConfigService.getApiUrl();
    const tenantSlug = this.clientConfigService.getTenantSlug();
    const url = `${apiUrl}/reports/billing?year=${year}&month=${month}`;
    
    console.log(`📊 Exportando CSV para ${tenantSlug}: ${url}`);
    
    const resp = await fetch(url, {
        headers: {
            'X-Tenant-Slug': tenantSlug  // ✅ Dinámico
        }
    });
}
```

#### 2. **Logos Dinámicos** 🖼️

**Problema:** Logos hardcodeados, no se personalizaban por cliente

**Archivos modificados:**
- `frontend/src/app/app.component.ts`
- `frontend/src/app/services/client-config.service.ts`
- `frontend/src/app/app.component.html`
- `frontend/src/app/pages/configuracion/configuracion.component.ts`
- `frontend/src/app/pages/configuracion/configuracion.component.html`

**Cambios:**

**a) Favicon dinámico en `app.component.ts`:**
```typescript
ngOnInit(): void {
  this.clientConfig.applyTheme();
  this.clientConfig.setPageTitle();
  this.clientConfig.setFavicon();  // ← NUEVO
}
```

**b) Método setFavicon() en `client-config.service.ts`:**
```typescript
setFavicon(): void {
  const faviconUrl = this.config.assets.favicon;
  const isPng = faviconUrl.endsWith('.png');

  let link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = isPng ? 'image/png' : 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = faviconUrl;

  if (!document.querySelector("link[rel*='icon']")) {
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  console.log('🖼️ Favicon actualizado:', faviconUrl);
}
```

**c) Logo en header (`app.component.html`):**
```html
<!-- ANTES (INCORRECTO): -->
<img src="assets/logo-clinica.png" alt="Logo">

<!-- DESPUÉS (CORRECTO): -->
<img [src]="clientConfig.getAssets().logo" 
     [alt]="clientConfig.getClientInfo().name + ' Logo'" 
     class="clinic-logo">
```

**d) Logo en configuración (`configuracion.component.ts`):**
```typescript
constructor(
    // ... otros servicios
    private clientConfigService: ClientConfigService
) {
    // ...
    this.logoUrl = this.clientConfigService.getAssets().logo;  // ← Dinámico
}
```

#### 3. **Botones con Colores del Cliente** 🎨

**Problema:** Botones usaban azul Bootstrap por defecto

**Archivos modificados:**
- `frontend/src/app/pages/agenda/calendar/calendar.component.scss`
- `frontend/src/app/pages/inicio/dashboard/dashboard.component.scss`
- `frontend/src/app/pages/configuracion/configuracion.component.scss`

**Cambios:**

**a) Botones de calendario (`calendar.component.scss`):**
```scss
/* Sobrescritura completa de Bootstrap */
.btn-outline-primary {
    color: var(--primary-color) !important;
    border-color: var(--primary-color) !important;
    background-color: transparent !important;
    
    &:hover {
        color: white !important;
        background-color: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        opacity: 0.9;
    }
    
    &:focus,
    &:active {
        color: white !important;
        background-color: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        box-shadow: none !important;
    }
}

.btn-outline-secondary {
    color: var(--secondary-color) !important;
    border-color: var(--secondary-color) !important;
    background-color: transparent !important;
    
    &:hover {
        color: white !important;
        background-color: var(--secondary-color) !important;
        border-color: var(--secondary-color) !important;
        opacity: 0.9;
    }
    
    &:focus,
    &:active {
        color: white !important;
        background-color: var(--secondary-color) !important;
        border-color: var(--secondary-color) !important;
        box-shadow: none !important;
    }
}
```

**b) Botones de dashboard (`dashboard.component.scss`):**
```scss
/* MISMO patrón que calendar.component.scss */
.btn-outline-primary { /* ... */ }
.btn-outline-secondary { /* ... */ }
```

**c) Pestañas de configuración (`configuracion.component.scss`):**
```scss
.nav-tabs {
  border-bottom: 2px solid var(--primary-color);
  
  .nav-link {
    color: #6c757d;
    border-bottom: 3px solid transparent;
    
    &:hover {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    
    &.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      font-weight: 600;
    }
  }
}
```

---

## 📊 CHECKLIST FINAL DE VALIDACIÓN

### ✅ Configuración Frontend

- [ ] Archivo `[CLIENTE_ID].config.ts` creado
- [ ] Cliente registrado en `config.loader.ts`
- [ ] Logo copiado a `assets/clients/[CLIENTE_ID]/logo.png`
- [ ] Script de build en `package.json`
- [ ] Compilación exitosa sin errores

### ✅ Base de Datos

- [ ] 9 tablas creadas con sufijo `_[CLIENTE_ID]`
- [ ] Tenant registrado en tabla `tenants`
- [ ] Índices creados
- [ ] Configuración inicial insertada
- [ ] RLS desactivado

### ✅ Deployment

- [ ] Script `DEPLOY_[CLIENTE_ID].ps1` creado
- [ ] Deployment exitoso a Vercel
- [ ] Alias configurado ([CLIENTE_ID].vercel.app)
- [ ] Página accesible sin errores

### ✅ Testing Visual

- [ ] Logo correcto en header
- [ ] Favicon correcto en pestaña
- [ ] Colores del tema aplicados en header
- [ ] Botones primarios usan color primario (no azul)
- [ ] Botones secundarios usan color secundario
- [ ] Botones "Día", "Semana", "Mes", "Hoy" usan colores del cliente
- [ ] Pestañas de configuración usan colores del cliente
- [ ] Dashboard "Hoy" button usa colores del cliente

### ✅ Testing Funcional

- [ ] Crear paciente funciona
- [ ] Crear cita funciona
- [ ] Crear bono funciona
- [ ] Canjear crédito funciona
- [ ] Exportar CSV funciona (solo datos del cliente)
- [ ] Navegación entre páginas funciona
- [ ] Backup funciona
- [ ] Configuración se guarda correctamente

### ✅ Testing Multi-Tenant

- [ ] Datos de otros clientes NO aparecen
- [ ] CSV exporta solo datos del cliente actual
- [ ] Headers HTTP incluyen `X-Tenant-Slug: [CLIENTE_ID]`
- [ ] Console logs muestran tenant correcto

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error: "Build failed - Cannot find module '@angular/...'"

**Solución:**
```powershell
cd frontend
npm install
npm run build:[CLIENTE_ID]
```

### Error: "Table already exists"

**Solución:**
Ya existe un cliente con ese ID. Cambiar `[CLIENTE_ID]` a un valor único.

### Error: "Favicon not updating"

**Solución:**
```typescript
// Verificar que setFavicon() se llama en app.component.ts ngOnInit()
// Limpiar caché del navegador (Ctrl + Shift + Delete)
// Hard refresh (Ctrl + F5)
```

### Error: "Buttons still blue"

**Solución:**
Verificar que se agregaron los estilos `.btn-outline-primary` y `.btn-outline-secondary` con `!important` en:
- `calendar.component.scss`
- `dashboard.component.scss`

### Error: "CSV exports wrong data"

**Solución:**
Verificar que `calendar.component.ts` usa `ClientConfigService` y no `APP_CONFIG.clientId` hardcodeado.

### Error: "Logo not found (404)"

**Solución:**
```powershell
# Verificar que existe el archivo
ls frontend\src\assets\clients\[CLIENTE_ID]\logo.png

# Verificar path en config
# Debe ser: assets/clients/[CLIENTE_ID]/logo.png (sin 'src')
```

---

## 🎓 CONCEPTOS CLAVE PARA ENTENDER

### 1. **Multi-Tenancy por Header (X-Tenant-Slug)**

```typescript
// CADA request HTTP debe incluir este header:
headers: {
    'X-Tenant-Slug': clientConfigService.getTenantSlug()
}

// Backend filtra por tenant:
WHERE table_name = `patients_${tenantSlug}`
```

### 2. **CSS Variables para Temas Dinámicos**

```scss
// ❌ NO hacer:
.button {
    background-color: #007bff;  // Hardcodeado
}

// ✅ SÍ hacer:
.button {
    background-color: var(--primary-color);  // Dinámico
}
```

### 3. **ClientConfigService vs APP_CONFIG**

```typescript
// ❌ NO usar (estático):
import { APP_CONFIG } from '../../config/config.loader';
const clientId = APP_CONFIG.clientId;

// ✅ SÍ usar (dinámico):
constructor(private clientConfig: ClientConfigService) {}
const tenantSlug = this.clientConfig.getTenantSlug();
```

### 4. **window.__CLIENT_ID Injection**

```html
<!-- Inyectado por script de deployment en index.csr.html -->
<head>
  <script>window.__CLIENT_ID = 'actifisio';</script>
</head>
```

```typescript
// Leído por config.loader.ts
const clientId = (window as any).__CLIENT_ID || 'masajecorporaldeportivo';
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **CREAR_TABLAS_NUEVO_CLIENTE.md** - Guía detallada de SQL
- **GUIA_SISTEMA_MULTICLIENTE.md** - Arquitectura del sistema
- **CORRECCION_CSV_COLORES_V2.4.12.md** - Fix de CSV y colores
- **CORRECCION_BOTONES_COMPLETA_V2.4.12.md** - Fix de botones Bootstrap
- **CORRECCION_LOGOS_DINAMICOS_V2.4.11.md** - Fix de logos y favicons
- **DEPLOYMENT_ACTIFISIO_V2.4.11_COMPLETO.md** - Deployment completo de Actifisio

---

## 💬 PREGUNTAS AL USUARIO (Antes de empezar)

```text
INFORMACIÓN DEL CLIENTE:
1. ¿Cuál es el nombre completo del cliente? (Ej: "Actifisio Centro de Fisioterapia")
2. ¿Cuál es el nombre corto? (Ej: "Actifisio")
3. ¿Cuál será el identificador único (slug)? (minúsculas, sin espacios, sin tildes)
4. ¿Cuáles son los colores de la marca? (códigos hexadecimales)
   - Primario: #______
   - Secundario: #______
   - Acento (opcional): #______
5. ¿Tienes el logo? (512x512px, PNG, fondo transparente)
6. Datos de contacto:
   - Teléfono: ________________
   - Email: ________________
   - Dirección: ________________
   - Ciudad: ________________
   - Código Postal: ________________
7. ¿Sitio web o Instagram? ________________

DEPLOYMENT:
8. ¿URL deseada? (Ej: actifisio.vercel.app)
9. ¿Tienes acceso a Vercel CLI? (vercel login)
10. ¿Tienes acceso a Supabase SQL Editor?

Con esta información puedo implementar el cliente completo en 45-60 minutos.
```

---

## ✅ FIN DEL TEMPLATE

**Última actualización:** 4 de octubre de 2025  
**Versión:** 3.0.0  
**Status:** ✅ Validado con Actifisio - 100% funcional

---

### 📝 NOTAS FINALES

Este template documenta EXACTAMENTE todos los pasos que seguimos hoy para implementar Actifisio desde cero hasta producción. Incluye:

1. ✅ Configuración de cliente (TypeScript)
2. ✅ Assets (logo)
3. ✅ Base de datos (9 tablas)
4. ✅ Scripts de deployment (PowerShell)
5. ✅ Testing completo
6. ✅ Fixes de colores (botones, pestañas)
7. ✅ Fixes de logos (favicon, header, configuración)
8. ✅ Fixes de CSV (multi-tenant)

Con este documento, puedo implementar un nuevo cliente en 45-60 minutos solo con:
- Nombre del cliente
- Paleta de colores (3 códigos hex)
- Logo (PNG 512x512px)
- Datos de contacto

**¿Quieres que pruebe este template con un cliente ficticio para validarlo?** 🚀
