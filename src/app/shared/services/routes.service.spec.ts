import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoutesService, RouteApiResponse, Route } from './routes.service';
import { environment } from '../../../environments/environment';

describe('RoutesService', () => {
  let service: RoutesService;
  let httpMock: HttpTestingController;

  const mockApiRoutes: RouteApiResponse[] = [
    {
      id: 1,
      vehicle_id: 1,
      created_at: '2025-10-14T09:00:00',
      warehouse_id: 'WH-001',
      warehouse_name: 'Bodega Central Bogotá',
      state: 'scheduled',
      deliveries: 5,
      gmaps_metrics: '{"performed_shipment_count": 0, "total_duration": 0}',
      country: 'Colombia'
    },
    {
      id: 2,
      vehicle_id: 2,
      created_at: '2025-10-14T10:30:00',
      warehouse_id: 'WH-002',
      warehouse_name: 'Bodega Norte Cali',
      state: 'in_transit',
      deliveries: 8,
      gmaps_metrics: '{"performed_shipment_count": 5, "total_duration": 120}',
      country: 'Colombia'
    },
    {
      id: 3,
      vehicle_id: 3,
      created_at: '2025-10-14T11:15:00',
      warehouse_id: 'WH-003',
      warehouse_name: 'Bodega Sur Cartagena',
      state: 'delivered',
      deliveries: 3,
      gmaps_metrics: '{"performed_shipment_count": 3, "total_duration": 90}',
      country: 'Colombia'
    }
  ];

  const expectedTransformedRoutes: Route[] = [
    {
      id: '1',
      creationDate: '14-10-2025',
      originWarehouse: 'Bodega Central Bogotá',
      assignedDeliveries: 5,
      status: 'planned',
      assignedTruck: 'VEH-001'
    },
    {
      id: '2',
      creationDate: '14-10-2025',
      originWarehouse: 'Bodega Norte Cali',
      assignedDeliveries: 8,
      status: 'in_progress',
      assignedTruck: 'VEH-002'
    },
    {
      id: '3',
      creationDate: '14-10-2025',
      originWarehouse: 'Bodega Sur Cartagena',
      assignedDeliveries: 3,
      status: 'completed',
      assignedTruck: 'VEH-003'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoutesService]
    });
    service = TestBed.inject(RoutesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ========================================
  // SERVICE CREATION TESTS
  // ========================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ========================================
  // GET ROUTES TESTS
  // ========================================

  describe('getRoutes', () => {
    it('should retrieve and transform routes from the API', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes).toEqual(expectedTransformedRoutes);
          expect(routes.length).toBe(3);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiRoutes);
    });

    it('should handle empty routes array', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes).toEqual([]);
          expect(routes.length).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([]);
    });

    it('should handle HTTP errors when getting routes', (done) => {
      const errorMessage = 'Server error';
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed with server error'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe(errorMessage);
          expect(consoleSpy).toHaveBeenCalledWith('Error en RoutesService:', jasmine.any(Object));
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle network errors', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed with network error'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(consoleSpy).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should transform multiple routes correctly', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          routes.forEach((route, index) => {
            expect(route.id).toBe(expectedTransformedRoutes[index].id);
            expect(route.creationDate).toBe(expectedTransformedRoutes[index].creationDate);
            expect(route.originWarehouse).toBe(expectedTransformedRoutes[index].originWarehouse);
            expect(route.assignedDeliveries).toBe(expectedTransformedRoutes[index].assignedDeliveries);
            expect(route.status).toBe(expectedTransformedRoutes[index].status);
            expect(route.assignedTruck).toBe(expectedTransformedRoutes[index].assignedTruck);
          });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });
  });

  // ========================================
  // DATE FORMATTING TESTS
  // ========================================

  describe('formatDate (private method)', () => {
    it('should format ISO date to DD-MM-YYYY', (done) => {
      const testRoute: RouteApiResponse = {
        id: 99,
        vehicle_id: 99,
        created_at: '2025-01-05T12:30:00',
        warehouse_id: 'WH-099',
        warehouse_name: 'Bodega Test',
        state: 'scheduled',
        deliveries: 1,
        gmaps_metrics: '{}',
        country: 'Colombia'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('05-01-2025');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should handle dates with single digit day and month', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-03-07T08:00:00'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('07-03-2025');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should handle dates with double digit day and month', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-12-25T23:59:59'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('25-12-2025');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should handle year 2024', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2024-06-15T10:00:00'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('15-06-2024');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });
  });

  // ========================================
  // STATUS MAPPING TESTS
  // ========================================

  describe('mapStatus (private method)', () => {
    it('should map "scheduled" to "planned"', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        state: 'scheduled'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].status).toBe('planned');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should map "in_transit" to "in_progress"', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        state: 'in_transit'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].status).toBe('in_progress');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should map "delivered" to "completed"', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        state: 'delivered'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].status).toBe('completed');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should map "cancelled" to "with_incidents"', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        state: 'cancelled'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].status).toBe('with_incidents');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should default to "planned" for unknown status', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        state: 'unknown_status'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].status).toBe('planned');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([testRoute]);
    });

    it('should handle all status mappings in a single call', (done) => {
      const routesWithAllStatuses: RouteApiResponse[] = [
        { ...mockApiRoutes[0], state: 'scheduled' },
        { ...mockApiRoutes[1], state: 'in_transit' },
        { ...mockApiRoutes[2], state: 'delivered' },
        { ...mockApiRoutes[0], id: 4, state: 'cancelled' }
      ];

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].status).toBe('planned');
          expect(routes[1].status).toBe('in_progress');
          expect(routes[2].status).toBe('completed');
          expect(routes[3].status).toBe('with_incidents');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(routesWithAllStatuses);
    });
  });

  // ========================================
  // ROUTE TRANSFORMATION TESTS
  // ========================================

  describe('transformRoute (private method)', () => {
    it('should correctly transform id to string', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(typeof routes[0].id).toBe('string');
          expect(routes[0].id).toBe('1');
          expect(routes[1].id).toBe('2');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should map warehouse_name to originWarehouse', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].originWarehouse).toBe('Bodega Central Bogotá');
          expect(routes[1].originWarehouse).toBe('Bodega Norte Cali');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should map deliveries to assignedDeliveries', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedDeliveries).toBe(5);
          expect(routes[1].assignedDeliveries).toBe(8);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should map vehicle_id to assignedTruck', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedTruck).toBe('VEH-001');
          expect(routes[1].assignedTruck).toBe('VEH-002');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should transform all fields correctly', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          const route = routes[0];
          expect(route).toEqual(expectedTransformedRoutes[0]);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should handle large route IDs', (done) => {
      const largeIdRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        id: 999999
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].id).toBe('999999');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([largeIdRoute]);
    });

    it('should handle zero deliveries', (done) => {
      const zeroDeliveriesRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        deliveries: 0
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedDeliveries).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([zeroStopsRoute]);
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('handleError', () => {
    it('should handle error with custom message from error.error.message', (done) => {
      const customError = 'Custom error from backend';
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe(customError);
          expect(consoleSpy).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ message: customError }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle error with message from error.message', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeDefined();
          expect(consoleSpy).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.error(new ProgressEvent('Error'));
    });

    it('should log error to console', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed'),
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith('Error en RoutesService:', jasmine.any(Object));
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ error: 'Error' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle 404 errors', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(consoleSpy).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle timeout errors', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.getRoutes().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(consoleSpy).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ message: 'Timeout' }, { status: 408, statusText: 'Request Timeout' });
    });
  });

  // ========================================
  // URL CONSTRUCTION TESTS
  // ========================================

  describe('API URL construction', () => {
    it('should use correct URL from environment', () => {
      service.getRoutes().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(req.request.url).toBe(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([]);
    });

    it('should send GET request', () => {
      service.getRoutes().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should not send any custom headers by default', () => {
      service.getRoutes().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(req.request.headers.keys().length).toBe(0);
      req.flush([]);
    });
  });

  // ========================================
  // EDGE CASES TESTS
  // ========================================

  describe('Edge cases', () => {
    it('should handle route with very long warehouse names', (done) => {
      const longWarehouseNameRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        warehouse_name: 'Bodega Central Bogotá D.C. - Centro Internacional de Distribución Norte - Zona Industrial'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].originWarehouse).toContain('Bodega Central Bogotá D.C.');
          expect(routes[0].originWarehouse.length).toBeGreaterThan(10);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([longWarehouseNameRoute]);
    });

    it('should format vehicle_id with padding', (done) => {
      const singleDigitVehicleRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        vehicle_id: 5
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedTruck).toBe('VEH-005');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([singleDigitVehicleRoute]);
    });

    it('should handle very large number of deliveries', (done) => {
      const manyDeliveriesRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        deliveries: 999
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedDeliveries).toBe(999);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([manyDeliveriesRoute]);
    });

    it('should handle large list of routes', (done) => {
      const largeRouteList: RouteApiResponse[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        vehicle_id: i + 1,
        created_at: '2025-10-14T09:00:00',
        warehouse_id: `WH-${String(i + 1).padStart(3, '0')}`,
        warehouse_name: `Bodega ${i + 1}`,
        state: ['scheduled', 'in_transit', 'delivered', 'cancelled'][i % 4],
        deliveries: i + 1,
        gmaps_metrics: '{}',
        country: 'Colombia'
      }));

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes.length).toBe(100);
          expect(routes[0].id).toBe('1');
          expect(routes[99].id).toBe('100');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(largeRouteList);
    });

    it('should handle warehouse names with accented characters', (done) => {
      const accentedRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        warehouse_name: 'Bodega Bogotá - Medellín'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].originWarehouse).toContain('Bogotá');
          expect(routes[0].originWarehouse).toContain('Medellín');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([accentedRoute]);
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe('Integration tests', () => {
    it('should retrieve, transform and return complete route data', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes.length).toBe(3);
          
          // Verify first route transformation
          expect(routes[0].id).toBe('1');
          expect(routes[0].creationDate).toBe('14-10-2025');
          expect(routes[0].originWarehouse).toBe('Bodega Central Bogotá');
          expect(routes[0].assignedDeliveries).toBe(5);
          expect(routes[0].status).toBe('planned');
          expect(routes[0].assignedTruck).toBe('VEH-001');

          // Verify second route transformation
          expect(routes[1].status).toBe('in_progress');
          expect(routes[1].assignedTruck).toBe('VEH-002');

          // Verify third route transformation
          expect(routes[2].status).toBe('completed');
          expect(routes[2].assignedTruck).toBe('VEH-003');

          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should handle consecutive getRoutes calls independently', (done) => {
      let callCount = 0;

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes.length).toBe(1);
          callCount++;
          if (callCount === 2) done();
        }
      });

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes.length).toBe(3);
          callCount++;
          if (callCount === 2) done();
        }
      });

      const requests = httpMock.match(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(requests.length).toBe(2);
      requests[0].flush([mockApiRoutes[0]]);
      requests[1].flush(mockApiRoutes);
    });
  });

  // ========================================
  // DATE EDGE CASES TESTS
  // ========================================

  describe('Date formatting edge cases', () => {
    it('should handle January dates correctly', (done) => {
      const januaryRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-01-01T00:00:00'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('01-01-2025');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([januaryRoute]);
    });

    it('should handle December dates correctly', (done) => {
      const decemberRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-12-31T23:59:59'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('31-12-2025');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([decemberRoute]);
    });

    it('should handle leap year February 29th', (done) => {
      const leapYearRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2024-02-29T12:00:00'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('29-02-2024');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([leapYearRoute]);
    });

    it('should pad single digit days with zero', (done) => {
      const singleDigitDayRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-10-05T09:00:00'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('05-10-2025');
          expect(routes[0].creationDate.startsWith('05')).toBe(true);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([singleDigitDayRoute]);
    });

    it('should pad single digit months with zero', (done) => {
      const singleDigitMonthRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-03-15T09:00:00'
      };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].creationDate).toBe('15-03-2025');
          expect(routes[0].creationDate.includes('03')).toBe(true);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush([singleDigitMonthRoute]);
    });
  });


  // ========================================
  // DATA VALIDATION TESTS
  // ========================================

  describe('Data validation', () => {
    it('should ensure all required fields are present in transformed routes', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          routes.forEach(route => {
            expect(route.id).toBeDefined();
            expect(route.creationDate).toBeDefined();
            expect(route.originWarehouse).toBeDefined();
            expect(route.assignedDeliveries).toBeDefined();
            expect(route.status).toBeDefined();
            expect(route.assignedTruck).toBeDefined();
          });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should ensure id is converted to string type', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          routes.forEach(route => {
            expect(typeof route.id).toBe('string');
          });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should ensure status is one of the valid values', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          const validStatuses: Array<'planned' | 'in_progress' | 'with_incidents' | 'completed'> = 
            ['planned', 'in_progress', 'with_incidents', 'completed'];
          
          routes.forEach(route => {
            expect(validStatuses).toContain(route.status);
          });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should ensure date format is DD-MM-YYYY', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          routes.forEach(route => {
            // Check format: DD-MM-YYYY
            expect(route.creationDate).toMatch(/^\d{2}-\d{2}-\d{4}$/);
          });
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });
  });

});

