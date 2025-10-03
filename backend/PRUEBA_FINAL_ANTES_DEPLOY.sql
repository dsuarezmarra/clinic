-- ============================================================
-- PRUEBA FINAL: Simular lo que hace el middleware
-- ============================================================

-- Esta query simula exactamente lo que hace el middleware loadTenant
-- Si funciona aquí, funcionará en producción

SELECT 
  id,
  slug,
  name,
  table_suffix,
  active,
  config,
  created_at,
  updated_at
FROM public.tenants
WHERE slug = 'masajecorporaldeportivo'
  AND active = true
LIMIT 1;

-- Resultado esperado: 1 fila con todos los datos del tenant

-- ============================================================
-- VERIFICAR POLÍTICAS RLS
-- ============================================================

-- Ver que las políticas están activas
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY policyname;

-- Resultado esperado: 
-- - Policy para service_role (FOR ALL)
-- - Policy para authenticated (FOR SELECT) - opcional

-- ============================================================
-- VERIFICAR PERMISOS
-- ============================================================

SELECT 
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE table_name = 'tenants'
  AND table_schema = 'public'
GROUP BY grantee
ORDER BY grantee;

-- Resultado esperado:
-- service_role debe tener: DELETE, INSERT, SELECT, UPDATE

-- ============================================================
-- PROBAR ACCESO A TABLAS CON SUFIJO
-- ============================================================

-- Verificar que las tablas con sufijo existen
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE '%masajecorporaldeportivo%'
ORDER BY tablename;

-- Resultado esperado (10 tablas):
-- appointments_masajecorporaldeportivo
-- backups_masajecorporaldeportivo
-- configurations_masajecorporaldeportivo
-- credit_packs_masajecorporaldeportivo
-- credit_redemptions_masajecorporaldeportivo
-- invoice_items_masajecorporaldeportivo
-- invoices_masajecorporaldeportivo
-- patient_files_masajecorporaldeportivo
-- patients_masajecorporaldeportivo
-- (y cualquier otra)

-- ============================================================
-- RESUMEN
-- ============================================================

-- Si todos los queries anteriores devuelven resultados correctos:
-- ✅ El tenant existe y está activo
-- ✅ Las políticas RLS están configuradas
-- ✅ service_role tiene permisos completos
-- ✅ Las tablas con sufijo existen
-- ✅ TODO LISTO PARA REDESPLEGAR
