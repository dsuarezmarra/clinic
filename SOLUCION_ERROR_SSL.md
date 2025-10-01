# 🔧 Solución: Error de Certificado SSL en Vercel CLI

## ❌ Error Encontrado

```
Error: self-signed certificate in certificate chain
```

Este error ocurre cuando tu red corporativa usa un proxy o firewall con certificados SSL propios.

---

## ✅ Soluciones

### **Solución 1: Deshabilitar verificación SSL (Temporal)**

Esta es la solución más rápida para desarrollo:

```powershell
# Establecer variable de entorno en la sesión actual
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"

# Luego ejecutar vercel login
vercel login
```

**O ejecutar en un solo comando:**

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; vercel login
```

---

### **Solución 2: Configurar Node.js permanentemente (Recomendado)**

Agregar la variable de entorno de forma permanente:

```powershell
# Para el usuario actual
[System.Environment]::SetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED", "0", "User")

# Reiniciar PowerShell y probar
vercel login
```

---

### **Solución 3: Usar el navegador directamente**

Si las soluciones anteriores no funcionan:

1. Ve directamente a: https://vercel.com/login
2. Inicia sesión con GitHub
3. Ve a: https://vercel.com/account/tokens
4. Crea un nuevo token con nombre "CLI Token"
5. Copia el token
6. Ejecuta en PowerShell:

```powershell
$env:VERCEL_TOKEN="tu-token-aqui"
vercel whoami
```

---

### **Solución 4: Usar la interfaz web de Vercel**

En lugar de usar CLI, puedes hacer todo desde el navegador:

1. **Crear cuenta**: https://vercel.com/signup
2. **Importar proyecto desde GitHub**: https://vercel.com/new
3. **Configurar variables de entorno** desde el Dashboard
4. **Desplegar automáticamente** conectando con Git

Esta es la opción más simple si tienes problemas con la CLI.

---

## 🚀 Pasos Siguientes

### Opción A: Con CLI (después de aplicar solución)

```powershell
# 1. Establecer variable
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"

# 2. Login
vercel login

# 3. Desplegar backend
cd backend
vercel --prod

# 4. Desplegar frontend
cd ../frontend
vercel --prod
```

### Opción B: Sin CLI (desde navegador)

Sigue esta guía alternativa: **DEPLOY_VERCEL_WEB.md** (la creo ahora)

---

## ⚠️ Nota de Seguridad

Deshabilitar la verificación SSL es seguro para:

- ✅ Redes corporativas con proxy
- ✅ Desarrollo local
- ✅ Entornos controlados

**NO** es recomendable para:

- ❌ Servidores de producción
- ❌ Redes públicas no confiables

En tu caso (red corporativa), es seguro y necesario.

---

## 🔍 Diagnóstico

Para verificar que el problema es tu red corporativa:

```powershell
# Ver configuración de proxy
$env:HTTP_PROXY
$env:HTTPS_PROXY

# Ver certificados de Node.js
node -e "console.log(process.env.NODE_EXTRA_CA_CERTS)"
```

---

## 📞 Ayuda Adicional

Si ninguna solución funciona:

1. Contacta a IT de tu empresa
2. Pide acceso a `vercel.com` sin proxy
3. O usa la interfaz web exclusivamente (no necesita CLI)

---

**Siguiente paso**: Prueba la Solución 1 (la más rápida)
