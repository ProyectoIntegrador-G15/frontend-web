import {Injectable, inject} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

export interface Supplier {
  id: number;
  name: string;
  nit: string;
  status: string;
  email: string;
  country: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierPaginatedResponse {
  suppliers: Supplier[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
}

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  public suppliers$ = this.suppliersSubject.asObservable();

  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {
  }

  getSuppliersPaginated(
    page: number = 1,
    search?: string,
    country?: string
  ): Observable<SupplierPaginatedResponse> {
    const params: any = {
      page: page.toString()
    };

    if (search && search.trim()) {
      params.search = search.trim();
    }

    if (country && country.trim()) {
      params.country = country.trim();
    }

    return this.apiService.getDirect<SupplierPaginatedResponse>(
      `${this.endpointsService.getEndpointPath('suppliers')}`,
      params
    ).pipe(
      map(response => {
        this.suppliersSubject.next(response.suppliers);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  createSupplier(supplierData: {
    name: string;
    nit: string;
    email: string;
    country: string;
    city: string;
  }): Observable<Supplier> {
    return this.apiService.postDirect<Supplier>(
      this.endpointsService.getEndpointPath('suppliers'),
      supplierData
    ).pipe(
      map(response => {
        this.refreshSuppliers();
        return response;
      }),
      catchError(this.handleError)
    );
  }

  private refreshSuppliers(): void {
    this.getSuppliersPaginated(1).subscribe({
      next: (response) => {
        this.suppliersSubject.next(response.suppliers);
      },
      error: (error) => {
        console.error('Error al actualizar la lista de proveedores:', error);
      }
    });
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
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

