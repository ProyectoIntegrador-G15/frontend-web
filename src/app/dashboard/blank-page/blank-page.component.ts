import { Component } from '@angular/core';

@Component({
  selector: 'app-blank-page',
  templateUrl: 'blank-page.component.html',
})
export class BlankPageComponent {
  isLoading = true;
  showContent = false;


  ngOnInit() {
    // Simulate loading time
    this.loadData();
  }

  loadData() {
    // Simulate an asynchronous data loading operation
    setTimeout(() => {
      this.isLoading = false;
      this.showContent = true;
    }, 500);
  }
}
