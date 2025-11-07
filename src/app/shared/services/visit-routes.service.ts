import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VisitRouteStopApiResponse {
  id: number;
  visit_route_id: number;
  client_id: number;
  sequence: number;
  client_name: string;
  client_address: string;
  estimated_arrival_time: string | null;
  estimated_departure_time: string | null;
  estimated_duration_minutes: number;
  distance_from_previous_meters: number | null;
  travel_time_from_previous_minutes: number | null;
  observations: string | null;
  status: 'pending' | 'completed' | 'skipped';
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitRouteApiResponse {
  id: number;
  seller_id: number;
  route_date: string;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_clients: number;
  estimated_duration_minutes: number | null;
  total_distance_meters: number | null;
  gmaps_route_data: any;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  stops: VisitRouteStopApiResponse[];
}

export interface VisitRoute {
  id: string;
  sellerId: string;
  routeDate: string;
  status: 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalClients: number;
  estimatedDurationMinutes?: number;
  totalDistanceMeters?: number;
  createdAt: string;
  confirmedAt?: string;
  stops: VisitRouteStop[];
}

export interface VisitRouteStop {
  id: string;
  clientId: string;
  sequence: number;
  clientName: string;
  clientAddress: string;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
  durationMinutes: number;
  distanceFromPrevious?: number;
  travelTimeFromPrevious?: number;
  observations?: string;
  status: 'pending' | 'completed' | 'skipped';
  latitude?: number;
  longitude?: number;
}

export interface CreateVisitRouteRequest {
  seller_id: number;
  route_date: string; // YYYY-MM-DD
  client_ids: number[];
  start_time?: string; // HH:MM
  observations?: string;
}

export interface VisitRoutesPaginatedResponse {
  routes: VisitRouteApiResponse[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
}

@Injectable({
  providedIn: 'root'
})
export class VisitRoutesService {

  private readonly baseUrl = (environment as any).localServices?.visitRoutes 
    ? `${(environment as any).localServices.visitRoutes}${environment.apiEndpoints.visitRoutes}`
    : `${environment.apiUrl}${environment.apiEndpoints.visitRoutes}`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new optimized visit route
   */
  createVisitRoute(request: CreateVisitRouteRequest): Observable<VisitRoute> {
    return this.http.post<VisitRouteApiResponse>(this.baseUrl, request)
      .pipe(
        map(route => this.transformVisitRoute(route)),
        catchError(this.handleError)
      );
  }

  /**
   * Get visit routes with optional filters
   */
  getVisitRoutes(filters?: {
    sellerId?: number;
    routeDate?: string;
    status?: string;
    page?: number;
  }): Observable<{routes: VisitRoute[], total: number, totalPages: number, page: number}> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.sellerId) params = params.set('seller_id', filters.sellerId.toString());
      if (filters.routeDate) params = params.set('route_date', filters.routeDate);
      if (filters.status) params = params.set('status_filter', filters.status);
      if (filters.page) params = params.set('page', filters.page.toString());
    }

    return this.http.get<VisitRoutesPaginatedResponse>(this.baseUrl, { params })
      .pipe(
        map(response => {
          const transformedRoutes = response.routes.map(r => this.transformVisitRoute(r));
          return {
            routes: transformedRoutes,
            total: response.total,
            totalPages: response.total_pages,
            page: response.page
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a specific visit route by ID
   */
  getVisitRouteById(id: string): Observable<VisitRoute> {
    return this.http.get<VisitRouteApiResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        map(route => this.transformVisitRoute(route)),
        catchError(this.handleError)
      );
  }

  /**
   * Update the sequence of stops in a route
   */
  updateRouteSequence(routeId: string, stopSequences: Array<{stop_id: number, sequence: number}>): Observable<VisitRoute> {
    return this.http.patch<VisitRouteApiResponse>(
      `${this.baseUrl}/${routeId}/sequence`,
      { stop_sequences: stopSequences }
    ).pipe(
      map(route => this.transformVisitRoute(route)),
      catchError(this.handleError)
    );
  }

  /**
   * Confirm a visit route
   */
  confirmVisitRoute(routeId: string): Observable<VisitRoute> {
    return this.http.post<VisitRouteApiResponse>(`${this.baseUrl}/${routeId}/confirm`, {})
      .pipe(
        map(route => this.transformVisitRoute(route)),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a visit route
   */
  deleteVisitRoute(routeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${routeId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Transform backend response to frontend format
   */
  private transformVisitRoute(apiRoute: VisitRouteApiResponse): VisitRoute {
    return {
      id: apiRoute.id.toString(),
      sellerId: apiRoute.seller_id.toString(),
      routeDate: apiRoute.route_date,
      status: apiRoute.status,
      totalClients: apiRoute.total_clients,
      estimatedDurationMinutes: apiRoute.estimated_duration_minutes || undefined,
      totalDistanceMeters: apiRoute.total_distance_meters || undefined,
      createdAt: apiRoute.created_at,
      confirmedAt: apiRoute.confirmed_at || undefined,
      stops: apiRoute.stops ? apiRoute.stops.map(stop => this.transformStop(stop)) : []
    };
  }

  /**
   * Transform backend stop to frontend format
   */
  private transformStop(apiStop: VisitRouteStopApiResponse): VisitRouteStop {
    return {
      id: apiStop.id.toString(),
      clientId: apiStop.client_id.toString(),
      sequence: apiStop.sequence,
      clientName: apiStop.client_name,
      clientAddress: apiStop.client_address,
      estimatedArrivalTime: apiStop.estimated_arrival_time || undefined,
      estimatedDepartureTime: apiStop.estimated_departure_time || undefined,
      durationMinutes: apiStop.estimated_duration_minutes,
      distanceFromPrevious: apiStop.distance_from_previous_meters || undefined,
      travelTimeFromPrevious: apiStop.travel_time_from_previous_minutes || undefined,
      observations: apiStop.observations || undefined,
      status: apiStop.status,
      latitude: apiStop.latitude ? parseFloat(apiStop.latitude) : undefined,
      longitude: apiStop.longitude ? parseFloat(apiStop.longitude) : undefined
    };
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en VisitRoutesService:', error);
    
    let errorMessage = 'Ocurrió un error al procesar la solicitud';

    if (error.error?.detail) {
      // Si detail es un objeto, convertirlo a string
      errorMessage = typeof error.error.detail === 'string' 
        ? error.error.detail 
        : JSON.stringify(error.error.detail);
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}

