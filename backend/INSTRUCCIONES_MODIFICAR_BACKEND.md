# 🔧 FASE 3: Modificar Backend para Multi-Tenant

## 📋 Resumen

Ahora que las tablas están renombradas con sufijos, necesitamos modificar el backend para:

1. Aplicar el middleware de tenant a las rutas protegidas
2. Cambiar todas las consultas para usar `req.getTable()` en lugar de nombres fijos

---

## ✅ Paso 1: Importar Middleware en bridge.js

**Archivo**: `backend/src/routes/bridge.js`

**Agregar al inicio del archivo** (después de las líneas 1-10):

```javascript
// Importar middleware de tenant
const { loadTenant } = require("../middleware/tenant");
```

---

## ✅ Paso 2: Aplicar Middleware a Rutas Protegidas

**Ubicación**: Después de la línea ~78 (antes del primer endpoint de patients)

**Agregar estas líneas**:

```javascript
// ============================================================
// MIDDLEWARE: Aplicar detección de tenant a rutas protegidas
// ============================================================
// Este middleware carga el tenant y prepara req.getTable()
// para usar nombres de tabla dinámicos según el tenant

router.use("/patients*", loadTenant);
router.use("/appointments*", loadTenant);
router.use("/credits*", loadTenant);
router.use("/reports*", loadTenant);
router.use("/backup*", loadTenant);
router.use("/meta/config*", loadTenant);

// Los endpoints /tenants y /meta/locations NO requieren tenant
// porque son endpoints públicos o de configuración global
```

---

## ✅ Paso 3: Modificar Endpoint GET /patients

**Línea actual** (~92):

```javascript
let endpoint = `patients?select=*,credit_packs(unitsRemaining)&order=firstName.asc,lastName.asc&limit=${limit}&offset=${offset}`;
```

**Cambiar a**:

```javascript
let endpoint = `${req.getTable("patients")}?select=*,${req.getTable(
  "credit_packs"
)}(unitsRemaining)&order=firstName.asc,lastName.asc&limit=${limit}&offset=${offset}`;
```

---

## ✅ Paso 4: Modificar Endpoint GET /patients/:id

**Buscar** (~117): `patients?select=*&id=eq.${id}`

**Cambiar a**: `${req.getTable('patients')}?select=*&id=eq.${id}`

**Buscar** (~131): `credit_packs?select=*&patientId=eq.${id}`

**Cambiar a**: `${req.getTable('credit_packs')}?select=*&patientId=eq.${id}`

---

## 🤖 AUTOMATIZACIÓN

Debido a que hay ~2285 líneas y múltiples endpoints, voy a crear un script
que haga estos cambios automáticamente de forma segura.

---

## 📝 Patrón de Cambios

En TODAS las consultas, cambiar:

### Patrón 1: Nombres de tabla simples

```javascript
// ❌ ANTES
`patients?select=*``appointments?select=*``credit_packs?select=*`// ✅ DESPUÉS
`${req.getTable("patients")}?select=*``${req.getTable(
  "appointments"
)}?select=*``${req.getTable("credit_packs")}?select=*`;
```

### Patrón 2: Relaciones en select

```javascript
// ❌ ANTES
`patients?select=*,credit_packs(id,type)`// ✅ DESPUÉS
`${req.getTable("patients")}?select=*,${req.getTable("credit_packs")}(id,type)`;
```

### Patrón 3: Foreign key references

```javascript
// ❌ ANTES
`appointments?select=*,patients(firstName,lastName)`// ✅ DESPUÉS
`${req.getTable("appointments")}?select=*,${req.getTable(
  "patients"
)}(firstName,lastName)`;
```

---

## ⚠️ IMPORTANTE: Endpoints que NO se modifican

Estos endpoints NO usan `req.getTable()` porque acceden a tablas globales:

1. **`/api/tenants`** - Accede directamente a tabla `tenants`
2. **`/api/meta/locations`** - Accede a datos estáticos
3. **`/api/version`** - No usa base de datos
4. **`/api/env-check`** - No usa base de datos

---

## 🚀 Próximo Paso

Voy a crear un script automatizado que:

1. Lee el archivo `bridge.js`
2. Detecta todos los patrones de consultas a tablas
3. Los reemplaza por versiones dinámicas con `req.getTable()`
4. Guarda el archivo modificado
5. Genera un reporte de cambios

¿Procedemos con la automatización? 🤖
