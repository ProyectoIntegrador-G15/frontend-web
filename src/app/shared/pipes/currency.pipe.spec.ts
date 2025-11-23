import { CurrencyFormatPipe } from './currency.pipe';
import { LanguageService } from '../services/language.service';

describe('CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;
  let languageService: jasmine.SpyObj<LanguageService>;

  beforeEach(() => {
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', ['formatPrice']);
    languageServiceSpy.formatPrice.and.returnValue('$1,000.00');
    
    pipe = new CurrencyFormatPipe(languageServiceSpy);
    languageService = languageServiceSpy;
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format number value', () => {
    const result = pipe.transform(1000);
    expect(languageService.formatPrice).toHaveBeenCalledWith(1000);
    expect(result).toBe('$1,000.00');
  });

  it('should format string value', () => {
    const result = pipe.transform('1000');
    expect(languageService.formatPrice).toHaveBeenCalledWith(1000);
    expect(result).toBe('$1,000.00');
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
    expect(languageService.formatPrice).not.toHaveBeenCalled();
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
    expect(languageService.formatPrice).not.toHaveBeenCalled();
  });

  it('should return empty string for empty string', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
    expect(languageService.formatPrice).not.toHaveBeenCalled();
  });

  it('should return empty string for invalid string', () => {
    const result = pipe.transform('invalid');
    expect(result).toBe('');
    expect(languageService.formatPrice).not.toHaveBeenCalled();
  });
});

