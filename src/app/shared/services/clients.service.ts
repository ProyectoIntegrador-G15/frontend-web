import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ClientApiResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  seller_id?: number;
  city?: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  sellerId?: number;
  city?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  constructor(private http: HttpClient) { }

  /**
   * Gets all clients from the backend, optionally filtered by seller_id
   */
  getClients(sellerId?: number): Observable<Client[]> {
    // Usar localServices si está configurado, sino usar la URL de producción
    const baseUrl = (environment as any).localServices?.clients 
      ? `${(environment as any).localServices.clients}${environment.apiEndpoints.clients}`
      : `${environment.apiUrl}${environment.apiEndpoints.clients}`;
    
    // Agregar seller_id como query parameter si está presente
    const clientsUrl = sellerId ? `${baseUrl}?seller_id=${sellerId}` : baseUrl;
    console.log('ClientsService - Llamando a:', clientsUrl);
    
    return this.http.get<ClientApiResponse[]>(clientsUrl)
      .pipe(
        map(clients => clients.map(client => this.transformClient(client))),
        catchError(this.handleError)
      );
  }

  /**
   * Gets a specific client by ID
   */
  getClientById(id: string): Observable<Client> {
    const baseUrl = (environment as any).localServices?.clients 
      ? `${(environment as any).localServices.clients}${environment.apiEndpoints.clients}`
      : `${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}`;
    const clientsUrl = `${baseUrl}/${id}`;
    
    return this.http.get<ClientApiResponse>(clientsUrl)
      .pipe(
        map(client => this.transformClient(client)),
        catchError(this.handleError)
      );
  }

  /**
   * Gets clients by multiple IDs
   */
  getClientsByIds(ids: string[]): Observable<Client[]> {
    // Hacer solicitudes individuales para cada cliente
    // En producción, el backend podría tener un endpoint batch
    const requests = ids.map(id => this.getClientById(id).pipe(
      catchError(() => {
        // Si un cliente falla, continuar con los demás
        return throwError(() => new Error(`Client ${id} not found`));
      })
    ));

    return this.http.get<ClientApiResponse[]>(
      `${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}`
    ).pipe(
      map(clients => {
        const filtered = clients.filter(c => ids.includes(c.id.toString()));
        return filtered.map(client => this.transformClient(client));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Gets free clients (not assigned to any seller)
   */
  getFreeClients(): Observable<Client[]> {
    const baseUrl = (environment as any).localServices?.clients 
      ? `${(environment as any).localServices.clients}${environment.apiEndpoints.clients}`
      : `${environment.apiUrl}${environment.apiEndpoints.clients}`;
    
    const freeClientsUrl = `${baseUrl}/free`;
    
    return this.http.get<ClientApiResponse[]>(freeClientsUrl)
      .pipe(
        map(clients => clients.map(client => this.transformClient(client))),
        catchError(this.handleError)
      );
  }

  /**
   * Assign or unassign a client to a seller
   * If client is already assigned to the seller, it will be unassigned
   * If client is not assigned, it will be assigned to the seller
   */
  assignUnassignClientToSeller(clientId: number, sellerId: number): Observable<Client> {
    const baseUrl = (environment as any).localServices?.clients 
      ? `${(environment as any).localServices.clients}${environment.apiEndpoints.clients}`
      : `${environment.apiUrl}${environment.apiEndpoints.clients}`;
    
    const assignUrl = `${baseUrl}/${clientId}/sellers/${sellerId}`;
    
    return this.http.patch<ClientApiResponse>(assignUrl, {})
      .pipe(
        map(client => this.transformClient(client)),
        catchError(this.handleError)
      );
  }

  /**
   * Transform backend response to frontend format
   */
  private transformClient(apiClient: ClientApiResponse): Client {
    return {
      id: apiClient.id.toString(),
      name: apiClient.name,
      email: apiClient.email,
      phone: apiClient.phone || undefined,
      address: apiClient.address,
      sellerId: apiClient.seller_id,
      city: apiClient.city,
      createdAt: apiClient.created_at
    };
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en ClientsService:', error);
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

