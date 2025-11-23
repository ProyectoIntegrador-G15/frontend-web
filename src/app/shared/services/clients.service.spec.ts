import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClientsService, Client, ClientApiResponse } from './clients.service';
import { environment } from '../../../environments/environment';
import { of, throwError } from 'rxjs';

describe('ClientsService', () => {
  let service: ClientsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientsService]
    });

    service = TestBed.inject(ClientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClients', () => {
    const mockClients: ClientApiResponse[] = [
      {
        id: 1,
        name: 'Client 1',
        email: 'client1@test.com',
        phone: '1234567890',
        address: 'Address 1',
        seller_id: 1,
        city: 'Bogotá',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Client 2',
        email: 'client2@test.com',
        phone: null,
        address: 'Address 2',
        seller_id: 1,
        city: 'Medellín',
        created_at: '2024-01-02T00:00:00Z'
      }
    ];

    it('should fetch all clients', () => {
      service.getClients().subscribe(clients => {
        expect(clients.length).toBe(2);
        expect(clients[0].id).toBe('1');
        expect(clients[0].name).toBe('Client 1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClients);
    });

    it('should fetch clients filtered by seller_id', () => {
      service.getClients(1).subscribe(clients => {
        expect(clients.length).toBe(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}?seller_id=1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClients);
    });

    it('should transform client data correctly', () => {
      service.getClients().subscribe(clients => {
        expect(clients[0].id).toBe('1');
        expect(clients[0].sellerId).toBe(1);
        expect(clients[0].createdAt).toBe('2024-01-01T00:00:00Z');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}`);
      req.flush(mockClients);
    });

    it('should handle errors', () => {
      service.getClients().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getClientById', () => {
    const mockClient: ClientApiResponse = {
      id: 1,
      name: 'Client 1',
      email: 'client1@test.com',
      phone: '1234567890',
      address: 'Address 1',
      seller_id: 1,
      city: 'Bogotá',
      created_at: '2024-01-01T00:00:00Z'
    };

    it('should fetch client by id', () => {
      service.getClientById('1').subscribe(client => {
        expect(client.id).toBe('1');
        expect(client.name).toBe('Client 1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClient);
    });

    it('should handle errors', () => {
      service.getClientById('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}/1`);
      req.error(new ErrorEvent('Not found'));
    });
  });

  describe('getClientsByIds', () => {
    const mockClients: ClientApiResponse[] = [
      {
        id: 1,
        name: 'Client 1',
        email: 'client1@test.com',
        phone: '1234567890',
        address: 'Address 1',
        seller_id: 1,
        city: 'Bogotá',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Client 2',
        email: 'client2@test.com',
        phone: null,
        address: 'Address 2',
        seller_id: 1,
        city: 'Medellín',
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: 3,
        name: 'Client 3',
        email: 'client3@test.com',
        phone: '9876543210',
        address: 'Address 3',
        seller_id: 2,
        city: 'Cali',
        created_at: '2024-01-03T00:00:00Z'
      }
    ];

    it('should fetch clients by multiple IDs', () => {
      service.getClientsByIds(['1', '2']).subscribe(clients => {
        expect(clients.length).toBe(2);
        expect(clients[0].id).toBe('1');
        expect(clients[1].id).toBe('2');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClients);
    });

    it('should filter clients by provided IDs', () => {
      service.getClientsByIds(['1', '3']).subscribe(clients => {
        expect(clients.length).toBe(2);
        expect(clients.find(c => c.id === '1')).toBeDefined();
        expect(clients.find(c => c.id === '3')).toBeDefined();
        expect(clients.find(c => c.id === '2')).toBeUndefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}`);
      req.flush(mockClients);
    });

    it('should return empty array when no clients match IDs', () => {
      service.getClientsByIds(['999', '998']).subscribe(clients => {
        expect(clients.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}`);
      req.flush(mockClients);
    });

    it('should handle errors', () => {
      service.getClientsByIds(['1', '2']).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients || '/clients'}`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getFreeClients', () => {
    const mockFreeClients: ClientApiResponse[] = [
      {
        id: 4,
        name: 'Free Client 1',
        email: 'free1@test.com',
        phone: '1111111111',
        address: 'Address 4',
        seller_id: undefined,
        city: 'Bogotá',
        created_at: '2024-01-04T00:00:00Z'
      }
    ];

    it('should fetch free clients', () => {
      service.getFreeClients().subscribe(clients => {
        expect(clients.length).toBe(1);
        expect(clients[0].id).toBe('4');
        expect(clients[0].name).toBe('Free Client 1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}/free`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFreeClients);
    });

    it('should handle errors when fetching free clients', () => {
      service.getFreeClients().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}/free`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('assignUnassignClientToSeller', () => {
    const mockClient: ClientApiResponse = {
      id: 1,
      name: 'Client 1',
      email: 'client1@test.com',
      phone: '1234567890',
      address: 'Address 1',
      seller_id: 1,
      city: 'Bogotá',
      created_at: '2024-01-01T00:00:00Z'
    };

    it('should assign client to seller', () => {
      service.assignUnassignClientToSeller(1, 1).subscribe(client => {
        expect(client.id).toBe('1');
        expect(client.sellerId).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}/1/sellers/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush(mockClient);
    });

    it('should handle errors when assigning client', () => {
      service.assignUnassignClientToSeller(1, 1).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.clients}/1/sellers/1`);
      req.error(new ErrorEvent('Assignment failed'));
    });
  });
});

