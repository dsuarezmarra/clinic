# ⚡ CHECKLIST RÁPIDO: NUEVO CLIENTE EN 45 MINUTOS

**Versión:** 1.0.0  
**Última actualización:** 4 de octubre de 2025  
**Objetivo:** Implementar cliente nuevo desde 0 hasta producción en 45-60 min

---

## 🎯 INFORMACIÓN PREVIA REQUERIDA

Antes de empezar, asegúrate de tener TODA esta información:

```yaml
✅ cliente_id: "actifisio"                    # minúsculas, sin espacios
✅ nombre_completo: "Actifisio"
✅ nombre_corto: "Actifisio"
✅ color_primario: "#ff6b35"
✅ color_secundario: "#f7b731"
✅ color_acento: "#5f27cd"
✅ logo_archivo: "actifisio-logo.png"        # 512x512px, PNG
✅ telefono: "+34 XXX XXX XXX"
✅ email: "contacto@actifisio.com"
✅ direccion: "Avenida Principal, 456"
✅ ciudad: "Barcelona"
✅ codigo_postal: "08001"
✅ url_deseada: "actifisio.vercel.app"
```

---

## 📊 TIMELINE

| Fase | Tarea | Tiempo | Acumulado |
|------|-------|--------|-----------|
| 1 | Preparación de Assets | 5 min | 5 min |
| 2 | Configuración Frontend | 15 min | 20 min |
| 3 | Base de Datos (Supabase) | 15 min | 35 min |
| 4 | Scripts de Deployment | 5 min | 40 min |
| 5 | Build y Deploy | 10 min | 50 min |
| 6 | Testing y Validación | 10 min | 60 min |

**Total:** 60 minutos máximo

---

## ✅ FASE 1: PREPARACIÓN DE ASSETS (5 min)

### 1.1 Crear Carpeta y Copiar Logo

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend\src\assets\clients

# Crear carpeta del cliente
mkdir [CLIENTE_ID]

# Copiar logo (debe ser 512x512px PNG)
Copy-Item "[RUTA_LOGO]" -Destination ".\[CLIENTE_ID]\logo.png"

# Verificar
ls [CLIENTE_ID]\logo.png
```

**✅ Resultado esperado:**
```
    Directory: ...\assets\clients\actifisio

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---           4/10/2025   1:23 AM         156789 logo.png
```

---

## ✅ FASE 2: CONFIGURACIÓN FRONTEND (15 min)

### 2.1 Crear Archivo de Configuración

**Archivo:** `frontend/src/config/clients/[CLIENTE_ID].config.ts`

```typescript
import { ClientConfig } from '../client-config.interface';

export const [CLIENTE_ID]Config: ClientConfig = {
  tenantSlug: '[CLIENTE_ID]',
  
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
    socialMedia: { instagram: '[INSTAGRAM]' }
  },
  
  theme: {
    primary: '[COLOR_PRIMARIO]',
    secondary: '[COLOR_SECUNDARIO]',
    accent: '[COLOR_ACENTO]',
    headerGradient: 'linear-gradient(135deg, [COLOR_PRIMARIO] 0%, [COLOR_SECUNDARIO] 100%)',
    buttonColor: '[COLOR_PRIMARIO]',
    buttonHover: '[COLOR_PRIMARIO_OSCURO]'
  },
  
  assets: {
    logo: 'assets/clients/[CLIENTE_ID]/logo.png',
    favicon: 'assets/clients/[CLIENTE_ID]/logo.png',
    appleTouchIcon: 'assets/clients/[CLIENTE_ID]/logo.png'
  },
  
  backend: {
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'
  },
  
  pwa: {
    name: '[NOMBRE_COMPLETO]',
    shortName: '[NOMBRE_CORTO]',
    description: 'Sistema de gestión para [TIPO_CENTRO] [NOMBRE_CORTO]',
    themeColor: '[COLOR_PRIMARIO]',
    backgroundColor: '#ffffff'
  }
};
```

### 2.2 Registrar en Config Loader

**Archivo:** `frontend/src/config/config.loader.ts`

```typescript
// 1. Agregar import
import { [CLIENTE_ID]Config } from './clients/[CLIENTE_ID].config';

// 2. Agregar al mapa
const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  'masajecorporaldeportivo': masajecorporaldeportivoConfig,
  'actifisio': actifisioConfig,
  '[CLIENTE_ID]': [CLIENTE_ID]Config  // ← AGREGAR
};
```

### 2.3 Agregar Script de Build

**Archivo:** `frontend/package.json`

```json
"scripts": {
  "build:[CLIENTE_ID]": "cross-env VITE_CLIENT_ID=[CLIENTE_ID] npm run build"
}
```

### 2.4 Test de Compilación

```powershell
cd frontend
npm run build:[CLIENTE_ID]
```

**✅ Resultado esperado:**
```
✔ Browser application bundle generation complete.
✔ Copying assets complete.
Output location: C:\Users\...\dist\[CLIENTE_ID]-build
```

---

## ✅ FASE 3: BASE DE DATOS (15 min)

### 3.1 Abrir Supabase SQL Editor

1. Ir a https://app.supabase.com
2. Seleccionar proyecto
3. Click en **SQL Editor** (icono `</>`)
4. Click en **New Query**

### 3.2 Ejecutar Script SQL

**Reemplazar `[CLIENTE_ID]` con el ID real en este script:**

```sql
-- TABLA 1: patients_[CLIENTE_ID]
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

-- TABLA 2: appointments_[CLIENTE_ID]
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

-- TABLA 3: credit_packs_[CLIENTE_ID]
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

-- TABLA 4: credit_redemptions_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.credit_redemptions_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_pack_id uuid NOT NULL REFERENCES public.credit_packs_[CLIENTE_ID](id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES public.appointments_[CLIENTE_ID](id) ON DELETE SET NULL,
    credits_used integer NOT NULL DEFAULT 1,
    redeemed_at timestamp with time zone DEFAULT now()
);

-- TABLA 5: patient_files_[CLIENTE_ID]
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

-- TABLA 6: configurations_[CLIENTE_ID]
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

-- TABLA 7: backups_[CLIENTE_ID]
CREATE TABLE IF NOT EXISTS public.backups_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    created_at timestamp with time zone DEFAULT now(),
    backup_type text DEFAULT 'manual'
);

-- TABLA 8: invoices_[CLIENTE_ID]
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

-- TABLA 9: invoice_items_[CLIENTE_ID]
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

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_appointments_[CLIENTE_ID]_patient_id ON public.appointments_[CLIENTE_ID](patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_[CLIENTE_ID]_start_time ON public.appointments_[CLIENTE_ID](start_time);
CREATE INDEX IF NOT EXISTS idx_credit_packs_[CLIENTE_ID]_patient_id ON public.credit_packs_[CLIENTE_ID](patient_id);
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_[CLIENTE_ID]_pack_id ON public.credit_redemptions_[CLIENTE_ID](credit_pack_id);

-- REGISTRAR TENANT
INSERT INTO public.tenants (slug, name, created_at)
VALUES ('[CLIENTE_ID]', '[NOMBRE_COMPLETO]', now())
ON CONFLICT (slug) DO NOTHING;

-- DESACTIVAR RLS
ALTER TABLE public.patients_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurations_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;

-- CONFIGURACIÓN INICIAL
INSERT INTO public.configurations_[CLIENTE_ID] (
    clinic_name, clinic_address, clinic_phone, clinic_email, 
    default_duration, working_hours, prices
) VALUES (
    '[NOMBRE_COMPLETO]',
    '[DIRECCION], [CODIGO_POSTAL] [CIUDAD]',
    '[TELEFONO]',
    '[EMAIL]',
    30,
    '{"monday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}}}'::jsonb,
    '{"30min": 3000, "45min": 4000, "60min": 5000, "90min": 7000}'::jsonb
);
```

### 3.3 Verificar Creación

```sql
-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%[CLIENTE_ID]'
ORDER BY table_name;

-- Ver tenant registrado
SELECT * FROM public.tenants WHERE slug = '[CLIENTE_ID]';
```

**✅ Resultado esperado:**
```
table_name
------------------------
appointments_[CLIENTE_ID]
backups_[CLIENTE_ID]
configurations_[CLIENTE_ID]
credit_packs_[CLIENTE_ID]
credit_redemptions_[CLIENTE_ID]
invoice_items_[CLIENTE_ID]
invoices_[CLIENTE_ID]
patient_files_[CLIENTE_ID]
patients_[CLIENTE_ID]
```

---

## ✅ FASE 4: SCRIPT DE DEPLOYMENT (5 min)

### 4.1 Crear Script PowerShell

**Archivo:** `DEPLOY_[CLIENTE_ID].ps1` (en raíz del proyecto)

```powershell
# Copiar DEPLOY_ACTIFISIO.ps1 y reemplazar:
# - actifisio → [CLIENTE_ID]
# - Actifisio → [NOMBRE_CLIENTE]
# - ACTIFISIO → [NOMBRE_CLIENTE_MAYUSCULAS]
```

**Template rápido:**

```powershell
Write-Host "🚀 BUILD Y DEPLOY: [NOMBRE_CLIENTE]" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\frontend"
$env:VITE_CLIENT_ID = "[CLIENTE_ID]"
ng build --output-path=dist/[CLIENTE_ID]-build --configuration=production

$indexPath = "dist\[CLIENTE_ID]-build\browser\index.csr.html"
$html = Get-Content $indexPath -Raw
$injection = "<script>window.__CLIENT_ID = '[CLIENTE_ID]';</script>`n"
$html = $html -replace '</head>', "$injection</head>"
Set-Content -Path $indexPath -Value $html

$vercelJson = '{"version": 2, "routes": [{"handle": "filesystem"}, {"src": "/(.*)", "dest": "/index.csr.html"}]}'
Set-Content -Path "dist\[CLIENTE_ID]-build\browser\vercel.json" -Value $vercelJson

Set-Location -Path "dist\[CLIENTE_ID]-build\browser"
vercel --prod --yes
vercel alias set [DEPLOYMENT_URL] [CLIENTE_ID].vercel.app
```

---

## ✅ FASE 5: BUILD Y DEPLOY (10 min)

### 5.1 Ejecutar Script

```powershell
cd C:\Users\dsuarez1\git\clinic
.\DEPLOY_[CLIENTE_ID].ps1
```

**Proceso automático:**
1. ✅ Build de Angular con CLIENT_ID
2. ✅ Inyectar window.__CLIENT_ID en HTML
3. ✅ Crear vercel.json para routing
4. ✅ Deploy a Vercel (3-5 segundos)
5. ✅ Configurar alias

**✅ Resultado esperado:**
```
✅ ============================================
   DEPLOYMENT COMPLETADO
   ============================================

🌐 URLs de [NOMBRE_CLIENTE]:
   Producción: https://[CLIENTE_ID].vercel.app
   Deployment: https://browser-xyz123.vercel.app
```

---

## ✅ FASE 6: TESTING (10 min)

### 6.1 Abrir App

```powershell
Start-Process "https://[CLIENTE_ID].vercel.app"
```

### 6.2 Checklist Visual

| ✅ | Elemento | Verificación |
|----|----------|--------------|
| [ ] | **Página carga** | Sin errores 404 |
| [ ] | **Header** | Logo correcto |
| [ ] | **Header** | Nombre del cliente |
| [ ] | **Header** | Gradiente con colores del cliente |
| [ ] | **Favicon** | Icono correcto en pestaña |
| [ ] | **Botones** | Color primario (no azul) |
| [ ] | **Botones hover** | Hover con color primario |
| [ ] | **Tabs configuración** | Pestañas con color primario |
| [ ] | **Dashboard "Hoy"** | Botón con color primario |

### 6.3 Checklist Funcional

| ✅ | Función | Test |
|----|---------|------|
| [ ] | **Crear paciente** | Nombre: "Test [CLIENTE]", Tel: "+34 000 000 001" |
| [ ] | **Ver paciente** | Aparece en lista de pacientes |
| [ ] | **Crear cita** | Hoy a las 10:00 para paciente test |
| [ ] | **Ver cita** | Aparece en calendario |
| [ ] | **Crear bono** | 5 sesiones, 10000 céntimos |
| [ ] | **Usar bono** | Canjear 1 crédito en cita |
| [ ] | **Exportar CSV** | Datos solo del cliente actual |

### 6.4 Test Multi-Tenant

```powershell
# Abrir otros clientes para verificar aislamiento
Start-Process "https://actifisio.vercel.app"
Start-Process "https://masajecorporaldeportivo.vercel.app"

# Verificar que NO aparece el paciente "Test [CLIENTE]" en otros clientes
```

### 6.5 Test Browser Console

```javascript
// F12 → Console
console.log('CLIENT_ID:', window.__CLIENT_ID);
// Debe mostrar: [CLIENTE_ID]

const root = document.documentElement;
console.log('Primary:', getComputedStyle(root).getPropertyValue('--primary-color'));
// Debe mostrar: [COLOR_PRIMARIO]
```

---

## 🎯 RESULTADO FINAL

Después de 45-60 minutos, deberías tener:

✅ Cliente configurado en frontend  
✅ 9 tablas creadas en Supabase  
✅ App desplegada en [CLIENTE_ID].vercel.app  
✅ Tema personalizado (colores, logo, favicon)  
✅ Aislamiento multi-tenant funcionando  
✅ Todas las funcionalidades operativas  

---

## 🔗 RECURSOS

- **Template Completo:** `TEMPLATE_NUEVO_CLIENTE_COMPLETO.md` (2,500+ líneas)
- **Guía SQL:** `CREAR_TABLAS_NUEVO_CLIENTE.md`
- **Guía Multi-Cliente:** `GUIA_SISTEMA_MULTICLIENTE.md`
- **Deployment Actifisio:** `DEPLOYMENT_ACTIFISIO_V2.4.11_COMPLETO.md`

---

## 🚨 SI ALGO FALLA

### Build Error

```powershell
cd frontend
npm install
npm run build:[CLIENTE_ID]
```

### Deployment Error

```powershell
# Verificar Vercel login
vercel login

# Re-deploy manual
cd frontend\dist\[CLIENTE_ID]-build\browser
vercel --prod --yes
```

### CSS no se aplica

- Limpiar caché del navegador (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + F5)
- Verificar en DevTools que CSS variables están definidas

### Logo 404

```powershell
# Verificar que existe
ls frontend\src\assets\clients\[CLIENTE_ID]\logo.png

# Verificar path en config (sin 'src'):
# assets/clients/[CLIENTE_ID]/logo.png
```

---

**Última actualización:** 4 de octubre de 2025  
**Version:** 1.0.0  
**Estado:** ✅ Validado con Actifisio
