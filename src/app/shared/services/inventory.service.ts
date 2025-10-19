import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductInventory } from '../interfaces/inventory.type';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = 'http://localhost:3002/inventory';

  constructor(private http: HttpClient) { }

  getProductInventory(productId: string): Observable<ProductInventory> {
    return this.http.get<ProductInventory>(`${this.baseUrl}/${productId}`);
  }
}
