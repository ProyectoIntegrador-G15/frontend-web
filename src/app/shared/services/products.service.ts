import {Injectable, inject} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {Product} from '../interfaces/product.type';
import {ApiService, ApiResponse} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

export interface ProductApiResponse {
  id: number;
  name: string;
  description: string;
  purchase_price: number;
  storage_instructions: string;
  temperature_range: string;
  requires_cold_chain: boolean;
  status: boolean;
  supplier_id: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {
  }

  getProducts(): Observable<Product[]> {
    return this.apiService.getDirect<ProductApiResponse[]>(this.endpointsService.getEndpointPath('products'))
      .pipe(
        map(products => products.map(product => this.transformProduct(product))),
        catchError(this.handleError)
      );
  }

  getProductsPaginated(page: number = 1, status: boolean = true, searchTerm: string = ''): Observable<any> {
    const params: any = {
      page: page.toString(),
      status: status.toString()
    };

    if (searchTerm && searchTerm.trim()) {
      params.name = searchTerm.trim();
    }

    return this.apiService.getDirect<any>(`${this.endpointsService.getEndpointPath('products')}/paginated`, params)
      .pipe(catchError(this.handleError),
      );
  }

  /**
   * Transforma la respuesta del backend al formato del frontend
   */
  private transformProduct(apiProduct: ProductApiResponse): Product {
    return {
      id: apiProduct.id.toString(),
      name: apiProduct.name,
      purchase_price: apiProduct.purchase_price,
      supplier: `Proveedor ${apiProduct.supplier_id}`, // Convertir supplier_id a string descriptivo
      requires_cold_chain: apiProduct.requires_cold_chain,
      status: apiProduct.status,
      description: apiProduct.description,
      storageInstructions: apiProduct.storage_instructions
    };
  }

  createProduct(productData: any): Observable<any> {
    return this.apiService.post<any>(this.endpointsService.getEndpointPath('products'), productData)
      .pipe(
        map(response => {
          this.refreshProducts();
          return response;
        }),
        catchError(this.handleError)
      );
  }

  addInventoryToProduct(productId: string, inventoryData: any): Observable<any> {
    return this.apiService.post<any>(`${this.endpointsService.getEndpointPath('products')}/${productId}/inventory`, inventoryData)
      .pipe(
        catchError(this.handleError)
      );
  }

  private refreshProducts(): void {
    this.getProducts().subscribe({
      next: (products) => {
        this.productsSubject.next(products);
      },
      error: (error) => {
        console.error('Error al actualizar la lista de productos:', error);
      }
    });
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
