-- FORZAR RELOAD DE SCHEMA CACHE
-- Ejecutar en SQL Editor de Supabase

-- 1. Notificar reload de schema
SELECT pg_notify('pgrst', 'reload schema');

-- 2. Verificar tablas existentes
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Patient', 'Appointment', 'CreditPack', 'CreditRedemption')
ORDER BY table_name;

-- 3. Verificar que RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('Patient', 'Appointment', 'CreditPack', 'CreditRedemption')
ORDER BY tablename;

-- 4. Mostrar políticas activas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;