import {Injectable, inject} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {Product} from '../interfaces/product.type';
import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsWarehouseService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {
  }

  getProductsByWarehouse(warehouseId: string): Observable<Product[]> {
    return this.apiService.getDirect<Product[]>(`${this.endpointsService.getEndpointPath('products')}/warehouse/${warehouseId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en ProductsWarehouseService:', error);
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
