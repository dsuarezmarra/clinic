require('dotenv').config();
const prisma = require('../src/services/database');
const appointmentService = require('../src/services/appointmentService');

(async () => {
  try {
    // Buscar el paciente debug creado por el otro script (el más reciente)
    const patients = await prisma.patients.findMany({ where: { lastName: 'Paciente', firstName: 'Debug' }, orderBy: { createdAt: 'desc' } });
    if (!patients || patients.length === 0) {
      console.error('❌ No se encontró paciente Debug. Ejecuta debug-packs-credits primero.');
      process.exit(3);
    }
    const patient = patients[0];
    console.log('➡️ Usando paciente:', patient.id);

    // Crear una cita dentro de una hora, duración 30 minutos
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();

    console.log('🔎 Intentando crear cita que consuma crédito 30m...');
    const appointment = await appointmentService.createAppointment({ start, end, patientId: patient.id, durationMinutes: 30, consumesCredit: true });
    console.log('✅ Cita creada:', appointment.id);

    // Verificar packs y redemptions
    const packs = await prisma.credit_packs.findMany({ where: { patientId: patient.id } });
    const redemptions = await prisma.credit_redemptions.findMany({ where: { appointmentId: appointment.id } });

    console.log('📦 Packs actuales:', packs.map(p => ({ id: p.id, unitsRemaining: p.unitsRemaining })));
    console.log('🔁 Redemptions creadas:', redemptions.map(r => ({ id: r.id, creditPackId: r.creditPackId, unitsUsed: r.unitsUsed })));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando cita debug:', err && err.message ? err.message : err);
    console.error(err);
    process.exit(2);
  }
})();
