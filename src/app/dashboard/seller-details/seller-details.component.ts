import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {SellersService} from '../../shared/services/sellers.service';
import {OrdersService} from '../../shared/services/orders.service';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
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

@Component({
  selector: 'app-seller-details',
  templateUrl: './seller-details.component.html',
  styleUrls: ['./seller-details.component.scss']
})
export class SellerDetailsComponent implements OnInit {
  showContent = true;
  activeTab = 'informacion';

  listItemClass = 'cursor-pointer relative inline-flex px-3 text-light dark:text-white/60 py-4 transition-all duration-300 hover:text-primary dark:hover:text-white/[.87] hover:bg-primary/5 dark:hover:bg-primary/10 [&.active]:text-primary [&.active]:after:absolute [&.active]:ltr:after:left-0 [&.active]:rtl:after:right-0 [&.active]:after:bottom-0 [&.active]:after:w-full [&.active]:after:h-0.5 [&.active]:after:bg-primary [&.active]:after:rounded-10';

  // Datos del vendedor (simulados por ahora)
  sellerData = {
    id: 1,
    name: 'Sofía Ramírez',
    identification: '12345678',
    status: 'active',
    email: 'sofia.ramirez@medisupply.com',
    phone: '+51 987 654 321',
    address: 'Av. Principal 123, Lima, Perú',
    commission: 5.5,
    sales_target: 50000,
    entry_date: '2023-01-15T00:00:00.000Z',
    created_at: '2023-01-15T00:00:00.000Z',
    updated_at: '2024-12-01T00:00:00.000Z'
  };

  sellerIdParam: string | null = null;

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
    topProducts: []
  };

  // Datos de planes de ventas
  salesPlanData = {
    selectedMonth: 'Enero',
    months: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    plans: [
      {
        id: 'MS20251',
        name: 'Plan de venta Q1 - MS20251',
        products: 'Mascarillas, Guantes, 2 más',
        totalUnits: 1500,
        totalAmount: 500000,
        region: 'Región Norte',
        period: 'Enero 2024'
      },
      {
        id: 'MS20258',
        name: 'Plan de venta Q1 - MS20258',
        products: 'Mascarillas, Guantes, 2 más',
        totalUnits: 1800,
        totalAmount: 580000,
        region: 'Región Norte',
        period: 'Enero 2024'
      },
      {
        id: 'MS20255',
        name: 'Plan de venta Q1 - MS20255',
        products: 'Mascarillas, Guantes, 2 más',
        totalUnits: 1100,
        totalAmount: 430000,
        region: 'Región Norte',
        period: 'Enero 2024'
      }
    ]
  };

  // Datos de rutas de visita
  routesData = {
    routes: [
      {
        id: '#123456',
        date: '25-07-2025',
        clients: 'Hospital Central, Clínica san Fernando, 2 más',
        status: 'planificada'
      },
      {
        id: '#123457',
        date: '26-07-2025',
        clients: 'Hospital Central, Clínica san Fernando, 2 más',
        status: 'en_curso'
      },
      {
        id: '#123458',
        date: '27-07-2025',
        clients: 'Hospital Central, Clínica san Fernando, 2 más',
        status: 'completada'
      }
    ]
  };

  loadingPerformance = false;
  loadingTopProducts = false;

  // Configuración del gráfico
  chartOptions: Partial<ChartOptions> = {};

  @ViewChild('chart') chart: ChartComponent | undefined;

  constructor(
    private router: Router,
    private sellersService: SellersService,
    private ordersService: OrdersService,
    private route: ActivatedRoute,
    private translateService: TranslateService
  ) {
    this.initializeChartOptions();
  }

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

  ngOnInit(): void {
    // Suscribirse a cambios de idioma para actualizar el gráfico
    this.translateService.onLangChange.subscribe(() => {
      this.initializeChartOptions();
      if (this.performanceData.topProducts.length > 0) {
        this.updateChart();
      }
    });

    this.route.paramMap.subscribe(params => {
      this.sellerIdParam = params.get('id');
      if (this.activeTab === 'desempeno') {
        this.fetchPerformance();
      }
    });
    // Inicializar inicio al primer día del mes actual y fin al mes actual
    this.performanceData.startDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    this.performanceData.endDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    if (this.activeTab === 'desempeno') {
      this.fetchPerformance();
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'desempeno') {
      this.fetchPerformance();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sellers']);
  }

  onStartDateChange(date: Date): void {
    this.performanceData.startDate = date;
    if (this.isMonthAfter(this.performanceData.startDate, this.performanceData.endDate)) {
      this.performanceData.endDate = new Date(this.performanceData.startDate);
    }
    if (this.activeTab === 'desempeno') {
      this.fetchPerformance();
    }
  }

  onEndDateChange(date: Date): void {
    this.performanceData.endDate = date;
    if (this.isMonthAfter(this.performanceData.startDate, this.performanceData.endDate)) {
      this.performanceData.startDate = new Date(this.performanceData.endDate);
    }
    if (this.activeTab === 'desempeno') {
      this.fetchPerformance();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  exportOrders(): void {
    console.log('Exportar pedidos');
  }

  onMonthChange(month: string): void {
    this.salesPlanData.selectedMonth = month;
  }

  createPlan(): void {
    console.log('Crear nuevo plan de ventas');
  }

  generateRoute(): void {
    this.router.navigate(['/dashboard/routes/create-route']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'planificada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'en_curso':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'planificada':
        return 'Planificada';
      case 'en_curso':
        return 'En curso';
      case 'completada':
        return 'Completada';
      default:
        return status;
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
    const sellerId = this.sellerIdParam ? parseInt(this.sellerIdParam) : this.sellerData.id;
    const startMonthFirst = this.firstDayOfMonth(this.performanceData.startDate);
    const endMonthLast = this.lastDayOfMonth(this.performanceData.endDate);
    const start = this.formatDateYYYYMMDD(startMonthFirst);
    const end = this.formatDateYYYYMMDD(endMonthLast);

    this.loadingPerformance = true;
    this.sellersService.getSellerPerformance(sellerId as any, start, end).subscribe({
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
