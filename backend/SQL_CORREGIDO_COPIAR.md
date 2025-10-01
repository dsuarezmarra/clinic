# ✅ SQL CORREGIDO PARA COPIAR

Copia **TODO** este código y ejecútalo en Supabase SQL Editor:

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
GRANT ALL ON invoices TO service_role;
GRANT ALL ON invoice_items TO service_role;

-- Verificar permisos (CORREGIDO)
SELECT 
    table_schema,
    table_name,
    array_agg(DISTINCT privilege_type) as privileges
FROM information_schema.table_privileges
WHERE grantee = 'service_role'
    AND table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;
```

**Después de ejecutar:**

```powershell
cd backend
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
$env:SUPABASE_URL="https://skukyfkrwqsfnkbxedty.supabase.co"
$env:SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ.Df8E2G--ulzTVUXeSBHgNRm9qQTeZDi_TYlG1UD02BQ"
$env:USE_SUPABASE="true"
node test-vercel-supabase.js
```
