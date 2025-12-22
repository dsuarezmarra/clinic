-- ========================================================
-- Script para crear tablas en Supabase Personal
-- Generado desde la exportación del Supabase del trabajo
-- ========================================================

-- Secuencia para backups (usada por ambos tenants)
CREATE SEQUENCE IF NOT EXISTS backups_id_seq;

-- ========================================================
-- TABLA: tenants
-- ========================================================
CREATE TABLE IF NOT EXISTS tenants (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
    settings jsonb DEFAULT '{}'::jsonb
);

-- ========================================================
-- TABLA: user_profiles
-- ========================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'user',
    tenant_slug text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: patients (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS patients_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    dni text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    email text,
    "birthDate" date,
    address text,
    city text,
    "postalCode" text,
    notes text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    dni text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    email text,
    "birthDate" date,
    address text,
    city text,
    "postalCode" text,
    notes text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: appointments (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS appointments_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text,
    start timestamp without time zone NOT NULL,
    "end" timestamp without time zone NOT NULL,
    status text NOT NULL DEFAULT 'BOOKED',
    notes text,
    "durationMinutes" integer NOT NULL DEFAULT 30,
    "priceCents" integer,
    "consumesCredit" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text,
    start timestamp without time zone NOT NULL,
    "end" timestamp without time zone NOT NULL,
    status text NOT NULL DEFAULT 'BOOKED',
    notes text,
    "durationMinutes" integer NOT NULL DEFAULT 30,
    "priceCents" integer,
    "consumesCredit" boolean NOT NULL DEFAULT true,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
    "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: credit_packs (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS credit_packs_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text NOT NULL,
    label text NOT NULL,
    "unitsTotal" integer NOT NULL,
    "unitsRemaining" integer NOT NULL,
    "unitMinutes" integer NOT NULL DEFAULT 30,
    "priceCents" integer NOT NULL DEFAULT 0,
    paid boolean NOT NULL DEFAULT false,
    notes text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_packs_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text NOT NULL,
    label text NOT NULL,
    "unitsTotal" integer NOT NULL,
    "unitsRemaining" integer NOT NULL,
    "unitMinutes" integer NOT NULL DEFAULT 30,
    "priceCents" integer NOT NULL DEFAULT 0,
    paid boolean NOT NULL DEFAULT false,
    notes text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: credit_redemptions (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS credit_redemptions_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "creditPackId" text NOT NULL,
    "appointmentId" text NOT NULL,
    "unitsUsed" integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_redemptions_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "creditPackId" text NOT NULL,
    "appointmentId" text NOT NULL,
    "unitsUsed" integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: invoices (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS invoices_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text,
    number text NOT NULL,
    year integer NOT NULL,
    sequence integer NOT NULL,
    "issueDate" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description text,
    "grossAmount" integer NOT NULL,
    "vatAmount" integer NOT NULL,
    "totalAmount" integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text,
    number text NOT NULL,
    year integer NOT NULL,
    sequence integer NOT NULL,
    "issueDate" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description text,
    "grossAmount" integer NOT NULL,
    "vatAmount" integer NOT NULL,
    "totalAmount" integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: invoice_items (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS invoice_items_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceId" text NOT NULL,
    "appointmentId" text,
    description text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    "unitPrice" integer NOT NULL,
    "totalPrice" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_items_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceId" text NOT NULL,
    "appointmentId" text,
    description text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    "unitPrice" integer NOT NULL,
    "totalPrice" integer NOT NULL
);

-- ========================================================
-- TABLAS: patient_files (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS patient_files_masajecorporaldeportivo (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    "uploadedAt" timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_files_actifisio (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    "patientId" text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    "uploadedAt" timestamp without time zone NOT NULL DEFAULT now()
);

-- ========================================================
-- TABLAS: configurations (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS configurations_masajecorporaldeportivo (
    key text PRIMARY KEY,
    value text NOT NULL
);

CREATE TABLE IF NOT EXISTS configurations_actifisio (
    key text PRIMARY KEY,
    value text NOT NULL
);

-- ========================================================
-- TABLAS: backups (ambos tenants)
-- ========================================================
CREATE TABLE IF NOT EXISTS backups_masajecorporaldeportivo (
    id bigint PRIMARY KEY DEFAULT nextval('backups_id_seq'),
    file_name text NOT NULL,
    data jsonb NOT NULL,
    size_bytes bigint DEFAULT 0,
    created timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backups_actifisio (
    id bigint PRIMARY KEY DEFAULT nextval('backups_id_seq'),
    file_name text NOT NULL,
    data jsonb NOT NULL,
    size_bytes bigint DEFAULT 0,
    created timestamp with time zone DEFAULT now()
);

-- ========================================================
-- Insertar tenants iniciales
-- ========================================================
INSERT INTO tenants (id, slug, name, settings) VALUES
    (gen_random_uuid(), 'masajecorporaldeportivo', 'Masaje Corporal Deportivo', '{}'),
    (gen_random_uuid(), 'actifisio', 'Actifisio', '{}')
ON CONFLICT (slug) DO NOTHING;

-- ========================================================
-- Habilitar RLS en todas las tablas
-- ========================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups_actifisio ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- Políticas RLS - Permitir todo para service_role
-- ========================================================
-- Estas políticas permiten acceso completo usando el service_role key

CREATE POLICY "Allow all for service role" ON tenants FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON patients_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON patients_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON appointments_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON appointments_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON credit_packs_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON credit_packs_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON credit_redemptions_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON credit_redemptions_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON invoices_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON invoices_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON invoice_items_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON invoice_items_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON patient_files_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON patient_files_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON configurations_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON configurations_actifisio FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON backups_masajecorporaldeportivo FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON backups_actifisio FOR ALL USING (true);

-- ========================================================
-- ¡Tablas creadas exitosamente!
-- ========================================================
