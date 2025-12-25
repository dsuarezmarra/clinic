/**
 * Servicio de Facturación - Generación de PDFs
 * 
 * NOTA: Requiere instalar pdfkit:
 * npm install pdfkit --save
 * 
 * Este servicio genera facturas PDF para citas y pacientes.
 */

// Descomenta cuando instales pdfkit:
// const PDFDocument = require('pdfkit');

/**
 * Configuración fiscal por defecto (PLACEHOLDER - el usuario debe proporcionar datos reales)
 */
const DEFAULT_FISCAL_CONFIG = {
    // Datos de la clínica
    businessName: 'MASAJE CORPORAL DEPORTIVO',  // Razón social
    taxId: 'PENDIENTE',                          // CIF/NIF
    address: 'C/ Ejemplo, 123',                  // Dirección fiscal
    city: 'Ciudad',
    postalCode: '00000',
    province: 'Provincia',
    phone: '+34 604 943 230',
    email: 'masajecorporaldeportivo@gmail.com',
    
    // Configuración de IVA
    vatExempt: true,                             // true si está exento de IVA (Art. 20 LIVA)
    vatExemptReason: 'Exento de IVA según Art. 20.Uno.3º LIVA - Servicios sanitarios',
    vatRate: 0,                                  // 0% si exento, 21% si no
    
    // Prefijo de numeración
    invoicePrefix: 'MCD',
    invoiceStartNumber: 1
};

/**
 * Genera número de factura secuencial
 */
function generateInvoiceNumber(prefix, sequenceNumber, year) {
    const paddedNumber = String(sequenceNumber).padStart(5, '0');
    return `${prefix}-${year}-${paddedNumber}`;
}

/**
 * Formatea precio en céntimos a euros con formato español
 */
function formatPrice(cents) {
    const euros = (cents / 100).toFixed(2);
    return euros.replace('.', ',') + ' €';
}

/**
 * Formatea fecha en formato español
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Genera una factura PDF para una cita o conjunto de citas
 * 
 * @param {Object} options - Opciones de la factura
 * @param {Object} options.patient - Datos del paciente
 * @param {Array} options.appointments - Citas a facturar
 * @param {Object} options.fiscalConfig - Configuración fiscal (opcional)
 * @param {number} options.invoiceNumber - Número secuencial de factura
 * @returns {Buffer} - Buffer del PDF generado
 */
async function generateInvoicePDF(options) {
    const {
        patient,
        appointments,
        fiscalConfig = DEFAULT_FISCAL_CONFIG,
        invoiceNumber
    } = options;

    // PLACEHOLDER: Cuando instales pdfkit, descomenta este código
    throw new Error('PDFKit no está instalado. Ejecuta: npm install pdfkit');

    /*
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Factura ${invoiceNumber}`,
                    Author: fiscalConfig.businessName
                }
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const year = new Date().getFullYear();
            const fullInvoiceNumber = generateInvoiceNumber(
                fiscalConfig.invoicePrefix, 
                invoiceNumber, 
                year
            );

            // =====================
            // CABECERA - Datos emisor
            // =====================
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text(fiscalConfig.businessName, 50, 50);
            
            doc.fontSize(10)
               .font('Helvetica')
               .text(`CIF/NIF: ${fiscalConfig.taxId}`, 50, 75)
               .text(fiscalConfig.address, 50, 88)
               .text(`${fiscalConfig.postalCode} ${fiscalConfig.city} (${fiscalConfig.province})`, 50, 101)
               .text(`Tel: ${fiscalConfig.phone}`, 50, 114)
               .text(`Email: ${fiscalConfig.email}`, 50, 127);

            // =====================
            // FACTURA - Número y fecha
            // =====================
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .text('FACTURA', 400, 50, { align: 'right' });
            
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Nº: ${fullInvoiceNumber}`, 400, 75, { align: 'right' })
               .text(`Fecha: ${formatDate(new Date())}`, 400, 88, { align: 'right' });

            // Línea separadora
            doc.moveTo(50, 160)
               .lineTo(545, 160)
               .stroke();

            // =====================
            // DATOS CLIENTE
            // =====================
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('DATOS DEL CLIENTE', 50, 175);
            
            doc.fontSize(10)
               .font('Helvetica')
               .text(`${patient.firstName} ${patient.lastName}`, 50, 195)
               .text(patient.address || '', 50, 208)
               .text(`${patient.postalCode || ''} ${patient.city || ''}`, 50, 221);
            
            if (patient.taxId) {
                doc.text(`NIF/NIE: ${patient.taxId}`, 50, 234);
            }

            // =====================
            // TABLA DE SERVICIOS
            // =====================
            let tableTop = 280;
            
            // Cabecera de tabla
            doc.rect(50, tableTop, 495, 25).fill('#f0f0f0');
            doc.fillColor('#000000')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('FECHA', 55, tableTop + 8)
               .text('CONCEPTO', 130, tableTop + 8)
               .text('IMPORTE', 470, tableTop + 8, { align: 'right' });

            tableTop += 30;
            let totalCents = 0;

            // Filas de servicios
            doc.font('Helvetica');
            appointments.forEach((apt, index) => {
                const y = tableTop + (index * 25);
                const date = formatDate(apt.start);
                const duration = apt.durationMinutes || 30;
                const concept = `Sesión de fisioterapia (${duration} min)`;
                const price = apt.priceCents || (duration >= 60 ? 5500 : 3000);
                totalCents += price;

                // Alternar fondo
                if (index % 2 === 1) {
                    doc.rect(50, y - 5, 495, 25).fill('#fafafa');
                    doc.fillColor('#000000');
                }

                doc.text(date, 55, y)
                   .text(concept, 130, y)
                   .text(formatPrice(price), 470, y, { align: 'right' });
            });

            // =====================
            // TOTALES
            // =====================
            const totalsY = tableTop + (appointments.length * 25) + 30;
            
            doc.moveTo(350, totalsY)
               .lineTo(545, totalsY)
               .stroke();

            if (fiscalConfig.vatExempt) {
                // Sin IVA - exento
                doc.fontSize(10)
                   .font('Helvetica')
                   .text('Base imponible:', 350, totalsY + 10)
                   .text(formatPrice(totalCents), 470, totalsY + 10, { align: 'right' });
                
                doc.fontSize(8)
                   .text(fiscalConfig.vatExemptReason, 350, totalsY + 25, { width: 195 });
                
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('TOTAL:', 350, totalsY + 50)
                   .text(formatPrice(totalCents), 470, totalsY + 50, { align: 'right' });
            } else {
                // Con IVA
                const vatAmount = Math.round(totalCents * fiscalConfig.vatRate / 100);
                const total = totalCents + vatAmount;

                doc.fontSize(10)
                   .font('Helvetica')
                   .text('Base imponible:', 350, totalsY + 10)
                   .text(formatPrice(totalCents), 470, totalsY + 10, { align: 'right' })
                   .text(`IVA (${fiscalConfig.vatRate}%):`, 350, totalsY + 25)
                   .text(formatPrice(vatAmount), 470, totalsY + 25, { align: 'right' });
                
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('TOTAL:', 350, totalsY + 50)
                   .text(formatPrice(total), 470, totalsY + 50, { align: 'right' });
            }

            // =====================
            // PIE DE PÁGINA
            // =====================
            doc.fontSize(8)
               .font('Helvetica')
               .text('Gracias por confiar en nosotros.', 50, 750, { align: 'center' })
               .text(`${fiscalConfig.businessName} - ${fiscalConfig.phone}`, 50, 765, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
    */
}

/**
 * Genera factura simplificada (ticket) para cita individual
 */
async function generateSimpleReceipt(options) {
    // Similar a generateInvoicePDF pero con formato más simple
    throw new Error('PDFKit no está instalado. Ejecuta: npm install pdfkit');
}

module.exports = {
    generateInvoicePDF,
    generateSimpleReceipt,
    generateInvoiceNumber,
    formatPrice,
    formatDate,
    DEFAULT_FISCAL_CONFIG
};
