-- Supabase analysis script
-- Run this in Supabase SQL Editor (or psql) to get diagnostics for each table:
-- - total rows
-- - null counts per column
-- - distinct counts per column
-- - simple duplicate detection based on likely natural keys
-- - orphaned FK checks
-- - old rows candidates (by createdAt)

-- Adjust this variable to change what "old" means (in days):
\set days_old 365

-- Helper: list tables to analyze (only public schema)
-- You can edit this list if you only want specific tables.

-- Tables extracted from schema
-- appointments, configurations, credit_packs, credit_redemptions, invoice_items, invoices, patient_files, patients

-- 1) Total row counts
SELECT 'appointments' AS table_name, count(*) AS total_rows FROM public.appointments;
SELECT 'configurations' AS table_name, count(*) AS total_rows FROM public.configurations;
SELECT 'credit_packs' AS table_name, count(*) AS total_rows FROM public.credit_packs;
SELECT 'credit_redemptions' AS table_name, count(*) AS total_rows FROM public.credit_redemptions;
SELECT 'invoice_items' AS table_name, count(*) AS total_rows FROM public.invoice_items;
SELECT 'invoices' AS table_name, count(*) AS total_rows FROM public.invoices;
SELECT 'patient_files' AS table_name, count(*) AS total_rows FROM public.patient_files;
SELECT 'patients' AS table_name, count(*) AS total_rows FROM public.patients;

-- 2) Null counts per column (one query per table)
-- Appointments
SELECT
  'appointments' AS table_name,
  sum((patientId IS NULL)::int) AS patientId_nulls,
  sum((start IS NULL)::int) AS start_nulls,
  sum(("end" IS NULL)::int) AS end_nulls,
  sum((durationMinutes IS NULL)::int) AS durationMinutes_nulls,
  sum((priceCents IS NULL)::int) AS priceCents_nulls,
  sum((status IS NULL)::int) AS status_nulls,
  sum((notes IS NULL)::int) AS notes_nulls,
  sum((consumesCredit IS NULL)::int) AS consumesCredit_nulls
FROM public.appointments;

-- Configurations
SELECT
  'configurations' AS table_name,
  sum((key IS NULL)::int) AS key_nulls,
  sum((value IS NULL)::int) AS value_nulls
FROM public.configurations;

-- Credit packs
SELECT
  'credit_packs' AS table_name,
  sum((patientId IS NULL)::int) AS patientId_nulls,
  sum((label IS NULL)::int) AS label_nulls,
  sum((unitsTotal IS NULL)::int) AS unitsTotal_nulls,
  sum((unitMinutes IS NULL)::int) AS unitMinutes_nulls,
  sum((priceCents IS NULL)::int) AS priceCents_nulls,
  sum((unitsRemaining IS NULL)::int) AS unitsRemaining_nulls,
  sum((paid IS NULL)::int) AS paid_nulls,
  sum((notes IS NULL)::int) AS notes_nulls
FROM public.credit_packs;

-- Credit redemptions
SELECT
  'credit_redemptions' AS table_name,
  sum((creditPackId IS NULL)::int) AS creditPackId_nulls,
  sum((appointmentId IS NULL)::int) AS appointmentId_nulls,
  sum((unitsUsed IS NULL)::int) AS unitsUsed_nulls
FROM public.credit_redemptions;

-- Invoice items
SELECT
  'invoice_items' AS table_name,
  sum((invoiceId IS NULL)::int) AS invoiceId_nulls,
  sum((appointmentId IS NULL)::int) AS appointmentId_nulls,
  sum((description IS NULL)::int) AS description_nulls,
  sum((quantity IS NULL)::int) AS quantity_nulls,
  sum((unitPrice IS NULL)::int) AS unitPrice_nulls,
  sum((totalPrice IS NULL)::int) AS totalPrice_nulls
FROM public.invoice_items;

-- Invoices
SELECT
  'invoices' AS table_name,
  sum((number IS NULL)::int) AS number_nulls,
  sum((year IS NULL)::int) AS year_nulls,
  sum((sequence IS NULL)::int) AS sequence_nulls,
  sum((patientId IS NULL)::int) AS patientId_nulls,
  sum((issueDate IS NULL)::int) AS issueDate_nulls,
  sum((grossAmount IS NULL)::int) AS grossAmount_nulls,
  sum((vatAmount IS NULL)::int) AS vatAmount_nulls,
  sum((totalAmount IS NULL)::int) AS totalAmount_nulls,
  sum((description IS NULL)::int) AS description_nulls
FROM public.invoices;

-- Patient files
SELECT
  'patient_files' AS table_name,
  sum((patientId IS NULL)::int) AS patientId_nulls,
  sum((originalName IS NULL)::int) AS originalName_nulls,
  sum((storedPath IS NULL)::int) AS storedPath_nulls,
  sum((mimeType IS NULL)::int) AS mimeType_nulls,
  sum((size IS NULL)::int) AS size_nulls,
  sum((category IS NULL)::int) AS category_nulls,
  sum((checksum IS NULL)::int) AS checksum_nulls
FROM public.patient_files;

-- Patients
SELECT
  'patients' AS table_name,
  sum((dni IS NULL)::int) AS dni_nulls,
  sum((firstName IS NULL)::int) AS firstName_nulls,
  sum((lastName IS NULL)::int) AS lastName_nulls,
  sum((phone IS NULL)::int) AS phone_nulls,
  sum((email IS NULL)::int) AS email_nulls,
  sum((address IS NULL)::int) AS address_nulls,
  sum((cp IS NULL)::int) AS cp_nulls,
  sum((city IS NULL)::int) AS city_nulls,
  sum((province IS NULL)::int) AS province_nulls,
  sum((birthDate IS NULL)::int) AS birthDate_nulls,
  sum((notes IS NULL)::int) AS notes_nulls
FROM public.patients;

-- 3) Distinct counts for likely identifying columns
SELECT 'patients' AS table_name, count(distinct dni) AS distinct_dni, count(distinct email) AS distinct_email FROM public.patients;
SELECT 'appointments' AS table_name, count(distinct patientId) AS distinct_patientIds FROM public.appointments;
SELECT 'credit_packs' AS table_name, count(distinct patientId) AS distinct_patientIds FROM public.credit_packs;

-- 4) Simple duplicate detection
-- Patients: duplicate by dni or (firstName,lastName,phone)
SELECT 'patients_duplicate_dni' AS reason, dni, count(*) AS cnt
FROM public.patients
WHERE dni IS NOT NULL
GROUP BY dni
HAVING count(*) > 1;

SELECT 'patients_duplicate_name_phone' AS reason, firstName, lastName, phone, count(*) AS cnt
FROM public.patients
GROUP BY firstName, lastName, phone
HAVING count(*) > 1;

-- Appointments duplicate by patientId + start
SELECT 'appointments_duplicate' AS reason, patientId, start, count(*) AS cnt
FROM public.appointments
WHERE patientId IS NOT NULL
GROUP BY patientId, start
HAVING count(*) > 1;

-- Credit packs duplicate by patientId+label
SELECT 'credit_packs_duplicate' AS reason, patientId, label, count(*) AS cnt
FROM public.credit_packs
GROUP BY patientId, label
HAVING count(*) > 1;

-- Invoices: duplicate number/year/sequence
SELECT 'invoices_duplicate' AS reason, number, year, sequence, count(*) AS cnt
FROM public.invoices
GROUP BY number, year, sequence
HAVING count(*) > 1;

-- 5) Orphan checks (FK referential integrity)
-- appointments.patientId -> patients.id
SELECT a.id AS appointment_id, a.patientId
FROM public.appointments a
LEFT JOIN public.patients p ON a.patientId = p.id
WHERE a.patientId IS NOT NULL AND p.id IS NULL
LIMIT 50;

-- credit_packs.patientId -> patients.id
SELECT cp.id AS credit_pack_id, cp.patientId
FROM public.credit_packs cp
LEFT JOIN public.patients p ON cp.patientId = p.id
WHERE cp.patientId IS NOT NULL AND p.id IS NULL
LIMIT 50;

-- credit_redemptions.creditPackId -> credit_packs.id
SELECT cr.id AS redemption_id, cr.creditPackId
FROM public.credit_redemptions cr
LEFT JOIN public.credit_packs cp ON cr.creditPackId = cp.id
WHERE cr.creditPackId IS NOT NULL AND cp.id IS NULL
LIMIT 50;

-- credit_redemptions.appointmentId -> appointments.id
SELECT cr.id AS redemption_id, cr.appointmentId
FROM public.credit_redemptions cr
LEFT JOIN public.appointments a ON cr.appointmentId = a.id
WHERE cr.appointmentId IS NOT NULL AND a.id IS NULL
LIMIT 50;

-- invoice_items.appointmentId -> appointments.id
SELECT ii.id AS invoice_item_id, ii.appointmentId
FROM public.invoice_items ii
LEFT JOIN public.appointments a ON ii.appointmentId = a.id
WHERE ii.appointmentId IS NOT NULL AND a.id IS NULL
LIMIT 50;

-- invoice_items.invoiceId -> invoices.id
SELECT ii.id AS invoice_item_id, ii.invoiceId
FROM public.invoice_items ii
LEFT JOIN public.invoices i ON ii.invoiceId = i.id
WHERE ii.invoiceId IS NOT NULL AND i.id IS NULL
LIMIT 50;

-- patient_files.patientId -> patients.id
SELECT pf.id AS patient_file_id, pf.patientId
FROM public.patient_files pf
LEFT JOIN public.patients p ON pf.patientId = p.id
WHERE pf.patientId IS NOT NULL AND p.id IS NULL
LIMIT 50;

-- invoices.patientId -> patients.id
SELECT i.id AS invoice_id, i.patientId
FROM public.invoices i
LEFT JOIN public.patients p ON i.patientId = p.id
WHERE i.patientId IS NOT NULL AND p.id IS NULL
LIMIT 50;

-- 6) Old rows candidates (adjust days_old)
-- Rows older than days_old compared to now() by createdAt
SELECT 'appointments_old' AS label, id, patientId, createdAt
FROM public.appointments
WHERE createdAt < now() - (INTERVAL ':days_old days')
LIMIT 50;

SELECT 'credit_packs_old' AS label, id, patientId, createdAt
FROM public.credit_packs
WHERE createdAt < now() - (INTERVAL ':days_old days')
LIMIT 50;

SELECT 'invoices_old' AS label, id, patientId, createdAt
FROM public.invoices
WHERE createdAt < now() - (INTERVAL ':days_old days')
LIMIT 50;

SELECT 'patient_files_old' AS label, id, patientId, createdAt
FROM public.patient_files
WHERE createdAt < now() - (INTERVAL ':days_old days')
LIMIT 50;

SELECT 'patients_old' AS label, id, dni, createdAt
FROM public.patients
WHERE createdAt < now() - (INTERVAL ':days_old days')
LIMIT 50;

-- 7) Quick heuristics for "inútiles" records
-- Patients without appointments, credit packs, files or invoices (possible stale signups)
SELECT p.id, p.dni, p.firstName, p.lastName
FROM public.patients p
LEFT JOIN public.appointments a ON a.patientId = p.id
LEFT JOIN public.credit_packs cp ON cp.patientId = p.id
LEFT JOIN public.patient_files pf ON pf.patientId = p.id
LEFT JOIN public.invoices i ON i.patientId = p.id
WHERE a.id IS NULL AND cp.id IS NULL AND pf.id IS NULL AND i.id IS NULL
LIMIT 100;

-- Credit packs with zero unitsRemaining and paid = false? candidate to review
SELECT id, patientId, unitsTotal, unitsRemaining, paid
FROM public.credit_packs
WHERE unitsRemaining <= 0 OR paid = false
LIMIT 100;

-- 8) Summary: foreign key counts per table
SELECT 'appointments' AS table_name, count(*) FILTER (WHERE patientId IS NULL) AS fk_nulls FROM public.appointments;
SELECT 'credit_packs' AS table_name, count(*) FILTER (WHERE patientId IS NULL) AS fk_nulls FROM public.credit_packs;
SELECT 'credit_redemptions' AS table_name, count(*) FILTER (WHERE creditPackId IS NULL) AS fk_nulls FROM public.credit_redemptions;
SELECT 'credit_redemptions' AS table_name, count(*) FILTER (WHERE appointmentId IS NULL) AS fk_nulls_appointment FROM public.credit_redemptions;

-- End of script
