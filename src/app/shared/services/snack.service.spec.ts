import { TestBed } from '@angular/core/testing';
import { SnackService, SnackMessage } from './snack.service';
import { take } from 'rxjs/operators';

describe('SnackService', () => {
  let service: SnackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SnackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should emit success snack message', (done) => {
      service.snack$.pipe(take(1)).subscribe((snack: SnackMessage) => {
        expect(snack.type).toBe('success');
        expect(snack.message).toBe('Success message');
        expect(snack.duration).toBe(5000);
        done();
      });
      service.success('Success message');
    });

    it('should use custom duration', (done) => {
      service.snack$.pipe(take(1)).subscribe((snack: SnackMessage) => {
        expect(snack.duration).toBe(3000);
        done();
      });
      service.success('Success message', 3000);
    });
  });

  describe('error', () => {
    it('should emit error snack message', (done) => {
      service.snack$.pipe(take(1)).subscribe((snack: SnackMessage) => {
        expect(snack.type).toBe('error');
        expect(snack.message).toBe('Error message');
        done();
      });
      service.error('Error message');
    });
  });

  describe('warning', () => {
    it('should emit warning snack message', (done) => {
      service.snack$.pipe(take(1)).subscribe((snack: SnackMessage) => {
        expect(snack.type).toBe('warning');
        expect(snack.message).toBe('Warning message');
        done();
      });
      service.warning('Warning message');
    });
  });

  describe('info', () => {
    it('should emit info snack message', (done) => {
      service.snack$.pipe(take(1)).subscribe((snack: SnackMessage) => {
        expect(snack.type).toBe('info');
        expect(snack.message).toBe('Info message');
        done();
      });
      service.info('Info message');
    });
  });

  describe('remove', () => {
    it('should emit remove snack event', (done) => {
      service.removeSnack$.pipe(take(1)).subscribe((id: string) => {
        expect(id).toBe('test-id');
        done();
      });
      service.remove('test-id');
    });
  });
});

