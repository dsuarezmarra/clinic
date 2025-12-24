const { DatabaseManager } = require('../database/database-manager');

// 🆕 Caché de instancias de DatabaseManager por tenant
const tenantManagers = new Map();

/**
 * 🆕 Obtiene o crea un DatabaseManager para el tenant especificado
 */
async function getManagerForTenant(tenantSlug) {
  const cacheKey = tenantSlug || 'legacy';
  
  if (!tenantManagers.has(cacheKey)) {
    console.log(`🔄 Creando nueva instancia de DatabaseManager para tenant: ${cacheKey}`);
    const manager = new DatabaseManager(tenantSlug);
    await manager.initialize();
    tenantManagers.set(cacheKey, manager);
  }
  
  return tenantManagers.get(cacheKey);
}

/**
 * ?? Middleware que inyecta el cliente Supabase compatible con Prisma en el objeto request
 * MULTI-TENANT: Crea una instancia de DatabaseManager con el tenantSlug del request
 */
function injectDatabaseMiddleware(req, res, next) {
  console.log('??? Middleware DB ejecut�ndose para:', req.method, req.originalUrl);
  
  // ?? Rutas que no requieren tenant (backup cron, health, etc.)
  const bypassTenantRoutes = ['/api/backup/cron', '/api/backup/list', '/api/backup/stats', '/api/backup/status', '/health'];
  const shouldBypassTenant = bypassTenantRoutes.some(route => req.originalUrl.startsWith(route));
  
  // ?? Obtener tenant slug del header
  // En desarrollo local (sin header), usar tenant por defecto
  const DEFAULT_LOCAL_TENANT = process.env.DEFAULT_TENANT || 'masajecorporaldeportivo';
  let tenantSlug = req.headers['x-tenant-slug'];
  
  // Detectar placeholder sin resolver (error de build)
  if (tenantSlug && tenantSlug.includes('__VITE_CLIENT_ID__')) {
    console.warn('?? [Warning] Se detect� placeholder sin resolver: __VITE_CLIENT_ID__');
    tenantSlug = null;
  }
  
  // Si no hay tenant y estamos en desarrollo, usar el por defecto
  if (!tenantSlug && process.env.NODE_ENV !== 'production' && !shouldBypassTenant) {
    tenantSlug = DEFAULT_LOCAL_TENANT;
    console.log(`?? [Local Dev] Usando tenant por defecto: ${tenantSlug}`);
  }
  
  if (tenantSlug) {
    console.log(`?? [Multi-Tenant] Tenant activo: ${tenantSlug}`);
  } else if (shouldBypassTenant) {
    console.log(`?? [Bypass] Ruta sin requerimiento de tenant: ${req.originalUrl}`);
  } else {
    console.log('?? [Warning] Sin tenant slug en producci�n - petici�n denegada');
  }
  
  // Para rutas bypass, simplemente pasar sin requerir DB manager
  if (shouldBypassTenant && !tenantSlug) {
    console.log(`?? [Bypass] Permitiendo acceso sin DB para: ${req.originalUrl}`);
    req.prisma = null;
    req.dbManager = null;
    req.dbStatus = { connected: false, bypass: true };
    return next();
  }
  
  // Inicializar de forma as�ncrona pero NO bloquear el servidor
  getManagerForTenant(tenantSlug)
    .then(dbManager => {
      // Si la base de datos está conectada, inyectar el cliente normalmente
      if (dbManager && dbManager.isConnected) {
        req.prisma = dbManager.createPrismaCompatibleInterface();
        req.dbManager = dbManager;
        req.dbStatus = {
          connected: true,
          database: 'supabase-postgresql',
          preferred: true,
          tenant: tenantSlug || 'legacy'
        };

        console.log(`✅ Cliente Supabase inyectado para: ${req.method} ${req.originalUrl} [Tenant: ${tenantSlug || 'legacy'}]`);
        
        // Agregar header con información de la base de datos actual
        res.set('X-Database', 'supabase-postgresql');
        res.set('X-Database-Preferred', 'true');
        if (tenantSlug) {
          res.set('X-Tenant-Active', tenantSlug);
        }

        next();
      } else {
        // Modo degradado
        console.warn('⚠️ DB Manager no disponible, entrando en modo degradado');
        req.prisma = null;
        req.dbManager = null;
        req.dbStatus = { connected: false };
        next();
      }
    })
    .catch(error => {
      console.error('❌ Error en middleware de base de datos:', error);
      req.prisma = null;
      req.dbManager = null;
      next();
    });
}

/**
 * Middleware para rutas que requieren base de datos preferida
 * Siempre permite el acceso ya que usamos Supabase directamente
 */
function requirePreferredDatabase(req, res, next) {
  // Con Supabase siempre tenemos la base de datos "preferida"
  next();
}

/**
 * Middleware para manejo de errores de base de datos con reconexión automática
 */
function handleDatabaseErrors(error, req, res, next) {
  // Manejo simple de errores de Supabase
  if (error.message?.includes('permission denied') ||
    error.message?.includes('timeout') ||
    error.message?.includes('network')) {

    console.log('🔄 Error de conexión Supabase detectado:', error.message);

    res.status(503).json({
      error: 'Error de conexión temporal',
      message: 'Error de conectividad con Supabase',
      retryAfter: 5,
      currentDatabase: 'supabase-postgresql'
    });

    return;
  }

  // Si no es un error de conexión, pasar al siguiente handler
  next(error);
}

module.exports = {
  injectDatabaseMiddleware,
  requirePreferredDatabase,
  handleDatabaseErrors
};
