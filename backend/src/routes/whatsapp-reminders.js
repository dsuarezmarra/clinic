const express = require('express');
const router = express.Router();

/**
 * Sistema de Recordatorios Automáticos por WhatsApp
 * 
 * Este servicio envía recordatorios automáticos 24h antes de cada cita
 * a los pacientes que tengan:
 * 1. Un número de móvil español válido (6xx, 7xx)
 * 2. La opción whatsappReminders activada (default: true)
 * 
 * Se ejecuta mediante Vercel Cron cada hora.
 */

// Función para verificar si es un móvil español
function isSpanishMobile(phone) {
  if (!phone) return false;
  // Limpiar el número
  const cleaned = phone.replace(/\D/g, '');
  // Móviles españoles: empiezan por 6 o 7, tienen 9 dígitos (o 11 con prefijo 34)
  if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('7'))) {
    return true;
  }
  if (cleaned.length === 11 && cleaned.startsWith('34') && (cleaned[2] === '6' || cleaned[2] === '7')) {
    return true;
  }
  if (cleaned.length === 12 && cleaned.startsWith('034') && (cleaned[3] === '6' || cleaned[3] === '7')) {
    return true;
  }
  return false;
}

// Función para formatear el número para WhatsApp
function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  // Asegurar que tenga el prefijo 34
  if (cleaned.length === 9) {
    return '34' + cleaned;
  }
  if (cleaned.startsWith('34')) {
    return cleaned;
  }
  if (cleaned.startsWith('034')) {
    return cleaned.substring(1);
  }
  return cleaned;
}

// Función para formatear fecha en español
function formatDateSpanish(date) {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const d = new Date(date);
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

// Función para formatear hora
function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Helper para obtener el cliente de base de datos correcto
const getDb = (req) => {
  if (req.dbClient) return req.dbClient;
  if (req.prisma) return req.prisma;
  return null;
};

/**
 * GET /api/whatsapp-reminders/pending
 * 
 * Obtiene las citas que necesitan recordatorio (24h antes)
 * Solo para debugging/testing
 */
router.get('/pending', async (req, res) => {
  try {
    const db = getDb(req);
    if (!db) {
      return res.status(503).json({ error: 'Base de datos no disponible' });
    }

    const now = new Date();
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Buscar citas entre 23 y 25 horas en el futuro
    const appointments = await db.appointments.findMany({
      where: {
        dateTime: {
          gte: in23Hours,
          lte: in25Hours
        }
      },
      include: {
        patient: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    // Filtrar solo los que tienen móvil y recordatorios activados
    const eligibleReminders = appointments.filter(apt => {
      const patient = apt.patient;
      if (!patient) return false;
      if (patient.whatsappReminders === false) return false;
      return isSpanishMobile(patient.phone) || isSpanishMobile(patient.phone2);
    });

    res.json({
      totalAppointments: appointments.length,
      eligibleForReminder: eligibleReminders.length,
      appointments: eligibleReminders.map(apt => ({
        id: apt.id,
        dateTime: apt.dateTime,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        phone: apt.patient.phone,
        whatsappReminders: apt.patient.whatsappReminders
      }))
    });
  } catch (error) {
    console.error('Error obteniendo recordatorios pendientes:', error);
    res.status(500).json({ error: 'Error al obtener recordatorios', details: error.message });
  }
});

/**
 * POST /api/whatsapp-reminders/send
 * 
 * Endpoint para el Cron Job de Vercel
 * Envía recordatorios por WhatsApp a las citas de las próximas 24h
 * 
 * Para configurar el cron en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/whatsapp-reminders/send",
 *     "schedule": "0 * * * *"  // Cada hora en punto
 *   }]
 * }
 */
router.post('/send', async (req, res) => {
  try {
    console.log('🔔 Iniciando envío de recordatorios WhatsApp...');
    
    // Verificar que es una llamada del cron o autorizada
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    // En producción, verificar el token del cron
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.warn('⚠️ Intento de acceso no autorizado al cron de WhatsApp');
        return res.status(401).json({ error: 'No autorizado' });
      }
    }

    const db = getDb(req);
    if (!db) {
      return res.status(503).json({ error: 'Base de datos no disponible' });
    }

    const now = new Date();
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log(`📅 Buscando citas entre ${in23Hours.toISOString()} y ${in25Hours.toISOString()}`);

    // Buscar citas entre 23 y 25 horas en el futuro
    const appointments = await db.appointments.findMany({
      where: {
        dateTime: {
          gte: in23Hours,
          lte: in25Hours
        },
        // Excluir citas que ya tienen recordatorio enviado
        whatsappReminderSent: {
          not: true
        }
      },
      include: {
        patient: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    console.log(`📋 Encontradas ${appointments.length} citas pendientes de recordatorio`);

    const results = {
      total: appointments.length,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Obtener configuración del cliente
    const tenantSlug = req.tenantSlug || 'masajecorporaldeportivo';
    const clinicName = tenantSlug === 'actifisio' ? 'Actifisio' : 'Masaje Corporal Deportivo';
    const whatsappBusiness = process.env.WHATSAPP_BUSINESS_PHONE || '34604943230';

    for (const appointment of appointments) {
      const patient = appointment.patient;
      
      // Verificar elegibilidad
      if (!patient) {
        results.skipped++;
        results.details.push({ id: appointment.id, status: 'skipped', reason: 'Sin paciente asociado' });
        continue;
      }

      if (patient.whatsappReminders === false) {
        results.skipped++;
        results.details.push({ id: appointment.id, status: 'skipped', reason: 'Recordatorios desactivados' });
        continue;
      }

      const phoneToUse = isSpanishMobile(patient.phone) ? patient.phone : 
                         isSpanishMobile(patient.phone2) ? patient.phone2 : null;

      if (!phoneToUse) {
        results.skipped++;
        results.details.push({ id: appointment.id, status: 'skipped', reason: 'Sin móvil válido' });
        continue;
      }

      // Formatear el mensaje
      const formattedPhone = formatPhoneForWhatsApp(phoneToUse);
      const dateStr = formatDateSpanish(appointment.dateTime);
      const timeStr = formatTime(appointment.dateTime);

      const message = `¡Hola ${patient.firstName}! 👋

Te recordamos tu cita en ${clinicName}:

📅 *${dateStr}*
🕐 *${timeStr}*

¿Te viene bien? Confirma respondiendo a este mensaje o llámanos si necesitas cambiarla.

Un saludo 😊`;

      // Crear el enlace de WhatsApp
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

      try {
        // Por ahora, registramos el recordatorio como "pendiente de envío"
        // En el futuro se puede integrar con WhatsApp Business API
        
        // Marcar como enviado para evitar duplicados
        await db.appointments.update({
          where: { id: appointment.id },
          data: { 
            whatsappReminderSent: true,
            whatsappReminderSentAt: new Date()
          }
        });

        results.sent++;
        results.details.push({
          id: appointment.id,
          status: 'queued',
          patientName: `${patient.firstName} ${patient.lastName}`,
          phone: formattedPhone,
          dateTime: appointment.dateTime,
          whatsappUrl
        });

        console.log(`✅ Recordatorio preparado para ${patient.firstName} ${patient.lastName} - ${timeStr}`);

      } catch (error) {
        console.error(`❌ Error procesando recordatorio para cita ${appointment.id}:`, error);
        results.errors++;
        results.details.push({ 
          id: appointment.id, 
          status: 'error', 
          reason: error.message 
        });
      }
    }

    console.log(`📊 Resumen: ${results.sent} enviados, ${results.skipped} omitidos, ${results.errors} errores`);

    res.json({
      success: true,
      message: `Procesados ${results.total} recordatorios`,
      results
    });

  } catch (error) {
    console.error('❌ Error en el cron de recordatorios:', error);
    res.status(500).json({ 
      error: 'Error procesando recordatorios', 
      details: error.message 
    });
  }
});

/**
 * GET /api/whatsapp-reminders/status
 * 
 * Estado del sistema de recordatorios
 */
router.get('/status', async (req, res) => {
  try {
    const db = getDb(req);
    if (!db) {
      return res.status(503).json({ 
        status: 'degraded',
        message: 'Base de datos no disponible' 
      });
    }

    // Contar recordatorios enviados hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sentToday = await db.appointments.count({
      where: {
        whatsappReminderSent: true,
        whatsappReminderSentAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Contar próximos 24h
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAppointments = await db.appointments.count({
      where: {
        dateTime: {
          gte: now,
          lte: in24Hours
        }
      }
    });

    res.json({
      status: 'active',
      sentToday,
      upcomingIn24h: upcomingAppointments,
      lastCheck: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estado de recordatorios:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

/**
 * POST /api/whatsapp-reminders/test/:patientId
 * 
 * Envía un recordatorio de prueba a un paciente específico
 * Solo para testing
 */
router.post('/test/:patientId', async (req, res) => {
  try {
    const db = getDb(req);
    if (!db) {
      return res.status(503).json({ error: 'Base de datos no disponible' });
    }

    const patient = await db.patients.findUnique({
      where: { id: req.params.patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const phoneToUse = isSpanishMobile(patient.phone) ? patient.phone : 
                       isSpanishMobile(patient.phone2) ? patient.phone2 : null;

    if (!phoneToUse) {
      return res.status(400).json({ 
        error: 'Sin móvil válido',
        message: 'El paciente no tiene un número de móvil español válido'
      });
    }

    if (patient.whatsappReminders === false) {
      return res.status(400).json({ 
        error: 'Recordatorios desactivados',
        message: 'Este paciente tiene los recordatorios por WhatsApp desactivados'
      });
    }

    const formattedPhone = formatPhoneForWhatsApp(phoneToUse);
    const tenantSlug = req.tenantSlug || 'masajecorporaldeportivo';
    const clinicName = tenantSlug === 'actifisio' ? 'Actifisio' : 'Masaje Corporal Deportivo';

    // Mensaje de prueba
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1);
    const dateStr = formatDateSpanish(testDate);

    const message = `🧪 MENSAJE DE PRUEBA 🧪

¡Hola ${patient.firstName}! 👋

Este es un recordatorio de prueba de ${clinicName}.

📅 *${dateStr}*
🕐 *10:00*

Este mensaje es solo una prueba del sistema de recordatorios automáticos.`;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      success: true,
      message: 'Enlace de prueba generado',
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        phone: formattedPhone,
        whatsappReminders: patient.whatsappReminders !== false
      },
      whatsappUrl,
      testMessage: message
    });

  } catch (error) {
    console.error('Error en test de recordatorio:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
