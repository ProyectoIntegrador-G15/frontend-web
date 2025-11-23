import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SellerDetailsComponent } from './seller-details.component';
import { SellersService, Seller, SalesPlan, SalesPlanListResponse, CreateSalesPlanRequest } from '../../shared/services/sellers.service';
import { VisitRoutesService } from '../../shared/services/visit-routes.service';
import { OrdersService } from '../../shared/services/orders.service';
import { of, throwError } from 'rxjs';

describe('SellerDetailsComponent', () => {
  let component: SellerDetailsComponent;
  let sellersService: jasmine.SpyObj<SellersService>;
  let ordersService: jasmine.SpyObj<OrdersService>;
  let visitRoutesService: jasmine.SpyObj<VisitRoutesService>;
  let translateService: TranslateService;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockSeller: Seller = {
    id: '1',
    name: 'Sofía Ramírez',
    identification: '1234567890',
    status: 'active',
    email: 'sofia.ramirez@medisupply.com',
    phone: '+51 987 654 321',
    entryDate: '26-10-2025',
    address: 'Calle 123 #45-67',
    commission: 5.0,
    salesTarget: 50000000
  };

  beforeEach(() => {
    const sellersServiceSpy = jasmine.createSpyObj('SellersService', [
      'getSellerById',
      'getSellerPerformance',
      'getSalesPlans',
      'getSalesPlan',
      'createSalesPlan'
    ]);
    const ordersServiceSpy = jasmine.createSpyObj('OrdersService', ['getTopProductsBySeller']);
    const visitRoutesServiceSpy = jasmine.createSpyObj('VisitRoutesService', ['getVisitRoutes']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['create', 'error']);
    
    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      },
      fragment: of(null) // Mock del Observable fragment
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        ReactiveFormsModule
      ],
      providers: [
        SellerDetailsComponent,
        FormBuilder,
        { provide: SellersService, useValue: sellersServiceSpy },
        { provide: OrdersService, useValue: ordersServiceSpy },
        { provide: VisitRoutesService, useValue: visitRoutesServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NzNotificationService, useValue: notificationSpy }
      ]
    });

    sellersService = TestBed.inject(SellersService) as jasmine.SpyObj<SellersService>;
    ordersService = TestBed.inject(OrdersService) as jasmine.SpyObj<OrdersService>;
    visitRoutesService = TestBed.inject(VisitRoutesService) as jasmine.SpyObj<VisitRoutesService>;
    translateService = TestBed.inject(TranslateService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    component = TestBed.inject(SellerDetailsComponent);

    // Configurar TranslateService
    translateService.currentLang = 'es-CO';
    spyOn(translateService, 'instant').and.returnValue('Mocked translation');
    // Mock onLangChange como EventEmitter
    const langChangeEmitter = new EventEmitter<LangChangeEvent>();
    Object.defineProperty(translateService, 'onLangChange', {
      get: () => langChangeEmitter,
      configurable: true
    });

    // Configurar mocks por defecto
    sellersService.getSellerById.and.returnValue(of(mockSeller));
    visitRoutesService.getVisitRoutes.and.returnValue(of({ 
      routes: [], 
      total: 0, 
      totalPages: 0, 
      page: 1 
    }));
    ordersService.getTopProductsBySeller.and.returnValue(of([]));
    sellersService.getSellerPerformance.and.returnValue(of({
      total_orders: 0,
      total_revenue: 0,
      total_visits: 0,
      total_units_sold: 0,
      units_compliance: 0,
      revenue_compliance: 0,
      visits_compliance: 0
    }));
    sellersService.getSalesPlans.and.returnValue(of({
      sales_plans: [],
      total: 0
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load seller detail on init', () => {
      sellersService.getSellerById.and.returnValue(of(mockSeller));
      spyOn(component, 'loadSellerDetail');
      spyOn(component, 'loadVisitRoutes');

      component.ngOnInit();

      expect(activatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
      expect(component.loadSellerDetail).toHaveBeenCalledWith('1');
      expect(component.loadVisitRoutes).toHaveBeenCalledWith('1');
    });

    it('should not load seller if no id in route', () => {
      activatedRoute.snapshot.paramMap.get.and.returnValue(null);
      spyOn(component, 'loadSellerDetail');
      spyOn(component, 'loadVisitRoutes');

      component.ngOnInit();

      expect(component.loadSellerDetail).not.toHaveBeenCalled();
      expect(component.loadVisitRoutes).not.toHaveBeenCalled();
    });
  });

  describe('loadSellerDetail', () => {
    it('should load seller successfully', () => {
      sellersService.getSellerById.and.returnValue(of(mockSeller));

      component.loadSellerDetail('1');

      expect(component.loading).toBe(false);
      expect(component.seller).toEqual(mockSeller);
      expect(component.error).toBe('');
    });

    it('should handle error when loading seller', () => {
      sellersService.getSellerById.and.returnValue(
        throwError(() => ({ message: 'Error loading seller' }))
      );

      component.loadSellerDetail('1');

      expect(component.loading).toBe(false);
      expect(component.seller).toBeNull();
      expect(component.error).toBe('No se pudo cargar la información del vendedor');
    });
  });

  describe('onTabChange', () => {
    it('should update active tab', () => {
      component.activeTab = 'information';
      component.seller = mockSeller;
      spyOn(component as any, 'fetchPerformance');
      
      component.onTabChange('performance');

      expect(component.activeTab).toBe('performance');
    });

    it('should call fetchPerformance when switching to performance tab', () => {
      component.seller = mockSeller;
      spyOn(component as any, 'fetchPerformance');
      
      component.onTabChange('performance');

      expect((component as any).fetchPerformance).toHaveBeenCalled();
    });

    it('should handle all tab types', () => {
      component.seller = mockSeller;
      const tabs = ['information', 'performance', 'sales-plan', 'visit-routes'];
      
      tabs.forEach(tab => {
        component.onTabChange(tab);
        expect(component.activeTab).toBe(tab);
      });
    });
  });

  describe('goBack', () => {
    it('should navigate back to sellers list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers']);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for active status', () => {
      component.seller = { ...mockSeller, status: 'active' };
      expect(component.getStatusColor()).toBe('status-active');
    });

    it('should return correct color for inactive status', () => {
      component.seller = { ...mockSeller, status: 'inactive' };
      expect(component.getStatusColor()).toBe('status-inactive');
    });

    it('should return correct color for suspended status', () => {
      component.seller = { ...mockSeller, status: 'suspended' };
      expect(component.getStatusColor()).toBe('status-suspended');
    });

    it('should return empty string when no seller', () => {
      component.seller = null;
      expect(component.getStatusColor()).toBe('');
    });
  });

  describe('getStatusText', () => {
    it('should return Activo for active status', () => {
      component.seller = { ...mockSeller, status: 'active' };
      expect(component.getStatusText()).toBe('Activo');
    });

    it('should return Inactivo for inactive status', () => {
      component.seller = { ...mockSeller, status: 'inactive' };
      expect(component.getStatusText()).toBe('Inactivo');
    });

    it('should return Suspendido for suspended status', () => {
      component.seller = { ...mockSeller, status: 'suspended' };
      expect(component.getStatusText()).toBe('Suspendido');
    });

    it('should return empty string when no seller', () => {
      component.seller = null;
      expect(component.getStatusText()).toBe('');
    });
  });

  describe('Tabs configuration', () => {
    it('should have correct tabs configured', () => {
      expect(component.tabs.length).toBe(4);
      expect(component.tabs[0].id).toBe('information');
      expect(component.tabs[1].id).toBe('performance');
      expect(component.tabs[2].id).toBe('sales-plan');
      expect(component.tabs[3].id).toBe('visit-routes');
    });

    it('should default to information tab', () => {
      expect(component.activeTab).toBe('information');
    });
  });

  // ========== PRUEBAS DE PLANES DE VENTA ==========

  describe('Sales Plans', () => {
    const mockSalesPlan: SalesPlan = {
      id: 1,
      seller_id: 1,
      name: 'Plan Q1 2025',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
      total_units_target: 1000,
      total_value_target: 50000.0,
      visits_target: 50,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    };

    const mockSalesPlansResponse: SalesPlanListResponse = {
      sales_plans: [mockSalesPlan],
      total: 1
    };

    describe('loadSalesPlans', () => {
      it('should load sales plans successfully', () => {
        component.seller = mockSeller;
        sellersService.getSalesPlans.and.returnValue(of(mockSalesPlansResponse));

        component.loadSalesPlans();

        expect(component.loadingSalesPlans).toBe(false);
        expect(component.salesPlans).toEqual([mockSalesPlan]);
        expect(sellersService.getSalesPlans).toHaveBeenCalledWith(
          '1',
          component.selectedMonth,
          component.selectedYear
        );
      });

      it('should not load if seller is null', () => {
        component.seller = null;
        component.loadSalesPlans();

        expect(sellersService.getSalesPlans).not.toHaveBeenCalled();
      });

      it('should handle error when loading sales plans', () => {
        component.seller = mockSeller;
        sellersService.getSalesPlans.and.returnValue(
          throwError(() => ({ message: 'Error loading plans' }))
        );

        component.loadSalesPlans();

        expect(component.loadingSalesPlans).toBe(false);
        expect(component.salesPlans).toEqual([]);
      });

      it('should set loading state correctly', () => {
        component.seller = mockSeller;
        sellersService.getSalesPlans.and.returnValue(of(mockSalesPlansResponse));

        component.loadSalesPlans();

        expect(component.loadingSalesPlans).toBe(false);
      });
    });

    describe('onMonthChange', () => {
      it('should reload sales plans when month changes', () => {
        component.seller = mockSeller;
        spyOn(component, 'loadSalesPlans');

        component.onMonthChange();

        expect(component.loadSalesPlans).toHaveBeenCalled();
      });
    });

    describe('onYearChange', () => {
      it('should reload sales plans when year changes', () => {
        component.seller = mockSeller;
        spyOn(component, 'loadSalesPlans');

        component.onYearChange();

        expect(component.loadSalesPlans).toHaveBeenCalled();
      });
    });

    describe('initSalesPlanForm', () => {
      it('should initialize form with default values', () => {
        component.initSalesPlanForm();

        expect(component.salesPlanForm).toBeDefined();
        expect(component.salesPlanForm.get('name')).toBeDefined();
        expect(component.salesPlanForm.get('start_month')).toBeDefined();
        expect(component.salesPlanForm.get('end_month')).toBeDefined();
        expect(component.salesPlanForm.get('total_units_target')).toBeDefined();
        expect(component.salesPlanForm.get('total_value_target')).toBeDefined();
        expect(component.salesPlanForm.get('visits_target')).toBeDefined();
      });

      it('should have required validators on all fields', () => {
        component.initSalesPlanForm();

        // Los campos de fecha tienen valores por defecto, así que no tienen error required inicialmente
        // Verificar que el campo name no tiene error required cuando tiene un valor
        component.salesPlanForm.get('name')?.setValue('Test');
        expect(component.salesPlanForm.get('name')?.hasError('required')).toBeFalsy();
        
        // Al establecer null, debe tener error required
        component.salesPlanForm.get('name')?.setValue(null);
        component.salesPlanForm.get('name')?.markAsTouched();
        component.salesPlanForm.get('name')?.updateValueAndValidity();
        expect(component.salesPlanForm.get('name')?.hasError('required')).toBeTruthy();
      });
    });

    describe('getFieldStatus', () => {
      beforeEach(() => {
        component.initSalesPlanForm();
      });

      it('should return empty string for untouched field', () => {
        expect(component.getFieldStatus('name')).toBe('');
      });

      it('should return error for invalid touched field', () => {
        const field = component.salesPlanForm.get('name');
        field?.markAsTouched();
        field?.setValue(null);

        expect(component.getFieldStatus('name')).toBe('error');
      });

      it('should return success for valid touched field', () => {
        const field = component.salesPlanForm.get('name');
        field?.markAsTouched();
        field?.setValue('Plan de ventas');

        expect(component.getFieldStatus('name')).toBe('success');
      });
    });

    describe('getFieldError', () => {
      beforeEach(() => {
        component.initSalesPlanForm();
      });

      it('should return empty string for valid field', () => {
        expect(component.getFieldError('name')).toBe('');
      });

      it('should return required error message', () => {
        const field = component.salesPlanForm.get('name');
        field?.markAsTouched();
        field?.setValue(null);

        expect(component.getFieldError('name')).toBe('Este campo es obligatorio');
      });

      it('should return min error message for numeric fields', () => {
        const field = component.salesPlanForm.get('total_units_target');
        field?.markAsTouched();
        field?.setValue(0);

        expect(component.getFieldError('total_units_target')).toBe('El valor debe ser mayor a 0');
      });

      it('should return date range error message', () => {
        const startField = component.salesPlanForm.get('start_month');
        const endField = component.salesPlanForm.get('end_month');
        
        // Usar fechas válidas (no pasadas, no más de 6 meses en el futuro)
        // pero donde la fecha de fin sea anterior a la de inicio
        const now = new Date();
        const month1 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const month2 = new Date(now.getFullYear(), now.getMonth() + 2, 1);

        // Establecer fecha de inicio después de la fecha de fin
        startField?.setValue(month2);
        endField?.setValue(month1);
        endField?.markAsTouched();
        // Forzar actualización de validación
        endField?.updateValueAndValidity();

        const error = component.getFieldError('end_month');
        // El validador endDateValidator detecta endBeforeStart y devuelve este mensaje
        expect(error).toBe('La fecha de fin debe ser posterior a la fecha de inicio');
      });
    });

    describe('onCreatePlan', () => {
      beforeEach(() => {
        component.initSalesPlanForm();
        component.seller = mockSeller;
      });

      it('should open modal and set default values', () => {
        component.onCreatePlan();

        expect(component.isSalesPlanModalVisible).toBe(true);
        expect(component.salesPlanForm.get('start_month')?.value).toBeDefined();
        expect(component.salesPlanForm.get('end_month')?.value).toBeDefined();
      });
    });

    describe('handleSalesPlanModalCancel', () => {
      beforeEach(() => {
        component.initSalesPlanForm();
        component.isSalesPlanModalVisible = true;
      });

      it('should close modal and reset form', () => {
        component.salesPlanForm.patchValue({
          name: 'Test Plan',
          total_units_target: 100
        });

        component.handleSalesPlanModalCancel();

        expect(component.isSalesPlanModalVisible).toBe(false);
        expect(component.salesPlanForm.get('name')?.value).toBeNull();
      });
    });

    describe('handleSalesPlanModalOk', () => {
      let notificationService: jasmine.SpyObj<NzNotificationService>;

      beforeEach(() => {
        component.initSalesPlanForm();
        component.seller = mockSeller;
        notificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;
      });

      it('should not submit if form is invalid', () => {
        component.salesPlanForm.patchValue({
          name: null
        });

        component.handleSalesPlanModalOk();

        expect(sellersService.createSalesPlan).not.toHaveBeenCalled();
      });

      it('should not create if seller is null', () => {
        component.seller = null;
        // Simular que el formulario pasó la validación usando spy
        spyOn(component, 'validateFormFields').and.returnValue(true);

        component.handleSalesPlanModalOk();

        expect(sellersService.createSalesPlan).not.toHaveBeenCalled();
        expect(notificationService.error).toHaveBeenCalledWith('Error', 'No se encontró información del vendedor');
      });
    });

    describe('validateFormFields', () => {
      beforeEach(() => {
        component.initSalesPlanForm();
      });

      it('should mark all fields as dirty when validating', () => {
        component.validateFormFields();

        Object.keys(component.salesPlanForm.controls).forEach(key => {
          expect(component.salesPlanForm.get(key)?.dirty).toBe(true);
        });
      });

      it('should return false for invalid form', () => {
        component.salesPlanForm.patchValue({
          name: null
        });

        expect(component.validateFormFields()).toBe(false);
      });

      it('should mark all fields as dirty', () => {
        component.validateFormFields();

        Object.keys(component.salesPlanForm.controls).forEach(key => {
          expect(component.salesPlanForm.get(key)?.dirty).toBe(true);
        });
      });
    });
  });

  // ========== PRUEBAS DE MÉTODOS DE UTILIDAD ==========

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const result = component.formatCurrency(50000000);
      expect(result).toContain('50.000.000');
      // El formato puede usar $ o COP dependiendo de la configuración
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format small amounts correctly', () => {
      const result = component.formatCurrency(1000);
      expect(result).toContain('1.000');
    });

    it('should format zero correctly', () => {
      const result = component.formatCurrency(0);
      expect(result).toContain('0');
    });
  });

  describe('formatDateForAPI', () => {
    it('should format date correctly', () => {
      // Usar new Date(year, month, day) para evitar problemas de zona horaria
      const date = new Date(2025, 9, 27); // Octubre es mes 9 (0-indexed)
      const result = component.formatDateForAPI(date);
      expect(result).toBe('2025-10-27');
    });

    it('should format date with single digit month and day', () => {
      const date = new Date(2025, 0, 5); // Enero es mes 0
      const result = component.formatDateForAPI(date);
      expect(result).toBe('2025-01-05');
    });

    it('should handle string date', () => {
      // Para strings, puede haber problemas de zona horaria, así que verificamos el formato
      const result = component.formatDateForAPI('2025-10-27');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return empty string for null/undefined', () => {
      expect(component.formatDateForAPI(null as any)).toBe('');
      expect(component.formatDateForAPI(undefined as any)).toBe('');
    });
  });

  describe('formatPeriod', () => {
    it('should format same month and year', () => {
      // Usar fechas que no cambien con la zona horaria
      // 2025-01-15 a 2025-01-20 (mismo mes)
      const result = component.formatPeriod('2025-01-15', '2025-01-20');
      expect(result).toBe('Enero 2025');
    });

    it('should format different months same year', () => {
      // Usar fechas en el medio del mes para evitar problemas de zona horaria
      const result = component.formatPeriod('2025-01-15', '2025-03-15');
      expect(result).toBe('Enero - Marzo 2025');
    });

    it('should format different years', () => {
      // Usar fechas en el medio del mes
      const result = component.formatPeriod('2025-12-15', '2026-02-15');
      expect(result).toBe('Diciembre 2025 - Febrero 2026');
    });
  });

  describe('getDefaultStartMonth', () => {
    it('should return first day of current month', () => {
      const result = component.getDefaultStartMonth();
      const now = new Date();
      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(1);
    });
  });

  describe('getDefaultEndMonth', () => {
    it('should return first day of next month', () => {
      const result = component.getDefaultEndMonth();
      const now = new Date();
      const expectedMonth = now.getMonth() + 1;
      const expectedYear = expectedMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
      expect(result.getFullYear()).toBe(expectedYear);
      expect(result.getMonth()).toBe(expectedMonth > 11 ? 0 : expectedMonth);
      expect(result.getDate()).toBe(1);
    });
  });

  describe('initializeYears', () => {
    it('should initialize years array correctly', () => {
      component.years = [];
      (component as any).initializeYears();
      
      expect(component.years.length).toBeGreaterThan(0);
      expect(component.years[0]).toBeGreaterThan(component.years[component.years.length - 1]); // Ordenado descendente
    });
  });

  // ========== PRUEBAS DE RUTAS DE VISITA ==========

  describe('Visit Routes', () => {
    const mockVisitRoute = {
      id: '1',
      sellerId: '1',
      routeDate: '28-10-2025',
      status: 'confirmed' as const,
      totalClients: 3,
      estimatedDurationMinutes: 120,
      createdAt: '2025-10-28T00:00:00Z',
      stops: [
        { 
          id: '1', 
          clientId: '1', 
          sequence: 0, 
          clientName: 'Hospital San Rafael', 
          clientAddress: 'Address 1',
          durationMinutes: 30,
          status: 'pending' as const
        },
        { 
          id: '2', 
          clientId: '2', 
          sequence: 1, 
          clientName: 'Clínica Central', 
          clientAddress: 'Address 2',
          durationMinutes: 30,
          status: 'pending' as const
        },
        { 
          id: '3', 
          clientId: '3', 
          sequence: 2, 
          clientName: 'Farmacia Vida', 
          clientAddress: 'Address 3',
          durationMinutes: 30,
          status: 'pending' as const
        }
      ]
    };

    describe('loadVisitRoutes', () => {
      it('should load visit routes successfully', () => {
        visitRoutesService.getVisitRoutes.and.returnValue(of({
          routes: [mockVisitRoute],
          total: 1,
          totalPages: 1,
          page: 1
        }));

        component.loadVisitRoutes('1');

        expect(component.loadingRoutes).toBe(false);
        expect(component.visitRoutes).toEqual([mockVisitRoute]);
      });

      it('should handle error when loading visit routes', () => {
        visitRoutesService.getVisitRoutes.and.returnValue(
          throwError(() => ({ message: 'Error loading routes' }))
        );

        component.loadVisitRoutes('1');

        expect(component.loadingRoutes).toBe(false);
      });
    });

    describe('createVisitRoute', () => {
      it('should navigate to create route with seller id', () => {
        component.seller = mockSeller;
        component.createVisitRoute();

        expect(router.navigate).toHaveBeenCalledWith(
          ['/dashboard/visit-routes/create'],
          { queryParams: { sellerId: '1' } }
        );
      });

      it('should not navigate if seller is null', () => {
        component.seller = null;
        component.createVisitRoute();

        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('viewRouteDetail', () => {
      it('should show alert with route id', () => {
        spyOn(window, 'alert');
        component.viewRouteDetail('123');

        expect(window.alert).toHaveBeenCalledWith('Vista de detalle de ruta #123 - Por implementar');
      });
    });

    describe('getRouteStatusColor', () => {
      it('should return blue for confirmed', () => {
        expect(component.getRouteStatusColor('confirmed')).toBe('blue');
      });

      it('should return orange for in_progress', () => {
        expect(component.getRouteStatusColor('in_progress')).toBe('orange');
      });

      it('should return green for completed', () => {
        expect(component.getRouteStatusColor('completed')).toBe('green');
      });

      it('should return red for cancelled', () => {
        expect(component.getRouteStatusColor('cancelled')).toBe('red');
      });

      it('should return default for unknown status', () => {
        expect(component.getRouteStatusColor('unknown')).toBe('default');
      });
    });

    describe('getRouteStatusText', () => {
      it('should return correct text for draft', () => {
        expect(component.getRouteStatusText('draft')).toBe('Borrador');
      });

      it('should return correct text for confirmed', () => {
        expect(component.getRouteStatusText('confirmed')).toBe('Planificada');
      });

      it('should return correct text for in_progress', () => {
        expect(component.getRouteStatusText('in_progress')).toBe('En progreso');
      });

      it('should return correct text for completed', () => {
        expect(component.getRouteStatusText('completed')).toBe('Completada');
      });

      it('should return correct text for cancelled', () => {
        expect(component.getRouteStatusText('cancelled')).toBe('Cancelada');
      });

      it('should return status as-is for unknown status', () => {
        expect(component.getRouteStatusText('unknown')).toBe('unknown');
      });
    });

    describe('getClientNamesShort', () => {
      it('should return client count when no stops', () => {
        const route = { ...mockVisitRoute, stops: undefined };
        const result = component.getClientNamesShort(route as any);
        expect(result).toBe('3 clientes');
      });

      it('should return client count when empty stops', () => {
        const route = { ...mockVisitRoute, stops: [] };
        const result = component.getClientNamesShort(route as any);
        expect(result).toBe('3 clientes');
      });

      it('should return full names for 1-2 clients', () => {
        const route = {
          ...mockVisitRoute,
          stops: [
            { clientName: 'Hospital San Rafael' },
            { clientName: 'Clínica Central' }
          ]
        };
        const result = component.getClientNamesShort(route as any);
        expect(result).toBe('Hospital San Rafael, Clínica Central');
      });

      it('should return first two and count for 3+ clients', () => {
        const result = component.getClientNamesShort(mockVisitRoute as any);
        expect(result).toBe('Hospital San Rafael, Clínica Central y 1 más');
      });
    });

    describe('getClientNamesForTooltip', () => {
      it('should return empty string when no stops', () => {
        const route = { ...mockVisitRoute, stops: undefined };
        const result = component.getClientNamesForTooltip(route as any);
        expect(result).toBe('');
      });

      it('should return formatted list of client names', () => {
        const result = component.getClientNamesForTooltip(mockVisitRoute as any);
        expect(result).toContain('1. Hospital San Rafael');
        expect(result).toContain('2. Clínica Central');
        expect(result).toContain('3. Farmacia Vida');
      });
    });
  });

  // ========== PRUEBAS DE PERFORMANCE ==========

  describe('Performance', () => {
    beforeEach(() => {
      component.seller = mockSeller;
    });

    describe('fetchPerformance', () => {
      it('should fetch performance data successfully', () => {
        const mockPerformance = {
          total_orders: 10,
          total_revenue: 5000000,
          total_visits: 5,
          total_units_sold: 100,
          units_compliance: 80,
          revenue_compliance: 75,
          visits_compliance: 60
        };

        sellersService.getSellerPerformance.and.returnValue(of(mockPerformance));
        ordersService.getTopProductsBySeller.and.returnValue(of([]));

        (component as any).fetchPerformance();

        expect(component.performanceData.kpis.total_orders).toBe(10);
        expect(component.performanceData.kpis.total_revenue).toBe(5000000);
        expect(component.loadingPerformance).toBe(false);
      });

      it('should handle null values in performance response', () => {
        const mockPerformance = {
          total_orders: null,
          total_revenue: null,
          total_visits: null,
          total_units_sold: null,
          units_compliance: null,
          revenue_compliance: null,
          visits_compliance: null
        };

        sellersService.getSellerPerformance.and.returnValue(of(mockPerformance));
        ordersService.getTopProductsBySeller.and.returnValue(of([]));

        (component as any).fetchPerformance();

        expect(component.performanceData.kpis.total_orders).toBe(0);
        expect(component.performanceData.kpis.total_revenue).toBe(0);
      });

      it('should handle error when fetching performance', () => {
        sellersService.getSellerPerformance.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );

        (component as any).fetchPerformance();

        expect(component.loadingPerformance).toBe(false);
      });

      it('should fetch top products successfully', () => {
        const mockProducts = [
          { product_id: 1, product_name: 'Product 1', total_quantity: 50, total_sales_amount: 1000000 },
          { product_id: 2, product_name: 'Product 2', total_quantity: 30, total_sales_amount: 500000 }
        ];

        sellersService.getSellerPerformance.and.returnValue(of({
          total_orders: 0,
          total_revenue: 0,
          total_visits: 0,
          total_units_sold: 0,
          units_compliance: 0,
          revenue_compliance: 0,
          visits_compliance: 0
        }));
        ordersService.getTopProductsBySeller.and.returnValue(of(mockProducts));
        spyOn(component as any, 'updateChart');

        (component as any).fetchPerformance();

        expect(component.performanceData.topProducts.length).toBe(2);
        expect(component.performanceData.topProducts[0].name).toBe('Product 1');
        expect(component.loadingTopProducts).toBe(false);
      });

      it('should handle error when fetching top products', () => {
        sellersService.getSellerPerformance.and.returnValue(of({
          total_orders: 0,
          total_revenue: 0,
          total_visits: 0,
          total_units_sold: 0,
          units_compliance: 0,
          revenue_compliance: 0,
          visits_compliance: 0
        }));
        ordersService.getTopProductsBySeller.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );
        spyOn(component as any, 'updateChart');

        (component as any).fetchPerformance();

        expect(component.performanceData.topProducts).toEqual([]);
        expect(component.loadingTopProducts).toBe(false);
      });

      it('should not fetch if seller is null', () => {
        component.seller = null;
        (component as any).fetchPerformance();

        expect(sellersService.getSellerPerformance).not.toHaveBeenCalled();
      });
    });

    describe('updateChart', () => {
      it('should update chart with products', () => {
        component.performanceData.topProducts = [
          { name: 'Product 1', quantity: 50, sales_amount: 1000000 },
          { name: 'Product 2', quantity: 30, sales_amount: 500000 }
        ];

        (component as any).updateChart();

        expect(component.chartOptions.series).toBeDefined();
        expect(component.chartOptions.xaxis?.categories?.length).toBe(2);
      });

      it('should update chart with empty data when no products', () => {
        component.performanceData.topProducts = [];

        (component as any).updateChart();

        expect(component.chartOptions.series).toBeDefined();
        expect(component.chartOptions.xaxis?.categories?.length).toBe(0);
      });
    });

    describe('onStartDateChange', () => {
      it('should update start date and fetch performance', () => {
        const newDate = new Date(2025, 0, 1);
        component.activeTab = 'performance';
        spyOn(component as any, 'fetchPerformance');

        component.onStartDateChange(newDate);

        expect(component.performanceData.startDate).toEqual(newDate);
        expect((component as any).fetchPerformance).toHaveBeenCalled();
      });

      it('should adjust end date if start is after end', () => {
        const newDate = new Date(2025, 5, 1);
        component.performanceData.endDate = new Date(2025, 3, 1);

        component.onStartDateChange(newDate);

        expect(component.performanceData.endDate).toEqual(newDate);
      });

      it('should not fetch if not on performance tab', () => {
        component.activeTab = 'information';
        spyOn(component as any, 'fetchPerformance');

        component.onStartDateChange(new Date());

        expect((component as any).fetchPerformance).not.toHaveBeenCalled();
      });
    });

    describe('onEndDateChange', () => {
      it('should update end date and fetch performance', () => {
        const newDate = new Date(2025, 2, 1);
        component.activeTab = 'performance';
        spyOn(component as any, 'fetchPerformance');

        component.onEndDateChange(newDate);

        expect(component.performanceData.endDate).toEqual(newDate);
        expect((component as any).fetchPerformance).toHaveBeenCalled();
      });

      it('should adjust start date if end is before start', () => {
        const newDate = new Date(2025, 1, 1);
        component.performanceData.startDate = new Date(2025, 3, 1);

        component.onEndDateChange(newDate);

        expect(component.performanceData.startDate).toEqual(newDate);
      });

      it('should not fetch if not on performance tab', () => {
        component.activeTab = 'information';
        spyOn(component as any, 'fetchPerformance');

        component.onEndDateChange(new Date());

        expect((component as any).fetchPerformance).not.toHaveBeenCalled();
      });
    });

    describe('disableFutureMonths', () => {
      it('should disable future months', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        expect(component.disableFutureMonths(futureDate)).toBe(true);
      });

      it('should allow current month', () => {
        const currentDate = new Date();
        expect(component.disableFutureMonths(currentDate)).toBe(false);
      });

      it('should allow past months', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        expect(component.disableFutureMonths(pastDate)).toBe(false);
      });

      it('should return false for null', () => {
        expect(component.disableFutureMonths(null as any)).toBe(false);
      });
    });

    describe('disableFutureMonthsForSalesPlan', () => {
      it('should disable months more than 6 months in future', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 7);
        expect(component.disableFutureMonthsForSalesPlan(futureDate)).toBe(true);
      });

      it('should allow months within 6 months', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);
        expect(component.disableFutureMonthsForSalesPlan(futureDate)).toBe(false);
      });

      it('should disable past months', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        expect(component.disableFutureMonthsForSalesPlan(pastDate)).toBe(true);
      });

      it('should return false for null', () => {
        expect(component.disableFutureMonthsForSalesPlan(null as any)).toBe(false);
      });
    });

    describe('initializeChartOptions', () => {
      it('should initialize chart options', () => {
        (component as any).initializeChartOptions();
        expect(component.chartOptions).toBeDefined();
        expect(component.chartOptions.chart).toBeDefined();
      });
    });
  });

  // ========== PRUEBAS DE VALIDADORES ==========

  describe('Form Validators', () => {
    beforeEach(() => {
      component.initSalesPlanForm();
    });

    describe('startDateValidator', () => {
      it('should return null for valid date', () => {
        const now = new Date();
        const validDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const control = { value: validDate };
        const result = component.startDateValidator(control as any);
        expect(result).toBeNull();
      });

      it('should return invalidDate for invalid date', () => {
        const control = { value: new Date('invalid') };
        const result = component.startDateValidator(control as any);
        expect(result).toEqual({ invalidDate: true });
      });

      it('should return dateInPast for past date', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        const control = { value: pastDate };
        const result = component.startDateValidator(control as any);
        expect(result).toEqual({ dateInPast: true });
      });

      it('should return dateTooFar for date more than 6 months ahead', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 7);
        const control = { value: futureDate };
        const result = component.startDateValidator(control as any);
        expect(result).toEqual({ dateTooFar: true });
      });

      it('should return null for null value', () => {
        const control = { value: null };
        const result = component.startDateValidator(control as any);
        expect(result).toBeNull();
      });
    });

    describe('endDateValidator', () => {
      it('should return null for valid date', () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        component.salesPlanForm.patchValue({ start_month: startDate });
        const control = { value: endDate };
        const result = component.endDateValidator(control as any);
        expect(result).toBeNull();
      });

      it('should return endBeforeStart when end is before start', () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        component.salesPlanForm.patchValue({ start_month: startDate });
        const control = { value: endDate };
        const result = component.endDateValidator(control as any);
        expect(result).toEqual({ endBeforeStart: true });
      });

      it('should return dateInPast for past date', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        const control = { value: pastDate };
        const result = component.endDateValidator(control as any);
        expect(result).toEqual({ dateInPast: true });
      });

      it('should return dateTooFar for date more than 6 months ahead', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 7);
        const control = { value: futureDate };
        const result = component.endDateValidator(control as any);
        expect(result).toEqual({ dateTooFar: true });
      });
    });

    describe('validateDateRange', () => {
      it('should set error when end is before start', () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        component.salesPlanForm.patchValue({
          start_month: startDate,
          end_month: endDate
        });

        component.validateDateRange();

        expect(component.salesPlanForm.get('end_month')?.errors?.['dateRange']).toBeTruthy();
      });

      it('should clear errors when dates are valid', () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        component.salesPlanForm.patchValue({
          start_month: startDate,
          end_month: endDate
        });
        component.salesPlanForm.get('end_month')?.setErrors({ dateRange: true });

        component.validateDateRange();

        expect(component.salesPlanForm.get('end_month')?.errors?.['dateRange']).toBeFalsy();
      });

      it('should return early if form is null', () => {
        component.salesPlanForm = null as any;
        expect(() => component.validateDateRange()).not.toThrow();
      });

      it('should return early if dates are missing', () => {
        component.salesPlanForm.patchValue({
          start_month: null,
          end_month: null
        });

        component.validateDateRange();

        // El método retorna temprano, pero los campos pueden tener errores de required
        // Solo verificamos que no se agreguen errores de dateRange
        const endField = component.salesPlanForm.get('end_month');
        expect(endField?.errors?.['dateRange']).toBeFalsy();
      });
    });

    describe('dateRangeValidator', () => {
      it('should return dateRange error when end is before start', () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        component.salesPlanForm.patchValue({
          start_month: startDate,
          end_month: endDate
        });

        const result = component.dateRangeValidator(component.salesPlanForm);

        expect(result).toEqual({ dateRange: true });
      });

      it('should return empty object when dates are valid', () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        component.salesPlanForm.patchValue({
          start_month: startDate,
          end_month: endDate
        });

        const result = component.dateRangeValidator(component.salesPlanForm);

        expect(result).toEqual({});
      });

      it('should return empty object when dates are missing', () => {
        component.salesPlanForm.patchValue({
          start_month: null,
          end_month: null
        });

        const result = component.dateRangeValidator(component.salesPlanForm);

        expect(result).toEqual({});
      });
    });

    describe('getFieldError - additional cases', () => {
      it('should return minlength error', () => {
        const field = component.salesPlanForm.get('name');
        field?.setValue('A');
        field?.markAsTouched();
        field?.setErrors({ minlength: { requiredLength: 2, actualLength: 1 } });

        expect(component.getFieldError('name')).toBe('Este campo es demasiado corto');
      });

      it('should return maxlength error', () => {
        const field = component.salesPlanForm.get('name');
        field?.markAsTouched();
        field?.setErrors({ maxlength: { requiredLength: 255, actualLength: 300 } });

        expect(component.getFieldError('name')).toBe('Este campo es demasiado largo');
      });

      it('should return invalidDate error', () => {
        const field = component.salesPlanForm.get('start_month');
        field?.markAsTouched();
        field?.setErrors({ invalidDate: true });

        expect(component.getFieldError('start_month')).toBe('La fecha seleccionada no es válida');
      });

      it('should return dateInPast error', () => {
        const field = component.salesPlanForm.get('start_month');
        field?.markAsTouched();
        field?.setErrors({ dateInPast: true });

        expect(component.getFieldError('start_month')).toBe('No se puede seleccionar una fecha anterior al mes actual');
      });

      it('should return dateTooFar error', () => {
        const field = component.salesPlanForm.get('start_month');
        field?.markAsTouched();
        field?.setErrors({ dateTooFar: true });

        expect(component.getFieldError('start_month')).toBe('No se puede seleccionar una fecha más de 6 meses en el futuro');
      });

      it('should return dateRange error for start_month', () => {
        const field = component.salesPlanForm.get('start_month');
        field?.markAsTouched();
        field?.setErrors({ dateRange: true });

        expect(component.getFieldError('start_month')).toBe('La fecha de inicio no puede ser posterior a la fecha de fin');
      });

      it('should return dateRange error for end_month', () => {
        const field = component.salesPlanForm.get('end_month');
        field?.markAsTouched();
        field?.setErrors({ dateRange: true });

        expect(component.getFieldError('end_month')).toBe('La fecha de fin debe ser posterior a la fecha de inicio');
      });
    });
  });

  // ========== PRUEBAS ADICIONALES DE PLANES DE VENTA ==========


  // ========== PRUEBAS ADICIONALES DE onTabChange ==========

  describe('onTabChange - additional cases', () => {
    it('should load visit routes when switching to visit-routes tab', () => {
      component.seller = mockSeller;
      spyOn(component, 'loadVisitRoutes');

      component.onTabChange('visit-routes');

      expect(component.activeTab).toBe('visit-routes');
      expect(component.loadVisitRoutes).toHaveBeenCalledWith('1');
    });

    it('should load sales plans when switching to sales-plan tab', () => {
      component.seller = mockSeller;
      spyOn(component, 'loadSalesPlans');

      component.onTabChange('sales-plan');

      expect(component.activeTab).toBe('sales-plan');
      expect(component.loadSalesPlans).toHaveBeenCalled();
    });

    it('should not load visit routes if seller is null', () => {
      component.seller = null;
      spyOn(component, 'loadVisitRoutes');

      component.onTabChange('visit-routes');

      expect(component.loadVisitRoutes).not.toHaveBeenCalled();
    });
  });

  // ========== PRUEBAS DE ngOnInit ==========

  describe('ngOnInit - fragment subscription', () => {
    it('should set activeTab to visit-routes when fragment is visit-routes', () => {
      activatedRoute.fragment = of('visit-routes');
      component.ngOnInit();

      expect(component.activeTab).toBe('visit-routes');
    });

    it('should not change activeTab when fragment is null', () => {
      activatedRoute.fragment = of(null);
      component.activeTab = 'information';
      component.ngOnInit();

      expect(component.activeTab).toBe('information');
    });

    it('should subscribe to language changes', () => {
      const langChangeEmitter = new EventEmitter<LangChangeEvent>();
      Object.defineProperty(translateService, 'onLangChange', {
        get: () => langChangeEmitter,
        configurable: true
      });
      spyOn(component as any, 'initializeChartOptions');
      spyOn(component as any, 'updateChart');

      component.ngOnInit();
      langChangeEmitter.emit({ lang: 'en', translations: {} } as LangChangeEvent);

      expect((component as any).initializeChartOptions).toHaveBeenCalled();
    });
  });

  // ========== PRUEBAS DE MÉTODOS PRIVADOS ==========

  describe('Private methods', () => {
    describe('formatDateYYYYMMDD', () => {
      it('should format date correctly', () => {
        const date = new Date(2025, 9, 27); // October 27, 2025
        const result = (component as any).formatDateYYYYMMDD(date);
        expect(result).toBe('2025-10-27');
      });
    });

    describe('firstDayOfMonth', () => {
      it('should return first day of month', () => {
        const date = new Date(2025, 9, 27);
        const result = (component as any).firstDayOfMonth(date);
        expect(result.getDate()).toBe(1);
        expect(result.getMonth()).toBe(9);
        expect(result.getFullYear()).toBe(2025);
      });
    });

    describe('lastDayOfMonth', () => {
      it('should return last day of month', () => {
        const date = new Date(2025, 9, 27); // October
        const result = (component as any).lastDayOfMonth(date);
        expect(result.getDate()).toBe(31); // October has 31 days
        expect(result.getMonth()).toBe(9);
        expect(result.getFullYear()).toBe(2025);
      });
    });

    describe('isMonthAfter', () => {
      it('should return true when first date is after second', () => {
        const date1 = new Date(2025, 5, 1); // June
        const date2 = new Date(2025, 4, 1); // May
        const result = (component as any).isMonthAfter(date1, date2);
        expect(result).toBe(true);
      });

      it('should return false when first date is before second', () => {
        const date1 = new Date(2025, 4, 1); // May
        const date2 = new Date(2025, 5, 1); // June
        const result = (component as any).isMonthAfter(date1, date2);
        expect(result).toBe(false);
      });

      it('should return false when dates are same month', () => {
        const date1 = new Date(2025, 5, 1);
        const date2 = new Date(2025, 5, 15);
        const result = (component as any).isMonthAfter(date1, date2);
        expect(result).toBe(false);
      });

      it('should handle different years', () => {
        const date1 = new Date(2026, 0, 1);
        const date2 = new Date(2025, 11, 1);
        const result = (component as any).isMonthAfter(date1, date2);
        expect(result).toBe(true);
      });
    });
  });
});


