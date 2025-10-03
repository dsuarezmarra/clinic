# 🔍 AUDITORÍA DE PROYECTOS VERCEL

**Fecha:** 03/10/2025  
**Problema:** Tenemos 4 proyectos cuando deberíamos tener 3 (2 frontends + 1 backend)

---

## 📊 PROYECTOS ACTUALES EN VERCEL

### ✅ PROYECTOS NECESARIOS (3)

#### 1. **actifisio-app** ✅ MANTENER
- **URL:** https://actifisio-app.vercel.app
- **Alias:** actifisio.vercel.app
- **Propósito:** Frontend de Actifisio
- **Estado:** Recién creado (8 minutos)
- **Node:** 22.x
- **Acción:** ✅ MANTENER

#### 2. **clinic-frontend** ⚠️ VERIFICAR
- **URL:** https://clinic-frontend-roan.vercel.app
- **Propósito:** Frontend de Masaje Corporal Deportivo
- **Estado:** Actualizado hace 25 minutos
- **Node:** 22.x
- **Alias configurado:** masajecorporaldeportivo.vercel.app (¿?)
- **Acción:** ⚠️ VERIFICAR si tiene alias correcto

#### 3. **clinic-backend** ✅ MANTENER (Backend API)
- **URL:** https://clinic-backend-nu.vercel.app
- **Alias:** masajecorporaldeportivo-api.vercel.app
- **Propósito:** Backend API (compartido por ambos clientes)
- **Estado:** Actualizado hace 9 horas
- **Node:** 22.x
- **Acción:** ✅ MANTENER

---

### ❌ PROYECTOS INNECESARIOS (1)

#### 4. **clinic** ❌ ELIMINAR
- **URL:** https://clinic-iota-nine.vercel.app
- **Estado:** Actualizado hace 7 horas
- **Node:** 22.x
- **Propósito:** ⚠️ DESCONOCIDO - Parece un proyecto antiguo/duplicado
- **Problema:** No tiene alias asignado, no sabemos qué cliente es
- **Acción:** ❌ ELIMINAR (después de verificar)

---

## 🎯 ARQUITECTURA CORRECTA

```
VERCEL PROJECTS:

Frontend Clients (2):
├── actifisio-app
│   └── actifisio.vercel.app
│
└── clinic-frontend
    └── masajecorporaldeportivo.vercel.app

Backend (1):
└── clinic-backend
    └── masajecorporaldeportivo-api.vercel.app

Total: 3 proyectos
```

---

## 🔍 VERIFICACIÓN NECESARIA

### 1. Verificar Alias de clinic-frontend

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
vercel alias ls clinic-frontend
```

**Esperado:**
- Debe tener alias: `masajecorporaldeportivo.vercel.app`
- Si NO lo tiene, configurarlo

### 2. Verificar qué es "clinic"

```powershell
vercel inspect clinic-iota-nine.vercel.app
```

**Preguntas:**
- ¿Qué deployment es?
- ¿Tiene alias?
- ¿Es usado por algún cliente?
- ¿Podemos eliminarlo?

### 3. Verificar Alias del Backend

```powershell
vercel alias ls clinic-backend
```

**Esperado:**
- Debe tener alias: `masajecorporaldeportivo-api.vercel.app`

---

## 📝 PLAN DE ACCIÓN

### Paso 1: Verificar clinic-frontend
- ✅ Confirmar que tiene alias correcto
- ✅ Si no lo tiene, configurar alias
- ✅ Probar: https://masajecorporaldeportivo.vercel.app

### Paso 2: Investigar "clinic"
- ⚠️ Ver qué es este proyecto
- ⚠️ Ver si tiene deployments activos
- ⚠️ Ver si alguien lo está usando

### Paso 3: Eliminar "clinic" (si es innecesario)
```powershell
vercel remove clinic --yes
```

### Paso 4: Verificar estado final
```powershell
vercel project ls
```

**Esperado: 3 proyectos**
- actifisio-app
- clinic-frontend  
- clinic-backend

---

## ⚠️ ADVERTENCIAS

### NO ELIMINAR SIN VERIFICAR
1. Verificar alias ANTES de eliminar
2. Comprobar que "clinic" no está en uso
3. Asegurar que masajecorporaldeportivo.vercel.app funciona

### ORDEN DE ELIMINACIÓN
1. Primero: Verificar clinic-frontend tiene alias
2. Segundo: Confirmar "clinic" es redundante
3. Tercero: Eliminar "clinic"
4. Cuarto: Verificar todo funciona

---

## 🧪 COMANDOS DE VERIFICACIÓN

```powershell
# 1. Ver todos los alias configurados
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
vercel alias ls

# 2. Ver alias específico de clinic-frontend
vercel alias ls clinic-frontend

# 3. Ver alias específico de clinic
vercel alias ls clinic

# 4. Inspeccionar proyecto "clinic"
vercel inspect clinic-iota-nine.vercel.app

# 5. Ver deployments de "clinic"
vercel ls clinic
```

---

## 💡 HIPÓTESIS

### Posible Escenario
1. **clinic** = Proyecto antiguo/inicial (antes de renombrar)
2. **clinic-frontend** = Proyecto renombrado (actual Masaje Corporal)
3. **clinic-backend** = Backend API (correcto)
4. **actifisio-app** = Nuevo cliente (correcto)

### Resultado Esperado
- Eliminar "clinic" (antiguo)
- Mantener clinic-frontend, clinic-backend, actifisio-app

---

## 📊 ESTADO ACTUAL

- **Total proyectos:** 4
- **Proyectos necesarios:** 3
- **Proyectos a eliminar:** 1 (clinic)
- **Acción requerida:** Verificación + Limpieza

---

**Próximos pasos:**
1. Ejecutar comandos de verificación
2. Confirmar alias de clinic-frontend
3. Eliminar proyecto "clinic" si es redundante
4. Documentar arquitectura final
