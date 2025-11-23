import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouteDetailComponent } from './route-detail.component';
import { RoutesService, RouteDetail } from '../../shared/services/routes.service';
import { TranslateService } from '@ngx-translate/core';
import { Pipe, PipeTransform } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('RouteDetailComponent', () => {
  let component: RouteDetailComponent;
  let fixture: ComponentFixture<RouteDetailComponent>;
  let routesService: jasmine.SpyObj<RoutesService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;
  let originalFetch: any;
  let mockGoogleMaps: any;

  const mockRouteDetail: RouteDetail = {
    id: '1',
    createdAt: '2024-01-15T10:00:00Z',
    creationDate: '2024-01-15',
    status: 'planned',
    deliveries: 5,
    vehicleId: 1,
    assignedTruck: 'Truck 1',
    country: 'Colombia',
    originWarehouse: 'Warehouse 1',
    metrics: null,
    waypoints: [
      {
        id: 1,
        orderId: 1,
        sequence: 0,
        pointName: 'Point 1',
        pointAddress: 'Bogotá, Colombia',
        arrivalTime: null,
        pickup: true
      },
      {
        id: 2,
        orderId: 2,
        sequence: 1,
        pointName: 'Point 2',
        pointAddress: 'Medellín, Colombia',
        arrivalTime: null,
        pickup: false
      }
    ]
  };

  beforeEach(async () => {
    const routesServiceSpy = jasmine.createSpyObj('RoutesService', ['getRouteDetail']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    // Mock fetch
    originalFetch = window.fetch;
    window.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve({
          status: 'OK',
          results: [{
            geometry: {
              location: { lat: 4.711, lng: -74.0721 }
            }
          }]
        })
      } as Response)
    );

    // Mock Google Maps
    mockGoogleMaps = {
      maps: {
        Map: jasmine.createSpy('Map').and.returnValue({
          fitBounds: jasmine.createSpy('fitBounds'),
          setCenter: jasmine.createSpy('setCenter'),
          setZoom: jasmine.createSpy('setZoom')
        }),
        Marker: jasmine.createSpy('Marker').and.returnValue({
          setMap: jasmine.createSpy('setMap'),
          addListener: jasmine.createSpy('addListener')
        }),
        DirectionsService: jasmine.createSpy('DirectionsService').and.returnValue({
          route: jasmine.createSpy('route')
        }),
        DirectionsRenderer: jasmine.createSpy('DirectionsRenderer').and.returnValue({
          setMap: jasmine.createSpy('setMap'),
          setDirections: jasmine.createSpy('setDirections')
        }),
        InfoWindow: jasmine.createSpy('InfoWindow').and.returnValue({
          open: jasmine.createSpy('open')
        }),
        Polyline: jasmine.createSpy('Polyline'),
        LatLngBounds: jasmine.createSpy('LatLngBounds').and.returnValue({
          extend: jasmine.createSpy('extend'),
          getCenter: jasmine.createSpy('getCenter').and.returnValue({ lat: 4.711, lng: -74.0721 })
        }),
        TravelMode: {
          DRIVING: 'DRIVING'
        },
        SymbolPath: {
          CIRCLE: 'CIRCLE'
        }
      }
    };
    (window as any).google = mockGoogleMaps;

    await TestBed.configureTestingModule({
      declarations: [RouteDetailComponent, MockCustomTranslatePipe],
      providers: [
        { provide: RoutesService, useValue: routesServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RouteDetailComponent);
    component = fixture.componentInstance;
    routesService = TestBed.inject(RoutesService) as jasmine.SpyObj<RoutesService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    routesService.getRouteDetail.and.returnValue(of(mockRouteDetail));
    translateService.instant.and.returnValue('translated text');

    // Mock getComputedStyle
    spyOn(window, 'getComputedStyle').and.returnValue({
      getPropertyValue: jasmine.createSpy('getPropertyValue').and.returnValue('')
    } as any);

    // Mock document.getElementById
    const mapElement = document.createElement('div');
    mapElement.id = 'routeDetailMap';
    spyOn(document, 'getElementById').and.returnValue(mapElement);
  });

  afterEach(() => {
    if (originalFetch) {
      window.fetch = originalFetch;
    }
    delete (window as any).google;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load route detail if routeId exists', () => {
      component.ngOnInit();
      expect(routesService.getRouteDetail).toHaveBeenCalledWith('1');
    });

    it('should set error if routeId is missing', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      component.ngOnInit();
      expect(component.error).toBeTruthy();
      expect(component.loading).toBe(false);
    });
  });

  describe('getStatusTagColor', () => {
    it('should return correct color for planned status', () => {
      expect(component.getStatusTagColor('planned')).toBe('blue');
    });

    it('should return correct color for in_progress status', () => {
      expect(component.getStatusTagColor('in_progress')).toBe('green');
    });

    it('should return correct color for with_incidents status', () => {
      expect(component.getStatusTagColor('with_incidents')).toBe('orange');
    });

    it('should return correct color for completed status', () => {
      expect(component.getStatusTagColor('completed')).toBe('default');
    });

    it('should return default for unknown status', () => {
      expect(component.getStatusTagColor('unknown' as any)).toBe('default');
    });
  });

  describe('getStatusLabel', () => {
    it('should return translated label for planned status', () => {
      component.getStatusLabel('planned');
      expect(translateService.instant).toHaveBeenCalledWith('routes.statusPlanned');
    });

    it('should return translated label for in_progress status', () => {
      component.getStatusLabel('in_progress');
      expect(translateService.instant).toHaveBeenCalledWith('routes.statusInProgress');
    });

    it('should return translated label for with_incidents status', () => {
      component.getStatusLabel('with_incidents');
      expect(translateService.instant).toHaveBeenCalledWith('routes.statusWithIncidents');
    });

    it('should return translated label for completed status', () => {
      component.getStatusLabel('completed');
      expect(translateService.instant).toHaveBeenCalledWith('routes.statusCompleted');
    });

    it('should return status string for unknown status', () => {
      const result = component.getStatusLabel('unknown' as any);
      expect(result).toBe('unknown');
    });
  });

  describe('getWaypointTypeLabel', () => {
    it('should return pickup label for pickup waypoint', () => {
      component.getWaypointTypeLabel(true);
      expect(translateService.instant).toHaveBeenCalled();
    });

    it('should return delivery label for delivery waypoint', () => {
      component.getWaypointTypeLabel(false);
      expect(translateService.instant).toHaveBeenCalled();
    });
  });

  describe('goBack', () => {
    it('should navigate to routes list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/routes']);
    });
  });

  describe('ngOnDestroy', () => {
    it('should reset map on destroy', () => {
      component.ngOnDestroy();
      expect(component['map']).toBeNull();
    });

    it('should reset directionsRenderer if it exists', () => {
      component['directionsRenderer'] = {
        setMap: jasmine.createSpy('setMap')
      } as any;
      component.ngOnDestroy();
      expect(component['directionsRenderer']).toBeNull();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should be defined', () => {
      expect(component.ngAfterViewInit).toBeDefined();
      component.ngAfterViewInit();
    });
  });

  describe('loadRouteDetail', () => {
    it('should handle error when loading route detail fails', fakeAsync(() => {
      const error = { message: 'Error loading route' };
      routesService.getRouteDetail.and.returnValue(throwError(() => error));
      
      component['loadRouteDetail']('1');
      tick();
      
      expect(component.error).toBeTruthy();
      expect(component.loading).toBe(false);
    }));

    it('should handle error without message', fakeAsync(() => {
      routesService.getRouteDetail.and.returnValue(throwError(() => ({})));
      
      component['loadRouteDetail']('1');
      tick();
      
      expect(component.error).toBeTruthy();
      expect(component.loading).toBe(false);
    }));

    it('should load route detail and prepare waypoints', fakeAsync(() => {
      // El componente espera que geocodeAddress retorne {lat: number, lng: number}
      // Necesitamos mockear geocodeAddress directamente para retornar números
      spyOn(component as any, 'geocodeAddress').and.returnValue(
        Promise.resolve({ lat: 4.711, lng: -74.0721 })
      );
      
      component['loadRouteDetail']('1');
      tick(); // Ejecutar la suscripción
      tick(200); // Ejecutar el setTimeout de initMap
      flush(); // Limpiar todos los timers pendientes
      
      expect(component.routeDetail).toEqual(mockRouteDetail);
      expect(component.loading).toBe(false);
      // Verificar que los waypoints tengan coordenadas como números
      expect(component['waypointsWithCoords']).toBeDefined();
      if (component['waypointsWithCoords']?.length > 0) {
        expect(typeof component['waypointsWithCoords'][0].latitude).toBe('number');
        expect(typeof component['waypointsWithCoords'][0].longitude).toBe('number');
      }
    }));

    it('should handle geocoding error', fakeAsync(() => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Geocoding failed'))
      );
      
      const routeWithWaypoints = {
        ...mockRouteDetail,
        waypoints: [{
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá, Colombia',
          arrivalTime: null,
          pickup: true
        }]
      };
      routesService.getRouteDetail.and.returnValue(of(routeWithWaypoints));
      
      spyOn(console, 'error');
      component['loadRouteDetail']('1');
      tick(500);
      
      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('prepareWaypoints', () => {
    it('should return early if routeDetail is null', async () => {
      component.routeDetail = null;
      await component['prepareWaypoints']();
      expect(component.waypointsWithCoords).toEqual([]);
    });

    it('should prepare waypoints with coordinates', async () => {
      component.routeDetail = mockRouteDetail;
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          json: () => Promise.resolve({
            status: 'OK',
            results: [{
              geometry: {
                location: { lat: 4.711, lng: -74.0721 }
              }
            }]
          })
        } as Response)
      );

      await component['prepareWaypoints']();
      
      expect(component.waypointsWithCoords.length).toBe(2);
      expect(component.waypointsWithCoords[0].displaySequence).toBe(1);
      expect(component.geocoding).toBe(false);
    });

    it('should handle waypoints without address', async () => {
      const routeWithoutAddress = {
        ...mockRouteDetail,
        waypoints: [{
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: '',
          arrivalTime: null,
          pickup: true
        }]
      };
      component.routeDetail = routeWithoutAddress;

      await component['prepareWaypoints']();
      
      expect(component.waypointsWithCoords.length).toBe(1);
      expect(component.waypointsWithCoords[0].latitude).toBeUndefined();
    });
  });

  describe('geocodeAddress', () => {
    it('should return coordinates when geocoding succeeds', async () => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          json: () => Promise.resolve({
            status: 'OK',
            results: [{
              geometry: {
                location: { lat: 4.711, lng: -74.0721 }
              }
            }]
          })
        } as Response)
      );

      const result = await component['geocodeAddress']('Bogotá, Colombia');
      
      expect(result).toEqual({ lat: 4.711, lng: -74.0721 });
    });

    it('should use fallback coordinates when status is REQUEST_DENIED', async () => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          json: () => Promise.resolve({
            status: 'REQUEST_DENIED',
            results: []
          })
        } as Response)
      );

      spyOn(console, 'warn');
      spyOn(component as any, 'getFallbackCoordinates').and.returnValue({ lat: 4.711, lng: -74.0721 });

      const result = await component['geocodeAddress']('Bogotá, Colombia');
      
      expect(console.warn).toHaveBeenCalled();
      expect(result).toEqual({ lat: 4.711, lng: -74.0721 });
    });

    it('should use fallback coordinates when geocoding fails', async () => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      spyOn(console, 'error');
      spyOn(component as any, 'getFallbackCoordinates').and.returnValue({ lat: 4.711, lng: -74.0721 });

      const result = await component['geocodeAddress']('Bogotá, Colombia');
      
      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual({ lat: 4.711, lng: -74.0721 });
    });

    it('should use fallback coordinates when no results', async () => {
      window.fetch = jasmine.createSpy('fetch').and.returnValue(
        Promise.resolve({
          json: () => Promise.resolve({
            status: 'ZERO_RESULTS',
            results: []
          })
        } as Response)
      );

      spyOn(component as any, 'getFallbackCoordinates').and.returnValue({ lat: 4.711, lng: -74.0721 });

      const result = await component['geocodeAddress']('Bogotá, Colombia');
      
      expect(result).toEqual({ lat: 4.711, lng: -74.0721 });
    });
  });

  describe('getFallbackCoordinates', () => {
    it('should return coordinates for known city', () => {
      spyOn(component as any, 'extractCity').and.returnValue('Bogotá');
      
      const result = component['getFallbackCoordinates']('Bogotá, Colombia');
      
      expect(result).toBeTruthy();
      expect(result!.lat).toBeCloseTo(4.711, 1);
      expect(result!.lng).toBeCloseTo(-74.0721, 1);
    });

    it('should return default coordinates for unknown city', () => {
      spyOn(component as any, 'extractCity').and.returnValue(null);
      
      const result = component['getFallbackCoordinates']('Unknown City');
      
      expect(result).toBeTruthy();
      expect(result!.lat).toBeCloseTo(4.711, 1);
      expect(result!.lng).toBeCloseTo(-74.0721, 1);
    });

    it('should return coordinates for Medellín', () => {
      spyOn(component as any, 'extractCity').and.returnValue('Medellín');
      
      const result = component['getFallbackCoordinates']('Medellín, Colombia');
      
      expect(result).toBeTruthy();
      expect(result!.lat).toBeCloseTo(6.2442, 1);
    });
  });

  describe('extractCity', () => {
    it('should return null for empty address', () => {
      const result = component['extractCity']('');
      expect(result).toBeNull();
    });

    it('should extract city from known cities regex', () => {
      expect(component['extractCity']('Bogotá, Colombia')).toBe('Bogotá');
      expect(component['extractCity']('Medellín, Colombia')).toBe('Medellín');
      expect(component['extractCity']('Cali, Colombia')).toBe('Cali');
    });

    it('should extract city from comma-separated address', () => {
      const result = component['extractCity']('Street 123, Bogotá, Colombia');
      expect(result).toBe('Bogotá');
    });

    it('should return null if address has less than 2 parts', () => {
      const result = component['extractCity']('SinglePart');
      expect(result).toBeNull();
    });

    it('should handle case insensitive matching', () => {
      const result = component['extractCity']('bogotá, colombia');
      expect(result).toBe('bogotá');
    });
  });

  describe('initMap', () => {
    it('should return early if map element is not found', () => {
      (document.getElementById as jasmine.Spy).and.returnValue(null);
      spyOn(console, 'error');
      
      component['initMap']();
      
      expect(console.error).toHaveBeenCalledWith('No se encontró el contenedor del mapa');
    });

    it('should return early if Google Maps is not available', () => {
      delete (window as any).google;
      spyOn(console, 'error');
      
      component['initMap']();
      
      expect(console.error).toHaveBeenCalledWith('Google Maps no está disponible');
      expect(component.error).toBeTruthy();
    });

    it('should initialize map with waypoints', () => {
      component.waypointsWithCoords = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        }
      ];
      (window as any).google = mockGoogleMaps;
      
      component['initMap']();
      
      expect(mockGoogleMaps.maps.Map).toHaveBeenCalled();
      expect(mockGoogleMaps.maps.DirectionsService).toHaveBeenCalled();
      expect(mockGoogleMaps.maps.DirectionsRenderer).toHaveBeenCalled();
    });

    it('should use default center if no waypoints with coordinates', () => {
      component.waypointsWithCoords = [];
      (window as any).google = mockGoogleMaps;
      
      component['initMap']();
      
      expect(mockGoogleMaps.maps.Map).toHaveBeenCalled();
      const mapCall = mockGoogleMaps.maps.Map.calls.mostRecent();
      expect(mapCall.args[1].center).toEqual({ lat: 4.711, lng: -74.0721 });
    });
  });

  describe('addMarkersToMap', () => {
    beforeEach(() => {
      component['map'] = {
        fitBounds: jasmine.createSpy('fitBounds'),
        setCenter: jasmine.createSpy('setCenter'),
        setZoom: jasmine.createSpy('setZoom')
      };
      (window as any).google = mockGoogleMaps;
    });

    it('should return early if map is not initialized', () => {
      component['map'] = null;
      component['addMarkersToMap']();
      expect(mockGoogleMaps.maps.Marker).not.toHaveBeenCalled();
    });

    it('should return early if no valid waypoints', () => {
      component.waypointsWithCoords = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          displaySequence: 1
        }
      ];
      
      component['addMarkersToMap']();
      
      expect(mockGoogleMaps.maps.Marker).not.toHaveBeenCalled();
    });

    it('should add markers for valid waypoints', () => {
      component.waypointsWithCoords = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        },
        {
          id: 2,
          orderId: 2,
          sequence: 1,
          pointName: 'Point 2',
          pointAddress: 'Medellín',
          arrivalTime: null,
          pickup: false,
          latitude: 6.2442,
          longitude: -75.5812,
          displaySequence: 2
        }
      ];
      
      component['addMarkersToMap']();
      
      expect(mockGoogleMaps.maps.Marker).toHaveBeenCalled();
      expect(component['map'].fitBounds).toHaveBeenCalled();
    });

    it('should set center and zoom for single marker', () => {
      component.waypointsWithCoords = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        }
      ];
      
      component['addMarkersToMap']();
      
      expect(component['map'].setCenter).toHaveBeenCalled();
      expect(component['map'].setZoom).toHaveBeenCalledWith(13);
    });
  });

  describe('drawRoute', () => {
    beforeEach(() => {
      component['map'] = {} as any;
      component['directionsService'] = {
        route: jasmine.createSpy('route')
      } as any;
      component['directionsRenderer'] = {
        setMap: jasmine.createSpy('setMap'),
        setDirections: jasmine.createSpy('setDirections')
      } as any;
      (window as any).google = mockGoogleMaps;
    });

    it('should return early if directionsService is not available', () => {
      // Asegurarse de que directionsRenderer tenga el método setMap para evitar errores en ngOnDestroy
      component['directionsRenderer'] = {
        setMap: jasmine.createSpy('setMap'),
        setDirections: jasmine.createSpy('setDirections')
      } as any;
      component['directionsService'] = null;
      component['drawRoute']([]);
      expect(component['directionsRenderer'].setDirections).not.toHaveBeenCalled();
    });

    it('should return early if waypoints length is less than 2', () => {
      // Asegurarse de que directionsRenderer tenga el método setMap para evitar errores en ngOnDestroy
      component['directionsRenderer'] = {
        setMap: jasmine.createSpy('setMap'),
        setDirections: jasmine.createSpy('setDirections')
      } as any;
      
      component['drawRoute']([{
        id: 1,
        orderId: 1,
        sequence: 0,
        pointName: 'Point 1',
        pointAddress: 'Bogotá',
        arrivalTime: null,
        pickup: true,
        latitude: 4.711,
        longitude: -74.0721,
        displaySequence: 1
      }]);
      
      expect(component['directionsService'].route).not.toHaveBeenCalled();
    });

    it('should draw route when status is OK', () => {
      const waypoints = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        },
        {
          id: 2,
          orderId: 2,
          sequence: 1,
          pointName: 'Point 2',
          pointAddress: 'Medellín',
          arrivalTime: null,
          pickup: false,
          latitude: 6.2442,
          longitude: -75.5812,
          displaySequence: 2
        }
      ];
      
      component['directionsService'].route.and.callFake((request: any, callback: any) => {
        callback({}, 'OK');
      });
      
      component['drawRoute'](waypoints);
      
      expect(component['directionsRenderer'].setDirections).toHaveBeenCalled();
    });

    it('should draw simple line when route fails', () => {
      const waypoints = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        },
        {
          id: 2,
          orderId: 2,
          sequence: 1,
          pointName: 'Point 2',
          pointAddress: 'Medellín',
          arrivalTime: null,
          pickup: false,
          latitude: 6.2442,
          longitude: -75.5812,
          displaySequence: 2
        }
      ];
      
      spyOn(component as any, 'drawSimpleLine');
      component['directionsService'].route.and.callFake((request: any, callback: any) => {
        callback({}, 'ERROR');
      });
      
      component['drawRoute'](waypoints);
      
      expect(component['drawSimpleLine']).toHaveBeenCalled();
    });
  });

  describe('groupWaypointsByCoordinate', () => {
    it('should group waypoints by coordinates', () => {
      const waypoints = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        },
        {
          id: 2,
          orderId: 2,
          sequence: 1,
          pointName: 'Point 2',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: false,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 2
        },
        {
          id: 3,
          orderId: 3,
          sequence: 2,
          pointName: 'Point 3',
          pointAddress: 'Medellín',
          arrivalTime: null,
          pickup: true,
          latitude: 6.2442,
          longitude: -75.5812,
          displaySequence: 3
        }
      ];
      
      const result = component['groupWaypointsByCoordinate'](waypoints);
      
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(2); // Two waypoints at same location
      expect(result[1].length).toBe(1); // One waypoint at different location
    });
  });

  describe('drawSimpleLine', () => {
    beforeEach(() => {
      component['map'] = {} as any;
      (window as any).google = mockGoogleMaps;
    });

    it('should draw polyline for waypoints', () => {
      const waypoints = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        },
        {
          id: 2,
          orderId: 2,
          sequence: 1,
          pointName: 'Point 2',
          pointAddress: 'Medellín',
          arrivalTime: null,
          pickup: false,
          latitude: 6.2442,
          longitude: -75.5812,
          displaySequence: 2
        }
      ];
      
      component['drawSimpleLine'](waypoints);
      
      expect(mockGoogleMaps.maps.Polyline).toHaveBeenCalled();
    });

    it('should filter waypoints without coordinates', () => {
      const waypoints = [
        {
          id: 1,
          orderId: 1,
          sequence: 0,
          pointName: 'Point 1',
          pointAddress: 'Bogotá',
          arrivalTime: null,
          pickup: true,
          latitude: 4.711,
          longitude: -74.0721,
          displaySequence: 1
        },
        {
          id: 2,
          orderId: 2,
          sequence: 1,
          pointName: 'Point 2',
          pointAddress: 'Medellín',
          arrivalTime: null,
          pickup: false,
          displaySequence: 2
        }
      ];
      
      component['drawSimpleLine'](waypoints);
      
      const polylineCall = mockGoogleMaps.maps.Polyline.calls.mostRecent();
      expect(polylineCall.args[0].path.length).toBe(1);
    });
  });

  describe('ngOnInit color initialization', () => {
    it('should set colors from CSS variables', () => {
      const mockComputedStyle = {
        getPropertyValue: jasmine.createSpy('getPropertyValue')
          .and.returnValue(' #3A823D ')
      };
      (window.getComputedStyle as jasmine.Spy).and.returnValue(mockComputedStyle as any);
      
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      component.ngOnInit();
      
      expect(window.getComputedStyle).toHaveBeenCalled();
    });

    it('should set default pickupTextColor if not set', () => {
      const mockComputedStyle = {
        getPropertyValue: jasmine.createSpy('getPropertyValue')
          .and.returnValue('')
      };
      (window.getComputedStyle as jasmine.Spy).and.returnValue(mockComputedStyle as any);
      
      activatedRoute.snapshot.paramMap.get.and.returnValue('1');
      component.ngOnInit();
      
      expect(component['pickupTextColor']).toBe('#ffffff');
    });
  });
});

