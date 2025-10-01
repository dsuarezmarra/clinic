# 🚀 Scripts de Deployment

Scripts de ayuda para desplegar la aplicación en diferentes plataformas.

## 📁 Contenido

- `deploy-vercel.ps1` - Script PowerShell para desplegar en Vercel (Windows)
- `deploy-vercel.sh` - Script Bash para desplegar en Vercel (Linux/Mac)

## 🔧 Uso

### Windows (PowerShell)

```powershell
# Desde la raíz del proyecto
.\scripts\deploy-vercel.ps1
```

### Linux/Mac (Bash)

```bash
# Dar permisos de ejecución (solo primera vez)
chmod +x scripts/deploy-vercel.sh

# Ejecutar
./scripts/deploy-vercel.sh
```

## ⚙️ Requisitos previos

1. **Vercel CLI instalado**:

   ```bash
   npm install -g vercel
   ```

2. **Autenticado en Vercel**:

   ```bash
   vercel login
   ```

3. **Variables de entorno configuradas** en Vercel Dashboard (ver DEPLOY_VERCEL.md)

## 📝 Notas

- Los scripts despliegan automáticamente backend y frontend
- Detectan las URLs generadas por Vercel
- Muestran instrucciones para completar la configuración

## 🆘 Troubleshooting

Si los scripts no funcionan:

1. Verifica que Vercel CLI esté instalado: `vercel --version`
2. Asegúrate de estar autenticado: `vercel whoami`
3. Ejecuta manualmente siguiendo la guía en `DEPLOY_VERCEL.md`
