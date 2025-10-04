# 🎴 QUICK REFERENCE CARD: Nuevo Cliente Multi-Tenant

**Versión:** 1.0.0 | **Tiempo:** 45-60 min | **Última actualización:** 04-oct-2025

---

## 📋 INFORMACIÓN REQUERIDA

```
┌─────────────────────────────────────────────────────────────┐
│ DATOS DEL CLIENTE                                           │
├─────────────────────────────────────────────────────────────┤
│ ✅ ID único:           [minúsculas, sin espacios]           │
│ ✅ Nombre completo:    [Actifisio Centro Fisioterapia]      │
│ ✅ Nombre corto:       [Actifisio]                          │
│ ✅ Color primario:     [#ff6b35]                            │
│ ✅ Color secundario:   [#f7b731]                            │
│ ✅ Color acento:       [#5f27cd]                            │
│ ✅ Logo PNG:           [512x512px, <200KB]                  │
│ ✅ Teléfono:           [+34 XXX XXX XXX]                    │
│ ✅ Email:              [contacto@cliente.com]               │
│ ✅ Dirección completa: [Calle, CP, Ciudad]                  │
│ ✅ URL deseada:        [cliente.vercel.app]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 COMANDOS RÁPIDOS

### Setup Inicial

```powershell
# 1. Crear carpeta de assets
cd frontend\src\assets\clients
mkdir [CLIENTE_ID]
Copy-Item "[LOGO_PATH]" -Destination ".\[CLIENTE_ID]\logo.png"

# 2. Crear archivo de configuración
New-Item "frontend\src\config\clients\[CLIENTE_ID].config.ts"
```

### Build y Deploy

```powershell
# Build local
cd frontend
npm run build:[CLIENTE_ID]

# Deploy completo (automatizado)
cd ..
.\DEPLOY_[CLIENTE_ID].ps1

# Deploy manual (paso a paso)
cd frontend\dist\[CLIENTE_ID]-build\browser
vercel --prod --yes
vercel alias set [DEPLOYMENT_URL] [CLIENTE_ID].vercel.app
```

### Verificación

```powershell
# Abrir app
Start-Process "https://[CLIENTE_ID].vercel.app"

# Testing multi-tenant (abrir 2+ clientes)
Start-Process "https://actifisio.vercel.app"
Start-Process "https://masajecorporaldeportivo.vercel.app"
```

---

## 📝 ARCHIVOS A CREAR/MODIFICAR

### ✅ Frontend (4 archivos)

```
frontend/
├── src/
│   ├── assets/clients/[CLIENTE_ID]/
│   │   └── logo.png                    [CREAR - Logo 512x512px]
│   └── config/
│       ├── clients/
│       │   └── [CLIENTE_ID].config.ts  [CREAR - Configuración]
│       └── config.loader.ts            [MODIFICAR - Registrar cliente]
└── package.json                        [MODIFICAR - Script build]
```

### ✅ Deployment (1 archivo)

```
DEPLOY_[CLIENTE_ID].ps1                 [CREAR - Script automatizado]
```

### ✅ Base de Datos (SQL)

```
Supabase SQL Editor → New Query → Ejecutar script con [CLIENTE_ID]
```

---

## 🎨 TEMPLATE: Archivo de Configuración

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
    postalCode: '[CP]',
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
  
  backend: { apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api' },
  
  pwa: {
    name: '[NOMBRE_COMPLETO]',
    shortName: '[NOMBRE_CORTO]',
    description: 'Sistema de gestión para [TIPO] [NOMBRE_CORTO]',
    themeColor: '[COLOR_PRIMARIO]',
    backgroundColor: '#ffffff'
  }
};
```

---

## 🗄️ TEMPLATE: SQL Supabase

**Copiar y reemplazar `[CLIENTE_ID]`:**

```sql
-- 1. PACIENTES
CREATE TABLE patients_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    email text,
    birth_date date,
    address text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. CITAS
CREATE TABLE appointments_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    notes text,
    status text DEFAULT 'scheduled',
    price_cents integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. BONOS
CREATE TABLE credit_packs_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    total_credits integer NOT NULL,
    used_credits integer DEFAULT 0,
    remaining_credits integer GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    price_cents integer NOT NULL,
    paid boolean DEFAULT false,
    purchase_date timestamptz DEFAULT now(),
    expiration_date timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. CANJES
CREATE TABLE credit_redemptions_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    credit_pack_id uuid NOT NULL REFERENCES credit_packs_[CLIENTE_ID](id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES appointments_[CLIENTE_ID](id) ON DELETE SET NULL,
    credits_used integer NOT NULL DEFAULT 1,
    redeemed_at timestamptz DEFAULT now()
);

-- 5. ARCHIVOS
CREATE TABLE patient_files_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    description text,
    uploaded_at timestamptz DEFAULT now()
);

-- 6. CONFIGURACIÓN
CREATE TABLE configurations_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_name text,
    clinic_address text,
    clinic_phone text,
    clinic_email text,
    default_duration integer DEFAULT 30,
    working_hours jsonb,
    prices jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. BACKUPS
CREATE TABLE backups_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    created_at timestamptz DEFAULT now(),
    backup_type text DEFAULT 'manual'
);

-- 8. FACTURAS
CREATE TABLE invoices_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL REFERENCES patients_[CLIENTE_ID](id) ON DELETE CASCADE,
    invoice_number text NOT NULL UNIQUE,
    issue_date date NOT NULL,
    due_date date,
    subtotal_cents integer NOT NULL,
    tax_cents integer DEFAULT 0,
    total_cents integer NOT NULL,
    status text DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 9. LÍNEAS DE FACTURA
CREATE TABLE invoice_items_[CLIENTE_ID] (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES invoices_[CLIENTE_ID](id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES appointments_[CLIENTE_ID](id) ON DELETE SET NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price_cents integer NOT NULL,
    total_cents integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_appointments_[CLIENTE_ID]_patient_id ON appointments_[CLIENTE_ID](patient_id);
CREATE INDEX idx_appointments_[CLIENTE_ID]_start_time ON appointments_[CLIENTE_ID](start_time);
CREATE INDEX idx_credit_packs_[CLIENTE_ID]_patient_id ON credit_packs_[CLIENTE_ID](patient_id);
CREATE INDEX idx_credit_redemptions_[CLIENTE_ID]_pack_id ON credit_redemptions_[CLIENTE_ID](credit_pack_id);

-- TENANT
INSERT INTO tenants (slug, name, created_at)
VALUES ('[CLIENTE_ID]', '[NOMBRE_COMPLETO]', now())
ON CONFLICT (slug) DO NOTHING;

-- RLS DESACTIVADO
ALTER TABLE patients_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE backups_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items_[CLIENTE_ID] DISABLE ROW LEVEL SECURITY;

-- CONFIGURACIÓN INICIAL
INSERT INTO configurations_[CLIENTE_ID] (clinic_name, clinic_address, clinic_phone, clinic_email, default_duration, working_hours, prices)
VALUES ('[NOMBRE]', '[DIRECCION]', '[TELEFONO]', '[EMAIL]', 30,
  '{"monday": {"enabled": true, "morning": {"start": "09:00", "end": "13:00"}, "afternoon": {"start": "15:00", "end": "19:00"}}}'::jsonb,
  '{"30min": 3000, "45min": 4000, "60min": 5000, "90min": 7000}'::jsonb
);
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Visual

```
┌─────────────────────────────────────┐
│ [ ] Logo en header                  │
│ [ ] Favicon en pestaña              │
│ [ ] Gradiente header (primario)     │
│ [ ] Botones calendario (primario)   │
│ [ ] Botones dashboard (primario)    │
│ [ ] Tabs configuración (primario)   │
│ [ ] Logo en configuración           │
└─────────────────────────────────────┘
```

### Funcional

```
┌─────────────────────────────────────┐
│ [ ] Crear paciente                  │
│ [ ] Crear cita                      │
│ [ ] Crear bono                      │
│ [ ] Canjear crédito                 │
│ [ ] Exportar CSV                    │
│ [ ] Backup funciona                 │
│ [ ] Configuración guarda            │
└─────────────────────────────────────┘
```

### Multi-Tenant

```
┌─────────────────────────────────────┐
│ [ ] Datos aislados por cliente      │
│ [ ] CSV solo datos propios          │
│ [ ] X-Tenant-Slug correcto          │
│ [ ] No ver datos de otros clientes  │
└─────────────────────────────────────┘
```

---

## 🐛 TROUBLESHOOTING

### Error: Build falla

```powershell
cd frontend
npm install
npm run build:[CLIENTE_ID]
```

### Error: Logo 404

```powershell
# Verificar path (SIN 'src'):
# ✅ assets/clients/[CLIENTE_ID]/logo.png
# ❌ src/assets/clients/[CLIENTE_ID]/logo.png
```

### Error: Colores no se aplican

```
1. Hard refresh: Ctrl + F5
2. Limpiar caché: Ctrl + Shift + Delete
3. Verificar DevTools → Elements → :root
4. Deben estar: --primary-color, --secondary-color
```

### Error: CSV exporta datos incorrectos

```typescript
// Verificar en calendar.component.ts:
// ✅ this.clientConfigService.getTenantSlug()
// ❌ APP_CONFIG.clientId
```

---

## 📊 TIEMPO ESTIMADO

```
┌──────────────────────────┬─────────┬───────────┐
│ Fase                     │ Tiempo  │ Acumulado │
├──────────────────────────┼─────────┼───────────┤
│ Preparación assets       │ 5 min   │ 5 min     │
│ Config frontend          │ 15 min  │ 20 min    │
│ SQL Supabase             │ 15 min  │ 35 min    │
│ Script deployment        │ 5 min   │ 40 min    │
│ Build y deploy           │ 10 min  │ 50 min    │
│ Testing y validación     │ 10 min  │ 60 min    │
├──────────────────────────┼─────────┼───────────┤
│ TOTAL                    │ 60 min  │           │
└──────────────────────────┴─────────┴───────────┘
```

---

## 🔗 RECURSOS

| Documento | Descripción | Líneas |
|-----------|-------------|--------|
| `TEMPLATE_NUEVO_CLIENTE_COMPLETO.md` | Guía detallada paso a paso | 2,500+ |
| `CHECKLIST_NUEVO_CLIENTE_RAPIDO.md` | Checklist condensado | 800+ |
| `LECCIONES_APRENDIDAS_ACTIFISIO.md` | Bugs y fixes documentados | 1,000+ |
| `CREAR_TABLAS_NUEVO_CLIENTE.md` | SQL completo con ejemplos | 563 |

---

## 🎯 PASOS MÍNIMOS (TL;DR)

```powershell
# 1. Assets
mkdir frontend\src\assets\clients\[ID]
copy [LOGO] frontend\src\assets\clients\[ID]\logo.png

# 2. Config
# Crear: frontend\src\config\clients\[ID].config.ts
# Editar: frontend\src\config\config.loader.ts (agregar import + registro)
# Editar: frontend\package.json (agregar script build)

# 3. SQL
# Supabase SQL Editor → Ejecutar script con [ID]

# 4. Deploy
.\DEPLOY_[ID].ps1

# 5. Test
Start-Process "https://[ID].vercel.app"
```

---

## 💡 TIPS PRO

1. **Usar herramienta de color:** https://maketintsandshades.com/ para generar color hover
2. **Optimizar logo:** https://tinypng.com/ o https://squoosh.app/
3. **Testing simultáneo:** Abrir 2+ clientes para verificar aislamiento
4. **DevTools Console:** Verificar `window.__CLIENT_ID` y CSS variables
5. **Hard refresh:** Ctrl + F5 si cambios no se ven

---

## 🎓 PATRONES A SEGUIR

### ✅ BIEN

```typescript
// Dinámico
this.clientConfigService.getTenantSlug()
```

```scss
// Variable CSS
background-color: var(--primary-color);
```

```html
<!-- Property binding -->
<img [src]="clientConfig.getAssets().logo">
```

### ❌ MAL

```typescript
// Estático
APP_CONFIG.clientId
```

```scss
// Hardcodeado
background-color: #007bff;
```

```html
<!-- String estático -->
<img src="assets/logo-clinica.png">
```

---

**Última actualización:** 4 de octubre de 2025  
**Versión:** 1.0.0  
**Validado con:** Actifisio (cliente #2)

---

**🚀 LISTO PARA USAR - Solo necesitas: ID + Colores + Logo + Datos**
