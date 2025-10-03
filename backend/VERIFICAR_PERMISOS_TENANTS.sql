-- ============================================================
-- VERIFICAR Y CONFIGURAR PERMISOS DE LA TABLA TENANTS
-- ============================================================

-- 1. Verificar permisos actuales
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'tenants'
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 2. Verificar si RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tenants'
  AND schemaname = 'public';

-- 3. Ver políticas existentes (si RLS está habilitado)
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tenants';

-- ============================================================
-- SOLUCIÓN: Habilitar RLS pero permitir service_role
-- ============================================================

-- 4. Habilitar RLS en tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 5. Dar permisos explícitos a service_role
GRANT ALL ON public.tenants TO service_role;

-- 6. Crear política que permite bypass total con service_role
DROP POLICY IF EXISTS "Service role can access tenants" ON public.tenants;

CREATE POLICY "Service role can access tenants"
  ON public.tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. También permitir lectura a authenticated (opcional)
DROP POLICY IF EXISTS "Authenticated can read tenants" ON public.tenants;

CREATE POLICY "Authenticated can read tenants"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (active = true);

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- 8. Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tenants';
-- Debe mostrar: rowsecurity = true

-- 9. Verificar que las políticas existen
SELECT 
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'tenants';
-- Debe mostrar al menos la política de service_role

-- 10. Verificar permisos
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'tenants'
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;
-- Debe incluir service_role con SELECT, INSERT, UPDATE, DELETE

-- 11. Probar consulta (esto simula lo que hace el middleware)
SELECT 
  id,
  slug,
  name,
  table_suffix,
  active
FROM public.tenants
WHERE slug = 'masajecorporaldeportivo'
  AND active = true
LIMIT 1;
-- Debe devolver 1 fila
