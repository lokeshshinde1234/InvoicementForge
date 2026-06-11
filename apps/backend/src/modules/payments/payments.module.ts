import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../invoices/invoice.entity';
import { Client } from '../clients/client.entity';
import { KhataEntry } from '../compliance/khata-entry.entity';
import { ClientNotification } from '../portal/client-notification.entity';
import { Payment } from './payment.entity';
import {
  PaymentsController,
  PaymentsRazorpayCallbackController,
} from './payments.controller';
import { RazorpayService } from './razorpay.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Invoice,
      Client,
      KhataEntry,
      ClientNotification,
    ]),
  ],
  controllers: [PaymentsController, PaymentsRazorpayCallbackController],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class PaymentsModule {}
