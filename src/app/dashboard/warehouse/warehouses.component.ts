import {Component} from '@angular/core';

@Component({
  selector: 'app-warehouses',
  templateUrl: 'warehouses.component.html',
})
export class WarehousesComponent {
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
