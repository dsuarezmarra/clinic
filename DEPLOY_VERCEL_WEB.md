# 🌐 Guía de Despliegue usando la Web de Vercel (Sin CLI)

Esta guía es para cuando **no puedes usar la CLI de Vercel** por problemas de red corporativa.

---

## ✅ Ventajas de usar la Web

- 🚫 No necesitas CLI
- 🚫 No necesitas terminal
- ✅ Todo desde el navegador
- ✅ Despliegue automático con Git
- ✅ Más simple para principiantes

---

## 🚀 Paso 1: Subir Código a GitHub (5 minutos)

### 1.1 Verificar que tu código está en GitHub

```powershell
# Desde la raíz del proyecto
git status

# Si hay cambios pendientes, súbelos
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

### 1.2 Verificar en GitHub

1. Ve a: `https://github.com/tu-usuario/clinic`
2. Verifica que todos los archivos estén ahí
3. Especialmente los archivos `vercel.json`

---

## 🔧 Paso 2: Desplegar Backend (10 minutos)

### 2.1 Importar en Vercel

1. Ve a: https://vercel.com/new
2. Click en **"Import Git Repository"**
3. Selecciona tu repositorio `clinic`
4. Click en **"Import"**

### 2.2 Configurar el Proyecto Backend

En la pantalla de configuración:

**Project Name**: `clinic-backend` (o el que prefieras)

**Framework Preset**: Other

**Root Directory**: Click en **"Edit"** → Selecciona `backend`

**Build and Output Settings**:

- Build Command: `npm install` (dejar por defecto)
- Output Directory: (dejar vacío)
- Install Command: `npm install` (dejar por defecto)

### 2.3 Configurar Variables de Entorno

Antes de desplegar, click en **"Environment Variables"**:

Añade estas variables copiándolas de tu archivo `backend/.env`:

```
NODE_ENV = production
PORT = 3000
UPLOADS_DIR = /tmp/uploads
USE_SUPABASE = true
DATABASE_URL = postgresql://postgres.xxxx...
SUPABASE_URL = https://xxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_KEY = eyJhbGci...
DB_TYPE = postgresql
FRONTEND_URL = https://tu-frontend.vercel.app
```

⚠️ **Nota**: Por ahora pon cualquier valor en `FRONTEND_URL`, lo actualizaremos después.

### 2.4 Desplegar

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. Verás un mensaje: **"Congratulations! Your project has been deployed"**
4. **Anota la URL**: `https://clinic-backend-xxxx.vercel.app`

### 2.5 Verificar

1. Click en la URL de tu proyecto
2. Añade `/health` al final
3. Deberías ver:

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

## 🎨 Paso 3: Desplegar Frontend (10 minutos)

### 3.1 Actualizar URL del Backend en el Código

**Importante**: Primero debemos actualizar el código con la URL del backend.

1. Abre: `frontend/src/environments/environment.prod.ts`
2. Reemplaza la URL:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://clinic-backend-xxxx.vercel.app/api", // ⚠️ TU URL REAL
  appName: "Clínica Masaje Corporal Deportivo",
  version: "1.0.0",
};
```

3. Guarda y sube a GitHub:

```powershell
git add frontend/src/environments/environment.prod.ts
git commit -m "Actualizar URL del backend"
git push origin main
```

### 3.2 Importar Frontend en Vercel

1. Ve a: https://vercel.com/new
2. Selecciona el mismo repositorio `clinic`
3. Click en **"Import"**

### 3.3 Configurar el Proyecto Frontend

**Project Name**: `clinic-frontend`

**Framework Preset**: Angular

**Root Directory**: Click en **"Edit"** → Selecciona `frontend`

**Build and Output Settings**:

- Build Command: `npm run build`
- Output Directory: `dist/clinic-frontend/browser`
- Install Command: `npm install`

**Environment Variables**: No necesita (opcional)

### 3.4 Desplegar

1. Click en **"Deploy"**
2. Espera 3-5 minutos (tarda más que el backend)
3. Verás: **"Congratulations!"**
4. **Anota la URL**: `https://clinic-frontend-xxxx.vercel.app`

✅ **Frontend desplegado!**

---

## 🔄 Paso 4: Conectar Frontend y Backend (5 minutos)

### 4.1 Actualizar FRONTEND_URL en el Backend

1. Ve a: https://vercel.com/dashboard
2. Click en el proyecto **clinic-backend**
3. Ve a **"Settings"** → **"Environment Variables"**
4. Encuentra la variable `FRONTEND_URL`
5. Click en **"Edit"**
6. Cambia el valor a: `https://clinic-frontend-xxxx.vercel.app`
7. Click en **"Save"**

### 4.2 Redesplegar el Backend

1. Ve a **"Deployments"** (en el menú superior)
2. Click en el deployment más reciente
3. Click en los **3 puntos** (···)
4. Click en **"Redeploy"**
5. Confirma **"Redeploy"**

Espera 1-2 minutos.

---

## ✅ Paso 5: Verificación (5 minutos)

### 5.1 Probar Backend

```
https://tu-backend.vercel.app/health
```

Debe mostrar status OK.

### 5.2 Probar Frontend

1. Abre: `https://tu-frontend.vercel.app`
2. Crea un nuevo paciente
3. Crea una cita
4. Verifica que se guarde

✅ **¡Todo funcionando!**

---

## 🔄 Despliegue Automático

### Configurar Auto-Deploy

1. En el Dashboard de Vercel
2. Selecciona cualquier proyecto
3. Ve a **"Settings"** → **"Git"**
4. Verifica que esté activado **"Production Branch"**: `main`

Ahora cada vez que hagas `git push`, se desplegará automáticamente.

---

## 📝 Futuras Actualizaciones

```powershell
# 1. Hacer cambios en el código
# 2. Commit y push
git add .
git commit -m "Nuevos cambios"
git push origin main

# 3. ¡Listo! Vercel despliega automáticamente
```

Verás el progreso en: https://vercel.com/dashboard

---

## 🌐 Dominio Personalizado (Opcional)

### Configurar tu propio dominio

#### Frontend (ejemplo: miclinica.com)

1. Ve al proyecto frontend en Vercel
2. **Settings** → **Domains**
3. Click en **"Add"**
4. Escribe: `miclinica.com`
5. Vercel te dará instrucciones DNS
6. Ve a tu proveedor de dominios (GoDaddy, Namecheap, etc.)
7. Añade los registros DNS que Vercel te indica
8. Espera 5-30 minutos para propagación

#### Backend (ejemplo: api.miclinica.com)

1. Ve al proyecto backend en Vercel
2. **Settings** → **Domains**
3. Click en **"Add"**
4. Escribe: `api.miclinica.com`
5. Añade el registro DNS (CNAME)
6. Espera propagación

#### Actualizar URLs después

1. Actualiza `environment.prod.ts` con la nueva URL
2. Actualiza `FRONTEND_URL` en el backend
3. Push a GitHub (redespliegue automático)

---

## 🎉 ¡Completado!

Tu aplicación está online:

- **Frontend**: `https://______________.vercel.app`
- **Backend**: `https://______________.vercel.app`

### Comparte con:

- ✅ Pacientes
- ✅ Colegas
- ✅ Cualquiera con Internet

---

## 📊 Dashboard de Vercel

Desde el dashboard puedes:

- 📈 Ver analytics y estadísticas
- 🔍 Ver logs de errores
- ⚙️ Cambiar configuración
- 🌐 Añadir dominios
- 🔄 Ver historial de deployments
- ↩️ Rollback a versiones anteriores

---

## 🆘 Solución de Problemas

### Error 404 en rutas del frontend

→ Verifica que `vercel.json` existe en la carpeta `frontend`

### Error de CORS

→ Verifica que `FRONTEND_URL` esté correcta en el backend

### Base de datos no conecta

→ Verifica las credenciales de Supabase en Environment Variables

### Build falla

→ Revisa los logs en el deployment
→ Verifica que `package.json` tenga todas las dependencias

---

## 💡 Tips

1. **Preview Deployments**: Cada rama en Git genera una URL de preview automática
2. **Protección con contraseña**: Settings → Deployment Protection
3. **Analytics**: Settings → Analytics (ver tráfico)
4. **Logs en tiempo real**: Deployment → Function Logs
5. **Rollback**: Si algo falla, vuelve a un deployment anterior con 1 click

---

## 📚 Recursos

- **Dashboard**: https://vercel.com/dashboard
- **Documentación**: https://vercel.com/docs
- **Soporte**: https://vercel.com/support

---

**Ventaja**: Sin CLI, sin problemas de certificados, 100% desde el navegador.

**Tiempo total**: ~30 minutos

¡Listo para producción! 🚀
