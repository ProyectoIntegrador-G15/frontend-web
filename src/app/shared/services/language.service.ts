import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>('es');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private readonly LANG_KEY = 'medisupply-language';
  private readonly DEFAULT_LANG = 'es';

  public readonly languages: Language[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  constructor(private translateService: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Obtener idioma guardado o usar el idioma del navegador
    const savedLanguage = localStorage.getItem(this.LANG_KEY);
    const browserLanguage = this.getBrowserLanguage();
    const languageToUse = savedLanguage || browserLanguage || this.DEFAULT_LANG;

    // Configurar el idioma por defecto primero
    this.translateService.setDefaultLang(this.DEFAULT_LANG);
    this.translateService.use(languageToUse);

    this.setLanguage(languageToUse);
  }

  private getBrowserLanguage(): string {
    const browserLang = navigator.language || navigator.languages[0];

    // Mapear idiomas del navegador a nuestros códigos
    if (browserLang.startsWith('es')) {
      return 'es';
    } else if (browserLang.startsWith('en')) {
      return 'en';
    }

    return this.DEFAULT_LANG;
  }

  public setLanguage(languageCode: string): void {
    if (this.isValidLanguage(languageCode)) {
      this.translateService.use(languageCode);
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem(this.LANG_KEY, languageCode);

      // Actualizar también el locale de ng-zorro
      this.updateNgZorroLocale(languageCode);
    }
  }

  private isValidLanguage(languageCode: string): boolean {
    return this.languages.some(lang => lang.code === languageCode);
  }

  private updateNgZorroLocale(languageCode: string): void {
    // Aquí puedes agregar lógica para cambiar el locale de ng-zorro si es necesario
    // Por ahora mantenemos en_US como está configurado
  }

  public getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  public getCurrentLanguageInfo(): Language {
    const currentCode = this.getCurrentLanguage();
    return this.languages.find(lang => lang.code === currentCode) || this.languages[0];
  }

  public getAvailableLanguages(): Language[] {
    return [...this.languages];
  }

  public toggleLanguage(): void {
    const currentLang = this.getCurrentLanguage();
    const newLang = currentLang === 'es' ? 'en' : 'es';
    this.setLanguage(newLang);
  }
}
