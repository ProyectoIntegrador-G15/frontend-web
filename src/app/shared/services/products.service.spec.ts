import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductsService, ProductApiResponse } from './products.service';
import { Product } from '../interfaces/product.type';
import { environment } from '../../../environments/environment';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  // Mock data del backend (ProductApiResponse[])
  const mockApiProducts: ProductApiResponse[] = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      description: 'Analgésico y antipirético',
      purchase_price: 0.85,
      storage_instructions: 'Almacenar en lugar seco, protegido de la luz y humedad',
      temperature_range: '15-25°C',
      supplier_id: 1,
      requires_cold_chain: false,
      status: true,
      created_at: '2025-10-19T03:52:27.518332',
      updated_at: '2025-10-19T03:52:27.518332'
    },
    {
      id: 2,
      name: 'Insulina Humana Regular',
      description: 'Hormona para el control de la diabetes',
      purchase_price: 12.5,
      storage_instructions: 'Refrigerar entre 2-8°C. No congelar. Proteger de la luz',
      temperature_range: '2-8°C',
      supplier_id: 2,
      requires_cold_chain: true,
      status: true,
      created_at: '2025-10-19T03:52:27.518332',
      updated_at: '2025-10-19T03:52:27.518332'
    }
  ];

  // Mock data transformada (frontend format)
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Paracetamol 500mg',
      description: 'Analgésico y antipirético',
      purchase_price: 0.85,
      supplier: 'Proveedor 1',
      requires_cold_chain: false,
      status: 'active',
      storageInstructions: 'Almacenar en lugar seco, protegido de la luz y humedad'
    },
    {
      id: '2',
      name: 'Insulina Humana Regular',
      description: 'Hormona para el control de la diabetes',
      purchase_price: 12.5,
      supplier: 'Proveedor 2',
      requires_cold_chain: true,
      status: 'active',
      storageInstructions: 'Refrigerar entre 2-8°C. No congelar. Proteger de la luz'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductsService]
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya solicitudes HTTP pendientes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should retrieve products from the API', (done) => {
      service.getProducts().subscribe({
        next: (products) => {
          expect(products).toEqual(mockProducts);
          expect(products.length).toBe(2);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiProducts);
    });

    it('should return empty array when API returns empty', (done) => {
      service.getProducts().subscribe({
        next: (products) => {
          expect(products).toEqual([]);
          expect(products.length).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush([]);
    });
  });

  describe('createProduct', () => {
    const newProduct = {
      name: 'Nuevo Producto',
      description: 'Descripción del producto',
      price: 10.5,
      provider: 'N/A',
      needsCold: false,
      status: 'active',
      storageInstructions: 'Almacenar en lugar seco'
    };

    const createdProductResponse = {
      success: true,
      data: { ...newProduct, id: 3 }
    };

    it('should create a new product successfully', (done) => {
      service.createProduct(newProduct).subscribe({
        next: (response) => {
          expect(response).toEqual(createdProductResponse);
          done();
        },
        error: done.fail
      });

      // Expect POST request
      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body).toEqual(newProduct);
      createReq.flush(createdProductResponse);

      // Expect GET request (refreshProducts)
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(refreshReq.request.method).toBe('GET');
      refreshReq.flush(mockApiProducts);
    });

    it('should handle errors when creating product', (done) => {
      const errorMessage = 'Error creating product';

      service.createProduct(newProduct).subscribe({
        next: () => done.fail('should have failed with error'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('API URL construction', () => {
    it('should use correct URL for getProducts', () => {
      service.getProducts().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(req.request.url).toBe(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush([]);
    });

    it('should use correct URL for createProduct', () => {
      service.createProduct({}).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(req.request.url).toBe(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush({ success: true });

      // Clear refresh request
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.flush([]);
    });
  });
});
