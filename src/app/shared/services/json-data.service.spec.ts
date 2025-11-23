import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JsonDataService } from './json-data.service';

describe('JsonDataService', () => {
  let service: JsonDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JsonDataService]
    });
    service = TestBed.inject(JsonDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getData', () => {
    it('should fetch JSON data from assets', () => {
      const mockData = { sections: ['section1', 'section2'] };

      service.getData().subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne('assets/data/pages/knowledgeSection.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should handle empty data', () => {
      const mockData = {};

      service.getData().subscribe(data => {
        expect(data).toEqual(mockData);
      });

      const req = httpMock.expectOne('assets/data/pages/knowledgeSection.json');
      req.flush(mockData);
    });

    it('should handle error when fetching data fails', () => {
      service.getData().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne('assets/data/pages/knowledgeSection.json');
      req.error(new ProgressEvent('error'));
    });
  });
});

