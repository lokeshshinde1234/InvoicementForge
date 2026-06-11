import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/user.entity';
import type {
  PlatformClient,
  PlatformInvoice,
  PlatformPayment,
  PlatformProposal,
  PlatformRecord,
  PlatformSummary,
  PlatformTemplate,
  PlatformTenant,
  PlatformUser,
  UpdateDemoRequestDto,
  UpdatePlatformClientDto,
  UpdatePlatformTenantDto,
} from './superadmin.service';
import { SuperadminService } from './superadmin.service';

@UseGuards(JwtAuthGuard)
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('summary')
  getSummary(@CurrentUser() user?: JwtPayload): Promise<PlatformSummary> {
    this.assertSuperadmin(user);
    return this.superadminService.getSummary();
  }

  @Get('tenants')
  findTenants(@CurrentUser() user?: JwtPayload): Promise<PlatformTenant[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findTenants();
  }

  @Patch('tenants/:id')
  updateTenant(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformTenantDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformTenant> {
    this.assertSuperadmin(user);
    return this.superadminService.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  async deleteTenant(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteTenant(id);
    return { deleted: true };
  }

  @Get('users')
  findUsers(@CurrentUser() user?: JwtPayload): Promise<PlatformUser[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findUsers();
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteUser(id, user.sub);
    return { deleted: true };
  }

  @Get('clients')
  findClients(@CurrentUser() user?: JwtPayload): Promise<PlatformClient[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findClients();
  }

  @Patch('clients/:id')
  updateClient(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformClientDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformClient> {
    this.assertSuperadmin(user);
    return this.superadminService.updateClient(id, dto);
  }

  @Delete('clients/:id')
  async deleteClient(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteClient(id);
    return { deleted: true };
  }

  @Get('proposals')
  findProposals(@CurrentUser() user?: JwtPayload): Promise<PlatformProposal[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findProposals();
  }

  @Delete('proposals/:id')
  async deleteProposal(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteProposal(id);
    return { deleted: true };
  }

  @Get('templates')
  findTemplates(@CurrentUser() user?: JwtPayload): PlatformTemplate[] {
    this.assertSuperadmin(user);
    return this.superadminService.findTemplates();
  }

  @Get('invoices')
  findInvoices(@CurrentUser() user?: JwtPayload): Promise<PlatformInvoice[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findInvoices();
  }

  @Delete('invoices/:id')
  async deleteInvoice(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteInvoice(id);
    return { deleted: true };
  }

  @Get('payments')
  findPayments(@CurrentUser() user?: JwtPayload): Promise<PlatformPayment[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findPayments();
  }

  @Delete('payments/:id')
  async deletePayment(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deletePayment(id);
    return { deleted: true };
  }

  @Get('demo-requests')
  findDemoRequests(
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findDemoRequests();
  }

  @Patch('demo-requests/:id')
  updateDemoRequest(
    @Param('id') id: string,
    @Body() dto: UpdateDemoRequestDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformRecord> {
    this.assertSuperadmin(user);
    return this.superadminService.updateDemoRequest(id, dto);
  }

  @Delete('demo-requests/:id')
  async deleteDemoRequest(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteDemoRequest(id);
    return { deleted: true };
  }

  @Get('subscriptions')
  findSubscriptions(
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findSubscriptions();
  }

  @Delete('subscriptions/:id')
  async deleteSubscription(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteSubscription(id);
    return { deleted: true };
  }

  @Get('gst-reports')
  findGstReports(@CurrentUser() user?: JwtPayload): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findGstReports();
  }

  @Delete('gst-reports/:id')
  async deleteGstReport(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteGstReport(id);
    return { deleted: true };
  }

  @Get('e-invoices')
  findEInvoices(@CurrentUser() user?: JwtPayload): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findEInvoices();
  }

  @Delete('e-invoices/:id')
  async deleteEInvoice(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteEInvoice(id);
    return { deleted: true };
  }

  @Get('khata')
  findKhataEntries(
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findKhataEntries();
  }

  @Delete('khata/:id')
  async deleteKhataEntry(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteKhataEntry(id);
    return { deleted: true };
  }

  @Get('documents')
  findDocuments(@CurrentUser() user?: JwtPayload): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findDocuments();
  }

  @Delete('documents/:id')
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteDocument(id);
    return { deleted: true };
  }

  @Get('integrations')
  findIntegrations(
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findIntegrations();
  }

  @Delete('integrations/:id')
  async deleteIntegration(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteIntegration(id);
    return { deleted: true };
  }

  @Get('audit-logs')
  findAuditLogs(@CurrentUser() user?: JwtPayload): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.findAuditLogs();
  }

  @Delete('audit-logs/:id')
  async deleteAuditLog(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<{ deleted: true }> {
    this.assertSuperadmin(user);
    await this.superadminService.deleteAuditLog(id);
    return { deleted: true };
  }

  @Get('analytics')
  getAnalytics(@CurrentUser() user?: JwtPayload): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.getAnalytics();
  }

  @Get('global-settings')
  getGlobalSettings(
    @CurrentUser() user?: JwtPayload,
  ): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.getGlobalSettings();
  }

  @Get('system-health')
  getSystemHealth(@CurrentUser() user?: JwtPayload): Promise<PlatformRecord[]> {
    this.assertSuperadmin(user);
    return this.superadminService.getSystemHealth();
  }

  private assertSuperadmin(user?: JwtPayload): asserts user is JwtPayload {
    if (user?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Superadmin access required');
    }
  }
}
