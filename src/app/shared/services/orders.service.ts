import {Injectable, inject} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

// Interfaz para el producto en una orden
export interface ProductOrder {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  warehouse_ids: string | null;
}

// Interfaz para la orden del backend
export interface OrderApiResponse {
  id: number;
  requested_delivery_date: string | null;
  delivered_at: string | null;
  client_name: string;
  state: 'pending' | 'in_transit' | 'delivered';
  country: string;
  total_amount: number;
  created_at: string;
  client_id: number;
  client_address: string;
  products: ProductOrder[];
}

// Interfaz para la orden del frontend
export interface Order {
  id: string;
  requestedDeliveryDate: string | null;
  deliveredAt: string | null;
  clientName: string;
  state: 'pending' | 'in_transit' | 'delivered';
  country: string;
  totalAmount: number;
  createdAt: string;
  clientId: number;
  clientAddress: string;
  products: ProductOrder[];
}

export interface TopProductSales {
  product_id: number;
  product_name: string;
  total_quantity: number;
  total_sales_amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  /**
   * Gets all orders from the backend
   */
  getOrders(): Observable<Order[]> {
    return this.apiService.getDirect<OrderApiResponse[]>(this.endpointsService.getEndpointPath('orders'))
      .pipe(
        map(orders => orders.map(order => this.transformOrder(order))),
        catchError(this.handleError)
      );
  }

  /**
   * Gets orders filtered by state
   */
  getOrdersByState(state: 'pending' | 'in_transit' | 'delivered'): Observable<Order[]> {
    return this.getOrders().pipe(
      map(orders => orders.filter(order => order.state === state))
    );
  }

  /**
   * Gets pending orders (for route creation)
   */
  getPendingOrders(): Observable<Order[]> {
    return this.getOrdersByState('pending');
  }

  /**
   * Gets a specific order by ID
   */
  getOrderById(id: string): Observable<Order> {
    return this.apiService.getDirect<OrderApiResponse>(`${this.endpointsService.getEndpointPath('orders')}/${id}`)
      .pipe(
        map(order => this.transformOrder(order)),
        catchError(this.handleError)
      );
  }

  /**
   * Gets top 10 best-selling products for a specific seller
   * @param sellerId - Seller ID
   * @param startDate - Optional start date (YYYY-MM-DD)
   * @param endDate - Optional end date (YYYY-MM-DD)
   */
  getTopProductsBySeller(sellerId: number, startDate?: string, endDate?: string): Observable<TopProductSales[]> {
    const params: any = {
      seller_id: sellerId.toString()
    };

    // Agregar fechas si se proporcionan
    if (startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }

    return this.apiService.getDirect<TopProductSales[]>(
      `${this.endpointsService.getEndpointPath('orders')}/top-products-by-seller`,
      params
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Transform backend response to frontend format
   */
  private transformOrder(apiOrder: OrderApiResponse): Order {
    return {
      id: apiOrder.id.toString(),
      requestedDeliveryDate: apiOrder.requested_delivery_date,
      deliveredAt: apiOrder.delivered_at,
      clientName: apiOrder.client_name,
      state: apiOrder.state,
      country: apiOrder.country,
      totalAmount: apiOrder.total_amount,
      createdAt: apiOrder.created_at,
      clientId: apiOrder.client_id,
      clientAddress: apiOrder.client_address,
      products: apiOrder.products
    };
  }

  /**
   * Format date to readable format
   */
  formatDate(isoDate: string | null): string {
    if (!isoDate) return 'No definida';
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Error handling
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en OrdersService:', error);
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
