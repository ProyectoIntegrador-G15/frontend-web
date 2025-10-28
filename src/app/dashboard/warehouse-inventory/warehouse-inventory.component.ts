import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription, Subject} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

import {ProductsWarehouseService} from '../../shared/services/products-warehouse.service';
import {ProductsService} from '../../shared/services/products.service';
import {Product} from '../../shared/interfaces/product.type';

@Component({
  selector: 'app-warehouse-inventory',
  templateUrl: 'warehouse-inventory.component.html',
})
export class WarehouseInventoryComponent implements OnInit, OnDestroy {

  warehouseId = '';

  listOfData: Product[] = [];
  isLoading = true;
  errorMessage = '';

  // Modal de inventario
  isInventoryModalVisible = false;
  isInventoryModalLoading = false;
  inventoryForm: FormGroup;
  inputClass = 'w-full rounded-[6px] text-[16px] dark:bg-white/10 px-[16px] py-[12px] min-h-[50px] outline-none';

  // Productos para el modal
  products: Product[] = [];
  isLoadingProducts = false;

  // Búsqueda de productos
  private productSearchSubject = new Subject<string>();

  private subscription: Subscription = new Subscription();

  constructor(
    private productsService: ProductsWarehouseService,
    private productsServiceAll: ProductsService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private notification: NzNotificationService
  ) {
  }

  ngOnInit(): void {
    // Obtener el warehouseId de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.warehouseId = params.id;
      this.getProductsByWarehouse();
    });
    this.subscribeToProducts();
    this.initInventoryForm();
    this.setupProductSearch();
    this.loadAllProducts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Suscribe a los cambios en la lista de productos
   */
  private subscribeToProducts(): void {
    const productsSubscription = this.productsService.products$.subscribe(products => {
      this.listOfData = products;
    });

    this.subscription.add(productsSubscription);
  }

  getProductsByWarehouse(): void {
    this.isLoading = true;
    const searchSubscription = this.productsService.getProductsByWarehouse(this.warehouseId)
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

  getStatusText(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  // Métodos del modal de inventario
  initInventoryForm(): void {
    this.inventoryForm = this.fb.group({
      product: [null, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      location: [null, [Validators.required]]
    });
  }

  loadAllProducts(): void {
    this.isLoadingProducts = true;
    // Cargar productos iniciales sin filtro
    this.productsServiceAll.getProductsPaginated(1, true, '').subscribe({
      next: (response) => {
        this.products = response.products || [];
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.isLoadingProducts = false;
      }
    });
  }

  setupProductSearch(): void {
    const searchSubscription = this.productSearchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged() // Solo emitir si el valor cambió
      )
      .subscribe(searchTerm => {
        this.searchProducts(searchTerm);
      });

    this.subscription.add(searchSubscription);
  }

  onProductSearch(searchTerm: string): void {
    this.productSearchSubject.next(searchTerm);
  }

  searchProducts(searchTerm: string): void {
    this.isLoadingProducts = true;

    this.productsServiceAll.getProductsPaginated(1, true, searchTerm).subscribe({
      next: (response) => {
        this.products = response.products || [];
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error al buscar productos:', error);
        this.isLoadingProducts = false;
      }
    });
  }

  showInventoryModal(): void {
    this.isInventoryModalVisible = true;
  }

  handleInventoryModalCancel(): void {
    this.isInventoryModalVisible = false;
    this.resetInventoryForm();
  }

  handleInventoryModalOk(): void {
    if (!this.validateInventoryForm()) {
      return;
    }

    this.isInventoryModalLoading = true;

    const formData = this.inventoryForm.value;
    const inventoryData = {
      warehouse_id: parseInt(this.warehouseId),
      quantity: formData.quantity,
      location_identifier: formData.location
    };

    // Aquí se hará la llamada a la API
    this.addInventoryToProduct(formData.product, inventoryData);
  }

  addInventoryToProduct(productId: string, inventoryData: any): void {
    this.productsServiceAll.addInventoryToProduct(productId, inventoryData).subscribe({
      next: (response) => {
        this.isInventoryModalLoading = false;
        this.isInventoryModalVisible = false;
        this.resetInventoryForm();

        this.notification.create(
          'success',
          '¡Inventario agregado exitosamente!',
          `Se ha agregado ${inventoryData.quantity} unidades del producto a la bodega.`
        );

        // Recargar datos de la bodega
        this.getProductsByWarehouse();
      },
      error: (error) => {
        console.error('=== ERROR AL AGREGAR INVENTARIO ===');
        console.error('Error:', error);

        this.isInventoryModalLoading = false;
        this.errorMessage = 'Error al agregar inventario. Por favor, inténtalo de nuevo.';

        this.notification.create(
          'error',
          'Error al agregar inventario',
          'No se pudo agregar el inventario. Por favor, verifica los datos e inténtalo de nuevo.'
        );
      }
    });
  }

  resetInventoryForm(): void {
    this.inventoryForm.reset();
  }

  // Métodos de validación
  getFieldStatus(fieldName: string): string {
    const field = this.inventoryForm.get(fieldName);
    if (field && field.dirty && field.invalid) {
      return 'error';
    }
    return '';
  }

  getFieldError(fieldName: string): string {
    const field = this.inventoryForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors.required) {
        return 'Este campo es obligatorio';
      }
      if (field.errors.min) {
        return 'La cantidad debe ser mayor a 0';
      }
    }
    return '';
  }

  validateInventoryForm(): boolean {
    for (const i in this.inventoryForm.controls) {
      this.inventoryForm.controls[i].markAsDirty();
      this.inventoryForm.controls[i].updateValueAndValidity();
    }
    return this.inventoryForm.valid;
  }
}
