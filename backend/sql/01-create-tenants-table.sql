-- ============================================================
-- FASE 1: Crear Tabla TENANTS (Maestra de Clientes)
-- ============================================================
-- Este script crea la tabla maestra que contiene la configuración
-- de cada cliente/tenant del sistema multi-cliente.
--
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- Crear tabla tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- Identificador URL: 'masaje-corporal-deportivo', 'clinica-juan'
  name TEXT NOT NULL, -- Nombre completo: 'Masaje Corporal Deportivo', 'Clínica Juan'
  table_suffix TEXT UNIQUE NOT NULL, -- Sufijo para tablas: 'masaje_corporal_deportivo', 'clinica_juan'
  config JSONB DEFAULT '{}'::jsonb, -- Configuración personalizada (logo, colores, contacto)
  active BOOLEAN DEFAULT true, -- Si el cliente está activo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios en columnas
COMMENT ON TABLE tenants IS 'Tabla maestra de clientes/tenants del sistema multi-cliente';
COMMENT ON COLUMN tenants.slug IS 'Identificador único para URL (ej: masaje-corporal-deportivo)';
COMMENT ON COLUMN tenants.name IS 'Nombre completo del negocio/clínica';
COMMENT ON COLUMN tenants.table_suffix IS 'Sufijo para nombres de tablas (ej: masaje_corporal_deportivo)';
COMMENT ON COLUMN tenants.config IS 'Configuración JSON: { logo, primaryColor, secondaryColor, contactEmail, contactPhone }';

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_table_suffix ON tenants(table_suffix);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política: Solo service_role tiene acceso completo
CREATE POLICY "Service role has full access to tenants" ON tenants
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- ============================================================
-- INSERTAR TENANT INICIAL (Masaje Corporal Deportivo)
-- ============================================================

INSERT INTO tenants (slug, name, table_suffix, config, active) VALUES (
  'masajecorporaldeportivo',
  'Masaje Corporal Deportivo',
  'masajecorporaldeportivo',
  '{
    "logo": "https://masajecorporaldeportivo.vercel.app/assets/logo-clinica.png",
    "primaryColor": "#4F46E5",
    "secondaryColor": "#10B981",
    "contactEmail": "masajecorporaldeportivo@gmail.com",
    "contactPhone": "+34 604943230",
    "address": "",
    "description": "Centro especializado en masaje corporal deportivo"
  }'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Verificar inserción
SELECT 
  id,
  slug,
  name,
  table_suffix,
  config->>'logo' as logo,
  config->>'contactEmail' as email,
  config->>'contactPhone' as phone,
  active,
  created_at
FROM tenants;

-- ============================================================
-- FINALIZADO - FASE 1
-- ============================================================
-- ✅ Tabla tenants creada
-- ✅ Índices creados
-- ✅ RLS habilitado
-- ✅ Tenant inicial insertado: masajecorporaldeportivo
-- 
-- PRÓXIMO PASO: 02-rename-existing-tables.sql
-- ============================================================
