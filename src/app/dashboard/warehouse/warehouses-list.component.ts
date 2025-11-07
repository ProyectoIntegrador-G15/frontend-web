import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {WarehousesService, Warehouse} from '../../shared/services/warehouses.service';
import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';

@Component({
  selector: 'app-warehouses-list',
  templateUrl: 'warehouses-list.component.html',
  styleUrls: ['warehouses-list.component.scss']
})
export class WarehousesListComponent implements OnInit, OnDestroy {
  warehouses: Warehouse[] = [];

  isLoading = true;
  errorMessage = '';

  // Paginación
  currentPage = 1;
  pageSize = 0;
  totalWarehouses = 0;

  // Filtros
  nameFilter = '';
  countryFilter = '';
  private nameSearchSubject = new Subject<string>();
  private countrySearchSubject = new Subject<string>();

  // Lista de países para el filtro (hardcodeados)
  countries: string[] = ['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela'];

  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private warehousesService: WarehousesService,
    private translateService: TranslateService
  ) {
  }

  ngOnInit(): void {
    this.getWarehouses();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getWarehouses(): void {
    this.isLoading = true;
    const searchSubscription = this.warehousesService.getWarehousesPaginated(
      this.currentPage,
      this.nameFilter || undefined,
      this.countryFilter || undefined
    ).subscribe({
      next: (response) => {
        this.warehouses = response.warehouses;
        this.pageSize = response.page_size;
        this.totalWarehouses = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.errorMessage = 'Error al buscar bodegas.';
        this.isLoading = false;
      }
    });

    this.subscription.add(searchSubscription);
  }

  navigateToProducts(warehouseId: number): void {
    this.router.navigate(['/dashboard/warehouses', warehouseId, 'products']);
  }

  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.getWarehouses();
  }

  // Métodos de búsqueda
  setupSearch(): void {
    const nameSearchSubscription = this.nameSearchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.nameFilter = searchTerm;
        this.currentPage = 1;
        this.getWarehouses();
      });

    const countrySearchSubscription = this.countrySearchSubject
      .pipe(
        debounceTime(700),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.countryFilter = searchTerm;
        this.currentPage = 1;
        this.getWarehouses();
      });

    this.subscription.add(nameSearchSubscription);
    this.subscription.add(countrySearchSubscription);
  }

  onNameSearchChange(searchTerm: string): void {
    this.nameSearchSubject.next(searchTerm);
  }

  onCountrySearchChange(searchTerm: string): void {
    this.countrySearchSubject.next(searchTerm);
  }

  clearNameSearch(): void {
    this.nameFilter = '';
    this.nameSearchSubject.next('');
  }

  clearCountrySearch(): void {
    this.countryFilter = '';
    this.countrySearchSubject.next('');
  }

  // Método para obtener el color del tag según el estado
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'operativa':
        return 'green';
      case 'maintenance':
      case 'mantenimiento':
        return 'orange';
      case 'inactive':
      case 'cerrada':
        return 'default';
      default:
        return 'default';
    }
  }

  // Método para obtener el texto del estado
  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'operativa':
        return this.translateService.instant('warehouses.statusOperative');
      case 'maintenance':
      case 'mantenimiento':
        return this.translateService.instant('warehouses.statusMaintenance');
      case 'inactive':
      case 'cerrada':
        return this.translateService.instant('warehouses.statusClosed');
      default:
        return status;
    }
  }
}

