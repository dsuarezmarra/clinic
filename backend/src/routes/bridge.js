// Endpoints "bridge" usando fetch directo a Supabase REST API
// Estos endpoints evitan el bug del SDK @supabase/supabase-js en Vercel

const express = require('express');
const router = express.Router();
const multer = require('multer');

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
// PATIENTS ENDPOINTS
// ============================================================

// GET /api/patients - Listar pacientes con paginación y búsqueda
router.get('/patients', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Incluir credit_packs para calcular activeSessions
    let endpoint = `patients?select=*,credit_packs(unitsRemaining)&order=firstName.asc,lastName.asc&limit=${limit}&offset=${offset}`;
    
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
      const packs = Array.isArray(patient.credit_packs) ? patient.credit_packs : [];
      const totalUnitsRemaining = packs.reduce((sum, pack) => sum + (Number(pack.unitsRemaining) || 0), 0);
      
      return {
        ...patient,
        activeSessions: totalUnitsRemaining,
        credit_packs: undefined // Eliminar credit_packs del response
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
    
    const endpoint = `patient_files?patientId=eq.${patientId}&select=*&order=createdAt.desc`;
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

// GET /api/patients/:id - Obtener un paciente por ID (DEBE ESTAR DESPUÉS DE RUTAS ESPECÍFICAS)
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
    
    // Incluir relaciones: patient, creditRedemptions con creditPack
    let endpoint = `appointments?select=*,patients(*),credit_redemptions(*,credit_packs(*))&order=start.asc&limit=${limit}&offset=${offset}`;
    
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
    const mapped = (appointments || []).map(apt => ({
      ...apt,
      // Asegurar que las fechas estén en formato ISO completo (agregar Z si no tiene timezone)
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: apt.patients || null,
      creditRedemptions: (apt.credit_redemptions || []).map(cr => ({
        ...cr,
        creditPack: cr.credit_packs || null,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      }))
    }));
    
    // Eliminar las propiedades originales con guiones bajos
    mapped.forEach(apt => {
      delete apt.patients;
      delete apt.credit_redemptions;
      if (apt.creditRedemptions) {
        apt.creditRedemptions.forEach(cr => {
          delete cr.credit_packs;
        });
      }
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
    const endpoint = `appointments?select=*,patients(*),credit_redemptions(*,credit_packs(*))&order=start.desc`;
    const { data: appointments } = await supabaseFetch(endpoint);
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const mapped = (appointments || []).map(apt => ({
      ...apt,
      // Asegurar que las fechas estén en formato ISO completo (agregar Z si no tiene timezone)
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: apt.patients || null,
      creditRedemptions: (apt.credit_redemptions || []).map(cr => ({
        ...cr,
        creditPack: cr.credit_packs || null,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      }))
    }));
    
    // Eliminar las propiedades originales con guiones bajos
    mapped.forEach(apt => {
      delete apt.patients;
      delete apt.credit_redemptions;
      if (apt.creditRedemptions) {
        apt.creditRedemptions.forEach(cr => {
          delete cr.credit_packs;
        });
      }
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
    
    // Incluir relaciones: patient, creditRedemptions con creditPack
    const endpoint = `appointments?patientId=eq.${patientId}&select=*,patients(*),credit_redemptions(*,credit_packs(*))&order=start.desc`;
    const { data: appointments } = await supabaseFetch(endpoint);
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const mapped = (appointments || []).map(apt => ({
      ...apt,
      // Asegurar que las fechas estén en formato ISO completo (agregar Z si no tiene timezone)
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: apt.patients || null,
      creditRedemptions: (apt.credit_redemptions || []).map(cr => ({
        ...cr,
        creditPack: cr.credit_packs || null,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      }))
    }));
    
    // Eliminar las propiedades originales con guiones bajos
    mapped.forEach(apt => {
      delete apt.patients;
      delete apt.credit_redemptions;
      if (apt.creditRedemptions) {
        apt.creditRedemptions.forEach(cr => {
          delete cr.credit_packs;
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
    const endpoint = `appointments?id=eq.${id}&select=*,patients(*),credit_redemptions(*,credit_packs(*))`;
    const { data } = await supabaseFetch(endpoint);
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    // Mapear las relaciones a los nombres esperados por el frontend
    const apt = data[0];
    const mapped = {
      ...apt,
      // Asegurar que las fechas estén en formato ISO completo (agregar Z si no tiene timezone)
      start: apt.start && !apt.start.endsWith('Z') ? apt.start + 'Z' : apt.start,
      end: apt.end && !apt.end.endsWith('Z') ? apt.end + 'Z' : apt.end,
      patient: apt.patients || null,
      creditRedemptions: (apt.credit_redemptions || []).map(cr => ({
        ...cr,
        creditPack: cr.credit_packs || null,
        creditPackId: cr.creditPackId || cr.credit_pack_id
      }))
    };
    
    // Eliminar las propiedades originales con guiones bajos
    delete mapped.patients;
    delete mapped.credit_redemptions;
    if (mapped.creditRedemptions) {
      mapped.creditRedemptions.forEach(cr => {
        delete cr.credit_packs;
      });
    }
    
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
      `appointments?start=lt.${endTime}&end=gt.${startTime}`
    );
    
    if (overlappingAppts && overlappingAppts.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe una cita en ese horario',
        overlapping: overlappingAppts[0]
      });
    }
    
    // 1. Crear la cita
    const { data: appointments } = await supabaseFetch('appointments', {
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
      const { data: packs } = await supabaseFetch(
        `credit_packs?patientId=eq.${patientId}&unitsRemaining=gt.0&order=paid.desc,createdAt.asc`
      );
      
      if (!packs || packs.length === 0) {
        // Eliminar la cita si no hay créditos
        await supabaseFetch(`appointments?id=eq.${appointment.id}`, {
          method: 'DELETE'
        });
        return res.status(400).json({ error: 'Créditos insuficientes' });
      }
      
      let remainingUnits = requiredUnits;
      const redemptions = [];
      
      // Consumir créditos de los packs disponibles
      for (const pack of packs) {
        if (remainingUnits <= 0) break;
        
        // Calcular unidades a usar según el tipo de pack y cita
        let unitsToUse = 0;
        
        if (requiredUnits === 2) {
          // Cita de 60 minutos - requiere 2 unidades
          if (pack.unitsRemaining < 2) {
            // Si el pack no tiene al menos 2 unidades, no se puede usar para cita de 60min
            continue;
          }
          
          const isSesion60 = pack.label?.startsWith('Sesión') && pack.unitMinutes === 60;
          const isBono60 = pack.unitMinutes === 60 && !pack.label?.startsWith('Sesión');
          
          if (isSesion60 || isBono60) {
            // Packs de 60min: consumir 2 unidades juntas
            unitsToUse = Math.min(2, remainingUnits);
          } else {
            // Packs generales: consumir en pares (2 en 2)
            const pairs = Math.floor(pack.unitsRemaining / 2);
            unitsToUse = pairs > 0 ? Math.min(pairs * 2, remainingUnits) : 0;
          }
        } else {
          // Cita de 30 minutos - requiere 1 unidad
          unitsToUse = Math.min(remainingUnits, pack.unitsRemaining);
        }
        
        if (unitsToUse === 0) continue;
        
        // Crear redemption
        const { data: redemption } = await supabaseFetch('credit_redemptions', {
          method: 'POST',
          body: JSON.stringify({
            creditPackId: pack.id,
            appointmentId: appointment.id,
            unitsUsed: unitsToUse
          })
        });
        
        redemptions.push(redemption[0]);
        
        // Actualizar unitsRemaining del pack
        await supabaseFetch(`credit_packs?id=eq.${pack.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            unitsRemaining: pack.unitsRemaining - unitsToUse
          })
        });
        
        remainingUnits -= unitsToUse;
      }
      
      if (remainingUnits > 0) {
        // Eliminar la cita y las redemptions creadas si no se pudieron consumir todos los créditos
        for (const redemption of redemptions) {
          await supabaseFetch(`credit_redemptions?id=eq.${redemption.id}`, {
            method: 'DELETE'
          });
        }
        await supabaseFetch(`appointments?id=eq.${appointment.id}`, {
          method: 'DELETE'
        });
        return res.status(400).json({ error: 'Créditos insuficientes' });
      }
    }
    
    res.status(201).json(appointment);
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
      const { data: currentAppt } = await supabaseFetch(`appointments?id=eq.${id}`);
      if (!currentAppt || currentAppt.length === 0) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }
      
      const newStart = filteredUpdates.start || currentAppt[0].start;
      const newEnd = filteredUpdates.end || currentAppt[0].end;
      const startTime = new Date(newStart).toISOString();
      const endTime = new Date(newEnd).toISOString();
      
      // Buscar citas que se solapen (excluyendo la cita actual)
      const { data: overlappingAppts } = await supabaseFetch(
        `appointments?start=lt.${endTime}&end=gt.${startTime}&id=neq.${id}`
      );
      
      if (overlappingAppts && overlappingAppts.length > 0) {
        return res.status(409).json({ 
          error: 'Ya existe una cita en ese horario',
          overlapping: overlappingAppts[0]
        });
      }
    }
    
    const endpoint = `appointments?id=eq.${id}`;
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
    res.json(data[0]);
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
      `credit_redemptions?appointmentId=eq.${id}&select=*,credit_packs(*)`
    );
    
    // 2. Revertir créditos a los packs
    if (redemptions && redemptions.length > 0) {
      for (const redemption of redemptions) {
        const pack = redemption.credit_packs;
        if (pack) {
          const currentUnits = Number(pack.unitsRemaining) || 0;
          const unitsToRevert = Number(redemption.unitsUsed) || 0;
          const newUnits = currentUnits + unitsToRevert;
          
          // Actualizar unitsRemaining del pack
          await supabaseFetch(`credit_packs?id=eq.${pack.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              unitsRemaining: newUnits
            })
          });
        }
      }
      
      // 3. Eliminar los redemptions
      await supabaseFetch(`credit_redemptions?appointmentId=eq.${id}`, {
        method: 'DELETE',
        headers: { 'Prefer': 'return=minimal' }
      });
    }
    
    // 4. Eliminar la cita
    await supabaseFetch(`appointments?id=eq.${id}`, {
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
    const { patientId, type, minutes, quantity, paid, notes } = req.body;
    
    // Calcular unidades totales (1 unidad = 30 minutos)
    const unitsPerItem = minutes / 30;
    const unitsTotal = type === 'bono' 
      ? (minutes === 60 ? quantity * 10 : quantity * 5) 
      : unitsPerItem;
    
    // Generar label
    let label;
    if (type === 'sesion') {
      // Para sesiones: "Sesión 1x30min" o "Sesión 1x60min"
      label = `Sesión 1x${minutes}min`;
    } else {
      // Para bonos: usar la cantidad ingresada por el usuario
      // "Bono 5x30min" o "Bono 5x60min"
      label = `Bono ${quantity}x${minutes}min`;
    }
    
    const packData = {
      patientId,
      label,
      unitsTotal,
      unitsRemaining: unitsTotal,
      unitMinutes: minutes, // 🔥 CRÍTICO: Guardar 30 o 60 para identificar tipo de pack
      paid: paid || false,
      notes: notes || null,
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating credit pack:', packData);
    
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
// FILE ENDPOINTS (GLOBAL) - ORDEN ESPECÍFICO A GENÉRICO
// ============================================================

// GET /api/files/patient/:patientId - Listar archivos por paciente (DEBE ESTAR ANTES DE /:fileId)
router.get('/files/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const endpoint = `patient_files?patientId=eq.${patientId}&select=*&order=createdAt.desc`;
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

// GET /api/files/:fileId/preview - Vista previa de archivo (ESPECÍFICO - ANTES DE /download)
router.get('/files/:fileId/preview', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const endpoint = `patient_files?id=eq.${fileId}&select=originalName,mimeType,storedPath`;
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
    
    const endpoint = `patient_files?id=eq.${fileId}&select=originalName,mimeType,storedPath`;
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

// ============================================================
// CONFIGURATION ENDPOINTS
// ============================================================

// GET /api/config - Obtener configuración
router.get('/config', async (req, res) => {
  try {
    const endpoint = `configurations?select=*&limit=1`;
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
    const checkEndpoint = `configurations?select=id&limit=1`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    let result;
    if (existing && existing.length > 0) {
      // Actualizar
      const updateEndpoint = `configurations?id=eq.${existing[0].id}`;
      const { data } = await supabaseFetch(updateEndpoint, {
        method: 'PATCH',
        body: JSON.stringify(configData)
      });
      result = data[0];
    } else {
      // Crear
      const { data } = await supabaseFetch('configurations', {
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
    
    const checkEndpoint = `configurations?select=id&limit=1`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    let result;
    if (existing && existing.length > 0) {
      const updateEndpoint = `configurations?id=eq.${existing[0].id}`;
      const { data } = await supabaseFetch(updateEndpoint, {
        method: 'PATCH',
        body: JSON.stringify(defaultConfig)
      });
      result = data[0];
    } else {
      const { data } = await supabaseFetch('configurations', {
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
    const endpoint = `configurations?select=workingHours&limit=1`;
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
    const endpoint = `configurations?select=prices&limit=1`;
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
    
    const checkEndpoint = `configurations?select=id&limit=1`;
    const { data: existing } = await supabaseFetch(checkEndpoint);
    
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    const updateEndpoint = `configurations?id=eq.${existing[0].id}`;
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
    // Obtener backups guardados en la tabla backups
    const { data: backups, error } = await supabaseFetch('backups?select=*&order=created.desc');
    
    if (error) {
      console.error('Error fetching backups from database:', error);
      return res.json([]); // Devolver array vacío si hay error
    }
    
    // Formatear backups para el frontend
    const formattedBackups = (backups || []).map(backup => {
      const createdDate = new Date(backup.created);
      return {
        fileName: backup.file_name,
        filePath: backup.file_name,
        size: formatBytes(backup.size_bytes || 0),
        created: backup.created,
        modified: backup.created,
        type: 'manual',
        date: createdDate.toISOString().split('T')[0],
        time: createdDate.toTimeString().split(' ')[0],
        displayName: backup.file_name
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

// GET /api/backup/stats - Estadísticas de backups
router.get('/backup/stats', async (req, res) => {
  try {
    // Obtener todos los backups
    const { data: backups, error } = await supabaseFetch('backups?select=*&order=created.desc');
    
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
    const lastBackup = backups && backups.length > 0 ? backups[0].created : null;
    const oldestBackup = backups && backups.length > 0 ? backups[backups.length - 1].created : null;
    
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
      supabaseFetch('patients?select=*').then(r => r.data || []),
      supabaseFetch('appointments?select=*').then(r => r.data || []),
      supabaseFetch('credit_packs?select=*').then(r => r.data || []),
      supabaseFetch('credit_redemptions?select=*').then(r => r.data || []),
      supabaseFetch('patient_files?select=*').then(r => r.data || [])
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
    
    // 4. Guardar en la tabla backups
    const { data: savedBackup, error: saveError } = await supabaseFetch('backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({
        file_name: fileName,
        data: backupData,
        size_bytes: sizeBytes,
        created: timestamp
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
    // Obtener backups guardados
    const { data: backups, error } = await supabaseFetch('backups?select=*&order=created.desc');
    
    if (error) {
      console.error('Error fetching backups:', error);
      return res.json({});
    }
    
    // Agrupar por fecha
    const grouped = {};
    (backups || []).forEach(backup => {
      const createdDate = new Date(backup.created);
      const dateKey = createdDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          backups: []
        };
      }
      
      grouped[dateKey].backups.push({
        fileName: backup.file_name,
        filePath: backup.file_name,
        size: formatBytes(backup.size_bytes || 0),
        created: backup.created,
        modified: backup.created,
        type: 'manual',
        date: dateKey,
        time: createdDate.toTimeString().split(' ')[0],
        displayName: backup.file_name
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
    console.log('🔄 Iniciando restauración del backup:', fileName);
    
    // 1. Obtener el backup de la base de datos
    const { data: backups, error: fetchError } = await supabaseFetch(`backups?file_name=eq.${encodeURIComponent(fileName)}`);
    
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
      supabaseFetch('credit_redemptions?id=gt.0', { method: 'DELETE' }),
      supabaseFetch('appointments?id=gt.0', { method: 'DELETE' }),
      supabaseFetch('patient_files?id=gt.0', { method: 'DELETE' }),
      supabaseFetch('credit_packs?id=gt.0', { method: 'DELETE' }),
      supabaseFetch('patients?id=gt.0', { method: 'DELETE' })
    ]);
    
    console.log('✅ Datos existentes eliminados');
    
    // 4. Insertar datos del backup (en orden para respetar foreign keys)
    console.log('📥 Insertando datos del backup...');
    
    // 4.1 Primero pacientes (no tienen dependencias)
    if (patients.length > 0) {
      const { error: patientsError } = await supabaseFetch('patients', {
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
      const { error: packsError } = await supabaseFetch('credit_packs', {
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
      const { error: appointmentsError } = await supabaseFetch('appointments', {
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
      const { error: redemptionsError } = await supabaseFetch('credit_redemptions', {
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
      const { error: filesError } = await supabaseFetch('patient_files', {
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
    
    // Buscar el backup en la base de datos
    const { data: backups, error } = await supabaseFetch(`backups?file_name=eq.${encodeURIComponent(fileName)}`);
    
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
    
    // Eliminar el backup de la base de datos
    const { error } = await supabaseFetch(`backups?file_name=eq.${encodeURIComponent(fileName)}`, {
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
    const { data: configs } = await supabaseFetch('configurations?select=*');
    
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
      const { data: existing } = await supabaseFetch(`configurations?key=eq.${key}`);
      
      if (existing && existing.length > 0) {
        // Actualizar
        return await supabaseFetch(`configurations?key=eq.${key}`, {
          method: 'PATCH',
          body: JSON.stringify({ value })
        });
      } else {
        // Crear
        return await supabaseFetch('configurations', {
          method: 'POST',
          body: JSON.stringify({ key, value })
        });
      }
    });
    
    await Promise.all(promises);
    
    // Obtener configuración actualizada
    const { data: configs } = await supabaseFetch('configurations?select=*');
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
    const { data: priceConfigs } = await supabaseFetch(`configurations?key=in.(${keysParam})`);
    
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
      const { data: existing } = await supabaseFetch(`configurations?key=eq.${key}`);
      
      if (existing && existing.length > 0) {
        // Actualizar
        return await supabaseFetch(`configurations?key=eq.${key}`, {
          method: 'PATCH',
          body: JSON.stringify({ value })
        });
      } else {
        // Crear
        return await supabaseFetch('configurations', {
          method: 'POST',
          body: JSON.stringify({ key, value })
        });
      }
    });
    
    await Promise.all(promises);
    
    // Obtener precios actualizados
    const priceKeys = ['sessionPrice30', 'sessionPrice60', 'bonoPrice30', 'bonoPrice60'];
    const keysParam = priceKeys.map(k => `"${k}"`).join(',');
    const { data: priceConfigs } = await supabaseFetch(`configurations?key=in.(${keysParam})`);
    
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

module.exports = router;
