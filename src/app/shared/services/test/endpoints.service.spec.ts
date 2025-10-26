import { TestBed } from '@angular/core/testing';
import { EndpointsService } from '../api/endpoints.service';
import { environment } from '../../../../environments/environment';

describe('EndpointsService', () => {
  let service: EndpointsService;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EndpointsService]
    });
    service = TestBed.inject(EndpointsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBaseUrl', () => {
    it('should return the base API URL', () => {
      const url = service.getBaseUrl();
      expect(url).toBe(baseUrl);
      expect(url).toBeTruthy();
    });
  });

  describe('Specific Endpoint Methods', () => {
    it('should return complete orders endpoint', () => {
      const endpoint = service.getOrdersEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.orders}`);
      expect(endpoint).toContain('/orders');
    });

    it('should return complete customers endpoint', () => {
      const endpoint = service.getCustomersEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.customers}`);
      expect(endpoint).toContain('/customers');
    });

    it('should return complete products endpoint', () => {
      const endpoint = service.getProductsEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.products}`);
      expect(endpoint).toContain('/products');
    });

    it('should return complete routes endpoint', () => {
      const endpoint = service.getRoutesEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.routes}`);
      expect(endpoint).toContain('/routes');
    });

    it('should return complete warehouses endpoint', () => {
      const endpoint = service.getWarehousesEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.warehouses}`);
      expect(endpoint).toContain('/warehouses');
    });

    it('should return complete visits endpoint', () => {
      const endpoint = service.getVisitsEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.visits}`);
      expect(endpoint).toContain('/visits');
    });

    it('should return complete logistics endpoint', () => {
      const endpoint = service.getLogisticsEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.logistics}`);
      expect(endpoint).toContain('/logistics');
    });

    it('should return complete inventory endpoint', () => {
      const endpoint = service.getInventoryEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.inventory}`);
      expect(endpoint).toContain('/inventory');
    });

    it('should return complete authentication endpoint', () => {
      const endpoint = service.getAuthenticationEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.authentication}`);
      expect(endpoint).toContain('/auth');
    });

    it('should return complete health endpoint', () => {
      const endpoint = service.getHealthEndpoint();
      expect(endpoint).toBe(`${baseUrl}${environment.apiEndpoints.health}`);
      expect(endpoint).toContain('/health');
    });
  });

  describe('getEndpointPath', () => {
    it('should return only the path for orders endpoint', () => {
      const path = service.getEndpointPath('orders');
      expect(path).toBe(environment.apiEndpoints.orders);
      expect(path).not.toContain('http');
      expect(path).toEqual('/orders');
    });

    it('should return only the path for customers endpoint', () => {
      const path = service.getEndpointPath('customers');
      expect(path).toBe(environment.apiEndpoints.customers);
      expect(path).not.toContain('http');
    });

    it('should return only the path for products endpoint', () => {
      const path = service.getEndpointPath('products');
      expect(path).toBe(environment.apiEndpoints.products);
      expect(path).not.toContain('http');
    });

    it('should return only the path for routes endpoint', () => {
      const path = service.getEndpointPath('routes');
      expect(path).toBe(environment.apiEndpoints.routes);
      expect(path).not.toContain('http');
    });

    it('should return only the path for warehouses endpoint', () => {
      const path = service.getEndpointPath('warehouses');
      expect(path).toBe(environment.apiEndpoints.warehouses);
      expect(path).not.toContain('http');
    });

    it('should return only the path for sellers endpoint', () => {
      const path = service.getEndpointPath('sellers');
      expect(path).toBe(environment.apiEndpoints.sellers);
      expect(path).not.toContain('http');
    });
  });

  describe('buildUrl', () => {
    it('should build URL without additional path', () => {
      const url = service.buildUrl('orders');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.orders}`);
      expect(url).toContain('/orders');
    });

    it('should build URL with additional path', () => {
      const url = service.buildUrl('orders', '/123');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.orders}/123`);
      expect(url).toContain('/orders/123');
    });

    it('should build URL with query parameters', () => {
      const url = service.buildUrl('orders', '?state=pending');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.orders}?state=pending`);
      expect(url).toContain('?state=pending');
    });

    it('should build URL with complex path', () => {
      const url = service.buildUrl('routes', '/123/waypoints');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.routes}/123/waypoints`);
      expect(url).toContain('/routes/123/waypoints');
    });

    it('should build URL for all endpoint types', () => {
      const endpoints: Array<keyof typeof environment.apiEndpoints> = [
        'orders',
        'customers',
        'products',
        'routes',
        'warehouses',
        'visits',
        'logistics',
        'inventory',
        'authentication',
        'health',
        'sellers'
      ];

      endpoints.forEach(endpoint => {
        const url = service.buildUrl(endpoint);
        expect(url).toContain(baseUrl);
        expect(url).toBeTruthy();
      });
    });

    it('should handle empty additional path', () => {
      const url = service.buildUrl('orders', '');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.orders}`);
    });

    it('should handle path with leading slash', () => {
      const url = service.buildUrl('customers', '/456');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.customers}/456`);
      expect(url).toContain('/customers/456');
    });

    it('should handle path without leading slash', () => {
      const url = service.buildUrl('products', '789');
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.products}789`);
      expect(url).toContain('789');
    });
  });

  describe('URL Consistency', () => {
    it('should maintain consistent base URL across all methods', () => {
      const baseUrl = service.getBaseUrl();
      
      expect(service.getOrdersEndpoint()).toContain(baseUrl);
      expect(service.getCustomersEndpoint()).toContain(baseUrl);
      expect(service.getProductsEndpoint()).toContain(baseUrl);
      expect(service.getRoutesEndpoint()).toContain(baseUrl);
      expect(service.getWarehousesEndpoint()).toContain(baseUrl);
    });

    it('should not have duplicate slashes in built URLs', () => {
      const url = service.buildUrl('orders', '/123');
      expect(url).not.toContain('//orders');
    });

    it('should properly concatenate base URL and endpoint paths', () => {
      const ordersUrl = service.getOrdersEndpoint();
      const expectedUrl = `${service.getBaseUrl()}${service.getEndpointPath('orders')}`;
      expect(ordersUrl).toBe(expectedUrl);
    });
  });

  describe('Integration Tests', () => {
    it('should allow chaining buildUrl for nested resources', () => {
      const orderId = '123';
      const baseOrderUrl = service.buildUrl('orders', `/${orderId}`);
      expect(baseOrderUrl).toContain(`/orders/${orderId}`);
    });

    it('should work with real-world scenarios', () => {
      // Scenario 1: Get all orders
      const allOrdersUrl = service.buildUrl('orders');
      expect(allOrdersUrl).toBeTruthy();

      // Scenario 2: Get specific order
      const specificOrderUrl = service.buildUrl('orders', '/42');
      expect(specificOrderUrl).toContain('/42');

      // Scenario 3: Get orders with filters
      const filteredOrdersUrl = service.buildUrl('orders', '?status=pending&page=1');
      expect(filteredOrdersUrl).toContain('?status=pending&page=1');
    });

    it('should provide consistent endpoint structure', () => {
      const endpoints = [
        service.getOrdersEndpoint(),
        service.getCustomersEndpoint(),
        service.getProductsEndpoint(),
        service.getRoutesEndpoint(),
        service.getWarehousesEndpoint()
      ];

      endpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^https?:\/\/.+\/.+$/);
        expect(endpoint.split('//').length).toBe(2); // http:// or https:// followed by domain//path would be wrong
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined additional path gracefully', () => {
      const url = service.buildUrl('orders', undefined);
      expect(url).toBe(`${baseUrl}${environment.apiEndpoints.orders}`);
    });

    it('should handle multiple slashes in path', () => {
      const url = service.buildUrl('routes', '//123//waypoints');
      expect(url).toContain('//123//waypoints');
    });

    it('should preserve special characters in path', () => {
      const url = service.buildUrl('orders', '?sort=date&filter=active');
      expect(url).toContain('?sort=date&filter=active');
      expect(url).toContain('&');
    });
  });
});

