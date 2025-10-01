const { dbManager } = require('./database-manager');

/**
 * Servicio de base de datos que proporciona acceso al cliente Prisma activo
 */
class DatabaseService {

  /**
   * Obtener cliente Prisma activo
   * @returns {PrismaClient} Cliente Prisma configurado
   */
  static getClient() {
    return dbManager.getClient();
  }

  /**
   * Obtener estado de la conexión
   * @returns {Object} Estado actual de la base de datos
   */
  static getStatus() {
    return dbManager.getStatus();
  }



  /**
   * Obtener nombre de la base de datos actual
   * @returns {string} Nombre de la base de datos actual
   */
  static getCurrentDatabaseName() {
    const status = dbManager.getStatus();
    return status.database;
  }

  /**
   * Wrapper para transacciones que maneja automáticamente el cliente activo
   * @param {Function} fn Función que contiene la lógica de transacción
   * @returns {Promise} Resultado de la transacción
   */
  static async transaction(fn) {
    const client = this.getClient();
    return await client.$transaction(fn);
  }

  /**
   * Wrapper para consultas raw que maneja automáticamente el cliente activo
   * @param {String} query Consulta SQL raw
   * @param {...any} params Parámetros de la consulta
   * @returns {Promise} Resultado de la consulta
   */
  static async queryRaw(query, ...params) {
    const client = this.getClient();
    return await client.$queryRaw(query, ...params);
  }

  /**
   * Ejecutar consulta con manejo automático de errores de conexión
   * @param {Function} queryFn Función que ejecuta la consulta
   * @param {number} maxRetries Número máximo de reintentos
   * @returns {Promise} Resultado de la consulta
   */
  static async executeWithRetry(queryFn, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getClient();
        return await queryFn(client);

      } catch (error) {
        lastError = error;
        console.log(`⚠️ Error en consulta (intento ${attempt + 1}/${maxRetries + 1}):`, error.message);

        // Si es un error de conexión y no es el último intento
        if (this.isConnectionError(error) && attempt < maxRetries) {
          console.log('🔄 Error de conexión, esperando antes del siguiente intento...');
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }

        // Si es el último intento o no es un error de conexión, lanzar error
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
  }

  /**
   * Verificar si un error es de conexión
   * @param {Error} error Error a verificar
   * @returns {boolean} true si es un error de conexión
   */
  static isConnectionError(error) {
    const connectionErrors = [
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'network',
      'connection',
      'timeout'
    ];

    const errorMessage = error.message.toLowerCase();
    return connectionErrors.some(errorType =>
      errorMessage.includes(errorType.toLowerCase()) ||
      error.code === errorType
    );
  }
}

module.exports = {
  DatabaseService,
  // Exportar también el cliente directo para compatibilidad
  prisma: {
    get() {
      return DatabaseService.getClient();
    }
  }
};
