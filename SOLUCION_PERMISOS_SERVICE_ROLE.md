# 🎯 PROBLEMA ENCONTRADO: Permisos de service_role

## ❌ El Error Real:

```
permission denied for schema public
```

El rol `service_role` **NO TIENE PERMISOS** sobre el esquema `public` en Supabase.

---

## ✅ SOLUCIÓN:

### Paso 1: Abrir SQL Editor

He abierto el SQL Editor de Supabase:

```
https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/sql/new
```

### Paso 2: Copiar y ejecutar este SQL

Copia **TODO** este código y pégalo en el editor:

```sql
-- Otorgar permisos sobre el esquema public
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Otorgar permisos sobre todas las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Otorgar permisos sobre futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON FUNCTIONS TO service_role;

-- Asegurar permisos en tablas específicas
GRANT ALL ON patients TO service_role;
GRANT ALL ON appointments TO service_role;
GRANT ALL ON credit_packs TO service_role;
GRANT ALL ON credit_redemptions TO service_role;
GRANT ALL ON patient_files TO service_role;
GRANT ALL ON configurations TO service_role;

-- Verificar permisos
SELECT
    schemaname,
    tablename,
    array_agg(DISTINCT privilege_type) as privileges
FROM information_schema.table_privileges
WHERE grantee = 'service_role'
    AND schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

### Paso 3: Hacer clic en "RUN"

Deberías ver una tabla mostrando los permisos otorgados.

### Paso 4: Probar de nuevo

Después de ejecutar el SQL, prueba:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
$env:SUPABASE_URL="https://skukyfkrwqsfnkbxedty.supabase.co"
$env:SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ"
$env:USE_SUPABASE="true"
node test-vercel-supabase.js
```

**Ahora SÍ debería mostrar tus pacientes** ✅

### Paso 5: Probar el backend en Vercel

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-9t70k6nnd-davids-projects-8fa96e54.vercel.app/api/patients" -Method GET | ConvertTo-Json
```

---

## 🔍 ¿Por qué pasó esto?

Supabase por defecto **NO otorga permisos al service_role** sobre las tablas.
Necesitas otorgarlos manualmente después de crear las tablas.

Este es un problema de seguridad común que se soluciona con el SQL de arriba.

---

## 📋 RESUMEN:

1. ✅ Tablas existen con datos
2. ✅ SERVICE_KEY correcta configurada
3. ✅ RLS desactivado (o configurado)
4. ❌ **service_role sin permisos** ← Este era el problema
5. ⏳ Ejecutar el SQL para otorgar permisos

---

**Ejecuta el SQL y dime si funcionó** 🚀
