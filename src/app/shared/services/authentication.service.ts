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
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiryAt');
    localStorage.removeItem('authEmail');
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
      })
    );
  }

  /**
   * Guarda el token de autenticación después de validar TOTP exitosamente
   */
  finalizeAuthentication(): void {
    const idToken = sessionStorage.getItem('pendingIdToken');
    const refreshToken = sessionStorage.getItem('pendingRefreshToken');
    const tokenExpiryAt = sessionStorage.getItem('pendingTokenExpiryAt');
    const email = sessionStorage.getItem('pendingAuthEmail');

    if (idToken) {
      localStorage.setItem('idToken', idToken);
      this.apiService.setAuthToken(idToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (tokenExpiryAt) {
      localStorage.setItem('tokenExpiryAt', tokenExpiryAt);
    }
    if (email) {
      localStorage.setItem('authEmail', email);
      localStorage.setItem('currentUser', JSON.stringify({email, token: idToken}));
      this.currentUserSubject.next({id: 0, username: email, password: '', token: idToken});
    }

    // Limpiar sessionStorage
    sessionStorage.removeItem('pendingIdToken');
    sessionStorage.removeItem('pendingRefreshToken');
    sessionStorage.removeItem('pendingTokenExpiryAt');
    sessionStorage.removeItem('pendingAuthEmail');
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
      'Authorization': `Bearer ${token}`
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
      'Authorization': `Bearer ${token}`
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
