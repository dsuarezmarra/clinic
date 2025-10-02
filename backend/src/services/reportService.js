const { Readable } = require('stream');
const prisma = require('./database');

/**
 * Generates a sequential invoice number for export purposes
 * Format: "YY/NNN" where YY are the last two digits of the year and NNN is sequential
 */
function generateSequentialInvoiceNumber(year, sequence) {
    const yearShort = year % 100; // 2025 -> 25
    return `${yearShort}/${sequence.toString().padStart(3, '0')}`;
}

function centsToEuroString(cents) {
    // Spanish format with comma as decimal separator (e.g. 55,00)
    const euros = (cents / 100).toFixed(2);
    return euros.replace('.', ',');
}

function sanitizeDni(dni) {
    if (!dni) return '';
    // Keep only letters and numbers
    return String(dni).replace(/[^A-Za-z0-9]/g, '');
}

function sanitizePhone(phone) {
    if (!phone) return '';
    const s = String(phone).trim();
    if (s === '') return '';
    // Keep digits and an optional leading + for international numbers
    const hasPlus = s.startsWith('+');
    const digits = s.replace(/\D/g, '');
    return hasPlus ? `+${digits}` : digits;
}

function formatDateSpanish(date) {
    // Format: DD/MM/YYYY
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Returns a readable stream that emits CSV rows for monthly billing with invoice format.
 * Generates sequential invoice numbers for export purposes.
 */
async function generateMonthlyBillingCsvStream({ year, month, groupBy = 'appointment' }) {
    const start = new Date(year, month - 1, 1, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0);

    console.log(`📊 Generando reporte para ${year}-${month}: ${start.toISOString()} a ${end.toISOString()}`);

    // Initialize invoice counter for sequential numbering
    let invoiceSequence = 1;
    const appointments = await prisma.appointment.findMany({
        where: {
            start: { gte: start, lt: end }
        },
        include: {
            patient: true,
            creditRedemptions: {
                include: { creditPack: true }
            }
        },
        orderBy: { start: 'asc' }
    });

    console.log(`📋 Citas encontradas: ${appointments.length}`);
    if (appointments.length > 0) {
        console.log(`📅 Primera cita: ${appointments[0].start}`);
        console.log(`📅 Última cita: ${appointments[appointments.length - 1].start}`);
    }

    const separator = ';';
    const rows = [];

    if (groupBy === 'patient') {
        // Group appointments by patient and create one invoice per patient
        const header = [
            'Nº Factura', 'Fecha Factura', 'Nombre', 'Apellidos',
            'Dirección', 'Ciudad', 'Provincia', 'C Postal', 'DNI',
            'Teléfono', 'Total Bruto', 'Iva', 'Neto'
        ];
        rows.push(header.join(separator));

        // Group by patient
        const byPatient = new Map();
        for (const apt of appointments) {
            // Calculate price based on how the appointment was paid:
            // 1. If paid with a credit pack/bono: calculate proportionally from pack price
            //    Example: 5x30min pack for 135€ = 27€ per session
            // 2. If paid individually: use sessionPrice30 (30€) or sessionPrice60 (55€)
            let priceCents = 0;
            
            if (apt.creditRedemptions && apt.creditRedemptions.length > 0) {
                const cr = apt.creditRedemptions[0];
                if (cr && cr.creditPack && typeof cr.creditPack.priceCents === 'number' && cr.creditPack.unitsTotal) {
                    const unitsTotal = Number(cr.creditPack.unitsTotal) || 0;
                    const unitsUsed = Number(cr.unitsUsed) || 0;
                    if (unitsTotal > 0 && unitsUsed > 0) {
                        // Price per unit from the pack
                        const perUnit = Math.round(cr.creditPack.priceCents / unitsTotal);
                        priceCents = perUnit * unitsUsed;
                    }
                }
            }
            
            // Fallback: individual session pricing
            if (!priceCents) {
                priceCents = apt.durationMinutes >= 60 ? 5500 : 3000;
            }

            // Update appointment with calculated price
            apt.priceCents = priceCents;

            const pid = apt.patient?.id || 'unknown';
            if (!byPatient.has(pid)) {
                byPatient.set(pid, []);
            }
            byPatient.get(pid).push(apt);
        }

        // Create mock invoices for each patient
        for (const [patientId, patientAppointments] of byPatient.entries()) {
            if (patientAppointments.length === 0) continue;

            try {
                // Calcular totales sin crear factura real
                const grossTotal = patientAppointments.reduce((sum, apt) => sum + (apt.priceCents || 0), 0);
                const vatAmount = Math.round(grossTotal * 0.21);
                const netAmount = grossTotal - vatAmount;
                
                // Generar número de factura secuencial
                const invoiceNumber = generateSequentialInvoiceNumber(year, invoiceSequence++);
                const patient = patientAppointments[0].patient || {};

                const row = [
                    invoiceNumber,
                    formatDateSpanish(new Date()),
                    patient.firstName || '',
                    patient.lastName || '',
                    patient.address || '',
                    patient.city || '',
                    patient.province || '',
                    patient.cp || '',
                    sanitizeDni(patient.dni),
                    sanitizePhone(patient.phone),
                    centsToEuroString(grossTotal),
                    centsToEuroString(vatAmount),
                    centsToEuroString(netAmount)
                ];

                rows.push(row.join(separator));
            } catch (error) {
                console.error('Error creating invoice for patient:', patientId, error);
            }
        }

    } else {
        // Create one invoice per appointment
        const header = [
            'Nº Factura', 'Fecha Factura', 'Nombre', 'Apellidos',
            'Dirección', 'Ciudad', 'Provincia', 'C Postal', 'DNI',
            'Teléfono', 'Total Bruto', 'Iva', 'Neto'
        ];
        rows.push(header.join(separator));

        for (const apt of appointments) {
            // Calculate price based on how the appointment was paid:
            // 1. If paid with a credit pack/bono: calculate proportionally from pack price
            //    Example: 5x30min pack for 135€ = 27€ per session
            // 2. If paid individually: use sessionPrice30 (30€) or sessionPrice60 (55€)
            let priceCents = 0;
            
            if (apt.creditRedemptions && apt.creditRedemptions.length > 0) {
                const cr = apt.creditRedemptions[0];
                if (cr && cr.creditPack && typeof cr.creditPack.priceCents === 'number' && cr.creditPack.unitsTotal) {
                    const unitsTotal = Number(cr.creditPack.unitsTotal) || 0;
                    const unitsUsed = Number(cr.unitsUsed) || 0;
                    if (unitsTotal > 0 && unitsUsed > 0) {
                        // Price per unit from the pack
                        const perUnit = Math.round(cr.creditPack.priceCents / unitsTotal);
                        priceCents = perUnit * unitsUsed;
                    }
                }
            }
            
            // Fallback: individual session pricing
            if (!priceCents) {
                priceCents = apt.durationMinutes >= 60 ? 5500 : 3000;
            }

            // Update appointment with calculated price
            apt.priceCents = priceCents;

            try {
                // Generar número de factura secuencial
                const invoiceNumber = generateSequentialInvoiceNumber(year, invoiceSequence++);
                const patient = apt.patient || {};
                
                // Calcular IVA (21%)
                const grossAmount = priceCents;
                const vatAmount = Math.round(grossAmount * 0.21);
                const netAmount = grossAmount - vatAmount;

                const row = [
                    invoiceNumber,
                    formatDateSpanish(apt.start),
                    patient.firstName || '',
                    patient.lastName || '',
                    patient.address || '',
                    patient.city || '',
                    patient.province || '',
                    patient.cp || '',
                    sanitizeDni(patient.dni),
                    sanitizePhone(patient.phone),
                    centsToEuroString(grossAmount),
                    centsToEuroString(vatAmount),
                    centsToEuroString(netAmount)
                ];

                rows.push(row.join(separator));
            } catch (error) {
                console.error('Error creating mock invoice for appointment:', apt.id, error);
            }
        }
    }

    const csvText = rows.join('\r\n');
    const readable = Readable.from(csvText);
    return readable;
}

module.exports = { generateMonthlyBillingCsvStream };
