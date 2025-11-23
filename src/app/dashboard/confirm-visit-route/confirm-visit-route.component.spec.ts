import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfirmVisitRouteComponent } from './confirm-visit-route.component';
import { VisitRoutesService, VisitRoute } from '../../shared/services/visit-routes.service';
import { SnackService } from '../../shared/services/snack.service';
import { of, throwError } from 'rxjs';
import { Pipe, PipeTransform, NO_ERRORS_SCHEMA } from '@angular/core';
import { BackButtonComponent } from '../../shared/components/back-button/back-button.component';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('ConfirmVisitRouteComponent', () => {
  let component: ConfirmVisitRouteComponent;
  let fixture: ComponentFixture<ConfirmVisitRouteComponent>;
  let visitRoutesService: jasmine.SpyObj<VisitRoutesService>;
  let snackService: jasmine.SpyObj<SnackService>;
  let router: jasmine.SpyObj<Router>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let activatedRoute: any;

  const mockVisitRoute: VisitRoute = {
    id: 'route-1',
    sellerId: '1',
    routeDate: '2024-01-20',
    status: 'draft',
    totalClients: 3,
    createdAt: '2024-01-19T10:00:00Z',
    stops: [
      {
        id: 'stop-1',
        clientId: '1',
        sequence: 1,
        clientName: 'Client 1',
        clientAddress: 'Bogotá, Colombia',
        durationMinutes: 30,
        status: 'pending',
        latitude: 4.7110,
        longitude: -74.0721
      },
      {
        id: 'stop-2',
        clientId: '2',
        sequence: 2,
        clientName: 'Client 2',
        clientAddress: 'Medellín, Colombia',
        durationMinutes: 30,
        status: 'pending',
        latitude: 6.2476,
        longitude: -75.5658
      }
    ]
  };

  beforeEach(async () => {
    const visitRoutesServiceSpy = jasmine.createSpyObj('VisitRoutesService', [
      'getVisitRouteById',
      'createVisitRoute',
      'confirmVisitRoute'
    ]);
    const snackServiceSpy = jasmine.createSpyObj('SnackService', ['success', 'error']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('route-1')
        }
      }
    };

    translateServiceSpy.instant.and.returnValue('translated');

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        BackButtonComponent
      ],
      declarations: [
        ConfirmVisitRouteComponent,
        MockCustomTranslatePipe
      ],
      providers: [
        { provide: VisitRoutesService, useValue: visitRoutesServiceSpy },
        { provide: SnackService, useValue: snackServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmVisitRouteComponent);
    component = fixture.componentInstance;
    visitRoutesService = TestBed.inject(VisitRoutesService) as jasmine.SpyObj<VisitRoutesService>;
    snackService = TestBed.inject(SnackService) as jasmine.SpyObj<SnackService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load route when routeId is provided', fakeAsync(() => {
      visitRoutesService.getVisitRouteById.and.returnValue(of(mockVisitRoute));
      
      component.ngOnInit();
      tick(250);
      
      expect(visitRoutesService.getVisitRouteById).toHaveBeenCalledWith('route-1');
      expect(component.loading).toBe(false);
    }));

    it('should load preview when routeId is "preview"', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue('preview');
      spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify({
        seller_id: 1,
        route_date: '2024-01-20',
        clients: [
          { id: 1, name: 'Client 1', address: 'Bogotá, Colombia' }
        ]
      }));
      spyOn(component, 'loadPreview');
      
      component.ngOnInit();
      
      expect(component.loadPreview).toHaveBeenCalled();
    });

    it('should not load anything when routeId is null', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      spyOn(component, 'loadRoute');
      spyOn(component, 'loadPreview');
      
      component.ngOnInit();
      
      expect(component.loadRoute).not.toHaveBeenCalled();
      expect(component.loadPreview).not.toHaveBeenCalled();
    });
  });

  describe('loadRoute', () => {
    it('should load route successfully', fakeAsync(() => {
      visitRoutesService.getVisitRouteById.and.returnValue(of(mockVisitRoute));
      spyOn(component, 'initMap');
      
      component.loadRoute('route-1');
      tick(250);
      
      expect(component.visitRoute).toEqual(mockVisitRoute);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('should handle error when loading route', () => {
      const error = { message: 'Error loading route' };
      visitRoutesService.getVisitRouteById.and.returnValue(throwError(() => error));
      
      component.loadRoute('route-1');
      
      expect(component.error).toBe('translated');
      expect(component.loading).toBe(false);
    });
  });

  describe('getCityCoordinates', () => {
    it('should return coordinates for Bogotá', () => {
      const coords = component.getCityCoordinates('Bogotá');
      expect(coords.lat).toBeCloseTo(4.7110, 1);
      expect(coords.lng).toBeCloseTo(-74.0721, 1);
    });

    it('should return coordinates for Medellín', () => {
      const coords = component.getCityCoordinates('Medellín');
      expect(coords.lat).toBeCloseTo(6.2476, 1);
      expect(coords.lng).toBeCloseTo(-75.5658, 1);
    });

    it('should return default coordinates for unknown city', () => {
      const coords = component.getCityCoordinates('UnknownCity');
      expect(coords.lat).toBeCloseTo(4.7110, 1);
      expect(coords.lng).toBeCloseTo(-74.0721, 1);
    });
  });

  describe('confirmRoute', () => {
    beforeEach(() => {
      component.visitRoute = mockVisitRoute;
    });

    it('should not confirm if visitRoute is null', () => {
      component.visitRoute = null;
      
      component.confirmRoute();
      
      expect(visitRoutesService.confirmVisitRoute).not.toHaveBeenCalled();
    });

    it('should confirm existing route successfully', fakeAsync(() => {
      component.isPreview = false;
      const confirmedRoute = { ...mockVisitRoute, status: 'confirmed' as const };
      visitRoutesService.confirmVisitRoute.and.returnValue(of(confirmedRoute));
      
      component.confirmRoute();
      tick(100);
      
      expect(visitRoutesService.confirmVisitRoute).toHaveBeenCalledWith('route-1');
      expect(snackService.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    }));

    it('should handle error when confirming route', fakeAsync(() => {
      component.isPreview = false;
      const error = { message: 'Error confirming' };
      visitRoutesService.confirmVisitRoute.and.returnValue(throwError(() => error));
      
      component.confirmRoute();
      tick(100);
      
      expect(component.error).toBeTruthy();
      expect(component.confirming).toBe(false);
      expect(snackService.error).toHaveBeenCalled();
    }));

    it('should create and confirm route in preview mode', fakeAsync(() => {
      component.isPreview = true;
      spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify({
        seller_id: 1,
        route_date: '2024-01-20',
        clients: []
      }));
      const createdRoute = { ...mockVisitRoute, id: 'new-route' };
      const confirmedRoute = { ...createdRoute, status: 'confirmed' as const };
      visitRoutesService.createVisitRoute.and.returnValue(of(createdRoute));
      visitRoutesService.confirmVisitRoute.and.returnValue(of(confirmedRoute));
      spyOn(sessionStorage, 'removeItem');
      
      component.confirmRoute();
      tick(100);
      
      expect(visitRoutesService.createVisitRoute).toHaveBeenCalled();
      expect(visitRoutesService.confirmVisitRoute).toHaveBeenCalled();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('pendingVisitRoute');
    }));

    it('should handle error when creating route in preview mode', fakeAsync(() => {
      component.isPreview = true;
      spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify({
        seller_id: 1,
        route_date: '2024-01-20',
        clients: []
      }));
      const error = { message: 'Error creating' };
      visitRoutesService.createVisitRoute.and.returnValue(throwError(() => error));
      
      component.confirmRoute();
      tick(100);
      
      expect(component.error).toBeTruthy();
      expect(component.confirming).toBe(false);
      expect(snackService.error).toHaveBeenCalled();
    }));
  });

  describe('goBack', () => {
    it('should navigate back to sellers page', () => {
      component.visitRoute = mockVisitRoute;
      
      component.goBack();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers', '1']);
    });

    it('should navigate with empty sellerId if visitRoute is null', () => {
      component.visitRoute = null;
      
      component.goBack();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers', '']);
    });
  });

  describe('initMap', () => {
    let mockMap: any;
    let mockDirectionsService: any;
    let mockDirectionsRenderer: any;
    let mockMarker: any;
    let mockInfoWindow: any;
    let mockBounds: any;

    beforeEach(() => {
      mockMap = jasmine.createSpyObj('Map', ['fitBounds']);
      mockDirectionsService = jasmine.createSpyObj('DirectionsService', ['route']);
      mockDirectionsRenderer = jasmine.createSpyObj('DirectionsRenderer', ['setDirections']);
      mockMarker = jasmine.createSpyObj('Marker', ['setMap', 'addListener']);
      mockInfoWindow = jasmine.createSpyObj('InfoWindow', ['open']);
      mockBounds = jasmine.createSpyObj('LatLngBounds', ['extend']);

      // Mock Google Maps
      (window as any).google = {
        maps: {
          Map: jasmine.createSpy('Map').and.returnValue(mockMap),
          DirectionsService: jasmine.createSpy('DirectionsService').and.returnValue(mockDirectionsService),
          DirectionsRenderer: jasmine.createSpy('DirectionsRenderer').and.returnValue(mockDirectionsRenderer),
          Marker: jasmine.createSpy('Marker').and.returnValue(mockMarker),
          InfoWindow: jasmine.createSpy('InfoWindow').and.returnValue(mockInfoWindow),
          LatLngBounds: jasmine.createSpy('LatLngBounds').and.returnValue(mockBounds),
          Polyline: jasmine.createSpy('Polyline'),
          TravelMode: {
            DRIVING: 'DRIVING'
          },
          SymbolPath: {
            CIRCLE: 'CIRCLE'
          }
        }
      };
    });

    it('should not initialize map if visitRoute is null', () => {
      component.visitRoute = null;
      spyOn(document, 'getElementById').and.returnValue(document.createElement('div'));
      
      component.initMap();
      
      expect((window as any).google.maps.Map).not.toHaveBeenCalled();
    });

    it('should not initialize map if map element is not found', () => {
      component.visitRoute = mockVisitRoute;
      spyOn(document, 'getElementById').and.returnValue(null);
      
      component.initMap();
      
      expect((window as any).google.maps.Map).not.toHaveBeenCalled();
    });

    it('should not initialize map if Google Maps is not loaded', () => {
      component.visitRoute = mockVisitRoute;
      (window as any).google = null;
      spyOn(document, 'getElementById').and.returnValue(document.createElement('div'));
      
      component.initMap();
      
      expect(component.error).toBe('translated');
    });

    it('should initialize map successfully when all conditions are met', () => {
      component.visitRoute = mockVisitRoute;
      const mapElement = document.createElement('div');
      mapElement.id = 'routeMap';
      spyOn(document, 'getElementById').and.returnValue(mapElement);
      spyOn(component, 'addMarkersToMap');
      
      component.initMap();
      
      expect((window as any).google.maps.Map).toHaveBeenCalled();
      expect((window as any).google.maps.DirectionsService).toHaveBeenCalled();
      expect((window as any).google.maps.DirectionsRenderer).toHaveBeenCalled();
      expect(component.addMarkersToMap).toHaveBeenCalled();
    });
  });

  describe('addMarkersToMap', () => {
    beforeEach(() => {
      (component as any).map = {
        fitBounds: jasmine.createSpy('fitBounds')
      };
      (component as any).markers = [];
    });

    it('should not add markers if map is null', () => {
      (component as any).map = null;
      component.visitRoute = mockVisitRoute;
      
      component.addMarkersToMap();
      
      expect((component as any).markers.length).toBe(0);
    });

    it('should not add markers if visitRoute is null', () => {
      component.visitRoute = null;
      
      component.addMarkersToMap();
      
      expect((component as any).markers.length).toBe(0);
    });

    it('should add markers for stops with coordinates', () => {
      component.visitRoute = mockVisitRoute;
      // Mock directionsService to avoid error when drawRoute is called
      (component as any).directionsService = {
        route: jasmine.createSpy('route').and.callFake((request: any, callback: any) => {
          callback({ routes: [] }, 'OK');
        })
      };
      (component as any).directionsRenderer = {
        setDirections: jasmine.createSpy('setDirections')
      };
      
      (window as any).google = {
        maps: {
          Marker: jasmine.createSpy('Marker').and.returnValue({
            setMap: jasmine.createSpy('setMap'),
            addListener: jasmine.createSpy('addListener')
          }),
          InfoWindow: jasmine.createSpy('InfoWindow').and.returnValue({
            open: jasmine.createSpy('open')
          }),
          LatLngBounds: jasmine.createSpy('LatLngBounds').and.returnValue({
            extend: jasmine.createSpy('extend')
          }),
          TravelMode: {
            DRIVING: 'DRIVING'
          },
          SymbolPath: {
            CIRCLE: 'CIRCLE'
          }
        }
      };
      
      component.addMarkersToMap();
      
      expect((component as any).markers.length).toBe(2);
    });
  });

  describe('loadPreview', () => {
    beforeEach(() => {
      (window as any).google = {
        maps: {
          Map: jasmine.createSpy('Map'),
          DirectionsService: jasmine.createSpy('DirectionsService'),
          DirectionsRenderer: jasmine.createSpy('DirectionsRenderer'),
          Marker: jasmine.createSpy('Marker'),
          InfoWindow: jasmine.createSpy('InfoWindow'),
          LatLngBounds: jasmine.createSpy('LatLngBounds'),
          Polyline: jasmine.createSpy('Polyline'),
          TravelMode: {
            DRIVING: 'DRIVING'
          },
          SymbolPath: {
            CIRCLE: 'CIRCLE'
          }
        }
      };
    });

    it('should set error if no pending data in sessionStorage', async () => {
      spyOn(sessionStorage, 'getItem').and.returnValue(null);
      
      await component.loadPreview();
      
      expect(component.error).toBe('translated');
      expect(component.loading).toBe(false);
    });

    it('should load preview successfully with valid data', async () => {
      const mockClients = [
        { id: 1, name: 'Client 1', address: 'Bogotá, Colombia' }
      ];
      spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify({
        seller_id: 1,
        route_date: '2024-01-20',
        clients: mockClients
      }));
      spyOn(component, 'geocodeAddress').and.returnValue(Promise.resolve({ lat: 4.7110, lng: -74.0721 }));
      spyOn(component, 'initMap');
      
      await component.loadPreview();
      
      expect(component.isPreview).toBe(true);
      expect(component.visitRoute).toBeTruthy();
      expect(component.loading).toBe(false);
    });

    it('should handle error when loading preview', async () => {
      spyOn(sessionStorage, 'getItem').and.returnValue('invalid json');
      
      await component.loadPreview();
      
      expect(component.error).toBe('translated');
      expect(component.loading).toBe(false);
    });
  });

  describe('geocodeAddress', () => {
    beforeEach(() => {
      spyOn(component, 'getCityCoordinates').and.returnValue({ lat: 4.7110, lng: -74.0721 });
    });

    it('should return coordinates from Google Maps API', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{
          geometry: {
            location: { lat: 4.7110, lng: -74.0721 }
          }
        }]
      };
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({
        json: () => Promise.resolve(mockResponse)
      } as Response));
      
      const coords = await component.geocodeAddress('Bogotá, Colombia');
      
      expect(coords.lat).toBe(4.7110);
      expect(coords.lng).toBe(-74.0721);
    });

    it('should fallback to city coordinates on REQUEST_DENIED', async () => {
      const mockResponse = {
        status: 'REQUEST_DENIED'
      };
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({
        json: () => Promise.resolve(mockResponse)
      } as Response));
      
      const coords = await component.geocodeAddress('Bogotá, Colombia');
      
      expect(component.getCityCoordinates).toHaveBeenCalled();
    });

    it('should fallback to city coordinates on other errors', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS'
      };
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({
        json: () => Promise.resolve(mockResponse)
      } as Response));
      
      const coords = await component.geocodeAddress('Bogotá, Colombia');
      
      expect(component.getCityCoordinates).toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('Network error')));
      
      const coords = await component.geocodeAddress('Bogotá, Colombia');
      
      expect(component.getCityCoordinates).toHaveBeenCalled();
    });
  });

  describe('setupMap', () => {
    it('should call addMarkersToMap when map exists', () => {
      spyOn(component, 'addMarkersToMap');
      
      // Use reflection to set private property for testing
      (component as any).map = {} as any;
      
      component.setupMap();
      
      expect(component.addMarkersToMap).toHaveBeenCalled();
    });

    it('should not add markers if map does not exist', () => {
      spyOn(component, 'addMarkersToMap');
      
      // Use reflection to set private property for testing
      (component as any).map = null;
      
      component.setupMap();
      
      expect(component.addMarkersToMap).not.toHaveBeenCalled();
    });
  });

  describe('drawRoute', () => {
    it('should not draw route if visitRoute is null', () => {
      component.visitRoute = null;
      
      // Should not throw error
      expect(() => component.drawRoute()).not.toThrow();
      expect(component.visitRoute).toBeNull();
    });

    it('should not draw route if stops length is less than 2', () => {
      component.visitRoute = { ...mockVisitRoute, stops: [mockVisitRoute.stops[0]] };
      
      // Should not throw error
      expect(() => component.drawRoute()).not.toThrow();
      expect(component.visitRoute?.stops.length).toBe(1);
    });

    it('should not draw route if valid stops are less than 2', () => {
      component.visitRoute = {
        ...mockVisitRoute,
        stops: [
          { ...mockVisitRoute.stops[0], latitude: undefined, longitude: undefined },
          { ...mockVisitRoute.stops[1], latitude: undefined, longitude: undefined }
        ]
      };
      
      // Should not throw error
      expect(() => component.drawRoute()).not.toThrow();
      expect(component.visitRoute?.stops.length).toBe(2);
    });
  });

  describe('drawSimpleLine', () => {
    beforeEach(() => {
      (window as any).google = {
        maps: {
          Polyline: jasmine.createSpy('Polyline')
        }
      };
    });

    it('should draw simple line with valid stops', () => {
      component.visitRoute = mockVisitRoute;
      
      // Should not throw error
      expect(() => component.drawSimpleLine()).not.toThrow();
    });
  });
});

