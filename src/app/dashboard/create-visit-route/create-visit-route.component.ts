import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ClientsService, Client } from '../../shared/services/clients.service';
import { VisitRoutesService, VisitRoute } from '../../shared/services/visit-routes.service';
import { SellersService, Seller } from '../../shared/services/sellers.service';
import { SnackService } from '../../shared/services/snack.service';

interface ClientWithSelection extends Client {
  selected: boolean;
}

@Component({
  selector: 'app-create-visit-route',
  templateUrl: './create-visit-route.component.html',
  styleUrls: ['./create-visit-route.component.scss']
})
export class CreateVisitRouteComponent implements OnInit {
  selectedDate: Date | null = null;
  selectedSellerId: string | null = null;
  sellerName: string = '';
  clients: ClientWithSelection[] = [];
  
  // Estado
  loading = false;
  loadingClients = false;
  error: string | null = null;
  
  // Paginación
  currentPage = 1;
  pageSize = 5;
  
  // Ruta generada
  generatedRoute: VisitRoute | null = null;
  showRoutePreview = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clientsService: ClientsService,
    private visitRoutesService: VisitRoutesService,
    private sellersService: SellersService,
    private snackService: SnackService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    // Obtener sellerId de la URL o del queryParams
    this.route.queryParams.subscribe(params => {
      this.selectedSellerId = params['sellerId'] || '1'; // Default a 1 si no viene
    });
    
    this.route.params.subscribe(params => {
      if (params['sellerId']) {
        this.selectedSellerId = params['sellerId'];
      }
    });

    // Si tenemos sellerId, cargar info del vendedor
    if (this.selectedSellerId) {
      this.loadSellerInfo();
    }
    
    this.loadClients();
  }

  loadSellerInfo(): void {
    if (!this.selectedSellerId) return;
    
    this.sellersService.getSellerById(this.selectedSellerId).subscribe({
      next: (seller) => {
        this.sellerName = seller.name;
      },
      error: (error) => {
        console.error('Error loading seller:', error);
        // Si no podemos cargar el vendedor, usamos el primero disponible
        this.selectedSellerId = '1';
        this.sellerName = this.translateService.instant('sellers.title') + ' 1';
      }
    });
  }

  loadClients(): void {
    if (!this.selectedSellerId) {
      return;
    }

    this.loadingClients = true;
    this.error = null;

    const sellerId = parseInt(this.selectedSellerId);
    
    this.clientsService.getClients(sellerId).subscribe({
      next: (clients) => {
        if (clients.length === 0) {
          this.error = this.translateService.instant('createVisitRoute.error.noClientsAssigned');
        }
        
        this.clients = clients.map(client => ({
          ...client,
          selected: false
        }));
        this.loadingClients = false;
      },
      error: (error) => {
        this.error = this.translateService.instant('createVisitRoute.error.loadClients');
        this.loadingClients = false;
      }
    });
  }

  get paginatedClients(): ClientWithSelection[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.clients.slice(startIndex, endIndex);
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get selectedClients(): ClientWithSelection[] {
    return this.clients.filter(c => c.selected);
  }

  getSelectedClientsText(): string {
    const count = this.selectedClients.length;
    return this.translateService.instant('createVisitRoute.selectedClients', { count });
  }

  toggleClientSelection(client: ClientWithSelection): void {
    client.selected = !client.selected;
  }

  disabledDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };

  generateVisitRoute(): void {
    // Validaciones
    if (!this.selectedSellerId) {
      this.error = this.translateService.instant('createVisitRoute.error.noSeller');
      return;
    }

    if (!this.selectedDate) {
      this.error = this.translateService.instant('createVisitRoute.error.noDate');
      return;
    }

    if (this.selectedClients.length === 0) {
      this.error = this.translateService.instant('createVisitRoute.error.noClients');
      return;
    }

    // Guardar datos en sessionStorage para la pantalla de confirmación
    const routeData = {
      seller_id: parseInt(this.selectedSellerId),
      seller_name: this.sellerName,
      route_date: this.formatDateForBackend(this.selectedDate),
      client_ids: this.selectedClients.map(c => parseInt(c.id)),
      clients: this.selectedClients,
      start_time: '08:00'
    };

    sessionStorage.setItem('pendingVisitRoute', JSON.stringify(routeData));
    
    // Redirigir a la pantalla de confirmación (sin crear la ruta aún)
    this.router.navigate(['/dashboard/visit-routes/confirm/preview']);
  }

  confirmRoute(): void {
    if (!this.generatedRoute) return;

    this.loading = true;
    this.error = null;

    this.visitRoutesService.confirmVisitRoute(this.generatedRoute.id).subscribe({
      next: (route) => {
        // Mostrar snack de confirmación
        const successMessage = this.translateService.instant('createVisitRoute.success.confirmed', {
          id: route.id,
          sellerName: this.sellerName,
          total: route.totalClients
        });
        this.snackService.success(successMessage);
        
        // Redirigir al detalle del vendedor (tab de rutas de visita)
        this.router.navigate(['/dashboard/sellers', this.selectedSellerId], {
          fragment: 'visit-routes'
        });
      },
      error: (error) => {
        console.error('Error confirming route:', error);
        this.error = error.message || this.translateService.instant('createVisitRoute.error.confirmRoute');
        const errorMessage = this.translateService.instant('createVisitRoute.error.confirmRouteError', {
          error: error.message || this.translateService.instant('common.error')
        });
        this.snackService.error(errorMessage);
        this.loading = false;
      }
    });
  }

  cancelRoutePreview(): void {
    this.showRoutePreview = false;
    this.generatedRoute = null;
  }

  goBack(): void {
    if (this.showRoutePreview) {
      this.cancelRoutePreview();
    } else {
      this.router.navigate(['/dashboard/sellers']);
    }
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatTime(timeString?: string): string {
    if (!timeString) return '--:--';
    // timeString viene en formato HH:MM:SS desde el backend
    return timeString.substring(0, 5); // Retorna HH:MM
  }

  formatDistance(meters?: number): string {
    if (!meters) return '--';
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }
}


