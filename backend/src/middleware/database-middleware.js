const { getDbManager } = require('../database/database-manager');

// Inicializar el manager al cargar el módulo
let dbManager = null;
(async () => {
  try {
    dbManager = await getDbManager();
  } catch (error) {
    console.warn('⚠️ Error inicializando DB Manager en middleware:', error.message);
  }
})();

/**
 * Middleware que inyecta el cliente Supabase compatible con Prisma en el objeto request
 * Permite una transición suave de las rutas existentes sin reescribir todo
 */
function injectDatabaseMiddleware(req, res, next) {
  try {
    console.log('🛠️ Middleware DB ejecutándose para:', req.method, req.originalUrl);
    
    // Si la base de datos está conectada, inyectar el cliente normalmente
    if (dbManager && dbManager.isConnected) {
      req.prisma = dbManager.createPrismaCompatibleInterface();
      req.dbManager = dbManager;
      req.dbStatus = {
        connected: true,
        database: 'supabase-postgresql',
        preferred: true
      };

      console.log('✅ Cliente Supabase inyectado para:', req.method, req.originalUrl);
      
      // Agregar header con información de la base de datos actual
      res.set('X-Database', 'supabase-postgresql');
      res.set('X-Database-Preferred', 'true');

      return next();
    }

    // Modo degradado: permitir operaciones de solo lectura (GET) para que la
    // aplicación siga funcionando en desarrollo sin Supabase.
    console.warn('⚠️ DB Manager no disponible, entrando en modo degradado para:', req.method, req.originalUrl);
    res.set('X-Database', 'degraded');
    res.set('X-Database-Preferred', 'false');

    // Inyectar metadata mínima para que handlers puedan detectar el estado
    req.prisma = null; // no hay cliente disponible
    req.dbManager = dbManager;
    req.dbStatus = {
      connected: false,
      database: 'supabase-postgresql',
      preferred: true
    };

    // Verificar si hay conexión a la base de datos
  console.log('🔍 Verificando conexión DB:', {
    isConnected: dbManager.isConnected,
    hasSupabase: !!dbManager.supabase,
    method: req.method,
    url: req.originalUrl
  });

  if (!dbManager.isConnected) {
    // Para GETs permitimos continuar; para métodos que modifican datos, intentar conectar directamente
    if (req.method === 'GET' || req.method === 'HEAD') {
      console.warn('⚠️ Petición en modo degradado (lectura):', req.method, req.originalUrl);
      return next();
    }

    // Para peticiones POST/PUT/DELETE, intentar usar el cliente directo
    console.warn('⚠️ Intentando operación de escritura en modo degradado:', req.method, req.originalUrl);
    try {
      if (dbManager.supabase) {
        req.prisma = dbManager.createPrismaCompatibleInterface();
        console.log('🔧 Cliente Supabase directo asignado para escritura');
        return next();
      } else {
        throw new Error('No hay cliente Supabase disponible');
      }
    } catch (e) {
      console.error('❌ Error al obtener cliente Supabase directo:', e.message);
      return res.status(503).json({
        error: 'Servicio degradado',
        message: 'No se puede conectar a la base de datos. Intente de nuevo más tarde.',
        method: req.method
      });
    }
  }

  } catch (error) {
    console.error('❌ Error en middleware de base de datos:', error);
    res.status(500).json({
      error: 'Error de conexión a base de datos',
      message: 'No se pudo establecer conexión con la base de datos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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
