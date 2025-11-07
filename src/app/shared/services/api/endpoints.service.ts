import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {
  private readonly apiUrl = environment.apiUrl;
  private readonly endpoints = environment.apiEndpoints;

  constructor() { }

  /**
   * Obtener la URL base de la API
   */
  getBaseUrl(): string {
    return this.apiUrl;
  }

  /**
   * Obtener endpoint completo para órdenes
   */
  getOrdersEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.orders}`;
  }

  /**
   * Obtener endpoint completo para clientes
   */
  getCustomersEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.customers}`;
  }

  /**
   * Obtener endpoint completo para productos
   */
  getProductsEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.products}`;
  }

  /**
   * Obtener endpoint completo para rutas
   */
  getRoutesEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.routes}`;
  }

  /**
   * Obtener endpoint completo para almacenes
   */
  getWarehousesEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.warehouses}`;
  }

  /**
   * Obtener endpoint completo para visitas
   */
  getVisitsEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.visits}`;
  }

  /**
   * Obtener endpoint completo para logística
   */
  getLogisticsEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.logistics}`;
  }

  /**
   * Obtener endpoint completo para inventario
   */
  getInventoryEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.inventory}`;
  }

  /**
   * Obtener endpoint completo para autenticación
   */
  getAuthenticationEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.authentication}`;
  }

  /**
   * Obtener endpoint completo para health check
   */
  getHealthEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.health}`;
  }

  /**
   * Obtener endpoint completo para reportes
   */
  getReportsEndpoint(): string {
    return `${this.apiUrl}${this.endpoints.reports}`;
  }

  /**
   * Obtener solo el path del endpoint (sin URL base)
   */
  getEndpointPath(endpointName: keyof typeof environment.apiEndpoints): string {
    return this.endpoints[endpointName];
  }

  /**
   * Construir URL completa con parámetros
   */
  buildUrl(endpointName: keyof typeof environment.apiEndpoints, path?: string): string {
    const baseEndpoint = this.getEndpointPath(endpointName);
    const fullPath = path ? `${baseEndpoint}${path}` : baseEndpoint;
    return `${this.apiUrl}${fullPath}`;
  }
}
