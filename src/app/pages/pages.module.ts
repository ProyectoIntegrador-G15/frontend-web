
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { PagesRoutingModule } from './pages-routing.module';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';


import { SettingComponent } from './setting/setting.component';
import { AccountSettingComponent } from './setting/account-setting';
import { EditProfileComponent } from './setting/edit-profile';
import { NotificationComponent } from './setting/notification';
import { PasswordSettingComponent } from './setting/password-setting';
import { GalleryComponent } from './gallery/gallery.component';
import { PricingComponent } from './pricing/pricing.component';
import { BannerComponent } from './banner/banner.component';
import { SliderBannerComponent } from './banner/slider-banner';
import { SocialProfileComponent } from './setting/social-profile';

import { register } from 'swiper/element/bundle';
import { BlankPageComponent } from './blank-page/blank-page.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { TermsConditionsComponent } from './terms-conditions/terms-conditions.component';
import { FaqComponent } from './faq/faq.component';
import { SearchResultComponent } from './search-result/search-result.component';
import { KnowledgeComponent } from './knowledge-base/knowledge/knowledge.component';
import { AllArticleComponent } from './knowledge-base/all-article/all-article.component';
import { SingleArticleComponent } from './knowledge-base/single-article/single-article.component';
import { knowledgeTab } from './knowledge-base/knowledge/knowledgeTab';
import { knowledgeHeader } from './knowledge-base/knowledge/knowledgeHeader';
import { AllArticleItems } from './knowledge-base/all-article/all-articleItems';
import { AppSingleArticleComponent } from './knowledge-base/single-article/single-article';
import { BlogOneComponent } from './blog-page/blog-one/blog-one.component';
import { BlogTwoComponent } from './blog-page/blog-two/blog-two.component';
import { BlogThreeComponent } from './blog-page/blog-three/blog-three.component';
import { BlogDetailsComponent } from './blog-page/blog-details/blog-details.component';
register();

const antdModule = [
    NzCardModule,
    NzSkeletonModule,
    NzAvatarModule,
    NzPaginationModule,
    NzDividerModule,
    NzButtonModule,
    NzListModule,
    NzTableModule,
    NzRadioModule,
    NzRateModule,
    NzTabsModule,
    NzTagModule,
    NzFormModule,
    NzDatePickerModule,
    NzSelectModule,
    NzSwitchModule,
    NzUploadModule,
    NzToolTipModule,
    NzModalModule,
    NzMessageModule,
    NzInputModule,
    NzBadgeModule,
    NzCollapseModule,
    NzBreadCrumbModule,
    AngularSvgIconModule,
]

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        PagesRoutingModule,
        ...antdModule
    ],
    declarations: [
        SettingComponent,
        AccountSettingComponent,
        EditProfileComponent,
        NotificationComponent,
        PasswordSettingComponent,
        SocialProfileComponent,
        GalleryComponent,
        PricingComponent,
        BannerComponent,
        SliderBannerComponent,
        BlankPageComponent,
        MaintenanceComponent,
        ErrorPageComponent,
        ComingSoonComponent,
        TermsConditionsComponent,
        FaqComponent,
        SearchResultComponent,
        KnowledgeComponent,
        AllArticleComponent,
        SingleArticleComponent,
        knowledgeTab,
        knowledgeHeader,
        AllArticleItems,
        AppSingleArticleComponent,
        BlogOneComponent,
        BlogTwoComponent,
        BlogThreeComponent,
        BlogDetailsComponent
    ],
    providers: [
      DatePipe
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class PagesModule {}
