import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    waypoints: []
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
    it('should return translated label for status', () => {
      component.getStatusLabel('planned');
      expect(translateService.instant).toHaveBeenCalled();
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

  describe('ngAfterViewInit', () => {
    it('should handle missing map container gracefully', () => {
      spyOn(console, 'error');
      component.routeDetail = mockRouteDetail;
      component.ngAfterViewInit();
      // Should not throw error, just log it
      expect(console.error).toHaveBeenCalled();
    });

    it('should initialize map when container exists', () => {
      // Create a mock map element
      const mapElement = document.createElement('div');
      mapElement.id = 'routeDetailMap';
      document.body.appendChild(mapElement);

      // Mock google.maps
      (window as any).google = {
        maps: {
          Map: jasmine.createSpy('Map').and.returnValue({}),
          DirectionsService: jasmine.createSpy('DirectionsService'),
          DirectionsRenderer: jasmine.createSpy('DirectionsRenderer').and.returnValue({})
        }
      };

      component.routeDetail = mockRouteDetail;
      component.ngAfterViewInit();

      // Clean up
      document.body.removeChild(mapElement);
      delete (window as any).google;
    });
  });

  describe('ngOnDestroy', () => {
    it('should reset map on destroy', () => {
      component.ngOnDestroy();
      expect(component['map']).toBeNull();
    });
  });
});

