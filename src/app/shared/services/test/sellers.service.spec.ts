import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SellersService, Seller, SellerApiResponse, SellerPaginatedApiResponse } from '../sellers.service';
import { environment } from '../../../../environments/environment';

describe('SellersService', () => {
  let service: SellersService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;
  const sellersEndpoint = environment.apiEndpoints.sellers;

  const mockSellerApiResponse: SellerApiResponse = {
    id: 1,
    name: 'Carlos Rodríguez',
    identification: '1012345678',
    status: 'active',
    email: 'carlos.rodriguez@medisupply.com',
    phone: '+57 300 123 4567',
    address: 'Calle 100 #15-20, Bogotá',
    commission: 5.0,
    sales_target: 50000000.0,
    entry_date: '2025-10-26T18:01:44.932965Z',
    created_at: '2025-10-26T18:01:44.932972Z',
    updated_at: '2025-10-26T18:01:44.932974Z'
  };

  const mockSellersApiResponse: SellerApiResponse[] = [
    mockSellerApiResponse,
    {
      id: 2,
      name: 'María González',
      identification: '1023456789',
      status: 'inactive',
      email: 'maria.gonzalez@medisupply.com',
      phone: '+57 301 234 5678',
      address: 'Carrera 43A #10-50, Medellín',
      commission: 4.5,
      sales_target: 45000000.0,
      entry_date: '2025-10-26T18:02:02.471433Z',
      created_at: '2025-10-26T18:02:02.471439Z',
      updated_at: '2025-10-26T18:02:02.471440Z'
    },
    {
      id: 3,
      name: 'Jorge Martínez',
      identification: '1034567890',
      status: 'suspended',
      email: 'jorge.martinez@medisupply.com',
      phone: '+57 302 345 6789',
      address: 'Avenida 5N #23-50, Cali',
      commission: 5.5,
      sales_target: 60000000.0,
      entry_date: '2025-10-26T18:02:15.187483Z',
      created_at: '2025-10-26T18:02:15.187488Z',
      updated_at: '2025-10-26T18:02:15.187489Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SellersService]
    });

    service = TestBed.inject(SellersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSellers', () => {
    it('should fetch all sellers from single page successfully', () => {
      service.getSellers().subscribe((sellers) => {
        expect(sellers).toBeTruthy();
        expect(sellers.length).toBe(3);
        expect(sellers[0].id).toBe('1');
        expect(sellers[0].name).toBe('Carlos Rodríguez');
        expect(sellers[0].status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      expect(req.request.method).toBe('GET');
      req.flush({
        sellers: mockSellersApiResponse,
        total: 3,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });

    it('should fetch sellers from multiple pages', () => {
      const page1Sellers = [mockSellersApiResponse[0], mockSellersApiResponse[1]];
      const page2Sellers = [mockSellersApiResponse[2]];

      service.getSellers().subscribe((sellers) => {
        expect(sellers.length).toBe(3);
        expect(sellers[0].name).toBe('Carlos Rodríguez');
        expect(sellers[1].name).toBe('María González');
        expect(sellers[2].name).toBe('Jorge Martínez');
      });

      // Primera petición - página 1
      const req1 = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req1.flush({
        sellers: page1Sellers,
        total: 3,
        total_pages: 2,
        page: 1,
        page_size: 2
      });

      // Segunda petición - página 2
      const req2 = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=2`);
      req2.flush({
        sellers: page2Sellers,
        total: 3,
        total_pages: 2,
        page: 2,
        page_size: 2
      });
    });

    it('should handle error when fetching sellers fails', () => {
      const errorMessage = 'Error al obtener vendedores';

      service.getSellers().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req.flush({ detail: errorMessage }, { status: 500, statusText: 'Server Error' });
    });

    it('should transform API response to frontend format', () => {
      service.getSellers().subscribe((sellers) => {
        const seller = sellers[0];
        expect(seller.id).toBe('1');
        expect(seller.name).toBe('Carlos Rodríguez');
        expect(seller.identification).toBe('1012345678');
        expect(seller.email).toBe('carlos.rodriguez@medisupply.com');
        expect(seller.entryDate).toContain('26-10-2025');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req.flush({
        sellers: mockSellersApiResponse,
        total: 3,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });
  });

  describe('getSellerById', () => {
    it('should fetch a specific seller by ID', () => {
      const sellerId = '1';

      service.getSellerById(sellerId).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.id).toBe('1');
        expect(seller.name).toBe('Carlos Rodríguez');
        expect(seller.status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSellerApiResponse);
    });

    it('should handle error when seller not found', () => {
      const sellerId = '999';

      service.getSellerById(sellerId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Vendedor');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}`);
      req.flush({ detail: 'Vendedor no encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createSeller', () => {
    it('should create a new seller with all fields', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Ana Pérez',
        identification: '1045678901',
        status: 'active',
        email: 'ana.perez@medisupply.com',
        phone: '+57 303 456 7890',
        address: 'Calle 48 #27-70, Bucaramanga',
        commission: 4.0,
        salesTarget: 40000000.0
      };

      const createdSellerResponse: SellerApiResponse = {
        id: 4,
        name: 'Ana Pérez',
        identification: '1045678901',
        status: 'active',
        email: 'ana.perez@medisupply.com',
        phone: '+57 303 456 7890',
        address: 'Calle 48 #27-70, Bucaramanga',
        commission: 4.0,
        sales_target: 40000000.0,
        entry_date: '2025-10-27T10:00:00Z',
        created_at: '2025-10-27T10:00:00Z',
        updated_at: '2025-10-27T10:00:00Z'
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.id).toBe('4');
        expect(seller.name).toBe('Ana Pérez');
        expect(seller.identification).toBe('1045678901');
        expect(seller.email).toBe('ana.perez@medisupply.com');
        expect(seller.phone).toBe('+57 303 456 7890');
        expect(seller.address).toBe('Calle 48 #27-70, Bucaramanga');
        expect(seller.commission).toBe(4.0);
        expect(seller.salesTarget).toBe(40000000.0);
        expect(seller.status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Ana Pérez');
      expect(req.request.body.identification).toBe('1045678901');
      expect(req.request.body.email).toBe('ana.perez@medisupply.com');
      expect(req.request.body.phone).toBe('+57 303 456 7890');
      expect(req.request.body.address).toBe('Calle 48 #27-70, Bucaramanga');
      expect(req.request.body.commission).toBe(4.0);
      expect(req.request.body.sales_target).toBe(40000000.0);
      req.flush(createdSellerResponse);
    });

    it('should create a seller without optional fields (address, commission, salesTarget)', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Pedro Sánchez',
        identification: '1056789012',
        status: 'active',
        email: 'pedro.sanchez@medisupply.com',
        phone: '+57 304 567 8901'
      };

      const createdSellerResponse: SellerApiResponse = {
        id: 5,
        name: 'Pedro Sánchez',
        identification: '1056789012',
        status: 'active',
        email: 'pedro.sanchez@medisupply.com',
        phone: '+57 304 567 8901',
        address: null,
        commission: null,
        sales_target: null,
        entry_date: '2025-10-27T10:00:00Z',
        created_at: '2025-10-27T10:00:00Z',
        updated_at: '2025-10-27T10:00:00Z'
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.name).toBe('Pedro Sánchez');
        expect(seller.address).toBeUndefined();
        expect(seller.commission).toBeUndefined();
        expect(seller.salesTarget).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Pedro Sánchez');
      expect(req.request.body.identification).toBe('1056789012');
      expect(req.request.body.email).toBe('pedro.sanchez@medisupply.com');
      expect(req.request.body.phone).toBe('+57 304 567 8901');
      // Verificar que los campos opcionales se envían como null
      expect(req.request.body.address).toBeNull();
      expect(req.request.body.commission).toBeNull();
      expect(req.request.body.sales_target).toBeNull();
      req.flush(createdSellerResponse);
    });

    it('should create a seller with only address as optional field', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Laura Torres',
        identification: '1067890123',
        status: 'active',
        email: 'laura.torres@medisupply.com',
        phone: '+57 305 678 9012',
        address: 'Avenida 68 #45-30, Bogotá'
      };

      const createdSellerResponse: SellerApiResponse = {
        id: 6,
        name: 'Laura Torres',
        identification: '1067890123',
        status: 'active',
        email: 'laura.torres@medisupply.com',
        phone: '+57 305 678 9012',
        address: 'Avenida 68 #45-30, Bogotá',
        commission: null,
        sales_target: null,
        entry_date: '2025-10-27T10:00:00Z',
        created_at: '2025-10-27T10:00:00Z',
        updated_at: '2025-10-27T10:00:00Z'
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.name).toBe('Laura Torres');
        expect(seller.address).toBe('Avenida 68 #45-30, Bogotá');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.address).toBe('Avenida 68 #45-30, Bogotá');
      expect(req.request.body.commission).toBeNull();
      expect(req.request.body.sales_target).toBeNull();
      req.flush(createdSellerResponse);
    });

    it('should create a seller with only commission as optional field', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Roberto Díaz',
        identification: '1078901234',
        status: 'active',
        email: 'roberto.diaz@medisupply.com',
        phone: '+57 306 789 0123',
        commission: 5.5
      };

      const createdSellerResponse: SellerApiResponse = {
        id: 7,
        name: 'Roberto Díaz',
        identification: '1078901234',
        status: 'active',
        email: 'roberto.diaz@medisupply.com',
        phone: '+57 306 789 0123',
        address: null,
        commission: 5.5,
        sales_target: null,
        entry_date: '2025-10-27T10:00:00Z',
        created_at: '2025-10-27T10:00:00Z',
        updated_at: '2025-10-27T10:00:00Z'
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.name).toBe('Roberto Díaz');
        expect(seller.commission).toBe(5.5);
        expect(seller.address).toBeUndefined();
        expect(seller.salesTarget).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.commission).toBe(5.5);
      expect(req.request.body.address).toBeNull();
      expect(req.request.body.sales_target).toBeNull();
      req.flush(createdSellerResponse);
    });

    it('should create a seller with only salesTarget as optional field', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Sofía Ramírez',
        identification: '1089012345',
        status: 'active',
        email: 'sofia.ramirez@medisupply.com',
        phone: '+57 307 890 1234',
        salesTarget: 55000000.0
      };

      const createdSellerResponse: SellerApiResponse = {
        id: 8,
        name: 'Sofía Ramírez',
        identification: '1089012345',
        status: 'active',
        email: 'sofia.ramirez@medisupply.com',
        phone: '+57 307 890 1234',
        address: null,
        commission: null,
        sales_target: 55000000.0,
        entry_date: '2025-10-27T10:00:00Z',
        created_at: '2025-10-27T10:00:00Z',
        updated_at: '2025-10-27T10:00:00Z'
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.name).toBe('Sofía Ramírez');
        expect(seller.salesTarget).toBe(55000000.0);
        expect(seller.address).toBeUndefined();
        expect(seller.commission).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sales_target).toBe(55000000.0);
      expect(req.request.body.address).toBeNull();
      expect(req.request.body.commission).toBeNull();
      req.flush(createdSellerResponse);
    });

    it('should transform API response correctly', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Test Seller',
        identification: '1090123456',
        status: 'active',
        email: 'test@medisupply.com',
        phone: '+57 308 901 2345'
      };

      const createdSellerResponse: SellerApiResponse = {
        id: 9,
        name: 'Test Seller',
        identification: '1090123456',
        status: 'active',
        email: 'test@medisupply.com',
        phone: '+57 308 901 2345',
        address: null,
        commission: null,
        sales_target: null,
        entry_date: '2025-10-27T15:30:00Z',
        created_at: '2025-10-27T15:30:00Z',
        updated_at: '2025-10-27T15:30:00Z'
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller.id).toBe('9'); // ID convertido a string
        expect(seller.name).toBe('Test Seller');
        expect(seller.identification).toBe('1090123456');
        expect(seller.status).toBe('active');
        expect(seller.email).toBe('test@medisupply.com');
        expect(seller.phone).toBe('+57 308 901 2345');
        expect(seller.entryDate).toMatch(/\d{2}-\d{2}-\d{4}/); // Formato DD-MM-YYYY
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      req.flush(createdSellerResponse);
    });

    it('should handle error when identification already exists', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Test',
        identification: '1012345678',
        status: 'active',
        email: 'test@test.com',
        phone: '+57 300 000 0000'
      };

      service.createSeller(newSeller).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('Ya existe un vendedor con esta identificación');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      req.flush(
        { detail: 'Ya existe un vendedor con esta identificación' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle server error (500)', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Test Seller',
        identification: '1101234567',
        status: 'active',
        email: 'test@test.com',
        phone: '+57 300 000 0000'
      };

      service.createSeller(newSeller).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('Error al crear el vendedor');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      req.flush(
        { detail: 'Error al crear el vendedor' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should handle unauthorized error (403)', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Test Seller',
        identification: '1112345678',
        status: 'active',
        email: 'test@test.com',
        phone: '+57 300 000 0000'
      };

      service.createSeller(newSeller).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('No tiene permisos para acceder a este recurso');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      req.flush(
        { detail: 'No tiene permisos para acceder a este recurso' },
        { status: 403, statusText: 'Forbidden' }
      );
    });

    it('should handle network error', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Test Seller',
        identification: '1123456789',
        status: 'active',
        email: 'test@test.com',
        phone: '+57 300 000 0000'
      };

      service.createSeller(newSeller).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should send correct request body format', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Validation Test',
        identification: '1134567890',
        status: 'active',
        email: 'validation@test.com',
        phone: '3001234567',
        address: 'Test Address',
        commission: 3.5,
        salesTarget: 30000000.0
      };

      service.createSeller(newSeller).subscribe();

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Validation Test',
        identification: '1134567890',
        email: 'validation@test.com',
        phone: '3001234567',
        address: 'Test Address',
        commission: 3.5,
        sales_target: 30000000.0
      });
      // Verificar que NO se envía status (el backend lo establece automáticamente)
      expect(req.request.body.status).toBeUndefined();
      req.flush(mockSellerApiResponse);
    });

    it('should handle commission with decimal values', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Decimal Test',
        identification: '1145678901',
        status: 'active',
        email: 'decimal@test.com',
        phone: '+57 300 000 0000',
        commission: 7.75
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.body.commission).toBe(7.75);
      req.flush(mockSellerApiResponse);
    });

    it('should handle salesTarget with large values', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Large Value Test',
        identification: '1156789012',
        status: 'active',
        email: 'large@test.com',
        phone: '+57 300 000 0000',
        salesTarget: 100000000.0
      };

      service.createSeller(newSeller).subscribe((seller) => {
        expect(seller).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      expect(req.request.body.sales_target).toBe(100000000.0);
      req.flush(mockSellerApiResponse);
    });
  });

  describe('updateSeller', () => {
    it('should update an existing seller', () => {
      const sellerId = '1';
      const updateData = {
        name: 'Carlos Rodríguez Updated',
        status: 'inactive' as const
      };

      service.updateSeller(sellerId, updateData).subscribe((seller) => {
        expect(seller).toBeTruthy();
        expect(seller.id).toBe('1');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.name).toBe('Carlos Rodríguez Updated');
      expect(req.request.body.status).toBe('inactive');
      req.flush(mockSellerApiResponse);
    });

    it('should handle partial updates', () => {
      const sellerId = '1';
      const updateData = { commission: 6.0 };

      service.updateSeller(sellerId, updateData).subscribe((seller) => {
        expect(seller).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}`);
      expect(req.request.body.commission).toBe(6.0);
      expect(req.request.body.name).toBeUndefined();
      req.flush(mockSellerApiResponse);
    });
  });

  describe('deleteSeller', () => {
    it('should delete a seller successfully', () => {
      const sellerId = '1';

      service.deleteSeller(sellerId).subscribe((result) => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ msg: 'Vendedor eliminado' });
    });

    it('should handle error when deleting fails', () => {
      const sellerId = '1';

      service.deleteSeller(sellerId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('Error al eliminar el vendedor');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sellers list', () => {
      service.getSellers().subscribe((sellers) => {
        expect(sellers).toEqual([]);
        expect(sellers.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req.flush({
        sellers: [],
        total: 0,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });

    it('should handle sellers without optional fields', () => {
      const sellerWithoutOptionals = {
        ...mockSellerApiResponse,
        address: null,
        commission: null,
        sales_target: null
      };

      service.getSellerById('1').subscribe((seller) => {
        expect(seller.address).toBeUndefined();
        expect(seller.commission).toBeUndefined();
        expect(seller.salesTarget).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/1`);
      req.flush(sellerWithoutOptionals);
    });

    it('should handle all seller statuses', () => {
      const sellers = [
        { ...mockSellerApiResponse, status: 'active' as const },
        { ...mockSellerApiResponse, id: 2, status: 'inactive' as const },
        { ...mockSellerApiResponse, id: 3, status: 'suspended' as const }
      ];

      service.getSellers().subscribe((result) => {
        expect(result[0].status).toBe('active');
        expect(result[1].status).toBe('inactive');
        expect(result[2].status).toBe('suspended');
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req.flush({
        sellers: sellers,
        total: 3,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format entry_date correctly', () => {
      service.getSellers().subscribe((sellers) => {
        expect(sellers[0].entryDate).toMatch(/\d{2}-\d{2}-\d{4}/);
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req.flush({
        sellers: mockSellersApiResponse,
        total: 3,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });
  });

  describe('Multiple Pages Pagination', () => {
    it('should fetch and combine sellers from 3 pages', () => {
      const page1 = [mockSellersApiResponse[0]];
      const page2 = [mockSellersApiResponse[1]];
      const page3 = [mockSellersApiResponse[2]];

      service.getSellers().subscribe((sellers) => {
        expect(sellers.length).toBe(3);
        expect(sellers[0].name).toBe('Carlos Rodríguez');
        expect(sellers[1].name).toBe('María González');
        expect(sellers[2].name).toBe('Jorge Martínez');
      });

      // Primera petición - página 1
      const req1 = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req1.flush({
        sellers: page1,
        total: 3,
        total_pages: 3,
        page: 1,
        page_size: 1
      });

      // Segunda petición - página 2
      const req2 = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=2`);
      req2.flush({
        sellers: page2,
        total: 3,
        total_pages: 3,
        page: 2,
        page_size: 1
      });

      // Tercera petición - página 3
      const req3 = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=3`);
      req3.flush({
        sellers: page3,
        total: 3,
        total_pages: 3,
        page: 3,
        page_size: 1
      });
    });
  });

  describe('getSellersPaginated', () => {
    it('should fetch specific page with metadata', () => {
      service.getSellersPaginated(2).subscribe((response) => {
        expect(response.sellers.length).toBe(1);
        expect(response.total).toBe(5);
        expect(response.totalPages).toBe(3);
        expect(response.page).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=2`);
      req.flush({
        sellers: [mockSellersApiResponse[1]],
        total: 5,
        total_pages: 3,
        page: 2,
        page_size: 2
      });
    });

    it('should use page 1 by default', () => {
      service.getSellersPaginated().subscribe((response) => {
        expect(response.page).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=1`);
      req.flush({
        sellers: mockSellersApiResponse,
        total: 3,
        total_pages: 1,
        page: 1,
        page_size: 5
      });
    });

    it('should handle error when fetching paginated sellers', () => {
      const errorMessage = 'Error en la paginación';

      service.getSellersPaginated(2).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}?page=2`);
      req.flush({ detail: errorMessage }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('Error Message Handling', () => {
    it('should prioritize detail error message', () => {
      service.getSellerById('1').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error específico');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/1`);
      req.flush({ detail: 'Error específico', message: 'Error genérico' }, { status: 500, statusText: 'Server Error' });
    });

    it('should use error.error.message when detail is not available', () => {
      service.getSellerById('1').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Error en el objeto');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/1`);
      req.flush({ message: 'Error en el objeto' }, { status: 500, statusText: 'Server Error' });
    });

    it('should use default message when no error details available', () => {
      service.getSellerById('1').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/1`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('Integration Tests', () => {
    it('should successfully create and fetch seller', () => {
      const newSeller: Omit<Seller, 'id' | 'entryDate'> = {
        name: 'Test Seller',
        identification: '9999999999',
        status: 'active',
        email: 'test@test.com',
        phone: '+57 300 000 0000'
      };

      // Crear
      service.createSeller(newSeller).subscribe((created) => {
        expect(created.name).toBe('Carlos Rodríguez');
      });

      const createReq = httpMock.expectOne(`${apiUrl}${sellersEndpoint}`);
      createReq.flush(mockSellerApiResponse);
    });
  });

  // ========== PRUEBAS DE PLANES DE VENTA ==========

  describe('Sales Plans', () => {
    const mockSalesPlan = {
      id: 1,
      seller_id: 1,
      name: 'Plan Q1 2025',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
      total_units_target: 1000,
      total_value_target: 50000.0,
      visits_target: 50,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    };

    const mockSalesPlansResponse = {
      sales_plans: [mockSalesPlan],
      total: 1
    };

    describe('getSalesPlans', () => {
      it('should fetch sales plans for a seller filtered by month and year', () => {
        const sellerId = '1';
        const month = 1;
        const year = 2025;

        service.getSalesPlans(sellerId, month, year).subscribe((response) => {
          expect(response).toBeTruthy();
          expect(response.sales_plans.length).toBe(1);
          expect(response.sales_plans[0].id).toBe(1);
          expect(response.sales_plans[0].name).toBe('Plan Q1 2025');
          expect(response.total).toBe(1);
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans?month=${month}&year=${year}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockSalesPlansResponse);
      });

      it('should handle error when fetching sales plans fails', () => {
        const sellerId = '1';
        const month = 1;
        const year = 2025;
        const errorMessage = 'Error al obtener planes de venta';

        service.getSalesPlans(sellerId, month, year).subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error).toBeTruthy();
            expect(error.message).toBe(errorMessage);
          }
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans?month=${month}&year=${year}`);
        req.flush({ detail: errorMessage }, { status: 500, statusText: 'Server Error' });
      });

      it('should handle empty sales plans list', () => {
        const sellerId = '1';
        const month = 1;
        const year = 2025;

        service.getSalesPlans(sellerId, month, year).subscribe((response) => {
          expect(response.sales_plans).toEqual([]);
          expect(response.total).toBe(0);
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans?month=${month}&year=${year}`);
        req.flush({
          sales_plans: [],
          total: 0
        });
      });
    });

    describe('getSalesPlan', () => {
      it('should fetch a specific sales plan by ID', () => {
        const sellerId = '1';
        const planId = 1;

        service.getSalesPlan(sellerId, planId).subscribe((plan) => {
          expect(plan).toBeTruthy();
          expect(plan.id).toBe(1);
          expect(plan.name).toBe('Plan Q1 2025');
          expect(plan.seller_id).toBe(1);
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans/${planId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockSalesPlan);
      });

      it('should handle error when sales plan not found', () => {
        const sellerId = '1';
        const planId = 999;

        service.getSalesPlan(sellerId, planId).subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error).toBeTruthy();
            expect(error.message).toContain('Plan');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans/${planId}`);
        req.flush({ detail: 'Plan de venta no encontrado' }, { status: 404, statusText: 'Not Found' });
      });
    });

    describe('createSalesPlan', () => {
      it('should create a new sales plan successfully', () => {
        const sellerId = '1';
        const planData = {
          name: 'Plan Q2 2025',
          start_date: '2025-04-01',
          end_date: '2025-06-30',
          total_units_target: 1500,
          total_value_target: 75000.0,
          visits_target: 60
        };

        service.createSalesPlan(sellerId, planData).subscribe((plan) => {
          expect(plan).toBeTruthy();
          expect(plan.id).toBe(1);
          expect(plan.name).toBe('Plan Q1 2025');
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body.name).toBe('Plan Q2 2025');
        expect(req.request.body.start_date).toBe('2025-04-01');
        expect(req.request.body.end_date).toBe('2025-06-30');
        expect(req.request.body.total_units_target).toBe(1500);
        expect(req.request.body.total_value_target).toBe(75000.0);
        expect(req.request.body.visits_target).toBe(60);
        req.flush(mockSalesPlan);
      });

      it('should handle error when creating sales plan with overlapping dates', () => {
        const sellerId = '1';
        const planData = {
          name: 'Plan Solapado',
          start_date: '2025-01-15',
          end_date: '2025-01-20',
          total_units_target: 1000,
          total_value_target: 50000.0,
          visits_target: 50
        };

        service.createSalesPlan(sellerId, planData).subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error).toBeTruthy();
            expect(error.message).toContain('solapa');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans`);
        req.flush(
          { detail: 'Ya existe un plan de venta que se solapa con el rango de fechas especificado' },
          { status: 400, statusText: 'Bad Request' }
        );
      });

      it('should handle error when seller not found', () => {
        const sellerId = '999';
        const planData = {
          name: 'Plan Test',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          total_units_target: 1000,
          total_value_target: 50000.0,
          visits_target: 50
        };

        service.createSalesPlan(sellerId, planData).subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error).toBeTruthy();
            expect(error.message).toContain('Vendedor');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans`);
        req.flush(
          { detail: 'Vendedor con ID 999 no encontrado' },
          { status: 404, statusText: 'Not Found' }
        );
      });

      it('should handle error when date range is invalid', () => {
        const sellerId = '1';
        const planData = {
          name: 'Plan Inválido',
          start_date: '2025-01-31',
          end_date: '2025-01-01', // Fecha de fin anterior a inicio
          total_units_target: 1000,
          total_value_target: 50000.0,
          visits_target: 50
        };

        service.createSalesPlan(sellerId, planData).subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error).toBeTruthy();
            expect(error.message).toContain('fecha');
          }
        });

        const req = httpMock.expectOne(`${apiUrl}${sellersEndpoint}/${sellerId}/sales-plans`);
        req.flush(
          { detail: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400, statusText: 'Bad Request' }
        );
      });
    });
  });
});

