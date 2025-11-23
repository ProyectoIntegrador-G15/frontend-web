import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaz para un vendedor en la respuesta del backend
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

// Interfaz para la respuesta paginada del backend
export interface SellerPaginatedApiResponse {
  sellers: SellerApiResponse[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
}

export interface SellerPerformanceResponse {
  total_orders: number;
  total_revenue: number;
  total_visits: number;
  total_units_sold: number;
  units_compliance: number | null;
  revenue_compliance: number | null;
  visits_compliance: number | null;
}

export interface SalesPlan {
  id: number;
  seller_id: number;
  name: string;
  start_date: string;
  end_date: string;
  total_units_target: number;
  total_value_target: number;
  visits_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface SalesPlanListResponse {
  sales_plans: SalesPlan[];
  total: number;
}

export interface CreateSalesPlanRequest {
  name: string;
  start_date: string;
  end_date: string;
  total_units_target: number;
  total_value_target: number;
  visits_target: number | null;
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
   * Makes multiple requests to fetch all pages if needed
   */
  getSellers(): Observable<Seller[]> {
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}`;

    // First, get the first page to know total pages
    return this.http.get<SellerPaginatedApiResponse>(`${sellersUrl}?page=1`)
      .pipe(
        switchMap(firstPageResponse => {
          const allSellers = [...firstPageResponse.sellers];
          const totalPages = firstPageResponse.total_pages;

          // If there's only one page, return the sellers
          if (totalPages <= 1) {
            return of(allSellers.map(seller => this.transformSeller(seller)));
          }

          // If there are multiple pages, fetch them all
          const pageRequests: Observable<SellerPaginatedApiResponse>[] = [];
          for (let page = 2; page <= totalPages; page++) {
            pageRequests.push(
              this.http.get<SellerPaginatedApiResponse>(`${sellersUrl}?page=${page}`)
            );
          }

          // Wait for all page requests to complete
          return forkJoin(pageRequests).pipe(
            map(responses => {
              // Combine all sellers from all pages
              responses.forEach(response => {
                allSellers.push(...response.sellers);
              });

              return allSellers.map(seller => this.transformSeller(seller));
            })
          );
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gets sellers with pagination
   */
  getSellersPaginated(page: number = 1): Observable<{ sellers: Seller[], total: number, totalPages: number, page: number }> {
    const sellersUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}?page=${page}`;

    return this.http.get<SellerPaginatedApiResponse>(sellersUrl)
      .pipe(
        map(response => ({
          sellers: response.sellers.map(seller => this.transformSeller(seller)),
          total: response.total,
          totalPages: response.total_pages,
          page: response.page
        })),
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
   * Gets performance data for a seller within a date range
   */
  getSellerPerformance(sellerId: string | number, startDate: string, endDate: string): Observable<SellerPerformanceResponse> {
    const url = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${sellerId}/performance`;
    const fullUrl = `${url}?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
    return this.http.get<SellerPerformanceResponse>(fullUrl)
      .pipe(
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
    if (seller.name) { sellerData.name = seller.name; }
    if (seller.status) { sellerData.status = seller.status; }
    if (seller.email) { sellerData.email = seller.email; }
    if (seller.phone) { sellerData.phone = seller.phone; }
    if (seller.address !== undefined) { sellerData.address = seller.address; }
    if (seller.commission !== undefined) { sellerData.commission = seller.commission; }
    if (seller.salesTarget !== undefined) { sellerData.sales_target = seller.salesTarget; }

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
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Gets sales plans for a seller filtered by month and year
   */
  getSalesPlans(sellerId: string | number, month: number, year: number): Observable<SalesPlanListResponse> {
    const url = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${sellerId}/sales-plans`;
    const fullUrl = `${url}?month=${month}&year=${year}`;
    return this.http.get<SalesPlanListResponse>(fullUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gets a specific sales plan by ID
   */
  getSalesPlan(sellerId: string | number, planId: number): Observable<SalesPlan> {
    const url = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${sellerId}/sales-plans/${planId}`;
    return this.http.get<SalesPlan>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Creates a new sales plan for a seller
   */
  createSalesPlan(sellerId: string | number, planData: CreateSalesPlanRequest): Observable<SalesPlan> {
    const url = `${environment.apiUrl}${environment.apiEndpoints.sellers}/${sellerId}/sales-plans`;
    return this.http.post<SalesPlan>(url, planData)
      .pipe(
        catchError(this.handleError)
      );
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
    }

    return throwError(() => new Error(errorMessage));
  }
}
