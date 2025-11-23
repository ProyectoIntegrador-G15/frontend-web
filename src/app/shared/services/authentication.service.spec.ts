import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthenticationService } from './authentication.service';
import { ApiService } from './api/api.service';
import { environment } from '../../../environments/environment';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthenticationService, ApiService]
    });

    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);

    // Limpiar localStorage y sessionStorage antes de cada test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('firebaseLogin', () => {
    it('should store token in sessionStorage instead of localStorage', () => {
      const mockResponse = {
        idToken: 'test-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: '3600',
        email: 'test@example.com'
      };

      service.firebaseLogin('test@example.com', 'password123').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
        returnSecureToken: true
      });
      req.flush(mockResponse);

      // Verificar que se guardó en sessionStorage, no en localStorage
      expect(sessionStorage.getItem('pendingIdToken')).toBe('test-token-123');
      expect(sessionStorage.getItem('pendingRefreshToken')).toBe('refresh-token-456');
      expect(sessionStorage.getItem('pendingAuthEmail')).toBe('test@example.com');
      expect(localStorage.getItem('idToken')).toBeNull();
    });

    it('should calculate token expiry correctly', () => {
      const mockResponse = {
        idToken: 'test-token',
        expiresIn: '7200',
        email: 'test@example.com'
      };

      service.firebaseLogin('test@example.com', 'password').subscribe();

      const req = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      req.flush(mockResponse);

      const expiryAt = sessionStorage.getItem('pendingTokenExpiryAt');
      expect(expiryAt).toBeTruthy();
      const expiryTime = parseInt(expiryAt!);
      const now = Date.now();
      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime).toBeLessThan(now + 7201000); // 7200s + margen
    });

    it('should handle missing optional fields', () => {
      const mockResponse = {
        idToken: 'test-token',
        email: 'test@example.com'
      };

      service.firebaseLogin('test@example.com', 'password').subscribe();

      const req = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      req.flush(mockResponse);

      expect(sessionStorage.getItem('pendingIdToken')).toBe('test-token');
      expect(sessionStorage.getItem('pendingRefreshToken')).toBeNull();
    });
  });

  describe('getPendingToken', () => {
    it('should return token from sessionStorage', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token-123');
      expect(service.getPendingToken()).toBe('test-token-123');
    });

    it('should return null if no token exists', () => {
      expect(service.getPendingToken()).toBeNull();
    });
  });

  describe('sendTotp', () => {
    beforeEach(() => {
      sessionStorage.setItem('pendingIdToken', 'test-token-123');
    });

    it('should send TOTP code request with correct headers', () => {
      const mockResponse = { msg: 'Código TOTP enviado' };

      service.sendTotp().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/send`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should throw error if no pending token exists', () => {
      sessionStorage.removeItem('pendingIdToken');

      service.sendTotp().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('No hay token de autenticación pendiente');
        }
      });
    });

    it('should handle error response with detail', () => {
      service.sendTotp().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Error específico del servidor');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/send`);
      req.flush({ detail: 'Error específico del servidor' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle error response with msg', () => {
      service.sendTotp().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Mensaje de error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/send`);
      req.flush({ msg: 'Mensaje de error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('validateTotp', () => {
    beforeEach(() => {
      sessionStorage.setItem('pendingIdToken', 'test-token-123');
      sessionStorage.setItem('pendingRefreshToken', 'refresh-token-456');
      sessionStorage.setItem('pendingTokenExpiryAt', String(Date.now() + 3600000));
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');
      spyOn(apiService, 'setAuthToken');
    });

    it('should validate TOTP code and finalize authentication', () => {
      const mockResponse = { msg: 'TOTP válido' };
      const code = '123456';

      // Configurar rememberMe antes de validar para que use localStorage
      sessionStorage.setItem('rememberMe', 'true');
      
      service.validateTotp(code).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ code });
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush(mockResponse);
      
      // Verificar que se finalizó la autenticación
      expect(localStorage.getItem('idToken')).toBe('test-token-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
      expect(localStorage.getItem('authEmail')).toBe('test@example.com');
      expect(apiService.setAuthToken).toHaveBeenCalledWith('test-token-123');
      expect(sessionStorage.getItem('pendingIdToken')).toBeNull();
    });

    it('should throw error if no pending token exists', () => {
      sessionStorage.removeItem('pendingIdToken');

      service.validateTotp('123456').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('No hay token de autenticación pendiente');
        }
      });
    });

    it('should handle 401 error (invalid code)', () => {
      service.validateTotp('123456').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.message).toBe('Código TOTP inválido');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      req.flush({ detail: 'Código TOTP inválido' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 423 error (locked session)', () => {
      service.validateTotp('123456').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.status).toBe(423);
          expect(error.message).toBe('Sesión bloqueada');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      req.flush({ detail: 'Sesión bloqueada' }, { status: 423, statusText: 'Locked' });
    });

    it('should handle error response with msg field', () => {
      service.validateTotp('123456').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Mensaje de error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      req.flush({ msg: 'Mensaje de error' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('finalizeAuthentication', () => {
    beforeEach(() => {
      spyOn(apiService, 'setAuthToken');
    });

    it('should move tokens from sessionStorage to localStorage', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token-123');
      sessionStorage.setItem('pendingRefreshToken', 'refresh-token-456');
      sessionStorage.setItem('pendingTokenExpiryAt', '1234567890');
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');
      sessionStorage.setItem('rememberMe', 'true'); // Configurar rememberMe para usar localStorage

      service.finalizeAuthentication();

      expect(localStorage.getItem('idToken')).toBe('test-token-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
      expect(localStorage.getItem('tokenExpiryAt')).toBe('1234567890');
      expect(localStorage.getItem('authEmail')).toBe('test@example.com');
      expect(apiService.setAuthToken).toHaveBeenCalledWith('test-token-123');
      expect(sessionStorage.getItem('pendingIdToken')).toBeNull();
    });

    it('should clear sessionStorage after finalizing', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token');
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');

      service.finalizeAuthentication();

      expect(sessionStorage.getItem('pendingIdToken')).toBeNull();
      expect(sessionStorage.getItem('pendingRefreshToken')).toBeNull();
      expect(sessionStorage.getItem('pendingTokenExpiryAt')).toBeNull();
      expect(sessionStorage.getItem('pendingAuthEmail')).toBeNull();
    });

    it('should handle missing optional fields gracefully', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token');
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');
      sessionStorage.setItem('rememberMe', 'true'); // Configurar rememberMe para usar localStorage

      service.finalizeAuthentication();

      expect(localStorage.getItem('idToken')).toBe('test-token');
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('tokenExpiryAt')).toBeNull();
    });
  });

  describe('clearPendingAuthentication', () => {
    it('should clear all pending authentication data', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token');
      sessionStorage.setItem('pendingRefreshToken', 'refresh-token');
      sessionStorage.setItem('pendingTokenExpiryAt', '1234567890');
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');

      service.clearPendingAuthentication();

      expect(sessionStorage.getItem('pendingIdToken')).toBeNull();
      expect(sessionStorage.getItem('pendingRefreshToken')).toBeNull();
      expect(sessionStorage.getItem('pendingTokenExpiryAt')).toBeNull();
      expect(sessionStorage.getItem('pendingAuthEmail')).toBeNull();
    });

    it('should not throw error if sessionStorage is empty', () => {
      expect(() => service.clearPendingAuthentication()).not.toThrow();
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      spyOn(apiService, 'removeAuthToken');
      localStorage.setItem('idToken', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('tokenExpiryAt', '1234567890');
      localStorage.setItem('authEmail', 'test@example.com');
      localStorage.setItem('currentUser', JSON.stringify({ email: 'test@example.com' }));
    });

    it('should clear all authentication data', () => {
      service.logout();

      expect(localStorage.getItem('idToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('tokenExpiryAt')).toBeNull();
      expect(localStorage.getItem('authEmail')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(apiService.removeAuthToken).toHaveBeenCalled();
    });
  });

  describe('Integration: Complete TOTP flow', () => {
    beforeEach(() => {
      spyOn(apiService, 'setAuthToken');
    });

    it('should complete full authentication flow', () => {
      // Step 1: Login
      const loginResponse = {
        idToken: 'test-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: '3600',
        email: 'test@example.com'
      };

      service.firebaseLogin('test@example.com', 'password').subscribe();
      const loginReq = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      loginReq.flush(loginResponse);

      expect(sessionStorage.getItem('pendingIdToken')).toBe('test-token-123');
      expect(localStorage.getItem('idToken')).toBeNull();

      // Step 2: Send TOTP
      service.sendTotp().subscribe();
      const sendReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/send`);
      sendReq.flush({ msg: 'Código enviado' });

      // Step 3: Validate TOTP
      sessionStorage.setItem('rememberMe', 'true'); // Configurar rememberMe antes de validar
      service.validateTotp('123456').subscribe();
      const validateReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      validateReq.flush({ msg: 'TOTP válido' });

      // Verify final state
      expect(localStorage.getItem('idToken')).toBe('test-token-123');
      expect(apiService.setAuthToken).toHaveBeenCalledWith('test-token-123');
      expect(sessionStorage.getItem('pendingIdToken')).toBeNull();
    });
  });
});

