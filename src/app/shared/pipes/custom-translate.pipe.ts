import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'customTranslate',
  standalone: false,
  pure: false
})
export class CustomTranslatePipe implements PipeTransform {

  constructor(private translateService: TranslateService) {}

  transform(key: string): string {
    return this.translateService.instant(key);
  }
}
