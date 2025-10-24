import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {ProductsService} from '../../shared/services/products.service';
import {WarehousesService, Warehouse} from '../../shared/services/warehouses.service';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {Product} from '../../shared/interfaces/product.type';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';

@Component({
  selector: 'app-products',
  templateUrl: 'products.component.html',
  styles: [`
    .pagination-centered ::ng-deep .ant-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 24px;
    }

    .pagination-centered ::ng-deep .ant-pagination .ant-pagination-options {
      display: none;
    }
  `]
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];

  isLoading = true;
  errorMessage = '';
  isProductModalVisible = false;
  isProductModalLoading = false;

  // Paginación
  currentPage = 1;
  pageSize = 0;
  totalProducts = 0;
  statusFilter = true;
  hasNextPage = true;

  // Búsqueda
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Bodegas
  warehouses: Warehouse[] = [];
  isLoadingWarehouses = false;

  // Formulario reactivo para validaciones
  validateForm: FormGroup;
  inputClass = 'w-full rounded-[6px] text-[16px] dark:bg-white/10 px-[16px] py-[12px] min-h-[50px] outline-none';

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private productsService: ProductsService,
    private warehousesService: WarehousesService,
    private modalService: NzModalService,
    private fb: FormBuilder,
    private notification: NzNotificationService
  ) {
  }

  ngOnInit(): void {
    this.subscribeToProducts();
    this.getProducts();
    this.getWarehouses();
    this.initForm();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private subscribeToProducts(): void {
    const productsSubscription = this.productsService.products$.subscribe(products => {
      this.products = products;
    });

    this.subscription.add(productsSubscription);
  }

  getProducts(): void {
    this.isLoading = true;
    const searchSubscription = this.productsService.getProductsPaginated(this.currentPage, this.statusFilter, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.products = response.products;
          this.pageSize = response.page_size;
          this.totalProducts = response.total;
          this.hasNextPage = response.page < response.total_pages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.errorMessage = 'Error al buscar productos.';
          this.isLoading = false;
        }
      });

    this.subscription.add(searchSubscription);
  }

  getWarehouses(): void {
    this.isLoadingWarehouses = true;
    this.warehousesService.getWarehouses().subscribe({
      next: (warehouses) => {
        this.warehouses = warehouses;
        this.isLoadingWarehouses = false;
      },
      error: (error) => {
        console.error('Error al cargar bodegas:', error);
        this.isLoadingWarehouses = false;
      }
    });
  }

  navigateToInventory(productId: string): void {
    this.router.navigate(['/dashboard/products', productId, 'warehouses']);
  }

  showProductModal(): void {
    this.isProductModalVisible = true;
  }

  handleProductModalCancel(): void {
    this.isProductModalVisible = false;
  }

  initForm(): void {
    this.validateForm = this.fb.group({
      name: [null, [Validators.required]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      supplier: [null, [Validators.required]],
      requiresColdChain: [null, [Validators.required]],
      tempMin: [null, [Validators.required]],
      tempMax: [null, [Validators.required]],
      description: [null, [Validators.required, Validators.minLength(10)]],
      storageInstructions: [null, [Validators.required, Validators.minLength(10)]],
    }, {validators: this.temperatureRangeValidator});

    // Suscribirse a cambios en los campos de temperatura para validar en tiempo real
    this.validateForm.get('tempMin')?.valueChanges.subscribe(() => {
      this.validateTemperatureRange();
    });
    this.validateForm.get('tempMax')?.valueChanges.subscribe(() => {
      this.validateTemperatureRange();
    });
  }

  // Metodo para validar el rango de temperatura en tiempo real
  validateTemperatureRange(): void {
    // Verificar que el formulario esté inicializado
    if (!this.validateForm) {
      return;
    }

    const tempMin = this.validateForm.get('tempMin')?.value;
    const tempMax = this.validateForm.get('tempMax')?.value;

    if (tempMin && tempMax && tempMin >= tempMax) {
      // Marcar ambos campos como inválidos
      this.validateForm.get('tempMin')?.setErrors({temperatureRange: true});
      this.validateForm.get('tempMax')?.setErrors({temperatureRange: true});
    } else {
      // Limpiar errores si la validación pasa
      const tempMinField = this.validateForm.get('tempMin');
      const tempMaxField = this.validateForm.get('tempMax');

      if (tempMinField?.errors?.temperatureRange) {
        const errors = {...tempMinField.errors};
        delete errors.temperatureRange;
        tempMinField.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      if (tempMaxField?.errors?.temperatureRange) {
        const errors = {...tempMaxField.errors};
        delete errors.temperatureRange;
        tempMaxField.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
  }

  // Validador personalizado para el rango de temperatura
  temperatureRangeValidator = (control: FormGroup): { [s: string]: boolean } => {
    const tempMin = control.get('tempMin')?.value;
    const tempMax = control.get('tempMax')?.value;

    if (tempMin && tempMax && tempMin >= tempMax) {
      return {temperatureRange: true};
    }
    return {};
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
      if (field.errors.min) {
        return 'El precio debe ser mayor a 0';
      }
      if (field.errors.minlength) {
        return 'Este campo debe tener al menos 10 caracteres';
      }
      if (field.errors.temperatureRange) {
        return 'La temperatura mínima debe ser menor a la máxima';
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

  handleProductModalOk(): void {
    // Validar el formulario antes de proceder
    if (!this.validateFormFields()) {
      this.isProductModalLoading = false;
      return;
    }

    this.isProductModalLoading = true;

    const formData = this.validateForm.value;
    const productData = {
      name: formData.name,
      price: formData.price,
      supplier: formData.supplier,
      requiresColdChain: formData.requiresColdChain === 'si',
      temperatureRange: `${formData.tempMin}°F - ${formData.tempMax}°F`,
      description: formData.description,
      storageInstructions: formData.storageInstructions,
    };

    this.productsService.createProduct(productData).subscribe({
      next: (response) => {
        // Cerrar modal y limpiar formulario
        this.isProductModalVisible = false;
        this.isProductModalLoading = false;
        this.resetProductForm();

        this.currentPage = 1;
        this.getProducts();

        this.notification.create(
          'success',
          '¡Producto creado exitosamente!',
          `El producto "${productData.name}" ha sido agregado correctamente al inventario.`
        );
      },
      error: (error) => {
        this.isProductModalLoading = false;
        this.errorMessage = error.message;
        this.notification.create(
          'error',
          'Error al crear producto',
          error.message
        );
      }
    });
  }

  resetProductForm(): void {
    this.validateForm.reset();
  }

  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.getProducts();
  }


  onStatusFilterChange(status: boolean): void {
    this.statusFilter = status;
    this.currentPage = 1; // Reset to first page when changing filter
    this.getProducts();
  }

  // Métodos de búsqueda
  setupSearch(): void {
    const searchSubscription = this.searchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged() // Solo emitir si el valor cambió
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.currentPage = 1; // Reset to first page when searching
        this.getProducts();
      });

    this.subscription.add(searchSubscription);
  }

  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

}
