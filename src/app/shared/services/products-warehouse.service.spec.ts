import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ProductsWarehouseService, WarehouseProductsResponse } from './products-warehouse.service';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';

describe('ProductsWarehouseService', () => {
  let service: ProductsWarehouseService;
  let apiService: jasmine.SpyObj<ApiService>;
  let endpointsService: jasmine.SpyObj<EndpointsService>;

  const mockWarehouseResponse: WarehouseProductsResponse = {
    warehouse_id: 1,
    warehouse_name: 'Bodega Central',
    warehouse_city: 'Bogotá',
    warehouse_country: 'Colombia',
    warehouse_address: 'Calle 80 #11-42',
    products: [
      {
        id: 1,
        name: 'Paracetamol 500mg',
        description: 'Analgésico',
        purchase_price: 5000,
        storage_instructions: 'Almacenar en lugar seco',
        temperature_range: '15-25°C',
        requires_cold_chain: false,
        supplier_id: 1,
        status: true,
        available_quantity: 150,
        location_identifier: 'A-15-B3'
      }
    ],
    total_products: 1,
    total_quantity: 150
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getDirect']);
    const endpointsServiceSpy = jasmine.createSpyObj('EndpointsService', ['getEndpointPath']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProductsWarehouseService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: EndpointsService, useValue: endpointsServiceSpy }
      ]
    });

    service = TestBed.inject(ProductsWarehouseService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    endpointsService = TestBed.inject(EndpointsService) as jasmine.SpyObj<EndpointsService>;

    endpointsService.getEndpointPath.and.returnValue('/api/products');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProductsByWarehouse', () => {
    it('should return products by warehouse without search term', () => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1').subscribe(response => {
        expect(response).toEqual(mockWarehouseResponse);
        expect(response.warehouse_id).toBe(1);
        expect(response.products.length).toBe(1);
      });

      expect(endpointsService.getEndpointPath).toHaveBeenCalledWith('products');
      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/api/products/warehouse/1',
        {}
      );
    });

    it('should return products by warehouse with search term', () => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1', 'Paracetamol').subscribe(response => {
        expect(response).toEqual(mockWarehouseResponse);
      });

      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/api/products/warehouse/1',
        { name: 'Paracetamol' }
      );
    });

    it('should trim search term before sending', () => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1', '  Paracetamol  ').subscribe();

      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/api/products/warehouse/1',
        { name: 'Paracetamol' }
      );
    });

    it('should not include name parameter when search term is empty', () => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1', '').subscribe();

      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/api/products/warehouse/1',
        {}
      );
    });

    it('should not include name parameter when search term is only whitespace', () => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1', '   ').subscribe();

      expect(apiService.getDirect).toHaveBeenCalledWith(
        '/api/products/warehouse/1',
        {}
      );
    });

    it('should handle errors gracefully', () => {
      const errorResponse = { error: { message: 'Error al obtener productos' } };
      apiService.getDirect.and.returnValue(throwError(() => errorResponse));

      service.getProductsByWarehouse('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.message).toContain('Error');
        }
      });
    });

    it('should update products$ BehaviorSubject when products are loaded', (done) => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1').subscribe(() => {
        service.products$.subscribe(products => {
          expect(products.length).toBe(1);
          expect(products[0].name).toBe('Paracetamol 500mg');
          expect(products[0].id).toBe('1');
          expect(products[0].stock).toBe(150);
          expect(products[0].location_identifier).toBe('A-15-B3');
          done();
        });
      });
    });

    it('should map product data correctly', (done) => {
      apiService.getDirect.and.returnValue(of(mockWarehouseResponse));

      service.getProductsByWarehouse('1').subscribe(() => {
        service.products$.subscribe(products => {
          const product = products[0];
          expect(product.purchase_price).toBe(5000);
          expect(product.requires_cold_chain).toBe(false);
          expect(product.status).toBe(true);
          expect(product.supplier).toBeNull(); // El endpoint de warehouse no incluye información del supplier
          expect(product.supplier_id).toBe(1);
          expect(product.warehouseId).toBe('1');
          done();
        });
      });
    });

    it('should handle product with undefined status', (done) => {
      const responseWithUndefinedStatus: WarehouseProductsResponse = {
        ...mockWarehouseResponse,
        products: [{
          ...mockWarehouseResponse.products[0],
          status: undefined
        }]
      };

      apiService.getDirect.and.returnValue(of(responseWithUndefinedStatus));

      service.getProductsByWarehouse('1').subscribe(() => {
        service.products$.subscribe(products => {
          expect(products[0].status).toBe(true); // Should default to true
          done();
        });
      });
    });

    it('should handle errors with error.message when error.error.message is not available', () => {
      // Simular el error transformado por ApiService
      const errorResponse = new Error('Network or Client Error: Network error');
      apiService.getDirect.and.returnValue(throwError(() => errorResponse));

      service.getProductsByWarehouse('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          // ProductsWarehouseService.handleError extracts the actual message
          expect(error.message).toBe('Network error');
        }
      });
    });

    it('should handle errors with default message when no error message available', () => {
      // Simular el error transformado por ApiService sin mensaje real
      const errorResponse = new Error('Network or Client Error: ');
      apiService.getDirect.and.returnValue(throwError(() => errorResponse));

      service.getProductsByWarehouse('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          // ProductsWarehouseService.handleError should use default message
          expect(error.message).toBe('Ocurrió un error inesperado');
        }
      });
    });
  });
});

