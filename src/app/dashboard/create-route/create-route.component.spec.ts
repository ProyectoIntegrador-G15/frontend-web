import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      component.ngOnInit();
      expect(component.error).toBeTruthy();
      expect(component.isLoading).toBe(false);
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
});

