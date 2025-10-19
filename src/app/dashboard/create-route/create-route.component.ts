import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-route',
  templateUrl: './create-route.component.html',
  styleUrls: ['./create-route.component.scss']
})
export class CreateRouteComponent implements OnInit {
  
  // Pedidos pendientes para la tabla
  pendingOrders = [
    {
      id: 'P89787',
      selected: true,
      client: 'Clínica Palermo',
      address: 'Carrera 1 #1-2',
      entryDate: '2023-10-26'
    },
    {
      id: 'P98734',
      selected: false,
      client: 'Consultorio Las Acacias',
      address: 'Carrera 12 #23-2',
      entryDate: '2024-10-26'
    },
    {
      id: 'P89734',
      selected: true,
      client: 'Hospital San José',
      address: 'Carrera 54 #65-2',
      entryDate: '2022-10-26'
    }
  ];

  isLoading = true;
  showContent = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Simulate loading time
    this.loadData();
  }

  loadData(): void {
    // Simulate an asynchronous data loading operation
    setTimeout(() => {
      this.isLoading = false;
      this.showContent = true;
    }, 500);
  }

  toggleOrderSelection(orderId: string): void {
    const order = this.pendingOrders.find(o => o.id === orderId);
    if (order) {
      order.selected = !order.selected;
    }
  }

  generateRoute(): void {
    console.log('Generar ruta con pedidos seleccionados:', this.pendingOrders.filter(order => order.selected));
  }

  goBack(): void {
    this.router.navigate(['/dashboard/delivery-routes']);
  }
}
