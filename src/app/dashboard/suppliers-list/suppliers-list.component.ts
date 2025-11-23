import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {SuppliersService, Supplier} from '../../shared/services/suppliers.service';
import {Subscription} from 'rxjs';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzUploadChangeParam, NzUploadFile} from 'ng-zorro-antd/upload';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';

@Component({
  selector: 'app-suppliers-list',
  templateUrl: 'suppliers-list.component.html',
  styleUrls: ['suppliers-list.component.scss']
})
export class SuppliersListComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];

  isLoading = true;
  errorMessage = '';
  isSupplierModalVisible = false;
  isSupplierModalLoading = false;

  // Modal de carga masiva
  isBulkUploadModalVisible = false;
  fileList: NzUploadFile[] = [];
  isBulkUploadLoading = false;
  bulkUploadErrors: string[] = [];

  // Paginación
  currentPage = 1;
  pageSize = 0;
  totalSuppliers = 0;
  hasNextPage = true;

  // Búsqueda y filtros
  searchTerm = '';
  countryFilter = '';
  private searchSubject = new Subject<string>();
  private countrySearchSubject = new Subject<string>();

  // Lista de países para el filtro (hardcodeados)
  countries: string[] = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela'];

  // Formulario reactivo para validaciones
  validateForm: FormGroup;
  inputClass = 'w-full rounded-[6px] text-[16px] dark:bg-white/10 px-[16px] py-[12px] min-h-[50px] outline-none';

  private subscription: Subscription = new Subscription();

  constructor(
    private suppliersService: SuppliersService,
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private msg: NzMessageService
  ) {
  }

  ngOnInit(): void {
    this.getSuppliers();
    this.initForm();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getSuppliers(): void {
    this.isLoading = true;
    const searchSubscription = this.suppliersService.getSuppliersPaginated(
      this.currentPage,
      this.searchTerm || undefined,
      this.countryFilter || undefined
    ).subscribe({
      next: (response) => {
        this.suppliers = response.suppliers;
        this.pageSize = response.page_size;
        this.totalSuppliers = response.total;
        this.hasNextPage = response.page < response.total_pages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.errorMessage = 'Error al buscar proveedores.';
        this.isLoading = false;
      }
    });

    this.subscription.add(searchSubscription);
  }

  showSupplierModal(): void {
    this.isSupplierModalVisible = true;
  }

  handleSupplierModalCancel(): void {
    this.isSupplierModalVisible = false;
    this.resetSupplierForm();
  }

  initForm(): void {
    this.validateForm = this.fb.group({
      name: [null, [Validators.required, Validators.maxLength(100)]],
      nit: [null, [Validators.required, Validators.pattern(/^\d+$/), Validators.maxLength(15)]],
      nitVerificationDigit: [null, [Validators.required, Validators.pattern(/^\d$/), Validators.maxLength(1)]],
      email: [null, [Validators.required, Validators.email]],
      country: [null, [Validators.required, Validators.maxLength(100)]],
      city: [null, [Validators.required, Validators.maxLength(100)]],
    });
  }

  // Método para obtener el estado de validación de un campo
  getFieldStatus(fieldName: string): string {
    const field = this.validateForm.get(fieldName);
    if (field && field.dirty && field.invalid) {
      return 'error';
    }
    return '';
  }

  // Método para obtener el mensaje de error de un campo
  getFieldError(fieldName: string): string {
    const field = this.validateForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Este campo es obligatorio';
      }
      if (field.errors['email']) {
        return 'El email no es válido';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'nit') {
          return 'El NIT solo debe contener números';
        }
        if (fieldName === 'nitVerificationDigit') {
          return 'El dígito de verificación debe ser un solo número';
        }
      }
      if (field.errors['maxlength']) {
        return `Este campo no puede tener más de ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  // Método para validar todo el formulario
  validateFormFields(): boolean {
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
    }
    return this.validateForm.valid;
  }

  handleSupplierModalOk(): void {
    // Validar el formulario antes de proceder
    if (!this.validateFormFields()) {
      this.isSupplierModalLoading = false;
      return;
    }

    this.isSupplierModalLoading = true;

    const formData = this.validateForm.value;
    // Concatenar NIT y dígito de verificación
    const fullNit = `${formData.nit.trim()}-${formData.nitVerificationDigit.trim()}`;
    
    const supplierData = {
      name: formData.name.trim(),
      nit: fullNit,
      email: formData.email.trim(),
      country: formData.country.trim(),
      city: formData.city.trim(),
    };

    this.suppliersService.createSupplier(supplierData).subscribe({
      next: (response) => {
        // Cerrar modal y limpiar formulario
        this.isSupplierModalVisible = false;
        this.isSupplierModalLoading = false;
        this.resetSupplierForm();

        this.currentPage = 1;
        this.getSuppliers();

        this.notification.create(
          'success',
          '¡Proveedor creado exitosamente!',
          `El proveedor "${supplierData.name}" ha sido agregado correctamente.`
        );
      },
      error: (error) => {
        this.isSupplierModalLoading = false;
        this.errorMessage = error.message;
        this.notification.create(
          'error',
          'Error al crear proveedor',
          error.message
        );
      }
    });
  }

  resetSupplierForm(): void {
    this.validateForm.reset();
  }

  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.getSuppliers();
  }

  // Métodos de búsqueda
  setupSearch(): void {
    const searchSubscription = this.searchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.getSuppliers();
      });

    const countrySearchSubscription = this.countrySearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.getSuppliers();
      });

    this.subscription.add(searchSubscription);
    this.subscription.add(countrySearchSubscription);
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.searchSubject.next(searchTerm);
  }

  onCountrySearchChange(country: string): void {
    this.countryFilter = country || '';
    this.countrySearchSubject.next(country || '');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  clearCountrySearch(): void {
    this.countryFilter = '';
    this.countrySearchSubject.next('');
  }

  // Método para carga masiva de proveedores
  loadBulkSuppliers(): void {
    this.isBulkUploadModalVisible = true;
  }

  handleBulkUploadModalCancel(): void {
    this.isBulkUploadModalVisible = false;
    this.isBulkUploadLoading = false;
    this.bulkUploadErrors = [];
    this.clearFileList();
  }

  private clearFileList(): void {
    this.fileList = [];
  }

  downloadExcelTemplate(): void {
    this.downloadStaticFile('assets/templates/proveedores-template.xlsx', 'proveedores-template.xlsx');
  }

  downloadCsvTemplate(): void {
    this.downloadStaticFile('assets/templates/proveedores-template.csv', 'proveedores-template.csv');
  }

  private downloadStaticFile(filePath: string, filename: string): void {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.msg.success(`Plantilla ${filename} descargada exitosamente`);
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    if (this.fileList.length > 0) {
      this.msg.error('Solo se permite cargar un archivo a la vez. Elimina el archivo actual antes de cargar uno nuevo.');
      return false;
    }

    const isValidType = file.type === 'text/csv' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name?.endsWith('.csv') ||
      file.name?.endsWith('.xlsx');

    if (!isValidType) {
      this.msg.error('Solo se permiten archivos CSV (.csv) o Excel (.xlsx)');
      return false;
    }

    const isLt10M = file.size! / 1024 / 1024 < 10;
    if (!isLt10M) {
      this.msg.error('El archivo debe ser menor a 10MB');
      return false;
    }

    return true;
  }

  customRequest = (item: any): void => {
    setTimeout(() => {
      item.onSuccess({}, item.file);
    }, 200);
  }

  handleFileChange({file, fileList}: NzUploadChangeParam): void {
    const status = file.status;
    if (status === 'done') {
      this.msg.success(`${file.name} archivo subido exitosamente.`);
    } else if (status === 'error') {
      this.msg.error(`${file.name} falló la subida del archivo.`);
    }
    this.fileList = [...fileList];
  }

  onFileDownload = (file: NzUploadFile): void => {
    if (file.originFileObj) {
      this.downloadFile(file.originFileObj, file.name);
    } else {
      this.msg.error('No se puede descargar el archivo');
    }
  };

  private downloadFile(file: File, filename: string): void {
    const url = window.URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.msg.success(`Archivo ${filename} descargado exitosamente`);
  }

  loadFile(): void {
    if (this.isBulkUploadLoading) {
      return; // Prevenir múltiples clics
    }

    if (this.fileList.length === 0) {
      this.msg.error('Por favor selecciona un archivo antes de cargar');
      return;
    }

    const file = this.fileList[0];
    if (!file.originFileObj) {
      this.msg.error('No se puede procesar el archivo');
      return;
    }

    this.uploadFileToBackend(file.originFileObj);
  }

  private uploadFileToBackend(file: File): void {
    this.isBulkUploadLoading = true;
    this.bulkUploadErrors = [];
    this.msg.loading('Cargando archivo...', {nzDuration: 0});

    const uploadSubscription = this.suppliersService.bulkUploadSuppliers(file)
      .subscribe({
        next: (data) => {
          this.msg.remove();
          this.isBulkUploadLoading = false;

          if (data.success) {
            this.msg.success(data.message);
            this.msg.info(`Proveedores creados: ${data.created_suppliers} de ${data.total_rows}`);

            // Cerrar modal y limpiar archivos
            this.handleBulkUploadModalCancel();

            // Recargar la lista de proveedores
            this.currentPage = 1;
            this.getSuppliers();
          } else {
            // Mostrar errores en el modal
            this.bulkUploadErrors = data.errors || [];
            this.msg.error(data.message);
          }
        },
        error: (error) => {
          this.msg.remove();
          this.isBulkUploadLoading = false;
          console.error('Error al cargar archivo:', error);

          // Mostrar solo el message del servicio
          const errorMessage = error.message || 'Error al conectar con el servidor. Verifica que el backend esté ejecutándose.';
          this.msg.error(errorMessage);
        }
      });

    this.subscription.add(uploadSubscription);
  }
}

