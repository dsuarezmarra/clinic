# ⚡ Comandos Rápidos para Desplegar

## 🚀 Despliegue Completo (Automático)

### Windows (PowerShell)

```powershell
# Desde la raíz del proyecto
.\scripts\deploy-vercel.ps1
```

### Linux/Mac

```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

---

## 📦 Despliegue Manual

### 1. Instalar Vercel CLI

```powershell
npm install -g vercel
```

### 2. Login

```powershell
vercel login
```

### 3. Desplegar Backend

```powershell
cd backend
vercel --prod
```

### 4. Desplegar Frontend

```powershell
cd ../frontend
vercel --prod
```

---

## 🔄 Actualizar Despliegue Existente

```powershell
# Hacer cambios en el código
git add .
git commit -m "Descripción de cambios"
git push origin main

# Redesplegar backend
cd backend
vercel --prod

# Redesplegar frontend
cd ../frontend
vercel --prod
```

---

## 🛠️ Comandos Útiles

### Ver logs en tiempo real

```powershell
vercel logs https://tu-backend.vercel.app --follow
```

### Listar deployments

```powershell
vercel list
```

### Ver información del proyecto

```powershell
vercel inspect
```

### Ver whoami (usuario actual)

```powershell
vercel whoami
```

### Eliminar un proyecto

```powershell
vercel remove nombre-proyecto
```

---

## 🧪 Testing Local Antes de Desplegar

### Backend

```powershell
cd backend
npm run dev
# Abrir: http://localhost:3000/health
```

### Frontend

```powershell
cd frontend
npm start
# Abrir: http://localhost:4300
```

### Ambos (desde VSCode)

```
Terminal → Run Task → "Start Both Servers"
```

---

## 📊 Verificar Deployment

### Backend funcionando

```powershell
curl https://tu-backend.vercel.app/health
```

O en PowerShell:

```powershell
Invoke-WebRequest -Uri "https://tu-backend.vercel.app/health" | Select-Object -Expand Content
```

### Frontend funcionando

Abre en navegador:

```
https://tu-frontend.vercel.app
```

---

## 🔧 Variables de Entorno

### Ver variables (desde dashboard)

```
https://vercel.com/dashboard → Proyecto → Settings → Environment Variables
```

### Actualizar variables desde CLI

```powershell
vercel env add NOMBRE_VARIABLE production
# Ingresa el valor cuando lo pida
```

### Listar variables

```powershell
vercel env ls
```

---

## 🌐 Configurar Dominio Personalizado

### Añadir dominio desde CLI

```powershell
vercel domains add tudominio.com
```

### Ver dominios configurados

```powershell
vercel domains ls
```

---

## 🚨 Troubleshooting

### Ver logs de error

```powershell
vercel logs https://tu-proyecto.vercel.app
```

### Forzar rebuild

```powershell
vercel --force
```

### Desplegar en ambiente preview (no producción)

```powershell
vercel
```

### Rollback a deployment anterior

1. Ve a Dashboard: https://vercel.com/dashboard
2. Click en el proyecto
3. Deployments → Click en deployment anterior → Promote to Production

---

## 📝 Git Workflow Recomendado

```powershell
# 1. Crear rama para cambios
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "Descripción"

# 3. Probar localmente
npm run dev

# 4. Merge a main
git checkout main
git merge feature/nueva-funcionalidad

# 5. Push y desplegar
git push origin main

# 6. Desplegar en Vercel
vercel --prod
```

---

## 🔐 Seguridad

### NUNCA subir a Git:

- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ Credenciales de Supabase
- ❌ API keys

### Verificar antes de commit:

```powershell
git status
git diff
```

### Si subiste algo sensible por error:

```powershell
# Quitar del último commit
git reset HEAD~1

# Limpiar historial (avanzado)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📚 Recursos

- **Vercel Docs**: https://vercel.com/docs
- **CLI Reference**: https://vercel.com/docs/cli
- **Tu Dashboard**: https://vercel.com/dashboard
- **Guías del proyecto**:
  - `GUIA_RAPIDA_DESPLIEGUE.md`
  - `DEPLOY_VERCEL.md`
  - `DEPLOY_CHECKLIST.md`

---

## ⚡ Atajos de Teclado (Vercel Dashboard)

- `G` + `D` → Go to Dashboard
- `G` + `P` → Go to Projects
- `G` + `S` → Go to Settings
- `/` → Search

---

## 💡 Tips Pro

1. **Despliegue automático**: Conecta GitHub para deploy automático en cada push
2. **Preview deployments**: Cada PR genera una URL de preview automática
3. **Variables de entorno por entorno**: Configura diferentes valores para production/preview
4. **Aliases**: Crea URLs permanentes con `vercel alias`
5. **Monitoring**: Activa alertas para errores o caídas

---

## 🎯 Checklist Pre-Deploy

- [ ] Código probado localmente
- [ ] Tests pasando (si los tienes)
- [ ] Variables de entorno configuradas
- [ ] `.gitignore` actualizado
- [ ] Cambios commiteados
- [ ] URL del backend actualizada en frontend
- [ ] CORS configurado correctamente

---

¡Listo para desplegar! 🚀
