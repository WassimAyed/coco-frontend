import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface AppToast {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<AppToast[]>([]);
  private nextId = 1;

  success(message: string, title?: string): void {
    this.show('success', message, title);
  }

  error(message: string, title?: string): void {
    this.show('error', message, title);
  }

  info(message: string, title?: string): void {
    this.show('info', message, title);
  }

  warning(message: string, title?: string): void {
    this.show('warning', message, title);
  }

  dismiss(id: number): void {
    this.toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  private show(variant: ToastVariant, message: string, title?: string): void {
    const toast: AppToast = {
      id: this.nextId++,
      message,
      title,
      variant
    };

    this.toasts.update((items) => [...items, toast]);

    setTimeout(() => {
      this.dismiss(toast.id);
    }, 4200);
  }
}
