import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-warehouses',
  templateUrl: 'warehouses.component.html',
})
export class WarehousesComponent implements OnInit {
  constructor(private router: Router, private translateService: TranslateService) {}

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


  ngOnInit(): void {
    // Simulate loading time
    this.loadData();
  }

  loadData(): void {
    // Simulate an asynchronous data loading operation
    setTimeout(() => {
      this.isLoading = false;
      this.showContent = true;
    }, 500);
  }

  navigateToProducts(warehouseId: string): void {
    this.router.navigate(['/dashboard/warehouses', warehouseId, 'products']);
  }

  // Método para obtener el color del tag según el estado
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'operativa':
        return 'green';
      case 'mantenimiento':
        return 'orange';
      case 'cerrada':
        return 'default';
      default:
        return 'default';
    }
  }

  // Método para obtener el texto del estado
  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'operativa':
        return this.translateService.instant('warehouses.statusOperative');
      case 'mantenimiento':
        return this.translateService.instant('warehouses.statusMaintenance');
      case 'cerrada':
        return this.translateService.instant('warehouses.statusClosed');
      default:
        return status;
    }
  }
}
