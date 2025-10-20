import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {Product} from '../interfaces/product.type';
import {environment} from '../../../environments/environment';

export interface ProductApiResponse {
  id: number;
  name: string;
  description: string;
  purchase_price: number;
  storage_instructions: string;
  temperature_range: string;
  requires_cold_chain: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductApiResponse[]>(`${environment.apiUrl}${environment.apiEndpoints.products}`)
      .pipe(
        map(products => products.map(product => this.transformProduct(product))),
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
      price: apiProduct.purchase_price,
      provider: 'N/A', // El backend no devuelve este campo todavía
      needsCold: apiProduct.requires_cold_chain,
      status: apiProduct.status ? 'active' : 'inactive',
      description: apiProduct.description,
      storageInstructions: apiProduct.storage_instructions
    };
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}${environment.apiEndpoints.products}`, productData)
      .pipe(
        map(response => {
          this.refreshProducts();
          return response;
        }),
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
