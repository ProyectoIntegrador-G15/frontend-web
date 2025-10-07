import { Component } from '@angular/core';

@Component({
  selector: 'nz-demo-badge-overflow',
  template: `
    <div class="flex items-center gap-x-[20px] gap-y-[5px]">
    <nz-badge [nzCount]="99">
      <a class="w-[42px] h-[42px] rounded-4 bg-[#f4f5f7] dark:bg-white/10 inline-block align-middle"></a>
    </nz-badge>
    <nz-badge [nzCount]="200">
      <a class="w-[42px] h-[42px] rounded-4 bg-[#f4f5f7] dark:bg-white/10 inline-block align-middle"></a>
    </nz-badge>
    <nz-badge [nzCount]="200" [nzOverflowCount]="10">
      <a class="w-[42px] h-[42px] rounded-4 bg-[#f4f5f7] dark:bg-white/10 inline-block align-middle"></a>
    </nz-badge>
    <nz-badge [nzCount]="10000" [nzOverflowCount]="999">
      <a class="w-[42px] h-[42px] rounded-4 bg-[#f4f5f7] dark:bg-white/10 inline-block align-middle"></a>
    </nz-badge>
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
export class NzDemoBadgeOverflowComponent {}
