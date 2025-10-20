import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoutesService, Route } from '../../shared/services/routes.service';

export interface RouteItem {
  id: string;
  creationDate: string;
  originWarehouse: string;
  assignedDeliveries: number;
  status: 'planned' | 'in_progress' | 'with_incidents' | 'completed';
  assignedTruck: string;
}

@Component({
  selector: 'app-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrls: ['./routes-list.component.scss']
})
export class RoutesListComponent implements OnInit {

  routes: RouteItem[] = [];
  loading = false;
  error: string | null = null;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private router: Router,
    private routesService: RoutesService
  ) { }

  ngOnInit(): void {
    this.loadRoutes();
  }

  /**
   * Carga las rutas desde el backend
   */
  loadRoutes(): void {
    this.loading = true;
    this.error = null;

    this.routesService.getRoutes().subscribe({
      next: (routes) => {
        this.routes = routes;
        this.totalItems = routes.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las rutas:', error);
        this.error = 'No se pudieron cargar las rutas. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

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
