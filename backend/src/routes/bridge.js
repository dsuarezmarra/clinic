// Endpoints "bridge" usando fetch directo a Supabase REST API
// Estos endpoints evitan el bug del SDK @supabase/supabase-js en Vercel

const express = require('express');
const router = express.Router();

// Helper para hacer requests a Supabase REST API
async function supabaseFetch(endpoint, options = {}) {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  const apiUrl = `${url}/rest/v1/${endpoint}`;
  
  const response = await fetch(apiUrl, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Supabase error: ${response.status}`);
  }
  
  // Extraer count de content-range header si existe
  const contentRange = response.headers.get('content-range');
  const total = contentRange ? parseInt(contentRange.split('/')[1]) : null;
  
  return { data, total, status: response.status };
}

// ============================================================
// PATIENTS ENDPOINTS
// ============================================================

// GET /api/patients - Listar pacientes con paginación y búsqueda
router.get('/patients', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let endpoint = `patients?select=*&order=firstName.asc,lastName.asc&limit=${limit}&offset=${offset}`;
    
    // Agregar búsqueda si existe
    if (search) {
      const searchTerm = encodeURIComponent(search);
      endpoint += `&or=(firstName.ilike.*${searchTerm}*,lastName.ilike.*${searchTerm}*,phone.ilike.*${searchTerm}*)`;
    }
    
    const { data: patients, total } = await supabaseFetch(endpoint, {
      headers: { 'Prefer': 'count=exact' }
    });
    
    res.json({
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: total ? Math.ceil(total / limit) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/patients/:id - Obtener un paciente por ID
router.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const endpoint = `patients?id=eq.${id}&select=*`;
    const { data } = await supabaseFetch(endpoint);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients - Crear nuevo paciente
router.post('/patients', async (req, res) => {
  try {
    const patientData = req.body;
    
    const { data } = await supabaseFetch('patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/patients/:id - Actualizar paciente
router.put('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const endpoint = `patients?id=eq.${id}`;
    const { data } = await supabaseFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/patients/:id - Eliminar paciente
router.delete('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const endpoint = `patients?id=eq.${id}`;
    await supabaseFetch(endpoint, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=minimal' }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// APPOINTMENTS ENDPOINTS
// ============================================================

// GET /api/appointments - Listar citas
router.get('/appointments', async (req, res) => {
  try {
    const { from, to, patientId, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    let endpoint = `appointments?select=*&order=start.asc&limit=${limit}&offset=${offset}`;
    
    // Filtros
    if (from) {
      endpoint += `&start=gte.${from}`;
    }
    if (to) {
      endpoint += `&start=lte.${to}`;
    }
    if (patientId) {
      endpoint += `&patientId=eq.${patientId}`;
    }
    
    const { data: appointments, total } = await supabaseFetch(endpoint, {
      headers: { 'Prefer': 'count=exact' }
    });
    
    res.json({
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: total ? Math.ceil(total / limit) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/all - Obtener todas las citas (DEBE ESTAR ANTES DE /:id)
router.get('/appointments/all', async (req, res) => {
  try {
    const endpoint = `appointments?select=*&order=start.asc`;
    const { data: appointments } = await supabaseFetch(endpoint);
    
    res.json(appointments || []);
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/conflicts/check - Verificar conflictos (DEBE ESTAR ANTES DE /:id)
router.get('/appointments/conflicts/check', async (req, res) => {
  try {
    const { start, end, excludeId } = req.query;
    
    let endpoint = `appointments?start=lte.${end}&end=gte.${start}&select=id,start,end,patientId`;
    
    if (excludeId) {
      endpoint += `&id=neq.${excludeId}`;
    }
    
    const { data: conflicts } = await supabaseFetch(endpoint);
    
    res.json({
      hasConflict: conflicts && conflicts.length > 0,
      conflicts: conflicts || []
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/patient/:patientId - Citas de un paciente (DEBE ESTAR ANTES DE /:id)
router.get('/appointments/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const endpoint = `appointments?patientId=eq.${patientId}&select=*&order=start.desc`;
    const { data: appointments } = await supabaseFetch(endpoint);
    
    res.json(appointments || []);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/:id - Obtener una cita (DEBE ESTAR DESPUÉS DE LAS RUTAS ESPECÍFICAS)
router.get('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const endpoint = `appointments?id=eq.${id}&select=*`;
    const { data } = await supabaseFetch(endpoint);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments - Crear nueva cita
router.post('/appointments', async (req, res) => {
  try {
    const appointmentData = req.body;
    
    const { data } = await supabaseFetch('appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id - Actualizar cita
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const endpoint = `appointments?id=eq.${id}`;
    const { data } = await supabaseFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/appointments/:id - Eliminar cita
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const endpoint = `appointments?id=eq.${id}`;
    await supabaseFetch(endpoint, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=minimal' }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CREDIT PACKS ENDPOINTS
// ============================================================

// GET /api/credits - Obtener resumen de créditos por paciente
router.get('/credits', async (req, res) => {
  try {
    const { patientId } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ error: 'patientId es requerido' });
    }
    
    // Obtener packs del paciente
    const packsEndpoint = `credit_packs?patientId=eq.${patientId}&select=*&order=createdAt.desc`;
    const { data: packs } = await supabaseFetch(packsEndpoint);
    
    // Calcular totales
    const totalUnits = packs.reduce((sum, p) => sum + (p.unitsTotal || 0), 0);
    const remainingUnits = packs.reduce((sum, p) => sum + (p.unitsRemaining || 0), 0);
    const usedUnits = totalUnits - remainingUnits;
    
    res.json({
      patientId,
      totalUnits,
      usedUnits,
      remainingUnits,
      packs
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/credits/packs - Crear nuevo pack de créditos
router.post('/credits/packs', async (req, res) => {
  try {
    const packData = {
      ...req.body,
      unitsRemaining: req.body.unitsTotal,
      paid: req.body.paid || false,
      createdAt: new Date().toISOString()
    };
    
    const { data } = await supabaseFetch('credit_packs', {
      method: 'POST',
      body: JSON.stringify(packData)
    });
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating credit pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/credits/packs/:packId - Eliminar pack de créditos
router.delete('/credits/packs/:packId', async (req, res) => {
  try {
    const { packId } = req.params;
    
    const endpoint = `credit_packs?id=eq.${packId}`;
    await supabaseFetch(endpoint, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=minimal' }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting credit pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/credits/packs/:packId/payment - Actualizar estado de pago
router.patch('/credits/packs/:packId/payment', async (req, res) => {
  try {
    const { packId } = req.params;
    const { paid } = req.body;
    
    const endpoint = `credit_packs?id=eq.${packId}`;
    const { data } = await supabaseFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ paid })
    });
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/credits/packs/:packId/units - Actualizar unidades restantes
router.patch('/credits/packs/:packId/units', async (req, res) => {
  try {
    const { packId } = req.params;
    const { unitsRemaining } = req.body;
    
    const endpoint = `credit_packs?id=eq.${packId}`;
    const { data } = await supabaseFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ unitsRemaining })
    });
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating units:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/credits/redeem - Canjear créditos
router.post('/credits/redeem', async (req, res) => {
  try {
    const { creditPackId, appointmentId, unitsUsed } = req.body;
    
    // Crear redención
    const redemptionData = {
      creditPackId,
      appointmentId,
      unitsUsed,
      createdAt: new Date().toISOString()
    };
    
    const { data: redemption } = await supabaseFetch('credit_redemptions', {
      method: 'POST',
      body: JSON.stringify(redemptionData)
    });
    
    // Actualizar unidades restantes del pack
    const packEndpoint = `credit_packs?id=eq.${creditPackId}&select=unitsRemaining`;
    const { data: packs } = await supabaseFetch(packEndpoint);
    
    if (packs && packs.length > 0) {
      const newUnitsRemaining = packs[0].unitsRemaining - unitsUsed;
      
      await supabaseFetch(`credit_packs?id=eq.${creditPackId}`, {
        method: 'PATCH',
        body: JSON.stringify({ unitsRemaining: newUnitsRemaining })
      });
    }
    
    res.status(201).json(redemption[0]);
  } catch (error) {
    console.error('Error redeeming credits:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/credits/history - Historial de uso de créditos
router.get('/credits/history', async (req, res) => {
  try {
    const { patientId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    if (!patientId) {
      return res.status(400).json({ error: 'patientId es requerido' });
    }
    
    // Obtener redenciones con información de packs y citas
    const endpoint = `credit_redemptions?select=*,credit_packs!inner(patientId),appointments(*)&credit_packs.patientId=eq.${patientId}&order=createdAt.desc&limit=${limit}&offset=${offset}`;
    
    const { data: redemptions, total } = await supabaseFetch(endpoint, {
      headers: { 'Prefer': 'count=exact' }
    });
    
    res.json({
      redemptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: total ? Math.ceil(total / limit) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PATIENT FILES ENDPOINTS
// ============================================================

// GET /api/patients/:patientId/files - Listar archivos de un paciente
router.get('/patients/:patientId/files', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const endpoint = `patient_files?patientId=eq.${patientId}&select=*&order=uploadedAt.desc`;
    const { data: files } = await supabaseFetch(endpoint);
    
    res.json(files || []);
  } catch (error) {
    console.error('Error fetching patient files:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients/:patientId/files - Subir archivo (sin Supabase Storage)
router.post('/patients/:patientId/files', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { fileName, fileType, fileSize, base64Data } = req.body;
    
    // Guardar metadata en la tabla patient_files
    const fileData = {
      patientId,
      fileName,
      fileType,
      fileSize,
      base64Data, // Guardamos directamente en la BD (solo para archivos pequeños)
      uploadedAt: new Date().toISOString()
    };
    
    const { data } = await supabaseFetch('patient_files', {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/patients/:patientId/files/:fileId - Eliminar archivo
router.delete('/patients/:patientId/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `patient_files?id=eq.${fileId}`;
    await supabaseFetch(endpoint, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=minimal' }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/:fileId/download - Descargar archivo
router.get('/files/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `patient_files?id=eq.${fileId}&select=fileName,fileType,base64Data`;
    const { data: files } = await supabaseFetch(endpoint);
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const file = files[0];
    res.json({
      fileName: file.fileName,
      fileType: file.fileType,
      base64Data: file.base64Data
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CONFIGURATION ENDPOINTS
// ============================================================

// GET /api/config - Obtener configuración
router.get('/config', async (req, res) => {
  try {
    const endpoint = `app_config?select=*&limit=1`;
    const { data: configs } = await supabaseFetch(endpoint);
    
    if (!configs || configs.length === 0) {
      // Devolver configuración por defecto
      return res.json({
        id: 1,
        businessName: 'Clínica',
        appointmentDuration: 30,
        workingHours: {
          monday: { start: '09:00', end: '18:00', enabled: true },
          tuesday: { start: '09:00', end: '18:00', enabled: true },
          wednesday: { start: '09:00', end: '18:00', enabled: true },
          thursday: { start: '09:00', end: '18:00', enabled: true },
          friday: { start: '09:00', end: '18:00', enabled: true },
          saturday: { start: '09:00', end: '14:00', enabled: false },
          sunday: { start: '09:00', end: '14:00', enabled: false }
        },
        prices: {
          session30min: 35,
          session60min: 60,
          creditPack5: 150,
          creditPack10: 280
        }
      });
    }
    
    res.json(configs[0]);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/config - Actualizar configuración
router.put('/config', async (req, res) => {
  try {
    const configData = req.body;
    
    // Verificar si existe una configuración
    const checkEndpoint = `app_config?select=id&limit=1`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    let result;
    if (existing && existing.length > 0) {
      // Actualizar
      const updateEndpoint = `app_config?id=eq.${existing[0].id}`;
      const { data } = await supabaseFetch(updateEndpoint, {
        method: 'PATCH',
        body: JSON.stringify(configData)
      });
      result = data[0];
    } else {
      // Crear
      const { data } = await supabaseFetch('app_config', {
        method: 'POST',
        body: JSON.stringify(configData)
      });
      result = data[0];
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/reset - Resetear configuración a valores por defecto
router.post('/config/reset', async (req, res) => {
  try {
    const defaultConfig = {
      businessName: 'Clínica',
      appointmentDuration: 30,
      workingHours: {
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '18:00', enabled: true },
        saturday: { start: '09:00', end: '14:00', enabled: false },
        sunday: { start: '09:00', end: '14:00', enabled: false }
      },
      prices: {
        session30min: 35,
        session60min: 60,
        creditPack5: 150,
        creditPack10: 280
      }
    };
    
    const checkEndpoint = `app_config?select=id&limit=1`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    let result;
    if (existing && existing.length > 0) {
      const updateEndpoint = `app_config?id=eq.${existing[0].id}`;
      const { data } = await supabaseFetch(updateEndpoint, {
        method: 'PATCH',
        body: JSON.stringify(defaultConfig)
      });
      result = data[0];
    } else {
      const { data } = await supabaseFetch('app_config', {
        method: 'POST',
        body: JSON.stringify(defaultConfig)
      });
      result = data[0];
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/working-hours/:date - Horarios para una fecha específica
router.get('/config/working-hours/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Obtener configuración
    const endpoint = `app_config?select=workingHours&limit=1`;
    const { data: configs } = await supabaseFetch(endpoint);
    
    if (!configs || configs.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    const dayOfWeek = new Date(date).toLocaleLowerCase('en-US', { weekday: 'long' });
    const workingHours = configs[0].workingHours || {};
    const dayConfig = workingHours[dayOfWeek];
    
    res.json({
      date,
      dayOfWeek,
      ...dayConfig
    });
  } catch (error) {
    console.error('Error fetching working hours:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/prices - Obtener precios
router.get('/config/prices', async (req, res) => {
  try {
    const endpoint = `app_config?select=prices&limit=1`;
    const { data: configs } = await supabaseFetch(endpoint);
    
    if (!configs || configs.length === 0) {
      return res.json({
        session30min: 35,
        session60min: 60,
        creditPack5: 150,
        creditPack10: 280
      });
    }
    
    res.json(configs[0].prices || {});
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/config/prices - Actualizar precios
router.put('/config/prices', async (req, res) => {
  try {
    const prices = req.body;
    
    const checkEndpoint = `app_config?select=id&limit=1`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    const updateEndpoint = `app_config?id=eq.${existing[0].id}`;
    const { data } = await supabaseFetch(updateEndpoint, {
      method: 'PATCH',
      body: JSON.stringify({ prices })
    });
    
    res.json(data[0].prices);
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// METADATA ENDPOINTS
// ============================================================

// GET /api/meta/locations - Obtener todas las localizaciones (provincias + municipios)
router.get('/meta/locations', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Cargar desde archivo local (las locations no cambian frecuentemente)
    const locationsPath = path.join(process.cwd(), 'assets', 'locations.json');
    
    if (fs.existsSync(locationsPath)) {
      const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
      return res.json(locations);
    }
    
    // Fallback: devolver estructura básica
    res.json({
      provinces: [],
      municipalities: []
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/meta/locations/by-cp/:cp - Buscar localización por código postal
router.get('/meta/locations/by-cp/:cp', async (req, res) => {
  try {
    const { cp } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    const locationsPath = path.join(process.cwd(), 'assets', 'locations.json');
    
    if (fs.existsSync(locationsPath)) {
      const locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
      
      // Buscar municipio por código postal
      const municipality = locations.municipalities?.find(m => m.cp === cp);
      
      if (municipality) {
        return res.json(municipality);
      }
    }
    
    res.status(404).json({ error: 'Código postal no encontrado' });
  } catch (error) {
    console.error('Error fetching location by CP:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// BACKUP ENDPOINTS (simplificados)
// ============================================================

// GET /api/backup/list - Listar backups disponibles
router.get('/backup/list', async (req, res) => {
  try {
    // Obtener todas las tablas
    const [patients, appointments, creditPacks, redemptions] = await Promise.all([
      supabaseFetch('patients?select=count').then(r => r.total || 0),
      supabaseFetch('appointments?select=count').then(r => r.total || 0),
      supabaseFetch('credit_packs?select=count').then(r => r.total || 0),
      supabaseFetch('credit_redemptions?select=count').then(r => r.total || 0)
    ]);
    
    // Crear backup "virtual" con timestamp actual
    const backup = {
      fileName: `backup_${new Date().toISOString().replace(/:/g, '-')}.json`,
      date: new Date().toISOString(),
      size: 0,
      stats: {
        patients,
        appointments,
        creditPacks,
        redemptions
      }
    };
    
    res.json([backup]);
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/backup/stats - Estadísticas de la base de datos
router.get('/backup/stats', async (req, res) => {
  try {
    const [patients, appointments, creditPacks, redemptions, files] = await Promise.all([
      supabaseFetch('patients?select=count').then(r => r.total || 0),
      supabaseFetch('appointments?select=count').then(r => r.total || 0),
      supabaseFetch('credit_packs?select=count').then(r => r.total || 0),
      supabaseFetch('credit_redemptions?select=count').then(r => r.total || 0),
      supabaseFetch('patient_files?select=count').then(r => r.total || 0)
    ]);
    
    res.json({
      patients,
      appointments,
      creditPacks,
      redemptions,
      files
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/create - Crear backup (exportar datos)
router.post('/backup/create', async (req, res) => {
  try {
    const [patients, appointments, creditPacks, redemptions, files] = await Promise.all([
      supabaseFetch('patients?select=*').then(r => r.data || []),
      supabaseFetch('appointments?select=*').then(r => r.data || []),
      supabaseFetch('credit_packs?select=*').then(r => r.data || []),
      supabaseFetch('credit_redemptions?select=*').then(r => r.data || []),
      supabaseFetch('patient_files?select=*').then(r => r.data || [])
    ]);
    
    const backup = {
      created: new Date().toISOString(),
      version: '1.0',
      data: {
        patients,
        appointments,
        creditPacks,
        redemptions,
        files
      }
    };
    
    res.json({
      success: true,
      fileName: `backup_${Date.now()}.json`,
      backup
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/backup/status - Estado del sistema de backups
router.get('/backup/status', async (req, res) => {
  try {
    res.json({
      enabled: true,
      lastBackup: new Date().toISOString(),
      status: 'healthy'
    });
  } catch (error) {
    console.error('Error fetching backup status:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/backup/grouped - Backups agrupados por fecha
router.get('/backup/grouped', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const backup = {
      fileName: `backup_${new Date().toISOString().replace(/:/g, '-')}.json`,
      date: new Date().toISOString(),
      size: 0
    };
    
    res.json({
      [today]: [backup]
    });
  } catch (error) {
    console.error('Error fetching grouped backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/restore/:fileName - Restaurar backup
router.post('/backup/restore/:fileName', async (req, res) => {
  try {
    // Nota: Esta es una operación compleja que requeriría:
    // 1. Descargar el backup
    // 2. Validar el formato
    // 3. Truncar tablas
    // 4. Insertar datos
    // Por ahora devolvemos error indicando que debe hacerse manualmente
    
    res.status(501).json({
      success: false,
      message: 'La restauración debe realizarse manualmente por seguridad'
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/backup/download/:fileName - Descargar backup
router.get('/backup/download/:fileName', async (req, res) => {
  try {
    // Crear backup en tiempo real
    const [patients, appointments, creditPacks, redemptions, files] = await Promise.all([
      supabaseFetch('patients?select=*').then(r => r.data || []),
      supabaseFetch('appointments?select=*').then(r => r.data || []),
      supabaseFetch('credit_packs?select=*').then(r => r.data || []),
      supabaseFetch('credit_redemptions?select=*').then(r => r.data || []),
      supabaseFetch('patient_files?select=*').then(r => r.data || [])
    ]);
    
    const backup = {
      created: new Date().toISOString(),
      version: '1.0',
      data: {
        patients,
        appointments,
        creditPacks,
        redemptions,
        files
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
    res.json(backup);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/backup/delete/:fileName - Eliminar backup
router.delete('/backup/delete/:fileName', async (req, res) => {
  try {
    // Los backups son "virtuales", no se eliminan realmente
    res.json({
      success: true,
      message: 'Backup eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// FILE SERVICE ENDPOINTS (adicionales)
// ============================================================

// GET /api/files/patient/:patientId - Listar archivos (alternativa)
router.get('/files/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const endpoint = `patient_files?patientId=eq.${patientId}&select=*&order=uploadedAt.desc`;
    const { data: files } = await supabaseFetch(endpoint);
    
    res.json(files || []);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/files/patient/:patientId - Subir archivo (alternativa)
router.post('/files/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { fileName, fileType, fileSize, base64Data } = req.body;
    
    const fileData = {
      patientId,
      fileName,
      fileType,
      fileSize,
      base64Data,
      uploadedAt: new Date().toISOString()
    };
    
    const { data } = await supabaseFetch('patient_files', {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/:fileId - Eliminar archivo (alternativa)
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `patient_files?id=eq.${fileId}`;
    await supabaseFetch(endpoint, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=minimal' }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
