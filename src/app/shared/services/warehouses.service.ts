import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const WAREHOUSES_API_URL = 'http://localhost:3001';

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehousesService {
  private warehousesSubject = new BehaviorSubject<Warehouse[]>([]);
  public warehouses$ = this.warehousesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${WAREHOUSES_API_URL}/warehouses`)
      .pipe(
        map(warehouses => {
          this.warehousesSubject.next(warehouses);
          return warehouses;
        }),
        catchError(this.handleError)
      );
  }

  getActiveWarehouses(): Observable<Warehouse[]> {
    return this.warehouses$.pipe(
      map(warehouses => warehouses.filter(warehouse => warehouse.status === 'active'))
    );
  }

  private handleError(error: any): Observable<Warehouse[]> {
    console.error('Error en WarehousesService:', error);
    return of([]);
  }
}
