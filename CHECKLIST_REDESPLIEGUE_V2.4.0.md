# 🚀 CHECKLIST DE REDESPLIEGUE V2.4.0

## ✅ PRE-VERIFICACIÓN COMPLETADA

- [x] Tabla `tenants` existe
- [x] Registro `masajecorporaldeportivo` existe y está activo
- [x] RLS configurado con políticas para service_role
- [x] Permisos de service_role verificados
- [x] Todas las tablas con sufijo `_masajecorporaldeportivo` existen

## 🎯 PASOS PARA REDESPLIEGUE

### PASO 1: Ejecutar Prueba Final en Supabase

Ejecuta el archivo `backend/PRUEBA_FINAL_ANTES_DEPLOY.sql` en Supabase SQL Editor.

**Verifica que devuelva:**
- ✅ 1 fila del tenant masajecorporaldeportivo
- ✅ Políticas RLS activas
- ✅ service_role con permisos DELETE, INSERT, SELECT, UPDATE
- ✅ 10 tablas con sufijo _masajecorporaldeportivo

### PASO 2: Verificar Variables de Entorno en Vercel

1. Ve a: https://vercel.com/davids-projects-8fa96e54/clinic-backend
2. **Settings** → **Environment Variables**
3. Verifica:
   ```
   SUPABASE_URL = https://_____.supabase.co
   SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **MUY IMPORTANTE**: 
- Debe ser `SUPABASE_SERVICE_KEY` (service_role)
- NO debe ser `SUPABASE_ANON_KEY`

Para verificar:
1. Ve a Supabase → **Project Settings** → **API**
2. Compara el valor en Vercel con **service_role (secret)**
3. Si no coincide, actualízalo en Vercel

### PASO 3: Redesplegar Backend

```bash
cd backend
vercel --prod
```

**Espera a que termine** y anota la URL del deployment.

### PASO 4: Actualizar URL del Backend en Frontend (si cambió)

Si la URL del backend cambió:

```bash
# Edita: frontend/src/app/config/client.config.ts
# Línea 47: apiUrl: 'https://nueva-url.vercel.app/api'
```

### PASO 5: Redesplegar Frontend

```bash
cd frontend
npm run build
vercel --prod --yes
```

**Espera a que termine** y anota la URL del deployment.

### PASO 6: Verificar Deployment

1. **Backend**: Abre la URL y verifica que `/api/version` responda
   ```
   https://tu-backend.vercel.app/api/version
   ```
   Debe devolver: `{ version: "2.4.0", ... }`

2. **Frontend**: Abre la aplicación
   ```
   https://tu-frontend.vercel.app
   ```

## 🧪 PRUEBAS POST-DEPLOYMENT

### 1. Verificar Calendario
- [ ] Abre el calendario
- [ ] Se muestran las citas existentes
- [ ] NO hay errores 500 en la consola

### 2. Verificar Detalle de Paciente
- [ ] Abre un paciente (ej: pruebas pruebas)
- [ ] Se carga la información correctamente
- [ ] Se muestran las citas del paciente
- [ ] **CRÍTICO**: Los archivos del paciente se cargan (GET /api/files/patient/:id) ✅

### 3. Probar Subida de Archivo
- [ ] En el detalle del paciente
- [ ] Sube un archivo de prueba
- [ ] Verifica que se sube correctamente (POST /api/files/patient/:id) ✅
- [ ] El archivo aparece en la lista

### 4. Verificar Configuración → Precios
- [ ] Ve a Configuración → Precios
- [ ] Se cargan los precios actuales (GET /api/meta/config/prices) ✅
- [ ] Modifica un precio
- [ ] Guarda los cambios (PUT /api/meta/config/prices) ✅
- [ ] Verifica que se guardó correctamente

### 5. Probar Exportación CSV
- [ ] Ve al Calendario
- [ ] Haz clic en "Exportar CSV" del mes actual
- [ ] Se descarga el archivo CSV correctamente ✅

### 6. Verificar Backups (si usas la funcionalidad)
- [ ] Ve a Configuración → Backups
- [ ] Se carga la lista de backups (GET /api/backup/list) ✅
- [ ] Se muestran las estadísticas (GET /api/backup/stats) ✅

### 7. Crear Nueva Cita
- [ ] Crea una nueva cita para el paciente de prueba
- [ ] Verifica que se crea correctamente
- [ ] Verifica que consume créditos del pack correcto
- [ ] La cita aparece en el calendario

## ✅ CONFIRMACIÓN FINAL

Si TODAS las pruebas pasan:
- ✅ **DEPLOYMENT EXITOSO**
- ✅ Sistema multi-tenant funcionando correctamente
- ✅ Migración completada
- ✅ Versión 2.4.0 en producción

## ❌ SI ALGO FALLA

1. **Abrir consola del navegador** (F12)
2. **Ir a Network** → Filtrar por "500"
3. **Click en la request que falló**
4. **Copiar el response completo**
5. **Compartir conmigo para diagnosticar**

También:
- Ver logs del backend en Vercel
- Buscar mensajes de error específicos
- Verificar que el header X-Tenant-Slug se está enviando

---

## 📊 URLS FINALES

Después del deployment, actualiza aquí:

- **Backend**: `https://_____.vercel.app`
- **Frontend**: `https://_____.vercel.app`
- **Estado**: ✅ / ❌

---

**¡Ejecuta PASO 1 primero para confirmar que todo está listo, luego procede con el redespliegue!** 🚀
