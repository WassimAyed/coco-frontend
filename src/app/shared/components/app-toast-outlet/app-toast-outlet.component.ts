import { Component, inject } from '@angular/core';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, LucideIconData, X } from 'lucide-angular';
import { ToastService } from '../../services/toast.service';
import { ToastVariant } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-toast-outlet',
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto app-toast" [attr.data-variant]="toast.variant">
          <div class="flex items-start gap-3">
            <div class="app-toast__icon-wrap" [attr.data-variant]="toast.variant">
              <lucide-icon [img]="iconFor(toast.variant)" [size]="18"></lucide-icon>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                @if (toast.title) {
                  <p class="app-toast__title">{{ toast.title }}</p>
                } @else {
                  <p class="app-toast__title">{{ labelFor(toast.variant) }}</p>
                }
                <span class="app-toast__variant">{{ labelFor(toast.variant) }}</span>
              </div>
              <p class="app-toast__message">{{ toast.message }}</p>
            </div>

            <button type="button" class="app-toast__close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss notification">
              <lucide-icon [img]="CloseIcon" [size]="16"></lucide-icon>
            </button>
          </div>

          <div class="app-toast__progress" [attr.data-variant]="toast.variant"></div>
        </div>
      }
    </div>
  `
})
export class AppToastOutletComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly CloseIcon = X;

  protected iconFor(variant: ToastVariant): LucideIconData {
    switch (variant) {
      case 'success':
        return CheckCircle2;
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return Info;
    }
  }

  protected labelFor(variant: ToastVariant): string {
    switch (variant) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Info';
    }
  }
}

