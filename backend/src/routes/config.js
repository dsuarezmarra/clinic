const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../services/database');
// Helper: prefer injected Supabase shim (req.prisma) otherwise fallback to Prisma
const getDb = (req) => req.prisma || prisma;
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ===== MIDDLEWARE DE AUTENTICACIÓN GLOBAL =====
// Todas las rutas de configuración requieren autenticación
router.use(requireAuth);

// Middleware para validar errores
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors.array()
    });
  }
  next();
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  workingHours: {
    monday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    tuesday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    wednesday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    thursday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    friday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    saturday: { enabled: false, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    sunday: { enabled: false, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } }
  },
  defaultDuration: 30, // minutos
  slotDuration: 30, // minutos
  holidays: [], // Formato: ['2025-01-01', '2025-12-25']
  clinicInfo: {
    name: 'Masaje Corporal Deportivo',
    address: '',
    phone: '',
    email: ''
  }
};

// GET /api/meta/config - Obtener configuración
router.get('/', async (req, res, next) => {
  try {
  const configs = await getDb(req).configuration.findMany();

    // Convertir array de configs a objeto
    const configObject = {};
    configs.forEach(config => {
      try {
        configObject[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObject[config.key] = config.value;
      }
    });

    // Combinar con configuración por defecto
    const finalConfig = { ...DEFAULT_CONFIG, ...configObject };

    res.json(finalConfig);
  } catch (error) {
    next(error);
  }
});

// PUT /api/meta/config - Actualizar configuración
router.put('/', [
  body('workingHours').optional().isObject(),
  body('defaultDuration').optional().isInt({ min: 15, max: 120 }),
  body('slotDuration').optional().isInt({ min: 15, max: 60 }),
  body('holidays').optional().isArray(),
  body('clinicInfo').optional().isObject()
], validate, async (req, res, next) => {
  try {
    const updates = req.body;

    // Validar horarios de trabajo si se proporcionan
    if (updates.workingHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        if (updates.workingHours[day]) {
          const dayConfig = updates.workingHours[day];
          if (typeof dayConfig.enabled !== 'boolean') {
            return res.status(400).json({
              error: `${day}.enabled debe ser booleano`
            });
          }

          if (dayConfig.enabled) {
            if (!dayConfig.morning || !dayConfig.afternoon) {
              return res.status(400).json({
                error: `${day} debe tener configuración de mañana y tarde`
              });
            }
          }
        }
      }
    }

    // Validar festivos si se proporcionan
    if (updates.holidays) {
      for (const holiday of updates.holidays) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday)) {
          return res.status(400).json({
            error: 'Los festivos deben estar en formato YYYY-MM-DD'
          });
        }
      }
    }

    // Actualizar cada configuración
    const configPromises = Object.keys(updates).map(async (key) => {
      const value = typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key].toString();

      return await getDb(req).configuration.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });

    await Promise.all(configPromises);

  // Obtener configuración actualizada
  const configs = await getDb(req).configuration.findMany();
    const configObject = {};
    configs.forEach(config => {
      try {
        configObject[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObject[config.key] = config.value;
      }
    });

    const finalConfig = { ...DEFAULT_CONFIG, ...configObject };

    res.json(finalConfig);
  } catch (error) {
    next(error);
  }
});

// POST /api/meta/config/reset - Restablecer configuración por defecto
router.post('/reset', async (req, res, next) => {
  try {
  // Eliminar toda la configuración actual
  await getDb(req).configuration.deleteMany();

    // Insertar configuración por defecto
    const defaultConfigs = Object.keys(DEFAULT_CONFIG).map(key => ({
      key,
      value: typeof DEFAULT_CONFIG[key] === 'object' ? JSON.stringify(DEFAULT_CONFIG[key]) : DEFAULT_CONFIG[key].toString()
    }));

    await getDb(req).configuration.createMany({
      data: defaultConfigs
    });

    res.json({
      message: 'Configuración restablecida a valores por defecto',
      config: DEFAULT_CONFIG
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/meta/config/working-hours/:date - Verificar si una fecha es laborable
router.get('/working-hours/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'La fecha debe estar en formato YYYY-MM-DD'
      });
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = domingo, 1 = lunes, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

  // Obtener configuración
  const configs = await getDb(req).configuration.findMany();
    const configObject = {};
    configs.forEach(config => {
      try {
        configObject[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObject[config.key] = config.value;
      }
    });

    const finalConfig = { ...DEFAULT_CONFIG, ...configObject };

    // Verificar si es festivo
    const isHoliday = finalConfig.holidays.includes(date);

    // Verificar si el día está habilitado
    const dayConfig = finalConfig.workingHours[dayName];
    const isWorkingDay = dayConfig && dayConfig.enabled && !isHoliday;

    res.json({
      date,
      dayOfWeek: dayName,
      isWorkingDay,
      isHoliday,
      workingHours: isWorkingDay ? {
        morning: dayConfig.morning,
        afternoon: dayConfig.afternoon
      } : null
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RUTAS PARA GESTIÓN DE PRECIOS
// ============================================================================

// Precios por defecto del sistema (actualizados a los valores actuales)
const DEFAULT_PRICES = {
  sessionPrice30: 35, // €35 sesión de 30 min
  sessionPrice60: 65, // €65 sesión de 60 min  
  bonoPrice30: 155,   // €155 bono 5×30min
  bonoPrice60: 290    // €290 bono 5×60min
};

// GET /api/meta/prices - Obtener precios actuales
router.get('/prices', async (req, res, next) => {
  try {
    const priceConfigs = await getDb(req).configuration.findMany({
      where: {
        key: {
          in: ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60']
        }
      }
    });

    // Convertir array de configs a objeto
    const pricesObject = { ...DEFAULT_PRICES };
    priceConfigs.forEach(config => {
      try {
        pricesObject[config.key] = parseFloat(config.value);
      } catch (e) {
        pricesObject[config.key] = parseFloat(config.value) || DEFAULT_PRICES[config.key];
      }
    });

    res.json(pricesObject);
  } catch (error) {
    next(error);
  }
});

// PUT /api/meta/prices - Actualizar precios
router.put('/prices', [
  body('sessionPrice30').optional().isNumeric().isFloat({ min: 0 }),
  body('sessionPrice60').optional().isNumeric().isFloat({ min: 0 }),
  body('bonoPrice30').optional().isNumeric().isFloat({ min: 0 }),
  body('bonoPrice60').optional().isNumeric().isFloat({ min: 0 })
], validate, async (req, res, next) => {
  try {
    const updates = req.body;

    // Validar que los precios sean lógicos
    if (updates.sessionPrice30 && updates.sessionPrice60) {
      if (updates.sessionPrice60 <= updates.sessionPrice30) {
        return res.status(400).json({
          error: 'El precio de sesión de 60 min debe ser mayor que el de 30 min'
        });
      }
    }

    if (updates.bonoPrice30 && updates.sessionPrice30) {
      const unitPrice = updates.bonoPrice30 / 5;
      if (unitPrice >= updates.sessionPrice30) {
        return res.status(400).json({
          error: 'El precio unitario del bono 30min debe ser menor que el precio de sesión individual'
        });
      }
    }

    if (updates.bonoPrice60 && updates.sessionPrice60) {
      const unitPrice = updates.bonoPrice60 / 5;
      if (unitPrice >= updates.sessionPrice60) {
        return res.status(400).json({
          error: 'El precio unitario del bono 60min debe ser menor que el precio de sesión individual'
        });
      }
    }

    // Actualizar cada precio
    const pricePromises = Object.keys(updates).map(async (key) => {
      const value = updates[key].toString();

      return await getDb(req).configuration.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    });

    await Promise.all(pricePromises);

    // Obtener precios actualizados
    const priceConfigs = await getDb(req).configuration.findMany({
      where: {
        key: {
          in: ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60']
        }
      }
    });

    const pricesObject = { ...DEFAULT_PRICES };
    priceConfigs.forEach(config => {
      try {
        pricesObject[config.key] = parseFloat(config.value);
      } catch (e) {
        pricesObject[config.key] = parseFloat(config.value) || DEFAULT_PRICES[config.key];
      }
    });

    res.json({
      message: 'Precios actualizados correctamente',
      prices: pricesObject
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
