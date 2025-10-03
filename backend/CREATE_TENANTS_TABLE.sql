-- ============================================================
-- CREAR TABLA TENANTS Y REGISTRO INICIAL
-- Este script crea la tabla tenants necesaria para multi-tenancy
-- y agrega el registro para "masajecorporaldeportivo"
-- ============================================================

-- 1. Crear tabla tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  table_suffix VARCHAR(100) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índice para búsquedas rápidas por slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON public.tenants(active);

-- 3. Insertar registro para masajecorporaldeportivo
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

-- 4. Verificar que se insertó correctamente
SELECT 
  id,
  slug,
  name,
  table_suffix,
  active,
  created_at
FROM public.tenants
WHERE slug = 'masajecorporaldeportivo';

-- Resultado esperado:
-- Una fila con:
-- - slug: masajecorporaldeportivo
-- - name: Masaje Corporal Deportivo
-- - table_suffix: masajecorporaldeportivo
-- - active: true
