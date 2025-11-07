import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {WarehousesService, Warehouse} from '../../shared/services/warehouses.service';
import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';

@Component({
  selector: 'app-warehouses-list',
  templateUrl: 'warehouses-list.component.html',
  styleUrls: ['warehouses-list.component.scss']
})
export class WarehousesListComponent implements OnInit, OnDestroy {
  warehouses: Warehouse[] = [];

  isLoading = true;
  errorMessage = '';

  // Modal de crear bodega
  isWarehouseModalVisible = false;
  isWarehouseModalLoading = false;
  validateForm: FormGroup;
  inputClass = 'w-full rounded-[6px] text-[16px] dark:bg-white/10 px-[16px] py-[12px] min-h-[50px] outline-none';

  // Paginación
  currentPage = 1;
  pageSize = 0;
  totalWarehouses = 0;

  // Filtros
  nameFilter = '';
  countryFilter = '';
  nameSearchSubject = new Subject<string>();
  countrySearchSubject = new Subject<string>();

  // Lista de países para el filtro (hardcodeados)
  countries: string[] = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela'];

  subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private warehousesService: WarehousesService,
    private translateService: TranslateService,
    private fb: FormBuilder,
    private notification: NzNotificationService
  ) {
  }

  ngOnInit(): void {
    this.getWarehouses();
    this.setupSearch();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getWarehouses(): void {
    this.isLoading = true;
    const searchSubscription = this.warehousesService.getWarehousesPaginated(
      this.currentPage,
      this.nameFilter || undefined,
      this.countryFilter || undefined
    ).subscribe({
      next: (response) => {
        this.warehouses = response.warehouses;
        this.pageSize = response.page_size;
        this.totalWarehouses = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.errorMessage = 'Error al buscar bodegas.';
        this.isLoading = false;
      }
    });

    this.subscription.add(searchSubscription);
  }

  navigateToProducts(warehouseId: number): void {
    this.router.navigate(['/dashboard/warehouses', warehouseId, 'products']);
  }

  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.getWarehouses();
  }

  // Métodos de búsqueda
  setupSearch(): void {
    const nameSearchSubscription = this.nameSearchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.nameFilter = searchTerm;
        this.currentPage = 1;
        this.getWarehouses();
      });

    const countrySearchSubscription = this.countrySearchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.countryFilter = searchTerm;
        this.currentPage = 1;
        this.getWarehouses();
      });

    this.subscription.add(nameSearchSubscription);
    this.subscription.add(countrySearchSubscription);
  }

  onNameSearchChange(searchTerm: string): void {
    this.nameSearchSubject.next(searchTerm);
  }

  onCountrySearchChange(searchTerm: string): void {
    this.countrySearchSubject.next(searchTerm);
  }

  clearNameSearch(): void {
    this.nameFilter = '';
    this.nameSearchSubject.next('');
  }

  clearCountrySearch(): void {
    this.countryFilter = '';
    this.countrySearchSubject.next('');
  }

  // Método para obtener el color del tag según el estado
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'operativa':
        return 'green';
      case 'maintenance':
      case 'mantenimiento':
        return 'orange';
      case 'inactive':
      case 'cerrada':
        return 'default';
      default:
        return 'default';
    }
  }

  // Método para obtener el texto del estado
  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'operativa':
        return this.translateService.instant('warehouses.statusOperative');
      case 'maintenance':
      case 'mantenimiento':
        return this.translateService.instant('warehouses.statusMaintenance');
      case 'inactive':
      case 'cerrada':
        return this.translateService.instant('warehouses.statusClosed');
      default:
        return status;
    }
  }

  // Métodos del modal de crear bodega
  showWarehouseModal(): void {
    this.isWarehouseModalVisible = true;
  }

  handleWarehouseModalCancel(): void {
    this.isWarehouseModalVisible = false;
    this.resetWarehouseForm();
  }

  initForm(): void {
    this.validateForm = this.fb.group({
      name: [null, [Validators.required]],
      city: [null, [Validators.required]],
      country: [null, [Validators.required]],
      address: [null, [Validators.required]]
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
      if (field.errors.required) {
        return 'Este campo es obligatorio';
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

  handleWarehouseModalOk(): void {
    // Validar el formulario antes de proceder
    if (!this.validateFormFields()) {
      this.isWarehouseModalLoading = false;
      return;
    }

    this.isWarehouseModalLoading = true;

    const formData = this.validateForm.value;
    const warehouseData = {
      name: formData.name.trim(),
      city: formData.city.trim(),
      country: formData.country,
      address: formData.address.trim()
    };

    this.warehousesService.createWarehouse(warehouseData).subscribe({
      next: (response) => {
        // Cerrar modal y limpiar formulario
        this.isWarehouseModalVisible = false;
        this.isWarehouseModalLoading = false;
        this.resetWarehouseForm();

        this.currentPage = 1;
        this.getWarehouses();

        this.notification.create(
          'success',
          '¡Bodega creada exitosamente!',
          `La bodega "${warehouseData.name}" ha sido agregada correctamente al sistema.`
        );
      },
      error: (error) => {
        this.isWarehouseModalLoading = false;
        this.errorMessage = error.message;
        this.notification.create(
          'error',
          'Error al crear bodega',
          error.message
        );
      }
    });
  }

  resetWarehouseForm(): void {
    this.validateForm.reset();
  }
}

