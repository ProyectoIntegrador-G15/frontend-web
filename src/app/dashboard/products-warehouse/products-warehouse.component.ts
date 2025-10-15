import {Component} from '@angular/core';

@Component({
  selector: 'app-products-warehouses',
  templateUrl: 'products-warehouse.component.html',
})
export class ProductsWarehouseComponent {
  listOfData: any[] = [
    {
      id: '1',
      name: 'Producto A',
      price: '20500',
      provider: 'Proveedor 1',
      needsCold: true,
      status: 'active',
    },
    {
      id: '2',
      name: 'Producto B',
      price: '62450',
      provider: 'Proveedor 1',
      needsCold: false,
      status: 'active',
    },
    {
      id: '3',
      name: 'Producto C',
      price: '40400',
      provider: 'Proveedor 2',
      needsCold: true,
      status: 'inactive',
    }
  ];

  isLoading = true;
  showContent = false;


  ngOnInit() {
    // Simulate loading time
    this.loadData();
  }

  loadData() {
    // Simulate an asynchronous data loading operation
    setTimeout(() => {
      this.isLoading = false;
      this.showContent = true;
    }, 500);
  }
}
