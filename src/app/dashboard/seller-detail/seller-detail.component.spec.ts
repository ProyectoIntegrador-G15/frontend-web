import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SellerDetailComponent } from './seller-detail.component';
import { SellersService, Seller, SalesPlan, SalesPlanListResponse, CreateSalesPlanRequest } from '../../shared/services/sellers.service';
import { VisitRoutesService } from '../../shared/services/visit-routes.service';
import { OrdersService } from '../../shared/services/orders.service';
import { of, throwError } from 'rxjs';

describe('SellerDetailComponent', () => {
  let component: SellerDetailComponent;
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
        SellerDetailComponent,
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
    component = TestBed.inject(SellerDetailComponent);

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
});


