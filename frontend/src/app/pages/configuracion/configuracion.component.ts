import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ClinicInfo, Configuration } from '../../models/config.model';
import { BackupFile, BackupsByDate, BackupService, BackupStats } from '../../services/backup.service';
import { ConfigService } from '../../services/config.service';
import { NotificationService } from '../../services/notification.service';
import { PatientService } from '../../services/patient.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit {
  // ...existing code...
  clinicForm: FormGroup;
  schedulingForm: FormGroup;
  pricesForm: FormGroup;
  loading = false;
  saving = false;
  loadingPrices = false;

  // Backup properties
  backups: BackupFile[] = [];
  backupsByDate: BackupsByDate = {};
  backupStats: BackupStats | null = null;
  loadingBackups = false;
  creatingBackup = false;
  exportingPatients = false;
  viewMode: 'grouped' | 'list' = 'grouped';

  // Pestañas de configuración visibles
  activeTab: 'clinic' | 'prices' | 'backup' = 'clinic';

  configuration: Configuration | null = null;

  weekDays = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  constructor(
    private fb: FormBuilder,
    private configService: ConfigService,
    private notificationService: NotificationService,
    private backupService: BackupService,
    private patientService: PatientService,
    private utils: UtilsService
  ) {
    this.clinicForm = this.createClinicForm();
    this.schedulingForm = this.createSchedulingForm();
    this.pricesForm = this.createPricesForm();
  }

  ngOnInit() {
    this.loadConfiguration();
    this.loadBackupData();
    // No cargar precios automáticamente - solo cuando se acceda a la pestaña
  }

  /**
   * Cambiar a la pestaña de precios y cargar datos
   */
  switchToPricesTab() {
    console.log('🏷️ Cambiando a pestaña de Precios');
    this.activeTab = 'prices';
    // Siempre cargar los precios actuales para mostrar los valores vigentes
    this.loadPrices();
  }

  private createClinicForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private createSchedulingForm(): FormGroup {
    const workingHoursGroup: any = {};

    this.weekDays.forEach(day => {
      workingHoursGroup[day.key] = this.fb.group({
        enabled: [false],
        morning: this.fb.group({
          start: ['09:00'],
          end: ['13:00']
        }),
        afternoon: this.fb.group({
          start: ['15:00'],
          end: ['19:00']
        })
      });
    });

    return this.fb.group({
      defaultDuration: [30, [Validators.required, Validators.min(15), Validators.max(120)]],
      slotDuration: [30, [Validators.required, Validators.min(15), Validators.max(60)]],
      workingHours: this.fb.group(workingHoursGroup)
    });
  }

  private createPricesForm(): FormGroup {
    return this.fb.group({
      sessionPrice30: [25, [Validators.required, Validators.min(0)]],
      sessionPrice60: [45, [Validators.required, Validators.min(0)]],
      bonoPrice30: [100, [Validators.required, Validators.min(0)]],
      bonoPrice60: [180, [Validators.required, Validators.min(0)]]
    });
  }

  loadConfiguration() {
    this.loading = true;
    this.configService.getConfiguration().subscribe({
      next: (config: Configuration) => {
        this.configuration = config;
        this.populateForms(config);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading configuration:', error);
        this.notificationService.showError('Error al cargar la configuración');
        this.loading = false;
      }
    });
  }

  private populateForms(config: Configuration) {
    // Llenar formulario de clínica
    if (config.clinicInfo) {
      this.clinicForm.patchValue(config.clinicInfo);
    }

    // Llenar formulario de horarios
    this.schedulingForm.patchValue({
      defaultDuration: config.defaultDuration,
      slotDuration: config.slotDuration
    });

    // Llenar horarios de trabajo
    if (config.workingHours) {
      const workingHoursControl = this.schedulingForm.get('workingHours');
      if (workingHoursControl) {
        Object.keys(config.workingHours).forEach(day => {
          const dayConfig = config.workingHours[day];
          const dayControl = workingHoursControl.get(day);
          if (dayControl && dayConfig) {
            dayControl.patchValue(dayConfig);
          }
        });
      }
    }
  }

  saveClinicInfo() {
    if (this.clinicForm.valid) {
      this.saving = true;
      const clinicInfo: ClinicInfo = this.clinicForm.value;

      const updateData = {
        clinicInfo: clinicInfo
      };

      this.configService.updateConfiguration(updateData).subscribe({
        next: (config: Configuration) => {
          this.configuration = config;
          this.notificationService.showSuccess('Información de la clínica actualizada');
          this.saving = false;
        },
        error: (error: any) => {
          console.error('Error updating clinic info:', error);
          this.notificationService.showError('Error al actualizar la información');
          this.saving = false;
        }
      });
    }
  }

  saveSchedulingConfig() {
    if (this.schedulingForm.valid) {
      this.saving = true;
      const formValue = this.schedulingForm.value;

      const updateData = {
        defaultDuration: formValue.defaultDuration,
        slotDuration: formValue.slotDuration,
        workingHours: formValue.workingHours
      };

      this.configService.updateConfiguration(updateData).subscribe({
        next: (config: Configuration) => {
          this.configuration = config;
          this.notificationService.showSuccess('Configuración de horarios actualizada');
          this.saving = false;
        },
        error: (error: any) => {
          console.error('Error updating scheduling config:', error);
          this.notificationService.showError('Error al actualizar los horarios');
          this.saving = false;
        }
      });
    }
  }

  resetConfiguration() {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
      this.loading = true;
      this.configService.resetConfiguration().subscribe({
        next: (response: any) => {
          this.configuration = response.config;
          this.populateForms(response.config);
          this.notificationService.showSuccess('Configuración restablecida');
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error resetting configuration:', error);
          this.notificationService.showError('Error al restablecer la configuración');
          this.loading = false;
        }
      });
    }
  }

  // Métodos adicionales para Bootstrap
  get scheduleForm() {
    return this.schedulingForm;
  }

  getWorkingHourControl(dayKey: string) {
    return this.schedulingForm.get('workingHours')?.get(dayKey);
  }

  getDayName(index: number): string {
    return this.weekDays[index]?.label || '';
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES');
  }

  // ==================== BACKUP METHODS ====================

  /**
   * Cargar datos de backup (lista y estadísticas)
   */
  loadBackupData(): void {
    this.loadBackups();
    this.loadBackupsByDate();
    this.loadBackupStats();
  }

  /**
   * Cargar lista de backups
   */
  loadBackups(): void {
    this.loadingBackups = true;
    this.backupService.getBackups().subscribe({
      next: (backups) => {
        this.backups = backups.sort((a, b) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
        );
        this.loadingBackups = false;
      },
      error: (error) => {
        console.error('Error loading backups:', error);
        this.notificationService.showError('Error al cargar los backups');
        this.loadingBackups = false;
      }
    });
  }

  /**
   * Cargar backups agrupados por fecha
   */
  loadBackupsByDate(): void {
    this.backupService.getBackupsByDate().subscribe({
      next: (grouped) => {
        this.backupsByDate = grouped;
      },
      error: (error) => {
        console.error('Error loading grouped backups:', error);
      }
    });
  }  /**
   * Cargar estadísticas de backup
   */
  loadBackupStats(): void {
    this.backupService.getBackupStats().subscribe({
      next: (stats) => {
        this.backupStats = stats;
      },
      error: (error) => {
        console.error('Error loading backup stats:', error);
      }
    });
  }

  /**
   * Crear un nuevo backup manual
   */
  createBackup(): void {
    this.creatingBackup = true;
    this.backupService.createBackup().subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('backup creado exitosamente');
          this.loadBackupData(); // Recargar datos
        } else {
          this.notificationService.showError(response.message || 'Error al crear el backup');
        }
        this.creatingBackup = false;
      },
      error: (error) => {
        console.error('Error creating backup:', error);
        this.notificationService.showError('Error al crear el backup');
        this.creatingBackup = false;
      }
    });
  }

  /**
   * Actualizar lista de backups
   */
  refreshBackups(): void {
    this.loadBackupData();
    this.notificationService.showInfo('Lista de backups actualizada');
  }

  /**
   * Confirmar y restaurar un backup
   */
  confirmRestore(backup: BackupFile): void {
    if (confirm(`¿Estás seguro de que quieres restaurar el backup del ${this.formatDate(backup.created)}?\n\nEsta acción reemplazará todos los datos actuales.`)) {
      this.restoreBackup(backup);
    }
  }

  /**
   * Restaurar un backup específico
   */
  private restoreBackup(backup: BackupFile): void {
    this.backupService.restoreBackup(backup.fileName).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('backup restaurado exitosamente');
          // Recargar la página para reflejar los cambios
          window.location.reload();
        } else {
          this.notificationService.showError(response.message || 'Error al restaurar el backup');
        }
      },
      error: (error) => {
        console.error('Error restoring backup:', error);
        this.notificationService.showError('Error al restaurar el backup');
      }
    });
  }

  /**
   * Confirmar y eliminar un backup
   */
  confirmDelete(backup: BackupFile): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el backup del ${this.formatDate(backup.created)}?\n\nEsta acción no se puede deshacer.`)) {
      this.deleteBackup(backup);
    }
  }

  /**
   * Eliminar un backup específico
   */
  private deleteBackup(backup: BackupFile): void {
    this.backupService.deleteBackup(backup.fileName).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('backup eliminado exitosamente');
          this.loadBackupData(); // Recargar datos
        } else {
          this.notificationService.showError(response.message || 'Error al eliminar el backup');
        }
      },
      error: (error) => {
        console.error('Error deleting backup:', error);
        this.notificationService.showError('Error al eliminar el backup');
      }
    });
  }

  /**
   * Descargar un backup
   */
  downloadBackup(backup: BackupFile): void {
    this.backupService.downloadBackup(backup.fileName).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = backup.fileName;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.showSuccess('Descarga iniciada');
      },
      error: (error) => {
        console.error('Error downloading backup:', error);
        this.notificationService.showError('Error al descargar el backup');
      }
    });
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    return this.utils.formatDate(dateString);
  }

  /**
   * Obtener tiempo relativo (hace X tiempo)
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}` : 'hace un momento';
    }
  }

  /**
   * Obtener tipo de backup basado en el nombre del archivo
   */
  getBackupType(fileName: string): string {
    if (fileName.includes('weekly') || fileName.includes('sunday')) {
      return 'Semanal';
    } else if (fileName.includes('daily')) {
      return 'Diario';
    } else {
      return 'Manual';
    }
  }

  /**
   * Obtener clase CSS para el badge del tipo de backup
   */
  getBackupTypeBadge(fileName: string): string {
    const type = this.getBackupType(fileName);
    switch (type) {
      case 'Semanal':
        return 'bg-info text-dark';
      case 'Diario':
        return 'bg-success';
      case 'Manual':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Alternar entre vista agrupada y lista
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grouped' ? 'list' : 'grouped';
  }

  /**
   * Obtener etiqueta del tipo de backup
   */
  getBackupTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'manual': 'Manual',
      'legacy': 'Manual',
      'unknown': 'Desconocido'
    };
    return labels[type] || 'Desconocido';
  }

  /**
   * Exportar todos los datos de pacientes a CSV
   */
  exportPatientsToCSV(): void {
    this.exportingPatients = true;

    // Obtener todos los pacientes sin límite (máximo 1000 permitido por el backend)
    this.patientService.getPatients({ limit: 1000 }).subscribe({
      next: (response) => {
        try {
          const patients = response.patients;
          const csvContent = this.generatePatientsCSV(patients);
          this.downloadCSV(csvContent, `exportacion_pacientes_${this.getCurrentDateString()}.csv`);
          this.notificationService.showSuccess(`Exportados ${patients.length} pacientes exitosamente`);
        } catch (error) {
          console.error('Error generating CSV:', error);
          this.notificationService.showError('Error al generar el archivo CSV');
        }
        this.exportingPatients = false;
      },
      error: (error) => {
        console.error('Error exporting patients:', error);
        this.notificationService.showError('Error al exportar los datos de pacientes');
        this.exportingPatients = false;
      }
    });
  }

  /**
   * Generar contenido CSV de todos los pacientes con formato organizado
   */
  private generatePatientsCSV(patients: any[]): string {
    // Encabezados organizados por categorías
    const headers = [
      // Información personal básica
      'DNI/NIE',
      'Nombre',
      'Apellidos',
      'Fecha Nacimiento',

      // Información de contacto
      'Teléfono Principal',
      'Teléfono Secundario',
      'Email',
      'Contacto Familiar',

      // Dirección
      'Dirección',
      'Código Postal',
      'Ciudad',
      'Provincia',

      // Información clínica
      'Notas Médicas',
      'Total Citas',
      'Bonos Activos',
      'Créditos Disponibles',

      // Fechas del sistema
      'Fecha Registro',
      'Última Actualización'
    ];

    // Generar filas de datos organizadas
    const rows = patients.map(patient => {
      // Calcular estadísticas del paciente
      const totalAppointments = patient._count?.appointments || 0;
      const activePacks = patient.creditPacks?.length || 0;
      const totalCredits = patient.creditPacks?.reduce((sum: number, pack: any) => sum + (pack.unitsRemaining || 0), 0) || 0;

      return [
        // Información personal básica
        this.escapeCSVField(patient.dni || '-'),
        this.escapeCSVField(patient.firstName || '-'),
        this.escapeCSVField(patient.lastName || '-'),
        this.escapeCSVField(patient.birthDate ? this.formatDateForCSV(patient.birthDate) : '-'),

        // Información de contacto
        this.escapeCSVField(patient.phone || '-'),
        this.escapeCSVField(patient.phone2 || '-'),
        this.escapeCSVField(patient.email || '-'),
        this.escapeCSVField(patient.family_contact || '-'),

        // Dirección
        this.escapeCSVField(patient.address || '-'),
        this.escapeCSVField(patient.cp || '-'),
        this.escapeCSVField(patient.city || '-'),
        this.escapeCSVField(patient.province || '-'),

        // Información clínica
        this.escapeCSVField(patient.notes || '-'),
        this.escapeCSVField(totalAppointments.toString()),
        this.escapeCSVField(activePacks.toString()),
        this.escapeCSVField(totalCredits.toString()),

        // Fechas del sistema
        this.escapeCSVField(patient.fechaRegistro ? this.formatDateForCSV(patient.fechaRegistro) : '-'),
        this.escapeCSVField(patient.updatedAt ? this.formatDateTimeForCSV(patient.updatedAt) : '-')
      ];
    });

    // Crear CSV con separador de columnas más limpio
    const csvLines = [
      headers.join(';'), // Usar punto y coma para mejor compatibilidad con Excel en español
      ...rows.map(row => row.join(';'))
    ];

    return csvLines.join('\r\n'); // Usar CRLF para mejor compatibilidad con Windows
  }

  /**
   * Escapar campo CSV (manejar comas, puntos y coma, y comillas)
   */
  private escapeCSVField(field: string): string {
    if (field.includes(';') || field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Formatear fecha para CSV (solo fecha)
   */
  private formatDateForCSV(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  /**
   * Formatear fecha y hora para CSV
   */
  private formatDateTimeForCSV(dateString: string): string {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }

  /**
   * Descargar contenido como archivo CSV
   */
  private downloadCSV(content: string, fileName: string): void {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Obtener fecha actual como string para nombres de archivo
   */
  private getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Obtener clase CSS para el badge del tipo
   */
  getBackupTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'daily': 'bg-success',
      'weekly': 'bg-info text-dark',
      'manual': 'bg-warning text-dark',
      'legacy': 'bg-secondary',
      'unknown': 'bg-secondary'
    };
    return classes[type] || 'bg-secondary';
  }

  /**
   * Formatear solo la hora de una fecha
   */
  formatTime(dateString: string): string {
    return this.utils.formatTime(dateString);
  }

  /**
   * Verificar si es el primer backup overall (más reciente)
   */
  isFirstOverall(backup: BackupFile): boolean {
    if (this.backups.length === 0) return false;
    return this.backups[0].fileName === backup.fileName;
  }

  /**
   * Convertir Object.values para usar en template
   */
  objectValues(obj: any): any[] {
    return Object.values(obj);
  }

  /**
   * Convertir Object.keys para usar en template
   */
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // ============================================================================
  // MÉTODOS PARA GESTIÓN DE PRECIOS
  // ============================================================================

  /**
   * Cargar precios actuales del sistema
   */
  loadPrices() {
    console.log('🔄 Cargando precios...');
    this.loadingPrices = true;
    this.configService.getPrices().subscribe({
      next: (prices: any) => {
        console.log('✅ Precios cargados desde servidor:', prices);
        const formValues = {
          sessionPrice30: prices.sessionPrice30 ?? 25,
          sessionPrice60: prices.sessionPrice60 ?? 45,
          bonoPrice30: prices.bonoPrice30 ?? 100,
          bonoPrice60: prices.bonoPrice60 ?? 180
        };
        console.log('📝 Aplicando valores al formulario:', formValues);
        this.pricesForm.patchValue(formValues);
        this.loadingPrices = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading prices:', error);
        this.notificationService.showError('Error al cargar los precios');
        this.loadingPrices = false;
      }
    });
  }

  /**
   * Guardar nuevos precios
   */
  savePrices() {
    if (this.pricesForm.invalid) {
      this.notificationService.showError('Por favor, verifica que todos los precios sean válidos');
      return;
    }

    // Validaciones de negocio
    const prices = this.pricesForm.value;
    console.log('💾 Guardando precios:', prices);

    // Validar que precio 60min > precio 30min
    if (prices.sessionPrice60 <= prices.sessionPrice30) {
      this.notificationService.showError('El precio de sesión de 60 min debe ser mayor que el de 30 min');
      return;
    }

    // Validar que precio unitario de bonos < precio sesión individual
    const unitPrice30 = prices.bonoPrice30 / 5;
    if (unitPrice30 >= prices.sessionPrice30) {
      this.notificationService.showError('El precio unitario del bono 30min debe ser menor que el precio de sesión individual');
      return;
    }

    const unitPrice60 = prices.bonoPrice60 / 5;
    if (unitPrice60 >= prices.sessionPrice60) {
      this.notificationService.showError('El precio unitario del bono 60min debe ser menor que el precio de sesión individual');
      return;
    }

    this.loadingPrices = true;

    this.configService.updatePrices(prices).subscribe({
      next: (response: any) => {
        console.log('✅ Precios guardados exitosamente:', response);
        this.notificationService.showSuccess('Precios actualizados correctamente');
        this.loadingPrices = false;
        // No recargar precios para evitar sobreescribir con valores por defecto
        // Los valores ya están correctos en el formulario
      },
      error: (error: any) => {
        console.error('❌ Error saving prices:', error);
        this.notificationService.showError('Error al guardar los precios');
        this.loadingPrices = false;
      }
    });
  }

  /**
   * Restaurar precios a valores por defecto
   */
  resetPrices() {
    this.pricesForm.patchValue({
      sessionPrice30: 25,
      sessionPrice60: 45,
      bonoPrice30: 100,
      bonoPrice60: 180
    });
  }

  /**
   * Calcular precio por sesión unitaria en bonos
   */
  getSessionUnitPrice(type: 'bono30' | 'bono60'): number {
    const prices = this.pricesForm.value;
    if (type === 'bono30') {
      return prices.bonoPrice30 ? (prices.bonoPrice30 / 5) : 0;
    } else {
      return prices.bonoPrice60 ? (prices.bonoPrice60 / 5) : 0;
    }
  }

  /**
   * Formatear precio de sesión unitaria para mostrar
   */
  getFormattedSessionUnitPrice(type: 'bono30' | 'bono60'): string {
    const price = this.getSessionUnitPrice(type);
    return price.toFixed(2);
  }
}
