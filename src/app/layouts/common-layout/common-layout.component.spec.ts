import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { CommonLayoutComponent } from './common-layout.component';
import { ThemeConstantService } from '../../shared/services/theme-constant.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CommonLayoutComponent', () => {
  let component: CommonLayoutComponent;
  let fixture: ComponentFixture<CommonLayoutComponent>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let themeService: jasmine.SpyObj<ThemeConstantService>;

  const mockRouterEvents = new BehaviorSubject<any>(null);
  const mockIsMenuTopChanges = new BehaviorSubject<boolean>(false);
  const mockIsMenuFoldedChanges = new BehaviorSubject<boolean>(false);
  const mockIsSideNavDarkChanges = new BehaviorSubject<boolean>(false);
  const mockSelectedHeaderColor = new BehaviorSubject<string>('default');
  const mockIsExpandChanges = new BehaviorSubject<boolean>(false);

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: mockRouterEvents.asObservable()
    });
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      firstChild: null,
      root: {
        routeConfig: null,
        firstChild: null
      }
    });
    const themeServiceSpy = jasmine.createSpyObj('ThemeConstantService', [], {
      isMenuTopChanges: mockIsMenuTopChanges.asObservable(),
      isMenuFoldedChanges: mockIsMenuFoldedChanges.asObservable(),
      isSideNavDarkChanges: mockIsSideNavDarkChanges.asObservable(),
      selectedHeaderColor: mockSelectedHeaderColor.asObservable(),
      isExpandChanges: mockIsExpandChanges.asObservable()
    });

    await TestBed.configureTestingModule({
      declarations: [CommonLayoutComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: ThemeConstantService, useValue: themeServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CommonLayoutComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    themeService = TestBed.inject(ThemeConstantService) as jasmine.SpyObj<ThemeConstantService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize breadcrumbs observable', () => {
      Object.defineProperty(activatedRoute, 'root', {
        value: {
          routeConfig: null,
          firstChild: null
        },
        writable: true
      });
      component.ngOnInit();
      expect(component.breadcrumbs$).toBeDefined();
    });

    it('should subscribe to theme service changes', () => {
      component.ngOnInit();
      mockIsMenuTopChanges.next(true);
      expect(component.isFoldedTop).toBe(true);
    });

    it('should subscribe to isMenuFoldedChanges', () => {
      component.ngOnInit();
      mockIsMenuFoldedChanges.next(true);
      expect(component.isFolded).toBe(true);
    });

    it('should subscribe to isSideNavDarkChanges', () => {
      component.ngOnInit();
      mockIsSideNavDarkChanges.next(true);
      expect(component.isSideNavDark).toBe(true);
    });

    it('should subscribe to selectedHeaderColor', () => {
      component.ngOnInit();
      mockSelectedHeaderColor.next('blue');
      expect(component.selectedHeaderColor).toBe('blue');
    });

    it('should subscribe to isExpandChanges', () => {
      component.ngOnInit();
      mockIsExpandChanges.next(true);
      expect(component.isExpand).toBe(true);
    });
  });

  describe('buildBreadCrumb', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return empty array if route has no config', () => {
      const route = {
        routeConfig: null,
        firstChild: null
      } as any;
      const result = (component as any).buildBreadCrumb(route);
      expect(result).toEqual([]);
    });

    it('should build breadcrumb from route config data', () => {
      const route = {
        routeConfig: {
          path: 'products',
          data: { title: 'Products' }
        },
        firstChild: null
      } as any;
      const result = (component as any).buildBreadCrumb(route);
      expect(result.length).toBe(1);
      expect(result[0].label).toBe('Products');
    });

    it('should build breadcrumb with default dashboard if no route config', () => {
      const route = {
        routeConfig: null,
        firstChild: null
      } as any;
      const result = (component as any).buildBreadCrumb(route);
      expect(result).toEqual([]);
    });

    it('should recursively build breadcrumbs for nested routes', () => {
      const childRoute = {
        routeConfig: {
          path: 'detail',
          data: { title: 'Detail' }
        },
        firstChild: null
      } as any;
      const parentRoute = {
        routeConfig: {
          path: 'products',
          data: { title: 'Products' }
        },
        firstChild: childRoute
      } as any;
      const result = (component as any).buildBreadCrumb(parentRoute);
      expect(result.length).toBe(2);
      expect(result[0].label).toBe('Products');
      expect(result[1].label).toBe('Detail');
    });

    it('should not add breadcrumb if label is empty', () => {
      const route = {
        routeConfig: {
          path: 'test',
          data: {}
        },
        firstChild: null
      } as any;
      const result = (component as any).buildBreadCrumb(route);
      expect(result).toEqual([]);
    });
  });

  describe('contentHeaderDisplay', () => {
    it('should update contentHeaderDisplay on navigation end', (done) => {
      const childRoute = {
        snapshot: {
          data: { headerDisplay: 'Test Header' }
        },
        firstChild: null
      } as any;
      Object.defineProperty(activatedRoute, 'firstChild', {
        value: childRoute,
        writable: true
      });

      component.ngOnInit();
      mockRouterEvents.next(new NavigationEnd(1, '/test', '/test'));

      setTimeout(() => {
        expect(component.contentHeaderDisplay).toBe('Test Header');
        done();
      }, 100);
    });

    it('should handle navigation end with no header display', (done) => {
      const childRoute = {
        snapshot: {
          data: {}
        },
        firstChild: null
      } as any;
      Object.defineProperty(activatedRoute, 'firstChild', {
        value: childRoute,
        writable: true
      });

      component.ngOnInit();
      mockRouterEvents.next(new NavigationEnd(1, '/test', '/test'));

      setTimeout(() => {
        expect(component.contentHeaderDisplay).toBeNull();
        done();
      }, 100);
    });
  });
});

