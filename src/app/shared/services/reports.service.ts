import {Injectable, inject} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {throwError} from 'rxjs';

import {ApiService} from './api/api.service';
import {EndpointsService} from './api/endpoints.service';

export interface ReportApiResponse {
  id: number;
  creation_date: string;
  month: number;
  year: number;
  created_by: number;
  status: string;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  createdAt: string;
  reportMonth: string;
  reportMonthNumber: number;
  reportYear: number;
  generatedBy: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
}

export interface ReportsPaginatedResponse {
  reports: ReportApiResponse[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  private apiService = inject(ApiService);
  private endpointsService = inject(EndpointsService);

  constructor() {
  }

  getReportsPaginated(page: number = 1): Observable<ReportsPaginatedResponse> {
    const params: any = {
      page: page.toString()
    };

    return this.apiService.getDirect<ReportsPaginatedResponse>(`${this.endpointsService.getEndpointPath('reports')}/list`, params)
      .pipe(catchError(this.handleError));
  }

  createReport(reportData: { month: number; year: number }): Observable<ReportApiResponse> {
    return this.apiService.postDirect<ReportApiResponse>(this.endpointsService.getEndpointPath('reports'), reportData)
      .pipe(
        map(response => {
          this.refreshReports();
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Transforma la respuesta del backend al formato del frontend
   */
  private transformReport(apiReport: ReportApiResponse): Report {
    return {
      id: apiReport.id.toString(),
      createdAt: apiReport.created_at,
      reportMonth: '',
      reportMonthNumber: apiReport.month,
      reportYear: apiReport.year,
      generatedBy: `User ${apiReport.created_by}`,
      status: this.mapStatus(apiReport.status),
      downloadUrl: apiReport.report_url || undefined
    };
  }

  /**
   * Mapea el status del backend al formato del frontend
   */
  private mapStatus(backendStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    switch (backendStatus.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'processing':
        return 'processing';
      case 'failed':
        return 'failed';
      case 'pending':
      default:
        return 'pending';
    }
  }

  private refreshReports(): void {
    this.getReportsPaginated(1).subscribe({
      next: (response) => {
        const transformedReports = response.reports.map(report => this.transformReport(report));
        this.reportsSubject.next(transformedReports);
      },
      error: (error) => {
        console.error('Error al actualizar la lista de reportes:', error);
      }
    });
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
