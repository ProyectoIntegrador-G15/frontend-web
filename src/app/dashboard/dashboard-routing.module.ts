import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {BlankPageComponent} from './blank-page/blank-page.component';
import {WarehousesComponent} from './warehouse/warehouses.component';
import {WarehouseInventoryComponent} from './warehouse-inventory/warehouse-inventory.component';
import {ProductsComponent} from './products/products.component';
import {ProductInventoryComponent} from './product-inventory/product-inventory.component';
import {RoutesListComponent} from './routes-list/routes-list.component';
import {CreateRouteComponent} from './create-route/create-route.component';


const routes: Routes = [
  {
    path: 'blank-page',
    component: BlankPageComponent,
    data: {
      title: 'Blank Page',
    },
  },
  {
    path: 'products',
    component: ProductsComponent,
    data: {
      title: 'Productos',
    },
  },
  {
    path: 'products/:id/warehouses',
    component: ProductInventoryComponent,
    data: {
      title: 'Disponibilidad de producto',
    },
  },
  {
    path: 'warehouses',
    component: WarehousesComponent,
    data: {
      title: 'Bodegas',
    },
  },
  {
    path: 'warehouses/:id/products',
    component: WarehouseInventoryComponent,
    data: {
      title: 'Productos por bodega',
    },
  },
  {
    path: 'routes',
    component: RoutesListComponent,
    data: {
      title: 'Rutas de Entrega',
    },
  },
  {
    path: 'routes/create-route',
    component: CreateRouteComponent,
    data: {
      title: 'Generar ruta de entrega',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {

}
