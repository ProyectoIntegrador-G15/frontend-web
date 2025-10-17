import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {InventoryService} from '../../shared/services/inventory.service';
import {ProductInventory, WarehouseInventory} from '../../shared/interfaces/inventory.type';

@Component({
  selector: 'app-product-inventory',
  templateUrl: 'product-inventory.component.html',
})
export class ProductInventoryComponent implements OnInit, OnDestroy {

  productId = '';
  inventoryData: ProductInventory | null = null;
  warehousesData: WarehouseInventory[] = [];
  isLoading = true;
  errorMessage = '';

  private subscription: Subscription = new Subscription();

  constructor(
    private inventoryService: InventoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Obtener el productId de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.productId = params.id;
      this.getProductInventory();
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getProductInventory(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const inventorySubscription = this.inventoryService.getProductInventory(this.productId)
      .subscribe({
        next: (inventory) => {
          this.inventoryData = inventory;
          this.warehousesData = inventory.warehouses;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al obtener inventario:', error);
          this.errorMessage = 'Error al obtener el inventario del producto.';
          this.isLoading = false;
        }
      });

    this.subscription.add(inventorySubscription);
  }

  getStatusText(status: string): string {
    return status === 'active' ? 'Activo' : 'Inactivo';
  }

  getStatusClass(status: string): string {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/products']);
  }
}
