import {Injectable, inject} from '@angular/core';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';

import {User} from '../interfaces/user.type';
import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';
import {environment} from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);
  private http = inject(HttpClient);

  constructor() {
    // Buscar usuario en localStorage primero, luego en sessionStorage
    let storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      storedUser = sessionStorage.getItem('currentUser');
    }
    const user = storedUser ? JSON.parse(storedUser) : null;
    this.currentUserSubject = new BehaviorSubject<User>(user);
    this.currentUser = this.currentUserSubject.asObservable();

    // Inicializar token en ApiService si existe (buscar en ambos storages)
    const token = this.getToken();
    if (token) {
      this.apiService.setAuthToken(token);
    }
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  /**
   * Decodifica el token JWT y retorna el payload
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const base64Url = parts[1];
      if (!base64Url) {
        return null;
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  /**
   * Obtiene el token desde localStorage o sessionStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('idToken') || sessionStorage.getItem('idToken');
  }

  /**
   * Obtiene el email desde localStorage o sessionStorage
   */
  private getAuthEmail(): string | null {
    return localStorage.getItem('authEmail') || sessionStorage.getItem('authEmail');
  }

  /**
   * Obtiene el nombre del usuario desde el token
   */
  getUserName(): string {
    const token = this.getToken();
    if (!token) {
      return '';
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return '';
    }

    // Intentar obtener el nombre de diferentes campos posibles
    return decoded.name || decoded.displayName || decoded.full_name || decoded.fullName || decoded.username || decoded.email?.split('@')[0] || '';
  }

  /**
   * Obtiene el rol del usuario desde el token
   */
  getUserRole(): string {
    const token = this.getToken();
    if (!token) {
      return '';
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return '';
    }

    // Intentar obtener el rol de diferentes campos posibles
    return decoded.role || decoded.rol || decoded.user_role || decoded.userRole || decoded.roles?.[0] || '';
  }

  /**
   * Obtiene el ID del usuario desde el token
   */
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const decoded = this.decodeToken(token);
    if (!decoded) {
      return null;
    }

    // Intentar obtener el ID de diferentes campos posibles
    const userId = decoded.id || decoded.user_id || decoded.userId || decoded.uid || decoded.sub;
    if (userId) {
      // Convertir a número si es string
      const numId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      return isNaN(numId) ? null : numId;
    }
    return null;
  }

  /**
   * Obtiene las iniciales del usuario para el avatar
   */
  getUserInitials(): string {
    const name = this.getUserName();
    if (!name) {
      const email = this.getAuthEmail() || '';
      return email.charAt(0).toUpperCase();
    }

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  /**
   * Verifica si el usuario está autenticado y el token es válido
   * Busca el token tanto en localStorage como en sessionStorage
   */
  isAuthenticated(): boolean {
    // Buscar token en localStorage primero, luego en sessionStorage
    let token = localStorage.getItem('idToken');
    let expiryAt = localStorage.getItem('tokenExpiryAt');
    let storage = localStorage;

    if (!token) {
      token = sessionStorage.getItem('idToken');
      expiryAt = sessionStorage.getItem('tokenExpiryAt');
      storage = sessionStorage;
    }

    if (!token) {
      return false;
    }

    // Si hay fecha de expiración, verificar que no haya expirado
    if (expiryAt) {
      const expiryTime = Number(expiryAt);
      if (!Number.isNaN(expiryTime) && Date.now() >= expiryTime) {
        // Token expirado, limpiar datos
        this.logout();
        return false;
      }
    }

    // Verificar que también exista el usuario en el subject
    const currentUser = this.currentUserSubject.value;
    return !!(currentUser && currentUser.token);
  }

  logout(): void {
    // Limpiar tanto localStorage como sessionStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiryAt');
    localStorage.removeItem('authEmail');

    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tokenExpiryAt');
    sessionStorage.removeItem('authEmail');

    this.apiService.removeAuthToken();
    this.currentUserSubject.next(null);
  }

  /**
   * Realiza login con Firebase directamente
   * NOTA: El token NO se guarda hasta que el TOTP sea validado exitosamente
   */
  firebaseLogin(email: string, password: string): Observable<any> {
    const url = `${environment.firebaseAuthBase}?key=${environment.firebaseApiKey}`;
    const body = {
      email,
      password,
      returnSecureToken: true
    };
    return this.http.post<any>(url, body).pipe(
      map(resp => {
        // Guardar temporalmente en sessionStorage para usar durante validación TOTP
        // Se eliminará si el TOTP falla o se moverá a localStorage si es exitoso
        if (resp?.idToken) {
          sessionStorage.setItem('pendingIdToken', resp.idToken);
        }
        if (resp?.refreshToken) {
          sessionStorage.setItem('pendingRefreshToken', resp.refreshToken);
        }
        if (resp?.expiresIn) {
          const expiresInSeconds = Number(resp.expiresIn);
          if (!Number.isNaN(expiresInSeconds)) {
            const expiryAt = Date.now() + expiresInSeconds * 1000;
            sessionStorage.setItem('pendingTokenExpiryAt', String(expiryAt));
          }
        }
        if (resp?.email) {
          sessionStorage.setItem('pendingAuthEmail', resp.email);
        }
        return resp;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Guarda el token de autenticación después de validar TOTP exitosamente
   * Si rememberMe es false, usa sessionStorage (se pierde al cerrar el navegador)
   * Si rememberMe es true, usa localStorage (persiste después de cerrar el navegador)
   */
  finalizeAuthentication(): void {
    const idToken = sessionStorage.getItem('pendingIdToken');
    const refreshToken = sessionStorage.getItem('pendingRefreshToken');
    const tokenExpiryAt = sessionStorage.getItem('pendingTokenExpiryAt');
    const email = sessionStorage.getItem('pendingAuthEmail');
    const rememberMe = sessionStorage.getItem('rememberMe') === 'true';

    // Decidir si usar localStorage o sessionStorage según la preferencia del usuario
    const storage = rememberMe ? localStorage : sessionStorage;

    if (idToken) {
      storage.setItem('idToken', idToken);
      this.apiService.setAuthToken(idToken);
    }
    if (refreshToken) {
      storage.setItem('refreshToken', refreshToken);
    }
    if (tokenExpiryAt) {
      storage.setItem('tokenExpiryAt', tokenExpiryAt);
    }
    if (email) {
      storage.setItem('authEmail', email);
      storage.setItem('currentUser', JSON.stringify({email, token: idToken}));
      this.currentUserSubject.next({id: 0, username: email, password: '', token: idToken});
    }

    // Limpiar sessionStorage (incluyendo rememberMe)
    sessionStorage.removeItem('pendingIdToken');
    sessionStorage.removeItem('pendingRefreshToken');
    sessionStorage.removeItem('pendingTokenExpiryAt');
    sessionStorage.removeItem('pendingAuthEmail');
    sessionStorage.removeItem('rememberMe');
  }

  /**
   * Limpia los tokens pendientes (cuando falla el TOTP)
   */
  clearPendingAuthentication(): void {
    sessionStorage.removeItem('pendingIdToken');
    sessionStorage.removeItem('pendingRefreshToken');
    sessionStorage.removeItem('pendingTokenExpiryAt');
    sessionStorage.removeItem('pendingAuthEmail');
  }

  /**
   * Obtiene el token pendiente para usar en las llamadas TOTP
   */
  getPendingToken(): string | null {
    return sessionStorage.getItem('pendingIdToken');
  }

  /**
   * Envía el código TOTP al email del usuario
   */
  sendTotp(): Observable<any> {
    const token = this.getPendingToken();
    if (!token) {
      return throwError(() => new Error('No hay token de autenticación pendiente'));
    }

    const authUrl = `${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/send`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    return this.http.post<any>(authUrl, {}, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al enviar el código de verificación';
        if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.msg) {
          errorMessage = error.error.msg;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Valida el código TOTP ingresado por el usuario
   */
  validateTotp(code: string): Observable<any> {
    const token = this.getPendingToken();
    if (!token) {
      return throwError(() => new Error('No hay token de autenticación pendiente'));
    }

    const authUrl = `${environment.apiUrl}${environment.apiEndpoints.authentication}/totp/validate`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    return this.http.post<any>(authUrl, { code }, { headers }).pipe(
      map(resp => {
        // Si la validación es exitosa, finalizar la autenticación
        this.finalizeAuthentication();
        return resp;
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al validar el código';
        if (error.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error.error?.msg) {
          errorMessage = error.error.msg;
        }
        return throwError(() => ({ message: errorMessage, status: error.status }));
      })
    );
  }
}
