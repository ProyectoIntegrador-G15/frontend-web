import {Injectable, inject} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {Product} from '../interfaces/product.type';
import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

/**
 * Interfaz para la respuesta del endpoint de productos por warehouse
 */
export interface ProductWarehouseInfo {
  id: number;
  name: string;
  description?: string;
  purchase_price: number;
  storage_instructions?: string;
  temperature_range?: string;
  requires_cold_chain: boolean;
  supplier_id: number;
  status?: boolean;
  available_quantity: number;
  location_identifier?: string;
}

export interface WarehouseProductsResponse {
  warehouse_id: number;
  warehouse_name: string;
  warehouse_city: string;
  warehouse_country: string;
  warehouse_address: string;
  products: ProductWarehouseInfo[];
  total_products: number;
  total_quantity: number;
}

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

  getProductsByWarehouse(warehouseId: string, searchTerm?: string): Observable<WarehouseProductsResponse> {
    const params: any = {};
    if (searchTerm && searchTerm.trim()) {
      params.name = searchTerm.trim();
    }
    
    return this.apiService.getDirect<WarehouseProductsResponse>(
      `${this.endpointsService.getEndpointPath('products')}/warehouse/${warehouseId}`,
      params
    ).pipe(
      map((response: WarehouseProductsResponse) => {
        // Mapear productos y actualizar el BehaviorSubject
        const products: Product[] = response.products.map(product => ({
          id: product.id.toString(),
          name: product.name,
          purchase_price: product.purchase_price,
          supplier: null, // El endpoint de warehouse no incluye información del supplier
          supplier_id: product.supplier_id,
          requires_cold_chain: product.requires_cold_chain,
          status: product.status ?? true,
          description: product.description,
          storageInstructions: product.storage_instructions,
          stock: product.available_quantity,
          warehouseId: warehouseId,
          category: undefined, // Campo para futuro uso si se agrega al modelo
          location_identifier: product.location_identifier
        }));
        
        // Actualizar el BehaviorSubject
        this.productsSubject.next(products);
        
        return response;
      }),
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
      // Si el mensaje es solo el prefijo de ApiService sin contenido real, usar el mensaje por defecto
      const message = error.message.trim();
      if (message && message !== 'Network or Client Error:' && !message.match(/^Network or Client Error:\s*$/)) {
        // Extraer el mensaje real si está después del prefijo
        if (message.startsWith('Network or Client Error: ')) {
          const actualMessage = message.substring('Network or Client Error: '.length).trim();
          errorMessage = actualMessage || errorMessage;
        } else {
          errorMessage = message;
        }
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
