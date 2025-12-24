import { Injectable, isDevMode } from '@angular/core';

/**
 * Servicio de logging que se desactiva automáticamente en producción
 * Uso: this.logger.log('mensaje'), this.logger.warn('aviso'), etc.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isEnabled: boolean;

  constructor() {
    // Solo habilitar logs en desarrollo
    this.isEnabled = isDevMode();
  }

  /**
   * Log general (equivale a console.log)
   */
  log(...args: unknown[]): void {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  /**
   * Log de información
   */
  info(...args: unknown[]): void {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  /**
   * Log de advertencia
   */
  warn(...args: unknown[]): void {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  /**
   * Log de error - siempre se muestra (incluso en producción)
   * pero sin stack traces sensibles
   */
  error(message: string, error?: unknown): void {
    if (this.isEnabled) {
      // En desarrollo, mostrar todo
      console.error(message, error);
    } else {
      // En producción, solo mostrar el mensaje, sin detalles
      console.error(`[Error] ${message}`);
    }
  }

  /**
   * Log de debugging (solo en desarrollo)
   */
  debug(...args: unknown[]): void {
    if (this.isEnabled) {
      console.debug(...args);
    }
  }

  /**
   * Log agrupado (para estructuras complejas)
   */
  group(label: string, ...args: unknown[]): void {
    if (this.isEnabled) {
      console.group(label);
      if (args.length > 0) {
        console.log(...args);
      }
    }
  }

  groupEnd(): void {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  /**
   * Log de tabla (para arrays/objetos)
   */
  table(data: unknown): void {
    if (this.isEnabled) {
      console.table(data);
    }
  }
}
