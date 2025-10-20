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
      price: 0.85,
      provider: 'N/A',
      needsCold: false,
      status: 'active',
      storageInstructions: 'Almacenar en lugar seco, protegido de la luz y humedad'
    },
    {
      id: '2',
      name: 'Insulina Humana Regular',
      description: 'Hormona para el control de la diabetes',
      price: 12.5,
      provider: 'N/A',
      needsCold: true,
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

  // ========================================
  // SERVICE CREATION TESTS
  // ========================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ========================================
  // GET PRODUCTS TESTS
  // ========================================

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

    it('should handle HTTP errors when getting products', (done) => {
      const errorMessage = 'Server error';

      service.getProducts().subscribe({
        next: () => done.fail('should have failed with server error'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe(errorMessage);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
    });

    it('should handle network errors when getting products', (done) => {
      service.getProducts().subscribe({
        next: () => done.fail('should have failed with network error'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.error(new ProgressEvent('error'));
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

  // ========================================
  // CREATE PRODUCT TESTS
  // ========================================

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

    it('should update products subject after successful creation', (done) => {
      let emittedProducts: Product[] | null = null;

      // Subscribe to products$ observable
      service.products$.subscribe(products => {
        emittedProducts = products;
      });

      service.createProduct(newProduct).subscribe({
        next: () => {
          // Wait for refreshProducts to complete
          setTimeout(() => {
            expect(emittedProducts).toEqual(mockProducts);
            done();
          }, 100);
        },
        error: done.fail
      });

      // POST request
      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      createReq.flush(createdProductResponse);

      // GET request (refresh)
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.flush(mockApiProducts);
    });
  });

  // ========================================
  // PRODUCTS$ OBSERVABLE TESTS
  // ========================================

  describe('products$ observable', () => {
    it('should emit initial empty array', (done) => {
      service.products$.subscribe({
        next: (products) => {
          expect(products).toEqual([]);
          done();
        }
      });
    });

    it('should emit updated products when refreshProducts is called', (done) => {
      let emissionCount = 0;

      service.products$.subscribe({
        next: (products) => {
          emissionCount++;
          if (emissionCount === 2) {
            expect(products).toEqual(mockProducts);
            done();
          }
        }
      });

      // Trigger refresh by creating a product
      service.createProduct({ name: 'Test' }).subscribe();

      // POST request
      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      createReq.flush({ success: true });

      // GET request (refresh)
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.flush(mockApiProducts);
    });
  });

  // ========================================
  // ERROR HANDLING TESTS
  // ========================================

  describe('handleError', () => {
    it('should handle error with custom message', (done) => {
      const customErrorMessage = 'Custom error message';

      service.getProducts().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe(customErrorMessage);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush({ message: customErrorMessage }, { status: 500, statusText: 'Error' });
    });

    it('should handle error without message', (done) => {
      service.getProducts().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe('Integration tests', () => {
    it('should get products and then create a new product', (done) => {
      // First, get products
      service.getProducts().subscribe({
        next: (products) => {
          expect(products.length).toBe(2);

          // Then create a new product
          service.createProduct({ name: 'New Product' }).subscribe({
            next: (response) => {
              expect(response.success).toBe(true);
              done();
            },
            error: done.fail
          });

          // POST request
          const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
          createReq.flush({ success: true });

          // GET request (refresh)
          const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
          refreshReq.flush([...mockProducts, { id: 3, name: 'New Product' }]);
        },
        error: done.fail
      });

      // Initial GET request
      const getReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      getReq.flush(mockProducts);
    });
  });

  // ========================================
  // URL CONSTRUCTION TESTS
  // ========================================

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

  // ========================================
  // REFRESH PRODUCTS TESTS
  // ========================================

  describe('refreshProducts (private method)', () => {
    it('should update productsSubject when refresh succeeds', (done) => {
      let productEmissions: Product[][] = [];

      service.products$.subscribe(products => {
        productEmissions.push(products);
      });

      // Trigger refresh by creating a product
      service.createProduct({ name: 'Test' }).subscribe({
        next: () => {
          setTimeout(() => {
            expect(productEmissions.length).toBeGreaterThan(1);
            expect(productEmissions[productEmissions.length - 1]).toEqual(mockProducts);
            done();
          }, 100);
        },
        error: done.fail
      });

      // POST request
      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      createReq.flush({ success: true });

      // GET request (refresh)
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.flush(mockApiProducts);
    });

    it('should handle errors during refresh gracefully', (done) => {
      const consoleSpy = spyOn(console, 'error');

      service.createProduct({ name: 'Test' }).subscribe({
        next: () => {
          setTimeout(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
              'Error al actualizar la lista de productos:',
              jasmine.any(Error)
            );
            done();
          }, 100);
        },
        error: done.fail
      });

      // POST request
      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      createReq.flush({ success: true });

      // GET request (refresh) - simulate error
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.error(new ProgressEvent('Network error'));
    });
  });

  // ========================================
  // MULTIPLE REQUESTS TESTS
  // ========================================

  describe('Multiple simultaneous requests', () => {
    it('should handle multiple getProducts calls', (done) => {
      let completedRequests = 0;

      service.getProducts().subscribe({
        next: (products) => {
          expect(products).toEqual(mockProducts);
          completedRequests++;
          if (completedRequests === 2) {
            done();
          }
        },
        error: done.fail
      });

      service.getProducts().subscribe({
        next: (products) => {
          expect(products).toEqual(mockProducts);
          completedRequests++;
          if (completedRequests === 2) {
            done();
          }
        },
        error: done.fail
      });

      const requests = httpMock.match(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(requests.length).toBe(2);
      requests.forEach(req => req.flush(mockApiProducts));
    });
  });

  // ========================================
  // DATA VALIDATION TESTS
  // ========================================

  describe('Data validation', () => {
    it('should accept valid product data for creation', (done) => {
      const validProduct = {
        name: 'Valid Product',
        description: 'Valid description',
        price: 5.0,
        provider: 'Provider 1',
        needsCold: true,
        status: 'active'
      };

      service.createProduct(validProduct).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        },
        error: done.fail
      });

      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(createReq.request.body).toEqual(validProduct);
      createReq.flush({ success: true });

      // Clear refresh request
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.flush([]);
    });

    it('should handle products with special characters', (done) => {
      const specialProductApi: ProductApiResponse = {
        id: 99,
        name: 'Ácido Fólico 5mg',
        description: 'Vitamina B9 para mujeres embarazadas',
        purchase_price: 2.5,
        storage_instructions: 'Almacenar en lugar fresco y seco',
        temperature_range: '15-25°C',
        requires_cold_chain: false,
        status: true,
        created_at: '2025-10-19T03:52:27.518332',
        updated_at: '2025-10-19T03:52:27.518332'
      };

      service.getProducts().subscribe({
        next: (products) => {
          expect(products[0].name).toContain('Ácido');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush([specialProductApi]);
    });
  });

  // ========================================
  // EDGE CASES TESTS
  // ========================================

  describe('Edge cases', () => {
    it('should handle null response gracefully', (done) => {
      service.getProducts().subscribe({
        next: () => {
          done.fail('should have thrown an error');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('map');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush(null);
    });

    it('should handle very large product list', (done) => {
      const largeProductList: Product[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Product ${i + 1}`,
        description: `Description ${i + 1}`,
        price: i * 1.5,
        provider: `Provider ${i + 1}`,
        needsCold: i % 2 === 0,
        status: 'active' as const
      }));

      service.getProducts().subscribe({
        next: (products) => {
          expect(products.length).toBe(1000);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      req.flush(largeProductList);
    });
  });

  // ========================================
  // HTTP HEADERS TESTS
  // ========================================

  describe('HTTP headers', () => {
    it('should send GET request with correct headers', () => {
      service.getProducts().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(req.request.headers.has('Accept')).toBeFalsy(); // No custom headers by default
      req.flush([]);
    });

    it('should send POST request with product data in body', () => {
      const productData = { name: 'Test Product' };
      
      service.createProduct(productData).subscribe();

      const createReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      expect(createReq.request.body).toEqual(productData);
      expect(createReq.request.method).toBe('POST');
      createReq.flush({ success: true });

      // Clear refresh request
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.products}`);
      refreshReq.flush([]);
    });
  });
});

