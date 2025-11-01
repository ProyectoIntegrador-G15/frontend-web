import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('idToken');
    const expiryAt = Number(localStorage.getItem('tokenExpiryAt') || 0);

    // Solo adjuntar el token para requests dirigidos a nuestro backend
    const isApiRequest = req.url.startsWith(environment.apiUrl);
    const isTokenValid = token && (!expiryAt || Date.now() < expiryAt);

    if (isApiRequest && isTokenValid) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}


