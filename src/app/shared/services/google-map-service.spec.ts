import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GoogleMapsService } from './google-map-service';

describe('GoogleMapsService', () => {
    let service: GoogleMapsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GoogleMapsService]
        });
        service = TestBed.inject(GoogleMapsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load the Google Maps API script', (done) => {
        const apiKey = 'TEST_API_KEY';
        const scriptMock = document.createElement('script');

        spyOn(document, 'createElement').and.returnValue(scriptMock);
        spyOn(document.body, 'appendChild').and.callFake((node) => {
            // Simulate script load
            scriptMock.onload?.(new Event('load'));
            return node;
        });

        service.loadAPI(apiKey).subscribe(loaded => {
            expect(loaded).toBeTrue();
            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(scriptMock.src).toContain(`https://maps.googleapis.com/maps/api/js?key=${apiKey}`);
            expect(document.body.appendChild).toHaveBeenCalledWith(scriptMock);
            done();
        });
    });

    it('should return cached observable on subsequent calls', () => {
        const apiKey = 'TEST_API_KEY';
        const scriptMock = document.createElement('script');

        spyOn(document, 'createElement').and.returnValue(scriptMock);
        spyOn(document.body, 'appendChild').and.callFake((node) => {
            scriptMock.onload?.(new Event('load'));
            return node;
        });

        // First call
        service.loadAPI(apiKey);

        // Second call
        service.loadAPI(apiKey);

        expect(document.createElement).toHaveBeenCalledTimes(1);
        expect(document.body.appendChild).toHaveBeenCalledTimes(1);
    });
});
