import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'currencyFormat',
  pure: false
})
export class CurrencyFormatPipe implements PipeTransform {

  constructor(private languageService: LanguageService) {}

  transform(value: number | string): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numericValue)) {
      return '';
    }

    return this.languageService.formatPrice(numericValue);
  }
}
