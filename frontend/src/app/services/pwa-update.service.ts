import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

/**
 * Servicio para manejar actualizaciones de la PWA
 * Evita que la app se quede congelada cuando hay nuevas versiones
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

    console.log('[PWA] Inicializando servicio de actualizaciones...');

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

    // Verificar actualizaciones periódicamente (cada 30 minutos)
    this.scheduleUpdateCheck();
    
    // Verificar actualización al iniciar
    this.checkForUpdate();
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
        // Pequeño delay para que el usuario vea que algo pasa
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (err) {
      console.error('[PWA] Error al activar actualización:', err);
      // En caso de error, forzar recarga
      this.forceReload();
    }
  }

  /**
   * Programar verificación periódica de actualizaciones
   */
  private scheduleUpdateCheck(): void {
    // Esperar a que la app esté estable, luego verificar cada 30 minutos
    const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
    const everyThirtyMinutes$ = interval(30 * 60 * 1000);
    const everyThirtyMinutesOnceAppIsStable$ = concat(appIsStable$, everyThirtyMinutes$);

    everyThirtyMinutesOnceAppIsStable$.subscribe(async () => {
      await this.checkForUpdate();
    });
  }

  /**
   * Forzar recarga limpia de la página
   */
  private forceReload(): void {
    console.log('[PWA] Forzando recarga limpia...');
    // Usar location.href para evitar cache
    window.location.href = window.location.href;
  }
}
