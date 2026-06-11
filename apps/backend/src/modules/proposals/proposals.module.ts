import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { InvoicesModule } from '../invoices/invoices.module';
import { PdfModule } from '../pdf/pdf.module';
import { ClientNotification } from '../portal/client-notification.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Tenant } from '../tenants/tenant.entity';
import { Proposal } from './proposal.entity';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proposal,
      Client,
      Tenant,
      BusinessSettings,
      ActivityLog,
      ClientNotification,
    ]),
    InvoicesModule,
    PdfModule,
    SubscriptionsModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
