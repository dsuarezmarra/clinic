# 🏥 Masaje Corporal Deportivo - Aplicación de Gestión

Sistema completo de gestión para clínica de masaje deportivo con Angular, Node.js, Express y Supabase (PostgreSQL).

## ✨ Características

- 📅 **Sistema de Citas** - Calendario interactivo con FullCalendar
- 👥 **Gestión de Pacientes** - CRUD completo con archivos adjuntos
- 🎟️ **Sistema de Bonos** - Gestión de sesiones de 30m/60m
- 📱 **PWA** - Funciona offline y se puede instalar
- 🚫 **Sin Autenticación** - Acceso directo y simple
- 🗄️ **PostgreSQL** - Base de datos robusta en Supabase
- 🌍 **Zona Horaria** - Europe/Madrid con conversión UTC

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/clinic.git
cd clinic

# 2. Configurar Backend
cd backend
npm install
# Editar .env con credenciales de Supabase
npm run dev

# 3. Configurar Frontend (en otra terminal)
cd frontend
npm install
npm start
```

**URLs de desarrollo:**

- Frontend: http://localhost:4300
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health

## 📦 Desplegar en la Nube (Vercel)

### Opción 1: Despliegue Automático con Script

**Windows (PowerShell):**

```powershell
.\scripts\deploy-vercel.ps1
```

**Linux/Mac:**

```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

### Opción 2: Despliegue Manual

Sigue la guía completa paso a paso:

📖 **[GUÍA COMPLETA DE DESPLIEGUE](DEPLOY_VERCEL.md)**

✅ **[CHECKLIST DE DESPLIEGUE](DEPLOY_CHECKLIST.md)**

### Requisitos para Desplegar

- Cuenta en [Vercel](https://vercel.com/signup) (gratis)
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Vercel CLI: `npm install -g vercel`

**Tu app estará disponible en URLs como:**

- `https://tu-clinic.vercel.app`
- `https://tu-backend.vercel.app/api`

## 📁 Estructura del Proyecto

```
clinic/
├── backend/              # Node.js + Express + Supabase
│   ├── src/
│   │   ├── routes/       # Endpoints de la API
│   │   ├── middleware/   # Middlewares personalizados
│   │   └── database/     # Conexión a Supabase
│   ├── scripts/          # Scripts de utilidad
│   ├── vercel.json       # Configuración de Vercel
│   └── package.json
│
├── frontend/             # Angular 20 + PWA
│   ├── src/
│   │   ├── app/          # Componentes y servicios
│   │   ├── assets/       # Recursos estáticos
│   │   └── environments/ # Configuración por entorno
│   ├── vercel.json       # Configuración de Vercel
│   └── package.json
│
├── scripts/
│   ├── deploy-vercel.ps1  # Script de despliegue (Windows)
│   └── deploy-vercel.sh   # Script de despliegue (Linux/Mac)
│
├── DEPLOY_VERCEL.md      # Guía completa de despliegue
├── DEPLOY_CHECKLIST.md   # Checklist de verificación
└── README.md             # Este archivo
```

## 🛠️ Stack Tecnológico

### Frontend

- **Angular 20** - Framework principal
- **TypeScript** - Lenguaje
- **Bootstrap 5** - Estilos y componentes
- **FullCalendar** - Calendario interactivo
- **Service Worker** - Funcionalidad offline (PWA)

### Backend

- **Node.js 18+** - Runtime
- **Express** - Framework web
- **Supabase** - PostgreSQL en la nube
- **Moment.js** - Manejo de fechas y zonas horarias
- **Multer** - Subida de archivos

## 📖 Documentación

- [Backend README](backend/README.md) - Documentación del backend y API
- [Guía de Despliegue](DEPLOY_VERCEL.md) - Cómo desplegar en Vercel
- [Checklist de Despliegue](DEPLOY_CHECKLIST.md) - Verificación paso a paso
- [Scripts de Deployment](scripts/README_DEPLOY.md) - Scripts automatizados

## 🔧 Comandos Útiles

### Backend

```bash
cd backend
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run backup       # Backup manual de la BD
```

### Frontend

```bash
cd frontend
npm start            # Desarrollo (puerto 4300)
npm run build        # Build de producción
npm run watch        # Build con watch mode
```

### Ambos Servidores

```bash
# Desde VSCode, usa las tareas configuradas:
# Terminal → Run Task → "Start Both Servers"
```

## 🌐 API Endpoints

### Pacientes

- `GET /api/patients` - Listar pacientes
- `POST /api/patients` - Crear paciente
- `GET /api/patients/:id` - Obtener paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Eliminar paciente

### Citas

- `GET /api/appointments` - Obtener citas (con filtros)
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/:id` - Obtener cita
- `PUT /api/appointments/:id` - Actualizar cita
- `DELETE /api/appointments/:id` - Cancelar/eliminar cita

### Bonos

- `GET /api/credits` - Listar bonos
- `POST /api/credits` - Crear bono
- `GET /api/credits/:id` - Obtener bono
- `PUT /api/credits/:id` - Actualizar bono

Ver documentación completa en [backend/README.md](backend/README.md)

## 💰 Costos

**Completamente GRATIS para uso básico:**

### Vercel (Plan Hobby)

- ✅ 100 GB de ancho de banda/mes
- ✅ Despliegues ilimitados
- ✅ SSL/HTTPS automático
- ✅ 2 proyectos (frontend + backend)

### Supabase (Plan Free)

- ✅ 500 MB de base de datos PostgreSQL
- ✅ 1 GB de almacenamiento de archivos
- ✅ 2 GB de transferencia/mes
- ✅ Backups automáticos diarios

**Suficiente para una clínica pequeña/mediana sin costos mensuales**

## 🔒 Seguridad

- ✅ Headers de seguridad con Helmet
- ✅ CORS configurado
- ✅ SSL/HTTPS automático en Vercel
- ✅ Variables de entorno para secretos
- ✅ Validación de datos en backend
- ⚠️ Sin autenticación (diseñado para uso interno)

## 🚧 Próximas Mejoras

- [ ] Migrar uploads a Supabase Storage (archivos persistentes)
- [ ] Sistema de autenticación opcional con Supabase Auth
- [ ] Dashboard de estadísticas y reportes
- [ ] Notificaciones por email/SMS
- [ ] Sistema de recordatorios de citas
- [ ] Aplicación móvil nativa con Capacitor

## 🆘 Soporte y Troubleshooting

### Backend no conecta a Supabase

- Verifica las credenciales en `.env`
- Asegúrate de usar `SUPABASE_SERVICE_KEY`, no `ANON_KEY`
- Revisa los logs: `npm run dev`

### Error de CORS en producción

- Actualiza `FRONTEND_URL` en variables de entorno del backend
- Redeploy el backend después de cambiar variables

### PWA no se actualiza

- Limpia caché del navegador
- Desinstala y reinstala la PWA
- Verifica que `ngsw-config.json` esté correcto

### Más ayuda

- Revisa los logs en Vercel Dashboard
- Consulta [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)
- Verifica el health check: `/health`

## 📄 Licencia

MIT License - Uso libre para proyectos personales y comerciales

## 👨‍💻 Desarrollo

Desarrollado para Masaje Corporal Deportivo con Angular 20, Node.js y Supabase.

**Stack**: Angular + Node.js + Express + Supabase + Vercel  
**Año**: 2025

---

## 🎉 ¡Listo para Producción!

Sigue la [Guía de Despliegue](DEPLOY_VERCEL.md) y tendrás tu aplicación online en menos de 30 minutos.
