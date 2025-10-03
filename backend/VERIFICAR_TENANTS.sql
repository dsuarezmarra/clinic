-- ============================================================
-- VERIFICAR TABLA TENANTS
-- ============================================================

-- 1. Ver todos los registros en la tabla tenants
SELECT 
  id,
  slug,
  name,
  table_suffix,
  active,
  created_at,
  updated_at
FROM public.tenants
ORDER BY created_at DESC;

-- 2. Verificar si existe el tenant "masajecorporaldeportivo"
SELECT 
  id,
  slug,
  name,
  table_suffix,
  active,
  config
FROM public.tenants
WHERE slug = 'masajecorporaldeportivo';

-- 3. Si no existe, insertarlo
INSERT INTO public.tenants (slug, name, table_suffix, active)
VALUES (
  'masajecorporaldeportivo',
  'Masaje Corporal Deportivo',
  'masajecorporaldeportivo',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  table_suffix = EXCLUDED.table_suffix,
  active = EXCLUDED.active,
  updated_at = NOW();

-- 4. Verificar que se insertó/actualizó correctamente
SELECT 
  id,
  slug,
  name,
  table_suffix,
  active,
  created_at,
  updated_at
FROM public.tenants
WHERE slug = 'masajecorporaldeportivo';
