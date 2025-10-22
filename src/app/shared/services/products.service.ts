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

  getProductsPaginated(page: number = 1, status: boolean = true): Observable<any> {
    const params = {
      page: page.toString(),
      status: status.toString()
    };
    
    return this.apiService.getDirect<any>(`${this.endpointsService.getEndpointPath('products')}/paginated`, params)
      .pipe(
        map(response => {
          // Si la respuesta es directamente un array, lo convertimos al formato esperado
          if (Array.isArray(response)) {
            const transformedData = response.map((product: ProductApiResponse) => this.transformProduct(product));
            
            // Nueva estrategia: asumir que hay más páginas si obtenemos exactamente 5 elementos
            // Si obtenemos menos de 5, asumir que es la última página
            const isLastPage = response.length < 5;
            const hasNextPage = response.length === 5; // Si obtenemos exactamente 5, probablemente hay más
            
            // Calcular total estimado basado en la nueva lógica
            let estimatedTotal;
            if (isLastPage) {
              estimatedTotal = (page - 1) * 10 + response.length; // Páginas anteriores + elementos actuales
            } else if (hasNextPage) {
              estimatedTotal = page * 10 + 1; // +1 para indicar que hay más páginas
            } else {
              estimatedTotal = (page - 1) * 10 + response.length; // Páginas anteriores + elementos actuales
            }
            
            return {
              data: transformedData,
              total: estimatedTotal,
              page: page,
              pageSize: 10,
              hasNextPage: hasNextPage
            };
          }
          // Si la respuesta ya tiene la estructura esperada
          return {
            ...response,
            data: response.data ? response.data.map((product: ProductApiResponse) => this.transformProduct(product)) : []
          };
        }),
        catchError(this.handleError)
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
      status: apiProduct.status ? 'active' : 'inactive',
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
    console.error('Error en ProductsService:', error);
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
