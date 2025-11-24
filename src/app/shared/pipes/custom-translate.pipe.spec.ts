import { CustomTranslatePipe } from './custom-translate.pipe';
import { TranslateService } from '@ngx-translate/core';

describe('CustomTranslatePipe', () => {
  let pipe: CustomTranslatePipe;
  let translateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant']);
    translateServiceSpy.instant.and.returnValue('translated text');
    
    pipe = new CustomTranslatePipe(translateServiceSpy);
    translateService = translateServiceSpy;
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call translateService.instant with key', () => {
    const result = pipe.transform('test.key');
    expect(translateService.instant).toHaveBeenCalledWith('test.key');
    expect(result).toBe('translated text');
  });

  it('should return translated text', () => {
    translateService.instant.and.returnValue('Hello World');
    const result = pipe.transform('greeting');
    expect(result).toBe('Hello World');
  });
});

