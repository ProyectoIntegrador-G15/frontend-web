import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { of, throwError, Subject } from 'rxjs';
import { Pipe, PipeTransform } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ReportsComponent } from './reports.component';
import { ReportsService, Report, ReportApiResponse, ReportsPaginatedResponse } from '../../shared/services/reports.service';

@Pipe({ name: 'customTranslate' })
class MockCustomTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockReportsService: jasmine.SpyObj<ReportsService>;
  let mockNotificationService: jasmine.SpyObj<NzNotificationService>;
  let windowOpenSpy: jasmine.Spy;

  const mockReportsPaginatedResponse: ReportsPaginatedResponse = {
    reports: [
      {
        id: 1,
        creation_date: '2025-10-30T00:00:00',
        month: 10,
        year: 2025,
        created_by: 1,
        status: 'completed',
        created_at: '2025-10-30T10:00:00Z',
        completed_at: '2025-10-30T10:05:00Z'
      },
      {
        id: 2,
        creation_date: '2025-09-30T00:00:00',
        month: 9,
        year: 2025,
        created_by: 1,
        status: 'processing',
        created_at: '2025-09-30T10:00:00Z',
        completed_at: null
      }
    ],
    total: 2,
    total_pages: 1,
    page: 1,
    page_size: 5
  };

  const mockReport: Report = {
    id: '1',
    createdAt: '2025-10-30T10:00:00Z',
    reportMonth: 'Octubre',
    reportMonthNumber: 10,
    reportYear: 2025,
    generatedBy: 'User 1',
    status: 'completed'
  };

  beforeEach(async () => {
    const translateSpy = jasmine.createSpyObj('TranslateService', ['instant', 'onLangChange'], {
      currentLang: 'es-CO'
    });
    translateSpy.instant.and.returnValue('translated');
    translateSpy.onLangChange = new Subject();

    const reportsServiceSpy = jasmine.createSpyObj('ReportsService', [
      'getReportsPaginated',
      'createReport'
    ]);

    const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error', 'warning']);

    // Mock window.open para prevenir descargas reales durante los tests
    windowOpenSpy = spyOn(window, 'open').and.returnValue(null);

    // Mock document.createElement para prevenir descargas de archivos estáticos
    // Esto previene que métodos como downloadStaticFile de otros componentes ejecuten descargas reales
    const originalCreateElement = document.createElement.bind(document);
    spyOn(document, 'createElement').and.callFake((tagName: string) => {
      if (tagName === 'a') {
        // Crear un elemento <a> mockeado que no ejecute click real
        const mockLink = originalCreateElement('a') as HTMLAnchorElement;
        spyOn(mockLink, 'click').and.stub();
        return mockLink;
      }
      return originalCreateElement(tagName);
    });

    await TestBed.configureTestingModule({
      declarations: [
        ReportsComponent,
        MockCustomTranslatePipe
      ],
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        FormBuilder,
        { provide: TranslateService, useValue: translateSpy },
        { provide: ReportsService, useValue: reportsServiceSpy },
        { provide: NzNotificationService, useValue: notificationSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    mockReportsService = TestBed.inject(ReportsService) as jasmine.SpyObj<ReportsService>;
    mockNotificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;

    // Setup default mocks
    mockReportsService.getReportsPaginated.and.returnValue(of(mockReportsPaginatedResponse));
  });

  afterEach(() => {
    // Resetear el spy después de cada test para evitar efectos secundarios
    windowOpenSpy.calls.reset();
  });

  it('should create', () => {
    // Asegurarse de que window.open no se ejecute durante la inicialización
    fixture.detectChanges();
    expect(component).toBeTruthy();
    // No debería haber llamado a window.open durante la creación
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  describe('ngOnInit', () => {
    it('should initialize component and load reports', () => {
      spyOn(component as any, 'loadReports');
      spyOn(component, 'generateAvailableYears');
      spyOn(component, 'generateAvailableMonths');
      spyOn(component, 'initGenerateReportForm');

      component.ngOnInit();

      expect((component as any).loadReports).toHaveBeenCalled();
      expect(component.generateAvailableYears).toHaveBeenCalled();
      expect(component.generateAvailableMonths).toHaveBeenCalled();
      expect(component.initGenerateReportForm).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions and timer', () => {
      (component as any).reloadTimer = setTimeout(() => {}, 1000);
      spyOn((component as any).subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect((component as any).subscription.unsubscribe).toHaveBeenCalled();
      expect((component as any).reloadTimer).toBeNull();
    });

    it('should handle null timer gracefully', () => {
      (component as any).reloadTimer = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('loadReports', () => {
    it('should load reports successfully', () => {
      (component as any).loadReports();

      expect(mockReportsService.getReportsPaginated).toHaveBeenCalledWith(1);
      expect(component.reports.length).toBe(2);
      expect(component.totalReports).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should show success notification when showSuccess is true', () => {
      (component as any).loadReports(true);

      expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should handle error when loading reports fails', () => {
      mockReportsService.getReportsPaginated.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      (component as any).loadReports();

      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('onPageIndexChange', () => {
    it('should change page and reload reports', () => {
      spyOn(component as any, 'loadReports');

      component.onPageIndexChange(2);

      expect(component.currentPage).toBe(2);
      expect((component as any).loadReports).toHaveBeenCalled();
    });
  });

  describe('refreshReports', () => {
    it('should call loadReports with showSuccess flag', () => {
      spyOn(component as any, 'loadReports');

      component.refreshReports();

      expect((component as any).loadReports).toHaveBeenCalledWith(true);
    });
  });

  describe('generateReport', () => {
    it('should show generate report modal', () => {
      component.generateReport();

      expect(component.isGenerateReportModalVisible).toBeTrue();
    });
  });

  describe('generateAvailableYears', () => {
    it('should generate years from current year going back 5 years', () => {
      component.currentYear = 2025;
      component.generateAvailableYears();

      expect(component.availableYears.length).toBe(6);
      expect(component.availableYears[0]).toBe(2025);
      expect(component.availableYears[5]).toBe(2020);
    });
  });

  describe('generateAvailableMonths', () => {
    beforeEach(() => {
      mockTranslateService.instant.and.returnValue('Month');
    });

    it('should generate all 12 months for past year', () => {
      component.currentYear = 2025;
      component.currentMonth = 10;

      component.generateAvailableMonths(2024);

      expect(component.availableMonths.length).toBe(12);
    });

    it('should generate months up to current month for current year', () => {
      component.currentYear = 2025;
      component.currentMonth = 10;

      component.generateAvailableMonths(2025);

      expect(component.availableMonths.length).toBe(10);
    });
  });

  describe('handleGenerateReportModalCancel', () => {
    it('should close modal and reset form', () => {
      spyOn(component, 'resetGenerateReportForm');

      component.handleGenerateReportModalCancel();

      expect(component.isGenerateReportModalVisible).toBeFalse();
      expect(component.isGenerateReportModalLoading).toBeFalse();
      expect(component.resetGenerateReportForm).toHaveBeenCalled();
    });
  });

  describe('handleGenerateReportModalOk', () => {
    beforeEach(() => {
      component.initGenerateReportForm();
      component.generateReportForm.patchValue({ month: 10, year: 2025 });
    });

    it('should not create report if form is invalid', () => {
      component.generateReportForm.patchValue({ month: null, year: null });

      component.handleGenerateReportModalOk();

      expect(mockReportsService.createReport).not.toHaveBeenCalled();
    });

    it('should not create report if already loading', () => {
      component.isGenerateReportModalLoading = true;

      component.handleGenerateReportModalOk();

      expect(mockReportsService.createReport).not.toHaveBeenCalled();
    });

    it('should create report successfully', fakeAsync(() => {
      const mockResponse: ReportApiResponse = {
        id: 1,
        creation_date: '2025-10-30T00:00:00',
        month: 10,
        year: 2025,
        created_by: 1,
        status: 'processing',
        created_at: '2025-10-30T10:00:00Z',
        completed_at: null
      };

      mockReportsService.createReport.and.returnValue(of(mockResponse));
      spyOn(component as any, 'loadReports');
      spyOn(component as any, 'getTranslatedMonthName').and.returnValue('Octubre');

      component.handleGenerateReportModalOk();

      expect(mockReportsService.createReport).toHaveBeenCalledWith({
        month: 10,
        year: 2025,
        created_by: 1
      });
      expect((component as any).loadReports).toHaveBeenCalled();
      expect(mockNotificationService.success).toHaveBeenCalled();

      tick(3000);
      expect((component as any).loadReports).toHaveBeenCalledTimes(2);
    }));

    it('should handle error when creating report fails', () => {
      mockReportsService.createReport.and.returnValue(
        throwError(() => new Error('Creation failed'))
      );

      component.handleGenerateReportModalOk();

      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(component.isGenerateReportModalLoading).toBeFalse();
    });
  });

  describe('getTranslatedMonthName', () => {
    it('should return translated month name', () => {
      mockTranslateService.instant.and.returnValue('Octubre');

      const result = (component as any).getTranslatedMonthName(10);

      expect(result).toBe('Octubre');
      expect(mockTranslateService.instant).toHaveBeenCalledWith('reports.months.october');
    });
  });

  describe('resetGenerateReportForm', () => {
    it('should reset form to current month and year', () => {
      component.currentMonth = 10;
      component.currentYear = 2025;
      component.initGenerateReportForm();
      component.generateReportForm.patchValue({ month: 5, year: 2020 });

      component.resetGenerateReportForm();

      expect(component.generateReportForm.get('month')?.value).toBe(10);
      expect(component.generateReportForm.get('year')?.value).toBe(2025);
    });
  });

  describe('validateGenerateReportFormFields', () => {
    it('should return true for valid form', () => {
      component.initGenerateReportForm();
      component.generateReportForm.patchValue({ month: 10, year: 2025 });

      const result = component.validateGenerateReportFormFields();

      expect(result).toBeTrue();
    });

    it('should return false for invalid form', () => {
      component.initGenerateReportForm();
      component.generateReportForm.patchValue({ month: null, year: null });

      const result = component.validateGenerateReportFormFields();

      expect(result).toBeFalse();
    });
  });

  describe('getFieldStatus', () => {
    beforeEach(() => {
      component.initGenerateReportForm();
    });

    it('should return empty string for valid field', () => {
      const result = component.getFieldStatus('month');

      expect(result).toBe('');
    });

    it('should return "error" for invalid dirty field', () => {
      component.generateReportForm.get('month')?.setValue(null);
      component.generateReportForm.get('month')?.markAsDirty();

      const result = component.getFieldStatus('month');

      expect(result).toBe('error');
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => {
      component.initGenerateReportForm();
      mockTranslateService.instant.and.returnValue('Este campo es obligatorio');
    });

    it('should return error message for required field', () => {
      component.generateReportForm.get('month')?.setValue(null);

      const result = component.getFieldError('month');

      expect(result).toBe('Este campo es obligatorio');
    });

    it('should return empty string when no errors', () => {
      component.generateReportForm.patchValue({ month: 10, year: 2025 });

      const result = component.getFieldError('month');

      expect(result).toBe('');
    });
  });

  describe('downloadReport', () => {
    it('should show warning if report is not completed', () => {
      const report: Report = { ...mockReport, status: 'processing' };

      component.downloadReport(report);

      expect(mockNotificationService.warning).toHaveBeenCalled();
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });

    it('should download report successfully using public URL', () => {
      const report: Report = { ...mockReport, downloadUrl: 'https://storage.googleapis.com/bucket/reports/1/file.csv' };

      component.downloadReport(report);

      expect(windowOpenSpy).toHaveBeenCalledWith(report.downloadUrl, '_blank');
      expect(windowOpenSpy.calls.first().returnValue).toBeNull();
      expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should handle error when download URL is missing', () => {
      const report: Report = { ...mockReport, downloadUrl: undefined };

      component.downloadReport(report);

      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for pending status', () => {
      const result = component.getStatusColor('pending');
      expect(result).toContain('blue');
    });

    it('should return correct color for processing status', () => {
      const result = component.getStatusColor('processing');
      expect(result).toContain('yellow');
    });

    it('should return correct color for completed status', () => {
      const result = component.getStatusColor('completed');
      expect(result).toContain('green');
    });

    it('should return correct color for failed status', () => {
      const result = component.getStatusColor('failed');
      expect(result).toContain('red');
    });

    it('should return default color for unknown status', () => {
      const result = component.getStatusColor('unknown');
      expect(result).toContain('gray');
    });
  });

  describe('getStatusText', () => {
    it('should return translated status text', () => {
    mockTranslateService.instant.and.returnValue('Completado');

    const result = component.getStatusText('completed');

    expect(result).toBe('Completado');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('reports.statusCompleted');
    });
  });

  describe('getStatusIcon', () => {
    it('should return clock-circle for pending', () => {
      expect(component.getStatusIcon('pending')).toBe('clock-circle');
    });

    it('should return loading for processing', () => {
      expect(component.getStatusIcon('processing')).toBe('loading');
    });

    it('should return check-circle for completed', () => {
      expect(component.getStatusIcon('completed')).toBe('check-circle');
    });

    it('should return close-circle for failed', () => {
      expect(component.getStatusIcon('failed')).toBe('close-circle');
    });

    it('should return question-circle for unknown', () => {
      expect(component.getStatusIcon('unknown')).toBe('question-circle');
    });
  });

  describe('formatDate', () => {
    it('should format date with timezone', () => {
      mockTranslateService.currentLang = 'es-CO';
      const dateSpy = spyOn(Intl, 'DateTimeFormat').and.returnValue({
        format: (date: Date) => '30 oct 2025, 10:00'
      } as any);

      const result = component.formatDate('2025-10-30T10:00:00Z');

      expect(result).toBeDefined();
      expect(dateSpy).toHaveBeenCalled();
    });

    it('should handle date without timezone', () => {
      mockTranslateService.currentLang = 'es-CO';
      spyOn(Intl, 'DateTimeFormat').and.returnValue({
        format: (date: Date) => '30 oct 2025, 10:00'
      } as any);

      const result = component.formatDate('2025-10-30T10:00:00');

      expect(result).toBeDefined();
    });

    it('should fallback on formatting error', () => {
      mockTranslateService.currentLang = 'es-CO';
      spyOn(Date.prototype, 'toLocaleDateString').and.returnValue('30/10/2025');

      spyOn(Intl, 'DateTimeFormat').and.throwError('Format error');

      const result = component.formatDate('2025-10-30T10:00:00Z');

      expect(result).toBeDefined();
      expect(Date.prototype.toLocaleDateString).toHaveBeenCalled();
    });
  });

  describe('getLocaleTimeZone', () => {
    it('should return correct timezone for es-CO', () => {
      expect((component as any).getLocaleTimeZone('es-CO')).toBe('America/Bogota');
    });

    it('should return correct timezone for es-MX', () => {
      expect((component as any).getLocaleTimeZone('es-MX')).toBe('America/Mexico_City');
    });

    it('should return UTC for unknown locale', () => {
      expect((component as any).getLocaleTimeZone('unknown')).toBe('UTC');
    });
  });

  describe('ensureUtcDate', () => {
    it('should preserve date with timezone', () => {
      const date = (component as any).ensureUtcDate('2025-10-30T10:00:00Z');
      expect(date).toBeInstanceOf(Date);
    });

    it('should add Z to date without timezone', () => {
      const date = (component as any).ensureUtcDate('2025-10-30T10:00:00');
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle date with offset', () => {
      const date = (component as any).ensureUtcDate('2025-10-30T10:00:00+05:00');
      expect(date).toBeInstanceOf(Date);
    });
  });
});
