# 🔗 AGREGAR FOREIGN KEYS A TABLAS ACTIFISIO

**Problema:** Las tablas de Actifisio no tienen las relaciones (Foreign Keys) que sí tienen las de Masaje Corporal Deportivo  
**Impacto:** Falta integridad referencial en la base de datos  
**Solución:** Ejecutar script SQL para agregar todas las Foreign Keys  
**Fecha:** 03/10/2025

---

## 🎯 COMPARATIVA

### ❌ ESTADO ACTUAL (Actifisio - Sin FKs)

```sql
-- appointments_actifisio
patientId text  -- ❌ Sin Foreign Key a patients_actifisio

-- credit_packs_actifisio
patientId text  -- ❌ Sin Foreign Key a patients_actifisio

-- credit_redemptions_actifisio
creditPackId text   -- ❌ Sin Foreign Key a credit_packs_actifisio
appointmentId text  -- ❌ Sin Foreign Key a appointments_actifisio

-- patient_files_actifisio
patientId text  -- ❌ Sin Foreign Key a patients_actifisio

-- invoices_actifisio
patientId text  -- ❌ Sin Foreign Key a patients_actifisio

-- invoice_items_actifisio
invoiceId text      -- ❌ Sin Foreign Key a invoices_actifisio
appointmentId text  -- ❌ Sin Foreign Key a appointments_actifisio
```

### ✅ ESTADO OBJETIVO (Masaje Corporal - Con FKs)

```sql
-- appointments_masajecorporaldeportivo
CONSTRAINT appointments_patientId_fkey 
  FOREIGN KEY (patientId) 
  REFERENCES patients_masajecorporaldeportivo(id)

-- credit_packs_masajecorporaldeportivo
CONSTRAINT credit_packs_patientId_fkey 
  FOREIGN KEY (patientId) 
  REFERENCES patients_masajecorporaldeportivo(id)

-- credit_redemptions_masajecorporaldeportivo
CONSTRAINT credit_redemptions_creditPackId_fkey 
  FOREIGN KEY (creditPackId) 
  REFERENCES credit_packs_masajecorporaldeportivo(id)

CONSTRAINT credit_redemptions_appointmentId_fkey 
  FOREIGN KEY (appointmentId) 
  REFERENCES appointments_masajecorporaldeportivo(id)

-- ... etc (8 FKs en total)
```

---

## 📋 FOREIGN KEYS A AGREGAR

| # | Tabla | Columna | Referencia | ON DELETE |
|---|-------|---------|------------|-----------|
| 1 | appointments_actifisio | patientId | patients_actifisio(id) | CASCADE |
| 2 | credit_packs_actifisio | patientId | patients_actifisio(id) | CASCADE |
| 3 | credit_redemptions_actifisio | creditPackId | credit_packs_actifisio(id) | CASCADE |
| 4 | credit_redemptions_actifisio | appointmentId | appointments_actifisio(id) | CASCADE |
| 5 | patient_files_actifisio | patientId | patients_actifisio(id) | CASCADE |
| 6 | invoices_actifisio | patientId | patients_actifisio(id) | SET NULL |
| 7 | invoice_items_actifisio | invoiceId | invoices_actifisio(id) | CASCADE |
| 8 | invoice_items_actifisio | appointmentId | appointments_actifisio(id) | SET NULL |

**Total:** 8 Foreign Keys

---

## 🚀 EJECUCIÓN DEL SCRIPT

### Opción 1: SQL Editor de Supabase (Recomendado)

1. **Abrir Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Ir a SQL Editor:**
   - Click en "SQL Editor" en el menú lateral
   - Click en "New Query"

3. **Copiar y pegar el script:**
   - Abrir: `AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql`
   - Copiar todo el contenido
   - Pegar en el editor

4. **Ejecutar:**
   - Click en "Run" (o Ctrl+Enter)
   - Esperar confirmación: "Success"

5. **Verificar:**
   - El script incluye una query de verificación al final
   - Deberías ver 8 foreign keys listadas

---

### Opción 2: CLI de Supabase (Avanzado)

```bash
# Si tienes Supabase CLI instalado
supabase db push --file AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql
```

---

## ✅ VERIFICACIÓN

### 1. Verificar Foreign Keys Creadas

**Ejecutar en SQL Editor:**

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE '%_actifisio'
ORDER BY tc.table_name;
```

**Resultado esperado:** 8 filas

```
appointments_actifisio_patientId_fkey
credit_packs_actifisio_patientId_fkey
credit_redemptions_actifisio_creditPackId_fkey
credit_redemptions_actifisio_appointmentId_fkey
patient_files_actifisio_patientId_fkey
invoices_actifisio_patientId_fkey
invoice_items_actifisio_invoiceId_fkey
invoice_items_actifisio_appointmentId_fkey
```

---

### 2. Verificar Índices Creados

**Ejecutar en SQL Editor:**

```sql
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE tablename LIKE '%_actifisio'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Resultado esperado:** 8 índices

```
idx_appointments_actifisio_patientId
idx_credit_packs_actifisio_patientId
idx_credit_redemptions_actifisio_creditPackId
idx_credit_redemptions_actifisio_appointmentId
idx_patient_files_actifisio_patientId
idx_invoices_actifisio_patientId
idx_invoice_items_actifisio_invoiceId
idx_invoice_items_actifisio_appointmentId
```

---

## 🎯 BENEFICIOS

### 1. Integridad Referencial ✅

**Antes (sin FKs):**
```sql
-- Se puede crear una cita con patientId que no existe
INSERT INTO appointments_actifisio (patientId, start, end)
VALUES ('id-inexistente', NOW(), NOW());
-- ✅ Se inserta sin error (MALO)
```

**Después (con FKs):**
```sql
-- No se puede crear una cita con patientId que no existe
INSERT INTO appointments_actifisio (patientId, start, end)
VALUES ('id-inexistente', NOW(), NOW());
-- ❌ ERROR: violates foreign key constraint (BUENO)
```

---

### 2. Eliminación en Cascada ✅

**Escenario:** Eliminar un paciente

**Antes (sin FKs):**
```sql
DELETE FROM patients_actifisio WHERE id = 'paciente-123';
-- Paciente eliminado, pero quedan huérfanos:
-- - appointments_actifisio con patientId = 'paciente-123'
-- - credit_packs_actifisio con patientId = 'paciente-123'
-- - patient_files_actifisio con patientId = 'paciente-123'
-- ❌ Datos inconsistentes
```

**Después (con FKs y CASCADE):**
```sql
DELETE FROM patients_actifisio WHERE id = 'paciente-123';
-- Paciente eliminado Y automáticamente:
-- - appointments_actifisio eliminadas
-- - credit_packs_actifisio eliminados
-- - patient_files_actifisio eliminados
-- ✅ Integridad garantizada
```

---

### 3. Performance Mejorada ✅

Los índices creados mejoran el rendimiento de:

```sql
-- Consultas frecuentes que se benefician:

-- 1. Obtener citas de un paciente
SELECT * FROM appointments_actifisio WHERE patientId = 'xxx';
-- Usa: idx_appointments_actifisio_patientId

-- 2. Obtener packs de créditos de un paciente
SELECT * FROM credit_packs_actifisio WHERE patientId = 'xxx';
-- Usa: idx_credit_packs_actifisio_patientId

-- 3. Obtener redenciones de un pack
SELECT * FROM credit_redemptions_actifisio WHERE creditPackId = 'xxx';
-- Usa: idx_credit_redemptions_actifisio_creditPackId

-- etc.
```

---

## 🚨 CONSIDERACIONES IMPORTANTES

### ON DELETE CASCADE

**Afecta a:**
- `appointments_actifisio.patientId`
- `credit_packs_actifisio.patientId`
- `credit_redemptions_actifisio.creditPackId`
- `credit_redemptions_actifisio.appointmentId`
- `patient_files_actifisio.patientId`
- `invoice_items_actifisio.invoiceId`

**Significa:**
Si eliminas el registro padre, SE ELIMINAN automáticamente todos los hijos.

**Ejemplo:**
```sql
DELETE FROM patients_actifisio WHERE id = 'paciente-123';
-- Elimina automáticamente:
-- - Todas sus citas
-- - Todos sus packs de créditos
-- - Todos sus archivos
```

---

### ON DELETE SET NULL

**Afecta a:**
- `invoices_actifisio.patientId`
- `invoice_items_actifisio.appointmentId`

**Significa:**
Si eliminas el registro padre, el campo en el hijo se pone a NULL (pero el hijo NO se elimina).

**Ejemplo:**
```sql
DELETE FROM patients_actifisio WHERE id = 'paciente-123';
-- Las facturas NO se eliminan, pero su patientId = NULL
-- (Mantiene histórico de facturación)
```

---

## 📊 IMPACTO EN LA APLICACIÓN

### Backend

✅ **No requiere cambios**
- El backend ya funciona correctamente
- Las Foreign Keys son transparentes para el código
- Solo mejoran la integridad a nivel de base de datos

### Frontend

✅ **No requiere cambios**
- El frontend ya funciona correctamente
- No hay impacto visible para el usuario

### Base de Datos

✅ **Mejoras automáticas**
- Integridad referencial garantizada
- Eliminación en cascada automática
- Performance mejorada con índices

---

## ⏱️ TIEMPO ESTIMADO

| Actividad | Tiempo |
|-----------|--------|
| Copiar script SQL | 1 min |
| Ejecutar en Supabase | 30 seg |
| Verificar FKs creadas | 2 min |
| Verificar índices | 1 min |
| **TOTAL** | **~5 min** |

---

## ✅ CHECKLIST

- [ ] Abrir Supabase Dashboard
- [ ] Ir a SQL Editor
- [ ] Copiar script `AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql`
- [ ] Pegar en editor
- [ ] Ejecutar script (Run)
- [ ] Verificar "Success" message
- [ ] Ejecutar query de verificación de FKs
- [ ] Confirmar 8 foreign keys listadas
- [ ] Ejecutar query de verificación de índices
- [ ] Confirmar 8 índices listados
- [ ] Probar en frontend que todo sigue funcionando

---

## 🎉 RESULTADO FINAL

**Después de ejecutar el script:**

✅ **Paridad completa** con tablas de Masaje Corporal Deportivo  
✅ **8 Foreign Keys** estableciendo relaciones  
✅ **8 Índices** optimizando performance  
✅ **Integridad referencial** garantizada  
✅ **Eliminación en cascada** automática  
✅ **Base de datos robusta** y consistente

---

**Estado:** ✅ Listo para ejecutar  
**Prioridad:** 🔴 Alta (recomendado ejecutar lo antes posible)  
**Riesgo:** ✅ Bajo (no afecta datos existentes, solo agrega constraints)  
**Tiempo:** 5 minutos
