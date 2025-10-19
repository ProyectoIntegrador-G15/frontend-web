import { Component } from '@angular/core';
import { Router } from '@angular/router';

export interface RouteItem {
  id: string;
  creationDate: string;
  originWarehouse: string;
  assignedDeliveries: number;
  status: 'planned' | 'in_progress' | 'with_incidents' | 'completed';
  assignedTruck: number;
}

@Component({
  selector: 'app-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss']
})
export class RoutesListComponent {

  constructor(private router: Router) { }

  routes: RouteItem[] = [
    {
      id: '123456',
      creationDate: '25-07-2025',
      originWarehouse: 'Bodega Sur',
      assignedDeliveries: 15,
      status: 'planned',
      assignedTruck: 4
    },
    {
      id: '123457',
      creationDate: '23-07-2025',
      originWarehouse: 'Bodega Norte',
      assignedDeliveries: 8,
      status: 'in_progress',
      assignedTruck: 9
    },
    {
      id: '128457',
      creationDate: '23-07-2025',
      originWarehouse: 'Bodega Norte',
      assignedDeliveries: 5,
      status: 'in_progress',
      assignedTruck: 6
    },
    {
      id: '129457',
      creationDate: '22-07-2025',
      originWarehouse: 'Bodega Central',
      assignedDeliveries: 12,
      status: 'with_incidents',
      assignedTruck: 8
    },
    {
      id: '173457',
      creationDate: '20-07-2025',
      originWarehouse: 'Bodega Sur',
      assignedDeliveries: 8,
      status: 'completed',
      assignedTruck: 4
    },
    {
      id: '123457',
      creationDate: '19-07-2025',
      originWarehouse: 'Bodega Norte',
      assignedDeliveries: 10,
      status: 'completed',
      assignedTruck: 9
    }
  ];

  currentPage = 1;
  pageSize = 10;
  totalItems = this.routes.length;

  // Método para navegar a crear ruta
  createRoute() {
    this.router.navigate(['/dashboard/routes/create-route']);
  }

  // Método para obtener el color del tag según el estado
  getStatusColor(status: string): string {
    switch (status) {
      case 'planned':
        return 'blue';
      case 'in_progress':
        return 'green';
      case 'with_incidents':
        return 'orange';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  }

  // Método para obtener el texto del estado
  getStatusText(status: string): string {
    switch (status) {
      case 'planned':
        return 'Planificada';
      case 'in_progress':
        return 'En curso';
      case 'with_incidents':
        return 'Con incidencias';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  }
}
