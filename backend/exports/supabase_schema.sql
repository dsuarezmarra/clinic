-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id text NOT NULL DEFAULT gen_random_uuid(),
  patientId text,
  start timestamp without time zone NOT NULL,
  end timestamp without time zone NOT NULL,
  durationMinutes integer NOT NULL DEFAULT 30,
  priceCents integer,
  status text NOT NULL DEFAULT 'BOOKED'::text,
  notes text,
  consumesCredit boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id)
);
CREATE TABLE public.configurations (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT configurations_pkey PRIMARY KEY (key)
);
CREATE TABLE public.credit_packs (
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
  CONSTRAINT credit_packs_pkey PRIMARY KEY (id),
  CONSTRAINT credit_packs_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id)
);
CREATE TABLE public.credit_redemptions (
  id text NOT NULL DEFAULT gen_random_uuid(),
  creditPackId text NOT NULL,
  appointmentId text NOT NULL,
  unitsUsed integer NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT credit_redemptions_creditPackId_fkey FOREIGN KEY (creditPackId) REFERENCES public.credit_packs(id),
  CONSTRAINT credit_redemptions_appointmentId_fkey FOREIGN KEY (appointmentId) REFERENCES public.appointments(id)
);
CREATE TABLE public.invoice_items (
  id text NOT NULL DEFAULT gen_random_uuid(),
  invoiceId text NOT NULL,
  appointmentId text,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unitPrice integer NOT NULL,
  totalPrice integer NOT NULL,
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_appointmentId_fkey FOREIGN KEY (appointmentId) REFERENCES public.appointments(id),
  CONSTRAINT invoice_items_invoiceId_fkey FOREIGN KEY (invoiceId) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
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
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id)
);
CREATE TABLE public.patient_files (
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
  CONSTRAINT patient_files_pkey PRIMARY KEY (id),
  CONSTRAINT patient_files_patientId_fkey FOREIGN KEY (patientId) REFERENCES public.patients(id)
);
CREATE TABLE public.patients (
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
  CONSTRAINT patients_pkey PRIMARY KEY (id)
);
