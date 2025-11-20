import {Component} from '@angular/core'
import { AuthenticationService } from '../../shared/services/authentication.service';
import {FormBuilder, FormGroup, UntypedFormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Location} from '@angular/common';

@Component({
  templateUrl: './login.component.html'
})

export class LoginComponent {
  isLoading = false;
  error = false;
  errorMessage = '';

  passwordVisible = false;
  password?: string;

  validateForm!: UntypedFormGroup;

  constructor(private fb: FormBuilder, private router: Router, private location: Location, private auth: AuthenticationService) {
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.isLoading = true;
      this.error = false;
      this.errorMessage = '';

      const email = this.validateForm.get('email')?.value;
      const password = this.validateForm.get('password')?.value;
      const remember = this.validateForm.get('remember')?.value || false;

      // Guardar la preferencia de "remember me" para usarla después del TOTP
      sessionStorage.setItem('rememberMe', String(remember));

      this.auth.firebaseLogin(email, password).subscribe({
        next: (resp) => {
          // Redirigir a la página de autenticación 2FA después del login exitoso
          this.router.navigate(['/authentication/2fa']);
        },
        error: (err) => {
          this.error = true;
          this.isLoading = false;
          // Extraer el mensaje de error de Firebase
          if (err?.error?.error?.message) {
            this.errorMessage = this.getErrorMessage(err.error.error.message);
          } else if (err?.error?.message) {
            this.errorMessage = this.getErrorMessage(err.error.message);
          } else if (err?.message) {
            this.errorMessage = err.message;
          } else {
            this.errorMessage = 'Ocurrió un error al intentar iniciar sesión. Por favor, intente nuevamente.';
          }
        }
      });
    } else {
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({onlySelf: true});
        }
      });
    }
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard/products']);
      return;
    }

    this.validateForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [true],
    });
  }

  /**
   * Convierte los códigos de error de Firebase a mensajes legibles en español
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'EMAIL_NOT_FOUND': 'No existe una cuenta con este correo electrónico.',
      'INVALID_PASSWORD': 'La contraseña es incorrecta.',
      'USER_DISABLED': 'Esta cuenta ha sido deshabilitada.',
      'INVALID_EMAIL': 'El formato del correo electrónico no es válido.',
      'TOO_MANY_ATTEMPTS_TRY_LATER': 'Demasiados intentos fallidos. Por favor, intente más tarde.',
      'OPERATION_NOT_ALLOWED': 'Esta operación no está permitida.',
      'WEAK_PASSWORD': 'La contraseña es muy débil.',
      'EMAIL_EXISTS': 'Ya existe una cuenta con este correo electrónico.',
      'INVALID_ID_TOKEN': 'El token de autenticación no es válido.',
      'EXPIRED_ID_TOKEN': 'El token de autenticación ha expirado.',
      'CREDENTIAL_TOO_OLD_LOGIN_AGAIN': 'Las credenciales son muy antiguas. Por favor, inicie sesión nuevamente.',
      'INVALID_LOGIN_CREDENTIALS': 'Las credenciales de inicio de sesión no son válidas.',
      'MISSING_PASSWORD': 'La contraseña es requerida.',
      'MISSING_EMAIL': 'El correo electrónico es requerido.'
    };

    return errorMessages[errorCode] || 'Ocurrió un error al intentar iniciar sesión. Por favor, intente nuevamente.';
  }
}
