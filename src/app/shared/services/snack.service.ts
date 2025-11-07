import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface SnackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // en milisegundos, por defecto 5000
}

@Injectable({
  providedIn: 'root'
})
export class SnackService {
  private snackSubject = new Subject<SnackMessage>();
  public snack$ = this.snackSubject.asObservable();

  private removeSnackSubject = new Subject<string>();
  public removeSnack$ = this.removeSnackSubject.asObservable();

  /**
   * Muestra un snack de éxito
   */
  success(message: string, duration: number = 5000): void {
    this.show('success', message, duration);
  }

  /**
   * Muestra un snack de error
   */
  error(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  /**
   * Muestra un snack de advertencia
   */
  warning(message: string, duration: number = 5000): void {
    this.show('warning', message, duration);
  }

  /**
   * Muestra un snack de información
   */
  info(message: string, duration: number = 5000): void {
    this.show('info', message, duration);
  }

  /**
   * Muestra un snack
   */
  private show(type: 'success' | 'error' | 'warning' | 'info', message: string, duration: number): void {
    const id = this.generateId();
    const snack: SnackMessage = {
      id,
      type,
      message,
      duration
    };

    this.snackSubject.next(snack);

    // Auto-remove después del duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Remueve un snack por ID
   */
  remove(id: string): void {
    this.removeSnackSubject.next(id);
  }

  /**
   * Genera un ID único para el snack
   */
  private generateId(): string {
    return `snack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}


