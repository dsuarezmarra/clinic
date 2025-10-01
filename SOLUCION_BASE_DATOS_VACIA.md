# 🔍 DIAGNÓSTICO: Base de Datos Vacía

## ✅ LO QUE FUNCIONA:

- ✅ Backend desplegado correctamente
- ✅ Frontend desplegado correctamente
- ✅ CORS funcionando
- ✅ Variables de entorno configuradas
- ✅ Conexión a Supabase establecida

## ❌ EL PROBLEMA:

**Tu base de datos de Supabase está VACÍA** - no hay pacientes, ni citas, ni bonos.

Respuesta del backend:

```json
{
  "patients": [],
  "pagination": { "page": 1, "limit": 10, "total": 0, "pages": 0 }
}
```

---

## 🔍 VERIFICAR PRIMERO:

### 1. ¿Existen las tablas en Supabase?

Abre tu dashboard de Supabase:

```
https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/editor
```

**Tablas que deberían existir**:

- `patients` (pacientes)
- `appointments` (citas)
- `credit_packs` (bonos/packs de créditos)
- `credit_redemptions` (uso de créditos)
- `patient_files` (archivos de pacientes)
- `configurations` (configuración)

### 2. ¿Tienen datos las tablas?

En el Table Editor de Supabase, verifica si hay filas en cada tabla.

---

## 🛠️ SOLUCIONES:

### Opción 1: Tienes datos localmente (SQLite o Supabase anterior)

Si has estado usando la aplicación localmente y tienes datos:

#### A. Exportar datos desde local

```powershell
# Desde el directorio del proyecto
cd backend

# Crear backup de datos locales
node scripts/backup.js
```

Esto creará un archivo JSON en `backend/backups/`

#### B. Importar a Supabase

```powershell
# Método 1: Usar script de importación
node scripts/import-to-supabase.js

# O importar backup específico
node scripts/restore_from_backup.js
```

---

### Opción 2: NO tienes datos (Base de datos nueva)

Si esta es una instalación nueva, necesitas crear datos de prueba:

#### A. Crear tablas primero (si no existen)

```sql
-- Ejecutar en Supabase SQL Editor
-- El archivo está en: backend/supabase-setup.sql
```

Copia y pega el contenido de `backend/supabase-setup.sql` en:

```
https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/sql/new
```

#### B. Crear datos de prueba

**Opción B1: Desde el frontend** (más fácil)

1. Abre el frontend: https://clinic-frontend-3r17ai7z0-davids-projects-8fa96e54.vercel.app
2. Ve a "Pacientes"
3. Haz clic en "Nuevo Paciente"
4. Crea algunos pacientes de prueba
5. Luego ve a "Agenda" y crea citas

**Opción B2: Insertar SQL directamente**

En Supabase SQL Editor, ejecuta:

```sql
-- Insertar paciente de prueba
INSERT INTO patients (nombre, apellido, dni, telefono, email)
VALUES
  ('Juan', 'Pérez', '12345678A', '600123456', 'juan@example.com'),
  ('María', 'García', '87654321B', '600987654', 'maria@example.com');

-- Insertar bono de prueba
INSERT INTO credit_packs (patient_id, total_units, units_remaining, unit_minutes, price, purchase_date)
SELECT
  id,
  10,
  10,
  30,
  200.00,
  NOW()
FROM patients
WHERE nombre = 'Juan'
LIMIT 1;

-- Insertar cita de prueba
INSERT INTO appointments (patient_id, start_time, end_time, title, notes)
SELECT
  id,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '30 minutes',
  'Masaje deportivo',
  'Primera sesión'
FROM patients
WHERE nombre = 'Juan'
LIMIT 1;
```

---

### Opción 3: Verificar permisos de Supabase

Es posible que las tablas existan pero no tengas permisos para verlas.

#### A. Verificar SERVICE_KEY

Tu archivo `.env` local usa:

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Pero este es el **ANON_KEY**, no el **SERVICE_KEY**.

Para obtener la SERVICE_KEY real:

1. Ve a: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/settings/api
2. Copia la `service_role key` (no la `anon public key`)
3. Actualízala en Vercel:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
cd backend

# Eliminar la antigua
vercel env rm SUPABASE_SERVICE_KEY production --yes

# Agregar la nueva (pega la key real cuando te lo pida)
vercel env add SUPABASE_SERVICE_KEY production
```

4. Redeploy el backend:

```powershell
vercel --prod
```

#### B. Verificar Row Level Security (RLS)

Si RLS está activado y mal configurado, puede bloquear el acceso:

```sql
-- En Supabase SQL Editor, ejecuta:

-- Desactivar RLS temporalmente para pruebas
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions DISABLE ROW LEVEL SECURITY;
```

**⚠️ IMPORTANTE**: Si desactivas RLS, tu base de datos será completamente pública. Úsalo solo para pruebas.

---

## 🎯 PASOS RECOMENDADOS:

### 1. Verificar que existen las tablas

```
https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/editor
```

### 2. Si NO existen las tablas:

- Ejecutar `backend/supabase-setup.sql` en Supabase SQL Editor

### 3. Si existen pero están vacías:

- Crear datos de prueba desde el frontend
- O ejecutar los INSERT SQL de arriba

### 4. Si siguen sin aparecer datos:

- Verificar la SERVICE_KEY correcta en Vercel
- Desactivar RLS temporalmente
- Redeploy el backend

---

## 📞 ¿Qué opción aplica a ti?

Responde:

1. ¿Ves las tablas en Supabase? (Sí/No)
2. ¿Las tablas tienen datos? (Sí/No)
3. ¿Usabas la app localmente antes y tenías datos? (Sí/No)

Según tu respuesta, te diré exactamente qué hacer.

---

**URLs útiles**:

- Dashboard Supabase: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty
- Table Editor: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/editor
- SQL Editor: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/sql/new
- API Settings: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/settings/api
