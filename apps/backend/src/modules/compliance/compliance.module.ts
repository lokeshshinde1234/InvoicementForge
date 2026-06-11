import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ClientNotification } from '../portal/client-notification.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DocumentRecord } from './document-record.entity';
import { EInvoiceRecord } from './e-invoice-record.entity';
import { GstReport } from './gst-report.entity';
import { IntegrationConnection } from './integration-connection.entity';
import { KhataEntry } from './khata-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentRecord,
      GstReport,
      EInvoiceRecord,
      KhataEntry,
      IntegrationConnection,
      Invoice,
      Client,
      ClientNotification,
      BusinessSettings,
      Tenant,
    ]),
    SubscriptionsModule,
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService],
})
export class ComplianceModule {}
