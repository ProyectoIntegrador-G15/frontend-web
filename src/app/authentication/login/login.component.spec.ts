import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthenticationService } from '../../shared/services/authentication.service';
import { Pipe, PipeTransform } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthenticationService>;
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthenticationService', ['firebaseLogin', 'isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule],
      declarations: [LoginComponent, MockCustomTranslatePipe],
      providers: [
        { provide: AuthenticationService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthenticationService) as jasmine.SpyObj<AuthenticationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to dashboard if user is already authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);
      component.ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/products']);
    });

    it('should initialize form if user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);
      component.ngOnInit();
      expect(component.validateForm).toBeDefined();
      expect(component.validateForm.get('email')).toBeTruthy();
      expect(component.validateForm.get('password')).toBeTruthy();
      expect(component.validateForm.get('remember')).toBeTruthy();
    });

    it('should set remember to true by default', () => {
      authService.isAuthenticated.and.returnValue(false);
      component.ngOnInit();
      expect(component.validateForm.get('remember')?.value).toBe(true);
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      authService.isAuthenticated.and.returnValue(false);
      component.ngOnInit();
    });

    it('should not submit if form is invalid', () => {
      component.validateForm.patchValue({
        email: '',
        password: ''
      });
      component.submitForm();
      expect(authService.firebaseLogin).not.toHaveBeenCalled();
    });

    it('should mark invalid fields as dirty', () => {
      component.validateForm.patchValue({
        email: '',
        password: ''
      });
      const emailControl = component.validateForm.get('email');
      const passwordControl = component.validateForm.get('password');
      spyOn(emailControl!, 'markAsDirty');
      spyOn(passwordControl!, 'markAsDirty');
      component.submitForm();
      expect(emailControl!.markAsDirty).toHaveBeenCalled();
      expect(passwordControl!.markAsDirty).toHaveBeenCalled();
    });

    it('should call firebaseLogin with correct credentials', () => {
      const email = 'test@example.com';
      const password = 'password123';
      component.validateForm.patchValue({
        email,
        password,
        remember: true
      });
      authService.firebaseLogin.and.returnValue(of({ idToken: 'token123' }));
      component.submitForm();
      expect(authService.firebaseLogin).toHaveBeenCalledWith(email, password);
    });

    it('should save rememberMe preference to sessionStorage', () => {
      component.validateForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        remember: true
      });
      authService.firebaseLogin.and.returnValue(of({ idToken: 'token123' }));
      component.submitForm();
      expect(sessionStorage.getItem('rememberMe')).toBe('true');
    });

    it('should navigate to 2FA page on successful login', () => {
      component.validateForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      authService.firebaseLogin.and.returnValue(of({ idToken: 'token123' }));
      component.submitForm();
      expect(router.navigate).toHaveBeenCalledWith(['/authentication/2fa']);
    });

    it('should set error state on login failure', () => {
      component.validateForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      const error = { error: { error: { message: 'INVALID_PASSWORD' } } };
      authService.firebaseLogin.and.returnValue(throwError(() => error));
      component.submitForm();
      expect(component.error).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toContain('incorrecta');
    });

    it('should handle error with error.error.message', () => {
      component.validateForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      const error = { error: { message: 'EMAIL_NOT_FOUND' } };
      authService.firebaseLogin.and.returnValue(throwError(() => error));
      component.submitForm();
      expect(component.error).toBe(true);
      expect(component.errorMessage).toContain('correo electrónico');
    });

    it('should handle error with err.message', () => {
      component.validateForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      const error = { message: 'Network error' };
      authService.firebaseLogin.and.returnValue(throwError(() => error));
      component.submitForm();
      expect(component.error).toBe(true);
      expect(component.errorMessage).toBe('Network error');
    });

    it('should set default error message if no specific error message', () => {
      component.validateForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      const error = {};
      authService.firebaseLogin.and.returnValue(throwError(() => error));
      component.submitForm();
      expect(component.error).toBe(true);
      expect(component.errorMessage).toBe('Ocurrió un error al intentar iniciar sesión. Por favor, intente nuevamente.');
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for EMAIL_NOT_FOUND', () => {
      const message = (component as any).getErrorMessage('EMAIL_NOT_FOUND');
      expect(message).toContain('correo electrónico');
    });

    it('should return correct message for INVALID_PASSWORD', () => {
      const message = (component as any).getErrorMessage('INVALID_PASSWORD');
      expect(message).toContain('incorrecta');
    });

    it('should return default message for unknown error code', () => {
      const message = (component as any).getErrorMessage('UNKNOWN_ERROR');
      expect(message).toContain('Ocurrió un error');
    });
  });
});

