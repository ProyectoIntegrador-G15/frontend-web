import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitRoutesService, VisitRoute } from '../../shared/services/visit-routes.service';
import { SnackService } from '../../shared/services/snack.service';
import { environment } from '../../../environments/environment';

// Declarar google como global para TypeScript
declare var google: any;

@Component({
  selector: 'app-confirm-visit-route',
  templateUrl: './confirm-visit-route.component.html',
  styleUrls: ['./confirm-visit-route.component.scss']
})
export class ConfirmVisitRouteComponent implements OnInit, AfterViewInit {
  visitRoute: VisitRoute | null = null;
  loading = true;
  error: string | null = null;
  confirming = false;
  isPreview = false; // Indica si es preview antes de crear

  // Google Maps
  private map: any = null;
  private markers: any[] = [];
  private directionsService: any = null;
  private directionsRenderer: any = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private visitRoutesService: VisitRoutesService,
    private snackService: SnackService
  ) {}

  ngOnInit(): void {
    const routeId = this.activatedRoute.snapshot.paramMap.get('routeId');
    
    if (routeId === 'preview') {
      // Modo preview: cargar desde sessionStorage
      this.loadPreview();
    } else if (routeId) {
      // Modo edición: cargar ruta existente
      this.loadRoute(routeId);
    }
  }

  ngAfterViewInit(): void {
    // El mapa se inicializará cuando los datos estén listos
    // (después de loadPreview() o loadRoute())
  }

  loadRoute(routeId: string): void {
    this.loading = true;
    this.error = null;

    this.visitRoutesService.getVisitRouteById(routeId).subscribe({
      next: (route) => {
        this.visitRoute = route;
        this.loading = false;
        
        // Inicializar mapa después de que el DOM se actualice
        setTimeout(() => {
          this.initMap();
        }, 200);
      },
      error: (error) => {
        console.error('Error loading route:', error);
        this.error = 'No se pudo cargar la ruta';
        this.loading = false;
      }
    });
  }

  initMap(): void {
    if (!this.visitRoute) {
      return;
    }

    const mapElement = document.getElementById('routeMap');
    
    if (!mapElement) {
      console.error('No se encontró el elemento del mapa');
      return;
    }

    if (!google || !google.maps) {
      console.error('Google Maps no está cargado');
      this.error = 'Error cargando Google Maps';
      return;
    }

    // Inicializar mapa centrado en Bogotá con Google Maps
    this.map = new google.maps.Map(mapElement, {
      center: { lat: 4.6097, lng: -74.0817 },
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [] // Puedes agregar estilos personalizados aquí
    });

    // Inicializar servicio de direcciones
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true, // No mostrar marcadores por defecto (usaremos personalizados)
      polylineOptions: {
        strokeColor: '#5F6AB0',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    
    this.addMarkersToMap();
  }

  addMarkersToMap(): void {
    if (!this.map || !this.visitRoute || !this.visitRoute.stops) {
      return;
    }

    // Limpiar marcadores existentes
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];

    const bounds = new google.maps.LatLngBounds();
    const waypoints: any[] = [];

    // Crear marcadores personalizados numerados
    this.visitRoute.stops.forEach((stop, index) => {
      if (stop.latitude && stop.longitude) {
        const position = { lat: stop.latitude, lng: stop.longitude };

        // Crear marcador con número personalizado
        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          label: {
            text: stop.sequence.toString(),
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: '#5F6AB0',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 3
          },
          title: stop.clientName
        });

        // InfoWindow para mostrar detalles al hacer click
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family: 'Nunito', sans-serif; padding: 8px;">
              <strong style="color: #5F6AB0; font-size: 16px;">${stop.sequence}. ${stop.clientName}</strong><br/>
              <div style="color: #666; margin-top: 8px; font-size: 13px;">
                📍 ${stop.clientAddress}
              </div>
              <div style="color: #5F6AB0; margin-top: 8px; font-size: 13px;">
                ⏰ ${stop.estimatedArrivalTime?.substring(0, 5) || '--:--'}
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(this.map, marker);
        });

        this.markers.push(marker);
        bounds.extend(position);

        // Agregar waypoints para la ruta (excepto primero y último)
        if (index > 0 && index < this.visitRoute!.stops.length - 1) {
          waypoints.push({
            location: position,
            stopover: true
          });
        }
      }
    });

    // Ajustar el mapa para mostrar todos los marcadores
    if (this.markers.length > 0) {
      this.map.fitBounds(bounds);
      
      // Dibujar ruta con direcciones si hay más de un punto
      if (this.markers.length > 1) {
        this.drawRoute();
      }
    }
  }

  drawRoute(): void {
    if (!this.visitRoute || this.visitRoute.stops.length < 2) return;

    const validStops = this.visitRoute.stops.filter(s => s.latitude && s.longitude);
    if (validStops.length < 2) return;

    const origin = { lat: validStops[0].latitude!, lng: validStops[0].longitude! };
    const destination = { lat: validStops[validStops.length - 1].latitude!, lng: validStops[validStops.length - 1].longitude! };
    
    const waypoints = validStops.slice(1, -1).map(stop => ({
      location: { lat: stop.latitude!, lng: stop.longitude! },
      stopover: true
    }));
    
    this.directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false // No optimizar porque ya tenemos el orden
    }, (response: any, status: any) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(response);
      } else {
        // Si falla, dibujar línea simple
        this.drawSimpleLine();
      }
    });
  }

  drawSimpleLine(): void {
    const path = this.visitRoute!.stops
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ lat: s.latitude!, lng: s.longitude! }));

    new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#5F6AB0',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: this.map
    });
  }

  setupMap(): void {
    // Este método ahora solo se llama después de cargar datos
    // El mapa real se inicializa en ngAfterViewInit
    if (this.map) {
      this.addMarkersToMap();
    }
  }

  async loadPreview(): Promise<void> {
    try {
      this.isPreview = true;
      const pendingData = sessionStorage.getItem('pendingVisitRoute');
      
      if (!pendingData) {
        this.error = 'No se encontraron datos de la ruta';
        this.loading = false;
        return;
      }

      const data = JSON.parse(pendingData);
      
      // Geocodificar direcciones en paralelo (Google Maps no tiene rate limit estricto)
      const stopsWithCoords = await Promise.all(
        data.clients.map(async (client: any, index: number) => {
          const coords = await this.geocodeAddress(client.address);
          return {
            id: `preview-${index}`,
            clientId: client.id,
            sequence: index + 1,
            clientName: client.name,
            clientAddress: client.address,
            durationMinutes: 30,
            status: 'pending' as const,
            latitude: coords.lat,
            longitude: coords.lng
          };
        })
      );
      
      // Crear objeto VisitRoute temporal para preview
      this.visitRoute = {
        id: 'preview',
        sellerId: data.seller_id.toString(),
        routeDate: data.route_date,
        status: 'draft',
        totalClients: data.clients.length,
        createdAt: new Date().toISOString(),
        stops: stopsWithCoords
      };

      this.loading = false;
      
      // Esperar un tick antes de inicializar el mapa
      setTimeout(() => {
        this.initMap();
      }, 200);
    } catch (error) {
      console.error('Error al cargar vista previa:', error);
      this.error = 'Error al cargar la vista previa de la ruta';
      this.loading = false;
    }
  }

  async geocodeAddress(address: string): Promise<{lat: number, lng: number}> {
    try {
      // Usar Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=co&key=${environment.googleMapsApiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Google Maps API KEY no activada');
        // Fallback a coordenadas de ciudad
        const cityMatch = address.match(/Bogotá|Medellín|Cali|Barranquilla|Cartagena/i);
        const city = cityMatch ? cityMatch[0] : 'Bogotá';
        return this.getCityCoordinates(city);
      } else {
        // Fallback a coordenadas de ciudad
        const cityMatch = address.match(/Bogotá|Medellín|Cali|Barranquilla|Cartagena/i);
        const city = cityMatch ? cityMatch[0] : 'Bogotá';
        return this.getCityCoordinates(city);
      }
    } catch (error) {
      console.error('Error geocodificando:', error);
      const cityMatch = address.match(/Bogotá|Medellín|Cali|Barranquilla|Cartagena/i);
      const city = cityMatch ? cityMatch[0] : 'Bogotá';
      return this.getCityCoordinates(city);
    }
  }

  getCityCoordinates(city: string): {lat: number, lng: number} {
    const cityCoords: {[key: string]: {lat: number, lng: number}} = {
      'Bogotá': { lat: 4.7110, lng: -74.0721 },
      'Medellín': { lat: 6.2476, lng: -75.5658 },
      'Cali': { lat: 3.4516, lng: -76.5320 },
      'Barranquilla': { lat: 10.9685, lng: -74.7813 },
      'Cartagena': { lat: 10.3910, lng: -75.4794 }
    };

    const coords = cityCoords[city] || cityCoords['Bogotá'];
    
    // Agregar pequeña variación aleatoria para que no todos los puntos de la misma ciudad estén exactamente en el mismo lugar
    return {
      lat: coords.lat + (Math.random() - 0.5) * 0.05,
      lng: coords.lng + (Math.random() - 0.5) * 0.05
    };
  }

  confirmRoute(): void {
    if (!this.visitRoute) return;

    this.confirming = true;
    this.error = null;

    if (this.isPreview) {
      // Crear la ruta por primera vez
      const pendingData = JSON.parse(sessionStorage.getItem('pendingVisitRoute') || '{}');
      
      this.visitRoutesService.createVisitRoute(pendingData).subscribe({
        next: (createdRoute) => {
          // Ahora confirmarla
          this.visitRoutesService.confirmVisitRoute(createdRoute.id).subscribe({
            next: (confirmedRoute) => {
              sessionStorage.removeItem('pendingVisitRoute');
              this.snackService.success(
                `Ruta de visita #${confirmedRoute.id} confirmada exitosamente. Total: ${confirmedRoute.totalClients} clientes.`
              );
              
              this.router.navigate(['/dashboard/sellers', confirmedRoute.sellerId], {
                fragment: 'visit-routes'
              });
            },
            error: (error) => {
              console.error('Error confirming route:', error);
              this.error = error.message || 'No se pudo confirmar la ruta';
              this.snackService.error('Error al confirmar la ruta');
              this.confirming = false;
            }
          });
        },
        error: (error) => {
          console.error('Error creating route:', error);
          this.error = error.message || 'No se pudo crear la ruta';
          this.snackService.error('Error al crear la ruta');
          this.confirming = false;
        }
      });
    } else {
      // Ya existe, solo confirmar
      this.visitRoutesService.confirmVisitRoute(this.visitRoute.id).subscribe({
        next: (confirmedRoute) => {
          this.snackService.success(
            `Ruta de visita #${confirmedRoute.id} confirmada exitosamente. Total: ${confirmedRoute.totalClients} clientes.`
          );
          
          this.router.navigate(['/dashboard/sellers', this.visitRoute!.sellerId], {
            fragment: 'visit-routes'
          });
        },
        error: (error) => {
          console.error('Error confirming route:', error);
          this.error = error.message || 'No se pudo confirmar la ruta';
          this.snackService.error('Error al confirmar la ruta');
          this.confirming = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/sellers', this.visitRoute?.sellerId || '']);
  }
}
