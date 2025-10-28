import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'currencyPlaceholder',
  pure: false
})
export class CurrencyPlaceholderPipe implements PipeTransform {

  constructor(private languageService: LanguageService) {}

  transform(value: string): string {
    if (!value) return '';
    
    const currency = this.languageService.getCurrentCurrency();
    const symbol = currency.symbol;
    
    // Reemplazar ##.### con el símbolo de moneda
    return value.replace('##.###', `${symbol}##.###`);
  }
}
