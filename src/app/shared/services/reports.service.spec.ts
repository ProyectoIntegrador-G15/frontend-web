import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportsService, ReportApiResponse, ReportsPaginatedResponse } from './reports.service';
import { ApiService } from './api/api.service';
import { EndpointsService } from './api/endpoints.service';
import { environment } from '../../../environments/environment';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;
  let endpointsService: EndpointsService;
  const baseUrl = environment.apiUrl;

  const mockReportApiResponse: ReportApiResponse = {
    id: 1,
    creation_date: '2025-10-30T00:00:00',
    month: 10,
    year: 2025,
    created_by: 1,
    status: 'completed',
    created_at: '2025-10-30T10:00:00Z',
    completed_at: '2025-10-30T10:05:00Z'
  };

  const mockReportsPaginatedResponse: ReportsPaginatedResponse = {
    reports: [
      mockReportApiResponse,
      {
        id: 2,
        creation_date: '2025-09-30T00:00:00',
        month: 9,
        year: 2025,
        created_by: 1,
        status: 'processing',
        created_at: '2025-09-30T10:00:00Z',
        completed_at: null
      },
      {
        id: 3,
        creation_date: '2025-08-30T00:00:00',
        month: 8,
        year: 2025,
        created_by: 2,
        status: 'failed',
        created_at: '2025-08-30T10:00:00Z',
        completed_at: null
      }
    ],
    total: 3,
    total_pages: 1,
    page: 1,
    page_size: 5
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReportsService,
        ApiService,
        EndpointsService
      ]
    });

    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
    endpointsService = TestBed.inject(EndpointsService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReportsPaginated', () => {
    it('should fetch paginated reports successfully', () => {
      service.getReportsPaginated(1).subscribe((response) => {
        expect(response).toBeTruthy();
        expect(response.reports.length).toBe(3);
        expect(response.total).toBe(3);
        expect(response.page).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/reports/list?page=1`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      req.flush(mockReportsPaginatedResponse);
    });

    it('should fetch reports for page 2', () => {
      service.getReportsPaginated(2).subscribe((response) => {
        expect(response.reports.length).toBe(3);
        expect(response.page).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/reports/list?page=2`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      req.flush(mockReportsPaginatedResponse);
    });

    it('should handle error when fetching reports fails', (done) => {
      const errorMessage = 'Error del servidor';

      service.getReportsPaginated(1).subscribe({
        next: () => {
          done.fail('Should have failed');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });

      // ApiService tiene retry(2), así que hay 1 petición inicial + 2 reintentos = 3 peticiones
      const req1 = httpMock.expectOne((request) => 
        request.url.includes('/reports/list') && request.method === 'GET'
      );
      req1.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });

      const req2 = httpMock.expectOne((request) => 
        request.url.includes('/reports/list') && request.method === 'GET'
      );
      req2.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });

      const req3 = httpMock.expectOne((request) => 
        request.url.includes('/reports/list') && request.method === 'GET'
      );
      req3.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('createReport', () => {
    it('should create a report successfully', () => {
      const reportData = { month: 10, year: 2025, created_by: 1 };

      service.createReport(reportData).subscribe((report) => {
        expect(report).toBeTruthy();
        expect(report.id).toBe(1);
        expect(report.month).toBe(10);
        expect(report.year).toBe(2025);
        expect(report.status).toBe('completed');
      });

      const req = httpMock.expectOne(`${baseUrl}/reports/orders-by-seller`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.month).toBe(10);
      expect(req.request.body.year).toBe(2025);
      expect(req.request.body.created_by).toBe(1);
      req.flush(mockReportApiResponse);
    });

    it('should handle error when creating report fails', (done) => {
      const reportData = { month: 10, year: 2025, created_by: 1 };
      const errorMessage = 'No se pudo crear el reporte';

      service.createReport(reportData).subscribe({
        next: () => {
          done.fail('Should have failed');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/reports/orders-by-seller`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });

});

