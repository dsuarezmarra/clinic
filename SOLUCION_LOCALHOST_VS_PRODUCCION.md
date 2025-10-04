# ⚠️ PROBLEMA DETECTADO: Modo Desarrollo vs Producción

**Fecha:** 04/10/2025  
**Estado:** ⚠️ CONFUSIÓN DE ENTORNOS

---

## 🔍 DIAGNÓSTICO DEL ERROR

### Problema Detectado en Logs

```javascript
✅ Cliente cargado: Masaje Corporal Deportivo  // ❌ INCORRECTO
✅ Tenant Slug: masajecorporaldeportivo        // ❌ INCORRECTO
❌ [TenantInterceptor] Agregando header X-Tenant-Slug: actifisio  // ⚠️ CONFUSO
❌ GET http://localhost:3000/api/patients/...  // ❌ Backend local no corriendo
```

**Causa Raíz:**
Estás ejecutando el frontend de Actifisio en **modo desarrollo local** (`localhost:4201`), pero:

1. El backend local no estaba corriendo
2. La configuración apuntaba al backend de Vercel
3. Hay confusión entre `masajecorporaldeportivo` y `actifisio`

---

## ✅ SOLUCIONES

### Solución 1: Usar Producción (RECOMENDADO para testing)

**Para probar Actifisio desplegado:**

1. **Abre la URL de producción:**

   ```
   https://actifisio.vercel.app
   ```

2. **Verifica en Console:**

   - ✅ Sin errores `localhost:3000`
   - ✅ `Cliente cargado: Actifisio`
   - ✅ `Tenant Slug: actifisio`
   - ✅ Peticiones a: `https://masajecorporaldeportivo-api.vercel.app/api`

3. **Crea un paciente de prueba**

4. **Verifica aislamiento:**
   - Abre: `https://masajecorporaldeportivo.vercel.app`
   - Verifica que NO aparezca el paciente de Actifisio

**VENTAJAS:**

- ✅ No requiere backend local
- ✅ Configuración correcta automática
- ✅ Misma experiencia que usuarios finales
- ✅ No hay conflictos de variables de entorno

---

### Solución 2: Desarrollo Local Completo

**Para desarrollar localmente con Actifisio:**

#### Paso 1: Levantar Backend Local

```powershell
# Terminal 1: Backend
cd backend
npm run dev
# Backend corriendo en http://localhost:3000
```

#### Paso 2: Configurar Frontend para Local

**Archivo:** `frontend/src/config/clients/actifisio.config.ts`

```typescript
backend: {
  // apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'  // Producción
  apiUrl: 'http://localhost:3000/api'  // ✅ Desarrollo local
},
```

**✅ YA ESTÁ CAMBIADO** en el código.

#### Paso 3: Levantar Frontend con CLIENT_ID

```powershell
# Terminal 2: Frontend Actifisio
cd frontend
$env:VITE_CLIENT_ID="actifisio"
ng serve --port 4201
```

**✅ YA ESTÁ CORRIENDO** en `http://localhost:4201`

#### Paso 4: Probar

1. **Abre:** `http://localhost:4201`
2. **Verifica Console:**

   - ✅ `Cliente cargado: Actifisio`
   - ✅ `Tenant Slug: actifisio`
   - ✅ `[TenantInterceptor] X-Tenant-Slug: actifisio`
   - ✅ Peticiones a: `http://localhost:3000/api`

3. **Crea un paciente de prueba**

4. **Verifica en Supabase:**
   ```sql
   SELECT * FROM patients_actifisio
   ORDER BY "createdAt" DESC
   LIMIT 5;
   ```

**VENTAJAS:**

- ✅ Hot-reload para desarrollo
- ✅ Debugging más fácil
- ✅ No gasta deployments de Vercel

**DESVENTAJAS:**

- ⚠️ Requiere 2 terminales corriendo
- ⚠️ Debes recordar cambiar apiUrl antes de hacer commit
- ⚠️ Variables de entorno pueden confundir

---

## 📋 ESTADO ACTUAL (04/10/2025)

### ✅ Backend Local

```
Status: ✅ CORRIENDO
URL: http://localhost:3000
Terminal: 03a64a38-c1bd-4ffe-a02c-e5d22f69fa45
```

### ✅ Frontend Actifisio Local

```
Status: ✅ CORRIENDO
URL: http://localhost:4201
CLIENT_ID: actifisio
Terminal: 4c0b1894-8360-4e13-9b18-857245f8cdd3
API URL: http://localhost:3000/api (local)
```

### ⚙️ Configuración Aplicada

- ✅ `actifisio.config.ts` apunta a localhost
- ✅ Variable `VITE_CLIENT_ID=actifisio` establecida
- ✅ Backend escuchando en puerto 3000
- ✅ Frontend corriendo en puerto 4201

---

## 🧪 TESTING AHORA (Desarrollo Local)

### Test 1: Verificar Configuración

1. **Abre:** `http://localhost:4201`
2. **Abre Console (F12)**
3. **Busca estos logs:**

   ```
   ✅ Configuración cargada para cliente: actifisio
   ✅ ClientConfigService inicializado - Cliente: Actifisio
   ✅ Tenant Slug: actifisio
   ✅ [TenantInterceptor] Agregando header X-Tenant-Slug: actifisio
   ```

4. **Verifica Network:**
   - Peticiones deben ir a: `http://localhost:3000/api/*`
   - Status: `200 OK` (no `ERR_CONNECTION_REFUSED`)
   - Request Headers: `X-Tenant-Slug: actifisio`

### Test 2: Crear Paciente

1. **Ve a "Pacientes"**
2. **Click "Nuevo Paciente"**
3. **Completa:**

   - Nombre: `Test Local`
   - Apellido: `Actifisio Dev`
   - DNI: `11111111A`
   - Teléfono: `600111111`
   - Email: `test@actifisio.local`

4. **Guardar**
5. **Verificar:**
   - ✅ Se guarda sin errores
   - ✅ Aparece en la lista

### Test 3: Crear Sesión (El que falló antes)

1. **Click en el paciente creado**
2. **Ve a pestaña "Sesiones"**
3. **Click "Agregar Sesión"**
4. **Completa:**

   - Fecha: Hoy
   - Precio: 40
   - Notas: "Test sesión desarrollo"

5. **Guardar**
6. **Verificar Console:**
   - ✅ Sin errores `ERR_CONNECTION_REFUSED`
   - ✅ `POST http://localhost:3000/api/appointments` → `200 OK`

### Test 4: Verificar en Supabase

```sql
-- Ver paciente creado
SELECT "firstName", "lastName", dni, phone, email
FROM patients_actifisio
WHERE "firstName" = 'Test Local';

-- Ver sesiones del paciente
SELECT a.id, a.date, a.price, a.notes, p."firstName", p."lastName"
FROM appointments_actifisio a
JOIN patients_actifisio p ON a."patientId" = p.id
WHERE p."firstName" = 'Test Local';
```

---

## ⚠️ IMPORTANTE: Antes de Hacer Commit

**Si cambias `actifisio.config.ts` para desarrollo local, NO OLVIDES:**

```typescript
// ❌ NO commitear esto:
backend: {
  apiUrl: 'http://localhost:3000/api'  // Desarrollo local
},

// ✅ Cambiar de vuelta antes de commit:
backend: {
  apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api'  // Producción
},
```

**Automatización recomendada:**

Crear archivo `.env.local` (ignorado por git):

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:3000/api
```

Y modificar `actifisio.config.ts`:

```typescript
backend: {
  apiUrl: import.meta.env.VITE_API_URL || 'https://masajecorporaldeportivo-api.vercel.app/api'
},
```

---

## 🎯 RECOMENDACIÓN

**Para testing de Actifisio:**

- ✅ Usa **Solución 1** (producción): `https://actifisio.vercel.app`

**Para desarrollo activo:**

- ✅ Usa **Solución 2** (local) con ambos servidores corriendo

---

## 📝 PRÓXIMOS PASOS

1. **AHORA (2 min):**

   - Abre `http://localhost:4201`
   - Verifica que ya NO hay errores `ERR_CONNECTION_REFUSED`
   - Intenta crear sesión de nuevo

2. **Testing Completo (10 min):**

   - Crear paciente
   - Crear sesión/bono
   - Agregar archivo
   - Crear cita en agenda

3. **Si todo funciona localmente (5 min):**
   - **Revertir cambio** en `actifisio.config.ts` (volver a apiUrl de Vercel)
   - Commit y push
   - Probar en producción: `https://actifisio.vercel.app`

---

**¿Qué obtienes ahora al abrir `http://localhost:4201`?** ¿Ya no hay errores de conexión? 🚀
