-- =========================================================
-- MIGRACIÓN DE SCHEMA: Trabajo -> Personal
-- Proyecto: Clinic (Multi-Cliente)
-- Fecha: 2025-01-XX
-- =========================================================
-- EJECUTAR EN: Supabase Personal (kctoxebchyrgkwofdkht)
-- =========================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. TABLAS DE SISTEMA (sin dependencias)
-- =========================================================

-- Tabla de tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  table_suffix text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

-- Tabla de user_profiles (para autenticación)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  tenant_slug text NOT NULL,
  display_name text,
  role text DEFAULT 'user',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =========================================================
-- 2. TABLAS DE CONFIGURACIÓN (sin dependencias)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.configurations_actifisio (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT configurations_actifisio_pkey PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.configurations_masajecorporaldeportivo (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT configurations_masajecorporaldeportivo_pkey PRIMARY KEY (key)
);

-- =========================================================
-- 3. TABLAS DE BACKUPS (sin dependencias)
-- =========================================================

-- Crear sequence para backups
CREATE SEQUENCE IF NOT EXISTS backups_id_seq;

CREATE TABLE IF NOT EXISTS public.backups_actifisio (
  id bigint NOT NULL DEFAULT nextval('backups_id_seq'::regclass),
  file_name text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  size_bytes bigint DEFAULT 0,
  created timestamp with time zone DEFAULT now(),
  CONSTRAINT backups_actifisio_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.backups_masajecorporaldeportivo (
  id bigint NOT NULL DEFAULT nextval('backups_id_seq'::regclass),
  file_name text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  size_bytes bigint DEFAULT 0,
  created timestamp with time zone DEFAULT now(),
  CONSTRAINT backups_masajecorporaldeportivo_pkey PRIMARY KEY (id)
);

-- =========================================================
-- 4. TABLAS DE PACIENTES (base para otras tablas)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.patients_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  dni text NOT NULL UNIQUE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE,
  address text,
  cp text,
  city text,
  province text,
  birthDate timestamp without time zone,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  phone2 text,
  family_contact text,
  fechaRegistro timestamp without time zone,
  CONSTRAINT patients_actifisio_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.patients_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  dni text NOT NULL UNIQUE,
  firstName text NOT NULL,
  lastName text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE,
  address text,
  cp text,
  city text,
  province text,
  birthDate timestamp without time zone,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  phone2 text,
  family_contact text,
  fechaRegistro timestamp without time zone,
  CONSTRAINT patients_masajecorporaldeportivo_pkey PRIMARY KEY (id)
);

-- =========================================================
-- 5. TABLAS DE CITAS (dependen de patients)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.appointments_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text,
  start timestamp without time zone NOT NULL,
  "end" timestamp without time zone NOT NULL,
  durationMinutes integer NOT NULL DEFAULT 30,
  priceCents integer,
  status text NOT NULL DEFAULT 'BOOKED'::text,
  notes text,
  consumesCredit boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_actifisio_patientid_fkey FOREIGN KEY (patientId) REFERENCES public.patients_actifisio(id)
);

CREATE TABLE IF NOT EXISTS public.appointments_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text,
  start timestamp without time zone NOT NULL,
  "end" timestamp without time zone NOT NULL,
  durationMinutes integer NOT NULL DEFAULT 30,
  priceCents integer,
  status text NOT NULL DEFAULT 'BOOKED'::text,
  notes text,
  consumesCredit boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- =========================================================
-- 6. TABLAS DE PACKS DE CRÉDITOS (dependen de patients)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.credit_packs_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text NOT NULL,
  label text NOT NULL,
  unitsTotal integer NOT NULL,
  unitMinutes integer NOT NULL DEFAULT 30,
  priceCents integer NOT NULL DEFAULT 0,
  unitsRemaining integer NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_packs_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT credit_packs_actifisio_patientid_fkey FOREIGN KEY (patientId) REFERENCES public.patients_actifisio(id)
);

CREATE TABLE IF NOT EXISTS public.credit_packs_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text NOT NULL,
  label text NOT NULL,
  unitsTotal integer NOT NULL,
  unitMinutes integer NOT NULL DEFAULT 30,
  priceCents integer NOT NULL DEFAULT 0,
  unitsRemaining integer NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  notes text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_packs_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT credit_packs_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- =========================================================
-- 7. TABLAS DE FACTURAS (dependen de patients)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.invoices_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  number text NOT NULL,
  year integer NOT NULL,
  sequence integer NOT NULL,
  patientId text,
  issueDate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grossAmount integer NOT NULL,
  vatAmount integer NOT NULL,
  totalAmount integer NOT NULL,
  description text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoices_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_actifisio_patientid_fkey FOREIGN KEY (patientId) REFERENCES public.patients_actifisio(id)
);

CREATE TABLE IF NOT EXISTS public.invoices_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  number text NOT NULL,
  year integer NOT NULL,
  sequence integer NOT NULL,
  patientId text,
  issueDate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grossAmount integer NOT NULL,
  vatAmount integer NOT NULL,
  totalAmount integer NOT NULL,
  description text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoices_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- =========================================================
-- 8. TABLAS DE ARCHIVOS DE PACIENTES (dependen de patients)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.patient_files_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text NOT NULL,
  originalName text NOT NULL,
  storedPath text NOT NULL,
  mimeType text NOT NULL,
  size integer NOT NULL,
  category text NOT NULL DEFAULT 'otro'::text,
  description text,
  checksum text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_files_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT patient_files_actifisio_patientid_fkey FOREIGN KEY (patientId) REFERENCES public.patients_actifisio(id)
);

CREATE TABLE IF NOT EXISTS public.patient_files_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text NOT NULL,
  originalName text NOT NULL,
  storedPath text NOT NULL,
  mimeType text NOT NULL,
  size integer NOT NULL,
  category text NOT NULL DEFAULT 'otro'::text,
  description text,
  checksum text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_files_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT patient_files_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- =========================================================
-- 9. TABLAS DE REDENCIÓN DE CRÉDITOS (dependen de credit_packs y appointments)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.credit_redemptions_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  creditPackId text NOT NULL,
  appointmentId text NOT NULL,
  unitsUsed integer NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_redemptions_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT credit_redemptions_actifisio_creditpackid_fkey FOREIGN KEY (creditPackId) REFERENCES public.credit_packs_actifisio(id),
  CONSTRAINT credit_redemptions_actifisio_appointmentid_fkey FOREIGN KEY (appointmentId) REFERENCES public.appointments_actifisio(id)
);

CREATE TABLE IF NOT EXISTS public.credit_redemptions_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  creditPackId text NOT NULL,
  appointmentId text NOT NULL,
  unitsUsed integer NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_redemptions_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT credit_redemptions_creditPackId_fkey FOREIGN KEY (creditPackId) REFERENCES public.credit_packs_masajecorporaldeportivo(id),
  CONSTRAINT credit_redemptions_appointmentId_fkey FOREIGN KEY (appointmentId) REFERENCES public.appointments_masajecorporaldeportivo(id)
);

-- =========================================================
-- 10. TABLAS DE ITEMS DE FACTURAS (dependen de invoices y appointments)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.invoice_items_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid(),
  invoiceId text NOT NULL,
  appointmentId text,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unitPrice integer NOT NULL,
  totalPrice integer NOT NULL,
  CONSTRAINT invoice_items_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_actifisio_invoiceid_fkey FOREIGN KEY (invoiceId) REFERENCES public.invoices_actifisio(id),
  CONSTRAINT invoice_items_actifisio_appointmentid_fkey FOREIGN KEY (appointmentId) REFERENCES public.appointments_actifisio(id)
);

CREATE TABLE IF NOT EXISTS public.invoice_items_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid(),
  invoiceId text NOT NULL,
  appointmentId text,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unitPrice integer NOT NULL,
  totalPrice integer NOT NULL,
  CONSTRAINT invoice_items_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_appointmentId_fkey FOREIGN KEY (appointmentId) REFERENCES public.appointments_masajecorporaldeportivo(id),
  CONSTRAINT invoice_items_invoiceId_fkey FOREIGN KEY (invoiceId) REFERENCES public.invoices_masajecorporaldeportivo(id)
);

-- =========================================================
-- 11. INSERTAR DATOS INICIALES DE TENANTS
-- =========================================================

INSERT INTO public.tenants (slug, name, table_suffix, active) VALUES
  ('masajecorporaldeportivo', 'Masaje Corporal Deportivo', 'masajecorporaldeportivo', true),
  ('actifisio', 'Actifisio', 'actifisio', true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- 12. HABILITAR RLS (Row Level Security) EN TODAS LAS TABLAS
-- =========================================================

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurations_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configurations_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packs_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_redemptions_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items_masajecorporaldeportivo ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 13. CREAR POLÍTICAS RLS (permitir todo para service_role)
-- =========================================================

-- Política para service_role (backend)
CREATE POLICY "Allow service_role full access" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.configurations_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.configurations_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.backups_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.backups_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.patients_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.patients_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.appointments_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.appointments_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.credit_packs_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.credit_packs_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.invoices_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.invoices_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.patient_files_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.patient_files_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.credit_redemptions_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.credit_redemptions_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.invoice_items_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access" ON public.invoice_items_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- FIN DEL SCRIPT DE MIGRACIÓN
-- =========================================================

-- PRÓXIMOS PASOS:
-- 1. Ejecutar este script en Supabase Personal
-- 2. Crear usuario en Authentication: masajecorporaldeportivo@gmail.com
-- 3. Insertar en user_profiles el registro del usuario
-- 4. Migrar datos de las tablas (ejecutar script de migración de datos)
