import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ProductsComponent } from './products.component';
import { ProductsService } from '../../shared/services/products.service';

describe('ProductsComponent - Comprehensive Tests', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let mockProductsService: jasmine.SpyObj<ProductsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockModalService: jasmine.SpyObj<NzModalService>;

  const mockProducts = [
    {
      id: '1',
      name: 'Paracetamol 500mg',
      price: 0.85,
      provider: 'Farmacéutica ABC',
      needsCold: false,
      status: 'active' as const
    },
    {
      id: '2',
      name: 'Insulina Humana Regular',
      price: 12.5,
      provider: 'Medicamentos XYZ',
      needsCold: true,
      status: 'active' as const
    }
  ];

  // Test Utilities
  const TestUtils = {
    createValidFormData: () => ({
      name: 'Producto de Prueba',
      price: 15.50,
      provider: 'proveedor1',
      requiresColdChain: 'si',
      tempMin: 20,
      tempMax: 30,
      description: 'Descripción del producto de prueba',
      storageInstructions: 'Instrucciones de almacenamiento del producto'
    }),

    createInvalidFormData: () => ({
      name: '',
      price: 0,
      provider: null,
      requiresColdChain: null,
      tempMin: 30,
      tempMax: 20,
      description: '',
      storageInstructions: ''
    }),

    fillFormWithValidData: () => {
      component.validateForm.patchValue(TestUtils.createValidFormData());
    },

    fillFormWithInvalidData: () => {
      component.validateForm.patchValue(TestUtils.createInvalidFormData());
    },

    openModal: () => {
      component.showProductModal();
    },

    closeModal: () => {
      component.isProductModalVisible = false;
    },

    submitForm: () => {
      component.handleProductModalOk();
    },

    cancelForm: () => {
      component.handleProductModalCancel();
    }
  };

  beforeEach(async () => {
    const productsServiceSpy = jasmine.createSpyObj('ProductsService', ['getProducts', 'products$']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const modalServiceSpy = jasmine.createSpyObj('NzModalService', ['create', 'closeAll', 'confirm']);

    await TestBed.configureTestingModule({
      declarations: [ProductsComponent],
      imports: [ReactiveFormsModule],
      providers: [
        FormBuilder,
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NzModalService, useValue: modalServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    mockProductsService = TestBed.inject(ProductsService) as jasmine.SpyObj<ProductsService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockModalService = TestBed.inject(NzModalService) as jasmine.SpyObj<NzModalService>;

    // Setup default mock returns
    mockProductsService.getProducts.and.returnValue(of(mockProducts));
    mockProductsService.products$ = of(mockProducts);
  });

  beforeEach(() => {
    fixture.detectChanges();
  });

  // ========================================
  // BASIC COMPONENT TESTS
  // ========================================

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call initForm on ngOnInit', () => {
      spyOn(component, 'initForm');
      component.ngOnInit();
      expect(component.initForm).toHaveBeenCalled();
    });

    it('should call getProducts on ngOnInit', () => {
      spyOn(component, 'getProducts');
      component.ngOnInit();
      expect(component.getProducts).toHaveBeenCalled();
    });
  });

  // ========================================
  // FORM INITIALIZATION TESTS
  // ========================================

  describe('Form Initialization', () => {
    it('should initialize form with all required fields', () => {
      component.initForm();

      expect(component.validateForm.get('name')).toBeTruthy();
      expect(component.validateForm.get('price')).toBeTruthy();
      expect(component.validateForm.get('provider')).toBeTruthy();
      expect(component.validateForm.get('requiresColdChain')).toBeTruthy();
      expect(component.validateForm.get('tempMin')).toBeTruthy();
      expect(component.validateForm.get('tempMax')).toBeTruthy();
      expect(component.validateForm.get('description')).toBeTruthy();
      expect(component.validateForm.get('storageInstructions')).toBeTruthy();
    });

    it('should set up value changes subscriptions for temperature fields', () => {
      spyOn(component, 'validateTemperatureRange');
      component.initForm();

      component.validateForm.get('tempMin')?.setValue(10);
      component.validateForm.get('tempMax')?.setValue(20);

      expect(component.validateTemperatureRange).toHaveBeenCalled();
    });
  });

  // ========================================
  // FORM VALIDATION TESTS
  // ========================================

  describe('Form Validation', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should validate required fields', () => {
      const nameControl = component.validateForm.get('name');
      const priceControl = component.validateForm.get('price');

      expect(nameControl?.hasError('required')).toBeTruthy();
      expect(priceControl?.hasError('required')).toBeTruthy();
    });

    it('should validate price minimum value', () => {
      const priceControl = component.validateForm.get('price');

      priceControl?.setValue(0.005);
      expect(priceControl?.hasError('min')).toBeTruthy();

      priceControl?.setValue(0.01);
      expect(priceControl?.hasError('min')).toBeFalsy();
    });

    it('should validate temperature range', () => {
      component.validateForm.get('tempMin')?.setValue(30);
      component.validateForm.get('tempMax')?.setValue(20);

      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBeTruthy();
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBeTruthy();
    });

    it('should clear temperature range errors when valid', () => {
      component.validateForm.get('tempMin')?.setValue(20);
      component.validateForm.get('tempMax')?.setValue(30);

      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBeFalsy();
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBeFalsy();
    });
  });

  // ========================================
  // FIELD STATUS AND ERROR MESSAGES
  // ========================================

  describe('Field Status and Error Messages', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should return error status for invalid fields', () => {
      const nameControl = component.validateForm.get('name');
      nameControl?.markAsDirty();

      expect(component.getFieldStatus('name')).toBe('error');
    });

    it('should return empty string for valid fields', () => {
      const nameControl = component.validateForm.get('name');
      nameControl?.setValue('Test Product');
      nameControl?.markAsDirty();

      expect(component.getFieldStatus('name')).toBe('');
    });

    it('should return correct error messages', () => {
      const nameControl = component.validateForm.get('name');
      nameControl?.setErrors({ required: true });

      expect(component.getFieldError('name')).toBe('Este campo es obligatorio');
    });

    it('should return price error message', () => {
      const priceControl = component.validateForm.get('price');
      priceControl?.setErrors({ min: { min: 0.01, actual: 0.005 } });

      expect(component.getFieldError('price')).toBe('El precio debe ser mayor a 0');
    });

    it('should return temperature range error message', () => {
      const tempMinControl = component.validateForm.get('tempMin');
      tempMinControl?.setErrors({ temperatureRange: true });

      expect(component.getFieldError('tempMin')).toBe('La temperatura mínima debe ser menor a la máxima');
    });
  });

  // ========================================
  // MODAL MANAGEMENT TESTS
  // ========================================

  describe('Modal Management', () => {
    it('should show product modal', () => {
      component.showProductModal();
      expect(component.isProductModalVisible).toBe(true);
    });

    it('should hide product modal on cancel', () => {
      component.isProductModalVisible = true;
      component.handleProductModalCancel();
      expect(component.isProductModalVisible).toBe(false);
    });

  });

  // ========================================
  // FORM SUBMISSION TESTS
  // ========================================

  describe('Form Submission', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should not submit form if invalid', () => {
      spyOn(component, 'validateFormFields').and.returnValue(false);
      component.handleProductModalOk();

      expect(component.isProductModalLoading).toBe(false);
    });

    it('should submit form if valid', () => {
      spyOn(component, 'validateFormFields').and.returnValue(true);
      spyOn(component, 'resetProductForm');

      TestUtils.fillFormWithValidData();
      component.handleProductModalOk();

      expect(component.isProductModalLoading).toBe(true);
    });

    it('should log form data on submission', () => {
      spyOn(console, 'log');
      spyOn(component, 'validateFormFields').and.returnValue(true);

      TestUtils.fillFormWithValidData();
      component.handleProductModalOk();

      expect(console.log).toHaveBeenCalledWith(component.validateForm.value);
    });

    it('should close modal after successful submission', (done) => {
      spyOn(component, 'validateFormFields').and.returnValue(true);
      spyOn(component, 'resetProductForm');

      TestUtils.fillFormWithValidData();
      component.handleProductModalOk();

      setTimeout(() => {
        expect(component.isProductModalVisible).toBe(false);
        expect(component.isProductModalLoading).toBe(false);
        expect(component.resetProductForm).toHaveBeenCalled();
        done();
      }, 1100);
    });
  });

  // ========================================
  // FORM RESET TESTS
  // ========================================

  describe('Form Reset', () => {
    it('should reset form to initial state', () => {
      component.initForm();
      TestUtils.fillFormWithValidData();

      component.resetProductForm();

      expect(component.validateForm.get('name')?.value).toBeNull();
      expect(component.validateForm.get('price')?.value).toBeNull();
    });
  });

  // ========================================
  // VALIDATION METHODS TESTS
  // ========================================

  describe('Form Validation Methods', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should validate all form fields', () => {
      const result = component.validateFormFields();
      expect(result).toBeFalsy();
    });

    it('should mark all fields as dirty when validating', () => {
      component.validateFormFields();

      expect(component.validateForm.get('name')?.dirty).toBeTruthy();
      expect(component.validateForm.get('price')?.dirty).toBeTruthy();
    });

  });

  // ========================================
  // TEMPERATURE RANGE VALIDATION TESTS
  // ========================================

  describe('Temperature Range Validation', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should set errors when tempMin >= tempMax', () => {
      component.validateForm.get('tempMin')?.setValue(30);
      component.validateForm.get('tempMax')?.setValue(20);

      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBeTruthy();
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBeTruthy();
    });

    it('should clear errors when tempMin < tempMax', () => {
      // First set invalid state
      component.validateForm.get('tempMin')?.setValue(30);
      component.validateForm.get('tempMax')?.setValue(20);
      component.validateTemperatureRange();

      // Then set valid state
      component.validateForm.get('tempMin')?.setValue(20);
      component.validateForm.get('tempMax')?.setValue(30);
      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBeFalsy();
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBeFalsy();
    });

    it('should handle null values gracefully', () => {
      component.validateForm.get('tempMin')?.setValue(null);
      component.validateForm.get('tempMax')?.setValue(null);

      expect(() => component.validateTemperatureRange()).not.toThrow();
    });

    it('should handle undefined values gracefully', () => {
      component.validateForm.get('tempMin')?.setValue(undefined);
      component.validateForm.get('tempMax')?.setValue(undefined);

      expect(() => component.validateTemperatureRange()).not.toThrow();
    });

    it('should handle empty string values gracefully', () => {
      component.validateForm.get('tempMin')?.setValue('');
      component.validateForm.get('tempMax')?.setValue('');

      expect(() => component.validateTemperatureRange()).not.toThrow();
    });

    it('should handle form not initialized', () => {
      // Simular que el formulario no está inicializado
      component.validateForm = null as any;

      expect(() => component.validateTemperatureRange()).not.toThrow();
    });
  });

  // ========================================
  // DATA LOADING TESTS
  // ========================================

  describe('Data Loading', () => {
    it('should load products on initialization', () => {
      component.getProducts();
      expect(mockProductsService.getProducts).toHaveBeenCalled();
    });

    it('should handle products loading success', () => {
      component.getProducts();
      expect(component.listOfData).toEqual(mockProducts);
      expect(component.isLoading).toBe(false);
    });

    it('should handle products loading error', () => {
      mockProductsService.getProducts.and.returnValue(throwError('Error loading products'));
      spyOn(console, 'error');

      component.getProducts();

      expect(console.error).toHaveBeenCalledWith('Error en búsqueda:', 'Error loading products');
      expect(component.errorMessage).toBe('Error al buscar productos.');
      expect(component.isLoading).toBe(false);
    });
  });

  // ========================================
  // NAVIGATION TESTS
  // ========================================

  describe('Navigation', () => {
    it('should navigate to inventory', () => {
      const productId = '123';
      component.navigateToInventory(productId);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/products', productId, 'warehouses']);
    });
  });

  // ========================================
  // COMPONENT LIFECYCLE TESTS
  // ========================================

  describe('Component Lifecycle', () => {
    it('should unsubscribe on destroy', () => {
      spyOn(component['subscription'], 'unsubscribe');
      component.ngOnDestroy();
      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });

  // ========================================
  // EDGE CASES AND BOUNDARY TESTING
  // ========================================

  describe('Edge Cases and Boundary Testing', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should handle very large price values', () => {
      const priceControl = component.validateForm.get('price');
      priceControl?.setValue(999999.99);
      expect(priceControl?.valid).toBeTruthy();
    });

    it('should handle very small valid price values', () => {
      const priceControl = component.validateForm.get('price');
      priceControl?.setValue(0.01);
      expect(priceControl?.valid).toBeTruthy();
    });

    it('should handle extreme temperature values', () => {
      component.validateForm.get('tempMin')?.setValue(-100);
      component.validateForm.get('tempMax')?.setValue(200);

      component.validateTemperatureRange();

      expect(component.validateForm.get('tempMin')?.hasError('temperatureRange')).toBeFalsy();
      expect(component.validateForm.get('tempMax')?.hasError('temperatureRange')).toBeFalsy();
    });

  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('Error Handling Edge Cases', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should handle form control not found in getFieldStatus', () => {
      const result = component.getFieldStatus('nonExistentField');
      expect(result).toBe('');
    });

    it('should handle form control not found in getFieldError', () => {
      const result = component.getFieldError('nonExistentField');
      expect(result).toBe('');
    });

    it('should handle null errors in getFieldError', () => {
      const nameControl = component.validateForm.get('name');
      nameControl?.setErrors(null);

      const result = component.getFieldError('name');
      expect(result).toBe('');
    });
  });

  // ========================================
  // FORM STATE MANAGEMENT TESTS
  // ========================================

  describe('Form State Management', () => {
    it('should initialize with empty form data', () => {
      component.initForm();
      expect(component.validateForm.value).toEqual({
        name: null,
        price: null,
        provider: null,
        requiresColdChain: null,
        tempMin: null,
        tempMax: null,
        description: null,
        storageInstructions: null
      });
    });

    it('should update form values correctly', () => {
      component.initForm();
      component.validateForm.patchValue({
        name: 'New Product',
        price: 15.75
      });

      expect(component.validateForm.get('name')?.value).toBe('New Product');
      expect(component.validateForm.get('price')?.value).toBe(15.75);
    });
  });

  // ========================================
  // INPUT CLASS PROPERTY TESTS
  // ========================================

  describe('Input Class Property', () => {
    it('should have correct input class', () => {
      expect(component.inputClass).toContain('w-full');
      expect(component.inputClass).toContain('rounded-4');
      expect(component.inputClass).toContain('border-normal');
    });
  });
});
