-- =====================================================
-- VERIFICAR NOMBRES DE COLUMNAS EN TABLAS ACTIFISIO
-- =====================================================
-- Ejecuta esto PRIMERO para ver los nombres exactos

-- Ver todas las columnas de todas las tablas actifisio
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name LIKE '%_actifisio'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- VERIFICACIÓN ESPECÍFICA POR TABLA
-- =====================================================

-- appointments_actifisio
SELECT 'appointments_actifisio' as tabla, column_name
FROM information_schema.columns
WHERE table_name = 'appointments_actifisio'
AND column_name ILIKE '%patient%';

-- credit_packs_actifisio
SELECT 'credit_packs_actifisio' as tabla, column_name
FROM information_schema.columns
WHERE table_name = 'credit_packs_actifisio'
AND column_name ILIKE '%patient%';

-- credit_redemptions_actifisio
SELECT 'credit_redemptions_actifisio' as tabla, column_name
FROM information_schema.columns
WHERE table_name = 'credit_redemptions_actifisio'
AND (column_name ILIKE '%credit%' OR column_name ILIKE '%appointment%');

-- patient_files_actifisio
SELECT 'patient_files_actifisio' as tabla, column_name
FROM information_schema.columns
WHERE table_name = 'patient_files_actifisio'
AND column_name ILIKE '%patient%';

-- invoices_actifisio
SELECT 'invoices_actifisio' as tabla, column_name
FROM information_schema.columns
WHERE table_name = 'invoices_actifisio'
AND column_name ILIKE '%patient%';

-- invoice_items_actifisio
SELECT 'invoice_items_actifisio' as tabla, column_name
FROM information_schema.columns
WHERE table_name = 'invoice_items_actifisio'
AND (column_name ILIKE '%invoice%' OR column_name ILIKE '%appointment%');

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Deberías ver si las columnas son:
-- - patientId (camelCase) ← Original
-- - patientid (minúsculas) ← Posible en PostgreSQL
-- - patient_id (snake_case) ← Posible alternativa
