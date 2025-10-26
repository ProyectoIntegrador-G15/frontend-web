import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaz para la respuesta del backend
export interface SellerApiResponse {
  id: number;
  name: string;
  identification: string;
  status: 'active' | 'inactive' | 'suspended';
  email: string;
  phone: string;
  address: string | null;
  commission: number | null;
  sales_target: number | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

// Interfaz para el frontend
export interface Seller {
  id: string;
  name: string;
  identification: string;
  status: 'active' | 'inactive' | 'suspended';
  entryDate: string;
  email: string;
  phone: string;
  address?: string;
  commission?: number;
  salesTarget?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SellersService {

  constructor(private http: HttpClient) { }

  /**
   * Gets all sellers from the backend
   */
  getSellers(): Observable<Seller[]> {
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}`;
    return this.http.get<SellerApiResponse[]>(sellersUrl)
      .pipe(
        map(sellers => sellers.map(seller => this.transformSeller(seller))),
        catchError(this.handleError)
      );
  }

  /**
   * Gets a specific seller by ID
   */
  getSellerById(id: string): Observable<Seller> {
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${id}`;
    return this.http.get<SellerApiResponse>(sellersUrl)
      .pipe(
        map(seller => this.transformSeller(seller)),
        catchError(this.handleError)
      );
  }

  /**
   * Creates a new seller
   */
  createSeller(seller: Omit<Seller, 'id' | 'entryDate'>): Observable<Seller> {
    const sellerData = {
      name: seller.name,
      identification: seller.identification,
      email: seller.email,
      phone: seller.phone,
      address: seller.address || null,
      commission: seller.commission || null,
      sales_target: seller.salesTarget || null
    };
    
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}`;
    return this.http.post<SellerApiResponse>(sellersUrl, sellerData)
      .pipe(
        map(seller => this.transformSeller(seller)),
        catchError(this.handleError)
      );
  }

  /**
   * Updates an existing seller
   */
  updateSeller(id: string, seller: Partial<Seller>): Observable<Seller> {
    const sellerData: any = {};
    if (seller.name) sellerData.name = seller.name;
    if (seller.status) sellerData.status = seller.status;
    if (seller.email) sellerData.email = seller.email;
    if (seller.phone) sellerData.phone = seller.phone;
    if (seller.address !== undefined) sellerData.address = seller.address;
    if (seller.commission !== undefined) sellerData.commission = seller.commission;
    if (seller.salesTarget !== undefined) sellerData.sales_target = seller.salesTarget;
    
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${id}`;
    return this.http.patch<SellerApiResponse>(sellersUrl, sellerData)
      .pipe(
        map(seller => this.transformSeller(seller)),
        catchError(this.handleError)
      );
  }

  /**
   * Deletes a seller
   */
  deleteSeller(id: string): Observable<boolean> {
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${id}`;
    return this.http.delete(sellersUrl)
      .pipe(
        map(() => true),
        catchError(() => {
          return throwError(() => new Error('Error al eliminar el vendedor'));
        })
      );
  }

  /**
   * Transform backend response to frontend format
   */
  private transformSeller(apiSeller: SellerApiResponse): Seller {
    return {
      id: apiSeller.id.toString(),
      name: apiSeller.name,
      identification: apiSeller.identification,
      status: apiSeller.status,
      entryDate: this.formatDate(apiSeller.entry_date),
      email: apiSeller.email,
      phone: apiSeller.phone,
      address: apiSeller.address || undefined,
      commission: apiSeller.commission || undefined,
      salesTarget: apiSeller.sales_target || undefined
    };
  }

  /**
   * Format date from backend (ISO) to DD-MM-YYYY
   */
  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en SellersService:', error);
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
