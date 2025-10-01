# 📋 Checklist de Despliegue en Vercel

Usa este checklist para asegurarte de completar todos los pasos.

## ✅ Pre-requisitos

- [ ] Cuenta de GitHub con el proyecto subido
- [ ] Cuenta de Vercel creada (https://vercel.com/signup)
- [ ] Vercel CLI instalado: `npm install -g vercel`
- [ ] Credenciales de Supabase a mano
- [ ] Git configurado con el repositorio actualizado

## 📦 Backend

### Configuración

- [ ] Archivo `backend/vercel.json` creado
- [ ] Archivo `backend/.vercelignore` creado
- [ ] Archivo `backend/.env.production` creado con valores de ejemplo

### Despliegue

- [ ] Proyecto backend creado en Vercel
- [ ] Root Directory configurado: `backend`
- [ ] Variables de entorno configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `UPLOADS_DIR=/tmp/uploads`
  - [ ] `USE_SUPABASE=true`
  - [ ] `DATABASE_URL` (Supabase)
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `DB_TYPE=postgresql`
  - [ ] `FRONTEND_URL` (actualizar después del frontend)
- [ ] Desplegado exitosamente
- [ ] Health check funciona: `https://tu-backend.vercel.app/health`
- [ ] URL del backend anotada: `_______________________________`

## 🎨 Frontend

### Configuración

- [ ] Archivo `frontend/vercel.json` creado
- [ ] Archivo `frontend/.vercelignore` creado
- [ ] `environment.prod.ts` actualizado con URL del backend

### Despliegue

- [ ] Proyecto frontend creado en Vercel
- [ ] Root Directory configurado: `frontend`
- [ ] Framework Preset: Angular
- [ ] Output Directory: `dist/clinic-frontend/browser`
- [ ] Desplegado exitosamente
- [ ] Aplicación carga correctamente
- [ ] URL del frontend anotada: `_______________________________`

## 🔄 Post-Despliegue

- [ ] Variable `FRONTEND_URL` actualizada en el backend
- [ ] Backend redeployado con nueva variable
- [ ] CORS funcionando correctamente
- [ ] Prueba crear un paciente
- [ ] Prueba crear una cita
- [ ] Prueba consultar el calendario
- [ ] PWA funciona offline
- [ ] Service Worker registrado

## 🌐 Dominio Personalizado (Opcional)

- [ ] Dominio comprado
- [ ] Dominio añadido al frontend en Vercel
- [ ] Subdominio API configurado para backend
- [ ] DNS configurado correctamente
- [ ] SSL activo
- [ ] Variables de entorno actualizadas con nuevos dominios

## 📊 Verificación Final

- [ ] Backend health check: ✅
- [ ] Frontend carga: ✅
- [ ] API responde: ✅
- [ ] Base de datos conecta: ✅
- [ ] CORS funciona: ✅
- [ ] PWA instala: ✅
- [ ] Sin errores en console: ✅

## 🎉 ¡Completado!

**URLs de producción:**

- Frontend: `_______________________________`
- Backend: `_______________________________`

**Fecha de despliegue:** `___/___/______`

---

## 📝 Notas adicionales

(Anota aquí cualquier problema encontrado o configuración especial)

```





```
