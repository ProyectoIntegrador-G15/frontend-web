import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SellersService, Seller } from '../../shared/services/sellers.service';

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-seller-detail',
  templateUrl: './seller-detail.component.html',
  styleUrls: ['./seller-detail.component.scss']
})
export class SellerDetailComponent implements OnInit {
  seller: Seller | null = null;
  loading = true;
  error = '';
  activeTab = 'information';

  tabs: Tab[] = [
    { id: 'information', label: 'Información' },
    { id: 'performance', label: 'Desempeño' },
    { id: 'sales-plan', label: 'Plan de ventas' },
    { id: 'visit-routes', label: 'Rutas de visita' }
  ];

  // Datos quemados de visitas (mock data)
  mockVisits = [
    {
      id: 1,
      clientName: 'Hospital San Rafael',
      visitDate: '28-10-2025',
      visitTime: '09:00 AM',
      status: 'completed' as const,
      observations: 'Revisar nuevos productos de la línea cardiovascular'
    },
    {
      id: 2,
      clientName: 'Clínica Central',
      visitDate: '29-10-2025',
      visitTime: '02:30 PM',
      status: 'pending' as const,
      observations: 'Presentación de productos para cadena de frío'
    },
    {
      id: 3,
      clientName: 'Farmacia Vida',
      visitDate: '30-10-2025',
      visitTime: '10:00 AM',
      status: 'in-progress' as const,
      observations: 'Seguimiento de pedido anterior y nuevas necesidades'
    },
    {
      id: 4,
      clientName: 'Hospital del Sur',
      visitDate: '31-10-2025',
      visitTime: '11:30 AM',
      status: 'pending' as const,
      observations: 'Negociación de contrato anual'
    },
    {
      id: 5,
      clientName: 'Centro Médico Norte',
      visitDate: '01-11-2025',
      visitTime: '03:00 PM',
      status: 'completed' as const,
      observations: 'Demostración de equipo médico nuevo'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sellersService: SellersService
  ) {}

  ngOnInit(): void {
    const sellerId = this.route.snapshot.paramMap.get('id');
    if (sellerId) {
      this.loadSellerDetail(sellerId);
    }
  }

  loadSellerDetail(sellerId: string): void {
    this.loading = true;
    this.sellersService.getSellerById(sellerId).subscribe({
      next: (seller) => {
        this.seller = seller;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading seller:', error);
        this.error = 'No se pudo cargar la información del vendedor';
        this.loading = false;
      }
    });
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sellers']);
  }

  getStatusColor(): string {
    if (!this.seller) return '';
    
    switch (this.seller.status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'suspended':
        return 'status-suspended';
      default:
        return '';
    }
  }

  getStatusText(): string {
    if (!this.seller) return '';
    
    switch (this.seller.status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'suspended':
        return 'Suspendido';
      default:
        return this.seller.status;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  createVisitRoute(): void {
    this.router.navigate(['/dashboard/visit-routes/create']);
  }
}

