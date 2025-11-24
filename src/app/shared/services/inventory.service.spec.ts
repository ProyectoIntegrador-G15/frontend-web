import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {HttpErrorResponse} from '@angular/common/http';

import {InventoryService} from './inventory.service';
import {ProductInventory} from '../interfaces/inventory.type';
import { environment } from '../../../environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

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


  describe('getProductInventory', () => {
    it('should return product inventory for valid product ID', fakeAsync(() => {
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

      tick(); // Procesar operaciones asíncronas

      const req = httpMock.expectOne(`${environment.apiUrl}/products/${productId}/inventory`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`${environment.apiUrl}/products/${productId}/inventory`);
      req.flush(mockProductInventory);
    }));

    it('should handle different product IDs', fakeAsync(() => {
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

      const req = httpMock.expectOne(`${environment.apiUrl}/products/${productId}/inventory`);
      expect(req.request.method).toBe('GET');
      req.flush(customInventory);

      tick(); // Procesar operaciones asíncronas después del flush
    }));

    it('should handle empty warehouses-list list', fakeAsync(() => {
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

      const req = httpMock.expectOne(`${environment.apiUrl}/products/${productId}/inventory`);
      req.flush(emptyInventory);

      tick(); // Procesar operaciones asíncronas después del flush
    }));

    it('should make correct HTTP request', fakeAsync(() => {
      const productId = 'MED-001';

      service.getProductInventory(productId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/products/${productId}/inventory`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`${environment.apiUrl}/products/${productId}/inventory`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockProductInventory);

      tick(); // Procesar operaciones asíncronas después del flush
    }));


  });

  describe('Service Configuration', () => {
    it('should be provided in root', () => {
      const serviceInstance = TestBed.inject(InventoryService);
      expect(serviceInstance).toBeTruthy();
      expect(serviceInstance).toBe(service);
    });
  });

  describe('Observable Behavior', () => {
    it('should complete after successful request', fakeAsync(() => {
      const productId = 'MED-001';
      let completed = false;

      service.getProductInventory(productId).subscribe({
        next: () => {
        },
        complete: () => {
          completed = true;
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/products/${productId}/inventory`);
      req.flush(mockProductInventory);

      tick(); // Procesar operaciones asíncronas después del flush

      expect(completed).toBe(true);
    }));
  });

});
