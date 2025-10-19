import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HttpErrorResponse} from '@angular/common/http';

import {InventoryService} from './inventory.service';
import {ProductInventory} from '../interfaces/inventory.type';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:3002/inventory';

  const mockProductInventory: ProductInventory = {
    product_id: 'MED-001',
    product_name: 'Paracetamol 500mg',
    warehouses: [
      {
        warehouse_id: 'WH-001',
        name: 'Bodega Central Bogotá',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 80 #11-42, Zona Industrial',
        status: 'active',
        available_quantity: 150,
        location_identifier: 'A-15-B3'
      },
      {
        warehouse_id: 'WH-002',
        name: 'Bodega Norte Medellín',
        city: 'Medellín',
        country: 'Colombia',
        address: 'Carrera 50 #30-15, El Poblado',
        status: 'inactive',
        available_quantity: 75,
        location_identifier: 'B-08-C1'
      }
    ],
    total_warehouses: 2,
    total_quantity: 225
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InventoryService]
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct base URL', () => {
    expect(service['baseUrl']).toBe('http://localhost:3002/inventory');
  });

  describe('getProductInventory', () => {
    it('should return product inventory for valid product ID', () => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe({
        next: (inventory) => {
          expect(inventory).toEqual(mockProductInventory);
          expect(inventory.product_id).toBe('MED-001');
          expect(inventory.product_name).toBe('Paracetamol 500mg');
          expect(inventory.warehouses.length).toBe(2);
          expect(inventory.total_warehouses).toBe(2);
          expect(inventory.total_quantity).toBe(225);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`http://localhost:3002/inventory/${productId}`);
      req.flush(mockProductInventory);
    });

    it('should handle different product IDs', () => {
      const productId = 'MED-002';
      const customInventory: ProductInventory = {
        ...mockProductInventory,
        product_id: 'MED-002',
        product_name: 'Insulina Humana Regular'
      };

      service.getProductInventory(productId).subscribe({
        next: (inventory) => {
          expect(inventory.product_id).toBe('MED-002');
          expect(inventory.product_name).toBe('Insulina Humana Regular');
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      expect(req.request.method).toBe('GET');
      req.flush(customInventory);
    });

    it('should handle empty warehouse list', () => {
      const productId = 'MED-999';
      const emptyInventory: ProductInventory = {
        product_id: 'MED-999',
        product_name: 'Producto Sin Inventario',
        warehouses: [],
        total_warehouses: 0,
        total_quantity: 0
      };

      service.getProductInventory(productId).subscribe({
        next: (inventory) => {
          expect(inventory.warehouses).toEqual([]);
          expect(inventory.total_warehouses).toBe(0);
          expect(inventory.total_quantity).toBe(0);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.flush(emptyInventory);
    });

    it('should handle HTTP errors', () => {
      const productId = 'MED-001';
      const errorMessage = 'Product not found';
      const errorStatus = 404;

      service.getProductInventory(productId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(errorStatus);
          expect(error.statusText).toBe(errorMessage);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.flush(errorMessage, {status: errorStatus, statusText: errorMessage});
    });

    it('should handle network errors', () => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe({
        next: () => fail('should have failed with network error'),
        error: (error) => {
          expect(error.error).toBeInstanceOf(ProgressEvent);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.error(new ProgressEvent('network error'));
    });

    it('should handle server errors (500)', () => {
      const productId = 'MED-001';
      const errorMessage = 'Internal Server Error';
      const errorStatus = 500;

      service.getProductInventory(productId).subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(errorStatus);
          expect(error.statusText).toBe(errorMessage);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.flush(errorMessage, {status: errorStatus, statusText: errorMessage});
    });

    it('should handle timeout errors', () => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe({
        next: () => fail('should have failed with timeout error'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.error).toBeInstanceOf(ErrorEvent);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.error(new ErrorEvent('timeout'));
    });

    it('should make correct HTTP request', () => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe();

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`http://localhost:3002/inventory/${productId}`);
      expect(req.request.headers.get('Content-Type')).toBeNull();

      req.flush(mockProductInventory);
    });

    it('should handle special characters in product ID', () => {
      const productId = 'MED-001-SPECIAL';

      service.getProductInventory(productId).subscribe({
        next: (inventory) => {
          expect(inventory).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      expect(req.request.url).toBe(`http://localhost:3002/inventory/${productId}`);
      req.flush(mockProductInventory);
    });

    it('should handle empty product ID', () => {
      const productId = '';

      service.getProductInventory(productId).subscribe({
        next: (inventory) => {
          expect(inventory).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/`);
      expect(req.request.url).toBe(`http://localhost:3002/inventory/`);
      req.flush(mockProductInventory);
    });
  });

  describe('Service Configuration', () => {
    it('should have correct base URL', () => {
      expect(service['baseUrl']).toBe('http://localhost:3002/inventory');
    });

    it('should be provided in root', () => {
      const serviceInstance = TestBed.inject(InventoryService);
      expect(serviceInstance).toBeTruthy();
      expect(serviceInstance).toBe(service);
    });
  });

  describe('Observable Behavior', () => {
    it('should return an Observable', () => {
      const productId = 'MED-001';
      const result = service.getProductInventory(productId);

      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });

    it('should complete after successful request', () => {
      const productId = 'MED-001';
      let completed = false;

      service.getProductInventory(productId).subscribe({
        next: () => {
        },
        complete: () => {
          completed = true;
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.flush(mockProductInventory);

      expect(completed).toBe(true);
    });

    it('should handle multiple concurrent requests', () => {
      const productId1 = 'MED-001';
      const productId2 = 'MED-002';

      service.getProductInventory(productId1).subscribe();
      service.getProductInventory(productId2).subscribe();

      const req1 = httpMock.expectOne(`http://localhost:3002/inventory/${productId1}`);
      const req2 = httpMock.expectOne(`http://localhost:3002/inventory/${productId2}`);

      expect(req1.request.url).toBe(`http://localhost:3002/inventory/${productId1}`);
      expect(req2.request.url).toBe(`http://localhost:3002/inventory/${productId2}`);

      req1.flush(mockProductInventory);
      req2.flush(mockProductInventory);
    });
  });

  describe('Data Validation', () => {
    it('should handle malformed JSON response', () => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe({
        next: () => fail('should have failed with malformed JSON'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.error(new ErrorEvent('parse error', {
        message: 'Unexpected token i in JSON at position 0'
      }));
    });

    it('should handle null response', () => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe({
        next: (inventory) => {
          expect(inventory).toBeNull();
        }
      });

      const req = httpMock.expectOne(`http://localhost:3002/inventory/${productId}`);
      req.flush(null);
    });
  });
});
