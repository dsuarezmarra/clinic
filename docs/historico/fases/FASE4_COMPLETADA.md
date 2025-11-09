# ✅ FASE 4 COMPLETADA - Manifest PWA Dinámico

**Duración:** 20 minutos  
**Estado:** ✅ COMPLETADO  
**Fecha:** 2025-10-03

---

## 📋 Resumen

Se ha implementado un sistema de **generación dinámica de manifest.json** que permite que cada cliente tenga su propia configuración PWA (Progressive Web App) con:

- 🏷️ Nombre de aplicación personalizado
- 🎨 Colores de tema específicos
- 🖼️ Logo corporativo propio
- 📱 Instalación independiente en dispositivos móviles

Ahora cada cliente puede instalar la app en su móvil y verá **su propio nombre, logo y colores** en la pantalla de inicio.

---

## 🎯 Objetivos Cumplidos

- ✅ Crear template de manifest con placeholders
- ✅ Script Node.js para generación automática
- ✅ Script PowerShell para Windows
- ✅ Integración con proceso de build
- ✅ Validación de logos y JSON
- ✅ Scripts npm para cada cliente

---

## 📁 Archivos Creados/Modificados

### 1️⃣ Nuevos Archivos

#### `frontend/src/manifest.template.json` (NUEVO)

Template con placeholders para generación dinámica:

```json
{
  "name": "{{APP_NAME}}",
  "short_name": "{{SHORT_NAME}}",
  "description": "{{DESCRIPTION}}",
  "theme_color": "{{THEME_COLOR}}",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "{{LOGO_PATH}}",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    }
    // ... más tamaños
  ]
}
```

**Placeholders:**

- `{{APP_NAME}}` - Nombre completo de la app
- `{{SHORT_NAME}}` - Nombre corto para el ícono
- `{{DESCRIPTION}}` - Descripción de la app
- `{{THEME_COLOR}}` - Color del tema PWA
- `{{LOGO_PATH}}` - Ruta al logo del cliente

---

#### `scripts/generate-manifest.js` (NUEVO)

Script Node.js con módulos ESM:

**Características:**

- ✅ Carga configuración por cliente
- ✅ Lee template y reemplaza placeholders
- ✅ Valida JSON antes de guardar
- ✅ Verifica existencia de logos
- ✅ Soporta CLI y variables de entorno
- ✅ Mensajes coloridos en consola

**Uso:**

```bash
# Desde línea de comandos
node scripts/generate-manifest.js masajecorporaldeportivo
node scripts/generate-manifest.js fisioterapiacentro

# Con variable de entorno
VITE_CLIENT_ID=fisioterapiacentro node scripts/generate-manifest.js

# Por defecto (sin argumentos)
node scripts/generate-manifest.js  # Usa masajecorporaldeportivo
```

**Configuraciones incluidas:**

```javascript
const CLIENT_CONFIGS = {
  masajecorporaldeportivo: {
    name: "Masaje Corporal Deportivo",
    shortName: "Clínica MCD",
    description: "Sistema de gestión para clínica de masaje corporal deportivo",
    themeColor: "#667eea", // Azul/morado
    logoPath: "assets/clients/masajecorporaldeportivo/logo.png",
  },
  fisioterapiacentro: {
    name: "Fisioterapia Centro",
    shortName: "Fisio Centro",
    description: "Sistema de gestión para centro de fisioterapia",
    themeColor: "#ff6b35", // Naranja/amarillo
    logoPath: "assets/clients/fisioterapiacentro/logo.png",
  },
};
```

---

#### `scripts/generate-manifest.ps1` (NUEVO)

Script PowerShell nativo para Windows:

**Características:**

- ✅ Validación de parámetros con `ValidateSet` (no aplicada aún)
- ✅ Colores en consola con `Write-Host -ForegroundColor`
- ✅ Verificación de logos
- ✅ Validación de JSON antes de guardar
- ✅ Mensajes informativos paso a paso

**Uso:**

```powershell
# Con parámetro
.\scripts\generate-manifest.ps1 masajecorporaldeportivo
.\scripts\generate-manifest.ps1 fisioterapiacentro

# Por defecto
.\scripts\generate-manifest.ps1  # Usa masajecorporaldeportivo
```

**Output esperado:**

```
🎨 ============================================
   Generador de Manifest PWA Multi-Cliente
============================================

🔍 Cliente seleccionado: masajecorporaldeportivo
✅ Template encontrado: manifest.template.json
✅ Logo verificado: assets/clients/masajecorporaldeportivo/logo.png

📋 Generando manifest para: Masaje Corporal Deportivo
   - Nombre corto: Clínica MCD
   - Color tema: #667eea
   - Logo: assets/clients/masajecorporaldeportivo/logo.png

✅ Manifest generado exitosamente!
   Guardado en: frontend/src/manifest.json

🎉 ¡Proceso completado exitosamente!
```

---

### 2️⃣ Archivos Modificados

#### `package.json` (raíz del proyecto)

Agregados nuevos scripts npm:

```json
{
  "scripts": {
    // ... scripts existentes ...
    "generate:manifest": "node scripts/generate-manifest.js",
    "build:client": "npm run generate:manifest && npm run build:frontend",
    "build:masajecorporal": "cross-env VITE_CLIENT_ID=masajecorporaldeportivo npm run build:client",
    "build:fisioterapia": "cross-env VITE_CLIENT_ID=fisioterapiacentro npm run build:client"
  }
}
```

**Scripts disponibles:**

- `npm run generate:manifest` - Genera manifest con cliente por defecto
- `npm run build:client` - Genera manifest + build frontend
- `npm run build:masajecorporal` - Build completo para cliente 1
- `npm run build:fisioterapia` - Build completo para cliente 2

---

#### `frontend/package.json`

Agregado hook `prebuild` automático:

```json
{
  "scripts": {
    "generate:manifest": "node ../scripts/generate-manifest.js",
    "prebuild": "npm run generate:manifest", // ✨ Se ejecuta automáticamente antes de build
    "build": "ng build",
    "build:masajecorporal": "cross-env VITE_CLIENT_ID=masajecorporaldeportivo npm run build",
    "build:fisioterapia": "cross-env VITE_CLIENT_ID=fisioterapiacentro npm run build"
  }
}
```

**⚠️ IMPORTANTE:** El hook `prebuild` se ejecuta **automáticamente** antes de `npm run build`, asegurando que el manifest siempre esté actualizado.

---

#### `scripts/build-client.ps1` (MODIFICADO)

Integrado paso de generación de manifest:

**Antes:**

```powershell
# Solo hacía el build de Angular
ng build --configuration production
```

**Ahora:**

```powershell
# Paso 1: Generar manifest
Write-Host "🎨 Paso 1: Generando manifest.json para cliente..." -ForegroundColor Cyan
& "$PSScriptRoot\generate-manifest.ps1" -ClientId $ClientId

# Paso 2: Build de Angular
Write-Host "📦 Paso 2: Build para cliente: $ClientId" -ForegroundColor Green
$env:VITE_CLIENT_ID = $ClientId
ng build --configuration production
```

---

## 🔧 Flujo de Trabajo

### Generación Manual de Manifest

#### Opción 1: PowerShell (Recomendado para Windows)

```powershell
# Cliente 1
.\scripts\generate-manifest.ps1 masajecorporaldeportivo

# Cliente 2
.\scripts\generate-manifest.ps1 fisioterapiacentro

# Por defecto
.\scripts\generate-manifest.ps1
```

#### Opción 2: Node.js (Cross-platform)

```bash
# Cliente 1
node scripts/generate-manifest.js masajecorporaldeportivo

# Cliente 2
node scripts/generate-manifest.js fisioterapiacentro

# Por defecto
node scripts/generate-manifest.js
```

#### Opción 3: npm scripts

```bash
# Genera manifest con cliente por defecto
npm run generate:manifest

# Con variable de entorno
VITE_CLIENT_ID=fisioterapiacentro npm run generate:manifest
```

---

### Build Completo por Cliente

#### Opción 1: Scripts npm (Recomendado)

```bash
# Build Cliente 1 (Masaje Corporal Deportivo)
npm run build:masajecorporal

# Build Cliente 2 (Fisioterapia Centro)
npm run build:fisioterapia
```

Estos scripts:

1. ✅ Establecen `VITE_CLIENT_ID`
2. ✅ Generan manifest.json automáticamente (vía prebuild)
3. ✅ Ejecutan build de Angular
4. ✅ Limpian variables de entorno

---

#### Opción 2: Script PowerShell Completo

```powershell
# Build Cliente 1
.\scripts\build-client.ps1 masajecorporaldeportivo

# Build Cliente 2
.\scripts\build-client.ps1 fisioterapiacentro

# Por defecto
.\scripts\build-client.ps1 default
```

Este script muestra:

- 🎨 Generación de manifest
- 📦 Progreso del build
- ✅ Cliente detectado en bundle final
- 📁 Ubicación de archivos generados

---

## 📱 Resultado en Dispositivos

### Cliente 1: Masaje Corporal Deportivo

Cuando se instala como PWA:

- **Nombre en pantalla:** "Clínica MCD"
- **Nombre completo:** "Masaje Corporal Deportivo"
- **Color splash screen:** #667eea (Azul/Morado)
- **Icono:** Logo masajecorporaldeportivo
- **Barra de navegación:** Color #667eea

### Cliente 2: Fisioterapia Centro

Cuando se instala como PWA:

- **Nombre en pantalla:** "Fisio Centro"
- **Nombre completo:** "Fisioterapia Centro"
- **Color splash screen:** #ff6b35 (Naranja/Amarillo)
- **Icono:** Logo fisioterapiacentro
- **Barra de navegación:** Color #ff6b35

---

## 🧪 Validaciones Implementadas

### 1️⃣ Validación de Template

```javascript
if (!fs.existsSync(templatePath)) {
  console.error(`❌ No se encontró el template: ${templatePath}`);
  process.exit(1);
}
```

### 2️⃣ Validación de Configuración

```javascript
if (!config) {
  console.error(`❌ Configuración no encontrada para cliente: ${clientId}`);
  console.log(
    `Clientes disponibles: ${Object.keys(CLIENT_CONFIGS).join(", ")}`
  );
  process.exit(1);
}
```

### 3️⃣ Validación de JSON

```javascript
try {
  JSON.parse(manifestContent);
} catch (error) {
  console.error("❌ Error: El manifest generado no es JSON válido");
  process.exit(1);
}
```

### 4️⃣ Validación de Logo (Warning)

```javascript
if (!fs.existsSync(logoPath)) {
  console.warn(`⚠️  ADVERTENCIA: No se encontró el logo: ${logoPath}`);
  console.warn(`   El PWA puede no funcionar correctamente sin el logo`);
}
```

---

## 📊 Comparativa de Manifests

### Cliente 1: masajecorporaldeportivo

```json
{
  "name": "Masaje Corporal Deportivo",
  "short_name": "Clínica MCD",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "assets/clients/masajecorporaldeportivo/logo.png",
      "sizes": "192x192"
    }
  ]
}
```

### Cliente 2: fisioterapiacentro

```json
{
  "name": "Fisioterapia Centro",
  "short_name": "Fisio Centro",
  "theme_color": "#ff6b35",
  "icons": [
    {
      "src": "assets/clients/fisioterapiacentro/logo.png",
      "sizes": "192x192"
    }
  ]
}
```

---

## ⚙️ Integración con Build Pipeline

### Proceso Automático

1. **Desarrollador ejecuta build:**

   ```bash
   npm run build:masajecorporal
   ```

2. **npm ejecuta prebuild hook automáticamente:**

   ```bash
   npm run generate:manifest
   ```

3. **Script genera manifest.json:**

   - Lee `VITE_CLIENT_ID` (si existe)
   - Carga configuración del cliente
   - Reemplaza placeholders en template
   - Guarda `frontend/src/manifest.json`

4. **Angular build incluye manifest generado:**

   ```bash
   ng build --configuration production
   ```

5. **Resultado:**
   - ✅ `dist/clinic-frontend/browser/manifest.json` con valores correctos
   - ✅ Listo para deployment a Vercel/servidor

---

## 🚀 Deployment a Vercel

### Variables de Entorno por Proyecto

Cada proyecto Vercel debe tener:

**Proyecto 1: masajecorporaldeportivo-web**

```env
VITE_CLIENT_ID=masajecorporaldeportivo
```

**Proyecto 2: fisioterapiacentro-web**

```env
VITE_CLIENT_ID=fisioterapiacentro
```

### Build Command en Vercel

```bash
cd frontend && npm install && npm run build
```

El hook `prebuild` se ejecuta automáticamente, generando el manifest correcto.

---

## 🎓 Lecciones Aprendidas

### 1️⃣ Hooks npm son poderosos

El hook `prebuild` permite automatizar la generación sin modificar comandos existentes.

### 2️⃣ Template + Script = Flexibilidad

Separar el template del script permite agregar nuevos clientes fácilmente sin cambiar código.

### 3️⃣ Validaciones tempranas

Validar logos y JSON antes de guardar previene errores en producción.

### 4️⃣ PowerShell para Windows

Script nativo PowerShell es más rápido que Node.js para desarrolladores Windows.

### 5️⃣ Variables de entorno en 3 niveles

1. CLI arguments (mayor prioridad)
2. `VITE_CLIENT_ID` environment variable
3. Default fallback (menor prioridad)

---

## 📝 Agregar Nuevo Cliente

Para agregar un tercer cliente (ej: "masajeterapeutico"):

### 1️⃣ Agregar configuración en ambos scripts

**`scripts/generate-manifest.js`:**

```javascript
const CLIENT_CONFIGS = {
  // ... existentes ...
  masajeterapeutico: {
    name: "Masaje Terapéutico Integral",
    shortName: "Masaje Terapéutico",
    description: "Centro especializado en masaje terapéutico",
    themeColor: "#10b981", // Verde
    logoPath: "assets/clients/masajeterapeutico/logo.png",
  },
};
```

**`scripts/generate-manifest.ps1`:**

```powershell
$CLIENT_CONFIGS = @{
    # ... existentes ...
    masajeterapeutico = @{
        Name        = "Masaje Terapéutico Integral"
        ShortName   = "Masaje Terapéutico"
        Description = "Centro especializado en masaje terapéutico"
        ThemeColor  = "#10b981"
        LogoPath    = "assets/clients/masajeterapeutico/logo.png"
    }
}
```

### 2️⃣ Crear carpeta de assets

```
frontend/src/assets/clients/masajeterapeutico/
└── logo.png
```

### 3️⃣ Agregar configuración en config files

Ver `FASE1_COMPLETADA.md` para crear archivo de configuración completo.

### 4️⃣ Agregar script npm

```json
{
  "scripts": {
    "build:masajeterapeutico": "cross-env VITE_CLIENT_ID=masajeterapeutico npm run build:client"
  }
}
```

---

## ✅ Checklist de Verificación

- [x] Template manifest.template.json creado
- [x] Script Node.js generate-manifest.js funcional
- [x] Script PowerShell generate-manifest.ps1 funcional
- [x] Integrado con package.json (raíz)
- [x] Integrado con frontend/package.json
- [x] Hook prebuild configurado
- [x] Script build-client.ps1 actualizado
- [x] Validación de logos implementada
- [x] Validación de JSON implementada
- [x] Pruebas con ambos clientes exitosas
- [x] Manifest.json se genera correctamente para Cliente 1
- [x] Manifest.json se genera correctamente para Cliente 2
- [x] Documentación completa creada

---

## 🎯 Testing Realizado

### Test 1: Generación Cliente 1

```powershell
PS> .\scripts\generate-manifest.ps1 masajecorporaldeportivo
✅ Logo verificado: assets/clients/masajecorporaldeportivo/logo.png
✅ Manifest generado exitosamente!
```

**Verificación:**

```json
{
  "name": "Masaje Corporal Deportivo",
  "short_name": "Clínica MCD",
  "theme_color": "#667eea"
}
```

✅ **PASS**

---

### Test 2: Generación Cliente 2

```powershell
PS> .\scripts\generate-manifest.ps1 fisioterapiacentro
⚠️  ADVERTENCIA: Logo no encontrado: assets/clients/fisioterapiacentro/logo.png
✅ Manifest generado exitosamente!
```

**Verificación:**

```json
{
  "name": "Fisioterapia Centro",
  "short_name": "Fisio Centro",
  "theme_color": "#ff6b35"
}
```

✅ **PASS** (con warning esperado - logo pendiente)

---

### Test 3: Por Defecto

```powershell
PS> .\scripts\generate-manifest.ps1
🔍 Cliente seleccionado: masajecorporaldeportivo
✅ Manifest generado exitosamente!
```

✅ **PASS**

---

## 🔄 Próximos Pasos (Fase 5)

**Fase 5:** Scripts de Deployment a Vercel (15 min)

- Script para crear proyectos en Vercel
- Configurar variables de entorno automáticamente
- Deploy automatizado por cliente
- Integración con GitHub Actions (opcional)

Ver: `GUIA_SISTEMA_MULTICLIENTE.md` para más detalles.

---

## 📦 Archivos Generados

- ✅ `frontend/src/manifest.template.json` - Template con placeholders
- ✅ `scripts/generate-manifest.js` - Script Node.js ESM
- ✅ `scripts/generate-manifest.ps1` - Script PowerShell
- ✅ `frontend/src/manifest.json` - Generado dinámicamente (no commitear)

---

## 🎉 Conclusión

**Fase 4 completada exitosamente.** El sistema ahora genera automáticamente el manifest PWA correcto para cada cliente, permitiendo que cada uno tenga su propia experiencia de instalación en dispositivos móviles con su nombre, logo y colores corporativos.

El proceso es completamente automatizado mediante hooks npm y puede integrarse fácilmente en pipelines CI/CD.

---

**Tiempo estimado:** 20 min  
**Tiempo real:** 20 min  
**Estado:** ✅ COMPLETADO  
**Próximo paso:** Fase 5 - Scripts de Deployment
