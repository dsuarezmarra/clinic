// Endpoints "bridge" usando fetch directo a Supabase REST API
// Estos endpoints evitan el bug del SDK @supabase/supabase-js en Vercel
// VERSION: 2.4.2 - CSV billing SELECT fix (use req.getTable for relations)

const express = require('express');
const router = express.Router();
const { loadTenant } = require('../middleware/tenant');

// Log de versión al cargar el módulo
console.log('🔄 bridge.js VERSION 2.4.2 cargado - CSV billing SELECT fixed');
const multer = require('multer');

// Cargar locations.json una sola vez al inicio del módulo
const LOCATIONS_DATA = require('../../assets/locations.json');

// Configurar multer para manejar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 10MB límite
});

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
  
  // Solo intentar parsear JSON si hay contenido
  let data = null;
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  if (contentType?.includes('application/json') && contentLength !== '0') {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  }
  
  if (!response.ok) {
    throw new Error(data?.message || `Supabase error: ${response.status}`);
  }
  
  // Extraer count de content-range header si existe
  const contentRange = response.headers.get('content-range');
  const total = contentRange ? parseInt(contentRange.split('/')[1]) : null;
  
  return { data, total, status: response.status };
}

// ============================================================
// HELPER FUNCTIONS FOR MULTI-TENANT EMBEDDED RESOURCES
// ============================================================

/**
 * Obtiene el nombre de la propiedad con sufijo dinámico para tablas relacionadas
 * @param {string} baseTableName - Nombre base de la tabla (ej: 'credit_packs')
 * @param {string} suffix - Sufijo del tenant (ej: 'masajecorporaldeportivo')
 * @returns {string} - Nombre completo (ej: 'credit_packs_masajecorporaldeportivo' o 'credit_packs')
 */
function getTablePropertyKey(baseTableName, suffix) {
  return suffix ? `${baseTableName}_${suffix}` : baseTableName;
}

/**
 * Obtiene una propiedad embedded de PostgREST usando el sufijo correcto
 * @param {Object} obj - Objeto que contiene la propiedad embedded
 * @param {string} baseTableName - Nombre base de la tabla (ej: 'credit_packs')
 * @param {string} suffix - Sufijo del tenant
 * @returns {any} - Valor de la propiedad o undefined
 */
function getEmbeddedProperty(obj, baseTableName, suffix) {
  if (!obj) return undefined;
  const key = getTablePropertyKey(baseTableName, suffix);
  return obj[key];
}

/**
 * Elimina una propiedad embedded usando el sufijo correcto
 * @param {Object} obj - Objeto que contiene la propiedad
 * @param {string} baseTableName - Nombre base de la tabla
 * @param {string} suffix - Sufijo del tenant
 */
function deleteEmbeddedProperty(obj, baseTableName, suffix) {
  if (!obj) return;
  const key = getTablePropertyKey(baseTableName, suffix);
  delete obj[key];
}

// ============================================================
// VERSION ENDPOINT
// ============================================================

// GET /api/version - Devolver versión del bridge
router.get('/version', (req, res) => {
  res.json({ 
    version: '2.4.0',
    description: 'Multi-tenant completo - patient_files y configurations migradas correctamente',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// MIDDLEWARE DE TENANT
// ============================================================
// Aplicar middleware loadTenant a las rutas que necesitan acceso a tablas con sufijo
// Los endpoints /tenants y /meta/locations NO requieren tenant
router.use('/patients*', loadTenant);
router.use('/appointments*', loadTenant);
router.use('/credits*', loadTenant);
router.use('/reports*', loadTenant);
// Backup: solo aplicar loadTenant a rutas espec�ficas que lo necesiten (create, restore)
router.use('/backup/create', loadTenant);
router.use('/backup/restore*', loadTenant);
router.use('/backup/download*', loadTenant);
router.use('/backup/delete*', loadTenant);
// Rutas de backup sin tenant: /backup/cron, /backup/list, /backup/stats, /backup/status, /backup/grouped
router.use('/meta/config*', loadTenant);
router.use('/files*', loadTenant);  // ✅ AGREGADO: archivos necesitan tenant

// ============================================================
// PATIENTS ENDPOINTS
// ============================================================

// GET /api/patients - Listar pacientes con paginación y búsqueda
router.get('/patients', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Incluir credit_packs para calcular activeSessions
    let endpoint = `${req.getTable('patients')}?select=*,${req.getTable('credit_packs')}(unitsRemaining)&order=firstName.asc,lastName.asc&limit=${limit}&offset=${offset}`;
    
    // Agregar búsqueda si existe
    if (search) {
      const searchTerm = encodeURIComponent(search);
      endpoint += `&or=(firstName.ilike.*${searchTerm}*,lastName.ilike.*${searchTerm}*,phone.ilike.*${searchTerm}*)`;
    }
    
    const { data: patients, total } = await supabaseFetch(endpoint, {
      headers: { 'Prefer': 'count=exact' }
    });
    
    // Calcular activeSessions para cada paciente
    const patientsWithActiveSessions = (patients || []).map(patient => {
      // Usar helper para obtener credit_packs con sufijo correcto
      const packsKey = getTablePropertyKey('credit_packs', req.tableSuffix);
      const packs = Array.isArray(patient[packsKey]) ? patient[packsKey] : [];
      const totalUnitsRemaining = packs.reduce((sum, pack) => sum + (Number(pack.unitsRemaining) || 0), 0);
      
      // Eliminar la propiedad embedded con sufijo
      delete patient[packsKey];
      
      return {
        ...patient,
        activeSessions: totalUnitsRemaining
      };
    });
    
    res.json({
      patients: patientsWithActiveSessions,
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

// ============================================================
// PATIENT FILES ENDPOINTS (DEBEN ESTAR ANTES DE /patients/:id)
// ============================================================

// GET /api/patients/:patientId/files - Listar archivos de un paciente
router.get('/patients/:patientId/files', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const endpoint = `${req.getTable('patient_files')}?patientId=eq.${patientId}&select=*&order=createdAt.desc`;
    const { data: files } = await supabaseFetch(endpoint);
    
    res.json(files || []);
  } catch (error) {
    console.error('Error fetching patient files:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients/:patientId/files - Subir archivo
router.post('/patients/:patientId/files', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { originalName, storedPath, mimeType, size, category, description, checksum } = req.body;
    
    // Guardar metadata en la tabla patient_files usando las columnas correctas
    const fileData = {
      patientId,
      originalName: originalName || 'archivo.dat',
      storedPath: storedPath || '',
      mimeType: mimeType || 'application/octet-stream',
      size: size || 0,
      category: category || 'otro',
      description: description || '',
      checksum: checksum || null,
      createdAt: new Date().toISOString()
    };
    
    const { data } = await supabaseFetch(req.getTable('patient_files'), {
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
    
    const endpoint = `${req.getTable('patient_files')}?id=eq.${fileId}`;
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

// GET /api/patients/:id - Obtener un paciente por ID (DEBE ESTAR DESPUÉS DE RUTAS ESPECÍFICAS)
router.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const endpoint = `${req.getTable('patients')}?id=eq.${id}&select=*`;
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
    
    const { data } = await supabaseFetch(`${req.getTable('patients')}`, {
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
    
    const endpoint = `${req.getTable('patients')}?id=eq.${id}`;
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
    
    const endpoint = `${req.getTable('patients')}?id=eq.${id}`;
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
    
    // Incluir relaciones: patient, creditRedemptions con creditPack
    let endpoint = `${req.getTable('appointments')}?select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))&order=start.asc&limit=${limit}&offset=${offset}`;
    
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
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const mapped = (appointments || []).map(apt => {
      const redemptions = (getEmbeddedProperty(apt, 'credit_redemptions', req.tableSuffix) || []).map(cr => {
        const creditPack = getEmbeddedProperty(cr, 'credit_packs', req.tableSuffix) || null;
        deleteEmbeddedProperty(cr, 'credit_packs', req.tableSuffix);
        return {
          ...cr,
          creditPack,
          creditPackId: cr.creditPackId || cr.credit_pack_id
        };
      });
      
      const result = {
        ...apt,
        start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
        end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
        patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix) || null,
        creditRedemptions: redemptions
      };
      
      deleteEmbeddedProperty(result, 'patients', req.tableSuffix);
      deleteEmbeddedProperty(result, 'credit_redemptions', req.tableSuffix);
      
      return result;
    });
    
    res.json({
      appointments: mapped,
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
    // Incluir relaciones: patient, creditRedemptions con creditPack
    const endpoint = `${req.getTable('appointments')}?select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))&order=start.desc`;
    const { data: appointments } = await supabaseFetch(endpoint);
    
    console.log('🔍 [GET /appointments/all] Raw appointments from Supabase:', JSON.stringify(appointments, null, 2));
    console.log('🔍 [GET /appointments/all] tableSuffix:', req.tableSuffix);
    console.log('🔍 [GET /appointments/all] credit_redemptions key:', getTablePropertyKey('credit_redemptions', req.tableSuffix));
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const mapped = (appointments || []).map(apt => {
      console.log('🔍 [GET /appointments/all] Processing appointment:', apt.id);
      console.log('🔍 [GET /appointments/all] Appointment keys:', Object.keys(apt));
      const redemptionsRaw = getEmbeddedProperty(apt, 'credit_redemptions', req.tableSuffix);
      console.log('🔍 [GET /appointments/all] redemptionsRaw:', redemptionsRaw);
      const redemptions = (redemptionsRaw || []).map(cr => {
        const creditPack = getEmbeddedProperty(cr, 'credit_packs', req.tableSuffix) || null;
        deleteEmbeddedProperty(cr, 'credit_packs', req.tableSuffix);
        return {
          ...cr,
          creditPack,
          creditPackId: cr.creditPackId || cr.credit_pack_id
        };
      });
      
      const result = {
        ...apt,
        start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
        end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
        patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix) || null,
        creditRedemptions: redemptions
      };
      
      deleteEmbeddedProperty(result, 'patients', req.tableSuffix);
      deleteEmbeddedProperty(result, 'credit_redemptions', req.tableSuffix);
      
      return result;
    });
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/conflicts/check - Verificar conflictos (DEBE ESTAR ANTES DE /:id)
router.get('/appointments/conflicts/check', async (req, res) => {
  try {
    const { start, end, excludeId } = req.query;
    
    let endpoint = `${req.getTable('appointments')}?start=lte.${end}&end=gte.${start}&select=id,start,end,patientId`;
    
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
    
    // Incluir relaciones: patient, creditRedemptions con creditPack
    const endpoint = `${req.getTable('appointments')}?patientId=eq.${patientId}&select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))&order=start.desc`;
    const { data: appointments } = await supabaseFetch(endpoint);
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const mapped = (appointments || []).map(apt => {
      const redemptions = (getEmbeddedProperty(apt, 'credit_redemptions', req.tableSuffix) || []).map(cr => {
        const creditPack = getEmbeddedProperty(cr, 'credit_packs', req.tableSuffix) || null;
        deleteEmbeddedProperty(cr, 'credit_packs', req.tableSuffix);
        return {
          ...cr,
          creditPack,
          creditPackId: cr.creditPackId || cr.credit_pack_id
        };
      });
      
      const result = {
        ...apt,
        start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
        end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
        patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix) || null,
        creditRedemptions: redemptions
      };
      
      deleteEmbeddedProperty(result, 'patients', req.tableSuffix);
      deleteEmbeddedProperty(result, 'credit_redemptions', req.tableSuffix);
      
      return result;
    });
    
    // Ya no necesitamos este forEach, el delete se hace arriba
    mapped.forEach(apt => {
      if (apt.creditRedemptions) {
        apt.creditRedemptions.forEach(cr => {
          // Ya limpiamos credit_packs arriba
        });
      }
    });
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/appointments/:id - Obtener una cita (DEBE ESTAR DESPUÉS DE LAS RUTAS ESPECÍFICAS)
router.get('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Incluir relaciones: patient, creditRedemptions con creditPack
    const endpoint = `${req.getTable('appointments')}?id=eq.${id}&select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))`;
    const { data } = await supabaseFetch(endpoint);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const apt = data[0];
    const redemptions = (getEmbeddedProperty(apt, 'credit_redemptions', req.tableSuffix) || []).map(cr => {
      const creditPack = getEmbeddedProperty(cr, 'credit_packs', req.tableSuffix) || null;
      deleteEmbeddedProperty(cr, 'credit_packs', req.tableSuffix);
      return {
        ...cr,
        creditPack,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      };
    });
    
    const mapped = {
      ...apt,
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix) || null,
      creditRedemptions: redemptions
    };
    
    deleteEmbeddedProperty(mapped, 'patients', req.tableSuffix);
    deleteEmbeddedProperty(mapped, 'credit_redemptions', req.tableSuffix);
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments - Crear nueva cita
router.post('/appointments', async (req, res) => {
  try {
    const { patientId, start, end, durationMinutes = 30, consumesCredit = true, notes } = req.body;
    
    // 0. Validar que no haya solapamiento con otras citas
    const startTime = new Date(start).toISOString();
    const endTime = new Date(end).toISOString();
    
    // Buscar citas que se solapen: 
    // Una cita se solapa si: start < existingEnd AND end > existingStart
    const { data: overlappingAppts } = await supabaseFetch(
      `${req.getTable('appointments')}?start=lt.${endTime}&end=gt.${startTime}`
    );
    
    if (overlappingAppts && overlappingAppts.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe una cita en ese horario',
        overlapping: overlappingAppts[0]
      });
    }
    
    // 1. Crear la cita
    const { data: appointments } = await supabaseFetch(`${req.getTable('appointments')}`, {
      method: 'POST',
      body: JSON.stringify({
        patientId,
        start,
        end,
        durationMinutes,
        consumesCredit,
        notes
      })
    });
    
    const appointment = appointments[0];
    
    // 2. Si debe consumir créditos, procesarlos
    if (consumesCredit && patientId && appointment && appointment.id) {
      const requiredUnits = durationMinutes === 60 ? 2 : 1;
      
      // Obtener packs disponibles del paciente ordenados (pagados primero, luego por fecha)
      const { data: rawPacks } = await supabaseFetch(
        `${req.getTable('credit_packs')}?patientId=eq.${patientId}&unitsRemaining=gt.0&order=paid.desc,createdAt.asc`
      );

      // Normalizar packs: asegurar tipos correctos
      const packs = (rawPacks || []).map(p => ({
        ...p,
        paid: !!p.paid,
        unitsRemaining: Number(p.unitsRemaining) || 0,
        unitsTotal: Number(p.unitsTotal) || 0,
        unitMinutes: Number(p.unitMinutes) || 30,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null
      }));
      
      console.log('📦 Packs disponibles para consumir (ordenados por paid DESC, createdAt ASC):');
      if (packs && packs.length > 0) {
        packs.forEach((pack, index) => {
          console.log(`  ${index + 1}. ${pack.label} | Paid: ${pack.paid} | Units: ${pack.unitsRemaining} | Created: ${pack.createdAt}`);
        });
      }
      
      if (!packs || packs.length === 0) {
        // Eliminar la cita si no hay créditos
        await supabaseFetch(`${req.getTable('appointments')}?id=eq.${appointment.id}`, {
          method: 'DELETE'
        });
        return res.status(400).json({ error: 'Créditos insuficientes' });
      }
      
      // Función helper para verificar si un pack PUEDE cumplir SOLO la cita completa
      const canPackFulfillAppointment = (pack, requiredUnits) => {
        const isSession60 = pack.label?.startsWith('Sesión') && pack.unitMinutes === 60;
        const isBono60 = pack.label?.startsWith('Bono') && pack.unitMinutes === 60;
        
        // REGLA 1: Packs de 60min son INDIVISIBLES (requieren 2 unidades completas)
        if (isSession60 || isBono60) {
          // Para una cita de 60min (requiredUnits=2), necesitamos al menos 2 unidades
          // Para una cita de 30min (requiredUnits=1), NO se puede usar pack de 60min
          return requiredUnits === 2 && pack.unitsRemaining >= 2;
        }
        
        // REGLA 2: Packs de 30min son flexibles (pueden cumplir cualquier requisito)
        return pack.unitsRemaining >= requiredUnits;
      };
      
      // REGLA CRÍTICA: Cada cita consume de UN SOLO pack
      // Buscar EL PRIMER pack que pueda cumplir TODA la cita (PAGADOS primero, luego PENDIENTES)
      console.log(`🎯 Buscando UN SOLO pack que pueda cumplir ${requiredUnits} unidades...`);
      
      let selectedPack = null;
      
      // PRIMERA PASADA: Buscar en packs PAGADOS
      console.log('🔄 Buscando en packs PAGADOS...');
      for (const pack of packs) {
        if (!pack.paid) continue; // Solo pagados
        
        const canFulfill = canPackFulfillAppointment(pack, requiredUnits);
        console.log(`  📦 "${pack.label}" (${pack.unitMinutes}min) - ${pack.unitsRemaining} units disponibles - ¿Puede cumplir? ${canFulfill ? '✅ SÍ' : '❌ NO'}`);
        
        if (canFulfill) {
          selectedPack = pack;
          console.log(`  ✅ Pack PAGADO seleccionado: "${pack.label}"`);
          break;
        }
      }
      
      // SEGUNDA PASADA: Si no hay pack pagado, buscar en PENDIENTES
      if (!selectedPack) {
        console.log('🔄 No hay pack PAGADO disponible. Buscando en packs PENDIENTES...');
        for (const pack of packs) {
          if (pack.paid) continue; // Solo pendientes
          
          const canFulfill = canPackFulfillAppointment(pack, requiredUnits);
          console.log(`  📦 "${pack.label}" (${pack.unitMinutes}min) - ${pack.unitsRemaining} units disponibles - ¿Puede cumplir? ${canFulfill ? '✅ SÍ' : '❌ NO'}`);
          
          if (canFulfill) {
            selectedPack = pack;
            console.log(`  ⚠️  Pack PENDIENTE seleccionado: "${pack.label}"`);
            break;
          }
        }
      }
      
      // Si no hay ningún pack que pueda cumplir SOLO la cita, rechazar
      if (!selectedPack) {
        await supabaseFetch(`${req.getTable('appointments')}?id=eq.${appointment.id}`, {
          method: 'DELETE'
        });
        console.log('❌ No hay ningún pack que pueda cumplir la cita COMPLETA');
        return res.status(400).json({ 
          error: 'No hay ningún pack disponible que pueda cumplir esta cita completa. Los packs no se pueden mezclar.' 
        });
      }
      
      // Crear UNA SOLA redemption del pack seleccionado
      console.log(`💳 Creando redemption de ${requiredUnits} unidades del pack "${selectedPack.label}"...`);
      const { data: redemption } = await supabaseFetch(`${req.getTable('credit_redemptions')}`, {
        method: 'POST',
        body: JSON.stringify({
          creditPackId: selectedPack.id,
          appointmentId: appointment.id,
          unitsUsed: requiredUnits
        })
      });
      
      // Actualizar unitsRemaining del pack
      await supabaseFetch(`${req.getTable('credit_packs')}?id=eq.${selectedPack.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          unitsRemaining: selectedPack.unitsRemaining - requiredUnits
        })
      });
      
      console.log(`✅ Cita creada usando SOLO el pack "${selectedPack.label}" (${selectedPack.paid ? 'PAGADO' : 'PENDIENTE'})`);
    }
    
    // 3. Obtener la cita completa con todas sus relaciones para devolverla
    // (igual que en GET /appointments/all para consistencia)
    console.log('🔄 Fetching complete appointment with creditRedemptions...');
    const endpoint = `${req.getTable('appointments')}?id=eq.${appointment.id}&select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))`;
    const { data: fullAppointments } = await supabaseFetch(endpoint);
    
    console.log('📦 fullAppointments received:', JSON.stringify(fullAppointments, null, 2));
    
    if (!fullAppointments || fullAppointments.length === 0) {
      console.error('❌ No fullAppointments found after creation');
      return res.status(500).json({ error: 'Error al obtener la cita creada' });
    }
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const apt = fullAppointments[0];
    const redemptions = (getEmbeddedProperty(apt, 'credit_redemptions', req.tableSuffix) || []).map(cr => {
      const creditPack = getEmbeddedProperty(cr, 'credit_packs', req.tableSuffix) || null;
      deleteEmbeddedProperty(cr, 'credit_packs', req.tableSuffix);
      return {
        ...cr,
        creditPack,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      };
    });
    
    const mapped = {
      ...apt,
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix) || null,
      creditRedemptions: redemptions
    };
    
    deleteEmbeddedProperty(mapped, 'patients', req.tableSuffix);
    deleteEmbeddedProperty(mapped, 'credit_redemptions', req.tableSuffix);
    
    console.log('✅ Returning mapped appointment with creditRedemptions:', mapped.creditRedemptions?.length || 0);
    res.status(201).json(mapped);
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
    
    console.log('PUT /appointments/:id - Updating appointment:', id);
    console.log('Update payload:', JSON.stringify(updates, null, 2));
    
    // Filtrar campos permitidos para actualización
    const allowedFields = ['start', 'end', 'durationMinutes', 'notes', 'status'];
    const filteredUpdates = {};
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    console.log('Filtered updates:', JSON.stringify(filteredUpdates, null, 2));
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }
    
    // Validar solapamiento si se está cambiando el horario
    if (filteredUpdates.start || filteredUpdates.end) {
      // Obtener la cita actual para tener start/end completos
      const { data: currentAppt } = await supabaseFetch(`${req.getTable('appointments')}?id=eq.${id}`);
      if (!currentAppt || currentAppt.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }
      
      const newStart = filteredUpdates.start || currentAppt[0].start;
      const newEnd = filteredUpdates.end || currentAppt[0].end;
      const startTime = new Date(newStart).toISOString();
      const endTime = new Date(newEnd).toISOString();
      
      // Buscar citas que se solapen (excluyendo la cita actual)
      const { data: overlappingAppts } = await supabaseFetch(
        `${req.getTable('appointments')}?start=lt.${endTime}&end=gt.${startTime}&id=neq.${id}`
      );
      
      if (overlappingAppts && overlappingAppts.length > 0) {
        return res.status(409).json({ 
          error: 'Ya existe una cita en ese horario',
          overlapping: overlappingAppts[0]
        });
      }
    }
    
    const endpoint = `${req.getTable('appointments')}?id=eq.${id}`;
    const { data, error } = await supabaseFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(filteredUpdates)
    });
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar en Supabase' });
    }
    
    if (!data || data.length === 0) {
      console.log('No data returned - appointment not found');
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    console.log('Appointment updated successfully:', data[0]);
    
    // Obtener la cita completa con todas sus relaciones para devolverla
    const fullEndpoint = `${req.getTable('appointments')}?id=eq.${id}&select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))`;
    const { data: fullAppointments } = await supabaseFetch(fullEndpoint);
    
    if (!fullAppointments || fullAppointments.length === 0) {
      return res.json(data[0]); // Fallback a la cita básica si falla el fetch completo
    }
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const apt = fullAppointments[0];
    const redemptions = (getEmbeddedProperty(apt, 'credit_redemptions', req.tableSuffix) || []).map(cr => {
      const creditPack = getEmbeddedProperty(cr, 'credit_packs', req.tableSuffix) || null;
      deleteEmbeddedProperty(cr, 'credit_packs', req.tableSuffix);
      return {
        ...cr,
        creditPack,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      };
    });
    
    const mapped = {
      ...apt,
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix) || null,
      creditRedemptions: redemptions
    };
    
    deleteEmbeddedProperty(mapped, 'patients', req.tableSuffix);
    deleteEmbeddedProperty(mapped, 'credit_redemptions', req.tableSuffix);
    
    res.json(mapped);
  } catch (error) {
    console.error('Error updating appointment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// DELETE /api/appointments/:id - Eliminar cita
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Obtener los redemptions de la cita para revertir créditos
    const { data: redemptions } = await supabaseFetch(
      `${req.getTable('credit_redemptions')}?appointmentId=eq.${id}&select=*,${req.getTable('credit_packs')}(*)`
    );
    
    // 2. Revertir créditos a los packs
    if (redemptions && redemptions.length > 0) {
      for (const redemption of redemptions) {
        // PostgREST devuelve la relación con el nombre completo de la tabla
        const packKey = `${req.tableSuffix ? 'credit_packs_' + req.tableSuffix : 'credit_packs'}`;
        const pack = redemption[packKey];
        if (pack) {
          const currentUnits = Number(pack.unitsRemaining) || 0;
          const unitsToRevert = Number(redemption.unitsUsed) || 0;
          const newUnits = currentUnits + unitsToRevert;
          
          // Actualizar unitsRemaining del pack
          await supabaseFetch(`${req.getTable('credit_packs')}?id=eq.${pack.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              unitsRemaining: newUnits
            })
          });
        }
      }
      
      // 3. Eliminar los redemptions
      await supabaseFetch(`${req.getTable('credit_redemptions')}?appointmentId=eq.${id}`, {
        method: 'DELETE',
        headers: { 'Prefer': 'return=minimal' }
      });
    }
    
    // 4. Eliminar la cita
    await supabaseFetch(`${req.getTable('appointments')}?id=eq.${id}`, {
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
    const packsEndpoint = `${req.getTable('credit_packs')}?patientId=eq.${patientId}&select=*&order=createdAt.desc`;
    const { data: packs } = await supabaseFetch(packsEndpoint);
    
    // Calcular totales
    const totalUnits = packs.reduce((sum, p) => sum + (p.unitsTotal || 0), 0);
    const remainingUnits = packs.reduce((sum, p) => sum + (p.unitsRemaining || 0), 0);
    const usedUnits = totalUnits - remainingUnits;
    
    // Convertir unidades a tiempo
    const formatTime = (units) => {
      const hours = Math.floor(units / 2);
      const minutes = (units % 2) * 30;
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h`;
      return `${minutes}m`;
    };
    
    res.json({
      patientId,
      summary: {
        totalCreditsOriginal: totalUnits,
        totalCreditsRemaining: remainingUnits,
        totalCreditsUsed: usedUnits,
        totalTimeOriginal: formatTime(totalUnits),
        totalTimeRemaining: formatTime(remainingUnits),
        totalTimeUsed: formatTime(usedUnits)
      },
      creditPacks: packs
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    // Si la tabla no existe, devolver resumen vacío
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return res.json({
        patientId: req.query.patientId,
        summary: {
          totalCreditsOriginal: 0,
          totalCreditsRemaining: 0,
          totalCreditsUsed: 0,
          totalTimeOriginal: '0m',
          totalTimeRemaining: '0m',
          totalTimeUsed: '0m'
        },
        creditPacks: []
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/credits/packs - Crear nuevo pack de créditos
router.post('/credits/packs', async (req, res) => {
  try {
    const { patientId, type, minutes, quantity = 1, paid, notes, priceCents } = req.body;

    // Normalize inputs
    const qty = Number(quantity || 1);
    const providedPrice = Number(priceCents || 0);

    // Helper to compute per-pack price (integer cents)
    const computePerPackPrice = (totalCents, count) => {
      if (!totalCents || count <= 1) return totalCents || 0;
      // Distribute remainder to first pack(s)
      const base = Math.floor(totalCents / count);
      const remainder = totalCents - base * count;
      return { base, remainder };
    };

    const created = [];

    // Determine per-pack units and label for each created pack
    for (let i = 0; i < qty; i++) {
      let perPackUnits;
      let perPackLabel;

      if (type === 'sesion') {
        perPackUnits = (minutes === 60) ? 2 : 1;
        perPackLabel = `Sesión 1x${minutes}min`;
      } else {
        // bono: each pack represents a standard bono (5x30m or 10x60m)
        if (minutes === 60) {
          perPackUnits = 10;
          perPackLabel = `Bono 10×60m`;
        } else {
          perPackUnits = 5;
          perPackLabel = `Bono 5×30m`;
        }
      }

      // Price distribution
      let perPackPrice = 0;
      if (providedPrice > 0) {
        const distrib = computePerPackPrice(providedPrice, qty);
        if (typeof distrib === 'object') {
          perPackPrice = distrib.base + (i < distrib.remainder ? 1 : 0);
        } else {
          perPackPrice = distrib;
        }
      }

      const packData = {
        patientId,
        label: perPackLabel,
        unitsTotal: perPackUnits,
        unitsRemaining: perPackUnits,
        unitMinutes: minutes, // 30 or 60
        priceCents: perPackPrice,
        paid: !!paid,
        notes: notes || null,
        createdAt: new Date().toISOString()
      };

      console.log('Creating credit pack (bridge) with data:', packData);

      const { data } = await supabaseFetch(`${req.getTable('credit_packs')}`, {
        method: 'POST',
        body: JSON.stringify(packData)
      });

      if (data && data[0]) created.push(data[0]);
    }

    if (created.length === 1) {
      res.status(201).json(created[0]);
    } else {
      res.status(201).json(created);
    }
  } catch (error) {
    console.error('Error creating credit pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/credits/packs/:packId - Eliminar pack de créditos
router.delete('/credits/packs/:packId', async (req, res) => {
  try {
    const { packId } = req.params;
    
    const endpoint = `${req.getTable('credit_packs')}?id=eq.${packId}`;
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
    
    const endpoint = `${req.getTable('credit_packs')}?id=eq.${packId}`;
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
    
    const endpoint = `${req.getTable('credit_packs')}?id=eq.${packId}`;
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
    
    const { data: redemption } = await supabaseFetch(`${req.getTable('credit_redemptions')}`, {
      method: 'POST',
      body: JSON.stringify(redemptionData)
    });
    
    // Actualizar unidades restantes del pack
    const packEndpoint = `${req.getTable('credit_packs')}?id=eq.${creditPackId}&select=unitsRemaining`;
    const { data: packs } = await supabaseFetch(packEndpoint);
    
    if (packs && packs.length > 0) {
      const newUnitsRemaining = packs[0].unitsRemaining - unitsUsed;
      
      await supabaseFetch(`${req.getTable('credit_packs')}?id=eq.${creditPackId}`, {
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
    const endpoint = `${req.getTable('credit_redemptions')}?select=*,${req.getTable('credit_packs')}!inner(patientId),${req.getTable('appointments')}(*)&${req.getTable('credit_packs')}.patientId=eq.${patientId}&order=createdAt.desc&limit=${limit}&offset=${offset}`;
    
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
// FILE ENDPOINTS (GLOBAL) - ORDEN ESPECÍFICO A GENÉRICO
// ============================================================

// GET /api/files/patient/:patientId - Listar archivos por paciente (DEBE ESTAR ANTES DE /:fileId)
router.get('/files/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const endpoint = `${req.getTable('patient_files')}?patientId=eq.${patientId}&select=*&order=createdAt.desc`;
    const { data: files } = await supabaseFetch(endpoint);
    
    // Para archivos de imagen, generar thumbnail más pequeño del storedPath
    const processedFiles = (files || []).map(file => {
      if (file.mimeType && file.mimeType.startsWith('image/') && file.storedPath) {
        // Mantener el storedPath completo para que Angular lo muestre
        return file;
      }
      return file;
    });
    
    res.json(processedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/files/patient/:patientId - Subir archivo (DEBE ESTAR ANTES DE /:fileId)
router.post('/files/patient/:patientId', upload.single('file'), async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Convertir archivo a Base64 para almacenar en storedPath
    const base64Data = req.file.buffer.toString('base64');
    
    const fileData = {
      patientId,
      originalName: req.file.originalname,
      storedPath: `data:${req.file.mimetype};base64,${base64Data}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || 'otro',
      description: req.body.description || '',
      checksum: null,
      createdAt: new Date().toISOString()
    };
    
    const { data } = await supabaseFetch(req.getTable('patient_files'), {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/:fileId/preview - Vista previa de archivo (ESPECÍFICO - ANTES DE /download)
router.get('/files/:fileId/preview', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `${req.getTable('patient_files')}?id=eq.${fileId}&select=originalName,mimeType,storedPath`;
    const { data: files } = await supabaseFetch(endpoint);
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const file = files[0];
    
    // Extraer el Base64 del data URI
    let base64Data = file.storedPath;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Convertir Base64 a Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Configurar headers para visualización inline
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/:fileId/download - Descargar archivo (ESPECÍFICO - ANTES DE /:fileId)
router.get('/files/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `${req.getTable('patient_files')}?id=eq.${fileId}&select=originalName,mimeType,storedPath`;
    const { data: files } = await supabaseFetch(endpoint);
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const file = files[0];
    
    // Extraer el Base64 del data URI (formato: data:mime;base64,xxxxx)
    let base64Data = file.storedPath;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Convertir Base64 a Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/:fileId - Eliminar archivo (GENÉRICO - DEBE ESTAR AL FINAL)
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `${req.getTable('patient_files')}?id=eq.${fileId}`;
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

// ============================================================
// CONFIGURATION ENDPOINTS
// ============================================================

// GET /api/config - Obtener configuración
router.get('/config', async (req, res) => {
  try {
    // Buscar la configuración principal usando key='config'
    const endpoint = `${req.getTable('configurations')}?key=eq.config&select=*`;
    const { data: configs } = await supabaseFetch(endpoint);
    
    if (!configs || configs.length === 0) {
      // Devolver configuración por defecto
      return res.json({
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
    
    // Parsear el value que está en JSON
    const configData = JSON.parse(configs[0].value);
    res.json(configData);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/config - Actualizar configuración
router.put('/config', async (req, res) => {
  try {
    const configData = req.body;
    
    // Verificar si existe la configuración con key='config'
    const checkEndpoint = `${req.getTable('configurations')}?key=eq.config&select=*`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    // Convertir configData a JSON string para almacenar en la columna 'value'
    const configRecord = {
      key: 'config',
      value: JSON.stringify(configData)
    };
    
    let result;
    if (existing && existing.length > 0) {
      // Actualizar usando key='config'
      const updateEndpoint = `${req.getTable('configurations')}?key=eq.config`;
      const { data } = await supabaseFetch(updateEndpoint, {
        method: 'PATCH',
        body: JSON.stringify({ value: configRecord.value })
      });
      result = JSON.parse(data[0].value);
    } else {
      // Crear nuevo registro
      const { data } = await supabaseFetch(`${req.getTable('configurations')}`, {
        method: 'POST',
        body: JSON.stringify(configRecord)
      });
      result = JSON.parse(data[0].value);
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
    
    const checkEndpoint = `${req.getTable('configurations')}?key=eq.config&select=*`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    const configRecord = {
      key: 'config',
      value: JSON.stringify(defaultConfig)
    };
    
    let result;
    if (existing && existing.length > 0) {
      const updateEndpoint = `${req.getTable('configurations')}?key=eq.config`;
      const { data } = await supabaseFetch(updateEndpoint, {
        method: 'PATCH',
        body: JSON.stringify({ value: configRecord.value })
      });
      result = JSON.parse(data[0].value);
    } else {
      const { data } = await supabaseFetch(`${req.getTable('configurations')}`, {
        method: 'POST',
        body: JSON.stringify(configRecord)
      });
      result = JSON.parse(data[0].value);
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
    
    // Obtener configuración usando key='config'
    const endpoint = `${req.getTable('configurations')}?key=eq.config&select=*`;
    const { data: configs } = await supabaseFetch(endpoint);
    
    if (!configs || configs.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    // Parsear el value JSON
    const configData = JSON.parse(configs[0].value);
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingHours = configData.workingHours || {};
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
    const endpoint = `${req.getTable('configurations')}?key=eq.config&select=*`;
    const { data: configs } = await supabaseFetch(endpoint);
    
    if (!configs || configs.length === 0) {
      return res.json({
        session30min: 35,
        session60min: 60,
        creditPack5: 150,
        creditPack10: 280
      });
    }
    
    // Parsear el value JSON
    const configData = JSON.parse(configs[0].value);
    res.json(configData.prices || {});
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/config/prices - Actualizar precios
router.put('/config/prices', async (req, res) => {
  try {
    const prices = req.body;
    
    // Verificar que existe la configuración
    const checkEndpoint = `${req.getTable('configurations')}?key=eq.config&select=*`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    // Parsear, actualizar y serializar
    const configData = JSON.parse(existing[0].value);
    configData.prices = prices;
    
    const updateEndpoint = `${req.getTable('configurations')}?key=eq.config`;
    const { data } = await supabaseFetch(updateEndpoint, {
      method: 'PATCH',
      body: JSON.stringify({ value: JSON.stringify(configData) })
    });
    
    res.json(prices);
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
    return res.json(LOCATIONS_DATA);
  } catch (error) {
    console.error('Error fetching locations:', error);
    // Fallback: devolver estructura básica
    res.json({
      provinces: [],
      municipalities: []
    });
  }
});

// GET /api/meta/locations/by-cp/:cp - Buscar localización por código postal
router.get('/meta/locations/by-cp/:cp', async (req, res) => {
  try {
    const { cp } = req.params;
    
    // Extraer los dos primeros dígitos del código postal
    const prefix = cp.substring(0, 2);
    
    // Buscar provincia en prefixMap
    const province = LOCATIONS_DATA.prefixMap?.[prefix];
    
    if (province) {
      return res.json({ 
        cp,
        province,
        prefix 
      });
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

// GET /api/backup/cron - Endpoint para Vercel Cron Jobs (backup autom�tico multi-tenant)
// Este endpoint es llamado autom�ticamente por Vercel Cron seg�n la configuraci�n en vercel.json
router.get('/backup/cron', async (req, res) => {
  try {
    // Verificar que la llamada viene de Vercel Cron o tiene la clave correcta
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    
    // Vercel env�a el header Authorization con el valor Bearer <CRON_SECRET>
    // Si no hay CRON_SECRET configurado, permitimos la ejecuci�n (para desarrollo)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('[CRON] Acceso no autorizado al endpoint de cron');
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    console.log('[CRON] Ejecutando backup autom�tico multi-tenant...');
    
    // Usar el script de backup multi-tenant
    const { DatabaseBackup } = require('../../scripts/backup');
    const backup = new DatabaseBackup();
    const result = await backup.createBackup('daily');
    
    console.log('[CRON] Backup multi-tenant completado:', result);
    
    res.json({
      success: true,
      message: 'Backup autom�tico multi-tenant completado',
      type: 'daily',
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('[CRON] Error en backup autom�tico:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear backup autom�tico'
    });
  }
});

// GET /api/backup/list - Listar backups disponibles
router.get('/backup/list', async (req, res) => {
  try {
    // Obtener tenant del header (opcional)
    const tenantSlug = req.headers['x-tenant-slug'];
    
    // Construir query - filtrar por tenant si se proporciona
    let endpoint = 'backups_storage?select=*&order=created_at.desc';
    if (tenantSlug) {
      endpoint += `&tenant_slug=eq.${tenantSlug}`;
    }
    
    // Obtener backups guardados en la tabla backups_storage
    const { data: backups, error } = await supabaseFetch(endpoint);
    
    if (error) {
      console.error('Error fetching backups from database:', error);
      return res.json([]); // Devolver array vac�o si hay error
    }
    
    // Formatear backups para el frontend
    const formattedBackups = (backups || []).map(backup => {
      const createdDate = new Date(backup.created_at);
      return {
        id: backup.id,
        fileName: backup.filename,
        filePath: backup.filename,
        size: formatBytes(backup.size_bytes || 0),
        created: backup.created_at,
        modified: backup.created_at,
        type: backup.backup_type || 'manual',
        tenantSlug: backup.tenant_slug,
        date: createdDate.toISOString().split('T')[0],
        time: createdDate.toTimeString().split(' ')[0],
        displayName: backup.filename
      };
    });
    
    res.json(formattedBackups);
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function para formatear bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// GET /api/backup/stats - Estad�sticas de backups
router.get('/backup/stats', async (req, res) => {
  try {
    // Obtener tenant del header (opcional)
    const tenantSlug = req.headers['x-tenant-slug'];
    
    // Construir query - filtrar por tenant si se proporciona
    let endpoint = 'backups_storage?select=*&order=created_at.desc';
    if (tenantSlug) {
      endpoint += `&tenant_slug=eq.${tenantSlug}`;
    }
    
    // Obtener todos los backups de backups_storage
    const { data: backups, error } = await supabaseFetch(endpoint);
    
    if (error) {
      console.error('Error fetching backup stats:', error);
      return res.json({
        totalBackups: 0,
        totalSize: '0 Bytes',
        lastBackup: 'N/A',
        nextScheduled: 'N/A',
        oldestBackup: 'N/A'
      });
    }
    
    const totalBackups = backups ? backups.length : 0;
    const totalSizeBytes = backups ? backups.reduce((sum, b) => sum + (b.size_bytes || 0), 0) : 0;
    const lastBackup = backups && backups.length > 0 ? backups[0].created_at : null;
    const oldestBackup = backups && backups.length > 0 ? backups[backups.length - 1].created_at : null;
    
    res.json({
      totalBackups,
      totalSize: formatBytes(totalSizeBytes),
      lastBackup: lastBackup || 'N/A',
      nextScheduled: 'Manual',
      oldestBackup: oldestBackup || 'N/A'
    });
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/create - Crear backup (exportar datos)
router.post('/backup/create', async (req, res) => {
  try {
    // 1. Obtener todos los datos
    const [patients, appointments, creditPacks, redemptions, files] = await Promise.all([
      supabaseFetch(`${req.getTable('patients')}?select=*`).then(r => r.data || []),
      supabaseFetch(`${req.getTable('appointments')}?select=*`).then(r => r.data || []),
      supabaseFetch(`${req.getTable('credit_packs')}?select=*`).then(r => r.data || []),
      supabaseFetch(`${req.getTable('credit_redemptions')}?select=*`).then(r => r.data || []),
      supabaseFetch(`${req.getTable('patient_files')}?select=*`).then(r => r.data || [])
    ]);
    
    // 2. Crear objeto backup
    const timestamp = new Date().toISOString();
    const fileName = `backup_${timestamp.replace(/[:.]/g, '-')}.json`;
    const backupData = {
      created: timestamp,
      version: '1.0',
      counts: {
        patients: patients.length,
        appointments: appointments.length,
        creditPacks: creditPacks.length,
        redemptions: redemptions.length,
        files: files.length
      },
      data: {
        patients,
        appointments,
        creditPacks,
        redemptions,
        files
      }
    };
    
    // 3. Convertir a JSON y calcular tamaño
    const backupJson = JSON.stringify(backupData);
    const sizeBytes = new Blob([backupJson]).size;
    
    // 4. Guardar en la tabla backups_storage (tabla central)
    const tenantSlug = req.headers['x-tenant-slug'] || req.tenantSlug || 'unknown';
    const totalRecords = patients.length + appointments.length + creditPacks.length + redemptions.length + files.length;
    
    const { data: savedBackup, error: saveError } = await supabaseFetch('backups_storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({
        filename: fileName,
        backup_type: 'manual',
        tenant_slug: tenantSlug,
        created_at: timestamp,
        size_bytes: sizeBytes,
        tenants_count: 1,
        total_records: totalRecords,
        data: backupData
      })
    });
    
    if (saveError) {
      console.error('Error saving backup to database:', saveError);
      throw new Error('Error al guardar el backup en la base de datos');
    }
    
    res.json({
      success: true,
      message: 'Backup creado exitosamente',
      backup: {
        fileName: fileName,
        size: formatBytes(sizeBytes),
        timestamp: timestamp,
        counts: backupData.counts
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al crear el backup'
    });
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
    // Obtener tenant del header (opcional)
    const tenantSlug = req.headers['x-tenant-slug'];
    
    // Construir query - filtrar por tenant si se proporciona
    let endpoint = 'backups_storage?select=*&order=created_at.desc';
    if (tenantSlug) {
      endpoint += `&tenant_slug=eq.${tenantSlug}`;
    }
    
    // Obtener backups guardados de backups_storage
    const { data: backups, error } = await supabaseFetch(endpoint);
    
    if (error) {
      console.error('Error fetching backups:', error);
      return res.json({});
    }
    
    // Agrupar por fecha
    const grouped = {};
    (backups || []).forEach(backup => {
      const createdDate = new Date(backup.created_at);
      const dateKey = createdDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          backups: []
        };
      }
      
      grouped[dateKey].backups.push({
        id: backup.id,
        fileName: backup.filename,
        filePath: backup.filename,
        size: formatBytes(backup.size_bytes || 0),
        created: backup.created_at,
        modified: backup.created_at,
        type: backup.backup_type || 'manual',
        tenantSlug: backup.tenant_slug,
        date: dateKey,
        time: createdDate.toTimeString().split(' ')[0],
        displayName: backup.filename
      });
    });
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped backups:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/restore/:fileName - Restaurar backup
router.post('/backup/restore/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const tenantSlug = req.headers['x-tenant-slug'] || req.tenantSlug;
    console.log('🔄 Iniciando restauración del backup:', fileName, 'para tenant:', tenantSlug);
    
    // 1. Obtener el backup de backups_storage
    let endpoint = `backups_storage?filename=eq.${encodeURIComponent(fileName)}`;
    if (tenantSlug) {
      endpoint += `&tenant_slug=eq.${tenantSlug}`;
    }
    const { data: backups, error: fetchError } = await supabaseFetch(endpoint);
    
    if (fetchError || !backups || backups.length === 0) {
      console.error('❌ Backup no encontrado:', fileName);
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }
    
    const backup = backups[0];
    const backupData = backup.data;
    
    // 2. Validar formato del backup
    if (!backupData || !backupData.data || !backupData.version) {
      console.error('❌ Formato de backup inválido');
      return res.status(400).json({
        success: false,
        message: 'Formato de backup inválido'
      });
    }
    
    const { patients = [], appointments = [], creditPacks = [], redemptions = [], files = [] } = backupData.data;
    
    console.log('📊 Datos a restaurar:', {
      patients: patients.length,
      appointments: appointments.length,
      creditPacks: creditPacks.length,
      redemptions: redemptions.length,
      files: files.length
    });
    
    // 3. Eliminar datos existentes (CUIDADO: Esta operación es destructiva)
    console.log('🗑️ Eliminando datos existentes...');
    await Promise.all([
      supabaseFetch(`${req.getTable('credit_redemptions')}?id=gt.0`, { method: 'DELETE' }),
      supabaseFetch(`${req.getTable('appointments')}?id=gt.0`, { method: 'DELETE' }),
      supabaseFetch(`${req.getTable('patient_files')}?id=gt.0`, { method: 'DELETE' }),
      supabaseFetch(`${req.getTable('credit_packs')}?id=gt.0`, { method: 'DELETE' }),
      supabaseFetch(`${req.getTable('patients')}?id=gt.0`, { method: 'DELETE' })
    ]);
    
    console.log('✅ Datos existentes eliminados');
    
    // 4. Insertar datos del backup (en orden para respetar foreign keys)
    console.log('📥 Insertando datos del backup...');
    
    // 4.1 Primero pacientes (no tienen dependencias)
    if (patients.length > 0) {
      const { error: patientsError } = await supabaseFetch(`${req.getTable('patients')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(patients)
      });
      if (patientsError) {
        console.error('❌ Error insertando pacientes:', patientsError);
        throw new Error('Error al restaurar pacientes');
      }
      console.log(`✅ ${patients.length} pacientes restaurados`);
    }
    
    // 4.2 Credit packs (dependen de pacientes)
    if (creditPacks.length > 0) {
      const { error: packsError } = await supabaseFetch(`${req.getTable('credit_packs')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(creditPacks)
      });
      if (packsError) {
        console.error('❌ Error insertando bonos:', packsError);
        throw new Error('Error al restaurar bonos');
      }
      console.log(`✅ ${creditPacks.length} bonos restaurados`);
    }
    
    // 4.3 Appointments (dependen de pacientes y credit_packs)
    if (appointments.length > 0) {
      const { error: appointmentsError } = await supabaseFetch(`${req.getTable('appointments')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(appointments)
      });
      if (appointmentsError) {
        console.error('❌ Error insertando citas:', appointmentsError);
        throw new Error('Error al restaurar citas');
      }
      console.log(`✅ ${appointments.length} citas restauradas`);
    }
    
    // 4.4 Credit redemptions (dependen de credit_packs y appointments)
    if (redemptions.length > 0) {
      const { error: redemptionsError } = await supabaseFetch(`${req.getTable('credit_redemptions')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(redemptions)
      });
      if (redemptionsError) {
        console.error('❌ Error insertando redenciones:', redemptionsError);
        throw new Error('Error al restaurar redenciones');
      }
      console.log(`✅ ${redemptions.length} redenciones restauradas`);
    }
    
    // 4.5 Patient files (dependen de pacientes)
    if (files.length > 0) {
      const { error: filesError } = await supabaseFetch(req.getTable('patient_files'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(files)
      });
      if (filesError) {
        console.error('❌ Error insertando archivos:', filesError);
        throw new Error('Error al restaurar archivos');
      }
      console.log(`✅ ${files.length} archivos restaurados`);
    }
    
    console.log('🎉 Backup restaurado exitosamente');
    
    res.json({
      success: true,
      message: 'Backup restaurado exitosamente',
      restored: {
        patients: patients.length,
        appointments: appointments.length,
        creditPacks: creditPacks.length,
        redemptions: redemptions.length,
        files: files.length
      }
    });
  } catch (error) {
    console.error('❌ Error restoring backup:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al restaurar el backup'
    });
  }
});

// GET /api/backup/download/:fileName - Descargar backup
router.get('/backup/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const tenantSlug = req.headers['x-tenant-slug'] || req.tenantSlug;
    
    // Buscar el backup en backups_storage
    let endpoint = `backups_storage?filename=eq.${encodeURIComponent(fileName)}`;
    if (tenantSlug) {
      endpoint += `&tenant_slug=eq.${tenantSlug}`;
    }
    const { data: backups, error } = await supabaseFetch(endpoint);
    
    if (error || !backups || backups.length === 0) {
      return res.status(404).json({ error: 'Backup no encontrado' });
    }
    
    const backup = backups[0];
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.json(backup.data);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/backup/delete/:fileName - Eliminar backup
router.delete('/backup/delete/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const tenantSlug = req.headers['x-tenant-slug'] || req.tenantSlug;
    
    // Eliminar el backup de backups_storage
    let endpoint = `backups_storage?filename=eq.${encodeURIComponent(fileName)}`;
    if (tenantSlug) {
      endpoint += `&tenant_slug=eq.${tenantSlug}`;
    }
    const { error } = await supabaseFetch(endpoint, {
      method: 'DELETE'
    });
    
    if (error) {
      console.error('Error deleting backup:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar el backup'
      });
    }
    
    res.json({
      success: true,
      message: 'Backup eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ============================================
// CONFIGURATION ENDPOINTS (/api/meta/config)
// ============================================

// Configuración por defecto
const DEFAULT_CONFIG = {
  workingHours: {
    monday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    tuesday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    wednesday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    thursday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    friday: { enabled: true, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    saturday: { enabled: false, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } },
    sunday: { enabled: false, morning: { start: '09:00', end: '14:00' }, afternoon: { start: '16:00', end: '20:00' } }
  },
  defaultDuration: 30,
  slotDuration: 30,
  holidays: [],
  clinicInfo: {
    name: 'Masaje Corporal Deportivo',
    address: '',
    phone: '',
    email: ''
  }
};

const DEFAULT_PRICES = {
  sessionPrice30: 35,
  sessionPrice60: 60,
  bonoPrice30: 150,
  bonoPrice60: 260
};

// GET /api/meta/config - Obtener configuración
router.get('/meta/config', async (req, res) => {
  try {
    const { data: configs } = await supabaseFetch(`${req.getTable('configurations')}?select=*`);
    
    const configObject = {};
    if (configs) {
      configs.forEach(config => {
        try {
          configObject[config.key] = JSON.parse(config.value);
        } catch (e) {
          configObject[config.key] = config.value;
        }
      });
    }
    
    const finalConfig = { ...DEFAULT_CONFIG, ...configObject };
    res.json(finalConfig);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/meta/config - Actualizar configuración
router.put('/meta/config', async (req, res) => {
  try {
    const updates = req.body;
    
    // Actualizar cada configuración
    const promises = Object.keys(updates).map(async (key) => {
      const value = typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key].toString();
      
      // Buscar si existe
      const { data: existing } = await supabaseFetch(`${req.getTable('configurations')}?key=eq.${key}`);
      
      if (existing && existing.length > 0) {
        // Actualizar
        return await supabaseFetch(`${req.getTable('configurations')}?key=eq.${key}`, {
          method: 'PATCH',
          body: JSON.stringify({ value })
        });
      } else {
        // Crear
        return await supabaseFetch(`${req.getTable('configurations')}`, {
          method: 'POST',
          body: JSON.stringify({ key, value })
        });
      }
    });
    
    await Promise.all(promises);
    
    // Obtener configuración actualizada
    const { data: configs } = await supabaseFetch(`${req.getTable('configurations')}?select=*`);
    const configObject = {};
    if (configs) {
      configs.forEach(config => {
        try {
          configObject[config.key] = JSON.parse(config.value);
        } catch (e) {
          configObject[config.key] = config.value;
        }
      });
    }
    
    const finalConfig = { ...DEFAULT_CONFIG, ...configObject };
    res.json(finalConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/meta/config/prices - Obtener precios
router.get('/meta/config/prices', async (req, res) => {
  try {
    const priceKeys = ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60'];
    const keysParam = priceKeys.map(k => `"${k}"`).join(',');
    const { data: priceConfigs } = await supabaseFetch(`${req.getTable('configurations')}?key=in.(${keysParam})`);
    
    const pricesObject = { ...DEFAULT_PRICES };
    if (priceConfigs) {
      priceConfigs.forEach(config => {
        try {
          pricesObject[config.key] = parseFloat(config.value);
        } catch (e) {
          pricesObject[config.key] = parseFloat(config.value) || DEFAULT_PRICES[config.key];
        }
      });
    }
    
    res.json(pricesObject);
  } catch (error) {
    console.error('Error getting prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/meta/config/prices - Actualizar precios
router.put('/meta/config/prices', async (req, res) => {
  try {
    const updates = req.body;
    
    // Actualizar cada precio
    const promises = Object.keys(updates).map(async (key) => {
      const value = updates[key].toString();
      
      // Buscar si existe
      const { data: existing } = await supabaseFetch(`${req.getTable('configurations')}?key=eq.${key}`);
      
      if (existing && existing.length > 0) {
        // Actualizar
        return await supabaseFetch(`${req.getTable('configurations')}?key=eq.${key}`, {
          method: 'PATCH',
          body: JSON.stringify({ value })
        });
      } else {
        // Crear
        return await supabaseFetch(`${req.getTable('configurations')}`, {
          method: 'POST',
          body: JSON.stringify({ key, value })
        });
      }
    });
    
    await Promise.all(promises);
    
    // Obtener precios actualizados
    const priceKeys = ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60'];
    const keysParam = priceKeys.map(k => `"${k}"`).join(',');
    const { data: priceConfigs } = await supabaseFetch(`${req.getTable('configurations')}?key=in.(${keysParam})`);
    
    const pricesObject = { ...DEFAULT_PRICES };
    if (priceConfigs) {
      priceConfigs.forEach(config => {
        try {
          pricesObject[config.key] = parseFloat(config.value);
        } catch (e) {
          pricesObject[config.key] = parseFloat(config.value) || DEFAULT_PRICES[config.key];
        }
      });
    }
    
    res.json({
      message: 'Precios actualizados correctamente',
      prices: pricesObject
    });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================================
// REPORTS ENDPOINTS
// ================================================================================

// GET /api/reports/billing?year=YYYY&month=MM&groupBy=appointment|patient
router.get('/reports/billing', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
    const groupBy = req.query.groupBy || 'appointment';

    // Obtener todas las citas del mes con creditRedemptions y packs
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // IMPORTANTE: Usar req.getTable() tanto en el endpoint base como en las relaciones del SELECT
    const { data: appointments } = await supabaseFetch(
      `${req.getTable('appointments')}?start=gte.${startDate.toISOString()}&start=lte.${endDate.toISOString()}&select=*,${req.getTable('patients')}(*),${req.getTable('credit_redemptions')}(*,${req.getTable('credit_packs')}(*))`
    );

    const filename = `facturas-${groupBy}-${year}-${String(month).padStart(2, '0')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.write('\uFEFF'); // BOM for Excel

    if (groupBy === 'patient') {
      // Agrupar por paciente
      const patientMap = new Map();
      
      for (const apt of appointments || []) {
        const patientId = apt.patientId;
        if (!patientMap.has(patientId)) {
          patientMap.set(patientId, {
            patient: getEmbeddedProperty(apt, 'patients', req.tableSuffix),
            appointments: []
          });
        }
        patientMap.get(patientId).appointments.push(apt);
      }

      // Generar CSV agrupado por paciente
      res.write('Paciente;DNI;Total Citas;Total Pagado (€);Total Pendiente (€);Total (€)\n');
      
      for (const [patientId, data] of patientMap) {
        const patient = data.patient;
        const apts = data.appointments;
        
        let totalPaid = 0;
        let totalPending = 0;
        
        for (const apt of apts) {
          const price = calculateAppointmentPrice(apt, req.tableSuffix);
          const isPaid = getAppointmentPaidStatus(apt, req.tableSuffix);
          
          if (isPaid) {
            totalPaid += price;
          } else {
            totalPending += price;
          }
        }
        
        const total = totalPaid + totalPending;
        const row = `${patient.firstName} ${patient.lastName};${patient.dni || ''};${apts.length};${(totalPaid / 100).toFixed(2)};${(totalPending / 100).toFixed(2)};${(total / 100).toFixed(2)}\n`;
        res.write(row);
      }
    } else {
      // Agrupar por cita
      res.write('Fecha;Hora;Paciente;DNI;Duración (min);Tipo;Estado Pago;Precio (€)\n');
      
      for (const apt of appointments || []) {
        const patient = getEmbeddedProperty(apt, 'patients', req.tableSuffix);
        const date = new Date(apt.start);
        const dateStr = date.toLocaleDateString('es-ES');
        const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const duration = apt.durationMinutes || 0;
        const type = getAppointmentType(apt, req.tableSuffix);
        const isPaid = getAppointmentPaidStatus(apt, req.tableSuffix);
        const paidStatus = isPaid ? 'Pagado' : 'Pendiente';
        const price = calculateAppointmentPrice(apt, req.tableSuffix);
        const priceEuros = (price / 100).toFixed(2);
        
        const row = `${dateStr};${timeStr};${patient.firstName} ${patient.lastName};${patient.dni || ''};${duration};${type};${paidStatus};${priceEuros}\n`;
        res.write(row);
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Error generating billing report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Calcular precio de una cita (MULTI-TENANT COMPATIBLE)
function calculateAppointmentPrice(appointment, tableSuffix) {
  const DEFAULT_PRICE_30 = 3000; // 30€
  const DEFAULT_PRICE_60 = 5500; // 55€
  
  if (!appointment) return 0;
  
  // Si tiene priceCents directamente
  if (appointment.priceCents && appointment.priceCents > 0) {
    return appointment.priceCents;
  }
  
  // Si tiene creditRedemptions, calcular proporcional
  // IMPORTANTE: Usar getEmbeddedProperty para acceder a las propiedades con sufijo
  const redemptions = getEmbeddedProperty(appointment, 'credit_redemptions', tableSuffix) || [];
  if (redemptions.length > 0) {
    const r = redemptions[0];
    const pack = getEmbeddedProperty(r, 'credit_packs', tableSuffix) || {};
    const priceCents = Number(pack.priceCents) || 0;
    const unitsTotal = Number(pack.unitsTotal) || 0;
    const unitsUsed = Number(r.unitsUsed) || 0;
    
    if (priceCents > 0 && unitsTotal > 0 && unitsUsed > 0) {
      return Math.round(unitsUsed * (priceCents / unitsTotal));
    }
  }
  
  // Fallback: precio según duración
  const mins = Number(appointment.durationMinutes || 0);
  return mins >= 60 ? DEFAULT_PRICE_60 : DEFAULT_PRICE_30;
}

// Helper: Determinar si una cita está pagada (MULTI-TENANT COMPATIBLE)
function getAppointmentPaidStatus(appointment, tableSuffix) {
  if (!appointment) return false;
  
  const redemptions = getEmbeddedProperty(appointment, 'credit_redemptions', tableSuffix) || [];
  if (redemptions.length > 0) {
    const r = redemptions[0];
    const pack = getEmbeddedProperty(r, 'credit_packs', tableSuffix) || {};
    return pack.paid === true;
  }
  
  // Si tiene priceCents sin redemptions, considerar como pagada
  if (appointment.priceCents && appointment.priceCents > 0) {
    return true;
  }
  
  return false;
}

// Helper: Obtener tipo de cita (MULTI-TENANT COMPATIBLE)
function getAppointmentType(appointment, tableSuffix) {
  if (!appointment) return '';
  
  const redemptions = getEmbeddedProperty(appointment, 'credit_redemptions', tableSuffix) || [];
  if (redemptions.length > 0) {
    const r = redemptions[0];
    const pack = getEmbeddedProperty(r, 'credit_packs', tableSuffix) || {};
    if (pack && pack.label) {
      return String(pack.label || '').trim();
    }
    
    const unitsTotal = Number(pack.unitsTotal) || 0;
    const unitMinutes = Number(pack.unitMinutes) || 30;
    
    if (unitsTotal > 0) {
      if (unitsTotal === 1 || unitsTotal === 2) return `Sesión ${unitMinutes}m`;
      const sessions = unitMinutes === 60 ? Math.round(unitsTotal / 2) : unitsTotal;
      return `Bono ${sessions}×${unitMinutes}m`;
    }
  }
  
  const mins = Number(appointment.durationMinutes || 0);
  return mins >= 60 ? 'Sesión 60m' : `Sesión ${mins}m`;
}

// ============================================================
// STATS / DASHBOARD ENDPOINT (Bridge version - Vercel compatible)
// ============================================================

/**
 * GET /stats/dashboard
 * Obtiene estadísticas del dashboard para el período seleccionado
 * Query params:
 *   - period: 'today' | 'week' | 'month' | 'year' (default: 'month')
 */
router.get('/stats/dashboard', loadTenant, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const tableSuffix = req.tableSuffix; // From loadTenant middleware
    
    // Calcular fechas según el período
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }
    
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    // Obtener tabla de appointments con tenant suffix
    const appointmentsTable = tableSuffix ? `appointments_${tableSuffix}` : 'appointments';
    const redemptionsTable = tableSuffix ? `credit_redemptions_${tableSuffix}` : 'credit_redemptions';
    const creditPacksTable = tableSuffix ? `credit_packs_${tableSuffix}` : 'credit_packs';
    const patientsTable = tableSuffix ? `patients_${tableSuffix}` : 'patients';
    
    // 1. Obtener citas del período con redemptions
    const selectFields = `id,start,end,durationMinutes,priceCents,patientId,${redemptionsTable}(id,unitsUsed,${creditPacksTable}(id,priceCents,unitsTotal,paid,label))`;
    const { data: appointments } = await supabaseFetch(
      `${appointmentsTable}?select=${encodeURIComponent(selectFields)}&start=gte.${startISO}&start=lte.${endISO}`,
      { method: 'GET' }
    );
    
    // 2. Contar pacientes nuevos del período
    const { data: newPatients } = await supabaseFetch(
      `${patientsTable}?select=id&createdAt=gte.${startISO}&createdAt=lte.${endISO}`,
      { method: 'GET', headers: { 'Prefer': 'count=exact' } }
    );
    
    // 2b. Contar total de pacientes
    const { data: allPatients, total: totalPatientsCount } = await supabaseFetch(
      `${patientsTable}?select=id`,
      { method: 'GET', headers: { 'Prefer': 'count=exact' } }
    );
    
    // 3. Contar credit packs comprados en el período
    const { data: newCreditPacks } = await supabaseFetch(
      `${creditPacksTable}?select=id,priceCents,paid&purchaseDate=gte.${startISO}&purchaseDate=lte.${endISO}`,
      { method: 'GET' }
    );
    
    // 3b. Obtener credit packs activos (unitsRemaining > 0)
    const { data: activeCreditPacks } = await supabaseFetch(
      `${creditPacksTable}?select=id,paid,unitsRemaining&unitsRemaining=gt.0`,
      { method: 'GET' }
    );
    
    // Procesar estadísticas
    const totalAppointments = appointments?.length || 0;
    const completedAppointments = appointments?.filter(a => new Date(a.start) < now).length || 0;
    const pendingAppointments = totalAppointments - completedAppointments;
    
    // Calcular ingresos
    let paidRevenueCents = 0;
    let pendingRevenueCents = 0;
    
    appointments?.forEach(apt => {
      const priceCents = calculateAppointmentPrice(apt, tableSuffix);
      const isPaid = getAppointmentPaidStatus(apt, tableSuffix);
      
      if (isPaid) {
        paidRevenueCents += priceCents;
      } else {
        pendingRevenueCents += priceCents;
      }
    });
    
    // Credit packs vendidos en el período
    const creditPacksSold = newCreditPacks?.length || 0;
    const creditPacksRevenueCents = newCreditPacks?.reduce((sum, pack) => {
      return sum + (pack.paid ? (Number(pack.priceCents) || 0) : 0);
    }, 0) || 0;
    
    // Credit packs activos y sin pagar
    const activePacksCount = activeCreditPacks?.length || 0;
    const unpaidPacksCount = activeCreditPacks?.filter(p => !p.paid).length || 0;
    
    res.json({
      period,
      dateRange: {
        start: startISO,
        end: endISO
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        pending: pendingAppointments,
        cancelled: 0
      },
      revenue: {
        totalCents: paidRevenueCents + pendingRevenueCents,
        paidCents: paidRevenueCents,
        pendingCents: pendingRevenueCents,
        totalFormatted: ((paidRevenueCents + pendingRevenueCents) / 100).toFixed(2) + ' €',
        paidFormatted: (paidRevenueCents / 100).toFixed(2) + ' €',
        pendingFormatted: (pendingRevenueCents / 100).toFixed(2) + ' €'
      },
      patients: {
        total: totalPatientsCount || allPatients?.length || 0,
        newInPeriod: newPatients?.length || 0
      },
      creditPacks: {
        active: activePacksCount,
        withUnpaidBalance: unpaidPacksCount,
        soldInPeriod: creditPacksSold,
        revenueCents: creditPacksRevenueCents,
        revenueFormatted: (creditPacksRevenueCents / 100).toFixed(2) + ' €'
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
