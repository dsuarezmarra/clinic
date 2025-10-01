// Vercel Serverless Function Entry Point
// Este archivo adapta nuestra aplicación Express para funcionar en Vercel

// Deshabilitar SSL verification para Supabase en red corporativa
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// CORS manual para Vercel Serverless
app.use((req, res, next) => {
  // Permitir todos los orígenes en producción por ahora
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de seguridad (después de CORS)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
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

// Diagnóstico de variables de entorno
app.get('/api/env-check', (req, res) => {
  const envVars = {
    SUPABASE_URL: process.env.SUPABASE_URL ? `✅ ${process.env.SUPABASE_URL.substring(0, 30)}...` : '❌ NO configurada',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? `✅ Configurada (${process.env.SUPABASE_SERVICE_KEY.length} chars)` : '❌ NO configurada',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? `✅ Configurada (${process.env.SUPABASE_ANON_KEY.length} chars)` : '❌ NO configurada',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada',
    USE_SUPABASE: process.env.USE_SUPABASE || '❌ NO configurada',
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || '❌ NO configurada'
  };
  
  res.json({
    message: 'Diagnóstico de variables de entorno',
    variables: envVars,
    allEnvKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')).sort()
  });
});

// Test endpoint directo a Supabase (sin middleware)
app.get('/api/test-direct', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_KEY || '').trim();
    
    console.log('🧪 Test directo a Supabase...');
    console.log('   URL length:', url.length, 'chars');
    console.log('   KEY length:', key.length, 'chars');
    console.log('   URL:', url.substring(0, 40) + '...');
    console.log('   KEY starts:', key.substring(0, 20) + '...');
    
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
    app.use('/api', bridgeRoutes);
    console.log('✅ Bridge routes (fetch directo) cargadas');
    
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

    // Registrar rutas legacy
    app.use('/api/config', configRoutes);
    app.use('/api/locations', locationsRoutes);
    app.use('/api/backup', backupRoutes);
    app.use('/api/files', filesRoutes);
    app.use('/api/reports', reportsRoutes);

    console.log('✅ Todas las rutas cargadas correctamente');
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
