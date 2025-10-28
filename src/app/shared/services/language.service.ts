import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
  country: string;
  locale: string;
  flagImage: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>('es-CO');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private readonly LANG_KEY = 'medisupply-language';
  private readonly DEFAULT_LANG = 'es-CO';

  public readonly languages: Language[] = [
    { 
      code: 'en-US', 
      name: 'English', 
      flag: '🇺🇸', 
      country: 'Estados Unidos', 
      locale: 'en-US',
      flagImage: 'assets/images/others/flags/usa.svg'
    },
    { 
      code: 'es-CO', 
      name: 'Español', 
      flag: '🇨🇴', 
      country: 'Colombia', 
      locale: 'es-CO',
      flagImage: 'assets/images/others/flags/colombia.svg'
    },
    { 
      code: 'es-PE', 
      name: 'Español', 
      flag: '🇵🇪', 
      country: 'Perú', 
      locale: 'es-PE',
      flagImage: 'assets/images/others/flags/peru.svg'
    },
    { 
      code: 'es-EC', 
      name: 'Español', 
      flag: '🇪🇨', 
      country: 'Ecuador', 
      locale: 'es-EC',
      flagImage: 'assets/images/others/flags/ecuador.svg'
    },
    { 
      code: 'es-MX', 
      name: 'Español', 
      flag: '🇲🇽', 
      country: 'México', 
      locale: 'es-MX',
      flagImage: 'assets/images/others/flags/mexico.svg'
    }
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
    if (browserLang.startsWith('en')) {
      return 'en-US';
    } else if (browserLang.startsWith('es')) {
      // Detectar país específico si es posible
      if (browserLang.includes('CO')) return 'es-CO';
      if (browserLang.includes('PE')) return 'es-PE';
      if (browserLang.includes('EC')) return 'es-EC';
      if (browserLang.includes('MX')) return 'es-MX';
      // Por defecto Colombia si es español genérico
      return 'es-CO';
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
    const currentIndex = this.languages.findIndex(lang => lang.code === currentLang);
    const nextIndex = (currentIndex + 1) % this.languages.length;
    this.setLanguage(this.languages[nextIndex].code);
  }
}
