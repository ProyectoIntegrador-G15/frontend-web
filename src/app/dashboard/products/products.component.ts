import {Component, OnDestroy, OnInit} from '@angular/core';

import {ProductsService} from '../../shared/services/products.service';
import {Subscription} from 'rxjs';
import {Router} from "@angular/router";

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

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private productsService: ProductsService,
  ) {
  }

  ngOnInit(): void {
    this.subscribeToProducts();
    this.getProducts();
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

}
