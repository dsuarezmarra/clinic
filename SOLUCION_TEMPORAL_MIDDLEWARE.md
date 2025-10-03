# 🔧 SOLUCIÓN TEMPORAL - Backend Multi-Tenant

El backend está crasheando después de inicializar. Esto ocurre porque el middleware async puede estar causando un problema durante la inicialización.

## Solución Inmediata

**Revertir temporalmente el middleware a versión síncrona**, crear el DatabaseManager bajo demanda:

```javascript
// database-middleware.js - Versión simplificada temporal
const { DatabaseManager } = require("../database/database-manager");

// Caché de instancias por tenant
const tenantManagers = new Map();

async function getManagerForTenant(tenantSlug) {
  const cacheKey = tenantSlug || "legacy";

  if (!tenantManagers.has(cacheKey)) {
    const manager = new DatabaseManager(tenantSlug);
    await manager.initialize();
    tenantManagers.set(cacheKey, manager);
  }

  return tenantManagers.get(cacheKey);
}

function injectDatabaseMiddleware(req, res, next) {
  const tenantSlug = req.headers["x-tenant-slug"];

  // Inicializar de forma asíncrona pero no bloquear
  getManagerForTenant(tenantSlug)
    .then((dbManager) => {
      if (dbManager && dbManager.isConnected) {
        req.prisma = dbManager.createPrismaCompatibleInterface();
        req.dbManager = dbManager;
        next();
      } else {
        req.prisma = null;
        req.dbManager = null;
        next();
      }
    })
    .catch((err) => {
      console.error("Error inicializando DB Manager:", err);
      req.prisma = null;
      next();
    });
}
```

## Siguiente Paso

Aplicar este parche temporal para desbloquear el testing.
