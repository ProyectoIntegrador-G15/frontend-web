import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SuppliersListComponent } from './suppliers-list.component';
import { SuppliersService, Supplier } from '../../shared/services/suppliers.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { of, throwError, Subscription, Subject } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NzUploadFile } from 'ng-zorro-antd/upload';

// Mock pipe for customTranslate
@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('SuppliersListComponent', () => {
  let component: SuppliersListComponent;
  let suppliersService: jasmine.SpyObj<SuppliersService>;
  let notificationService: jasmine.SpyObj<NzNotificationService>;
  let messageService: jasmine.SpyObj<NzMessageService>;
  let router: jasmine.SpyObj<Router>;
  let formBuilder: FormBuilder;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockSuppliers: Supplier[] = [
    {
      id: 1,
      name: 'Proveedor Uno',
      nit: '12345678-9',
      email: 'proveedor1@example.com',
      country: 'Colombia',
      city: 'Bogotá',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    },
    {
      id: 2,
      name: 'Proveedor Dos',
      nit: '87654321-1',
      email: 'proveedor2@example.com',
      country: 'México',
      city: 'Ciudad de México',
      status: 'active',
      created_at: '2025-10-13T00:00:00',
      updated_at: '2025-10-13T00:00:00'
    }
  ];

  const mockPaginatedResponse = {
    suppliers: mockSuppliers,
    total: 2,
    total_pages: 1,
    page: 1,
    page_size: 5
  };

  beforeEach(() => {
    const suppliersServiceSpy = jasmine.createSpyObj('SuppliersService', [
      'getSuppliersPaginated',
      'createSupplier',
      'bulkUploadSuppliers'
    ], {
      suppliers$: of(mockSuppliers)
    });

    // Configurar valores de retorno por defecto
    suppliersServiceSpy.getSuppliersPaginated.and.returnValue(of(mockPaginatedResponse));
    suppliersServiceSpy.createSupplier.and.returnValue(of(mockSuppliers[0]));
    suppliersServiceSpy.bulkUploadSuppliers.and.returnValue(of({
      success: true,
      message: 'Success',
      created_suppliers: 10,
      total_rows: 10,
      errors: []
    }));

    const notificationServiceSpy = jasmine.createSpyObj('NzNotificationService', ['create']);
    const messageServiceSpy = jasmine.createSpyObj('NzMessageService', ['success', 'error', 'info', 'loading', 'remove']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);

    translateServiceSpy.instant.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        NzModalModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzTableModule,
        NzButtonModule,
        NzIconModule,
        NzGridModule,
        BrowserAnimationsModule
      ],
      declarations: [SuppliersListComponent, MockCustomTranslatePipe],
      providers: [
        FormBuilder,
        { provide: SuppliersService, useValue: suppliersServiceSpy },
        { provide: NzNotificationService, useValue: notificationServiceSpy },
        { provide: NzMessageService, useValue: messageServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    });

    suppliersService = TestBed.inject(SuppliersService) as jasmine.SpyObj<SuppliersService>;
    notificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;
    messageService = TestBed.inject(NzMessageService) as jasmine.SpyObj<NzMessageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    formBuilder = TestBed.inject(FormBuilder);
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    component = TestBed.createComponent(SuppliersListComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call initialization methods', () => {
      spyOn(component, 'getSuppliers');
      spyOn(component, 'setupSearch');
      spyOn(component, 'initForm');

      component.ngOnInit();

      expect(component.getSuppliers).toHaveBeenCalled();
      expect(component.setupSearch).toHaveBeenCalled();
      expect(component.initForm).toHaveBeenCalled();
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

  describe('getSuppliers', () => {
    it('should fetch suppliers and update component state', () => {
      suppliersService.getSuppliersPaginated.and.returnValue(of(mockPaginatedResponse));

      component.getSuppliers();

      expect(component.suppliers).toEqual(mockSuppliers);
      expect(component.totalSuppliers).toBe(2);
      expect(component.pageSize).toBe(5);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error when fetching suppliers', () => {
      suppliersService.getSuppliersPaginated.and.returnValue(throwError(() => new Error('Error')));

      component.getSuppliers();

      expect(component.errorMessage).toBe('Error al buscar proveedores.');
      expect(component.isLoading).toBe(false);
    });

    it('should call service with correct parameters', () => {
      component.currentPage = 2;
      component.searchTerm = 'Proveedor';
      component.countryFilter = 'Colombia';
      suppliersService.getSuppliersPaginated.and.returnValue(of(mockPaginatedResponse));

      component.getSuppliers();

      expect(suppliersService.getSuppliersPaginated).toHaveBeenCalledWith(2, 'Proveedor', 'Colombia');
    });

    it('should call service with undefined when filters are empty', () => {
      component.currentPage = 1;
      component.searchTerm = '';
      component.countryFilter = '';
      suppliersService.getSuppliersPaginated.and.returnValue(of(mockPaginatedResponse));

      component.getSuppliers();

      expect(suppliersService.getSuppliersPaginated).toHaveBeenCalledWith(1, undefined, undefined);
    });
  });

  describe('onPageIndexChange', () => {
    it('should update current page and fetch suppliers', () => {
      spyOn(component, 'getSuppliers');
      component.currentPage = 1;

      component.onPageIndexChange(2);

      expect(component.currentPage).toBe(2);
      expect(component.getSuppliers).toHaveBeenCalled();
    });
  });

  describe('setupSearch', () => {
    it('should setup search subscriptions', fakeAsync(() => {
      spyOn(component, 'getSuppliers');
      component.setupSearch();

      // Simular el flujo completo: actualizar el término y luego emitir al subject
      component.onSearchChange('test');
      tick(700);

      expect(component.searchTerm).toBe('test');
      expect(component.currentPage).toBe(1);
      expect(component.getSuppliers).toHaveBeenCalled();
    }));

    it('should debounce search input', fakeAsync(() => {
      spyOn(component, 'getSuppliers');
      component.setupSearch();

      component.onSearchChange('a');
      component.onSearchChange('ab');
      component.onSearchChange('abc');
      tick(700);

      expect(component.getSuppliers).toHaveBeenCalledTimes(1);
    }));

    it('should setup country search subscription', fakeAsync(() => {
      spyOn(component, 'getSuppliers');
      component.setupSearch();

      // Simular el flujo completo: actualizar el filtro y luego emitir al subject
      component.onCountrySearchChange('Colombia');
      tick(300);

      expect(component.countryFilter).toBe('Colombia');
      expect(component.currentPage).toBe(1);
      expect(component.getSuppliers).toHaveBeenCalled();
    }));
  });

  describe('onSearchChange', () => {
    it('should update search term and emit to subject', () => {
      spyOn(component['searchSubject'], 'next');
      component.onSearchChange('test');
      expect(component.searchTerm).toBe('test');
      expect(component['searchSubject'].next).toHaveBeenCalledWith('test');
    });
  });

  describe('onCountrySearchChange', () => {
    it('should update country filter and emit to subject', () => {
      spyOn(component['countrySearchSubject'], 'next');
      component.onCountrySearchChange('Colombia');
      expect(component.countryFilter).toBe('Colombia');
      expect(component['countrySearchSubject'].next).toHaveBeenCalledWith('Colombia');
    });

    it('should handle empty country filter', () => {
      spyOn(component['countrySearchSubject'], 'next');
      component.onCountrySearchChange('');
      expect(component.countryFilter).toBe('');
      expect(component['countrySearchSubject'].next).toHaveBeenCalledWith('');
    });
  });

  describe('clearSearch', () => {
    it('should clear search filter and emit empty string', () => {
      component.searchTerm = 'test';
      spyOn(component['searchSubject'], 'next');
      component.clearSearch();
      expect(component.searchTerm).toBe('');
      expect(component['searchSubject'].next).toHaveBeenCalledWith('');
    });
  });

  describe('clearCountrySearch', () => {
    it('should clear country filter and emit empty string', () => {
      component.countryFilter = 'Colombia';
      spyOn(component['countrySearchSubject'], 'next');
      component.clearCountrySearch();
      expect(component.countryFilter).toBe('');
      expect(component['countrySearchSubject'].next).toHaveBeenCalledWith('');
    });
  });

  describe('Modal Management', () => {
    describe('showSupplierModal', () => {
      it('should set modal visible to true', () => {
        component.isSupplierModalVisible = false;
        component.showSupplierModal();
        expect(component.isSupplierModalVisible).toBe(true);
      });
    });

    describe('handleSupplierModalCancel', () => {
      it('should close modal and reset form', () => {
        component.isSupplierModalVisible = true;
        spyOn(component, 'resetSupplierForm');
        component.handleSupplierModalCancel();
        expect(component.isSupplierModalVisible).toBe(false);
        expect(component.resetSupplierForm).toHaveBeenCalled();
      });
    });
  });

  describe('Form Management', () => {
    describe('initForm', () => {
      it('should initialize form with required fields', () => {
        component.initForm();
        expect(component.validateForm).toBeDefined();
        expect(component.validateForm.get('name')).toBeTruthy();
        expect(component.validateForm.get('nit')).toBeTruthy();
        expect(component.validateForm.get('nitVerificationDigit')).toBeTruthy();
        expect(component.validateForm.get('email')).toBeTruthy();
        expect(component.validateForm.get('country')).toBeTruthy();
        expect(component.validateForm.get('city')).toBeTruthy();
      });

      it('should set validators correctly', () => {
        component.initForm();
        const nameField = component.validateForm.get('name');
        const nitField = component.validateForm.get('nit');
        const nitVerificationDigitField = component.validateForm.get('nitVerificationDigit');
        const emailField = component.validateForm.get('email');

        expect(nameField?.hasError('required')).toBe(true);
        expect(nitField?.hasError('required')).toBe(true);
        expect(nitVerificationDigitField?.hasError('required')).toBe(true);
        expect(emailField?.hasError('required')).toBe(true);
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
        const field = component.validateForm.get('name');
        field?.setValue('Valid Name');
        field?.markAsDirty();
        expect(component.getFieldStatus('name')).toBe('');
      });
    });

    describe('getFieldError', () => {
      it('should return required error message', () => {
        component.initForm();
        const field = component.validateForm.get('name');
        field?.markAsDirty();
        expect(component.getFieldError('name')).toBe('Este campo es obligatorio');
      });

      it('should return email error message', () => {
        component.initForm();
        const field = component.validateForm.get('email');
        field?.setValue('invalid-email');
        field?.markAsDirty();
        expect(component.getFieldError('email')).toBe('El email no es válido');
      });

      it('should return pattern error for NIT', () => {
        component.initForm();
        const field = component.validateForm.get('nit');
        field?.setValue('abc');
        field?.markAsDirty();
        expect(component.getFieldError('nit')).toBe('El NIT solo debe contener números');
      });

      it('should return pattern error for NIT verification digit', () => {
        component.initForm();
        const field = component.validateForm.get('nitVerificationDigit');
        field?.setValue('12');
        field?.markAsDirty();
        expect(component.getFieldError('nitVerificationDigit')).toBe('El dígito de verificación debe ser un solo número');
      });
    });

    describe('validateFormFields', () => {
      it('should mark all fields as dirty and return false for invalid form', () => {
        component.initForm();
        const result = component.validateFormFields();
        expect(result).toBe(false);
        expect(component.validateForm.get('name')?.dirty).toBe(true);
        expect(component.validateForm.get('email')?.dirty).toBe(true);
      });

      it('should return true for valid form', () => {
        component.initForm();
        component.validateForm.patchValue({
          name: 'Test Supplier',
          nit: '12345678',
          nitVerificationDigit: '9',
          email: 'test@example.com',
          country: 'Colombia',
          city: 'Bogotá'
        });
        const result = component.validateFormFields();
        expect(result).toBe(true);
      });
    });

    describe('resetSupplierForm', () => {
      it('should reset form to initial state', () => {
        component.initForm();
        component.validateForm.patchValue({
          name: 'Test Supplier',
          nit: '12345678',
          nitVerificationDigit: '9',
          email: 'test@example.com',
          country: 'Colombia',
          city: 'Bogotá'
        });
        component.resetSupplierForm();
        expect(component.validateForm.get('name')?.value).toBeNull();
        expect(component.validateForm.get('nit')?.value).toBeNull();
      });
    });
  });

  describe('handleSupplierModalOk', () => {
    it('should not create supplier if form is invalid', () => {
      component.initForm();
      component.isSupplierModalLoading = false;
      component.handleSupplierModalOk();
      expect(suppliersService.createSupplier).not.toHaveBeenCalled();
      expect(component.isSupplierModalLoading).toBe(false);
    });

    it('should create supplier with concatenated NIT', () => {
      component.initForm();
      component.validateForm.patchValue({
        name: 'Test Supplier',
        nit: '12345678',
        nitVerificationDigit: '9',
        email: 'test@example.com',
        country: 'Colombia',
        city: 'Bogotá'
      });
      suppliersService.createSupplier.and.returnValue(of(mockSuppliers[0]));

      component.handleSupplierModalOk();

      expect(suppliersService.createSupplier).toHaveBeenCalledWith({
        name: 'Test Supplier',
        nit: '12345678-9',
        email: 'test@example.com',
        country: 'Colombia',
        city: 'Bogotá'
      });
    });

    it('should close modal and refresh list on success', () => {
      component.initForm();
      component.validateForm.patchValue({
        name: 'Test Supplier',
        nit: '12345678',
        nitVerificationDigit: '9',
        email: 'test@example.com',
        country: 'Colombia',
        city: 'Bogotá'
      });
      component.isSupplierModalVisible = true;
      suppliersService.createSupplier.and.returnValue(of(mockSuppliers[0]));
      spyOn(component, 'getSuppliers');
      spyOn(component, 'resetSupplierForm');

      component.handleSupplierModalOk();

      expect(component.isSupplierModalVisible).toBe(false);
      expect(component.isSupplierModalLoading).toBe(false);
      expect(component.currentPage).toBe(1);
      expect(component.getSuppliers).toHaveBeenCalled();
      expect(component.resetSupplierForm).toHaveBeenCalled();
      expect(notificationService.create).toHaveBeenCalledWith(
        'success',
        '¡Proveedor creado exitosamente!',
        jasmine.any(String)
      );
    });

    it('should handle error when creating supplier', () => {
      component.initForm();
      component.validateForm.patchValue({
        name: 'Test Supplier',
        nit: '12345678',
        nitVerificationDigit: '9',
        email: 'test@example.com',
        country: 'Colombia',
        city: 'Bogotá'
      });
      const error = new Error('Error creating supplier');
      suppliersService.createSupplier.and.returnValue(throwError(() => error));

      component.handleSupplierModalOk();

      expect(component.isSupplierModalLoading).toBe(false);
      expect(component.errorMessage).toBe('Error creating supplier');
      expect(notificationService.create).toHaveBeenCalledWith(
        'error',
        'Error al crear proveedor',
        'Error creating supplier'
      );
    });

    it('should trim all form values before sending', () => {
      component.initForm();
      // Los validadores de patrón (/^\d+$/ y /^\d$/) rechazan valores con espacios
      // Por lo tanto, usamos valores sin espacios en nit y nitVerificationDigit
      // pero con espacios en los campos de texto que sí los aceptan
      component.validateForm.patchValue({
        name: '  Test Supplier  ',
        nit: '12345678',  // Sin espacios para pasar el patrón /^\d+$/
        nitVerificationDigit: '9',  // Sin espacios para pasar el patrón /^\d$/
        email: 'test@example.com',  // Sin espacios para pasar Validators.email
        country: '  Colombia  ',
        city: '  Bogotá  '
      });
      
      // Actualizar la validez del formulario después del patchValue
      component.validateForm.updateValueAndValidity();
      
      // Verificar que el formulario es válido antes de continuar
      expect(component.validateForm.valid).toBe(true);
      
      suppliersService.createSupplier.and.returnValue(of(mockSuppliers[0]));

      component.handleSupplierModalOk();

      // Verificar que los valores con espacios (name, country, city) se trimean
      // y que nit y nitVerificationDigit se concatenan correctamente
      expect(suppliersService.createSupplier).toHaveBeenCalledWith({
        name: 'Test Supplier',  // Trim aplicado
        nit: '12345678-9',  // Concatenación correcta
        email: 'test@example.com',
        country: 'Colombia',  // Trim aplicado
        city: 'Bogotá'  // Trim aplicado
      });
    });
  });

  describe('Bulk Upload', () => {
    describe('loadBulkSuppliers', () => {
      it('should open bulk upload modal', () => {
        component.loadBulkSuppliers();
        expect(component.isBulkUploadModalVisible).toBe(true);
      });
    });

    describe('handleBulkUploadModalCancel', () => {
      it('should close modal and clear file list', () => {
        component.isBulkUploadModalVisible = true;
        component.isBulkUploadLoading = true;
        component.bulkUploadErrors = ['Error 1'];
        component.fileList = [{ name: 'test.csv' } as NzUploadFile];

        component.handleBulkUploadModalCancel();

        expect(component.isBulkUploadModalVisible).toBe(false);
        expect(component.isBulkUploadLoading).toBe(false);
        expect(component.bulkUploadErrors).toEqual([]);
        expect(component.fileList).toEqual([]);
      });
    });

    describe('downloadExcelTemplate', () => {
      it('should download Excel template', () => {
        spyOn(component as any, 'downloadStaticFile');
        component.downloadExcelTemplate();
        expect((component as any).downloadStaticFile).toHaveBeenCalledWith(
          'assets/templates/proveedores-template.xlsx',
          'proveedores-template.xlsx'
        );
      });
    });

    describe('downloadCsvTemplate', () => {
      it('should download CSV template', () => {
        spyOn(component as any, 'downloadStaticFile');
        component.downloadCsvTemplate();
        expect((component as any).downloadStaticFile).toHaveBeenCalledWith(
          'assets/templates/proveedores-template.csv',
          'proveedores-template.csv'
        );
      });
    });

    describe('downloadStaticFile', () => {
      it('should create download link and click it', () => {
        const linkSpy = jasmine.createSpyObj('link', ['click']);
        spyOn(document, 'createElement').and.returnValue(linkSpy as any);
        spyOn(document.body, 'appendChild');
        spyOn(document.body, 'removeChild');

        (component as any).downloadStaticFile('path/to/file.xlsx', 'file.xlsx');

        expect(linkSpy.href).toBe('path/to/file.xlsx');
        expect(linkSpy.download).toBe('file.xlsx');
        expect(linkSpy.target).toBe('_blank');
        expect(linkSpy.click).toHaveBeenCalled();
        expect(messageService.success).toHaveBeenCalled();
      });
    });

    describe('beforeUpload', () => {
      it('should reject if file list already has a file', () => {
        component.fileList = [{ name: 'existing.csv' } as NzUploadFile];
        const file = { name: 'new.csv' } as NzUploadFile;

        const result = component.beforeUpload(file);

        expect(result).toBe(false);
        expect(messageService.error).toHaveBeenCalled();
      });

      it('should accept valid CSV file', () => {
        component.fileList = [];
        const file = {
          name: 'test.csv',
          type: 'text/csv',
          size: 1024
        } as NzUploadFile;

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

      it('should reject invalid file type', () => {
        component.fileList = [];
        const file = {
          name: 'test.pdf',
          type: 'application/pdf',
          size: 1024
        } as NzUploadFile;

        const result = component.beforeUpload(file);

        expect(result).toBe(false);
        expect(messageService.error).toHaveBeenCalled();
      });

      it('should reject file larger than 10MB', () => {
        component.fileList = [];
        const file = {
          name: 'test.csv',
          type: 'text/csv',
          size: 11 * 1024 * 1024 // 11MB
        } as NzUploadFile;

        const result = component.beforeUpload(file);

        expect(result).toBe(false);
        expect(messageService.error).toHaveBeenCalled();
      });

      it('should accept file by extension even if type is missing', () => {
        component.fileList = [];
        const file = {
          name: 'test.csv',
          type: '',
          size: 1024
        } as NzUploadFile;

        const result = component.beforeUpload(file);

        expect(result).toBe(true);
      });
    });

    describe('customRequest', () => {
      it('should call onSuccess after timeout', fakeAsync(() => {
        const item = {
          onSuccess: jasmine.createSpy('onSuccess'),
          file: { name: 'test.csv' } as NzUploadFile
        };

        component.customRequest(item);
        expect(item.onSuccess).not.toHaveBeenCalled();

        tick(200);
        expect(item.onSuccess).toHaveBeenCalledWith({}, item.file);
      }));
    });

    describe('handleFileChange', () => {
      it('should show success message when file is done', () => {
        const file = { name: 'test.csv', status: 'done' } as NzUploadFile;
        const fileList = [file];

        component.handleFileChange({ file, fileList } as any);

        expect(messageService.success).toHaveBeenCalled();
        expect(component.fileList).toEqual(fileList);
      });

      it('should show error message when file has error', () => {
        const file = { name: 'test.csv', status: 'error' } as NzUploadFile;
        const fileList = [file];

        component.handleFileChange({ file, fileList } as any);

        expect(messageService.error).toHaveBeenCalled();
        expect(component.fileList).toEqual(fileList);
      });
    });

    describe('onFileDownload', () => {
      it('should download file if originFileObj exists', () => {
        const file = new File(['content'], 'test.csv');
        const uploadFile = { name: 'test.csv', originFileObj: file } as NzUploadFile;
        spyOn(component as any, 'downloadFile');

        component.onFileDownload(uploadFile);

        expect((component as any).downloadFile).toHaveBeenCalledWith(file, 'test.csv');
      });

      it('should show error if originFileObj does not exist', () => {
        const uploadFile = { name: 'test.csv' } as NzUploadFile;

        component.onFileDownload(uploadFile);

        expect(messageService.error).toHaveBeenCalledWith('No se puede descargar el archivo');
      });
    });

    describe('downloadFile', () => {
      it('should create object URL and download file', () => {
        const file = new File(['content'], 'test.csv');
        const linkSpy = jasmine.createSpyObj('link', ['click']);
        spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
        spyOn(window.URL, 'revokeObjectURL');
        spyOn(document, 'createElement').and.returnValue(linkSpy as any);
        spyOn(document.body, 'appendChild');
        spyOn(document.body, 'removeChild');

        (component as any).downloadFile(file, 'test.csv');

        expect(window.URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(linkSpy.href).toBe('blob:url');
        expect(linkSpy.download).toBe('test.csv');
        expect(linkSpy.click).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
        expect(messageService.success).toHaveBeenCalled();
      });
    });

    describe('loadFile', () => {
      it('should not proceed if already loading', () => {
        component.isBulkUploadLoading = true;
        spyOn(component as any, 'uploadFileToBackend');

        component.loadFile();

        expect((component as any).uploadFileToBackend).not.toHaveBeenCalled();
      });

      it('should show error if no file selected', () => {
        component.isBulkUploadLoading = false;
        component.fileList = [];

        component.loadFile();

        expect(messageService.error).toHaveBeenCalledWith('Por favor selecciona un archivo antes de cargar');
      });

      it('should show error if file has no originFileObj', () => {
        component.isBulkUploadLoading = false;
        component.fileList = [{ name: 'test.csv' } as NzUploadFile];

        component.loadFile();

        expect(messageService.error).toHaveBeenCalledWith('No se puede procesar el archivo');
      });

      it('should upload file if valid', () => {
        component.isBulkUploadLoading = false;
        const file = new File(['content'], 'test.csv');
        component.fileList = [{ name: 'test.csv', originFileObj: file } as NzUploadFile];
        spyOn(component as any, 'uploadFileToBackend');

        component.loadFile();

        expect((component as any).uploadFileToBackend).toHaveBeenCalledWith(file);
      });
    });

    describe('uploadFileToBackend', () => {
      it('should upload file successfully', fakeAsync(() => {
        const file = new File(['content'], 'test.csv');
        const response = {
          success: true,
          message: 'Success',
          created_suppliers: 10,
          total_rows: 10,
          errors: []
        };
        // Usar un Subject para controlar cuando se resuelve el observable de forma asíncrona
        const responseSubject = new Subject<any>();
        suppliersService.bulkUploadSuppliers.and.returnValue(responseSubject.asObservable());
        spyOn(component, 'getSuppliers');
        // Usar callThrough para que el método real se ejecute y cierre el modal
        spyOn(component, 'handleBulkUploadModalCancel').and.callThrough();
        component.isBulkUploadModalVisible = true; // Asegurar que el modal esté abierto
        component.isBulkUploadLoading = false; // Estado inicial

        (component as any).uploadFileToBackend(file);

        // Verificar estado inmediatamente después de llamar (antes de resolver el observable)
        // El estado debería ser true porque se establece al inicio de uploadFileToBackend
        expect(component.isBulkUploadLoading).toBe(true);
        expect(messageService.loading).toHaveBeenCalled();

        // Resolver el observable de forma asíncrona usando setTimeout
        setTimeout(() => {
          responseSubject.next(response);
          responseSubject.complete();
        }, 0);
        tick(); // Avanzar el tiempo para procesar el setTimeout y la suscripción

        expect(messageService.remove).toHaveBeenCalled();
        expect(component.isBulkUploadLoading).toBe(false);
        expect(messageService.success).toHaveBeenCalledWith('Success');
        expect(messageService.info).toHaveBeenCalled();
        expect(component.getSuppliers).toHaveBeenCalled();
        expect(component.handleBulkUploadModalCancel).toHaveBeenCalled();
        // Después de una carga exitosa, el modal debería estar cerrado
        expect(component.isBulkUploadModalVisible).toBe(false);
      }));

      it('should handle upload with errors', fakeAsync(() => {
        const file = new File(['content'], 'test.csv');
        const response = {
          success: false,
          message: 'Some errors',
          created_suppliers: 5,
          total_rows: 10,
          errors: ['Error 1', 'Error 2']
        };
        suppliersService.bulkUploadSuppliers.and.returnValue(of(response));

        (component as any).uploadFileToBackend(file);

        tick();

        expect(component.bulkUploadErrors).toEqual(['Error 1', 'Error 2']);
        expect(messageService.error).toHaveBeenCalledWith('Some errors');
      }));

      it('should handle upload error', fakeAsync(() => {
        const file = new File(['content'], 'test.csv');
        const error = { message: 'Network error' };
        suppliersService.bulkUploadSuppliers.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        (component as any).uploadFileToBackend(file);

        tick();

        expect(messageService.remove).toHaveBeenCalled();
        expect(component.isBulkUploadLoading).toBe(false);
        expect(messageService.error).toHaveBeenCalledWith('Network error');
        expect(console.error).toHaveBeenCalled();
      }));

      it('should handle upload error without message', fakeAsync(() => {
        const file = new File(['content'], 'test.csv');
        const error = {};
        suppliersService.bulkUploadSuppliers.and.returnValue(throwError(() => error));

        (component as any).uploadFileToBackend(file);

        tick();

        expect(messageService.error).toHaveBeenCalledWith(
          'Error al conectar con el servidor. Verifica que el backend esté ejecutándose.'
        );
      }));
    });
  });

  describe('getFieldError', () => {
    it('should return maxlength error message', () => {
      component.initForm();
      const field = component.validateForm.get('name');
      field?.setValue('a'.repeat(150));
      field?.markAsDirty();
      const error = component.getFieldError('name');
      expect(error).toContain('no puede tener más de');
    });
  });

  describe('getFieldStatus', () => {
    it('should return empty string for non-dirty field', () => {
      component.initForm();
      const field = component.validateForm.get('name');
      field?.setValue(null);
      expect(component.getFieldStatus('name')).toBe('');
    });
  });
});

