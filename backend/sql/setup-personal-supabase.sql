-- ============================================================
-- SETUP COMPLETO PARA CLINIC - Cuenta Personal Supabase
-- Proyecto: kctoxebchyrgkwofdkht
-- URL: https://kctoxebchyrgkwofdkht.supabase.co
-- ============================================================
-- INSTRUCCIONES:
-- 1. Copiar TODO este contenido
-- 2. Ir a SQL Editor en Supabase
-- 3. Pegar y ejecutar con el botón "Run"
-- ============================================================

-- 1. TABLA TENANTS (Maestra de Clientes)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  table_suffix TEXT UNIQUE NOT NULL,
  config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_tenants" ON tenants 
  FOR ALL USING (auth.role() = 'service_role') 
  WITH CHECK (auth.role() = 'service_role');

-- Insertar tenant masajecorporaldeportivo
INSERT INTO tenants (slug, name, table_suffix, config, active)
VALUES (
  'masajecorporaldeportivo',
  'Masaje Corporal Deportivo',
  'masajecorporaldeportivo',
  '{"primaryColor": "#667eea", "secondaryColor": "#764ba2"}',
  true
) ON CONFLICT (slug) DO NOTHING;

-- 2. TABLA PATIENTS
CREATE TABLE patients_masajecorporaldeportivo (
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

CREATE INDEX idx_patients_mcd_dni ON patients_masajecorporaldeportivo(dni) WHERE dni IS NOT NULL;
CREATE INDEX idx_patients_mcd_phone ON patients_masajecorporaldeportivo(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_patients_mcd_name ON patients_masajecorporaldeportivo(last_name, first_name);

ALTER TABLE patients_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_patients_mcd" ON patients_masajecorporaldeportivo
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. TABLA APPOINTMENTS
CREATE TABLE appointments_masajecorporaldeportivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients_masajecorporaldeportivo(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_mcd_patient ON appointments_masajecorporaldeportivo(patient_id);
CREATE INDEX idx_appointments_mcd_start ON appointments_masajecorporaldeportivo(start_time);

ALTER TABLE appointments_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_appointments_mcd" ON appointments_masajecorporaldeportivo
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. TABLA CREDIT_PACKS
CREATE TABLE credit_packs_masajecorporaldeportivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients_masajecorporaldeportivo(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  units_total INTEGER NOT NULL,
  units_remaining INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_packs_mcd_patient ON credit_packs_masajecorporaldeportivo(patient_id);

ALTER TABLE credit_packs_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_credit_packs_mcd" ON credit_packs_masajecorporaldeportivo
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. TABLA CREDIT_REDEMPTIONS
CREATE TABLE credit_redemptions_masajecorporaldeportivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments_masajecorporaldeportivo(id) ON DELETE CASCADE,
  credit_pack_id UUID NOT NULL REFERENCES credit_packs_masajecorporaldeportivo(id) ON DELETE CASCADE,
  units_used INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemptions_mcd_appointment ON credit_redemptions_masajecorporaldeportivo(appointment_id);
CREATE INDEX idx_redemptions_mcd_credit_pack ON credit_redemptions_masajecorporaldeportivo(credit_pack_id);

ALTER TABLE credit_redemptions_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_redemptions_mcd" ON credit_redemptions_masajecorporaldeportivo
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 6. TABLA FILES
CREATE TABLE files_masajecorporaldeportivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients_masajecorporaldeportivo(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_mcd_patient ON files_masajecorporaldeportivo(patient_id);

ALTER TABLE files_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_files_mcd" ON files_masajecorporaldeportivo
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 7. TABLA CONFIG
CREATE TABLE config_masajecorporaldeportivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE config_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srfa_config_mcd" ON config_masajecorporaldeportivo
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Insertar configuración por defecto
INSERT INTO config_masajecorporaldeportivo (key, value) VALUES
  ('prices', '{"sesion30": 2500, "sesion60": 4000, "bono5_30": 11000, "bono5_60": 17500, "bono10_30": 20000, "bono10_60": 32000}'),
  ('clinic_info', '{"name": "Masaje Corporal Deportivo", "phone": "", "email": "masajecorporaldeportivo@gmail.com", "address": ""}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- FIN DEL SETUP - 7 TABLAS CREADAS
-- ============================================================
