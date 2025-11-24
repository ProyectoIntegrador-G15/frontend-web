import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private authService = inject(AuthenticationService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Buscar token en localStorage primero, luego en sessionStorage
    let token = localStorage.getItem('idToken');
    let expiryAt = localStorage.getItem('tokenExpiryAt');
    
    if (!token) {
      token = sessionStorage.getItem('idToken');
      expiryAt = sessionStorage.getItem('tokenExpiryAt');
    }
    
    const expiryTime = Number(expiryAt || 0);

    // Solo adjuntar el token para requests dirigidos a nuestro backend
    const isApiRequest = req.url.startsWith(environment.apiUrl);
    const isTokenValid = token && (!expiryTime || Date.now() < expiryTime);

    let authReq = req;
    if (isApiRequest && isTokenValid) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos un 401 (Unauthorized), el token es inválido o expirado
        if (error.status === 401 && isApiRequest) {
          // Excluir la validación de TOTP del manejo automático del 401
          // porque el componente debe manejar los errores de validación de TOTP
          const isTotpValidation = req.url.includes('/auth/totp/validate');
          const hasPendingToken = this.authService.getPendingToken();
          
          // Solo redirigir si NO es una validación de TOTP o si no hay token pendiente
          if (!isTotpValidation || !hasPendingToken) {
            // Limpiar la autenticación
            this.authService.logout();
            // Redirigir al login
            this.router.navigate(['/authentication/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}


