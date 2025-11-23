import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SellersService, SellerApiResponse, SellerPaginatedApiResponse, SellerPerformanceResponse, SalesPlanListResponse, SalesPlan, CreateSalesPlanRequest } from './sellers.service';
import { environment } from '../../../environments/environment';

describe('SellersService', () => {
    let service: SellersService;
    let httpMock: HttpTestingController;

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
        it('should retrieve all sellers from multiple pages', () => {
            const mockFirstPage: SellerPaginatedApiResponse = {
                sellers: [
                    {
                        id: 1,
                        name: 'Seller 1',
                        identification: '123',
                        status: 'active',
                        email: 'seller1@test.com',
                        phone: '1234567890',
                        address: 'Address 1',
                        commission: 10,
                        sales_target: 1000,
                        entry_date: '2023-01-01',
                        created_at: '2023-01-01',
                        updated_at: '2023-01-01'
                    }
                ],
                total: 2,
                total_pages: 2,
                page: 1,
                page_size: 1
            };

            const mockSecondPage: SellerPaginatedApiResponse = {
                sellers: [
                    {
                        id: 2,
                        name: 'Seller 2',
                        identification: '456',
                        status: 'inactive',
                        email: 'seller2@test.com',
                        phone: '0987654321',
                        address: null,
                        commission: null,
                        sales_target: null,
                        entry_date: '2023-02-01',
                        created_at: '2023-02-01',
                        updated_at: '2023-02-01'
                    }
                ],
                total: 2,
                total_pages: 2,
                page: 2,
                page_size: 1
            };

            service.getSellers().subscribe(sellers => {
                expect(sellers.length).toBe(2);
                expect(sellers[0].name).toBe('Seller 1');
                expect(sellers[1].name).toBe('Seller 2');
                expect(sellers[0].entryDate).toBe('01-01-2023');
            });

            const req1 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=1`);
            expect(req1.request.method).toBe('GET');
            req1.flush(mockFirstPage);

            const req2 = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=2`);
            expect(req2.request.method).toBe('GET');
            req2.flush(mockSecondPage);
        });

        it('should retrieve sellers from a single page', () => {
            const mockResponse: SellerPaginatedApiResponse = {
                sellers: [
                    {
                        id: 1,
                        name: 'Seller 1',
                        identification: '123',
                        status: 'active',
                        email: 'seller1@test.com',
                        phone: '1234567890',
                        address: 'Address 1',
                        commission: 10,
                        sales_target: 1000,
                        entry_date: '2023-01-01',
                        created_at: '2023-01-01',
                        updated_at: '2023-01-01'
                    }
                ],
                total: 1,
                total_pages: 1,
                page: 1,
                page_size: 10
            };

            service.getSellers().subscribe(sellers => {
                expect(sellers.length).toBe(1);
                expect(sellers[0].name).toBe('Seller 1');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=1`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });

    describe('getSellersPaginated', () => {
        it('should retrieve paginated sellers', () => {
            const mockResponse: SellerPaginatedApiResponse = {
                sellers: [
                    {
                        id: 1,
                        name: 'Seller 1',
                        identification: '123',
                        status: 'active',
                        email: 'seller1@test.com',
                        phone: '1234567890',
                        address: 'Address 1',
                        commission: 10,
                        sales_target: 1000,
                        entry_date: '2023-01-01',
                        created_at: '2023-01-01',
                        updated_at: '2023-01-01'
                    }
                ],
                total: 10,
                total_pages: 2,
                page: 1,
                page_size: 5
            };

            service.getSellersPaginated(1).subscribe(response => {
                expect(response.sellers.length).toBe(1);
                expect(response.total).toBe(10);
                expect(response.totalPages).toBe(2);
                expect(response.page).toBe(1);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=1`);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });

    describe('getSellerById', () => {
        it('should retrieve a seller by id', () => {
            const mockSeller: SellerApiResponse = {
                id: 1,
                name: 'Seller 1',
                identification: '123',
                status: 'active',
                email: 'seller1@test.com',
                phone: '1234567890',
                address: 'Address 1',
                commission: 10,
                sales_target: 1000,
                entry_date: '2023-01-01',
                created_at: '2023-01-01',
                updated_at: '2023-01-01'
            };

            service.getSellerById('1').subscribe(seller => {
                expect(seller.name).toBe('Seller 1');
                expect(seller.id).toBe('1');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}/1`);
            expect(req.request.method).toBe('GET');
            req.flush(mockSeller);
        });
    });

    describe('getSellerPerformance', () => {
        it('should retrieve seller performance', () => {
            const mockPerformance: SellerPerformanceResponse = {
                total_orders: 10,
                total_revenue: 5000,
                total_visits: 20,
                total_units_sold: 100,
                units_compliance: 80,
                revenue_compliance: 90,
                visits_compliance: 100
            };

            const startDate = '2023-01-01';
            const endDate = '2023-01-31';

            service.getSellerPerformance('1', startDate, endDate).subscribe(performance => {
                expect(performance.total_orders).toBe(10);
                expect(performance.total_revenue).toBe(5000);
            });

            const expectedUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}/1/performance?start_date=${startDate}&end_date=${endDate}`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockPerformance);
        });
    });

    describe('createSeller', () => {
        it('should create a seller', () => {
            const newSeller = {
                name: 'New Seller',
                identification: '789',
                email: 'new@test.com',
                phone: '1112223333',
                address: 'New Address',
                commission: 5,
                salesTarget: 2000,
                status: 'active' as const
            };

            const mockResponse: SellerApiResponse = {
                id: 3,
                ...newSeller,
                status: 'active',
                entry_date: '2023-03-01',
                created_at: '2023-03-01',
                updated_at: '2023-03-01',
                sales_target: 2000
            };

            service.createSeller(newSeller).subscribe(seller => {
                expect(seller.name).toBe('New Seller');
                expect(seller.id).toBe('3');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                name: newSeller.name,
                identification: newSeller.identification,
                email: newSeller.email,
                phone: newSeller.phone,
                address: newSeller.address,
                commission: newSeller.commission,
                sales_target: newSeller.salesTarget
            });
            req.flush(mockResponse);
        });
    });

    describe('updateSeller', () => {
        it('should update a seller', () => {
            const updates = { name: 'Updated Name' };
            const mockResponse: SellerApiResponse = {
                id: 1,
                name: 'Updated Name',
                identification: '123',
                status: 'active',
                email: 'seller1@test.com',
                phone: '1234567890',
                address: 'Address 1',
                commission: 10,
                sales_target: 1000,
                entry_date: '2023-01-01',
                created_at: '2023-01-01',
                updated_at: '2023-01-01'
            };

            service.updateSeller('1', updates).subscribe(seller => {
                expect(seller.name).toBe('Updated Name');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}/1`);
            expect(req.request.method).toBe('PATCH');
            expect(req.request.body).toEqual(updates);
            req.flush(mockResponse);
        });
    });

    describe('deleteSeller', () => {
        it('should delete a seller', () => {
            service.deleteSeller('1').subscribe(result => {
                expect(result).toBe(true);
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}/1`);
            expect(req.request.method).toBe('DELETE');
            req.flush({});
        });

        it('should handle error when deleting seller', () => {
            service.deleteSeller('1').subscribe({
                error: (error) => {
                    expect(error.message).toBe('Error al eliminar el vendedor');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}/1`);
            req.flush('Error', { status: 500, statusText: 'Server Error' });
        });
    });

    describe('getSalesPlans', () => {
        it('should retrieve sales plans', () => {
            const mockResponse: SalesPlanListResponse = {
                sales_plans: [],
                total: 0
            };

            service.getSalesPlans('1', 1, 2023).subscribe(response => {
                expect(response.sales_plans).toEqual([]);
            });

            const expectedUrl = `${environment.apiUrl}${environment.apiEndpoints.sellers}/1/sales-plans?month=1&year=2023`;
            const req = httpMock.expectOne(expectedUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });

    describe('getSalesPlan', () => {
        it('should retrieve a specific sales plan', () => {
            const mockPlan: SalesPlan = {
                id: 1,
                seller_id: 1,
                name: 'Plan 1',
                start_date: '2023-01-01',
                end_date: '2023-01-31',
                total_units_target: 100,
                total_value_target: 1000,
                visits_target: 10,
                created_at: '2023-01-01',
                updated_at: '2023-01-01'
            };

            service.getSalesPlan('1', 1).subscribe(plan => {
                expect(plan.name).toBe('Plan 1');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}/1/sales-plans/1`);
            expect(req.request.method).toBe('GET');
            req.flush(mockPlan);
        });
    });

    describe('createSalesPlan', () => {
        it('should create a sales plan', () => {
            const newPlan: CreateSalesPlanRequest = {
                name: 'New Plan',
                start_date: '2023-02-01',
                end_date: '2023-02-28',
                total_units_target: 200,
                total_value_target: 2000,
                visits_target: 20
            };

            const mockResponse: SalesPlan = {
                id: 2,
                seller_id: 1,
                ...newPlan,
                created_at: '2023-02-01',
                updated_at: '2023-02-01'
            };

            service.createSalesPlan('1', newPlan).subscribe(plan => {
                expect(plan.name).toBe('New Plan');
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}/1/sales-plans`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(newPlan);
            req.flush(mockResponse);
        });
    });

    describe('handleError', () => {
        it('should handle error with detail', () => {
            service.getSellers().subscribe({
                error: (error) => {
                    expect(error.message).toBe('Detailed error');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=1`);
            req.flush({ detail: 'Detailed error' }, { status: 400, statusText: 'Bad Request' });
        });

        it('should handle error with message', () => {
            service.getSellers().subscribe({
                error: (error) => {
                    expect(error.message).toBe('Message error');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=1`);
            req.flush({ message: 'Message error' }, { status: 400, statusText: 'Bad Request' });
        });

        it('should handle generic error', () => {
            service.getSellers().subscribe({
                error: (error) => {
                    expect(error.message).toBe('Ocurrió un error al procesar la solicitud');
                }
            });

            const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.sellers}?page=1`);
            req.flush(null, { status: 500, statusText: 'Server Error' });
        });
    });
});
