import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SellersService, Seller } from '../../shared/services/sellers.service';
import { VisitRoutesService, VisitRoute } from '../../shared/services/visit-routes.service';
import { OrdersService } from '../../shared/services/orders.service';
import { TranslateService } from '@ngx-translate/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexLegend,
  ApexPlotOptions,
  ChartComponent
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
  plotOptions: ApexPlotOptions;
};

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
  visitRoutes: VisitRoute[] = [];
  loadingRoutes = false;

  // Fecha actual
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  // Datos de desempeño
  performanceData = {
    startDate: new Date(),
    endDate: new Date(),
    kpis: {
      total_revenue: 0,
      total_orders: 0,
      total_visits: 0,
      units_compliance: 0,
      revenue_compliance: 0,
    },
    topProducts: [] as Array<{ name: string; quantity: number; sales_amount: number }>
  };

  loadingPerformance = false;
  loadingTopProducts = false;

  // Configuración del gráfico
  chartOptions: Partial<ChartOptions> = {};

  @ViewChild('chart') chart: ChartComponent | undefined;

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
    private sellersService: SellersService,
    private visitRoutesService: VisitRoutesService,
    private ordersService: OrdersService,
    private translateService: TranslateService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    // Suscribirse a cambios de idioma para actualizar el gráfico
    this.translateService.onLangChange.subscribe(() => {
      this.initializeChartOptions();
      if (this.performanceData.topProducts.length > 0) {
        this.updateChart();
      }
    });

    const sellerId = this.route.snapshot.paramMap.get('id');
    if (sellerId) {
      this.loadSellerDetail(sellerId);
      this.loadVisitRoutes(sellerId);
    }

    // Inicializar fechas al primer día del mes actual
    this.performanceData.startDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    this.performanceData.endDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    
    // Escuchar cambios en el fragment para activar tab
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'visit-routes') {
        this.activeTab = 'visit-routes';
      }
    });
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
    
    // Si cambia a la tab de performance, cargar datos
    if (tabId === 'performance') {
      this.fetchPerformance();
    }
    
    // Si cambia a la tab de rutas de visita, recargar datos
    if (tabId === 'visit-routes' && this.seller) {
      this.loadVisitRoutes(this.seller.id);
    }
  }

  loadVisitRoutes(sellerId: string): void {
    this.loadingRoutes = true;
    
    this.visitRoutesService.getVisitRoutes({ sellerId: parseInt(sellerId) }).subscribe({
      next: (response) => {
        this.visitRoutes = response.routes;
        this.loadingRoutes = false;
      },
      error: (error) => {
        console.error('Error loading visit routes:', error);
        this.loadingRoutes = false;
      }
    });
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
    if (this.seller) {
      this.router.navigate(['/dashboard/visit-routes/create'], {
        queryParams: { sellerId: this.seller.id }
      });
    }
  }

  viewRouteDetail(routeId: string): void {
    // Por ahora solo mostrar en consola
    // Después se puede crear una vista de detalle
    console.log('Ver detalle de ruta:', routeId);
    alert(`Vista de detalle de ruta #${routeId} - Por implementar`);
  }

  getRouteStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  }

  getRouteStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'confirmed': return 'Planificada';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  }

  getClientNamesShort(route: VisitRoute): string {
    if (!route.stops || route.stops.length === 0) {
      return `${route.totalClients} clientes`;
    }

    const names = route.stops.map(stop => stop.clientName);
    
    // Si son 1-2 clientes, mostrar nombres completos
    if (names.length <= 2) {
      return names.join(', ');
    }
    
    // Si son 3 o más, mostrar los primeros 2 y "X más"
    const firstTwo = names.slice(0, 2).join(', ');
    const remaining = names.length - 2;
    return `${firstTwo} y ${remaining} más`;
  }

  getClientNamesForTooltip(route: VisitRoute): string {
    if (!route.stops || route.stops.length === 0) {
      return '';
    }
    
    return route.stops.map((stop, idx) => `${idx + 1}. ${stop.clientName}`).join('\n');
  }

  // ========== MÉTODOS DE PERFORMANCE ==========

  private initializeChartOptions(): void {
    const locale = this.translateService.currentLang || 'es-CO';
    this.chartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          const units = this.translateService.instant('performance.units');
          return val.toLocaleString(locale) + ' ' + units;
        },
        offsetX: 0,
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: this.translateService.instant('performance.quantitySoldLabel'),
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          formatter: (val: string) => {
            return parseInt(val).toLocaleString(locale);
          }
        }
      },
      yaxis: {
        title: {
          text: this.translateService.instant('performance.productsLabel'),
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            const units = this.translateService.instant('performance.units');
            return val.toLocaleString(locale) + ' ' + units;
          }
        }
      },
      colors: ['#1890ff'],
      legend: {
        show: false
      }
    };
  }

  onStartDateChange(date: Date): void {
    this.performanceData.startDate = date;
    if (this.isMonthAfter(this.performanceData.startDate, this.performanceData.endDate)) {
      this.performanceData.endDate = new Date(this.performanceData.startDate);
    }
    if (this.activeTab === 'performance') {
      this.fetchPerformance();
    }
  }

  onEndDateChange(date: Date): void {
    this.performanceData.endDate = date;
    if (this.isMonthAfter(this.performanceData.startDate, this.performanceData.endDate)) {
      this.performanceData.startDate = new Date(this.performanceData.endDate);
    }
    if (this.activeTab === 'performance') {
      this.fetchPerformance();
    }
  }

  // Deshabilitar meses futuros en el DatePicker (modo mes)
  disableFutureMonths = (current: Date): boolean => {
    if (!current) { return false; }
    const now = new Date();
    const y = current.getFullYear();
    const m = current.getMonth();
    if (y > now.getFullYear()) { return true; }
    if (y === now.getFullYear() && m > now.getMonth()) { return true; }
    return false;
  }

  private formatDateYYYYMMDD(date: Date): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private firstDayOfMonth(date: Date): Date {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private lastDayOfMonth(date: Date): Date {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  private isMonthAfter(a: Date, b: Date): boolean {
    const ay = a.getFullYear();
    const by = b.getFullYear();
    const am = a.getMonth();
    const bm = b.getMonth();
    return ay > by || (ay === by && am > bm);
  }

  private fetchPerformance(): void {
    if (!this.seller) return;

    const sellerId = parseInt(this.seller.id);
    const startMonthFirst = this.firstDayOfMonth(this.performanceData.startDate);
    const endMonthLast = this.lastDayOfMonth(this.performanceData.endDate);
    const start = this.formatDateYYYYMMDD(startMonthFirst);
    const end = this.formatDateYYYYMMDD(endMonthLast);

    this.loadingPerformance = true;
    this.sellersService.getSellerPerformance(sellerId, start, end).subscribe({
      next: (resp) => {
        this.performanceData.kpis = {
          total_revenue: resp.total_revenue ?? 0,
          total_orders: resp.total_orders ?? 0,
          total_visits: resp.total_visits ?? 0,
          units_compliance: resp.units_compliance ?? 0,
          revenue_compliance: resp.revenue_compliance ?? 0,
        };
        this.loadingPerformance = false;
      },
      error: (err) => {
        console.error('Error fetching seller performance', err);
        this.loadingPerformance = false;
      }
    });

    // Obtener top productos vendidos con las mismas fechas que el performance
    this.loadingTopProducts = true;
    this.ordersService.getTopProductsBySeller(sellerId, start, end).subscribe({
      next: (products) => {
        this.performanceData.topProducts = products.map(product => ({
          name: product.product_name,
          quantity: product.total_quantity,
          sales_amount: product.total_sales_amount
        }));
        this.updateChart();
        this.loadingTopProducts = false;
      },
      error: (err) => {
        console.error('Error fetching top products by seller', err);
        this.loadingTopProducts = false;
        // Limpiar productos en caso de error
        this.performanceData.topProducts = [];
        this.updateChart();
      }
    });
  }

  private updateChart(): void {
    const locale = this.translateService.currentLang || 'es-CO';
    const quantitySoldSeries = this.translateService.instant('performance.quantitySoldSeries');

    if (this.performanceData.topProducts.length > 0) {
      const categories = this.performanceData.topProducts.map(p => p.name);
      const data = this.performanceData.topProducts.map(p => p.quantity);

      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: quantitySoldSeries,
          data
        }],
        dataLabels: {
          ...this.chartOptions.dataLabels,
          formatter: (val: number) => {
            const units = this.translateService.instant('performance.units');
            return val.toLocaleString(locale) + ' ' + units;
          }
        },
        xaxis: {
          ...this.chartOptions.xaxis,
          categories,
          title: {
            ...this.chartOptions.xaxis?.title,
            text: this.translateService.instant('performance.quantitySoldLabel')
          },
          labels: {
            formatter: (val: string) => {
              return parseInt(val).toLocaleString(locale);
            }
          }
        },
        yaxis: {
          ...this.chartOptions.yaxis,
          title: {
            ...this.chartOptions.yaxis?.title,
            text: this.translateService.instant('performance.productsLabel')
          }
        },
        tooltip: {
          y: {
            formatter: (val: number) => {
              const units = this.translateService.instant('performance.units');
              return val.toLocaleString(locale) + ' ' + units;
            }
          }
        }
      };
    } else {
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: quantitySoldSeries,
          data: []
        }],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: []
        }
      };
    }
  }
}

