# Corrección CSV Export - Header X-Tenant-Slug

**Fecha:** 3 de octubre de 2025  
**Versión:** v2.4.3  
**Estado:** ✅ RESUELTO

---

## 🐛 Problema

La exportación CSV fallaba con **400 Bad Request** desde la interfaz web, aunque funcionaba correctamente con `curl`.

### Síntomas:

```
GET https://masajecorporaldeportivo-api.vercel.app/api/reports/billing?year=2025&month=10&groupBy=appointment 400 (Bad Request)
Error: Error generando CSV
```

### Logs del navegador:

- ✅ Todas las llamadas a `/api/appointments/all` funcionaban correctamente
- ❌ Las llamadas a `/api/reports/billing` fallaban con 400
- ✅ El interceptor añadía `X-Tenant-Slug` a las peticiones HTTP de Angular
- ❌ La exportación CSV usaba `fetch()` directo sin pasar por el interceptor

---

## 🔍 Diagnóstico

### Root Cause:

El método `exportMonthCsv()` en `calendar.component.ts` usaba `fetch()` nativo de JavaScript en lugar del `HttpClient` de Angular, por lo que **no pasaba por el `TenantInterceptor`** y no enviaba el header `X-Tenant-Slug` requerido por el backend multi-tenant.

### Código problemático:

```typescript
const resp = await fetch(url, {
  headers: {
    Accept: "text/csv",
  },
});
```

### Por qué fallaba:

1. Backend multi-tenant requiere header `X-Tenant-Slug` en TODAS las peticiones
2. El interceptor Angular solo se aplica a peticiones con `HttpClient`
3. `fetch()` nativo no pasa por interceptores
4. Backend recibía petición sin tenant → Error 400

---

## ✅ Solución

### Código corregido en `calendar.component.ts`:

```typescript
const resp = await fetch(url, {
  headers: {
    Accept: "text/csv",
    "X-Tenant-Slug": APP_CONFIG.clientId, // ← AÑADIDO
  },
});
```

### Alternativa (mejor práctica para futuro):

Usar `HttpClient` de Angular para aprovechar interceptores:

```typescript
this.http
  .get(`${APP_CONFIG.apiUrl}/reports/billing`, {
    params: { year, month, groupBy },
    responseType: "blob",
    observe: "response",
  })
  .subscribe((response) => {
    // Descargar CSV
  });
```

---

## 🚀 Despliegue

### Backend v2.4.2:

```bash
cd backend
rm -rf .vercel node_modules
npm install
vercel --prod --force --yes
vercel alias set clinic-backend-93qoe8eev-davids-projects-8fa96e54.vercel.app masajecorporaldeportivo-api.vercel.app
```

**URL producción:** https://clinic-backend-93qoe8eev-davids-projects-8fa96e54.vercel.app  
**Alias permanente:** https://masajecorporaldeportivo-api.vercel.app

### Frontend v2.4.3:

```bash
cd frontend
rm -rf dist .angular .vercel
npm run build
vercel --prod --force --yes
vercel alias set clinic-frontend-dbsii7mc3-davids-projects-8fa96e54.vercel.app masajecorporaldeportivo.vercel.app
```

**URL producción:** https://clinic-frontend-dbsii7mc3-davids-projects-8fa96e54.vercel.app  
**Alias permanente:** https://masajecorporaldeportivo.vercel.app

---

## ✅ Verificación

### Test con curl (backend):

```bash
curl -k -H "X-Tenant-Slug: masajecorporaldeportivo" \
  "https://masajecorporaldeportivo-api.vercel.app/api/reports/billing?year=2025&month=10&groupBy=appointment"
```

**Resultado esperado:** CSV con datos de citas

```csv
Fecha;Hora;Paciente;DNI;Duración (min);Tipo;Estado Pago;Precio (€)
3/10/2025;07:00;pruebas pruebas;53504988O;60;Bono 1x60min;Pagado;49.60
```

### Test desde interfaz web:

1. Abrir https://masajecorporaldeportivo.vercel.app/agenda
2. Click en "Exportar CSV"
3. ✅ CSV se descarga correctamente sin error 400

---

## 📌 Nota sobre modo incógnito

Después del despliegue, el modo incógnito puede mostrar **404 NOT_FOUND** temporalmente debido a la propagación DNS/CDN de Vercel. Esto se resuelve automáticamente en **2-5 minutos**.

### Solución temporal:

- Usar URL directa de deployment mientras se propaga
- Esperar y recargar con Ctrl+F5
- El navegador normal funciona inmediatamente por caché DNS

---

## 🎯 Resumen

| Aspecto            | Antes                 | Después                       |
| ------------------ | --------------------- | ----------------------------- |
| **Petición CSV**   | `fetch()` sin headers | `fetch()` con `X-Tenant-Slug` |
| **Estado HTTP**    | 400 Bad Request       | 200 OK                        |
| **Funcionamiento** | ❌ Fallo              | ✅ Correcto                   |
| **Versión**        | v2.4.2                | v2.4.3                        |

---

## 📚 Lecciones aprendidas

1. **Siempre usar HttpClient** en Angular para aprovechar interceptores automáticos
2. **Si usas fetch() nativo**, añade manualmente todos los headers requeridos
3. **Headers multi-tenant** son obligatorios en TODAS las peticiones al backend
4. **Vercel CDN tarda 2-5 minutos** en propagar aliases nuevos globalmente

---

## 🔗 Enlaces relacionados

- [CORRECCION_CSV_FINAL_V2.4.2.md](./CORRECCION_CSV_FINAL_V2.4.2.md) - Primera corrección SELECT
- [URLS_PERMANENTES_SOLUCION_FINAL.md](./URLS_PERMANENTES_SOLUCION_FINAL.md) - Sistema de URLs permanentes
- [DEPLOYMENT_MULTI_TENANT_FINAL.md](./DEPLOYMENT_MULTI_TENANT_FINAL.md) - Arquitectura multi-tenant

---

✅ **PROBLEMA COMPLETAMENTE RESUELTO** - Sistema en producción funcionando correctamente
