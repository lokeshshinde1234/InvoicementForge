import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentRecord } from '../compliance/document-record.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Proposal } from '../proposals/proposal.entity';
import { Tenant } from '../tenants/tenant.entity';
import { DemoRequest } from './demo-request.entity';
import { SubscriptionPayment } from './subscription-payment.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Proposal,
      Invoice,
      DocumentRecord,
      DemoRequest,
      SubscriptionPayment,
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
