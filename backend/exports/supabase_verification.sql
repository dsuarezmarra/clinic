-- Supabase verification script
-- Purpose: run this in Supabase SQL Editor (read-only). It reports per-table totals,
-- per-column non-null counts and percentages, samples and FK orphan checks.
-- Safety: this script is read-only and safe to run.

-- NOTE: some columns use mixedCase identifiers; we quote them where appropriate.

-- =========================================
-- Patients
-- =========================================
SELECT 'patients' AS table_name, count(*) AS total_rows FROM public.patients;

SELECT
  'patients' AS table_name,
  count(*) AS total_rows,
  count("dni") AS dni_non_null,
  round(100.0 * count("dni")::numeric / NULLIF(count(*),0), 2) AS dni_pct_non_null,
  count("email") AS email_non_null,
  round(100.0 * count("email")::numeric / NULLIF(count(*),0), 2) AS email_pct_non_null,
  count("phone") AS phone_non_null,
  round(100.0 * count("phone")::numeric / NULLIF(count(*),0), 2) AS phone_pct_non_null,
  count("phone2") AS phone2_non_null,
  round(100.0 * count("phone2")::numeric / NULLIF(count(*),0), 2) AS phone2_pct_non_null,
  count("family_contact") AS family_contact_non_null,
  round(100.0 * count("family_contact")::numeric / NULLIF(count(*),0), 2) AS family_contact_pct_non_null,
  count("fechaRegistro") AS fechaRegistro_non_null,
  round(100.0 * count("fechaRegistro")::numeric / NULLIF(count(*),0), 2) AS fechaRegistro_pct_non_null
FROM public.patients;

-- Duplicate DNI / email checks (show up to 50 problematic values)
SELECT "dni", count(*) AS c FROM public.patients GROUP BY "dni" HAVING count(*) > 1 ORDER BY c DESC LIMIT 50;
SELECT "email", count(*) AS c FROM public.patients WHERE "email" IS NOT NULL GROUP BY "email" HAVING count(*) > 1 ORDER BY c DESC LIMIT 50;

-- Patients without related records (appointments, packs, files, invoices)
SELECT p.id, p."firstName", p."lastName", p."email", p."phone"
FROM public.patients p
LEFT JOIN public.appointments a ON a."patientId" = p.id
LEFT JOIN public.credit_packs cp ON cp."patientId" = p.id
LEFT JOIN public.patient_files pf ON pf."patientId" = p.id
LEFT JOIN public.invoices i ON i."patientId" = p.id
WHERE a.id IS NULL AND cp.id IS NULL AND pf.id IS NULL AND i.id IS NULL
LIMIT 200;

-- Sample patients
SELECT * FROM public.patients ORDER BY "createdAt" DESC LIMIT 50;


-- =========================================
-- Appointments
-- =========================================
SELECT 'appointments' AS table_name, count(*) AS total_rows FROM public.appointments;

SELECT
  'appointments' AS table_name,
  count(*) AS total_rows,
  count("patientId") AS patientId_non_null,
  round(100.0 * count("patientId")::numeric / NULLIF(count(*),0), 2) AS patientId_pct_non_null,
  count("start") AS start_non_null,
  count("end") AS end_non_null,
  count("durationMinutes") AS durationMinutes_non_null,
  count("priceCents") AS priceCents_non_null,
  count("status") AS status_non_null,
  count("consumesCredit") AS consumesCredit_non_null
FROM public.appointments;

-- Orphan appointments (patientId points to missing patient)
SELECT count(*) AS orphan_appointments
FROM public.appointments a
LEFT JOIN public.patients p ON a."patientId" = p.id
WHERE p.id IS NULL;

-- Duplicated appointments by patientId + start
SELECT a."patientId", a."start", count(*) AS c
FROM public.appointments a
GROUP BY a."patientId", a."start"
HAVING count(*) > 1
ORDER BY c DESC
LIMIT 100;

-- Sample appointments
SELECT * FROM public.appointments ORDER BY "start" DESC LIMIT 50;


-- =========================================
-- Credit packs
-- =========================================
SELECT 'credit_packs' AS table_name, count(*) AS total_rows FROM public.credit_packs;

SELECT
  'credit_packs' AS table_name,
  count(*) AS total_rows,
  count("patientId") AS patientId_non_null,
  round(100.0 * count("patientId")::numeric / NULLIF(count(*),0), 2) AS patientId_pct_non_null,
  count("unitsTotal") AS unitsTotal_non_null,
  count("unitsRemaining") AS unitsRemaining_non_null,
  count("unitMinutes") AS unitMinutes_non_null,
  count("paid") AS paid_non_null
FROM public.credit_packs;

-- Orphan credit_packs (patientId -> missing patient)
SELECT count(*) AS orphan_credit_packs FROM public.credit_packs cp LEFT JOIN public.patients p ON cp."patientId" = p.id WHERE p.id IS NULL;

-- Sample credit_packs
SELECT * FROM public.credit_packs ORDER BY "createdAt" DESC LIMIT 50;


-- =========================================
-- Credit redemptions
-- =========================================
SELECT 'credit_redemptions' AS table_name, count(*) AS total_rows FROM public.credit_redemptions;

SELECT
  'credit_redemptions' AS table_name,
  count(*) AS total_rows,
  count("creditPackId") AS creditPackId_non_null,
  count("appointmentId") AS appointmentId_non_null,
  count("unitsUsed") AS unitsUsed_non_null
FROM public.credit_redemptions;

-- Orphans: missing credit_pack or missing appointment
SELECT count(*) AS orphan_cr_missing_pack FROM public.credit_redemptions cr LEFT JOIN public.credit_packs cp ON cr."creditPackId" = cp.id WHERE cp.id IS NULL;
SELECT count(*) AS orphan_cr_missing_appointment FROM public.credit_redemptions cr LEFT JOIN public.appointments a ON cr."appointmentId" = a.id WHERE a.id IS NULL;

-- Sample credit_redemptions
SELECT * FROM public.credit_redemptions ORDER BY "createdAt" DESC LIMIT 50;


-- =========================================
-- Patient files
-- =========================================
SELECT 'patient_files' AS table_name, count(*) AS total_rows FROM public.patient_files;

SELECT
  'patient_files' AS table_name,
  count(*) AS total_rows,
  count("patientId") AS patientId_non_null,
  count("storedPath") AS storedPath_non_null,
  count("mimeType") AS mimeType_non_null,
  count("checksum") AS checksum_non_null,
  count("category") AS category_non_null
FROM public.patient_files;

-- Orphan files (patientId missing)
SELECT count(*) AS orphan_files FROM public.patient_files pf LEFT JOIN public.patients p ON pf."patientId" = p.id WHERE p.id IS NULL;

-- Sample patient_files
SELECT * FROM public.patient_files ORDER BY "createdAt" DESC LIMIT 50;


-- =========================================
-- Invoices
-- =========================================
SELECT 'invoices' AS table_name, count(*) AS total_rows FROM public.invoices;

SELECT
  'invoices' AS table_name,
  count(*) AS total_rows,
  count("patientId") AS patientId_non_null,
  count("number") AS number_non_null,
  count("year") AS year_non_null,
  count("sequence") AS sequence_non_null
FROM public.invoices;

-- Orphan invoices (patientId missing)
SELECT count(*) AS orphan_invoices FROM public.invoices i LEFT JOIN public.patients p ON i."patientId" = p.id WHERE p.id IS NULL;

-- Duplicate invoice (number/year/sequence)
SELECT "number", "year", "sequence", count(*) AS c FROM public.invoices GROUP BY "number", "year", "sequence" HAVING count(*) > 1 ORDER BY c DESC LIMIT 50;

-- Sample invoices
SELECT * FROM public.invoices ORDER BY "createdAt" DESC LIMIT 50;


-- =========================================
-- Invoice items
-- =========================================
SELECT 'invoice_items' AS table_name, count(*) AS total_rows FROM public.invoice_items;

SELECT
  'invoice_items' AS table_name,
  count(*) AS total_rows,
  count("invoiceId") AS invoiceId_non_null,
  count("appointmentId") AS appointmentId_non_null,
  count("description") AS description_non_null
FROM public.invoice_items;

-- Orphans: invoiceId -> invoices, appointmentId -> appointments
SELECT count(*) AS orphan_invoice_items_missing_invoice FROM public.invoice_items ii LEFT JOIN public.invoices i ON ii."invoiceId" = i.id WHERE i.id IS NULL;
SELECT count(*) AS orphan_invoice_items_missing_appointment FROM public.invoice_items ii LEFT JOIN public.appointments a ON ii."appointmentId" = a.id WHERE a.id IS NULL;

-- Sample invoice_items
SELECT * FROM public.invoice_items ORDER BY id DESC LIMIT 50;

-- End of script
