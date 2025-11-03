
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { registerLocaleData, PathLocationStrategy, LocationStrategy } from '@angular/common';
import en from '@angular/common/locales/en';
import es from '@angular/common/locales/es';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AuthTokenInterceptor } from './shared/interceptors/auth-token.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { TemplateModule } from './shared/template/template.module';
import { SharedModule } from './shared/shared.module';

import { BaseChartDirective } from 'ng2-charts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FullCalendarModule } from '@fullcalendar/angular';

import { AppComponent } from './app.component';
import { CommonLayoutComponent } from './layouts/common-layout/common-layout.component';
import { FullLayoutComponent } from './layouts/full-layout/full-layout.component';
import { ThemeConstantService } from './shared/services/theme-constant.service';
import { SnackContainerComponent } from './shared/components/snack-container/snack-container.component';

// Función para cargar archivos de traducción
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

registerLocaleData(en);
registerLocaleData(es);

@NgModule({
    declarations: [
        AppComponent,
        CommonLayoutComponent,
        FullLayoutComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        TemplateModule,
        SharedModule,
        NzBreadCrumbModule,
        NzSpinModule,
        BaseChartDirective,
        NgApexchartsModule,
        FullCalendarModule,
        AngularSvgIconModule.forRoot(),
        SnackContainerComponent,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            },
            defaultLanguage: 'es-CO',
            useDefaultLang: true
        })
    ],
    providers: [
        {
            provide: NZ_I18N,
            useValue: en_US,
        },
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy
        },
        ThemeConstantService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthTokenInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
