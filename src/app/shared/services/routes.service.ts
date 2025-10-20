import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaz para la respuesta del backend
export interface RouteApiResponse {
  id: number;
  vehicle_id: number;
  created_at: string;
  warehouse_id: string;
  warehouse_name: string;
  state: string;
  deliveries: number;
  gmaps_metrics: string;
  country: string;
}

// Interfaz para el frontend
export interface Route {
  id: string;
  creationDate: string;
  originWarehouse: string;
  assignedDeliveries: number;
  status: 'planned' | 'in_progress' | 'with_incidents' | 'completed';
  assignedTruck: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoutesService {

  constructor(private http: HttpClient) { }

  /**
   * Obtener todas las rutas del backend
   */
  getRoutes(): Observable<Route[]> {
    return this.http.get<RouteApiResponse[]>(`${environment.apiUrl}${environment.apiEndpoints.routes}`)
      .pipe(
        map(routes => routes.map(route => this.transformRoute(route))),
        catchError(this.handleError)
      );
  }

  /**
   * Transforma la respuesta del backend al formato del frontend
   */
  private transformRoute(apiRoute: RouteApiResponse): Route {
    return {
      id: apiRoute.id.toString(),
      creationDate: this.formatDate(apiRoute.created_at),
      originWarehouse: apiRoute.warehouse_name,
      assignedDeliveries: apiRoute.deliveries,
      status: this.mapStatus(apiRoute.state),
      assignedTruck: `VEH-${String(apiRoute.vehicle_id).padStart(3, '0')}`
    };
  }

  /**
   * Formatea la fecha del backend (ISO) al formato DD-MM-YYYY
   */
  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Mapea el estado del backend al estado del frontend
   */
  private mapStatus(state: string): 'planned' | 'in_progress' | 'with_incidents' | 'completed' {
    const statusMap: { [key: string]: 'planned' | 'in_progress' | 'with_incidents' | 'completed' } = {
      'scheduled': 'planned',
      'in_transit': 'in_progress',
      'delivered': 'completed',
      'cancelled': 'with_incidents'
    };
    
    return statusMap[state] || 'planned';
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en RoutesService:', error);
    let errorMessage = 'Ocurrió un error al obtener las rutas';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}

