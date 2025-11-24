import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { CreateRouteComponent, SelectableOrder } from './create-route.component';
import { OrdersService, Order } from '../../shared/services/orders.service';
import { RoutesService, CreateRouteRequest, RouteApiResponse } from '../../shared/services/routes.service';
import { SnackService } from '../../shared/services/snack.service';
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

describe('CreateRouteComponent', () => {
  let component: CreateRouteComponent;
  let fixture: ComponentFixture<CreateRouteComponent>;
  let ordersService: jasmine.SpyObj<OrdersService>;
  let routesService: jasmine.SpyObj<RoutesService>;
  let snackService: jasmine.SpyObj<SnackService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;

  const mockOrders: Order[] = [
    {
      id: '1',
      requestedDeliveryDate: '2024-01-15',
      deliveredAt: null,
      clientName: 'Client 1',
      state: 'pending',
      country: 'Colombia',
      totalAmount: 1000,
      createdAt: '2024-01-10T10:00:00Z',
      clientId: 1,
      clientAddress: 'Address 1',
      products: []
    },
    {
      id: '2',
      requestedDeliveryDate: '2024-01-20',
      deliveredAt: null,
      clientName: 'Client 2',
      state: 'pending',
      country: 'Colombia',
      totalAmount: 2000,
      createdAt: '2024-01-11T10:00:00Z',
      clientId: 2,
      clientAddress: 'Address 2',
      products: []
    }
  ];

  beforeEach(async () => {
    const ordersServiceSpy = jasmine.createSpyObj('OrdersService', ['getPendingOrders', 'formatDate', 'formatCurrency']);
    const routesServiceSpy = jasmine.createSpyObj('RoutesService', ['createRoute']);
    const snackServiceSpy = jasmine.createSpyObj('SnackService', ['success', 'error']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      declarations: [CreateRouteComponent, MockCustomTranslatePipe],
      providers: [
        { provide: OrdersService, useValue: ordersServiceSpy },
        { provide: RoutesService, useValue: routesServiceSpy },
        { provide: SnackService, useValue: snackServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRouteComponent);
    component = fixture.componentInstance;
    ordersService = TestBed.inject(OrdersService) as jasmine.SpyObj<OrdersService>;
    routesService = TestBed.inject(RoutesService) as jasmine.SpyObj<RoutesService>;
    snackService = TestBed.inject(SnackService) as jasmine.SpyObj<SnackService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    location = TestBed.inject(Location) as jasmine.SpyObj<Location>;

    ordersService.getPendingOrders.and.returnValue(of(mockOrders));
    ordersService.formatDate.and.returnValue('2024-01-15');
    ordersService.formatCurrency.and.returnValue('$1,000.00');
    translateService.instant.and.returnValue('translated text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load data on init', () => {
      component.ngOnInit();
      expect(ordersService.getPendingOrders).toHaveBeenCalled();
    });

    it('should set pendingOrders with selected property', () => {
      component.ngOnInit();
      expect(component.pendingOrders.length).toBe(2);
      expect(component.pendingOrders[0].selected).toBe(false);
    });

    it('should sort orders by requestedDeliveryDate', () => {
      component.ngOnInit();
      expect(component.pendingOrders[0].id).toBe('1');
      expect(component.pendingOrders[1].id).toBe('2');
    });

    it('should handle error when loading orders', () => {
      ordersService.getPendingOrders.and.returnValue(throwError(() => new Error('Error loading')));
      spyOn(console, 'error');
      component.ngOnInit();
      expect(component.error).toBeTruthy();
      expect(component.isLoading).toBe(false);
      expect(component.showContent).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should sort orders when only one has requestedDeliveryDate (second has date)', () => {
      const ordersWithOneDate: Order[] = [
        {
          id: '1',
          requestedDeliveryDate: null,
          deliveredAt: null,
          clientName: 'Client 1',
          state: 'pending',
          country: 'Colombia',
          totalAmount: 1000,
          createdAt: '2024-01-10T10:00:00Z',
          clientId: 1,
          clientAddress: 'Address 1',
          products: []
        },
        {
          id: '2',
          requestedDeliveryDate: '2024-01-15',
          deliveredAt: null,
          clientName: 'Client 2',
          state: 'pending',
          country: 'Colombia',
          totalAmount: 2000,
          createdAt: '2024-01-11T10:00:00Z',
          clientId: 2,
          clientAddress: 'Address 2',
          products: []
        }
      ];
      ordersService.getPendingOrders.and.returnValue(of(ordersWithOneDate));
      component.ngOnInit();
      // La orden con fecha debe ir primero
      expect(component.pendingOrders[0].id).toBe('2');
      expect(component.pendingOrders[1].id).toBe('1');
    });

    it('should sort orders when only one has requestedDeliveryDate (first has date)', () => {
      const ordersWithOneDate: Order[] = [
        {
          id: '1',
          requestedDeliveryDate: '2024-01-15',
          deliveredAt: null,
          clientName: 'Client 1',
          state: 'pending',
          country: 'Colombia',
          totalAmount: 1000,
          createdAt: '2024-01-10T10:00:00Z',
          clientId: 1,
          clientAddress: 'Address 1',
          products: []
        },
        {
          id: '2',
          requestedDeliveryDate: null,
          deliveredAt: null,
          clientName: 'Client 2',
          state: 'pending',
          country: 'Colombia',
          totalAmount: 2000,
          createdAt: '2024-01-11T10:00:00Z',
          clientId: 2,
          clientAddress: 'Address 2',
          products: []
        }
      ];
      ordersService.getPendingOrders.and.returnValue(of(ordersWithOneDate));
      component.ngOnInit();
      // La orden con fecha debe ir primero
      expect(component.pendingOrders[0].id).toBe('1');
      expect(component.pendingOrders[1].id).toBe('2');
    });

    it('should sort orders by createdAt when neither has requestedDeliveryDate', () => {
      const ordersWithoutDates: Order[] = [
        {
          id: '1',
          requestedDeliveryDate: null,
          deliveredAt: null,
          clientName: 'Client 1',
          state: 'pending',
          country: 'Colombia',
          totalAmount: 1000,
          createdAt: '2024-01-11T10:00:00Z',
          clientId: 1,
          clientAddress: 'Address 1',
          products: []
        },
        {
          id: '2',
          requestedDeliveryDate: null,
          deliveredAt: null,
          clientName: 'Client 2',
          state: 'pending',
          country: 'Colombia',
          totalAmount: 2000,
          createdAt: '2024-01-10T10:00:00Z',
          clientId: 2,
          clientAddress: 'Address 2',
          products: []
        }
      ];
      ordersService.getPendingOrders.and.returnValue(of(ordersWithoutDates));
      component.ngOnInit();
      // La orden más antigua debe ir primero (FIFO)
      expect(component.pendingOrders[0].id).toBe('2');
      expect(component.pendingOrders[1].id).toBe('1');
    });
  });

  describe('paginatedOrders', () => {
    beforeEach(() => {
      component.pendingOrders = mockOrders.map(order => ({ ...order, selected: false }));
      component.totalItems = mockOrders.length;
    });

    it('should return orders for current page', () => {
      component.currentPage = 1;
      component.pageSize = 1;
      const result = component.paginatedOrders;
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should return orders for second page', () => {
      component.currentPage = 2;
      component.pageSize = 1;
      const result = component.paginatedOrders;
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('toggleOrderSelection', () => {
    beforeEach(() => {
      component.pendingOrders = mockOrders.map(order => ({ ...order, selected: false }));
    });

    it('should toggle order selection', () => {
      component.toggleOrderSelection('1');
      expect(component.pendingOrders[0].selected).toBe(true);
      component.toggleOrderSelection('1');
      expect(component.pendingOrders[0].selected).toBe(false);
    });

    it('should not toggle if order not found', () => {
      component.toggleOrderSelection('999');
      expect(component.pendingOrders.every(o => !o.selected)).toBe(true);
    });
  });

  describe('formatDate', () => {
    it('should call ordersService.formatDate', () => {
      component.formatDate('2024-01-15');
      expect(ordersService.formatDate).toHaveBeenCalledWith('2024-01-15');
    });
  });

  describe('formatCurrency', () => {
    it('should call ordersService.formatCurrency', () => {
      component.formatCurrency(1000);
      expect(ordersService.formatCurrency).toHaveBeenCalledWith(1000);
    });
  });

  describe('getSelectedOrdersCount', () => {
    beforeEach(() => {
      component.pendingOrders = mockOrders.map(order => ({ ...order, selected: false }));
    });

    it('should return 0 when no orders selected', () => {
      expect(component.getSelectedOrdersCount()).toBe(0);
    });

    it('should return correct count of selected orders', () => {
      component.pendingOrders[0].selected = true;
      component.pendingOrders[1].selected = true;
      expect(component.getSelectedOrdersCount()).toBe(2);
    });
  });

  describe('generateRoute', () => {
    beforeEach(() => {
      component.pendingOrders = mockOrders.map(order => ({ ...order, selected: false }));
    });

    it('should show alert if no orders selected', () => {
      spyOn(window, 'alert');
      component.generateRoute();
      expect(window.alert).toHaveBeenCalled();
      expect(routesService.createRoute).not.toHaveBeenCalled();
    });

    it('should show alert if no date selected', () => {
      component.pendingOrders[0].selected = true;
      component.selectedDate = null;
      spyOn(window, 'alert');
      component.generateRoute();
      expect(window.alert).toHaveBeenCalled();
      expect(routesService.createRoute).not.toHaveBeenCalled();
    });

    it('should create route with selected orders and date', () => {
      component.pendingOrders[0].selected = true;
      // Crear fecha en UTC para evitar problemas de zona horaria
      component.selectedDate = new Date('2024-01-20T12:00:00Z');
      component.selectedVehicle = 1;
      const mockResponse: RouteApiResponse = {
        id: 1,
        vehicle_id: 1,
        created_at: '2024-01-20T10:00:00Z',
        state: 'planned',
        deliveries: 1,
        gmaps_metrics: '{}',
        country: 'Colombia',
        waypoints: []
      };
      routesService.createRoute.and.returnValue(of(mockResponse));
      component.generateRoute();
      expect(routesService.createRoute).toHaveBeenCalled();
      const callArgs = routesService.createRoute.calls.mostRecent().args[0] as CreateRouteRequest;
      expect(callArgs.orders).toEqual([1]);
      // La fecha debe estar en formato YYYY-MM-DD
      expect(callArgs.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(callArgs.vehicle_id).toBe(1);
    });

    it('should navigate to routes list on success', () => {
      component.pendingOrders[0].selected = true;
      // Crear fecha en UTC para evitar problemas de zona horaria
      component.selectedDate = new Date('2024-01-20T12:00:00Z');
      const mockResponse: RouteApiResponse = {
        id: 1,
        vehicle_id: 1,
        created_at: '2024-01-20T10:00:00Z',
        state: 'planned',
        deliveries: 1,
        gmaps_metrics: '{}',
        country: 'Colombia',
        waypoints: []
      };
      routesService.createRoute.and.returnValue(of(mockResponse));
      component.generateRoute();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/routes']);
    });

    it('should show error snack on failure', () => {
      component.pendingOrders[0].selected = true;
      // Crear fecha en UTC para evitar problemas de zona horaria
      component.selectedDate = new Date('2024-01-20T12:00:00Z');
      routesService.createRoute.and.returnValue(throwError(() => ({ message: 'Error' })));
      component.generateRoute();
      expect(snackService.error).toHaveBeenCalled();
      expect(component.error).toBeTruthy();
    });
  });

  describe('goBack', () => {
    it('should call location.back', () => {
      component.goBack();
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('disabledDate', () => {
    it('should disable dates before today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(component.disabledDate(yesterday)).toBe(true);
    });

    it('should not disable today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(component.disabledDate(today)).toBe(false);
    });

    it('should not disable future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(component.disabledDate(tomorrow)).toBe(false);
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call addAccessibilityToSelectSearchInput after timeout', fakeAsync(() => {
      spyOn(component as any, 'addAccessibilityToSelectSearchInput');
      component.ngAfterViewInit();
      tick(100);
      expect((component as any).addAccessibilityToSelectSearchInput).toHaveBeenCalled();
    }));
  });

  describe('addAccessibilityToSelectSearchInput', () => {
    beforeEach(() => {
      // Limpiar cualquier elemento existente
      const existing = document.getElementById('vehicle-select');
      if (existing) {
        existing.remove();
      }
    });

    afterEach(() => {
      // Limpiar después de cada test de forma segura
      const existing = document.getElementById('vehicle-select');
      if (existing) {
        existing.remove();
      }
    });

    it('should not throw when vehicleSelect does not exist', () => {
      expect(() => (component as any).addAccessibilityToSelectSearchInput()).not.toThrow();
    });

    it('should not throw when searchInput does not exist', () => {
      const mockSelect = document.createElement('div');
      mockSelect.id = 'vehicle-select';
      document.body.appendChild(mockSelect);
      
      expect(() => (component as any).addAccessibilityToSelectSearchInput()).not.toThrow();
    });

    it('should add attributes when searchInput exists with first selector', () => {
      const mockSelect = document.createElement('div');
      mockSelect.id = 'vehicle-select';
      const mockInput = document.createElement('input');
      mockInput.className = 'ant-select-selection-search-input';
      mockSelect.appendChild(mockInput);
      document.body.appendChild(mockSelect);
      
      translateService.instant.and.returnValue('Vehicle/Driver');
      
      (component as any).addAccessibilityToSelectSearchInput();
      
      expect(mockInput.getAttribute('aria-label')).toBe('Vehicle/Driver');
      expect(mockInput.getAttribute('title')).toBe('Vehicle/Driver');
    });

    it('should add attributes when searchInput exists with second selector', () => {
      const mockSelect = document.createElement('div');
      mockSelect.id = 'vehicle-select';
      const searchContainer = document.createElement('div');
      searchContainer.className = 'ant-select-selection-search';
      const mockInput = document.createElement('input');
      searchContainer.appendChild(mockInput);
      mockSelect.appendChild(searchContainer);
      document.body.appendChild(mockSelect);
      
      translateService.instant.and.returnValue('Vehicle/Driver');
      
      (component as any).addAccessibilityToSelectSearchInput();
      
      expect(mockInput.getAttribute('aria-label')).toBe('Vehicle/Driver');
      expect(mockInput.getAttribute('title')).toBe('Vehicle/Driver');
    });

    it('should add placeholder when it does not exist', () => {
      const mockSelect = document.createElement('div');
      mockSelect.id = 'vehicle-select';
      const mockInput = document.createElement('input');
      mockInput.className = 'ant-select-selection-search-input';
      mockSelect.appendChild(mockInput);
      document.body.appendChild(mockSelect);
      
      translateService.instant.and.callFake((key: string) => {
        if (key === 'createRoute.vehicleDriver') return 'Vehicle/Driver';
        if (key === 'common.search') return 'Search';
        return key;
      });
      
      (component as any).addAccessibilityToSelectSearchInput();
      
      expect(mockInput.getAttribute('placeholder')).toBe('Vehicle/Driver - Search');
    });

    it('should not override existing placeholder', () => {
      const mockSelect = document.createElement('div');
      mockSelect.id = 'vehicle-select';
      const mockInput = document.createElement('input');
      mockInput.className = 'ant-select-selection-search-input';
      mockInput.setAttribute('placeholder', 'Existing placeholder');
      mockSelect.appendChild(mockInput);
      document.body.appendChild(mockSelect);
      
      translateService.instant.and.returnValue('Vehicle/Driver');
      
      (component as any).addAccessibilityToSelectSearchInput();
      
      expect(mockInput.getAttribute('placeholder')).toBe('Existing placeholder');
    });
  });

  describe('formatDateForBackend', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15); // Enero 15, 2024
      const result = (component as any).formatDateForBackend(date);
      expect(result).toBe('2024-01-15');
    });

    it('should pad month and day with zeros', () => {
      const date = new Date(2024, 0, 5); // Enero 5, 2024
      const result = (component as any).formatDateForBackend(date);
      expect(result).toBe('2024-01-05');
    });
  });

  describe('generateRoute - error cases', () => {
    beforeEach(() => {
      component.pendingOrders = mockOrders.map(order => ({ ...order, selected: false }));
    });

    it('should handle error without message property', () => {
      component.pendingOrders[0].selected = true;
      component.selectedDate = new Date('2024-01-20T12:00:00Z');
      routesService.createRoute.and.returnValue(throwError(() => ({ error: 'Error' })));
      translateService.instant.and.returnValue('Error creating route');
      spyOn(console, 'error');
      
      component.generateRoute();
      
      expect(snackService.error).toHaveBeenCalled();
      expect(component.error).toBeTruthy();
      expect(component.isLoading).toBe(false);
    });

    it('should handle error with message property', () => {
      component.pendingOrders[0].selected = true;
      component.selectedDate = new Date('2024-01-20T12:00:00Z');
      routesService.createRoute.and.returnValue(throwError(() => ({ message: 'Specific error message' })));
      translateService.instant.and.returnValue('Error creating route');
      spyOn(console, 'error');
      
      component.generateRoute();
      
      expect(snackService.error).toHaveBeenCalled();
      expect(component.error).toBe('Specific error message');
      expect(component.isLoading).toBe(false);
    });

    it('should handle multiple selected orders', () => {
      component.pendingOrders[0].selected = true;
      component.pendingOrders[1].selected = true;
      component.selectedDate = new Date('2024-01-20T12:00:00Z');
      const mockResponse: RouteApiResponse = {
        id: 1,
        vehicle_id: 1,
        created_at: '2024-01-20T10:00:00Z',
        state: 'planned',
        deliveries: 2,
        gmaps_metrics: '{}',
        country: 'Colombia',
        waypoints: []
      };
      routesService.createRoute.and.returnValue(of(mockResponse));
      
      component.generateRoute();
      
      const callArgs = routesService.createRoute.calls.mostRecent().args[0] as CreateRouteRequest;
      expect(callArgs.orders).toEqual([1, 2]);
    });
  });
});

