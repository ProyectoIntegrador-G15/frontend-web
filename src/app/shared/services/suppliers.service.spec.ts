import { TestBed } from '@angular/core/testing';
import { SuppliersService, Supplier, SupplierPaginatedResponse } from './suppliers.service';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';
import { of, throwError } from 'rxjs';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let apiService: jasmine.SpyObj<ApiService>;
  let endpointsService: jasmine.SpyObj<EndpointsService>;

  const mockSuppliers: Supplier[] = [
    {
      id: 1,
      name: 'Supplier 1',
      nit: '123456789',
      status: 'active',
      email: 'supplier1@test.com',
      country: 'Colombia',
      city: 'Bogotá',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Supplier 2',
      nit: '987654321',
      status: 'active',
      email: 'supplier2@test.com',
      country: 'Colombia',
      city: 'Medellín',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockPaginatedResponse: SupplierPaginatedResponse = {
    suppliers: mockSuppliers,
    total: 2,
    total_pages: 1,
    page: 1,
    page_size: 10
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['getDirect', 'postDirect']);
    const endpointsServiceSpy = jasmine.createSpyObj('EndpointsService', ['getEndpointPath']);

    TestBed.configureTestingModule({
      providers: [
        SuppliersService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: EndpointsService, useValue: endpointsServiceSpy }
      ]
    });

    service = TestBed.inject(SuppliersService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    endpointsService = TestBed.inject(EndpointsService) as jasmine.SpyObj<EndpointsService>;

    endpointsService.getEndpointPath.and.returnValue('/api/suppliers');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSuppliersPaginated', () => {
    it('should fetch suppliers with default parameters', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.getSuppliersPaginated().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(apiService.getDirect).toHaveBeenCalledWith('/api/suppliers', { page: '1' });
        expect(endpointsService.getEndpointPath).toHaveBeenCalledWith('suppliers');
        done();
      });

      service.suppliers$.subscribe(suppliers => {
        expect(suppliers).toEqual(mockSuppliers);
      });
    });

    it('should fetch suppliers with page parameter', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.getSuppliersPaginated(2).subscribe(response => {
        expect(apiService.getDirect).toHaveBeenCalledWith('/api/suppliers', { page: '2' });
        done();
      });
    });

    it('should fetch suppliers with search parameter', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.getSuppliersPaginated(1, 'test').subscribe(response => {
        expect(apiService.getDirect).toHaveBeenCalledWith('/api/suppliers', { page: '1', search: 'test' });
        done();
      });
    });

    it('should fetch suppliers with country parameter', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.getSuppliersPaginated(1, undefined, 'Colombia').subscribe(response => {
        expect(apiService.getDirect).toHaveBeenCalledWith('/api/suppliers', { page: '1', country: 'Colombia' });
        done();
      });
    });

    it('should fetch suppliers with all parameters', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.getSuppliersPaginated(1, 'test', 'Colombia').subscribe(response => {
        expect(apiService.getDirect).toHaveBeenCalledWith('/api/suppliers', {
          page: '1',
          search: 'test',
          country: 'Colombia'
        });
        done();
      });
    });

    it('should trim search and country parameters', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.getSuppliersPaginated(1, '  test  ', '  Colombia  ').subscribe(response => {
        expect(apiService.getDirect).toHaveBeenCalledWith('/api/suppliers', {
          page: '1',
          search: 'test',
          country: 'Colombia'
        });
        done();
      });
    });

    it('should handle errors', (done) => {
      const error = new Error('API Error');
      apiService.getDirect.and.returnValue(throwError(() => error));

      service.getSuppliersPaginated().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should update suppliers$ observable', (done) => {
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.suppliers$.subscribe(suppliers => {
        if (suppliers.length > 0) {
          expect(suppliers).toEqual(mockSuppliers);
          done();
        }
      });

      service.getSuppliersPaginated().subscribe();
    });
  });

  describe('createSupplier', () => {
    const newSupplierData = {
      name: 'New Supplier',
      nit: '111222333',
      email: 'new@test.com',
      country: 'Colombia',
      city: 'Bogotá'
    };

    const createdSupplier: Supplier = {
      id: 3,
      ...newSupplierData,
      status: 'active',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    };

    it('should create a new supplier', (done) => {
      apiService.postDirect.and.returnValue(of(createdSupplier));
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.createSupplier(newSupplierData).subscribe(response => {
        expect(response).toEqual(createdSupplier);
        expect(apiService.postDirect).toHaveBeenCalledWith('/api/suppliers', newSupplierData);
        expect(endpointsService.getEndpointPath).toHaveBeenCalledWith('suppliers');
        done();
      });
    });

    it('should refresh suppliers after creating', (done) => {
      apiService.postDirect.and.returnValue(of(createdSupplier));
      apiService.getDirect.and.returnValue(of(mockPaginatedResponse));

      service.createSupplier(newSupplierData).subscribe(() => {
        expect(apiService.getDirect).toHaveBeenCalled();
        done();
      });
    });

    it('should handle errors when creating supplier', (done) => {
      const error = new Error('Creation failed');
      apiService.postDirect.and.returnValue(throwError(() => error));

      service.createSupplier(newSupplierData).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('suppliers$ observable', () => {
    it('should emit empty array initially', (done) => {
      service.suppliers$.subscribe(suppliers => {
        expect(suppliers).toEqual([]);
        done();
      });
    });
  });
});

