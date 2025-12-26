const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

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
const statsRoutes = require('./routes/stats');
const invoicesRoutes = require('./routes/invoices');
const emailRoutes = require('./routes/email');
const whatsappRemindersRoutes = require('./routes/whatsapp-reminders');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const { injectDatabaseMiddleware, handleDatabaseErrors } = require('./middleware/database-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad y compresión
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
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

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Requested-With, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Middleware de base de datos
app.use('/api', injectDatabaseMiddleware);

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/meta/config', configRoutes);
app.use('/api/meta/locations', locationsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/whatsapp-reminders', whatsappRemindersRoutes);

// Health check
app.get('/health', async (req, res) => {
  const dbManager = await getDbManager();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbManager.getStatus()
  });
});

// Servir frontend Angular
const staticPath = path.join(__dirname, '../../frontend/dist/clinic-frontend/browser');
app.use(express.static(staticPath));
app.get('*', (req, res, next) => {
  if (req.path.includes('.') || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Manejo de errores
app.use(handleDatabaseErrors);
app.use(errorHandler);

// Iniciar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    const dbManager = await getDbManager();
    
    // Iniciar backups automáticos
    try {
      const { backupScheduler } = require('../scripts/scheduler');
      backupScheduler.start();
    } catch (e) {
      console.warn('⚠️ Backups no disponibles');
    }

    const server = app.listen(PORT, () => {
      console.log(`✅ Servidor en puerto ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`🗄️ Base de datos: ${dbManager.getStatus()}`);
    });

    return server;
  } catch (error) {
    console.error('❌ Error al iniciar:', error.message);
    throw error;
  }
}

startServer().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

module.exports = app;
