-- =========================================================
-- FIX: Columnas con nombres camelCase
-- =========================================================
-- PROBLEMA: Las columnas se crearon sin comillas dobles, 
-- por lo que PostgreSQL las convirtió a minúsculas.
--
-- SOLUCIÓN: Primero eliminar las tablas vacías y recrearlas
-- con los nombres correctos usando comillas dobles.
-- =========================================================
-- EJECUTAR EN: Supabase Personal (kctoxebchyrgkwofdkht)
-- =========================================================

-- PASO 1: Verificar qué columnas existen actualmente
-- (Ejecutar esto primero para diagnóstico)

SELECT 
    table_name, 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'patients_masajecorporaldeportivo'
ORDER BY ordinal_position;

-- =========================================================
-- PASO 2: Si las columnas están en minúsculas, eliminar
-- las tablas vacías y recrearlas con comillas dobles
-- =========================================================

-- Eliminar tablas en orden inverso de dependencias
DROP TABLE IF EXISTS public.invoice_items_actifisio CASCADE;
DROP TABLE IF EXISTS public.invoice_items_masajecorporaldeportivo CASCADE;
DROP TABLE IF EXISTS public.credit_redemptions_actifisio CASCADE;
DROP TABLE IF EXISTS public.credit_redemptions_masajecorporaldeportivo CASCADE;
DROP TABLE IF EXISTS public.patient_files_actifisio CASCADE;
DROP TABLE IF EXISTS public.patient_files_masajecorporaldeportivo CASCADE;
DROP TABLE IF EXISTS public.invoices_actifisio CASCADE;
DROP TABLE IF EXISTS public.invoices_masajecorporaldeportivo CASCADE;
DROP TABLE IF EXISTS public.credit_packs_actifisio CASCADE;
DROP TABLE IF EXISTS public.credit_packs_masajecorporaldeportivo CASCADE;
DROP TABLE IF EXISTS public.appointments_actifisio CASCADE;
DROP TABLE IF EXISTS public.appointments_masajecorporaldeportivo CASCADE;
DROP TABLE IF EXISTS public.patients_actifisio CASCADE;
DROP TABLE IF EXISTS public.patients_masajecorporaldeportivo CASCADE;

-- Mantener: tenants, user_profiles, configurations_*, backups_*

-- =========================================================
-- PASO 3: Recrear tablas con comillas dobles para preservar camelCase
-- =========================================================

-- PATIENTS ACTIFISIO
CREATE TABLE IF NOT EXISTS public.patients_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  dni text NOT NULL,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  cp text,
  city text,
  province text,
  "birthDate" timestamp without time zone,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  phone2 text,
  family_contact text,
  "fechaRegistro" timestamp without time zone,
  CONSTRAINT patients_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT patients_actifisio_dni_key UNIQUE (dni)
);

-- PATIENTS MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.patients_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  dni text NOT NULL,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  cp text,
  city text,
  province text,
  "birthDate" timestamp without time zone,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  phone2 text,
  family_contact text,
  "fechaRegistro" timestamp without time zone,
  CONSTRAINT patients_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT patients_masajecorporaldeportivo_dni_key UNIQUE (dni)
);

-- APPOINTMENTS ACTIFISIO
CREATE TABLE IF NOT EXISTS public.appointments_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" text,
  start timestamp without time zone NOT NULL,
  "end" timestamp without time zone NOT NULL,
  "durationMinutes" integer NOT NULL DEFAULT 30,
  "priceCents" integer,
  status text NOT NULL DEFAULT 'BOOKED'::text,
  notes text,
  "consumesCredit" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_actifisio_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_actifisio(id)
);

-- APPOINTMENTS MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.appointments_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" text,
  start timestamp without time zone NOT NULL,
  "end" timestamp without time zone NOT NULL,
  "durationMinutes" integer NOT NULL DEFAULT 30,
  "priceCents" integer,
  status text NOT NULL DEFAULT 'BOOKED'::text,
  notes text,
  "consumesCredit" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_masajecorporaldeportivo_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- CREDIT_PACKS ACTIFISIO
CREATE TABLE IF NOT EXISTS public.credit_packs_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" text NOT NULL,
  type text NOT NULL,
  "totalSessions" integer NOT NULL,
  "remainingSessions" integer NOT NULL,
  "pricePerSession" numeric(10,2),
  "totalPrice" numeric(10,2),
  "purchaseDate" timestamp without time zone DEFAULT now(),
  "expirationDate" timestamp without time zone,
  status text DEFAULT 'ACTIVE'::text,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_packs_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT credit_packs_actifisio_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_actifisio(id)
);

-- CREDIT_PACKS MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.credit_packs_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" text NOT NULL,
  type text NOT NULL,
  "totalSessions" integer NOT NULL,
  "remainingSessions" integer NOT NULL,
  "pricePerSession" numeric(10,2),
  "totalPrice" numeric(10,2),
  "purchaseDate" timestamp without time zone DEFAULT now(),
  "expirationDate" timestamp without time zone,
  status text DEFAULT 'ACTIVE'::text,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_packs_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT credit_packs_masajecorporaldeportivo_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- INVOICES ACTIFISIO
CREATE TABLE IF NOT EXISTS public.invoices_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "invoiceNumber" text NOT NULL,
  "patientId" text,
  "issueDate" timestamp without time zone DEFAULT now(),
  "dueDate" timestamp without time zone,
  "subtotal" numeric(10,2) DEFAULT 0,
  "taxRate" numeric(5,2) DEFAULT 21,
  "taxAmount" numeric(10,2) DEFAULT 0,
  "total" numeric(10,2) DEFAULT 0,
  status text DEFAULT 'DRAFT'::text,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoices_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_actifisio_invoicenumber_key UNIQUE ("invoiceNumber"),
  CONSTRAINT invoices_actifisio_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_actifisio(id)
);

-- INVOICES MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.invoices_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "invoiceNumber" text NOT NULL,
  "patientId" text,
  "issueDate" timestamp without time zone DEFAULT now(),
  "dueDate" timestamp without time zone,
  "subtotal" numeric(10,2) DEFAULT 0,
  "taxRate" numeric(5,2) DEFAULT 21,
  "taxAmount" numeric(10,2) DEFAULT 0,
  "total" numeric(10,2) DEFAULT 0,
  status text DEFAULT 'DRAFT'::text,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoices_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_masajecorporaldeportivo_invoicenumber_key UNIQUE ("invoiceNumber"),
  CONSTRAINT invoices_masajecorporaldeportivo_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- PATIENT_FILES ACTIFISIO
CREATE TABLE IF NOT EXISTS public.patient_files_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" text NOT NULL,
  "fileName" text NOT NULL,
  "fileType" text,
  "fileSize" integer,
  "storagePath" text NOT NULL,
  description text,
  "uploadedAt" timestamp without time zone DEFAULT now(),
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_files_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT patient_files_actifisio_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_actifisio(id)
);

-- PATIENT_FILES MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.patient_files_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "patientId" text NOT NULL,
  "fileName" text NOT NULL,
  "fileType" text,
  "fileSize" integer,
  "storagePath" text NOT NULL,
  description text,
  "uploadedAt" timestamp without time zone DEFAULT now(),
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_files_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT patient_files_masajecorporaldeportivo_patientid_fkey FOREIGN KEY ("patientId") REFERENCES public.patients_masajecorporaldeportivo(id)
);

-- CREDIT_REDEMPTIONS ACTIFISIO
CREATE TABLE IF NOT EXISTS public.credit_redemptions_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "creditPackId" text NOT NULL,
  "appointmentId" text,
  "redemptionDate" timestamp without time zone DEFAULT now(),
  "sessionsUsed" integer DEFAULT 1,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_redemptions_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT credit_redemptions_actifisio_creditpackid_fkey FOREIGN KEY ("creditPackId") REFERENCES public.credit_packs_actifisio(id),
  CONSTRAINT credit_redemptions_actifisio_appointmentid_fkey FOREIGN KEY ("appointmentId") REFERENCES public.appointments_actifisio(id)
);

-- CREDIT_REDEMPTIONS MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.credit_redemptions_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "creditPackId" text NOT NULL,
  "appointmentId" text,
  "redemptionDate" timestamp without time zone DEFAULT now(),
  "sessionsUsed" integer DEFAULT 1,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_redemptions_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT credit_redemptions_masajecorporaldeportivo_creditpackid_fkey FOREIGN KEY ("creditPackId") REFERENCES public.credit_packs_masajecorporaldeportivo(id),
  CONSTRAINT credit_redemptions_masajecorporaldeportivo_appointmentid_fkey FOREIGN KEY ("appointmentId") REFERENCES public.appointments_masajecorporaldeportivo(id)
);

-- INVOICE_ITEMS ACTIFISIO
CREATE TABLE IF NOT EXISTS public.invoice_items_actifisio (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "invoiceId" text NOT NULL,
  description text NOT NULL,
  quantity integer DEFAULT 1,
  "unitPrice" numeric(10,2) NOT NULL,
  "totalPrice" numeric(10,2) NOT NULL,
  "appointmentId" text,
  "creditPackId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoice_items_actifisio_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_actifisio_invoiceid_fkey FOREIGN KEY ("invoiceId") REFERENCES public.invoices_actifisio(id) ON DELETE CASCADE
);

-- INVOICE_ITEMS MASAJECORPORALDEPORTIVO
CREATE TABLE IF NOT EXISTS public.invoice_items_masajecorporaldeportivo (
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  "invoiceId" text NOT NULL,
  description text NOT NULL,
  quantity integer DEFAULT 1,
  "unitPrice" numeric(10,2) NOT NULL,
  "totalPrice" numeric(10,2) NOT NULL,
  "appointmentId" text,
  "creditPackId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoice_items_masajecorporaldeportivo_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_masajecorporaldeportivo_invoiceid_fkey FOREIGN KEY ("invoiceId") REFERENCES public.invoices_masajecorporaldeportivo(id) ON DELETE CASCADE
);

-- =========================================================
-- PASO 4: Habilitar RLS en todas las tablas recreadas
-- =========================================================

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
-- PASO 5: Crear políticas de acceso
-- =========================================================

-- Patients
CREATE POLICY "anon_full_access_patients_actifisio" ON public.patients_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_patients_masajecorporaldeportivo" ON public.patients_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- Appointments
CREATE POLICY "anon_full_access_appointments_actifisio" ON public.appointments_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_appointments_masajecorporaldeportivo" ON public.appointments_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- Credit Packs
CREATE POLICY "anon_full_access_credit_packs_actifisio" ON public.credit_packs_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_credit_packs_masajecorporaldeportivo" ON public.credit_packs_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- Invoices
CREATE POLICY "anon_full_access_invoices_actifisio" ON public.invoices_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_invoices_masajecorporaldeportivo" ON public.invoices_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- Patient Files
CREATE POLICY "anon_full_access_patient_files_actifisio" ON public.patient_files_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_patient_files_masajecorporaldeportivo" ON public.patient_files_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- Credit Redemptions
CREATE POLICY "anon_full_access_credit_redemptions_actifisio" ON public.credit_redemptions_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_credit_redemptions_masajecorporaldeportivo" ON public.credit_redemptions_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- Invoice Items
CREATE POLICY "anon_full_access_invoice_items_actifisio" ON public.invoice_items_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_full_access_invoice_items_masajecorporaldeportivo" ON public.invoice_items_masajecorporaldeportivo FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- ¡LISTO! Después de ejecutar esto, vuelve a ejecutar
-- el script de migración de datos: node scripts/migrate-data.js
-- =========================================================
