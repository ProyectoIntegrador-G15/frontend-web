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
      component.goBack();
      expect(component.showRoutePreview).toBe(false);
    });

    it('should navigate to sellers if not showing preview', () => {
      component.showRoutePreview = false;
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers']);
    });
  });
});

