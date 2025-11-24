import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SellerDetailsComponent } from './seller-details.component';
import { SellersService, Seller, SalesPlan, SalesPlanListResponse, CreateSalesPlanRequest } from '../../shared/services/sellers.service';
import { VisitRoutesService, VisitRoute } from '../../shared/services/visit-routes.service';
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
    spyOn(translateService, 'instant').and.callFake((key: string) => {
      const translations: { [key: string]: string } = {
        'sellers.statusActive': 'Activo',
        'sellers.statusInactive': 'Inactivo',
        'sellers.statusSuspended': 'Suspendido',
        'common.active': 'Activo',
        'common.inactive': 'Inactivo',
        'common.error': 'Error',
        'sellerDetails.error.loadSeller': 'No se pudo cargar la información del vendedor',
        'sellerDetails.error.noSellerInfo': 'No se pudo cargar la información del vendedor',
        'sellerDetails.salesPlan.error.loadSeller': 'No se encontró información del vendedor',
        'sellerDetails.tabs.information': 'Información',
        'sellerDetails.tabs.performance': 'Desempeño',
        'sellerDetails.tabs.salesPlan': 'Plan de ventas',
        'sellerDetails.tabs.visitRoutes': 'Rutas de visita',
        'sellerDetails.salesPlan.errors.required': 'Este campo es obligatorio',
        'sellerDetails.salesPlan.errors.min': 'El valor debe ser mayor a 0',
        'sellerDetails.salesPlan.errors.dateInPast': 'No se puede seleccionar una fecha anterior al mes actual',
        'sellerDetails.salesPlan.errors.dateTooFar': 'No se puede seleccionar una fecha más de 6 meses en el futuro',
        'sellerDetails.salesPlan.errors.endBeforeStart': 'La fecha de fin debe ser posterior a la fecha de inicio',
        'sellerDetails.salesPlan.errors.startAfterEnd': 'La fecha de inicio no puede ser posterior a la fecha de fin'
      };
      return translations[key] || key;
    });
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
    // Inicializar tabs después de crear el componente
    component.ngOnInit();
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
      component.ngOnInit(); // Asegurar que los tabs se inicialicen
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

  describe('loadVisitRoutes', () => {
    it('should load visit routes successfully', () => {
      const mockRoute: VisitRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2025-01-01',
        status: 'confirmed',
        totalClients: 2,
        createdAt: '2025-01-01T00:00:00Z',
        stops: [
          { id: '1', clientId: '1', clientName: 'Cliente 1', clientAddress: 'Address 1', sequence: 1, durationMinutes: 30, status: 'pending' },
          { id: '2', clientId: '2', clientName: 'Cliente 2', clientAddress: 'Address 2', sequence: 2, durationMinutes: 30, status: 'pending' }
        ]
      };
      const mockRoutes = {
        routes: [mockRoute],
        total: 1,
        totalPages: 1,
        page: 1
      };
      visitRoutesService.getVisitRoutes.and.returnValue(of(mockRoutes));

      component.loadVisitRoutes('1');

      expect(component.visitRoutes).toEqual(mockRoutes.routes);
      expect(component.loadingRoutes).toBe(false);
    });

    it('should handle error when loading visit routes', () => {
      visitRoutesService.getVisitRoutes.and.returnValue(
        throwError(() => ({ message: 'Error loading routes' }))
      );
      spyOn(console, 'error');

      component.loadVisitRoutes('1');

      expect(component.loadingRoutes).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('createVisitRoute', () => {
    it('should navigate to create visit route with seller id', () => {
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
    it('should log route id and show alert', () => {
      spyOn(console, 'log');
      spyOn(window, 'alert');

      component.viewRouteDetail('123');

      expect(console.log).toHaveBeenCalledWith('Ver detalle de ruta:', '123');
      expect(window.alert).toHaveBeenCalledWith('Vista de detalle de ruta #123 - Por implementar');
    });
  });

  describe('getRouteStatusColor', () => {
    it('should return blue for confirmed status', () => {
      expect(component.getRouteStatusColor('confirmed')).toBe('blue');
    });

    it('should return orange for in_progress status', () => {
      expect(component.getRouteStatusColor('in_progress')).toBe('orange');
    });

    it('should return green for completed status', () => {
      expect(component.getRouteStatusColor('completed')).toBe('green');
    });

    it('should return red for cancelled status', () => {
      expect(component.getRouteStatusColor('cancelled')).toBe('red');
    });

    it('should return default for unknown status', () => {
      expect(component.getRouteStatusColor('unknown')).toBe('default');
    });
  });

  describe('getRouteStatusText', () => {
    it('should return translated text for draft status', () => {
      (translateService.instant as jasmine.Spy).and.returnValue('Borrador');
      expect(component.getRouteStatusText('draft')).toBe('Borrador');
      expect(translateService.instant).toHaveBeenCalledWith('sellerDetails.visitRoutes.status.draft');
    });

    it('should return translated text for confirmed status', () => {
      (translateService.instant as jasmine.Spy).and.returnValue('Confirmado');
      expect(component.getRouteStatusText('confirmed')).toBe('Confirmado');
      expect(translateService.instant).toHaveBeenCalledWith('sellerDetails.visitRoutes.status.confirmed');
    });

    it('should return translated text for in_progress status', () => {
      (translateService.instant as jasmine.Spy).and.returnValue('En Progreso');
      expect(component.getRouteStatusText('in_progress')).toBe('En Progreso');
      expect(translateService.instant).toHaveBeenCalledWith('sellerDetails.visitRoutes.status.inProgress');
    });

    it('should return translated text for completed status', () => {
      (translateService.instant as jasmine.Spy).and.returnValue('Completado');
      expect(component.getRouteStatusText('completed')).toBe('Completado');
      expect(translateService.instant).toHaveBeenCalledWith('sellerDetails.visitRoutes.status.completed');
    });

    it('should return translated text for cancelled status', () => {
      (translateService.instant as jasmine.Spy).and.returnValue('Cancelado');
      expect(component.getRouteStatusText('cancelled')).toBe('Cancelado');
      expect(translateService.instant).toHaveBeenCalledWith('sellerDetails.visitRoutes.status.cancelled');
    });

    it('should return status itself for unknown status', () => {
      expect(component.getRouteStatusText('unknown')).toBe('unknown');
    });
  });

  describe('getClientNamesShort', () => {
    it('should return formatted text when no stops', () => {
      const route: VisitRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2025-01-01',
        status: 'confirmed',
        totalClients: 5,
        createdAt: '2025-01-01T00:00:00Z',
        stops: []
      };
      (translateService.instant as jasmine.Spy).and.returnValue('clientes');
      expect(component.getClientNamesShort(route)).toBe('5 clientes');
    });

    it('should return names for 1-2 clients', () => {
      const route: VisitRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2025-01-01',
        status: 'confirmed',
        totalClients: 2,
        createdAt: '2025-01-01T00:00:00Z',
        stops: [
          { id: '1', clientId: '1', clientName: 'Cliente 1', clientAddress: 'Address 1', sequence: 1, durationMinutes: 30, status: 'pending' },
          { id: '2', clientId: '2', clientName: 'Cliente 2', clientAddress: 'Address 2', sequence: 2, durationMinutes: 30, status: 'pending' }
        ]
      };
      expect(component.getClientNamesShort(route)).toBe('Cliente 1, Cliente 2');
    });

    it('should return first 2 names and "X más" for 3+ clients', () => {
      const route: VisitRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2025-01-01',
        status: 'confirmed',
        totalClients: 5,
        createdAt: '2025-01-01T00:00:00Z',
        stops: [
          { id: '1', clientId: '1', clientName: 'Cliente 1', clientAddress: 'Address 1', sequence: 1, durationMinutes: 30, status: 'pending' },
          { id: '2', clientId: '2', clientName: 'Cliente 2', clientAddress: 'Address 2', sequence: 2, durationMinutes: 30, status: 'pending' },
          { id: '3', clientId: '3', clientName: 'Cliente 3', clientAddress: 'Address 3', sequence: 3, durationMinutes: 30, status: 'pending' }
        ]
      };
      (translateService.instant as jasmine.Spy).and.returnValue('y 1 más');
      expect(component.getClientNamesShort(route)).toContain('Cliente 1, Cliente 2');
    });
  });

  describe('getClientNamesForTooltip', () => {
    it('should return empty string when no stops', () => {
      const route: VisitRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2025-01-01',
        status: 'confirmed',
        totalClients: 0,
        createdAt: '2025-01-01T00:00:00Z',
        stops: []
      };
      expect(component.getClientNamesForTooltip(route)).toBe('');
    });

    it('should return formatted names with numbers', () => {
      const route: VisitRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2025-01-01',
        status: 'confirmed',
        totalClients: 2,
        createdAt: '2025-01-01T00:00:00Z',
        stops: [
          { id: '1', clientId: '1', clientName: 'Cliente 1', clientAddress: 'Address 1', sequence: 1, durationMinutes: 30, status: 'pending' },
          { id: '2', clientId: '2', clientName: 'Cliente 2', clientAddress: 'Address 2', sequence: 2, durationMinutes: 30, status: 'pending' }
        ]
      };
      expect(component.getClientNamesForTooltip(route)).toBe('1. Cliente 1\n2. Cliente 2');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(50000000);
      expect(formatted).toContain('50');
      expect(formatted).toContain('000');
    });
  });

  describe('onTabChange', () => {
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
  });

  describe('getStatusText', () => {
    it('should return status itself for unknown status', () => {
      component.seller = { ...mockSeller, status: 'unknown' as any };
      expect(component.getStatusText()).toBe('unknown');
    });
  });

  describe('getStatusColor', () => {
    it('should return empty string for unknown status', () => {
      component.seller = { ...mockSeller, status: 'unknown' as any };
      expect(component.getStatusColor()).toBe('');
    });
  });

  describe('Performance methods', () => {
    beforeEach(() => {
      component.seller = mockSeller;
    });

    describe('fetchPerformance', () => {
      it('should fetch performance data successfully', () => {
        const mockPerformance = {
          total_revenue: 1000000,
          total_orders: 50,
          total_visits: 20,
          total_units_sold: 500,
          units_compliance: 80,
          revenue_compliance: 75,
          visits_compliance: 90
        };
        sellersService.getSellerPerformance.and.returnValue(of(mockPerformance));
        ordersService.getTopProductsBySeller.and.returnValue(of([]));

        (component as any).fetchPerformance();

        expect(component.performanceData.kpis.total_revenue).toBe(1000000);
        expect(component.performanceData.kpis.total_orders).toBe(50);
        expect(component.loadingPerformance).toBe(false);
      });

      it('should handle error when fetching performance', () => {
        sellersService.getSellerPerformance.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );
        spyOn(console, 'error');

        (component as any).fetchPerformance();

        expect(component.loadingPerformance).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });

      it('should handle error when fetching top products', () => {
        sellersService.getSellerPerformance.and.returnValue(of({
          total_revenue: 0,
          total_orders: 0,
          total_visits: 0,
          total_units_sold: 0,
          units_compliance: 0,
          revenue_compliance: 0,
          visits_compliance: 0
        }));
        ordersService.getTopProductsBySeller.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );
        spyOn(console, 'error');
        spyOn(component as any, 'updateChart');

        (component as any).fetchPerformance();

        expect(component.performanceData.topProducts).toEqual([]);
        expect(component.loadingTopProducts).toBe(false);
        expect((component as any).updateChart).toHaveBeenCalled();
      });

      it('should not fetch if seller is null', () => {
        component.seller = null;
        (component as any).fetchPerformance();

        expect(sellersService.getSellerPerformance).not.toHaveBeenCalled();
      });
    });

    describe('updateChart', () => {
      it('should update chart with products data', () => {
        component.performanceData.topProducts = [
          { name: 'Product 1', quantity: 100, sales_amount: 50000 },
          { name: 'Product 2', quantity: 50, sales_amount: 25000 }
        ];
        (translateService.instant as jasmine.Spy).and.returnValue('Cantidad vendida');

        (component as any).updateChart();

        expect(component.chartOptions.series).toBeDefined();
        expect(component.chartOptions.xaxis?.categories).toEqual(['Product 1', 'Product 2']);
      });

      it('should update chart with empty data when no products', () => {
        component.performanceData.topProducts = [];
        (translateService.instant as jasmine.Spy).and.returnValue('Cantidad vendida');

        (component as any).updateChart();

        expect(component.chartOptions.series).toBeDefined();
        expect(component.chartOptions.xaxis?.categories).toEqual([]);
      });
    });

    describe('onStartDateChange', () => {
      it('should update start date and fetch performance', () => {
        spyOn(component as any, 'fetchPerformance');
        component.activeTab = 'performance';
        const newDate = new Date(2025, 0, 1);

        component.onStartDateChange(newDate);

        expect(component.performanceData.startDate).toEqual(newDate);
        expect((component as any).fetchPerformance).toHaveBeenCalled();
      });

      it('should adjust end date if start is after end', () => {
        component.performanceData.endDate = new Date(2025, 0, 1);
        const newStart = new Date(2025, 1, 1);

        component.onStartDateChange(newStart);

        expect(component.performanceData.endDate.getTime()).toBe(newStart.getTime());
      });
    });

    describe('onEndDateChange', () => {
      it('should update end date and fetch performance', () => {
        spyOn(component as any, 'fetchPerformance');
        component.activeTab = 'performance';
        const newDate = new Date(2025, 1, 1);

        component.onEndDateChange(newDate);

        expect(component.performanceData.endDate).toEqual(newDate);
        expect((component as any).fetchPerformance).toHaveBeenCalled();
      });

      it('should adjust start date if end is before start', () => {
        component.performanceData.startDate = new Date(2025, 1, 1);
        const newEnd = new Date(2025, 0, 1);

        component.onEndDateChange(newEnd);

        expect(component.performanceData.startDate.getTime()).toBe(newEnd.getTime());
      });
    });

    describe('disableFutureMonths', () => {
      it('should disable future months', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        expect(component.disableFutureMonths(futureDate)).toBe(true);
      });

      it('should not disable current month', () => {
        const currentDate = new Date();
        expect(component.disableFutureMonths(currentDate)).toBe(false);
      });

      it('should not disable past months', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        expect(component.disableFutureMonths(pastDate)).toBe(false);
      });
    });

    describe('disableFutureMonthsForSalesPlan', () => {
      it('should disable dates more than 6 months in future', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 7);
        expect(component.disableFutureMonthsForSalesPlan(futureDate)).toBe(true);
      });

      it('should not disable dates within 6 months', () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 5);
        expect(component.disableFutureMonthsForSalesPlan(futureDate)).toBe(false);
      });

      it('should disable past dates', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        expect(component.disableFutureMonthsForSalesPlan(pastDate)).toBe(true);
      });
    });
  });

  describe('Date validators', () => {
    beforeEach(() => {
      component.initSalesPlanForm();
    });

    describe('startDateValidator', () => {
      it('should return null for valid date', () => {
        const now = new Date();
        const validDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const control = { value: validDate };
        const result = (component as any).startDateValidator(control);
        expect(result).toBeNull();
      });

      it('should return dateInPast for past date', () => {
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        const control = { value: pastDate };
        const result = (component as any).startDateValidator(control);
        expect(result).toEqual({ dateInPast: true });
      });

      it('should return dateTooFar for date more than 6 months ahead', () => {
        const farDate = new Date();
        farDate.setMonth(farDate.getMonth() + 7);
        const control = { value: farDate };
        const result = (component as any).startDateValidator(control);
        expect(result).toEqual({ dateTooFar: true });
      });
    });

    describe('endDateValidator', () => {
      it('should return endBeforeStart when end is before start', () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        component.salesPlanForm.get('start_month')?.setValue(start);
        const control = { value: end };
        const result = (component as any).endDateValidator(control);
        expect(result).toEqual({ endBeforeStart: true });
      });
    });

    describe('validateDateRange', () => {
      it('should set errors when end is before start', () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        component.salesPlanForm.get('start_month')?.setValue(start);
        component.salesPlanForm.get('end_month')?.setValue(end);

        (component as any).validateDateRange();

        expect(component.salesPlanForm.get('end_month')?.errors?.dateRange).toBe(true);
      });

      it('should clear errors when dates are valid', () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        component.salesPlanForm.get('start_month')?.setValue(start);
        component.salesPlanForm.get('end_month')?.setValue(end);
        component.salesPlanForm.get('end_month')?.setErrors({ dateRange: true });

        (component as any).validateDateRange();

        expect(component.salesPlanForm.get('end_month')?.errors?.dateRange).toBeUndefined();
      });
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => {
      component.initSalesPlanForm();
      (translateService.instant as jasmine.Spy).and.callFake((key: string) => {
        const translations: { [key: string]: string } = {
          'sellerDetails.salesPlan.errors.required': 'Requerido',
          'sellerDetails.salesPlan.errors.min': 'Mínimo',
          'sellerDetails.salesPlan.errors.minlength': 'Mínimo largo',
          'sellerDetails.salesPlan.errors.maxlength': 'Máximo largo',
          'sellerDetails.salesPlan.errors.invalidDate': 'Fecha inválida',
          'sellerDetails.salesPlan.errors.dateInPast': 'Fecha pasada',
          'sellerDetails.salesPlan.errors.dateTooFar': 'Fecha muy lejana',
          'sellerDetails.salesPlan.errors.endBeforeStart': 'Fin antes de inicio',
          'sellerDetails.salesPlan.errors.startAfterEnd': 'Inicio después de fin'
        };
        return translations[key] || key;
      });
    });

    it('should return maxlength error', () => {
      const field = component.salesPlanForm.get('name');
      field?.setValue('a'.repeat(300));
      field?.markAsDirty();
      expect(component.getFieldError('name')).toBe('Máximo largo');
    });

    it('should return dateRange error for start_month', () => {
      const field = component.salesPlanForm.get('start_month');
      field?.setErrors({ dateRange: true });
      field?.markAsDirty();
      expect(component.getFieldError('start_month')).toBe('Inicio después de fin');
    });
  });

  describe('handleSalesPlanModalOk', () => {
    let notificationService: jasmine.SpyObj<NzNotificationService>;

    beforeEach(() => {
      component.initSalesPlanForm();
      component.seller = mockSeller;
      notificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;
    });

    it('should create sales plan successfully', () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
      component.salesPlanForm.patchValue({
        name: 'Plan Test',
        start_month: startMonth,
        end_month: endMonth,
        total_units_target: 1000,
        total_value_target: 50000,
        visits_target: 50
      });
      // Forzar que validateFormFields retorne true
      spyOn(component, 'validateFormFields').and.returnValue(true);
      
      (translateService.instant as jasmine.Spy).and.returnValue('Plan creado');
      sellersService.createSalesPlan.and.returnValue(of({ id: 1 } as any));
      spyOn(component, 'loadSalesPlans');

      component.handleSalesPlanModalOk();

      expect(sellersService.createSalesPlan).toHaveBeenCalled();
      expect(component.isSalesPlanModalVisible).toBe(false);
      expect(component.isSalesPlanModalLoading).toBe(false);
      expect(component.loadSalesPlans).toHaveBeenCalled();
    });

    it('should handle error when creating sales plan', () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
      component.salesPlanForm.patchValue({
        name: 'Plan Test',
        start_month: startMonth,
        end_month: endMonth,
        total_units_target: 1000,
        total_value_target: 50000,
        visits_target: 50
      });
      // Forzar que validateFormFields retorne true
      spyOn(component, 'validateFormFields').and.returnValue(true);
      
      (translateService.instant as jasmine.Spy).and.returnValue('Error');
      sellersService.createSalesPlan.and.returnValue(
        throwError(() => ({ error: { detail: 'Error detail' } }))
      );

      component.handleSalesPlanModalOk();

      expect(component.isSalesPlanModalLoading).toBe(false);
      expect(notificationService.create).toHaveBeenCalled();
    });
  });

  describe('formatDateForAPI', () => {
    it('should format date correctly', () => {
      const date = new Date(2025, 0, 15);
      const formatted = (component as any).formatDateForAPI(date);
      expect(formatted).toBe('2025-01-15');
    });

    it('should return empty string for null date', () => {
      expect((component as any).formatDateForAPI(null)).toBe('');
    });
  });

  describe('formatPeriod', () => {
    beforeEach(() => {
      // Configurar traducciones para los meses
      (translateService.instant as jasmine.Spy).and.callFake((key: string) => {
        const translations: { [key: string]: string } = {
          'reports.months.january': 'enero',
          'reports.months.february': 'febrero',
          'reports.months.march': 'marzo',
          'reports.months.april': 'abril',
          'reports.months.may': 'mayo',
          'reports.months.june': 'junio',
          'reports.months.july': 'julio',
          'reports.months.august': 'agosto',
          'reports.months.september': 'septiembre',
          'reports.months.october': 'octubre',
          'reports.months.november': 'noviembre',
          'reports.months.december': 'diciembre'
        };
        return translations[key] || key;
      });
      (component as any).updateMonths();
    });

    it('should format same month and year', () => {
      const result = component.formatPeriod('2025-01-01', '2025-01-31');
      expect(result).toContain('enero');
      expect(result).toContain('2025');
    });

    it('should format different months same year', () => {
      // Usar fechas explícitas para evitar problemas de zona horaria
      // Crear fechas usando el constructor Date(year, month, day) donde month es 0-indexed
      const startDate = new Date(2025, 0, 15).toISOString().split('T')[0]; // Enero 2025
      const endDate = new Date(2025, 2, 15).toISOString().split('T')[0]; // Marzo 2025
      const result = component.formatPeriod(startDate, endDate);
      // El resultado debería ser "enero - marzo 2025"
      expect(result).toContain('enero');
      expect(result).toContain('marzo');
      expect(result).toContain('2025');
      // Verificar que no contenga años diferentes
      expect(result).not.toContain('2024');
    });

    it('should format different years', () => {
      const result = component.formatPeriod('2024-12-01', '2025-01-31');
      expect(result).toContain('2024');
      expect(result).toContain('2025');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should call addAccessibilityToSelectSearchInputs', fakeAsync(() => {
      spyOn(component as any, 'addAccessibilityToSelectSearchInputs');
      component.ngAfterViewInit();
      tick(100);
      expect((component as any).addAccessibilityToSelectSearchInputs).toHaveBeenCalled();
    }));
  });

  describe('ngOnInit', () => {
    it('should handle fragment for visit-routes tab', () => {
      activatedRoute.fragment = of('visit-routes');
      component.ngOnInit();
      expect(component.activeTab).toBe('visit-routes');
    });

    it('should subscribe to language changes', () => {
      spyOn(component as any, 'initializeChartOptions');
      spyOn(component as any, 'updateTabs');
      spyOn(component as any, 'updateMonths');
      component.performanceData.topProducts = [{ name: 'Test', quantity: 1, sales_amount: 100 }];
      spyOn(component as any, 'updateChart');

      // Primero llamar ngOnInit para que se suscriba
      component.ngOnInit();

      // Luego emitir el evento de cambio de idioma
      const langChangeEmitter = (translateService.onLangChange as any);
      langChangeEmitter.emit({ lang: 'en' });

      expect((component as any).initializeChartOptions).toHaveBeenCalled();
      expect((component as any).updateTabs).toHaveBeenCalled();
      expect((component as any).updateMonths).toHaveBeenCalled();
      expect((component as any).updateChart).toHaveBeenCalled();
    });
  });
});


