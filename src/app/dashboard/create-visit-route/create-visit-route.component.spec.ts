import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreateVisitRouteComponent } from './create-visit-route.component';
import { ClientsService, Client } from '../../shared/services/clients.service';
import { VisitRoutesService } from '../../shared/services/visit-routes.service';
import { SellersService, Seller } from '../../shared/services/sellers.service';
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

describe('CreateVisitRouteComponent', () => {
  let component: CreateVisitRouteComponent;
  let fixture: ComponentFixture<CreateVisitRouteComponent>;
  let clientsService: jasmine.SpyObj<ClientsService>;
  let visitRoutesService: jasmine.SpyObj<VisitRoutesService>;
  let sellersService: jasmine.SpyObj<SellersService>;
  let snackService: jasmine.SpyObj<SnackService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockClients: Client[] = [
    { id: '1', name: 'Client 1', email: 'client1@test.com', address: 'Address 1', city: 'Bogotá', sellerId: 1, createdAt: '2024-01-01T00:00:00Z' },
    { id: '2', name: 'Client 2', email: 'client2@test.com', address: 'Address 2', city: 'Bogotá', sellerId: 1, createdAt: '2024-01-01T00:00:00Z' }
  ];

  const mockSeller: Seller = {
    id: '1',
    name: 'Test Seller',
    identification: '123456789',
    status: 'active',
    email: 'seller@test.com',
    phone: '1234567890',
    address: 'Test Address',
    commission: 5,
    salesTarget: 1000,
    entryDate: '2024-01-01'
  };

  beforeEach(async () => {
    const clientsServiceSpy = jasmine.createSpyObj('ClientsService', ['getClients']);
    const visitRoutesServiceSpy = jasmine.createSpyObj('VisitRoutesService', ['confirmVisitRoute']);
    const sellersServiceSpy = jasmine.createSpyObj('SellersService', ['getSellerById']);
    const snackServiceSpy = jasmine.createSpyObj('SnackService', ['success', 'error']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      queryParams: of({ sellerId: '1' }),
      params: of({})
    };

    await TestBed.configureTestingModule({
      declarations: [CreateVisitRouteComponent, MockCustomTranslatePipe],
      providers: [
        { provide: ClientsService, useValue: clientsServiceSpy },
        { provide: VisitRoutesService, useValue: visitRoutesServiceSpy },
        { provide: SellersService, useValue: sellersServiceSpy },
        { provide: SnackService, useValue: snackServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateVisitRouteComponent);
    component = fixture.componentInstance;
    clientsService = TestBed.inject(ClientsService) as jasmine.SpyObj<ClientsService>;
    visitRoutesService = TestBed.inject(VisitRoutesService) as jasmine.SpyObj<VisitRoutesService>;
    sellersService = TestBed.inject(SellersService) as jasmine.SpyObj<SellersService>;
    snackService = TestBed.inject(SnackService) as jasmine.SpyObj<SnackService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    clientsService.getClients.and.returnValue(of(mockClients));
    sellersService.getSellerById.and.returnValue(of(mockSeller));
    translateService.instant.and.returnValue('translated text');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load seller info and clients', () => {
      component.ngOnInit();
      expect(sellersService.getSellerById).toHaveBeenCalled();
      expect(clientsService.getClients).toHaveBeenCalled();
    });

    it('should use default sellerId when not in queryParams', () => {
      activatedRoute.queryParams = of({});
      component.ngOnInit();
      expect(component.selectedSellerId).toBe('1');
    });

    it('should use sellerId from params if available', () => {
      activatedRoute.params = of({ sellerId: '2' });
      component.ngOnInit();
      expect(component.selectedSellerId).toBe('2');
    });

    it('should not load seller info if sellerId is null', () => {
      activatedRoute.queryParams = of({});
      activatedRoute.params = of({});
      component.selectedSellerId = null;
      component.ngOnInit();
      // Debería usar el default '1' y cargar info
      expect(sellersService.getSellerById).toHaveBeenCalled();
    });
  });

  describe('paginatedClients', () => {
    beforeEach(() => {
      component.clients = mockClients.map(c => ({ ...c, selected: false }));
    });

    it('should return clients for current page', () => {
      component.currentPage = 1;
      component.pageSize = 1;
      const result = component.paginatedClients;
      expect(result.length).toBe(1);
    });
  });

  describe('selectedClients', () => {
    beforeEach(() => {
      component.clients = mockClients.map(c => ({ ...c, selected: false }));
    });

    it('should return only selected clients', () => {
      component.clients[0].selected = true;
      expect(component.selectedClients.length).toBe(1);
    });
  });

  describe('toggleClientSelection', () => {
    it('should toggle client selection', () => {
      const client = { ...mockClients[0], selected: false };
      component.toggleClientSelection(client);
      expect(client.selected).toBe(true);
      component.toggleClientSelection(client);
      expect(client.selected).toBe(false);
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
  });

  describe('formatTime', () => {
    it('should format time string', () => {
      expect(component.formatTime('10:30:00')).toBe('10:30');
    });

    it('should return --:-- for empty time', () => {
      expect(component.formatTime()).toBe('--:--');
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters', () => {
      expect(component.formatDistance(500)).toBe('500m');
    });

    it('should format distance in kilometers', () => {
      expect(component.formatDistance(1500)).toBe('1.5km');
    });

    it('should return -- for no distance', () => {
      expect(component.formatDistance()).toBe('--');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in minutes', () => {
      expect(component.formatDuration(30)).toBe('30min');
    });

    it('should format duration in hours and minutes', () => {
      expect(component.formatDuration(90)).toBe('1h 30min');
    });

    it('should return -- for no duration', () => {
      expect(component.formatDuration()).toBe('--');
    });
  });

  describe('goBack', () => {
    it('should cancel preview if showing route preview', () => {
      component.showRoutePreview = true;
      component.generatedRoute = { id: '1' } as any;
      component.goBack();
      expect(component.showRoutePreview).toBe(false);
      expect(component.generatedRoute).toBeNull();
    });

    it('should navigate to sellers if not showing preview', () => {
      component.showRoutePreview = false;
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers']);
    });
  });

  describe('loadSellerInfo', () => {
    it('should load seller info successfully', () => {
      component.selectedSellerId = '1';
      component.loadSellerInfo();
      expect(sellersService.getSellerById).toHaveBeenCalledWith('1');
      expect(component.sellerName).toBe('Test Seller');
    });

    it('should not load if sellerId is null', () => {
      component.selectedSellerId = null;
      component.loadSellerInfo();
      expect(sellersService.getSellerById).not.toHaveBeenCalled();
    });

    it('should handle error when loading seller', () => {
      component.selectedSellerId = '1';
      sellersService.getSellerById.and.returnValue(throwError(() => new Error('Error')));
      translateService.instant.and.returnValue('Sellers');
      spyOn(console, 'error');
      
      component.loadSellerInfo();
      
      expect(console.error).toHaveBeenCalled();
      expect(component.selectedSellerId).toBe('1');
      expect(component.sellerName).toBe('Sellers 1');
    });
  });

  describe('loadClients', () => {
    it('should load clients successfully', () => {
      component.selectedSellerId = '1';
      component.loadClients();
      expect(clientsService.getClients).toHaveBeenCalledWith(1);
      expect(component.clients.length).toBe(2);
      expect(component.loadingClients).toBe(false);
    });

    it('should not load if sellerId is null', () => {
      component.selectedSellerId = null;
      component.loadClients();
      expect(clientsService.getClients).not.toHaveBeenCalled();
    });

    it('should set error when no clients found', () => {
      component.selectedSellerId = '1';
      clientsService.getClients.and.returnValue(of([]));
      translateService.instant.and.returnValue('No clients assigned');
      
      component.loadClients();
      
      expect(component.error).toBe('No clients assigned');
      expect(component.loadingClients).toBe(false);
    });

    it('should handle error when loading clients', () => {
      component.selectedSellerId = '1';
      clientsService.getClients.and.returnValue(throwError(() => new Error('Error')));
      translateService.instant.and.returnValue('Error loading clients');
      
      component.loadClients();
      
      expect(component.error).toBe('Error loading clients');
      expect(component.loadingClients).toBe(false);
    });
  });

  describe('totalClients', () => {
    it('should return total number of clients', () => {
      component.clients = mockClients.map(c => ({ ...c, selected: false }));
      expect(component.totalClients).toBe(2);
    });
  });

  describe('getSelectedClientsText', () => {
    it('should return translated text with count', () => {
      component.clients = mockClients.map(c => ({ ...c, selected: false }));
      component.clients[0].selected = true;
      translateService.instant.and.returnValue('1 client selected');
      
      expect(component.getSelectedClientsText()).toBe('1 client selected');
      expect(translateService.instant).toHaveBeenCalledWith('createVisitRoute.selectedClients', { count: 1 });
    });
  });

  describe('generateVisitRoute', () => {
    beforeEach(() => {
      component.clients = mockClients.map(c => ({ ...c, selected: false }));
    });

    it('should set error if no sellerId', () => {
      component.selectedSellerId = null;
      translateService.instant.and.returnValue('No seller selected');
      
      component.generateVisitRoute();
      
      expect(component.error).toBe('No seller selected');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should set error if no date selected', () => {
      component.selectedSellerId = '1';
      component.selectedDate = null;
      translateService.instant.and.returnValue('No date selected');
      
      component.generateVisitRoute();
      
      expect(component.error).toBe('No date selected');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should set error if no clients selected', () => {
      component.selectedSellerId = '1';
      component.selectedDate = new Date('2024-01-20');
      translateService.instant.and.returnValue('No clients selected');
      
      component.generateVisitRoute();
      
      expect(component.error).toBe('No clients selected');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should save route data and navigate to preview', () => {
      component.selectedSellerId = '1';
      component.sellerName = 'Test Seller';
      component.selectedDate = new Date(2024, 0, 20);
      component.clients[0].selected = true;
      const setItemSpy = spyOn(sessionStorage, 'setItem');
      
      component.generateVisitRoute();
      
      expect(setItemSpy).toHaveBeenCalled();
      const savedData = JSON.parse(setItemSpy.calls.mostRecent().args[1] as string);
      expect(savedData.seller_id).toBe(1);
      expect(savedData.client_ids).toEqual([1]);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/visit-routes/confirm/preview']);
    });
  });

  describe('confirmRoute', () => {
    beforeEach(() => {
      component.selectedSellerId = '1';
      component.sellerName = 'Test Seller';
      component.generatedRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2024-01-20',
        status: 'draft',
        totalClients: 2,
        createdAt: '2024-01-20T00:00:00Z',
        stops: []
      } as any;
    });

    it('should not confirm if no generated route', () => {
      component.generatedRoute = null;
      component.confirmRoute();
      expect(visitRoutesService.confirmVisitRoute).not.toHaveBeenCalled();
    });

    it('should confirm route successfully', () => {
      const confirmedRoute = {
        id: '1',
        sellerId: '1',
        routeDate: '2024-01-20',
        status: 'confirmed',
        totalClients: 2,
        createdAt: '2024-01-20T00:00:00Z',
        stops: []
      };
      visitRoutesService.confirmVisitRoute.and.returnValue(of(confirmedRoute as any));
      translateService.instant.and.returnValue('Route confirmed');
      
      component.confirmRoute();
      
      expect(visitRoutesService.confirmVisitRoute).toHaveBeenCalledWith('1');
      expect(snackService.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers', '1'], { fragment: 'visit-routes' });
    });

    it('should handle error when confirming route', () => {
      visitRoutesService.confirmVisitRoute.and.returnValue(throwError(() => ({ message: 'Error' })));
      translateService.instant.and.returnValue('Error confirming route');
      spyOn(console, 'error');
      
      component.confirmRoute();
      
      expect(component.error).toBeTruthy();
      expect(snackService.error).toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should handle error without message property', () => {
      visitRoutesService.confirmVisitRoute.and.returnValue(throwError(() => ({ error: 'Error' })));
      translateService.instant.and.returnValue('Error');
      spyOn(console, 'error');
      
      component.confirmRoute();
      
      expect(component.error).toBeTruthy();
      expect(snackService.error).toHaveBeenCalled();
    });
  });

  describe('cancelRoutePreview', () => {
    it('should hide preview and clear generated route', () => {
      component.showRoutePreview = true;
      component.generatedRoute = { id: '1' } as any;
      
      component.cancelRoutePreview();
      
      expect(component.showRoutePreview).toBe(false);
      expect(component.generatedRoute).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = (component as any).formatDate(date);
      expect(result).toBe('15-01-2024');
    });

    it('should pad day and month with zeros', () => {
      const date = new Date(2024, 0, 5);
      const result = (component as any).formatDate(date);
      expect(result).toBe('05-01-2024');
    });
  });

  describe('formatDateForBackend', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = (component as any).formatDateForBackend(date);
      expect(result).toBe('2024-01-15');
    });

    it('should pad month and day with zeros', () => {
      const date = new Date(2024, 0, 5);
      const result = (component as any).formatDateForBackend(date);
      expect(result).toBe('2024-01-05');
    });
  });

  describe('formatTime', () => {
    it('should format time string correctly', () => {
      expect(component.formatTime('10:30:00')).toBe('10:30');
    });

    it('should return --:-- for empty time', () => {
      expect(component.formatTime()).toBe('--:--');
      expect(component.formatTime('')).toBe('--:--');
      expect(component.formatTime(undefined)).toBe('--:--');
    });

    it('should handle time strings of different lengths', () => {
      expect(component.formatTime('09:05:30')).toBe('09:05');
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters when less than 1000', () => {
      expect(component.formatDistance(500)).toBe('500m');
      expect(component.formatDistance(999)).toBe('999m');
    });

    it('should format distance in kilometers when 1000 or more', () => {
      expect(component.formatDistance(1000)).toBe('1.0km');
      expect(component.formatDistance(1500)).toBe('1.5km');
      expect(component.formatDistance(2500)).toBe('2.5km');
    });

    it('should return -- for no distance', () => {
      expect(component.formatDistance()).toBe('--');
      expect(component.formatDistance(undefined)).toBe('--');
      expect(component.formatDistance(null as any)).toBe('--');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in minutes only', () => {
      expect(component.formatDuration(30)).toBe('30min');
      expect(component.formatDuration(59)).toBe('59min');
    });

    it('should format duration in hours and minutes', () => {
      expect(component.formatDuration(60)).toBe('1h 0min');
      expect(component.formatDuration(90)).toBe('1h 30min');
      expect(component.formatDuration(120)).toBe('2h 0min');
      expect(component.formatDuration(150)).toBe('2h 30min');
    });

    it('should return -- for no duration', () => {
      expect(component.formatDuration()).toBe('--');
      expect(component.formatDuration(undefined)).toBe('--');
      expect(component.formatDuration(null as any)).toBe('--');
    });
  });
});

