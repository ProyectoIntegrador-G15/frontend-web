import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {Product} from '../interfaces/product.type';

const PRODUCTS_API_URL = 'http://localhost:3002';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${PRODUCTS_API_URL}/products`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(`${PRODUCTS_API_URL}/products`, productData)
      .pipe(
        map(response => {
          // Actualizar la lista de productos después de crear uno nuevo
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
