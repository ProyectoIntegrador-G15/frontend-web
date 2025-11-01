import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Client {
  id: number;
  name: string;
  address: string;
  entryDate: string;
  selected: boolean;
}

@Component({
  selector: 'app-create-visit-route',
  templateUrl: './create-visit-route.component.html',
  styleUrls: ['./create-visit-route.component.scss']
})
export class CreateVisitRouteComponent implements OnInit {
  selectedDate: Date | null = null;
  clients: Client[] = [];
  
  // Paginación
  currentPage = 1;
  pageSize = 5;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    // Datos quemados de clientes
    this.clients = [
      {
        id: 1,
        name: 'Hospital San Rafael',
        address: 'Calle 123 #45-67, Bogotá',
        entryDate: '15-01-2024',
        selected: false
      },
      {
        id: 2,
        name: 'Clínica Central',
        address: 'Av. 68 #25-30, Medellín',
        entryDate: '20-02-2024',
        selected: false
      },
      {
        id: 3,
        name: 'Farmacia Vida',
        address: 'Carrera 15 #80-50, Bogotá',
        entryDate: '10-03-2024',
        selected: false
      },
      {
        id: 4,
        name: 'Hospital del Sur',
        address: 'Carrera 30 #17-55, Cali',
        entryDate: '05-04-2024',
        selected: false
      },
      {
        id: 5,
        name: 'Centro Médico Norte',
        address: 'Calle 170 #7-30, Bogotá',
        entryDate: '12-05-2024',
        selected: false
      },
      {
        id: 6,
        name: 'Farmacia Popular',
        address: 'Carrera 7 #32-16, Bogotá',
        entryDate: '18-06-2024',
        selected: false
      },
      {
        id: 7,
        name: 'Clínica del Occidente',
        address: 'Av. Américas #50-20, Cali',
        entryDate: '22-07-2024',
        selected: false
      },
      {
        id: 8,
        name: 'Hospital General',
        address: 'Calle 100 #15-20, Cartagena',
        entryDate: '30-08-2024',
        selected: false
      }
    ];
  }

  get paginatedClients(): Client[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.clients.slice(startIndex, endIndex);
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get selectedClients(): Client[] {
    return this.clients.filter(c => c.selected);
  }

  toggleClientSelection(client: Client): void {
    client.selected = !client.selected;
  }

  disabledDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };

  generateVisitRoute(): void {
    if (!this.selectedDate) {
      alert('Por favor selecciona una fecha para la ruta de visita');
      return;
    }

    if (this.selectedClients.length === 0) {
      alert('Por favor selecciona al menos un cliente para visitar');
      return;
    }

    console.log('Generando ruta de visita:', {
      date: this.selectedDate,
      clients: this.selectedClients
    });

    // Por ahora solo mostrar alert, después conectar al backend
    alert(`Ruta de visita generada para ${this.selectedClients.length} cliente(s) el ${this.formatDate(this.selectedDate)}`);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sellers']);
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}


