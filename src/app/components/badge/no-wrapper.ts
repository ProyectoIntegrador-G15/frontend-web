import { Component } from '@angular/core';

@Component({
selector: 'nz-demo-badge-no-wrapper',
template: `
<div class="flex items-center gap-x-[10px] gap-y-[5px]">
  <nz-badge [nzCount]="25"></nz-badge>
  <nz-badge [nzCount]="4" class="site-badge-count-4"
    [nzStyle]="{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' }"></nz-badge>
  <nz-badge [nzCount]="109" [nzStyle]="{ backgroundColor: '#52c41a' }"></nz-badge>
</div>
`,
styles: [
`
  nz-badge {
  @apply ltr:mr-[20px] rtl:ml-[20px];
  }
`
]
})
export class NzDemoBadgeNoWrapperComponent {}
