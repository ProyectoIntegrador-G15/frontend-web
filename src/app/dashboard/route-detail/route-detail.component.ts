import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {
  RouteDetail,
  RouteWaypoint,
  RoutesService
} from '../../shared/services/routes.service';
import {environment} from '../../../environments/environment';

declare const google: any;

interface RouteWaypointWithCoords extends RouteWaypoint {
  latitude?: number;
  longitude?: number;
  displaySequence: number;
}

@Component({
  selector: 'app-route-detail',
  templateUrl: './route-detail.component.html',
  styleUrls: ['./route-detail.component.scss']
})
export class RouteDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  routeDetail: RouteDetail | null = null;
  loading = true;
  error: string | null = null;
  geocoding = false;

  waypointsWithCoords: RouteWaypointWithCoords[] = [];
  // Google Maps
  private map: any = null;
  private markers: any[] = [];
  private directionsService: any = null;
  private directionsRenderer: any = null;
  private successColor = '#3A823D';
  private pickupFillColor = '#5F6AB0';
  private pickupTextColor = '#ffffff';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private routesService: RoutesService,
    private translateService: TranslateService
  ) {
  }

  ngOnInit(): void {
    const routeId = this.activatedRoute.snapshot.paramMap.get('routeId');

    if (!routeId) {
      this.loading = false;
      this.error = this.translateService.instant('routeDetail.errors.invalidRouteId');
      return;
    }

    if (typeof window !== 'undefined') {
      const computedStyles = getComputedStyle(document.documentElement);
      const successVar = computedStyles.getPropertyValue('--success').trim();
      if (successVar) {
        this.successColor = successVar;
      }
      const pickupFillVar = computedStyles.getPropertyValue('--blue-violet-a11y').trim();
      if (pickupFillVar) {
        this.pickupFillColor = pickupFillVar;
      }

      const pickupTextVar = computedStyles.getPropertyValue('--white').trim();
      if (pickupTextVar) {
        this.pickupTextColor = pickupTextVar;
      }
    }

    if (!this.pickupTextColor) {
      this.pickupTextColor = '#ffffff';
    }

    this.loadRouteDetail(routeId);
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa una vez se obtienen y geocodifican los puntos
  }

  ngOnDestroy(): void {
    this.resetMap();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/routes']);
  }

  getStatusTagColor(status: RouteDetail['status']): string {
    switch (status) {
      case 'planned':
        return 'blue';
      case 'in_progress':
        return 'green';
      case 'with_incidents':
        return 'orange';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: RouteDetail['status']): string {
    switch (status) {
      case 'planned':
        return this.translateService.instant('routes.statusPlanned');
      case 'in_progress':
        return this.translateService.instant('routes.statusInProgress');
      case 'with_incidents':
        return this.translateService.instant('routes.statusWithIncidents');
      case 'completed':
        return this.translateService.instant('routes.statusCompleted');
      default:
        return status;
    }
  }

  getWaypointTypeLabel(pickup: boolean): string {
    return this.translateService.instant(
      pickup ? 'routeDetail.pickupLabel' : 'routeDetail.deliveryLabel'
    );
  }

  private loadRouteDetail(routeId: string): void {
    this.loading = true;
    this.error = null;

    this.routesService.getRouteDetail(routeId).subscribe({
      next: (detail) => {
        this.routeDetail = detail;
        this.loading = false;

        this.prepareWaypoints()
          .then(() => setTimeout(() => this.initMap(), 200))
          .catch((error) => {
            console.error('Error geocodificando waypoints', error);
            this.error = this.translateService.instant('routeDetail.errors.geocodingFailed');
          });
      },
      error: (err) => {
        console.error('Error al cargar la ruta', err);
        this.error = err.message || this.translateService.instant('routeDetail.errors.loadFailed');
        this.loading = false;
      }
    });
  }

  private async prepareWaypoints(): Promise<void> {
    if (!this.routeDetail) {
      return;
    }

    this.geocoding = true;
    const sortedWaypoints = [...this.routeDetail.waypoints].sort((a, b) => a.sequence - b.sequence);

    const waypointsWithCoords = await Promise.all(
      sortedWaypoints.map(async (waypoint) => {
        const coords = waypoint.pointAddress
          ? await this.geocodeAddress(waypoint.pointAddress)
          : null;

        return {
          ...waypoint,
          latitude: coords?.lat,
          longitude: coords?.lng,
          displaySequence: waypoint.sequence + 1
        };
      })
    );

    this.waypointsWithCoords = waypointsWithCoords;
    this.geocoding = false;
  }

  private async geocodeAddress(address: string): Promise<{lat: number; lng: number} | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${environment.googleMapsApiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results[0].geometry.location;
      }

      if (data.status === 'REQUEST_DENIED') {
        console.warn('Solicitud rechazada por Google Maps API. Usando coordenadas de respaldo.');
      }

      return this.getFallbackCoordinates(address);
    } catch (error) {
      console.error('Error geocodificando dirección', address, error);
      return this.getFallbackCoordinates(address);
    }
  }

  private getFallbackCoordinates(address: string): {lat: number; lng: number} | null {
    const city = this.extractCity(address);

    const predefinedCoordinates: Record<string, {lat: number; lng: number}> = {
      'Bogotá': {lat: 4.711, lng: -74.0721},
      'Medellín': {lat: 6.2442, lng: -75.5812},
      'Cali': {lat: 3.4516, lng: -76.532},
      'Barranquilla': {lat: 10.9685, lng: -74.7813},
      'Cartagena': {lat: 10.391, lng: -75.4794},
      'San Francisco': {lat: 37.7749, lng: -122.4194},
      'New York': {lat: 40.7128, lng: -74.006},
      'Los Angeles': {lat: 34.0522, lng: -118.2437},
      'Chicago': {lat: 41.8781, lng: -87.6298},
    };

    if (city && predefinedCoordinates[city]) {
      const coords = predefinedCoordinates[city];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.05,
        lng: coords.lng + (Math.random() - 0.5) * 0.05
      };
    }

    // Coordenadas por defecto (Bogotá)
    return {
      lat: 4.711 + (Math.random() - 0.5) * 0.02,
      lng: -74.0721 + (Math.random() - 0.5) * 0.02
    };
  }

  private extractCity(address: string): string | null {
    if (!address) {
      return null;
    }

    const knownCitiesRegex = /(Bogotá|Medellín|Cali|Barranquilla|Cartagena|San Francisco|New York|Los Angeles|Chicago)/i;
    const match = address.match(knownCitiesRegex);
    if (match) {
      return match[0];
    }

    const parts = address.split(',').map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }

    return null;
  }

  private initMap(): void {
    const mapElement = document.getElementById('routeDetailMap');

    if (!mapElement) {
      console.error('No se encontró el contenedor del mapa');
      return;
    }

    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps no está disponible');
      this.error = this.translateService.instant('routeDetail.errors.mapsNotLoaded');
      return;
    }

    const defaultCenter = this.waypointsWithCoords.find(wp => wp.latitude && wp.longitude);
    const center = defaultCenter
      ? {lat: defaultCenter.latitude!, lng: defaultCenter.longitude!}
      : {lat: 4.711, lng: -74.0721};

    this.map = new google.maps.Map(mapElement, {
      center,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#5F6AB0',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    this.addMarkersToMap();
  }

  private addMarkersToMap(): void {
    if (!this.map) {
      return;
    }

    // Limpiar marcadores anteriores
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];

    const validWaypoints = this.waypointsWithCoords.filter(
      waypoint => waypoint.latitude !== undefined && waypoint.longitude !== undefined
    );

    if (!validWaypoints.length) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const groupedWaypoints = this.groupWaypointsByCoordinate(validWaypoints);

    groupedWaypoints.forEach((groupStops) => {
      const representative = groupStops[0];
      const position = {lat: representative.latitude!, lng: representative.longitude!};
      const hasDelivery = groupStops.some(stop => !stop.pickup);
      const color = hasDelivery ? this.successColor : this.pickupFillColor;

      const marker = new google.maps.Marker({
        position,
        map: this.map,
        label: {
          text: representative.displaySequence.toString(),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3
        },
        title: groupStops.length > 1
          ? groupStops.map(stop => `${stop.displaySequence}. ${stop.pointName}`).join(', ')
          : `${representative.displaySequence}. ${representative.pointName}`
      });

      const listItems = groupStops
        .sort((a, b) => a.displaySequence - b.displaySequence)
        .map(stop => `
          <div style="margin-bottom:8px;">
            <strong style="color:${stop.pickup ? this.pickupFillColor : this.successColor};">
              ${stop.displaySequence}. ${stop.pointName}
            </strong>
            <div style="color:#666; font-size:12px; margin-top:4px;">
              ${stop.pointAddress}
            </div>
            <div style="color:${stop.pickup ? this.pickupFillColor : this.successColor}; font-size:12px; margin-top:4px;">
              ${this.getWaypointTypeLabel(stop.pickup)}
            </div>
          </div>
        `).join('');

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: 'Nunito', sans-serif; padding: 8px; max-width: 220px;">
            ${listItems}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });

      this.markers.push(marker);
      bounds.extend(position);
    });

    if (this.markers.length > 1) {
      this.map.fitBounds(bounds);
      this.drawRoute(validWaypoints);
    } else if (this.markers.length === 1) {
      this.map.setCenter(bounds.getCenter());
      this.map.setZoom(13);
    }
  }

  private drawRoute(waypoints: RouteWaypointWithCoords[]): void {
    if (!this.directionsService || !this.directionsRenderer) {
      return;
    }

    const ordered = [...waypoints].sort((a, b) => a.sequence - b.sequence);
    if (ordered.length < 2) {
      return;
    }

    const origin = {lat: ordered[0].latitude!, lng: ordered[0].longitude!};
    const destination = {
      lat: ordered[ordered.length - 1].latitude!,
      lng: ordered[ordered.length - 1].longitude!
    };

    const mapWaypoints = ordered.slice(1, -1).map(stop => ({
      location: {lat: stop.latitude!, lng: stop.longitude!},
      stopover: true
    }));

    this.directionsService.route({
      origin,
      destination,
      waypoints: mapWaypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    }, (response: any, status: any) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(response);
      } else {
        this.drawSimpleLine(ordered);
      }
    });
  }

  private groupWaypointsByCoordinate(waypoints: RouteWaypointWithCoords[]): RouteWaypointWithCoords[][] {
    const groups = new Map<string, RouteWaypointWithCoords[]>();

    waypoints.forEach(waypoint => {
      const key = `${waypoint.latitude?.toFixed(6)}_${waypoint.longitude?.toFixed(6)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(waypoint);
    });

    return Array.from(groups.values());
  }

  private drawSimpleLine(waypoints: RouteWaypointWithCoords[]): void {
    const path = waypoints
      .filter(wp => wp.latitude && wp.longitude)
      .map(wp => ({lat: wp.latitude!, lng: wp.longitude!}));

    new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#5F6AB0',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: this.map
    });
  }

  private resetMap(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }
    this.map = null;
    this.directionsService = null;
    this.directionsRenderer = null;
  }
}

