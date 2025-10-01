const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const appointmentService = require('../services/appointmentService');
const prisma = require('../services/database');
// Helper: prefer injected Supabase shim (req.prisma) otherwise fallback to Prisma
const getDb = (req) => req.prisma || prisma;
const moment = require('moment-timezone');

const router = express.Router();

// GET /api/appointments/all - Obtener todas las citas sin filtro de fechas
router.get('/all', async (req, res, next) => {
  try {
    const appointments = await getDb(req).appointments.findMany({
      orderBy: { start: 'desc' },
      include: {
        patient: true,
        creditRedemptions: {
          include: {
            creditPack: true
          }
        }
      }
    });
    const appointmentsWithLocalTime = appointments.map(apt => ({
      ...apt,
      start: moment.utc(apt.start).tz('Europe/Madrid').format(),
      end: moment.utc(apt.end).tz('Europe/Madrid').format(),
      // Normalizar creditRedemptions.creditPack si existen
      creditRedemptions: Array.isArray(apt.creditRedemptions)
        ? apt.creditRedemptions.map(cr => ({
            ...cr,
            creditPack: cr.creditPack
              ? {
                  ...cr.creditPack,
                  unitsRemaining: Number(cr.creditPack.unitsRemaining) || 0,
                  unitsTotal: Number(cr.creditPack.unitsTotal) || 0,
                  unitMinutes: Number(cr.creditPack.unitMinutes) || 30,
                  paid: !!cr.creditPack.paid,
                  createdAt: cr.creditPack.createdAt ? new Date(cr.creditPack.createdAt).toISOString() : null,
                  updatedAt: cr.creditPack.updatedAt ? new Date(cr.creditPack.updatedAt).toISOString() : null
                }
              : null
          }))
        : apt.creditRedemptions
    }));
    res.json(appointmentsWithLocalTime);
  } catch (error) {
    next(error);
  }
});

// Middleware para validar errores
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/appointments/patient/:id - Obtener todas las citas de un paciente
router.get('/patient/:id', [
  param('id').isUUID().withMessage('ID de paciente debe ser UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointments = await getDb(req).appointments.findMany({
      where: {
        patientId: id
      },
      orderBy: { start: 'desc' },
      include: {
        patient: true,
        creditRedemptions: {
          include: {
            creditPack: true
          }
        }
      }
    });
    const appointmentsWithLocalTime = appointments.map(apt => ({
        ...apt,
        start: moment.utc(apt.start).tz('Europe/Madrid').format(),
        end: moment.utc(apt.end).tz('Europe/Madrid').format(),
        creditRedemptions: Array.isArray(apt.creditRedemptions)
          ? apt.creditRedemptions.map(cr => ({
              ...cr,
              creditPack: cr.creditPack
                ? {
                    ...cr.creditPack,
                    unitsRemaining: Number(cr.creditPack.unitsRemaining) || 0,
                    unitsTotal: Number(cr.creditPack.unitsTotal) || 0,
                    unitMinutes: Number(cr.creditPack.unitMinutes) || 30,
                    paid: !!cr.creditPack.paid,
                    createdAt: cr.creditPack.createdAt ? new Date(cr.creditPack.createdAt).toISOString() : null,
                    updatedAt: cr.creditPack.updatedAt ? new Date(cr.creditPack.updatedAt).toISOString() : null
                  }
                : null
            }))
          : apt.creditRedemptions
    }));
    res.json(appointmentsWithLocalTime);
  } catch (error) {
    next(error);
  }
});
// ...existing code...

// GET /api/appointments - Obtener citas por rango de fechas
router.get('/', [
  query('from').notEmpty().isISO8601().withMessage('Fecha desde es requerida y debe ser válida'),
  query('to').notEmpty().isISO8601().withMessage('Fecha hasta es requerida y debe ser válida'),
  query('status').optional().isIn(['BOOKED', 'CANCELLED', 'NO_SHOW']).withMessage('Estado no válido')
], validate, async (req, res, next) => {
  try {
    const { from, to, status } = req.query;

    let appointments = await appointmentService.getAppointmentsByRange(from, to);

    // Filtrar por estado si se especifica
    if (status) {
      appointments = appointments.filter(apt => apt.status === status);
    }

    // Convertir fechas a zona horaria local para el frontend
    const appointmentsWithLocalTime = appointments.map(apt => ({
      ...apt,
      start: moment.utc(apt.start).tz('Europe/Madrid').format(),
      end: moment.utc(apt.end).tz('Europe/Madrid').format()
    }));

    res.json(appointmentsWithLocalTime);
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments - Crear nueva cita
router.post('/', [
  body('start').notEmpty().isISO8601().withMessage('Fecha y hora de inicio son requeridas'),
  body('end').notEmpty().isISO8601().withMessage('Fecha y hora de fin son requeridas'),
  body('patientId').optional().isUUID().withMessage('ID de paciente debe ser UUID válido'),
  body('durationMinutes').optional().isInt({ min: 30, max: 120 }).withMessage('Duración debe ser entre 30 y 120 minutos'),
  body('consumesCredit').optional().isBoolean(),
  body('notes').optional().isString().trim(),
  body('allowWithoutCredit').optional().isBoolean()
], validate, async (req, res, next) => {
  try {
    const { start, end, patientId, durationMinutes = 30, consumesCredit = true, notes, allowWithoutCredit = false } = req.body;

    // Validar que end sea posterior a start
    if (new Date(end) <= new Date(start)) {
      return res.status(400).json({
        error: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    // Validar que las fechas sean coherentes (end > start). Permitimos que el servicio
    // ajuste la duración/fin (por ejemplo forzar 60min si el paciente tiene packs de 60m).
    const startMoment = moment(start);
    const endMoment = moment(end);
    const diffMinutes = endMoment.diff(startMoment, 'minutes');

    if (diffMinutes <= 0) {
      return res.status(400).json({
        error: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    try {
      const appointment = await appointmentService.createAppointment({
        start,
        end,
        patientId: patientId || null,
        durationMinutes,
        consumesCredit: patientId ? consumesCredit : false,
        notes
      });

      // Convertir fechas a zona horaria local
      const appointmentWithLocalTime = {
          ...appointment,
          start: moment.utc(appointment.start).tz('Europe/Madrid').format(),
          end: moment.utc(appointment.end).tz('Europe/Madrid').format(),
          creditRedemptions: Array.isArray(appointment.creditRedemptions)
            ? appointment.creditRedemptions.map(cr => ({
                ...cr,
                creditPack: cr.creditPack
                  ? {
                      ...cr.creditPack,
                      unitsRemaining: Number(cr.creditPack.unitsRemaining) || 0,
                      unitsTotal: Number(cr.creditPack.unitsTotal) || 0,
                      unitMinutes: Number(cr.creditPack.unitMinutes) || 30,
                      paid: !!cr.creditPack.paid,
                      createdAt: cr.creditPack.createdAt ? new Date(cr.creditPack.createdAt).toISOString() : null,
                      updatedAt: cr.creditPack.updatedAt ? new Date(cr.creditPack.updatedAt).toISOString() : null
                    }
                  : null
              }))
            : appointment.creditRedemptions
      };

      res.status(201).json(appointmentWithLocalTime);
    } catch (error) {
      // Si es error de Sesiones insuficientes y se permite crear sin sesión
      if (error.code === 'INSUFFICIENT_CREDITS' && allowWithoutCredit) {
        const appointment = await appointmentService.createAppointment({
          start,
          end,
          patientId: patientId || null,
          durationMinutes,
          consumesCredit: false, // No consumir sesión
          notes: `${notes || ''}\n[NOTA: Creada sin Sesiones suficientes]`.trim()
        });

        const appointmentWithLocalTime = {
          ...appointment,
          start: moment.utc(appointment.start).tz('Europe/Madrid').format(),
          end: moment.utc(appointment.end).tz('Europe/Madrid').format()
        };

        return res.status(201).json({
          ...appointmentWithLocalTime,
          warning: 'Cita creada sin consumir Sesiones por saldo insuficiente'
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// ...existing code...

// GET /api/appointments/:id - Obtener cita por ID
router.get('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await getDb(req).appointments.findUnique({
      where: { id },
      include: {
        patient: true,
        creditRedemptions: {
          include: {
            creditPack: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'Cita no encontrada'
      });
    }

    // Convertir fechas a zona horaria local
    const appointmentWithLocalTime = {
        ...appointment,
        start: moment.utc(appointment.start).tz('Europe/Madrid').format(),
        end: moment.utc(appointment.end).tz('Europe/Madrid').format(),
        creditRedemptions: Array.isArray(appointment.creditRedemptions)
          ? appointment.creditRedemptions.map(cr => ({
              ...cr,
              creditPack: cr.creditPack
                ? {
                    ...cr.creditPack,
                    unitsRemaining: Number(cr.creditPack.unitsRemaining) || 0,
                    unitsTotal: Number(cr.creditPack.unitsTotal) || 0,
                    unitMinutes: Number(cr.creditPack.unitMinutes) || 30,
                    paid: !!cr.creditPack.paid,
                    createdAt: cr.creditPack.createdAt ? new Date(cr.creditPack.createdAt).toISOString() : null,
                    updatedAt: cr.creditPack.updatedAt ? new Date(cr.creditPack.updatedAt).toISOString() : null
                  }
                : null
            }))
          : appointment.creditRedemptions
    };

    res.json(appointmentWithLocalTime);
  } catch (error) {
    next(error);
  }
});

// PUT /api/appointments/:id - Actualizar cita
router.put('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('start').optional().isISO8601(),
  body('end').optional().isISO8601(),
  body('patientId').optional().isUUID(),
  body('durationMinutes').optional().isInt({ min: 30, max: 120 }),
  body('consumesCredit').optional().isBoolean(),
  body('paid').optional().isBoolean(),
  body('notes').optional().isString().trim(),
  body('status').optional().isIn(['BOOKED', 'CANCELLED', 'NO_SHOW'])
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start, end, patientId, durationMinutes, consumesCredit, notes, status, paid } = req.body;

    // Validar que end sea posterior a start si ambos están presentes
    if (start && end && new Date(end) <= new Date(start)) {
      return res.status(400).json({
        error: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    const appointment = await appointmentService.updateAppointment(id, {
      start,
      end,
      patientId,
      durationMinutes,
      consumesCredit,
      notes,
      status
      , paid
    });

    // Convertir fechas a zona horaria local
    const appointmentWithLocalTime = {
      ...appointment,
      start: moment.utc(appointment.start).tz('Europe/Madrid').format(),
      end: moment.utc(appointment.end).tz('Europe/Madrid').format()
    };

    res.json(appointmentWithLocalTime);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/appointments/:id - Cancelar/eliminar cita
router.delete('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  query('action').optional().isIn(['cancel', 'delete']).withMessage('Acción debe ser cancel o delete')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action = 'cancel' } = req.query;

    if (action === 'cancel') {
      const appointment = await appointmentService.cancelAppointment(id);

      const appointmentWithLocalTime = {
        ...appointment,
        start: moment.utc(appointment.start).tz('Europe/Madrid').format(),
        end: moment.utc(appointment.end).tz('Europe/Madrid').format()
      };

      res.json(appointmentWithLocalTime);
    } else {
      // Eliminar completamente
      const appointment = await getDb(req).appointments.findUnique({
        where: { id }
      });

      if (!appointment) {
        return res.status(404).json({
          error: 'Cita no encontrada'
        });
      }

      // Revertir Sesiones si se habían consumido
      if (appointment.consumesCredit && appointment.patientId) {
        await appointmentService.revertCredits(id);
      }

      await getDb(req).appointments.delete({
        where: { id }
      });

      res.status(204).send();
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/conflicts/check - Verificar conflictos de horario
router.get('/conflicts/check', [
  query('start').notEmpty().isISO8601().withMessage('Fecha de inicio es requerida'),
  query('end').notEmpty().isISO8601().withMessage('Fecha de fin es requerida'),
  query('excludeId').optional().isUUID().withMessage('ID a excluir debe ser UUID válido')
], validate, async (req, res, next) => {
  try {
    const { start, end, excludeId } = req.query;

    const conflict = await appointmentService.checkOverlap(start, end, excludeId);

    if (conflict) {
      res.json({
        hasConflict: true,
        conflictingAppointment: {
          ...conflict,
          start: moment.utc(conflict.start).tz('Europe/Madrid').format(),
          end: moment.utc(conflict.end).tz('Europe/Madrid').format()
        }
      });
    } else {
      res.json({
        hasConflict: false
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
