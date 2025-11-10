import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {WarehousesListComponent} from './warehouses-list/warehouses-list.component';
import {WarehouseInventoryComponent} from './warehouse-inventory/warehouse-inventory.component';
import {ProductsComponent} from './products/products.component';
import {ProductInventoryComponent} from './product-inventory/product-inventory.component';
import {RoutesListComponent} from './routes-list/routes-list.component';
import {CreateRouteComponent} from './create-route/create-route.component';
import {RouteDetailComponent} from './route-detail/route-detail.component';
import {SellersListComponent} from './sellers-list/sellers-list.component';
import {SellerDetailComponent} from './seller-detail/seller-detail.component';
import {CreateVisitRouteComponent} from './create-visit-route/create-visit-route.component';
import {ConfirmVisitRouteComponent} from './confirm-visit-route/confirm-visit-route.component';
import {ReportsComponent} from './reports/reports.component';
import {SuppliersListComponent} from './suppliers-list/suppliers-list.component';


const routes: Routes = [
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
    component: WarehousesListComponent,
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
  {
    path: 'routes/:routeId',
    component: RouteDetailComponent,
    data: {
      title: 'Detalle de ruta',
    },
  },
  {
    path: 'sellers',
    component: SellersListComponent,
    data: {
      title: 'Vendedores',
    },
  },
  {
    path: 'sellers/:id',
    component: SellerDetailComponent,
    data: {
      title: 'Perfil del vendedor',
    },
  },
  {
    path: 'visit-routes/create',
    component: CreateVisitRouteComponent,
    data: {
      title: 'Generar ruta de visita',
    },
  },
  {
    path: 'visit-routes/confirm/:routeId',
    component: ConfirmVisitRouteComponent,
    data: {
      title: 'Confirmar ruta',
    },
  },
  {
    path: 'reports',
    component: ReportsComponent,
    data: {
      title: 'Reportes',
    },
  },
  {
    path: 'suppliers',
    component: SuppliersListComponent,
    data: {
      title: 'Proveedores',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {

}
