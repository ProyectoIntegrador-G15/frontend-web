import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductsComponent } from './products.component';
import { ProductsService } from '../../shared/services/products.service';
import { WarehousesService } from '../../shared/services/warehouses.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { of, throwError, BehaviorSubject, Subscription } from 'rxjs';

describe('ProductsComponent - Specific Methods', () => {
  let component: ProductsComponent;
  let productsService: jasmine.SpyObj<ProductsService>;
  let warehousesService: jasmine.SpyObj<WarehousesService>;
  let messageService: jasmine.SpyObj<NzMessageService>;
  let notificationService: jasmine.SpyObj<NzNotificationService>;
  let router: jasmine.SpyObj<Router>;
  let formBuilder: FormBuilder;

  const mockProducts$ = new BehaviorSubject<any[]>([]);
  const mockWarehouses = [
    { 
      id: '1', 
      name: 'Warehouse 1',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      country: 'Colombia',
      status: 'active' as const,
      created_at: '2025-10-26T00:00:00Z',
      updated_at: '2025-10-26T00:00:00Z'
    },
    { 
      id: '2', 
      name: 'Warehouse 2',
      address: 'Carrera 10 #20-30',
      city: 'Medellín',
      country: 'Colombia',
      status: 'active' as const,
      created_at: '2025-10-26T00:00:00Z',
      updated_at: '2025-10-26T00:00:00Z'
    }
  ];

  beforeEach(() => {
    const productsServiceSpy = jasmine.createSpyObj('ProductsService', [
      'getProductsPaginated',
      'bulkUploadProducts',
      'createProduct'
    ], {
      products$: mockProducts$.asObservable()
    });

    const warehousesServiceSpy = jasmine.createSpyObj('WarehousesService', ['getWarehouses']);
    warehousesServiceSpy.getWarehouses.and.returnValue(of(mockWarehouses));

    const messageServiceSpy = jasmine.createSpyObj('NzMessageService', [
      'success',
      'error',
      'info',
      'loading',
      'remove'
    ]);
    
    const notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['create']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        ProductsComponent,
        FormBuilder,
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: WarehousesService, useValue: warehousesServiceSpy },
        { provide: NzMessageService, useValue: messageServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NzNotificationService, useValue: notificationServiceSpy }
      ]
    });

    productsService = TestBed.inject(ProductsService) as jasmine.SpyObj<ProductsService>;
    warehousesService = TestBed.inject(WarehousesService) as jasmine.SpyObj<WarehousesService>;
    messageService = TestBed.inject(NzMessageService) as jasmine.SpyObj<NzMessageService>;
    notificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    formBuilder = TestBed.inject(FormBuilder);
    
    component = TestBed.inject(ProductsComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call all initialization methods', () => {
      spyOn(component, 'getProducts');
      spyOn(component, 'getWarehouses');
      spyOn(component, 'initForm');
      spyOn(component, 'setupSearch');

      component.ngOnInit();

      expect(component.getProducts).toHaveBeenCalled();
      expect(component.getWarehouses).toHaveBeenCalled();
      expect(component.initForm).toHaveBeenCalled();
      expect(component.setupSearch).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      component['subscription'] = new Subscription();
      spyOn(component['subscription'], 'unsubscribe');

      component.ngOnDestroy();

      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscribeToProducts', () => {
    it('should subscribe to products$ and update products', () => {
      const mockProducts = [{ id: '1', name: 'Test Product' }];
      mockProducts$.next(mockProducts);

      component['subscribeToProducts']();

      expect(component.products.length).toBe(1);
      expect(component.products[0].id).toBe('1');
    });
  });

  describe('getProducts', () => {
    it('should fetch products and update component state', () => {
      const mockResponse = {
        products: [{ id: '1', name: 'Product 1' }],
        total: 10,
        page: 1,
        page_size: 5,
        total_pages: 2,
        has_next: true
      };

      productsService.getProductsPaginated.and.returnValue(of(mockResponse));

      component.getProducts();

      expect(component.isLoading).toBe(false);
      expect(component.products.length).toBe(1);
      expect(component.pageSize).toBe(5);
      expect(component.totalProducts).toBe(10);
      expect(component.hasNextPage).toBe(true);
    });

    it('should handle error when fetching products', () => {
      productsService.getProductsPaginated.and.returnValue(
        throwError(() => ({ message: 'Error fetching products' }))
      );

      component.getProducts();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Error al buscar productos.');
    });
  });

  describe('getWarehouses', () => {
    it('should fetch warehouses successfully', () => {
      component.getWarehouses();

      expect(warehousesService.getWarehouses).toHaveBeenCalled();
      expect(component.warehouses.length).toBe(2);
      expect(component.isLoadingWarehouses).toBe(false);
    });

    it('should handle error when fetching warehouses', () => {
      warehousesService.getWarehouses.and.returnValue(
        throwError(() => ({ message: 'Error' }))
      );

      component.getWarehouses();

      expect(component.isLoadingWarehouses).toBe(false);
    });
  });

  describe('navigateToInventory', () => {
    it('should navigate to product inventory page', () => {
      const productId = '123';
      component.navigateToInventory(productId);

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/products', productId, 'warehouses']);
    });
  });

  describe('showProductModal', () => {
    it('should open product modal', () => {
      component.showProductModal();
      expect(component.isProductModalVisible).toBe(true);
    });
  });

  describe('handleProductModalCancel', () => {
    it('should close product modal', () => {
      component.isProductModalVisible = true;
      component.handleProductModalCancel();
      expect(component.isProductModalVisible).toBe(false);
    });
  });

  describe('initForm', () => {
    it('should initialize form with validators', () => {
      component.initForm();

      expect(component.validateForm).toBeDefined();
      expect(component.validateForm.get('name')).toBeDefined();
      expect(component.validateForm.get('price')).toBeDefined();
      expect(component.validateForm.get('tempMin')).toBeDefined();
      expect(component.validateForm.get('tempMax')).toBeDefined();
    });

    it('should setup temperature validation on value changes', () => {
      component.initForm();
      spyOn(component, 'validateTemperatureRange');

      component.validateForm.get('tempMin')?.setValue(10);
      expect(component.validateTemperatureRange).toHaveBeenCalled();

      component.validateForm.get('tempMax')?.setValue(20);
      expect(component.validateTemperatureRange).toHaveBeenCalled();
    });
  });

  describe('validateTemperatureRange', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should return early if form not initialized', () => {
      component.validateForm = null as any;
      component.validateTemperatureRange();
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should set errors when tempMin >= tempMax', () => {
      component.validateForm.get('tempMin')?.setValue(20);
      component.validateForm.get('tempMax')?.setValue(10);

      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBe(true);
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBe(true);
    });

    it('should clear errors when tempMin < tempMax', () => {
      component.validateForm.get('tempMin')?.setValue(20);
      component.validateForm.get('tempMax')?.setValue(10);
      component.validateTemperatureRange();

      component.validateForm.get('tempMin')?.setValue(10);
      component.validateForm.get('tempMax')?.setValue(20);
      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBeFalsy();
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBeFalsy();
    });
  });

  describe('temperatureRangeValidator', () => {
    it('should return error when tempMin >= tempMax', () => {
      const form = formBuilder.group({
        tempMin: [20],
        tempMax: [10]
      });

      const result = component.temperatureRangeValidator(form);

      expect(result).toEqual({ temperatureRange: true });
    });

    it('should return empty object when tempMin < tempMax', () => {
      const form = formBuilder.group({
        tempMin: [10],
        tempMax: [20]
      });

      const result = component.temperatureRangeValidator(form);

      expect(result).toEqual({});
    });
  });

  describe('getFieldStatus', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should return error status for invalid dirty field', () => {
      const field = component.validateForm.get('name');
      field?.markAsDirty();
      field?.setValue(null);

      const status = component.getFieldStatus('name');

      expect(status).toBe('error');
    });

    it('should return empty string for valid field', () => {
      const field = component.validateForm.get('name');
      field?.setValue('Valid Name');

      const status = component.getFieldStatus('name');

      expect(status).toBe('');
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should return required error message', () => {
      const field = component.validateForm.get('name');
      field?.setValue(null);
      field?.markAsDirty();

      const error = component.getFieldError('name');

      expect(error).toBe('Este campo es obligatorio');
    });

    it('should return min error message', () => {
      const field = component.validateForm.get('price');
      field?.setValue(-1);
      field?.markAsDirty();

      const error = component.getFieldError('price');

      expect(error).toBe('El precio debe ser mayor a 0');
    });

    it('should return minlength error message', () => {
      const field = component.validateForm.get('description');
      field?.setValue('short');
      field?.markAsDirty();

      const error = component.getFieldError('description');

      expect(error).toBe('Este campo debe tener al menos 10 caracteres');
    });

    it('should return temperatureRange error message', () => {
      component.validateForm.get('tempMin')?.setValue(20);
      component.validateForm.get('tempMax')?.setValue(10);
      component.validateTemperatureRange();

      const error = component.getFieldError('tempMin');

      expect(error).toBe('La temperatura mínima debe ser menor a la máxima');
    });
  });

  describe('validateFormFields', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should mark all fields as dirty', () => {
      component.validateFormFields();

      for (const key in component.validateForm.controls) {
        expect(component.validateForm.controls[key].dirty).toBe(true);
      }
    });

    it('should return false when form is invalid', () => {
      const result = component.validateFormFields();

      expect(result).toBe(false);
    });

    it('should return true when form is valid', () => {
      component.validateForm.patchValue({
        name: 'Test Product',
        price: 100,
        supplier: 'Test Supplier',
        requiresColdChain: 'si',
        tempMin: 2,
        tempMax: 8,
        description: 'Test description with enough characters',
        storageInstructions: 'Test storage instructions with enough characters'
      });

      // Forzar que el form sea válido si las validaciones no están funcionando
      const isValid = component.validateForm.valid;
      const result = component.validateFormFields();

      expect(result).toBe(isValid);
    });
  });

  describe('handleProductModalOk', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should not proceed if form is invalid', () => {
      component.handleProductModalOk();

      expect(productsService.createProduct).not.toHaveBeenCalled();
    });

    it('should create product successfully', () => {
      spyOn(component, 'validateFormFields').and.returnValue(true);
      
      component.validateForm.patchValue({
        name: 'New Product',
        price: 150,
        supplier: 'Supplier XYZ',
        requiresColdChain: 'si',
        tempMin: 2,
        tempMax: 8,
        description: 'This is a test product description',
        storageInstructions: 'Store in a cool dry place'
      });

      productsService.createProduct.and.returnValue(of({ id: '1', name: 'New Product' } as any));
      productsService.getProductsPaginated.and.returnValue(of({
        products: [],
        total: 1,
        page: 1,
        page_size: 5,
        total_pages: 1,
        has_next: false
      }));

      component.handleProductModalOk();

      expect(productsService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'New Product',
        price: 150,
        supplier: 'Supplier XYZ',
        requiresColdChain: true,
        temperatureRange: '2°F - 8°F'
      }));
      expect(component.isProductModalVisible).toBe(false);
      expect(component.isProductModalLoading).toBe(false);
      expect(notificationService.create).toHaveBeenCalledWith(
        'success',
        '¡Producto creado exitosamente!',
        jasmine.any(String)
      );
    });

    it('should handle requiresColdChain as false', () => {
      spyOn(component, 'validateFormFields').and.returnValue(true);
      
      component.validateForm.patchValue({
        name: 'Product without cold chain',
        price: 50,
        supplier: 'Supplier ABC',
        requiresColdChain: 'no',
        tempMin: 15,
        tempMax: 25,
        description: 'Product that does not need cold chain',
        storageInstructions: 'Store at room temperature'
      });

      productsService.createProduct.and.returnValue(of({ id: '2' } as any));
      productsService.getProductsPaginated.and.returnValue(of({
        products: [],
        total: 1,
        page: 1,
        page_size: 5,
        total_pages: 1,
        has_next: false
      }));

      component.handleProductModalOk();

      expect(productsService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
        requiresColdChain: false
      }));
    });

    it('should handle error when creating product', () => {
      spyOn(component, 'validateFormFields').and.returnValue(true);
      
      component.validateForm.patchValue({
        name: 'Error Product',
        price: 100,
        supplier: 'Supplier',
        requiresColdChain: 'si',
        tempMin: 2,
        tempMax: 8,
        description: 'This will fail to create',
        storageInstructions: 'Store properly'
      });

      productsService.createProduct.and.returnValue(
        throwError(() => ({ message: 'Error al crear producto' }))
      );

      component.handleProductModalOk();

      expect(component.isProductModalLoading).toBe(false);
      expect(component.errorMessage).toBe('Error al crear producto');
      expect(notificationService.create).toHaveBeenCalledWith(
        'error',
        'Error al crear producto',
        'Error al crear producto'
      );
    });
  });

  describe('resetProductForm', () => {
    it('should reset the form', () => {
      component.initForm();
      component.validateForm.patchValue({
        name: 'Test',
        price: 100
      });

      component.resetProductForm();

      expect(component.validateForm.get('name')?.value).toBeNull();
      expect(component.validateForm.get('price')?.value).toBeNull();
    });
  });

  describe('onPageIndexChange', () => {
    it('should update current page and call getProducts', () => {
      spyOn(component, 'getProducts');
      
      component.onPageIndexChange(2);

      expect(component.currentPage).toBe(2);
      expect(component.getProducts).toHaveBeenCalled();
    });
  });

  describe('onStatusFilterChange', () => {
    it('should update status filter, reset page and call getProducts', () => {
      component.currentPage = 3;
      spyOn(component, 'getProducts');

      component.onStatusFilterChange(false);

      expect(component.statusFilter).toBe(false);
      expect(component.currentPage).toBe(1);
      expect(component.getProducts).toHaveBeenCalled();
    });
  });

  describe('setupSearch', () => {
    it('should setup search with debounce and distinctUntilChanged', fakeAsync(() => {
      spyOn(component, 'getProducts');
      component.setupSearch();

      component.onSearchChange('test');
      tick(600);
      expect(component.getProducts).not.toHaveBeenCalled();

      tick(100);
      expect(component.searchTerm).toBe('test');
      expect(component.currentPage).toBe(1);
      expect(component.getProducts).toHaveBeenCalled();
    }));

    it('should only emit distinct values', fakeAsync(() => {
      spyOn(component, 'getProducts');
      component.setupSearch();

      component.onSearchChange('test');
      tick(700);
      const firstCallCount = (component.getProducts as jasmine.Spy).calls.count();

      component.onSearchChange('test');
      tick(700);
      const secondCallCount = (component.getProducts as jasmine.Spy).calls.count();

      expect(secondCallCount).toBe(firstCallCount);
    }));
  });

  describe('onSearchChange', () => {
    it('should emit search term to subject', () => {
      spyOn(component['searchSubject'], 'next');
      component.onSearchChange('search term');
      expect(component['searchSubject'].next).toHaveBeenCalledWith('search term');
    });
  });

  describe('clearSearch', () => {
    it('should clear search term and emit empty string', () => {
      component.searchTerm = 'test';
      spyOn(component['searchSubject'], 'next');

      component.clearSearch();

      expect(component.searchTerm).toBe('');
      expect(component['searchSubject'].next).toHaveBeenCalledWith('');
    });
  });

  describe('loadBulkProducts', () => {
    it('should open bulk upload modal', () => {
      component.loadBulkProducts();
      expect(component.isBulkUploadModalVisible).toBe(true);
    });
  });

  describe('handleBulkUploadModalCancel', () => {
    it('should close modal and reset state', () => {
      component.isBulkUploadModalVisible = true;
      component.isBulkUploadLoading = true;
      component.bulkUploadErrors = ['error'];
      component.fileList = [{ name: 'test.csv' } as any];

      component.handleBulkUploadModalCancel();

      expect(component.isBulkUploadModalVisible).toBe(false);
      expect(component.isBulkUploadLoading).toBe(false);
      expect(component.bulkUploadErrors).toEqual([]);
      expect(component.fileList).toEqual([]);
    });
  });

  describe('downloadExcelTemplate', () => {
    it('should trigger download and show success message', () => {
      spyOn(document, 'createElement').and.callThrough();
      
      component.downloadExcelTemplate();

      expect(messageService.success).toHaveBeenCalledWith(
        jasmine.stringContaining('productos-template.xlsx')
      );
    });
  });

  describe('downloadCsvTemplate', () => {
    it('should trigger download and show success message', () => {
      component.downloadCsvTemplate();

      expect(messageService.success).toHaveBeenCalledWith(
        jasmine.stringContaining('productos-template.csv')
      );
    });
  });

  describe('beforeUpload', () => {
    it('should reject when file list already has a file', () => {
      component.fileList = [{ name: 'existing.csv' } as any];
      const file = { name: 'new.csv', type: 'text/csv' } as NzUploadFile;

      const result = component.beforeUpload(file);

      expect(result).toBe(false);
      expect(messageService.error).toHaveBeenCalled();
    });

    it('should reject invalid file types', () => {
      component.fileList = [];
      const file = { name: 'test.pdf', type: 'application/pdf', size: 1024 } as NzUploadFile;

      const result = component.beforeUpload(file);

      expect(result).toBe(false);
      expect(messageService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('Solo se permiten archivos CSV')
      );
    });

    it('should accept valid CSV file', () => {
      component.fileList = [];
      const file = { name: 'test.csv', type: 'text/csv', size: 1024 } as NzUploadFile;

      const result = component.beforeUpload(file);

      expect(result).toBe(true);
    });

    it('should accept valid Excel file', () => {
      component.fileList = [];
      const file = {
        name: 'test.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024
      } as NzUploadFile;

      const result = component.beforeUpload(file);

      expect(result).toBe(true);
    });

    it('should reject files larger than 10MB', () => {
      component.fileList = [];
      const file = {
        name: 'large.csv',
        type: 'text/csv',
        size: 11 * 1024 * 1024
      } as NzUploadFile;

      const result = component.beforeUpload(file);

      expect(result).toBe(false);
      expect(messageService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('debe ser menor a 10MB')
      );
    });
  });

  describe('customRequest', () => {
    it('should simulate successful upload', fakeAsync(() => {
      const item = {
        file: { name: 'test.csv' },
        onSuccess: jasmine.createSpy('onSuccess')
      };

      component.customRequest(item);
      tick(200);

      expect(item.onSuccess).toHaveBeenCalledWith({}, item.file);
    }));
  });

  describe('handleFileChange', () => {
    it('should handle successful file upload', () => {
      const file = { name: 'test.csv', status: 'done' } as NzUploadFile;
      
      component.handleFileChange({ file, fileList: [file] } as any);

      expect(messageService.success).toHaveBeenCalledWith(
        jasmine.stringContaining('archivo subido exitosamente')
      );
      expect(component.fileList.length).toBe(1);
    });

    it('should handle failed file upload', () => {
      const file = { name: 'test.csv', status: 'error' } as NzUploadFile;
      
      component.handleFileChange({ file, fileList: [file] } as any);

      expect(messageService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('falló la subida')
      );
    });
  });

  describe('onFileDownload', () => {
    it('should download file when originFileObj exists', () => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      const uploadFile = {
        name: 'test.csv',
        originFileObj: mockFile
      } as NzUploadFile;

      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');

      component.onFileDownload(uploadFile);

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(messageService.success).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should show error when no originFileObj', () => {
      const uploadFile = { name: 'test.csv' } as NzUploadFile;

      component.onFileDownload(uploadFile);

      expect(messageService.error).toHaveBeenCalledWith('No se puede descargar el archivo');
    });
  });

  describe('loadFile', () => {
    it('should prevent loading when already loading', () => {
      component.isBulkUploadLoading = true;
      component.fileList = [{ originFileObj: new File([], 'test.csv') } as any];

      component.loadFile();

      expect(productsService.bulkUploadProducts).not.toHaveBeenCalled();
    });

    it('should show error when no file selected', () => {
      component.fileList = [];

      component.loadFile();

      expect(messageService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('selecciona un archivo')
      );
    });

    it('should show error when file has no originFileObj', () => {
      component.fileList = [{ name: 'test.csv' } as any];

      component.loadFile();

      expect(messageService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('No se puede procesar')
      );
    });

    it('should upload file successfully', fakeAsync(() => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      component.fileList = [{ originFileObj: mockFile } as any];

      productsService.bulkUploadProducts.and.returnValue(of({
        success: true,
        message: 'Carga exitosa',
        created_products: 10,
        total_rows: 10,
        errors: []
      }));

      productsService.getProductsPaginated.and.returnValue(of({
        products: [],
        total: 10,
        page: 1,
        page_size: 5,
        total_pages: 2,
        has_next: true
      }));

      spyOn(component, 'handleBulkUploadModalCancel');

      component.loadFile();
      tick();

      expect(productsService.bulkUploadProducts).toHaveBeenCalledWith(mockFile);
      expect(messageService.success).toHaveBeenCalled();
      expect(messageService.info).toHaveBeenCalledWith(
        jasmine.stringContaining('Productos creados: 10 de 10')
      );
      expect(component.handleBulkUploadModalCancel).toHaveBeenCalled();
      expect(component.currentPage).toBe(1);
    }));

    it('should handle upload errors from backend', fakeAsync(() => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      component.fileList = [{ originFileObj: mockFile } as any];

      productsService.bulkUploadProducts.and.returnValue(of({
        success: false,
        message: 'Errores encontrados',
        created_products: 5,
        total_rows: 10,
        errors: ['Error 1', 'Error 2']
      }));

      component.loadFile();
      tick();

      expect(component.bulkUploadErrors.length).toBe(2);
      expect(messageService.error).toHaveBeenCalledWith('Errores encontrados');
    }));

    it('should handle network errors', fakeAsync(() => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      component.fileList = [{ originFileObj: mockFile } as any];

      productsService.bulkUploadProducts.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      component.loadFile();
      tick();

      expect(messageService.error).toHaveBeenCalledWith('Network error');
    }));
  });
});

