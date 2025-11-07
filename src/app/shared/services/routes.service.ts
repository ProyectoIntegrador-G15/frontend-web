import {Injectable, inject} from '@angular/core';
import {Observable, throwError, forkJoin, of} from 'rxjs';
import {map, catchError, switchMap} from 'rxjs/operators';
import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

// Interfaz para un waypoint/punto de ruta
export interface Waypoint {
  id: number;
  order_id: number;
  sequence: number;
  point_name: string;
  point_address: string;
  arrival_time: string | null;
  pickup: boolean;
}

// Interfaz para la respuesta del backend (una ruta individual)
export interface RouteApiResponse {
  id: number;
  vehicle_id: number;
  created_at: string;
  state: string;
  deliveries: number;
  gmaps_metrics: string;
  country: string;
  waypoints: Waypoint[];
}

// Interfaz para la respuesta paginada del backend
export interface RoutePaginatedApiResponse {
  routes: RouteApiResponse[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
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

// Interfaz para crear una ruta
export interface CreateRouteRequest {
  vehicle_id: number;
  date: string; // formato: YYYY-MM-DD
  orders: number[];
}

@Injectable({
  providedIn: 'root'
})
export class RoutesService {
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {
  }

  /**
   * Obtener todas las rutas del backend
   * Hace múltiples peticiones para obtener todas las páginas si es necesario
   */
  getRoutes(): Observable<Route[]> {
    const routesUrl = this.endpointsService.getEndpointPath('routes');
    
    // Primero, obtener la primera página para saber el total de páginas
    return this.apiService.getDirect<RoutePaginatedApiResponse>(`${routesUrl}?page=1`)
      .pipe(
        switchMap(firstPageResponse => {
          const allRoutes = [...firstPageResponse.routes];
          const totalPages = firstPageResponse.total_pages;
          
          // Si solo hay una página, devolver las rutas
          if (totalPages <= 1) {
            return of(allRoutes.map(route => this.transformRoute(route)));
          }
          
          // Si hay múltiples páginas, obtenerlas todas
          const pageRequests: Observable<RoutePaginatedApiResponse>[] = [];
          for (let page = 2; page <= totalPages; page++) {
            pageRequests.push(
              this.apiService.getDirect<RoutePaginatedApiResponse>(`${routesUrl}?page=${page}`)
            );
          }
          
          // Esperar a que todas las peticiones se completen
          return forkJoin(pageRequests).pipe(
            map(responses => {
              // Combinar todas las rutas de todas las páginas
              responses.forEach(response => {
                allRoutes.push(...response.routes);
              });
              
              return allRoutes.map(route => this.transformRoute(route));
            })
          );
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener rutas con paginación
   */
  getRoutesPaginated(page: number = 1): Observable<{routes: Route[], total: number, totalPages: number, page: number}> {
    const routesUrl = this.endpointsService.getEndpointPath('routes');
    
    return this.apiService.getDirect<RoutePaginatedApiResponse>(`${routesUrl}?page=${page}`)
      .pipe(
        map(response => ({
          routes: response.routes.map(route => this.transformRoute(route)),
          total: response.total,
          totalPages: response.total_pages,
          page: response.page
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Transforma la respuesta del backend al formato del frontend
   */
  private transformRoute(apiRoute: RouteApiResponse): Route {
    // Obtener el nombre del almacén del primer waypoint de pickup si existe
    const firstPickup = apiRoute.waypoints?.find(wp => wp.pickup);
    const warehouseName = firstPickup?.point_name || 'No asignado';
    
    return {
      id: apiRoute.id.toString(),
      creationDate: this.formatDate(apiRoute.created_at),
      originWarehouse: warehouseName,
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
      scheduled: 'planned',
      in_transit: 'in_progress',
      delivered: 'completed',
      failed: 'with_incidents',
      cancelled: 'with_incidents'
    };

    return statusMap[state] || 'planned';
  }

  /**
   * Crear una nueva ruta
   */
  createRoute(routeData: CreateRouteRequest): Observable<RouteApiResponse> {
    const routesUrl = this.endpointsService.getEndpointPath('routes');
    
    return this.apiService.postDirect<RouteApiResponse>(routesUrl, routeData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en RoutesService:', error);
    let errorMessage = 'Ocurrió un error al procesar la solicitud';

    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}

