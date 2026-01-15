/**
 * Rutas de Email
 * 
 * Endpoints para envío de notificaciones por email
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
const { requireAuth } = require('../middleware/auth');

// ===== MIDDLEWARE DE AUTENTICACIÓN GLOBAL =====
// Todas las rutas de email requieren autenticación
router.use(requireAuth);

/**
 * GET /api/email/status
 * 
 * Verifica el estado de la configuración de email
 */
router.get('/status', async (req, res) => {
    try {
        const status = await emailService.verifyEmailConfig();
        res.json(status);
    } catch (error) {
        res.json({
            configured: false,
            error: error.message,
            help: 'Configura las variables EMAIL_USER y EMAIL_PASSWORD en Vercel'
        });
    }
});

/**
 * POST /api/email/send-confirmation
 * 
 * Envía confirmación de cita al paciente
 * 
 * Body:
 * {
 *   patientId: string,
 *   appointmentId: string
 * }
 */
router.post('/send-confirmation', async (req, res) => {
    try {
        const { patientId, appointmentId } = req.body;
        const db = req.db;

        if (!patientId || !appointmentId) {
            return res.status(400).json({ error: 'Se requiere patientId y appointmentId' });
        }

        // Obtener paciente
        const patient = await db.patients.findUnique({
            where: { id: patientId }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        if (!patient.email) {
            return res.status(400).json({ 
                error: 'El paciente no tiene email configurado',
                patientId: patientId
            });
        }

        // Obtener cita
        const appointment = await db.appointments.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        // Enviar email
        await emailService.sendAppointmentConfirmation({
            patient,
            appointment,
            clinicName: 'Masaje Corporal Deportivo',
            clinicPhone: '+34 604 943 230'
        });

        res.json({ 
            success: true, 
            message: `Email de confirmación enviado a ${patient.email}` 
        });

    } catch (error) {
        console.error('Error enviando email:', error);
        
        if (error.message.includes('no instalado') || error.message.includes('no configurado')) {
            return res.status(501).json({ 
                error: 'Servicio de email no configurado',
                details: error.message
            });
        }
        
        res.status(500).json({ error: 'Error enviando email' });
    }
});

/**
 * POST /api/email/send-reminder
 * 
 * Envía recordatorio de cita al paciente
 */
router.post('/send-reminder', async (req, res) => {
    try {
        const { patientId, appointmentId } = req.body;
        const db = req.db;

        if (!patientId || !appointmentId) {
            return res.status(400).json({ error: 'Se requiere patientId y appointmentId' });
        }

        const patient = await db.patients.findUnique({
            where: { id: patientId }
        });

        if (!patient?.email) {
            return res.status(400).json({ error: 'El paciente no tiene email' });
        }

        const appointment = await db.appointments.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        await emailService.sendAppointmentReminder({
            patient,
            appointment,
            clinicName: 'Masaje Corporal Deportivo'
        });

        res.json({ 
            success: true, 
            message: `Recordatorio enviado a ${patient.email}` 
        });

    } catch (error) {
        console.error('Error enviando recordatorio:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/email/send-cancellation
 * 
 * Envía notificación de cancelación
 */
router.post('/send-cancellation', async (req, res) => {
    try {
        const { patientId, appointmentId, reason } = req.body;
        const db = req.db;

        if (!patientId || !appointmentId) {
            return res.status(400).json({ error: 'Se requiere patientId y appointmentId' });
        }

        const patient = await db.patients.findUnique({
            where: { id: patientId }
        });

        if (!patient?.email) {
            return res.status(400).json({ error: 'El paciente no tiene email' });
        }

        const appointment = await db.appointments.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        await emailService.sendAppointmentCancellation({
            patient,
            appointment,
            clinicName: 'Masaje Corporal Deportivo',
            reason
        });

        res.json({ 
            success: true, 
            message: `Notificación de cancelación enviada a ${patient.email}` 
        });

    } catch (error) {
        console.error('Error enviando cancelación:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
