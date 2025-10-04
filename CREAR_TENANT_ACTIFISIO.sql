-- ============================================================
-- CREAR TENANT PARA ACTIFISIO
-- ============================================================
-- Este script crea el registro del tenant 'actifisio' en la tabla tenants
-- IMPORTANTE: Solo crear si NO existe. Si ya existe, este script fallará.
-- ============================================================

-- 1. Insertar el tenant actifisio
INSERT INTO public.tenants (
  id,
  slug,
  name,
  table_suffix,
  active,
  config,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(), -- Genera un UUID automático
  'actifisio', -- Slug único para identificar al tenant en headers
  'Actifisio', -- Nombre del negocio
  'actifisio', -- Sufijo para las tablas (patients_actifisio, etc.)
  true, -- Tenant activo
  '{
    "logo": "assets/clients/actifisio/logo.png",
    "primaryColor": "#ff6b35",
    "secondaryColor": "#f7b731",
    "contactEmail": "info@actifisio.com",
    "apiUrl": "https://masajecorporaldeportivo-api.vercel.app/api"
  }'::jsonb, -- Configuración en JSON
  NOW(), -- Fecha de creación
  NOW()  -- Fecha de actualización
);

-- 2. Verificar que se creó correctamente
SELECT 
  id, 
  slug, 
  name, 
  table_suffix, 
  active, 
  created_at
FROM public.tenants
WHERE slug = 'actifisio';

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- Debe devolver 1 fila con:
--   slug: 'actifisio'
--   name: 'Actifisio'
--   table_suffix: 'actifisio'
--   active: true
-- ============================================================

-- ============================================================
-- SI EL TENANT YA EXISTE (Error: duplicate key)
-- ============================================================
-- Ejecuta este query para verificar el tenant existente:
-- SELECT * FROM public.tenants WHERE slug = 'actifisio';
-- 
-- Si necesitas actualizarlo:
-- UPDATE public.tenants 
-- SET 
--   active = true,
--   config = '{
--     "logo": "assets/clients/actifisio/logo.png",
--     "primaryColor": "#ff6b35",
--     "secondaryColor": "#f7b731",
--     "contactEmail": "info@actifisio.com",
--     "apiUrl": "https://masajecorporaldeportivo-api.vercel.app/api"
--   }'::jsonb,
--   updated_at = NOW()
-- WHERE slug = 'actifisio';
-- ============================================================
