import { ComplianceService } from './compliance.service';
import { GstReport } from './gst-report.entity';
import { GstReportStatus, GstReportType } from './gst-report.entity';

describe('ComplianceService', () => {
  function createServiceWithStaleGstReport() {
    const staleReport = {
      id: 'report-1',
      tenantId: 'tenant-1',
      type: GstReportType.GSTR_1,
      period: '2026-06',
      status: GstReportStatus.READY,
      summary: { totals: { invoiceValue: 999 } },
      rows: [{ invoiceId: 'deleted-invoice', invoiceNumber: 'INV-DELETED' }],
      createdAt: new Date('2026-06-07T00:00:00.000Z'),
      updatedAt: new Date('2026-06-07T00:00:00.000Z'),
    } as GstReport;
    const gstReportsRepository = {
      find: jest.fn().mockResolvedValue([staleReport]),
      save: jest.fn((report: GstReport): Promise<GstReport> => {
        return Promise.resolve(report);
      }),
    };
    const invoicesRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const clientsRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    const clientNotificationsRepository = {};
    const tenantsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const businessSettingsRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    return {
      service: new ComplianceService(
        {} as never,
        gstReportsRepository as never,
        {} as never,
        {} as never,
        {} as never,
        invoicesRepository as never,
        clientsRepository as never,
        clientNotificationsRepository as never,
        businessSettingsRepository as never,
        tenantsRepository as never,
        {} as never,
      ),
      gstReportsRepository,
    };
  }

  it('refreshes generated GST report rows from currently available invoices', async () => {
    const { service, gstReportsRepository } = createServiceWithStaleGstReport();

    const reports: GstReport[] = await service.findGstReports('tenant-1');
    const summary = reports[0].summary as {
      counts?: { invoices?: number; rows?: number };
      note?: string;
    };

    expect(reports[0].rows).toEqual([]);
    expect(summary.counts?.invoices).toBe(0);
    expect(summary.counts?.rows).toBe(0);
    expect(summary.note).toBe(
      'No company invoices were found for the selected period.',
    );
    expect(gstReportsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [] }),
    );
  });
});
