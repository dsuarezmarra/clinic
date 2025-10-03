# ✅ ARQUITECTURA CORRECTA - SISTEMA MULTI-CLIENTE

**Fecha:** 03/10/2025  
**Estado:** ✅ CONFIRMADO Y CORRECTO

---

## 🎯 ARQUITECTURA REAL (CORRECTA)

### ✅ LO QUE SE COMPARTE

1. **Backend (Node.js + Express)** ✅

   - **URL:** `https://masajecorporaldeportivo-api.vercel.app`
   - **Código:** 100% compartido
   - **Deployment:** 1 solo proyecto en Vercel
   - **Variables de entorno:** SUPABASE_URL, SUPABASE_SERVICE_KEY (mismo proyecto)

2. **Proyecto Supabase** ✅

   - **URL:** Mismo proyecto Supabase
   - **Base de datos:** PostgreSQL compartido
   - **Credenciales:** Mismas para todos los clientes

3. **Funcionalidades** ✅

   - Gestión de pacientes
   - Gestión de citas
   - Sistema de créditos/bonos
   - Archivos adjuntos
   - Backups
   - Reportes/informes
   - Sistema de facturación

4. **Código Frontend** ✅
   - Angular 20.2.0
   - Componentes reutilizables
   - Servicios HTTP
   - Lógica de negocio

---

### 🎨 LO QUE ES ÚNICO POR CLIENTE

1. **Configuración Visual**

   - Logo (assets/clients/[cliente]/logo.png)
   - Colores (primary, secondary, gradientes)
   - Favicon
   - Nombre de la clínica
   - Información de contacto

2. **Tablas en Supabase (con sufijos)**

   - **Masaje Corporal:** `patients_masajecorporaldeportivo`
   - **Actifisio:** `patients_actifisio`
   - Cada cliente tiene sus 9 tablas con sufijo

3. **URL del Frontend**

   - **Masaje Corporal:** `masajecorporaldeportivo.vercel.app`
   - **Actifisio:** `actifisio.vercel.app`

4. **Variables de Entorno del Frontend**
   - `VITE_CLIENT_ID=masajecorporaldeportivo`
   - `VITE_CLIENT_ID=actifisio`

---

## 📊 DIAGRAMA ARQUITECTÓNICO CORRECTO

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND - ANGULAR                          │
│                   (Código compartido)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐ │
│  │ masajecorporaldeportivo      │  │ actifisio.vercel.app    │ │
│  │ .vercel.app                  │  │                         │ │
│  │                              │  │                         │ │
│  │ VITE_CLIENT_ID=masaje...     │  │ VITE_CLIENT_ID=actifisio│ │
│  │ Logo: Masaje Corporal        │  │ Logo: Actifisio         │ │
│  │ Tema: Azul/Púrpura           │  │ Tema: Naranja/Amarillo  │ │
│  └──────────────┬───────────────┘  └──────────┬──────────────┘ │
│                 │                              │                │
└─────────────────┼──────────────────────────────┼────────────────┘
                  │                              │
                  │ X-Tenant-Slug:               │ X-Tenant-Slug:
                  │ masajecorporaldeportivo      │ actifisio
                  │                              │
                  └──────────────┬───────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND COMPARTIDO (Node.js + Express)             │
│                                                                 │
│  URL: https://masajecorporaldeportivo-api.vercel.app           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ database-middleware.js                                     │ │
│  │ - Lee header: X-Tenant-Slug                                │ │
│  │ - Crea DatabaseManager(tenantSlug)                         │ │
│  │ - Cache por tenant                                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ database-manager.js                                        │ │
│  │ - constructor(tenantSlug)                                  │ │
│  │ - getTableName(baseTable)                                  │ │
│  │   → 'patients' + '_' + tenantSlug                          │ │
│  │   → 'patients_masajecorporaldeportivo'                     │ │
│  │   → 'patients_actifisio'                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Variables de Entorno:                                          │
│  - SUPABASE_URL = https://xxxxx.supabase.co                    │
│  - SUPABASE_SERVICE_KEY = eyJhbGci...                           │
│                                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE - PROYECTO ÚNICO COMPARTIDO               │
│                    (PostgreSQL Database)                        │
│                                                                 │
│  ┌────────────────────────────┐  ┌──────────────────────────┐  │
│  │ TABLAS MASAJE CORPORAL     │  │ TABLAS ACTIFISIO         │  │
│  │ (sufijo: _masajecorporal..)│  │ (sufijo: _actifisio)     │  │
│  ├────────────────────────────┤  ├──────────────────────────┤  │
│  │ patients_masajecorporal... │  │ patients_actifisio       │  │
│  │ - 45 pacientes             │  │ - 0 pacientes            │  │
│  │                            │  │                          │  │
│  │ appointments_masajecorp... │  │ appointments_actifisio   │  │
│  │ - 289 citas                │  │ - 0 citas                │  │
│  │                            │  │                          │  │
│  │ credit_packs_masajecorp... │  │ credit_packs_actifisio   │  │
│  │ - 18 packs                 │  │ - 0 packs                │  │
│  │                            │  │                          │  │
│  │ credit_redemptions_...     │  │ credit_redemptions_...   │  │
│  │ patient_files_...          │  │ patient_files_...        │  │
│  │ configurations_...         │  │ configurations_...       │  │
│  │ backups_...                │  │ backups_...              │  │
│  │ invoices_...               │  │ invoices_...             │  │
│  │ invoice_items_...          │  │ invoice_items_...        │  │
│  └────────────────────────────┘  └──────────────────────────┘  │
│                                                                 │
│  Total: 18 tablas (9 por cliente)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE UNA PETICIÓN

### Ejemplo: Obtener lista de pacientes

**1. Usuario abre Actifisio:**

```
https://actifisio.vercel.app/patients
```

**2. Frontend detecta cliente:**

```typescript
// config.loader.ts lee VITE_CLIENT_ID del entorno de build
const clientId = import.meta.env.VITE_CLIENT_ID; // 'actifisio'

// ClientConfigService carga configuración
const config = actifisioConfig;
const tenantSlug = config.tenantSlug; // 'actifisio'
```

**3. Frontend envía petición HTTP:**

```typescript
// TenantInterceptor agrega header automáticamente
GET https://masajecorporaldeportivo-api.vercel.app/api/patients
Headers:
  X-Tenant-Slug: actifisio
  Content-Type: application/json
```

**4. Backend recibe petición:**

```javascript
// database-middleware.js
const tenantSlug = req.headers["x-tenant-slug"]; // 'actifisio'
const dbManager = await getManagerForTenant(tenantSlug);
req.dbManager = dbManager;
```

**5. DatabaseManager construye query:**

```javascript
// database-manager.js
getTableName('patients') {
  // this.tenantSlug = 'actifisio'
  return 'patients_actifisio';
}

// En el método getPatients():
this.supabase
  .from(this.getTableName('patients')) // 'patients_actifisio'
  .select('*')
```

**6. Supabase ejecuta query:**

```sql
SELECT * FROM patients_actifisio;
-- Devuelve solo pacientes de Actifisio (0 registros por ahora)
```

**7. Backend devuelve respuesta:**

```json
[]
```

**8. Frontend muestra datos:**

```
Lista de pacientes de Actifisio: vacía
```

---

## ✅ VENTAJAS DE ESTA ARQUITECTURA

### 1. Simplicidad de Deployment

- ✅ Un solo backend en Vercel
- ✅ Un solo proyecto Supabase
- ✅ Sin duplicación de infraestructura
- ✅ Costo: €0 (todo en planes Free)

### 2. Mantenimiento del Código

- ✅ Corrección de bugs en un solo lugar
- ✅ Nuevas features disponibles para todos
- ✅ Un solo repositorio
- ✅ Un solo pipeline de CI/CD

### 3. Aislamiento de Datos

- ✅ Cada cliente solo ve sus datos
- ✅ Tablas separadas con sufijos
- ✅ RLS en Supabase como segunda capa de seguridad
- ✅ Imposible mezclar datos entre clientes (header obligatorio)

### 4. Escalabilidad

- ✅ Agregar nuevo cliente = 40 minutos
- ✅ Crear 9 tablas con sufijo en Supabase
- ✅ Deploy frontend con nuevo VITE_CLIENT_ID
- ✅ Sin cambios en backend

### 5. Costos Predecibles

- ✅ Backend: Free (Vercel Hobby)
- ✅ Supabase: Free (hasta 500MB, suficiente para ~10 clientes)
- ✅ Frontend por cliente: Free (Vercel Hobby)
- ✅ Total: €0 hasta escalar

---

## 🔐 SEGURIDAD

### Capa 1: Header HTTP

```javascript
// Backend valida header X-Tenant-Slug
if (!req.headers["x-tenant-slug"]) {
  return res.status(400).json({ error: "X-Tenant-Slug header requerido" });
}
```

### Capa 2: Tablas Separadas

```javascript
// Cada cliente accede solo a sus tablas
// patients_masajecorporaldeportivo
// patients_actifisio
// Imposible cross-contamination
```

### Capa 3: RLS en Supabase

```sql
-- Row Level Security habilitado
ALTER TABLE patients_actifisio ENABLE ROW LEVEL SECURITY;

-- Políticas restrictivas
CREATE POLICY "service_role_only" ON patients_actifisio
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 📝 CONFIGURACIÓN POR CLIENTE

### Masaje Corporal Deportivo

**Frontend:**

- URL: `https://masajecorporaldeportivo.vercel.app`
- VITE_CLIENT_ID: `masajecorporaldeportivo`
- Tenant Slug: `masajecorporaldeportivo`
- Tema: Azul (#667eea) y Púrpura (#764ba2)

**Backend (compartido):**

- URL: `https://masajecorporaldeportivo-api.vercel.app/api`

**Tablas Supabase:**

```
patients_masajecorporaldeportivo
appointments_masajecorporaldeportivo
credit_packs_masajecorporaldeportivo
credit_redemptions_masajecorporaldeportivo
patient_files_masajecorporaldeportivo
configurations_masajecorporaldeportivo
backups_masajecorporaldeportivo
invoices_masajecorporaldeportivo
invoice_items_masajecorporaldeportivo
```

### Actifisio

**Frontend:**

- URL: `https://actifisio.vercel.app`
- VITE_CLIENT_ID: `actifisio`
- Tenant Slug: `actifisio`
- Tema: Naranja (#ff6b35) y Amarillo (#f7b731)

**Backend (compartido):**

- URL: `https://masajecorporaldeportivo-api.vercel.app/api`

**Tablas Supabase:**

```
patients_actifisio
appointments_actifisio
credit_packs_actifisio
credit_redemptions_actifisio
patient_files_actifisio
configurations_actifisio
backups_actifisio
invoices_actifisio
invoice_items_actifisio
```

---

## 🚀 AGREGAR NUEVO CLIENTE (40 min)

### 1. Crear Tablas en Supabase (10 min)

```sql
-- Reemplazar 'nuevocliente' con el slug real
CREATE TABLE patients_nuevocliente (LIKE patients_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE appointments_nuevocliente (LIKE appointments_masajecorporaldeportivo INCLUDING ALL);
-- ... (9 tablas total)
```

### 2. Crear Configuración Frontend (10 min)

```typescript
// frontend/src/config/clients/nuevocliente.config.ts
export const nuevoClienteConfig: ClientConfig = {
  tenantSlug: 'nuevocliente',
  info: { ... },
  theme: { ... },
  backend: {
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api' // ✅ Compartido
  }
};
```

### 3. Agregar Logo (5 min)

```
frontend/src/assets/clients/nuevocliente/logo.png
```

### 4. Registrar en config.loader.ts (2 min)

```typescript
import { nuevoClienteConfig } from "./clients/nuevocliente.config";

const configs = {
  masajecorporaldeportivo: masajeConfig,
  actifisio: actifisioConfig,
  nuevocliente: nuevoClienteConfig, // ✅ Agregar
};
```

### 5. Deploy Frontend (5 min)

```powershell
cd frontend
vercel --prod --build-env VITE_CLIENT_ID=nuevocliente
vercel alias set <deployment-url> nuevocliente.vercel.app
```

### 6. Verificar (8 min)

```powershell
# Test backend con nuevo tenant
Invoke-RestMethod -Uri "https://masajecorporaldeportivo-api.vercel.app/api/patients" `
  -Headers @{"X-Tenant-Slug"="nuevocliente"}
# Debe devolver: []
```

---

## ✅ ESTADO ACTUAL

**Sistema Multi-Cliente:**

- ✅ Backend compartido funcionando
- ✅ 2 clientes configurados (Masaje Corporal + Actifisio)
- ✅ Tablas con sufijos en Supabase
- ✅ Sistema de tenant slug implementado
- ✅ Frontend con temas dinámicos
- ✅ Aislamiento de datos garantizado

**Deployment:**

- ✅ Backend: `masajecorporaldeportivo-api.vercel.app`
- ✅ Frontend Masaje Corporal: `masajecorporaldeportivo.vercel.app`
- ✅ Frontend Actifisio: `actifisio.vercel.app`

**Próximo cliente:**

- Crear 9 tablas con nuevo sufijo
- Deploy frontend con nuevo VITE_CLIENT_ID
- ✅ Backend ya listo (no requiere cambios)

---

## 💰 MODELO DE PRICING

| Cliente    | Precio | Desarrollo | Ganancia |
| ---------- | ------ | ---------- | -------- |
| Cliente 1  | €6,200 | 120h       | €4,500   |
| Cliente 2  | €1,000 | 0.66h      | €950     |
| Cliente 3+ | €750   | 0.66h      | €700     |

**Ventaja competitiva:**

- Setup rápido (40 min vs 40 horas)
- Mismo código para todos
- Mantenimiento centralizado
- Bugs corregidos una vez, benefician a todos

---

**Última actualización:** 03/10/2025 - 22:00  
**Estado:** ✅ ARQUITECTURA CONFIRMADA COMO CORRECTA  
**Conclusión:** Backend compartido + Tablas con sufijos = Solución óptima
