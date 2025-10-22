import {Component, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

import {ProductsService} from '../../shared/services/products.service';
import {WarehousesService, Warehouse} from '../../shared/services/warehouses.service';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {Product} from '../../shared/interfaces/product.type';

@Component({
  selector: 'app-products',
  templateUrl: 'products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: Product[] = [];

  isLoading = true;
  errorMessage = '';
  isProductModalVisible = false;
  isProductModalLoading = false;

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
    const searchSubscription = this.productsService.getProducts()
      .subscribe({
        next: (products) => {
          this.products = products;
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
      warehouse: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      location: [null, [Validators.required]]
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
      warehouse: formData.warehouse,
      quantity: formData.quantity,
      location: formData.location
    };

    this.productsService.createProduct(productData).subscribe({
      next: (response) => {
        console.log('=== PRODUCTO CREADO EXITOSAMENTE ===');
        console.log('Respuesta del servidor:', response);

        // Cerrar modal y limpiar formulario
        this.isProductModalVisible = false;
        this.isProductModalLoading = false;
        this.resetProductForm();

        // Mostrar notificación de éxito
        this.notification.create(
          'success',
          '¡Producto creado exitosamente!',
          `El producto "${productData.name}" ha sido agregado correctamente al inventario.`
        );
      },
      error: (error) => {
        console.error('=== ERROR AL CREAR PRODUCTO ===');
        console.error('Error:', error);

        this.isProductModalLoading = false;
        this.errorMessage = 'Error al crear el producto. Por favor, inténtalo de nuevo.';

        // Mostrar notificación de error
        this.notification.create(
          'error',
          'Error al crear producto',
          'No se pudo crear el producto. Por favor, verifica los datos e inténtalo de nuevo.'
        );
      }
    });
  }

  resetProductForm(): void {
    this.validateForm.reset();
  }

}
