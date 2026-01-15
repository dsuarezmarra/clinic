/**
 * Rutas de Facturación
 * 
 * Endpoints para generación de facturas PDF
 */

const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoice.service');
const { requireAuth } = require('../middleware/auth');

// ===== MIDDLEWARE DE AUTENTICACIÓN GLOBAL =====
// Todas las rutas de facturas requieren autenticación
router.use(requireAuth);

/**
 * POST /api/invoices/generate
 * 
 * Genera una factura PDF para un paciente y sus citas
 * 
 * Body:
 * {
 *   patientId: string,
 *   appointmentIds: string[],  // IDs de las citas a facturar
 *   fiscalConfig?: object      // Configuración fiscal (opcional, usa default)
 * }
 */
router.post('/generate', async (req, res) => {
    try {
        const { patientId, appointmentIds, fiscalConfig } = req.body;
        const db = req.db;

        if (!patientId) {
            return res.status(400).json({ error: 'Se requiere patientId' });
        }

        if (!appointmentIds || appointmentIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos una cita' });
        }

        // Obtener datos del paciente
        const patient = await db.patients.findUnique({
            where: { id: patientId }
        });

        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Obtener citas
        const appointments = await db.appointments.findMany({
            where: {
                id: { in: appointmentIds }
            }
        });

        if (appointments.length === 0) {
            return res.status(404).json({ error: 'No se encontraron citas' });
        }

        // Generar número de factura (simple: timestamp + random)
        const invoiceNumber = Date.now() % 100000;

        // Generar PDF
        const pdfBuffer = await invoiceService.generateInvoicePDF({
            patient,
            appointments,
            fiscalConfig: fiscalConfig || invoiceService.DEFAULT_FISCAL_CONFIG,
            invoiceNumber
        });

        // Enviar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${invoiceNumber}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generando factura:', error);
        
        if (error.message.includes('PDFKit no está instalado')) {
            return res.status(501).json({ 
                error: 'Servicio de facturación no configurado',
                details: 'Instalar pdfkit: npm install pdfkit'
            });
        }
        
        res.status(500).json({ error: 'Error generando factura' });
    }
});

/**
 * GET /api/invoices/config
 * 
 * Devuelve la configuración fiscal actual (para verificar datos)
 */
router.get('/config', (req, res) => {
    res.json({
        configured: false,
        message: 'Configuración fiscal pendiente - proporcionar datos del negocio',
        requiredFields: {
            businessName: 'Razón social',
            taxId: 'CIF/NIF',
            address: 'Dirección fiscal',
            city: 'Ciudad',
            postalCode: 'Código postal',
            province: 'Provincia',
            vatExempt: 'Exento de IVA (true/false)',
            vatRate: 'Tipo de IVA si no exento (21, 10, 4)'
        },
        currentDefaults: invoiceService.DEFAULT_FISCAL_CONFIG
    });
});

/**
 * POST /api/invoices/config
 * 
 * Actualiza la configuración fiscal (en producción esto debería 
 * guardarse en la base de datos)
 */
router.post('/config', async (req, res) => {
    // TODO: Guardar en base de datos (tabla config o settings)
    res.status(501).json({ 
        error: 'No implementado',
        message: 'Para configurar datos fiscales, actualiza DEFAULT_FISCAL_CONFIG en invoice.service.js o implementa persistencia en BD'
    });
});

module.exports = router;
