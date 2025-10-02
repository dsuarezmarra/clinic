/**
 * Middleware de Tenant
 * 
 * Este middleware detecta el tenant desde los headers de la petición,
 * busca su configuración en la tabla tenants, y prepara helpers
 * para usar las tablas con el sufijo correcto.
 */

// Helper para hacer peticiones a Supabase
async function supabaseFetch(endpoint) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    return { data: null, error: data };
  }
  
  return { data, error: null };
}

/**
 * Middleware para cargar información del tenant
 */
async function loadTenant(req, res, next) {
  try {
    // 1. Obtener slug del tenant desde header
    const tenantSlug = req.headers['x-tenant-slug'];
    
    if (!tenantSlug) {
      return res.status(400).json({ 
        error: 'Tenant no especificado',
        message: 'Header X-Tenant-Slug requerido'
      });
    }
    
    // 2. Buscar tenant en base de datos
    const { data: tenants, error } = await supabaseFetch(
      `tenants?select=*&slug=eq.${tenantSlug}&active=eq.true&limit=1`
    );
    
    if (error) {
      console.error('Error fetching tenant:', error);
      return res.status(500).json({ 
        error: 'Error al cargar tenant',
        message: error.message 
      });
    }
    
    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ 
        error: 'Tenant no encontrado',
        message: `No existe un tenant activo con slug: ${tenantSlug}`
      });
    }
    
    const tenant = tenants[0];
    
    // 3. Guardar información del tenant en request
    req.tenant = tenant;
    req.tableSuffix = tenant.table_suffix;
    
    // 4. Helper function para construir nombres de tabla dinámicamente
    req.getTable = (baseTable) => {
      return `${baseTable}_${req.tableSuffix}`;
    };
    
    // 5. Log para debugging (opcional, remover en producción)
    console.log(`[Tenant] ${tenant.name} (${tenant.slug}) - ${req.method} ${req.path}`);
    
    next();
  } catch (error) {
    console.error('Error in loadTenant middleware:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}

/**
 * Middleware opcional: verificar que el tenant esté activo
 */
function requireActiveTenant(req, res, next) {
  if (!req.tenant) {
    return res.status(401).json({ 
      error: 'Tenant no cargado',
      message: 'Debe pasar por el middleware loadTenant primero'
    });
  }
  
  if (!req.tenant.active) {
    return res.status(403).json({ 
      error: 'Tenant inactivo',
      message: 'Este tenant ha sido desactivado'
    });
  }
  
  next();
}

module.exports = {
  loadTenant,
  requireActiveTenant
};
