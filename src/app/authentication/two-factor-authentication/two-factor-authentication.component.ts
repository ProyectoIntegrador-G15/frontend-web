import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../shared/services/authentication.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-two-factor-authentication',
  templateUrl: './two-factor-authentication.component.html',
  styleUrls: ['./two-factor-authentication.component.scss']
})
export class TwoFactorAuthenticationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('firstInput', { static: false }) firstInput!: ElementRef<HTMLInputElement>;
  
  otpForm!: FormGroup;
  isLoading = false;
  isSendingCode = false;
  error = false;
  errorMessage = '';
  codeSent = false;
  codeSentMessage = '';
  
  // Contador de intentos fallidos
  private failedAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthenticationService
  ) {}

  ngOnInit(): void {
    // Verificar que hay un token pendiente
    if (!this.auth.getPendingToken()) {
      // Si no hay token, redirigir al login
      this.router.navigate(['/authentication/login']);
      return;
    }

    // Crear formulario con 6 campos para el código OTP
    const controls: { [key: string]: AbstractControl } = {};
    for (let i = 0; i < 6; i++) {
      controls[`digit${i}`] = this.fb.control('', [
        Validators.required,
        Validators.pattern(/^[0-9]$/)
      ]);
    }
    this.otpForm = this.fb.group(controls);

    // Enviar código TOTP automáticamente al cargar
    this.sendTotpCode();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    // Enfocar el primer campo al cargar
    setTimeout(() => {
      if (this.firstInput) {
        this.firstInput.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Maneja la entrada de dígitos en los campos
   */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Solo permitir un dígito numérico
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 1) {
      value = value.slice(0, 1);
    }

    // Actualizar el valor del formulario
    this.otpForm.get(`digit${index}`)?.setValue(value, { emitEvent: false });

    // Si se ingresó un dígito y no es el último campo, mover al siguiente
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }

    // Limpiar error cuando el usuario empieza a escribir
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }
  }

  /**
   * Maneja el evento de pegado (paste)
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

    if (digits.length > 0) {
      for (let i = 0; i < 6; i++) {
        const digit = digits[i] || '';
        this.otpForm.get(`digit${i}`)?.setValue(digit, { emitEvent: false });
      }

      // Enfocar el último campo con valor o el primero vacío
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      const nextInput = document.getElementById(`otp-digit-${lastFilledIndex}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  /**
   * Maneja la tecla de retroceso
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.getElementById(`otp-digit-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  }

  /**
   * Envía el código TOTP al email del usuario
   */
  sendTotpCode(): void {
    // Evitar múltiples requests simultáneos
    if (this.isSendingCode || this.isLoading) {
      return;
    }

    this.isSendingCode = true;
    this.error = false;
    this.errorMessage = '';
    this.codeSent = false;
    this.codeSentMessage = '';

    const sub = this.auth.sendTotp().subscribe({
      next: () => {
        this.isSendingCode = false;
        this.codeSent = true;
        this.codeSentMessage = 'Código de verificación enviado a tu correo electrónico';
        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          this.codeSentMessage = '';
        }, 5000);
      },
      error: (err) => {
        this.isSendingCode = false;
        this.showError(err.message || 'Error al enviar el código de verificación. Por favor, intente nuevamente.');
        // Si hay error al enviar, redirigir al login después de un tiempo
        setTimeout(() => {
          this.redirectToLogin();
        }, 3000);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Valida y envía el código OTP
   */
  submitOTP(): void {
    // Evitar múltiples requests simultáneos
    if (this.isLoading || this.isSendingCode) {
      return;
    }

    // Validar que todos los campos estén completos
    if (!this.otpForm.valid) {
      Object.keys(this.otpForm.controls).forEach(key => {
        const control = this.otpForm.get(key);
        if (control?.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.showError('Por favor, complete todos los campos del código de seguridad.');
      return;
    }

    // Obtener el código completo
    const otpCode = this.getOTPCode();
    
    // Validar que todos los dígitos estén diligenciados
    if (otpCode.length !== 6) {
      this.showError('Por favor, complete todos los campos del código de seguridad.');
      return;
    }

    this.isLoading = true;
    this.error = false;
    this.errorMessage = '';

    // Validar el código TOTP con el backend
    const sub = this.auth.validateTotp(otpCode).subscribe({
      next: () => {
        // Código válido - redirigir al dashboard
        this.isLoading = false;
        this.router.navigate(['/dashboard/products']).then(() => {
          window.location.reload();
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        this.failedAttempts++;

        // Manejar diferentes tipos de errores
        if (err.status === 423) {
          // Sesión bloqueada
          this.showError('Sesión bloqueada por múltiples intentos fallidos. Serás redirigido al login.');
          setTimeout(() => {
            this.redirectToLogin();
          }, 2000);
        } else if (err.status === 401) {
          // Código inválido o expirado
          if (this.failedAttempts >= this.MAX_ATTEMPTS) {
            this.showError('Has excedido el número máximo de intentos. Serás redirigido al login.');
            setTimeout(() => {
              this.redirectToLogin();
            }, 2000);
          } else {
            const remainingAttempts = this.MAX_ATTEMPTS - this.failedAttempts;
            this.showError(
              err.message || 
              `Código inválido. Te quedan ${remainingAttempts} intento${remainingAttempts > 1 ? 's' : ''}.`
            );
            this.clearOTPFields();
          }
        } else {
          // Otro error
          if (this.failedAttempts >= this.MAX_ATTEMPTS) {
            this.showError('Has excedido el número máximo de intentos. Serás redirigido al login.');
            setTimeout(() => {
              this.redirectToLogin();
            }, 2000);
          } else {
            this.showError(err.message || 'Error al validar el código. Por favor, intente nuevamente.');
            this.clearOTPFields();
          }
        }
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Redirige al login y limpia la autenticación pendiente
   */
  private redirectToLogin(): void {
    this.auth.clearPendingAuthentication();
    this.auth.logout();
    this.router.navigate(['/authentication/login']);
  }

  /**
   * Obtiene el código OTP completo del formulario
   */
  private getOTPCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      const digit = this.otpForm.get(`digit${i}`)?.value || '';
      code += digit;
    }
    return code;
  }

  /**
   * Muestra un mensaje de error genérico
   */
  private showError(message: string): void {
    this.error = true;
    this.errorMessage = message;
  }

  /**
   * Limpia todos los campos del código OTP
   */
  private clearOTPFields(): void {
    for (let i = 0; i < 6; i++) {
      this.otpForm.get(`digit${i}`)?.setValue('');
    }
    // Enfocar el primer campo
    setTimeout(() => {
      if (this.firstInput) {
        this.firstInput.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Verifica si un campo específico tiene error
   */
  hasFieldError(index: number): boolean {
    const control = this.otpForm.get(`digit${index}`);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

