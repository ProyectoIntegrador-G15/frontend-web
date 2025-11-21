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
      state: 'scheduled',
      deliveries: 5,
      gmaps_metrics: '{"performed_shipment_count": 0, "total_duration": 0}',
      country: 'Colombia',
      waypoints: [
        {
          id: 1,
          order_id: 1,
          sequence: 0,
          point_name: 'Bodega Central Bogotá',
          point_address: 'Calle 123 #45-67',
          arrival_time: null,
          pickup: true
        }
      ]
    },
    {
      id: 2,
      vehicle_id: 2,
      created_at: '2025-10-14T10:30:00',
      state: 'in_transit',
      deliveries: 8,
      gmaps_metrics: '{"performed_shipment_count": 5, "total_duration": 120}',
      country: 'Colombia',
      waypoints: [
        {
          id: 2,
          order_id: 2,
          sequence: 0,
          point_name: 'Bodega Norte Cali',
          point_address: 'Carrera 10 #20-30',
          arrival_time: null,
          pickup: true
        }
      ]
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      expect(req.request.method).toBe('GET');
      req.flush({
        routes: mockApiRoutes,
        total: 2,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: [],
        total: 0,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: [testRoute],
        total: 1,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: [testRoute],
        total: 1,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: [testRoute],
        total: 1,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: mockApiRoutes,
        total: 2,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });

    it('should map warehouse_name to originWarehouse', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].originWarehouse).toBe('Bodega Central Bogotá');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: mockApiRoutes,
        total: 2,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });

    it('should map vehicle_id to assignedTruck with padding', (done) => {
      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes[0].assignedTruck).toBe('VEH-001');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: mockApiRoutes,
        total: 2,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
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

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: [testRoute],
        total: 1,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });
  });

  describe('API URL construction', () => {
    it('should use correct URL from environment', () => {
      service.getRoutes().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      expect(req.request.url).toContain(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({
        routes: [],
        total: 0,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });

    it('should send GET request', () => {
      service.getRoutes().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      expect(req.request.method).toBe('GET');
      req.flush({
        routes: [],
        total: 0,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });
  });

  describe('Multiple Pages Pagination', () => {
    it('should fetch and combine routes from multiple pages', (done) => {
      const page1Routes = [mockApiRoutes[0]];
      const page2Routes = [mockApiRoutes[1]];

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes.length).toBe(2);
          expect(routes[0].id).toBe('1');
          expect(routes[1].id).toBe('2');
          done();
        },
        error: done.fail
      });

      // Primera petición - página 1
      const req1 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req1.flush({
        routes: page1Routes,
        total: 2,
        total_pages: 2,
        page: 1,
        page_size: 1
      });

      // Segunda petición - página 2
      const req2 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=2`);
      req2.flush({
        routes: page2Routes,
        total: 2,
        total_pages: 2,
        page: 2,
        page_size: 1
      });
    });

    it('should fetch routes from 3 pages correctly', (done) => {
      const route1 = { ...mockApiRoutes[0], id: 1 };
      const route2 = { ...mockApiRoutes[0], id: 2 };
      const route3 = { ...mockApiRoutes[0], id: 3 };

      service.getRoutes().subscribe({
        next: (routes) => {
          expect(routes.length).toBe(3);
          expect(routes[0].id).toBe('1');
          expect(routes[1].id).toBe('2');
          expect(routes[2].id).toBe('3');
          done();
        },
        error: done.fail
      });

      // Primera página
      const req1 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req1.flush({
        routes: [route1],
        total: 3,
        total_pages: 3,
        page: 1,
        page_size: 1
      });

      // Segunda página
      const req2 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=2`);
      req2.flush({
        routes: [route2],
        total: 3,
        total_pages: 3,
        page: 2,
        page_size: 1
      });

      // Tercera página
      const req3 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=3`);
      req3.flush({
        routes: [route3],
        total: 3,
        total_pages: 3,
        page: 3,
        page_size: 1
      });
    });
  });

  describe('getRoutesPaginated', () => {
    it('should fetch specific page with metadata', (done) => {
      service.getRoutesPaginated(2).subscribe({
        next: (response) => {
          expect(response.routes.length).toBe(1);
          expect(response.total).toBe(5);
          expect(response.totalPages).toBe(3);
          expect(response.page).toBe(2);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=2`);
      req.flush({
        routes: [mockApiRoutes[1]],
        total: 5,
        total_pages: 3,
        page: 2,
        page_size: 2
      });
    });

    it('should use page 1 by default', (done) => {
      service.getRoutesPaginated().subscribe({
        next: (response) => {
          expect(response.page).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}?page=1`);
      req.flush({
        routes: mockApiRoutes,
        total: 2,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });
  });

  describe('getRouteDetail', () => {
    it('should fetch route detail successfully', (done) => {
      service.getRouteDetail('1').subscribe({
        next: (route) => {
          expect(route).toBeTruthy();
          expect(route.id).toBe('1');
          expect(route.originWarehouse).toBe('Bodega Central Bogotá');
          expect(route.assignedTruck).toBe('VEH-001');
          expect(route.waypoints.length).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiRoutes[0]);
    });

    it('should parse metrics correctly when valid JSON', (done) => {
      const routeWithMetrics = {
        ...mockApiRoutes[0],
        gmaps_metrics: JSON.stringify({
          performed_shipment_count: 5,
          total_duration: 3600,
          travel_distance_meters: 15000,
          total_cost: 50000
        })
      };

      service.getRouteDetail('1').subscribe({
        next: (route) => {
          expect(route.metrics).toBeTruthy();
          expect(route.metrics?.performedShipmentCount).toBe(5);
          expect(route.metrics?.totalDuration).toBe(3600);
          expect(route.metrics?.travelDistanceMeters).toBe(15000);
          expect(route.metrics?.totalCost).toBe(50000);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithMetrics);
    });

    it('should handle metrics with null values', (done) => {
      const routeWithNullMetrics = {
        ...mockApiRoutes[0],
        gmaps_metrics: JSON.stringify({
          performed_shipment_count: null,
          total_duration: null,
          travel_distance_meters: null,
          total_cost: null
        })
      };

      service.getRouteDetail('1').subscribe({
        next: (route) => {
          expect(route.metrics).toBeTruthy();
          expect(route.metrics?.performedShipmentCount).toBeNull();
          expect(route.metrics?.totalDuration).toBeNull();
          expect(route.metrics?.travelDistanceMeters).toBeNull();
          expect(route.metrics?.totalCost).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithNullMetrics);
    });

    it('should handle metrics with non-numeric values', (done) => {
      const routeWithInvalidMetrics = {
        ...mockApiRoutes[0],
        gmaps_metrics: JSON.stringify({
          performed_shipment_count: 'not a number',
          total_duration: 'invalid',
          travel_distance_meters: Infinity,
          total_cost: NaN
        })
      };

      service.getRouteDetail('1').subscribe({
        next: (route) => {
          expect(route.metrics).toBeTruthy();
          expect(route.metrics?.performedShipmentCount).toBeNull();
          expect(route.metrics?.totalDuration).toBeNull();
          expect(route.metrics?.travelDistanceMeters).toBeNull();
          expect(route.metrics?.totalCost).toBeNull();
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithInvalidMetrics);
    });

    it('should handle route with waypoints that are not pickups', (done) => {
      const routeWithDeliveryWaypoints = {
        ...mockApiRoutes[0],
        waypoints: [
          {
            id: 1,
            order_id: 1,
            sequence: 0,
            point_name: 'Bodega Central Bogotá',
            point_address: 'Calle 123 #45-67',
            arrival_time: null,
            pickup: true
          },
          {
            id: 2,
            order_id: 2,
            sequence: 1,
            point_name: 'Cliente 1',
            point_address: 'Calle 100 #50-30',
            arrival_time: '2025-10-14T10:00:00',
            pickup: false
          }
        ]
      };

      service.getRouteDetail('1').subscribe({
        next: (route) => {
          expect(route.originWarehouse).toBe('Bodega Central Bogotá');
          expect(route.waypoints.length).toBe(2);
          expect(route.waypoints[0].pickup).toBe(true);
          expect(route.waypoints[1].pickup).toBe(false);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithDeliveryWaypoints);
    });

  });

  describe('createRoute', () => {
    it('should create a new route successfully', (done) => {
      const routeData = {
        vehicle_id: 1,
        date: '2025-10-27',
        orders: [7, 8]
      };

      const createdRoute = {
        ...mockApiRoutes[0],
        deliveries: 2
      };

      service.createRoute(routeData).subscribe({
        next: (response) => {
          expect(response).toBeTruthy();
          expect(response.id).toBe(1);
          expect(response.deliveries).toBe(2);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.vehicle_id).toBe(1);
      expect(req.request.body.date).toBe('2025-10-27');
      expect(req.request.body.orders).toEqual([7, 8]);
      req.flush(createdRoute);
    });

    it('should handle error when creating route fails', (done) => {
      const routeData = {
        vehicle_id: 1,
        date: '2025-10-27',
        orders: []
      };

      service.createRoute(routeData).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ detail: 'Debe incluir al menos una orden' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle error when vehicle not found', (done) => {
      const routeData = {
        vehicle_id: 999,
        date: '2025-10-27',
        orders: [1, 2]
      };

      service.createRoute(routeData).subscribe({
        next: () => {
          fail('Should have failed');
          done();
        },
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      expect(req.request.method).toBe('POST');
      req.flush({ detail: 'Vehículo no encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', (done) => {
      service.createRoute({ vehicle_id: 1, date: '2025-10-27', orders: [] }).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}`);
      req.flush({ detail: 'Error en el backend' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle routes with null metrics', (done) => {
      const routeWithNullMetrics = {
        ...mockApiRoutes[0],
        gmaps_metrics: null
      };

      service.getRouteDetail('1').subscribe((route) => {
        expect(route.metrics).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithNullMetrics);
    });

    it('should handle routes with invalid JSON metrics', (done) => {
      const routeWithInvalidMetrics = {
        ...mockApiRoutes[0],
        gmaps_metrics: 'invalid json'
      };

      service.getRouteDetail('1').subscribe((route) => {
        expect(route.metrics).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithInvalidMetrics);
    });

    it('should handle routes with empty waypoints', (done) => {
      const routeWithNoWaypoints = {
        ...mockApiRoutes[0],
        waypoints: []
      };

      service.getRouteDetail('1').subscribe((route) => {
        expect(route.waypoints.length).toBe(0);
        expect(route.originWarehouse).toBe('No asignado');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithNoWaypoints);
    });

    it('should map unknown status to planned', (done) => {
      const routeWithUnknownStatus = {
        ...mockApiRoutes[0],
        state: 'unknown_status'
      };

      service.getRouteDetail('1').subscribe((route) => {
        expect(route.status).toBe('planned');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/1`);
      req.flush(routeWithUnknownStatus);
    });

    it('should handle routes with all status types', (done) => {
      const statuses = ['scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'];
      let completed = 0;

      statuses.forEach((status, index) => {
        const route = {
          ...mockApiRoutes[0],
          id: index + 10,
          state: status
        };

        service.getRouteDetail((index + 10).toString()).subscribe((r) => {
          expect(r.status).toBeDefined();
          completed++;
          if (completed === statuses.length) {
            done();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.routes}/${index + 10}`);
        req.flush(route);
      });
    });
  });
});
