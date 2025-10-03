# 🔍 AUDITORÍA MULTI-TENANT - BRIDGE.JS

**Fecha**: 3 de octubre de 2025  
**Versión Bridge**: 2.3.0

## 📊 ANÁLISIS DEL ESQUEMA SQL

### ✅ Tablas CON sufijo `_masajecorporaldeportivo`:

- `appointments_masajecorporaldeportivo`
- `credit_packs_masajecorporaldeportivo`
- `credit_redemptions_masajecorporaldeportivo`
- `patients_masajecorporaldeportivo`
- `backups_masajecorporaldeportivo`
- `configurations_masajecorporaldeportivo`

### ❌ Tablas SIN sufijo (INCONSISTENCIA DETECTADA):

- **`patient_files`** - Tiene FK a `patients_masajecorporaldeportivo`
- **`invoices`** - Tiene FK a `patients_masajecorporaldeportivo`
- **`invoice_items`** - Tiene FK a `appointments_masajecorporaldeportivo` e `invoices`

### ✅ Tablas de sistema (correcto sin sufijo):

- `tenants` - Tabla de configuración multi-tenant

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. ❌ **INCONSISTENCIA EN ESQUEMA SQL**

#### Problema:

Las tablas `patient_files`, `invoices`, `invoice_items` **NO tienen sufijo** pero tienen **foreign keys** que apuntan a tablas **CON sufijo**. Esto viola la integridad del sistema multi-tenant.

#### Impacto:

- **ALTO** - Cuando se cree un segundo tenant, todos los archivos/facturas se mezclarán entre tenants
- Los archivos del `paciente_1` del tenant A serían visibles para el tenant B
- Las facturas se compartirían entre todos los clientes

#### Solución Requerida:

**OPCIÓN 1 (RECOMENDADA):** Renombrar las tablas en SQL para que tengan sufijo:

```sql
-- Renombrar tablas
ALTER TABLE patient_files RENAME TO patient_files_masajecorporaldeportivo;
ALTER TABLE invoices RENAME TO invoices_masajecorporaldeportivo;
ALTER TABLE invoice_items RENAME TO invoice_items_masajecorporaldeportivo;

-- Actualizar foreign keys
ALTER TABLE patient_files_masajecorporaldeportivo
  DROP CONSTRAINT patient_files_patientId_fkey,
  ADD CONSTRAINT patient_files_patientId_fkey
    FOREIGN KEY (patientId) REFERENCES patients_masajecorporaldeportivo(id);

ALTER TABLE invoices_masajecorporaldeportivo
  DROP CONSTRAINT invoices_patientId_fkey,
  ADD CONSTRAINT invoices_patientId_fkey
    FOREIGN KEY (patientId) REFERENCES patients_masajecorporaldeportivo(id);

ALTER TABLE invoice_items_masajecorporaldeportivo
  DROP CONSTRAINT invoice_items_appointmentId_fkey,
  DROP CONSTRAINT invoice_items_invoiceId_fkey,
  ADD CONSTRAINT invoice_items_appointmentId_fkey
    FOREIGN KEY (appointmentId) REFERENCES appointments_masajecorporaldeportivo(id),
  ADD CONSTRAINT invoice_items_invoiceId_fkey
    FOREIGN KEY (invoiceId) REFERENCES invoices_masajecorporaldeportivo(id);
```

**OPCIÓN 2 (NO RECOMENDADA):** Modificar el código para tratar estas tablas como compartidas y añadir columna `tenant_id`.

---

### 2. ❌ **CÓDIGO USA TABLA CONFIGURATIONS INCORRECTAMENTE**

#### Problema:

El código tiene esta línea **11 veces**:

```javascript
const endpoint = `${req.getTable("configurations")}?select=*&limit=1`;
```

Pero la tabla SQL usa la columna **`key`** como PRIMARY KEY, no `id`:

```sql
CREATE TABLE public.configurations_masajecorporaldeportivo (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT configurations_masajecorporaldeportivo_pkey PRIMARY KEY (key)
);
```

#### Líneas afectadas en bridge.js:

- Línea 1313, 1353, 1359, 1367, 1404, 1409, 1416, 1436, 1461, 1485, 1492

#### Impacto:

- **MEDIO** - Las queries que buscan por `id=eq.${existing[0].id}` fallarán
- Las inserts/updates pueden crear registros duplicados

#### Solución:

```javascript
// ❌ ANTES
const checkEndpoint = `${req.getTable("configurations")}?select=id&limit=1`;
const updateEndpoint = `${req.getTable("configurations")}?id=eq.${
  existing[0].id
}`;

// ✅ DESPUÉS
const checkEndpoint = `${req.getTable("configurations")}?select=key&limit=1`;
const updateEndpoint = `${req.getTable("configurations")}?key=eq.${
  existing[0].key
}`;
```

---

### 3. ❌ **ENDPOINTS DE PATIENT_FILES SIN req.getTable()**

#### Problema:

Los endpoints de archivos de pacientes usan hardcoded `'patient_files'` en lugar de `req.getTable('patient_files')`.

#### Líneas afectadas:

- Línea 194: `const endpoint = 'patient_files?patientId=eq.${patientId}&select=*&order=createdAt.desc';`
- Línea 223: `const { data } = await supabaseFetch('patient_files', {...});`
- Línea 240: `const endpoint = 'patient_files?id=eq.${fileId}';`
- Línea 1163: `const endpoint = 'patient_files?patientId=eq.${patientId}&select=*&order=createdAt.desc';`
- Línea 1206: `const { data } = await supabaseFetch('patient_files', {...});`
- Línea 1223: `const endpoint = 'patient_files?id=eq.${fileId}&select=originalName,mimeType,storedPath';`
- Línea 1258: `const endpoint = 'patient_files?id=eq.${fileId}&select=originalName,mimeType,storedPath';`
- Línea 1293: `const endpoint = 'patient_files?id=eq.${fileId}';`
- Línea 1641: `supabaseFetch('patient_files?select=*').then(r => r.data || [])`
- Línea 1808: `supabaseFetch('patient_files?id=gt.0', { method: 'DELETE' })`
- Línea 1876: `const { error: filesError } = await supabaseFetch('patient_files', {...});`

#### Impacto:

- **ALTO** - Fallará cuando existan múltiples tenants
- Los archivos no se guardarán correctamente

#### Solución:

```javascript
// ❌ ANTES
const endpoint = `patient_files?patientId=eq.${patientId}`;
const { data } = await supabaseFetch('patient_files', {...});

// ✅ DESPUÉS
const endpoint = `${req.getTable('patient_files')}?patientId=eq.${patientId}`;
const { data } = await supabaseFetch(req.getTable('patient_files'), {...});
```

---

### 4. ⚠️ **MIDDLEWARE loadTenant NO SE APLICA A PATIENT_FILES**

#### Problema:

El middleware tenant se aplica así:

```javascript
router.use("/patients*", loadTenant);
```

Pero los endpoints de patient_files son:

```javascript
router.get('/patients/:patientId/files', ...);
```

Esto **debería funcionar** porque `/patients/:patientId/files` coincide con `/patients*`, pero es importante verificarlo.

---

## 📋 CHECKLIST DE CORRECCIONES

### SQL (Base de Datos) - PRIORIDAD MÁXIMA

- [ ] Renombrar `patient_files` → `patient_files_masajecorporaldeportivo`
- [ ] Renombrar `invoices` → `invoices_masajecorporaldeportivo`
- [ ] Renombrar `invoice_items` → `invoice_items_masajecorporaldeportivo`
- [ ] Actualizar todas las foreign keys
- [ ] Verificar que no haya queries hardcoded en triggers/functions SQL

### Código Bridge.js

- [ ] Reemplazar 11 referencias a `configurations` que usan `id` por `key`
- [ ] Reemplazar 11 referencias hardcoded a `patient_files` por `req.getTable('patient_files')`
- [ ] Verificar que middleware `loadTenant` se aplica a todos los endpoints necesarios
- [ ] Añadir logging de `req.tableSuffix` en endpoints críticos para debugging
- [ ] Actualizar VERSION del bridge a 2.4.0

### Testing

- [ ] Crear un segundo tenant de prueba
- [ ] Verificar aislamiento de datos entre tenants
- [ ] Probar CRUD de patient_files con ambos tenants
- [ ] Probar generación de facturas con ambos tenants
- [ ] Probar exportación CSV con ambos tenants
- [ ] Probar backups/restore con ambos tenants

---

## 🎯 RECOMENDACIONES

### Arquitectura Multi-Tenant

1. **TODAS las tablas de datos de negocio deben tener sufijo**
2. **SOLO las tablas de sistema/configuración no tienen sufijo**: `tenants`
3. **Usar SIEMPRE `req.getTable()`** en lugar de strings hardcoded
4. **Documentar claramente** qué tablas son compartidas vs. por tenant

### Mejoras de Seguridad

1. Añadir RLS (Row Level Security) en PostgreSQL
2. Validar que `req.tableSuffix` nunca sea `null` en endpoints críticos
3. Añadir tests de aislamiento de datos entre tenants

### Logging y Debugging

```javascript
// Añadir al inicio de cada endpoint:
console.log(
  `🔍 [${req.path}] tenant: ${req.tenantSlug}, suffix: ${req.tableSuffix}`
);
```

---

## 🚀 PLAN DE ACCIÓN INMEDIATO

### Paso 1: Decisión Arquitectural

**DECISIÓN REQUERIDA:** ¿Las tablas `patient_files`, `invoices`, `invoice_items` deben:

- A) Tener sufijo (recomendado) ✅
- B) Ser compartidas entre tenants ❌

### Paso 2: Si se elige A (recomendado)

1. Ejecutar script SQL para renombrar tablas
2. Actualizar código bridge.js (11 líneas de patient_files)
3. Actualizar código bridge.js (11 líneas de configurations)
4. Desplegar y probar

### Paso 3: Testing Multi-Tenant

1. Crear tenant "cliente2" en tabla `tenants`
2. Crear tablas con sufijo `_cliente2`
3. Probar aislamiento de datos

---

## 📝 NOTAS ADICIONALES

### Tablas que YA están correctas:

- ✅ `appointments_masajecorporaldeportivo`
- ✅ `credit_packs_masajecorporaldeportivo`
- ✅ `credit_redemptions_masajecorporaldeportivo`
- ✅ `patients_masajecorporaldeportivo`
- ✅ `backups_masajecorporaldeportivo`
- ✅ `tenants` (sin sufijo, correcto)

### Helpers existentes (funcionan bien):

```javascript
getTablePropertyKey(baseTableName, suffix);
getEmbeddedProperty(obj, baseTableName, suffix);
deleteEmbeddedProperty(obj, baseTableName, suffix);
```

---

**CONCLUSIÓN:** El sistema está 80% preparado para multi-tenant. Las tablas principales funcionan correctamente. Los problemas encontrados son:

1. **3 tablas sin sufijo** (patient_files, invoices, invoice_items)
2. **11 usos incorrectos de `configurations.id`** (debe ser `configurations.key`)
3. **11 referencias hardcoded** a `patient_files`

**Tiempo estimado de corrección:** 2-3 horas
**Riesgo:** MEDIO - Requiere cambios en SQL + Código
**Prioridad:** ALTA - Bloquea la creación de nuevos clientes
