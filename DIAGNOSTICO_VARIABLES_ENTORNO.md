# 🔍 DIAGNÓSTICO: Verificar Variables de Entorno en Vercel

## El tenant existe, pero los endpoints fallan con 500

### Problema Identificado

1. ✅ La tabla `tenants` existe
2. ✅ El registro `masajecorporaldeportivo` existe y está activo
3. ✅ El frontend envía el header `X-Tenant-Slug: masajecorporaldeportivo`
4. ❌ Pero el backend sigue devolviendo 500

### Posibles Causas

1. **Variables de entorno incorrectas en Vercel**

   - `SUPABASE_URL` mal configurada
   - `SUPABASE_SERVICE_KEY` incorrecta o usando ANON_KEY por error

2. **Permisos de Supabase**

   - La SERVICE_ROLE_KEY no tiene permisos para leer la tabla `tenants`

3. **Error en el middleware**
   - El código está intentando acceder a `tenants` pero usando la key incorrecta

## 🔧 SOLUCIÓN PASO A PASO

### PASO 1: Verificar Variables de Entorno en Vercel

1. Ve a https://vercel.com/davids-projects-8fa96e54/clinic-backend
2. Ve a **Settings** → **Environment Variables**
3. Verifica que existan estas variables:

```
SUPABASE_URL = https://_____.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

⚠️ **IMPORTANTE**: Debe ser `SUPABASE_SERVICE_KEY` (service_role), NO `SUPABASE_ANON_KEY`

### PASO 2: Verificar que SERVICE_KEY tiene permisos

Ejecuta este query en **Supabase SQL Editor**:

\`\`\`sql
-- Verificar permisos de la tabla tenants
SELECT
grantee,
privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'tenants'
AND table_schema = 'public';
\`\`\`

Debería mostrar permisos para `service_role`.

### PASO 3: Habilitar RLS pero permitir service_role

Ejecuta en **Supabase SQL Editor**:

\`\`\`sql
-- Habilitar RLS en tenants pero permitir bypass con service_role
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Crear política que permite bypass con service_role
CREATE POLICY "Service role can access tenants"
ON public.tenants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'tenants';
\`\`\`

### PASO 4: Ver logs del backend en Vercel

1. Ve a https://vercel.com/davids-projects-8fa96e54/clinic-backend
2. Ve a **Deployments** → Click en el deployment más reciente
3. Ve a **Functions** → Click en cualquier función que esté fallando
4. Busca los logs que digan `Error fetching tenant:` o `Error in loadTenant middleware:`

**Copia los logs y pégalos aquí para poder diagnosticar el error exacto** 📋

### PASO 5: Si las variables están mal, actualizarlas

Si `SUPABASE_SERVICE_KEY` está mal o falta:

1. Ve a **Supabase Dashboard** → **Project Settings** → **API**
2. Copia la **service_role key** (la que dice "secret")
3. Ve a Vercel → **Settings** → **Environment Variables**
4. Actualiza `SUPABASE_SERVICE_KEY` con el valor correcto
5. **Redeploy** el backend:
   \`\`\`bash
   cd backend
   vercel --prod
   \`\`\`

## 🎯 SIGUIENTE PASO INMEDIATO

**Por favor, revisa los logs del backend en Vercel y copia el error exacto aquí.**

Específicamente busca:

- `Error fetching tenant:`
- `Error in loadTenant middleware:`
- Cualquier stack trace que muestre qué está fallando

Con esa información podré darte la solución exacta 🔍
