import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WarehousesService, Warehouse } from './warehouses.service';
import { environment } from '../../../environments/environment';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let httpMock: HttpTestingController;

  const mockWarehouses: Warehouse[] = [
    {
      id: 1,
      name: 'Bodega Central',
      city: 'Bogotá',
      country: 'Colombia',
      address: 'Calle 123 #45-67',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    },
    {
      id: 2,
      name: 'Bodega Sur',
      city: 'Cali',
      country: 'Colombia',
      address: 'Avenida 5 #10-20',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    },
    {
      id: 3,
      name: 'Bodega Norte',
      city: 'Medellín',
      country: 'Colombia',
      address: 'Carrera 50 #30-40',
      status: 'maintenance',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    },
    {
      id: 4,
      name: 'Bodega Este',
      city: 'Barranquilla',
      country: 'Colombia',
      address: 'Calle 80 #20-30',
      status: 'inactive',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WarehousesService]
    });
    service = TestBed.inject(WarehousesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya solicitudes HTTP pendientes
  });

  // ========================================
  // SERVICE CREATION TESTS
  // ========================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ========================================
  // GET WAREHOUSES TESTS
  // ========================================

  describe('getWarehouses', () => {
    it('should retrieve warehouses from the API', (done) => {
      service.getWarehouses().subscribe({
        next: (warehouses) => {
          expect(warehouses).toEqual(mockWarehouses);
          expect(warehouses.length).toBe(4);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockWarehouses);
    });

    it('should update warehousesSubject when retrieving warehouses', (done) => {
      let emittedWarehouses: Warehouse[] | null = null;

      // Subscribe to warehouses$ observable
      service.warehouses$.subscribe(warehouses => {
        emittedWarehouses = warehouses;
      });

      service.getWarehouses().subscribe({
        next: (warehouses) => {
          expect(emittedWarehouses).toEqual(mockWarehouses);
          expect(warehouses).toEqual(mockWarehouses);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });

    it('should return empty array when API returns empty', (done) => {
      service.getWarehouses().subscribe({
        next: (warehouses) => {
          expect(warehouses).toEqual([]);
          expect(warehouses.length).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush([]);
    });

    it('should update subject with empty array when API returns empty', (done) => {
      let emittedWarehouses: Warehouse[] | null = null;

      service.warehouses$.subscribe(warehouses => {
        emittedWarehouses = warehouses;
      });

      service.getWarehouses().subscribe({
        next: () => {
          expect(emittedWarehouses).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush([]);
    });
  });

  // ========================================
  // GET ACTIVE WAREHOUSES TESTS
  // ========================================

  describe('getActiveWarehouses', () => {
    it('should filter and return only active warehouses', (done) => {
      // First populate the subject
      service.warehouses$.subscribe(); // Subscribe to initialize

      service.getWarehouses().subscribe({
        next: () => {
          // Now get active warehouses
          service.getActiveWarehouses().subscribe({
            next: (activeWarehouses) => {
              expect(activeWarehouses.length).toBe(2);
              expect(activeWarehouses.every(w => w.status === 'active')).toBe(true);
              expect(activeWarehouses[0].name).toBe('Bodega Central');
              expect(activeWarehouses[1].name).toBe('Bodega Sur');
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });

    it('should return empty array when no active warehouses exist', (done) => {
      const inactiveWarehouses: Warehouse[] = [
        {
          id: 1,
          name: 'Bodega Inactiva',
          city: 'Bogotá',
          country: 'Colombia',
          address: 'Calle 1',
          status: 'inactive',
          created_at: '2025-10-13T00:00:00',
          updated_at: '2025-10-13T00:00:00'
        }
      ];

      service.getWarehouses().subscribe({
        next: () => {
          service.getActiveWarehouses().subscribe({
            next: (activeWarehouses) => {
              expect(activeWarehouses).toEqual([]);
              expect(activeWarehouses.length).toBe(0);
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(inactiveWarehouses);
    });

    it('should return empty array when warehouses subject is empty', (done) => {
      service.getActiveWarehouses().subscribe({
        next: (activeWarehouses) => {
          expect(activeWarehouses).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should exclude maintenance and inactive warehouses', (done) => {
      service.getWarehouses().subscribe({
        next: () => {
          service.getActiveWarehouses().subscribe({
            next: (activeWarehouses) => {
              const hasMaintenanceWarehouse = activeWarehouses.some(w => w.status === 'maintenance');
              const hasInactiveWarehouse = activeWarehouses.some(w => w.status === 'inactive');

              expect(hasMaintenanceWarehouse).toBe(false);
              expect(hasInactiveWarehouse).toBe(false);
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });

    it('should return all warehouses when all are active', (done) => {
      const allActiveWarehouses: Warehouse[] = mockWarehouses.map(w => ({
        ...w,
        status: 'active'
      }));

      service.getWarehouses().subscribe({
        next: () => {
          service.getActiveWarehouses().subscribe({
            next: (activeWarehouses) => {
              expect(activeWarehouses.length).toBe(allActiveWarehouses.length);
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(allActiveWarehouses);
    });
  });

  // ========================================
  // WAREHOUSES$ OBSERVABLE TESTS
  // ========================================

  describe('warehouses$ observable', () => {
    it('should emit initial empty array', (done) => {
      service.warehouses$.subscribe({
        next: (warehouses) => {
          expect(warehouses).toEqual([]);
          done();
        }
      });
    });

    it('should emit updated warehouses when getWarehouses is called', (done) => {
      let emissionCount = 0;
      const emissions: Warehouse[][] = [];

      service.warehouses$.subscribe({
        next: (warehouses) => {
          emissions.push(warehouses);
          emissionCount++;

          if (emissionCount === 2) {
            expect(emissions[0]).toEqual([]); // Initial emission
            expect(emissions[1]).toEqual(mockWarehouses); // After getWarehouses
            done();
          }
        }
      });

      service.getWarehouses().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });

    it('should emit multiple times when getWarehouses is called multiple times', (done) => {
      const emissions: Warehouse[][] = [];
      const firstBatch = [mockWarehouses[0]];
      const secondBatch = [mockWarehouses[0], mockWarehouses[1]];

      service.warehouses$.subscribe({
        next: (warehouses) => {
          emissions.push([...warehouses]);
        }
      });

      service.getWarehouses().subscribe(() => {
        service.getWarehouses().subscribe(() => {
          expect(emissions.length).toBeGreaterThanOrEqual(3);
          expect(emissions[1]).toEqual(firstBatch);
          expect(emissions[2]).toEqual(secondBatch);
          done();
        });

        const req2 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
        req2.flush(secondBatch);
      });

      const req1 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req1.flush(firstBatch);
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe('Integration tests', () => {
    it('should get all warehouses and then filter active ones', (done) => {
      service.getWarehouses().subscribe({
        next: (allWarehouses) => {
          expect(allWarehouses.length).toBe(4);

          service.getActiveWarehouses().subscribe({
            next: (activeWarehouses) => {
              expect(activeWarehouses.length).toBe(2);
              expect(activeWarehouses.every(w => w.status === 'active')).toBe(true);
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });

    it('should handle consecutive getWarehouses calls', (done) => {
      // First call
      service.getWarehouses().subscribe({
        next: (warehouses1) => {
          expect(warehouses1.length).toBe(2);

          // Second call
          service.getWarehouses().subscribe({
            next: (warehouses2) => {
              expect(warehouses2.length).toBe(4);
              done();
            },
            error: done.fail
          });

          const req2 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
          req2.flush(mockWarehouses);
        },
        error: done.fail
      });

      const req1 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req1.flush([mockWarehouses[0], mockWarehouses[1]]);
    });
  });

  // ========================================
  // URL CONSTRUCTION TESTS
  // ========================================

  describe('API URL construction', () => {
    it('should use correct URL for getWarehouses', () => {
      service.getWarehouses().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      expect(req.request.url).toBe(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush([]);
    });

    it('should construct URL from environment variables', () => {
      const expectedUrl = `${environment.apiUrl}${environment.apiEndpoints.warehouses}`;

      service.getWarehouses().subscribe();

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.url).toBe(expectedUrl);
      req.flush([]);
    });
  });

  // ========================================
  // EDGE CASES TESTS
  // ========================================

  describe('Edge cases', () => {
    it('should handle null response gracefully', (done) => {
      service.getWarehouses().subscribe({
        next: (warehouses) => {
          expect(warehouses).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(null);
    });

    it('should handle very large warehouses-list list', (done) => {
      const largeWarehouseList: Warehouse[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Bodega ${i + 1}`,
        city: `Ciudad ${i + 1}`,
        country: 'Colombia',
        address: `Dirección ${i + 1}`,
        status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'maintenance',
        created_at: '2025-10-13T00:00:00',
        updated_at: '2025-10-13T00:00:00'
      }));

      service.getWarehouses().subscribe({
        next: (warehouses) => {
          expect(warehouses.length).toBe(1000);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(largeWarehouseList);
    });

    it('should filter large list to get only active warehouses', (done) => {
      const largeWarehouseList: Warehouse[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Bodega ${i + 1}`,
        city: `Ciudad ${i + 1}`,
        country: 'Colombia',
        address: `Dirección ${i + 1}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        created_at: '2025-10-13T00:00:00',
        updated_at: '2025-10-13T00:00:00'
      }));

      service.getWarehouses().subscribe({
        next: () => {
          service.getActiveWarehouses().subscribe({
            next: (activeWarehouses) => {
              expect(activeWarehouses.length).toBe(50); // Half should be active
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(largeWarehouseList);
    });

    it('should handle warehouses with special characters in names', (done) => {
      const specialWarehouses: Warehouse[] = [
        {
          id: 1,
          name: 'Bodega "Especial" & Única',
          city: 'Bogotá',
          country: 'Colombia',
          address: 'Calle 123 #45-67 <Main>',
          status: 'active',
          created_at: '2025-10-13T00:00:00',
          updated_at: '2025-10-13T00:00:00'
        }
      ];

      service.getWarehouses().subscribe({
        next: (warehouses) => {
          expect(warehouses[0].name).toContain('"Especial"');
          expect(warehouses[0].address).toContain('<Main>');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(specialWarehouses);
    });
  });

  // ========================================
  // MULTIPLE SUBSCRIPTIONS TESTS
  // ========================================

  describe('Multiple subscriptions', () => {
    it('should support multiple subscribers to warehouses$', (done) => {
      let subscriber1Received = false;
      let subscriber2Received = false;
      let subscriber1Data: Warehouse[] = [];
      let subscriber2Data: Warehouse[] = [];

      service.warehouses$.subscribe(warehouses => {
        if (warehouses.length > 0) {
          subscriber1Received = true;
          subscriber1Data = warehouses;
          checkCompletion();
        }
      });

      service.warehouses$.subscribe(warehouses => {
        if (warehouses.length > 0) {
          subscriber2Received = true;
          subscriber2Data = warehouses;
          checkCompletion();
        }
      });

      function checkCompletion() {
        if (subscriber1Received && subscriber2Received) {
          expect(subscriber1Received).toBe(true);
          expect(subscriber2Received).toBe(true);
          expect(subscriber1Data.length).toBe(mockWarehouses.length);
          expect(subscriber2Data.length).toBe(mockWarehouses.length);
          expect(subscriber1Data).toEqual(subscriber2Data);
          done();
        }
      }

      service.getWarehouses().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });

    it('should emit same data to all subscribers', (done) => {
      let emissions1: Warehouse[][] = [];
      let emissions2: Warehouse[][] = [];

      service.warehouses$.subscribe(warehouses => {
        emissions1.push([...warehouses]);
      });

      service.warehouses$.subscribe(warehouses => {
        emissions2.push([...warehouses]);
      });

      service.getWarehouses().subscribe({
        next: () => {
          expect(emissions1).toEqual(emissions2);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush(mockWarehouses);
    });
  });

  // ========================================
  // STATE MANAGEMENT TESTS
  // ========================================

  describe('State management', () => {
    it('should maintain state across multiple calls', (done) => {
      service.getWarehouses().subscribe(() => {
        service.warehouses$.subscribe(warehouses => {
          expect(warehouses.length).toBe(2);
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req.flush([mockWarehouses[0], mockWarehouses[1]]);
    });

    it('should update state when new data is fetched', (done) => {
      const emissions: Warehouse[][] = [];

      service.warehouses$.subscribe(warehouses => {
        emissions.push([...warehouses]);
      });

      // First call
      service.getWarehouses().subscribe(() => {
        // Second call with different data
        service.getWarehouses().subscribe(() => {
          expect(emissions.length).toBe(3); // Initial + 2 updates
          expect(emissions[1].length).toBe(1);
          expect(emissions[2].length).toBe(2);
          done();
        });

        const req2 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
        req2.flush([mockWarehouses[0], mockWarehouses[1]]);
      });

      const req1 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      req1.flush([mockWarehouses[0]]);
    });
  });

  // ========================================
  // HTTP REQUEST TESTS
  // ========================================

  describe('HTTP request details', () => {
    it('should send GET request with correct method', () => {
      service.getWarehouses().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.warehouses}`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  // ========================================
  // GET WAREHOUSES PAGINATED TESTS
  // ========================================

  describe('getWarehousesPaginated', () => {
    const mockPaginatedResponse = {
      warehouses: mockWarehouses,
      total: 4,
      total_pages: 1,
      page: 1,
      page_size: 5
    };

    it('should retrieve paginated warehouses', (done) => {
      service.getWarehousesPaginated(1).subscribe({
        next: (response) => {
          expect(response.warehouses).toEqual(mockWarehouses);
          expect(response.total).toBe(4);
          expect(response.page).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(req => req.url.includes('/warehouses') && req.params.get('page') === '1');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should include name filter in request', (done) => {
      service.getWarehousesPaginated(1, 'Bodega').subscribe({
        next: (response) => {
          expect(response.warehouses.length).toBeGreaterThan(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/warehouses') && 
        req.params.get('page') === '1' &&
        req.params.get('name') === 'Bodega'
      );
      req.flush(mockPaginatedResponse);
    });

    it('should include country filter in request', (done) => {
      service.getWarehousesPaginated(1, undefined, 'Colombia').subscribe({
        next: (response) => {
          expect(response.warehouses.length).toBeGreaterThan(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/warehouses') && 
        req.params.get('page') === '1' &&
        req.params.get('country') === 'Colombia'
      );
      req.flush(mockPaginatedResponse);
    });

    it('should include both name and country filters', (done) => {
      service.getWarehousesPaginated(1, 'Bodega', 'Colombia').subscribe({
        next: (response) => {
          expect(response.warehouses.length).toBeGreaterThan(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/warehouses') && 
        req.params.get('page') === '1' &&
        req.params.get('name') === 'Bodega' &&
        req.params.get('country') === 'Colombia'
      );
      req.flush(mockPaginatedResponse);
    });

  });

  // ========================================
  // CREATE WAREHOUSE TESTS
  // ========================================

  describe('createWarehouse', () => {
    const newWarehouse = {
      name: 'Bodega Nueva',
      city: 'Bogotá',
      country: 'Colombia',
      address: 'Calle 123 #45-67'
    };

    const createdWarehouse: Warehouse = {
      id: 5,
      name: 'Bodega Nueva',
      city: 'Bogotá',
      country: 'Colombia',
      address: 'Calle 123 #45-67',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    };

    it('should create a new warehouse', (done) => {
      service.createWarehouse(newWarehouse).subscribe({
        next: (warehouse) => {
          expect(warehouse.name).toBe(newWarehouse.name);
          expect(warehouse.city).toBe(newWarehouse.city);
          expect(warehouse.country).toBe(newWarehouse.country);
          expect(warehouse.address).toBe(newWarehouse.address);
          done();
        },
        error: done.fail
      });

      // Mock de la petición POST para crear la bodega
      const postReq = httpMock.expectOne(
        req => req.method === 'POST' && req.url === `${environment.apiUrl}${environment.apiEndpoints.warehouses}`
      );
      expect(postReq.request.body).toEqual(newWarehouse);
      postReq.flush(createdWarehouse);

      // Mock de la petición GET que se hace en refreshWarehouses()
      const getReq = httpMock.expectOne(
        req => req.method === 'GET' && req.url === `${environment.apiUrl}${environment.apiEndpoints.warehouses}`
      );
      getReq.flush(mockWarehouses);
    });

    it('should handle error when creating warehouse', (done) => {
      service.createWarehouse(newWarehouse).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(
        req => req.method === 'POST' && req.url === `${environment.apiUrl}${environment.apiEndpoints.warehouses}`
      );
      req.flush(
        { detail: 'Error creating warehouse' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle duplicate name error', (done) => {
      service.createWarehouse(newWarehouse).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Ya existe');
          done();
        }
      });

      const req = httpMock.expectOne(
        req => req.method === 'POST' && req.url === `${environment.apiUrl}${environment.apiEndpoints.warehouses}`
      );
      req.flush(
        { detail: 'Ya existe una bodega con ese nombre.' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });
});

