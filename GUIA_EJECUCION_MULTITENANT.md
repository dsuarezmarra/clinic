# 🚀 Guía de Ejecución - Sistema Multi-Cliente

## 📋 Resumen

Esta guía te llevará paso a paso para convertir la aplicación actual en un sistema multi-cliente con bases de datos independientes mediante tablas con sufijo por cliente.

---

## ⚠️ IMPORTANTE: Hacer Backup ANTES de empezar

1. Ve a Supabase → Tu Proyecto → Database
2. En el menú lateral, haz clic en "Backups"
3. Crea un backup manual con descripción: "Antes de implementar multi-tenant"
4. Espera a que complete el backup
5. ✅ Continúa solo después de confirmar que el backup existe

---

## 📝 FASE 1: Crear Tabla TENANTS

### 1.1. Abrir Supabase SQL Editor

1. Ve a https://supabase.com
2. Selecciona tu proyecto
3. En el menú lateral → **SQL Editor**
4. Clic en **"New query"**

### 1.2. Ejecutar Script

1. Abre el archivo: `backend/sql/01-create-tenants-table.sql`
2. **Copia TODO el contenido** del archivo
3. **Pega** en el SQL Editor de Supabase
4. Clic en **"Run"** (o presiona Ctrl/Cmd + Enter)

### 1.3. Verificar Resultado

Deberías ver en los resultados:

```
✅ Tabla tenants creada correctamente
```

Y al final, una tabla con 1 fila mostrando:

- **slug**: masajecorporaldeportivo
- **name**: Masaje Corporal Deportivo
- **table_suffix**: masajecorporaldeportivo
- **email**: masajecorporaldeportivo@gmail.com
- **phone**: +34 604943230

### 1.4. En caso de error

Si ves algún error:

1. **NO continúes**
2. Copia el mensaje de error completo
3. Compártelo conmigo para revisar

---

## 📝 FASE 2: Renombrar Tablas Existentes

### 2.1. Nueva Query en SQL Editor

1. En Supabase SQL Editor → Clic en **"New query"**

### 2.2. Ejecutar Script

1. Abre el archivo: `backend/sql/02-rename-existing-tables.sql`
2. **Copia TODO el contenido**
3. **Pega** en el SQL Editor
4. Clic en **"Run"**

### 2.3. Verificar Resultado

El script ejecutará varios pasos y al final mostrará:

**Tabla de conteo de registros:**
| table_name | count |
|------------|-------|
| patients_masajecorporaldeportivo | X |
| appointments_masajecorporaldeportivo | X |
| credit_packs_masajecorporaldeportivo | X |
| ... | ... |

✅ **Verifica que los números coincidan con tus datos actuales**

### 2.4. Verificar en Table Editor

1. Ve a **Table Editor** en Supabase
2. Deberías ver las nuevas tablas:

   - `patients_masajecorporaldeportivo`
   - `appointments_masajecorporaldeportivo`
   - `credit_packs_masajecorporaldeportivo`
   - `credit_redemptions_masajecorporaldeportivo`
   - `configurations_masajecorporaldeportivo`
   - `backups_masajecorporaldeportivo`
   - `tenants` (nueva)

3. Las tablas originales sin sufijo (`patients`, `appointments`, etc.) **ya no deberían existir**

### 2.5. En caso de error

Si algo falla:

1. **NO entres en pánico** - tienes el backup
2. Copia el error completo
3. Compártelo conmigo
4. Podemos restaurar desde el backup si es necesario

---

## 🎯 Estado Actual Después de FASE 1 y 2

✅ Tabla `tenants` creada con cliente principal  
✅ Tablas existentes renombradas con sufijo `_masajecorporaldeportivo`  
✅ Datos preservados intactos  
✅ Foreign keys, índices y RLS actualizados automáticamente

---

## ⏭️ PRÓXIMO PASO

Una vez completadas las FASES 1 y 2 exitosamente:

**Confirma que todo funcionó correctamente y procederemos con:**

### FASE 3: Modificar Backend

- Crear middleware de detección de tenant
- Actualizar todas las consultas para usar tablas dinámicas
- Agregar endpoint para obtener configuración de tenant

### FASE 4: Modificar Frontend

- Crear TenantService
- Crear TenantInterceptor
- Detección automática desde URL
- Aplicación de estilos dinámicos

---

## 📞 Soporte

Si en cualquier momento:

- Ves un error que no entiendes
- No estás seguro de un paso
- Algo no parece correcto

**¡Detente y pregunta!** Es mejor asegurarse que arriesgar los datos.

---

## ✅ Checklist de Verificación

Marca cada paso conforme lo completes:

- [ ] Backup creado en Supabase
- [ ] Fase 1: Script 01 ejecutado sin errores
- [ ] Verificado: Tabla tenants existe con 1 registro
- [ ] Fase 2: Script 02 ejecutado sin errores
- [ ] Verificado: Tablas renombradas visibles en Table Editor
- [ ] Verificado: Conteo de registros correcto
- [ ] Verificado: Tablas originales sin sufijo ya no existen
- [ ] Listo para FASE 3 (modificar backend)

---

**Una vez completado todo, confirma y continuaremos con el backend** 🚀
