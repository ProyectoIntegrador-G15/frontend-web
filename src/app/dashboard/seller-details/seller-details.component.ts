import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-seller-details',
  templateUrl: './seller-details.component.html',
  styleUrls: ['./seller-details.component.scss']
})
export class SellerDetailsComponent implements OnInit {
  showContent = true;
  activeTab = 'informacion';

  listItemClass: string = 'cursor-pointer relative inline-flex px-3 text-light dark:text-white/60 py-4 transition-all duration-300 hover:text-primary dark:hover:text-white/[.87] hover:bg-primary/5 dark:hover:bg-primary/10 [&.active]:text-primary [&.active]:after:absolute [&.active]:ltr:after:left-0 [&.active]:rtl:after:right-0 [&.active]:after:bottom-0 [&.active]:after:w-full [&.active]:after:h-0.5 [&.active]:after:bg-primary [&.active]:after:rounded-10';

  // Datos del vendedor (simulados por ahora)
  sellerData = {
    id: 1,
    name: "Sofía Ramírez",
    identification: "12345678",
    status: "active",
    email: "sofia.ramirez@medisupply.com",
    phone: "+51 987 654 321",
    address: "Av. Principal 123, Lima, Perú",
    commission: 5.5,
    sales_target: 50000,
    entry_date: "2023-01-15T00:00:00.000Z",
    created_at: "2023-01-15T00:00:00.000Z",
    updated_at: "2024-12-01T00:00:00.000Z"
  };

  // Datos de desempeño
  performanceData = {
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-10-01'),
    kpis: {
      sales: 120000,
      orders: 85,
      clients: 62,
      fulfillment: 95
    },
    topProducts: [
      {name: 'Mascarillas quirúrgicas', quantity: 320},
      {name: 'Guantes de látex', quantity: 250},
      {name: 'Jeringas estériles', quantity: 180}
    ]
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

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/routes']);
  }

  onStartDateChange(date: Date): void {
    this.performanceData.startDate = date;
    // Aquí se podría hacer una llamada al backend para actualizar los datos
  }

  onEndDateChange(date: Date): void {
    this.performanceData.endDate = date;
    // Aquí se podría hacer una llamada al backend para actualizar los datos
  }

  viewAllProducts(): void {
    // Navegar a vista de todos los productos
    console.log('Ver todos los productos');
  }

  exportOrders(): void {
    // Exportar pedidos a CSV/PDF
    console.log('Exportar pedidos');
  }

  onMonthChange(month: string): void {
    this.salesPlanData.selectedMonth = month;
    // Aquí se podría hacer una llamada al backend para filtrar los planes por mes
  }

  createPlan(): void {
    // Abrir modal o navegar para crear nuevo plan
    console.log('Crear nuevo plan de ventas');
  }

  generateRoute(): void {
    // Navegar a generar nueva ruta
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

}
