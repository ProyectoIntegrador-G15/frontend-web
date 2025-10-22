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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRoutes', () => {
    it('should retrieve and transform routes from the API', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes).toEqual(expectedTransformedRoutes);
          expect(routes.length).toBe(2);
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
  });

  describe('Status mapping', () => {
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
  });

  describe('Route transformation', () => {
    it('should correctly transform id to string', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(typeof routes[0].id).toBe('string');
          expect(routes[0].id).toBe('1');
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
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });

    it('should map vehicle_id to assignedTruck with padding', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedTruck).toBe('VEH-001');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush(mockApiRoutes);
    });
  });

  describe('Date formatting', () => {
    it('should format ISO date to DD-MM-YYYY', (done) => {
      const testRoute: RouteApiResponse = {
        ...mockApiRoutes[0],
        created_at: '2025-01-05T12:30:00'
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
  });

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
  });
});
