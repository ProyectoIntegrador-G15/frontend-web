import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { OrdersService, Order } from '../../shared/services/orders.service';
import { RoutesService, CreateRouteRequest } from '../../shared/services/routes.service';
import { SnackService } from '../../shared/services/snack.service';
import { TranslateService } from '@ngx-translate/core';

// Interfaz para órdenes con selección
export interface SelectableOrder extends Order {
  selected: boolean;
}

@Component({
  selector: 'app-create-route',
  templateUrl: './create-route.component.html',
  styleUrls: ['./create-route.component.scss']
})
export class CreateRouteComponent implements OnInit {

  // Pedidos pendientes para la tabla
  pendingOrders: SelectableOrder[] = [];

  isLoading = true;
  showContent = false;
  error: string | null = null;

  // Paginación para las órdenes
  currentPage = 1;
  pageSize = 5;
  totalItems = 0;

  // Fecha seleccionada para la ruta
  selectedDate: Date | null = null;

  // Vehículo seleccionado (por defecto asignación automática)
  selectedVehicle: number = 1; // 1 = Asignación automática

  constructor(
    private router: Router,
    private location: Location,
    private ordersService: OrdersService,
    private routesService: RoutesService,
    private snackService: SnackService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    this.ordersService.getPendingOrders().subscribe({
      next: (orders) => {
        // Ordenar las órdenes:
        // 1. Primero por fecha de entrega solicitada (más próxima primero)
        // 2. Luego por fecha de creación (más antigua primero - FIFO)
        const sortedOrders = orders.sort((a, b) => {
          // Si ambas tienen fecha de entrega solicitada, ordenar por esa fecha
          if (a.requestedDeliveryDate && b.requestedDeliveryDate) {
            return new Date(a.requestedDeliveryDate).getTime() - new Date(b.requestedDeliveryDate).getTime();
          }
          // Si solo una tiene fecha de entrega, esa va primero
          if (a.requestedDeliveryDate && !b.requestedDeliveryDate) return -1;
          if (!a.requestedDeliveryDate && b.requestedDeliveryDate) return 1;
          // Si ninguna tiene fecha de entrega, ordenar por fecha de creación (FIFO)
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        // Convertir las órdenes a órdenes seleccionables
        this.pendingOrders = sortedOrders.map(order => ({
          ...order,
          selected: false
        }));
        this.totalItems = this.pendingOrders.length;
        this.isLoading = false;
        this.showContent = true;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = this.translateService.instant('createRoute.loadingError');
        this.isLoading = false;
        this.showContent = false;
      }
    });
  }

  /**
   * Getter para obtener las órdenes de la página actual
   */
  get paginatedOrders(): SelectableOrder[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.pendingOrders.slice(startIndex, endIndex);
  }

  toggleOrderSelection(orderId: string): void {
    const order = this.pendingOrders.find(o => o.id === orderId);
    if (order) {
      order.selected = !order.selected;
    }
  }

  formatDate(isoDate: string | null): string {
    return this.ordersService.formatDate(isoDate);
  }

  formatCurrency(amount: number): string {
    return this.ordersService.formatCurrency(amount);
  }

  getSelectedOrdersCount(): number {
    return this.pendingOrders.filter(order => order.selected).length;
  }

  generateRoute(): void {
    const selectedOrders = this.pendingOrders.filter(order => order.selected);

    // Validar que haya al menos un pedido seleccionado
    if (selectedOrders.length === 0) {
      alert(this.translateService.instant('createRoute.selectOrdersError'));
      return;
    }

    // Validar que haya una fecha seleccionada
    if (!this.selectedDate) {
      alert(this.translateService.instant('createRoute.selectDateError'));
      return;
    }

    // Preparar los datos para crear la ruta
    const routeData: CreateRouteRequest = {
      vehicle_id: this.selectedVehicle,
      date: this.formatDateForBackend(this.selectedDate),
      orders: selectedOrders.map(order => parseInt(order.id))
    };

    this.isLoading = true;
    this.error = null;

    // Llamar al servicio para crear la ruta
    this.routesService.createRoute(routeData).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Mostrar snack de éxito con el ID de la ruta
        this.snackService.success(this.translateService.instant('createRoute.routeCreatedSuccess', { id: response.id }));
        // Redirigir a la lista de rutas
        this.router.navigate(['/dashboard/routes']);
      },
      error: (error) => {
        console.error('Error al crear la ruta:', error);
        this.error = error.message || this.translateService.instant('createRoute.routeCreatedError');
        this.isLoading = false;
        // Mostrar snack de error
        this.snackService.error(this.translateService.instant('createRoute.routeError', { error: this.error }));
      }
    });
  }

  /**
   * Formatea la fecha para el backend en formato YYYY-MM-DD
   */
  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  goBack(): void {
    this.location.back();
  }

  /**
   * Deshabilitar fechas anteriores a hoy
   */
  disabledDate = (current: Date): boolean => {
    // Obtener la fecha de hoy sin la hora
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Deshabilitar si la fecha es anterior a hoy
    return current < today;
  }
}
