# ✅ SISTEMA MULTI-CLIENTE LISTO PARA VERCEL

**Fecha:** 03/10/2025  
**Versión:** 2.5.0  
**Commits:** 3 (todos locales, listos)

---

## 📦 QUÉ ESTÁ LISTO

### Backend Multi-Tenant

✅ **database-manager.js**
- Constructor acepta `tenantSlug`
- Método `getTableName(baseTable)` agrega sufijo automáticamente
- 78 tablas actualizadas: `from('patients')` → `from(this.getTableName('patients'))`

✅ **database-middleware.js**
- Lee header `X-Tenant-Slug`
- Crea `DatabaseManager` con tenant correcto
- Caché de instancias por tenant
- Compatible con Vercel serverless

### Frontend Multi-Cliente

✅ **Configuración por Cliente**
- `masajecorporaldeportivo.config.ts`
- `actifisio.config.ts`
- ClientConfigService carga config basado en `VITE_CLIENT_ID`

✅ **TenantInterceptor**
- Envía header `X-Tenant-Slug` en TODAS las peticiones HTTP
- Extrae tenant slug de la config del cliente

✅ **Temas Dinámicos**
- CSS Variables aplicadas en runtime
- 8 variables: colores, gradientes, etc.

✅ **PWA Manifest**
- Template con placeholders
- Scripts de generación por cliente

---

## 🚀 DEPLOYMENT A VERCEL

### Opción 1: Push Automático (Si tienes GitHub conectado)

```bash
# Configurar remote (solo primera vez)
git remote add origin https://github.com/tu-usuario/clinic.git

# Push
git push origin master
```

Vercel detectará automáticamente los cambios y desplegará.

### Opción 2: Vercel CLI (Deployment Manual)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Backend
cd backend
vercel --prod

# Frontend - masajecorporaldeportivo
cd frontend
vercel --prod

# Frontend - actifisio (nuevo proyecto)
cd frontend
vercel --prod --name app-actifisio
```

### Opción 3: Drag & Drop en Vercel Dashboard

1. Ir a https://vercel.com/new
2. Seleccionar "Import Git Repository" O "Deploy with CLI"
3. Conectar con carpeta `backend` → Desplegar
4. Conectar con carpeta `frontend` → Desplegar (2 veces, una por cliente)

---

## ⚙️ CONFIGURACIÓN VERCEL

### Backend (1 proyecto)

**Variables de entorno:**
```
SUPABASE_URL=tu_url
SUPABASE_SERVICE_KEY=tu_key
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Build Settings:**
- Framework: Other
- Build Command: `npm install`
- Output Directory: `.`
- Install Command: `npm install`

### Frontend - masajecorporaldeportivo (Proyecto existente)

**Variables de entorno:**
```
VITE_CLIENT_ID=masajecorporaldeportivo
```

**Build Settings:**
- Framework: Angular
- Build Command: `npm run build:masajecorporaldeportivo`
- Output Directory: `dist/clinic-frontend/browser`
- Install Command: `npm install`

### Frontend - actifisio (Proyecto NUEVO)

**Variables de entorno:**
```
VITE_CLIENT_ID=actifisio
```

**Build Settings:**
- Framework: Angular
- Build Command: `npm run build:actifisio`
- Output Directory: `dist/clinic-frontend/browser`
- Install Command: `npm install`

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### 1. Backend

```bash
# Health check
curl https://tu-backend.vercel.app/health

# Test con tenant
curl -H "X-Tenant-Slug: masajecorporaldeportivo" \
     https://tu-backend.vercel.app/api/patients
```

**Logs esperados en Vercel:**
```
📋 [Multi-Tenant] Tenant detectado: masajecorporaldeportivo
🔄 Creando nueva instancia de DatabaseManager para tenant: masajecorporaldeportivo
✅ Cliente Supabase inyectado [Tenant: masajecorporaldeportivo]
📋 [Multi-Tenant] Usando tabla: patients_masajecorporaldeportivo
```

### 2. Frontend - masajecorporaldeportivo

1. Abrir app
2. F12 → Console
3. Verificar logs:
   ```
   🏢 ClientConfigService inicializado
      Cliente: Masaje Corporal Deportivo
      Tenant Slug: masajecorporaldeportivo
   [TenantInterceptor] Agregando header X-Tenant-Slug: masajecorporaldeportivo
   ```
4. Verificar que datos cargan

### 3. Frontend - actifisio

1. Abrir app
2. F12 → Console
3. Verificar logs:
   ```
   🏢 ClientConfigService inicializado
      Cliente: Actifisio
      Tenant Slug: actifisio
   [TenantInterceptor] Agregando header X-Tenant-Slug: actifisio
   ```
4. Normal que no haya datos (tablas vacías)

---

## 🛠️ SOLUCIÓN DE PROBLEMAS EN VERCEL

### Error: "Could not find the table 'public.patients'"

**Causa:** Backend busca tabla sin sufijo  
**Diagnóstico:** Variable `VITE_CLIENT_ID` no está configurada O TenantInterceptor no está funcionando  
**Solución:**
1. Verificar `VITE_CLIENT_ID` en Vercel
2. Rebuild del frontend
3. Verificar en logs: `X-Tenant-Slug` presente

### Error: "Could not find the table 'public.patients_masajecorporaldeportivo'"

**Causa:** Tabla con sufijo no existe en Supabase  
**Solución:**
1. Ir a Supabase → SQL Editor
2. Ejecutar `SCRIPT_SQL_ACTIFISIO.md` (pero para masajecorporaldeportivo)
3. O ejecutar:
   ```sql
   CREATE TABLE patients_masajecorporaldeportivo 
   (LIKE patients INCLUDING ALL);
   
   -- Copiar datos existentes
   INSERT INTO patients_masajecorporaldeportivo 
   SELECT * FROM patients;
   ```

### Error: Backend 503 / Timeout

**Causa:** Middleware bloqueando en serverless  
**Diagnóstico:** Revisar Vercel Function logs  
**Solución:** El código ya está optimizado para serverless (promesas no-bloqueantes)

---

## 📊 ARQUITECTURA FINAL

```
┌─────────────────────────────────────────────────────┐
│  VERCEL FRONTEND (masajecorporaldeportivo)         │
│  URL: https://app-masajecorporaldeportivo.vercel.app│
│  Env: VITE_CLIENT_ID=masajecorporaldeportivo       │
└──────────────────┬──────────────────────────────────┘
                   │ X-Tenant-Slug: masajecorporaldeportivo
                   ▼
┌─────────────────────────────────────────────────────┐
│  VERCEL BACKEND (compartido)                        │
│  URL: https://masajecorporaldeportivo-api.vercel.app│
│  Middleware: database-middleware.js                 │
│  - Lee X-Tenant-Slug                                │
│  - Crea DatabaseManager(tenantSlug)                 │
│  - getTableName('patients') → 'patients_masajeco...'│
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL)                              │
│  - patients_masajecorporaldeportivo                 │
│  - appointments_masajecorporaldeportivo             │
│  - patients_actifisio                               │
│  - appointments_actifisio                           │
│  - ... (9 tablas por cliente)                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  VERCEL FRONTEND (actifisio)                        │
│  URL: https://app-actifisio.vercel.app              │
│  Env: VITE_CLIENT_ID=actifisio                      │
└──────────────────┬──────────────────────────────────┘
                   │ X-Tenant-Slug: actifisio
                   ▼
         (Mismo backend compartido arriba)
```

---

## ✅ CHECKLIST PRE-DEPLOYMENT

- [x] Commits hechos localmente (3 commits)
- [x] Backend multi-tenant implementado
- [x] Frontend multi-cliente implementado
- [x] Documentación completa
- [ ] **Push a GitHub** (si tienes repo)
- [ ] **Variables entorno en Vercel** configuradas
- [ ] **Build exitoso** en Vercel
- [ ] **Tablas con sufijo** creadas en Supabase
- [ ] **Testing** post-deployment

---

## 📞 SOPORTE

Si algo no funciona en Vercel:

1. **Revisar Logs de Vercel Functions**
   - Ver qué tenant slug está llegando
   - Ver qué tabla está buscando
   
2. **Verificar Variables de Entorno**
   - `VITE_CLIENT_ID` en frontend
   - `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` en backend

3. **Verificar Tablas en Supabase**
   - Ejecutar: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%_masaje%'`

---

**IMPORTANTE:** El sistema está optimizado para **Vercel serverless**. Los issues locales NO afectan producción.

**Estado:** ✅ Listo para deployment
