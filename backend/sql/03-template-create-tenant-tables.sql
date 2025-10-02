-- ============================================================
-- TEMPLATE: Crear Tablas para Nuevo Cliente/Tenant
-- ============================================================
-- Este script crea todas las tablas necesarias para un nuevo cliente.
-- 
-- INSTRUCCIONES DE USO:
-- 1. Reemplazar TODAS las ocurrencias de {{SUFFIX}} con el table_suffix del nuevo cliente
--    Ejemplo: clinica_juan, fisioterapia_maria, etc.
-- 2. Asegurarse de que el tenant ya existe en la tabla 'tenants'
-- 3. Ejecutar este script en Supabase SQL Editor
--
-- EJEMPLO:
-- Si el nuevo cliente tiene table_suffix = 'clinica_juan'
-- Reemplazar: patients_{{SUFFIX}} -> patients_clinica_juan
-- ============================================================

-- Variable para el sufijo (usar buscar y reemplazar)
-- SUFFIX: {{SUFFIX}}

-- ============================================================
-- TABLA: patients_{{SUFFIX}}
-- ============================================================

CREATE TABLE patients_{{SUFFIX}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  cp TEXT,
  city TEXT,
  province TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_patients_{{SUFFIX}}_dni ON patients_{{SUFFIX}}(dni) WHERE dni IS NOT NULL;
CREATE INDEX idx_patients_{{SUFFIX}}_phone ON patients_{{SUFFIX}}(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_patients_{{SUFFIX}}_email ON patients_{{SUFFIX}}(email) WHERE email IS NOT NULL;
CREATE INDEX idx_patients_{{SUFFIX}}_name ON patients_{{SUFFIX}}(last_name, first_name);
CREATE INDEX idx_patients_{{SUFFIX}}_created ON patients_{{SUFFIX}}(created_at);

-- RLS
ALTER TABLE patients_{{SUFFIX}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access patients_{{SUFFIX}}" ON patients_{{SUFFIX}}
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE patients_{{SUFFIX}} IS 'Pacientes del tenant {{SUFFIX}}';

-- ============================================================
-- TABLA: appointments_{{SUFFIX}}
-- ============================================================

CREATE TABLE appointments_{{SUFFIX}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients_{{SUFFIX}}(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_duration CHECK (duration_minutes IN (30, 60))
);

-- Índices
CREATE INDEX idx_appointments_{{SUFFIX}}_patient ON appointments_{{SUFFIX}}(patient_id);
CREATE INDEX idx_appointments_{{SUFFIX}}_start_time ON appointments_{{SUFFIX}}(start_time);
CREATE INDEX idx_appointments_{{SUFFIX}}_payment_status ON appointments_{{SUFFIX}}(payment_status);
CREATE INDEX idx_appointments_{{SUFFIX}}_created ON appointments_{{SUFFIX}}(created_at);

-- RLS
ALTER TABLE appointments_{{SUFFIX}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access appointments_{{SUFFIX}}" ON appointments_{{SUFFIX}}
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE appointments_{{SUFFIX}} IS 'Citas del tenant {{SUFFIX}}';

-- ============================================================
-- TABLA: credit_packs_{{SUFFIX}}
-- ============================================================

CREATE TABLE credit_packs_{{SUFFIX}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients_{{SUFFIX}}(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  units_total INTEGER NOT NULL,
  units_remaining INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_type CHECK (type IN ('sesion-30', 'sesion-60', 'bono-30', 'bono-60')),
  CONSTRAINT valid_units CHECK (units_total > 0 AND units_remaining >= 0 AND units_remaining <= units_total)
);

-- Índices
CREATE INDEX idx_credit_packs_{{SUFFIX}}_patient ON credit_packs_{{SUFFIX}}(patient_id);
CREATE INDEX idx_credit_packs_{{SUFFIX}}_type ON credit_packs_{{SUFFIX}}(type);
CREATE INDEX idx_credit_packs_{{SUFFIX}}_paid ON credit_packs_{{SUFFIX}}(paid);
CREATE INDEX idx_credit_packs_{{SUFFIX}}_remaining ON credit_packs_{{SUFFIX}}(units_remaining) WHERE units_remaining > 0;
CREATE INDEX idx_credit_packs_{{SUFFIX}}_created ON credit_packs_{{SUFFIX}}(created_at);

-- RLS
ALTER TABLE credit_packs_{{SUFFIX}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access credit_packs_{{SUFFIX}}" ON credit_packs_{{SUFFIX}}
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE credit_packs_{{SUFFIX}} IS 'Packs de crédito/sesiones del tenant {{SUFFIX}}';

-- ============================================================
-- TABLA: credit_redemptions_{{SUFFIX}}
-- ============================================================

CREATE TABLE credit_redemptions_{{SUFFIX}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments_{{SUFFIX}}(id) ON DELETE CASCADE,
  credit_pack_id UUID NOT NULL REFERENCES credit_packs_{{SUFFIX}}(id) ON DELETE CASCADE,
  units_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_units_used CHECK (units_used > 0)
);

-- Índices
CREATE INDEX idx_credit_redemptions_{{SUFFIX}}_appointment ON credit_redemptions_{{SUFFIX}}(appointment_id);
CREATE INDEX idx_credit_redemptions_{{SUFFIX}}_credit_pack ON credit_redemptions_{{SUFFIX}}(credit_pack_id);
CREATE INDEX idx_credit_redemptions_{{SUFFIX}}_created ON credit_redemptions_{{SUFFIX}}(created_at);

-- RLS
ALTER TABLE credit_redemptions_{{SUFFIX}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access credit_redemptions_{{SUFFIX}}" ON credit_redemptions_{{SUFFIX}}
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE credit_redemptions_{{SUFFIX}} IS 'Redenciones de créditos del tenant {{SUFFIX}}';

-- ============================================================
-- TABLA: configurations_{{SUFFIX}}
-- ============================================================

CREATE TABLE configurations_{{SUFFIX}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_configurations_{{SUFFIX}}_key ON configurations_{{SUFFIX}}(key);

-- RLS
ALTER TABLE configurations_{{SUFFIX}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access configurations_{{SUFFIX}}" ON configurations_{{SUFFIX}}
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE configurations_{{SUFFIX}} IS 'Configuraciones del tenant {{SUFFIX}}';

-- Insertar configuración de precios por defecto
INSERT INTO configurations_{{SUFFIX}} (key, value) VALUES
  ('prices', '{
    "sessionPrice30": 2000,
    "sessionPrice60": 3500,
    "bonoPrice30": 9600,
    "bonoPrice60": 17600
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- TABLA: backups_{{SUFFIX}}
-- ============================================================

CREATE TABLE backups_{{SUFFIX}} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL,
  description TEXT
);

-- Índices
CREATE INDEX idx_backups_{{SUFFIX}}_created ON backups_{{SUFFIX}}(created DESC);

-- RLS
ALTER TABLE backups_{{SUFFIX}} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access backups_{{SUFFIX}}" ON backups_{{SUFFIX}}
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE backups_{{SUFFIX}} IS 'Backups de datos del tenant {{SUFFIX}}';

-- ============================================================
-- TRIGGERS: Actualizar updated_at automáticamente
-- ============================================================

-- Función genérica para updated_at (si no existe ya)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para patients
CREATE TRIGGER trigger_update_patients_{{SUFFIX}}_updated_at
  BEFORE UPDATE ON patients_{{SUFFIX}}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers para appointments
CREATE TRIGGER trigger_update_appointments_{{SUFFIX}}_updated_at
  BEFORE UPDATE ON appointments_{{SUFFIX}}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers para credit_packs
CREATE TRIGGER trigger_update_credit_packs_{{SUFFIX}}_updated_at
  BEFORE UPDATE ON credit_packs_{{SUFFIX}}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers para configurations
CREATE TRIGGER trigger_update_configurations_{{SUFFIX}}_updated_at
  BEFORE UPDATE ON configurations_{{SUFFIX}}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

-- Verificar que todas las tablas fueron creadas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name LIKE '%_{{SUFFIX}}';
  
  IF table_count >= 6 THEN
    RAISE NOTICE '✅ Todas las tablas creadas correctamente para tenant {{SUFFIX}}';
    RAISE NOTICE '   Total de tablas: %', table_count;
  ELSE
    RAISE WARNING '⚠️ Faltan tablas. Se esperaban 6, se encontraron %', table_count;
  END IF;
END $$;

-- Listar todas las tablas creadas
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name LIKE '%_{{SUFFIX}}'
ORDER BY table_name;

-- ============================================================
-- FINALIZADO
-- ============================================================
-- ✅ Tablas creadas para tenant {{SUFFIX}}
-- ✅ Índices creados
-- ✅ Foreign keys configuradas
-- ✅ RLS habilitado
-- ✅ Triggers de updated_at configurados
-- ✅ Configuración de precios por defecto insertada
-- 
-- PRÓXIMO PASO: Verificar en tabla tenants que existe el registro
-- SELECT * FROM tenants WHERE table_suffix = '{{SUFFIX}}';
-- ============================================================
