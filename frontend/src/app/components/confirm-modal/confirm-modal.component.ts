import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onCancel()"></div>
    <div class="modal-container" *ngIf="isOpen">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header" [class.danger]="type === 'danger'">
            <h5 class="modal-title">
              <i [class]="iconClass" class="me-2"></i>
              {{ title }}
            </h5>
            <button type="button" class="btn-close" (click)="onCancel()"></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">{{ message }}</p>
            <p class="text-muted small mb-0" *ngIf="details">{{ details }}</p>
            <div class="item-info mt-3" *ngIf="itemName">
              <strong>{{ itemLabel }}:</strong> {{ itemName }}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              <i class="bi bi-x-circle me-1"></i>
              Cancelar
            </button>
            <button type="button" 
                    [class]="confirmButtonClass" 
                    (click)="onConfirm()"
                    [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!loading" [class]="confirmIconClass" class="me-1"></i>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
    }

    .modal-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }

    .modal-dialog {
      max-width: 500px;
      width: 90%;
      margin: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #dee2e6;
      border-radius: 12px 12px 0 0;
    }

    .modal-header.danger {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
    }

    .modal-header.danger .btn-close {
      filter: brightness(0) invert(1);
    }

    .modal-title {
      margin: 0;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .item-info {
      background: #f8f9fa;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border-left: 4px solid var(--primary-color, #667eea);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #dee2e6;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Está seguro de que desea continuar?';
  @Input() details = '';
  @Input() itemLabel = 'Elemento';
  @Input() itemName = '';
  @Input() confirmText = 'Confirmar';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get iconClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bi bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi bi-exclamation-circle-fill';
      default:
        return 'bi bi-info-circle-fill';
    }
  }

  get confirmButtonClass(): string {
    switch (this.type) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-warning';
      default:
        return 'btn btn-primary';
    }
  }

  get confirmIconClass(): string {
    switch (this.type) {
      case 'danger':
        return 'bi bi-trash';
      default:
        return 'bi bi-check-circle';
    }
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
