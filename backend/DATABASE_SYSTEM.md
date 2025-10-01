# 🗄️ SISTEMA MULTI-BASE DE DATOS CON FALLBACK AUTOMÁTICO

## 📋 Resumen del Sistema

El sistema de clínica ahora cuenta con un **fallback automático inteligente** que prioriza PostgreSQL pero usa SQLite cuando hay restricciones de conectividad (perfecto para entornos corporativos).

## 🚀 Características Implementadas

### ✅ Priorizacion Automática

- **Primera opción**: PostgreSQL (Supabase) - Base de datos en la nube
- **Fallback**: SQLite - Base de datos local sin requerir conexión

### ✅ Detección Inteligente

- Detecta problemas de red/conectividad automáticamente
- Cambia a SQLite cuando PostgreSQL no está disponible
- Mantiene el servicio funcionando sin interrupciones

### ✅ Reconexión Automática

- Intenta reconectar a PostgreSQL cada 5 minutos cuando usa fallback
- Notifica cuando la base preferida vuelve a estar disponible
- Permite cambio manual entre configuraciones

### ✅ Gestión Simplificada

- Script `switch-database.js` para cambiar configuraciones fácilmente
- Backups automáticos antes de cambios
- Regeneración automática de cliente Prisma

## 🛠️ Cómo Usar

### Verificar Estado Actual

```bash
node switch-database.js
```

### Cambiar a PostgreSQL (para oficina con internet)

```bash
node switch-database.js postgresql
npx prisma generate
npm run dev
```

### Cambiar a SQLite (para PC corporativo sin internet)

```bash
node switch-database.js sqlite
npx prisma generate
npm run dev
```

### Ver Estado del Servidor

```bash
curl http://localhost:3000/health
```

## 🌐 Endpoint de Estado

El endpoint `/health` ahora incluye información de la base de datos:

```json
{
  "status": "OK",
  "timestamp": "2025-09-02T20:35:44.889Z",
  "environment": "development",
  "database": {
    "current": "sqlite",
    "isPreferred": false,
    "connectionAttempts": 1
  }
}
```

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

- `src/database/database-manager.js` - Gestor inteligente de conexiones
- `src/database/database-service.js` - Servicio de acceso unificado
- `src/middleware/database-middleware.js` - Middleware de inyección automática
- `switch-database.js` - Script de cambio de configuración
- `test-multi-db.js` - Script de pruebas del sistema
- `.env.multi` - Configuración multi-base de datos
- `prisma/schema-dynamic.prisma` - Schema base para ambas BD

### Archivos Modificados

- `src/index.js` - Servidor con inicialización inteligente
- `.env` - Configuración actual con variables para ambas BD
- `prisma/schema.prisma` - Schema activo según configuración

## 🔧 Casos de Uso

### 1. Oficina Principal (con Internet)

- **Configuración**: PostgreSQL
- **Ventajas**: Sincronización en la nube, múltiples usuarios, backups automáticos
- **Comando**: `node switch-database.js postgresql`

### 2. PC Corporativo (sin acceso a internet)

- **Configuración**: SQLite
- **Ventajas**: Funciona offline, sin restricciones de firewall, datos locales
- **Comando**: `node switch-database.js sqlite`

### 3. Desarrollo/Testing

- **Configuración**: SQLite
- **Ventajas**: Rápido, sin dependencias externas, fácil reset
- **Comando**: `node switch-database.js sqlite`

## 📊 Estado de Datos

### PostgreSQL (189 pacientes)

- Datos originales de la clínica
- Sin campos phone2, family_contact, notes

### SQLite (240 pacientes)

- Incluye datos originales + importación XHTML
- 22 pacientes con phone2
- 62 pacientes con family_contact
- 57 pacientes con notas

## 🔄 Migración de Datos

Los scripts de migración están disponibles:

- `migrate-direct.js` - Migración PostgreSQL → SQLite
- `update-with-xhtml.js` - Actualización con datos adicionales

## 🚨 Troubleshooting

### Error de conexión PostgreSQL

- El sistema automáticamente cambiará a SQLite
- Revisar configuración de red/firewall
- Verificar credenciales en `.env`

### Error en SQLite

- Verificar permisos de archivo `clinic.db`
- Confirmar que el archivo existe
- Regenerar con `npx prisma db push`

### Cliente Prisma corrupto

- Eliminar `node_modules/.prisma`
- Ejecutar `npx prisma generate`
- Reiniciar servidor

## 🎯 Recomendaciones

1. **Para uso diario**: Mantener PostgreSQL cuando sea posible
2. **Para PC corporativo**: SQLite es la mejor opción
3. **Antes de cambios**: Hacer backup de datos
4. **Testing**: Usar SQLite para desarrollo rápido

## 🔐 Seguridad

- Las credenciales están en variables de entorno
- SQLite no requiere credenciales de red
- Backups automáticos incluyen ambas configuraciones
- Headers de seguridad configurados para ambas BD

---

**¿Desea continuar con alguna configuración específica o realizar pruebas adicionales?**
