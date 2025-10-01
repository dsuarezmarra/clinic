-- Export all data script for Supabase SQL Editor
-- Paste this whole file into Supabase SQL Editor and run.
-- For each SELECT you can click the "Download" button in the results panel to get a CSV.

-- Use LIMIT/OFFSET if tables are large. Replace LIMIT 1000 with a different number or remove it.

-- 1) Counts (quick overview)
SELECT 'appointments' AS table_name, count(*) AS total_rows FROM public.appointments;
SELECT 'configurations' AS table_name, count(*) AS total_rows FROM public.configurations;
SELECT 'credit_packs' AS table_name, count(*) AS total_rows FROM public.credit_packs;
SELECT 'credit_redemptions' AS table_name, count(*) AS total_rows FROM public.credit_redemptions;
SELECT 'invoice_items' AS table_name, count(*) AS total_rows FROM public.invoice_items;
SELECT 'invoices' AS table_name, count(*) AS total_rows FROM public.invoices;
SELECT 'patient_files' AS table_name, count(*) AS total_rows FROM public.patient_files;
SELECT 'patients' AS table_name, count(*) AS total_rows FROM public.patients;

-- 2) Full exports (SELECT *)
-- Appointments (remove LIMIT if you want all rows)
-- NOTE: some Postgres installations store the column name in lowercase (createdat)
-- and referencing mixed-case identifiers without quotes may fail with error 42703.
-- If your DB uses a quoted mixed-case column name use: ORDER BY "createdAt" DESC
-- Otherwise use the lowercase form below.
-- Use id ordering to avoid mixed-case identifier issues; if your DB uses a quoted
-- column name "createdAt" you can change this to: ORDER BY "createdAt" DESC
SELECT * FROM public.appointments ORDER BY id DESC LIMIT 1000;

-- Configurations
SELECT * FROM public.configurations ORDER BY key LIMIT 1000;

-- Credit packs
-- See note above about column name casing
-- See note above about ordering by createdAt vs id
SELECT * FROM public.credit_packs ORDER BY id DESC LIMIT 1000;

-- Credit redemptions
-- credit_redemptions has id, use it for safe ordering
SELECT * FROM public.credit_redemptions ORDER BY id DESC LIMIT 1000;

-- Invoice items
SELECT * FROM public.invoice_items ORDER BY id LIMIT 1000;

-- Invoices
-- See note above about column name casing
-- See note above about ordering by createdAt vs id
SELECT * FROM public.invoices ORDER BY id DESC LIMIT 1000;

-- Patient files
-- See note above about column name casing
-- See note above about ordering by createdAt vs id
SELECT * FROM public.patient_files ORDER BY id DESC LIMIT 1000;

-- Patients
-- See note above about column name casing
-- See note above about ordering by createdAt vs id
SELECT * FROM public.patients ORDER BY id DESC LIMIT 1000;

-- 3) Optional: export in chunks using OFFSET
-- Example: to fetch patients rows 1001-2000
-- SELECT * FROM public.patients ORDER BY createdAt DESC LIMIT 1000 OFFSET 1000;

-- 4) Instructions
-- After running each SELECT in Supabase SQL Editor, click the 'CSV' button on the results pane to download the data.
-- If you need me to generate CSVs programmatically from the database, I can provide a script using psql/pg_dump or Supabase CLI that uploads them to a temporary storage or saves locally.
