import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription, Subject} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';

import {ProductsWarehouseService, WarehouseProductsResponse} from '../../shared/services/products-warehouse.service';
import {ProductsService} from '../../shared/services/products.service';
import {Product} from '../../shared/interfaces/product.type';

@Component({
  selector: 'app-warehouses-list-inventory',
  templateUrl: 'warehouse-inventory.component.html',
  styleUrls: ['warehouse-inventory.component.scss']
})
export class WarehouseInventoryComponent implements OnInit, OnDestroy {

  warehouseId = '';
  warehouseName = '';
  warehouseData: WarehouseProductsResponse | null = null;

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

  // Búsqueda de productos para el modal
  private productSearchSubject = new Subject<string>();

  // Búsqueda de productos en la tabla
  searchTerm = '';
  private searchSubject = new Subject<string>();

  private subscription: Subscription = new Subscription();

  constructor(
    private productsService: ProductsWarehouseService,
    private productsServiceAll: ProductsService,
    private route: ActivatedRoute,
    private router: Router,
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
    this.setupSearch();
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
    this.errorMessage = '';
    const searchSubscription = this.productsService.getProductsByWarehouse(this.warehouseId, this.searchTerm)
      .subscribe({
        next: (response: WarehouseProductsResponse) => {
          this.warehouseData = response;
          this.warehouseName = response.warehouse_name;
          this.listOfData = response.products.map(product => ({
            id: product.id.toString(),
            name: product.name,
            purchase_price: product.purchase_price,
            supplier: product.supplier_id.toString(),
            requires_cold_chain: product.requires_cold_chain,
            status: product.status ?? true,
            description: product.description,
            storageInstructions: product.storage_instructions,
            stock: product.available_quantity,
            warehouseId: this.warehouseId,
            category: undefined,
            location_identifier: product.location_identifier
          }));
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

  getStatusText(status: boolean | string | undefined): string {
    if (typeof status === 'boolean') {
      return status ? 'Activo' : 'Inactivo';
    }
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  getStatusClass(status: boolean | string | undefined): string {
    const isActive = typeof status === 'boolean' ? status : status === 'active';
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
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

  setupSearch(): void {
    const searchSubscription = this.searchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged() // Solo emitir si el valor cambió
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.getProductsByWarehouse();
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
    // Prevenir cerrar el modal mientras se está procesando
    if (this.isInventoryModalLoading) {
      return;
    }
    this.isInventoryModalVisible = false;
    this.resetInventoryForm();
  }

  handleInventoryModalOk(): void {
    // Prevenir múltiples clics mientras se procesa
    if (this.isInventoryModalLoading) {
      return;
    }

    if (!this.validateInventoryForm()) {
      return;
    }

    this.isInventoryModalLoading = true;

    // Deshabilitar el formulario durante la carga
    this.inventoryForm.disable();

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

        // Rehabilitar el formulario en caso de error
        this.inventoryForm.enable();

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
    this.inventoryForm.enable(); // Asegurar que el formulario esté habilitado después de resetear
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

  goBack(): void {
    this.router.navigate(['/dashboard/warehouses']);
  }
}
