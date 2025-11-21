import { CurrencyPlaceholderPipe } from './currency-placeholder.pipe';
import { LanguageService } from '../services/language.service';

describe('CurrencyPlaceholderPipe', () => {
  let pipe: CurrencyPlaceholderPipe;
  let languageService: jasmine.SpyObj<LanguageService>;

  beforeEach(() => {
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', ['getCurrentCurrency']);
    languageServiceSpy.getCurrentCurrency.and.returnValue({ symbol: '$' });
    
    pipe = new CurrencyPlaceholderPipe(languageServiceSpy);
    languageService = languageServiceSpy;
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should replace placeholder with currency symbol', () => {
    const result = pipe.transform('##.###');
    expect(result).toBe('$##.###');
  });

  it('should return empty string for empty value', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null as any);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined as any);
    expect(result).toBe('');
  });
});

