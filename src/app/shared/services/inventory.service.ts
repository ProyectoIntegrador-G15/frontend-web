import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductInventory } from '../interfaces/inventory.type';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  getProductInventory(productId: string): Observable<ProductInventory> {
    return this.http.get<ProductInventory>(`${this.baseUrl}/${productId}`);
  }
}
