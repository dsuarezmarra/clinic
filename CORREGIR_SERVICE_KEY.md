# 🔑 CORREGIR SUPABASE SERVICE_KEY

## ❌ EL PROBLEMA:

Tu backend está usando la **ANON_KEY** en lugar de la **SERVICE_KEY** real.

La ANON_KEY tiene permisos limitados y está sujeta a las políticas RLS (Row Level Security).
La SERVICE_KEY tiene permisos completos de administrador.

---

## ✅ SOLUCIÓN:

### Paso 1: Obtener la SERVICE_KEY correcta

He abierto tu dashboard de Supabase API Settings:

```
https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/settings/api
```

Busca la sección **"Project API keys"** y copia:

- **`service_role` key** (NO la `anon` key)

La SERVICE_KEY es más larga y diferente a la ANON_KEY.

---

### Paso 2: Actualizar en Vercel

Una vez tengas la **service_role key**, ejecuta estos comandos:

```powershell
# Configurar SSL bypass
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"

# Ir al directorio backend
cd backend

# Eliminar la SERVICE_KEY incorrecta
vercel env rm SUPABASE_SERVICE_KEY production --yes

# Agregar la SERVICE_KEY correcta
# (Te pedirá que pegues el valor - pega la service_role key de Supabase)
vercel env add SUPABASE_SERVICE_KEY production
```

Cuando te pida el valor, **pega la service_role key** que copiaste de Supabase.

---

### Paso 3: Redeploy el backend

```powershell
# Asegúrate de estar en el directorio backend
cd backend

# Redeploy con la nueva configuración
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
vercel --prod
```

---

### Paso 4: Verificar que funciona

Una vez completado el deploy, prueba:

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-elrxywxbl-davids-projects-8fa96e54.vercel.app/api/patients" -Method GET
```

**Deberías ver tus pacientes** en lugar de un array vacío.

---

## 🎯 RESUMEN DE COMANDOS:

Copia y pega estos comandos uno por uno (espera a que termine cada uno):

```powershell
# 1. Configurar entorno
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
cd backend

# 2. Eliminar SERVICE_KEY incorrecta
vercel env rm SUPABASE_SERVICE_KEY production --yes

# 3. Agregar SERVICE_KEY correcta
# IMPORTANTE: Cuando te lo pida, pega la "service_role key" de Supabase
vercel env add SUPABASE_SERVICE_KEY production

# 4. Redeploy
vercel --prod

# 5. Esperar 30 segundos y probar
Start-Sleep -Seconds 30
Invoke-RestMethod -Uri "https://clinic-backend-elrxywxbl-davids-projects-8fa96e54.vercel.app/api/patients" -Method GET
```

---

## 📋 CHECKLIST:

- [ ] Abrir Supabase API Settings
- [ ] Copiar la **service_role key** (no la anon key)
- [ ] Ejecutar `vercel env rm SUPABASE_SERVICE_KEY production --yes`
- [ ] Ejecutar `vercel env add SUPABASE_SERVICE_KEY production` y pegar la service_role key
- [ ] Ejecutar `vercel --prod` para redeploy
- [ ] Probar el endpoint `/api/patients`
- [ ] ✅ Ver los datos de tus pacientes

---

**¿Necesitas ayuda?** Dime en qué paso estás y te guío.
