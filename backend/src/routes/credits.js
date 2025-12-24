const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const prisma = require('../services/database');
// Helper: use injected Supabase shim if available on the request, otherwise fall back to Prisma
const getDb = (req) => req.prisma || prisma;

const router = express.Router();

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

// GET /api/credits - Obtener créditos y packs de un paciente
router.get('/', [
  query('patientId').notEmpty().isUUID().withMessage('ID de paciente es requerido y debe ser UUID válido')
], validate, async (req, res, next) => {
  try {
    const { patientId } = req.query;

    console.log(`[credits] GET /api/credits requested for patientId=${patientId}`);

    // Verificar que el paciente existe
    const patient = await getDb(req).patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado'
      });
    }

    // Obtener packs de créditos
    const creditPacks = await getDb(req).credit_packs.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        creditRedemptions: {
          include: {
            appointment: {
              select: {
                id: true,
                start: true,
                end: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log(`[credits] fetched ${Array.isArray(creditPacks) ? creditPacks.length : 0} packs for patient ${patientId}`);
    // Small summary for debugging (id and units)
    try {
      const summary = (creditPacks || []).map(p => ({ id: p.id, unitsTotal: p.unitsTotal, unitsRemaining: p.unitsRemaining }));
      console.log('[credits] packs summary sample:', summary.slice(0, 10));
    } catch (e) {
      // ignore logging failures
    }

    // Normalizar packs para evitar problemas con strings/undefined provenientes del shim/BD
    const normalizedPacks = (creditPacks || []).map(pack => {
      const unitsTotal = Number(pack.unitsTotal) || 0;
      const unitsRemaining = Number(pack.unitsRemaining) || 0;
      const unitMinutes = Number(pack.unitMinutes) || 30;
      const paid = !!pack.paid;
      // ensure createdAt/updatedAt are ISO strings
      const createdAt = pack.createdAt ? new Date(pack.createdAt).toISOString() : null;
      const updatedAt = pack.updatedAt ? new Date(pack.updatedAt).toISOString() : null;
      return {
        ...pack,
        unitsTotal,
        unitsRemaining,
        unitMinutes,
        paid,
        createdAt,
        updatedAt
      };
    });

    // Calcular totales con valores normalizados
    const totalCreditsOriginal = normalizedPacks.reduce((sum, pack) => sum + pack.unitsTotal, 0);
    const totalCreditsRemaining = normalizedPacks.reduce((sum, pack) => sum + pack.unitsRemaining, 0);
    const totalCreditsUsed = totalCreditsOriginal - totalCreditsRemaining;

    // Convertir unidades a tiempo legible
    const formatUnits = (units) => {
      const hours = Math.floor(units / 2);
      const minutes = (units % 2) * 30;
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    };

    // Helper para obtener precios configurados
    const getConfiguredPrices = async () => {
      try {
        const priceConfigs = await getDb(req).configuration.findMany({
          where: {
            key: {
              in: ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60']
            }
          }
        });

        const prices = {
          sessionPrice30: 25.0,
          sessionPrice60: 45.0,
          bonoPrice30: 100.0,
          bonoPrice60: 180.0
        };

        priceConfigs.forEach(config => {
          try {
            prices[config.key] = parseFloat(config.value);
          } catch (e) {
            // Mantener valor por defecto si hay error de parsing
          }
        });

        return {
          p30: prices.sessionPrice30 * 100, // en centavos
          p60: prices.sessionPrice60 * 100, // en centavos
          bono5_30: prices.bonoPrice30 * 100, // en centavos
          bono5_60: prices.bonoPrice60 * 100  // en centavos
        };
      } catch (e) {
        // Fallback a precios por defecto
        return {
          p30: 2500,  // 25€
          p60: 4500,  // 45€
          bono5_30: 10000, // 100€
          bono5_60: 18000  // 180€
        };
      }
    };

    // Helper para calcular priceCents si no existe en la BD
    const computePriceCents = async (pack) => {
      try {
        const prices = await getConfiguredPrices();
        const { p30, p60, bono5_30, bono5_60 } = prices;

        if (typeof pack.label === 'string' && pack.label.includes('Sesión')) {
          const is60 = pack.label.includes('60');
          const sessions = is60 ? (Number(pack.unitsTotal) / 2) : Number(pack.unitsTotal);
          return Math.round((is60 ? p60 : p30) * sessions);
        }

        // Match label like 'Bono 5×60m' or 'Bono 10×30m'
        const m = typeof pack.label === 'string' && pack.label.match(/Bono\s+(\d+)×(\d+)m/);
        if (m) {
          const displayCount = Number(m[1]);
          const minutes = Number(m[2]);
          if (minutes === 60) {
            return Math.round(bono5_60 * (displayCount / 5));
          } else {
            return Math.round(bono5_30 * (displayCount / 5));
          }
        }

        // Fallback: try infer from unitsTotal and unitMinutes
        if (Number(pack.unitMinutes) === 60) {
          const sessions = Number(pack.unitsTotal) / 2;
          return Math.round(p60 * sessions);
        }

        return Math.round(p30 * Number(pack.unitsTotal));
      } catch (e) {
        return 0;
      }
    };

    res.json({
      patientId,
      summary: {
        totalCreditsOriginal,
        totalCreditsRemaining,
        totalCreditsUsed,
        totalTimeOriginal: formatUnits(totalCreditsOriginal),
        totalTimeRemaining: formatUnits(totalCreditsRemaining),
        totalTimeUsed: formatUnits(totalCreditsUsed)
      },
      creditPacks: await Promise.all(
        normalizedPacks.map(async (pack) => ({
          ...pack,
          timeTotal: formatUnits(pack.unitsTotal),
          timeRemaining: formatUnits(pack.unitsRemaining),
          timeUsed: formatUnits(pack.unitsTotal - pack.unitsRemaining),
          priceCents: (pack.priceCents && Number(pack.priceCents) > 0) ? Number(pack.priceCents) : await computePriceCents(pack)
        }))
      )
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/credits/batch - Obtener cr�ditos de m�ltiples pacientes en una sola petici�n
router.post('/batch', [
  body('patientIds').isArray({ min: 1, max: 100 }).withMessage('Se requiere un array de IDs de pacientes (m�x 100)'),
  body('patientIds.*').isUUID().withMessage('Cada ID debe ser un UUID v�lido')
], validate, async (req, res, next) => {
  try {
    const { patientIds } = req.body;

    console.log(`[credits/batch] Fetching credits for ${patientIds.length} patients`);

    // Obtener todos los packs de cr�ditos para los pacientes solicitados
    const allPacks = await getDb(req).credit_packs.findMany({
      where: { 
        patientId: { in: patientIds }
      },
      select: {
        id: true,
        patientId: true,
        unitsTotal: true,
        unitsRemaining: true,
        priceCents: true,
        paid: true
      }
    });

    // Agrupar por paciente y calcular resumen
    const result = {};
    patientIds.forEach(id => {
      result[id] = { 
        totalCredits: 0, 
        activeCredits: 0,
        totalPriceCents: 0,
        hasPendingPayment: false
      };
    });

    allPacks.forEach(pack => {
      const pid = pack.patientId;
      if (result[pid]) {
        const unitsRemaining = Number(pack.unitsRemaining) || 0;
        const priceCents = Number(pack.priceCents) || 0;
        
        result[pid].totalCredits += Number(pack.unitsTotal) || 0;
        result[pid].activeCredits += unitsRemaining;
        
        // Solo sumar precio de packs con cr�ditos restantes
        if (unitsRemaining > 0) {
          result[pid].totalPriceCents += priceCents;
          if (!pack.paid) {
            result[pid].hasPendingPayment = true;
          }
        }
      }
    });

    console.log(`[credits/batch] Processed ${allPacks.length} packs for ${patientIds.length} patients`);

    res.json({ credits: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/credits/packs - Crear nuevo pack de créditos (sesión o bono)
router.post('/packs', [
  body('patientId').notEmpty().isUUID().withMessage('ID de paciente es requerido'),
  body('type').notEmpty().isIn(['sesion', 'bono']).withMessage('Tipo debe ser sesión o bono'),
  body('minutes').notEmpty().isInt({ min: 30, max: 60 }).withMessage('Minutos debe ser 30 o 60'),
  body('quantity').optional().isInt({ min: 1, max: 20 }).withMessage('Cantidad debe ser entre 1 y 20'),
  body('paid').optional().isBoolean().withMessage('Pagado debe ser un valor booleano'),
  body('notes').optional().isString().trim()
], validate, async (req, res, next) => {
  try {
    const { patientId, type, minutes, quantity = 1, paid = false, notes } = req.body;

    // Verificar que el paciente existe
    const patient = await getDb(req).patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado'
      });
    }

    // Calcular unidades
    let label, unitsTotal;

    if (type === 'sesion') {
      const unitsPerItem = minutes === 60 ? 2 : 1;
      label = `Sesión ${minutes}m`;
      unitsTotal = unitsPerItem * quantity; // Para sesiones individuales
    } else { // bono
      // unitsTotal is always stored as units of 30 minutes
      let totalSessions;
      if (minutes === 60) {
        // A 60min bono is stored as 10 units of 30min per quantity
        totalSessions = quantity * 10;
      } else {
        // A 30min bono is stored as 5 units of 30min per quantity
        totalSessions = quantity * 5;
      }
      unitsTotal = totalSessions;

      // Display the label in the most user-friendly form:
      // - If totalSessions is even, prefer showing it as N×60m (each 60m = 2 units of 30m)
      //   e.g. 10×30m -> 5×60m
      // - Otherwise show as N×30m
      if (totalSessions % 2 === 0) {
        const displayCount = totalSessions / 2;
        label = `Bono ${displayCount}×60m`;
      } else {
        label = `Bono ${totalSessions}×30m`;
      }
    }

    // Calcular precio según tipo/duración usando precios configurables
    let priceCents = 0;

    // Obtener precios actuales de la configuración
    const priceConfigs = await getDb(req).configuration.findMany({
      where: {
        key: {
          in: ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60']
        }
      }
    });

    // Convertir a objeto con valores por defecto
    const prices = {
      sessionPrice30: 25.0,
      sessionPrice60: 45.0,
      bonoPrice30: 100.0,
      bonoPrice60: 180.0
    };

    priceConfigs.forEach(config => {
      try {
        prices[config.key] = parseFloat(config.value);
      } catch (e) {
        // Mantener valor por defecto si hay error de parsing
      }
    });

    if (type === 'sesion') {
      const pricePerSession = minutes === 60 ? prices.sessionPrice60 : prices.sessionPrice30;
      // priceCents per PACK (each session is a pack when quantity>1)
      priceCents = Math.round(pricePerSession * 100);
    } else {
      // bono: precio POR pack
      if (minutes === 60) {
        priceCents = Math.round(prices.bonoPrice60 * 100);
      } else {
        priceCents = Math.round(prices.bonoPrice30 * 100);
      }
    }

    // Crear uno o varios packs independientes según quantity
    const createdPacks = [];
    for (let i = 0; i < Number(quantity || 1); i++) {
      // Para sesiones: cada pack representa UNA sesión (unitsPerItem)
      // Para bonos: cada pack representa el pack completo (ej. 5 unidades de 30m)
      let perPackUnits, perPackLabel;
      if (type === 'sesion') {
        const unitsPerItem = minutes === 60 ? 2 : 1;
        perPackUnits = unitsPerItem;
        perPackLabel = `Sesión ${minutes}m`;
      } else {
        if (minutes === 60) {
          perPackUnits = 10; // 10 units of 30min per 60min bono
          perPackLabel = `Bono 10×60m`;
        } else {
          perPackUnits = 5; // 5 units of 30min per 30min bono
          perPackLabel = `Bono 5×30m`;
        }
      }

      try {
        const newPack = await getDb(req).credit_packs.create({
          data: {
            patientId,
            label: perPackLabel,
            unitsTotal: perPackUnits,
            unitsRemaining: perPackUnits,
            unitMinutes: minutes || 30,
            paid,
            notes: notes || null,
            priceCents
          }
        });
        createdPacks.push(newPack);
      } catch (err) {
        const msg = (err && err.message) ? err.message : '';
        if (msg.includes('Unknown argument `priceCents`') || msg.includes('priceCents')) {
          console.warn('[CREDITS] priceCents not supported by Prisma client/schema, retrying without it');
          const newPack = await getDb(req).credit_packs.create({
            data: {
              patientId,
              label: perPackLabel,
              unitsTotal: perPackUnits,
              unitsRemaining: perPackUnits,
              unitMinutes: minutes || 30,
              paid,
              notes: notes || null
            }
          });
          createdPacks.push(newPack);
        } else {
          throw err;
        }
      }
    }

    // Si quantity === 1, devolver objeto único para compatibilidad
    if (createdPacks.length === 1) {
      res.status(201).json(createdPacks[0]);
    } else {
      res.status(201).json(createdPacks);
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/credits/redeem - Consumir créditos manualmente (opcional)
router.post('/redeem', [
  body('patientId').notEmpty().isUUID().withMessage('ID de paciente es requerido'),
  body('appointmentId').notEmpty().isUUID().withMessage('ID de cita es requerido'),
  body('units').notEmpty().isInt({ min: 1, max: 4 }).withMessage('Unidades debe ser entre 1 y 4')
], validate, async (req, res, next) => {
  try {
    const { patientId, appointmentId, units } = req.body;

    // Verificar que el paciente y la cita existen
    const [patient, appointment] = await Promise.all([
      getDb(req).patients.findUnique({ where: { id: patientId } }),
      getDb(req).appointments.findUnique({ where: { id: appointmentId } })
    ]);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado'
      });
    }

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada'
      });
    }

    // Verificar que la cita pertenece al paciente
    if (appointment.patientId !== patientId) {
      return res.status(400).json({
        error: 'La cita no pertenece al paciente especificado'
      });
    }

    // Obtener packs disponibles
    const creditPacks = await getDb(req).credit_packs.findMany({
      where: {
        patientId,
        unitsRemaining: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' } // FIFO
    });

    const totalAvailable = creditPacks.reduce((sum, pack) => sum + pack.unitsRemaining, 0);

    if (totalAvailable < units) {
      return res.status(400).json({
        error: 'Sesiones insuficientes',
        message: `Necesario: ${units}, disponible: ${totalAvailable}`
      });
    }

    // Consumir Sesiones
    let remainingUnits = units;
    const redemptions = [];

    for (const pack of creditPacks) {
      if (remainingUnits <= 0) break;

      const unitsToUse = Math.min(remainingUnits, pack.unitsRemaining);

      // Registrar consumo
      const redemption = await getDb(req).credit_redemptions.create({
        data: {
          creditPackId: pack.id,
          appointmentId,
          unitsUsed: unitsToUse
        }
      });

      redemptions.push(redemption);

      // Actualizar pack
      await getDb(req).credit_packs.update({
        where: { id: pack.id },
        data: {
          unitsRemaining: pack.unitsRemaining - unitsToUse
        }
      });

      remainingUnits -= unitsToUse;
    }

    res.json({
      message: `${units} unidades consumidas correctamente`,
      redemptions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/credits/history - Historial de consumos de un paciente
router.get('/history', [
  query('patientId').notEmpty().isUUID().withMessage('ID de paciente es requerido'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, async (req, res, next) => {
  try {
    const { patientId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que el paciente existe
    const patient = await getDb(req).patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado'
      });
    }

    // Obtener historial con paginación
    const [redemptions, total] = await Promise.all([
      getDb(req).credit_redemptions.findMany({
        where: {
          creditPack: {
            patientId
          }
        },
        include: {
          creditPack: {
            select: {
              id: true,
              label: true
            }
          },
          appointment: {
            select: {
              id: true,
              start: true,
              end: true,
              status: true,
              notes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      getDb(req).credit_redemptions.count({
        where: {
          creditPack: {
            patientId
          }
        }
      })
    ]);

    res.json({
      redemptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/credits/packs/:id - Eliminar pack de Sesiones
router.delete('/packs/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el pack existe
    const creditPack = await getDb(req).credit_packs.findUnique({
      where: { id },
      include: {
        creditRedemptions: true
      }
    });

    if (!creditPack) {
      return res.status(404).json({
        error: 'Pack de Sesiones no encontrado'
      });
    }

    // Eliminar en cascada: primero las redempciones, luego el pack
    const existingRedemptions = creditPack.creditRedemptions || [];
    if (existingRedemptions.length > 0) {
      console.log(`Eliminando ${existingRedemptions.length} redempciones del pack ${id}`);
      await getDb(req).credit_redemptions.deleteMany({
        where: { creditPackId: id }
      });
    }

    await getDb(req).credit_packs.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/credits/packs/:id/payment - Actualizar estado de pago de un pack
router.patch('/packs/:id/payment', [
  param('id').notEmpty().isUUID().withMessage('ID del pack es requerido y debe ser UUID válido'),
  body('paid').isBoolean().withMessage('El campo paid debe ser un valor booleano')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paid } = req.body;

    // Verificar que el pack existe
    const creditPack = await getDb(req).credit_packs.findUnique({
      where: { id }
    });

    if (!creditPack) {
      return res.status(404).json({
        error: 'Pack de Sesiones no encontrado'
      });
    }

    // Actualizar el estado de pago
    const updatedPack = await getDb(req).credit_packs.update({
      where: { id },
      data: { paid }
    });

    res.json({
      message: 'Estado de pago actualizado correctamente',
      pack: updatedPack
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/credits/packs/:id/units - Actualizar unidades restantes de un pack
router.patch('/packs/:id/units', [
  param('id').notEmpty().isUUID().withMessage('ID del pack es requerido y debe ser UUID válido'),
  body('unitsRemaining').isInt({ min: 0 }).withMessage('Las unidades restantes deben ser un número entero mayor o igual a 0')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { unitsRemaining } = req.body;

    // Verificar que el pack existe y obtener el total para validación
    const existingPack = await getDb(req).credit_packs.findUnique({
      where: { id }
    });

    if (!existingPack) {
      return res.status(404).json({
        error: 'Pack de Sesiones no encontrado'
      });
    }

    // Validar que las unidades restantes no excedan el total
    if (unitsRemaining > existingPack.unitsTotal) {
      return res.status(400).json({
        error: 'Las unidades restantes no pueden ser mayores que el total',
        message: `Máximo permitido: ${existingPack.unitsTotal}`
      });
    }

    // Actualizar las unidades restantes
    const updatedPack = await getDb(req).credit_packs.update({
      where: { id },
      data: { unitsRemaining }
    });

    res.json({
      message: 'Unidades restantes actualizadas correctamente',
      pack: updatedPack
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

// NOTE: ruta de depuración temporal
// GET /api/credits/debug?patientId=UUID
// Devuelve el paciente y los packs tal como los ve el backend (normalizados)
router.get('/debug', [
  query('patientId').notEmpty().isUUID().withMessage('ID de paciente es requerido y debe ser UUID válido')
], validate, async (req, res, next) => {
  try {
    const { patientId } = req.query;
    const db = getDb(req);

    const patient = await db.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) return res.status(404).json({ error: 'Paciente no encontrado' });

    const packs = await db.credit_packs.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });

    const normalized = (packs || []).map(pack => ({
      ...pack,
      unitsTotal: Number(pack.unitsTotal) || 0,
      unitsRemaining: Number(pack.unitsRemaining) || 0,
      unitMinutes: Number(pack.unitMinutes) || 30,
      paid: !!pack.paid,
      createdAt: pack.createdAt ? new Date(pack.createdAt).toISOString() : null,
      updatedAt: pack.updatedAt ? new Date(pack.updatedAt).toISOString() : null
    }));

    res.json({ patient, credits: { count: normalized.length, creditPacks: normalized } });
  } catch (error) {
    next(error);
  }
});
