import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductInventory } from '../interfaces/inventory.type';
<<<<<<< HEAD
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';
=======
import { environment } from '../../../environments/environment';
>>>>>>> develop

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
<<<<<<< HEAD
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);
=======
  private baseUrl = `${environment.apiUrl}/inventory`;
>>>>>>> develop

  constructor() { }

  getProductInventory(productId: string): Observable<ProductInventory> {
<<<<<<< HEAD
    return this.apiService.getDirect<ProductInventory>(`${this.endpointsService.getEndpointPath('inventory')}/${productId}`);
=======
    return this.http.get<ProductInventory>(`${environment.apiUrl}${environment.apiEndpoints.inventory}/${productId}`);
>>>>>>> develop
  }
}
