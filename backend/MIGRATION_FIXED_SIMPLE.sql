-- ============================================================
-- MIGRATION CORREGIDA: Renombrar tablas sin tocar FK
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

-- Resultado esperado (8 tablas):
-- appointments_masajecorporaldeportivo
-- configurations_masajecorporaldeportivo
-- invoice_items_masajecorporaldeportivo       ← NUEVA
-- invoices_masajecorporaldeportivo            ← NUEVA
-- patient_files_masajecorporaldeportivo       ← NUEVA
-- patient_packs_masajecorporaldeportivo
-- patients_masajecorporaldeportivo
-- session_credits_masajecorporaldeportivo

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

-- 3. Verificar que no quedaron tablas antiguas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE '%masajecorporaldeportivo%'
  AND tablename NOT IN ('tenants', 'schema_migrations')
ORDER BY tablename;

-- No debe devolver resultados (o solo tablas del sistema)
