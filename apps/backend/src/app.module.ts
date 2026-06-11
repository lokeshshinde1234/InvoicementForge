import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import './load-env';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivityLog } from './modules/activity-log/activity-log.entity';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessSettings } from './modules/business/business-settings.entity';
import { BusinessModule } from './modules/business/business.module';
import { Client } from './modules/clients/client.entity';
import { ClientsModule } from './modules/clients/clients.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { DocumentRecord } from './modules/compliance/document-record.entity';
import { EInvoiceRecord } from './modules/compliance/e-invoice-record.entity';
import { GstReport } from './modules/compliance/gst-report.entity';
import { IntegrationConnection } from './modules/compliance/integration-connection.entity';
import { KhataEntry } from './modules/compliance/khata-entry.entity';
import { Invoice } from './modules/invoices/invoice.entity';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { Payment } from './modules/payments/payment.entity';
import { PaymentsModule } from './modules/payments/payments.module';
import { ClientPortalOtp } from './modules/portal/client-portal-otp.entity';
import { ClientNotification } from './modules/portal/client-notification.entity';
import { PortalModule } from './modules/portal/portal.module';
import { ProposalApprovalDocument } from './modules/portal/proposal-approval-document.entity';
import { Proposal } from './modules/proposals/proposal.entity';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { SuperadminModule } from './modules/superadmin/superadmin.module';
import { DemoRequest } from './modules/subscriptions/demo-request.entity';
import { SubscriptionPayment } from './modules/subscriptions/subscription-payment.entity';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { Tenant } from './modules/tenants/tenant.entity';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { User } from './modules/users/user.entity';
import { TeamTask } from './modules/users/team-task.entity';
import { UsersModule } from './modules/users/users.module';

const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  entities: [
    Tenant,
    User,
    Client,
    Invoice,
    Proposal,
    ActivityLog,
    Payment,
    BusinessSettings,
    DocumentRecord,
    GstReport,
    EInvoiceRecord,
    KhataEntry,
    IntegrationConnection,
    ClientPortalOtp,
    ClientNotification,
    ProposalApprovalDocument,
    TeamTask,
    DemoRequest,
    SubscriptionPayment,
  ],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  ...(process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_DATABASE ?? 'invoiceforge',
      }),
};

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    BusinessModule,
    ComplianceModule,
    ClientsModule,
    TenantsModule,
    InvoicesModule,
    MarketingModule,
    PortalModule,
    ProposalsModule,
    ActivityLogModule,
    PaymentsModule,
    TemplatesModule,
    SuperadminModule,
    SubscriptionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
