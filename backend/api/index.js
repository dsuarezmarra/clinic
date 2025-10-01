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

// Importar rutas solo si hay DB configurada
if (process.env.DATABASE_URL || process.env.SUPABASE_URL) {
  try {
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
