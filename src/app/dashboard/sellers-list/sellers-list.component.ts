import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SellersService, Seller } from '../../shared/services/sellers.service';
import { TranslateService } from '@ngx-translate/core';

export interface SellerItem {
  id: string;
  name: string;
  identification: string;
  status: string;
  entryDate: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-sellers-list',
  templateUrl: './sellers-list.component.html',
  styleUrls: ['./sellers-list.component.scss']
})
export class SellersListComponent implements OnInit {

  sellers: SellerItem[] = [];
  loading = false;
  error: string | null = null;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // Getter para obtener los vendedores de la página actual
  get paginatedSellers(): SellerItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.sellers.slice(startIndex, endIndex);
  }

  constructor(
    private router: Router,
    private sellersService: SellersService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadSellers();
  }

  /**
   * Loads sellers from the backend
   */
  loadSellers(): void {
    this.loading = true;
    this.error = null;

    this.sellersService.getSellers().subscribe({
      next: (sellers) => {
        this.sellers = sellers;
        this.totalItems = sellers.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sellers:', error);
        this.error = this.translateService.instant('sellers.loadingError');
        this.loading = false;
      }
    });
  }

  // Method to navigate to create seller
  createSeller() {
    this.router.navigate(['/dashboard/sellers/create-seller']);
  }

  // Method to get status color for tag
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'orange';
      default:
        return 'default';
    }
  }

  // Method to get status text
  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return this.translateService.instant('sellers.statusActive');
      case 'inactive':
        return this.translateService.instant('sellers.statusInactive');
      case 'suspended':
        return this.translateService.instant('sellers.statusSuspended');
      default:
        return this.translateService.instant('sellers.statusUnknown');
    }
  }

  // Method to view seller details
  viewSeller(sellerId: string) {
    this.router.navigate(['/dashboard/sellers', sellerId]);
  }

  // Method to manage clients assigned to seller
  manageClients(sellerId: string) {
    this.router.navigate(['/dashboard/sellers', sellerId, 'clients']);
  }
}
