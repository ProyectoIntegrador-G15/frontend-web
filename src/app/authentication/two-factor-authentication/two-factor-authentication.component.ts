import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../shared/services/authentication.service';

@Component({
  selector: 'app-two-factor-authentication',
  templateUrl: './two-factor-authentication.component.html',
  styleUrls: ['./two-factor-authentication.component.scss']
})
export class TwoFactorAuthenticationComponent implements OnInit, AfterViewInit {
  @ViewChild('firstInput', { static: false }) firstInput!: ElementRef<HTMLInputElement>;
  
  otpForm!: FormGroup;
  isLoading = false;
  error = false;
  errorMessage = '';
  
  // Código OTP simulado (en producción vendría del backend)
  private simulatedOTP = '123456';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthenticationService
  ) {}

  ngOnInit(): void {
    // Crear formulario con 6 campos para el código OTP
    const controls: { [key: string]: AbstractControl } = {};
    for (let i = 0; i < 6; i++) {
      controls[`digit${i}`] = this.fb.control('', [
        Validators.required,
        Validators.pattern(/^[0-9]$/)
      ]);
    }
    this.otpForm = this.fb.group(controls);
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
   * Valida y envía el código OTP
   */
  submitOTP(): void {
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

    // Simular validación del código OTP (emulación sin backend)
    setTimeout(() => {
      if (this.validateOTP(otpCode)) {
        // Código válido - redirigir al dashboard
        this.router.navigate(['/dashboard/products']).then(() => {
          window.location.reload();
        });
      } else {
        // Código inválido - mensaje genérico sin detalles específicos
        this.isLoading = false;
        this.showError('La autenticación ha fallado. Por favor, verifique el código e intente nuevamente.');
        this.clearOTPFields();
      }
    }, 1000);
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
   * Valida el código OTP (emulación)
   * En producción, esto se haría mediante una llamada al backend
   */
  private validateOTP(code: string): boolean {
    // Emulación: solo aceptar el código simulado
    // En producción, esto sería una llamada HTTP al backend que validaría el código
    // Para pruebas, puede usar el código '123456'
    return code === this.simulatedOTP;
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

