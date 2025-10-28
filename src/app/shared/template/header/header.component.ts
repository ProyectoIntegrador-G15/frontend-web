import {Component} from '@angular/core';
import {ThemeConstantService} from '../../services/theme-constant.service';
import authorMenu from '../../../../assets/data/global/header/author-menu.json';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./top-menu.scss']
})

export class HeaderComponent {

  searchVisible = false;
  quickViewVisible = false;
  isFolded: boolean;
  isExpand: boolean;
  appAuthorMenu = authorMenu.appAuthorMenu;

  constructor(private themeService: ThemeConstantService) {
  }

  signOut(): void {
    console.log('User signed out!');
  }

  toggleFold(): void {
    this.isFolded = !this.isFolded;
    this.themeService.toggleFold(this.isFolded);
  }

  toggleExpand(): void {
    this.isFolded = false;
    this.isExpand = !this.isExpand;
    this.themeService.toggleExpand(this.isExpand);
    this.themeService.toggleFold(this.isFolded);
  }

  searchToggle(): void {
    this.searchVisible = !this.searchVisible;
  }

  quickViewToggle(): void {
    this.quickViewVisible = !this.quickViewVisible;
  }
}
