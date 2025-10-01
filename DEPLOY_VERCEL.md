# 🚀 Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación de Masaje Corporal Deportivo en Vercel.

## 📋 Pre-requisitos

- [ ] Cuenta de GitHub con el proyecto subido
- [ ] Cuenta de Vercel (gratuita): https://vercel.com/signup
- [ ] Credenciales de Supabase configuradas
- [ ] Node.js 18+ instalado localmente

---

## 🎯 Arquitectura de Despliegue

```
┌─────────────────────────────────────┐
│   https://clinic.vercel.app         │
│   (Frontend Angular - PWA)          │
└─────────────┬───────────────────────┘
              │ API calls
              ▼
┌─────────────────────────────────────┐
│ https://clinic-api.vercel.app/api   │
│ (Backend Node.js + Express)         │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      Supabase PostgreSQL            │
│      (Ya configurado)               │
└─────────────────────────────────────┘
```

---

## 📦 PARTE 1: Desplegar Backend

### 1.1 Preparar el repositorio

```bash
# Asegúrate de estar en la raíz del proyecto
cd c:\Users\dsuarez1\git\clinic

# Añadir archivos de configuración
git add backend/vercel.json backend/.env.example
git commit -m "Add Vercel configuration for backend"
git push origin main
```

### 1.2 Crear proyecto en Vercel para el Backend

1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub
3. Configura el proyecto:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Output Directory**: (dejar vacío)
   - **Install Command**: `npm install`

### 1.3 Configurar Variables de Entorno en Vercel (Backend)

En el dashboard de Vercel → Settings → Environment Variables, añade:

```bash
# Variables requeridas
NODE_ENV=production
PORT=3000
UPLOADS_DIR=/tmp/uploads

# Base de datos Supabase
USE_SUPABASE=true
DATABASE_URL=postgresql://postgres.xxxx:password@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?connect_timeout=30&sslmode=require
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_KEY=eyJhbGciOiJI...
DB_TYPE=postgresql

# CORS (actualizar después de desplegar frontend)
FRONTEND_URL=https://clinic.vercel.app
```

⚠️ **IMPORTANTE**: Copia las credenciales de tu archivo `.env` actual.

### 1.4 Desplegar

Click en **Deploy** y espera a que termine.

**Tu backend estará en**: `https://clinic-backend-xxxx.vercel.app`

✅ **Verificar**: Visita `https://tu-backend.vercel.app/health`

---

## 🎨 PARTE 2: Desplegar Frontend

### 2.1 Actualizar URL del Backend

Edita `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://tu-backend.vercel.app/api", // ⚠️ Usa tu URL real
};
```

```bash
git add frontend/src/environments/environment.prod.ts
git commit -m "Update production API URL"
git push origin main
```

### 2.2 Crear proyecto en Vercel para el Frontend

1. Ve a https://vercel.com/new
2. Importa el mismo repositorio
3. Configura el proyecto:
   - **Framework Preset**: Angular
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/clinic-frontend/browser`
   - **Install Command**: `npm install`

### 2.3 Configurar Variables de Entorno (Frontend)

En el dashboard de Vercel → Settings → Environment Variables:

```bash
# Variables opcionales para el frontend
NODE_ENV=production
```

### 2.4 Desplegar

Click en **Deploy**.

**Tu frontend estará en**: `https://clinic-xxxx.vercel.app`

---

## 🔄 PARTE 3: Actualizar CORS

Una vez desplegado el frontend, actualiza la variable de entorno en el **backend**:

1. Ve al proyecto backend en Vercel
2. Settings → Environment Variables
3. Edita `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://clinic-xxxx.vercel.app
   ```
4. Redeploy el backend (Deployments → ... → Redeploy)

---

## 🌐 PARTE 4: Configurar Dominio Personalizado (Opcional)

### Para el Frontend:

1. Ve a tu proyecto frontend en Vercel
2. Settings → Domains
3. Añade tu dominio: `clinica.tudominio.com`
4. Configura el DNS según las instrucciones de Vercel

### Para el Backend:

1. Ve a tu proyecto backend en Vercel
2. Settings → Domains
3. Añade un subdominio: `api.tudominio.com`
4. Actualiza `FRONTEND_URL` en el backend
5. Actualiza `environment.prod.ts` en el frontend con la nueva URL

---

## ✅ Verificación Final

### Backend funcionando:

```bash
curl https://tu-backend.vercel.app/health
```

Deberías ver:

```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "production",
  "database": {
    "current": "Supabase (PostgreSQL)",
    "connected": true
  }
}
```

### Frontend funcionando:

1. Abre `https://tu-frontend.vercel.app`
2. Verifica que cargue la aplicación
3. Prueba crear una cita
4. Verifica que se guarde en la base de datos

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ver logs del backend
vercel logs https://tu-backend.vercel.app

# Ver logs del frontend
vercel logs https://tu-frontend.vercel.app
```

### Despliegue desde terminal:

```bash
# Desplegar backend
cd backend
vercel --prod

# Desplegar frontend
cd frontend
vercel --prod
```

---

## 🚨 Solución de Problemas

### Error de CORS

- Verifica que `FRONTEND_URL` en el backend sea correcta
- Asegúrate de que no tenga barra final `/`

### Error 404 en rutas del frontend

- Verifica que `vercel.json` tenga las rewrites configuradas
- Las rutas de Angular necesitan redirección a `index.html`

### Error de conexión a base de datos

- Verifica las credenciales de Supabase en variables de entorno
- Asegúrate de que `USE_SUPABASE=true` esté configurado

### Archivos subidos no se guardan

- Vercel usa sistema de archivos efímero
- Los archivos en `/tmp` se eliminan después de la ejecución
- **Solución**: Integrar almacenamiento en Supabase Storage (próxima mejora)

---

## 📊 Monitoreo

Vercel proporciona automáticamente:

- ✅ Analytics de tráfico
- ✅ Métricas de performance
- ✅ Logs de errores
- ✅ SSL/HTTPS automático
- ✅ CDN global

Accede desde: https://vercel.com/dashboard

---

## 🎉 ¡Listo!

Tu aplicación ya está en producción. Comparte tu URL:

**Frontend**: `https://tu-clinic.vercel.app`

---

## 📝 Próximos Pasos (Mejoras Recomendadas)

1. **Migrar uploads a Supabase Storage**

   - Los archivos de pacientes no persisten en `/tmp` de Vercel
   - Supabase ofrece 1GB gratis

2. **Configurar dominio personalizado**

   - Más profesional: `clinica.tudominio.com`

3. **Configurar CI/CD automático**

   - Cada push a `main` despliega automáticamente

4. **Añadir autenticación (opcional)**

   - Supabase Auth es gratuito y fácil de integrar

5. **Configurar backups automáticos**
   - Supabase hace backups automáticos diarios

---

## 💰 Costos

**Plan Gratuito de Vercel incluye:**

- 100 GB de ancho de banda
- Despliegues ilimitados
- SSL automático
- 2 proyectos (frontend + backend)

**Plan Gratuito de Supabase incluye:**

- 500 MB de base de datos
- 1 GB de almacenamiento de archivos
- 2 GB de transferencia de datos

✅ **Suficiente para una clínica pequeña/mediana sin costos**

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs en Vercel Dashboard
2. Consulta la documentación oficial: https://vercel.com/docs
3. Verifica las variables de entorno

---

**Creado para: Masaje Corporal Deportivo**  
**Stack**: Angular + Node.js + Express + Supabase + Vercel  
**Fecha**: Octubre 2025
