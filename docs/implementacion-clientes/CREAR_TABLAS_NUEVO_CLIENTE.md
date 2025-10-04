# 🗄️ GUÍA: CREAR TABLAS PARA NUEVO CLIENTE

**Objetivo:** Crear todas las tablas necesarias en Supabase para un nuevo cliente  
**Tiempo estimado:** 10-15 minutos  
**Prerequisito:** Tener acceso a Supabase SQL Editor

---

## 📋 ÍNDICE

1. [Tablas a Crear](#tablas-a-crear)
2. [Script SQL Completo](#script-sql-completo)
3. [Configurar Row Level Security (RLS)](#configurar-row-level-security-rls)
4. [Validación](#validación)
5. [Troubleshooting](#troubleshooting)

---

## 🗂️ TABLAS A CREAR

Para cada nuevo cliente, necesitas crear **10 tablas** con el sufijo `_[clienteId]`:

| #   | Tabla                          | Descripción                                | Relaciones                   |
| --- | ------------------------------ | ------------------------------------------ | ---------------------------- |
| 1   | `patients_[cliente]`           | Datos de pacientes                         | -                            |
| 2   | `appointments_[cliente]`       | Citas/sesiones                             | → patients                   |
| 3   | `credit_packs_[cliente]`       | Bonos disponibles                          | → patients                   |
| 4   | `credit_redemptions_[cliente]` | Usos de créditos                           | → credit_packs, appointments |
| 5   | `patient_files_[cliente]`      | Archivos adjuntos                          | → patients                   |
| 6   | `configurations_[cliente]`     | Configuración de la app                    | -                            |
| 7   | `backups_[cliente]`            | Backups de la aplicación                   | -                            |
| 8   | `invoices_[cliente]`           | Facturas generadas                         | → patients                   |
| 9   | `invoice_items_[cliente]`      | Líneas de factura                          | → invoices, appointments     |
| 10  | `tenants`                      | **Tabla compartida** (ya existe, no crear) | -                            |

---

## 📝 SCRIPT SQL COMPLETO

### Paso 1: Acceder a Supabase SQL Editor

1. Abre tu proyecto en https://app.supabase.com
2. Ve a **SQL Editor** (icono `</>` en el menú lateral)
3. Haz clic en **New Query**

### Paso 2: Ejecutar Script de Creación

Reemplaza `[actifisio]` con el identificador del nuevo cliente (ej: `actifisio`, `nuevocliente`, etc.)

```sql
-- ============================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA NUEVO CLIENTE
-- Cliente: [actifisio]
-- Fecha: [FECHA]
-- ============================================

-- IMPORTANTE: Reemplaza [actifisio] con el ID real del cliente
-- Ejemplo: Si el cliente es "actifisio", reemplaza [actifisio] por actifisio

-- ============================================
-- 1. TABLA: patients_[actifisio]
-- ============================================
CREATE TABLE patients_[actifisio] (
    LIKE patients_masajecorporaldeportivo
    INCLUDING ALL
);

-- Comentario de la tabla
COMMENT ON TABLE patients_[actifisio] IS 'Tabla de pacientes para el cliente [actifisio]';

-- ============================================
-- 2. TABLA: appointments_[actifisio]
-- ============================================
CREATE TABLE appointments_[actifisio] (
    LIKE appointments_masajecorporaldeportivo
    INCLUDING ALL
);

COMMENT ON TABLE appointments_[actifisio] IS 'Tabla de citas para el cliente [actifisio]';

-- ============================================
-- 3. TABLA: credit_packs_[actifisio]
-- ============================================
CREATE TABLE credit_packs_[actifisio] (
    LIKE credit_packs_masajecorporaldeportivo
    INCLUDING ALL
);

COMMENT ON TABLE credit_packs_[actifisio] IS 'Tabla de bonos/packs para el cliente [actifisio]';

-- ============================================
-- 4. TABLA: credit_transactions_[actifisio]
-- ============================================
CREATE TABLE credit_transactions_[actifisio] (
    LIKE credit_transactions_masajecorporaldeportivo
    INCLUDING ALL
);

COMMENT ON TABLE credit_transactions_[actifisio] IS 'Tabla de transacciones de créditos para el cliente [actifisio]';

-- ============================================
-- 5. TABLA: patient_files_[actifisio]
-- ============================================
CREATE TABLE patient_files_[actifisio] (
    LIKE patient_files_masajecorporaldeportivo
    INCLUDING ALL
);

COMMENT ON TABLE patient_files_[actifisio] IS 'Tabla de archivos de pacientes para el cliente [actifisio]';

-- ============================================
-- 6. TABLA: patient_notes_[actifisio]
-- ============================================
CREATE TABLE patient_notes_[actifisio] (
    LIKE patient_notes_masajecorporaldeportivo
    INCLUDING ALL
);

COMMENT ON TABLE patient_notes_[actifisio] IS 'Tabla de notas clínicas para el cliente [actifisio]';

-- ============================================
-- 7. TABLA: configurations_[actifisio]
-- ============================================
CREATE TABLE configurations_[actifisio] (
    LIKE configurations_masajecorporaldeportivo
    INCLUDING ALL
);

COMMENT ON TABLE configurations_[actifisio] IS 'Tabla de configuración para el cliente [actifisio]';

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT
    'patients_[actifisio]' as tabla,
    COUNT(*) as columnas
FROM information_schema.columns
WHERE table_name = 'patients_[actifisio]'
UNION ALL
SELECT
    'appointments_[actifisio]',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'appointments_[actifisio]'
UNION ALL
SELECT
    'credit_packs_[actifisio]',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'credit_packs_[actifisio]'
UNION ALL
SELECT
    'credit_transactions_[actifisio]',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'credit_transactions_[actifisio]'
UNION ALL
SELECT
    'patient_files_[actifisio]',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'patient_files_[actifisio]'
UNION ALL
SELECT
    'patient_notes_[actifisio]',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'patient_notes_[actifisio]'
UNION ALL
SELECT
    'configurations_[actifisio]',
    COUNT(*)
FROM information_schema.columns
WHERE table_name = 'configurations_[actifisio]';

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================
-- Si ves 7 filas con números > 0, las tablas se crearon correctamente
```

### Paso 3: Reemplazar Placeholders

**Opción A: Reemplazo Manual**

Usa Find & Replace en el SQL Editor:

1. Ctrl+H (Find & Replace)
2. Find: `[actifisio]`
3. Replace: `actifisio` (o el ID real del cliente)
4. Replace All

**Opción B: Script PowerShell**

```powershell
# Guardar script en archivo temporal
$clienteId = "actifisio"  # ← Cambiar aquí
$sqlTemplate = Get-Content ".\CREAR_TABLAS_NUEVO_CLIENTE.md" -Raw
$sqlFinal = $sqlTemplate -replace '\[actifisio\]', $clienteId
$sqlFinal -replace '\[FECHA\]', (Get-Date -Format "yyyy-MM-dd")
# Copiar resultado y pegarlo en Supabase SQL Editor
```

---

## 🔒 CONFIGURAR ROW LEVEL SECURITY (RLS)

Después de crear las tablas, **debes configurar RLS** para seguridad:

### Script RLS Completo

```sql
-- ============================================
-- ROW LEVEL SECURITY PARA [actifisio]
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE patients_[actifisio] ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_[actifisio] ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_[actifisio] ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions_[actifisio] ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files_[actifisio] ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes_[actifisio] ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_[actifisio] ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: Permitir TODO para service_role
-- (El backend usa service_role key)
-- ============================================

-- Política para patients_[actifisio]
CREATE POLICY "Allow all for service_role" ON patients_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para appointments_[actifisio]
CREATE POLICY "Allow all for service_role" ON appointments_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para credit_packs_[actifisio]
CREATE POLICY "Allow all for service_role" ON credit_packs_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para credit_transactions_[actifisio]
CREATE POLICY "Allow all for service_role" ON credit_transactions_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para patient_files_[actifisio]
CREATE POLICY "Allow all for service_role" ON patient_files_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para patient_notes_[actifisio]
CREATE POLICY "Allow all for service_role" ON patient_notes_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política para configurations_[actifisio]
CREATE POLICY "Allow all for service_role" ON configurations_[actifisio]
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN DE POLÍTICAS
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename LIKE '%_[actifisio]'
ORDER BY tablename;

-- ✅ Deberías ver 7 políticas (una por tabla)
```

**Recuerda reemplazar `[actifisio]` con el ID real del cliente.**

---

## ✅ VALIDACIÓN

### 1. Verificar Creación de Tablas

```sql
-- Listar todas las tablas del cliente
SELECT
    table_name,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE columns.table_name = tables.table_name) as num_columnas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%_[actifisio]'
ORDER BY table_name;

-- Deberías ver 7 tablas con sus respectivas columnas
```

### 2. Verificar RLS Activado

```sql
-- Verificar que RLS está habilitado
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%_[actifisio]';

-- Todas las tablas deben mostrar: rowsecurity = true
```

### 3. Verificar Políticas

```sql
-- Contar políticas por tabla
SELECT
    tablename,
    COUNT(*) as num_politicas
FROM pg_policies
WHERE tablename LIKE '%_[actifisio]'
GROUP BY tablename
ORDER BY tablename;

-- Cada tabla debe tener al menos 1 política
```

### 4. Test de Inserción

```sql
-- Test: Insertar paciente de prueba
INSERT INTO patients_[actifisio] (
    name,
    email,
    phone,
    created_at
) VALUES (
    'Paciente Test',
    'test@ejemplo.com',
    '123456789',
    NOW()
) RETURNING *;

-- Si se inserta correctamente, todo funciona ✅
-- Luego puedes eliminar el registro:
-- DELETE FROM patients_[actifisio] WHERE email = 'test@ejemplo.com';
```

---

## 🛠️ TROUBLESHOOTING

### Error: "Table already exists"

**Problema:** La tabla ya fue creada anteriormente.

**Solución:**

```sql
-- Ver qué tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%_[actifisio]';

-- Si necesitas recrearlas, elimina primero (¡CUIDADO!)
DROP TABLE IF EXISTS patients_[actifisio] CASCADE;
-- ... (repetir para todas)
```

### Error: "Permission denied"

**Problema:** No tienes permisos para crear tablas.

**Solución:**

1. Verifica que estás usando el usuario correcto en Supabase
2. Asegúrate de tener rol `postgres` o `service_role`
3. Contacta al administrador del proyecto Supabase

### Error: "Source table not found"

**Problema:** La tabla `patients_masajecorporaldeportivo` no existe.

**Solución:**

1. Verifica que el proyecto tenga las tablas base
2. Usa otra tabla como referencia (ej: `patients_actifisio`)
3. O crea las tablas manualmente con la estructura completa

### Las Políticas No Se Aplican

**Problema:** RLS habilitado pero las queries fallan.

**Solución:**

```sql
-- Verificar que estás usando service_role key en el backend
-- La política permite "true" para todo, así que debería funcionar

-- Si sigue fallando, desactiva RLS temporalmente para debug:
ALTER TABLE patients_[actifisio] DISABLE ROW LEVEL SECURITY;

-- NUNCA dejes RLS desactivado en producción
```

---

## 📊 ESTRUCTURA DE TABLA EJEMPLO

### `patients_[actifisio]`

```sql
CREATE TABLE patients_[actifisio] (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    date_of_birth DATE,
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(50),
    medical_history TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX idx_patients_[actifisio]_email ON patients_[actifisio](email);
CREATE INDEX idx_patients_[actifisio]_phone ON patients_[actifisio](phone);
CREATE INDEX idx_patients_[actifisio]_created ON patients_[actifisio](created_at);
```

_(La estructura real se copia automáticamente con `CREATE TABLE ... LIKE ... INCLUDING ALL`)_

---

## 🎯 CHECKLIST RÁPIDO

Para cada nuevo cliente, sigue este checklist:

```
[ ] 1. Abrir Supabase SQL Editor
[ ] 2. Copiar script de creación de tablas
[ ] 3. Reemplazar [actifisio] con ID real
[ ] 4. Ejecutar script de creación (7 tablas)
[ ] 5. Verificar que las 7 tablas existen
[ ] 6. Copiar script de RLS
[ ] 7. Reemplazar [actifisio] con ID real
[ ] 8. Ejecutar script de RLS (7 políticas)
[ ] 9. Verificar que RLS está habilitado
[ ] 10. Verificar que políticas existen
[ ] 11. Hacer test de inserción
[ ] 12. Eliminar registro de test
[ ] 13. ✅ ¡Tablas listas para producción!
```

---

## 🔗 REFERENCIAS

- **Documentación Supabase SQL:** https://supabase.com/docs/guides/database/overview
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL LIKE:** https://www.postgresql.org/docs/current/sql-createtable.html

---

## 📝 EJEMPLO COMPLETO: Actifisio

Aquí tienes un ejemplo real para el cliente "actifisio":

```sql
-- ============================================
-- CLIENTE: actifisio
-- FECHA: 2025-10-03
-- ============================================

-- 1. Crear tablas
CREATE TABLE patients_actifisio (LIKE patients_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE appointments_actifisio (LIKE appointments_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_packs_actifisio (LIKE credit_packs_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_transactions_actifisio (LIKE credit_transactions_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE patient_files_actifisio (LIKE patient_files_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE patient_notes_actifisio (LIKE patient_notes_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE configurations_actifisio (LIKE configurations_masajecorporaldeportivo INCLUDING ALL);

-- 2. Habilitar RLS
ALTER TABLE patients_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes_actifisio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_actifisio ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas
CREATE POLICY "Allow all for service_role" ON patients_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON appointments_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON credit_packs_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON credit_transactions_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON patient_files_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON patient_notes_actifisio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON configurations_actifisio FOR ALL USING (true) WITH CHECK (true);

-- 4. Verificar
SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%_actifisio';
-- Debes ver 7 tablas ✅
```

---

## 💡 TIPS Y MEJORES PRÁCTICAS

1. **Siempre usa transacciones para scripts grandes:**

   ```sql
   BEGIN;
   -- Tu script aquí
   COMMIT;
   -- Si algo falla: ROLLBACK;
   ```

2. **Backup antes de cambios importantes:**

   - Supabase hace backups automáticos, pero puedes hacer uno manual
   - Dashboard → Settings → Backups → Create backup

3. **Nomenclatura consistente:**

   - Siempre usa el mismo formato: `tabla_clienteid`
   - Minúsculas, sin espacios, sin caracteres especiales

4. **Documenta los cambios:**

   - Agrega comentarios en las tablas con `COMMENT ON TABLE`
   - Mantén un log de cuándo se crearon

5. **Testing en entorno de desarrollo primero:**
   - Si tienes un proyecto Supabase de staging, prueba ahí primero
   - Valida que todo funciona antes de aplicar en producción

---

**Última actualización:** 03/10/2025  
**Versión:** 1.0  
**Estado:** ✅ Validado y probado

🎉 **¡Ahora estás listo para crear tablas para nuevos clientes en minutos!** 🎉
