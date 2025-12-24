const express = require('express');
const prisma = require('../services/database');
const moment = require('moment-timezone');

// Helper: prefer injected Supabase shim (req.prisma) otherwise fallback to Prisma
const getDb = (req) => req.prisma || prisma;

const router = express.Router();

/**
 * GET /api/stats/dashboard
 * Obtiene estadísticas generales para el dashboard
 * Query params:
 *   - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const now = moment().tz('Europe/Madrid');
    
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = now.clone().startOf('day');
        endDate = now.clone().endOf('day');
        break;
      case 'week':
        startDate = now.clone().startOf('isoWeek');
        endDate = now.clone().endOf('isoWeek');
        break;
      case 'month':
        startDate = now.clone().startOf('month');
        endDate = now.clone().endOf('month');
        break;
      case 'year':
        startDate = now.clone().startOf('year');
        endDate = now.clone().endOf('year');
        break;
      default:
        startDate = now.clone().startOf('month');
        endDate = now.clone().endOf('month');
    }

    // Convertir a UTC para las queries
    const startUTC = startDate.utc().toDate();
    const endUTC = endDate.utc().toDate();

    // 1. Citas en el período
    const appointments = await getDb(req).appointments.findMany({
      where: {
        start: {
          gte: startUTC,
          lte: endUTC
        }
      },
      include: {
        creditRedemptions: {
          include: {
            creditPack: true
          }
        }
      }
    });

    // 2. Citas completadas vs pendientes
    const completedAppointments = appointments.filter(a => 
      moment(a.start).isBefore(now)
    ).length;
    const pendingAppointments = appointments.filter(a => 
      moment(a.start).isAfter(now)
    ).length;

    // 3. Ingresos del período (sumando priceCents de citas)
    const totalRevenueCents = appointments.reduce((sum, apt) => {
      return sum + (Number(apt.priceCents) || 0);
    }, 0);

    // 4. Ingresos por estado de pago
    let paidRevenueCents = 0;
    let pendingRevenueCents = 0;
    
    appointments.forEach(apt => {
      const priceCents = Number(apt.priceCents) || 0;
      
      // Verificar si la cita está pagada a través del creditPack
      let isPaid = false;
      if (apt.creditRedemptions && apt.creditRedemptions.length > 0) {
        isPaid = apt.creditRedemptions.some(cr => cr.creditPack?.paid);
      } else if (priceCents > 0) {
        // Si no tiene creditRedemptions pero tiene precio, asumimos pagada
        isPaid = true;
      }
      
      if (isPaid) {
        paidRevenueCents += priceCents;
      } else {
        pendingRevenueCents += priceCents;
      }
    });

    // 5. Total de pacientes
    const totalPatients = await getDb(req).patients.count();

    // 6. Pacientes nuevos en el período
    const newPatients = await getDb(req).patients.count({
      where: {
        createdAt: {
          gte: startUTC,
          lte: endUTC
        }
      }
    });

    // 7. Packs de créditos activos
    const activePacks = await getDb(req).credit_packs.count({
      where: {
        unitsRemaining: {
          gt: 0
        }
      }
    });

    // 8. Packs pendientes de pago
    const unpaidPacks = await getDb(req).credit_packs.count({
      where: {
        paid: false,
        unitsRemaining: {
          gt: 0
        }
      }
    });

    // 9. Distribución de citas por día de la semana (para gráfico)
    const appointmentsByDay = [0, 0, 0, 0, 0, 0, 0]; // Lun-Dom
    appointments.forEach(apt => {
      const dayIndex = moment(apt.start).isoWeekday() - 1; // 0 = Lunes
      appointmentsByDay[dayIndex]++;
    });

    // 10. Ingresos por semana del mes (para gráfico)
    const revenueByWeek = [0, 0, 0, 0, 0];
    appointments.forEach(apt => {
      const weekOfMonth = Math.ceil(moment(apt.start).date() / 7) - 1;
      if (weekOfMonth >= 0 && weekOfMonth < 5) {
        revenueByWeek[weekOfMonth] += Number(apt.priceCents) || 0;
      }
    });

    // 11. Próximas citas de hoy
    const todayStart = now.clone().startOf('day').utc().toDate();
    const todayEnd = now.clone().endOf('day').utc().toDate();
    
    const todayAppointments = await getDb(req).appointments.findMany({
      where: {
        start: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { start: 'asc' },
      take: 10
    });

    const upcomingToday = todayAppointments.map(apt => ({
      id: apt.id,
      time: moment(apt.start).tz('Europe/Madrid').format('HH:mm'),
      duration: apt.durationMinutes || 30,
      patientName: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Sin paciente',
      patientId: apt.patient?.id
    }));

    res.json({
      period,
      periodLabel: getPeriodLabel(period, startDate, endDate),
      dateRange: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD')
      },
      appointments: {
        total: appointments.length,
        completed: completedAppointments,
        pending: pendingAppointments
      },
      revenue: {
        totalCents: totalRevenueCents,
        paidCents: paidRevenueCents,
        pendingCents: pendingRevenueCents,
        total: formatCurrency(totalRevenueCents),
        paid: formatCurrency(paidRevenueCents),
        pendingPayment: formatCurrency(pendingRevenueCents)
      },
      patients: {
        total: totalPatients,
        new: newPatients
      },
      creditPacks: {
        active: activePacks,
        unpaid: unpaidPacks
      },
      charts: {
        appointmentsByDay: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          data: appointmentsByDay
        },
        revenueByWeek: {
          labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
          data: revenueByWeek.map(cents => cents / 100) // Convertir a euros
        }
      },
      upcomingToday
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
});

// Helper: formatear moneda
function formatCurrency(cents) {
  const euros = (cents / 100).toFixed(2);
  return euros.replace('.', ',') + ' ?';
}

// Helper: etiqueta del período
function getPeriodLabel(period, start, end) {
  switch (period) {
    case 'today':
      return `Hoy, ${start.format('D [de] MMMM')}`;
    case 'week':
      return `Semana del ${start.format('D')} al ${end.format('D [de] MMMM')}`;
    case 'month':
      return start.format('MMMM YYYY');
    case 'year':
      return start.format('YYYY');
    default:
      return '';
  }
}

module.exports = router;
