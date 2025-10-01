# Backend - Masaje Corporal Deportivo

Backend para aplicación de gestión de Masaje Corporal Deportivo desarrollado con Node.js, Express, Prisma y SQLite.

## 🚀 Características

- **Gestión de Pacientes**: CRUD completo con archivos adjuntos
- **Sistema de Citas**: Calendario con validación de solapamientos
- **Sesiones/Bonos**: Sistema de vales y bonos por tiempo (30m/60m)
- **Una Sala**: Control de solapamientos automático
- **Sin Autenticación**: Acceso abierto
- **API REST**: Endpoints completos y documentados
- **Zona Horaria**: Europe/Madrid con conversión UTC

## 📋 Requisitos

- Node.js 16+
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias**:

```bash
cd backend
npm install
```

2. **Configurar variables de entorno**:

```bash
# El archivo .env ya está creado con valores por defecto
# Puedes modificarlo si es necesario
```

3. **Configurar base de datos (Supabase / Postgres)**:

```bash
# Este proyecto usa Supabase (Postgres) en tiempo de ejecución.
# Asegúrate de configurar las variables de entorno en `.env` con las credenciales
# de Supabase (SERVICE KEY) y la URL.

# Ejemplo de variables mínimas en backend/.env:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_KEY=eyJhbGci... (service role key)

# Para poblar datos de ejemplo usa el script dedicado:
# node scripts/wipe-and-seed.js
```

## 🏃‍♂️ Uso

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Producción

```bash
npm run build
npm start
```

### Scripts Disponibles

- `npm run dev`: Desarrollo con nodemon
- `npm start`: Producción
- `node scripts/wipe-and-seed.js`: Poblar BD con datos de ejemplo (usa Supabase)

Nota: comandos relacionados con Prisma/SQLite (por ejemplo `db:generate`, `db:migrate`, `db:push`) son LEGACY y no se usan en el runtime. Los artefactos legacy se encuentran en `backend/legacy-prisma`.

## 📡 API Endpoints

### Health Check

- `GET /health` - Estado del servidor

### Pacientes

- `GET /api/patients` - Listar pacientes (con filtros)
- `POST /api/patients` - Crear paciente
- `GET /api/patients/:id` - Obtener paciente
- `PUT /api/patients/:id` - Actualizar paciente
- `DELETE /api/patients/:id` - Eliminar paciente

### Archivos de Pacientes

- `POST /api/patients/:id/files` - Subir archivos
- `GET /api/patients/:id/files` - Listar archivos
- `GET /api/patients/:id/files/:fileId/download` - Descargar archivo
- `DELETE /api/patients/:id/files/:fileId` - Eliminar archivo

### Citas

- `GET /api/appointments` - Obtener citas por rango
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/:id` - Obtener cita
- `PUT /api/appointments/:id` - Actualizar cita
- `DELETE /api/appointments/:id` - Cancelar/eliminar cita
- `GET /api/appointments/conflicts/check` - Verificar conflictos

### Sesiones

- `GET /api/credits?patientId=UUID` - Obtener Sesiones de paciente
- `POST /api/credits/packs` - Crear vale/bono
- `POST /api/credits/redeem` - Consumir Sesiones manualmente
- `GET /api/credits/history?patientId=UUID` - Historial de consumos
- `DELETE /api/credits/packs/:id` - Eliminar pack

### Configuración

- `GET /api/meta/config` - Obtener configuración
- `PUT /api/meta/config` - Actualizar configuración
- `POST /api/meta/config/reset` - Restablecer por defecto
- `GET /api/meta/config/working-hours/:date` - Verificar día laborable

## 💾 Modelo de Datos

### Pacientes

- Datos personales básicos
- Teléfono, dirección, fecha nacimiento
- Notas adicionales

### Archivos

- Subida segura en `/uploads/YYYY/MM/patientId/`
- Tipos permitidos: PDF, JPG, PNG, GIF, WEBP
- Límite: 10MB por archivo, 5 archivos simultáneos

### Citas

- Una sala - no solapamientos
- Duración: 30 o 60 minutos
- Estados: BOOKED, CANCELLED, NO_SHOW
- Consumo automático de Sesiones

### Sistema de Sesiones

- **Unidades**: Base 30 minutos (1 unidad = 30m, 2 unidades = 60m)
- **Vales**: 1 o 2 unidades
- **Bonos**: 5 × (30m o 60m) = 5 o 10 unidades
- **Consumo**: FIFO (First In, First Out)
- **Reversión**: Al cancelar citas

## 🔧 Configuración

### Horarios de Trabajo

Por defecto: Lunes a Viernes, 9:00-14:00 y 16:00-20:00

### Archivos Subidos

Se almacenan en: `./uploads/YYYY/MM/patientId/uuid.ext`

### Variables de Entorno

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./clinic.db"
UPLOADS_DIR="./uploads"
FRONTEND_URL="http://localhost:4300"
```

## 🚨 Validaciones

- **Solapamientos**: No se permiten citas simultáneas
- **Sesiones**: Verificación automática antes de crear citas
- **Archivos**: Validación de tipo y tamaño
- **Fechas**: Zona horaria Europe/Madrid
- **Datos**: Validaciones con express-validator

## 📁 Estructura

```
backend/
├── prisma/
│   ├── schema.prisma      # Modelo de datos
│   └── seed.js           # Datos de ejemplo
├── src/
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── fileUpload.js
│   ├── routes/
│   │   ├── patients.js
│   │   ├── appointments.js
│   │   ├── credits.js
│   │   └── config.js
│   ├── services/
│   │   ├── database.js
│   │   └── appointmentService.js
│   └── index.js          # Servidor principal
├── uploads/              # Archivos subidos
├── package.json
├── .env
└── README.md
```

## 🧪 Datos de Ejemplo

El comando `npm run seed` crea:

- 5 pacientes con datos realistas
- Varios vales y bonos con consumos parciales
- Citas de ejemplo (pasadas y futuras)
- Configuración básica de horarios

## ⚠️ Notas Importantes

1. **Sin Autenticación**: La API está completamente abierta
2. **Una Sala**: Solo se permite una cita por slot de tiempo
3. **Archivos**: Se almacenan en disco local (no cloud)
4. **SQLite**: Base de datos en archivo local
5. **Zona Horaria**: Todas las fechas se convierten a Europe/Madrid

## 🔍 Troubleshooting

### Error "P2002" - Datos duplicados

Violación de restricción única (ej. paciente duplicado)

### Error "P2025" - Registro no encontrado

ID inválido o registro eliminado

### Error "APPOINTMENT_OVERLAP"

Intento de crear cita en horario ocupado

### Error "INSUFFICIENT_CREDITS"

Paciente sin Sesiones suficientes

### Archivos no se suben

- Verificar permisos de escritura en `/uploads`
- Comprobar tipo de archivo permitido
- Revisar límite de tamaño (10MB)

## 📞 Soporte

Para problemas o consultas, revisar los logs del servidor y la documentación de la API.

## ⚙️ Restauración segura (producción)

Si necesitas permitir restauraciones manuales desde la interfaz en un entorno de producción sin habilitar una opción global amplia, usa `RESTORE_SECRET`.

- Define `RESTORE_SECRET` en el entorno del servidor (valor suficientemente fuerte y único).
- Reinicia el servidor para que lea la variable.
- Cuando quieras restaurar un backup desde la UI (o vía API), el cliente debe enviar el header `X-Restore-Secret: <valor>` o incluir `restoreSecret` en el body JSON.

Ejemplo (curl):

```bash
curl -X POST "https://mi-servidor/api/backup/restore/clinic_backup_manual_20250918_165802.json" \
	-H "X-Restore-Secret: mi-secreto-largo" \
	-H "Content-Type: application/json" -d '{}'
```

También puedes permitir restauraciones globalmente (menos recomendado) estableciendo `ALLOW_AUTO_RESTORE=true` en el entorno.

### Script npm (restore latest)

Para restaurar el backup más reciente desde la CLI (útil en despliegues o tareas), añade este script a `package.json` en `backend`:

```json
"scripts": {
	"restore:latest": "node -r dotenv/config scripts/restore_from_backup.js"
}
```

Y ejecútalo con:

```bash
cd backend
npm run restore:latest
```

Advertencia: este script usa las variables definidas en `backend/.env` o en el entorno.
