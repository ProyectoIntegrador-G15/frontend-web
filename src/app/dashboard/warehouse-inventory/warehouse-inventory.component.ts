import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';

import {ProductsWarehouseService} from '../../shared/services/products-warehouse.service';
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


  private subscription: Subscription = new Subscription();

  constructor(
    private productsService: ProductsWarehouseService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    // Obtener el warehouseId de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.warehouseId = params.id;
      this.getProductsByWarehouse();
    });
    this.subscribeToProducts();
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
}
