const { getDbManager } = require('../src/database/database-manager');

(async () => {
  try {
    const dbManager = await getDbManager();
    const db = dbManager.createPrismaCompatibleInterface();

    const payload = {
      dni: '123876987T',
      firstName: 'Prueba123',
      lastName: 'Apellidos123',
      phone: '680453916',
      phone2: '67913649',
      email: null,
      address: 'Calle José Hierro 6, Portal 1, 5ºA',
      cp: '28701',
      city: 'San Sebastián de los Reyes',
      province: 'Madrid',
      birthDate: null,
      notes: 'Notas'
    };

    console.log('Usando manager supabase:', !!dbManager.supabase, 'isConnected:', dbManager.isConnected);
    const result = await db.patients.create({ data: payload });
    console.log('Resultado insert:', result);
  } catch (e) {
    console.error('Error directo:', e);
  }
})();
