console.log('✅ Backend iniciado: index.js');

// Configurar para ignorar errores de certificados SSL temporalmente
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Agregar manejo global de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Excepción no capturada:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada en:', promise);
  console.error('Razón:', reason);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Importar sistema de base de datos inteligente
const { getDbManager } = require('./database/database-manager');

// Importar rutas
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');
const creditsRoutes = require('./routes/credits');
const configRoutes = require('./routes/config');
const locationsRoutes = require('./routes/locations');
const backupRoutes = require('./routes/backup');
const filesRoutes = require('./routes/files');
const reportsRoutes = require('./routes/reports');
// Debug routes - commented out for production
// const debugRoutes = require('./routes/debug');
// const testDirectRoutes = require('./routes/test-direct');

// Importar middleware personalizado
const errorHandler = require('./middleware/errorHandler');
const { injectDatabaseMiddleware, handleDatabaseErrors } = require('./middleware/database-middleware');
const { backupScheduler } = require('../scripts/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad y compresión
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:"],
      "font-src": ["'self'", "https:", "data:"]
    }
  }
}));
app.use(compression());

// CORS - Permitir header X-Tenant-Slug para multi-tenant
// Permitir múltiples orígenes: localhost, Vercel deployments temporales, y dominios personalizados
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:4300',
      'http://localhost:4200',
      'https://masajecorporaldeportivo.vercel.app',
      process.env.FRONTEND_URL
    ];
    
    // Permitir cualquier dominio *.vercel.app (deployments temporales)
    if (origin.includes('.vercel.app') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Tenant-Slug',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version'
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Parsear JSON con codificación UTF-8
app.use(express.json({
  limit: '10mb',
  charset: 'utf-8'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  charset: 'utf-8'
}));

// Configurar headers para UTF-8

// Middleware de logging condicional (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    // Solo loggear headers y body para endpoints específicos si es necesario
    if (req.url.includes('/debug') || process.env.VERBOSE_LOGGING === 'true') {
      console.log('📦 Headers:', req.headers);
      console.log('📄 Body:', req.body);
    }
    next();
  });
}

// Middleware de base de datos - inyectar cliente Prisma en todas las rutas
app.use('/api', injectDatabaseMiddleware);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/meta/config', configRoutes);
app.use('/api/meta/locations', locationsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/reports', reportsRoutes);
// Debug routes - commented out for production (uncomment for development/debugging)
// app.use('/api/_debug', debugRoutes);
// app.use('/api/_debug', testDirectRoutes);

// Ruta de salud con información de base de datos
app.get('/health', async (req, res) => {
  const dbManager = await getDbManager();
  const dbStatus = dbManager.getStatus();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      current: dbStatus,
      connected: dbManager.isConnected
    }
  });
});

// Middleware de manejo de errores
app.use(handleDatabaseErrors); // Manejo específico de errores de BD
app.use(errorHandler); // Manejo general de errores

// Manejar rutas no encontradas

// ...al final del archivo, justo antes de module.exports = app;

// Servir archivos estáticos de Angular
const fs = require('fs');
const isPackaged = typeof process.resourcesPath !== 'undefined' && process.resourcesPath !== '';
let staticPath;
if (isPackaged) {
  const pathA = path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'clinic-frontend', 'browser');
  const pathB = path.join(process.resourcesPath, 'frontend', 'dist', 'clinic-frontend', 'browser');
  if (fs.existsSync(pathA)) {
    staticPath = pathA;
    console.log('🗂 Static path (A):', staticPath);
  } else if (fs.existsSync(pathB)) {
    staticPath = pathB;
    console.log('🗂 Static path (B):', staticPath);
  } else {
    staticPath = pathA;
    console.warn('⚠️ Ninguna ruta encontrada, usando pathA:', staticPath);
  }
} else {
  staticPath = path.join(__dirname, '../../frontend/dist/clinic-frontend/browser');
  console.log('🗂 Static path (dev):', staticPath);
}
// Servir archivos estáticos del frontend Angular SIEMPRE desde la raíz '/'
app.use(express.static(staticPath));
// Catch-all solo para rutas que no sean archivos
app.get('*', (req, res, next) => {
  // Si la ruta contiene un punto, es un archivo, dejar que lo maneje express.static
  if (req.path.includes('.')) return next();
  // Si la ruta es API, no devolver index.html
  if (req.path.startsWith('/api')) return next();
  // Devolver index.html solo para rutas frontend
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Iniciar servidor con inicialización de base de datos
async function startServer() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 INICIANDO SISTEMA DE CLÍNICA');
    console.log('='.repeat(60));

    // Inicializar conexión de base de datos con fallback automático
    const dbManager = await getDbManager();

    // Iniciar scheduler de backups automáticos una vez inicializada la DB
    try {
      const { backupScheduler } = require('../scripts/scheduler');
      backupScheduler.start();
    } catch (e) {
      console.warn('⚠️ No se pudo iniciar backupScheduler:', e && e.message ? e.message : e);
    }

    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:4300'}`);

      const dbStatus = dbManager.getStatus();
      console.log(`🗄️ Base de datos: ${dbStatus}`);
      console.log('='.repeat(50));
      console.log('\n🟢 Servidor iniciado correctamente y esperando conexiones...');
    });

    // Manejo de errores del servidor
    server.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });

    // Mantener el proceso vivo
    server.on('close', () => {
      console.log('🛑 Servidor cerrado');
    });

    return server;

  } catch (error) {
    console.error('\n❌ ERROR AL INICIAR: Se produjo un error durante la inicialización');
    console.error('Detalles:', error.message);
    console.error('Stack:', error.stack);
    // El servidor debe fallar para que nodemon lo reinicie
    throw error;
  }
}

// Iniciar el servidor
startServer().catch((error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});

// Evitar que el proceso se cierre inesperadamente
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

module.exports = app;




