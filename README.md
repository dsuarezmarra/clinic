# ?? Clinic - Sistema Multi-Cliente

Sistema de gestión para clínicas con arquitectura multi-tenant.

## Stack

- **Frontend:** Angular 20 + PWA
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Vercel

## Características

- ?? Calendario de citas (FullCalendar)
- ?? Gestión de pacientes
- ??? Sistema de bonos/sesiones
- ?? PWA instalable
- ?? Temas personalizables por cliente
- ?? Multi-tenant (múltiples clientes)
- ?? Sin autenticación - Acceso directo

## Clientes Configurados

### Masaje Corporal Deportivo

- **URL:** https://masajecorporaldeportivo.vercel.app
- **Colores:** Azul/Púrpura (#667eea / #764ba2)

### Actifisio

- **URL:** https://actifisio.vercel.app (pendiente deployment)
- **Colores:** Naranja/Amarillo (#ff6b35 / #f7b731)

## Infraestructura

| Servicio     | URL                                | Cuenta                 |
| ------------ | ---------------------------------- | ---------------------- |
| **Frontend** | masajecorporaldeportivo.vercel.app | dsuarezmarras-projects |
| **Backend**  | api-clinic-personal.vercel.app     | dsuarezmarras-projects |
| **Database** | kctoxebchyrgkwofdkht.supabase.co   | dsuarezmarra           |

## Inicio Rápido

### Backend

```bash
cd backend
npm install
# Configurar .env con credenciales de Supabase
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

**URLs de desarrollo:**

- Frontend: http://localhost:4300
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health

## Estructura

```
clinic/
??? backend/          Node.js + Express API
??? frontend/         Angular 20 + PWA
??? scripts/          Utilidades y deployment
??? docs/             Documentación
```

## Deployment

### Backend (Vercel)

```bash
cd backend
vercel --prod
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

## Variables de Entorno

### Backend (.env)

```env
SUPABASE_URL=https://kctoxebchyrgkwofdkht.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
NODE_ENV=production
```

### Frontend (Vercel)

```env
API_URL=https://api-clinic-personal.vercel.app/api
CLIENT_ID=masajecorporaldeportivo
```

## Documentación

- [Implementación de nuevos clientes](docs/implementacion-clientes/README.md)
- [Backups automáticos](docs/BACKUP_AUTOMATICO_VERCEL_CRON.md)
- [Guía de login](docs/GUIA_IMPLEMENTACION_LOGIN.md)

## Añadir Nuevo Cliente

Ver documentación completa en `docs/implementacion-clientes/`

Pasos principales:

1. Crear configuración en `frontend/src/config/clients/[cliente].config.ts`
2. Crear tablas en Supabase con sufijo `_[cliente]`
3. Configurar proyecto Vercel para frontend
4. Deploy

---

**Última actualización:** Diciembre 2025
