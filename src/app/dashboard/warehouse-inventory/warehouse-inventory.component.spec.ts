import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { WarehouseInventoryComponent } from './warehouse-inventory.component';
import { ProductsWarehouseService, WarehouseProductsResponse } from '../../shared/services/products-warehouse.service';
import { ProductsService } from '../../shared/services/products.service';
import { Product } from '../../shared/interfaces/product.type';

describe('WarehouseInventoryComponent', () => {
  let component: WarehouseInventoryComponent;
  let fixture: ComponentFixture<WarehouseInventoryComponent>;
  let mockProductsWarehouseService: jasmine.SpyObj<ProductsWarehouseService>;
  let mockProductsService: jasmine.SpyObj<ProductsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockNotificationService: jasmine.SpyObj<NzNotificationService>;

  const mockWarehouseResponse: WarehouseProductsResponse = {
    warehouse_id: 1,
    warehouse_name: 'Bodega Central Bogotá',
    warehouse_city: 'Bogotá',
    warehouse_country: 'Colombia',
    warehouse_address: 'Calle 80 #11-42',
    products: [
      {
        id: 1,
        name: 'Paracetamol 500mg',
        description: 'Analgésico',
        purchase_price: 5000,
        storage_instructions: 'Almacenar en lugar seco',
        temperature_range: '15-25°C',
        requires_cold_chain: false,
        supplier_id: 1,
        status: true,
        available_quantity: 150,
        location_identifier: 'A-15-B3'
      },
      {
        id: 2,
        name: 'Ibuprofeno 400mg',
        description: 'Antiinflamatorio',
        purchase_price: 6000,
        storage_instructions: 'Almacenar en lugar fresco',
        temperature_range: '10-20°C',
        requires_cold_chain: false,
        supplier_id: 2,
        status: true,
        available_quantity: 75,
        location_identifier: 'B-08-C1'
      }
    ],
    total_products: 2,
    total_quantity: 225
  };

  beforeEach(async () => {
    const productsWarehouseServiceSpy = jasmine.createSpyObj('ProductsWarehouseService', ['getProductsByWarehouse'], {
      products$: of([])
    });
    const productsServiceSpy = jasmine.createSpyObj('ProductsService', ['getProductsPaginated', 'addInventoryToProduct']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['create']);

    mockActivatedRoute = {
      params: of({ id: '1' })
    };

    await TestBed.configureTestingModule({
      declarations: [WarehouseInventoryComponent],
      providers: [
        FormBuilder,
        { provide: ProductsWarehouseService, useValue: productsWarehouseServiceSpy },
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: NzNotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WarehouseInventoryComponent);
    component = fixture.componentInstance;
    mockProductsWarehouseService = TestBed.inject(ProductsWarehouseService) as jasmine.SpyObj<ProductsWarehouseService>;
    mockProductsService = TestBed.inject(ProductsService) as jasmine.SpyObj<ProductsService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockNotificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;

    // Setup default mock returns
    mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));
    mockProductsService.getProductsPaginated.and.returnValue(of({ products: [], total: 0, total_pages: 0, page: 1, page_size: 5 }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize component and load warehouse products', () => {
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.ngOnInit();

      expect(component.warehouseId).toBe('1');
      // searchTerm es '' por defecto, así que se llama con ambos parámetros
      expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalledWith('1', '');
    });

    it('should handle route parameter changes', () => {
      const newParams = { id: '2' };
      mockActivatedRoute.params = of(newParams);
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.ngOnInit();

      expect(component.warehouseId).toBe('2');
      // searchTerm es '' por defecto, así que se llama con ambos parámetros
      expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalledWith('2', '');
    });
  });

  describe('getProductsByWarehouse', () => {
    beforeEach(() => {
      component.warehouseId = '1';
    });

    it('should load warehouse products successfully', () => {
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.getProductsByWarehouse();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.warehouseData).toEqual(mockWarehouseResponse);
      expect(component.warehouseName).toBe('Bodega Central Bogotá');
      expect(component.listOfData.length).toBe(2);
    });

    it('should handle loading state correctly', () => {
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      expect(component.isLoading).toBe(true);

      component.getProductsByWarehouse();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle error when loading products', () => {
      const error = new Error('Network error');
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(throwError(() => error));

      component.getProductsByWarehouse();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Error al buscar productos.');
    });

    it('should reset error message when loading new data', () => {
      component.errorMessage = 'Previous error';
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.getProductsByWarehouse();

      expect(component.errorMessage).toBe('');
    });
  });

  describe('getStatusText', () => {
    it('should return "Activo" for true status', () => {
      const result = component.getStatusText(true);
      expect(result).toBe('Activo');
    });

    it('should return "Inactivo" for false status', () => {
      const result = component.getStatusText(false);
      expect(result).toBe('Inactivo');
    });

    it('should return "Activo" for "active" string', () => {
      const result = component.getStatusText('active');
      expect(result).toBe('Activo');
    });

    it('should return "Inactivo" for undefined status', () => {
      const result = component.getStatusText(undefined);
      expect(result).toBe('Inactivo');
    });
  });

  describe('getStatusClass', () => {
    it('should return active classes for true status', () => {
      const result = component.getStatusClass(true);
      expect(result).toBe('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300');
    });

    it('should return inactive classes for false status', () => {
      const result = component.getStatusClass(false);
      expect(result).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300');
    });

    it('should return active classes for "active" string', () => {
      const result = component.getStatusClass('active');
      expect(result).toBe('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300');
    });
  });

  describe('formatPrice', () => {
    it('should format price correctly', () => {
      const result = component.formatPrice(5000);
      expect(result).toContain('5.000');
      // El formato colombiano puede ser '$ 5.000,00' o 'COP 5.000,00' dependiendo del locale
      expect(result).toMatch(/\$|COP/);
    });
  });

  describe('goBack', () => {
    it('should navigate to warehouses dashboard', () => {
      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/warehouses']);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      spyOn(component['subscription'], 'unsubscribe');

      component.ngOnDestroy();

      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Component State', () => {
    it('should initialize with correct default values', () => {
      expect(component.warehouseId).toBe('');
      expect(component.warehouseName).toBe('');
      expect(component.warehouseData).toBeNull();
      expect(component.listOfData).toEqual([]);
      expect(component.isLoading).toBe(true);
      expect(component.errorMessage).toBe('');
    });

    it('should update state when products are loaded', () => {
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));
      component.warehouseId = '1';

      component.getProductsByWarehouse();

      expect(component.warehouseData).toEqual(mockWarehouseResponse);
      expect(component.warehouseName).toBe('Bodega Central Bogotá');
      expect(component.listOfData.length).toBe(2);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle empty products data', () => {
      const emptyResponse: WarehouseProductsResponse = {
        warehouse_id: 1,
        warehouse_name: 'Bodega Vacía',
        warehouse_city: 'Bogotá',
        warehouse_country: 'Colombia',
        warehouse_address: 'Calle 80 #11-42',
        products: [],
        total_products: 0,
        total_quantity: 0
      };

      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(emptyResponse));
      component.warehouseId = '1';

      component.getProductsByWarehouse();

      expect(component.listOfData).toEqual([]);
      expect(component.warehouseData).toEqual(emptyResponse);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      // Reset search term before each test
      component.searchTerm = '';
    });

    it('should initialize searchTerm as empty string', () => {
      expect(component.searchTerm).toBe('');
    });

    it('should call getProductsByWarehouse with searchTerm when onSearchChange is called', fakeAsync(() => {
      component.warehouseId = '1';
      component.searchTerm = '';
      component.setupSearch(); // Asegurar que setupSearch está configurado
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.onSearchChange('Paracetamol');

      // Avanzar el tiempo del debounce (700ms)
      tick(700);

      expect(component.searchTerm).toBe('Paracetamol');
      expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalledWith('1', 'Paracetamol');
    }));

    it('should clear searchTerm when clearSearch is called', fakeAsync(() => {
      component.warehouseId = '1';
      component.searchTerm = 'test';
      component.setupSearch(); // Asegurar que setupSearch está configurado
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.clearSearch();

      // Avanzar el tiempo del debounce (700ms)
      tick(700);

      expect(component.searchTerm).toBe('');
      expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalledWith('1', '');
    }));

    it('should call getProductsByWarehouse with searchTerm parameter', () => {
      component.warehouseId = '1';
      component.searchTerm = 'Paracetamol';
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.getProductsByWarehouse();

      expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalledWith('1', 'Paracetamol');
    });

    it('should call getProductsByWarehouse without searchTerm when searchTerm is empty', () => {
      component.warehouseId = '1';
      component.searchTerm = '';
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));

      component.getProductsByWarehouse();

      expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalledWith('1', '');
    });

    it('should filter products when searchTerm is provided', () => {
      const filteredResponse: WarehouseProductsResponse = {
        warehouse_id: 1,
        warehouse_name: 'Bodega Central Bogotá',
        warehouse_city: 'Bogotá',
        warehouse_country: 'Colombia',
        warehouse_address: 'Calle 80 #11-42',
        products: [
          {
            id: 1,
            name: 'Paracetamol 500mg',
            description: 'Analgésico',
            purchase_price: 5000,
            storage_instructions: 'Almacenar en lugar seco',
            temperature_range: '15-25°C',
            requires_cold_chain: false,
            supplier_id: 1,
            status: true,
            available_quantity: 150,
            location_identifier: 'A-15-B3'
          }
        ],
        total_products: 1,
        total_quantity: 150
      };

      component.warehouseId = '1';
      component.searchTerm = 'Paracetamol';
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(filteredResponse));

      component.getProductsByWarehouse();

      expect(component.listOfData.length).toBe(1);
      expect(component.listOfData[0].name).toBe('Paracetamol 500mg');
      expect(component.warehouseData?.total_products).toBe(1);
    });

    it('should setup search subscription on init', () => {
      spyOn(component, 'setupSearch');
      component.ngOnInit();
      expect(component.setupSearch).toHaveBeenCalled();
    });
  });
});

