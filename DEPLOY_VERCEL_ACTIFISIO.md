# 🚀 DEPLOYMENT ACTIFISIO - URL Estática actifisio.vercel.app

**Cliente:** Actifisio  
**URL:** https://actifisio.vercel.app  
**Fecha:** 03/10/2025

---

## 📋 PASOS PARA DEPLOYMENT VIA VERCEL CLI

### 1. Instalar Vercel CLI (si no lo tienes)

```powershell
npm install -g vercel
```

### 2. Login en Vercel

```powershell
vercel login
```

### 3. Deployment del Frontend Actifisio

```powershell
# Ir a la carpeta frontend
cd c:\Users\dsuarez1\git\clinic\frontend

# Deploy con configuración específica
vercel --prod `
  --name actifisio `
  --env VITE_CLIENT_ID=actifisio `
  --build-env VITE_CLIENT_ID=actifisio `
  --alias actifisio.vercel.app
```

**Alternativa paso a paso:**

```powershell
# 1. Iniciar deployment
cd c:\Users\dsuarez1\git\clinic\frontend
vercel

# Cuando pregunte:
# - Set up and deploy? → Y
# - Which scope? → Selecciona tu cuenta
# - Link to existing project? → N (es un proyecto nuevo)
# - What's your project's name? → actifisio
# - In which directory is your code located? → ./ (presionar Enter)
# - Want to override the settings? → Y

# Override settings:
# - Build Command? → npm run build:actifisio
# - Output Directory? → dist/clinic-frontend/browser
# - Development Command? → ng serve

# 2. Agregar variables de entorno
vercel env add VITE_CLIENT_ID
# Valor: actifisio
# Environment: Production

# 3. Deploy a producción
vercel --prod

# 4. Configurar alias (URL estática)
vercel alias set <deployment-url> actifisio.vercel.app
```

---

## ⚙️ CONFIGURACIÓN MANUAL EN VERCEL DASHBOARD

Si prefieres usar la interfaz web:

### 1. Crear Nuevo Proyecto

1. Ir a https://vercel.com/new
2. Click en "Add New Project"
3. Seleccionar "Import Git Repository" o subir carpeta `frontend`
4. Nombre del proyecto: **actifisio**

### 2. Build & Development Settings

```
Framework Preset: Other
Root Directory: ./
Build Command: npm run build:actifisio
Output Directory: dist/clinic-frontend/browser
Install Command: npm install
Development Command: ng serve
```

### 3. Environment Variables

**Production:**
```
Name: VITE_CLIENT_ID
Value: actifisio
```

**Importante:** NO agregar variables para Preview o Development (solo Production)

### 4. Domains (Después del primer deploy)

1. Ir a Project Settings → Domains
2. Click "Add"
3. Ingresar: `actifisio.vercel.app`
4. Vercel automáticamente configurará el dominio

---

## 🔧 ACTUALIZAR actifisio.config.ts CON URL CORRECTA

Necesitamos actualizar la configuración del cliente para usar las URLs correctas:

```typescript
// frontend/src/config/clients/actifisio.config.ts

export const actifisioConfig: ClientConfig = {
  id: 'actifisio',
  tenantSlug: 'actifisio',
  name: 'Actifisio',
  shortName: 'Actifisio',
  
  theme: {
    primaryColor: '#ff6b35',      // Naranja
    secondaryColor: '#f7b731',    // Amarillo
    headerGradient: 'linear-gradient(135deg, #ff6b35 0%, #f7b731 100%)',
    buttonColor: '#ff6b35',
    buttonHoverColor: '#e55a2b',
    accentColor: '#f7b731',
    textColor: '#2c3e50',
    backgroundColor: '#ffffff'
  },
  
  assets: {
    logo: '/assets/clients/actifisio/logo.png',
    favicon: '/assets/clients/actifisio/favicon.ico'
  },
  
  backend: {
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api' // 🔄 Backend compartido
  },
  
  contact: {
    email: 'contacto@actifisio.com',
    phone: '+34 XXX XXX XXX',
    address: 'Dirección de Actifisio'
  },
  
  features: {
    enableCalendar: true,
    enablePatientFiles: true,
    enableCreditPacks: true,
    enableInvoicing: true,
    enableBackups: true,
    enableReports: true
  },
  
  seo: {
    title: 'Actifisio - Gestión de Fisioterapia',
    description: 'Sistema de gestión para clínica de fisioterapia Actifisio',
    keywords: 'fisioterapia, actifisio, gestión clínica, citas'
  }
};
```

---

## 📝 SCRIPT DE BUILD ESPECÍFICO

Verificar que en `package.json` exista:

```json
{
  "scripts": {
    "build:actifisio": "ng build --configuration production"
  }
}
```

Si no existe, agregar:

```powershell
# Editar package.json y agregar el script
# O ejecutar directamente:
npm run build -- --configuration production
```

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### 1. Verificar URL

```powershell
# Test básico
curl https://actifisio.vercel.app

# Debería devolver HTML de la app
```

### 2. Verificar Variable de Entorno

Abrir: https://actifisio.vercel.app

**Console del navegador debe mostrar:**
```
🏢 ClientConfigService inicializado
   Cliente: Actifisio
   Tenant Slug: actifisio
   Tema primario: #ff6b35
```

### 3. Verificar Header HTTP

En la consola del navegador (Network tab):
```
Request URL: https://masajecorporaldeportivo-api.vercel.app/api/patients
Request Headers:
  X-Tenant-Slug: actifisio  ✅
```

### 4. Verificar Tema Visual

- ✅ Logo de Actifisio (naranja/amarillo)
- ✅ Colores: Naranja primario, amarillo secundario
- ✅ Título: "Actifisio"

---

## 🔄 REDEPLOY (Si necesitas actualizar)

```powershell
# Opción 1: Redeploy automático desde CLI
cd c:\Users\dsuarez1\git\clinic\frontend
vercel --prod

# Opción 2: Desde Dashboard
# Ir a https://vercel.com/dashboard
# Seleccionar proyecto "actifisio"
# Click en "Redeploy" en el último deployment

# Opción 3: Forzar rebuild
vercel --prod --force
```

---

## 🌐 URLS FINALES

### Actifisio
- **URL Principal:** https://actifisio.vercel.app
- **URL de Deployment:** https://actifisio-<hash>.vercel.app (generada automáticamente)
- **Backend API:** https://masajecorporaldeportivo-api.vercel.app/api (compartido)

### Masajecorporaldeportivo (existente)
- **URL Principal:** https://masajecorporaldeportivo.vercel.app
- **Backend API:** https://masajecorporaldeportivo-api.vercel.app/api (compartido)

---

## 🗄️ TABLAS EN SUPABASE (Ya creadas)

```sql
-- Ejecutado previamente
✅ patients_actifisio
✅ appointments_actifisio
✅ credit_packs_actifisio
✅ credit_redemptions_actifisio
✅ patient_files_actifisio
✅ configurations_actifisio
✅ backups_actifisio
✅ invoices_actifisio
✅ invoice_items_actifisio
```

Todas con RLS habilitado y políticas configuradas.

---

## 🚨 TROUBLESHOOTING

### Error: "Project already exists"

```powershell
# Listar proyectos
vercel ls

# Si existe, hacer link
vercel link

# Luego deploy
vercel --prod
```

### Error: "VITE_CLIENT_ID is not defined"

1. Ir a Vercel Dashboard → Project Settings → Environment Variables
2. Agregar: `VITE_CLIENT_ID` = `actifisio` (Production only)
3. Redeploy

### Error: "Could not find table 'patients_actifisio'"

Las tablas YA están creadas. Verificar:
1. Backend recibe header `X-Tenant-Slug: actifisio`
2. Backend logs muestran: "Tenant detectado: actifisio"
3. Supabase tiene las tablas con sufijo

---

## 📊 ARQUITECTURA FINAL

```
┌─────────────────────────────────────────┐
│  https://actifisio.vercel.app           │
│  VITE_CLIENT_ID=actifisio               │
│  Tema: Naranja/Amarillo                 │
└────────────┬────────────────────────────┘
             │ X-Tenant-Slug: actifisio
             ▼
┌─────────────────────────────────────────┐
│  Backend Compartido                     │
│  https://masajecorporaldeportivo-api... │
│  Middleware detecta: actifisio          │
│  getTableName('patients')               │
│    → 'patients_actifisio'               │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│  Supabase PostgreSQL                    │
│  - patients_actifisio (0 registros)     │
│  - appointments_actifisio (0 registros) │
│  - ... (9 tablas vacías)                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  https://masajecorporaldeportivo.vercel │
│  VITE_CLIENT_ID=masajecorporaldeportivo │
│  Tema: Azul/Púrpura                     │
└────────────┬────────────────────────────┘
             │ X-Tenant-Slug: masajecorporaldeportivo
             ▼
         (Mismo backend)
             ▼
┌─────────────────────────────────────────┐
│  Supabase PostgreSQL                    │
│  - patients_masajecorporaldeportivo     │
│  - appointments_masajecorporaldeportivo │
│  - ... (9 tablas con datos)             │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] Vercel CLI instalado
- [ ] Login en Vercel completado
- [ ] Proyecto "actifisio" creado
- [ ] Variable `VITE_CLIENT_ID=actifisio` configurada
- [ ] Build command: `npm run build:actifisio`
- [ ] Alias `actifisio.vercel.app` configurado
- [ ] Deployment exitoso
- [ ] URL accesible: https://actifisio.vercel.app
- [ ] Console muestra: "Tenant Slug: actifisio"
- [ ] Header `X-Tenant-Slug: actifisio` se envía
- [ ] Tema naranja/amarillo visible
- [ ] Logo de Actifisio cargado

---

**Estado:** ✅ Listo para ejecutar  
**Tiempo estimado:** 10-15 minutos  
**Comando principal:**
```powershell
cd c:\Users\dsuarez1\git\clinic\frontend
vercel --prod --name actifisio --env VITE_CLIENT_ID=actifisio --alias actifisio.vercel.app
```
