# 🚀 SOLUCIÓN DEFINITIVA: CREAR PROYECTO SEPARADO PARA ACTIFISIO

**Problema:** Ambos clientes (Masaje Corporal y Actifisio) usan el MISMO proyecto de Vercel  
**Consecuencia:** No podemos tener diferentes valores de `VITE_CLIENT_ID`  
**Solución:** Crear 2 proyectos separados en Vercel

---

## 📋 PASOS PARA CREAR PROYECTO SEPARADO

### Opción 1: Vercel Dashboard (RECOMENDADO - 5 min)

1. **Ir a Vercel Dashboard:**

   ```
   https://vercel.com/new
   ```

2. **Importar Repositorio Git:**

   - Si tienes el código en GitHub/GitLab: Click "Import Git Repository"
   - Si no: Subir código manualmente (ver abajo)

3. **Configurar Proyecto:**

   ```
   Project Name: actifisio-app
   Framework Preset: Angular
   Root Directory: frontend
   Build Command: npm run build:actifisio (o dejar default)
   Output Directory: dist/clinic-frontend/browser
   ```

4. **Environment Variables:**

   ```
   Name: VITE_CLIENT_ID
   Value: actifisio
   Environment: Production, Preview, Development
   ```

5. **Deploy:**

   - Click "Deploy"
   - Esperar ~2 minutos

6. **Configurar Dominio:**
   - Ir a Settings → Domains
   - Agregar: `actifisio.vercel.app`

---

### Opción 2: Subir Build Manualmente (MÁS RÁPIDO - 2 min)

Ya tenemos el build hecho con `VITE_CLIENT_ID=actifisio`, solo necesitamos subirlo:

#### Paso 1: Comprimir el build

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend\dist\clinic-frontend\browser
Compress-Archive -Path * -DestinationPath actifisio-build.zip
```

#### Paso 2: Subir a Vercel Dashboard

1. Ir a: https://vercel.com/new
2. Click "Deploy"
3. Drag & drop el archivo `actifisio-build.zip`
4. Configurar:
   - Project Name: `actifisio-app`
   - Framework: Static Site / Angular
5. Deploy

#### Paso 3: Configurar Alias

Una vez desplegado:

1. Ir a Settings → Domains
2. Add Domain: `actifisio.vercel.app`
3. Guardar

---

### Opción 3: CLI con Nuevo Proyecto (Alternativa)

Si quieres usar CLI, necesitamos crear un proyecto completamente nuevo:

```powershell
cd C:\Users\dsuarez1\git\clinic\frontend

# Crear carpeta temporal para el nuevo proyecto
mkdir ..\actifisio-deploy
Copy-Item -Recurse dist\clinic-frontend\browser\* ..\actifisio-deploy\

cd ..\actifisio-deploy

# Crear package.json mínimo
@"
{
  "name": "actifisio",
  "version": "1.0.0"
}
"@ | Out-File -FilePath package.json -Encoding utf8

# Deploy
vercel --prod
# Cuando pregunte:
# - Setup new project? Yes
# - Project name? actifisio-app
# - Directory? . (actual)
```

---

## ✅ ESTRUCTURA FINAL (2 PROYECTOS SEPARADOS)

### Proyecto 1: clinic-frontend (Masaje Corporal)

```
Nombre: clinic-frontend
URL: masajecorporaldeportivo.vercel.app
Env: VITE_CLIENT_ID=masajecorporaldeportivo
Build: npm run build:masajecorporaldeportivo
```

### Proyecto 2: actifisio-app (Actifisio) ← NUEVO

```
Nombre: actifisio-app
URL: actifisio.vercel.app
Env: VITE_CLIENT_ID=actifisio
Build: npm run build:actifisio
```

---

## 🎯 VENTAJAS DE PROYECTOS SEPARADOS

✅ **Variables independientes** - Cada uno tiene su `VITE_CLIENT_ID`  
✅ **Deployments independientes** - Actualizar uno no afecta al otro  
✅ **Configuración específica** - Build commands diferentes  
✅ **Dominios propios** - actifisio.vercel.app y masaje...vercel.app  
✅ **Logs separados** - Más fácil de debugear

---

## 📝 RECOMENDACIÓN FINAL

**USAR OPCIÓN 2 (Subir Build Manualmente):**

Es la más rápida porque ya tenemos el build correcto:

1. Comprimir: `frontend/dist/clinic-frontend/browser/*`
2. Ir a: https://vercel.com/new
3. Drag & drop el ZIP
4. Configurar nombre: `actifisio-app`
5. Deploy
6. Configurar alias: `actifisio.vercel.app`

**Tiempo total: 2-3 minutos** ⚡

---

## 🚨 IMPORTANTE

**NO modifiques las variables del proyecto actual `clinic-frontend`**  
Ese proyecto debe seguir con `VITE_CLIENT_ID=masajecorporaldeportivo`

**CREA un proyecto NUEVO `actifisio-app`**  
Con su propia variable `VITE_CLIENT_ID=actifisio`

---

## ✅ CHECKLIST

- [ ] Comprimir build de Actifisio
- [ ] Ir a https://vercel.com/new
- [ ] Subir ZIP
- [ ] Configurar nombre: actifisio-app
- [ ] Deploy
- [ ] Configurar dominio: actifisio.vercel.app
- [ ] Probar: https://actifisio.vercel.app
- [ ] Verificar que NO rompe Masaje Corporal

---

**¿Qué opción prefieres?**

1. Dashboard manual (5 min)
2. Subir ZIP (2 min) ← Recomendado
3. CLI nuevo proyecto (3 min)
