-- ============================================================
-- FASE 2: Renombrar Tablas Existentes con Sufijo
-- ============================================================
-- Este script renombra las tablas actuales agregando el sufijo
-- del tenant principal (masaje_corporal_deportivo).
--
-- ⚠️ IMPORTANTE: Hacer BACKUP antes de ejecutar este script
--
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 1: Verificar que existen las tablas originales
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patients') THEN
    RAISE EXCEPTION 'Tabla patients no existe. Verificar estado de la base de datos.';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments') THEN
    RAISE EXCEPTION 'Tabla appointments no existe. Verificar estado de la base de datos.';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'credit_packs') THEN
    RAISE EXCEPTION 'Tabla credit_packs no existe. Verificar estado de la base de datos.';
  END IF;
  
  RAISE NOTICE '✅ Todas las tablas principales existen';
END $$;

-- ============================================================
-- PASO 2: Renombrar Tablas Principales
-- ============================================================

-- Renombrar patients
ALTER TABLE IF EXISTS patients 
  RENAME TO patients_masajecorporaldeportivo;

-- Renombrar appointments
ALTER TABLE IF EXISTS appointments 
  RENAME TO appointments_masajecorporaldeportivo;

-- Renombrar credit_packs
ALTER TABLE IF EXISTS credit_packs 
  RENAME TO credit_packs_masajecorporaldeportivo;

-- Renombrar credit_redemptions
ALTER TABLE IF EXISTS credit_redemptions 
  RENAME TO credit_redemptions_masajecorporaldeportivo;

-- Renombrar configurations
ALTER TABLE IF EXISTS configurations 
  RENAME TO configurations_masajecorporaldeportivo;

-- Renombrar backups
ALTER TABLE IF EXISTS backups 
  RENAME TO backups_masajecorporaldeportivo;

-- ============================================================
-- PASO 3: Verificar Constraints y Foreign Keys
-- ============================================================
-- Las foreign keys se actualizan automáticamente por PostgreSQL
-- pero verificamos que todo esté correcto

-- Ver todas las foreign keys del esquema
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE '%_masajecorporaldeportivo'
ORDER BY tc.table_name;

-- ============================================================
-- PASO 4: Actualizar Índices
-- ============================================================
-- Los índices se renombran automáticamente, pero verificamos

-- Ver todos los índices de las tablas renombradas
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename LIKE '%_masajecorporaldeportivo'
ORDER BY tablename, indexname;

-- ============================================================
-- PASO 5: Verificar RLS Policies
-- ============================================================
-- Las políticas RLS también se actualizan automáticamente

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename LIKE '%_masajecorporaldeportivo'
ORDER BY tablename, policyname;

-- ============================================================
-- PASO 6: Verificar Datos
-- ============================================================

-- Contar registros en cada tabla renombrada
SELECT 'patients_masajecorporaldeportivo' AS table_name, COUNT(*) AS count 
FROM patients_masajecorporaldeportivo
UNION ALL
SELECT 'appointments_masajecorporaldeportivo', COUNT(*) 
FROM appointments_masajecorporaldeportivo
UNION ALL
SELECT 'credit_packs_masajecorporaldeportivo', COUNT(*) 
FROM credit_packs_masajecorporaldeportivo
UNION ALL
SELECT 'credit_redemptions_masajecorporaldeportivo', COUNT(*) 
FROM credit_redemptions_masajecorporaldeportivo
UNION ALL
SELECT 'configurations_masajecorporaldeportivo', COUNT(*) 
FROM configurations_masajecorporaldeportivo
UNION ALL
SELECT 'backups_masajecorporaldeportivo', COUNT(*) 
FROM backups_masajecorporaldeportivo;

-- ============================================================
-- FINALIZADO - FASE 2
-- ============================================================
-- ✅ Tablas renombradas con sufijo _masajecorporaldeportivo
-- ✅ Foreign keys actualizadas automáticamente
-- ✅ Índices actualizados automáticamente
-- ✅ RLS policies actualizadas automáticamente
-- ✅ Datos preservados
-- 
-- PRÓXIMO PASO: Modificar backend para usar tablas dinámicas
-- Para nuevos clientes: usar 03-template-create-tenant-tables.sql
-- ============================================================
