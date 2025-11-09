-- =====================================================
-- AGREGAR FOREIGN KEYS A TABLAS DE ACTIFISIO
-- =====================================================
-- Fecha: 03/10/2025
-- Propósito: Establecer las mismas relaciones que tiene
--            masajecorporaldeportivo en las tablas actifisio
-- 
-- IMPORTANTE: Usar comillas dobles para columnas en camelCase
-- =====================================================

-- =====================================================
-- 1. APPOINTMENTS_ACTIFISIO
-- =====================================================
-- Relación con patients_actifisio
ALTER TABLE public.appointments_actifisio
ADD CONSTRAINT appointments_actifisio_patientId_fkey 
FOREIGN KEY ("patientId") 
REFERENCES public.patients_actifisio(id)
ON DELETE CASCADE;

-- =====================================================
-- 2. CREDIT_PACKS_ACTIFISIO
-- =====================================================
-- Relación con patients_actifisio
ALTER TABLE public.credit_packs_actifisio
ADD CONSTRAINT credit_packs_actifisio_patientId_fkey 
FOREIGN KEY ("patientId") 
REFERENCES public.patients_actifisio(id)
ON DELETE CASCADE;

-- =====================================================
-- 3. CREDIT_REDEMPTIONS_ACTIFISIO
-- =====================================================
-- Relación con credit_packs_actifisio
ALTER TABLE public.credit_redemptions_actifisio
ADD CONSTRAINT credit_redemptions_actifisio_creditPackId_fkey 
FOREIGN KEY ("creditPackId") 
REFERENCES public.credit_packs_actifisio(id)
ON DELETE CASCADE;

-- Relación con appointments_actifisio
ALTER TABLE public.credit_redemptions_actifisio
ADD CONSTRAINT credit_redemptions_actifisio_appointmentId_fkey 
FOREIGN KEY ("appointmentId") 
REFERENCES public.appointments_actifisio(id)
ON DELETE CASCADE;

-- =====================================================
-- 4. PATIENT_FILES_ACTIFISIO
-- =====================================================
-- Relación con patients_actifisio
ALTER TABLE public.patient_files_actifisio
ADD CONSTRAINT patient_files_actifisio_patientId_fkey 
FOREIGN KEY ("patientId") 
REFERENCES public.patients_actifisio(id)
ON DELETE CASCADE;

-- =====================================================
-- 5. INVOICES_ACTIFISIO
-- =====================================================
-- Relación con patients_actifisio
ALTER TABLE public.invoices_actifisio
ADD CONSTRAINT invoices_actifisio_patientId_fkey 
FOREIGN KEY ("patientId") 
REFERENCES public.patients_actifisio(id)
ON DELETE SET NULL;  -- SET NULL porque la factura puede existir sin paciente

-- =====================================================
-- 6. INVOICE_ITEMS_ACTIFISIO
-- =====================================================
-- Relación con invoices_actifisio
ALTER TABLE public.invoice_items_actifisio
ADD CONSTRAINT invoice_items_actifisio_invoiceId_fkey 
FOREIGN KEY ("invoiceId") 
REFERENCES public.invoices_actifisio(id)
ON DELETE CASCADE;

-- Relación con appointments_actifisio
ALTER TABLE public.invoice_items_actifisio
ADD CONSTRAINT invoice_items_actifisio_appointmentId_fkey 
FOREIGN KEY ("appointmentId") 
REFERENCES public.appointments_actifisio(id)
ON DELETE SET NULL;  -- SET NULL porque el item puede existir sin appointment

-- =====================================================
-- VERIFICACIÓN DE FOREIGN KEYS
-- =====================================================
-- Ejecutar esta query para verificar que se crearon correctamente
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE '%_actifisio'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- RESULTADO ESPERADO DE LA VERIFICACIÓN
-- =====================================================
-- Deberías ver 8 foreign keys en total:
--
-- 1. appointments_actifisio_patientId_fkey
--    appointments_actifisio.patientId → patients_actifisio.id
--
-- 2. credit_packs_actifisio_patientId_fkey
--    credit_packs_actifisio.patientId → patients_actifisio.id
--
-- 3. credit_redemptions_actifisio_creditPackId_fkey
--    credit_redemptions_actifisio.creditPackId → credit_packs_actifisio.id
--
-- 4. credit_redemptions_actifisio_appointmentId_fkey
--    credit_redemptions_actifisio.appointmentId → appointments_actifisio.id
--
-- 5. patient_files_actifisio_patientId_fkey
--    patient_files_actifisio.patientId → patients_actifisio.id
--
-- 6. invoices_actifisio_patientId_fkey
--    invoices_actifisio.patientId → patients_actifisio.id
--
-- 7. invoice_items_actifisio_invoiceId_fkey
--    invoice_items_actifisio.invoiceId → invoices_actifisio.id
--
-- 8. invoice_items_actifisio_appointmentId_fkey
--    invoice_items_actifisio.appointmentId → appointments_actifisio.id
-- =====================================================

-- =====================================================
-- ÍNDICES RECOMENDADOS (OPCIONAL - MEJORA PERFORMANCE)
-- =====================================================
-- Estos índices mejoran el rendimiento de las consultas
-- que usan las foreign keys

-- Índice para appointments_actifisio.patientId
CREATE INDEX IF NOT EXISTS idx_appointments_actifisio_patientId 
ON public.appointments_actifisio("patientId");

-- Índice para credit_packs_actifisio.patientId
CREATE INDEX IF NOT EXISTS idx_credit_packs_actifisio_patientId 
ON public.credit_packs_actifisio("patientId");

-- Índice para credit_redemptions_actifisio.creditPackId
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_actifisio_creditPackId 
ON public.credit_redemptions_actifisio("creditPackId");

-- Índice para credit_redemptions_actifisio.appointmentId
CREATE INDEX IF NOT EXISTS idx_credit_redemptions_actifisio_appointmentId 
ON public.credit_redemptions_actifisio("appointmentId");

-- Índice para patient_files_actifisio.patientId
CREATE INDEX IF NOT EXISTS idx_patient_files_actifisio_patientId 
ON public.patient_files_actifisio("patientId");

-- Índice para invoices_actifisio.patientId
CREATE INDEX IF NOT EXISTS idx_invoices_actifisio_patientId 
ON public.invoices_actifisio("patientId");

-- Índice para invoice_items_actifisio.invoiceId
CREATE INDEX IF NOT EXISTS idx_invoice_items_actifisio_invoiceId 
ON public.invoice_items_actifisio("invoiceId");

-- Índice para invoice_items_actifisio.appointmentId
CREATE INDEX IF NOT EXISTS idx_invoice_items_actifisio_appointmentId 
ON public.invoice_items_actifisio("appointmentId");

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES
-- =====================================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE '%_actifisio'
ORDER BY tablename, indexname;

-- =====================================================
-- RESUMEN DE CAMBIOS
-- =====================================================
-- ✅ 8 Foreign Keys agregadas
-- ✅ 8 Índices creados para optimizar performance
-- ✅ Integridad referencial garantizada
-- ✅ Paridad total con tablas masajecorporaldeportivo
-- =====================================================

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- ON DELETE CASCADE:
--   - Si se elimina un paciente, se eliminan todas sus citas,
--     packs de créditos, archivos, etc.
--   - Si se elimina una cita, se eliminan sus redenciones de crédito
--     y referencias en invoice_items
--
-- ON DELETE SET NULL:
--   - Si se elimina un paciente, las facturas quedan huérfanas
--     (patientId = NULL) pero no se eliminan
--   - Si se elimina una cita, los invoice_items quedan sin cita
--     pero no se eliminan
--
-- Esto es INTENCIONAL para mantener histórico de facturación
-- =====================================================
