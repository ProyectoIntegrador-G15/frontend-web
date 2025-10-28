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
        <span class="flag">{{ currentLanguage.flag }}</span>
        <span class="language-name">{{ currentLanguage.name }}</span>
        <span class="dropdown-arrow">▼</span>
      </button>

      <div class="dropdown-menu" [class.show]="showDropdown">
        <div
          *ngFor="let language of availableLanguages"
          class="language-option"
          [class.active]="language.code === currentLanguageCode"
          (click)="changeLanguage(language.code)">

          <span class="flag">{{ language.flag }}</span>
          <span class="language-name">{{ language.name }}</span>
          <span
            *ngIf="language.code === currentLanguageCode"
            class="check-icon">✓</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .language-selector {
      position: relative;
      display: inline-block;
    }

    .language-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .language-btn:hover {
      border-color: #1890ff;
      color: #1890ff;
    }

    .flag {
      font-size: 16px;
    }

    .language-name {
      font-weight: 500;
    }

    .dropdown-arrow {
      font-size: 10px;
      transition: transform 0.2s ease;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 160px;
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
    }

    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .language-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .language-option:hover {
      background-color: #f5f5f5;
    }

    .language-option.active {
      background-color: #e6f7ff;
      color: #1890ff;
    }

    .check-icon {
      margin-left: auto;
      font-size: 14px;
      color: #1890ff;
    }

    /* Dark mode support */
    :host-context(.dark) .language-btn {
      background: #1f1f1f;
      border-color: #434343;
      color: #fff;
    }

    :host-context(.dark) .dropdown-menu {
      background: #1f1f1f;
      border-color: #434343;
    }

    :host-context(.dark) .language-option:hover {
      background-color: #2f2f2f;
    }

    :host-context(.dark) .language-option.active {
      background-color: #111b26;
    }
  `]
})
export class LanguageSelectorComponent implements OnInit {
  currentLanguage: Language = { code: 'es', name: 'Español', flag: '🇪🇸' };
  currentLanguageCode: string = 'es';
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
