import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {BlankPageComponent} from './blank-page/blank-page.component';
import {WarehousesComponent} from './warehouse/warehouses.component';
import {ProductsWarehouseComponent} from './products-warehouse/products-warehouse.component';


const routes: Routes = [
  {
    path: 'blank-page',
    component: BlankPageComponent,
    data: {
      title: 'Blank Page',
    },
  },
  {
    path: 'warehouses',
    component: WarehousesComponent,
    data: {
      title: 'Bodegas',
    },
    children: [
      {
        path: ':id/products',
        component: ProductsWarehouseComponent,
        data: {
          title: 'Productos por bodega',
        },
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {

}
