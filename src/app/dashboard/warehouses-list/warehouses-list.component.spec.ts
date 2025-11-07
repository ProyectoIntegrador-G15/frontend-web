import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { WarehousesListComponent } from './warehouses-list.component';
import { WarehousesService, Warehouse } from '../../shared/services/warehouses.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { of, throwError, Subscription } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('WarehousesListComponent', () => {
  let component: WarehousesListComponent;
  let warehousesService: jasmine.SpyObj<WarehousesService>;
  let notificationService: jasmine.SpyObj<NzNotificationService>;
  let router: jasmine.SpyObj<Router>;
  let formBuilder: FormBuilder;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockWarehouses: Warehouse[] = [
    {
      id: 1,
      name: 'Bodega Central',
      city: 'Bogotá',
      country: 'Colombia',
      address: 'Calle 123 #45-67',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    },
    {
      id: 2,
      name: 'Bodega Norte',
      city: 'Medellín',
      country: 'Colombia',
      address: 'Carrera 80 #50-30',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    }
  ];

  const mockPaginatedResponse = {
    warehouses: mockWarehouses,
    total: 2,
    total_pages: 1,
    page: 1,
    page_size: 5
  };

  beforeEach(() => {
    const warehousesServiceSpy = jasmine.createSpyObj('WarehousesService', [
      'getWarehousesPaginated',
      'createWarehouse',
      'getWarehouses',
      'getActiveWarehouses'
    ], {
      warehouses$: of(mockWarehouses)
    });

    // Configurar valores de retorno por defecto
    warehousesServiceSpy.getWarehousesPaginated.and.returnValue(of(mockPaginatedResponse));
    warehousesServiceSpy.createWarehouse.and.returnValue(of(mockWarehouses[0]));

    const notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['create']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    translateServiceSpy.instant.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      declarations: [WarehousesListComponent, MockCustomTranslatePipe],
      providers: [
        FormBuilder,
        { provide: WarehousesService, useValue: warehousesServiceSpy },
        { provide: NzNotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    });

    warehousesService = TestBed.inject(WarehousesService) as jasmine.SpyObj<WarehousesService>;
    notificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    formBuilder = TestBed.inject(FormBuilder);
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    component = TestBed.createComponent(WarehousesListComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call initialization methods', () => {
      spyOn(component, 'getWarehouses');
      spyOn(component, 'setupSearch');
      spyOn(component, 'initForm');

      component.ngOnInit();

      expect(component.getWarehouses).toHaveBeenCalled();
      expect(component.setupSearch).toHaveBeenCalled();
      expect(component.initForm).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from subscriptions', () => {
      component.subscription = new Subscription();
      spyOn(component.subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('getWarehouses', () => {
    it('should fetch warehouses and update component state', () => {
      warehousesService.getWarehousesPaginated.and.returnValue(of(mockPaginatedResponse));

      component.getWarehouses();

      expect(component.warehouses).toEqual(mockWarehouses);
      expect(component.totalWarehouses).toBe(2);
      expect(component.pageSize).toBe(5);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error when fetching warehouses', () => {
      warehousesService.getWarehousesPaginated.and.returnValue(throwError(() => new Error('Error')));

      component.getWarehouses();

      expect(component.errorMessage).toBe('Error al buscar bodegas.');
      expect(component.isLoading).toBe(false);
    });

    it('should call service with correct parameters', () => {
      component.currentPage = 2;
      component.nameFilter = 'Bodega';
      component.countryFilter = 'Colombia';
      warehousesService.getWarehousesPaginated.and.returnValue(of(mockPaginatedResponse));

      component.getWarehouses();

      expect(warehousesService.getWarehousesPaginated).toHaveBeenCalledWith(2, 'Bodega', 'Colombia');
    });
  });

  describe('onPageIndexChange', () => {
    it('should update current page and fetch warehouses', () => {
      spyOn(component, 'getWarehouses');
      component.currentPage = 1;

      component.onPageIndexChange(2);

      expect(component.currentPage).toBe(2);
      expect(component.getWarehouses).toHaveBeenCalled();
    });
  });

  describe('setupSearch', () => {
    it('should setup search subscriptions', fakeAsync(() => {
      spyOn(component, 'getWarehouses');
      component.setupSearch();

      component.nameSearchSubject.next('test');
      tick(700);

      expect(component.nameFilter).toBe('test');
      expect(component.currentPage).toBe(1);
      expect(component.getWarehouses).toHaveBeenCalled();
    }));

    it('should debounce search input', fakeAsync(() => {
      spyOn(component, 'getWarehouses');
      component.setupSearch();

      component.nameSearchSubject.next('a');
      component.nameSearchSubject.next('ab');
      component.nameSearchSubject.next('abc');
      tick(700);

      expect(component.getWarehouses).toHaveBeenCalledTimes(1);
    }));
  });

  describe('onNameSearchChange', () => {
    it('should emit search term to subject', () => {
      spyOn(component.nameSearchSubject, 'next');
      component.onNameSearchChange('test');
      expect(component.nameSearchSubject.next).toHaveBeenCalledWith('test');
    });
  });

  describe('onCountrySearchChange', () => {
    it('should emit search term to subject', () => {
      spyOn(component.countrySearchSubject, 'next');
      component.onCountrySearchChange('Colombia');
      expect(component.countrySearchSubject.next).toHaveBeenCalledWith('Colombia');
    });
  });

  describe('clearNameSearch', () => {
    it('should clear name filter and emit empty string', () => {
      component.nameFilter = 'test';
      spyOn(component.nameSearchSubject, 'next');
      component.clearNameSearch();
      expect(component.nameFilter).toBe('');
      expect(component.nameSearchSubject.next).toHaveBeenCalledWith('');
    });
  });

  describe('clearCountrySearch', () => {
    it('should clear country filter and emit empty string', () => {
      component.countryFilter = 'Colombia';
      spyOn(component.countrySearchSubject, 'next');
      component.clearCountrySearch();
      expect(component.countryFilter).toBe('');
      expect(component.countrySearchSubject.next).toHaveBeenCalledWith('');
    });
  });

  describe('getStatusColor', () => {
    it('should return green for active status', () => {
      expect(component.getStatusColor('active')).toBe('green');
      expect(component.getStatusColor('operativa')).toBe('green');
    });

    it('should return orange for maintenance status', () => {
      expect(component.getStatusColor('maintenance')).toBe('orange');
      expect(component.getStatusColor('mantenimiento')).toBe('orange');
    });

    it('should return default for inactive status', () => {
      expect(component.getStatusColor('inactive')).toBe('default');
      expect(component.getStatusColor('cerrada')).toBe('default');
    });

    it('should return default for unknown status', () => {
      expect(component.getStatusColor('unknown')).toBe('default');
    });
  });

  describe('getStatusText', () => {
    it('should return translated text for status', () => {
      component.getStatusText('active');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('warehouses.statusOperative');
    });
  });

  describe('Modal Management', () => {
    describe('showWarehouseModal', () => {
      it('should set modal visible to true', () => {
        component.isWarehouseModalVisible = false;
        component.showWarehouseModal();
        expect(component.isWarehouseModalVisible).toBe(true);
      });
    });

    describe('handleWarehouseModalCancel', () => {
      it('should close modal and reset form', () => {
        component.isWarehouseModalVisible = true;
        spyOn(component, 'resetWarehouseForm');
        component.handleWarehouseModalCancel();
        expect(component.isWarehouseModalVisible).toBe(false);
        expect(component.resetWarehouseForm).toHaveBeenCalled();
      });
    });
  });

  describe('Form Management', () => {
    describe('initForm', () => {
      it('should initialize form with required fields', () => {
        component.initForm();
        expect(component.validateForm).toBeDefined();
        expect(component.validateForm.get('name')).toBeTruthy();
        expect(component.validateForm.get('city')).toBeTruthy();
        expect(component.validateForm.get('country')).toBeTruthy();
        expect(component.validateForm.get('address')).toBeTruthy();
      });
    });

    describe('getFieldStatus', () => {
      it('should return error status for invalid dirty field', () => {
        component.initForm();
        const field = component.validateForm.get('name');
        field?.markAsDirty();
        expect(component.getFieldStatus('name')).toBe('error');
      });

      it('should return empty string for valid field', () => {
        component.initForm();
        component.validateForm.patchValue({ name: 'Test' });
        expect(component.getFieldStatus('name')).toBe('');
      });
    });

    describe('getFieldError', () => {
      it('should return error message for required field', () => {
        component.initForm();
        const field = component.validateForm.get('name');
        field?.markAsDirty();
        expect(component.getFieldError('name')).toBe('Este campo es obligatorio');
      });

      it('should return empty string for valid field', () => {
        component.initForm();
        component.validateForm.patchValue({ name: 'Test' });
        expect(component.getFieldError('name')).toBe('');
      });
    });

    describe('validateFormFields', () => {
      it('should return false for invalid form', () => {
        component.initForm();
        expect(component.validateFormFields()).toBe(false);
      });

      it('should return true for valid form', () => {
        component.initForm();
        component.validateForm.patchValue({
          name: 'Bodega Test',
          city: 'Bogotá',
          country: 'Colombia',
          address: 'Calle 123'
        });
        expect(component.validateFormFields()).toBe(true);
      });
    });

    describe('resetWarehouseForm', () => {
      it('should reset form to initial state', () => {
        component.initForm();
        component.validateForm.patchValue({
          name: 'Test',
          city: 'Test',
          country: 'Test',
          address: 'Test'
        });
        component.resetWarehouseForm();
        expect(component.validateForm.get('name')?.value).toBeNull();
      });
    });
  });

  describe('handleWarehouseModalOk', () => {
    beforeEach(() => {
      component.initForm();
    });

    it('should not submit if form is invalid', () => {
      component.isWarehouseModalLoading = false;
      component.handleWarehouseModalOk();
      expect(warehousesService.createWarehouse).not.toHaveBeenCalled();
      expect(component.isWarehouseModalLoading).toBe(false);
    });

    it('should create warehouse when form is valid', () => {
      const warehouseData = {
        name: 'Bodega Nueva',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 123'
      };

      component.validateForm.patchValue(warehouseData);
      warehousesService.createWarehouse.and.returnValue(of({
        id: 3,
        ...warehouseData,
        status: 'active',
        created_at: '2025-10-13T00:00:00',
        updated_at: '2025-10-13T00:00:00'
      }));
      spyOn(component, 'getWarehouses');
      spyOn(component, 'resetWarehouseForm');

      component.handleWarehouseModalOk();

      expect(warehousesService.createWarehouse).toHaveBeenCalledWith({
        name: 'Bodega Nueva',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 123'
      });
      expect(component.isWarehouseModalVisible).toBe(false);
      expect(component.isWarehouseModalLoading).toBe(false);
      expect(component.resetWarehouseForm).toHaveBeenCalled();
      expect(component.getWarehouses).toHaveBeenCalled();
      expect(notificationService.create).toHaveBeenCalledWith(
        'success',
        '¡Bodega creada exitosamente!',
        jasmine.any(String)
      );
    });

    it('should handle error when creating warehouse', () => {
      const warehouseData = {
        name: 'Bodega Nueva',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 123'
      };

      component.validateForm.patchValue(warehouseData);
      warehousesService.createWarehouse.and.returnValue(
        throwError(() => ({ message: 'Error creating warehouse' }))
      );

      component.handleWarehouseModalOk();

      expect(component.isWarehouseModalLoading).toBe(false);
      expect(component.errorMessage).toBe('Error creating warehouse');
      expect(notificationService.create).toHaveBeenCalledWith(
        'error',
        'Error al crear bodega',
        'Error creating warehouse'
      );
    });

    it('should trim form values before submitting', () => {
      component.validateForm.patchValue({
        name: '  Bodega Nueva  ',
        city: '  Bogotá  ',
        country: 'Colombia',
        address: '  Calle 123  '
      });
      warehousesService.createWarehouse.and.returnValue(of({
        id: 3,
        name: 'Bodega Nueva',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 123',
        status: 'active',
        created_at: '2025-10-13T00:00:00',
        updated_at: '2025-10-13T00:00:00'
      }));

      component.handleWarehouseModalOk();

      expect(warehousesService.createWarehouse).toHaveBeenCalledWith({
        name: 'Bodega Nueva',
        city: 'Bogotá',
        country: 'Colombia',
        address: 'Calle 123'
      });
    });
  });

  describe('navigateToProducts', () => {
    it('should navigate to warehouse products page', () => {
      component.navigateToProducts(1);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/warehouses', 1, 'products']);
    });
  });
});

