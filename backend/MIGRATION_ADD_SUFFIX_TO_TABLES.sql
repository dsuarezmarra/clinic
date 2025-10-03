-- ============================================================
-- MIGRATION: Añadir sufijo _masajecorporaldeportivo a tablas
-- Fecha: 3 de octubre de 2025
-- Descripción: Renombrar patient_files, invoices, invoice_items
--              para que sean multi-tenant compatibles
-- ============================================================

-- IMPORTANTE: Ejecutar este script EN ORDEN en Supabase SQL Editor

-- ============================================================
-- PASO 1: Renombrar las tablas
-- ============================================================

ALTER TABLE public.patient_files 
  RENAME TO patient_files_masajecorporaldeportivo;

ALTER TABLE public.invoices 
  RENAME TO invoices_masajecorporaldeportivo;

ALTER TABLE public.invoice_items 
  RENAME TO invoice_items_masajecorporaldeportivo;

-- ============================================================
-- PASO 2: Actualizar los constraints (foreign keys)
-- ============================================================

-- Patient Files: Actualizar FK a patients
ALTER TABLE public.patient_files_masajecorporaldeportivo 
  DROP CONSTRAINT IF EXISTS patient_files_patientId_fkey,
  ADD CONSTRAINT patient_files_patientId_fkey 
    FOREIGN KEY (patientId) REFERENCES public.patients_masajecorporaldeportivo(id) ON DELETE CASCADE;

-- Invoices: Actualizar FK a patients
ALTER TABLE public.invoices_masajecorporaldeportivo 
  DROP CONSTRAINT IF EXISTS invoices_patientId_fkey,
  ADD CONSTRAINT invoices_patientId_fkey 
    FOREIGN KEY (patientId) REFERENCES public.patients_masajecorporaldeportivo(id) ON DELETE CASCADE;

-- Invoice Items: Actualizar FK a appointments e invoices
ALTER TABLE public.invoice_items_masajecorporaldeportivo 
  DROP CONSTRAINT IF EXISTS invoice_items_appointmentId_fkey,
  DROP CONSTRAINT IF EXISTS invoice_items_invoiceId_fkey,
  ADD CONSTRAINT invoice_items_appointmentId_fkey 
    FOREIGN KEY (appointmentId) REFERENCES public.appointments_masajecorporaldeportivo(id) ON DELETE CASCADE,
  ADD CONSTRAINT invoice_items_invoiceId_fkey 
    FOREIGN KEY (invoiceId) REFERENCES public.invoices_masajecorporaldeportivo(id) ON DELETE CASCADE;

-- ============================================================
-- PASO 3: Verificar que todo está correcto
-- ============================================================

-- Ver las tablas renombradas
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%masajecorporaldeportivo%'
ORDER BY tablename;

-- Ver las foreign keys actualizadas
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (tc.table_name LIKE '%patient_files%' 
       OR tc.table_name LIKE '%invoice%')
ORDER BY tc.table_name;

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- Las siguientes tablas deben existir:
--   ✅ patient_files_masajecorporaldeportivo
--   ✅ invoices_masajecorporaldeportivo
--   ✅ invoice_items_masajecorporaldeportivo
--
-- Las siguientes foreign keys deben estar correctas:
--   ✅ patient_files_masajecorporaldeportivo.patientId -> patients_masajecorporaldeportivo.id
--   ✅ invoices_masajecorporaldeportivo.patientId -> patients_masajecorporaldeportivo.id
--   ✅ invoice_items_masajecorporaldeportivo.appointmentId -> appointments_masajecorporaldeportivo.id
--   ✅ invoice_items_masajecorporaldeportivo.invoiceId -> invoices_masajecorporaldeportivo.id
-- ============================================================
