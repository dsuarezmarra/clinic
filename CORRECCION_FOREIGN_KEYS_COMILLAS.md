# ✅ CORRECCIÓN: FOREIGN KEYS CON COMILLAS DOBLES

**Fecha:** 03/10/2025  
**Problema:** ERROR: column "patientid" does not exist  
**Causa:** PostgreSQL requiere comillas dobles para columnas en camelCase  
**Solución:** Agregar comillas dobles a todos los nombres de columnas

---

## 🔍 DIAGNÓSTICO

### Problema Original

```sql
-- ❌ INCORRECTO (sin comillas)
ALTER TABLE public.appointments_actifisio
ADD CONSTRAINT appointments_actifisio_patientId_fkey
FOREIGN KEY (patientId)  -- ❌ PostgreSQL no encuentra esta columna
REFERENCES public.patients_actifisio(id)
ON DELETE CASCADE;
```

**Error recibido:**

```
ERROR: 42703: column "patientid" referenced in foreign key constraint does not exist
```

**Causa:**
PostgreSQL convierte nombres sin comillas a minúsculas. Al buscar `patientId` sin comillas, PostgreSQL busca `patientid` (todo minúsculas), que no existe.

---

## ✅ SOLUCIÓN

### Agregar Comillas Dobles

```sql
-- ✅ CORRECTO (con comillas dobles)
ALTER TABLE public.appointments_actifisio
ADD CONSTRAINT appointments_actifisio_patientId_fkey
FOREIGN KEY ("patientId")  -- ✅ Comillas dobles respetan camelCase
REFERENCES public.patients_actifisio(id)
ON DELETE CASCADE;
```

---

## 📝 CAMBIOS REALIZADOS

### Foreign Keys (8 cambios)

```sql
-- Antes → Después

FOREIGN KEY (patientId)      → FOREIGN KEY ("patientId")
FOREIGN KEY (creditPackId)   → FOREIGN KEY ("creditPackId")
FOREIGN KEY (appointmentId)  → FOREIGN KEY ("appointmentId")
FOREIGN KEY (invoiceId)      → FOREIGN KEY ("invoiceId")
```

### Índices (8 cambios)

```sql
-- Antes → Después

ON appointments_actifisio(patientId)     → ON appointments_actifisio("patientId")
ON credit_packs_actifisio(patientId)     → ON credit_packs_actifisio("patientId")
ON credit_redemptions_actifisio(creditPackId)   → ON credit_redemptions_actifisio("creditPackId")
ON credit_redemptions_actifisio(appointmentId)  → ON credit_redemptions_actifisio("appointmentId")
ON patient_files_actifisio(patientId)    → ON patient_files_actifisio("patientId")
ON invoices_actifisio(patientId)         → ON invoices_actifisio("patientId")
ON invoice_items_actifisio(invoiceId)    → ON invoice_items_actifisio("invoiceId")
ON invoice_items_actifisio(appointmentId) → ON invoice_items_actifisio("appointmentId")
```

---

## 📚 LECCIÓN: POSTGRESQL Y CASE-SENSITIVITY

### Reglas de PostgreSQL

1. **Sin comillas:** PostgreSQL convierte a minúsculas

   ```sql
   SELECT patientId FROM patients;
   -- PostgreSQL busca: patientid (todo minúsculas)
   ```

2. **Con comillas dobles:** PostgreSQL respeta mayúsculas/minúsculas
   ```sql
   SELECT "patientId" FROM patients;
   -- PostgreSQL busca: patientId (camelCase exacto)
   ```

### Mejores Prácticas

**❌ Evitar:** camelCase sin comillas

```sql
CREATE TABLE patients (
    patientId TEXT  -- Se guardará como "patientid"
);
```

**✅ Mejor opción 1:** snake_case (estándar PostgreSQL)

```sql
CREATE TABLE patients (
    patient_id TEXT  -- No necesita comillas
);
```

**✅ Mejor opción 2:** camelCase CON comillas

```sql
CREATE TABLE patients (
    "patientId" TEXT  -- Requiere comillas siempre
);
```

---

## 🎯 SCRIPT ACTUALIZADO

**Archivo:** `AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql`

**Cambios totales:** 16 correcciones

- 8 Foreign Keys corregidas
- 8 Índices corregidos

**Estado:** ✅ Listo para ejecutar

---

## 🚀 PRÓXIMOS PASOS

1. **Ejecutar script corregido:**

   - Abrir Supabase SQL Editor
   - Copiar `AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql`
   - Ejecutar (Run)

2. **Verificar éxito:**

   ```sql
   -- Deberías ver 8 foreign keys
   SELECT constraint_name
   FROM information_schema.table_constraints
   WHERE constraint_type = 'FOREIGN KEY'
     AND table_name LIKE '%_actifisio';
   ```

3. **Verificar índices:**
   ```sql
   -- Deberías ver 8+ índices
   SELECT indexname
   FROM pg_indexes
   WHERE tablename LIKE '%_actifisio'
     AND indexname LIKE 'idx_%';
   ```

---

## ✅ RESULTADO ESPERADO

Después de ejecutar el script corregido:

```
✅ ALTER TABLE (8 veces) - Foreign Keys agregadas
✅ CREATE INDEX (8 veces) - Índices creados
✅ 8 foreign keys listadas en tabla de constraints
✅ 8 índices listados en tabla de indexes
✅ Integridad referencial garantizada
✅ Paridad con tablas masajecorporaldeportivo
```

---

**Estado:** ✅ Script corregido y listo  
**Archivo actualizado:** `AGREGAR_FOREIGN_KEYS_ACTIFISIO.sql`  
**Tiempo estimado de ejecución:** 30 segundos
