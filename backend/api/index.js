// Vercel Serverless Function Entry Point
// Este archivo adapta nuestra aplicaci�n Express para funcionar en Vercel

// ?? SSL bypass SOLO para desarrollo local (nunca en producci�n)
if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_TLS_CHECK === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('?? ADVERTENCIA: SSL verification deshabilitada (solo desarrollo)');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// ============================================
// RATE LIMITING - Protecci�n contra brute force
// ============================================
const rateLimitStore = new Map();

/**
 * Rate limiter simple sin dependencias externas
 * Limpia entradas antiguas cada 5 minutos
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,        // 1 minuto por defecto
    max = 100,                    // 100 requests por ventana
    message = 'Demasiadas solicitudes, intente m�s tarde',
    skipInDevelopment = false
  } = options;

  return (req, res, next) => {
    // Opcionalmente saltar en desarrollo
    if (skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next();
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               'unknown';
    
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    
    // Obtener o crear registro
    let record = rateLimitStore.get(key);
    if (!record || now - record.windowStart > windowMs) {
      record = { count: 0, windowStart: now };
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    
    // Headers informativos
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.windowStart + windowMs).toISOString());
    
    if (record.count > max) {
      console.warn(`?? Rate limit excedido para IP: ${ip}, path: ${req.path}`);
      return res.status(429).json({ 
        error: message,
        retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000)
      });
    }
    
    next();
  };
};

// Limpiar store cada 5 minutos para evitar memory leaks
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Rate limiters configurados para diferentes endpoints
const generalLimiter = createRateLimiter({ 
  windowMs: 60 * 1000,  // 1 minuto
  max: 100,             // 100 req/min general
  skipInDevelopment: true
});

const strictLimiter = createRateLimiter({ 
  windowMs: 60 * 1000,  // 1 minuto
  max: 10,              // 10 req/min para endpoints sensibles
  message: 'Demasiados intentos, espere un minuto'
});

const backupLimiter = createRateLimiter({ 
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 5,                     // 5 backups por hora
  message: 'L�mite de backups alcanzado, intente en una hora'
});

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// CORS con whitelist de dominios permitidos
const ALLOWED_ORIGINS = [
  'https://masajecorporaldeportivo.vercel.app',
  'https://actifisio.vercel.app',
  'http://localhost:4200',
  'http://localhost:4300',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Permitir origen si est� en la whitelist
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // En desarrollo, permitir cualquier localhost
    if (origin && origin.includes('localhost')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Requested-With, Accept, Content-Length');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de seguridad con Helmet configurado correctamente
app.use(helmet({
  // CSP configurado para API REST (sin contenido HTML)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  // Headers de seguridad adicionales
  crossOriginEmbedderPolicy: false,  // Necesario para CORS
  crossOriginResourcePolicy: { policy: "cross-origin" },  // Permitir recursos cross-origin
  hsts: {
    maxAge: 31536000,  // 1 a�o
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(compression());

// Health check endpoint - simple sin base de datos para pruebas iniciales
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'clinic-backend',
    version: '1.0.0'
  });
});

// Diagn�stico de variables de entorno (SOLO desarrollo)
app.get('/api/env-check', (req, res) => {
  // ?? Bloquear en producci�n
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL ? '? Configurada' : '? NO configurada',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '? Configurada' : '? NO configurada',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '? Configurada' : '? NO configurada',
    DATABASE_URL: process.env.DATABASE_URL ? '? Configurada' : '? NO configurada',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  res.json({
    message: 'Diagn�stico de variables de entorno (solo dev)',
    variables: envVars
  });
});

// Test endpoint directo a Supabase (sin middleware)
app.get('/api/test-direct', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();
    
    console.log('?? Test directo a Supabase...');
    console.log('   URL: [CONFIGURADA]');
    console.log('   KEY: [CONFIGURADA]');
    
    if (!url || !key) {
      return res.status(500).json({
        error: 'Variables de entorno no configuradas',
        urlLength: url.length,
        keyLength: key.length
      });
    }
    
    // Crear cliente con la configuración más simple posible
    const supabase = createClient(url, key);
    
    console.log('✅ Cliente Supabase creado');
    
    const { data, error, count } = await supabase
      .from('patients')
      .select('id, firstName, lastName, dni, phone', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error de Supabase:', JSON.stringify(error));
      return res.status(500).json({
        error: 'Error consultando Supabase',
        details: error,
        urlUsed: url.substring(0, 40) + '...',
        keyLength: key.length
      });
    }
    
    console.log(`✅ Éxito: ${count} pacientes, devolviendo ${data.length}`);
    
    return res.json({
      success: true,
      total: count,
      patients: data
    });
    
  } catch (err) {
    console.error('💥 Excepción en test directo:', err);
    return res.status(500).json({
      error: 'Excepción en servidor',
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});

// Test endpoint usando fetch directo (sin SDK)
app.get('/api/test-fetch', async (req, res) => {
  try {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();
    
    console.log('🧪 Test con fetch directo...');
    console.log('   URL:', url);
    console.log('   KEY length:', key.length);
    
    if (!url || !key) {
      return res.status(500).json({
        error: 'Variables no configuradas',
        urlLength: url.length,
        keyLength: key.length
      });
    }
    
    const apiUrl = `${url}/rest/v1/patients?select=id,firstName,lastName,dni,phone&limit=5`;
    
    console.log('   Calling:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    console.log('   Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Error from Supabase',
        status: response.status,
        data: data
      });
    }
    
    const countHeader = response.headers.get('content-range');
    const count = countHeader ? parseInt(countHeader.split('/')[1]) : data.length;
    
    return res.json({
      success: true,
      total: count,
      patients: data
    });
    
  } catch (err) {
    console.error('💥 Exception:', err);
    return res.status(500).json({
      error: 'Exception',
      message: err.message
    });
  }
});

// Importar rutas solo si hay DB configurada
if (process.env.DATABASE_URL || process.env.SUPABASE_URL) {
  try {
    console.log('🔧 Configurando base de datos...');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ NO configurado');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurado' : '❌ NO configurado');
    console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Configurado' : '❌ NO configurado');
    console.log('   USE_SUPABASE:', process.env.USE_SUPABASE);
    
    // 🌉 BRIDGE ROUTES: Usar fetch directo (funciona en Vercel)
    const bridgeRoutes = require('../src/routes/bridge');
    app.use('/api', generalLimiter, bridgeRoutes);
    console.log('Bridge routes con rate limiting cargadas');
    
    // ⚠️ IMPORTANTE: Aplicar middleware de database ANTES de las rutas legacy
    const databaseMiddleware = require('../src/middleware/database-middleware');
    app.use(databaseMiddleware);
    console.log('✅ Middleware de database aplicado');
    
    // Rutas legacy (con SDK - pueden no funcionar en Vercel)
    const configRoutes = require('../src/routes/config');
    const locationsRoutes = require('../src/routes/locations');
    const backupRoutes = require('../src/routes/backup');
    const filesRoutes = require('../src/routes/files');
    const reportsRoutes = require('../src/routes/reports');
    const statsRoutes = require('../src/routes/stats');

// Registrar rutas legacy con rate limiting
    app.use('/api/config', generalLimiter, configRoutes);
    app.use('/api/locations', generalLimiter, locationsRoutes);
    app.use('/api/backup', backupLimiter, backupRoutes);  // 5 req/hora max
    app.use('/api/files', generalLimiter, filesRoutes);
    app.use('/api/reports', generalLimiter, reportsRoutes);
    app.use('/api/stats', generalLimiter, statsRoutes);

    console.log('Todas las rutas cargadas con rate limiting');
  } catch (error) {
    console.error('⚠️  Error cargando rutas:', error.message);
    console.error('Las rutas de API no estarán disponibles hasta configurar las variables de entorno');
  }
} else {
  console.log('⚠️  Variables de entorno no configuradas. Solo /health disponible.');
}

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Clínica Masaje Corporal Deportivo - API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    },
    status: process.env.DATABASE_URL ? 'configured' : 'awaiting-configuration'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    message: 'La ruta solicitada no existe'
  });
});

// Exportar para Vercel
module.exports = app;
