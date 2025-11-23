import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnackContainerComponent } from './snack-container.component';
import { SnackService, SnackMessage } from '../../services/snack.service';
import { Subject } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';

describe('SnackContainerComponent', () => {
  let component: SnackContainerComponent;
  let fixture: ComponentFixture<SnackContainerComponent>;
  let snackService: jasmine.SpyObj<SnackService>;
  let snackSubject: Subject<SnackMessage>;
  let removeSnackSubject: Subject<string>;

  beforeEach(async () => {
    snackSubject = new Subject<SnackMessage>();
    removeSnackSubject = new Subject<string>();

    const snackServiceSpy = jasmine.createSpyObj('SnackService', [], {
      snack$: snackSubject.asObservable(),
      removeSnack$: removeSnackSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [SnackContainerComponent, NzIconModule],
      providers: [
        { provide: SnackService, useValue: snackServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SnackContainerComponent);
    component = fixture.componentInstance;
    snackService = TestBed.inject(SnackService) as jasmine.SpyObj<SnackService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty snacks array', () => {
    expect(component.snacks).toEqual([]);
  });

  it('should add snack when snack$ emits', () => {
    fixture.detectChanges();
    const snack: SnackMessage = {
      id: '1',
      type: 'success',
      message: 'Test message',
      duration: 5000
    };
    snackSubject.next(snack);
    expect(component.snacks.length).toBe(1);
    expect(component.snacks[0]).toEqual(snack);
  });

  it('should remove snack when removeSnack$ emits', () => {
    fixture.detectChanges();
    const snack1: SnackMessage = {
      id: '1',
      type: 'success',
      message: 'Message 1',
      duration: 5000
    };
    const snack2: SnackMessage = {
      id: '2',
      type: 'error',
      message: 'Message 2',
      duration: 5000
    };
    snackSubject.next(snack1);
    snackSubject.next(snack2);
    expect(component.snacks.length).toBe(2);
    
    removeSnackSubject.next('1');
    expect(component.snacks.length).toBe(1);
    expect(component.snacks[0].id).toBe('2');
  });

  it('should remove snack by id', () => {
    fixture.detectChanges();
    const snack1: SnackMessage = {
      id: '1',
      type: 'success',
      message: 'Message 1',
      duration: 5000
    };
    const snack2: SnackMessage = {
      id: '2',
      type: 'error',
      message: 'Message 2',
      duration: 5000
    };
    snackSubject.next(snack1);
    snackSubject.next(snack2);
    
    component.removeSnack('1');
    expect(component.snacks.length).toBe(1);
    expect(component.snacks[0].id).toBe('2');
  });

  it('should return correct icon type for success', () => {
    expect(component.getIconType('success')).toBe('check-circle');
  });

  it('should return correct icon type for error', () => {
    expect(component.getIconType('error')).toBe('close-circle');
  });

  it('should return correct icon type for warning', () => {
    expect(component.getIconType('warning')).toBe('exclamation-circle');
  });

  it('should return correct icon type for info', () => {
    expect(component.getIconType('info')).toBe('info-circle');
  });

  it('should return default icon type for unknown type', () => {
    expect(component.getIconType('unknown')).toBe('info-circle');
  });

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const unsubscribeSpy = spyOn(component['subscriptions'][0], 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

