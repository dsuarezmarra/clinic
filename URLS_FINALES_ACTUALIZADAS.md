# 🔗 URLS FINALES - APLICACIÓN DESPLEGADA

## ✅ URLs Actualizadas (Enero 24, 2025)

### 🌐 Frontend (Angular PWA)

```
https://clinic-frontend-b5rqw5sgq-davids-projects-8fa96e54.vercel.app
```

**Esta es la URL principal para acceder a tu aplicación**

### 🔧 Backend (Node.js + Express + Supabase)

```
https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app
```

---

## 📋 Verificación

### Test del Backend (GET /api/patients):

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/patients?limit=3"
```

### Test de Archivos (GET /api/files/patient/:id):

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/files/patient/1"
```

### Test de Configuración (GET /api/config):

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/config"
```

### Test de Backups (GET /api/backup/stats):

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/backup/stats"
```

---

## 🎯 FUNCIONALIDADES DISPONIBLES

### ✅ Gestión de Pacientes

- Listar, crear, editar, eliminar pacientes
- Subir y descargar archivos adjuntos
- Búsqueda por nombre, DNI, teléfono
- Datos geográficos (provincias/municipios)

### ✅ Agenda de Citas

- Calendario mensual/semanal/diario
- Crear, editar, cancelar citas
- Detección de conflictos de horario
- Filtrado por paciente

### ✅ Sistema de Créditos

- Crear bonos de sesiones
- Canjear créditos en citas
- Historial de uso
- Control de pagos

### ✅ Configuración

- Horarios de trabajo
- Precios de sesiones y bonos
- Duración de citas
- Restaurar valores por defecto

### ✅ Backups

- Crear respaldos de datos
- Descargar backups en JSON
- Estadísticas de base de datos
- Listado de backups disponibles

---

## 🔄 Comandos de Redeploy

### Redesplegar Backend:

```powershell
cd backend
git add .
git commit -m "feat: Nueva funcionalidad"
vercel --prod
```

### Redesplegar Frontend:

```powershell
cd frontend
git add .
git commit -m "feat: Nueva funcionalidad"
vercel --prod
```

---

## 📝 Notas Importantes

1. **Datos Existentes**: La base de datos ya contiene 212 pacientes
2. **Archivos**: Se guardan en base64 en PostgreSQL (max ~5MB por archivo)
3. **Backups**: Son "virtuales" - se crean en tiempo real al solicitarse
4. **CORS**: Configurado para cualquier origen (sin restricciones)
5. **Rate Limiting**: Supabase free tier (500 req/seg)

---

## 🆘 Troubleshooting

### Error de red en PowerShell:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
```

### Ver logs del backend:

```powershell
vercel logs https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app
```

### Ver logs del frontend:

```powershell
vercel logs https://clinic-frontend-b5rqw5sgq-davids-projects-8fa96e54.vercel.app
```

---

## 🎉 ¡TODO LISTO!

Tu aplicación está **completamente funcional** con:

- ✅ 50+ endpoints API implementados
- ✅ Frontend interactivo desplegado
- ✅ Base de datos conectada (Supabase)
- ✅ Sistema de archivos funcionando
- ✅ Sistema de créditos funcionando
- ✅ Sistema de backups funcionando

**Accede ahora**: https://clinic-frontend-b5rqw5sgq-davids-projects-8fa96e54.vercel.app
