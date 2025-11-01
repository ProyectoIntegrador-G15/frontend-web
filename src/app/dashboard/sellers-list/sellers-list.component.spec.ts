import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SellersListComponent } from './sellers-list.component';
import { SellersService, Seller } from '../../shared/services/sellers.service';

describe('SellersListComponent', () => {
  let component: SellersListComponent;
  let fixture: ComponentFixture<SellersListComponent>;
  let sellersService: jasmine.SpyObj<SellersService>;
  let router: Router;

  const mockSellers: Seller[] = [
    {
      id: '1',
      name: 'Carlos Rodríguez',
      identification: '1012345678',
      status: 'active',
      entryDate: '26-10-2024',
      email: 'carlos@test.com',
      phone: '+57 300 123 4567',
      address: 'Calle 100 #15-20',
      commission: 5.0,
      salesTarget: 50000000.0
    },
    {
      id: '2',
      name: 'María González',
      identification: '1023456789',
      status: 'inactive',
      entryDate: '25-10-2024',
      email: 'maria@test.com',
      phone: '+57 301 234 5678',
      address: 'Carrera 43A #10-50',
      commission: 4.5,
      salesTarget: 45000000.0
    },
    {
      id: '3',
      name: 'Jorge Martínez',
      identification: '1034567890',
      status: 'suspended',
      entryDate: '24-10-2024',
      email: 'jorge@test.com',
      phone: '+57 302 345 6789',
      address: 'Avenida 5N #23-50',
      commission: 5.5,
      salesTarget: 60000000.0
    }
  ];

  beforeEach(async () => {
    const sellersServiceSpy = jasmine.createSpyObj('SellersService', ['getSellers']);

    await TestBed.configureTestingModule({
      declarations: [ SellersListComponent ],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: SellersService, useValue: sellersServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    sellersService = TestBed.inject(SellersService) as jasmine.SpyObj<SellersService>;
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(SellersListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should initialize with default values', () => {
      expect(component.sellers).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.totalItems).toBe(0);
    });

    it('should call loadSellers on init', () => {
      sellersService.getSellers.and.returnValue(of(mockSellers));
      spyOn(component, 'loadSellers');
      
      component.ngOnInit();
      
      expect(component.loadSellers).toHaveBeenCalled();
    });
  });

  describe('loadSellers', () => {
    it('should load sellers successfully', () => {
      sellersService.getSellers.and.returnValue(of(mockSellers));

      component.loadSellers();

      expect(component.loading).toBe(false);
      expect(component.sellers).toEqual(mockSellers);
      expect(component.totalItems).toBe(mockSellers.length);
      expect(component.error).toBeNull();
    });

    it('should set loading to true while loading', () => {
      sellersService.getSellers.and.returnValue(of(mockSellers));

      component.loadSellers();

      expect(sellersService.getSellers).toHaveBeenCalled();
    });

    it('should handle error when loading fails', () => {
      const errorMessage = 'Error al cargar vendedores';
      sellersService.getSellers.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.loadSellers();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('No se pudieron cargar los vendedores. Por favor, intente nuevamente.');
      expect(component.sellers).toEqual([]);
    });

    it('should reset error before loading', () => {
      component.error = 'Previous error';
      sellersService.getSellers.and.returnValue(of(mockSellers));

      component.loadSellers();

      expect(component.error).toBeNull();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Create 25 sellers for pagination testing
      component.sellers = Array(25).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        name: `Seller ${index + 1}`,
        identification: `100000000${index}`,
        status: 'active',
        entryDate: '26-10-2024',
        email: `seller${index + 1}@test.com`,
        phone: `+57 300 000 000${index}`,
        address: `Address ${index + 1}`,
        commission: 5.0,
        salesTarget: 50000000.0
      }));
      component.totalItems = 25;
    });

    it('should return first 10 sellers on page 1', () => {
      component.currentPage = 1;
      
      const paginatedSellers = component.paginatedSellers;
      
      expect(paginatedSellers.length).toBe(10);
      expect(paginatedSellers[0].id).toBe('1');
      expect(paginatedSellers[9].id).toBe('10');
    });

    it('should return sellers 11-20 on page 2', () => {
      component.currentPage = 2;
      
      const paginatedSellers = component.paginatedSellers;
      
      expect(paginatedSellers.length).toBe(10);
      expect(paginatedSellers[0].id).toBe('11');
      expect(paginatedSellers[9].id).toBe('20');
    });

    it('should return remaining sellers on last page', () => {
      component.currentPage = 3;
      
      const paginatedSellers = component.paginatedSellers;
      
      expect(paginatedSellers.length).toBe(5);
      expect(paginatedSellers[0].id).toBe('21');
      expect(paginatedSellers[4].id).toBe('25');
    });

    it('should return empty array if page exceeds total pages', () => {
      component.currentPage = 10;
      
      const paginatedSellers = component.paginatedSellers;
      
      expect(paginatedSellers.length).toBe(0);
    });
  });

  describe('Navigation methods', () => {
    it('should navigate to create seller page', () => {
      spyOn(router, 'navigate');
      
      component.createSeller();
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers/create-seller']);
    });

    it('should navigate to seller detail page', () => {
      spyOn(router, 'navigate');
      const sellerId = '123';
      
      component.viewSeller(sellerId);
      
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/sellers', sellerId]);
    });
  });

  describe('Status methods', () => {
    describe('getStatusColor', () => {
      it('should return "green" for active status', () => {
        expect(component.getStatusColor('active')).toBe('green');
      });

      it('should return "default" for inactive status', () => {
        expect(component.getStatusColor('inactive')).toBe('default');
      });

      it('should return "orange" for suspended status', () => {
        expect(component.getStatusColor('suspended')).toBe('orange');
      });

      it('should return "default" for unknown status', () => {
        expect(component.getStatusColor('unknown')).toBe('default');
      });
    });

    describe('getStatusText', () => {
      it('should return "Activo" for active status', () => {
        expect(component.getStatusText('active')).toBe('Activo');
      });

      it('should return "Inactivo" for inactive status', () => {
        expect(component.getStatusText('inactive')).toBe('Inactivo');
      });

      it('should return "Suspendido" for suspended status', () => {
        expect(component.getStatusText('suspended')).toBe('Suspendido');
      });

      it('should return "Desconocido" for unknown status', () => {
        expect(component.getStatusText('unknown')).toBe('Desconocido');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty sellers list', () => {
      sellersService.getSellers.and.returnValue(of([]));
      
      component.loadSellers();
      
      expect(component.sellers).toEqual([]);
      expect(component.totalItems).toBe(0);
      expect(component.paginatedSellers).toEqual([]);
    });

    it('should handle single seller', () => {
      const singleSeller = [mockSellers[0]];
      sellersService.getSellers.and.returnValue(of(singleSeller));
      
      component.loadSellers();
      
      expect(component.sellers.length).toBe(1);
      expect(component.totalItems).toBe(1);
      expect(component.paginatedSellers.length).toBe(1);
    });

    it('should maintain state when error occurs', () => {
      const previousSellers = [mockSellers[0]];
      component.sellers = previousSellers;
      component.totalItems = 1;

      sellersService.getSellers.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      
      component.loadSellers();
      
      expect(component.error).not.toBeNull();
      expect(component.loading).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should successfully load and paginate sellers', () => {
      const largeSellersArray = Array(15).fill(null).map((_, index) => ({
        id: `${index + 1}`,
        name: `Seller ${index + 1}`,
        identification: `100000000${index}`,
        status: 'active',
        entryDate: '26-10-2024',
        email: `seller${index + 1}@test.com`,
        phone: `+57 300 000 000${index}`,
        address: `Address ${index + 1}`
      } as Seller));

      sellersService.getSellers.and.returnValue(of(largeSellersArray));
      
      component.ngOnInit();
      
      expect(component.sellers.length).toBe(15);
      expect(component.totalItems).toBe(15);
      expect(component.paginatedSellers.length).toBe(10);
      
      component.currentPage = 2;
      expect(component.paginatedSellers.length).toBe(5);
    });

    it('should handle multiple status types in seller list', () => {
      sellersService.getSellers.and.returnValue(of(mockSellers));
      
      component.ngOnInit();
      
      expect(component.getStatusColor(mockSellers[0].status)).toBe('green');
      expect(component.getStatusColor(mockSellers[1].status)).toBe('default');
      expect(component.getStatusColor(mockSellers[2].status)).toBe('orange');
    });
  });
});


