import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '../shared/shared.module';
import {DashboardRoutingModule} from './dashboard-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DatePipe} from '@angular/common'; // Import DatePipe
import {DecimalPipe} from '@angular/common';

import {ThemeConstantService} from '../shared/services/theme-constant.service';
import {NzLayoutModule} from 'ng-zorro-antd/layout';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzRateModule} from 'ng-zorro-antd/rate';
import {NzBadgeModule} from 'ng-zorro-antd/badge';
import {NzProgressModule} from 'ng-zorro-antd/progress';
import {NzRadioModule} from 'ng-zorro-antd/radio';
import {NzTableModule} from 'ng-zorro-antd/table';
import {NzDropDownModule} from 'ng-zorro-antd/dropdown';
import {NzTimelineModule} from 'ng-zorro-antd/timeline';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzCalendarModule} from 'ng-zorro-antd/calendar';
import {NzToolTipModule} from 'ng-zorro-antd/tooltip';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {NzBreadCrumbModule} from 'ng-zorro-antd/breadcrumb';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {NzSkeletonModule} from 'ng-zorro-antd/skeleton';
import {NzSpaceModule} from 'ng-zorro-antd/space';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {NzDatePickerModule} from 'ng-zorro-antd/date-picker';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzMessageModule} from 'ng-zorro-antd/message';
import {NzPaginationModule} from 'ng-zorro-antd/pagination';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {NzUploadModule} from 'ng-zorro-antd/upload';
import {NzAlertModule} from 'ng-zorro-antd/alert';

import {AngularSvgIconModule} from 'angular-svg-icon';
import {BaseChartDirective} from 'ng2-charts';
import {NgApexchartsModule} from 'ng-apexcharts';
import {PerfectScrollbarModule} from 'ngx-om-perfect-scrollbar';
import {PERFECT_SCROLLBAR_CONFIG} from 'ngx-om-perfect-scrollbar';
import {PerfectScrollbarConfigInterface} from 'ngx-om-perfect-scrollbar';
import {FullCalendarModule} from '@fullcalendar/angular';

import {WarehousesListComponent} from './warehouses-list/warehouses-list.component';
import {WarehouseInventoryComponent} from './warehouse-inventory/warehouse-inventory.component';

// Products
import {ProductsComponent} from './products/products.component';
import {ProductInventoryComponent} from './product-inventory/product-inventory.component';
import {RoutesListComponent} from './routes-list/routes-list.component';
import {CreateRouteComponent} from './create-route/create-route.component';
import {SellersListComponent} from './sellers-list/sellers-list.component';
import {SellerDetailComponent} from './seller-detail/seller-detail.component';
import {CreateVisitRouteComponent} from './create-visit-route/create-visit-route.component';
import {ConfirmVisitRouteComponent} from './confirm-visit-route/confirm-visit-route.component';
import {TabsComponent} from '../shared/components/tabs/tabs.component';
import {BackButtonComponent} from '../shared/components/back-button/back-button.component';
import {ReportsComponent} from './reports/reports.component';
import {SuppliersListComponent} from './suppliers-list/suppliers-list.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

const antdModule = [

  NzLayoutModule,
  NzButtonModule,
  NzCardModule,
  NzAvatarModule,
  NzRateModule,
  NzBadgeModule,
  NzProgressModule,
  NzRadioModule,
  NzTableModule,
  NzDropDownModule,
  NzTimelineModule,
  NzTabsModule,
  NzTagModule,
  NzListModule,
  NzCalendarModule,
  NzToolTipModule,
  NzCheckboxModule,
  NzBreadCrumbModule,
  NzGridModule,
  NzSkeletonModule,
  NzSpaceModule,
  NzFormModule,
  FormsModule,
  ReactiveFormsModule,
  NzSelectModule,
  NzDatePickerModule,
  NzModalModule,
  NzInputModule,
  AngularSvgIconModule.forRoot(),
  BaseChartDirective,
  NgApexchartsModule,
  PerfectScrollbarModule,
  FullCalendarModule,
  NzMessageModule,
  NzPaginationModule,
  NzSpinModule,
  NzUploadModule,
  NzAlertModule
];

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    TabsComponent,
    BackButtonComponent,
    ...antdModule
  ],
  exports: [],
  declarations: [
    ProductsComponent,
    ProductInventoryComponent,
    WarehousesListComponent,
    WarehouseInventoryComponent,
    RoutesListComponent,
    CreateRouteComponent,
    SellersListComponent,
    SellerDetailComponent,
    CreateVisitRouteComponent,
    ConfirmVisitRouteComponent,
    ReportsComponent,
    SuppliersListComponent,
  ],
  providers: [
    ThemeConstantService,
    DatePipe,
    DecimalPipe,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ],
})

export class DashboardModule {

}
