import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSelectorComponent } from './language-selector.component';
import { LanguageService, Language } from '../../services/language.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let languageService: jasmine.SpyObj<LanguageService>;
  let currentLanguageSubject: BehaviorSubject<string>;

  const mockLanguages: Language[] = [
    {
      code: 'es-CO',
      name: 'Español',
      flag: '🇨🇴',
      country: 'Colombia',
      locale: 'es-CO',
      flagImage: 'assets/images/others/flags/colombia.svg',
      currency: { code: 'COP', symbol: '$', name: 'Peso colombiano' }
    },
    {
      code: 'en-US',
      name: 'English',
      flag: '🇺🇸',
      country: 'United States',
      locale: 'en-US',
      flagImage: 'assets/images/others/flags/usa.svg',
      currency: { code: 'USD', symbol: 'USD', name: 'US Dollar' }
    }
  ];

  beforeEach(async () => {
    currentLanguageSubject = new BehaviorSubject<string>('es-CO');
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', [
      'getAvailableLanguages',
      'getCurrentLanguageInfo',
      'setLanguage'
    ], {
      currentLanguage$: currentLanguageSubject.asObservable()
    });

    languageServiceSpy.getAvailableLanguages.and.returnValue(mockLanguages);
    languageServiceSpy.getCurrentLanguageInfo.and.returnValue(mockLanguages[0]);

    await TestBed.configureTestingModule({
      declarations: [LanguageSelectorComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: LanguageService, useValue: languageServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    languageService = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with available languages', () => {
    fixture.detectChanges();
    expect(component.availableLanguages).toEqual(mockLanguages);
    expect(languageService.getAvailableLanguages).toHaveBeenCalled();
  });

  it('should initialize with current language', () => {
    fixture.detectChanges();
    expect(component.currentLanguage).toEqual(mockLanguages[0]);
    expect(component.currentLanguageCode).toBe('es-CO');
  });

  it('should update current language when language changes', () => {
    fixture.detectChanges();
    languageService.getCurrentLanguageInfo.and.returnValue(mockLanguages[1]);
    currentLanguageSubject.next('en-US');
    fixture.detectChanges();
    expect(component.currentLanguageCode).toBe('en-US');
  });

  it('should toggle dropdown', () => {
    expect(component.showDropdown).toBe(false);
    component.toggleDropdown();
    expect(component.showDropdown).toBe(true);
    component.toggleDropdown();
    expect(component.showDropdown).toBe(false);
  });

  it('should change language and close dropdown', () => {
    component.showDropdown = true;
    component.changeLanguage('en-US');
    expect(languageService.setLanguage).toHaveBeenCalledWith('en-US');
    expect(component.showDropdown).toBe(false);
  });
});

