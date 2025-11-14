import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {LoginComponent} from './login/login.component';
import {TwoFactorAuthenticationComponent} from './two-factor-authentication/two-factor-authentication.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: {
      title: 'Login 1'
    }
  },
  {
    path: '2fa',
    component: TwoFactorAuthenticationComponent,
    data: {
      title: 'Autenticación 2FA'
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthenticationRoutingModule {
}
