-- ============================================================
-- PASO 1: INSPECCIONAR FOREIGN KEYS EXISTENTES
-- ============================================================
-- Ejecuta esto PRIMERO para ver las FK actuales

SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('patient_files', 'invoices', 'invoice_items')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================
-- PASO 2: INSPECCIONAR COLUMNAS DE LAS TABLAS
-- ============================================================

SELECT 
  'patient_files' as table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_files'
ORDER BY ordinal_position;

SELECT 
  'invoices' as table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

SELECT 
  'invoice_items' as table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;
