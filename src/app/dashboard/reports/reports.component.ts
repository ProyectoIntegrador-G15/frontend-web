import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
import {NzNotificationService} from 'ng-zorro-antd/notification';

import {ReportsService, Report, ReportsPaginatedResponse} from '../../shared/services/reports.service';

@Component({
  selector: 'app-reports',
  templateUrl: 'reports.component.html',
  styleUrls: ['reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  reports: Report[] = [];
  isLoading = false;
  errorMessage = '';

  currentPage = 1;
  pageSize = 5;
  totalReports = 0;

  isGenerateReportModalVisible = false;
  isGenerateReportModalLoading = false;
  generateReportForm: FormGroup;

  availableYears: number[] = [];
  availableMonths: { value: number; label: string }[] = [];
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private translateService: TranslateService,
    private reportsService: ReportsService,
    private notification: NzNotificationService
  ) {
  }

  ngOnInit(): void {
    this.loadReports();
    this.generateAvailableYears();
    this.generateAvailableMonths(this.currentYear);
    this.initGenerateReportForm();

    this.subscription.add(
      this.translateService.onLangChange.subscribe(() => {
        this.generateAvailableMonths(this.currentYear);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const reportsSubscription = this.reportsService.getReportsPaginated(this.currentPage)
      .subscribe({
        next: (response: ReportsPaginatedResponse) => {
          this.reports = response.reports.map(report => {
            const transformedReport = this.transformReport(report);
            transformedReport.reportMonth = this.getTranslatedMonthName(report.month);
            return transformedReport;
          });
          this.totalReports = response.total;
          this.pageSize = response.page_size;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading reports:', error);
          this.errorMessage = 'Error al cargar los reportes.';
          this.isLoading = false;
          this.notification.error(
            this.translateService.instant('common.error'),
            this.translateService.instant('reports.loadingError')
          );
        }
      });

    this.subscription.add(reportsSubscription);
  }

  private transformReport(apiReport: any): Report {
    return {
      id: apiReport.id.toString(),
      createdAt: apiReport.created_at,
      reportMonth: '', // Se llenará con traducciones
      reportMonthNumber: apiReport.month,
      reportYear: apiReport.year,
      generatedBy: `User ${apiReport.created_by}`,
      status: this.mapStatus(apiReport.status),
      downloadUrl: apiReport.report_url || undefined
    };
  }

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

  onPageIndexChange(page: number): void {
    this.currentPage = page;
    this.loadReports();
  }

  generateReport(): void {
    this.isGenerateReportModalVisible = true;
  }

  generateAvailableYears(): void {
    this.availableYears = [];
    for (let i = this.currentYear; i >= this.currentYear - 5; i--) {
      this.availableYears.push(i);
    }
  }

  generateAvailableMonths(selectedYear: number): void {
    const monthKeys = [
      'reports.months.january', 'reports.months.february', 'reports.months.march', 'reports.months.april',
      'reports.months.may', 'reports.months.june', 'reports.months.july', 'reports.months.august',
      'reports.months.september', 'reports.months.october', 'reports.months.november', 'reports.months.december'
    ];

    this.availableMonths = [];

    const maxMonth = selectedYear === this.currentYear ? this.currentMonth : 12;

    for (let i = 1; i <= maxMonth; i++) {
      this.availableMonths.push({
        value: i,
        label: this.translateService.instant(monthKeys[i - 1])
      });
    }
  }

  initGenerateReportForm(): void {
    this.generateReportForm = this.fb.group({
      month: [this.currentMonth, [Validators.required]],
      year: [this.currentYear, [Validators.required]]
    });

    this.generateReportForm.get('year')?.valueChanges.subscribe((year) => {
      if (year) {
        this.generateAvailableMonths(year);
        const currentMonth = this.generateReportForm.get('month')?.value;
        if (currentMonth && !this.availableMonths.some(m => m.value === currentMonth)) {
          this.generateReportForm.get('month')?.setValue(null);
        }
      } else {
        this.generateAvailableMonths(this.currentYear);
      }
    });
  }

  handleGenerateReportModalCancel(): void {
    this.isGenerateReportModalVisible = false;
    this.isGenerateReportModalLoading = false;
    this.resetGenerateReportForm();
  }

  handleGenerateReportModalOk(): void {
    if (!this.validateGenerateReportFormFields()) {
      return;
    }

    if (this.isGenerateReportModalLoading) {
      return;
    }

    this.isGenerateReportModalLoading = true;

    const formData = this.generateReportForm.value;
    const reportData = {
      month: formData.month,
      year: formData.year
    };

    const createReportSubscription = this.reportsService.createReport(reportData)
      .subscribe({
        next: (response) => {
          this.isGenerateReportModalLoading = false;
          this.isGenerateReportModalVisible = false;
          this.resetGenerateReportForm();

          // Recargar la lista de reportes
          this.loadReports();

          const monthName = this.getTranslatedMonthName(formData.month);
          this.notification.success(
            this.translateService.instant('common.success'),
            this.translateService.instant('reports.reportGeneratedSuccess', { 
              month: monthName, 
              year: formData.year 
            })
          );
        },
        error: (error) => {
          console.error('Error creating report:', error);
          this.isGenerateReportModalLoading = false;
          this.notification.error(
            this.translateService.instant('common.error'),
            this.translateService.instant('reports.reportCreatedError')
          );
        }
      });

    this.subscription.add(createReportSubscription);
  }

  private getTranslatedMonthName(monthNumber: number): string {
    const monthKeys = [
      'reports.months.january', 'reports.months.february', 'reports.months.march', 'reports.months.april',
      'reports.months.may', 'reports.months.june', 'reports.months.july', 'reports.months.august',
      'reports.months.september', 'reports.months.october', 'reports.months.november', 'reports.months.december'
    ];

    return this.translateService.instant(monthKeys[monthNumber - 1]);
  }

  resetGenerateReportForm(): void {
    this.generateReportForm.reset({
      month: this.currentMonth,
      year: this.currentYear
    });
  }

  validateGenerateReportFormFields(): boolean {
    for (const i in this.generateReportForm.controls) {
      this.generateReportForm.controls[i].markAsDirty();
      this.generateReportForm.controls[i].updateValueAndValidity();
    }
    return this.generateReportForm.valid;
  }

  getFieldStatus(fieldName: string): string {
    const field = this.generateReportForm.get(fieldName);
    if (field && field.dirty && field.invalid) {
      return 'error';
    }
    return '';
  }

  getFieldError(fieldName: string): string {
    const field = this.generateReportForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors.required) {
        return this.translateService.instant('reports.requiredField');
      }
    }
    return '';
  }

  downloadReport(report: Report): void {
    if (report.status === 'completed' && report.downloadUrl) {
      // Abrir la URL del reporte en una nueva pestaña
      window.open(report.downloadUrl, '_blank');
      this.notification.success(
        'Descarga iniciada',
        `Descargando reporte ${report.id}...`
      );
    } else {
      this.notification.warning(
        'No disponible',
        'El reporte aún no está disponible para descarga.'
      );
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return this.translateService.instant('reports.statusPending');
      case 'processing':
        return this.translateService.instant('reports.statusProcessing');
      case 'completed':
        return this.translateService.instant('reports.statusCompleted');
      case 'failed':
        return this.translateService.instant('reports.statusFailed');
      default:
        return this.translateService.instant('reports.statusUnknown');
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'clock-circle';
      case 'processing':
        return 'loading';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'close-circle';
      default:
        return 'question-circle';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
