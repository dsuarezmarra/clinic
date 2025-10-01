# 🚀 Guía Rápida: Subir tu App a Internet con Vercel

## ¿Qué conseguirás?

Tu aplicación estará disponible en Internet con una URL tipo:

- **Frontend**: `https://tu-clinica.vercel.app`
- **Backend**: `https://tu-api.vercel.app`

Cualquiera podrá acceder desde cualquier dispositivo con conexión a Internet.

---

## ⏱️ Tiempo estimado: 30 minutos

---

## 📋 Paso 1: Preparativos (5 minutos)

### 1.1 Crear cuenta en Vercel

1. Ve a https://vercel.com/signup
2. Regístrate con tu cuenta de GitHub
3. Autoriza el acceso a tu repositorio

### 1.2 Instalar Vercel CLI

Abre PowerShell y ejecuta:

```powershell
npm install -g vercel
```

Verifica la instalación:

```powershell
vercel --version
```

### 1.3 Autenticarse en Vercel

⚠️ **Si estás en una red corporativa**, necesitas deshabilitar la verificación SSL:

```powershell
# Establecer variable de entorno (para evitar error de certificados)
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"

# Luego hacer login
vercel login
```

**Si no tienes problemas de red**, solo ejecuta:

```powershell
vercel login
```

Sigue las instrucciones en el navegador.

✅ **Tip**: Si el login falla con error de certificados SSL, ve a **`SOLUCION_ERROR_SSL.md`** para más opciones.

---

## 🔧 Paso 2: Subir el Código a GitHub (si no lo has hecho)

```powershell
# Desde la raíz del proyecto
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

---

## 🚀 Paso 3: Desplegar Backend (10 minutos)

### 3.1 Desplegar desde la terminal

```powershell
cd backend
vercel --prod
```

**Sigue las preguntas:**

- Set up and deploy? → **Yes**
- Which scope? → Selecciona tu cuenta
- Link to existing project? → **No**
- What's your project's name? → `clinic-backend` (o el que prefieras)
- In which directory is your code located? → `.`
- Want to override the settings? → **No**

**🎉 ¡Listo! Anota la URL que te da, será algo como:**

```
https://clinic-backend-xxxx.vercel.app
```

### 3.2 Configurar Variables de Entorno

1. Ve a https://vercel.com/dashboard
2. Click en tu proyecto `clinic-backend`
3. Ve a **Settings** → **Environment Variables**
4. Añade estas variables (copia de tu archivo `.env` local):

```
NODE_ENV=production
PORT=3000
UPLOADS_DIR=/tmp/uploads
USE_SUPABASE=true
DATABASE_URL=postgresql://postgres.xxxx...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
DB_TYPE=postgresql
FRONTEND_URL=https://tu-frontend.vercel.app
```

⚠️ **Importante**: Aún no sabemos la URL del frontend, la actualizaremos después.

5. Click en **Save**
6. Ve a **Deployments** → Click en los 3 puntos → **Redeploy**

### 3.3 Verificar que funciona

Abre en el navegador:

```
https://tu-backend.vercel.app/health
```

Deberías ver algo como:

```json
{
  "status": "OK",
  "database": {
    "current": "Supabase (PostgreSQL)",
    "connected": true
  }
}
```

✅ **Backend funcionando!**

---

## 🎨 Paso 4: Desplegar Frontend (10 minutos)

### 4.1 Actualizar la URL del backend

Edita el archivo `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://tu-backend.vercel.app/api", // ⚠️ USA TU URL REAL
  appName: "Clínica Masaje Corporal Deportivo",
  version: "1.0.0",
};
```

Guarda y sube los cambios:

```powershell
git add frontend/src/environments/environment.prod.ts
git commit -m "Actualizar URL del backend"
git push origin main
```

### 4.2 Desplegar

```powershell
cd ../frontend
vercel --prod
```

**Sigue las preguntas:**

- Set up and deploy? → **Yes**
- Which scope? → Selecciona tu cuenta
- Link to existing project? → **No**
- What's your project's name? → `clinic-frontend`
- In which directory is your code located? → `.`
- Want to override the settings? → **Yes**
  - Build Command? → `npm run build`
  - Output Directory? → `dist/clinic-frontend/browser`
  - Development Command? → `ng serve`

**🎉 ¡Listo! Anota la URL:**

```
https://clinic-frontend-xxxx.vercel.app
```

---

## 🔄 Paso 5: Conectar Frontend y Backend (5 minutos)

### 5.1 Actualizar CORS en el backend

1. Ve a https://vercel.com/dashboard
2. Click en el proyecto **backend**
3. Settings → Environment Variables
4. Edita la variable `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```
5. Save
6. Ve a Deployments → Redeploy

### 5.2 Verificar que todo funciona

1. Abre tu frontend: `https://tu-frontend.vercel.app`
2. Prueba crear un paciente
3. Prueba crear una cita
4. Verifica que se guarde correctamente

✅ **¡Todo funcionando!**

---

## 🌐 Paso 6: Usar un Dominio Personalizado (Opcional)

Si tienes un dominio tipo `miclinica.com`:

### Para el Frontend:

1. Ve a tu proyecto frontend en Vercel
2. Settings → Domains
3. Click en **Add**
4. Escribe: `miclinica.com`
5. Sigue las instrucciones para configurar el DNS

### Para el Backend:

1. Ve a tu proyecto backend en Vercel
2. Settings → Domains
3. Click en **Add**
4. Escribe: `api.miclinica.com`
5. Configura el DNS igual que antes

### Actualizar URLs:

1. Actualiza `environment.prod.ts` con `https://api.miclinica.com/api`
2. Actualiza `FRONTEND_URL` en el backend con `https://miclinica.com`
3. Redeploy ambos proyectos

---

## ✅ Verificación Final

- [ ] Backend responde en `/health`
- [ ] Frontend carga correctamente
- [ ] Puedes crear pacientes
- [ ] Puedes crear citas
- [ ] Las citas aparecen en el calendario
- [ ] La PWA se puede instalar

---

## 🎉 ¡Felicidades!

Tu aplicación ya está en Internet y disponible 24/7.

### URLs de tu aplicación:

- **Frontend**: `https://______________.vercel.app`
- **Backend**: `https://______________.vercel.app`

### Comparte tu app:

Cualquiera con la URL puede acceder desde:

- ✅ Computadora
- ✅ Tablet
- ✅ Móvil
- ✅ Cualquier navegador

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```powershell
# 1. Hacer cambios en el código
# 2. Subir a GitHub
git add .
git commit -m "Descripción de los cambios"
git push origin main

# 3. Desplegar
cd backend
vercel --prod

cd ../frontend
vercel --prod
```

**O configura despliegue automático:**

1. Ve a tu proyecto en Vercel
2. Settings → Git
3. Activa "Auto-deploy"
4. Cada push a GitHub desplegará automáticamente

---

## 🆘 Problemas Comunes

### "Error de CORS"

→ Verifica que `FRONTEND_URL` en el backend sea correcta

### "No se pueden crear citas"

→ Verifica las credenciales de Supabase en las variables de entorno

### "La app no carga"

→ Abre las herramientas de desarrollador (F12) y revisa la consola

### "404 en las rutas"

→ Verifica que `vercel.json` tenga las rewrites configuradas

---

## 💰 Costos

**TODO GRATIS** con los planes gratuitos:

- ✅ Vercel: 100 GB/mes de transferencia
- ✅ Supabase: 500 MB de base de datos
- ✅ SSL/HTTPS incluido
- ✅ Sin tarjeta de crédito requerida

Suficiente para cientos de usuarios simultáneos.

---

## 📚 Más Información

- Guía completa: [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)
- Checklist: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)
- Documentación oficial: https://vercel.com/docs

---

**¿Necesitas ayuda?** Revisa los logs en el Dashboard de Vercel.
