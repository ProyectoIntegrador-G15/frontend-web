import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService, Order, OrderApiResponse } from '../orders.service';
import { environment } from '../../../../environments/environment';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;
  const ordersEndpoint = environment.apiEndpoints.orders;

  const mockOrderApiResponse: OrderApiResponse = {
    id: 1,
    requested_delivery_date: '2025-10-30T00:00:00',
    delivered_at: null,
    client_name: 'Hospital San Rafael',
    state: 'pending',
    country: 'Colombia',
    total_amount: 3000000,
    created_at: '2025-10-23T18:44:17.588946',
    client_id: 1,
    client_address: 'Calle 123 #45-67, Bogotá',
    products: [
      {
        id: 1,
        product_id: 3,
        product_name: 'Insulina Humana',
        quantity: 10,
        unit_price: 300000,
        subtotal: 3000000,
        warehouse_ids: '3'
      }
    ]
  };

  const mockOrdersApiResponse: OrderApiResponse[] = [
    mockOrderApiResponse,
    {
      id: 2,
      requested_delivery_date: '2025-10-31T00:00:00',
      delivered_at: null,
      client_name: 'Clínica Central',
      state: 'in_transit',
      country: 'Colombia',
      total_amount: 4000000,
      created_at: '2025-10-24T00:13:54.095214',
      client_id: 2,
      client_address: 'Av. 68 #25-30, Medellín',
      products: [
        {
          id: 2,
          product_id: 1,
          product_name: 'Paracetamol 500mg',
          quantity: 2000,
          unit_price: 2000,
          subtotal: 4000000,
          warehouse_ids: '1'
        }
      ]
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdersService]
    });

    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrders', () => {
    it('should fetch all orders successfully', () => {
      service.getOrders().subscribe((orders) => {
        expect(orders).toBeTruthy();
        expect(orders.length).toBe(2);
        expect(orders[0].id).toBe('1');
        expect(orders[0].clientName).toBe('Hospital San Rafael');
        expect(orders[0].state).toBe('pending');
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrdersApiResponse);
    });

    it('should handle error when fetching orders fails', () => {
      const errorMessage = 'Error del servidor';

      service.getOrders().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush({ detail: errorMessage }, { status: 500, statusText: 'Server Error' });
    });

    it('should transform API response to frontend format', () => {
      service.getOrders().subscribe((orders) => {
        const order = orders[0];
        expect(order.id).toBe('1');
        expect(order.clientName).toBe('Hospital San Rafael');
        expect(order.clientAddress).toBe('Calle 123 #45-67, Bogotá');
        expect(order.totalAmount).toBe(3000000);
        expect(order.products.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(mockOrdersApiResponse);
    });
  });

  describe('getOrdersByState', () => {
    it('should filter orders by pending state', () => {
      service.getOrdersByState('pending').subscribe((orders) => {
        expect(orders.length).toBe(1);
        expect(orders[0].state).toBe('pending');
        expect(orders[0].clientName).toBe('Hospital San Rafael');
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(mockOrdersApiResponse);
    });

    it('should filter orders by in_transit state', () => {
      service.getOrdersByState('in_transit').subscribe((orders) => {
        expect(orders.length).toBe(1);
        expect(orders[0].state).toBe('in_transit');
        expect(orders[0].clientName).toBe('Clínica Central');
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(mockOrdersApiResponse);
    });

    it('should return empty array when no orders match state', () => {
      service.getOrdersByState('delivered').subscribe((orders) => {
        expect(orders.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(mockOrdersApiResponse);
    });
  });

  describe('getPendingOrders', () => {
    it('should return only pending orders', () => {
      service.getPendingOrders().subscribe((orders) => {
        expect(orders.length).toBe(1);
        expect(orders[0].state).toBe('pending');
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(mockOrdersApiResponse);
    });

    it('should return empty array when no pending orders', () => {
      const deliveredOrders = mockOrdersApiResponse.map(o => ({ ...o, state: 'delivered' as const }));

      service.getPendingOrders().subscribe((orders) => {
        expect(orders.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(deliveredOrders);
    });
  });

  describe('getOrderById', () => {
    it('should fetch a specific order by ID', () => {
      const orderId = '1';

      service.getOrderById(orderId).subscribe((order) => {
        expect(order).toBeTruthy();
        expect(order.id).toBe('1');
        expect(order.clientName).toBe('Hospital San Rafael');
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}/${orderId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrderApiResponse);
    });

    it('should handle error when order not found', () => {
      const orderId = '999';

      service.getOrderById(orderId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}/${orderId}`);
      req.flush({ detail: 'Orden no encontrada' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('formatDate', () => {
    it('should format ISO date to readable format', () => {
      const isoDate = '2025-10-30T00:00:00';
      const formatted = service.formatDate(isoDate);
      
      expect(formatted).toContain('2025');
      expect(formatted).toContain('oct');
    });

    it('should return "No definida" for null date', () => {
      const formatted = service.formatDate(null);
      expect(formatted).toBe('No definida');
    });
  });

  describe('formatCurrency', () => {
    it('should format amount as Colombian Pesos', () => {
      const amount = 3000000;
      const formatted = service.formatCurrency(amount);
      
      expect(formatted).toContain('3.000.000');
      expect(formatted).toContain('$');
    });

    it('should handle zero amount', () => {
      const amount = 0;
      const formatted = service.formatCurrency(amount);
      
      expect(formatted).toContain('0');
      expect(formatted).toContain('$');
    });

    it('should handle decimal amounts correctly', () => {
      const amount = 1500000;
      const formatted = service.formatCurrency(amount);
      
      expect(formatted).toContain('1.500.000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty orders array', () => {
      service.getOrders().subscribe((orders) => {
        expect(orders).toEqual([]);
        expect(orders.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush([]);
    });

    it('should handle orders without requested delivery date', () => {
      const orderWithoutDate = { ...mockOrderApiResponse, requested_delivery_date: null };

      service.getOrderById('1').subscribe((order) => {
        expect(order.requestedDeliveryDate).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}/1`);
      req.flush(orderWithoutDate);
    });

    it('should handle orders with multiple products', () => {
      const orderWithMultipleProducts = {
        ...mockOrderApiResponse,
        products: [
          mockOrderApiResponse.products[0],
          {
            id: 2,
            product_id: 4,
            product_name: 'Producto 2',
            quantity: 5,
            unit_price: 10000,
            subtotal: 50000,
            warehouse_ids: '1'
          }
        ]
      };

      service.getOrderById('1').subscribe((order) => {
        expect(order.products.length).toBe(2);
        expect(order.products[0].product_name).toBe('Insulina Humana');
        expect(order.products[1].product_name).toBe('Producto 2');
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}/1`);
      req.flush(orderWithMultipleProducts);
    });
  });

  describe('Integration Tests', () => {
    it('should successfully fetch and filter pending orders', (done) => {
      service.getPendingOrders().subscribe((orders) => {
        expect(orders.length).toBe(1);
        expect(orders.every(o => o.state === 'pending')).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.flush(mockOrdersApiResponse);
    });

    it('should handle network timeout gracefully', () => {
      service.getOrders().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${ordersEndpoint}`);
      req.error(new ProgressEvent('timeout'));
    });
  });
});

