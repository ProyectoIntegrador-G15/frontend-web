import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SellersService, Seller, SalesPlan, CreateSalesPlanRequest } from '../../shared/services/sellers.service';
import { VisitRoutesService, VisitRoute } from '../../shared/services/visit-routes.service';
import { OrdersService } from '../../shared/services/orders.service';
import { TranslateService } from '@ngx-translate/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sellersService: SellersService,
    private visitRoutesService: VisitRoutesService,
    private ordersService: OrdersService,
    private translateService: TranslateService,
    private fb: FormBuilder,
    private notification: NzNotificationService
  ) {
    this.initializeChartOptions();
    this.initializeYears();
    this.initSalesPlanForm();
  }
  seller: Seller | null = null;
  loading = true;
  error = '';
  activeTab = 'information';
  visitRoutes: VisitRoute[] = [];
  loadingRoutes = false;

  // Fecha actual
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  // Datos de planes de venta
  salesPlans: SalesPlan[] = [];
  loadingSalesPlans = false;
  selectedMonth = new Date().getMonth() + 1; // 1-12
  selectedYear = new Date().getFullYear();
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];
  years: number[] = [];

  // Modal de creación de plan de ventas
  isSalesPlanModalVisible = false;
  isSalesPlanModalLoading = false;
  salesPlanForm: FormGroup;

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

  // Fechas del formulario (Date objects para nz-date-picker)
  getDefaultStartMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  getDefaultEndMonth(): Date {
    const now = new Date();
    const nextMonth = now.getMonth() + 1;
    const year = nextMonth > 11 ? now.getFullYear() + 1 : now.getFullYear();
    const month = nextMonth > 11 ? 0 : nextMonth;
    return new Date(year, month, 1);
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    // Generar años desde 5 años atrás hasta 2 años adelante
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      this.years.push(i);
    }
    // Ordenar de mayor a menor
    this.years.sort((a, b) => b - a);
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

    // Si cambia a la tab de planes de venta, cargar datos
    if (tabId === 'sales-plan' && this.seller) {
      this.loadSalesPlans();
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
    if (!this.seller) { return ''; }

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
    if (!this.seller) { return ''; }

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

  // Deshabilitar fechas fuera del rango permitido para el plan de ventas
  // Permite desde el mes actual hasta 6 meses en el futuro
  disableFutureMonthsForSalesPlan = (current: Date): boolean => {
    if (!current) { return false; }
    const now = new Date();
    const currentYear = current.getFullYear();
    const currentMonth = current.getMonth();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    // Calcular la fecha máxima permitida (6 meses después)
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    // Deshabilitar fechas anteriores al mes actual
    if (currentYear < nowYear) { return true; }
    if (currentYear === nowYear && currentMonth < nowMonth) { return true; }

    // Deshabilitar fechas posteriores a 6 meses
    if (currentYear > maxYear) { return true; }
    if (currentYear === maxYear && currentMonth > maxMonth) { return true; }

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
    if (!this.seller) { return; }

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

  // ========== MÉTODOS DE PLANES DE VENTA ==========

  loadSalesPlans(): void {
    if (!this.seller) { return; }

    this.loadingSalesPlans = true;
    this.sellersService.getSalesPlans(this.seller.id, this.selectedMonth, this.selectedYear).subscribe({
      next: (response) => {
        this.salesPlans = response.sales_plans;
        this.loadingSalesPlans = false;
      },
      error: (error) => {
        console.error('Error loading sales plans:', error);
        this.salesPlans = [];
        this.loadingSalesPlans = false;
      }
    });
  }

  onMonthChange(): void {
    this.loadSalesPlans();
  }

  onYearChange(): void {
    this.loadSalesPlans();
  }

  initSalesPlanForm(): void {
    this.salesPlanForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      start_month: [this.getDefaultStartMonth(), [Validators.required, this.startDateValidator.bind(this)]],
      end_month: [this.getDefaultEndMonth(), [Validators.required, this.endDateValidator.bind(this)]],
      total_units_target: [null, [Validators.required, Validators.min(1)]],
      total_value_target: [null, [Validators.required, Validators.min(0.01)]],
      visits_target: [null, [Validators.required, Validators.min(1)]]
    }, { validators: this.dateRangeValidator });

    // Suscribirse a cambios en las fechas para validar en tiempo real
    this.salesPlanForm.get('start_month')?.valueChanges.subscribe(() => {
      this.validateDateRange();
      // Revalidar el campo de fin cuando cambia el inicio
      this.salesPlanForm.get('end_month')?.updateValueAndValidity({ emitEvent: false });
    });
    this.salesPlanForm.get('end_month')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
  }

  // Validador personalizado para fecha de inicio
  startDateValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null; // La validación required se encarga de esto
    }

    const date = control.value instanceof Date ? control.value : new Date(control.value);
    if (isNaN(date.getTime())) {
      return { invalidDate: true };
    }

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();

    // Validar que no sea una fecha pasada (anterior al mes actual)
    if (dateYear < nowYear || (dateYear === nowYear && dateMonth < nowMonth)) {
      return { dateInPast: true };
    }

    // Validar que no sea más de 6 meses en el futuro
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    if (dateYear > maxYear || (dateYear === maxYear && dateMonth > maxMonth)) {
      return { dateTooFar: true };
    }

    return null;
  }

  // Validador personalizado para fecha de fin
  endDateValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null; // La validación required se encarga de esto
    }

    const date = control.value instanceof Date ? control.value : new Date(control.value);
    if (isNaN(date.getTime())) {
      return { invalidDate: true };
    }

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth();

    // Validar que no sea una fecha pasada (anterior al mes actual)
    if (dateYear < nowYear || (dateYear === nowYear && dateMonth < nowMonth)) {
      return { dateInPast: true };
    }

    // Validar que no sea más de 6 meses en el futuro
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();

    if (dateYear > maxYear || (dateYear === maxYear && dateMonth > maxMonth)) {
      return { dateTooFar: true };
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    const startMonthValue = this.salesPlanForm?.get('start_month')?.value;
    if (startMonthValue) {
      const startDate = startMonthValue instanceof Date ? startMonthValue : new Date(startMonthValue);
      if (date <= startDate) {
        return { endBeforeStart: true };
      }
    }

    return null;
  }

  validateDateRange(): void {
    if (!this.salesPlanForm) {
      return;
    }

    const startMonthValue = this.salesPlanForm.get('start_month')?.value;
    const endMonthValue = this.salesPlanForm.get('end_month')?.value;

    if (!startMonthValue || !endMonthValue) {
      return;
    }

    const start = startMonthValue instanceof Date ? startMonthValue : new Date(startMonthValue);
    const end = endMonthValue instanceof Date ? endMonthValue : new Date(endMonthValue);

    // Validar que ambas fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }

    const startField = this.salesPlanForm.get('start_month');
    const endField = this.salesPlanForm.get('end_month');

    // Si la fecha de fin es anterior o igual a la de inicio
    if (end <= start) {
      // Marcar error en el campo de fin
      const endErrors = endField?.errors || {};
      endField?.setErrors({ ...endErrors, dateRange: true });

      // También marcar error en el campo de inicio si es necesario
      const startErrors = startField?.errors || {};
      if (end < start) {
        startField?.setErrors({ ...startErrors, dateRange: true });
      }
    } else {
      // Limpiar errores de rango si la validación pasa
      if (endField?.errors?.dateRange) {
        const endErrors = { ...endField.errors };
        delete endErrors.dateRange;
        endField.setErrors(Object.keys(endErrors).length > 0 ? endErrors : null);
      }
      if (startField?.errors?.dateRange) {
        const startErrors = { ...startField.errors };
        delete startErrors.dateRange;
        startField.setErrors(Object.keys(startErrors).length > 0 ? startErrors : null);
      }
    }
  }

  dateRangeValidator = (control: FormGroup): { [s: string]: boolean } => {
    const startMonthValue = control.get('start_month')?.value;
    const endMonthValue = control.get('end_month')?.value;

    if (!startMonthValue || !endMonthValue) {
      return {};
    }

    const start = startMonthValue instanceof Date ? startMonthValue : new Date(startMonthValue);
    const end = endMonthValue instanceof Date ? endMonthValue : new Date(endMonthValue);

    // Validar que ambas fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {};
    }

    if (end <= start) {
      return { dateRange: true };
    }
    return {};
  }

  getFieldStatus(fieldName: string): string {
    const field = this.salesPlanForm.get(fieldName);
    if (field && (field.dirty || field.touched) && field.invalid) {
      return 'error';
    }
    if (field && (field.dirty || field.touched) && field.valid) {
      return 'success';
    }
    return '';
  }

  getFieldError(fieldName: string): string {
    const field = this.salesPlanForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors.required) {
        return 'Este campo es obligatorio';
      }
      if (field.errors.min) {
        return fieldName === 'total_value_target'
          ? 'El valor debe ser mayor a 0'
          : 'El valor debe ser mayor a 0';
      }
      if (field.errors.minlength) {
        return 'Este campo es demasiado corto';
      }
      if (field.errors.maxlength) {
        return 'Este campo es demasiado largo';
      }
      if (field.errors.invalidDate) {
        return 'La fecha seleccionada no es válida';
      }
      if (field.errors.dateInPast) {
        return 'No se puede seleccionar una fecha anterior al mes actual';
      }
      if (field.errors.dateTooFar) {
        return 'No se puede seleccionar una fecha más de 6 meses en el futuro';
      }
      if (field.errors.endBeforeStart) {
        return 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      if (field.errors.dateRange) {
        if (fieldName === 'start_month') {
          return 'La fecha de inicio no puede ser posterior a la fecha de fin';
        }
        if (fieldName === 'end_month') {
          return 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
      }
    }
    return '';
  }

  validateFormFields(): boolean {
    for (const i in this.salesPlanForm.controls) {
      this.salesPlanForm.controls[i].markAsDirty();
      this.salesPlanForm.controls[i].updateValueAndValidity();
    }
    return this.salesPlanForm.valid;
  }

  onCreatePlan(): void {
    // Establecer valores por defecto al abrir el modal
    this.salesPlanForm.patchValue({
      start_month: this.getDefaultStartMonth(),
      end_month: this.getDefaultEndMonth()
    });

    this.isSalesPlanModalVisible = true;
  }

  handleSalesPlanModalCancel(): void {
    this.isSalesPlanModalVisible = false;
    this.salesPlanForm.reset();
    // Restablecer valores por defecto
    this.salesPlanForm.patchValue({
      start_month: this.getDefaultStartMonth(),
      end_month: this.getDefaultEndMonth()
    });
  }

  handleSalesPlanModalOk(): void {
    // Prevenir múltiples envíos
    if (this.isSalesPlanModalLoading) {
      return;
    }

    if (!this.validateFormFields()) {
      return;
    }

    if (!this.seller) {
      this.notification.error('Error', 'No se encontró información del vendedor');
      return;
    }

    this.isSalesPlanModalLoading = true;

    const formData = this.salesPlanForm.value;
    // nz-date-picker devuelve un objeto Date, usar directamente
    const startDateObj = formData.start_month instanceof Date
      ? formData.start_month
      : new Date(formData.start_month);
    const endDateObj = formData.end_month instanceof Date
      ? formData.end_month
      : new Date(formData.end_month);

    // start_date: primer día del mes seleccionado
    const startDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);

    // end_date: último día del mes seleccionado
    // new Date(year, month + 1, 0) devuelve el último día del mes anterior (que es el último día del mes que queremos)
    const endDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth() + 1, 0);

    const planData: CreateSalesPlanRequest = {
      name: formData.name,
      start_date: this.formatDateForAPI(startDate),
      end_date: this.formatDateForAPI(endDate),
      total_units_target: formData.total_units_target,
      total_value_target: formData.total_value_target,
      visits_target: formData.visits_target
    };

    this.sellersService.createSalesPlan(this.seller.id, planData).subscribe({
      next: (response) => {
        this.isSalesPlanModalVisible = false;
        this.isSalesPlanModalLoading = false;
        this.salesPlanForm.reset();

        // Recargar planes de venta
        this.loadSalesPlans();

        this.notification.create(
          'success',
          '¡Plan de venta creado exitosamente!',
          `El plan "${planData.name}" ha sido creado correctamente.`
        );
      },
      error: (error) => {
        this.isSalesPlanModalLoading = false;
        const errorMessage = error?.error?.detail || error?.message || 'Error al crear el plan de venta';
        this.notification.create(
          'error',
          'Error al crear plan de venta',
          errorMessage
        );
      }
    });
  }

  formatDateForAPI(date: Date | string): string {
    if (!date) { return ''; }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = this.months[start.getMonth()].label;
    const endMonth = this.months[end.getMonth()].label;
    const year = start.getFullYear();

    if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
      return `${startMonth} ${year}`;
    }

    if (start.getFullYear() === end.getFullYear()) {
      return `${startMonth} - ${endMonth} ${year}`;
    }

    return `${startMonth} ${start.getFullYear()} - ${endMonth} ${end.getFullYear()}`;
  }
}

