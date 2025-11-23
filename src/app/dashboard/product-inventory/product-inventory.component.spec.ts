import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Pipe, PipeTransform } from '@angular/core';

import { ProductInventoryComponent } from './product-inventory.component';
import { InventoryService } from '../../shared/services/inventory.service';
import { ProductInventory, WarehouseInventory } from '../../shared/interfaces/inventory.type';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key; // Return the key as the translation for testing
  }
}

describe('ProductInventoryComponent', () => {
  let component: ProductInventoryComponent;
  let fixture: ComponentFixture<ProductInventoryComponent>;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockProductInventory: ProductInventory = {
    product_id: 'MED-001',
    product_name: 'Paracetamol 500mg',
    warehouses: [
      {
        warehouse_id: 'WH-001',
        name: 'Bodega Central Bogotá',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 80 #11-42, Zona Industrial',
        status: 'active',
        available_quantity: 150,
        location_identifier: 'A-15-B3'
      },
      {
        warehouse_id: 'WH-002',
        name: 'Bodega Norte Medellín',
        city: 'Medellín',
        country: 'Colombia',
        address: 'Carrera 50 #30-15, El Poblado',
        status: 'inactive',
        available_quantity: 75,
        location_identifier: 'B-08-C1'
      }
    ],
    total_warehouses: 2,
    total_quantity: 225
  };

  beforeEach(async () => {
    const inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getProductInventory']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    // Configurar el mock de TranslateService para devolver valores específicos
    translateServiceSpy.instant.and.callFake((key: string) => {
      const translations: { [key: string]: string } = {
        'common.active': 'Activo',
        'common.inactive': 'Inactivo',
        'productInventory.errorLoadingInventory': 'Error al obtener el inventario del producto.'
      };
      return translations[key] || key;
    });

    mockActivatedRoute = {
      params: of({ id: 'MED-001' })
    };

    await TestBed.configureTestingModule({
      declarations: [ProductInventoryComponent, MockCustomTranslatePipe],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductInventoryComponent);
    component = fixture.componentInstance;
    mockInventoryService = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize component and load product inventory', () => {
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));

      component.ngOnInit();

      expect(component.productId).toBe('MED-001');
      expect(mockInventoryService.getProductInventory).toHaveBeenCalledWith('MED-001');
    });

    it('should handle route parameter changes', () => {
      const newParams = { id: 'MED-002' };
      mockActivatedRoute.params = of(newParams);
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));

      component.ngOnInit();

      expect(component.productId).toBe('MED-002');
      expect(mockInventoryService.getProductInventory).toHaveBeenCalledWith('MED-002');
    });
  });

  describe('getProductInventory', () => {
    beforeEach(() => {
      component.productId = 'MED-001';
    });

    it('should load inventory data successfully', () => {
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));

      component.getProductInventory();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.inventoryData).toEqual(mockProductInventory);
      expect(component.warehousesData).toEqual(mockProductInventory.warehouses);
    });

    it('should handle loading state correctly', () => {
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));

      expect(component.isLoading).toBe(true);

      component.getProductInventory();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle error when loading inventory', () => {
      const error = new Error('Network error');
      mockInventoryService.getProductInventory.and.returnValue(throwError(() => error));

      component.getProductInventory();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Error al obtener el inventario del producto.');
      expect(component.inventoryData).toBeNull();
      expect(component.warehousesData).toEqual([]);
    });

    it('should add subscription to prevent memory leaks', () => {
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));
      spyOn(component['subscription'], 'add');

      component.getProductInventory();

      expect(component['subscription'].add).toHaveBeenCalled();
    });
  });

  describe('getStatusText', () => {
    it('should return "Activo" for active status', () => {
      const result = component.getStatusText('active');
      expect(result).toBe('Activo');
    });

    it('should return "Inactivo" for inactive status', () => {
      const result = component.getStatusText('inactive');
      expect(result).toBe('Inactivo');
    });

    it('should return "Inactivo" for any other status', () => {
      const result = component.getStatusText('unknown');
      expect(result).toBe('Inactivo');
    });
  });

  describe('getStatusClass', () => {
    it('should return active classes for active status', () => {
      const result = component.getStatusClass('active');
      expect(result).toBe('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300');
    });

    it('should return inactive classes for inactive status', () => {
      const result = component.getStatusClass('inactive');
      expect(result).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300');
    });

    it('should return inactive classes for any other status', () => {
      const result = component.getStatusClass('unknown');
      expect(result).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300');
    });
  });

  describe('goBack', () => {
    it('should navigate to products dashboard', () => {
      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/products']);
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
      expect(component.productId).toBe('');
      expect(component.inventoryData).toBeNull();
      expect(component.warehousesData).toEqual([]);
      expect(component.isLoading).toBe(true);
      expect(component.errorMessage).toBe('');
    });

    it('should update state when inventory is loaded', () => {
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));
      component.productId = 'MED-001';

      component.getProductInventory();

      expect(component.inventoryData).toEqual(mockProductInventory);
      expect(component.warehousesData).toEqual(mockProductInventory.warehouses);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });

    it('should handle empty warehouses-list data', () => {
      const emptyInventory: ProductInventory = {
        product_id: 'MED-001',
        product_name: 'Test Product',
        warehouses: [],
        total_warehouses: 0,
        total_quantity: 0
      };

      mockInventoryService.getProductInventory.and.returnValue(of(emptyInventory));
      component.productId = 'MED-001';

      component.getProductInventory();

      expect(component.warehousesData).toEqual([]);
      expect(component.inventoryData).toEqual(emptyInventory);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      const error = new Error('Service unavailable');
      mockInventoryService.getProductInventory.and.returnValue(throwError(() => error));
      component.productId = 'MED-001';

      component.getProductInventory();

      expect(component.errorMessage).toBe('Error al obtener el inventario del producto.');
      expect(component.isLoading).toBe(false);
      expect(component.inventoryData).toBeNull();
    });

    it('should reset error message when loading new data', () => {
      component.errorMessage = 'Previous error';
      mockInventoryService.getProductInventory.and.returnValue(of(mockProductInventory));
      component.productId = 'MED-001';

      component.getProductInventory();

      expect(component.errorMessage).toBe('');
    });
  });
});
