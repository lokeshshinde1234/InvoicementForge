import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { PdfModule } from '../pdf/pdf.module';
import { PortalMailService } from '../portal/portal-mail.service';
import { ClientNotification } from '../portal/client-notification.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Tenant } from '../tenants/tenant.entity';
import { Invoice } from './invoice.entity';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Client,
      Tenant,
      BusinessSettings,
      ClientNotification,
    ]),
    PdfModule,
    SubscriptionsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, PortalMailService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
