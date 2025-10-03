# 📍 URLs Estáticas por Cliente

**Actualizado:** 3 de octubre de 2025  
**Sistema:** Multi-tenant con URLs permanentes

---

## 🎯 CONCEPTO: URLs Estáticas por Cliente

Cada cliente tiene su propia **URL permanente e inmutable** que nunca cambia, independientemente de los despliegues que hagas. Esto permite:

- ✅ URLs profesionales y personalizadas por cliente
- ✅ Estabilidad: la URL nunca cambia
- ✅ SEO: cada cliente tiene su propio dominio
- ✅ Branding: URLs memorables para cada negocio

---

## 🔧 CONFIGURACIÓN ACTUAL

### Cliente 1: Masaje Corporal Deportivo

**URL Estática (Producción):**
```
https://masajecorporaldeportivo.vercel.app
```

**Configuración en vercel.json:**
```json
{
  "alias": ["masajecorporaldeportivo.vercel.app"]
}
```

**Backend API:**
```
https://clinic-backend-mweaxa2qv-davids-projects-8fa96e54.vercel.app/api
```

**Tenant Slug:**
```
masajecorporaldeportivo
```

**Estado:** ✅ **ACTIVO** (alias asignado el 3 de octubre de 2025)

---

## 🚀 CÓMO FUNCIONA

### 1. Despliegue Normal
Cuando haces `vercel --prod`, Vercel genera una URL única temporal:
```
https://clinic-frontend-[random].vercel.app
```

### 2. Alias Automático
El alias configurado en `vercel.json` se asigna automáticamente:
```
https://masajecorporaldeportivo.vercel.app → [última versión desplegada]
```

### 3. URL Permanente
Los usuarios siempre acceden por la URL permanente:
```
https://masajecorporaldeportivo.vercel.app
```

---

## 📋 CÓMO AGREGAR UN NUEVO CLIENTE

### Paso 1: Decidir la URL del cliente
Ejemplo para un nuevo cliente "Clínica Fisio":
```
https://clinicafisio.vercel.app
```

### Paso 2: Actualizar vercel.json
```json
{
  "alias": [
    "masajecorporaldeportivo.vercel.app",
    "clinicafisio.vercel.app"  // ← NUEVO
  ]
}
```

### Paso 3: Desplegar
```bash
cd frontend
vercel --prod
```

### Paso 4: Asignar alias manualmente (si es necesario)
```bash
vercel alias set [deployment-url] clinicafisio.vercel.app
```

### Paso 5: Configurar client.config.ts
```typescript
{
  slug: 'clinicafisio',
  appName: 'Clínica Fisio',
  // ... resto de configuración
}
```

---

## 🔍 VERIFICAR ALIAS ACTIVOS

Para ver todos los alias configurados:
```bash
cd frontend
vercel alias ls
```

Resultado esperado:
```
masajecorporaldeportivo.vercel.app → clinic-frontend-[id].vercel.app
```

---

## ⚙️ COMANDOS ÚTILES

### Ver último deployment
```bash
vercel ls
```

### Asignar/Reasignar alias manualmente
```bash
vercel alias set [deployment-url] masajecorporaldeportivo.vercel.app
```

### Eliminar alias
```bash
vercel alias rm masajecorporaldeportivo.vercel.app
```

### Ver dominios del proyecto
```bash
vercel domains ls
```

---

## 🌐 DOMINIOS PERSONALIZADOS (FUTURO)

Si en el futuro quieres usar dominios propios como `www.masajecorporaldeportivo.com`:

### 1. Comprar dominio
En cualquier registrador (GoDaddy, Namecheap, etc.)

### 2. Agregar dominio en Vercel
```bash
vercel domains add masajecorporaldeportivo.com
```

### 3. Configurar DNS
Vercel te dará instrucciones para configurar:
- Registro A o CNAME
- Verificación de dominio

### 4. Actualizar vercel.json
```json
{
  "alias": [
    "masajecorporaldeportivo.vercel.app",
    "masajecorporaldeportivo.com",
    "www.masajecorporaldeportivo.com"
  ]
}
```

---

## 📊 TABLA DE CLIENTES

| Cliente | URL Estática | Tenant Slug | Estado |
|---------|-------------|-------------|--------|
| Masaje Corporal Deportivo | https://masajecorporaldeportivo.vercel.app | `masajecorporaldeportivo` | ✅ Activo |
| *(Futuro Cliente 2)* | https://[nombre].vercel.app | `[slug]` | ⏳ Pendiente |
| *(Futuro Cliente 3)* | https://[nombre].vercel.app | `[slug]` | ⏳ Pendiente |

---

## 🎯 VENTAJAS DE ESTE SISTEMA

### 1. **URLs Profesionales**
```
✅ https://masajecorporaldeportivo.vercel.app
❌ https://clinic-frontend-abc123xyz.vercel.app
```

### 2. **Estabilidad**
- La URL nunca cambia aunque hagas 100 despliegues
- Los clientes pueden guardar la URL sin miedo a que se rompa

### 3. **Multi-tenant Real**
- Cada cliente tiene su URL única
- Mismo código, múltiples marcas
- Fácil de escalar a nuevos clientes

### 4. **SEO-Friendly**
- URLs descriptivas
- Mejor posicionamiento en buscadores
- Más profesional para compartir

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Alias vs Dominios Personalizados

**Alias (*.vercel.app):**
- ✅ Gratis e inmediato
- ✅ No requiere configuración DNS
- ✅ Perfecto para testing/producción
- ❌ No es tu propio dominio

**Dominios Personalizados:**
- ✅ Tu propia marca (masajecorporaldeportivo.com)
- ✅ Más profesional
- ❌ Requiere comprar dominio
- ❌ Configuración DNS necesaria

### 🔒 Certificados SSL
Vercel proporciona **SSL automático y gratuito** para:
- Todos los subdominios *.vercel.app
- Todos los dominios personalizados

### 🌍 Geo-Replicación
Todos los alias heredan la configuración de regiones:
```json
"regions": ["cdg1"]  // París, Francia
```

---

## 🚨 TROUBLESHOOTING

### Problema: El alias no funciona
```bash
# 1. Verificar que el proyecto existe
vercel ls

# 2. Reasignar el alias manualmente
vercel alias set [deployment-url] masajecorporaldeportivo.vercel.app

# 3. Verificar que se asignó
vercel alias ls
```

### Problema: 404 en el alias
- Espera 1-2 minutos para propagación DNS
- Limpia caché del navegador (Ctrl+Shift+R)
- Verifica que el deployment existe en Vercel dashboard

### Problema: Varios clientes muestran el mismo contenido
- Verifica que `X-Tenant-Slug` header se envía correctamente
- Revisa `client.config.ts` → cada cliente debe tener su `slug` único
- Comprueba que el middleware `loadTenant` está activo

---

## ✅ RESUMEN EJECUTIVO

**URL ESTÁTICA CONFIGURADA:**
```
https://masajecorporaldeportivo.vercel.app
```

**Comando usado:**
```bash
vercel alias set clinic-frontend-p1xqdrysv-davids-projects-8fa96e54.vercel.app masajecorporaldeportivo.vercel.app
```

**Resultado:**
✅ Alias asignado correctamente (2 segundos)

**Próximos pasos:**
1. Accede a https://masajecorporaldeportivo.vercel.app
2. Verifica que todo funciona (archivos, CSV, precios)
3. Guarda esta URL como la oficial del cliente

---

**Documentación completa de URLs estáticas por cliente - Sistema Multi-tenant**
