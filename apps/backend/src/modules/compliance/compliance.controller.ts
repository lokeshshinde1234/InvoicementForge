import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationProvider } from './integration-connection.entity';
import { ComplianceService } from './compliance.service';
import type {
  CreateDocumentDto,
  CreateKhataEntryDto,
  GenerateGstReportDto,
  UpdateGstReportDto,
  UpdateIntegrationDto,
} from './compliance.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('compliance/overview')
  overview() {
    return this.complianceService.getOverview();
  }

  @Get('documents')
  documents(@CurrentTenant() tenantId: string) {
    return this.complianceService.findDocuments(tenantId);
  }

  @Post('documents')
  createDocument(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.complianceService.createDocument(tenantId, dto);
  }

  @Get('gst/reports')
  gstReports(@CurrentTenant() tenantId: string) {
    return this.complianceService.findGstReports(tenantId);
  }

  @Post('gst/reports')
  generateGstReport(
    @CurrentTenant() tenantId: string,
    @Body() dto: GenerateGstReportDto,
  ) {
    return this.complianceService.generateGstReport(tenantId, dto);
  }

  @Patch('gst/reports/:id')
  updateGstReport(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGstReportDto,
  ) {
    return this.complianceService.updateGstReport(tenantId, id, dto);
  }

  @Delete('gst/reports/:id')
  async deleteGstReport(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.complianceService.deleteGstReport(tenantId, id);
    return { deleted: true };
  }

  @Get('gst/e-invoices')
  eInvoices(@CurrentTenant() tenantId: string) {
    return this.complianceService.findEInvoices(tenantId);
  }

  @Post('gst/e-invoices/:invoiceId/validate')
  validateEInvoice(
    @CurrentTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.complianceService.validateEInvoice(tenantId, invoiceId);
  }

  @Post('gst/e-invoices/:invoiceId/generate-irn')
  generateIrn(
    @CurrentTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.complianceService.generateIrn(tenantId, invoiceId);
  }

  @Get('khata')
  khata(@CurrentTenant() tenantId: string) {
    return this.complianceService.findKhataEntries(tenantId);
  }

  @Post('khata')
  createKhata(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateKhataEntryDto,
  ) {
    return this.complianceService.createKhataEntry(tenantId, dto);
  }

  @Delete('khata/:id')
  async deleteKhata(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.complianceService.deleteKhataEntry(tenantId, id);
    return { deleted: true };
  }

  @Get('integrations')
  integrations(@CurrentTenant() tenantId: string) {
    return this.complianceService.findIntegrations(tenantId);
  }

  @Patch('integrations/:provider')
  updateIntegration(
    @CurrentTenant() tenantId: string,
    @Param('provider') provider: IntegrationProvider,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.complianceService.updateIntegration(tenantId, provider, dto);
  }

  @Get('accounting/tally-export')
  @Header('Content-Type', 'application/xml')
  @Header('Content-Disposition', 'attachment; filename="tally-export.xml"')
  tallyExport(@CurrentTenant() tenantId: string): Promise<string> {
    return this.complianceService.generateTallyXml(tenantId);
  }
}
