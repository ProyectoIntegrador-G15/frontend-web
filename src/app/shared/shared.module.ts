import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { RouterModule } from "@angular/router";
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeConstantService } from './services/theme-constant.service';
import { SearchPipe } from './pipes/search.pipe';
import { CustomTranslatePipe } from './pipes/custom-translate.pipe';
import { CurrencyFormatPipe } from './pipes/currency.pipe';
import { CurrencyPlaceholderPipe } from './pipes/currency-placeholder.pipe';
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';

@NgModule({
    exports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        NzIconModule,
        NzDropDownModule,
        NzButtonModule,
        TranslateModule,
        SearchPipe,
        CustomTranslatePipe,
        CurrencyFormatPipe,
        CurrencyPlaceholderPipe,
        LanguageSelectorComponent
    ],
    imports: [
        RouterModule,
        CommonModule,
        NzIconModule,
        NzToolTipModule,
        NzDropDownModule,
        NzButtonModule,
        TranslateModule
    ],
    declarations: [
        SearchPipe,
        CustomTranslatePipe,
        CurrencyFormatPipe,
        CurrencyPlaceholderPipe,
        LanguageSelectorComponent
    ],
    providers: [
        ThemeConstantService
    ]
})

export class SharedModule { }
