# 🚀 Guía Rápida de Deployment Multi-Cliente

**Versión:** 2.4.10+  
**Fecha:** 2025-10-03

---

## 📋 Prerequisitos

### 1️⃣ Vercel CLI

```powershell
# Instalar globalmente
npm install -g vercel

# Autenticarse
vercel login

# Verificar instalación
vercel --version
vercel whoami
```

### 2️⃣ Proyectos Vercel

Crear un proyecto para cada cliente en Vercel Dashboard:

| Cliente                 | Proyecto Vercel               | URL                                |
| ----------------------- | ----------------------------- | ---------------------------------- |
| masajecorporaldeportivo | `masajecorporaldeportivo-web` | masajecorporaldeportivo.vercel.app |
| actifisio               | `actifisio-web`               | actifisio.vercel.app               |

---

## ⚡ Deploy Rápido

### Opción 1: Script Automatizado (Recomendado)

```powershell
# Cliente 1: Masaje Corporal Deportivo
.\scripts\deploy-to-vercel.ps1 masajecorporaldeportivo production

# Cliente 2: Actifisio
.\scripts\deploy-to-vercel.ps1 actifisio production

# Deploy de Preview (sin afectar producción)
.\scripts\deploy-to-vercel.ps1 actifisio preview
```

**El script hace:**

1. ✅ Genera manifest.json correcto
2. ✅ Build de Angular con cliente configurado
3. ✅ Deploy a Vercel
4. ✅ Muestra URL del deployment

---

### Opción 2: Manual

#### Cliente 1: masajecorporaldeportivo

```powershell
# 1. Generar manifest
.\scripts\generate-manifest.ps1 masajecorporaldeportivo

# 2. Build
cd frontend
$env:VITE_CLIENT_ID = "masajecorporaldeportivo"
ng build --configuration production

# 3. Deploy
vercel --prod
```

#### Cliente 2: actifisio

```powershell
# 1. Generar manifest
.\scripts\generate-manifest.ps1 actifisio

# 2. Build
cd frontend
$env:VITE_CLIENT_ID = "actifisio"
ng build --configuration production

# 3. Deploy
vercel --prod
```

---

## ⚙️ Configuración de Variables de Entorno

### Paso 1: Abrir Vercel Dashboard

```
https://vercel.com/dashboard
→ Seleccionar proyecto
→ Settings → Environment Variables
```

### Paso 2: Agregar Variables

#### Para masajecorporaldeportivo-web:

```
Variable Name: VITE_CLIENT_ID
Value: masajecorporaldeportivo
Environments: ✅ Production ✅ Preview ✅ Development

Variable Name: VITE_API_URL
Value: https://masajecorporaldeportivo-api.vercel.app/api
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Para actifisio-web:

```
Variable Name: VITE_CLIENT_ID
Value: actifisio
Environments: ✅ Production ✅ Preview ✅ Development

Variable Name: VITE_API_URL
Value: https://actifisio-api.vercel.app/api
Environments: ✅ Production ✅ Preview ✅ Development
```

### Paso 3: Redeploy

```powershell
cd frontend
vercel --prod --force
```

---

## 🔍 Verificación Post-Deployment

### 1️⃣ Verificar que la App Carga

```
✅ Abrir URL: https://[proyecto].vercel.app
✅ La app debe cargar sin errores
✅ No debe haber errores en la consola del navegador
```

### 2️⃣ Verificar Tema Correcto

**masajecorporaldeportivo:**

- ✅ Header debe ser azul/morado (#667eea)
- ✅ Título: "Masaje Corporal Deportivo"
- ✅ Logo: Masaje Corporal Deportivo

**actifisio:**

- ✅ Header debe ser naranja/amarillo (#ff6b35)
- ✅ Título: "Actifisio"
- ✅ Logo: Actifisio

### 3️⃣ Verificar Headers HTTP

Abrir DevTools → Network → Seleccionar cualquier petición API:

```http
Request Headers:
Content-Type: application/json
X-Tenant-Slug: masajecorporaldeportivo  (o actifisio)
```

### 4️⃣ Verificar Manifest PWA

```
https://[proyecto].vercel.app/manifest.json
```

Debe mostrar:

```json
{
  "name": "Masaje Corporal Deportivo", // o "Actifisio"
  "short_name": "Clínica MCD", // o "Actifisio"
  "theme_color": "#667eea" // o "#ff6b35"
}
```

### 5️⃣ Probar Funcionalidad

- ✅ Crear paciente
- ✅ Ver agenda
- ✅ Crear cita
- ✅ Verificar que los datos se guardan en las tablas correctas

---

## 🔧 Troubleshooting

### Problema: "Tema incorrecto aparece"

**Causa:** Variable de entorno `VITE_CLIENT_ID` no configurada o incorrecta

**Solución:**

1. Verificar variables en Vercel Dashboard
2. Asegurar que `VITE_CLIENT_ID` tenga el valor correcto
3. Redeploy forzado: `vercel --prod --force`

---

### Problema: "X-Tenant-Slug no se envía"

**Causa:** Build se hizo sin la configuración correcta

**Solución:**

```powershell
# 1. Limpiar build anterior
cd frontend
Remove-Item -Recurse -Force dist

# 2. Build con cliente correcto
$env:VITE_CLIENT_ID = "actifisio"
ng build --configuration production

# 3. Redeploy
vercel --prod --force
```

---

### Problema: "Backend no encuentra las tablas"

**Causa:** Backend no está usando el tenant slug correcto

**Verificación:**

```powershell
# Verificar que el backend reciba el header
curl -H "X-Tenant-Slug: actifisio" https://[api-url]/api/patients
```

**Solución:**

- Verificar que el backend tenga las tablas con sufijo correcto
- Ejemplo: `patients_actifisio`, `appointments_actifisio`

---

### Problema: "Manifest PWA incorrecto"

**Causa:** Manifest no se generó antes del build

**Solución:**

```powershell
# Regenerar manifest y rebuild
.\scripts\generate-manifest.ps1 actifisio
cd frontend
ng build
vercel --prod
```

---

## 📦 Build Commands en Vercel

### Configuración en vercel.json o Dashboard

**Build Command:**

```bash
cd frontend && npm install && npm run build
```

**Output Directory:**

```
frontend/dist/clinic-frontend/browser
```

**Install Command:**

```bash
npm install --legacy-peer-deps
```

---

## 🔄 Workflow Completo

### Primera Vez (Setup)

```powershell
# 1. Crear proyecto en Vercel Dashboard
#    Nombre: actifisio-web

# 2. Configurar variables de entorno
.\scripts\setup-frontend-vercel-env.ps1 actifisio

# 3. Deploy inicial
.\scripts\deploy-to-vercel.ps1 actifisio production

# 4. Verificar deployment
#    https://actifisio.vercel.app
```

### Deployments Subsecuentes

```powershell
# Opción A: Script automatizado
.\scripts\deploy-to-vercel.ps1 actifisio production

# Opción B: Vercel CLI directo
cd frontend
$env:VITE_CLIENT_ID = "actifisio"
vercel --prod
```

---

## 📱 PWA Installation

### En Móvil (Android/iOS)

1. Abrir la URL en el navegador: `https://actifisio.vercel.app`
2. En Chrome/Safari: Click en menú → "Agregar a pantalla de inicio"
3. La app se instala con:
   - ✅ Nombre: "Actifisio"
   - ✅ Icono: Logo de Actifisio
   - ✅ Color: #ff6b35 (naranja)

---

## 🎯 Checklist de Deployment

### Pre-Deployment

- [ ] Variables de entorno configuradas en Vercel
- [ ] Manifest generado para el cliente correcto
- [ ] Build local exitoso
- [ ] Tests pasando (si aplica)

### Durante Deployment

- [ ] `VITE_CLIENT_ID` establecido correctamente
- [ ] Build de Angular exitoso
- [ ] Deployment a Vercel sin errores

### Post-Deployment

- [ ] App carga sin errores
- [ ] Tema correcto aplicado
- [ ] Headers `X-Tenant-Slug` presentes
- [ ] Manifest PWA correcto
- [ ] Backend responde correctamente
- [ ] Funcionalidad básica verificada

---

## 📞 Soporte

### Logs de Vercel

```
https://vercel.com/[proyecto]/deployments
→ Click en deployment → View Function Logs
```

### Logs Locales

```powershell
# Build local para debug
cd frontend
$env:VITE_CLIENT_ID = "actifisio"
ng serve

# Abrir: http://localhost:4200
# Verificar consola del navegador
```

---

## 🚀 Scripts Disponibles

| Script                          | Propósito            | Ejemplo                                               |
| ------------------------------- | -------------------- | ----------------------------------------------------- |
| `generate-manifest.ps1`         | Generar manifest PWA | `.\scripts\generate-manifest.ps1 actifisio`           |
| `build-client.ps1`              | Build local completo | `.\scripts\build-client.ps1 actifisio`                |
| `deploy-to-vercel.ps1`          | Deploy automatizado  | `.\scripts\deploy-to-vercel.ps1 actifisio production` |
| `setup-frontend-vercel-env.ps1` | Guía de config env   | `.\scripts\setup-frontend-vercel-env.ps1 actifisio`   |

---

## 🎉 ¡Listo!

Ahora tienes un sistema multi-cliente completamente funcional con:

- ✅ Temas personalizados por cliente
- ✅ Manifests PWA independientes
- ✅ Deployments automatizados
- ✅ Backend multi-tenant
- ✅ Aislamiento completo de datos

**Próximo cliente:** Solo repite el proceso con el nuevo `clientId` 🚀
