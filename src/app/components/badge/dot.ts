import { Component } from '@angular/core';

@Component({
  selector: 'nz-demo-badge-dot',
  template: `
    <div class="inline-flex gap-x-[10px] gap-y-[5px]">
      <nz-badge class="dark:text-white/[.87]" nzDot><i nz-icon nzType="notification"></i></nz-badge>
      <nz-badge class="dark:text-white/[.87]" nzDot [nzShowDot]="false"><i nz-icon nzType="notification"></i></nz-badge>
      <nz-badge class="dark:text-white/[.87]" nzDot>
        <a>Link something</a>
      </nz-badge>
    </div>
  `,
  styles: [
    `
      [nz-icon] {
        @apply w-[16px] h-[16px] leading-[16px] text-[16px];
      }
    `
  ]
})
export class NzDemoBadgeDotComponent {}
