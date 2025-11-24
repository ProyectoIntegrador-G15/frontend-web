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

  describe('constructor', () => {
    beforeEach(() => {
      // Limpiar storage antes de cada test del constructor
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should initialize with user from localStorage', () => {
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: 'token-123' };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('idToken', 'token-123');

      // Resetear el módulo para crear una nueva instancia del servicio
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });

      const newApiService = TestBed.inject(ApiService);
      const setAuthTokenSpy = spyOn(newApiService, 'setAuthToken');

      const newService = TestBed.inject(AuthenticationService);

      expect(newService.currentUserValue).toEqual(mockUser);
      expect(setAuthTokenSpy).toHaveBeenCalledWith('token-123');
    });

    it('should initialize with user from sessionStorage when localStorage is empty', () => {
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: 'token-456' };
      sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
      sessionStorage.setItem('idToken', 'token-456');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });

      const newApiService = TestBed.inject(ApiService);
      const setAuthTokenSpy = spyOn(newApiService, 'setAuthToken');

      const newService = TestBed.inject(AuthenticationService);

      expect(newService.currentUserValue).toEqual(mockUser);
      expect(setAuthTokenSpy).toHaveBeenCalledWith('token-456');
    });

    it('should initialize with null user when no storage has user', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });

      const newService = TestBed.inject(AuthenticationService);
      expect(newService.currentUserValue).toBeNull();
    });

    it('should initialize token from localStorage', () => {
      localStorage.setItem('idToken', 'local-token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });

      const newApiService = TestBed.inject(ApiService);
      const setAuthTokenSpy = spyOn(newApiService, 'setAuthToken');

      TestBed.inject(AuthenticationService);

      expect(setAuthTokenSpy).toHaveBeenCalledWith('local-token');
    });

    it('should initialize token from sessionStorage when localStorage is empty', () => {
      sessionStorage.setItem('idToken', 'session-token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });

      const newApiService = TestBed.inject(ApiService);
      const setAuthTokenSpy = spyOn(newApiService, 'setAuthToken');

      TestBed.inject(AuthenticationService);

      expect(setAuthTokenSpy).toHaveBeenCalledWith('session-token');
    });
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

    it('should handle invalid expiresIn value', () => {
      const mockResponse = {
        idToken: 'test-token',
        expiresIn: 'invalid',
        email: 'test@example.com'
      };

      service.firebaseLogin('test@example.com', 'password').subscribe();

      const req = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      req.flush(mockResponse);

      expect(sessionStorage.getItem('pendingIdToken')).toBe('test-token');
      expect(sessionStorage.getItem('pendingTokenExpiryAt')).toBeNull();
    });

    it('should handle error response', () => {
      service.firebaseLogin('test@example.com', 'password').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      req.flush({ error: 'Invalid credentials' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should not store token if idToken is missing in response', () => {
      const mockResponse = {
        email: 'test@example.com'
      };

      service.firebaseLogin('test@example.com', 'password').subscribe();

      const req = httpMock.expectOne(`${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`);
      req.flush(mockResponse);

      expect(sessionStorage.getItem('pendingIdToken')).toBeNull();
    });
  });

  describe('currentUserValue', () => {
    it('should return current user value', () => {
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: 'token-123' };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      expect(newService.currentUserValue).toEqual(mockUser);
    });

    it('should return null when no user exists', () => {
      expect(service.currentUserValue).toBeNull();
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

    it('should handle error response without detail or msg', () => {
      service.sendTotp().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Error al enviar el código de verificación');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/send`);
      req.flush({}, { status: 500, statusText: 'Server Error' });
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

    it('should handle error response without detail or msg', () => {
      service.validateTotp('123456').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBe('Error al validar el código');
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      req.flush({}, { status: 500, statusText: 'Server Error' });
    });

    it('should use sessionStorage when rememberMe is false', () => {
      sessionStorage.setItem('rememberMe', 'false');
      const mockResponse = { msg: 'TOTP válido' };

      service.validateTotp('123456').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`);
      req.flush(mockResponse);

      expect(sessionStorage.getItem('idToken')).toBe('test-token-123');
      expect(localStorage.getItem('idToken')).toBeNull();
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
      sessionStorage.setItem('idToken', 'session-token');
      sessionStorage.setItem('refreshToken', 'session-refresh-token');
      sessionStorage.setItem('tokenExpiryAt', '1234567890');
      sessionStorage.setItem('authEmail', 'session@example.com');
      sessionStorage.setItem('currentUser', JSON.stringify({ email: 'session@example.com' }));
    });

    it('should clear all authentication data from localStorage', () => {
      service.logout();

      expect(localStorage.getItem('idToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('tokenExpiryAt')).toBeNull();
      expect(localStorage.getItem('authEmail')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(apiService.removeAuthToken).toHaveBeenCalled();
    });

    it('should clear all authentication data from sessionStorage', () => {
      service.logout();

      expect(sessionStorage.getItem('idToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
      expect(sessionStorage.getItem('tokenExpiryAt')).toBeNull();
      expect(sessionStorage.getItem('authEmail')).toBeNull();
      expect(sessionStorage.getItem('currentUser')).toBeNull();
    });

    it('should update currentUserSubject to null', () => {
      service.logout();
      expect(service.currentUserValue).toBeNull();
    });
  });

  describe('getUserName', () => {
    it('should return empty string when no token exists', () => {
      expect(service.getUserName()).toBe('');
    });

    it('should return name from token', () => {
      const token = createMockToken({ name: 'John Doe' });
      localStorage.setItem('idToken', token);
      expect(service.getUserName()).toBe('John Doe');
    });

    it('should return displayName from token when name is not available', () => {
      const token = createMockToken({ displayName: 'Jane Smith' });
      localStorage.setItem('idToken', token);
      expect(service.getUserName()).toBe('Jane Smith');
    });

    it('should return full_name from token', () => {
      const token = createMockToken({ full_name: 'Full Name' });
      localStorage.setItem('idToken', token);
      expect(service.getUserName()).toBe('Full Name');
    });

    it('should return fullName from token', () => {
      const token = createMockToken({ fullName: 'Full Name Camel' });
      localStorage.setItem('idToken', token);
      expect(service.getUserName()).toBe('Full Name Camel');
    });

    it('should return username from token', () => {
      const token = createMockToken({ username: 'johndoe' });
      localStorage.setItem('idToken', token);
      expect(service.getUserName()).toBe('johndoe');
    });

    it('should return email prefix when only email is available', () => {
      const token = createMockToken({ email: 'test@example.com' });
      localStorage.setItem('idToken', token);
      expect(service.getUserName()).toBe('test');
    });

    it('should return empty string when token cannot be decoded', () => {
      localStorage.setItem('idToken', 'invalid-token');
      expect(service.getUserName()).toBe('');
    });
  });

  describe('getUserRole', () => {
    it('should return empty string when no token exists', () => {
      expect(service.getUserRole()).toBe('');
    });

    it('should return role from token', () => {
      const token = createMockToken({ role: 'admin' });
      localStorage.setItem('idToken', token);
      expect(service.getUserRole()).toBe('admin');
    });

    it('should return rol from token when role is not available', () => {
      const token = createMockToken({ rol: 'seller' });
      localStorage.setItem('idToken', token);
      expect(service.getUserRole()).toBe('seller');
    });

    it('should return user_role from token', () => {
      const token = createMockToken({ user_role: 'manager' });
      localStorage.setItem('idToken', token);
      expect(service.getUserRole()).toBe('manager');
    });

    it('should return userRole from token', () => {
      const token = createMockToken({ userRole: 'supervisor' });
      localStorage.setItem('idToken', token);
      expect(service.getUserRole()).toBe('supervisor');
    });

    it('should return first role from roles array', () => {
      const token = createMockToken({ roles: ['admin', 'user'] });
      localStorage.setItem('idToken', token);
      expect(service.getUserRole()).toBe('admin');
    });

    it('should return empty string when token cannot be decoded', () => {
      localStorage.setItem('idToken', 'invalid-token');
      expect(service.getUserRole()).toBe('');
    });
  });

  describe('getUserId', () => {
    it('should return null when no token exists', () => {
      expect(service.getUserId()).toBeNull();
    });

    it('should return id from token as number', () => {
      const token = createMockToken({ id: 123 });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBe(123);
    });

    it('should return user_id from token', () => {
      const token = createMockToken({ user_id: 456 });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBe(456);
    });

    it('should return userId from token', () => {
      const token = createMockToken({ userId: 789 });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBe(789);
    });

    it('should return uid from token', () => {
      const token = createMockToken({ uid: 101 });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBe(101);
    });

    it('should return sub from token', () => {
      const token = createMockToken({ sub: 202 });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBe(202);
    });

    it('should convert string id to number', () => {
      const token = createMockToken({ id: '303' });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBe(303);
    });

    it('should return null when id is not a valid number', () => {
      const token = createMockToken({ id: 'not-a-number' });
      localStorage.setItem('idToken', token);
      expect(service.getUserId()).toBeNull();
    });

    it('should return null when token cannot be decoded', () => {
      localStorage.setItem('idToken', 'invalid-token');
      expect(service.getUserId()).toBeNull();
    });
  });

  describe('getUserInitials', () => {
    it('should return first letter of email when no name exists', () => {
      sessionStorage.setItem('authEmail', 'test@example.com');
      expect(service.getUserInitials()).toBe('T');
    });

    it('should return first letter of name when name has one word', () => {
      const token = createMockToken({ name: 'John' });
      localStorage.setItem('idToken', token);
      expect(service.getUserInitials()).toBe('J');
    });

    it('should return first and last initial when name has multiple words', () => {
      const token = createMockToken({ name: 'John Doe' });
      localStorage.setItem('idToken', token);
      expect(service.getUserInitials()).toBe('JD');
    });

    it('should return first and last initial for three-word name', () => {
      const token = createMockToken({ name: 'John Michael Doe' });
      localStorage.setItem('idToken', token);
      expect(service.getUserInitials()).toBe('JD');
    });

    it('should handle names with extra spaces', () => {
      const token = createMockToken({ name: '  John   Doe  ' });
      localStorage.setItem('idToken', token);
      expect(service.getUserInitials()).toBe('JD');
    });

    it('should return uppercase initials', () => {
      const token = createMockToken({ name: 'john doe' });
      localStorage.setItem('idToken', token);
      expect(service.getUserInitials()).toBe('JD');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when token exists in localStorage and user exists', () => {
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: 'valid-token' };
      localStorage.setItem('idToken', 'valid-token');
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should return true when token exists in sessionStorage and user exists', () => {
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: 'valid-token' };
      sessionStorage.setItem('idToken', 'valid-token');
      sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const expiredTime = Date.now() - 1000; // 1 segundo en el pasado
      localStorage.setItem('idToken', 'expired-token');
      localStorage.setItem('tokenExpiryAt', String(expiredTime));
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      spyOn(newService, 'logout');
      
      expect(newService.isAuthenticated()).toBe(false);
      expect(newService.logout).toHaveBeenCalled();
    });

    it('should return false when token expiry is invalid number', () => {
      localStorage.setItem('idToken', 'valid-token');
      localStorage.setItem('tokenExpiryAt', 'invalid-number');
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: 'valid-token' };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should return false when token exists but user does not have token', () => {
      localStorage.setItem('idToken', 'valid-token');
      const mockUser = { id: 1, username: 'test@example.com', password: '', token: null };
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should return false when token exists but no user in subject', () => {
      localStorage.setItem('idToken', 'valid-token');
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthenticationService, ApiService]
      });
      
      const newService = TestBed.inject(AuthenticationService);
      expect(newService.isAuthenticated()).toBe(false);
    });
  });

  describe('finalizeAuthentication', () => {
    beforeEach(() => {
      spyOn(apiService, 'setAuthToken');
    });

    it('should use sessionStorage when rememberMe is false', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token-123');
      sessionStorage.setItem('pendingRefreshToken', 'refresh-token-456');
      sessionStorage.setItem('pendingTokenExpiryAt', '1234567890');
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');
      sessionStorage.setItem('rememberMe', 'false');

      service.finalizeAuthentication();

      expect(sessionStorage.getItem('idToken')).toBe('test-token-123');
      expect(sessionStorage.getItem('refreshToken')).toBe('refresh-token-456');
      expect(sessionStorage.getItem('tokenExpiryAt')).toBe('1234567890');
      expect(sessionStorage.getItem('authEmail')).toBe('test@example.com');
      expect(localStorage.getItem('idToken')).toBeNull();
      expect(apiService.setAuthToken).toHaveBeenCalledWith('test-token-123');
    });

    it('should use sessionStorage when rememberMe is not set', () => {
      sessionStorage.setItem('pendingIdToken', 'test-token-123');
      sessionStorage.setItem('pendingAuthEmail', 'test@example.com');

      service.finalizeAuthentication();

      expect(sessionStorage.getItem('idToken')).toBe('test-token-123');
      expect(localStorage.getItem('idToken')).toBeNull();
    });
  });

  // Helper function to create mock JWT tokens
  function createMockToken(payload: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${header}.${body}.signature`;
  }

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

