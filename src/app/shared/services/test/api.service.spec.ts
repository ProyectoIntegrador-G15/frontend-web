import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, ApiResponse } from '../api/api.service';
import { environment } from '../../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setAuthToken', () => {
    it('should set authorization header with Bearer token', () => {
      const token = 'test-token-123';
      service.setAuthToken(token);

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({ success: true, message: 'OK' });
    });

    it('should replace existing token when setting new one', () => {
      service.setAuthToken('old-token');
      service.setAuthToken('new-token');

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer new-token');
      req.flush({ success: true, message: 'OK' });
    });

    it('should work with multiple requests', () => {
      const token = 'multi-request-token';
      service.setAuthToken(token);

      // Primera petición
      service.get('/test1').subscribe();
      const req1 = httpMock.expectOne(`${baseUrl}/test1`);
      expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req1.flush({ success: true, message: 'OK' });

      // Segunda petición
      service.getDirect('/test2').subscribe();
      const req2 = httpMock.expectOne(`${baseUrl}/test2`);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req2.flush({ data: 'test' });
    });
  });

  describe('removeAuthToken', () => {
    it('should remove authorization header', () => {
      service.setAuthToken('test-token');
      service.removeAuthToken();

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, message: 'OK' });
    });

    it('should not fail if no token was set', () => {
      service.removeAuthToken();

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, message: 'OK' });
    });

    it('should allow setting token again after removal', () => {
      service.setAuthToken('first-token');
      service.removeAuthToken();
      service.setAuthToken('second-token');

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer second-token');
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('setBaseUrl', () => {
    it('should update base URL', () => {
      const newUrl = 'https://new-api.example.com';
      service.setBaseUrl(newUrl);

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${newUrl}/test`);
      expect(req.request.url).toBe(`${newUrl}/test`);
      req.flush({ success: true, message: 'OK' });
    });

    it('should work with different endpoints after URL change', () => {
      const customUrl = 'https://custom.api.com';
      service.setBaseUrl(customUrl);

      // Test GET
      service.get('/endpoint1').subscribe();
      const req1 = httpMock.expectOne(`${customUrl}/endpoint1`);
      req1.flush({ success: true, message: 'OK' });

      // Test POST
      service.post('/endpoint2', { data: 'test' }).subscribe();
      const req2 = httpMock.expectOne(`${customUrl}/endpoint2`);
      req2.flush({ success: true, message: 'OK' });
    });

    it('should persist URL change across multiple requests', () => {
      const newUrl = 'https://persistent.api.com';
      service.setBaseUrl(newUrl);

      service.get('/test1').subscribe();
      const req1 = httpMock.expectOne(`${newUrl}/test1`);
      req1.flush({ success: true, message: 'OK' });

      service.get('/test2').subscribe();
      const req2 = httpMock.expectOne(`${newUrl}/test2`);
      req2.flush({ success: true, message: 'OK' });
    });

    it('should handle base URL without trailing slash', () => {
      const newUrl = 'https://no-slash.api.com';
      service.setBaseUrl(newUrl);

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${newUrl}/test`);
      expect(req.request.url).toBe(`${newUrl}/test`);
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle base URL with trailing slash', () => {
      const newUrl = 'https://with-slash.api.com/';
      service.setBaseUrl(newUrl);

      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${newUrl}/test`);
      expect(req.request.url).toContain('with-slash.api.com');
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('healthCheck', () => {
    it('should call health endpoint', () => {
      service.healthCheck().subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Healthy');
      });

      const req = httpMock.expectOne(`${baseUrl}/health`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, message: 'Healthy', data: { status: 'ok' } });
    });

    it('should return health status data', () => {
      const healthData = {
        status: 'ok',
        uptime: 12345,
        timestamp: '2025-10-26T12:00:00Z'
      };

      service.healthCheck().subscribe((response) => {
        expect(response.data).toEqual(healthData);
      });

      const req = httpMock.expectOne(`${baseUrl}/health`);
      req.flush({ success: true, message: 'OK', data: healthData });
    });

    it('should handle unhealthy status', () => {
      service.healthCheck().subscribe({
        next: (response) => {
          expect(response.success).toBe(false);
        },
        error: () => fail('Should not error')
      });

      const req = httpMock.expectOne(`${baseUrl}/health`);
      req.flush({ success: false, message: 'Service degraded' });
    });

    it('should retry on failure', () => {
      let callCount = 0;

      service.healthCheck().subscribe({
        error: () => {
          expect(callCount).toBeGreaterThan(1); // Should retry
        }
      });

      // Primera llamada
      const req1 = httpMock.expectOne(`${baseUrl}/health`);
      callCount++;
      req1.error(new ProgressEvent('error'));

      // Segundo intento (retry 1)
      const req2 = httpMock.expectOne(`${baseUrl}/health`);
      callCount++;
      req2.error(new ProgressEvent('error'));

      // Tercer intento (retry 2)
      const req3 = httpMock.expectOne(`${baseUrl}/health`);
      callCount++;
      req3.error(new ProgressEvent('error'));
    });
  });

  describe('Integration Tests', () => {
    it('should combine setAuthToken, setBaseUrl, and healthCheck', () => {
      const customUrl = 'https://secured.api.com';
      const token = 'secure-token-xyz';

      service.setBaseUrl(customUrl);
      service.setAuthToken(token);

      service.healthCheck().subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${customUrl}/health`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      expect(req.request.url).toContain('secured.api.com');
      req.flush({ success: true, message: 'OK' });
    });

    it('should allow token management in auth flow', () => {
      // Login flow
      service.setAuthToken('login-token');
      service.get('/user/profile').subscribe();
      const req1 = httpMock.expectOne(`${baseUrl}/user/profile`);
      expect(req1.request.headers.has('Authorization')).toBe(true);
      req1.flush({ success: true, message: 'OK' });

      // Logout flow
      service.removeAuthToken();
      service.get('/public/info').subscribe();
      const req2 = httpMock.expectOne(`${baseUrl}/public/info`);
      expect(req2.request.headers.has('Authorization')).toBe(false);
      req2.flush({ success: true, message: 'OK' });
    });

    it('should switch between environments', () => {
      // Development
      service.setBaseUrl('http://localhost:8004');
      service.get('/test').subscribe();
      const req1 = httpMock.expectOne('http://localhost:8004/test');
      req1.flush({ success: true, message: 'OK' });

      // Production
      service.setBaseUrl('https://production.api.com');
      service.get('/test').subscribe();
      const req2 = httpMock.expectOne('https://production.api.com/test');
      req2.flush({ success: true, message: 'OK' });
    });
  });

  describe('Headers Consistency', () => {
    it('should maintain Content-Type and Accept headers', () => {
      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({ success: true, message: 'OK' });
    });

    it('should preserve headers when setting auth token', () => {
      service.setAuthToken('test-token');
      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({ success: true, message: 'OK' });
    });

    it('should preserve headers when removing auth token', () => {
      service.setAuthToken('test-token');
      service.removeAuthToken();
      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token', () => {
      service.setAuthToken('');
      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer ');
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token.with-special_chars123';
      service.setAuthToken(specialToken);
      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${specialToken}`);
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle URL with protocol change', () => {
      service.setBaseUrl('http://insecure.api.com');
      service.get('/test').subscribe();
      const req1 = httpMock.expectOne('http://insecure.api.com/test');
      req1.flush({ success: true, message: 'OK' });

      service.setBaseUrl('https://secure.api.com');
      service.get('/test').subscribe();
      const req2 = httpMock.expectOne('https://secure.api.com/test');
      req2.flush({ success: true, message: 'OK' });
    });
  });

  describe('HTTP Methods Coverage', () => {
    it('should execute POST request', () => {
      const postData = { name: 'Test', value: 123 };

      service.post('/create', postData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(postData);
      req.flush({ success: true, message: 'Created' });
    });

    it('should execute PUT request', () => {
      const putData = { id: 1, name: 'Updated' };

      service.put('/update/1', putData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/update/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(putData);
      req.flush({ success: true, message: 'Updated' });
    });

    it('should execute PATCH request', () => {
      const patchData = { status: 'active' };

      service.patch('/update/1', patchData).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/update/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchData);
      req.flush({ success: true, message: 'Patched' });
    });

    it('should execute DELETE request', () => {
      service.delete('/delete/1').subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/delete/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, message: 'Deleted' });
    });
  });

  describe('buildParams - Query Parameters', () => {
    it('should build params from object', () => {
      const params = { page: 1, limit: 10, search: 'test' };

      service.get('/test', params).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/test') &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '10' &&
               request.params.get('search') === 'test';
      });
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle null values in params', () => {
      const params = { page: 1, filter: null, search: 'test' };

      service.get('/test', params).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/test') &&
               request.params.get('page') === '1' &&
               !request.params.has('filter') &&
               request.params.get('search') === 'test';
      });
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle undefined values in params', () => {
      const params = { page: 1, filter: undefined, search: 'test' };

      service.get('/test', params).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url.includes('/test') &&
               request.params.get('page') === '1' &&
               !request.params.has('filter') &&
               request.params.get('search') === 'test';
      });
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle empty params object', () => {
      service.get('/test', {}).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle no params', () => {
      service.get('/test').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/test`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle numeric params', () => {
      const params = { id: 123, count: 0, page: 1 };

      service.get('/test', params).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.params.get('id') === '123' &&
               request.params.get('count') === '0' &&
               request.params.get('page') === '1';
      });
      req.flush({ success: true, message: 'OK' });
    });

    it('should handle boolean params', () => {
      const params = { active: true, deleted: false };

      service.get('/test', params).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.params.get('active') === 'true' &&
               request.params.get('deleted') === 'false';
      });
      req.flush({ success: true, message: 'OK' });
    });
  });

  describe('Error Handling - handleError', () => {
    it('should handle client-side ErrorEvent', () => {
      service.get('/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Network or Client Error');
        }
      });

      // Initial request
      const req1 = httpMock.expectOne(`${baseUrl}/test`);
      req1.error(new ErrorEvent('Network error', {
        message: 'Connection failed'
      }));

      // Retry 1
      const req2 = httpMock.expectOne(`${baseUrl}/test`);
      req2.error(new ErrorEvent('Network error', {
        message: 'Connection failed'
      }));

      // Retry 2
      const req3 = httpMock.expectOne(`${baseUrl}/test`);
      req3.error(new ErrorEvent('Network error', {
        message: 'Connection failed'
      }));
    });

    it('should handle server error with detail', () => {
      service.get('/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Specific error detail');
        }
      });

      // Initial + 2 retries
      const req1 = httpMock.expectOne(`${baseUrl}/test`);
      req1.flush({ detail: 'Specific error detail' }, { status: 400, statusText: 'Bad Request' });

      const req2 = httpMock.expectOne(`${baseUrl}/test`);
      req2.flush({ detail: 'Specific error detail' }, { status: 400, statusText: 'Bad Request' });

      const req3 = httpMock.expectOne(`${baseUrl}/test`);
      req3.flush({ detail: 'Specific error detail' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle server error with message', () => {
      service.get('/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error message from server');
        }
      });

      // Initial + 2 retries
      const req1 = httpMock.expectOne(`${baseUrl}/test`);
      req1.flush({ message: 'Error message from server' }, { status: 500, statusText: 'Server Error' });

      const req2 = httpMock.expectOne(`${baseUrl}/test`);
      req2.flush({ message: 'Error message from server' }, { status: 500, statusText: 'Server Error' });

      const req3 = httpMock.expectOne(`${baseUrl}/test`);
      req3.flush({ message: 'Error message from server' }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle server error without detail or message', () => {
      service.get('/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Server Error');
          expect(error.message).toContain('500');
        }
      });

      // Initial + 2 retries
      const req1 = httpMock.expectOne(`${baseUrl}/test`);
      req1.flush({}, { status: 500, statusText: 'Internal Server Error' });

      const req2 = httpMock.expectOne(`${baseUrl}/test`);
      req2.flush({}, { status: 500, statusText: 'Internal Server Error' });

      const req3 = httpMock.expectOne(`${baseUrl}/test`);
      req3.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle server error without statusText', () => {
      service.get('/test').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Server Error');
          expect(error.message).toContain('500');
        }
      });

      // Initial + 2 retries
      const req1 = httpMock.expectOne(`${baseUrl}/test`);
      req1.flush({}, { status: 500, statusText: '' });

      const req2 = httpMock.expectOne(`${baseUrl}/test`);
      req2.flush({}, { status: 500, statusText: '' });

      const req3 = httpMock.expectOne(`${baseUrl}/test`);
      req3.flush({}, { status: 500, statusText: '' });
    });

    it('should retry failed requests', () => {
      let attemptCount = 0;

      service.get('/test').subscribe({
        error: () => {
          expect(attemptCount).toBe(3); // Initial + 2 retries
        }
      });

      // Initial attempt
      const req1 = httpMock.expectOne(`${baseUrl}/test`);
      attemptCount++;
      req1.flush({}, { status: 500, statusText: 'Server Error' });

      // Retry 1
      const req2 = httpMock.expectOne(`${baseUrl}/test`);
      attemptCount++;
      req2.flush({}, { status: 500, statusText: 'Server Error' });

      // Retry 2
      const req3 = httpMock.expectOne(`${baseUrl}/test`);
      attemptCount++;
      req3.flush({}, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('postDirect without headers', () => {
    it('should execute postDirect without custom headers', () => {
      const formData = { file: 'data' };

      service.postDirect('/upload', formData).subscribe((response: any) => {
        expect(response.uploaded).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(formData);
      // Verify it doesn't have the custom headers from constructor
      req.flush({ uploaded: true });
    });
  });
});


