-- Script para configurar base de datos Supabase
-- Ejecutar en SQL Editor del dashboard de Supabase

-- 1. Crear tablas si no existen
CREATE TABLE IF NOT EXISTS public."Patient" (
    id SERIAL PRIMARY KEY,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    "dateOfBirth" DATE,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."Appointment" (
    id SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL REFERENCES public."Patient"(id) ON DELETE CASCADE,
    start TIMESTAMP WITH TIME ZONE NOT NULL,
    "end" TIMESTAMP WITH TIME ZONE NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    "consumesCredit" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."CreditPack" (
    id SERIAL PRIMARY KEY,
    "patientId" INTEGER NOT NULL REFERENCES public."Patient"(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    "unitsTotal" INTEGER NOT NULL,
    "unitMinutes" INTEGER NOT NULL DEFAULT 60,
    "priceCents" INTEGER NOT NULL,
    "unitsRemaining" INTEGER NOT NULL,
    paid BOOLEAN DEFAULT false,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."CreditRedemption" (
    id SERIAL PRIMARY KEY,
    "creditPackId" INTEGER NOT NULL REFERENCES public."CreditPack"(id) ON DELETE CASCADE,
    "appointmentId" INTEGER NOT NULL REFERENCES public."Appointment"(id) ON DELETE CASCADE,
    "unitsUsed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public."Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditPack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CreditRedemption" ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes si existen (para evitar duplicados)
DROP POLICY IF EXISTS "service_role_all_access_patient" ON public."Patient";
DROP POLICY IF EXISTS "service_role_all_access_appointment" ON public."Appointment";
DROP POLICY IF EXISTS "service_role_all_access_creditpack" ON public."CreditPack";
DROP POLICY IF EXISTS "service_role_all_access_creditredemption" ON public."CreditRedemption";

DROP POLICY IF EXISTS "anon_read_access_patient" ON public."Patient";
DROP POLICY IF EXISTS "anon_insert_access_patient" ON public."Patient";
DROP POLICY IF EXISTS "anon_update_access_patient" ON public."Patient";
DROP POLICY IF EXISTS "anon_delete_access_patient" ON public."Patient";

DROP POLICY IF EXISTS "anon_read_access_appointment" ON public."Appointment";
DROP POLICY IF EXISTS "anon_insert_access_appointment" ON public."Appointment";
DROP POLICY IF EXISTS "anon_update_access_appointment" ON public."Appointment";
DROP POLICY IF EXISTS "anon_delete_access_appointment" ON public."Appointment";

DROP POLICY IF EXISTS "anon_read_access_creditpack" ON public."CreditPack";
DROP POLICY IF EXISTS "anon_insert_access_creditpack" ON public."CreditPack";
DROP POLICY IF EXISTS "anon_update_access_creditpack" ON public."CreditPack";
DROP POLICY IF EXISTS "anon_delete_access_creditpack" ON public."CreditPack";

DROP POLICY IF EXISTS "anon_read_access_creditredemption" ON public."CreditRedemption";
DROP POLICY IF EXISTS "anon_insert_access_creditredemption" ON public."CreditRedemption";
DROP POLICY IF EXISTS "anon_update_access_creditredemption" ON public."CreditRedemption";
DROP POLICY IF EXISTS "anon_delete_access_creditredemption" ON public."CreditRedemption";

-- 4. Crear políticas permisivas para service_role
CREATE POLICY "service_role_all_access_patient" ON public."Patient"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access_appointment" ON public."Appointment"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access_creditpack" ON public."CreditPack"
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_access_creditredemption" ON public."CreditRedemption"
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Políticas permisivas para anon (sin autenticación)
CREATE POLICY "anon_read_access_patient" ON public."Patient"
    FOR SELECT USING (true);

CREATE POLICY "anon_insert_access_patient" ON public."Patient"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_access_patient" ON public."Patient"
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_access_patient" ON public."Patient"
    FOR DELETE USING (true);

-- Repetir para Appointment
CREATE POLICY "anon_read_access_appointment" ON public."Appointment"
    FOR SELECT USING (true);

CREATE POLICY "anon_insert_access_appointment" ON public."Appointment"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_access_appointment" ON public."Appointment"
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_access_appointment" ON public."Appointment"
    FOR DELETE USING (true);

-- Repetir para CreditPack
CREATE POLICY "anon_read_access_creditpack" ON public."CreditPack"
    FOR SELECT USING (true);

CREATE POLICY "anon_insert_access_creditpack" ON public."CreditPack"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_access_creditpack" ON public."CreditPack"
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_access_creditpack" ON public."CreditPack"
    FOR DELETE USING (true);

-- Repetir para CreditRedemption
CREATE POLICY "anon_read_access_creditredemption" ON public."CreditRedemption"
    FOR SELECT USING (true);

CREATE POLICY "anon_insert_access_creditredemption" ON public."CreditRedemption"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_access_creditredemption" ON public."CreditRedemption"
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_access_creditredemption" ON public."CreditRedemption"
    FOR DELETE USING (true);

-- 6. Verificar que las tablas existen
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Patient', 'Appointment', 'CreditPack', 'CreditRedemption');

-- 7. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';

COMMENT ON SCRIPT IS 'Script de configuración completa para Supabase - Clínica';