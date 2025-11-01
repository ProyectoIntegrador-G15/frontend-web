import {Component} from '@angular/core';
import {ThemeConstantService} from '../../services/theme-constant.service';
import authorMenu from '../../../../assets/data/global/header/author-menu.json';
import {AuthenticationService} from '../../services/authentication.service';
import {Router} from '@angular/router';

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

  constructor(private themeService: ThemeConstantService, private auth: AuthenticationService, private router: Router) {
  }

  signOut(): void {
    this.auth.logout();
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
