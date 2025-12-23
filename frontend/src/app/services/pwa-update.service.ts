import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, interval } from 'rxjs';

/**
 * Servicio para manejar actualizaciones de la PWA
 * Versión simplificada - solo maneja actualizaciones, no bloquea
 */
@Injectable({
  providedIn: 'root'
})
export class PwaUpdateService {
  
  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef
  ) {}

  /**
   * Inicializar el servicio de actualizaciones
   * Debe llamarse en el AppComponent.ngOnInit()
   */
  initialize(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('[PWA] Service Worker no está habilitado');
      return;
    }

    console.log('[PWA] Servicio PWA inicializado');

    // Escuchar cuando hay una nueva versión lista
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(evt => {
        console.log('[PWA] Nueva versión disponible:', evt.latestVersion);
        console.log('[PWA] Versión actual:', evt.currentVersion);
        
        // Activar la nueva versión inmediatamente
        this.activateUpdate();
      });

    // Manejar errores del Service Worker
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('[PWA] Error irrecuperable del Service Worker:', event.reason);
      // Recargar la página para recuperar
      this.forceReload();
    });

    // Verificar actualizaciones periódicamente (cada 30 minutos, después de que la app esté estable)
    this.scheduleUpdateCheck();
  }

  /**
   * Verificar si hay actualizaciones disponibles
   */
  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;

    try {
      console.log('[PWA] Verificando actualizaciones...');
      const updateAvailable = await this.swUpdate.checkForUpdate();
      
      if (updateAvailable) {
        console.log('[PWA] ¡Actualización disponible!');
      } else {
        console.log('[PWA] La app está actualizada');
      }
    } catch (err) {
      console.error('[PWA] Error al verificar actualizaciones:', err);
    }
  }

  /**
   * Activar la actualización y recargar
   */
  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) return;

    try {
      console.log('[PWA] Activando nueva versión...');
      const activated = await this.swUpdate.activateUpdate();
      
      if (activated) {
        console.log('[PWA] Nueva versión activada, recargando...');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (err) {
      console.error('[PWA] Error al activar actualización:', err);
      this.forceReload();
    }
  }

  /**
   * Programar verificación periódica de actualizaciones
   */
  private scheduleUpdateCheck(): void {
    // Esperar a que la app esté estable antes de verificar actualizaciones
    this.appRef.isStable.pipe(first(isStable => isStable === true)).subscribe(() => {
      console.log('[PWA] App estable');
      
      // Verificar actualizaciones ahora
      this.checkForUpdate();
      
      // Y cada 30 minutos
      interval(30 * 60 * 1000).subscribe(() => {
        this.checkForUpdate();
      });
    });
  }

  /**
   * Forzar recarga limpia de la página
   */
  private forceReload(): void {
    console.log('[PWA] Forzando recarga limpia...');
    window.location.href = window.location.href;
  }
}
