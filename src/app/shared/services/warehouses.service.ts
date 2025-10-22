import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';

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
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {}

  getWarehouses(): Observable<Warehouse[]> {
    return this.apiService.getDirect<Warehouse[]>(this.endpointsService.getEndpointPath('warehouses'))
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
