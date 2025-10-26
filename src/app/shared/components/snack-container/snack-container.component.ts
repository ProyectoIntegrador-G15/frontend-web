import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { SnackService, SnackMessage } from '../../services/snack.service';

@Component({
  selector: 'app-snack-container',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  template: `
    <div class="snack-container">
      <div *ngFor="let snack of snacks" 
           [class]="'snack snack-' + snack.type">
        <div class="snack-icon">
          <span nz-icon 
                [nzType]="getIconType(snack.type)" 
                nzTheme="outline">
          </span>
        </div>
        <div class="snack-content">
          {{ snack.message }}
        </div>
        <div class="snack-close" (click)="removeSnack(snack.id)">
          <span nz-icon nzType="close" nzTheme="outline"></span>
        </div>
      </div>
    </div>
  `
})
export class SnackContainerComponent implements OnInit, OnDestroy {
  snacks: SnackMessage[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private snackService: SnackService) {}

  ngOnInit(): void {
    // Suscribirse a nuevos snacks
    this.subscriptions.push(
      this.snackService.snack$.subscribe(snack => {
        this.snacks.push(snack);
      })
    );

    // Suscribirse a remociones de snacks
    this.subscriptions.push(
      this.snackService.removeSnack$.subscribe(id => {
        this.removeSnack(id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  removeSnack(id: string): void {
    this.snacks = this.snacks.filter(snack => snack.id !== id);
  }

  getIconType(type: string): string {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'exclamation-circle';
      case 'info':
        return 'info-circle';
      default:
        return 'info-circle';
    }
  }
}

