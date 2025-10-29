import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';

export interface Report {
  id: string;
  createdAt: string;
  reportMonth: string;
  reportMonthNumber?: number;
  reportYear: number;
  generatedBy: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: 'reports.component.html',
  styleUrls: ['reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  reports: Report[] = [];
  rawReportsData: any[] = [];
  isLoading = false;
  errorMessage = '';

  currentPage = 1;
  pageSize = 10;
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
    private translateService: TranslateService
  ) {
  }

  ngOnInit(): void {
    this.loadReports();
    this.generateAvailableYears();
    this.generateAvailableMonths(this.currentYear);
    this.initGenerateReportForm();

    this.subscription.add(
      this.translateService.onLangChange.subscribe(() => {
        this.updateReportsTranslations();
        this.generateAvailableMonths(this.currentYear);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadReports(): void {
    this.isLoading = true;

    this.rawReportsData = [
      {
        id: 'RPT-001',
        createdAt: '2024-01-15T10:30:00Z',
        reportMonthNumber: 1, // Enero
        reportYear: 2024,
        generatedBy: 'Juan Pérez',
        status: 'completed',
        downloadUrl: '/api/reports/RPT-001/download'
      },
      {
        id: 'RPT-002',
        createdAt: '2024-01-20T14:45:00Z',
        reportMonthNumber: 1, // Enero
        reportYear: 2024,
        generatedBy: 'María García',
        status: 'completed',
        downloadUrl: '/api/reports/RPT-002/download'
      },
      {
        id: 'RPT-003',
        createdAt: '2024-02-01T09:15:00Z',
        reportMonthNumber: 2, // Febrero
        reportYear: 2024,
        generatedBy: 'Carlos López',
        status: 'processing'
      },
      {
        id: 'RPT-004',
        createdAt: '2024-02-05T16:20:00Z',
        reportMonthNumber: 2, // Febrero
        reportYear: 2024,
        generatedBy: 'Ana Martínez',
        status: 'failed'
      },
      {
        id: 'RPT-005',
        createdAt: '2024-02-10T11:30:00Z',
        reportMonthNumber: 2, // Febrero
        reportYear: 2024,
        generatedBy: 'Luis Rodríguez',
        status: 'completed',
        downloadUrl: '/api/reports/RPT-005/download'
      },
      {
        id: 'RPT-006',
        createdAt: '2024-02-15T13:45:00Z',
        reportMonthNumber: 2, // Febrero
        reportYear: 2024,
        generatedBy: 'Sofia Herrera',
        status: 'completed',
        downloadUrl: '/api/reports/RPT-006/download'
      },
      {
        id: 'RPT-007',
        createdAt: '2024-02-20T08:30:00Z',
        reportMonthNumber: 2, // Febrero
        reportYear: 2024,
        generatedBy: 'Diego Morales',
        status: 'processing'
      },
      {
        id: 'RPT-008',
        createdAt: '2024-02-25T15:10:00Z',
        reportMonthNumber: 2, // Febrero
        reportYear: 2024,
        generatedBy: 'Elena Vargas',
        status: 'completed',
        downloadUrl: '/api/reports/RPT-008/download'
      },
      {
        id: 'RPT-009',
        createdAt: '2024-03-01T12:00:00Z',
        reportMonthNumber: 3, // Marzo
        reportYear: 2024,
        generatedBy: 'Roberto Silva',
        status: 'completed',
        downloadUrl: '/api/reports/RPT-009/download'
      },
      {
        id: 'RPT-010',
        createdAt: '2024-03-05T17:30:00Z',
        reportMonthNumber: 3, // Marzo
        reportYear: 2024,
        generatedBy: 'Carmen Ruiz',
        status: 'processing'
      }
    ];

    setTimeout(() => {
      this.updateReportsTranslations();
      this.totalReports = this.reports.length;
      this.isLoading = false;
    }, 1000);
  }

  private updateReportsTranslations(): void {
    const monthKeys = [
      'reports.months.january', 'reports.months.february', 'reports.months.march', 'reports.months.april',
      'reports.months.may', 'reports.months.june', 'reports.months.july', 'reports.months.august',
      'reports.months.september', 'reports.months.october', 'reports.months.november', 'reports.months.december'
    ];

    this.reports = this.rawReportsData.map(item => ({
      ...item,
      reportMonth: this.translateService.instant(monthKeys[item.reportMonthNumber - 1])
    }));
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
    this.resetGenerateReportForm();
  }

  handleGenerateReportModalOk(): void {
    if (!this.validateGenerateReportFormFields()) {
      this.isGenerateReportModalLoading = false;
      return;
    }

    this.isGenerateReportModalLoading = true;

    const formData = this.generateReportForm.value;
    const monthKeys = [
      'reports.months.january', 'reports.months.february', 'reports.months.march', 'reports.months.april',
      'reports.months.may', 'reports.months.june', 'reports.months.july', 'reports.months.august',
      'reports.months.september', 'reports.months.october', 'reports.months.november', 'reports.months.december'
    ];

    const reportData = {
      month: this.translateService.instant(monthKeys[formData.month - 1]),
      year: formData.year
    };

    setTimeout(() => {
      this.isGenerateReportModalLoading = false;
      this.isGenerateReportModalVisible = false;
      this.resetGenerateReportForm();

      // Agregar nuevo reporte a la lista
      const newReportData = {
        id: `RPT-${String(this.reports.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        reportMonthNumber: formData.month,
        reportYear: parseInt(formData.year),
        generatedBy: 'Usuario Actual', // TODO: Obtener del servicio de autenticación
        status: 'processing'
      };

      this.rawReportsData.unshift(newReportData);
      this.updateReportsTranslations();
      this.totalReports = this.reports.length;

      alert(this.translateService.instant('reports.reportGeneratedSuccess', { month: reportData.month, year: reportData.year }));
    }, 2000);
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
      // Simular descarga
      console.log(`Descargando reporte ${report.id}...`);
      // Aquí iría la lógica real de descarga
      alert(this.translateService.instant('reports.downloadingReport', { id: report.id }));
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return this.translateService.instant('reports.statusCompleted');
      case 'processing':
        return this.translateService.instant('reports.statusProcessing');
      case 'failed':
        return this.translateService.instant('reports.statusFailed');
      default:
        return this.translateService.instant('reports.statusUnknown');
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'processing':
        return 'loading';
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
