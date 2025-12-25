/**
 * Servicio de Email - Envío de notificaciones y confirmaciones
 * 
 * CONFIGURACIÓN REQUERIDA:
 * 1. Crear una "App Password" en Gmail:
 *    - Ir a https://myaccount.google.com/apppasswords
 *    - Generar contraseña para "Correo" en "Otro dispositivo"
 * 
 * 2. Configurar variables de entorno en Vercel:
 *    - EMAIL_HOST=smtp.gmail.com
 *    - EMAIL_PORT=587
 *    - EMAIL_USER=masajecorporaldeportivo@gmail.com
 *    - EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx (App Password de 16 caracteres)
 *    - EMAIL_FROM="Masaje Corporal Deportivo <masajecorporaldeportivo@gmail.com>"
 * 
 * NOTA: Requiere instalar nodemailer:
 * npm install nodemailer --save
 */

// Descomenta cuando instales nodemailer:
// const nodemailer = require('nodemailer');

/**
 * Configuración del transporte de email
 */
function createTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email no configurado. Establecer EMAIL_USER y EMAIL_PASSWORD');
    }

    // Descomentar cuando instales nodemailer:
    throw new Error('Nodemailer no está instalado. Ejecuta: npm install nodemailer');
    
    /*
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true para 465, false para otros puertos
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    */
}

/**
 * Plantilla HTML base para emails
 */
function getEmailTemplate(content, clinicName = 'Masaje Corporal Deportivo') {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #fff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .appointment-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
        }
        .appointment-box .date {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
        }
        .appointment-box .time {
            font-size: 16px;
            color: #555;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .button.secondary {
            background: #6c757d;
        }
        .button.whatsapp {
            background: #25D366;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${clinicName}</h1>
    </div>
    <div class="content">
        ${content}
    </div>
    <div class="footer">
        <p>Este es un email automático, por favor no responda directamente.</p>
        <p>${clinicName} | Tel: +34 604 943 230</p>
    </div>
</body>
</html>
    `;
}

/**
 * Envía confirmación de cita al paciente
 * 
 * @param {Object} options
 * @param {Object} options.patient - Datos del paciente
 * @param {Object} options.appointment - Datos de la cita
 * @param {string} options.clinicName - Nombre de la clínica
 * @param {string} options.clinicPhone - Teléfono de la clínica
 */
async function sendAppointmentConfirmation(options) {
    const { patient, appointment, clinicName, clinicPhone } = options;

    if (!patient.email) {
        throw new Error('El paciente no tiene email configurado');
    }

    const appointmentDate = new Date(appointment.start);
    const dateStr = appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeStr = appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const content = `
        <h2>¡Hola ${patient.firstName}!</h2>
        <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
        
        <div class="appointment-box">
            <div class="date">📅 ${dateStr}</div>
            <div class="time">🕐 ${timeStr}</div>
        </div>
        
        <p><strong>Ubicación:</strong> [Dirección de la clínica]</p>
        
        <p>Si necesitas modificar o cancelar tu cita, por favor contáctanos:</p>
        
        <p style="text-align: center;">
            <a href="https://wa.me/34604943230" class="button whatsapp">
                📱 WhatsApp
            </a>
            <a href="tel:+34604943230" class="button secondary">
                📞 Llamar
            </a>
        </p>
        
        <p>¡Te esperamos!</p>
    `;

    const transporter = createTransporter();
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"${clinicName}" <${process.env.EMAIL_USER}>`,
        to: patient.email,
        subject: `✅ Cita confirmada - ${dateStr} a las ${timeStr}`,
        html: getEmailTemplate(content, clinicName)
    };

    // Descomentar cuando instales nodemailer:
    // return await transporter.sendMail(mailOptions);
    throw new Error('Nodemailer no instalado');
}

/**
 * Envía recordatorio de cita (24h antes)
 */
async function sendAppointmentReminder(options) {
    const { patient, appointment, clinicName } = options;

    if (!patient.email) {
        throw new Error('El paciente no tiene email configurado');
    }

    const appointmentDate = new Date(appointment.start);
    const dateStr = appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    const timeStr = appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const content = `
        <h2>¡Hola ${patient.firstName}!</h2>
        <p>Te recordamos que tienes una cita <strong>mañana</strong>:</p>
        
        <div class="appointment-box">
            <div class="date">📅 ${dateStr}</div>
            <div class="time">🕐 ${timeStr}</div>
        </div>
        
        <p>Si no puedes asistir, por favor avísanos con antelación:</p>
        
        <p style="text-align: center;">
            <a href="https://wa.me/34604943230" class="button whatsapp">
                📱 Contactar por WhatsApp
            </a>
        </p>
        
        <p>¡Te esperamos!</p>
    `;

    const transporter = createTransporter();
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"${clinicName}" <${process.env.EMAIL_USER}>`,
        to: patient.email,
        subject: `🔔 Recordatorio: Cita mañana a las ${timeStr}`,
        html: getEmailTemplate(content, clinicName)
    };

    // Descomentar cuando instales nodemailer:
    // return await transporter.sendMail(mailOptions);
    throw new Error('Nodemailer no instalado');
}

/**
 * Envía email de cancelación
 */
async function sendAppointmentCancellation(options) {
    const { patient, appointment, clinicName, reason } = options;

    if (!patient.email) {
        throw new Error('El paciente no tiene email configurado');
    }

    const appointmentDate = new Date(appointment.start);
    const dateStr = appointmentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    const timeStr = appointmentDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const content = `
        <h2>Hola ${patient.firstName},</h2>
        <p>Tu cita ha sido <strong>cancelada</strong>:</p>
        
        <div class="appointment-box" style="border-color: #dc3545;">
            <div class="date" style="color: #dc3545;">❌ ${dateStr}</div>
            <div class="time">🕐 ${timeStr}</div>
        </div>
        
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        
        <p>Si deseas reagendar tu cita, contáctanos:</p>
        
        <p style="text-align: center;">
            <a href="https://wa.me/34604943230" class="button whatsapp">
                📱 Reagendar por WhatsApp
            </a>
        </p>
        
        <p>Disculpa las molestias.</p>
    `;

    const transporter = createTransporter();
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"${clinicName}" <${process.env.EMAIL_USER}>`,
        to: patient.email,
        subject: `❌ Cita cancelada - ${dateStr}`,
        html: getEmailTemplate(content, clinicName)
    };

    // Descomentar cuando instales nodemailer:
    // return await transporter.sendMail(mailOptions);
    throw new Error('Nodemailer no instalado');
}

/**
 * Verifica la configuración de email
 */
async function verifyEmailConfig() {
    try {
        const transporter = createTransporter();
        // Descomentar cuando instales nodemailer:
        // await transporter.verify();
        return { configured: true, message: 'Configuración de email correcta' };
    } catch (error) {
        return { 
            configured: false, 
            message: error.message,
            help: 'Configura EMAIL_USER y EMAIL_PASSWORD en las variables de entorno de Vercel'
        };
    }
}

module.exports = {
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendAppointmentCancellation,
    verifyEmailConfig,
    getEmailTemplate
};
