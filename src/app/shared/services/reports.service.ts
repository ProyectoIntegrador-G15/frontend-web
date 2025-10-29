import {Injectable, inject} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {catchError} from 'rxjs/operators';
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
  created_at: string;
  completed_at?: string | null;
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

  createReport(reportData: { month: number; year: number; created_by: number }): Observable<ReportApiResponse> {
    reportData.created_by = 1;
    return this.apiService.postDirect<ReportApiResponse>(
      `${this.endpointsService.getEndpointPath('reports')}/orders-by-seller`, reportData)
      .pipe(catchError(this.handleError));
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
      status: this.mapStatus(apiReport.status)
    };
  }

  getReportDownloadUrl(reportId: number): Observable<{ download_url: string; expires_in_minutes: number; report_id: number }>{
    const url = `${this.endpointsService.getEndpointPath('reports')}/${reportId}/download`;
    return this.apiService.getDirect<{ download_url: string; expires_in_minutes: number; report_id: number }>(url)
      .pipe(catchError(this.handleError));
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
