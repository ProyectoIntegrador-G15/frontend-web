import { TestBed } from '@angular/core/testing';
import { OrdersService, OrderApiResponse, Order, TopProductSales } from './orders.service';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';
import { of, throwError } from 'rxjs';

describe('OrdersService', () => {
  let service: OrdersService;
  let apiService: jasmine.SpyObj<ApiService>;
  let endpointsService: jasmine.SpyObj<EndpointsService>;

  const mockOrdersApiResponse: OrderApiResponse[] = [
    {
      id: 1,
      requested_delivery_date: '2025-11-25',
      delivered_at: null,
      client_name: 'Cliente Test 1',
      state: 'pending',
      country: 'Colombia',
      total_amount: 150000,
      created_at: '2025-11-20',
      client_id: 1,
      client_address: 'Calle 123 #45-67',
      products: [
        {
          id: 1,
          product_id: 1,
          product_name: 'Producto 1',
          quantity: 10,
          unit_price: 15000,
          subtotal: 150000,
          warehouse_ids: '1,2'
        }
      ]
    },
    {
      id: 2,
      requested_delivery_date: '2025-11-26',
      delivered_at: '2025-11-26',
      client_name: 'Cliente Test 2',
      state: 'delivered',
      country: 'Colombia',
      total_amount: 200000,
      created_at: '2025-11-21',
      client_id: 2,
      client_address: 'Carrera 50 #30-40',
      products: []
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getDirect']);
    const endpointsServiceSpy = jasmine.createSpyObj('EndpointsService', ['getEndpointPath']);

    TestBed.configureTestingModule({
      providers: [
        OrdersService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: EndpointsService, useValue: endpointsServiceSpy }
      ]
    });

    service = TestBed.inject(OrdersService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    endpointsService = TestBed.inject(EndpointsService) as jasmine.SpyObj<EndpointsService>;

    endpointsService.getEndpointPath.and.returnValue('/orders');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrders', () => {
    it('should fetch and transform all orders', (done) => {
      apiService.getDirect.and.returnValue(of(mockOrdersApiResponse));

      service.getOrders().subscribe(orders => {
        expect(orders.length).toBe(2);
        expect(orders[0].id).toBe('1');
        expect(orders[0].clientName).toBe('Cliente Test 1');
        expect(orders[0].requestedDeliveryDate).toBe('2025-11-25');
        done();
      });
    });

    it('should handle error when fetching orders', (done) => {
      const error = { error: { detail: 'Error al obtener órdenes' } };
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getOrders().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toContain('Error al obtener órdenes');
          done();
        }
      });
    });
  });

  describe('getOrdersByState', () => {
    it('should return only pending orders', (done) => {
      apiService.getDirect.and.returnValue(of(mockOrdersApiResponse));

      service.getOrdersByState('pending').subscribe(orders => {
        expect(orders.length).toBe(1);
        expect(orders[0].state).toBe('pending');
        done();
      });
    });

    it('should return only delivered orders', (done) => {
      apiService.getDirect.and.returnValue(of(mockOrdersApiResponse));

      service.getOrdersByState('delivered').subscribe(orders => {
        expect(orders.length).toBe(1);
        expect(orders[0].state).toBe('delivered');
        done();
      });
    });

    it('should return empty array when no orders match state', (done) => {
      apiService.getDirect.and.returnValue(of(mockOrdersApiResponse));

      service.getOrdersByState('in_transit').subscribe(orders => {
        expect(orders.length).toBe(0);
        done();
      });
    });
  });

  describe('getPendingOrders', () => {
    it('should return only pending orders', (done) => {
      apiService.getDirect.and.returnValue(of(mockOrdersApiResponse));

      service.getPendingOrders().subscribe(orders => {
        expect(orders.length).toBe(1);
        expect(orders[0].state).toBe('pending');
        done();
      });
    });
  });

  describe('getOrderById', () => {
    it('should fetch and transform a single order', (done) => {
      apiService.getDirect.and.returnValue(of(mockOrdersApiResponse[0]));

      service.getOrderById('1').subscribe(order => {
        expect(order.id).toBe('1');
        expect(order.clientName).toBe('Cliente Test 1');
        expect(order.products.length).toBe(1);
        done();
      });

      expect(endpointsService.getEndpointPath).toHaveBeenCalledWith('orders');
    });

    it('should handle error when order not found', (done) => {
      const error = { error: { detail: 'Orden no encontrada' } };
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getOrderById('999').subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toContain('Orden no encontrada');
          done();
        }
      });
    });
  });

  describe('getTopProductsBySeller', () => {
    const mockTopProducts: TopProductSales[] = [
      {
        product_id: 1,
        product_name: 'Producto Top 1',
        total_quantity: 100,
        total_sales_amount: 1000000
      },
      {
        product_id: 2,
        product_name: 'Producto Top 2',
        total_quantity: 80,
        total_sales_amount: 800000
      }
    ];

    it('should fetch top products for a seller', (done) => {
      apiService.getDirect.and.returnValue(of(mockTopProducts));

      service.getTopProductsBySeller(1).subscribe(products => {
        expect(products.length).toBe(2);
        expect(products[0].product_name).toBe('Producto Top 1');
        expect(products[0].total_quantity).toBe(100);
        done();
      });

      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/orders/top-products-by-seller',
        { seller_id: '1' }
      );
    });

    it('should include date range when provided', (done) => {
      apiService.getDirect.and.returnValue(of(mockTopProducts));

      service.getTopProductsBySeller(1, '2025-01-01', '2025-12-31').subscribe(() => {
        done();
      });

      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/orders/top-products-by-seller',
        { seller_id: '1', start_date: '2025-01-01', end_date: '2025-12-31' }
      );
    });

    it('should not include dates when not provided', (done) => {
      apiService.getDirect.and.returnValue(of(mockTopProducts));

      service.getTopProductsBySeller(5).subscribe(() => {
        done();
      });

      const callArgs = apiService.getDirect.calls.mostRecent().args[1];
      expect(callArgs.start_date).toBeUndefined();
      expect(callArgs.end_date).toBeUndefined();
    });

    it('should handle error when fetching top products', (done) => {
      const error = { error: { detail: 'Error al obtener productos' } };
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getTopProductsBySeller(1).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toContain('Error al obtener productos');
          done();
        }
      });
    });
  });

  describe('formatDate', () => {
    it('should format valid ISO date', () => {
      const isoDate = '2025-11-21T10:30:00';
      const formatted = service.formatDate(isoDate);
      
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('No definida');
    });

    it('should return "No definida" for null', () => {
      expect(service.formatDate(null)).toBe('No definida');
    });

    it('should format date in Spanish locale', () => {
      const isoDate = '2025-11-21';
      const formatted = service.formatDate(isoDate);
      
      expect(formatted).toContain('nov');
      expect(formatted).toContain('2025');
    });
  });

  describe('formatCurrency', () => {
    it('should format amount as Colombian pesos', () => {
      const formatted = service.formatCurrency(150000);
      
      expect(formatted).toContain('150');
      expect(formatted).toContain('000');
    });

    it('should format zero correctly', () => {
      const formatted = service.formatCurrency(0);
      
      expect(formatted).toBeTruthy();
    });

    it('should format negative amounts', () => {
      const formatted = service.formatCurrency(-50000);
      
      expect(formatted).toContain('50');
    });

    it('should format large amounts', () => {
      const formatted = service.formatCurrency(1000000000);
      
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
    });
  });

  describe('error handling', () => {
    it('should handle error with detail property', (done) => {
      const error = { error: { detail: 'Error específico' } };
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getOrders().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Error específico');
          done();
        }
      });
    });

    it('should handle error with message property', (done) => {
      const error = { error: { message: 'Error genérico' } };
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getOrders().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Error genérico');
          done();
        }
      });
    });

    it('should handle error with only message at root level', (done) => {
      const error = { message: 'Error simple' };
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getOrders().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Error simple');
          done();
        }
      });
    });

    it('should use default error message when no specific message available', (done) => {
      const error = {};
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getOrders().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Ocurrió un error al procesar la solicitud');
          done();
        }
      });
    });
  });

  describe('transformOrder', () => {
    it('should correctly transform API response to frontend format', (done) => {
      apiService.getDirect.and.returnValue(of([mockOrdersApiResponse[0]]));

      service.getOrders().subscribe(orders => {
        const order = orders[0];
        
        expect(order.id).toBe('1');
        expect(order.requestedDeliveryDate).toBe('2025-11-25');
        expect(order.deliveredAt).toBeNull();
        expect(order.clientName).toBe('Cliente Test 1');
        expect(order.state).toBe('pending');
        expect(order.country).toBe('Colombia');
        expect(order.totalAmount).toBe(150000);
        expect(order.createdAt).toBe('2025-11-20');
        expect(order.clientId).toBe(1);
        expect(order.clientAddress).toBe('Calle 123 #45-67');
        expect(order.products.length).toBe(1);
        done();
      });
    });

    it('should preserve product details in transformation', (done) => {
      apiService.getDirect.and.returnValue(of([mockOrdersApiResponse[0]]));

      service.getOrders().subscribe(orders => {
        const product = orders[0].products[0];
        
        expect(product.id).toBe(1);
        expect(product.product_id).toBe(1);
        expect(product.product_name).toBe('Producto 1');
        expect(product.quantity).toBe(10);
        expect(product.unit_price).toBe(15000);
        expect(product.subtotal).toBe(150000);
        expect(product.warehouse_ids).toBe('1,2');
        done();
      });
    });

    it('should handle orders with empty products array', (done) => {
      apiService.getDirect.and.returnValue(of([mockOrdersApiResponse[1]]));

      service.getOrders().subscribe(orders => {
        expect(orders[0].products).toEqual([]);
        expect(orders[0].products.length).toBe(0);
        done();
      });
    });
  });
});

