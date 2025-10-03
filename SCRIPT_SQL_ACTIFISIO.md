-- ============================================
-- PASO 1: CREAR TABLAS ACTIFISIO
-- ============================================

CREATE TABLE patients_actifisio (LIKE patients_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE appointments_actifisio (LIKE appointments_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_packs_actifisio (LIKE credit_packs_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_redemptions_actifisio (LIKE credit_redemptions_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE patient_files_actifisio (LIKE patient_files_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE configurations_actifisio (LIKE configurations_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE backups_actifisio (LIKE backups_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE invoices_actifisio (LIKE invoices_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE invoice_items_actifisio (LIKE invoice_items_masajecorporaldeportivo INCLUDING ALL);

-- Verificar tablas creadas
SELECT table_name, (SELECT COUNT(\*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as num_columnas
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%\_actifisio'
ORDER BY table_name;

-- ============================================
-- PASO 2: HABILITAR RLS Y CREAR POLITICAS
-- ============================================

ALTER TABLE patients_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items_actifisio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service_role" ON patients_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON appointments_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON credit_packs_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON credit_redemptions_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON patient_files_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON configurations_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON backups_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON invoices_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON invoice_items_actifisio FOR ALL USING (true) WITH CHECK (true);

-- Verificar politicas creadas
SELECT tablename, policyname FROM pg_policies WHERE tablename LIKE '%\_actifisio' ORDER BY tablename;

-- ============================================
-- PASO 3: VALIDACION FINAL
-- ============================================

SELECT
t.table_name,
(SELECT COUNT(_) FROM information_schema.columns c WHERE c.table_name = t.table_name) as columnas,
(SELECT rowsecurity FROM pg_tables WHERE tablename = t.table_name) as rls_habilitado,
(SELECT COUNT(_) FROM pg_policies WHERE tablename = t.table_name) as num_politicas
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_name LIKE '%\_actifisio'
ORDER BY t.table_name;
