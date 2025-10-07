import {
  NgModule
} from '@angular/core';
import {
  Routes,
  RouterModule
} from '@angular/router';
import {
  SettingComponent
} from './setting/setting.component';
import {
  GalleryComponent
} from './gallery/gallery.component';
import {
  PricingComponent
} from './pricing/pricing.component';
import {
  BannerComponent
} from './banner/banner.component';
import { BlankPageComponent } from './blank-page/blank-page.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { TermsConditionsComponent } from './terms-conditions/terms-conditions.component';
import { FaqComponent } from './faq/faq.component';
import { SearchResultComponent } from './search-result/search-result.component';
import { KnowledgeComponent } from './knowledge-base/knowledge/knowledge.component';
import { AllArticleComponent } from './knowledge-base/all-article/all-article.component';
import { SingleArticleComponent } from './knowledge-base/single-article/single-article.component';
import { BlogOneComponent } from './blog-page/blog-one/blog-one.component';
import { BlogTwoComponent } from './blog-page/blog-two/blog-two.component';
import { BlogThreeComponent } from './blog-page/blog-three/blog-three.component';
import { BlogDetailsComponent } from './blog-page/blog-details/blog-details.component';


const routes: Routes = [

  {
    path: 'setting',
    component: SettingComponent,
    data: {
      title: 'Setting',
    }
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    data: {
      title: 'Gallery',
    }
  },
  {
    path: 'pricing',
    component: PricingComponent,
    data: {
      title: 'Pricing',
    }
  },
  {
    path: 'banner',
    component: BannerComponent,
    data: {
      title: 'Banners',
    },
  },
  {
    path: 'banner',
    component: BannerComponent,
    data: {
      title: 'Banners',
    },
  },
  {
    path: 'blank-page',
    component: BlankPageComponent,
    data: {
      title: 'Blank Page',
    },
  },
  {
    path: 'blog-one',
    component: BlogOneComponent,
    data: {
      title: 'Blog One',
    },
  },
  {
    path: 'blog-one',
    component: BlogOneComponent,
    data: {
      title: 'Blog One',
    },
  },
  {
    path: 'blog-two',
    component: BlogTwoComponent,
    data: {
      title: 'Blog Two',
    },
  },
  {
    path: 'blog-three',
    component: BlogThreeComponent,
    data: {
      title: 'Blog Three',
    },
  },
  {
    path: 'blog-details',
    component: BlogDetailsComponent,
    data: {
      title: 'Blog Details',
    },
  },
  {
    path: 'coming-soon',
    component: ComingSoonComponent,
    data: {
      title: 'Coming Soon',
    },
  },
  {
    path: 'error-page',
    component: ErrorPageComponent,
    data: {
      title: '404',
    },
  },
  {
    path: 'maintenance',
    component: MaintenanceComponent,
    data: {
      title: 'Maintenance',
    },
  },
  {
    path: 'terms-conditions',
    component: TermsConditionsComponent,
    data: {
      title: 'Terms & Conditions',
    },
  },
  {
    path: 'faq',
    component: FaqComponent,
    data: {
      title: 'Faq',
    },
  },
  {
    path: 'search-result',
    component: SearchResultComponent,
    data: {
      title: 'Search Result',
    },
  },
  {
    path: 'knowledge-base',
    children: [
      {
        path: 'knowledge',
        component: KnowledgeComponent,
        data: {
          title: 'Knowledge Base',
        },
      },
      {
        path: 'all-article',
        component: AllArticleComponent,
        data: {
          title: 'All Article',
        },
      },
      {
        path: 'single-article',
        component: SingleArticleComponent,
        data: {
          title: 'Single Article',
        },
      },
      ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
