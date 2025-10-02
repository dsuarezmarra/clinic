# 📋 Guía para Agregar un Nuevo Cliente

## 🎯 Resumen

Cada cliente tiene:

- ✅ Su propia base de datos Supabase
- ✅ Su propio nombre de aplicación
- ✅ Su propio logo e icono
- ✅ Sus propios datos de clínica
- ✅ Su propia URL en Vercel

El código es **idéntico** para todos, solo cambia la configuración.

---

## 📝 Pasos para Agregar un Nuevo Cliente

### **1. Crear Proyecto Supabase**

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea un nuevo proyecto para el cliente
3. Ejecuta el SQL de inicialización (`backend/supabase-setup.sql`)
4. Copia:
   - URL del proyecto: `https://xxxxx.supabase.co`
   - Anon key: `eyJhbGc...`

### **2. Agregar Configuración del Cliente**

Edita `frontend/src/app/config/client.config.ts`:

```typescript
const CLIENT_CONFIGS: Record<string, ClientConfig> = {
  // ... clientes existentes ...

  // NUEVO CLIENTE
  "nombre-cliente": {
    clientId: "nombre-cliente",
    appName: "Nombre del Centro",
    logoUrl: "/assets/logo-cliente.png",
    faviconUrl: "/favicon-cliente.ico",
    primaryColor: "#FF6600", // Color principal
    supabaseUrl: "https://xxxxx.supabase.co",
    supabaseAnonKey: "eyJhbGc...",
    apiUrl: "https://nombre-cliente-api.vercel.app/api",
    defaultClinicInfo: {
      name: "Nombre del Centro",
      address: "Dirección completa",
      phone: "912345678",
      email: "info@centro.com",
    },
  },
};
```

### **3. Agregar Logo e Icono**

1. Coloca los archivos en:
   - Logo: `frontend/src/assets/logo-cliente.png`
   - Favicon: `frontend/public/favicon-cliente.ico`

### **4. Configurar Backend en Vercel**

```powershell
cd backend
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

# Crear proyecto backend
vercel

# Configurar variables de entorno en Vercel
vercel env add SUPABASE_URL
# Pegar: https://xxxxx.supabase.co

vercel env add SUPABASE_ANON_KEY
# Pegar: eyJhbGc...

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Pegar la service role key desde Supabase

# Desplegar
vercel --prod

# Asignar dominio fijo
vercel alias set nombre-cliente-api.vercel.app
```

### **5. Configurar Frontend en Vercel**

```powershell
cd frontend
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

# Crear proyecto frontend
vercel

# Configurar variable de entorno en Vercel
vercel env add VITE_CLIENT_ID
# Valor: nombre-cliente

# Desplegar
vercel --prod

# Asignar dominio fijo
vercel alias set nombre-cliente.vercel.app
```

---

## 🚀 Despliegues Futuros

### **Para actualizar un cliente específico:**

```powershell
# 1. Configurar el cliente localmente
cd frontend
$env:VITE_CLIENT_ID='nombre-cliente'
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'

# 2. Desplegar
vercel --prod

# El dominio nombre-cliente.vercel.app se actualiza automáticamente
```

### **Para actualizar todos los clientes:**

Cuando hagas mejoras al código base, despliega cada proyecto de Vercel:

```powershell
# Frontend Cliente 1
cd frontend
vercel --prod --scope proyecto-cliente1

# Frontend Cliente 2
vercel --prod --scope proyecto-cliente2

# Y así sucesivamente...
```

---

## 📋 Checklist de Nuevo Cliente

- [ ] Crear proyecto Supabase
- [ ] Ejecutar SQL de inicialización
- [ ] Agregar configuración en `client.config.ts`
- [ ] Agregar logo e icono
- [ ] Crear proyecto backend en Vercel
- [ ] Configurar variables de entorno backend
- [ ] Desplegar backend
- [ ] Asignar alias backend (`nombre-api.vercel.app`)
- [ ] Crear proyecto frontend en Vercel
- [ ] Configurar variable `VITE_CLIENT_ID`
- [ ] Desplegar frontend
- [ ] Asignar alias frontend (`nombre.vercel.app`)
- [ ] Probar aplicación completa
- [ ] Verificar datos de clínica en Configuración
- [ ] Entregar URL al cliente

---

## 🔧 Mantenimiento

### **Actualizar código base (todos los clientes):**

1. Haz cambios en el código
2. Commit y push a Git
3. Despliega cada proyecto de Vercel

### **Cambiar configuración de un cliente:**

1. Edita `client.config.ts`
2. Despliega solo ese cliente

### **Problemas comunes:**

**Error: "Cliente no configurado"**

- Verifica que `VITE_CLIENT_ID` esté configurado en Vercel
- Verifica que el ID exista en `client.config.ts`

**Error: "Supabase connection failed"**

- Verifica las URLs y keys en `client.config.ts`
- Verifica que el SQL de inicialización se ejecutó

**Logo no aparece:**

- Verifica que el archivo exista en `src/assets/`
- Verifica que el path en `client.config.ts` sea correcto

---

## 💰 Costes por Cliente

- **Supabase**: Gratis hasta 500MB + 2GB bandwidth
- **Vercel**: Gratis hasta 100 despliegues/día (suficiente)
- **Total**: **0€/mes** por cliente (en plan gratuito)

---

## 📞 Soporte

Si tienes dudas, revisa:

1. Este documento
2. `frontend/src/app/config/client.config.ts`
3. Variables de entorno en Vercel Dashboard
