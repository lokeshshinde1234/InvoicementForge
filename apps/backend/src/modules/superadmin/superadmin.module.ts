import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { DocumentRecord } from '../compliance/document-record.entity';
import { EInvoiceRecord } from '../compliance/e-invoice-record.entity';
import { GstReport } from '../compliance/gst-report.entity';
import { IntegrationConnection } from '../compliance/integration-connection.entity';
import { KhataEntry } from '../compliance/khata-entry.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Payment } from '../payments/payment.entity';
import { ClientPortalOtp } from '../portal/client-portal-otp.entity';
import { ProposalApprovalDocument } from '../portal/proposal-approval-document.entity';
import { Proposal } from '../proposals/proposal.entity';
import { DemoRequest } from '../subscriptions/demo-request.entity';
import { SubscriptionPayment } from '../subscriptions/subscription-payment.entity';
import { TemplatesModule } from '../templates/templates.module';
import { Tenant } from '../tenants/tenant.entity';
import { TeamTask } from '../users/team-task.entity';
import { User } from '../users/user.entity';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      ClientPortalOtp,
      Invoice,
      Payment,
      ProposalApprovalDocument,
      Proposal,
      Tenant,
      TeamTask,
      User,
    ]),
    TypeOrmModule.forFeature([
      ActivityLog,
      BusinessSettings,
      DocumentRecord,
      EInvoiceRecord,
      GstReport,
      IntegrationConnection,
      KhataEntry,
      DemoRequest,
      SubscriptionPayment,
    ]),
    TemplatesModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
