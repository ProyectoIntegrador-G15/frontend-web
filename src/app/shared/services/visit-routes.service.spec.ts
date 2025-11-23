import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VisitRoutesService, VisitRoute, VisitRouteApiResponse, CreateVisitRouteRequest } from './visit-routes.service';
import { environment } from '../../../environments/environment';

describe('VisitRoutesService', () => {
  let service: VisitRoutesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${environment.apiEndpoints.visitRoutes}`;

  const mockVisitRouteApiResponse: VisitRouteApiResponse = {
    id: 1,
    seller_id: 1,
    route_date: '2024-01-15',
    status: 'confirmed',
    total_clients: 3,
    estimated_duration_minutes: 120,
    total_distance_meters: 5000,
    gmaps_route_data: {},
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    confirmed_at: '2024-01-10T01:00:00Z',
    stops: [
      {
        id: 1,
        visit_route_id: 1,
        client_id: 1,
        sequence: 1,
        client_name: 'Client 1',
        client_address: 'Address 1',
        estimated_arrival_time: '09:00:00',
        estimated_departure_time: '09:30:00',
        estimated_duration_minutes: 30,
        distance_from_previous_meters: null,
        travel_time_from_previous_minutes: null,
        observations: null,
        status: 'pending',
        latitude: '4.7110',
        longitude: '-74.0721',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VisitRoutesService]
    });

    service = TestBed.inject(VisitRoutesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createVisitRoute', () => {
    const createRequest: CreateVisitRouteRequest = {
      seller_id: 1,
      route_date: '2024-01-15',
      client_ids: [1, 2, 3]
    };

    it('should create a visit route', (done) => {
      service.createVisitRoute(createRequest).subscribe(route => {
        expect(route.id).toBe('1');
        expect(route.sellerId).toBe('1');
        expect(route.routeDate).toBe('2024-01-15');
        expect(route.status).toBe('confirmed');
        expect(route.totalClients).toBe(3);
        expect(route.stops.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockVisitRouteApiResponse);
    });

    it('should handle errors when creating route', (done) => {
      service.createVisitRoute(createRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getVisitRoutes', () => {
    const mockPaginatedResponse = {
      routes: [mockVisitRouteApiResponse],
      total: 1,
      total_pages: 1,
      page: 1,
      page_size: 10
    };

    it('should get visit routes without filters', (done) => {
      service.getVisitRoutes().subscribe(response => {
        expect(response.routes.length).toBe(1);
        expect(response.total).toBe(1);
        expect(response.totalPages).toBe(1);
        expect(response.page).toBe(1);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should get visit routes with sellerId filter', (done) => {
      service.getVisitRoutes({ sellerId: 1 }).subscribe(response => {
        expect(response.routes.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}?seller_id=1`);
      expect(req.request.params.get('seller_id')).toBe('1');
      req.flush(mockPaginatedResponse);
    });

    it('should get visit routes with all filters', (done) => {
      service.getVisitRoutes({
        sellerId: 1,
        routeDate: '2024-01-15',
        status: 'confirmed',
        page: 1
      }).subscribe(response => {
        expect(response.routes.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(req => {
        return req.url === baseUrl &&
          req.params.get('seller_id') === '1' &&
          req.params.get('route_date') === '2024-01-15' &&
          req.params.get('status_filter') === 'confirmed' &&
          req.params.get('page') === '1';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should handle errors when getting routes', (done) => {
      service.getVisitRoutes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getVisitRouteById', () => {
    it('should get a visit route by id', (done) => {
      service.getVisitRouteById('1').subscribe(route => {
        expect(route.id).toBe('1');
        expect(route.sellerId).toBe('1');
        expect(route.status).toBe('confirmed');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockVisitRouteApiResponse);
    });

    it('should handle errors when getting route by id', (done) => {
      service.getVisitRouteById('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.error(new ErrorEvent('Not found'));
    });
  });

  describe('updateRouteSequence', () => {
    const stopSequences = [
      { stop_id: 1, sequence: 1 },
      { stop_id: 2, sequence: 2 }
    ];

    it('should update route sequence', (done) => {
      service.updateRouteSequence('1', stopSequences).subscribe(route => {
        expect(route.id).toBe('1');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1/sequence`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ stop_sequences: stopSequences });
      req.flush(mockVisitRouteApiResponse);
    });

    it('should handle errors when updating sequence', (done) => {
      service.updateRouteSequence('1', stopSequences).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/1/sequence`);
      req.error(new ErrorEvent('Update failed'));
    });
  });

  describe('confirmVisitRoute', () => {
    it('should confirm a visit route', (done) => {
      service.confirmVisitRoute('1').subscribe(route => {
        expect(route.id).toBe('1');
        expect(route.status).toBe('confirmed');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1/confirm`);
      expect(req.request.method).toBe('POST');
      req.flush(mockVisitRouteApiResponse);
    });

    it('should handle errors when confirming route', (done) => {
      service.confirmVisitRoute('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/1/confirm`);
      req.error(new ErrorEvent('Confirm failed'));
    });
  });

  describe('deleteVisitRoute', () => {
    it('should delete a visit route', (done) => {
      service.deleteVisitRoute('1').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle errors when deleting route', (done) => {
      service.deleteVisitRoute('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.error(new ErrorEvent('Delete failed'));
    });
  });

  describe('transformVisitRoute', () => {
    it('should transform API response to frontend format', (done) => {
      service.getVisitRouteById('1').subscribe(route => {
        expect(route.id).toBe('1');
        expect(route.sellerId).toBe('1');
        expect(route.routeDate).toBe('2024-01-15');
        expect(route.status).toBe('confirmed');
        expect(route.totalClients).toBe(3);
        expect(route.estimatedDurationMinutes).toBe(120);
        expect(route.totalDistanceMeters).toBe(5000);
        expect(route.confirmedAt).toBe('2024-01-10T01:00:00Z');
        expect(route.stops.length).toBe(1);
        expect(route.stops[0].id).toBe('1');
        expect(route.stops[0].clientId).toBe('1');
        expect(route.stops[0].latitude).toBe(4.7110);
        expect(route.stops[0].longitude).toBe(-74.0721);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.flush(mockVisitRouteApiResponse);
    });
  });
});

