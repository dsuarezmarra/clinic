const prisma = require('./database');

/**
 * Genera el siguiente número de factura para un año dado
 * Formato: "YY/NNN" donde YY son los dos últimos dígitos del año y NNN es secuencial
 */
async function generateInvoiceNumber(year) {
    const yearShort = year % 100; // 2025 -> 25

    // Buscar la última factura del año
    const lastInvoice = await prisma.invoices.findFirst({
        where: { year },
        orderBy: { sequence: 'desc' }
    });

    const nextSequence = lastInvoice ? lastInvoice.sequence + 1 : 1;
    const invoiceNumber = `${yearShort}/${nextSequence.toString().padStart(3, '0')}`;

    return { number: invoiceNumber, sequence: nextSequence };
}

/**
 * Calcula los importes con IVA del 21%
 */
function calculateVatAmounts(grossAmountCents) {
    const vatRate = 0.21;
    const vatAmount = Math.round(grossAmountCents * vatRate);
    const totalAmount = grossAmountCents + vatAmount;

    return {
        grossAmount: grossAmountCents,
        vatAmount,
        totalAmount
    };
}

/**
 * Crea una factura para una cita específica
 */
async function createInvoiceForAppointment(appointment, year, month) {
    const invoiceData = await generateInvoiceNumber(year);
    const amounts = calculateVatAmounts(appointment.priceCents || 0);

    const invoice = await prisma.invoices.create({
        data: {
            number: invoiceData.number,
            year,
            sequence: invoiceData.sequence,
            patientId: appointment.patientId,
            issueDate: new Date(year, month - 1, new Date(appointment.start).getDate()),
            grossAmount: amounts.grossAmount,
            vatAmount: amounts.vatAmount,
            totalAmount: amounts.totalAmount,
            description: `Sesión de masaje - ${appointment.durationMinutes} minutos`,
            invoice_items: {
                create: [{
                    appointmentId: appointment.id,
                    description: `Sesión de masaje - ${appointment.durationMinutes} minutos`,
                    quantity: 1,
                    unitPrice: amounts.grossAmount,
                    totalPrice: amounts.grossAmount
                }]
            }
        },
        include: {
            patient: true,
            invoice_items: true
        }
    });

    return invoice;
}

/**
 * Crea una factura agrupada para múltiples citas del mismo paciente
 */
async function createInvoiceForPatientAppointments(appointments, year, month) {
    if (!appointments.length) return null;

    const patientId = appointments[0].patientId;
    const invoiceData = await generateInvoiceNumber(year);

    // Calcular totales
    const grossTotal = appointments.reduce((sum, apt) => sum + (apt.priceCents || 0), 0);
    const amounts = calculateVatAmounts(grossTotal);

    const invoice = await prisma.invoices.create({
        data: {
            number: invoiceData.number,
            year,
            sequence: invoiceData.sequence,
            patientId,
            issueDate: new Date(year, month - 1, 1),
            grossAmount: amounts.grossAmount,
            vatAmount: amounts.vatAmount,
            totalAmount: amounts.totalAmount,
            description: `Sesiones de masaje - ${appointments.length} sesiones`,
            invoice_items: {
                create: appointments.map(apt => ({
                    appointmentId: apt.id,
                    description: `Sesión de masaje - ${apt.durationMinutes} minutos`,
                    quantity: 1,
                    unitPrice: apt.priceCents || 0,
                    totalPrice: apt.priceCents || 0
                }))
            }
        },
        include: {
            patient: true,
            invoice_items: true
        }
    });

    return invoice;
}

module.exports = {
    generateInvoiceNumber,
    calculateVatAmounts,
    createInvoiceForAppointment,
    createInvoiceForPatientAppointments
};
