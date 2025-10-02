# 🔧 Corrección del Sistema de Backups

## 🐛 **Problema Identificado**

Los backups no se guardaban realmente en ningún lugar persistente:

- Al crear un backup, solo se generaban datos temporales
- No aparecían en "Vista Fecha" porque no existían realmente
- El sistema solo mostraba datos "virtuales" o simulados

## ✅ **Solución Implementada**

Se ha creado una **tabla `backups` en Supabase** para almacenar los backups de forma persistente.

---

## 📋 **Pasos para Aplicar la Corrección**

### **1. Crear la Tabla en Supabase**

1. **Ir a Supabase Dashboard:**

   ```
   https://supabase.com/dashboard/project/nnfxzgvplvavgdfmgrrb
   ```

2. **Ir a SQL Editor:**

   - Menú lateral → "SQL Editor"
   - Click en "New query"

3. **Copiar y ejecutar el SQL:**

   - Abrir el archivo: `backend/create-backups-table.sql`
   - Copiar todo el contenido
   - Pegar en el editor SQL de Supabase
   - Click en "Run" o presionar `Ctrl+Enter`

4. **Verificar que se creó:**
   - Ir a "Table Editor"
   - Debe aparecer la tabla `backups`
   - Debe tener las columnas: `id`, `file_name`, `data`, `size_bytes`, `created`

---

### **2. Desplegar el Backend Actualizado**

```powershell
cd C:\Users\dsuarez1\git\clinic\backend
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
vercel --prod
```

---

### **3. Verificar que Funciona**

1. **Abrir la aplicación:**

   ```
   https://masajecorporaldeportivo.vercel.app
   ```

2. **Ir a Configuración → Backup**

3. **Crear un nuevo backup:**

   - Click en "Crear Backup"
   - Debe mostrar mensaje de éxito
   - Debe aparecer en la lista

4. **Verificar en ambas vistas:**

   - **Vista Fecha:** Debe mostrar el backup agrupado por fecha
   - **Vista Lista:** Debe mostrar el backup en la lista

5. **Verificar en Supabase:**
   - Ir a Table Editor → `backups`
   - Debe aparecer el registro del backup creado

---

## 🔍 **Cambios Realizados en el Backend**

### **Endpoints Actualizados:**

#### **GET /api/backup/list**

- **Antes:** Devolvía datos simulados
- **Ahora:** Lee los backups desde la tabla `backups`

#### **GET /api/backup/grouped**

- **Antes:** Devolvía datos simulados agrupados
- **Ahora:** Lee y agrupa los backups reales por fecha

#### **POST /api/backup/create**

- **Antes:** Solo creaba un objeto JSON temporal
- **Ahora:**
  1. Exporta todos los datos (pacientes, citas, bonos, etc.)
  2. Calcula el tamaño del backup
  3. Guarda en la tabla `backups` con toda la información

#### **GET /api/backup/stats**

- **Antes:** Devolvía estadísticas de las tablas de datos
- **Ahora:** Devuelve estadísticas de los backups:
  - Total de backups
  - Tamaño total
  - Último backup
  - Backup más antiguo

#### **GET /api/backup/download/:fileName**

- **Antes:** Creaba un backup en tiempo real
- **Ahora:** Descarga el backup guardado desde la base de datos

#### **DELETE /api/backup/delete/:fileName**

- **Antes:** No hacía nada (devolvía éxito falso)
- **Ahora:** Elimina el backup de la tabla `backups`

---

## 📊 **Estructura de la Tabla `backups`**

```sql
CREATE TABLE backups (
    id              BIGSERIAL PRIMARY KEY,
    file_name       TEXT NOT NULL UNIQUE,
    data            JSONB NOT NULL,
    size_bytes      BIGINT DEFAULT 0,
    created         TIMESTAMPTZ DEFAULT NOW()
);
```

### **Columnas:**

- **id:** ID único autoincremental
- **file_name:** Nombre del archivo (ej: `backup_2025-10-02T12-30-45.json`)
- **data:** Datos del backup en formato JSON (pacientes, citas, bonos, etc.)
- **size_bytes:** Tamaño del backup en bytes
- **created:** Fecha y hora de creación

---

## 🎯 **Funcionalidades Corregidas**

### ✅ **Crear Backup**

- Ahora guarda el backup en la base de datos
- Calcula y guarda el tamaño correcto
- Incluye todos los datos: pacientes, citas, bonos, redenciones, archivos

### ✅ **Vista Lista**

- Muestra todos los backups guardados
- Ordenados por fecha (más reciente primero)
- Muestra tamaño correcto

### ✅ **Vista Fecha**

- Agrupa los backups por fecha
- Muestra todos los backups del mismo día juntos
- Formato: `2025-10-02` → backups de ese día

### ✅ **Descargar Backup**

- Descarga el backup completo en formato JSON
- Contiene todos los datos para restauración

### ✅ **Eliminar Backup**

- Elimina el backup de la base de datos
- Libera espacio

### ✅ **Estadísticas**

- Muestra número total de backups
- Tamaño total ocupado
- Fecha del último backup
- Fecha del backup más antiguo

---

## 🧪 **Pruebas a Realizar**

### **1. Crear Backup**

- [ ] Click en "Crear Backup"
- [ ] Debe mostrar mensaje: "Backup creado exitosamente"
- [ ] Debe aparecer inmediatamente en la lista

### **2. Vista Fecha**

- [ ] Click en botón "Vista Lista" para cambiar a "Vista Fecha"
- [ ] Debe mostrar los backups agrupados por fecha
- [ ] Debe mostrar la fecha en formato legible

### **3. Vista Lista**

- [ ] Click en botón "Vista Fecha" para cambiar a "Vista Lista"
- [ ] Debe mostrar todos los backups en lista
- [ ] Debe mostrar: nombre, fecha, hora, tamaño

### **4. Descargar Backup**

- [ ] Click en botón de descarga de un backup
- [ ] Debe descargar archivo JSON
- [ ] El archivo debe contener todos los datos

### **5. Eliminar Backup**

- [ ] Click en botón de eliminar
- [ ] Debe pedir confirmación
- [ ] Debe eliminarse de ambas vistas

### **6. Estadísticas**

- [ ] Verificar que muestra el número correcto de backups
- [ ] Verificar que muestra el tamaño total
- [ ] Verificar que muestra la fecha del último backup

---

## 📝 **Notas Importantes**

### **Tamaño de Backups:**

- Cada backup incluye **todos** los datos de la clínica
- El tamaño depende de cuántos pacientes, citas, bonos, etc. tengas
- Backup típico: 10KB - 1MB (depende del volumen de datos)

### **Límites de Supabase:**

- **Plan gratuito:** 500 MB de base de datos
- Si tienes muchos backups, puede ocupar espacio
- **Recomendación:** Mantener solo los últimos 10-20 backups
- Eliminar backups antiguos periódicamente

### **Rendimiento:**

- La creación de backup puede tardar 2-5 segundos
- Depende de la cantidad de datos a exportar
- Es normal ver el spinner durante este tiempo

---

## 🐛 **Si Algo No Funciona**

### **Error: "Error al crear el backup"**

1. Verificar que la tabla `backups` existe en Supabase
2. Verificar que tiene RLS habilitado con política permisiva
3. Ver logs en Vercel: `vercel logs`

### **No aparecen backups antiguos**

- Es normal si acabas de crear la tabla
- Solo aparecerán los backups creados **después** de aplicar esta corrección
- Los backups "virtuales" anteriores no existían realmente

### **Error: "404 Not Found" al descargar**

- Verificar que el backend está desplegado con los cambios
- Verificar que el backup existe en la tabla `backups`

---

## ✅ **Checklist de Implementación**

- [ ] Ejecutar SQL en Supabase (crear tabla `backups`)
- [ ] Verificar que la tabla existe
- [ ] Desplegar backend actualizado
- [ ] Probar crear backup
- [ ] Verificar que aparece en Vista Lista
- [ ] Verificar que aparece en Vista Fecha
- [ ] Probar descargar backup
- [ ] Probar eliminar backup
- [ ] Verificar estadísticas

---

**¿Todo funcionando?** ¡Backups corregidos! 🎉
