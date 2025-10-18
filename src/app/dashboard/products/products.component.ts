import {Component, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

import {ProductsService} from '../../shared/services/products.service';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {NzModalService} from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-products',
  templateUrl: 'products.component.html',
})
export class ProductsComponent implements OnInit, OnDestroy {
  listOfData: any[] = [
    {
      id: '1',
      name: 'Bodega central',
      location: 'Colombia, Bogotá',
      capacity: 80,
      status: 'operativa',
      creationDate: '2025-10-13',
    },
    {
      id: '2',
      name: 'Bodega sur',
      location: 'Colombia, Bogotá',
      capacity: 75,
      status: 'operativa',
      creationDate: '2025-10-13',
    },
    {
      id: '3',
      name: 'Bodega este',
      location: 'Colombia, Cali',
      capacity: 13,
      status: 'operativa',
      creationDate: '2025-10-13',
    }
  ];

  isLoading = true;
  errorMessage = '';
  isProductModalVisible = false;
  isProductModalLoading = false;

  // Formulario reactivo para validaciones
  validateForm: FormGroup;
  inputClass = 'w-full rounded-4 border-normal border-1 text-[15px] dark:bg-white/10 dark:border-white/10 px-[20px] py-[12px] min-h-[50px] outline-none placeholder:text-[#A0A0A0] text-theme-gray dark:text-white/60';

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private productsService: ProductsService,
    private modalService: NzModalService,
    private fb: FormBuilder
  ) {
  }

  ngOnInit(): void {
    this.subscribeToProducts();
    this.getProducts();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private subscribeToProducts(): void {
    const productsSubscription = this.productsService.products$.subscribe(products => {
      this.listOfData = products;
    });

    this.subscription.add(productsSubscription);
  }

  getProducts(): void {
    this.isLoading = true;
    const searchSubscription = this.productsService.getProducts()
      .subscribe({
        next: (products) => {
          this.listOfData = products;
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
      provider: [null, [Validators.required]],
      requiresColdChain: [null, [Validators.required]],
      tempMin: [null, [Validators.required]],
      tempMax: [null, [Validators.required]],
      description: [null, [Validators.required]],
      storageInstructions: [null, [Validators.required]]
    }, { validators: this.temperatureRangeValidator });

    // Suscribirse a cambios en los campos de temperatura para validar en tiempo real
    this.validateForm.get('tempMin')?.valueChanges.subscribe(() => {
      this.validateTemperatureRange();
    });
    this.validateForm.get('tempMax')?.valueChanges.subscribe(() => {
      this.validateTemperatureRange();
    });
  }

  // Método para validar el rango de temperatura en tiempo real
  validateTemperatureRange(): void {
    // Verificar que el formulario esté inicializado
    if (!this.validateForm) {
      return;
    }

    const tempMin = this.validateForm.get('tempMin')?.value;
    const tempMax = this.validateForm.get('tempMax')?.value;

    if (tempMin && tempMax && tempMin >= tempMax) {
      // Marcar ambos campos como inválidos
      this.validateForm.get('tempMin')?.setErrors({ temperatureRange: true });
      this.validateForm.get('tempMax')?.setErrors({ temperatureRange: true });
    } else {
      // Limpiar errores si la validación pasa
      const tempMinField = this.validateForm.get('tempMin');
      const tempMaxField = this.validateForm.get('tempMax');

      if (tempMinField?.errors?.temperatureRange) {
        const errors = { ...tempMinField.errors };
        delete errors.temperatureRange;
        tempMinField.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }

      if (tempMaxField?.errors?.temperatureRange) {
        const errors = { ...tempMaxField.errors };
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
      return { temperatureRange: true };
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

    // Capturar y mostrar los datos del formulario por consola
    console.log('=== DATOS DEL FORMULARIO DE PRODUCTO ===');
    console.log(this.validateForm.value);

    // Simular proceso de creación
    setTimeout(() => {
      this.isProductModalVisible = false;
      this.isProductModalLoading = false;
      // Limpiar el formulario después de crear
      this.resetProductForm();
      console.log('Producto creado exitosamente');
    }, 1000);
  }

  resetProductForm(): void {
    this.validateForm.reset();
  }

}
