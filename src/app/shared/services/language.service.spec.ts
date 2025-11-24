import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
    translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
    translateServiceSpy.use.and.returnValue(of('es-CO'));

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    });

    service = TestBed.inject(LanguageService);
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    
    // Limpiar localStorage antes de cada test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentLanguage', () => {
    it('should return current language', () => {
      const lang = service.getCurrentLanguage();
      expect(lang).toBeDefined();
    });
  });

  describe('getCurrentLanguageInfo', () => {
    it('should return language info for current language', () => {
      const info = service.getCurrentLanguageInfo();
      expect(info).toBeDefined();
      expect(info.code).toBeDefined();
      expect(info.name).toBeDefined();
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return all available languages', () => {
      const languages = service.getAvailableLanguages();
      expect(languages.length).toBeGreaterThan(0);
      expect(languages[0].code).toBeDefined();
    });
  });

  describe('getCurrentCurrency', () => {
    it('should return currency for current language', () => {
      const currency = service.getCurrentCurrency();
      expect(currency).toBeDefined();
      expect(currency.code).toBeDefined();
      expect(currency.symbol).toBeDefined();
      expect(currency.name).toBeDefined();
    });
  });

  describe('formatPrice', () => {
    it('should format price with currency', () => {
      const formatted = service.formatPrice(1000);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });

    it('should format different prices', () => {
      const price1 = service.formatPrice(100);
      const price2 = service.formatPrice(1000.50);
      expect(price1).toBeDefined();
      expect(price2).toBeDefined();
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return currency symbol', () => {
      const symbol = service.getCurrencySymbol();
      expect(symbol).toBeDefined();
      expect(typeof symbol).toBe('string');
    });
  });

  describe('getCurrencyCode', () => {
    it('should return currency code', () => {
      const code = service.getCurrencyCode();
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
    });
  });

  describe('setLanguage', () => {
    it('should set language if valid', () => {
      service.setLanguage('en-US');
      expect(translateService.use).toHaveBeenCalledWith('en-US');
      expect(localStorage.getItem('medisupply-language')).toBe('en-US');
    });

    it('should not set language if invalid', () => {
      const initialLang = service.getCurrentLanguage();
      service.setLanguage('invalid-lang');
      expect(service.getCurrentLanguage()).toBe(initialLang);
    });
  });

  describe('toggleLanguage', () => {
    it('should cycle through languages', () => {
      const initialLang = service.getCurrentLanguage();
      service.toggleLanguage();
      const newLang = service.getCurrentLanguage();
      expect(newLang).not.toBe(initialLang);
    });
  });

  describe('initializeLanguage', () => {
    it('should use saved language from localStorage', () => {
      localStorage.setItem('medisupply-language', 'en-US');
      
      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('en-US'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en-US');
    });

    it('should use browser language when no saved language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en-US'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('en-US'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalled();
    });

    it('should use default language when no saved or browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'fr-FR'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('es-CO'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('es-CO');
    });
  });

  describe('getBrowserLanguage', () => {
    it('should return en-US for English browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('en-US'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en-US');
    });

    it('should return es-CO for Spanish-CO browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'es-CO'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('es-CO'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('es-CO');
    });

    it('should return es-PE for Spanish-PE browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'es-PE'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('es-PE'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('es-PE');
    });

    it('should return es-EC for Spanish-EC browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'es-EC'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('es-EC'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('es-EC');
    });

    it('should return es-MX for Spanish-MX browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'es-MX'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('es-MX'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('es-MX');
    });

    it('should return es-CO for generic Spanish browser language', () => {
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'es'
      });

      TestBed.resetTestingModule();
      const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use']);
      translateServiceSpy.setDefaultLang.and.returnValue(of('es-CO'));
      translateServiceSpy.use.and.returnValue(of('es-CO'));

      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: TranslateService, useValue: translateServiceSpy }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(translateServiceSpy.use).toHaveBeenCalledWith('es-CO');
    });
  });

});

