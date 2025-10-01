const prisma = require('./src/services/database').prisma || require('./src/services/database');

function sanitizeDni(dni) {
  if (!dni) return null;
  return String(dni).replace(/[^A-Za-z0-9]/g, '');
}

function sanitizePhone(phone) {
  if (!phone) return null;
  const s = String(phone).trim();
  if (s === '') return null;
  const hasPlus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

async function run() {
  try {
    console.log('Iniciando sanitización de DNIs...');
  // Also fetch phone and phone2 to normalize them
  const patients = await prisma.patient.findMany({ select: { id: true, dni: true, firstName: true, lastName: true, phone: true, phone2: true } });
    console.log(`Pacientes encontrados: ${patients.length}`);

    let updated = 0;
    let phoneUpdated = 0;
    let phone2Updated = 0;
    for (const p of patients) {
      const sanitized = sanitizeDni(p.dni);
      if (sanitized === null) continue;
      const updates = {};
      if (sanitized !== p.dni) {
        updates.dni = sanitized;
        updated++;
        console.log(`Actualizado ${p.id} (${p.firstName} ${p.lastName}): DNI '${p.dni}' -> '${sanitized}'`);
      }

      // Normalize phone and phone2 only if they exist or sanitized result is non-empty
      const sanitizedPhone = sanitizePhone(p.phone);
      if (sanitizedPhone !== p.phone && sanitizedPhone !== null) {
        updates.phone = sanitizedPhone;
        phoneUpdated++;
        console.log(`Actualizado ${p.id} (${p.firstName} ${p.lastName}): phone '${p.phone}' -> '${sanitizedPhone}'`);
      }

      const sanitizedPhone2 = sanitizePhone(p.phone2);
      if (sanitizedPhone2 !== p.phone2 && sanitizedPhone2 !== null) {
        updates.phone2 = sanitizedPhone2;
        phone2Updated++;
        console.log(`Actualizado ${p.id} (${p.firstName} ${p.lastName}): phone2 '${p.phone2}' -> '${sanitizedPhone2}'`);
      }

      if (Object.keys(updates).length > 0) {
        await prisma.patient.update({ where: { id: p.id }, data: updates });
      }
    }

    console.log(`Sanitización completada. DNIs actualizados: ${updated}, phone actualizados: ${phoneUpdated}, phone2 actualizados: ${phone2Updated}`);
  } catch (err) {
    console.error('Error durante sanitización:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
