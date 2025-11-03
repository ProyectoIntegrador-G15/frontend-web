import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackButtonComponent } from './back-button.component';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('BackButtonComponent', () => {
  let component: BackButtonComponent;
  let fixture: ComponentFixture<BackButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackButtonComponent],
      schemas: [NO_ERRORS_SCHEMA] // Ignorar errores de iconos de Ant Design
    }).compileComponents();

    fixture = TestBed.createComponent(BackButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onBackClick', () => {
    it('should emit backClick event when button is clicked', () => {
      spyOn(component.backClick, 'emit');

      component.onBackClick();

      expect(component.backClick.emit).toHaveBeenCalled();
    });

    it('should emit event when button element is clicked', () => {
      spyOn(component.backClick, 'emit');

      const button = fixture.debugElement.query(By.css('.back-button'));
      button.nativeElement.click();

      expect(component.backClick.emit).toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render button', () => {
      const button = fixture.debugElement.query(By.css('.back-button'));
      expect(button).toBeTruthy();
    });

    it('should have correct styles applied', () => {
      const button = fixture.debugElement.query(By.css('.back-button'));
      expect(button.nativeElement.classList.contains('back-button')).toBe(true);
    });
  });

  describe('Multiple clicks', () => {
    it('should emit event on each click', () => {
      spyOn(component.backClick, 'emit');

      component.onBackClick();
      component.onBackClick();
      component.onBackClick();

      expect(component.backClick.emit).toHaveBeenCalledTimes(3);
    });
  });
});


