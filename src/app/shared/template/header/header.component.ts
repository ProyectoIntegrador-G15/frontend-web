import {Component, OnInit, OnDestroy} from '@angular/core';
import {ThemeConstantService} from '../../services/theme-constant.service';
import authorMenu from '../../../../assets/data/global/header/author-menu.json';
import {AuthenticationService} from '../../services/authentication.service';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./top-menu.scss']
})

export class HeaderComponent implements OnInit, OnDestroy {

  searchVisible = false;
  quickViewVisible = false;
  isFolded: boolean;
  isExpand: boolean;
  appAuthorMenu = authorMenu.appAuthorMenu;
  
  userName: string = '';
  userRole: string = '';
  userInitials: string = '';
  private userSubscription: Subscription;

  constructor(private themeService: ThemeConstantService, private auth: AuthenticationService, private router: Router) {
  }

  ngOnInit(): void {
    this.loadUserInfo();
    
    // Suscribirse a cambios en el usuario
    this.userSubscription = this.auth.currentUser.subscribe(() => {
      this.loadUserInfo();
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadUserInfo(): void {
    this.userName = this.auth.getUserName();
    this.userRole = this.auth.getUserRole();
    this.userInitials = this.auth.getUserInitials();
    
    // Si no hay nombre, usar email como fallback
    if (!this.userName) {
      const email = localStorage.getItem('authEmail') || '';
      this.userName = email || 'Usuario';
    }
    
    // Si no hay rol, usar un valor por defecto
    if (!this.userRole) {
      this.userRole = 'Usuario';
    }
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
