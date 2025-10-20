import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductInventory } from '../interfaces/inventory.type';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() { }

  getProductInventory(productId: string): Observable<ProductInventory> {
    return this.apiService.getDirect<ProductInventory>(`${this.endpointsService.getEndpointPath('inventory')}/${productId}`);
  }
}
