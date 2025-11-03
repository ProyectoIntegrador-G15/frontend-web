import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { SellerDetailComponent } from './seller-detail.component';
import { SellersService, Seller } from '../../shared/services/sellers.service';
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
    const sellersServiceSpy = jasmine.createSpyObj('SellersService', ['getSellerById', 'getSellerPerformance']);
    const ordersServiceSpy = jasmine.createSpyObj('OrdersService', ['getTopProductsBySeller']);
    const visitRoutesServiceSpy = jasmine.createSpyObj('VisitRoutesService', ['getVisitRoutes']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
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
        TranslateModule.forRoot()
      ],
      providers: [
        SellerDetailComponent,
        { provide: SellersService, useValue: sellersServiceSpy },
        { provide: OrdersService, useValue: ordersServiceSpy },
        { provide: VisitRoutesService, useValue: visitRoutesServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
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
      total_revenue: 0,
      total_orders: 0,
      total_visits: 0,
      units_compliance: 0,
      revenue_compliance: 0
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
});


