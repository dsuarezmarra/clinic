/**
 * Middleware de Tenant
 * 
 * Este middleware detecta el tenant desde los headers de la petición,
 * busca su configuración en la tabla tenants, y prepara helpers
 * para usar las tablas con el sufijo correcto.
 */

// Whitelist de tenants válidos (previene IDOR)
const VALID_TENANT_SLUGS = [
  'masajecorporaldeportivo',
  'actifisio'
];

/**
 * Valida y sanitiza el slug del tenant
 * - Solo permite caracteres alfanuméricos y guiones
 * - Verifica contra whitelist
 */
function validateTenantSlug(slug) {
  if (!slug || typeof slug !== 'string') return { valid: false, reason: 'Slug vacío o inválido' };
  
  // Sanitizar: solo letras minúsculas, números y guiones
  const sanitized = slug.toLowerCase().trim();
  if (!/^[a-z0-9-]+$/.test(sanitized)) {
    return { valid: false, reason: 'Slug contiene caracteres no permitidos' };
  }
  
  // Verificar longitud
  if (sanitized.length < 3 || sanitized.length > 50) {
    return { valid: false, reason: 'Longitud de slug inválida' };
  }
  
  // Verificar contra whitelist
  if (!VALID_TENANT_SLUGS.includes(sanitized)) {
    console.warn(`?? Intento de acceso con tenant no autorizado: ${sanitized}`);
    return { valid: false, reason: 'Tenant no autorizado' };
  }
  
  return { valid: true, sanitized };
}

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
 * Middleware para cargar informaciÃ³n del tenant
 */
async function loadTenant(req, res, next) {
  try {
    // 1. Obtener y validar slug del tenant desde header
    const tenantSlug = req.headers['x-tenant-slug'];
    
    if (!tenantSlug) {
      return res.status(400).json({ 
        error: 'Tenant no especificado',
        message: 'Header X-Tenant-Slug requerido'
      });
    }
    
    // 2. Validar slug contra whitelist (previene IDOR)
    const validation = validateTenantSlug(tenantSlug);
    if (!validation.valid) {
      return res.status(403).json({ 
        error: 'Tenant no válido',
        message: validation.reason
      });
    }
    
    // 3. Buscar tenant en base de datos (usando slug sanitizado)
    const { data: tenants, error } = await supabaseFetch(
      `tenants?select=*&slug=eq.${validation.sanitized}&active=eq.true&limit=1`
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
    
    // 3. Guardar informaciÃ³n del tenant en request
    req.tenant = tenant;
    req.tableSuffix = tenant.table_suffix;
    
    // 4. Helper function para construir nombres de tabla dinÃ¡micamente
    req.getTable = (baseTable) => {
      return `${baseTable}_${req.tableSuffix}`;
    };
    
    // 5. Log para debugging (opcional, remover en producciÃ³n)
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
 * Middleware opcional: verificar que el tenant estÃ© activo
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
