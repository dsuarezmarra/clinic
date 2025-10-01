-- 🔧 SOLUCIÓN: Otorgar permisos al service_role
-- 
-- El error "permission denied for schema public" significa que el rol
-- service_role no tiene los permisos necesarios sobre el esquema public.
--
-- Ejecuta este SQL en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/sql/new

-- 1. Otorgar permisos sobre el esquema public
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Otorgar permisos sobre todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Otorgar permisos sobre futuras tablas (para cuando se creen nuevas)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON FUNCTIONS TO service_role;

-- 4. Asegurar que service_role puede leer/escribir en las tablas específicas
GRANT ALL ON patients TO service_role;
GRANT ALL ON appointments TO service_role;
GRANT ALL ON credit_packs TO service_role;
GRANT ALL ON credit_redemptions TO service_role;
GRANT ALL ON patient_files TO service_role;
GRANT ALL ON configurations TO service_role;

-- 5. Verificar permisos
SELECT 
    table_schema,
    table_name,
    array_agg(DISTINCT privilege_type) as privileges
FROM information_schema.table_privileges
WHERE grantee = 'service_role'
    AND table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;

-- Resultado esperado: Deberías ver todas las tablas con los privilegios
-- [SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER]
