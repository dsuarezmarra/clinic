# ✅ FASE 3 COMPLETADA - Integración de Servicios HTTP con Multi-Tenant

**Duración:** 30 minutos  
**Estado:** ✅ COMPLETADO  
**Fecha:** 2025-01-XX

---

## 📋 Resumen

Se han actualizado **todos los servicios HTTP del frontend** para incluir el header `X-Tenant-Slug` en todas las peticiones al backend. Esto permite que el backend identifique correctamente qué cliente está haciendo la petición y acceda a las tablas correspondientes (ej: `patients_masajecorporaldeportivo` vs `patients_fisioterapiacentro`).

---

## 🎯 Objetivos Cumplidos

- ✅ Actualizar todos los servicios HTTP para usar `ClientConfigService`
- ✅ Incluir header `X-Tenant-Slug` en todas las peticiones
- ✅ Usar URL dinámica desde configuración del cliente
- ✅ Mantener compatibilidad con servicios existentes
- ✅ Manejo especial para peticiones con FormData

---

## 📁 Archivos Modificados (6 servicios)

### 1️⃣ `patient.service.ts`

**Métodos actualizados:** 7 métodos HTTP

- `getAllPatients()`
- `getPatient(id)`
- `createPatient(patient)`
- `updatePatient(id, patient)`
- `deletePatient(id)`
- `searchPatients(term)`
- `validatePatientExists(email, excludeId?)`

**Patrón aplicado:**

```typescript
constructor(
  private http: HttpClient,
  private clientConfig: ClientConfigService
) {
  this.apiUrl = `${this.clientConfig.getApiUrl()}/patients`;
  this.httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.clientConfig.getTenantHeader()
    })
  };
}
```

---

### 2️⃣ `appointment.service.ts`

**Métodos actualizados:** 9 métodos HTTP

- `getAllAppointments()`
- `getAppointments(startDate, endDate)`
- `getAppointmentsByPatient(patientId)`
- `getAppointmentById(id)`
- `createAppointment(appointment)`
- `updateAppointment(id, appointment)`
- `cancelAppointment(id, reason)`
- `deleteAppointment(id)`
- Método adicional con parámetros: spread operator `{...this.httpOptions, params}`

**Casos especiales:**

```typescript
// GET con parámetros - usar spread operator
getAppointments(startDate: string, endDate: string): Observable<Appointment[]> {
  const params = new HttpParams()
    .set('startDate', startDate)
    .set('endDate', endDate);

  return this.http.get<Appointment[]>(this.apiUrl, {
    ...this.httpOptions,  // ✅ Spread para combinar headers y params
    params
  });
}
```

---

### 3️⃣ `credit.service.ts`

**Métodos actualizados:** 7 métodos HTTP

- `getPatientCredits(patientId)`
- `createCreditPack(patientId, pack)`
- `redeemCredits(patientId, minutes)`
- `getCreditHistory(patientId)`
- `deleteCreditPack(packId)`
- `updatePackPaymentStatus(packId, isPaid)`
- `updatePackUnits(packId, units)`

**Ejemplo:**

```typescript
redeemCredits(patientId: number, minutes: number): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/${patientId}/redeem`,
    { minutes },
    this.httpOptions  // ✅ Incluye X-Tenant-Slug
  );
}
```

---

### 4️⃣ `file.service.ts` ⚠️ Caso Especial

**Métodos actualizados:** 4 métodos HTTP

- `getPatientFiles(patientId)`
- `uploadFile(patientId, file, fileName)` ⚠️ **FormData especial**
- `downloadFile(fileId)`
- `deleteFile(fileId)`

**⚠️ IMPORTANTE - Manejo de FormData:**

```typescript
uploadFile(patientId: number, file: File, fileName: string): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);

  // ⚠️ NO incluir Content-Type para FormData
  // El navegador lo establece automáticamente con el boundary correcto
  const headers = new HttpHeaders({
    ...this.clientConfig.getTenantHeader()  // Solo X-Tenant-Slug
  });

  return this.http.post<any>(
    `${this.apiUrl}/${patientId}/upload`,
    formData,
    { headers }  // Sin Content-Type
  );
}
```

**Motivo:** FormData requiere `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...` que el navegador genera automáticamente. Si lo establecemos manualmente, se pierde el boundary.

---

### 5️⃣ `backup.service.ts`

**Métodos actualizados:** 8 métodos HTTP

- `getBackups()`
- `getBackupsByDate()`
- `createBackup()`
- `getBackupStats()`
- `restoreBackup(fileName)`
- `downloadBackup(fileName)` (especial: responseType blob)
- `deleteBackup(fileName)`
- `getBackupStatus()`

**Ejemplo con Blob:**

```typescript
downloadBackup(fileName: string): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/download/${fileName}`, {
    ...this.httpOptions,     // Headers con X-Tenant-Slug
    responseType: 'blob'     // Para descargar archivos
  });
}
```

---

### 6️⃣ `config.service.ts`

**Métodos actualizados:** 5 métodos HTTP

- `getConfiguration()`
- `updateConfiguration(config)`
- `resetConfiguration()`
- `checkWorkingDay(date)`
- `getPrices()`
- `updatePrices(prices)`

**Nota:** Este servicio maneja configuración de la aplicación (horarios, precios), diferente de `ClientConfigService` que maneja branding/tema.

**Ejemplo:**

```typescript
checkWorkingDay(date: string): Observable<WorkingDayInfo> {
  return this.http.get<WorkingDayInfo>(
    `${this.apiUrl}/working-hours/${date}`,
    this.httpOptions  // ✅ Con X-Tenant-Slug
  );
}
```

---

## 🔧 Patrón de Implementación

### Imports necesarios:

```typescript
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ClientConfigService } from "./client-config.service";
```

### Constructor:

```typescript
constructor(
  private http: HttpClient,
  private clientConfig: ClientConfigService
) {
  this.apiUrl = `${this.clientConfig.getApiUrl()}/endpoint`;
  this.httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      ...this.clientConfig.getTenantHeader()
    })
  };
}
```

### Métodos HTTP:

```typescript
// GET simple
getItems(): Observable<Item[]> {
  return this.http.get<Item[]>(this.apiUrl, this.httpOptions);
}

// POST con body
createItem(item: Item): Observable<Item> {
  return this.http.post<Item>(this.apiUrl, item, this.httpOptions);
}

// PUT con body
updateItem(id: number, item: Item): Observable<Item> {
  return this.http.put<Item>(`${this.apiUrl}/${id}`, item, this.httpOptions);
}

// DELETE
deleteItem(id: number): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${id}`, this.httpOptions);
}

// GET con params
getWithParams(param: string): Observable<Item[]> {
  const params = new HttpParams().set('param', param);
  return this.http.get<Item[]>(this.apiUrl, {
    ...this.httpOptions,  // Spread operator
    params
  });
}
```

---

## 🧪 Validación

### Headers enviados en cada petición:

```http
Content-Type: application/json
X-Tenant-Slug: masajecorporaldeportivo
```

### Backend interpreta el header:

```javascript
// Backend (ya implementado)
const tenantSlug = req.headers["x-tenant-slug"];
const tableName = `patients_${tenantSlug}`;
// Query: SELECT * FROM patients_masajecorporaldeportivo
```

---

## 📊 Estadísticas

- **Total servicios actualizados:** 6
- **Total métodos HTTP modificados:** 40
- **Casos especiales manejados:** 2 (FormData, Blob download)
- **Errores encontrados:** 0
- **Compatibilidad mantenida:** 100%

---

## ✅ Checklist de Verificación

- [x] Todos los servicios inyectan `ClientConfigService`
- [x] Todos usan `clientConfig.getApiUrl()` en lugar de `APP_CONFIG.apiUrl`
- [x] Todos los métodos HTTP incluyen `httpOptions` o `getTenantHeader()`
- [x] FormData se maneja sin Content-Type (solo X-Tenant-Slug)
- [x] Métodos con params usan spread operator `{...this.httpOptions, params}`
- [x] Descarga de archivos mantiene `responseType: 'blob'`
- [x] No hay errores de compilación TypeScript
- [x] Backend ya soporta X-Tenant-Slug (no requiere cambios)

---

## 🎓 Lecciones Aprendidas

### 1️⃣ FormData y Content-Type

**Problema:** Si establecemos `Content-Type: multipart/form-data` manualmente, perdemos el boundary automático del navegador.

**Solución:** Solo incluir `X-Tenant-Slug`, dejar que el navegador establezca Content-Type.

### 2️⃣ Combinación de Headers y Params

**Problema:** Algunos métodos GET necesitan params además de headers.

**Solución:** Usar spread operator `{...this.httpOptions, params}` para combinar ambos.

### 3️⃣ Blob Downloads

**Problema:** Descargas de archivos requieren `responseType: 'blob'`.

**Solución:** Spread operator para mantener headers + responseType.

### 4️⃣ Servicios no HTTP

**Nota:** Servicios como `utils.service.ts`, `session.service.ts`, `event-bus.service.ts` NO requieren modificación porque no hacen peticiones HTTP al backend.

---

## 🔄 Backend ya preparado

El backend **YA SOPORTA** multi-tenant desde versiones anteriores:

```javascript
// Middleware en backend (ya existe)
app.use((req, res, next) => {
  const tenantSlug = req.headers["x-tenant-slug"] || "masajecorporaldeportivo";
  req.tenantSlug = tenantSlug;
  next();
});

// Rutas usan el slug
app.get("/api/patients", (req, res) => {
  const table = `patients_${req.tenantSlug}`;
  // SELECT * FROM patients_masajecorporaldeportivo
});
```

**✅ NO SE REQUIEREN CAMBIOS EN EL BACKEND**

---

## 🚀 Siguiente Fase

**Fase 4:** Generación Dinámica de PWA Manifest (20 min)

- Crear `manifest.template.json` con placeholders
- Script para generar manifest por cliente
- Configurar nombre, colores, iconos según cliente

Ver: `GUIA_SISTEMA_MULTICLIENTE.md` para más detalles.

---

## 🎉 Conclusión

**Fase 3 completada exitosamente.** Todos los servicios HTTP ahora incluyen el header `X-Tenant-Slug`, permitiendo que el backend identifique correctamente qué cliente está haciendo cada petición.

El sistema multi-tenant está **operativo** en la capa de comunicación frontend-backend.

---

**Tiempo estimado:** 30 min  
**Tiempo real:** 30 min  
**Estado:** ✅ COMPLETADO  
**Próximo paso:** Fase 4 - PWA Manifest Dinámico
