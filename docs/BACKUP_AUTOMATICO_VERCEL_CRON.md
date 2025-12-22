# ?? Configuración de Backups Automáticos con Vercel Cron Jobs

## ?? Resumen

El sistema de backups automáticos anterior usaba `node-cron` que **NO funciona en Vercel** porque:

- Vercel usa funciones serverless que se "duermen" cuando no hay tráfico
- Los cron jobs de node-cron requieren un proceso persistente

## ? Solución Implementada: Vercel Cron Jobs

### Cambios Realizados

#### 1. Nuevo Endpoint `/api/backup/cron`

**Archivo:** `backend/src/routes/backup.js`

```javascript
// Endpoint para Vercel Cron Jobs
router.get("/cron", async (req, res, next) => {
  // Verifica autorización con CRON_SECRET
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Ejecuta backup semanal
  const result = await backup.createBackup("weekly");
  res.json({ success: true, result });
});
```

#### 2. Configuración Cron en vercel.json

**Archivo:** `backend/vercel.json`

```json
"crons": [
  {
    "path": "/api/backup/cron",
    "schedule": "0 3 * * 0"
  }
]
```

**Schedule:** `0 3 * * 0` = Cada domingo a las 3:00 AM (UTC)

---

## ?? Configuración Pendiente en Vercel Dashboard

### Paso 1: Crear CRON_SECRET

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar proyecto `api-clinic-personal`
3. Ir a **Settings** ? **Environment Variables**
4. Agregar nueva variable:
   - **Name:** `CRON_SECRET`
   - **Value:** (generar un token seguro, ej: `openssl rand -hex 32`)
   - **Environment:** Production

### Paso 2: Deploy

```bash
cd backend
vercel --prod
```

### Paso 3: Verificar Cron Job

1. En Vercel Dashboard ? **Settings** ? **Crons**
2. Verificar que aparece el cron configurado
3. Puedes ejecutar manualmente para probar

---

## ?? Testing Manual

Para probar el endpoint manualmente:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  https://api-clinic-personal.vercel.app/api/backup/cron
```

Respuesta esperada:

```json
{
  "success": true,
  "result": {
    "message": "Backup weekly created successfully",
    "filename": "backup_weekly_20251004T030000.json"
  }
}
```

---

## ?? Schedule (Horario)

| Cron Expression | Descripción                      |
| --------------- | -------------------------------- |
| `0 3 * * 0`     | Domingos 3:00 AM UTC             |
| `0 3 * * *`     | Diario 3:00 AM UTC (alternativa) |
| `0 3 * * 1`     | Lunes 3:00 AM UTC                |

Para cambiar la frecuencia, modifica `schedule` en `vercel.json`.

---

## ?? Limitaciones

- **Vercel Hobby Plan:** 2 cron jobs, máximo 1 ejecución/día
- **Vercel Pro Plan:** Cron jobs ilimitados, hasta cada minuto
- Los cron jobs solo funcionan en **Production** deployments

---

## ?? Logs

Para ver logs de ejecución:

1. Vercel Dashboard ? **Deployments** ? Seleccionar deployment
2. **Functions** tab ? Ver logs de `/api/backup/cron`

---

**Fecha:** 04/10/2025  
**Estado:** ? Configurado - Pendiente deploy y configurar CRON_SECRET
