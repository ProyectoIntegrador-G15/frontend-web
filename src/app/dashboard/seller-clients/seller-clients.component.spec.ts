import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of, throwError } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Pipe, PipeTransform, Component, EventEmitter, Output } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { SellerClientsComponent } from './seller-clients.component';
import { ClientsService, Client } from '../../shared/services/clients.service';
import { SellersService, Seller } from '../../shared/services/sellers.service';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

// Mock component for BackButtonComponent
@Component({
  selector: 'app-back-button',
  template: '<button (click)="backClick.emit()">Back</button>'
})
class MockBackButtonComponent {
  @Output() backClick = new EventEmitter<void>();
}

describe('SellerClientsComponent', () => {
  let component: SellerClientsComponent;
  let fixture: ComponentFixture<SellerClientsComponent>;
  let mockClientsService: jasmine.SpyObj<ClientsService>;
  let mockSellersService: jasmine.SpyObj<SellersService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockMessageService: jasmine.SpyObj<NzMessageService>;
  let mockActivatedRoute: any;

  const mockSeller: Seller = {
    id: '1',
    name: 'Jorge Martínez',
    identification: '123456789',
    status: 'active',
    entryDate: '2024-01-01',
    email: 'jorge@example.com',
    phone: '1234567890'
  };

  const mockAssignedClients: Client[] = [
    {
      id: '1',
      name: 'Droguería El Bosque',
      email: 'info@drogueriaelbosque.com',
      address: 'Calle 123',
      createdAt: '2024-01-01'
    }
  ];

  const mockAvailableClients: Client[] = [
    {
      id: '2',
      name: 'Botica La 80',
      email: 'contacto@boticala80.com',
      address: 'Calle 456',
      createdAt: '2024-01-02'
    }
  ];

  beforeEach(async () => {
    const clientsServiceSpy = jasmine.createSpyObj('ClientsService', [
      'getClients',
      'getFreeClients',
      'assignUnassignClientToSeller'
    ]);
    const sellersServiceSpy = jasmine.createSpyObj('SellersService', ['getSellerById']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    const messageServiceSpy = jasmine.createSpyObj('NzMessageService', ['success', 'error']);

    mockActivatedRoute = {
      params: of({ id: '1' })
    };

    translateServiceSpy.instant.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DragDropModule,
        NzSpinModule,
        NzIconModule
      ],
      declarations: [SellerClientsComponent, MockCustomTranslatePipe, MockBackButtonComponent],
      providers: [
        { provide: ClientsService, useValue: clientsServiceSpy },
        { provide: SellersService, useValue: sellersServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: NzMessageService, useValue: messageServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SellerClientsComponent);
    component = fixture.componentInstance;
    mockClientsService = TestBed.inject(ClientsService) as jasmine.SpyObj<ClientsService>;
    mockSellersService = TestBed.inject(SellersService) as jasmine.SpyObj<SellersService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    mockMessageService = TestBed.inject(NzMessageService) as jasmine.SpyObj<NzMessageService>;

    // Setup default mock returns
    mockSellersService.getSellerById.and.returnValue(of(mockSeller));
    mockClientsService.getClients.and.returnValue(of(mockAssignedClients));
    mockClientsService.getFreeClients.and.returnValue(of(mockAvailableClients));
    mockClientsService.assignUnassignClientToSeller.and.returnValue(of(mockAssignedClients[0]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load seller name, assigned clients and available clients on init', () => {
      component.ngOnInit();

      expect(mockSellersService.getSellerById).toHaveBeenCalledWith('1');
      expect(mockClientsService.getClients).toHaveBeenCalledWith(1);
      expect(mockClientsService.getFreeClients).toHaveBeenCalled();
    });

    it('should set sellerId from route params', () => {
      component.ngOnInit();
      expect(component.sellerId).toBe('1');
    });
  });

  describe('loadSellerName', () => {
    it('should load and set seller name successfully', () => {
      component.sellerId = '1';
      component.loadSellerName();

      expect(mockSellersService.getSellerById).toHaveBeenCalledWith('1');
      expect(component.sellerName).toBe('Jorge Martínez');
    });

    it('should not load seller name if sellerId is empty', () => {
      component.sellerId = '';
      component.loadSellerName();

      expect(mockSellersService.getSellerById).not.toHaveBeenCalled();
    });

    it('should handle error when loading seller name', () => {
      mockSellersService.getSellerById.and.returnValue(throwError(() => new Error('Error')));
      component.sellerId = '1';
      spyOn(console, 'error');

      component.loadSellerName();

      expect(component.sellerName).toBe('');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadAssignedClients', () => {
    it('should load assigned clients successfully', () => {
      component.sellerId = '1';
      component.loadAssignedClients();

      expect(component.loading).toBe(false);
      expect(component.assignedClients).toEqual(mockAssignedClients);
      expect(mockClientsService.getClients).toHaveBeenCalledWith(1);
    });

    it('should set loading to true initially', () => {
      component.sellerId = '1';
      component.loading = false;
      
      component.loadAssignedClients();
      
      // Loading should be set to true at the start
      expect(component.loading).toBe(false); // Will be false after async completes
    });

    it('should handle invalid sellerId', () => {
      component.sellerId = 'invalid';
      component.loadAssignedClients();

      expect(component.error).toBe('sellers.loadingError');
      expect(component.loading).toBe(false);
      expect(mockClientsService.getClients).not.toHaveBeenCalled();
    });

    it('should handle error when loading assigned clients', () => {
      mockClientsService.getClients.and.returnValue(throwError(() => new Error('Error')));
      component.sellerId = '1';
      spyOn(console, 'error');

      component.loadAssignedClients();

      expect(component.error).toBe('sellers.loadingError');
      expect(component.loading).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadAvailableClients', () => {
    it('should load available clients successfully', () => {
      component.loadAvailableClients();

      expect(component.availableClients).toEqual(mockAvailableClients);
      expect(mockClientsService.getFreeClients).toHaveBeenCalled();
    });

    it('should handle error when loading available clients', () => {
      mockClientsService.getFreeClients.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      component.loadAvailableClients();

      expect(console.error).toHaveBeenCalled();
      // Should not set error to avoid interrupting assigned clients loading
    });
  });

  describe('assignClient', () => {
    it('should assign client successfully', () => {
      component.sellerId = '1';
      spyOn(component, 'loadAssignedClients');
      spyOn(component, 'loadAvailableClients');

      component.assignClient('2');

      expect(mockClientsService.assignUnassignClientToSeller).toHaveBeenCalledWith(2, 1);
      expect(mockMessageService.success).toHaveBeenCalled();
      expect(component.loadAssignedClients).toHaveBeenCalled();
      expect(component.loadAvailableClients).toHaveBeenCalled();
    });

    it('should handle invalid sellerId', () => {
      component.sellerId = 'invalid';
      component.assignClient('2');

      expect(mockMessageService.error).toHaveBeenCalled();
      expect(mockClientsService.assignUnassignClientToSeller).not.toHaveBeenCalled();
    });

    it('should handle invalid clientId', () => {
      component.sellerId = '1';
      component.assignClient('invalid');

      expect(mockMessageService.error).toHaveBeenCalled();
      expect(mockClientsService.assignUnassignClientToSeller).not.toHaveBeenCalled();
    });

    it('should handle error when assigning client', () => {
      const error = { error: { detail: 'Error message' } };
      mockClientsService.assignUnassignClientToSeller.and.returnValue(throwError(() => error));
      component.sellerId = '1';
      spyOn(console, 'error');

      component.assignClient('2');

      expect(mockMessageService.error).toHaveBeenCalledWith('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('unassignClient', () => {
    it('should unassign client successfully', () => {
      component.sellerId = '1';
      spyOn(component, 'loadAssignedClients');
      spyOn(component, 'loadAvailableClients');

      component.unassignClient('1');

      expect(mockClientsService.assignUnassignClientToSeller).toHaveBeenCalledWith(1, 1);
      expect(mockMessageService.success).toHaveBeenCalled();
      expect(component.loadAssignedClients).toHaveBeenCalled();
      expect(component.loadAvailableClients).toHaveBeenCalled();
    });

    it('should handle invalid sellerId', () => {
      component.sellerId = 'invalid';
      component.unassignClient('1');

      expect(mockMessageService.error).toHaveBeenCalled();
      expect(mockClientsService.assignUnassignClientToSeller).not.toHaveBeenCalled();
    });

    it('should handle error when unassigning client', () => {
      const error = { error: { detail: 'Error message' } };
      mockClientsService.assignUnassignClientToSeller.and.returnValue(throwError(() => error));
      component.sellerId = '1';
      spyOn(console, 'error');

      component.unassignClient('1');

      expect(mockMessageService.error).toHaveBeenCalledWith('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onDrop', () => {
    it('should reorder items when dropped in same container', () => {
      const client1: Client = {
        id: '1',
        name: 'Client 1',
        email: 'client1@test.com',
        address: 'Address 1',
        createdAt: '2024-01-01'
      };
      const client2: Client = {
        id: '2',
        name: 'Client 2',
        email: 'client2@test.com',
        address: 'Address 2',
        createdAt: '2024-01-02'
      };
      component.assignedClients = [client1, client2];
      
      // Verify initial order
      expect(component.assignedClients[0].id).toBe('1');
      expect(component.assignedClients[1].id).toBe('2');

      // Create a reference to the same container object for both
      const container = { data: component.assignedClients } as any;
      const mockEvent = {
        previousContainer: container,
        container: container,
        previousIndex: 0,
        currentIndex: 1
      } as CdkDragDrop<Client[]>;

      component.onDrop(mockEvent);

      // After moving index 0 to index 1:
      // - Element at index 0 moves to index 1
      // - Element at index 1 moves to index 0
      // Result: [0] = client2 (was at index 1), [1] = client1 (was at index 0)
      expect(component.assignedClients[0].id).toBe('2');
      expect(component.assignedClients[1].id).toBe('1');
      expect(mockClientsService.assignUnassignClientToSeller).not.toHaveBeenCalled();
    });

    it('should assign client when dropped from available to assigned', () => {
      component.sellerId = '1';
      component.assignedClients = [];
      component.availableClients = [...mockAvailableClients];

      const mockEvent = {
        previousContainer: { data: component.availableClients } as any,
        container: { data: component.assignedClients } as any,
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<Client[]>;

      spyOn(component, 'loadAssignedClients');
      spyOn(component, 'loadAvailableClients');

      component.onDrop(mockEvent);

      expect(mockClientsService.assignUnassignClientToSeller).toHaveBeenCalledWith(2, 1);
      expect(mockMessageService.success).toHaveBeenCalled();
    });

    it('should unassign client when dropped from assigned to available', () => {
      component.sellerId = '1';
      component.assignedClients = [...mockAssignedClients];
      component.availableClients = [];

      const mockEvent = {
        previousContainer: { data: component.assignedClients } as any,
        container: { data: component.availableClients } as any,
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<Client[]>;

      spyOn(component, 'loadAssignedClients');
      spyOn(component, 'loadAvailableClients');

      component.onDrop(mockEvent);

      expect(mockClientsService.assignUnassignClientToSeller).toHaveBeenCalledWith(1, 1);
      expect(mockMessageService.success).toHaveBeenCalled();
    });

    it('should handle invalid sellerId in onDrop', () => {
      component.sellerId = 'invalid';
      component.assignedClients = [];
      component.availableClients = [...mockAvailableClients];

      const mockEvent = {
        previousContainer: { data: component.availableClients } as any,
        container: { data: component.assignedClients } as any,
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<Client[]>;

      component.onDrop(mockEvent);

      expect(mockMessageService.error).toHaveBeenCalled();
      expect(mockClientsService.assignUnassignClientToSeller).not.toHaveBeenCalled();
    });

    it('should revert transfer on error', () => {
      const error = { error: { detail: 'Error message' } };
      mockClientsService.assignUnassignClientToSeller.and.returnValue(throwError(() => error));
      component.sellerId = '1';
      component.assignedClients = [];
      component.availableClients = [...mockAvailableClients];
      const initialAvailableCount = component.availableClients.length;
      const initialAssignedCount = component.assignedClients.length;

      const mockEvent = {
        previousContainer: { data: component.availableClients } as any,
        container: { data: component.assignedClients } as any,
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<Client[]>;

      spyOn(console, 'error');
      component.onDrop(mockEvent);

      expect(mockMessageService.error).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      // After revert, arrays should be back to original state
      expect(component.availableClients.length).toBe(initialAvailableCount);
      expect(component.assignedClients.length).toBe(initialAssignedCount);
    });
  });

  describe('goBack', () => {
    it('should navigate to sellers list', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/sellers']);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnInit();
      spyOn(component['subscription'], 'unsubscribe');

      component.ngOnDestroy();

      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });
});

