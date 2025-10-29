import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Pipe, PipeTransform } from '@angular/core';

import { ReportsComponent } from './reports.component';

@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant']);

    await TestBed.configureTestingModule({
      declarations: [ 
        ReportsComponent,
        MockCustomTranslatePipe
      ],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct status text', () => {
    mockTranslateService.instant.and.returnValue('Completado');
    expect(component.getStatusText('completed')).toBe('Completado');
    
    mockTranslateService.instant.and.returnValue('Procesando');
    expect(component.getStatusText('processing')).toBe('Procesando');
    
    mockTranslateService.instant.and.returnValue('Fallido');
    expect(component.getStatusText('failed')).toBe('Fallido');
    
    mockTranslateService.instant.and.returnValue('Desconocido');
    expect(component.getStatusText('unknown')).toBe('Desconocido');
  });

  it('should get correct field error message', () => {
    mockTranslateService.instant.and.returnValue('Este campo es obligatorio');
    expect(component.getFieldError('test')).toBe('Este campo es obligatorio');
  });
});
