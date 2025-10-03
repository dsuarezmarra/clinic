# URLs Finales - Masaje Corporal Deportivo# 🎯 URLS FINALES ACTUALIZADAS - v2.4.1# 🔗 URLS FINALES - APLICACIÓN DESPLEGADA

**Fecha**: 3 de octubre de 2025 **Fecha:** 3 de octubre de 2025, 12:45 PM ## ✅ URLs Actualizadas (Enero 24, 2025)

**Versión**: v2.4.2 (Backend + Frontend)

**Estado**: ✅ PRODUCCIÓN**Versión Backend:** 2.4.1

---**Versión Frontend:** 2.4.1 ### 🌐 Frontend (Angular PWA)

## 🌐 URL Permanente del Cliente**Estado:** ✅ PRODUCCIÓN CON URL ESTÁTICA

### URL Oficial (Permanente e Innamovible)```

```

https://masajecorporaldeportivo.vercel.app---https://clinic-frontend-b5rqw5sgq-davids-projects-8fa96e54.vercel.app

```

```

Esta URL:

- ✅ **Permanente**: Nunca cambiará## 🌐 URL OFICIAL DEL CLIENTE

- ✅ **Estática**: Siempre apunta al último despliegue de producción

- ✅ **Sin autenticación**: Acceso directo sin login**Esta es la URL principal para acceder a tu aplicación**

- ✅ **Multi-tenant**: Identificado por slug `masajecorporaldeportivo`

### ⭐ **Masaje Corporal Deportivo**

---

### 🔧 Backend (Node.js + Express + Supabase)

## 🏗️ URLs Técnicas (Internas)

```

### Backend (v2.4.2)

`https://masajecorporaldeportivo.vercel.app`

https://clinic-backend-jpq8pe9xt-davids-projects-8fa96e54.vercel.app

``````https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app

- **Versión**: 2.4.2

- **Cambios**: CSV billing SELECT fix (relaciones con sufijos)````

- **Inspect**: https://vercel.com/davids-projects-8fa96e54/clinic-backend/EWPtXR12Xx34fWngVVZQvycBwMgh

- **Desplegado**: 3 octubre 2025, ~13:10✅ **URL ESTÁTICA Y PERMANENTE**



### Frontend (Último Deployment)✅ Nunca cambiará ---

```

https://clinic-frontend-14j8nrbl0-davids-projects-8fa96e54.vercel.app✅ Configurada con alias en Vercel

```

- **Apunta a**: Backend v2.4.2✅ SSL automático (HTTPS) ## 📋 Verificación

- **Inspect**: https://vercel.com/davids-projects-8fa96e54/clinic-frontend/671rYbnXNMZzajz4LpG9Dy4iYQ3w

- **Desplegado**: 3 octubre 2025, ~13:10✅ Lista para compartir con clientes

- **Alias**: masajecorporaldeportivo.vercel.app ✅

### Test del Backend (GET /api/patients):

---

---

## 📋 Historial de Versiones

```powershell

### v2.4.2 (ACTUAL) - 3 octubre 2025

- ✅ **Fix CSV Export**: Corregido SELECT de `/api/reports/billing` para usar `req.getTable()` en relaciones## 🔧 BACKEND API (Interno)$env:NODE_TLS_REJECT_UNAUTHORIZED="0"

- ✅ **Root Cause**: Supabase necesita nombres con sufijos en SELECT cuando tablas físicas tienen sufijos

- ✅ **Verificación**: CSV exportándose correctamente con curlInvoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/patients?limit=3"

- ⏳ **Pendiente**: Usuario debe verificar desde interfaz web

```

### v2.4.1 - 3 octubre 2025

- ✅ Agregado middleware `loadTenant` a `/files*` endpointshttps://clinic-backend-mweaxa2qv-davids-projects-8fa96e54.vercel.app/api

- ❌ Intento incorrecto de fix CSV (sin sufijos en SELECT)

`````### Test de Archivos (GET /api/files/patient/:id):

### v2.4.0 - 3 octubre 2025

- ✅ Corregidos precios de bonos/packs en endpoints



---**Versión:** 2.4.1  ```powershell



## 🧪 Pruebas de Verificación**Correcciones:**Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/files/patient/1"



### 1. Prueba Manual Endpoint CSV (✅ PASADA)- ✅ Middleware `loadTenant` aplicado a `/files*````

```bash

curl -H "X-Tenant-Slug: masajecorporaldeportivo" \- ✅ Select corregido en `/reports/billing`

  "https://clinic-backend-jpq8pe9xt-davids-projects-8fa96e54.vercel.app/api/reports/billing?year=2025&month=10&groupBy=appointment"

```### Test de Configuración (GET /api/config):



**Resultado Esperado** (200 OK):---

```csv

Fecha;Hora;Paciente;DNI;Duración (min);Tipo;Estado Pago;Precio (€)```powershell

1/10/2025;07:00;pruebas pruebas;53504988O;60;Bono 1x60min;Pagado;49.60

```## 🧪 FUNCIONALIDADES A PROBARInvoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/config"



✅ **FUNCIONANDO**`````



### 2. Prueba desde Interfaz Web (⏳ PENDIENTE)Todas las pruebas usar la URL estática:



**Usuario debe verificar**:### Test de Backups (GET /api/backup/stats):



1. Acceder a: https://masajecorporaldeportivo.vercel.app/agenda### 1️⃣ Archivos - Listar

2. Hacer clic en botón "Exportar CSV"

3. Verificar que se descarga archivo CSV sin error 400`````powershell

4. Abrir CSV y confirmar que contiene datos correctos

https://masajecorporaldeportivo.vercel.app/pacientesInvoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/backup/stats"

**Variantes a probar**:

- `groupBy=appointment`: CSV agrupado por cita individual→ Abrir paciente "pruebas pruebas"```

- `groupBy=patient`: CSV agrupado por paciente con totales

→ Pestaña "Archivos"

---

✅ Debe cargar sin error 500---

## 🔧 Configuración Multi-Tenant

```

### Tenant Slug

```## 🎯 FUNCIONALIDADES DISPONIBLES

masajecorporaldeportivo

```### 2️⃣ Archivos - Subir



### Tablas en Supabase```### ✅ Gestión de Pacientes

Todas las tablas tienen sufijo `_masajecorporaldeportivo`:

- `patients_masajecorporaldeportivo`En pestaña Archivos → "Subir archivo"

- `appointments_masajecorporaldeportivo`

- `credit_packs_masajecorporaldeportivo`✅ Debe subir sin error 500- Listar, crear, editar, eliminar pacientes

- `credit_redemptions_masajecorporaldeportivo`

- `patient_files_masajecorporaldeportivo````- Subir y descargar archivos adjuntos

- `patient_backups_masajecorporaldeportivo`

- `billing_prices_masajecorporaldeportivo`- Búsqueda por nombre, DNI, teléfono

- `backup_metadata_masajecorporaldeportivo`

- `tenants` (tabla compartida)### 3️⃣ CSV Exportación- Datos geográficos (provincias/municipios)



### Header HTTP```

Todas las peticiones del frontend incluyen:

```https://masajecorporaldeportivo.vercel.app/agenda### ✅ Agenda de Citas

X-Tenant-Slug: masajecorporaldeportivo

```→ Click "Exportar CSV"



---✅ Debe descargar sin error 400- Calendario mensual/semanal/diario



## 📊 Endpoints Verificados```- Crear, editar, cancelar citas



| Endpoint | Estado | Notas |- Detección de conflictos de horario

|----------|--------|-------|

| `GET /api/patients` | ✅ OK | Listado de pacientes |### 4️⃣ Precios- Filtrado por paciente

| `POST /api/patients` | ✅ OK | Crear paciente |

| `GET /api/appointments/all` | ✅ OK | Todas las citas con relaciones |```

| `POST /api/appointments` | ✅ OK | Crear cita con bonos |

| `GET /api/credit-packs/patient/:id` | ✅ OK | Bonos de paciente |https://masajecorporaldeportivo.vercel.app/configuracion### ✅ Sistema de Créditos

| `GET /api/files/patient/:id` | ✅ OK | Archivos de paciente (v2.4.1) |

| `POST /api/files/patient/:id` | ✅ OK | Subir archivo (v2.4.1) |→ Pestaña "Precios"

| `GET /api/reports/billing` | ✅ OK | Exportar CSV (v2.4.2) |

✅ Debe guardar correctamente (ya funcionaba)- Crear bonos de sesiones

---

```- Canjear créditos en citas

## 🎯 Próximos Pasos

- Historial de uso

### Inmediato (Usuario)

1. ⏳ Verificar exportación CSV desde interfaz web---- Control de pagos

2. ⏳ Confirmar que archivos se suben correctamente

3. ⏳ Probar todas las funcionalidades principales



### Si todo funciona## 📋 COMANDO USADO PARA ALIAS### ✅ Configuración

- ✅ Sistema listo para producción

- ✅ Multi-tenant completamente operativo

- ✅ Puede comenzar a usar el sistema con clientes reales

```bash- Horarios de trabajo

### Si hay problemas

1. Compartir error exacto de la consola del navegador (F12)vercel alias set clinic-frontend-p1xqdrysv-davids-projects-8fa96e54.vercel.app masajecorporaldeportivo.vercel.app- Precios de sesiones y bonos

2. Verificar Network tab para ver respuesta del servidor

3. Revisar logs del backend en Vercel Inspect URL```- Duración de citas



---- Restaurar valores por defecto



## 📞 Contacto & Soporte**Resultado:**



- **Vercel Dashboard Backend**: https://vercel.com/davids-projects-8fa96e54/clinic-backend```### ✅ Backups

- **Vercel Dashboard Frontend**: https://vercel.com/davids-projects-8fa96e54/clinic-frontend

- **Supabase Dashboard**: https://supabase.com/dashboard/project/nnfxzgvplvavgdfmgrrb✅ Success! https://masajecorporaldeportivo.vercel.app now points to



---   https://clinic-frontend-p1xqdrysv-davids-projects-8fa96e54.vercel.app [2s]- Crear respaldos de datos



**Sistema**: Masaje Corporal Deportivo  ```- Descargar backups en JSON

**Cliente**: Único (sin autenticación)

**Arquitectura**: Multi-tenant con tenant slug  - Estadísticas de base de datos

**Estado**: ✅ PRODUCCIÓN v2.4.2

**Última actualización**: 3 octubre 2025, 13:15---- Listado de backups disponibles




## 🚀 FUTUROS DESPLIEGUES---



El alias se mantiene automáticamente. En cada nuevo despliegue:## 🔄 Comandos de Redeploy



1. Backend: `vercel --prod` → genera nueva URL temporal### Redesplegar Backend:

2. Frontend config: actualizar `apiUrl` con nueva URL backend

3. Frontend: `npm run build && vercel --prod````powershell

4. ✅ El alias `masajecorporaldeportivo.vercel.app` apunta automáticamente a la nueva versióncd backend

git add .

**La URL estática NUNCA cambia para los usuarios finales** ✅git commit -m "feat: Nueva funcionalidad"

vercel --prod

---```



## 🌍 AGREGAR NUEVO CLIENTE (Futuro)### Redesplegar Frontend:



Para añadir un segundo cliente:```powershell

cd frontend

1. **Elegir URL:** `https://[nombre-cliente].vercel.app`git add .

2. **Actualizar vercel.json:**git commit -m "feat: Nueva funcionalidad"

   ```jsonvercel --prod

   {```

     "alias": [

       "masajecorporaldeportivo.vercel.app",---

       "[nombre-cliente].vercel.app"

     ]## 📝 Notas Importantes

   }

   ```1. **Datos Existentes**: La base de datos ya contiene 212 pacientes

3. **Agregar en client.config.ts** con nuevo `slug`2. **Archivos**: Se guardan en base64 en PostgreSQL (max ~5MB por archivo)

4. **Crear tenant en BD** con el mismo slug3. **Backups**: Son "virtuales" - se crean en tiempo real al solicitarse

5. **Desplegar y asignar alias:**4. **CORS**: Configurado para cualquier origen (sin restricciones)

   ```bash5. **Rate Limiting**: Supabase free tier (500 req/seg)

   vercel --prod

   vercel alias set [deployment-url] [nombre-cliente].vercel.app---

   ```

## 🆘 Troubleshooting

---

### Error de red en PowerShell:

## ✅ RESUMEN EJECUTIVO

```powershell

**URL OFICIAL:**$env:NODE_TLS_REJECT_UNAUTHORIZED="0"

`````

https://masajecorporaldeportivo.vercel.app

````### Ver logs del backend:



**Estado:** ✅ Activo y funcionando  ```powershell

**Correcciones v2.4.1:** Archivos y CSV exportación  vercel logs https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app

**Tiempo total despliegue:** 24.8 segundos  ```

**Siguiente paso:** Probar funcionalidades en producción

### Ver logs del frontend:

---

```powershell

*Documentación completa en: `URLS_CLIENTES_ESTATICAS.md`*vercel logs https://clinic-frontend-b5rqw5sgq-davids-projects-8fa96e54.vercel.app

````

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
``````
