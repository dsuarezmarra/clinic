# 🔧 SOLUCIÓN ERROR FK - MIGRATION v2.4.0

## ❌ Error Encontrado

```
ERROR: 42703: column "patientid" referenced in foreign key constraint does not exist
```

## 🔍 Causa

El script original `MIGRATION_ADD_SUFFIX_TO_TABLES.sql` intentaba **recrear manualmente** las foreign keys después de renombrar las tablas, pero:

1. Usaba nombres de columna incorrectos (`patientid` en vez de `patient_id`)
2. No es necesario - **PostgreSQL actualiza automáticamente las FK** cuando renombras tablas

## ✅ Solución

Usar el script **simplificado** que solo renombra las tablas:

### SQL Correcto

```sql
-- ============================================================
-- MIGRATION CORREGIDA: Solo renombrar tablas
-- PostgreSQL actualiza automáticamente las FK cuando renombras tablas
-- ============================================================

-- PASO 1: Renombrar patient_files
ALTER TABLE IF EXISTS public.patient_files
RENAME TO patient_files_masajecorporaldeportivo;

-- PASO 2: Renombrar invoices
ALTER TABLE IF EXISTS public.invoices
RENAME TO invoices_masajecorporaldeportivo;

-- PASO 3: Renombrar invoice_items
ALTER TABLE IF EXISTS public.invoice_items
RENAME TO invoice_items_masajecorporaldeportivo;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- 1. Verificar que las tablas se renombraron
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%masajecorporaldeportivo%'
ORDER BY tablename;

-- 2. Verificar que las FK se actualizaron automáticamente
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name LIKE '%patient_files%'
    OR tc.table_name LIKE '%invoices%'
    OR tc.table_name LIKE '%invoice_items%')
ORDER BY tc.table_name, tc.constraint_name;
```

## 📋 Pasos de Ejecución

1. **Abrir Supabase SQL Editor**

   - URL: https://supabase.com/dashboard/project/nnfxzgvplvavgdfmgrrb
   - Ir a: SQL Editor → New Query

2. **Copiar y pegar el SQL correcto** (arriba)

3. **Ejecutar**

4. **Verificar resultados**:
   - Deben aparecer 8 tablas con sufijo
   - Las FK deben apuntar a las tablas renombradas automáticamente

## 🎯 ¿Por qué funciona?

PostgreSQL es inteligente:

```
BEFORE:
patient_files → FK: patient_id → patients_masajecorporaldeportivo

RENAME TABLE patient_files TO patient_files_masajecorporaldeportivo

AFTER (automático):
patient_files_masajecorporaldeportivo → FK: patient_id → patients_masajecorporaldeportivo
                                          ↑
                                    Se mantiene intacta
```

## 📁 Archivos Creados

1. **`MIGRATION_FIXED_SIMPLE.sql`** ← **USAR ESTE**

   - Script correcto sin manipular FK
   - Listo para ejecutar

2. **`MIGRATION_FIXED_INSPECT_FIRST.sql`**

   - Queries de inspección
   - Útil para debugging si hay problemas

3. **`MIGRATION_ADD_SUFFIX_TO_TABLES.sql`** ← **NO USAR**
   - Script original con error
   - Mantenido para referencia

## ⚠️ Notas Importantes

1. **`IF EXISTS`** en el script previene errores si ya ejecutaste parte del script
2. **No se pierden datos** - solo es un rename
3. **Las FK se actualizan solas** - no necesitas tocarlas
4. **El código ya está desplegado** esperando estas tablas

## 🧪 Prueba Rápida Post-Migración

```bash
# Verificar versión del backend
curl https://clinic-backend-mez2afrjg-davids-projects-8fa96e54.vercel.app/api/version

# Debe devolver: "version": "2.4.0"
```

Luego prueba subir un archivo en un paciente desde el frontend.

---

**Última actualización**: 3 de octubre de 2025
