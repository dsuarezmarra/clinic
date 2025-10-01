require('dotenv').config();
const prisma = require('../src/services/database');
const appointmentService = require('../src/services/appointmentService');

(async () => {
  try {
    console.log('🔎 Debug: crear paciente temporal...');
    const patient = await prisma.patients.create({
      data: {
        firstName: 'Debug',
        lastName: 'Paciente',
        dni: `DBG-${Date.now()}`,
        cp: '00000',
        city: 'DebugCity',
        province: 'DebugProv',
        phone: '+000000000',
        address: 'Calle Debug 1',
        birthDate: new Date('1990-01-01'),
        notes: 'Paciente para pruebas temporales'
      }
    });

    console.log('✅ Paciente creado:', patient.id);

    console.log('🔎 Creando pack (Bono 5×30m) para el paciente...');
    const pack = await prisma.credit_packs.create({
      data: {
        patientId: patient.id,
        label: 'Bono debug 5×30m',
        unitsTotal: 5,
        unitsRemaining: 5,
        unitMinutes: 30,
        paid: true,
        notes: 'pack debug'
      }
    });

    console.log('✅ Pack creado:', pack.id, 'unitsRemaining raw:', pack.unitsRemaining, typeof pack.unitsRemaining);
    // Normalizar para mostrar
    const normalized = {
      ...pack,
      unitsRemaining: Number(pack.unitsRemaining) || 0,
      unitsTotal: Number(pack.unitsTotal) || 0,
      unitMinutes: Number(pack.unitMinutes) || 30,
      paid: !!pack.paid
    };
    console.log('✅ Pack normalizado (para debug):', { id: normalized.id, unitsRemaining: normalized.unitsRemaining, unitsTotal: normalized.unitsTotal, unitMinutes: normalized.unitMinutes, paid: normalized.paid });

    console.log('🔎 Llamando a appointmentService.getPatientAvailableCredits...');
    const available = await appointmentService.getPatientAvailableCredits(patient.id);
    console.log('➡️ availableUnits:', available, typeof available);

    // Mostrar lista de packs desde DB
    const packs = await prisma.credit_packs.findMany({ where: { patientId: patient.id } });
    const normalizePack = p => ({
      ...p,
      unitsRemaining: Number(p.unitsRemaining) || 0,
      unitsTotal: Number(p.unitsTotal) || 0,
      unitMinutes: Number(p.unitMinutes) || 30,
      paid: !!p.paid,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null
    });
    console.log('📦 Packs en BD para paciente:', (packs || []).map(normalizePack));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error en debug:', err && err.message ? err.message : err);
    console.error(err);
    process.exit(2);
  }
})();
