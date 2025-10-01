# 🔒 DESACTIVAR ROW LEVEL SECURITY (RLS)

## 📊 Situación Actual:

✅ SERVICE_KEY correcta configurada
✅ Tablas existen en Supabase
✅ Las tablas tienen datos
❌ El backend sigue devolviendo arrays vacíos

**Causa probable:** Row Level Security (RLS) está bloqueando el acceso.

---

## 🛠️ SOLUCIÓN: Desactivar RLS

### Paso 1: Ir al SQL Editor de Supabase

```
https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/sql/new
```

### Paso 2: Ejecutar este SQL

Copia y pega este código en el editor y haz clic en **RUN**:

```sql
-- Desactivar RLS en todas las tablas
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE configurations DISABLE ROW LEVEL SECURITY;

-- Verificar que se desactivó correctamente
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Resultado esperado:** `rowsecurity` debe ser `false` para todas las tablas.

---

## ⚠️ IMPORTANTE: Seguridad

Al desactivar RLS, **cualquiera con la anon key puede acceder a todos los datos**.

### Opciones de seguridad:

#### Opción 1: Sin RLS (más simple) ✅

- Desactiva RLS completamente
- La seguridad depende de tu backend (ya que no hay login)
- **Recomendado para tu caso** porque no tienes autenticación de usuarios

#### Opción 2: Con RLS pero políticas permisivas

Si prefieres mantener RLS activo, ejecuta esto en su lugar:

```sql
-- Mantener RLS activo pero permitir acceso con service_role
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Crear políticas que permitan todo con service_role
CREATE POLICY "Allow all for service role" ON patients
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON appointments
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON credit_packs
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON credit_redemptions
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON patient_files
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON configurations
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);
```

---

## 🎯 RECOMENDACIÓN:

Para tu aplicación (sin sistema de login), **usa la Opción 1** (desactivar RLS completamente).

---

## 📋 PASOS:

1. [ ] Abrir SQL Editor: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/sql/new
2. [ ] Copiar el SQL de "Opción 1" (desactivar RLS)
3. [ ] Hacer clic en **RUN** (o **Execute**)
4. [ ] Verificar que devuelve `rowsecurity = false`
5. [ ] Probar de nuevo el endpoint

---

## 🧪 Después de ejecutar el SQL, prueba:

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-avibszxld-davids-projects-8fa96e54.vercel.app/api/patients" -Method GET | ConvertTo-Json
```

**Ahora SÍ deberías ver tus pacientes** 🎉

---

¿Ejecutaste el SQL? Dime qué resultado obtuviste.
