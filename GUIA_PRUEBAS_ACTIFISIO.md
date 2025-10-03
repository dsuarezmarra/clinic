# 🧪 GUÍA DE PRUEBAS: ACTIFISIO EN PRODUCCIÓN

**Fecha:** 03/10/2025  
**Propósito:** Verificar que Actifisio funciona correctamente en producción

---

## 🌐 URLs DEL SISTEMA

### Frontend - Actifisio
```
https://actifisio.vercel.app
```

### Frontend - Masaje Corporal Deportivo
```
https://masajecorporaldeportivo.vercel.app
```

### Backend (Compartido)
```
https://masajecorporaldeportivo-api.vercel.app/api
```

---

## ✅ CHECKLIST DE PRUEBAS

### 1️⃣ Verificar Deployment de Actifisio (2 min)

**Pasos:**
1. Abrir: https://actifisio.vercel.app
2. Verificar que carga la aplicación
3. Verificar logo de Actifisio (naranja/amarillo)
4. Verificar colores del tema (naranja #ff6b35)

**Resultado esperado:**
- ✅ Logo de Actifisio visible
- ✅ Tema naranja/amarillo aplicado
- ✅ Título: "Actifisio"

---

### 2️⃣ Crear Paciente de Prueba en Actifisio (3 min)

**Pasos:**
1. Ir a: https://actifisio.vercel.app
2. Click en "Pacientes" → "Añadir Paciente"
3. Completar formulario:
   ```
   DNI: 12345678A
   Nombre: Juan
   Apellidos: Pérez Actifisio
   Teléfono: +34 666 111 222
   Email: juan@actifisio-test.com
   ```
4. Guardar

**Resultado esperado:**
- ✅ Paciente creado exitosamente
- ✅ Aparece en la lista de pacientes
- ✅ ID generado automáticamente

---

### 3️⃣ Crear Cita para el Paciente (2 min)

**Pasos:**
1. En Actifisio, ir a "Calendario"
2. Click en una fecha/hora
3. Seleccionar paciente: "Juan Pérez Actifisio"
4. Completar:
   ```
   Tipo: Fisioterapia
   Duración: 60 minutos
   Notas: Prueba de sistema multi-tenant
   ```
5. Guardar

**Resultado esperado:**
- ✅ Cita creada exitosamente
- ✅ Aparece en el calendario
- ✅ Color naranja (tema Actifisio)

---

### 4️⃣ Verificar Aislamiento de Datos (5 min) ⚠️ CRÍTICO

**Pasos:**
1. Abrir en otra pestaña: https://masajecorporaldeportivo.vercel.app
2. Ir a "Pacientes"
3. Buscar: "Juan Pérez Actifisio"
4. Verificar que NO aparece
5. Ir a "Calendario" 
6. Verificar que la cita de Actifisio NO aparece

**Resultado esperado:**
- ✅ Paciente "Juan Pérez Actifisio" NO visible en Masaje Corporal
- ✅ Cita de Actifisio NO visible en Masaje Corporal
- ✅ Datos completamente aislados

---

### 5️⃣ Verificar Tenant Header (Técnico - 5 min)

**Pasos:**
1. Abrir: https://actifisio.vercel.app
2. Abrir DevTools (F12)
3. Ir a "Network"
4. Hacer cualquier acción (ej: listar pacientes)
5. Buscar petición a `/api/patients`
6. Ver "Request Headers"

**Resultado esperado:**
```
X-Tenant-Slug: actifisio  ✅
```

---

### 6️⃣ Verificar Tablas en Supabase (5 min)

**Pasos:**
1. Abrir: https://supabase.com/dashboard
2. Seleccionar proyecto
3. Ir a "Table Editor"
4. Buscar tabla: `patients_actifisio`
5. Verificar datos insertados

**Consulta SQL:**
```sql
-- Ver pacientes de Actifisio
SELECT * FROM patients_actifisio;

-- Resultado esperado:
-- 1 fila con: Juan, Pérez Actifisio, 12345678A

-- Ver citas de Actifisio
SELECT * FROM appointments_actifisio;

-- Resultado esperado:
-- 1 fila con la cita creada
```

**Verificar aislamiento:**
```sql
-- Pacientes de Masaje Corporal
SELECT COUNT(*) FROM patients_masajecorporaldeportivo;

-- Pacientes de Actifisio
SELECT COUNT(*) FROM patients_actifisio;

-- Los counts deben ser diferentes ✅
```

---

### 7️⃣ Probar Foreign Keys (Opcional - 3 min)

**Pasos:**
1. En Actifisio, ir a lista de pacientes
2. Seleccionar "Juan Pérez Actifisio"
3. Click en "Eliminar"
4. Confirmar eliminación
5. Ir a "Calendario"
6. Verificar que la cita también se eliminó (CASCADE)

**Resultado esperado:**
- ✅ Paciente eliminado
- ✅ Cita eliminada automáticamente (ON DELETE CASCADE)
- ✅ No quedan datos huérfanos

---

## 🔄 PRUEBAS CRUZADAS (10 min)

### Test de Interferencia

**Objetivo:** Confirmar que modificar datos de un cliente NO afecta al otro

**Pasos:**

1. **En Actifisio:**
   - Crear paciente: "María García Actifisio"
   - Crear cita para María

2. **En Masaje Corporal:**
   - Verificar que María NO aparece
   - Crear paciente: "María García MCD"
   - Crear cita para María MCD

3. **Verificación:**
   - Actifisio: debe mostrar solo "María García Actifisio"
   - Masaje Corporal: debe mostrar solo "María García MCD"

**Resultado esperado:**
- ✅ Cada cliente ve solo sus propios datos
- ✅ Nombres idénticos no causan conflictos
- ✅ Aislamiento total confirmado

---

## 📊 PRUEBAS DE PERFORMANCE (Opcional - 5 min)

### Test de Carga

**Pasos:**
1. Crear 10 pacientes en Actifisio
2. Crear 10 citas
3. Listar pacientes
4. Verificar tiempo de carga

**Resultado esperado:**
- ✅ Lista de pacientes carga < 1 segundo
- ✅ Calendario carga < 2 segundos
- ✅ Índices funcionando correctamente

---

## 🚨 CASOS DE ERROR A PROBAR

### 1. Paciente Duplicado (DNI)

**Pasos:**
1. Crear paciente con DNI: 11111111A
2. Intentar crear otro con mismo DNI
3. Verificar error

**Resultado esperado:**
- ❌ Error: "DNI ya existe"
- ✅ No se crea el duplicado

### 2. Cita sin Paciente

**Pasos:**
1. Intentar crear cita sin seleccionar paciente
2. Verificar validación

**Resultado esperado:**
- ❌ Error: "Paciente es obligatorio"
- ✅ No se crea la cita

### 3. Foreign Key Constraint

**Pasos:**
1. Crear paciente: "Test FK"
2. Crear cita para "Test FK"
3. Eliminar paciente
4. Verificar que cita también se eliminó

**Resultado esperado:**
- ✅ CASCADE funciona correctamente
- ✅ No quedan citas huérfanas

---

## 🎯 PRUEBAS DE INTEGRACIÓN

### Flujo Completo: Nuevo Paciente → Cita → Sesión

**Pasos:**
1. Crear paciente en Actifisio
2. Crear pack de créditos (10 sesiones)
3. Crear cita
4. Marcar cita como completada
5. Verificar descuento de crédito
6. Crear factura

**Resultado esperado:**
- ✅ Pack creado: 10 créditos disponibles
- ✅ Cita completada: 9 créditos restantes
- ✅ Factura generada con datos correctos
- ✅ Todo almacenado en tablas `_actifisio`

---

## 📱 PRUEBAS PWA (Opcional - 5 min)

### Instalar como App

**Pasos:**
1. Abrir: https://actifisio.vercel.app
2. Click en "Instalar App" (navegador)
3. Verificar manifest:
   - Nombre: "Actifisio"
   - Color: Naranja (#ff6b35)
   - Logo: Actifisio

**Resultado esperado:**
- ✅ App instalable
- ✅ Manifest correcto
- ✅ Ícono de Actifisio
- ✅ Tema naranja

---

## 📋 REPORTE DE PRUEBAS

### Template de Reporte

```markdown
# Reporte de Pruebas - Actifisio
Fecha: ___________
Realizado por: ___________

## Resultados

- [ ] Deployment exitoso
- [ ] Logo y tema correcto
- [ ] Crear paciente funciona
- [ ] Crear cita funciona
- [ ] Aislamiento de datos confirmado
- [ ] Tenant header correcto
- [ ] Tablas Supabase correctas
- [ ] Foreign Keys funcionando
- [ ] Performance aceptable
- [ ] PWA instalable

## Problemas Encontrados

1. _____________________
2. _____________________

## Notas Adicionales

_____________________
```

---

## 🆘 TROUBLESHOOTING

### Problema: Datos no aparecen

**Verificar:**
1. Header `X-Tenant-Slug` en DevTools
2. Tablas en Supabase (sufijo correcto)
3. Logs del backend (Vercel Logs)

### Problema: Error 500

**Verificar:**
1. Variables de entorno en Vercel
2. Credenciales de Supabase
3. Logs de error en Vercel

### Problema: Logo no se ve

**Verificar:**
1. Archivo existe: `assets/clients/actifisio/logo.png`
2. Build incluye assets
3. Config tiene ruta correcta

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Deployment Exitoso

- ✅ Frontend accesible en https://actifisio.vercel.app
- ✅ Logo y tema correcto (naranja/amarillo)
- ✅ CRUD de pacientes funciona
- ✅ CRUD de citas funciona

### Aislamiento de Datos

- ✅ Datos de Actifisio NO visibles en Masaje Corporal
- ✅ Datos de Masaje Corporal NO visibles en Actifisio
- ✅ Tablas separadas en Supabase

### Integridad de Datos

- ✅ Foreign Keys funcionando
- ✅ CASCADE deletes correctos
- ✅ No datos huérfanos

### Performance

- ✅ Lista de pacientes < 1 seg
- ✅ Calendario < 2 seg
- ✅ Crear registros < 500ms

---

## 🎉 ESTADO FINAL

Después de completar todas las pruebas:

**Sistema Multi-Tenant:** ✅ FUNCIONANDO  
**Actifisio Production:** ✅ DESPLEGADO  
**Aislamiento de Datos:** ✅ CONFIRMADO  
**Integridad Referencial:** ✅ VERIFICADA  
**Performance:** ✅ ACEPTABLE

**Estado:** 🚀 LISTO PARA CLIENTES

---

**Tiempo total de pruebas:** ~30-40 minutos  
**Pruebas mínimas:** 1-5 (15 minutos)  
**Pruebas completas:** 1-7 + cruzadas (40 minutos)
