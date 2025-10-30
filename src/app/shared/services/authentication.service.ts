import {Injectable, inject} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

import {User} from '../interfaces/user.type';
import {ApiResponse, ApiService} from './api/api.service';
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
    this.currentUserSubject.next(null);
  }

  /**
   * Realiza login con Firebase directamente
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
        if (resp?.idToken) {
          localStorage.setItem('idToken', resp.idToken);
        }
        if (resp?.refreshToken) {
          localStorage.setItem('refreshToken', resp.refreshToken);
        }
        if (resp?.expiresIn) {
          const expiresInSeconds = Number(resp.expiresIn);
          if (!Number.isNaN(expiresInSeconds)) {
            const expiryAt = Date.now() + expiresInSeconds * 1000;
            localStorage.setItem('tokenExpiryAt', String(expiryAt));
          }
        }
        if (resp?.email) {
          localStorage.setItem('authEmail', resp.email);
        }
        // Opcional: mantener compatibilidad con currentUser logic
        localStorage.setItem('currentUser', JSON.stringify({email: resp.email, token: resp.idToken}));
        this.currentUserSubject.next({id: 0, username: resp.email, password: '', token: resp.idToken});
        return resp;
      })
    );
  }
}
