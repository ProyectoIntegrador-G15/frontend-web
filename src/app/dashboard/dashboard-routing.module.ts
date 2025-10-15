import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BlankPageComponent } from './blank-page/blank-page.component';


const routes: Routes = [
  {
    path: 'blank-page',
    component: BlankPageComponent,
    data: {
      title: 'Blank Page',
    },
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DashboardRoutingModule {

}
