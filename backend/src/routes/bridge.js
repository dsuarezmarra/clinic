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

// GET /api/appointments/:id - Obtener una cita
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

// GET /api/credits - Listar packs de créditos
router.get('/credits', async (req, res) => {
  try {
    const { patientId } = req.query;
    
    let endpoint = `credit_packs?select=*&order=createdAt.desc`;
    
    if (patientId) {
      endpoint += `&patientId=eq.${patientId}`;
    }
    
    const { data: creditPacks } = await supabaseFetch(endpoint);
    
    res.json({ creditPacks });
  } catch (error) {
    console.error('Error fetching credit packs:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/credits - Crear nuevo pack de créditos
router.post('/credits', async (req, res) => {
  try {
    const packData = req.body;
    
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

// PUT /api/credits/:id - Actualizar pack de créditos
router.put('/credits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const endpoint = `credit_packs?id=eq.${id}`;
    const { data } = await supabaseFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Pack de créditos no encontrado' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating credit pack:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
