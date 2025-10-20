import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, retry} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string;
  private headers: HttpHeaders;

  private http = inject(HttpClient);

  constructor() {
    this.baseUrl = environment.apiUrl || 'http://localhost:8004';
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<T>>(url, {
      headers: this.headers,
      params: httpParams
    }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * GET request direct (sin wrapper ApiResponse)
   */
  getDirect<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpParams = this.buildParams(params);

    return this.http.get<T>(url, {
      headers: this.headers,
      params: httpParams
    }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    return this.http.post<ApiResponse<T>>(url, data, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    return this.http.put<ApiResponse<T>>(url, data, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    return this.http.patch<ApiResponse<T>>(url, data, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    return this.http.delete<ApiResponse<T>>(url, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return httpParams;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string): void {
    this.headers = this.headers.set('Authorization', `Bearer ${token}`);
  }

  /**
   * Remove authorization token
   */
  removeAuthToken(): void {
    this.headers = this.headers.delete('Authorization');
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Health check
   */
  healthCheck(): Observable<ApiResponse<any>> {
    return this.get('/health');
  }
}
