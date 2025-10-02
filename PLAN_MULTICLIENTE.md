# 🏢 Plan de Implementación Sistema Multi-Cliente

## 📋 Objetivo

Adaptar la aplicación "Masaje Corporal Deportivo" para que pueda ser utilizada por múltiples clientes diferentes, cada uno con su propia URL independiente, branding personalizado y datos aislados.

---

## 🎯 Requisitos Clave

### 1. **URLs Independientes por Cliente**

- Cada cliente tendrá su propia URL tipo: `https://clinica-[nombre].vercel.app`
- Detección automática del tenant por URL/dominio
- Sin necesidad de login o selección manual de cliente

### 2. **Personalización Visual por Cliente**

- Logo personalizado
- Colores de marca (primario, secundario)
- Nombre de la clínica/negocio
- Información de contacto

### 3. **Aislamiento de Datos**

- Cada cliente solo ve sus propios pacientes
- Cada cliente solo ve sus propias citas
- Cada cliente solo ve sus propios packs de crédito
- Sistema PWA independiente por cliente

### 4. **Sin Autenticación**

- Mantener la simplicidad actual (sin login)
- Seguridad por oscuridad de URL
- Opcional: protección básica con PIN/código de acceso

---

## 🏗️ Arquitectura Propuesta

### **Opción Recomendada: Multi-Deployment con Configuración**

```
┌─────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                │
│  (Base de datos compartida con tenant_id)          │
│                                                     │
│  Tables:                                            │
│  - tenants (id, name, config)                      │
│  - patients (id, tenant_id, ...)                   │
│  - appointments (id, tenant_id, ...)               │
│  - credit_packs (id, tenant_id, ...)               │
│  - credit_redemptions (id, tenant_id, ...)         │
│  - configurations (id, tenant_id, ...)             │
└─────────────────────────────────────────────────────┘
                        ▲
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────┴────────┐              ┌───────┴────────┐
│   Backend API  │              │   Backend API  │
│  (Compartido)  │              │  (Compartido)  │
│                │              │                │
│  Detecta tenant│              │  Detecta tenant│
│  por headers   │              │  por headers   │
└───────┬────────┘              └───────┬────────┘
        │                               │
        │                               │
┌───────┴────────┐              ┌───────┴────────┐
│  Frontend App  │              │  Frontend App  │
│  Cliente A     │              │  Cliente B     │
│                │              │                │
│  URL: clinica- │              │  URL: clinica- │
│  juan.vercel.  │              │  maria.vercel. │
│  app           │              │  app           │
│                │              │                │
│  Config:       │              │  Config:       │
│  - Logo: A.png │              │  - Logo: B.png │
│  - Color: blue │              │  - Color: red  │
└────────────────┘              └────────────────┘
```

---

## 📝 Plan de Implementación

### **FASE 1: Preparar Base de Datos** ✅ (Ya está lista - Supabase)

**Estado**: ✅ Completado (ya tenemos Supabase configurado)

### **FASE 2: Crear Tabla de Tenants y Migrar Esquema**

#### 2.1. Crear tabla `tenants`

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'masaje-corporal-deportivo', 'clinica-juan', etc.
  name TEXT NOT NULL, -- 'Masaje Corporal Deportivo', 'Clínica Juan', etc.
  config JSONB DEFAULT '{}', -- Configuración personalizada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por slug
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Insertar tenant por defecto (actual)
INSERT INTO tenants (slug, name, config) VALUES (
  'masaje-corporal-deportivo',
  'Masaje Corporal Deportivo',
  '{
    "logo": "https://masajecorporaldeportivo.vercel.app/assets/logo.png",
    "primaryColor": "#4F46E5",
    "secondaryColor": "#10B981",
    "contactEmail": "info@masajecorporaldeportivo.com",
    "contactPhone": "+34 XXX XXX XXX"
  }'::jsonb
);
```

#### 2.2. Agregar `tenant_id` a tablas existentes

```sql
-- Agregar columna tenant_id a todas las tablas
ALTER TABLE patients ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE appointments ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE credit_packs ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE credit_redemptions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE configurations ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE backups ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Actualizar datos existentes con el tenant por defecto
UPDATE patients SET tenant_id = (SELECT id FROM tenants WHERE slug = 'masaje-corporal-deportivo');
UPDATE appointments SET tenant_id = (SELECT id FROM tenants WHERE slug = 'masaje-corporal-deportivo');
UPDATE credit_packs SET tenant_id = (SELECT id FROM tenants WHERE slug = 'masaje-corporal-deportivo');
UPDATE credit_redemptions SET tenant_id = (SELECT id FROM tenants WHERE slug = 'masaje-corporal-deportivo');
UPDATE configurations SET tenant_id = (SELECT id FROM tenants WHERE slug = 'masaje-corporal-deportivo');
UPDATE backups SET tenant_id = (SELECT id FROM tenants WHERE slug = 'masaje-corporal-deportivo');

-- Hacer tenant_id obligatorio
ALTER TABLE patients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE credit_packs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE credit_redemptions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE configurations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE backups ALTER COLUMN tenant_id SET NOT NULL;

-- Crear índices para filtrado rápido
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_credit_packs_tenant ON credit_packs(tenant_id);
CREATE INDEX idx_credit_redemptions_tenant ON credit_redemptions(tenant_id);
CREATE INDEX idx_configurations_tenant ON configurations(tenant_id);
CREATE INDEX idx_backups_tenant ON backups(tenant_id);
```

#### 2.3. Crear RLS (Row Level Security) policies

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir todo al service_role (backend)
CREATE POLICY "Service role has full access to tenants" ON tenants
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to patients" ON patients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to credit_packs" ON credit_packs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to credit_redemptions" ON credit_redemptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to configurations" ON configurations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to backups" ON backups
  FOR ALL USING (auth.role() = 'service_role');
```

### **FASE 3: Modificar Backend para Soportar Multi-Tenant**

#### 3.1. Crear middleware de detección de tenant

**Archivo**: `backend/src/middleware/tenant.js`

```javascript
// Middleware para detectar tenant desde headers
function detectTenant(req, res, next) {
  // Opción 1: desde header X-Tenant-Slug (enviado por frontend)
  const tenantSlug = req.headers["x-tenant-slug"];

  if (!tenantSlug) {
    return res.status(400).json({
      error: "Tenant no especificado. Header X-Tenant-Slug requerido.",
    });
  }

  // Guardar en req para uso posterior
  req.tenantSlug = tenantSlug;
  next();
}

module.exports = { detectTenant };
```

#### 3.2. Modificar todas las consultas para filtrar por tenant

**Archivo**: `backend/src/routes/bridge.js`

Cambiar TODAS las consultas de:

```javascript
// ❌ ANTES (sin filtrado)
const { data, error } = await supabaseFetch("patients?select=*");
```

A:

```javascript
// ✅ DESPUÉS (con filtrado por tenant)
// 1. Primero obtener tenant_id
const { data: tenant } = await supabaseFetch(
  `tenants?select=id&slug=eq.${req.tenantSlug}&limit=1`
);
if (!tenant || tenant.length === 0) {
  return res.status(404).json({ error: "Tenant no encontrado" });
}
const tenantId = tenant[0].id;

// 2. Filtrar por tenant_id
const { data, error } = await supabaseFetch(
  `patients?select=*&tenant_id=eq.${tenantId}`
);
```

#### 3.3. Crear endpoint para obtener configuración de tenant

```javascript
// GET /api/tenants/:slug - Obtener configuración de un tenant
router.get("/tenants/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: tenant, error } = await supabaseFetch(
      `tenants?select=*&slug=eq.${slug}&limit=1`
    );

    if (error || !tenant || tenant.length === 0) {
      return res.status(404).json({ error: "Tenant no encontrado" });
    }

    res.json(tenant[0]);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({ error: error.message });
  }
});
```

### **FASE 4: Modificar Frontend para Soportar Multi-Tenant**

#### 4.1. Crear servicio de tenant

**Archivo**: `frontend/src/app/services/tenant.service.ts`

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { APP_CONFIG } from "../config/app.config";

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  config: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class TenantService {
  private tenantSubject = new BehaviorSubject<TenantConfig | null>(null);
  public tenant$ = this.tenantSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Detectar tenant desde URL
  detectTenantSlug(): string {
    // Extraer slug desde URL
    // Ej: https://clinica-juan.vercel.app -> 'clinica-juan'
    //     https://masajecorporaldeportivo.vercel.app -> 'masaje-corporal-deportivo'

    const hostname = window.location.hostname;

    // Si es localhost, usar slug por defecto
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "masaje-corporal-deportivo";
    }

    // Extraer slug desde hostname
    // clinica-juan.vercel.app -> clinica-juan
    const slug = hostname.split(".")[0];
    return slug;
  }

  // Cargar configuración del tenant
  loadTenantConfig(): Observable<TenantConfig> {
    const slug = this.detectTenantSlug();

    return this.http
      .get<TenantConfig>(`${APP_CONFIG.apiUrl}/tenants/${slug}`)
      .pipe(
        tap((tenant) => {
          this.tenantSubject.next(tenant);
          this.applyTenantStyles(tenant);
        })
      );
  }

  // Obtener tenant actual
  getCurrentTenant(): TenantConfig | null {
    return this.tenantSubject.value;
  }

  // Obtener tenant slug actual
  getCurrentTenantSlug(): string {
    return this.getCurrentTenant()?.slug || this.detectTenantSlug();
  }

  // Aplicar estilos personalizados del tenant
  private applyTenantStyles(tenant: TenantConfig) {
    const root = document.documentElement;

    if (tenant.config.primaryColor) {
      root.style.setProperty("--primary-color", tenant.config.primaryColor);
    }

    if (tenant.config.secondaryColor) {
      root.style.setProperty("--secondary-color", tenant.config.secondaryColor);
    }

    // Actualizar título de la página
    document.title = tenant.name;

    // Actualizar favicon si está disponible
    if (tenant.config.logo) {
      const favicon = document.querySelector(
        "link[rel*='icon']"
      ) as HTMLLinkElement;
      if (favicon) {
        favicon.href = tenant.config.logo;
      }
    }
  }
}
```

#### 4.2. Modificar HttpInterceptor para agregar tenant header

**Archivo**: `frontend/src/app/interceptors/tenant.interceptor.ts`

```typescript
import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { TenantService } from "../services/tenant.service";

@Injectable()
export class TenantInterceptor implements HttpInterceptor {
  constructor(private tenantService: TenantService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const tenantSlug = this.tenantService.getCurrentTenantSlug();

    // Agregar header X-Tenant-Slug a todas las peticiones
    const clonedReq = req.clone({
      setHeaders: {
        "X-Tenant-Slug": tenantSlug,
      },
    });

    return next.handle(clonedReq);
  }
}
```

#### 4.3. Registrar interceptor en app.config.ts

```typescript
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { TenantInterceptor } from "./interceptors/tenant.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantInterceptor,
      multi: true,
    },
  ],
};
```

#### 4.4. Inicializar tenant en app.component.ts

```typescript
export class AppComponent implements OnInit {
  constructor(private tenantService: TenantService) {}

  ngOnInit() {
    // Cargar configuración del tenant al inicio
    this.tenantService.loadTenantConfig().subscribe({
      next: (tenant) => {
        console.log("✅ Tenant cargado:", tenant.name);
      },
      error: (err) => {
        console.error("❌ Error cargando tenant:", err);
        // Redirigir a página de error o mostrar mensaje
      },
    });
  }
}
```

### **FASE 5: Script de Despliegue Multi-Cliente**

#### 5.1. Crear script de configuración por cliente

**Archivo**: `scripts/create-tenant.sh`

```bash
#!/bin/bash

# Script para crear un nuevo tenant y desplegarlo

echo "🏢 Creando nuevo tenant..."
read -p "Slug del tenant (ej: clinica-juan): " TENANT_SLUG
read -p "Nombre del tenant (ej: Clínica Juan): " TENANT_NAME
read -p "URL del logo (opcional): " LOGO_URL
read -p "Color primario (ej: #4F46E5): " PRIMARY_COLOR
read -p "Color secundario (ej: #10B981): " SECONDARY_COLOR

# 1. Insertar tenant en base de datos
echo "📝 Insertando tenant en Supabase..."
# (Ejecutar INSERT via API o psql)

# 2. Desplegar frontend con configuración del tenant
echo "🚀 Desplegando frontend..."
cd frontend
vercel --prod --name "$TENANT_SLUG"

# 3. Crear alias
echo "🔗 Creando alias..."
vercel alias set "$TENANT_SLUG-xyz.vercel.app" "$TENANT_SLUG.vercel.app"

echo "✅ Tenant '$TENANT_NAME' creado exitosamente!"
echo "🌐 URL: https://$TENANT_SLUG.vercel.app"
```

### **FASE 6: Testing y Validación**

#### 6.1. Crear tenant de prueba

```sql
INSERT INTO tenants (slug, name, config) VALUES (
  'clinica-prueba',
  'Clínica Prueba',
  '{
    "logo": "https://via.placeholder.com/150",
    "primaryColor": "#FF6B6B",
    "secondaryColor": "#4ECDC4",
    "contactEmail": "test@clinica-prueba.com",
    "contactPhone": "+34 600 000 000"
  }'::jsonb
);
```

#### 6.2. Checklist de validación

- [ ] Desplegar frontend con slug 'clinica-prueba'
- [ ] Verificar que logo y colores se aplican correctamente
- [ ] Crear paciente y verificar que tiene tenant_id correcto
- [ ] Crear cita y verificar aislamiento de datos
- [ ] Acceder desde tenant original y verificar que no ve datos del nuevo tenant
- [ ] Probar PWA independiente para cada tenant

---

## 📊 Resumen de Cambios

### Base de Datos

- ✅ Nueva tabla `tenants`
- ✅ Campo `tenant_id` en todas las tablas
- ✅ RLS policies para seguridad
- ✅ Índices para performance

### Backend

- 🔧 Middleware de detección de tenant
- 🔧 Filtrado por tenant en todas las consultas
- 🔧 Endpoint `/api/tenants/:slug`
- 🔧 Modificación de ~30 endpoints

### Frontend

- 🔧 TenantService para gestión de tenant
- 🔧 TenantInterceptor para agregar headers
- 🔧 Detección automática desde URL
- 🔧 Aplicación de estilos dinámicos
- 🔧 PWA independiente por tenant

### DevOps

- 🔧 Script de creación de tenants
- 🔧 Proceso de despliegue multi-cliente
- 🔧 Configuración de aliases en Vercel

---

## 🎯 Próximos Pasos

1. **Ejecutar migraciones de base de datos** (FASE 2)
2. **Modificar backend** (FASE 3)
3. **Modificar frontend** (FASE 4)
4. **Crear script de despliegue** (FASE 5)
5. **Testing con tenant de prueba** (FASE 6)

---

## ⚠️ Consideraciones

### Ventajas

✅ Aislamiento completo de datos
✅ URLs independientes por cliente
✅ Personalización visual completa
✅ Escalable a muchos clientes
✅ Mantiene simplicidad (sin login)

### Desventajas

⚠️ Requiere desplegar frontend por cada cliente
⚠️ Gestión de múltiples deployments
⚠️ Mayor complejidad en actualizaciones

### Alternativa Simple (No recomendada)

- Usar subdominios con query params (?tenant=xxx)
- Menos seguro, más fácil de confundir
- No recomendado para producción
