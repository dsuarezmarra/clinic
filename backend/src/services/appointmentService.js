const prisma = require('./database');
const moment = require('moment-timezone');

const TIMEZONE = 'Europe/Madrid';

/**
 * Servicio centralizado para gestión de citas y consumo de créditos
 * Principios de diseño:
 * - Estado calculado: El estado "pagado" se calcula dinámicamente basado en credit_packs.paid
 * - Transacciones atómicas: Las operaciones críticas usan transacciones para mantener consistencia
 * - Idempotencia: Las operaciones pueden ejecutarse múltiples veces sin efectos secundarios
 * - Separación de responsabilidades: Cada método tiene una responsabilidad clara
 */
class AppointmentService {

  // ===== UTILIDADES Y HELPERS =====

  /**
   * Normaliza los datos de un credit pack desde la base de datos
   */
  _normalizeCreditPack(pack) {
    return {
      ...pack,
      unitsRemaining: Number(pack.unitsRemaining) || 0,
      unitsTotal: Number(pack.unitsTotal) || 0,
      unitMinutes: Number(pack.unitMinutes) || 30,
      paid: !!pack.paid
    };
  }

  /**
   * Ordena los credit packs por prioridad: pagados primero, luego FIFO
   */
  _sortCreditPacks(packs) {
    return packs.sort((a, b) => {
      const aPaid = !!a.paid;
      const bPaid = !!b.paid;
      if (aPaid !== bPaid) return aPaid ? -1 : 1; // pagados primero
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // FIFO
    });
  }

  /**
   * Calcula las unidades necesarias basado en la duración
   */
  _calculateRequiredUnits(durationMinutes) {
    return durationMinutes === 60 ? 2 : 1;
  }

  /**
   * Determina si una cita está pagada basándose en sus redemptions
   */
  _isAppointmentPaid(appointment) {
    return appointment.creditRedemptions?.length > 0 && 
           appointment.creditRedemptions.every(r => r.creditPack?.paid === true);
  }

  /**
   * Convierte fechas locales a UTC
   */
  _toUTC(dateTime) {
    return moment.tz(dateTime, TIMEZONE).utc().toDate();
  }

  // ===== VALIDACIONES =====

  /**
   * Verifica si hay solapamiento de citas
   */
  async checkOverlap(start, end, excludeId = null) {
    const startUTC = this._toUTC(start);
    const endUTC = this._toUTC(end);

    const whereClause = {
      status: 'BOOKED',
      start: { lt: endUTC },
      end: { gt: startUTC }
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    return await prisma.appointment.findFirst({ where: whereClause });
  }

  /**
   * Obtiene los créditos disponibles de un paciente
   */
  async getPatientAvailableCredits(patientId) {
    const rawPacks = await prisma.creditPack.findMany({ 
      where: { patientId } 
    });

    const creditPacks = rawPacks
      .map(pack => this._normalizeCreditPack(pack))
      .filter(pack => pack.unitsRemaining > 0);

    return creditPacks.reduce((total, pack) => total + pack.unitsRemaining, 0);
  }

  // ===== GESTIÓN DE CRÉDITOS =====

  /**
   * Consume créditos para una cita de forma idempotente
   */
  async consumeCredits(patientId, appointmentId, durationMinutes, transaction = null) {
    const tx = transaction || prisma;
    
    console.log(`[CONSUME CREDITS] Appointment ${appointmentId}, Duration: ${durationMinutes}min`);
    
    // Verificar si ya existen redemptions (idempotencia)
    const existingRedemptions = await tx.creditRedemption.findMany({
      where: { appointmentId }
    });
    
    if (existingRedemptions.length > 0) {
      console.log(`[CONSUME CREDITS] SKIP - Ya existen redemptions para la cita ${appointmentId}`);
      return;
    }
    
    const requiredUnits = this._calculateRequiredUnits(durationMinutes);
    let remainingUnits = requiredUnits;

    // Obtener y normalizar packs disponibles
    const rawPacks = await tx.creditPack.findMany({ 
      where: { patientId } 
    });
    
    const creditPacks = this._sortCreditPacks(
      rawPacks
        .map(pack => this._normalizeCreditPack(pack))
        .filter(pack => pack.unitsRemaining > 0)
    );

    console.log(`[CONSUME CREDITS] Packs disponibles:`, 
      creditPacks.map(p => ({ id: p.id, label: p.label, paid: p.paid, remaining: p.unitsRemaining }))
    );

    // Consumir créditos de forma optimizada
    for (const pack of creditPacks) {
      if (remainingUnits <= 0) break;

      const unitsToUse = this._calculateUnitsToUse(pack, remainingUnits, requiredUnits);
      
      if (unitsToUse > 0) {
        await tx.creditRedemption.create({
          data: { 
            creditPackId: pack.id, 
            appointmentId, 
            unitsUsed: unitsToUse 
          }
        });
        
        await tx.creditPack.update({
          where: { id: pack.id },
          data: { unitsRemaining: pack.unitsRemaining - unitsToUse }
        });
        
        remainingUnits -= unitsToUse;
        
        console.log(`[CONSUME CREDITS] Consumidas ${unitsToUse} unidades del pack ${pack.label} (${pack.paid ? 'PAGADO' : 'PENDIENTE'})`);
      }
    }

    if (remainingUnits > 0) {
      throw new Error(`Créditos insuficientes. Necesarios: ${requiredUnits}, consumidos: ${requiredUnits - remainingUnits}`);
    }
  }

  /**
   * Calcula cuántas unidades usar de un pack específico
   */
  _calculateUnitsToUse(pack, remainingUnits, totalRequired) {
    // Para citas de 60 minutos (requieren 2 unidades)
    if (totalRequired === 2) {
      if (pack.unitsRemaining < 2) return 0;
      
      const isSesion60 = pack.label?.startsWith('Sesión') && pack.unitMinutes === 60;
      const isBono60 = pack.unitMinutes === 60 && !pack.label?.startsWith('Sesión');
      
      if (isSesion60 || isBono60) {
        return Math.min(2, remainingUnits);
      }
      
      // Packs generales: consumir en pares
      const pairs = Math.floor(pack.unitsRemaining / 2);
      return pairs > 0 ? Math.min(pairs * 2, remainingUnits) : 0;
    }
    
    // Para citas de 30 minutos (requieren 1 unidad)
    return Math.min(remainingUnits, pack.unitsRemaining);
  }

  /**
   * Revierte el consumo de créditos
   */
  async revertCredits(appointmentId, transaction = null) {
    const tx = transaction || prisma;
    
    console.log(`[REVERT CREDITS] Appointment ${appointmentId}`);
    
    const redemptions = await tx.creditRedemption.findMany({
      where: { appointmentId },
      include: { creditPack: true }
    });

    for (const redemption of redemptions) {
      const pack = redemption.creditPack;
      if (!pack) {
        console.warn(`[REVERT CREDITS] Pack no encontrado para redemption ${redemption.id}`);
        continue;
      }

      const currentUnits = Number(pack.unitsRemaining) || 0;
      const unitsToRevert = Number(redemption.unitsUsed) || 0;
      const newUnits = currentUnits + unitsToRevert;

      await tx.creditPack.update({
        where: { id: redemption.creditPackId },
        data: { unitsRemaining: newUnits }
      });
      
      console.log(`[REVERT CREDITS] Revertidas ${unitsToRevert} unidades al pack ${pack.label}`);
    }

    await tx.creditRedemption.deleteMany({
      where: { appointmentId }
    });
  }

  // ===== OPERACIONES PRINCIPALES =====

  /**
   * Crea una nueva cita con validaciones y consumo de créditos
   */
  async createAppointment(data) {
    const { start, end, patientId, durationMinutes = 30, consumesCredit = true, notes } = data;
    
    console.log(`[CREATE APPOINTMENT] Duration: ${durationMinutes}min, Start: ${start}, End: ${end}`);

    // Normalizar fechas
    const startMoment = moment.tz(start, TIMEZONE);
    let endMoment = moment.tz(end, TIMEZONE);

    // Auto-detectar duración de 60min si hay packs disponibles
    let finalDuration = durationMinutes;
    if (consumesCredit && patientId) {
      const sixtyMinPack = await prisma.creditPack.findFirst({
        where: {
          patientId,
          unitMinutes: 60,
          unitsRemaining: { gte: 2 }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (sixtyMinPack && durationMinutes !== 60) {
        finalDuration = 60;
        endMoment = startMoment.clone().add(60, 'minutes');
        console.log(`[CREATE APPOINTMENT] Auto-ajustada a 60min por pack disponible: ${sixtyMinPack.id}`);
      }
    }

    // Validar solapamiento
    const overlap = await this.checkOverlap(startMoment.toDate(), endMoment.toDate());
    if (overlap) {
      const error = new Error('Ya existe una cita en este horario');
      error.code = 'APPOINTMENT_OVERLAP';
      throw error;
    }

    // Validar créditos disponibles
    if (consumesCredit && patientId) {
      const requiredUnits = this._calculateRequiredUnits(finalDuration);
      const availableUnits = await this.getPatientAvailableCredits(patientId);

      if (availableUnits < requiredUnits) {
        const error = new Error(`Créditos insuficientes. Necesarios: ${requiredUnits}, disponibles: ${availableUnits}`);
        error.code = 'INSUFFICIENT_CREDITS';
        error.requiredUnits = requiredUnits;
        error.availableUnits = availableUnits;
        throw error;
      }
    }

    // Crear cita en transacción
    return await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          start: this._toUTC(startMoment.toDate()),
          end: this._toUTC(endMoment.toDate()),
          patientId,
          durationMinutes: finalDuration,
          consumesCredit,
          notes
        },
        include: {
          patient: true,
          creditRedemptions: { include: { creditPack: true } }
        }
      });

      // Consumir créditos si es necesario
      if (consumesCredit && patientId) {
        await this.consumeCredits(patientId, appointment.id, finalDuration, tx);
      }

      return appointment;
    });
  }

  /**
   * Actualiza una cita existente con manejo inteligente de créditos
   */
  async updateAppointment(id, updates) {
    const { start, end, patientId, durationMinutes, consumesCredit, notes, status, paid } = updates;
    
    console.log(`[UPDATE APPOINTMENT] ${id}`, {
      start: start?.substring(0, 19),
      end: end?.substring(0, 19),
      patientId,
      durationMinutes,
      consumesCredit,
      notes: notes ? '...' : undefined,
      status,
      paid
    });

    // Validar solapamiento si se cambian fechas
    if (start && end) {
      const overlap = await this.checkOverlap(start, end, id);
      if (overlap) {
        const error = new Error('Ya existe una cita en este horario');
        error.code = 'APPOINTMENT_OVERLAP';
        throw error;
      }
    }

    // Obtener cita actual con sus redemptions
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { 
        creditRedemptions: { include: { creditPack: true } }
      }
    });

    if (!currentAppointment) {
      throw new Error('Cita no encontrada');
    }

    const currentlyPaid = this._isAppointmentPaid(currentAppointment);
    
    // Determinar tipo de cambios
    const hasStructuralChanges = this._hasStructuralChanges(currentAppointment, updates);
    const isTimeOnlyChange = !hasStructuralChanges && (start || end);
    const isPaymentStatusChange = paid !== undefined;

    console.log(`[UPDATE APPOINTMENT] ${id} - Análisis:`, {
      currentlyPaid,
      hasStructuralChanges,
      isTimeOnlyChange,
      isPaymentStatusChange,
      paidParam: paid
    });

    return await prisma.$transaction(async (tx) => {
      // 1. Revertir créditos si es necesario (solo para cambios estructurales en citas no pagadas)
      if (hasStructuralChanges && currentAppointment.consumesCredit && !currentlyPaid) {
        console.log(`[UPDATE APPOINTMENT] Revirtiendo créditos para cambios estructurales`);
        await this.revertCredits(id, tx);
      }

      // 2. Actualizar datos básicos de la cita
      const appointment = await tx.appointment.update({
        where: { id },
        data: {
          ...(start && { start: this._toUTC(start) }),
          ...(end && { end: this._toUTC(end) }),
          ...(durationMinutes !== undefined && { durationMinutes }),
          ...(patientId !== undefined && { patientId }),
          ...(consumesCredit !== undefined && { consumesCredit }),
          ...(notes !== undefined && { notes }),
          ...(status && { status })
        },
        include: {
          patient: true,
          creditRedemptions: { include: { creditPack: true } }
        }
      });

      // 3. Procesar cambios de estado de pago
      await this._processPaymentStatusChange(appointment, paid, currentlyPaid, tx);

      // 4. Re-consumir créditos si hubo cambios estructurales y la cita no está pagada
      const finalPaidStatus = this._isAppointmentPaid(appointment);
      
      if (hasStructuralChanges && appointment.consumesCredit && !finalPaidStatus && paid !== true) {
        console.log(`[UPDATE APPOINTMENT] Re-consumiendo créditos para cambios estructurales`);
        const finalDuration = durationMinutes ?? currentAppointment.durationMinutes;
        const finalPatientId = patientId ?? currentAppointment.patientId;
        
        if (finalPatientId) {
          await this.consumeCredits(finalPatientId, appointment.id, finalDuration, tx);
        }
      }

      // Agregar estado de pago calculado a la respuesta
      appointment.paid = this._isAppointmentPaid(appointment);
      
      return appointment;
    });
  }

  /**
   * Determina si hay cambios estructurales que afectan el consumo de créditos
   */
  _hasStructuralChanges(current, updates) {
    return (
      (updates.durationMinutes !== undefined && updates.durationMinutes !== current.durationMinutes) ||
      (updates.consumesCredit !== undefined && updates.consumesCredit !== current.consumesCredit) ||
      (updates.patientId !== undefined && updates.patientId !== current.patientId)
    );
  }

  /**
   * Procesa cambios en el estado de pago
   */
  async _processPaymentStatusChange(appointment, requestedPaidStatus, currentlyPaid, tx) {
    if (requestedPaidStatus === undefined) return;

    if (requestedPaidStatus === true && !currentlyPaid) {
      // Marcar como pagada
      await this._markAppointmentAsPaid(appointment, tx);
    } else if (requestedPaidStatus === false && currentlyPaid) {
      // Marcar como no pagada
      await this._markAppointmentAsUnpaid(appointment, tx);
    } else if (requestedPaidStatus === true && currentlyPaid) {
      console.log(`[UPDATE APPOINTMENT] Cita ${appointment.id} ya está pagada`);
    } else if (requestedPaidStatus === false && !currentlyPaid) {
      console.log(`[UPDATE APPOINTMENT] Cita ${appointment.id} ya está como no pagada`);
    }
  }

  /**
   * Marca una cita como pagada
   */
  async _markAppointmentAsPaid(appointment, tx) {
    if (!appointment.consumesCredit || !appointment.patientId) return;

    console.log(`[UPDATE APPOINTMENT] Marcando cita ${appointment.id} como pagada`);

    // Si no hay redemptions, crear consumo
    if (!appointment.creditRedemptions || appointment.creditRedemptions.length === 0) {
      await this.consumeCredits(appointment.patientId, appointment.id, appointment.durationMinutes, tx);
    }

    // Marcar todos los packs usados como pagados
    const redemptions = await tx.creditRedemption.findMany({
      where: { appointmentId: appointment.id }
    });

    for (const redemption of redemptions) {
      await tx.creditPack.update({
        where: { id: redemption.creditPackId },
        data: { paid: true }
      });
    }
  }

  /**
   * Marca una cita como no pagada
   */
  async _markAppointmentAsUnpaid(appointment, tx) {
    console.log(`[UPDATE APPOINTMENT] Marcando cita ${appointment.id} como no pagada`);

    const redemptions = await tx.creditRedemption.findMany({
      where: { appointmentId: appointment.id }
    });

    for (const redemption of redemptions) {
      await tx.creditPack.update({
        where: { id: redemption.creditPackId },
        data: { paid: false }
      });
    }
  }

  /**
   * Cancela una cita y revierte sus créditos
   */
  async cancelAppointment(id) {
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    return await prisma.$transaction(async (tx) => {
      // Revertir créditos si es necesario
      if (appointment.consumesCredit && appointment.patientId) {
        await this.revertCredits(id, tx);
      }

      return await tx.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { patient: true }
      });
    });
  }

  // ===== CONSULTAS =====

  /**
   * Obtiene citas por rango de fechas
   */
  async getAppointmentsByRange(from, to) {
    const fromUTC = this._toUTC(from);
    const toUTC = this._toUTC(to);

    const appointments = await prisma.appointment.findMany({
      where: {
        start: { gte: fromUTC },
        end: { lte: toUTC }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        creditRedemptions: {
          include: {
            creditPack: true
          }
        }
      },
      orderBy: { start: 'asc' }
    });

    // Agregar estado de pago calculado
    return appointments.map(appointment => ({
      ...appointment,
      paid: this._isAppointmentPaid(appointment)
    }));
  }
}

module.exports = new AppointmentService();
