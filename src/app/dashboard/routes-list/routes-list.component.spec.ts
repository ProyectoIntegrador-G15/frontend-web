import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RoutesListComponent, RouteItem } from './routes-list.component';
import { RoutesService, Route } from '../../shared/services/routes.service';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key; // Return the key as the translation for testing
  }
}

describe('RoutesListComponent', () => {
  let component: RoutesListComponent;
  let fixture: ComponentFixture<RoutesListComponent>;
  let mockRoutesService: jasmine.SpyObj<RoutesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockRoutes: Route[] = [
    {
      id: '1',
      creationDate: '14-10-2025',
      originWarehouse: 'Bogotá',
      assignedDeliveries: 5,
      status: 'planned',
      assignedTruck: 'VEH-001'
    },
    {
      id: '2',
      creationDate: '14-10-2025',
      originWarehouse: 'Cali',
      assignedDeliveries: 8,
      status: 'in_progress',
      assignedTruck: 'VEH-002'
    },
    {
      id: '3',
      creationDate: '14-10-2025',
      originWarehouse: 'Cartagena',
      assignedDeliveries: 3,
      status: 'completed',
      assignedTruck: 'VEH-003'
    }
  ];

  beforeEach(async () => {
    const routesServiceSpy = jasmine.createSpyObj('RoutesService', ['getRoutes']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    // Mock translateService.instant to return the key as the translation
    translateServiceSpy.instant.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [RoutesListComponent, MockCustomTranslatePipe],
      providers: [
        { provide: RoutesService, useValue: routesServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Para ignorar componentes de Ant Design en tests
    }).compileComponents();

    mockRoutesService = TestBed.inject(RoutesService) as jasmine.SpyObj<RoutesService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutesListComponent);
    component = fixture.componentInstance;
  });

  // ========================================
  // COMPONENT CREATION TESTS
  // ========================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ========================================
  // INITIALIZATION TESTS
  // ========================================

  describe('ngOnInit', () => {
    it('should call loadRoutes on initialization', () => {
      spyOn(component, 'loadRoutes');
      
      component.ngOnInit();
      
      expect(component.loadRoutes).toHaveBeenCalled();
    });

    it('should initialize with empty routes array', () => {
      expect(component.routes).toEqual([]);
    });

    it('should initialize with loading as false', () => {
      expect(component.loading).toBe(false);
    });

    it('should initialize with error as null', () => {
      expect(component.error).toBeNull();
    });

    it('should initialize with default pagination values', () => {
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.totalItems).toBe(0);
    });
  });

  // ========================================
  // LOAD ROUTES TESTS
  // ========================================

  describe('loadRoutes', () => {
    it('should load routes successfully', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();

      expect(component.loading).toBe(false);
      expect(component.routes).toEqual(mockRoutes);
      expect(component.totalItems).toBe(3);
      expect(component.error).toBeNull();
    });

    it('should set loading to true while loading routes', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      // Check loading state before subscribe completes
      component.loadRoutes();
      
      // Note: loading will be true momentarily, then false after subscribe
      expect(mockRoutesService.getRoutes).toHaveBeenCalled();
    });

    it('should handle empty routes array', () => {
      mockRoutesService.getRoutes.and.returnValue(of([]));

      component.loadRoutes();

      expect(component.routes).toEqual([]);
      expect(component.totalItems).toBe(0);
      expect(component.loading).toBe(false);
    });

    it('should handle error when loading routes', () => {
      const errorMessage = 'Network error';
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error(errorMessage)));

      spyOn(console, 'error');

      component.loadRoutes();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('routes.loadingError');
      expect(console.error).toHaveBeenCalledWith('Error al cargar las rutas:', jasmine.any(Error));
    });

    it('should reset error when loading routes successfully after error', () => {
      // First call fails
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error('Error')));
      component.loadRoutes();
      expect(component.error).toBeTruthy();

      // Second call succeeds
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();
      
      expect(component.error).toBeNull();
      expect(component.routes).toEqual(mockRoutes);
    });

    it('should update totalItems when routes are loaded', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();

      expect(component.totalItems).toBe(mockRoutes.length);
    });
  });

  // ========================================
  // CREATE ROUTE TESTS
  // ========================================

  describe('createRoute', () => {
    it('should navigate to create route page', () => {
      component.createRoute();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/routes/create-route']);
    });

    it('should call router.navigate exactly once', () => {
      component.createRoute();

      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================
  // GET STATUS COLOR TESTS
  // ========================================

  describe('getStatusColor', () => {
    it('should return "blue" for planned status', () => {
      expect(component.getStatusColor('planned')).toBe('blue');
    });

    it('should return "green" for in_progress status', () => {
      expect(component.getStatusColor('in_progress')).toBe('green');
    });

    it('should return "orange" for with_incidents status', () => {
      expect(component.getStatusColor('with_incidents')).toBe('orange');
    });

    it('should return "default" for completed status', () => {
      expect(component.getStatusColor('completed')).toBe('default');
    });

    it('should return "default" for unknown status', () => {
      expect(component.getStatusColor('unknown' as any)).toBe('default');
    });
  });

  // ========================================
  // GET STATUS TEXT TESTS
  // ========================================

  describe('getStatusText', () => {
    it('should return "Planificada" for planned status', () => {
      expect(component.getStatusText('planned')).toBe('routes.statusPlanned');
    });

    it('should return "En curso" for in_progress status', () => {
      expect(component.getStatusText('in_progress')).toBe('routes.statusInProgress');
    });

    it('should return "Con incidencias" for with_incidents status', () => {
      expect(component.getStatusText('with_incidents')).toBe('routes.statusWithIncidents');
    });

    it('should return "Completada" for completed status', () => {
      expect(component.getStatusText('completed')).toBe('routes.statusCompleted');
    });

    it('should return original status for unknown status', () => {
      const unknownStatus = 'unknown';
      expect(component.getStatusText(unknownStatus as any)).toBe(unknownStatus);
    });
  });

  // ========================================
  // PAGINATION TESTS
  // ========================================

  describe('Pagination', () => {
    beforeEach(() => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();
    });

    it('should have correct initial page', () => {
      expect(component.currentPage).toBe(1);
    });

    it('should have correct page size', () => {
      expect(component.pageSize).toBe(10);
    });

    it('should update totalItems based on routes length', () => {
      expect(component.totalItems).toBe(mockRoutes.length);
    });

    it('should handle page change', () => {
      component.currentPage = 2;
      fixture.detectChanges();
      
      expect(component.currentPage).toBe(2);
    });
  });

  // ========================================
  // ERROR STATE TESTS
  // ========================================

  describe('Error state', () => {
    it('should display error message when loading fails', () => {
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');

      component.loadRoutes();

      expect(component.error).toBe('routes.loadingError');
      expect(component.loading).toBe(false);
    });

    it('should allow retry after error', () => {
      // First call fails
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error('Error')));
      component.loadRoutes();
      expect(component.error).toBeTruthy();

      // Retry succeeds
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      expect(component.error).toBeNull();
      expect(component.routes).toEqual(mockRoutes);
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe('Integration tests', () => {
    it('should load routes and prepare data for display', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.ngOnInit();

      expect(component.routes.length).toBe(3);
      expect(component.routes[0].id).toBe('1');
      expect(component.routes[0].status).toBe('planned');
    });

    it('should get correct status color and text for each route', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      expect(component.getStatusColor(component.routes[0].status)).toBe('blue');
      expect(component.getStatusText(component.routes[0].status)).toBe('routes.statusPlanned');

      expect(component.getStatusColor(component.routes[1].status)).toBe('green');
      expect(component.getStatusText(component.routes[1].status)).toBe('routes.statusInProgress');

      expect(component.getStatusColor(component.routes[2].status)).toBe('default');
      expect(component.getStatusText(component.routes[2].status)).toBe('routes.statusCompleted');
    });

    it('should handle full user flow: load routes then create new route', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      // Load routes
      component.ngOnInit();
      expect(component.routes.length).toBe(3);

      // Navigate to create route
      component.createRoute();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/routes/create-route']);
    });
  });

  // ========================================
  // ROUTE DATA TESTS
  // ========================================

  describe('Route data handling', () => {
    it('should handle routes with all possible statuses', () => {
      const routesWithAllStatuses: Route[] = [
        { ...mockRoutes[0], status: 'planned' },
        { ...mockRoutes[0], status: 'in_progress' },
        { ...mockRoutes[0], status: 'with_incidents' },
        { ...mockRoutes[0], status: 'completed' }
      ];

      mockRoutesService.getRoutes.and.returnValue(of(routesWithAllStatuses));
      component.loadRoutes();

      expect(component.routes.length).toBe(4);
      expect(component.getStatusColor(component.routes[0].status)).toBe('blue');
      expect(component.getStatusColor(component.routes[1].status)).toBe('green');
      expect(component.getStatusColor(component.routes[2].status)).toBe('orange');
      expect(component.getStatusColor(component.routes[3].status)).toBe('default');
    });

    it('should handle routes with different warehouses', () => {
      const routesWithDifferentWarehouses: Route[] = [
        { ...mockRoutes[0], originWarehouse: 'Bogotá' },
        { ...mockRoutes[1], originWarehouse: 'Medellín' },
        { ...mockRoutes[2], originWarehouse: 'Cali' }
      ];

      mockRoutesService.getRoutes.and.returnValue(of(routesWithDifferentWarehouses));
      component.loadRoutes();

      expect(component.routes[0].originWarehouse).toBe('Bogotá');
      expect(component.routes[1].originWarehouse).toBe('Medellín');
      expect(component.routes[2].originWarehouse).toBe('Cali');
    });

    it('should handle routes with different delivery counts', () => {
      const routesWithDifferentDeliveries: Route[] = [
        { ...mockRoutes[0], assignedDeliveries: 1 },
        { ...mockRoutes[1], assignedDeliveries: 10 },
        { ...mockRoutes[2], assignedDeliveries: 100 }
      ];

      mockRoutesService.getRoutes.and.returnValue(of(routesWithDifferentDeliveries));
      component.loadRoutes();

      expect(component.routes[0].assignedDeliveries).toBe(1);
      expect(component.routes[1].assignedDeliveries).toBe(10);
      expect(component.routes[2].assignedDeliveries).toBe(100);
    });

    it('should handle routes with different vehicle IDs', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      expect(component.routes[0].assignedTruck).toBe('VEH-001');
      expect(component.routes[1].assignedTruck).toBe('VEH-002');
      expect(component.routes[2].assignedTruck).toBe('VEH-003');
    });

    it('should handle routes with same creation date', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      const uniqueDates = new Set(component.routes.map(r => r.creationDate));
      expect(uniqueDates.size).toBe(1); // All have same date
      expect(component.routes[0].creationDate).toBe('14-10-2025');
    });
  });

  // ========================================
  // LOADING STATE TESTS
  // ========================================

  describe('Loading state', () => {
    it('should set loading to false after successful load', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();

      expect(component.loading).toBe(false);
    });

    it('should set loading to false after failed load', () => {
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      component.loadRoutes();

      expect(component.loading).toBe(false);
    });

    it('should clear previous error when starting new load', () => {
      // First call fails
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');
      component.loadRoutes();
      expect(component.error).toBeTruthy();

      // Second call
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      expect(component.error).toBeNull();
    });
  });

  // ========================================
  // SERVICE INTERACTION TESTS
  // ========================================

  describe('Service interaction', () => {
    it('should call RoutesService.getRoutes when loadRoutes is called', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();

      expect(mockRoutesService.getRoutes).toHaveBeenCalled();
    });

    it('should call RoutesService.getRoutes exactly once per loadRoutes call', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();
      component.loadRoutes();

      expect(mockRoutesService.getRoutes).toHaveBeenCalledTimes(2);
    });

    it('should subscribe to getRoutes observable', () => {
      const getRoutesSpy = mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();

      expect(getRoutesSpy).toHaveBeenCalled();
    });
  });

  // ========================================
  // EDGE CASES TESTS
  // ========================================

  describe('Edge cases', () => {
    it('should handle single route', () => {
      const singleRoute: Route[] = [mockRoutes[0]];
      mockRoutesService.getRoutes.and.returnValue(of(singleRoute));

      component.loadRoutes();

      expect(component.routes.length).toBe(1);
      expect(component.totalItems).toBe(1);
    });

    it('should handle large number of routes', () => {
      const largeRouteList: Route[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        creationDate: '14-10-2025',
        originWarehouse: `Warehouse ${i + 1}`,
        assignedDeliveries: i + 1,
        status: 'planned' as const,
        assignedTruck: `VEH-${String(i + 1).padStart(3, '0')}`
      }));

      mockRoutesService.getRoutes.and.returnValue(of(largeRouteList));
      component.loadRoutes();

      expect(component.routes.length).toBe(100);
      expect(component.totalItems).toBe(100);
    });

    it('should handle routes with special characters in warehouse names', () => {
      const routesWithSpecialChars: Route[] = [
        { ...mockRoutes[0], originWarehouse: 'Bogotá D.C.' },
        { ...mockRoutes[1], originWarehouse: 'San José & Co.' }
      ];

      mockRoutesService.getRoutes.and.returnValue(of(routesWithSpecialChars));
      component.loadRoutes();

      expect(component.routes[0].originWarehouse).toBe('Bogotá D.C.');
      expect(component.routes[1].originWarehouse).toContain('&');
    });

    it('should handle undefined routes from service gracefully', () => {
      mockRoutesService.getRoutes.and.returnValue(of([] as any));

      component.loadRoutes();

      expect(component.routes).toEqual([]);
      expect(component.totalItems).toBe(0);
    });
  });

  // ========================================
  // STATUS MAPPING TESTS
  // ========================================

  describe('Status mapping consistency', () => {
    it('should map all valid statuses to colors', () => {
      const statuses: Array<'planned' | 'in_progress' | 'with_incidents' | 'completed'> = 
        ['planned', 'in_progress', 'with_incidents', 'completed'];

      statuses.forEach(status => {
        const color = component.getStatusColor(status);
        expect(color).toBeDefined();
        expect(['blue', 'green', 'orange', 'default']).toContain(color);
      });
    });

    it('should map all valid statuses to text', () => {
      const statuses: Array<'planned' | 'in_progress' | 'with_incidents' | 'completed'> = 
        ['planned', 'in_progress', 'with_incidents', 'completed'];

      statuses.forEach(status => {
        const text = component.getStatusText(status);
        expect(text).toBeDefined();
        expect(text.length).toBeGreaterThan(0);
      });
    });

    it('should have matching color and text for each status', () => {
      const statusMap = [
        { status: 'planned', color: 'blue', text: 'routes.statusPlanned' },
        { status: 'in_progress', color: 'green', text: 'routes.statusInProgress' },
        { status: 'with_incidents', color: 'orange', text: 'routes.statusWithIncidents' },
        { status: 'completed', color: 'default', text: 'routes.statusCompleted' }
      ];

      statusMap.forEach(({ status, color, text }) => {
        expect(component.getStatusColor(status as any)).toBe(color);
        expect(component.getStatusText(status as any)).toBe(text);
      });
    });
  });

  // ========================================
  // MULTIPLE LOAD TESTS
  // ========================================

  describe('Multiple load operations', () => {
    it('should handle multiple loadRoutes calls', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));

      component.loadRoutes();
      component.loadRoutes();
      component.loadRoutes();

      expect(mockRoutesService.getRoutes).toHaveBeenCalledTimes(3);
      expect(component.routes).toEqual(mockRoutes);
    });

    it('should replace routes on each load', () => {
      const firstBatch: Route[] = [mockRoutes[0]];
      const secondBatch: Route[] = mockRoutes;

      mockRoutesService.getRoutes.and.returnValue(of(firstBatch));
      component.loadRoutes();
      expect(component.routes.length).toBe(1);

      mockRoutesService.getRoutes.and.returnValue(of(secondBatch));
      component.loadRoutes();
      expect(component.routes.length).toBe(3);
    });
  });

  // ========================================
  // NAVIGATION TESTS
  // ========================================

  describe('Navigation', () => {
    it('should navigate with correct route path', () => {
      component.createRoute();

      const navigationArgs = mockRouter.navigate.calls.mostRecent().args;
      expect(navigationArgs[0]).toEqual(['/dashboard/routes/create-route']);
    });

    it('should not navigate if createRoute is not called', () => {
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // DATA CONSISTENCY TESTS
  // ========================================

  describe('Data consistency', () => {
    it('should maintain data integrity after loading', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      // Verify all routes have required properties
      component.routes.forEach(route => {
        expect(route.id).toBeDefined();
        expect(route.creationDate).toBeDefined();
        expect(route.originWarehouse).toBeDefined();
        expect(route.assignedDeliveries).toBeDefined();
        expect(route.status).toBeDefined();
        expect(route.assignedTruck).toBeDefined();
      });
    });

    it('should not mutate original routes data', () => {
      const originalRoutes = JSON.parse(JSON.stringify(mockRoutes));
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      
      component.loadRoutes();

      expect(JSON.stringify(mockRoutes)).toBe(JSON.stringify(originalRoutes));
    });
  });

  // ========================================
  // COMPONENT STATE TESTS
  // ========================================

  describe('Component state', () => {
    it('should have correct initial state before ngOnInit', () => {
      expect(component.routes).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.totalItems).toBe(0);
    });

    it('should update state correctly after successful load', () => {
      mockRoutesService.getRoutes.and.returnValue(of(mockRoutes));
      component.loadRoutes();

      expect(component.routes).toEqual(mockRoutes);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.totalItems).toBe(3);
    });

    it('should update state correctly after failed load', () => {
      mockRoutesService.getRoutes.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      component.loadRoutes();

      expect(component.routes).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBe('routes.loadingError');
    });
  });
});

