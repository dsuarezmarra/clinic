const errorHandler = (err, req, res, next) => {
  console.error('🚨 Error Handler - Método:', req.method, 'Ruta:', req.path);
  console.error('🚨 Error Details:', err);
  console.error('🚨 Error Stack:', err.stack);

  // Error de validación de Prisma
  if (err.code === 'P2002') {
    console.error('🚨 Prisma P2002 - Conflicto de datos únicos');
    return res.status(400).json({
      error: 'Conflicto de datos únicos',
      message: 'Ya existe un registro con estos datos',
      field: err.meta?.target?.[0] || 'unknown'
    });
  }

  // Error de registro no encontrado en Prisma
  if (err.code === 'P2025') {
    console.error('🚨 Prisma P2025 - Registro no encontrado');
    return res.status(404).json({
      error: 'Registro no encontrado',
      message: 'El registro solicitado no existe'
    });
  }

  // Errores de validación de express-validator
  if (err.array && typeof err.array === 'function') {
    console.error('🚨 Express Validator - Errores de validación');
    return res.status(400).json({
      error: 'Errores de validación',
      details: err.array()
    });
  }

  // Error de archivo demasiado grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo excede el tamaño máximo permitido'
    });
  }

  // Error de tipo de archivo no permitido
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Tipo de archivo no permitido',
      message: err.message || 'El tipo de archivo no está permitido'
    });
  }

  // Error de solapamiento de citas
  if (err.code === 'APPOINTMENT_OVERLAP') {
    return res.status(409).json({
      error: 'Conflicto de horario',
      message: err.message || 'Ya existe una cita en este horario'
    });
  }

  // Error de Sesiones insuficientes
  if (err.code === 'INSUFFICIENT_CREDITS') {
    return res.status(402).json({
      error: 'Sesiones insuficientes',
      message: err.message || 'El paciente no tiene suficientes Sesiones',
      requiredUnits: err.requiredUnits,
      availableUnits: err.availableUnits
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Error interno del servidor' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
