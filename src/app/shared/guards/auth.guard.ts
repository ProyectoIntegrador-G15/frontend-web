import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authenticationService.isAuthenticated()) {
      return true;
    }

    // Usuario no autenticado, redirigir al login
    // Guardar la URL a la que intentaba acceder para redirigir después del login
    this.router.navigate(['/authentication/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
}

