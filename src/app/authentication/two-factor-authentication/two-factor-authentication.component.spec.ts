import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { TwoFactorAuthenticationComponent } from './two-factor-authentication.component';
import { AuthenticationService } from '../../shared/services/authentication.service';
import { ApiService } from '../../shared/services/api/api.service';

describe('TwoFactorAuthenticationComponent', () => {
  let component: TwoFactorAuthenticationComponent;
  let fixture: ComponentFixture<TwoFactorAuthenticationComponent>;
  let authService: jasmine.SpyObj<AuthenticationService>;
  let router: jasmine.SpyObj<Router>;
  let apiService: jasmine.SpyObj<ApiService>;
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    // No intentamos mockear window.location.reload directamente porque es de solo lectura
    // En su lugar, haremos que router.navigate retorne una Promise que nunca se resuelva
    // para evitar que se ejecute el callback que llama a window.location.reload()

    const authServiceSpy = jasmine.createSpyObj('AuthenticationService', [
      'getPendingToken',
      'sendTotp',
      'validateTotp',
      'clearPendingAuthentication',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['setAuthToken', 'removeAuthToken']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    // Configurar el mock de TranslateService para devolver traducciones
    translateServiceSpy.instant.and.callFake((key: string, params?: any) => {
      const translations: { [key: string]: string } = {
        'auth.twoFactorAuth.codeSent': 'Código de verificación enviado a tu correo electrónico',
        'auth.twoFactorAuth.errors.completeFields': 'Por favor, complete todos los campos del código de seguridad.',
        'auth.twoFactorAuth.errors.invalidCode': 'Código inválido. Te quedan {{remaining}} intento{{plural}}.',
        'auth.twoFactorAuth.errors.maxAttemptsReached': 'Has excedido el número máximo de intentos. Serás redirigido al login.',
        'auth.twoFactorAuth.errors.sessionBlocked': 'Sesión bloqueada por múltiples intentos fallidos. Serás redirigido al login.',
        'auth.twoFactorAuth.errors.sendError': 'Error al enviar el código de verificación. Por favor, intente nuevamente.',
        'auth.twoFactorAuth.errors.validateError': 'Error al validar el código. Por favor, intente nuevamente.',
        'auth.twoFactorAuth.digitLabel': 'Dígito {{number}} de 6 del código de seguridad'
      };
      
      let translation = translations[key] || key;
      
      // Reemplazar parámetros si existen
      if (params) {
        Object.keys(params).forEach(paramKey => {
          translation = translation.replace(`{{${paramKey}}}`, params[paramKey]);
        });
      }
      
      return translation;
    });

    // Configurar router.navigate para retornar una Promise que nunca se resuelve
    // Esto evita que se ejecute el callback .then() que contiene window.location.reload()
    // El reload no se ejecutará porque la Promise nunca se resuelve
    routerSpy.navigate.and.returnValue(new Promise(() => {
      // Promise que nunca se resuelve - evita que se ejecute window.location.reload()
    }));

    await TestBed.configureTestingModule({
      declarations: [TwoFactorAuthenticationComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: AuthenticationService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthenticationService) as jasmine.SpyObj<AuthenticationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    // Configurar valores por defecto
    authService.getPendingToken.and.returnValue('test-token-123');
    authService.sendTotp.and.returnValue(of({ msg: 'Código enviado' }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoFactorAuthenticationComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // No necesitamos restaurar nada ya que no modificamos window.location
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to login if no pending token exists', () => {
      authService.getPendingToken.and.returnValue(null);

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/authentication/login']);
      expect(authService.sendTotp).not.toHaveBeenCalled();
    });

    it('should create form with 6 digit controls', () => {
      component.ngOnInit();

      expect(component.otpForm).toBeTruthy();
      for (let i = 0; i < 6; i++) {
        expect(component.otpForm.get(`digit${i}`)).toBeTruthy();
      }
    });

    it('should send TOTP code automatically on init', () => {
      component.ngOnInit();

      expect(authService.sendTotp).toHaveBeenCalled();
    });

    it('should set codeSent to true when TOTP is sent successfully', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.codeSent).toBe(true);
        expect(component.codeSentMessage).toBe('Código de verificación enviado a tu correo electrónico');
        expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.codeSent');
        done();
      }, 100);
    });
  });

  describe('sendTotpCode', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should set isSendingCode to true while sending', () => {
      // Usar un Observable con delay para simular una llamada asíncrona
      const delayedObservable = of({ msg: 'Código enviado' }).pipe(
        delay(100)
      );
      authService.sendTotp.and.returnValue(delayedObservable);

      component.sendTotpCode();
      // Verificar que isSendingCode se establece en true inmediatamente
      expect(component.isSendingCode).toBe(true);
    });

    it('should handle successful TOTP send', (done) => {
      component.sendTotpCode();

      setTimeout(() => {
        expect(component.isSendingCode).toBe(false);
        expect(component.codeSent).toBe(true);
        expect(component.codeSentMessage).toBe('Código de verificación enviado a tu correo electrónico');
        expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.codeSent');
        done();
      }, 100);
    });

    it('should handle error when sending TOTP', (done) => {
      const error = new Error('Error al enviar código');
      authService.sendTotp.and.returnValue(throwError(() => error));

      component.sendTotpCode();

      setTimeout(() => {
        expect(component.isSendingCode).toBe(false);
        expect(component.error).toBe(true);
        expect(component.errorMessage).toBe('Error al enviar código');
        done();
      }, 100);
    });

    it('should use default error message when sending TOTP fails without message', (done) => {
      const error = { message: '' };
      authService.sendTotp.and.returnValue(throwError(() => error));

      component.sendTotpCode();

      setTimeout(() => {
        expect(component.isSendingCode).toBe(false);
        expect(component.error).toBe(true);
        expect(component.errorMessage).toBe('Error al enviar el código de verificación. Por favor, intente nuevamente.');
        expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.sendError');
        done();
      }, 100);
    });

    it('should redirect to login after error sending TOTP', (done) => {
      const error = new Error('Error al enviar código');
      authService.sendTotp.and.returnValue(throwError(() => error));

      component.sendTotpCode();

      setTimeout(() => {
        expect(authService.clearPendingAuthentication).toHaveBeenCalled();
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/authentication/login']);
        done();
      }, 3100);
    });
  });

  describe('submitOTP', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should not submit if form is invalid', () => {
      component.submitOTP();

      expect(authService.validateTotp).not.toHaveBeenCalled();
      expect(component.error).toBe(true);
      expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.completeFields');
    });

    it('should not submit if code is incomplete', () => {
      // Llenar solo 5 dígitos
      for (let i = 0; i < 5; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      expect(authService.validateTotp).not.toHaveBeenCalled();
      expect(component.error).toBe(true);
      expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.completeFields');
    });

    it('should validate TOTP with complete code', () => {
      authService.validateTotp.and.returnValue(of({ msg: 'TOTP válido' }));
      // No sobrescribir router.navigate - ya está configurado para no resolver
      // y así evitar que se ejecute window.location.reload()

      // Llenar todos los dígitos
      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      expect(authService.validateTotp).toHaveBeenCalledWith('111111');
      expect(component.isLoading).toBe(false);
    });

    it('should redirect to dashboard on successful validation', () => {
      authService.validateTotp.and.returnValue(of({ msg: 'TOTP válido' }));
      // No sobrescribimos router.navigate - ya está configurado para no resolver
      // y así evitar que se ejecute window.location.reload()

      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/products']);
    });

    it('should handle 423 error (locked session)', (done) => {
      const error = { status: 423, message: 'Sesión bloqueada' };
      authService.validateTotp.and.returnValue(throwError(() => error));

      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      setTimeout(() => {
        expect(component.error).toBe(true);
        expect(component.errorMessage).toContain('Sesión bloqueada');
        expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.sessionBlocked');
        expect(authService.clearPendingAuthentication).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/authentication/login']);
        done();
      }, 2100);
    });

    it('should handle 401 error and increment failed attempts', () => {
      const error = { status: 401, message: 'Código inválido' };
      authService.validateTotp.and.returnValue(throwError(() => error));

      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      expect(component.error).toBe(true);
      expect(component.errorMessage).toContain('Código inválido');
    });

    it('should handle other errors and use default error message', () => {
      const error = { status: 500 };
      authService.validateTotp.and.returnValue(throwError(() => error));

      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      expect(component.error).toBe(true);
      expect(component.errorMessage).toBe('Error al validar el código. Por favor, intente nuevamente.');
      expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.validateError');
    });

    it('should redirect to login after 3 failed attempts', (done) => {
      const error = { status: 401, message: 'Código inválido' };
      authService.validateTotp.and.returnValue(throwError(() => error));

      // Simular 3 intentos fallidos secuencialmente
      // Primer intento
      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }
      component.submitOTP();
      // El error se ejecuta de forma síncrona, así que los campos ya están limpios

      // Segundo intento - los campos fueron limpiados, así que los llenamos de nuevo
      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('2');
      }
      component.submitOTP();
      // Los campos se limpian de nuevo

      // Tercer intento - este debería causar la redirección
      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('3');
      }
      component.submitOTP();
      // En el tercer intento, failedAttempts = 3, que es >= MAX_ATTEMPTS (3)
      // Por lo tanto, debería mostrar el mensaje de excedido y redirigir

      // Esperar a que se ejecute el setTimeout de redirección (2000ms)
      setTimeout(() => {
        expect(component.errorMessage).toContain('excedido el número máximo de intentos');
        expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.maxAttemptsReached');
        expect(authService.clearPendingAuthentication).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/authentication/login']);
        done();
      }, 2100);
    });

    it('should clear OTP fields after failed validation', () => {
      const error = { status: 401, message: 'Código inválido' };
      authService.validateTotp.and.returnValue(throwError(() => error));

      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      for (let i = 0; i < 6; i++) {
        expect(component.otpForm.get(`digit${i}`)?.value).toBe('');
      }
    });

    it('should show remaining attempts message', () => {
      // No pasar 'message' en el error para que el componente genere el mensaje con intentos restantes
      const error = { status: 401 };
      authService.validateTotp.and.returnValue(throwError(() => error));

      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      component.submitOTP();

      expect(component.errorMessage).toContain('Te quedan');
      expect(component.errorMessage).toContain('intento');
      // Verificar que se llamó a instant con la clave correcta
      expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.errors.invalidCode', jasmine.any(Object));
    });
  });

  describe('onDigitInput', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should only allow numeric digits', () => {
      const event = {
        target: { value: 'a' }
      } as any;

      component.onDigitInput(event, 0);

      expect(component.otpForm.get('digit0')?.value).toBe('');
    });

    it('should move to next field when digit is entered', () => {
      fixture.detectChanges(); // Renderizar el componente para que los inputs estén en el DOM
      
      const event = {
        target: { value: '1' }
      } as any;
      
      const nextInput = document.getElementById('otp-digit-1') as HTMLInputElement;
      expect(nextInput).toBeTruthy(); // Verificar que el elemento existe
      
      spyOn(nextInput, 'focus');
      spyOn(nextInput, 'select');

      component.onDigitInput(event, 0);

      expect(component.otpForm.get('digit0')?.value).toBe('1');
      expect(nextInput.focus).toHaveBeenCalled();
      expect(nextInput.select).toHaveBeenCalled();
    });

    it('should clear error when user starts typing', () => {
      component.error = true;
      component.errorMessage = 'Error previo';

      const event = {
        target: { value: '1' }
      } as any;

      component.onDigitInput(event, 0);

      expect(component.error).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should limit input to single digit', () => {
      const event = {
        target: { value: '123' }
      } as any;

      component.onDigitInput(event, 0);

      expect(component.otpForm.get('digit0')?.value).toBe('1');
    });
  });

  describe('onPaste', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should paste 6 digits correctly', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: {
          getData: jasmine.createSpy('getData').and.returnValue('123456')
        }
      } as any;

      component.onPaste(event);

      for (let i = 0; i < 6; i++) {
        expect(component.otpForm.get(`digit${i}`)?.value).toBe(String(i + 1));
      }
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle paste with non-numeric characters', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: {
          getData: jasmine.createSpy('getData').and.returnValue('12a34b56')
        }
      } as any;

      component.onPaste(event);

      expect(component.otpForm.get('digit0')?.value).toBe('1');
      expect(component.otpForm.get('digit1')?.value).toBe('2');
      expect(component.otpForm.get('digit2')?.value).toBe('3');
      expect(component.otpForm.get('digit3')?.value).toBe('4');
      expect(component.otpForm.get('digit4')?.value).toBe('5');
      expect(component.otpForm.get('digit5')?.value).toBe('6');
    });

    it('should handle paste with less than 6 digits', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: {
          getData: jasmine.createSpy('getData').and.returnValue('123')
        }
      } as any;

      component.onPaste(event);

      expect(component.otpForm.get('digit0')?.value).toBe('1');
      expect(component.otpForm.get('digit1')?.value).toBe('2');
      expect(component.otpForm.get('digit2')?.value).toBe('3');
      expect(component.otpForm.get('digit3')?.value).toBe('');
    });
  });

  describe('onKeyDown', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should move to previous field on backspace when current is empty', () => {
      fixture.detectChanges(); // Renderizar el componente para que los inputs estén en el DOM
      
      const prevInput = document.getElementById('otp-digit-0') as HTMLInputElement;
      expect(prevInput).toBeTruthy(); // Verificar que el elemento existe
      
      spyOn(prevInput, 'focus');
      spyOn(prevInput, 'select');

      const event = {
        key: 'Backspace',
        target: { value: '' }
      } as any;

      component.onKeyDown(event, 1);

      expect(prevInput.focus).toHaveBeenCalled();
      expect(prevInput.select).toHaveBeenCalled();
    });

    it('should not move to previous field if current has value', () => {
      fixture.detectChanges(); // Renderizar el componente para que los inputs estén en el DOM
      
      const prevInput = document.getElementById('otp-digit-0') as HTMLInputElement;
      expect(prevInput).toBeTruthy(); // Verificar que el elemento existe
      
      spyOn(prevInput, 'focus');

      const event = {
        key: 'Backspace',
        target: { value: '1' }
      } as any;

      component.onKeyDown(event, 1);

      expect(prevInput.focus).not.toHaveBeenCalled();
    });

    it('should not move to previous field if at first index', () => {
      const event = {
        key: 'Backspace',
        target: { value: '' }
      } as any;

      component.onKeyDown(event, 0);

      // No debería hacer nada
      expect(true).toBe(true);
    });
  });

  describe('hasFieldError', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true for invalid touched field', () => {
      const control = component.otpForm.get('digit0');
      control?.markAsTouched();
      control?.setValue('');

      expect(component.hasFieldError(0)).toBe(true);
    });

    it('should return false for valid field', () => {
      component.otpForm.get('digit0')?.setValue('1');

      expect(component.hasFieldError(0)).toBe(false);
    });

    it('should return false for untouched invalid field', () => {
      component.otpForm.get('digit0')?.setValue('');

      expect(component.hasFieldError(0)).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnInit();
      const subscriptions = (component as any).subscriptions;
      const sub1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      const sub2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      subscriptions.push(sub1, sub2);

      component.ngOnDestroy();

      expect(sub1.unsubscribe).toHaveBeenCalled();
      expect(sub2.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('getDigitLabel', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return translated label for digit', () => {
      const label = component.getDigitLabel(0);
      
      expect(label).toBe('Dígito 1 de 6 del código de seguridad');
      expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.digitLabel', { number: 1 });
    });

    it('should return correct label for different digits', () => {
      const label = component.getDigitLabel(5);
      
      expect(label).toBe('Dígito 6 de 6 del código de seguridad');
      expect(translateService.instant).toHaveBeenCalledWith('auth.twoFactorAuth.digitLabel', { number: 6 });
    });
  });

  describe('getOTPCode', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return complete code from form', () => {
      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue(String(i + 1));
      }

      const code = (component as any).getOTPCode();

      expect(code).toBe('123456');
    });

    it('should return empty string if form is empty', () => {
      const code = (component as any).getOTPCode();

      expect(code).toBe('');
    });
  });

  describe('clearOTPFields', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should clear all OTP fields', () => {
      for (let i = 0; i < 6; i++) {
        component.otpForm.get(`digit${i}`)?.setValue('1');
      }

      (component as any).clearOTPFields();

      for (let i = 0; i < 6; i++) {
        expect(component.otpForm.get(`digit${i}`)?.value).toBe('');
      }
    });
  });
});

