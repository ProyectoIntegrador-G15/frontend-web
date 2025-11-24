import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ClientsService, Client } from '../../shared/services/clients.service';
import { SellersService } from '../../shared/services/sellers.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-seller-clients',
  templateUrl: './seller-clients.component.html',
  styleUrls: ['./seller-clients.component.scss']
})
export class SellerClientsComponent implements OnInit, OnDestroy {
  sellerId: string = '';
  sellerName: string = '';
  loading = false;
  error: string | null = null;
  assignedClients: Client[] = [];
  availableClients: Client[] = [];

  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private sellersService: SellersService,
    private translateService: TranslateService,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sellerId = params['id'];
      this.loadSellerName();
      this.loadAssignedClients();
      this.loadAvailableClients();
    });
  }

  loadSellerName(): void {
    if (!this.sellerId) {
      return;
    }

    const sellerSubscription = this.sellersService.getSellerById(this.sellerId).subscribe({
      next: (seller) => {
        this.sellerName = seller.name;
      },
      error: (error) => {
        console.error('Error loading seller name:', error);
        // No mostramos error aquí para no interrumpir la carga de clientes
        this.sellerName = '';
      }
    });

    this.subscription.add(sellerSubscription);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadAssignedClients(): void {
    this.loading = true;
    this.error = null;
    
    const sellerIdNum = parseInt(this.sellerId, 10);
    if (isNaN(sellerIdNum)) {
      this.error = this.translateService.instant('sellers.loadingError');
      this.loading = false;
      return;
    }

    const assignedSubscription = this.clientsService.getClients(sellerIdNum).subscribe({
      next: (clients) => {
        this.assignedClients = clients;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading assigned clients:', error);
        this.error = this.translateService.instant('sellers.loadingError');
        this.loading = false;
      }
    });

    this.subscription.add(assignedSubscription);
  }

  loadAvailableClients(): void {
    const freeSubscription = this.clientsService.getFreeClients().subscribe({
      next: (clients) => {
        this.availableClients = clients;
      },
      error: (error) => {
        console.error('Error loading available clients:', error);
        // No mostramos error aquí para no interrumpir la carga de asignados
      }
    });

    this.subscription.add(freeSubscription);
  }

  assignClient(clientId: string): void {
    const sellerIdNum = parseInt(this.sellerId, 10);
    const clientIdNum = parseInt(clientId, 10);
    
    if (isNaN(sellerIdNum) || isNaN(clientIdNum)) {
      this.message.error(this.translateService.instant('sellers.loadingError'));
      return;
    }

    const assignSubscription = this.clientsService.assignUnassignClientToSeller(clientIdNum, sellerIdNum).subscribe({
      next: () => {
        this.message.success(this.translateService.instant('sellers.assign') + ' ' + this.translateService.instant('common.success'));
        // Recargar ambas listas
        this.loadAssignedClients();
        this.loadAvailableClients();
      },
      error: (error) => {
        console.error('Error assigning client:', error);
        const errorMessage = error.error?.detail || error.message || this.translateService.instant('sellers.loadingError');
        this.message.error(errorMessage);
      }
    });

    this.subscription.add(assignSubscription);
  }

  unassignClient(clientId: string): void {
    const sellerIdNum = parseInt(this.sellerId, 10);
    const clientIdNum = parseInt(clientId, 10);
    
    if (isNaN(sellerIdNum) || isNaN(clientIdNum)) {
      this.message.error(this.translateService.instant('sellers.loadingError'));
      return;
    }

    const unassignSubscription = this.clientsService.assignUnassignClientToSeller(clientIdNum, sellerIdNum).subscribe({
      next: () => {
        this.message.success(this.translateService.instant('sellers.unassign') + ' ' + this.translateService.instant('common.success'));
        // Recargar ambas listas
        this.loadAssignedClients();
        this.loadAvailableClients();
      },
      error: (error) => {
        console.error('Error unassigning client:', error);
        const errorMessage = error.error?.detail || error.message || this.translateService.instant('sellers.loadingError');
        this.message.error(errorMessage);
      }
    });

    this.subscription.add(unassignSubscription);
  }

  onDrop(event: CdkDragDrop<Client[]>): void {
    // Si se mueve dentro de la misma lista, solo reordenar
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // Si se mueve entre listas diferentes
    const client = event.previousContainer.data[event.previousIndex];
    const clientId = client.id;
    const sellerIdNum = parseInt(this.sellerId, 10);
    const clientIdNum = parseInt(clientId, 10);

    if (isNaN(sellerIdNum) || isNaN(clientIdNum)) {
      this.message.error(this.translateService.instant('sellers.loadingError'));
      return;
    }

    // Determinar si se está asignando o desasignando
    const isAssigning = event.container.data === this.assignedClients;
    const successMessage = isAssigning 
      ? this.translateService.instant('sellers.assign') 
      : this.translateService.instant('sellers.unassign');

    // Mover visualmente el item primero para mejor UX
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Luego hacer la llamada al API
    const assignSubscription = this.clientsService.assignUnassignClientToSeller(clientIdNum, sellerIdNum).subscribe({
      next: () => {
        this.message.success(successMessage + ' ' + this.translateService.instant('common.success'));
      },
      error: (error) => {
        console.error('Error moving client:', error);
        // Revertir el cambio visual si falla
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex
        );
        const errorMessage = error.error?.detail || error.message || this.translateService.instant('sellers.loadingError');
        this.message.error(errorMessage);
      }
    });

    this.subscription.add(assignSubscription);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sellers']);
  }
}

