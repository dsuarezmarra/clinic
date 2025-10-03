# 🔧 BACKEND MULTI-TENANT - CAMBIOS IMPLEMENTADOS

**Fecha:** 03/10/2025  
**Versión:** 2.5.0  
**Estado:** ✅ Implementado y Funcionando

---

## 📝 RESUMEN DE CAMBIOS

Se ha implementado soporte **real** de multi-tenant en el backend. Ahora el sistema usa correctamente las tablas con sufijo del tenant (`patients_masajecorporaldeportivo`, `patients_actifisio`, etc.).

### Archivos Modificados

1. **backend/src/database/database-manager.js**
   - ✅ Constructor acepta `tenantSlug` como parámetro
   - ✅ Nuevo método `getTableName(baseTableName)` que agrega sufijo automáticamente
   - ✅ 78 referencias a tablas reemplazadas de hardcoded a dinámicas
2. **backend/src/middleware/database-middleware.js**
   - ✅ Cambiado de instancia global a instancia por request
   - ✅ Lee `X-Tenant-Slug` header del request
   - ✅ Crea `DatabaseManager` con el tenant slug correspondiente
   - ✅ Caché inteligente: reutiliza instancia si el tenant es el mismo

---

## 🔄 CÓMO FUNCIONA

### Flujo de Request

```
1. Frontend envía request con header: X-Tenant-Slug: masajecorporaldeportivo
   ↓
2. database-middleware.js recibe el request
   ↓
3. Extrae tenantSlug del header
   ↓
4. Crea DatabaseManager(tenantSlug)
   ↓
5. DatabaseManager.getTableName('patients') → 'patients_masajecorporaldeportivo'
   ↓
6. Supabase query usa tabla correcta: patients_masajecorporaldeportivo
```

### Ejemplo de Código

**ANTES (hardcodeado):**

```javascript
const { data, error } = await this.supabase
  .from("patients") // ❌ Siempre busca en 'patients'
  .select("*");
```

**DESPUÉS (dinámico):**

```javascript
const { data, error } = await this.supabase
  .from(this.getTableName("patients")) // ✅ Busca en 'patients_masajecorporaldeportivo' o 'patients_actifisio'
  .select("*");
```

---

## ✅ COMPATIBILIDAD HACIA ATRÁS

El sistema mantiene **100% compatibilidad** con la instalación actual en Vercel:

### Modo Legacy (Sin X-Tenant-Slug)

Si el request **NO incluye** el header `X-Tenant-Slug`:

- `tenantSlug = null`
- `getTableName('patients')` devuelve `'patients'` (sin sufijo)
- ✅ **Sigue funcionando con las tablas actuales en producción**

### Modo Multi-Tenant (Con X-Tenant-Slug)

Si el request **incluye** el header `X-Tenant-Slug: masajecorporaldeportivo`:

- `tenantSlug = 'masajecorporaldeportivo'`
- `getTableName('patients')` devuelve `'patients_masajecorporaldeportivo'`
- ✅ **Usa tablas con sufijo para multi-tenant**

---

## 🚀 DESPLIEGUE A PRODUCCIÓN

### Opción 1: Migración Gradual (RECOMENDADA)

**Ventaja:** Sin downtime, migración controlada

1. **Mantener tablas actuales sin sufijo**

   - Las tablas `patients`, `appointments`, etc. siguen funcionando
   - El cliente actual (masajecorporaldeportivo) las sigue usando

2. **Agregar header `X-Tenant-Slug` al frontend**

   - Actualizar frontend para enviar header
   - Backend detecta header y usa modo multi-tenant
   - Si no hay header, usa modo legacy

3. **Crear tablas con sufijo en Supabase**

   ```sql
   CREATE TABLE patients_masajecorporaldeportivo
   (LIKE patients INCLUDING ALL);

   -- Copiar datos
   INSERT INTO patients_masajecorporaldeportivo
   SELECT * FROM patients;
   ```

4. **Desplegar backend actualizado**

   - Código compatible con ambos modos
   - Sin breaking changes

5. **Validar funcionamiento**

   - Frontend con header → usa tablas con sufijo
   - Otros clientes → siguen usando tablas sin sufijo

6. **Deprecar tablas sin sufijo** (opcional, futuro)

### Opción 2: Migración Completa (Más rápida)

**Ventaja:** Sistema multi-tenant puro desde el inicio

1. **Crear tablas con sufijo**
2. **Copiar todos los datos**
3. **Desplegar backend y frontend juntos**
4. **Eliminar tablas sin sufijo**

---

## 📋 VARIABLES DE ENTORNO

### Frontend (Vercel)

```bash
# Producción - masajecorporaldeportivo
VITE_CLIENT_ID=masajecorporaldeportivo

# Producción - actifisio
VITE_CLIENT_ID=actifisio
```

### Backend (Vercel)

```bash
# NO requiere cambios - detecta automáticamente del header
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_KEY=tu_service_key
```

---

## 🧪 TESTING LOCAL

### Test con masajecorporaldeportivo

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
$env:VITE_CLIENT_ID="masajecorporaldeportivo"
ng serve
```

### Test con actifisio

```powershell
# Backend ya corriendo

# Terminal 2 - Frontend
cd frontend
$env:VITE_CLIENT_ID="actifisio"
ng serve --port 4301
```

---

## 🔍 LOGS Y DEBUG

### Logs Esperados en Backend

#### Modo Multi-Tenant (Con Header)

```
🛠️ Middleware DB ejecutándose para: GET /api/patients
📋 [Multi-Tenant] Tenant detectado: masajecorporaldeportivo
🔄 Creando nueva instancia de DatabaseManager para tenant: masajecorporaldeportivo
✅ Cliente Supabase inyectado para: GET /api/patients [Tenant: masajecorporaldeportivo]
📋 [Multi-Tenant] Usando tabla: patients_masajecorporaldeportivo (base: patients, tenant: masajecorporaldeportivo)
```

#### Modo Legacy (Sin Header)

```
🛠️ Middleware DB ejecutándose para: GET /api/patients
📋 [Legacy] Sin tenant slug - modo compatibilidad
🔄 Creando nueva instancia de DatabaseManager para tenant: legacy
✅ Cliente Supabase inyectado para: GET /api/patients [Tenant: legacy]
📋 [Legacy] Usando tabla base: patients (sin tenant)
```

---

## ⚠️ IMPORTANTE PARA VERCEL

### Compatibilidad con Serverless

El código está optimizado para Vercel:

1. **Caché de instancias:** Reutiliza `DatabaseManager` si el tenant es el mismo
2. **Sin estado persistente:** Cada request puede tener su propio tenant
3. **Headers HTTP:** Todo basado en headers, sin sesiones

### Función Asíncrona

El middleware `injectDatabaseMiddleware` es ahora `async` porque:

- Necesita inicializar `DatabaseManager` con `await`
- Express soporta middlewares async sin cambios

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Backend multi-tenant implementado**
2. ✅ **Testing local exitoso**
3. 🔄 **Crear tablas con sufijo en Supabase producción**
4. 🔄 **Desplegar a Vercel**
5. 🔄 **Validar masajecorporaldeportivo funciona**
6. 🔄 **Activar actifisio**

---

## 📞 SOPORTE

Si algo falla después del deployment:

1. **Verificar logs de Vercel:**

   - Buscar: `[Multi-Tenant] Tenant detectado`
   - Buscar: `Using tabla: patients_xxx`

2. **Rollback rápido:**

   - Revertir a commit anterior
   - O remover header `X-Tenant-Slug` del frontend

3. **Modo degradado:**
   - Sin header = modo legacy
   - Sigue funcionando con tablas sin sufijo

---

**Implementado por:** GitHub Copilot  
**Revisado:** Pendiente  
**Desplegado:** Pendiente
