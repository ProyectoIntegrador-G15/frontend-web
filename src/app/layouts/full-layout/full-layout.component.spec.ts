import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FullLayoutComponent } from './full-layout.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FullLayoutComponent', () => {
  let component: FullLayoutComponent;
  let fixture: ComponentFixture<FullLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FullLayoutComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FullLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a constructor', () => {
    expect(component.constructor).toBeDefined();
  });
});

