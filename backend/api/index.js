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
    
    console.log('🧪 Test directo a Supabase...');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
    console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.status(500).json({
        error: 'Variables de entorno no configuradas',
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
        allEnvKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')).sort()
      });
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const { data, error, count } = await supabase
      .from('patients')
      .select('id, firstName, lastName, dni, phone', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('❌ Error de Supabase:', error);
      return res.status(500).json({
        error: 'Error consultando Supabase',
        details: error
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
      stack: err.stack
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
    
    // ⚠️ IMPORTANTE: Aplicar middleware de database ANTES de las rutas
    const databaseMiddleware = require('../src/middleware/database-middleware');
    app.use(databaseMiddleware);
    console.log('✅ Middleware de database aplicado');
    
    const patientsRoutes = require('../src/routes/patients');
    const appointmentsRoutes = require('../src/routes/appointments');
    const creditsRoutes = require('../src/routes/credits');
    const configRoutes = require('../src/routes/config');
    const locationsRoutes = require('../src/routes/locations');
    const backupRoutes = require('../src/routes/backup');
    const filesRoutes = require('../src/routes/files');
    const reportsRoutes = require('../src/routes/reports');

    // Registrar rutas
    app.use('/api/patients', patientsRoutes);
    app.use('/api/appointments', appointmentsRoutes);
    app.use('/api/credits', creditsRoutes);
    app.use('/api/config', configRoutes);
    app.use('/api/locations', locationsRoutes);
    app.use('/api/backup', backupRoutes);
    app.use('/api/files', filesRoutes);
    app.use('/api/reports', reportsRoutes);

    console.log('✅ Rutas cargadas correctamente');
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
