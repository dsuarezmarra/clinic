# URLs Permanentes - Solución Final

**Fecha**: 3 de octubre de 2025  
**Estado**: ✅ CONFIGURADO PERMANENTEMENTE

---

## 🎯 Problema Resuelto

Cada vez que Vercel desplegaba una nueva versión, generaba URLs diferentes tanto para frontend como backend, lo que rompía la conexión entre ambos.

## ✅ Solución Implementada: Aliases Permanentes

Ahora tanto el **frontend** como el **backend** tienen **URLs permanentes** mediante aliases de Vercel que **NUNCA CAMBIARÁN**, independientemente de cuántas veces se despliegue.

---

## 🌐 URLs Permanentes (NUNCA CAMBIAR)

### Frontend (Cliente)

```
https://masajecorporaldeportivo.vercel.app
```

- ✅ Esta es la URL que usarán los usuarios
- ✅ Nunca cambiará
- ✅ Configurada en `frontend/vercel.json`

### Backend (API)

```
https://masajecorporaldeportivo-api.vercel.app/api
```

- ✅ Esta es la URL que usa el frontend internamente
- ✅ Nunca cambiará
- ✅ Configurada en `backend/vercel.json`
- ✅ Configurada en `frontend/src/app/config/client.config.ts`

---

## 📋 Configuración en Archivos

### 1. Backend: `backend/vercel.json`

```json
{
  "version": 2,
  "name": "clinic-backend",
  "alias": ["masajecorporaldeportivo-api.vercel.app"],
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

### 2. Frontend: `frontend/vercel.json`

```json
{
  "version": 2,
  "name": "clinic-frontend",
  "alias": ["masajecorporaldeportivo.vercel.app"],
  "buildCommand": "npm run build",
  "outputDirectory": "dist/clinic-frontend/browser",
  "framework": "angular"
}
```

### 3. Frontend Config: `frontend/src/app/config/client.config.ts`

```typescript
{
  masajecorporaldeportivo: {
    tenantSlug: 'masajecorporaldeportivo',
    appName: 'Masaje Corporal Deportivo',
    apiUrl: 'https://masajecorporaldeportivo-api.vercel.app/api',
    // ... otros campos
  }
}
```

---

## 🔄 Proceso de Despliegue (Futuro)

### Cuando despliegues en el futuro:

#### Backend

```bash
cd backend
vercel --prod
# Vercel automáticamente asignará el alias masajecorporaldeportivo-api.vercel.app
# al nuevo deployment gracias al vercel.json
```

#### Frontend

```bash
cd frontend
npm run build
vercel --prod --yes
# Vercel automáticamente asignará el alias masajecorporaldeportivo.vercel.app
# al nuevo deployment gracias al vercel.json
```

**IMPORTANTE**: Ya NO necesitas ejecutar `vercel alias set` manualmente cada vez. Vercel lo hace automáticamente basándose en el campo `"alias"` en `vercel.json`.

---

## ✅ Beneficios

1. **URLs Permanentes**: Los usuarios siempre acceden por `https://masajecorporaldeportivo.vercel.app`
2. **Sin Breaking Changes**: Puedes desplegar cuantas veces quieras sin romper nada
3. **Configuración Automática**: Los aliases se asignan automáticamente en cada deployment
4. **Conexión Estable**: Frontend siempre apunta a `masajecorporaldeportivo-api.vercel.app` que nunca cambia

---

## 🧪 Verificación

### Probar Frontend

```bash
# Acceder a la URL permanente del cliente
https://masajecorporaldeportivo.vercel.app
```

### Probar Backend (API)

```bash
# Probar endpoint de billing
curl -H "X-Tenant-Slug: masajecorporaldeportivo" \
  "https://masajecorporaldeportivo-api.vercel.app/api/reports/billing?year=2025&month=10&groupBy=appointment"
```

**Resultado esperado**: CSV con datos de las citas del mes

---

## 📊 Sistema Multi-Tenant

### URLs por Cliente (Futuro)

Cuando agregues nuevos clientes, seguirás el mismo patrón:

| Cliente             | Frontend URL                         | Backend URL                              |
| ------------------- | ------------------------------------ | ---------------------------------------- |
| Masaje Corporal     | `masajecorporaldeportivo.vercel.app` | `masajecorporaldeportivo-api.vercel.app` |
| Cliente 2 (ejemplo) | `cliente2.vercel.app`                | `cliente2-api.vercel.app`                |
| Cliente 3 (ejemplo) | `cliente3.vercel.app`                | `cliente3-api.vercel.app`                |

**Cada cliente tendrá**:

- Su propia URL permanente de frontend
- Su propia URL permanente de backend API
- Su propio tenant slug en la base de datos
- Sus propias tablas con sufijo en Supabase

---

## 🎯 Próximos Pasos

1. ✅ Accede a https://masajecorporaldeportivo.vercel.app/agenda
2. ✅ Prueba exportar CSV (debería funcionar sin errores 400)
3. ✅ Verifica que todos los endpoints funcionan correctamente
4. ✅ Confirma que archivos se suben correctamente

Si todo funciona, el sistema está **100% operativo** y listo para producción.

---

## 🔗 Enlaces Útiles

- **Frontend Dashboard**: https://vercel.com/davids-projects-8fa96e54/clinic-frontend
- **Backend Dashboard**: https://vercel.com/davids-projects-8fa96e54/clinic-backend
- **Supabase Dashboard**: https://supabase.com/dashboard/project/nnfxzgvplvavgdfmgrrb

---

**Estado**: ✅ URLs PERMANENTES CONFIGURADAS  
**Frontend**: https://masajecorporaldeportivo.vercel.app  
**Backend API**: https://masajecorporaldeportivo-api.vercel.app/api  
**Última actualización**: 3 octubre 2025, 13:30
