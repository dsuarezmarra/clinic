# 🚀 GUÍA RÁPIDA: DEPLOY DE CLIENTES

**Fecha:** 04/10/2025  
**Versión:** 2.4.10

---

## ⚡ COMANDOS RÁPIDOS

### Deploy Actifisio

```powershell
.\DEPLOY_ACTIFISIO.ps1
```

**Resultado:**

- ✅ Build de producción
- ✅ Inyección de CLIENT_ID
- ✅ Configuración de routing SPA
- ✅ Deploy a Vercel
- ✅ Alias actualizado
- 🌐 **URL:** https://actifisio.vercel.app

---

### Deploy Masaje Corporal Deportivo

```powershell
.\DEPLOY_MASAJE_CORPORAL.ps1
```

**Resultado:**

- ✅ Build de producción
- ✅ Inyección de CLIENT_ID
- ✅ Configuración de routing SPA
- ✅ Deploy a Vercel
- ✅ Alias actualizado
- 🌐 **URL:** https://masajecorporaldeportivo.vercel.app

---

## 📋 QUÉ HACE CADA SCRIPT

### Proceso Automático (8 pasos)

1. **Navegación** → `frontend/`
2. **Limpieza** → Elimina build anterior
3. **Build** → `ng build --configuration=production`
4. **Inyección** → `window.__CLIENT_ID` en HTML
5. **Config Vercel** → Crea `vercel.json` para SPA routing
6. **Deploy** → `vercel --prod`
7. **Alias** → Actualiza dominio personalizado
8. **Resumen** → Muestra URLs finales

**Tiempo estimado:** 30-60 segundos por cliente

---

## 🎯 CUÁNDO USAR

### Deploy Actifisio

- Cambios en código frontend
- Actualización de estilos/tema
- Cambios en configuración de Actifisio
- Fix de bugs específicos de Actifisio

### Deploy Masaje Corporal

- Cambios en código frontend
- Actualización de estilos/tema
- Cambios en configuración de Masaje Corporal
- Fix de bugs específicos de Masaje Corporal

### ⚠️ Deploy de Ambos

Si cambias algo que afecta a AMBOS clientes (código compartido):

```powershell
# Primero uno
.\DEPLOY_MASAJE_CORPORAL.ps1

# Esperar a que termine (60 seg)

# Luego el otro
.\DEPLOY_ACTIFISIO.ps1
```

**O usa el script combinado:**

```powershell
.\DEPLOY_TODOS_CLIENTES.ps1  # TODO: Crear este script
```

---

## ✅ VERIFICACIÓN POST-DEPLOY

### Checklist por Cliente

**Actifisio:**

1. ✅ Abre: https://actifisio.vercel.app
2. ✅ Verifica tema naranja/amarillo
3. ✅ Console sin errores
4. ✅ Navega a lista de pacientes
5. ✅ Abre detalle de paciente (NO debe dar 404)
6. ✅ Crea/edita/elimina sesión
7. ✅ Sube un archivo
8. ✅ Verifica calendario

**Masaje Corporal:**

1. ✅ Abre: https://masajecorporaldeportivo.vercel.app
2. ✅ Verifica tema azul/púrpura
3. ✅ Console sin errores
4. ✅ Navega a lista de pacientes
5. ✅ Abre detalle de paciente (NO debe dar 404)
6. ✅ Crea/edita/elimina sesión
7. ✅ Sube un archivo
8. ✅ Verifica calendario

---

## 🔧 TROUBLESHOOTING

### Error: "ng command not found"

```powershell
cd frontend
npm install -g @angular/cli
```

### Error: "vercel command not found"

```powershell
npm install -g vercel
```

### Error: "self-signed certificate"

**Ya está solucionado en los scripts** con:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

### Error 404 al navegar a rutas

**Causa:** Falta `vercel.json` o está mal configurado

**Solución:** Los scripts lo crean automáticamente. Si usas deploy manual:

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.csr.html"
    }
  ]
}
```

### CLIENT_ID incorrecto en producción

**Causa:** No se inyectó correctamente en el HTML

**Solución:** Los scripts lo hacen automáticamente. Verifica con:

```powershell
# Ver si está inyectado
Select-String -Path "frontend\dist\actifisio-build\browser\index.csr.html" -Pattern "__CLIENT_ID"
```

Debe mostrar:

```html
<script>
  window.__CLIENT_ID = "actifisio";
</script>
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
clinic/
├── DEPLOY_ACTIFISIO.ps1                    ← Script deploy Actifisio
├── DEPLOY_MASAJE_CORPORAL.ps1              ← Script deploy Masaje Corporal
├── DEPLOY_TODOS_CLIENTES.ps1               ← Script deploy ambos (TODO)
│
└── frontend/
    ├── dist/
    │   ├── actifisio-build/
    │   │   └── browser/
    │   │       ├── index.csr.html           ← HTML con CLIENT_ID inyectado
    │   │       ├── vercel.json              ← Config routing SPA
    │   │       └── ...
    │   │
    │   └── masajecorporaldeportivo-build/
    │       └── browser/
    │           ├── index.csr.html
    │           ├── vercel.json
    │           └── ...
    │
    └── src/
        └── config/
            └── clients/
                ├── actifisio.config.ts      ← Config Actifisio
                └── masajecorporaldeportivo.config.ts
```

---

## 🎓 NOTAS IMPORTANTES

### ⚠️ NUNCA edites estos archivos manualmente:

- `dist/*/browser/index.csr.html` (se sobrescribe en cada build)
- `dist/*/browser/vercel.json` (se genera automáticamente)

### ✅ SÍ edita estos archivos:

- `frontend/src/config/clients/*.config.ts` (configuración de clientes)
- `frontend/src/**/*.ts` (código fuente)
- `frontend/src/**/*.scss` (estilos)

### 📝 Workflow recomendado:

1. **Editar código** → Cambios en `frontend/src/`
2. **Commit local** → `git add . && git commit -m "feat: ..."`
3. **Deploy** → `.\DEPLOY_ACTIFISIO.ps1` o `.\DEPLOY_MASAJE_CORPORAL.ps1`
4. **Testing** → Verificar en producción
5. **Push a Git** → `git push` (después de verificar que funciona)

---

## 🚀 PRÓXIMOS PASOS

### Script Combinado (TODO)

Crear `DEPLOY_TODOS_CLIENTES.ps1` que:

1. Hace build de ambos clientes en paralelo (si es posible)
2. Deploy secuencial
3. Reporte consolidado

### CI/CD con GitHub Actions (TODO)

Automatizar deploy cuando se hace push a `main`:

- Detectar qué cliente cambió
- Deploy automático solo del cliente afectado
- Notificación de éxito/error

---

**Última actualización:** 04/10/2025  
**Autor:** GitHub Copilot  
**Estado:** ✅ SCRIPTS LISTOS Y PROBADOS
