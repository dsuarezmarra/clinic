# 🏢 GUÍA COMPLETA: Sistema Multi-Cliente Escalable

**Fecha**: 3 de octubre de 2025  
**Versión**: v2.5.0  
**Objetivo**: Convertir la aplicación en solución multi-cliente con aislamiento de código y configuración

---

## 📋 ÍNDICE

1. [Arquitectura Propuesta](#arquitectura-propuesta)
2. [Configuración por Cliente](#configuración-por-cliente)
3. [Plan de Implementación](#plan-de-implementación)
4. [Despliegue Multi-Cliente](#despliegue-multi-cliente)
5. [Mantenimiento y Escalabilidad](#mantenimiento-y-escalabilidad)

---

## 🏗️ ARQUITECTURA PROPUESTA

### Estado Actual (✅ Ya Implementado)

```
Backend Multi-Tenant:
  - Header: X-Tenant-Slug (ej: "masajecorporaldeportivo")
  - Tablas con sufijo: patients_masajecorporaldeportivo
  - Middleware: loadTenant en /routes/bridge.js
  - Base de datos: Única instancia de Supabase

Frontend:
  - Monolítico (un solo deploy para todos)
  - Configuración hardcodeada en código
```

### Arquitectura Objetivo (🎯 A Implementar)

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA                          │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Compartido)                                   │
│  ├── Vercel Serverless                                      │
│  ├── Multi-tenant con X-Tenant-Slug                         │
│  └── Una instancia para todos los clientes                  │
│                                                              │
│  Frontend (Múltiples Instancias)                            │
│  ├── Cliente 1: masajecorporaldeportivo.vercel.app          │
│  │   └── Config: client-configs/masajecorporaldeportivo.ts  │
│  ├── Cliente 2: fisioterapia-centro.vercel.app              │
│  │   └── Config: client-configs/fisioterapia-centro.ts      │
│  └── Cliente N: nuevo-cliente.vercel.app                    │
│      └── Config: client-configs/nuevo-cliente.ts            │
│                                                              │
│  Base de Datos (Supabase)                                   │
│  ├── Tablas compartidas: provinces, municipalities          │
│  └── Tablas por cliente:                                    │
│      ├── patients_masajecorporaldeportivo                   │
│      ├── appointments_masajecorporaldeportivo               │
│      ├── patients_fisioterapiacentro                        │
│      └── appointments_fisioterapiacentro                    │
└─────────────────────────────────────────────────────────────┘
```

### Ventajas de Esta Arquitectura

✅ **Backend Compartido**:

- Un solo código base para mantener
- Actualizaciones se aplican a todos los clientes
- Reducción de costes de hosting (1 backend vs N backends)

✅ **Frontend Aislado**:

- Cada cliente tiene su URL única
- Personalización visual sin afectar a otros
- Rollbacks independientes si hay problemas

✅ **Base de Datos Única**:

- Backups centralizados
- Costes optimizados (1 instancia Supabase)
- Tablas compartidas (provincias, municipios)

---

## ⚙️ CONFIGURACIÓN POR CLIENTE

### 1. Estructura de Carpetas (Nueva)

```
clinic/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   │   └── clients/
│   │   │       ├── masajecorporaldeportivo/
│   │   │       │   ├── logo.png
│   │   │       │   └── theme.scss
│   │   │       └── fisioterapia-centro/
│   │   │           ├── logo.png
│   │   │           └── theme.scss
│   │   ├── config/
│   │   │   ├── client-config.interface.ts  (✨ NUEVO)
│   │   │   ├── clients/
│   │   │   │   ├── masajecorporaldeportivo.config.ts  (✨ NUEVO)
│   │   │   │   └── fisioterapia-centro.config.ts      (✨ NUEVO)
│   │   │   └── config.loader.ts  (✨ NUEVO)
│   │   └── environments/
│   │       └── environment.ts
│   └── angular.json
└── backend/
    └── (sin cambios - ya es multi-tenant)
```

### 2. Interfaz de Configuración del Cliente

**Archivo**: `frontend/src/config/client-config.interface.ts`

```typescript
export interface ClientTheme {
  primary: string; // Color primario (ej: #667eea azul, #ff6b35 naranja)
  secondary: string; // Color secundario (ej: #764ba2 morado, #f7b731 amarillo)
  accent: string; // Color de acento
  headerGradient: string; // Gradiente del header
  buttonColor: string; // Color de botones principales
  buttonHover: string; // Color hover de botones
}

export interface ClientInfo {
  name: string; // Nombre de la clínica
  shortName: string; // Nombre corto (para título)
  phone: string; // Teléfono de contacto
  email: string; // Email de contacto
  address: string; // Dirección física
  city: string; // Ciudad
  postalCode: string; // Código postal
  province: string; // Provincia
  website?: string; // Sitio web (opcional)
  socialMedia?: {
    // Redes sociales (opcional)
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface ClientConfig {
  // Identificador único (slug para backend)
  tenantSlug: string;

  // Información de la clínica
  info: ClientInfo;

  // Tema visual
  theme: ClientTheme;

  // Rutas de assets
  assets: {
    logo: string; // Ruta al logo (ej: 'assets/clients/masaje/logo.png')
    favicon: string; // Ruta al favicon
    appleTouchIcon: string; // Icono para iOS
  };

  // Configuración de backend
  backend: {
    apiUrl: string; // URL del backend (compartido)
  };

  // Configuración de PWA
  pwa: {
    name: string; // Nombre completo de la PWA
    shortName: string; // Nombre corto (max 12 caracteres)
    description: string; // Descripción de la app
    themeColor: string; // Color del tema (para Android)
    backgroundColor: string; // Color de fondo de splash
  };
}
```

### 3. Configuración del Cliente 1 (Masaje Corporal Deportivo)

**Archivo**: `frontend/src/config/clients/masajecorporaldeportivo.config.ts`

```typescript
import { ClientConfig } from "../client-config.interface";

export const masajecorporaldeportivoConfig: ClientConfig = {
  tenantSlug: "masajecorporaldeportivo",

  info: {
    name: "Masaje Corporal Deportivo",
    shortName: "MCD",
    phone: "+34 XXX XXX XXX",
    email: "info@masajecorporaldeportivo.com",
    address: "Calle Ejemplo, 123",
    city: "Madrid",
    postalCode: "28001",
    province: "Madrid",
    website: "https://masajecorporaldeportivo.com",
    socialMedia: {
      facebook: "https://facebook.com/masajecorporaldeportivo",
      instagram: "https://instagram.com/masajecorporaldeportivo",
    },
  },

  theme: {
    primary: "#667eea", // Azul
    secondary: "#764ba2", // Morado
    accent: "#48c774", // Verde
    headerGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    buttonColor: "#667eea",
    buttonHover: "#5a6fd8",
  },

  assets: {
    logo: "assets/clients/masajecorporaldeportivo/logo.png",
    favicon: "assets/clients/masajecorporaldeportivo/favicon.ico",
    appleTouchIcon:
      "assets/clients/masajecorporaldeportivo/apple-touch-icon.png",
  },

  backend: {
    apiUrl:
      "https://clinic-backend-hckptdnx1-davids-projects-8fa96e54.vercel.app/api",
  },

  pwa: {
    name: "Masaje Corporal Deportivo",
    shortName: "MCD",
    description: "Gestión de citas y pacientes para Masaje Corporal Deportivo",
    themeColor: "#667eea",
    backgroundColor: "#ffffff",
  },
};
```

### 4. Configuración del Cliente 2 (Fisioterapia Centro)

**Archivo**: `frontend/src/config/clients/fisioterapia-centro.config.ts`

```typescript
import { ClientConfig } from "../client-config.interface";

export const fisioterapiacentroConfig: ClientConfig = {
  tenantSlug: "fisioterapiacentro",

  info: {
    name: "Fisioterapia Centro",
    shortName: "FisioCentro",
    phone: "+34 YYY YYY YYY",
    email: "contacto@fisioterapiacentro.com",
    address: "Avenida Principal, 456",
    city: "Barcelona",
    postalCode: "08001",
    province: "Barcelona",
    website: "https://fisioterapiacentro.com",
    socialMedia: {
      instagram: "https://instagram.com/fisioterapiacentro",
    },
  },

  theme: {
    primary: "#ff6b35", // Naranja
    secondary: "#f7b731", // Amarillo
    accent: "#5f27cd", // Morado oscuro
    headerGradient: "linear-gradient(135deg, #ff6b35 0%, #f7b731 100%)",
    buttonColor: "#ff6b35",
    buttonHover: "#e55a2b",
  },

  assets: {
    logo: "assets/clients/fisioterapia-centro/logo.png",
    favicon: "assets/clients/fisioterapia-centro/favicon.ico",
    appleTouchIcon: "assets/clients/fisioterapia-centro/apple-touch-icon.png",
  },

  backend: {
    apiUrl:
      "https://clinic-backend-hckptdnx1-davids-projects-8fa96e54.vercel.app/api",
  },

  pwa: {
    name: "Fisioterapia Centro",
    shortName: "FisioCentro",
    description: "Sistema de gestión para Fisioterapia Centro",
    themeColor: "#ff6b35",
    backgroundColor: "#ffffff",
  },
};
```

### 5. Cargador de Configuración

**Archivo**: `frontend/src/config/config.loader.ts`

```typescript
import { ClientConfig } from "./client-config.interface";
import { masajecorporaldeportivoConfig } from "./clients/masajecorporaldeportivo.config";
import { fisioterapiacentroConfig } from "./clients/fisioterapia-centro.config";

// Mapa de configuraciones disponibles
const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  masajecorporaldeportivo: masajecorporaldeportivoConfig,
  fisioterapiacentro: fisioterapiacentroConfig,
  // Agregar nuevos clientes aquí
};

/**
 * Carga la configuración del cliente basado en variable de entorno
 * En tiempo de build: VITE_CLIENT_ID
 * En runtime (fallback): detectar por URL
 */
export function loadClientConfig(): ClientConfig {
  // Opción 1: Variable de entorno (definida en Vercel)
  const clientId = import.meta.env.VITE_CLIENT_ID;

  if (clientId && CLIENT_CONFIGS[clientId]) {
    console.log(`✅ Configuración cargada para cliente: ${clientId}`);
    return CLIENT_CONFIGS[clientId];
  }

  // Opción 2: Fallback a masajecorporaldeportivo (cliente por defecto)
  console.warn(
    "⚠️ No se encontró VITE_CLIENT_ID, usando configuración por defecto"
  );
  return masajecorporaldeportivoConfig;
}

// Exportar configuración actual
export const APP_CONFIG = loadClientConfig();
```

### 6. Servicio de Configuración Angular

**Archivo**: `frontend/src/app/services/config.service.ts` (✨ NUEVO)

```typescript
import { Injectable } from "@angular/core";
import { APP_CONFIG } from "../../config/config.loader";
import { ClientConfig } from "../../config/client-config.interface";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  private config: ClientConfig = APP_CONFIG;

  getConfig(): ClientConfig {
    return this.config;
  }

  getTenantSlug(): string {
    return this.config.tenantSlug;
  }

  getApiUrl(): string {
    return this.config.backend.apiUrl;
  }

  getTheme() {
    return this.config.theme;
  }

  getClientInfo() {
    return this.config.info;
  }

  getAssets() {
    return this.config.assets;
  }

  getPwaConfig() {
    return this.config.pwa;
  }

  /**
   * Aplica los colores del tema al documento
   */
  applyTheme(): void {
    const theme = this.config.theme;
    const root = document.documentElement;

    root.style.setProperty("--primary-color", theme.primary);
    root.style.setProperty("--secondary-color", theme.secondary);
    root.style.setProperty("--accent-color", theme.accent);
    root.style.setProperty("--header-gradient", theme.headerGradient);
    root.style.setProperty("--button-color", theme.buttonColor);
    root.style.setProperty("--button-hover", theme.buttonHover);
  }
}
```

---

## 🎨 TEMAS VISUALES DINÁMICOS

### 1. Variables CSS Globales

**Archivo**: `frontend/src/styles.scss` (modificar)

```scss
/* Variables CSS dinámicas - se inyectan desde ConfigService */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #48c774;
  --header-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --button-color: #667eea;
  --button-hover: #5a6fd8;
}

/* Bootstrap CSS */
@import "bootstrap/dist/css/bootstrap.min.css";
@import "bootstrap-icons/font/bootstrap-icons.css";

/* Reset global styles */
*,
*::before,
*::after {
  content: none !important;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Roboto, "Helvetica Neue", sans-serif;
  background: #ffffff;
}

/* Clinic custom styles - USANDO VARIABLES CSS */
.clinic-header {
  background: var(--header-gradient);
  color: white;
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.clinic-brand {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: white;
}

.clinic-brand:hover {
  color: #f8f9fa;
  text-decoration: none;
}

.btn-primary {
  background-color: var(--button-color);
  border-color: var(--button-color);
}

.btn-primary:hover {
  background-color: var(--button-hover);
  border-color: var(--button-hover);
}

.card-header {
  background: var(--header-gradient);
  color: white;
  border-radius: 0.75rem 0.75rem 0 0 !important;
  border: none;
}

/* Resto de estilos sin cambios... */
```

### 2. Aplicar Tema en App Component

**Archivo**: `frontend/src/app/app.component.ts` (modificar)

```typescript
import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ConfigService } from "./services/config.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "Clinic Frontend";

  constructor(private configService: ConfigService) {}

  ngOnInit(): void {
    // Aplicar tema del cliente al cargar la app
    this.configService.applyTheme();

    // Actualizar título de la página
    const clientInfo = this.configService.getClientInfo();
    document.title = clientInfo.shortName;

    console.log("✅ Cliente cargado:", clientInfo.name);
    console.log("🎨 Tema aplicado:", this.configService.getTheme().primary);
  }
}
```

### 3. Ejemplo de Temas

#### Cliente 1: Masaje Corporal Deportivo (Azul/Morado)

```scss
--primary-color: #667eea;
--secondary-color: #764ba2;
--header-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

#### Cliente 2: Fisioterapia Centro (Naranja/Amarillo)

```scss
--primary-color: #ff6b35;
--secondary-color: #f7b731;
--header-gradient: linear-gradient(135deg, #ff6b35 0%, #f7b731 100%);
```

#### Cliente 3: Clínica Verde (Verde/Turquesa)

```scss
--primary-color: #10b981;
--secondary-color: #06b6d4;
--header-gradient: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Preparar Estructura (1-2 horas)

```powershell
# 1. Crear estructura de carpetas
cd c:\Users\dsuarez1\git\clinic\frontend\src

# Crear carpetas de configuración
New-Item -Path "config\clients" -ItemType Directory -Force
New-Item -Path "assets\clients\masajecorporaldeportivo" -ItemType Directory -Force
New-Item -Path "assets\clients\fisioterapia-centro" -ItemType Directory -Force

# 2. Copiar logo actual a carpeta del cliente
Copy-Item "assets\logo-clinica.png" "assets\clients\masajecorporaldeportivo\logo.png"
```

### Fase 2: Crear Archivos de Configuración (2-3 horas)

✅ **Paso 1**: Crear interfaz `client-config.interface.ts`  
✅ **Paso 2**: Crear configuración cliente 1 `masajecorporaldeportivo.config.ts`  
✅ **Paso 3**: Crear configuración cliente 2 `fisioterapia-centro.config.ts`  
✅ **Paso 4**: Crear cargador `config.loader.ts`  
✅ **Paso 5**: Crear servicio `config.service.ts`

### Fase 3: Modificar Componentes Existentes (3-4 horas)

#### 3.1. Header Component

**Antes** (`app/layout/header.component.html`):

```html
<header class="clinic-header">
  <div class="container">
    <h1>Masaje Corporal Deportivo</h1>
  </div>
</header>
```

**Después**:

```html
<header class="clinic-header">
  <div class="container d-flex align-items-center">
    <img
      [src]="clientConfig.assets.logo"
      [alt]="clientConfig.info.name"
      class="clinic-logo"
    />
    <h1 class="clinic-brand ms-3">{{ clientConfig.info.shortName }}</h1>
  </div>
</header>
```

**TypeScript** (`header.component.ts`):

```typescript
import { Component } from "@angular/core";
import { ConfigService } from "../../services/config.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent {
  clientConfig = this.configService.getConfig();

  constructor(private configService: ConfigService) {}
}
```

#### 3.2. Servicios HTTP

**Modificar todos los servicios** (`patient.service.ts`, `appointment.service.ts`, etc.):

**Antes**:

```typescript
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get(this.apiUrl);
  }
}
```

**Después**:

```typescript
import { ConfigService } from "./config.service";

@Injectable({ providedIn: "root" })
export class PatientService {
  private apiUrl: string;
  private headers: HttpHeaders;

  constructor(private http: HttpClient, private configService: ConfigService) {
    const config = this.configService.getConfig();
    this.apiUrl = `${config.backend.apiUrl}/patients`;

    // ✨ IMPORTANTE: Agregar header X-Tenant-Slug
    this.headers = new HttpHeaders({
      "Content-Type": "application/json",
      "X-Tenant-Slug": config.tenantSlug,
    });
  }

  getAll() {
    return this.http.get(this.apiUrl, { headers: this.headers });
  }

  create(patient: any) {
    return this.http.post(this.apiUrl, patient, { headers: this.headers });
  }
}
```

### Fase 4: Actualizar PWA Manifest (1 hora)

**Archivo**: `frontend/src/manifest.json` (hacer dinámico)

**Crear**: `frontend/src/manifest.template.json`

```json
{
  "name": "{{PWA_NAME}}",
  "short_name": "{{PWA_SHORT_NAME}}",
  "description": "{{PWA_DESCRIPTION}}",
  "theme_color": "{{THEME_COLOR}}",
  "background_color": "{{BACKGROUND_COLOR}}",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "{{ICON_PATH}}",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**Script de build** (agregar a `package.json`):

```json
{
  "scripts": {
    "build:client": "node scripts/generate-manifest.js && ng build"
  }
}
```

**Archivo**: `frontend/scripts/generate-manifest.js`

```javascript
const fs = require("fs");
const path = require("path");

// Leer CLIENT_ID de variable de entorno
const clientId = process.env.VITE_CLIENT_ID || "masajecorporaldeportivo";

// Cargar configuración del cliente
const configPath = path.join(
  __dirname,
  `../src/config/clients/${clientId}.config.ts`
);
if (!fs.existsSync(configPath)) {
  console.error(`❌ No se encontró configuración para cliente: ${clientId}`);
  process.exit(1);
}

// Leer template de manifest
const templatePath = path.join(__dirname, "../src/manifest.template.json");
const template = fs.readFileSync(templatePath, "utf-8");

// Importar configuración (simplificado - en producción usar ts-node)
const config = require(`../src/config/clients/${clientId}.config.ts`).default;

// Reemplazar variables
let manifest = template
  .replace("{{PWA_NAME}}", config.pwa.name)
  .replace("{{PWA_SHORT_NAME}}", config.pwa.shortName)
  .replace("{{PWA_DESCRIPTION}}", config.pwa.description)
  .replace("{{THEME_COLOR}}", config.pwa.themeColor)
  .replace("{{BACKGROUND_COLOR}}", config.pwa.backgroundColor)
  .replace("{{ICON_PATH}}", config.assets.logo);

// Escribir manifest.json
const outputPath = path.join(__dirname, "../src/manifest.json");
fs.writeFileSync(outputPath, manifest, "utf-8");

console.log(`✅ Manifest generado para cliente: ${clientId}`);
```

### Fase 5: Crear Script de Despliegue (1 hora)

**Archivo**: `scripts/deploy-client.ps1`

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$ClientId
)

Write-Host "🚀 Desplegando cliente: $ClientId" -ForegroundColor Cyan

# 1. Configurar variable de entorno
$env:VITE_CLIENT_ID = $ClientId

# 2. Generar manifest.json
Write-Host "📝 Generando manifest.json..." -ForegroundColor Yellow
node scripts/generate-manifest.js

# 3. Build de producción
Write-Host "🔨 Building..." -ForegroundColor Yellow
cd frontend
ng build --configuration production

# 4. Deploy a Vercel
Write-Host "📤 Desplegando a Vercel..." -ForegroundColor Yellow
$projectName = "clinic-$ClientId"

# Opción 1: Nuevo proyecto
vercel --prod --name $projectName --yes

# Opción 2: Proyecto existente (si ya existe)
# vercel --prod --cwd ./dist/clinic-frontend

Write-Host "✅ Despliegue completado para $ClientId" -ForegroundColor Green
Write-Host "🌐 URL: https://$projectName.vercel.app"
```

### Fase 6: Base de Datos (Ya Está Lista)

**✅ No requiere cambios** - El backend ya soporta multi-tenant con:

- Header `X-Tenant-Slug`
- Tablas con sufijo: `patients_masajecorporaldeportivo`, `appointments_fisioterapiacentro`, etc.
- Middleware `loadTenant` en `backend/src/middleware/tenant.js`

**Solo necesitas crear las tablas para el nuevo cliente**:

```sql
-- Ejemplo para cliente "fisioterapiacentro"
CREATE TABLE patients_fisioterapiacentro (LIKE patients_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE appointments_fisioterapiacentro (LIKE appointments_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_packs_fisioterapiacentro (LIKE credit_packs_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_redemptions_fisioterapiacentro (LIKE credit_redemptions_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE configurations_fisioterapiacentro (LIKE configurations_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE patient_files_fisioterapiacentro (LIKE patient_files_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE backups_fisioterapiacentro (LIKE backups_masajecorporaldeportivo INCLUDING ALL);
```

---

## 📦 DESPLIEGUE MULTI-CLIENTE

### Opción 1: Vercel con Múltiples Proyectos (RECOMENDADA)

```
Cliente 1:
  Proyecto Vercel: clinic-masajecorporaldeportivo
  Variable de entorno: VITE_CLIENT_ID=masajecorporaldeportivo
  URL: https://clinic-masajecorporaldeportivo.vercel.app

Cliente 2:
  Proyecto Vercel: clinic-fisioterapiacentro
  Variable de entorno: VITE_CLIENT_ID=fisioterapiacentro
  URL: https://clinic-fisioterapiacentro.vercel.app

Backend (compartido):
  Proyecto Vercel: clinic-backend
  URL: https://clinic-backend-xxx.vercel.app
```

### Opción 2: Vercel con Dominios Personalizados

```
Cliente 1:
  URL Vercel: clinic-masajecorporaldeportivo.vercel.app
  Dominio custom: app.masajecorporaldeportivo.com

Cliente 2:
  URL Vercel: clinic-fisioterapiacentro.vercel.app
  Dominio custom: app.fisioterapiacentro.com
```

### Comandos de Despliegue

```powershell
# Cliente 1
.\scripts\deploy-client.ps1 -ClientId "masajecorporaldeportivo"

# Cliente 2
.\scripts\deploy-client.ps1 -ClientId "fisioterapiacentro"

# Backend (una sola vez, compartido)
cd backend
vercel --prod
```

---

## 🛠️ AGREGAR UN NUEVO CLIENTE (5 PASOS)

### Paso 1: Crear Configuración (5 min)

```typescript
// frontend/src/config/clients/nuevocliente.config.ts
export const nuevoclienteConfig: ClientConfig = {
  tenantSlug: "nuevocliente",
  info: {
    name: "Nuevo Cliente Spa",
    shortName: "NCS",
    // ... resto de datos
  },
  theme: {
    primary: "#10b981", // Verde
    secondary: "#06b6d4", // Turquesa
    // ...
  },
  // ...
};
```

### Paso 2: Registrar en Loader (1 min)

```typescript
// frontend/src/config/config.loader.ts
import { nuevoclienteConfig } from "./clients/nuevocliente.config";

const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  masajecorporaldeportivo: masajecorporaldeportivoConfig,
  fisioterapiacentro: fisioterapiacentroConfig,
  nuevocliente: nuevoclienteConfig, // ✨ AGREGAR AQUÍ
};
```

### Paso 3: Preparar Assets (5 min)

```powershell
# Crear carpeta de assets
New-Item -Path "frontend/src/assets/clients/nuevocliente" -ItemType Directory
# Copiar logo del cliente
Copy-Item "ruta/al/logo.png" "frontend/src/assets/clients/nuevocliente/logo.png"
```

### Paso 4: Crear Tablas en Supabase (5 min)

```sql
-- SQL Editor en Supabase
CREATE TABLE patients_nuevocliente (LIKE patients_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE appointments_nuevocliente (LIKE appointments_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_packs_nuevocliente (LIKE credit_packs_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE credit_redemptions_nuevocliente (LIKE credit_redemptions_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE configurations_nuevocliente (LIKE configurations_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE patient_files_nuevocliente (LIKE patient_files_masajecorporaldeportivo INCLUDING ALL);
CREATE TABLE backups_nuevocliente (LIKE backups_masajecorporaldeportivo INCLUDING ALL);
```

### Paso 5: Desplegar (5 min)

```powershell
.\scripts\deploy-client.ps1 -ClientId "nuevocliente"
```

**TOTAL: ~20 minutos por cliente nuevo** ✅

---

## 🔐 AISLAMIENTO DE CÓDIGO

### Ventajas de la Arquitectura Propuesta

✅ **Aislamiento por Deploy**:

- Cada cliente tiene su propia instancia de frontend en Vercel
- Si hay un problema en Cliente A, Cliente B no se ve afectado
- Rollback independiente: puedes revertir a versión anterior solo en un cliente

✅ **Aislamiento de Datos**:

- Cada cliente tiene sus propias tablas (sufijo único)
- Header `X-Tenant-Slug` asegura que solo accede a sus datos
- Imposible que Cliente A vea datos de Cliente B

✅ **Código Compartido**:

- El backend es único → actualizaciones se aplican a todos
- Los componentes de Angular son reutilizables
- Solo cambias configuración y tema por cliente

### Qué Se Comparte vs Qué Se Aísla

| Componente      | Compartido | Aislado | Razón                                    |
| --------------- | ---------- | ------- | ---------------------------------------- |
| Backend API     | ✅         |         | Costes y mantenimiento                   |
| Código Frontend | ✅         |         | Reutilización y actualizaciones          |
| Deploy Frontend |            | ✅      | URLs independientes, rollbacks separados |
| Configuración   |            | ✅      | Cada cliente tiene su config             |
| Tema Visual     |            | ✅      | Colores, logos personalizados            |
| Tablas de BD    |            | ✅      | Datos completamente separados            |
| Assets (logos)  |            | ✅      | Branding único por cliente               |
| PWA Manifest    |            | ✅      | Nombre y colores de app instalable       |

---

## 💰 IMPACTO EN PRECIOS

### Costes de Infraestructura

| Servicio        | Cliente 1 | Cliente 2    | Total      |
| --------------- | --------- | ------------ | ---------- |
| Vercel Frontend | Gratis\*  | Gratis\*     | 0€/mes     |
| Vercel Backend  | Gratis\*  | (compartido) | 0€/mes     |
| Supabase DB     | 0€/mes    | (compartido) | 0€/mes     |
| **TOTAL**       |           |              | **0€/mes** |

\*Hasta 100GB bandwidth/mes por proyecto (suficiente para ~5 clientes)

### Precio por Cliente Nuevo

```
Setup Inicial (una vez):
  - Crear configuración: 15 min × 30€/h = 7.5€
  - Preparar assets (logo, colores): 15 min × 30€/h = 7.5€
  - Crear tablas en BD: 5 min × 30€/h = 2.5€
  - Desplegar a Vercel: 10 min × 30€/h = 5€
  TOTAL SETUP: ~22.5€ (< 1 hora)

Precio Recomendado al Cliente:
  - Licencia de uso: 500€ - 800€
  - Setup y personalización: 200€
  - Capacitación: 100€
  TOTAL: 800€ - 1,100€ por cliente

Margen de Beneficio:
  1,100€ (precio) - 22.5€ (coste tiempo) = 1,077.5€ por cliente
```

### Escalabilidad de Ingresos

```
Cliente 1: 4,500€ (desarrollo completo)
Cliente 2: 1,000€ (setup nuevo cliente)
Cliente 3: 1,000€
Cliente 4: 1,000€
Cliente 5: 1,000€

TOTAL 5 CLIENTES: 8,500€
Tiempo adicional: 4 × 1h = 4 horas
Tarifa efectiva: 8,500€ / 154h = 55€/h 🚀
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Frontend

- [ ] Crear `config/client-config.interface.ts`
- [ ] Crear `config/clients/masajecorporaldeportivo.config.ts`
- [ ] Crear `config/clients/fisioterapia-centro.config.ts`
- [ ] Crear `config/config.loader.ts`
- [ ] Crear `services/config.service.ts`
- [ ] Modificar `app.component.ts` para aplicar tema
- [ ] Actualizar `styles.scss` con variables CSS
- [ ] Modificar servicios HTTP para incluir `X-Tenant-Slug`
- [ ] Crear carpetas de assets por cliente
- [ ] Crear script `generate-manifest.js`
- [ ] Crear script `deploy-client.ps1`

### Backend

- [ ] ✅ **Ya está listo** (multi-tenant con X-Tenant-Slug)

### Base de Datos

- [ ] Crear tablas para nuevo cliente (fisioterapiacentro)
- [ ] Verificar que tablas compartidas funcionan (provinces, municipalities)

### Despliegue

- [ ] Desplegar cliente 1 (masajecorporaldeportivo)
- [ ] Desplegar cliente 2 (fisioterapiacentro)
- [ ] Configurar variables de entorno en Vercel
- [ ] Probar ambos despliegues

### Documentación

- [ ] Crear `AGREGAR_NUEVO_CLIENTE.md` (guía rápida)
- [ ] Actualizar `README.md` con arquitectura multi-cliente
- [ ] Documentar proceso de deployment

---

## 🚀 PRÓXIMOS PASOS

### Ahora Mismo (1-2 días)

1. ✅ Revisar esta guía completa
2. ❓ ¿Tienes preguntas o sugerencias?
3. 🛠️ Comenzar implementación Fase 1 (estructura de carpetas)

### Esta Semana

- Implementar configuración por cliente
- Probar con un segundo cliente ficticio
- Desplegar ambas versiones a Vercel

### Este Mes

- Agregar 2-3 clientes reales
- Refinar proceso de onboarding
- Crear plantillas de contratos

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Necesito un backend por cliente?**  
R: No, el backend es compartido. Ya tienes multi-tenant implementado con `X-Tenant-Slug`.

**P: ¿Cómo evito que un cliente vea datos de otro?**  
R: El backend valida el header `X-Tenant-Slug` y solo accede a tablas con ese sufijo.

**P: ¿Puedo hacer cambios solo en un cliente?**  
R: Sí, cada cliente tiene su deploy independiente. Puedes modificar la configuración de uno sin afectar a otros.

**P: ¿Cuánto tiempo toma agregar un cliente nuevo?**  
R: ~20 minutos (configuración + tablas + deploy).

**P: ¿Los clientes comparten la misma base de datos?**  
R: Sí, pero con tablas separadas por sufijo. Es más eficiente y económico que tener múltiples instancias de Supabase.

---

## 📞 SOPORTE

Si tienes dudas durante la implementación, pregúntame y te ayudaré paso a paso.

**¿Empezamos con la Fase 1?** 🚀
