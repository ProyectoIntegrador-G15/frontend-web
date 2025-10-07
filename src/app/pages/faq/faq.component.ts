import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styles: [`
    :host ::ng-deep .ant-collapse > .ant-collapse-item > .ant-collapse-header{
      @apply text-15 font-medium text-dark dark:text-white/[.87];
    }
    :host ::ng-deep .ant-collapse-borderless > .ant-collapse-item:last-child{
      @apply border-b-1 border-regular dark:border-white/10 border-solid;
    }
    :host ::ng-deep .ant-collapse-content > .ant-collapse-content-box{
      @apply px-6 pt-5 pb-[30px] #{!important};
    }
  `]
})
export class FaqComponent {
  usingApplicationsData: any;
  uiElementsData: any;
  isLoading = true;
  showContent = false;
  selectedTab: string = 'usingApplication'; // Set the default selected tab
  tabTitle: string = 'Using Applications';
  listItemClass: string = 'relative inline-block w-full py-3 ps-[20px] text-body dark:text-white/60 text-[15px] font-medium before:absolute before:w-[2px] before:h-full before:rounded-10 before:bg-current before:top-0 after:absolute after:w-2 after:h-2 after:top-1/2 after:-translate-y-2/4 after:rounded-full after:bg-current before:opacity-0 before:-start-[25px] after:opacity-[0.3] after:start-0 [&.active]:after:opacity-[1] [&.active]:before:-start-[16px] [&.active]:before:opacity-[1] [&.active]:ms-[5px] duration-200 transition-all ease-linear after:duration-200 after:transition-all after:ease-linear before:duration-200 before:transition-all before:ease-linear cursor-pointer';
  collapsePanelClass: string = 'mb-1 font-medium text-dark bg-transparent dark:text-white/[.87] text-15 border-regular border-1 dark:border-white/10 rounded-6 [&>.ant-collapse-content]:border-none [&>.ant-collapse-header]:px-[20px] [&>.ant-collapse-header]:py-[18px] aria-expanded:[&>.ant-collapse-header]:border-b-1 [&>.ant-collapse-header]:border-regular dark:[&>.ant-collapse-header]:border-white/10';

  constructor(private http: HttpClient) {}


  // Function to handle tab selection
  selectTab(tab: string, title: string) {
    this.selectedTab = tab;
    this.tabTitle = title;
  }

  ngOnInit() {
    // Simulate loading time
    this.loadData();
    this.fetchUsingApplicationsData();
    this.fetchUiElementsData();
  }

  loadData() {
    // Simulate an asynchronous data loading operation
    setTimeout(() => {
      this.isLoading = false;
      this.showContent = true;
    }, 500);
  }

  fetchUsingApplicationsData() {
    this.http.get('assets/data/pages/faq.json').subscribe((data) => {
      this.usingApplicationsData = data['usingApplications'];
    });
  }

  fetchUiElementsData() {
    this.http.get('assets/data/pages/faq.json').subscribe((data) => {
      this.uiElementsData = data['uiElements'];
    });
  }

}
