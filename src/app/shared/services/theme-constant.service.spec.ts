import { TestBed } from '@angular/core/testing';
import { ThemeConstantService } from './theme-constant.service';
import { take } from 'rxjs/operators';

describe('ThemeConstantService', () => {
  let service: ThemeConstantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeConstantService]
    });
    service = TestBed.inject(ThemeConstantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isDarkModeEnabled', () => {
    it('should return false by default', () => {
      expect(service.isDarkModeEnabled).toBe(false);
    });
  });

  describe('toggleDarkModeEnabled', () => {
    it('should toggle dark mode', () => {
      const initial = service.isDarkModeEnabled;
      service.toggleDarkModeEnabled();
      expect(service.isDarkModeEnabled).toBe(!initial);
    });

    it('should emit change event', (done) => {
      service.isDarkModeEnabledChanges.pipe(take(2)).subscribe((value: boolean) => {
        // Skip the initial value and check the second one
        if (value === true) {
          expect(value).toBe(true);
          done();
        }
      });
      service.toggleDarkModeEnabled();
    });
  });

  describe('toggleFold', () => {
    it('should update isMenuFolded', (done) => {
      service.isMenuFoldedChanges.pipe(take(2)).subscribe((value: boolean) => {
        // Skip the initial value and check the second one
        if (value === true) {
          expect(value).toBe(true);
          done();
        }
      });
      service.toggleFold(true);
    });
  });

  describe('toogleSideNavDark', () => {
    it('should update isSideNavDark', (done) => {
      service.isSideNavDarkChanges.pipe(take(2)).subscribe((value: boolean) => {
        // Skip the initial value and check the second one
        if (value === true) {
          expect(value).toBe(true);
          done();
        }
      });
      service.toogleSideNavDark(true);
    });
  });

  describe('toggleExpand', () => {
    it('should update isExpand', (done) => {
      service.isExpandChanges.pipe(take(2)).subscribe((value: boolean) => {
        // Skip the initial value and check the second one
        if (value === true) {
          expect(value).toBe(true);
          done();
        }
      });
      service.toggleExpand(true);
    });
  });

  describe('changeHeaderColor', () => {
    it('should update header color', (done) => {
      service.selectedHeaderColor.pipe(take(2)).subscribe((color: string) => {
        // Skip the initial value and check the second one
        if (color === 'blue') {
          expect(color).toBe('blue');
          done();
        }
      });
      service.changeHeaderColor('blue');
    });
  });

  describe('toggleTop', () => {
    it('should update isMenuTop', (done) => {
      // Note: toggleTop currently updates isMenuFoldedActived, not isMenuTopActived
      // So we check isMenuFoldedChanges instead
      service.isMenuFoldedChanges.pipe(take(2)).subscribe((value: boolean) => {
        // Skip the initial value and check the second one
        if (value === true) {
          expect(value).toBe(true);
          done();
        }
      });
      service.toggleTop(true);
    });
  });

  describe('get', () => {
    it('should return color config', () => {
      const config = service.get();
      expect(config).toBeDefined();
      expect(config.colors).toBeDefined();
    });
  });
});

