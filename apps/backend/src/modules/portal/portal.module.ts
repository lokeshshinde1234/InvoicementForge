import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import '../../load-env';
import { BusinessSettings } from '../business/business-settings.entity';
import { Client } from '../clients/client.entity';
import { Invoice } from '../invoices/invoice.entity';
import { KhataEntry } from '../compliance/khata-entry.entity';
import { PdfModule } from '../pdf/pdf.module';
import { Proposal } from '../proposals/proposal.entity';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { Tenant } from '../tenants/tenant.entity';
import { ClientPortalOtp } from './client-portal-otp.entity';
import { ClientNotification } from './client-notification.entity';
import {
  ApiClientProposalController,
  ClientPasswordController,
  PortalController,
} from './portal.controller';
import { PortalMailService } from './portal-mail.service';
import { PortalSmsService } from './portal-sms.service';
import { PortalService } from './portal.service';
import { ProposalApprovalDocument } from './proposal-approval-document.entity';

const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-secret';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      ClientPortalOtp,
      ClientNotification,
      Tenant,
      Invoice,
      KhataEntry,
      Proposal,
      ProposalApprovalDocument,
      ActivityLog,
      BusinessSettings,
    ]),
    PdfModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [
    PortalController,
    ApiClientProposalController,
    ClientPasswordController,
  ],
  providers: [PortalService, PortalMailService, PortalSmsService],
})
export class PortalModule {}
