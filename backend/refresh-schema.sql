-- Script para refrescar schema cache de Supabase
-- Ejecutar después del script principal

-- 1. Notificar a PostgREST para recargar schema
NOTIFY pgrst, 'reload schema';

-- 2. Verificar que las tablas están en el schema correcto
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%Patient%' OR tablename LIKE '%Appointment%' OR tablename LIKE '%Credit%';

-- 3. Verificar columnas de las tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('Patient', 'Appointment', 'CreditPack', 'CreditRedemption')
ORDER BY table_name, ordinal_position;

-- 4. Verificar políticas RLS activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;