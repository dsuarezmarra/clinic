/**
 * Middleware de Autenticacion con Supabase Auth
 * 
 * Valida el JWT de Supabase enviado en el header Authorization.
 * Los tokens son generados por Supabase Auth cuando el usuario hace login.
 */

const { createClient } = require('@supabase/supabase-js');

// Crear cliente Supabase para validar tokens
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
}

/**
 * Extrae el token JWT del header Authorization
 * Formato esperado: "Bearer <token>"
 */
function extractToken(authHeader) {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware que requiere autenticacion.
 * Valida el JWT y agrega req.user con la info del usuario.
 * 
 * Uso:
 *   router.get('/protected', requireAuth, (req, res) => { ... });
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token de autenticacion no proporcionado'
      });
    }
    
    const client = getSupabaseClient();
    if (!client) {
      console.error('[Auth] Supabase client not available');
      return res.status(500).json({
        error: 'Error de configuracion',
        message: 'Servicio de autenticacion no disponible'
      });
    }
    
    // Verificar el token con Supabase
    const { data: { user }, error } = await client.auth.getUser(token);
    
    if (error || !user) {
      console.log('[Auth] Token validation failed:', error?.message || 'No user');
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token invalido o expirado'
      });
    }
    
    // Verificar que el usuario pertenece al tenant actual (si hay header X-Tenant-Slug)
    const tenantSlug = req.headers['x-tenant-slug'];
    const userTenant = user.user_metadata?.tenant_slug;
    
    if (tenantSlug && userTenant && userTenant !== tenantSlug) {
      console.log(`[Auth] Tenant mismatch: user=${userTenant}, request=${tenantSlug}`);
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Este usuario no tiene acceso a esta clinica'
      });
    }
    
    // Agregar info del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      tenantSlug: userTenant || tenantSlug,
      metadata: user.user_metadata
    };
    
    console.log(`[Auth] User authenticated: ${user.email} (tenant: ${req.user.tenantSlug})`);
    
    next();
  } catch (error) {
    console.error('[Auth] Unexpected error:', error);
    return res.status(500).json({
      error: 'Error de autenticacion',
      message: 'Error al validar credenciales'
    });
  }
}

/**
 * Middleware opcional que intenta autenticar pero no bloquea si no hay token.
 * Util para rutas que funcionan tanto autenticadas como anonimas.
 * 
 * Uso:
 *   router.get('/optional-auth', optionalAuth, (req, res) => {
 *     if (req.user) { ... } else { ... }
 *   });
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      // Sin token, continuar sin usuario
      req.user = null;
      return next();
    }
    
    const client = getSupabaseClient();
    if (!client) {
      req.user = null;
      return next();
    }
    
    const { data: { user }, error } = await client.auth.getUser(token);
    
    if (error || !user) {
      req.user = null;
      return next();
    }
    
    // Token valido, agregar usuario
    req.user = {
      id: user.id,
      email: user.email,
      tenantSlug: user.user_metadata?.tenant_slug,
      metadata: user.user_metadata
    };
    
    next();
  } catch (error) {
    // En caso de error, continuar sin usuario
    req.user = null;
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  extractToken
};
