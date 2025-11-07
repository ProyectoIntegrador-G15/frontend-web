import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  country: string;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WarehousePaginatedResponse {
  warehouses: Warehouse[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
}

@Injectable({
  providedIn: 'root'
})
export class WarehousesService {
  private warehousesSubject = new BehaviorSubject<Warehouse[]>([]);
  public warehouses$ = this.warehousesSubject.asObservable();
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {}

  getWarehouses(): Observable<Warehouse[]> {
    return this.apiService.getDirect<Warehouse[]>(this.endpointsService.getEndpointPath('warehouses'))
      .pipe(
        map(warehouses => {
          this.warehousesSubject.next(warehouses);
          return warehouses;
        }),
        catchError(this.handleError)
      );
  }

  getWarehousesPaginated(page: number = 1, name?: string, country?: string): Observable<WarehousePaginatedResponse> {
    const params: any = {
      page: page.toString()
    };

    if (name && name.trim()) {
      params.name = name.trim();
    }

    if (country && country.trim()) {
      params.country = country.trim();
    }

    return this.apiService.getDirect<WarehousePaginatedResponse>(
      this.endpointsService.getEndpointPath('warehouses'),
      params
    ).pipe(
      catchError(this.handleErrorPaginated)
    );
  }

  getActiveWarehouses(): Observable<Warehouse[]> {
    return this.warehouses$.pipe(
      map(warehouses => warehouses.filter(warehouse => warehouse.status === 'active'))
    );
  }

  createWarehouse(warehouseData: any): Observable<Warehouse> {
    return this.apiService.postDirect<Warehouse>(
      this.endpointsService.getEndpointPath('warehouses'),
      warehouseData
    ).pipe(
      map(response => {
        // Actualizar la lista de bodegas
        this.refreshWarehouses();
        return response;
      }),
      catchError(this.handleErrorCreate)
    );
  }

  private refreshWarehouses(): void {
    this.getWarehouses().subscribe({
      next: (warehouses) => {
        this.warehousesSubject.next(warehouses);
      },
      error: (error) => {
        console.error('Error al actualizar la lista de bodegas:', error);
      }
    });
  }

  private handleError(error: any): Observable<Warehouse[]> {
    console.error('Error en WarehousesService:', error);
    return of([]);
  }

  private handleErrorPaginated(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  private handleErrorCreate(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

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
