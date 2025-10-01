# 📋 INSTRUCCIONES: Crear Tablas Faltantes en Supabase

## ⚠️ IMPORTANTE
Actualmente faltan 2 tablas en la base de datos de Supabase:
1. **app_config** - Para configuración de la aplicación
2. **patient_files** - Para archivos adjuntos de pacientes

Sin estas tablas, las siguientes funcionalidades NO funcionarán:
- ❌ Gestión de configuración (precios, horarios)
- ❌ Subida/descarga de archivos de pacientes
- ❌ Backups completos (falta la tabla de archivos)

---

## 🔧 Pasos para Crear las Tablas

### 1. Acceder al Editor SQL de Supabase

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard
3. Inicia sesión con tu cuenta
4. Selecciona el proyecto: **skukyfkrwqsfnkbxedty**
5. En el menú lateral, haz clic en **"SQL Editor"**

### 2. Ejecutar el Script SQL

1. En el editor SQL, haz clic en **"+ New query"**
2. Copia TODO el contenido del archivo:
   ```
   backend/db/sql/create-missing-tables.sql
   ```
3. Pégalo en el editor
4. Haz clic en el botón **"Run"** (▶️)
5. Espera a ver el mensaje: **"Success. No rows returned"**

### 3. Verificar la Creación

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('app_config', 'patient_files');
```

Deberías ver:

```
table_name
-----------------
app_config
patient_files
```

---

## ✅ Qué Hace el Script

### Tabla `app_config`
- ✅ Almacena configuración global de la clínica
- ✅ Precios de sesiones y bonos
- ✅ Horarios de trabajo por día
- ✅ Duración por defecto de citas
- ✅ Inserta valores por defecto automáticamente

### Tabla `patient_files`
- ✅ Almacena archivos adjuntos de pacientes
- ✅ Soporta cualquier tipo de archivo (PDF, imágenes, etc.)
- ✅ Guarda el contenido en base64
- ✅ Elimina archivos automáticamente si se borra el paciente
- ✅ Indexada para búsquedas rápidas

### Políticas de Seguridad
- ✅ Activa RLS (Row Level Security)
- ✅ Permite acceso completo al backend (service_role)
- ✅ Bloquea acceso directo desde frontend (seguridad)

---

## 🧪 Probar que Funciona

Después de ejecutar el script, prueba los endpoints:

### 1. Test de Configuración

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/config"
```

**Resultado esperado**:
```json
{
  "id": 1,
  "businessName": "Clínica Masaje Corporal Deportivo",
  "appointmentDuration": 30,
  "workingHours": { ... },
  "prices": { ... }
}
```

### 2. Test de Archivos de Paciente

```powershell
# Listar archivos del paciente con ID = 964cc3eb-2c03-4252-9770-7adcaebb2c25
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/patients/964cc3eb-2c03-4252-9770-7adcaebb2c25/files"
```

**Resultado esperado**:
```json
[]
```
(Vacío porque aún no se han subido archivos)

### 3. Test de Stats Completas

```powershell
Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/backup/stats"
```

**Resultado esperado**:
```json
{
  "patients": 212,
  "appointments": ...,
  "creditPacks": ...,
  "redemptions": ...,
  "files": 0
}
```

---

## 🆘 Troubleshooting

### Error: "relation app_config does not exist"
- ✅ **Solución**: Ejecuta el script SQL completo en Supabase

### Error: "permission denied for table app_config"
- ✅ **Solución**: El script ya crea las políticas RLS correctas
- Si persiste, verifica que estés usando `SUPABASE_SERVICE_KEY` (no `SUPABASE_ANON_KEY`)

### Error: "Could not find the table in schema cache"
- ✅ **Solución**: Espera 30 segundos después de crear las tablas (cache de Supabase)
- O fuerza el refresh: reinicia las funciones en Vercel

---

## 📝 Archivo SQL

El archivo completo está en:
```
clinic/backend/db/sql/create-missing-tables.sql
```

---

## ⏭️ Siguiente Paso

Una vez ejecutado el script y verificado que funciona:

1. ✅ Todas las funcionalidades estarán operativas
2. ✅ Podrás gestionar precios y horarios desde la app
3. ✅ Podrás subir archivos a los expedientes de pacientes
4. ✅ Los backups incluirán los archivos

**¡La aplicación estará 100% funcional!** 🎉
