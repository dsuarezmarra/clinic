const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const prisma = require('../services/database');
// Helper: prefer injected Supabase shim (req.prisma) otherwise fallback to Prisma
const getDb = (req) => req.prisma || prisma;
const { upload } = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

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

/**
 * Sanitiza entrada de b�squeda para prevenir SQL/PostgREST injection
 * - Escapa caracteres especiales de LIKE (%_)
 * - Limita longitud m�xima
 * - Elimina caracteres potencialmente peligrosos
 */
function sanitizeSearchInput(input) {
  if (!input || typeof input !== 'string') return '';
  // Limitar longitud
  let sanitized = input.slice(0, 100);
  // Escapar caracteres especiales de LIKE en PostgreSQL
  sanitized = sanitized.replace(/[%_\\]/g, '\\$&');
  // Eliminar caracteres de control y null bytes
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  return sanitized.trim();
}

/**
 * Normaliza texto eliminando acentos/diacr�ticos
 * Ejemplo: "Mar�a" -> "Maria", "Jos�" -> "Jose"
 */
function normalizeAccents(str) {
  if (!str || typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica si un texto coincide con el t�rmino de b�squeda (accent-insensitive)
 * @param {string} text - Texto a verificar
 * @param {string} searchTerm - T�rmino de b�squeda
 * @returns {boolean}
 */
function matchesSearch(text, searchTerm) {
  if (!text || !searchTerm) return false;
  const normalizedText = normalizeAccents(text).toLowerCase();
  const normalizedSearch = normalizeAccents(searchTerm).toLowerCase();
  return normalizedText.includes(normalizedSearch);
}

// Middleware para eliminar email si es cadena vacía antes de validar en PUT
router.use('/:id', (req, res, next) => {
  if (req.method === 'PUT' && req.body && req.body.email === '') {
    delete req.body.email;
  }
  next();
});

// Middleware de logging para todas las rutas de pacientes - solo en desarrollo
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development' || process.env.VERBOSE_LOGGING === 'true') {
    console.log(`🔗 ${req.method} ${req.path} - Body:`, req.body);
  }
  next();
});

// Middleware para validar errores usando express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Errores de validación:', errors.array());
    }
    return res.status(400).json({
      error: 'Errores de validación',
      details: errors.array()
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Validación exitosa para:', req.method, req.path);
  }

  next();
};

// GET /api/patients - Listar pacientes con filtros
router.get('/', [
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 1000 })
], validate, async (req, res, next) => {
  try {
    // Modo degradado: si no hay cliente Prisma disponible, devolver lista vacía
    if (!req.prisma) {
      console.warn('⚠️ GET /api/patients en modo degradado: devolviendo lista vacía');
      return res.json({
        patients: [],
        pagination: {
          page: parseInt(req.query.page || 1),
          limit: parseInt(req.query.limit || 10),
          total: 0,
          pages: 0
        }
      });
    }

    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Detectar el tipo de base de datos para usar funciones compatibles
    // Detectamos Supabase si: 1) hay req.prisma (shim inyectado), o 2) variable de entorno
    const isSupabase = !!req.prisma || process.env.USE_SUPABASE === 'true' || process.env.USE_SUPABASE === '1';
    const isSQLite = process.env.DATABASE_URL?.includes('file:') || process.env.DATABASE_URL_SQLITE || false;

    let patients, total;

    if (search && isSupabase) {
      // Para Supabase: b�squeda accent-insensitive en JavaScript
      // Traemos todos los pacientes y filtramos en el servidor
      const safeSearch = sanitizeSearchInput(search);
      
      const allPatients = await getDb(req).patients.findMany({
        orderBy: { firstName: 'asc' }
      });

      // Filtrar con b�squeda accent-insensitive
      const filteredPatients = allPatients.filter(patient => {
        return matchesSearch(patient.firstName, safeSearch) ||
               matchesSearch(patient.lastName, safeSearch) ||
               (patient.phone && patient.phone.includes(safeSearch));
      });

      // Ordenar los resultados filtrados
      filteredPatients.sort((a, b) => {
        const firstNameCompare = a.firstName.localeCompare(b.firstName);
        if (firstNameCompare !== 0) return firstNameCompare;
        return a.lastName.localeCompare(b.lastName);
      });

      total = filteredPatients.length;
      
      // Aplicar paginaci�n despu�s del filtrado
      patients = filteredPatients.slice(offset, offset + parseInt(limit));
    } else {
      // Para Prisma/SQLite u otras BD, o cuando no hay b�squeda
      const where = {};
      if (search) {
        const safeSearch = sanitizeSearchInput(search);
        if (safeSearch) {
          where.OR = [
            { firstName: { contains: safeSearch, ...(!isSQLite && !isSupabase ? { mode: 'insensitive' } : {}) } },
            { lastName: { contains: safeSearch, ...(!isSQLite && !isSupabase ? { mode: 'insensitive' } : {}) } },
            { phone: { contains: safeSearch } }
          ];
        }
      }

      const queryOptions = {
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: isSupabase ? { firstName: 'asc' } : [{ firstName: 'asc' }, { lastName: 'asc' }],
        include: {
          _count: { select: { appointments: true, files: true, creditPacks: true } },
          creditPacks: { select: { unitsRemaining: true } }
        }
      };

      [patients, total] = await Promise.all([
        getDb(req).patients.findMany(queryOptions),
        getDb(req).patients.count({ where: search ? where : {} })
      ]);

      if (isSupabase && !search) {
        patients.sort((a, b) => {
          const firstNameCompare = a.firstName.localeCompare(b.firstName);
          if (firstNameCompare !== 0) return firstNameCompare;
          return a.lastName.localeCompare(b.lastName);
        });
      }
    }

    const safePatients = Array.isArray(patients) ? patients : [];
    const patientsWithActiveSessions = safePatients.map(patient => {
      const packs = Array.isArray(patient.creditPacks) ? patient.creditPacks : [];
      // Normalize unitsRemaining just in case it's a string
      const normalizedPacks = packs.map(p => ({ ...p, unitsRemaining: Number(p?.unitsRemaining) || 0 }));
      const totalUnitsRemaining = normalizedPacks.reduce((sum, pack) => sum + pack.unitsRemaining, 0);
      return { 
        ...patient, 
        activeSessions: totalUnitsRemaining, 
        creditPacks: undefined,
        _count: patient._count // Preserve the _count field
      };
    });

    res.json({ 
      patients: patientsWithActiveSessions, 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total, 
        pages: Math.ceil(total / limit) 
      } 
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/patients - Crear paciente
router.post('/', [
  body('firstName').notEmpty().trim().withMessage('Nombre es requerido'),
  body('lastName').notEmpty().trim().withMessage('Apellidos son requeridos'),
  body('phone').notEmpty().trim().withMessage('Teléfono es requerido'),
  body('dni').notEmpty().trim().withMessage('DNI es requerido').isLength({ min: 5 }).withMessage('DNI inválido'),
  body('cp').optional().matches(/^\d{5}$/).withMessage('CP debe ser un código postal de 5 dígitos'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email debe ser válido'),
  body('address').optional().trim(),
  body('birthDate').optional().custom((value) => {
    if (value && value !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha de nacimiento debe ser válida');
      }
    }
    return true;
  }),
  body('notes').optional().trim()
], validate, async (req, res, next) => {
  console.log('🚀 Inicio handler POST /api/patients');
  console.log('📦 req.body:', req.body);
  console.log('🔗 req.prisma existe:', !!req.prisma);
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Creando nuevo paciente con datos:', req.body);
    }

    const { firstName, lastName, phone, email, address, birthDate, notes, dni, cp, city, province } = req.body;

    let processedBirthDate = null;
    if (birthDate && birthDate.trim() !== '') {
      try {
        processedBirthDate = new Date(birthDate);
        if (isNaN(processedBirthDate.getTime())) {
          return res.status(400).json({ 
            error: 'Fecha de nacimiento inválida', 
            message: 'La fecha proporcionada no es válida' 
          });
        }
      } catch (error) {
        console.error('Error procesando fecha:', error);
        processedBirthDate = null;
      }
    }

    if (!req.prisma && !getDb(req)) {
      return res.status(503).json({ 
        error: 'Servicio degradado', 
        message: 'No se puede crear pacientes sin conexión a la base de datos' 
      });
    }

    const patient = await getDb(req).patients.create({
      data: {
        dni: dni ? sanitizeDni(dni) : undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: sanitizePhone(phone),
        phone2: req.body.phone2 ? sanitizePhone(req.body.phone2) : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        cp: cp ? cp.trim() : null,
        city: city ? city.trim() : null,
        province: province ? province.trim() : null,
        birthDate: processedBirthDate,
        notes: notes ? notes.trim() : null
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Paciente creado exitosamente:', patient);
    }
    res.status(201).json(patient);
  } catch (error) {
    console.error('❌ Error al crear paciente:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ 
        error: 'Email duplicado', 
        message: 'Ya existe un paciente con este email' 
      });
    }
    next(error);
  }
});

// GET /api/patients/:id - Obtener paciente por ID
router.get('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.prisma) {
      return res.status(404).json({ 
        error: 'Paciente no encontrado', 
        message: 'Modo degradado: no hay acceso a la base de datos' 
      });
    }

    const patient = await getDb(req).patients.findUnique({
      where: { id },
      include: {
        files: { orderBy: { createdAt: 'desc' } },
        creditPacks: { orderBy: { createdAt: 'desc' } },
        appointments: { orderBy: { start: 'desc' }, take: 10 },
        _count: { select: { appointments: true, files: true } }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const totalCredits = Array.isArray(patient.creditPacks)
      ? patient.creditPacks.reduce((sum, pack) => sum + (Number(pack?.unitsRemaining) || 0), 0)
      : 0;

    // Normalize individual packs before returning patient detail
    const normalizedPacks = Array.isArray(patient.creditPacks)
      ? patient.creditPacks.map(p => ({
          ...p,
          unitsTotal: Number(p.unitsTotal) || 0,
          unitsRemaining: Number(p.unitsRemaining) || 0,
          unitMinutes: Number(p.unitMinutes) || 30,
          paid: !!p.paid,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null
        }))
      : [];

    res.json({ ...patient, totalCredits, creditPacks: normalizedPacks });
  } catch (error) {
    next(error);
  }
});

// PUT /api/patients/:id - Actualizar paciente
router.put('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email debe ser válido'),
  body('address').optional().trim(),
  body('birthDate').optional().custom((value) => {
    if (value && value !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha de nacimiento debe ser válida');
      }
    }
    return true;
  }),
  body('notes').optional().trim()
], validate, async (req, res, next) => {
  try {
    console.log('📝 Actualizando paciente con datos:', req.body);
    const { id } = req.params;
    const { firstName, lastName, phone, email, address, birthDate, notes, dni, cp, city, province } = req.body;
    
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = sanitizePhone(phone);
    if (req.body.hasOwnProperty('phone2')) updateData.phone2 = req.body.phone2 ? sanitizePhone(req.body.phone2) : null;
    if (req.body.hasOwnProperty('email')) {
      updateData.email = email ? email.trim() : null;
    } else {
      updateData.email = null;
    }
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (dni !== undefined) updateData.dni = dni ? sanitizeDni(dni) : null;
    if (cp !== undefined) updateData.cp = cp ? cp.trim() : null;
    if (city !== undefined) updateData.city = city ? city.trim() : null;
    if (province !== undefined) updateData.province = province ? province.trim() : null;

    let processedBirthDate = null;
    if (birthDate !== undefined) {
      if (birthDate && birthDate.trim() !== '') {
        try {
          processedBirthDate = new Date(birthDate);
          if (isNaN(processedBirthDate.getTime())) {
            return res.status(400).json({ 
              error: 'Fecha de nacimiento inválida', 
              message: 'La fecha proporcionada no es válida' 
            });
          }
        } catch (error) {
          console.error('Error procesando fecha en actualización:', error);
          processedBirthDate = null;
        }
      }
      updateData.birthDate = processedBirthDate;
    }

    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    console.log('📋 Datos de actualización procesados:', updateData);

    const patient = await getDb(req).patients.update({ 
      where: { id }, 
      data: updateData 
    });
    
    console.log('✅ Paciente actualizado exitosamente:', patient);
    res.json(patient);
  } catch (error) {
    console.error('❌ Error al actualizar paciente:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ 
        error: 'Email duplicado', 
        message: 'Ya existe un paciente con este email' 
      });
    }
    next(error);
  }
});

// DELETE /api/patients/:id - Eliminar paciente
router.delete('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.prisma) {
      return res.status(404).json({ 
        error: 'Paciente no encontrado', 
        message: 'Modo degradado: no hay acceso a la base de datos' 
      });
    }

    const files = await getDb(req).patientFile.findMany({ 
      where: { patientId: id } 
    });
    
    for (const file of files) {
      try { 
        if (fs.existsSync(file.storedPath)) {
          fs.unlinkSync(file.storedPath);
        }
      } catch (err) { 
        console.warn(`No se pudo eliminar archivo: ${file.storedPath}`, err);
      }
    }

    await getDb(req).appointments.deleteMany({ where: { patientId: id } });
    await getDb(req).patients.delete({ where: { id } });
    
    console.log(`Paciente ${id} eliminado completamente con todos sus datos relacionados`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/patients/:id/files - Subir archivos
router.post('/:id/files', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], validate, upload.array('files', 5), async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await getDb(req).patients.findUnique({ where: { id } });
    
    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se han proporcionado archivos' });
    }

    const fileRecords = await Promise.all(req.files.map(async (file) => {
      return await getDb(req).patientFile.create({ 
        data: { 
          patientId: id, 
          originalName: file.originalname, 
          storedPath: file.path, 
          mimeType: file.mimetype, 
          size: file.size 
        } 
      });
    }));

    res.status(201).json({ 
      message: `${fileRecords.length} archivo(s) subido(s) correctamente`, 
      files: fileRecords 
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach(file => { 
        try { 
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) { 
          console.warn(`No se pudo limpiar archivo: ${file.path}`, err);
        } 
      });
    }
    next(error);
  }
});

// GET /api/patients/:id/files - Listar archivos del paciente
router.get('/:id/files', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = await getDb(req).patientFile.findMany({ 
      where: { patientId: id }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(files);
  } catch (error) {
    next(error);
  }
});

// GET /api/patients/:id/files/:fileId/download - Descargar archivo
router.get('/:id/files/:fileId/download', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'), 
  param('fileId').isUUID().withMessage('ID de archivo debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    
    if (!req.prisma) {
      return res.status(404).json({ 
        error: 'Archivo no encontrado', 
        message: 'Modo degradado: no hay acceso a la base de datos' 
      });
    }
    
    const file = await getDb(req).patientFile.findFirst({ 
      where: { id: fileId, patientId: id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    if (!fs.existsSync(file.storedPath)) {
      return res.status(404).json({ error: 'Archivo físico no encontrado' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(path.resolve(file.storedPath));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/patients/:id/files/:fileId - Eliminar archivo
router.delete('/:id/files/:fileId', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'), 
  param('fileId').isUUID().withMessage('ID de archivo debe ser un UUID válido')
], validate, async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const file = await getDb(req).patientFile.findFirst({ 
      where: { id: fileId, patientId: id } 
    });
    
    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    try { 
      if (fs.existsSync(file.storedPath)) {
        fs.unlinkSync(file.storedPath);
      }
    } catch (err) { 
      console.warn(`No se pudo eliminar archivo físico: ${file.storedPath}`, err);
    }
    
    if (!req.prisma) {
      return res.status(503).json({ 
        error: 'Servicio degradado', 
        message: 'No se puede eliminar archivos sin conexión a la base de datos' 
      });
    }
    
    await getDb(req).patientFile.delete({ where: { id: fileId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
