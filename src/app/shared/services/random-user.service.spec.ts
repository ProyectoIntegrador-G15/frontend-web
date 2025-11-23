import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RandomUserService } from './random-user.service';

describe('RandomUserService', () => {
  let service: RandomUserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RandomUserService]
    });
    service = TestBed.inject(RandomUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should fetch users with default parameters', () => {
      const mockResponse = { results: [] };

      service.getUsers(1, 10, 'name', 'asc', []).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === 'https://api.randomuser.me/' &&
               request.params.get('page') === '1' &&
               request.params.get('results') === '10' &&
               request.params.get('sortField') === 'name' &&
               request.params.get('sortOrder') === 'asc';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include gender parameters when provided', () => {
      const mockResponse = { results: [] };
      const genders = ['male', 'female'];

      service.getUsers(2, 20, 'email', 'desc', genders).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === 'https://api.randomuser.me/' &&
               request.params.get('page') === '2' &&
               request.params.get('results') === '20' &&
               request.params.get('sortField') === 'email' &&
               request.params.get('sortOrder') === 'desc' &&
               request.params.getAll('gender').length === 2 &&
               request.params.getAll('gender').includes('male') &&
               request.params.getAll('gender').includes('female');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty genders array', () => {
      const mockResponse = { results: [] };

      service.getUsers(1, 10, 'name', 'asc', []).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === 'https://api.randomuser.me/' &&
               request.params.get('page') === '1' &&
               request.params.get('results') === '10' &&
               request.params.get('sortField') === 'name' &&
               request.params.get('sortOrder') === 'asc' &&
               !request.params.has('gender');
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle multiple genders', () => {
      const mockResponse = { results: [] };
      const genders = ['male', 'female', 'other'];

      service.getUsers(1, 10, 'name', 'asc', genders).subscribe(data => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) => {
        return request.params.getAll('gender').length === 3;
      });
      req.flush(mockResponse);
    });
  });
});

