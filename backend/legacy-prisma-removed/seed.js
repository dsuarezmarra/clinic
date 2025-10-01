const prisma = require('../src/services/database');

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Crear pacientes de ejemplo
    const patients = [
        {
            firstName: 'María',
            lastName: 'García López',
            dni: '12345678A',
            cp: '28013',
            city: 'Madrid',
            province: 'Madrid',
            phone: '+34 123 456 789',
            address: 'Calle Mayor 123, Madrid',
            birthDate: new Date('1985-03-15'),
            notes: 'Paciente con dolor lumbar crónico'
        },
        {
            firstName: 'Juan',
            lastName: 'Pérez Martín',
            dni: '23456789B',
            cp: '08002',
            city: 'Barcelona',
            province: 'Barcelona',
            phone: '+34 987 654 321',
            address: 'Avenida de la Paz 45, Barcelona',
            birthDate: new Date('1978-07-22'),
            notes: 'Rehabilitación post-operatoria de rodilla'
        },
        {
            firstName: 'Ana',
            lastName: 'Rodríguez Silva',
            dni: '34567890C',
            cp: '46001',
            city: 'Valencia',
            province: 'Valencia',
            phone: '+34 555 123 456',
            address: 'Plaza del Sol 8, Valencia',
            birthDate: new Date('1992-11-03'),
            notes: 'Fisioterapia deportiva - tendinitis'
        },
        {
            firstName: 'Carlos',
            lastName: 'Fernández Ruiz',
            dni: '45678901D',
            cp: '41001',
            city: 'Sevilla',
            province: 'Sevilla',
            phone: '+34 666 789 012',
            address: 'Calle del Carmen 67, Sevilla',
            birthDate: new Date('1980-09-14'),
            notes: 'Tratamiento cervical por estrés laboral'
        }
        ,
        {
            firstName: 'Laura',
            lastName: 'Martínez Ruiz',
            dni: '56789012E',
            cp: '48001',
            city: 'Bilbao',
            province: 'Vizcaya',
            phone: '+34 644 111 222',
            address: 'Gran Vía 1, Bilbao',
            birthDate: new Date('1990-02-20'),
            notes: 'Fisioterapia general'
        },
        {
            firstName: 'Pedro',
            lastName: 'Gómez Castillo',
            dni: '67890123F',
            cp: '03001',
            city: 'Alicante',
            province: 'Alicante',
            phone: '+34 655 222 333',
            address: 'Rambla 5, Alicante',
            birthDate: new Date('1975-06-10'),
            notes: 'Rehabilitación deportiva'
        },
        {
            firstName: 'Isabel',
            lastName: 'Torres Vega',
            dni: '78901234G',
            cp: '50001',
            city: 'Zaragoza',
            province: 'Zaragoza',
            phone: '+34 622 333 444',
            address: 'Paseo Independencia 10, Zaragoza',
            birthDate: new Date('1988-12-01'),
            notes: 'Terapia manual'
        },
        {
            firstName: 'Miguel',
            lastName: 'Sánchez López',
            dni: '89012345H',
            cp: '18001',
            city: 'Granada',
            province: 'Granada',
            phone: '+34 633 444 555',
            address: 'Calle Elvira 12, Granada',
            birthDate: new Date('1982-04-05'),
            notes: 'Cristaloterapia preventiva'
        },
        {
            firstName: 'Lucía',
            lastName: 'Moreno Díaz',
            dni: '90123456J',
            cp: '07001',
            city: 'Palma',
            province: 'Islas Baleares',
            phone: '+34 644 555 666',
            address: 'Plaza Major 2, Palma',
            birthDate: new Date('1995-08-30'),
            notes: 'Paciente con molestias lumbares'
        },
        {
            firstName: 'Sergio',
            lastName: 'Ruiz Fernández',
            dni: '01234567K',
            cp: '15001',
            city: 'A Coruña',
            province: 'A Coruña',
            phone: '+34 611 666 777',
            address: 'Rúa Real 20, A Coruña',
            birthDate: new Date('1970-01-18'),
            notes: 'Seguimiento post-operatorio'
        },
        {
            firstName: 'Elena',
            lastName: 'Navarro López',
            dni: '11223344L',
            cp: '39001',
            city: 'Santander',
            province: 'Cantabria',
            phone: '+34 622 777 888',
            address: 'Calle Burgos 3, Santander',
            birthDate: new Date('1987-05-12'),
            notes: 'Rehabilitación de hombro'
        },
        {
            firstName: 'Rafael',
            lastName: 'Ortega Ramos',
            dni: '22334455M',
            cp: '30001',
            city: 'Murcia',
            province: 'Murcia',
            phone: '+34 699 888 999',
            address: 'Av. Libertad 8, Murcia',
            birthDate: new Date('1969-10-02'),
            notes: 'Paciente crónico - seguimiento'
        }
    ];

    console.log('👥 Creando pacientes...');
    const createdPatients = [];

    for (const patientData of patients) {
        const patient = await prisma.patient.create({
            data: patientData
        });
        createdPatients.push(patient);
        console.log(`✅ Paciente creado: ${patient.firstName} ${patient.lastName}`);
    }

    // Crear algunos packs de Sesiones de ejemplo
    console.log('💳 Creando packs de Sesiones...');

    // Para María García - algunos pagados y otros pendientes
    await prisma.creditPack.create({
        data: {
            patientId: createdPatients[0].id,
            label: 'Bono 10×30m',
            unitsTotal: 10,
            unitsRemaining: 8,
            priceCents: 24800, // equivalente a 5x60m = 248€
            paid: true,
            notes: 'Bono pagado en efectivo'
        }
    });

    await prisma.creditPack.create({
        data: {
            patientId: createdPatients[0].id,
            label: 'Vale 60m',
            unitsTotal: 2,
            unitsRemaining: 2,
            priceCents: 5500, // sesión 60m = 55€
            paid: false,
            notes: 'Pendiente de pago - transferencia'
        }
    });

    // Para Juan Pérez
    await prisma.creditPack.create({
        data: {
            patientId: createdPatients[1].id,
            label: 'Bono 5×60m',
            unitsTotal: 10,
            unitsRemaining: 6,
            priceCents: 24800, // bono 5x60m
            paid: true,
            notes: 'Bono rehabilitación - pagado por seguro'
        }
    });

    // Para Ana Rodríguez
    await prisma.creditPack.create({
        data: {
            patientId: createdPatients[2].id,
            label: 'Vale 30m',
            unitsTotal: 1,
            unitsRemaining: 1,
            priceCents: 3000, // sesión 30m = 30€
            paid: false,
            notes: 'Sesión de prueba - pendiente pago'
        }
    });
    try { if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect(); } catch (e) {}

    await prisma.creditPack.create({
        data: {
            patientId: createdPatients[2].id,
            label: 'Bono 8×30m',
            unitsTotal: 8,
            unitsRemaining: 5,
            priceCents: 21600, // ejemplo aproximado (8 unidades de 30m -> 8/5 * 135€ = 216€)
            paid: true,
            notes: 'Tratamiento deportivo - pagado'
        }
    });

    // Para Carlos Fernández
    await prisma.creditPack.create({
        data: {
            patientId: createdPatients[3].id,
            label: 'Bono 6×60m',
            unitsTotal: 12,
            unitsRemaining: 10,
            priceCents: 29760, // ejemplo: 6 sesiones de 60m -> (6/5)*248 = 297.6€ -> 29760 céntimos
            paid: false,
            notes: 'Tratamiento cervical - pendiente facturación empresa'
        }
    });

    console.log('✅ Seed completado exitosamente!');
    console.log(`📊 ${createdPatients.length} pacientes creados`);
    console.log('💳 6 packs de Sesiones creados (mix de pagados y pendientes)');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
