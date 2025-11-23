import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TranslateService } from '@ngx-translate/core';
import { Pipe, PipeTransform } from '@angular/core';

import { WarehouseInventoryComponent } from './warehouse-inventory.component';
import { ProductsWarehouseService, WarehouseProductsResponse } from '../../shared/services/products-warehouse.service';
import { ProductsService } from '../../shared/services/products.service';
import { Product } from '../../shared/interfaces/product.type';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key; // Return the key as the translation for testing
  }
}

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
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    // Configurar el mock de TranslateService para devolver valores específicos
    translateServiceSpy.instant.and.callFake((key: string) => {
      const translations: { [key: string]: string } = {
        'common.active': 'Activo',
        'common.inactive': 'Inactivo',
        'warehouseInventory.error.loadProducts': 'Error al buscar productos.',
        'warehouseInventory.errorLoadingProducts': 'Error al buscar productos.' // Mantener compatibilidad
      };
      return translations[key] || key;
    });

    mockActivatedRoute = {
      params: of({ id: '1' })
    };

    await TestBed.configureTestingModule({
      declarations: [WarehouseInventoryComponent, MockCustomTranslatePipe],
      providers: [
        FormBuilder,
        { provide: ProductsWarehouseService, useValue: productsWarehouseServiceSpy },
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: NzNotificationService, useValue: notificationSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
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

  describe('Inventory Modal', () => {
    beforeEach(() => {
      component.warehouseId = '1';
    });

    describe('initInventoryForm', () => {
      it('should initialize inventory form with required validators', () => {
        component.initInventoryForm();
        
        expect(component.inventoryForm).toBeDefined();
        expect(component.inventoryForm.get('product')).toBeTruthy();
        expect(component.inventoryForm.get('quantity')).toBeTruthy();
        expect(component.inventoryForm.get('location')).toBeTruthy();
        
        const productControl = component.inventoryForm.get('product');
        const quantityControl = component.inventoryForm.get('quantity');
        const locationControl = component.inventoryForm.get('location');
        
        expect(productControl?.hasError('required')).toBe(true);
        expect(quantityControl?.hasError('required')).toBe(true);
        expect(locationControl?.hasError('required')).toBe(true);
      });
    });

    describe('showInventoryModal', () => {
      it('should set isInventoryModalVisible to true', () => {
        component.isInventoryModalVisible = false;
        component.showInventoryModal();
        expect(component.isInventoryModalVisible).toBe(true);
      });
    });

    describe('handleInventoryModalCancel', () => {
      it('should close modal and reset form when not loading', () => {
        component.isInventoryModalVisible = true;
        component.isInventoryModalLoading = false;
        component.initInventoryForm();
        component.inventoryForm.patchValue({ product: '1', quantity: 10, location: 'A-1' });
        
        component.handleInventoryModalCancel();
        
        expect(component.isInventoryModalVisible).toBe(false);
        expect(component.inventoryForm.value.product).toBeNull();
        expect(component.inventoryForm.value.quantity).toBeNull();
        expect(component.inventoryForm.value.location).toBeNull();
      });

      it('should not close modal when loading', () => {
        component.isInventoryModalVisible = true;
        component.isInventoryModalLoading = true;
        
        component.handleInventoryModalCancel();
        
        expect(component.isInventoryModalVisible).toBe(true);
      });
    });

    describe('handleInventoryModalOk', () => {
      beforeEach(() => {
        component.initInventoryForm();
      });

      it('should not process if modal is loading', () => {
        component.isInventoryModalLoading = true;
        spyOn(component, 'validateInventoryForm');
        spyOn(component, 'addInventoryToProduct');
        
        component.handleInventoryModalOk();
        
        expect(component.validateInventoryForm).not.toHaveBeenCalled();
        expect(component.addInventoryToProduct).not.toHaveBeenCalled();
      });

      it('should not process if form is invalid', () => {
        component.isInventoryModalLoading = false;
        spyOn(component, 'validateInventoryForm').and.returnValue(false);
        spyOn(component, 'addInventoryToProduct');
        
        component.handleInventoryModalOk();
        
        expect(component.validateInventoryForm).toHaveBeenCalled();
        expect(component.addInventoryToProduct).not.toHaveBeenCalled();
      });

      it('should process form when valid and not loading', () => {
        component.isInventoryModalLoading = false;
        component.inventoryForm.patchValue({
          product: '1',
          quantity: 10,
          location: 'A-1'
        });
        spyOn(component, 'validateInventoryForm').and.returnValue(true);
        spyOn(component, 'addInventoryToProduct');
        
        component.handleInventoryModalOk();
        
        expect(component.isInventoryModalLoading).toBe(true);
        expect(component.inventoryForm.disabled).toBe(true);
        expect(component.addInventoryToProduct).toHaveBeenCalledWith('1', jasmine.objectContaining({
          warehouse_id: 1,
          quantity: 10,
          location_identifier: 'A-1'
        }));
      });
    });

    describe('addInventoryToProduct', () => {
      beforeEach(() => {
        component.initInventoryForm();
        component.warehouseId = '1';
        component.isInventoryModalLoading = true;
        component.isInventoryModalVisible = true;
      });

      it('should add inventory successfully', () => {
        const inventoryData = { warehouse_id: 1, quantity: 10, location_identifier: 'A-1' };
        mockProductsService.addInventoryToProduct.and.returnValue(of({}));
        mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(mockWarehouseResponse));
        
        const translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
        translateService.instant.and.returnValue('Inventario agregado exitosamente');
        
        component.addInventoryToProduct('1', inventoryData);
        
        expect(component.isInventoryModalLoading).toBe(false);
        expect(component.isInventoryModalVisible).toBe(false);
        expect(mockProductsService.addInventoryToProduct).toHaveBeenCalledWith('1', inventoryData);
        expect(mockNotificationService.create).toHaveBeenCalledWith('success', jasmine.any(String), jasmine.any(String));
        expect(mockProductsWarehouseService.getProductsByWarehouse).toHaveBeenCalled();
      });

      it('should handle error when adding inventory', () => {
        const inventoryData = { warehouse_id: 1, quantity: 10, location_identifier: 'A-1' };
        const error = { message: 'Error adding inventory' };
        mockProductsService.addInventoryToProduct.and.returnValue(throwError(() => error));
        
        const translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
        translateService.instant.and.returnValue('Error al agregar inventario');
        
        spyOn(console, 'error');
        
        component.addInventoryToProduct('1', inventoryData);
        
        expect(component.isInventoryModalLoading).toBe(false);
        expect(component.inventoryForm.enabled).toBe(true);
        expect(mockNotificationService.create).toHaveBeenCalledWith('error', jasmine.any(String), jasmine.any(String));
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('resetInventoryForm', () => {
      it('should reset form and enable it', () => {
        component.initInventoryForm();
        component.inventoryForm.patchValue({ product: '1', quantity: 10, location: 'A-1' });
        component.inventoryForm.disable();
        
        component.resetInventoryForm();
        
        expect(component.inventoryForm.value.product).toBeNull();
        expect(component.inventoryForm.value.quantity).toBeNull();
        expect(component.inventoryForm.value.location).toBeNull();
        expect(component.inventoryForm.enabled).toBe(true);
      });
    });

    describe('getFieldStatus', () => {
      beforeEach(() => {
        component.initInventoryForm();
      });

      it('should return empty string for valid field', () => {
        const status = component.getFieldStatus('product');
        expect(status).toBe('');
      });

      it('should return error for invalid dirty field', () => {
        const field = component.inventoryForm.get('product');
        field?.markAsDirty();
        field?.setValue(null);
        
        const status = component.getFieldStatus('product');
        expect(status).toBe('error');
      });

      it('should return empty string for invalid but not dirty field', () => {
        const field = component.inventoryForm.get('product');
        field?.setValue(null);
        
        const status = component.getFieldStatus('product');
        expect(status).toBe('');
      });
    });

    describe('getFieldError', () => {
      beforeEach(() => {
        component.initInventoryForm();
        const translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
        translateService.instant.and.returnValue('Campo requerido');
      });

      it('should return error message for required field', () => {
        const field = component.inventoryForm.get('product');
        field?.markAsDirty();
        field?.setValue(null);
        
        const error = component.getFieldError('product');
        expect(error).toBe('Campo requerido');
      });

      it('should return error message for min validation', () => {
        const field = component.inventoryForm.get('quantity');
        field?.markAsDirty();
        field?.setValue(0);
        
        const translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
        translateService.instant.and.returnValue('Cantidad mínima es 1');
        
        const error = component.getFieldError('quantity');
        expect(error).toBe('Cantidad mínima es 1');
      });

      it('should return empty string when no errors', () => {
        component.inventoryForm.patchValue({ product: '1', quantity: 10, location: 'A-1' });
        
        const error = component.getFieldError('product');
        expect(error).toBe('');
      });
    });

    describe('validateInventoryForm', () => {
      beforeEach(() => {
        component.initInventoryForm();
      });

      it('should return true for valid form', () => {
        component.inventoryForm.patchValue({
          product: '1',
          quantity: 10,
          location: 'A-1'
        });
        
        const isValid = component.validateInventoryForm();
        expect(isValid).toBe(true);
      });

      it('should return false for invalid form', () => {
        const isValid = component.validateInventoryForm();
        expect(isValid).toBe(false);
      });

      it('should mark all fields as dirty', () => {
        component.validateInventoryForm();
        
        expect(component.inventoryForm.get('product')?.dirty).toBe(true);
        expect(component.inventoryForm.get('quantity')?.dirty).toBe(true);
        expect(component.inventoryForm.get('location')?.dirty).toBe(true);
      });
    });
  });

  describe('Product Search', () => {
    describe('loadAllProducts', () => {
      it('should load all products successfully', () => {
        const mockProducts = [
          { id: '1', name: 'Product 1' } as Product,
          { id: '2', name: 'Product 2' } as Product
        ];
        mockProductsService.getProductsPaginated.and.returnValue(of({
          products: mockProducts,
          total: 2,
          total_pages: 1,
          page: 1,
          page_size: 5
        }));
        
        component.loadAllProducts();
        
        expect(component.isLoadingProducts).toBe(false);
        expect(component.products).toEqual(mockProducts);
        expect(mockProductsService.getProductsPaginated).toHaveBeenCalledWith(1, true, '');
      });

      it('should handle error when loading products', () => {
        const error = new Error('Network error');
        mockProductsService.getProductsPaginated.and.returnValue(throwError(() => error));
        
        spyOn(console, 'error');
        
        component.loadAllProducts();
        
        expect(component.isLoadingProducts).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error al cargar productos:', error);
      });

      it('should handle empty products response', () => {
        mockProductsService.getProductsPaginated.and.returnValue(of({
          products: undefined,
          total: 0,
          total_pages: 0,
          page: 1,
          page_size: 5
        }));
        
        component.loadAllProducts();
        
        expect(component.products).toEqual([]);
      });
    });

    describe('setupProductSearch', () => {
      it('should setup product search subscription', fakeAsync(() => {
        component.setupProductSearch();
        spyOn(component, 'searchProducts');
        
        component.onProductSearch('test');
        tick(500);
        
        expect(component.searchProducts).toHaveBeenCalledWith('test');
      }));

      it('should debounce product search', fakeAsync(() => {
        component.setupProductSearch();
        spyOn(component, 'searchProducts');
        
        component.onProductSearch('t');
        component.onProductSearch('te');
        component.onProductSearch('test');
        tick(500);
        
        expect(component.searchProducts).toHaveBeenCalledTimes(1);
        expect(component.searchProducts).toHaveBeenCalledWith('test');
      }));
    });

    describe('onProductSearch', () => {
      it('should emit search term to productSearchSubject', () => {
        spyOn(component['productSearchSubject'], 'next');
        
        component.onProductSearch('test');
        
        expect(component['productSearchSubject'].next).toHaveBeenCalledWith('test');
      });
    });

    describe('searchProducts', () => {
      it('should search products successfully', () => {
        const mockProducts = [
          { id: '1', name: 'Product 1' } as Product
        ];
        mockProductsService.getProductsPaginated.and.returnValue(of({
          products: mockProducts,
          total: 1,
          total_pages: 1,
          page: 1,
          page_size: 5
        }));
        
        component.searchProducts('test');
        
        expect(component.isLoadingProducts).toBe(false);
        expect(component.products).toEqual(mockProducts);
        expect(mockProductsService.getProductsPaginated).toHaveBeenCalledWith(1, true, 'test');
      });

      it('should handle error when searching products', () => {
        const error = new Error('Search error');
        mockProductsService.getProductsPaginated.and.returnValue(throwError(() => error));
        
        spyOn(console, 'error');
        
        component.searchProducts('test');
        
        expect(component.isLoadingProducts).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error al buscar productos:', error);
      });

      it('should handle empty search results', () => {
        mockProductsService.getProductsPaginated.and.returnValue(of({
          products: undefined,
          total: 0,
          total_pages: 0,
          page: 1,
          page_size: 5
        }));
        
        component.searchProducts('nonexistent');
        
        expect(component.products).toEqual([]);
      });
    });
  });

  describe('subscribeToProducts', () => {
    it('should subscribe to products$ and update listOfData', () => {
      const mockProducts = [
        { id: '1', name: 'Product 1' } as Product,
        { id: '2', name: 'Product 2' } as Product
      ];
      
      // products$ ya está mockeado en beforeEach como of([])
      // Se llama automáticamente en ngOnInit, así que verificamos que la suscripción está activa
      component.ngOnInit();
      
      // El observable ya emitió [] en el setup, así que verificamos que la suscripción está activa
      expect(component['subscription']).toBeDefined();
      expect(component.listOfData).toEqual([]);
    });
  });

  describe('getStatusClass', () => {
    it('should return inactive classes for undefined status', () => {
      const result = component.getStatusClass(undefined);
      expect(result).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300');
    });

    it('should return inactive classes for non-active string', () => {
      const result = component.getStatusClass('inactive');
      expect(result).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300');
    });
  });

  describe('Product mapping in getProductsByWarehouse', () => {
    it('should map products correctly with all fields', () => {
      const responseWithNullStatus: WarehouseProductsResponse = {
        ...mockWarehouseResponse,
        products: [{
          id: 3,
          name: 'Product without status',
          description: 'Test',
          purchase_price: 1000,
          storage_instructions: 'Test',
          temperature_range: '20-25°C',
          requires_cold_chain: false,
          supplier_id: 1,
          status: null,
          available_quantity: 50,
          location_identifier: 'C-10'
        }]
      };
      
      mockProductsWarehouseService.getProductsByWarehouse.and.returnValue(of(responseWithNullStatus));
      component.warehouseId = '1';
      
      component.getProductsByWarehouse();
      
      expect(component.listOfData[0].status).toBe(true); // Default value
      expect(component.listOfData[0].location_identifier).toBe('C-10');
    });
  });
});

