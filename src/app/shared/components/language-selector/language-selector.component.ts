import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  template: `
    <div class="language-selector">
      <button 
        class="language-btn"
        (click)="toggleDropdown()">
        <div class="flag-container">
          <img [src]="currentLanguage.flagImage" [alt]="currentLanguage.country" class="flag-image">
          <span class="language-name">{{ currentLanguage.country }}</span>
        </div>
        <span class="dropdown-arrow">▼</span>
      </button>
      
      <div class="dropdown-menu" [class.show]="showDropdown">
        <div 
          *ngFor="let language of availableLanguages"
          class="language-option"
          [class.active]="language.code === currentLanguageCode"
          (click)="changeLanguage(language.code)">
          
          <div class="flag-container">
            <img [src]="language.flagImage" [alt]="language.country" class="flag-image">
            <span class="language-name">{{ language.country }}</span>
          </div>
          <span 
            *ngIf="language.code === currentLanguageCode" 
            class="check-icon">✓</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./language-selector.component.css']
})
export class LanguageSelectorComponent implements OnInit {
  currentLanguage: Language = { 
    code: 'es-CO', 
    name: 'Español', 
    flag: '🇨🇴', 
    country: 'Colombia', 
    locale: 'es-CO',
    flagImage: 'assets/images/others/flags/colombia.svg'
  };
  currentLanguageCode: string = 'es-CO';
  availableLanguages: Language[] = [];
  showDropdown: boolean = false;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.availableLanguages = this.languageService.getAvailableLanguages();

    this.languageService.currentLanguage$.subscribe(langCode => {
      this.currentLanguageCode = langCode;
      this.currentLanguage = this.languageService.getCurrentLanguageInfo();
    });
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  changeLanguage(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
    this.showDropdown = false;
  }
}
