import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CodeBoxService, DemoCode } from './codebox.service';

describe('CodeBoxService', () => {
  let service: CodeBoxService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CodeBoxService]
    });
    service = TestBed.inject(CodeBoxService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCode', () => {
    it('should fetch code from assets when not cached', () => {
      const componentId = 'button';
      const mockCode: DemoCode = {
        rawCode: '<button>Click me</button>',
        highlightCode: '<span class="hljs-tag">&lt;button&gt;</span>Click me<span class="hljs-tag">&lt;/button&gt;</span>'
      };

      service.getCode(componentId).subscribe(code => {
        expect(code).toEqual(mockCode);
      });

      const req = httpMock.expectOne(`./assets/codes/${componentId}.json`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('json');
      req.flush(mockCode);
    });

    it('should return cached code on subsequent calls', () => {
      const componentId = 'input';
      const mockCode: DemoCode = {
        rawCode: '<input type="text">',
        highlightCode: '<span class="hljs-tag">&lt;input&gt;</span>'
      };

      // First call - should fetch from HTTP
      service.getCode(componentId).subscribe(code => {
        expect(code).toEqual(mockCode);
      });

      const req = httpMock.expectOne(`./assets/codes/${componentId}.json`);
      req.flush(mockCode);

      // Second call - should return from cache
      service.getCode(componentId).subscribe(code => {
        expect(code).toEqual(mockCode);
      });

      // No additional HTTP request should be made
      httpMock.expectNone(`./assets/codes/${componentId}.json`);
    });

    it('should strip "components-" prefix from component ID', () => {
      const componentId = 'components-table';
      const mockCode: DemoCode = {
        rawCode: '<table></table>',
        highlightCode: '<span>table</span>'
      };

      service.getCode(componentId).subscribe();

      const req = httpMock.expectOne('./assets/codes/table.json');
      expect(req.request.url).toBe('./assets/codes/table.json');
      req.flush(mockCode);
    });

    it('should handle component ID without prefix', () => {
      const componentId = 'modal';
      const mockCode: DemoCode = {
        rawCode: '<div class="modal"></div>',
        highlightCode: '<span>modal</span>'
      };

      service.getCode(componentId).subscribe();

      const req = httpMock.expectOne('./assets/codes/modal.json');
      req.flush(mockCode);
    });

    it('should cache code in codeMap', () => {
      const componentId = 'select';
      const mockCode: DemoCode = {
        rawCode: '<select></select>',
        highlightCode: '<span>select</span>'
      };

      service.getCode(componentId).subscribe();

      const req = httpMock.expectOne(`./assets/codes/${componentId}.json`);
      req.flush(mockCode);

      // Verify it's cached
      expect(service.codeMap.has(componentId)).toBe(true);
      expect(service.codeMap.get(componentId)).toEqual(mockCode);
    });

    it('should handle HTTP errors', () => {
      const componentId = 'nonexistent';

      service.getCode(componentId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`./assets/codes/${componentId}.json`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('language$ and theme$', () => {
    it('should have language$ ReplaySubject', (done) => {
      service.language$.next('typescript');
      
      service.language$.subscribe(lang => {
        expect(lang).toBe('typescript');
        done();
      });
    });

    it('should have theme$ ReplaySubject', (done) => {
      service.theme$.next('dark');
      
      service.theme$.subscribe(theme => {
        expect(theme).toBe('dark');
        done();
      });
    });

    it('should replay last value to new subscribers', (done) => {
      service.language$.next('javascript');
      service.language$.next('python');
      
      // New subscriber should get the last value
      service.language$.subscribe(lang => {
        expect(lang).toBe('python');
        done();
      });
    });
  });
});

