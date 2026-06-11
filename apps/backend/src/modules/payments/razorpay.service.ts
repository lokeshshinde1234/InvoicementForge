import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'node:crypto';
import Razorpay from 'razorpay';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { Client } from '../clients/client.entity';
import { KhataEntry, KhataEntryType } from '../compliance/khata-entry.entity';
import {
  ClientNotification,
  ClientNotificationType,
} from '../portal/client-notification.entity';
import { Payment, PaymentStatus } from './payment.entity';

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
  notes?: Record<string, string>;
};

export type CreatePaymentOrderResult = {
  paymentId: string;
  invoiceId: string;
  razorpayOrderId: string | null;
  amount: number;
  currency: string;
  keyId: string | null;
};

export type VerifyPaymentResult = {
  paymentId: string;
  invoiceId: string;
  status: PaymentStatus;
  invoiceStatus: InvoiceStatus;
};

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay | null = null;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(KhataEntry)
    private readonly khataRepository: Repository<KhataEntry>,
    @InjectRepository(ClientNotification)
    private readonly notificationsRepository: Repository<ClientNotification>,
  ) {}

  findAll(tenantId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.paymentsRepository.delete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException('Payment not found');
    }
  }

  async createOrder(
    invoiceId: string,
    amount: number,
    currency: string,
    tenantId: string,
  ): Promise<CreatePaymentOrderResult> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount is invalid');
    }

    if (!this.isPayableInvoice(invoice.status)) {
      throw new BadRequestException(
        invoice.status === InvoiceStatus.PAID
          ? 'Invoice is already paid'
          : 'Invoice cannot be paid',
      );
    }

    const normalizedCurrency = currency.toUpperCase();
    const invoiceAmount = this.roundCurrency(Number(invoice.total));

    if (!Number.isFinite(invoiceAmount) || invoiceAmount <= 0) {
      throw new BadRequestException('Invoice amount is invalid');
    }

    const amountInSmallestUnit = this.toSmallestCurrencyUnit(invoiceAmount);
    // If Razorpay keys are not configured, gracefully fallback to a manual/UPI payment flow.
    const keyId = process.env.RAZORPAY_KEY_ID ?? null;
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? null;

    if (!keyId || !keySecret) {
      // Create a placeholder payment record so the UI can show a successful "order"
      // even when Razorpay is not configured. We prefix with UPI- to indicate fallback.
      const placeholderOrderId = `UPI-${invoiceId}-${Date.now()}`.slice(0, 64);

      const payment = this.paymentsRepository.create({
        tenantId,
        invoiceId,
        razorpayOrderId: placeholderOrderId,
        amount: invoiceAmount,
        currency: normalizedCurrency,
        status: PaymentStatus.CREATED,
        metadata: {
          fallback: 'upi_manual',
        },
      });

      const savedPayment = await this.paymentsRepository.save(payment);

      return {
        paymentId: savedPayment.id,
        invoiceId,
        razorpayOrderId: placeholderOrderId,
        amount: invoiceAmount,
        currency: normalizedCurrency,
        keyId: null,
      };
    }

    let order: RazorpayOrder;

    try {
      order = (await this.getRazorpayClient().orders.create({
        amount: amountInSmallestUnit,
        currency: normalizedCurrency,
        receipt: invoice.invoiceNumber,
        notes: {
          invoiceId,
          tenantId,
        },
      })) as RazorpayOrder;
    } catch (error) {
      throw new BadRequestException(
        `Razorpay order creation failed: ${this.readRazorpayError(error)}`,
      );
    }

    const payment = this.paymentsRepository.create({
      tenantId,
      invoiceId,
      razorpayOrderId: order.id,
      amount: invoiceAmount,
      currency: normalizedCurrency,
      status: PaymentStatus.CREATED,
      metadata: {
        orderStatus: order.status,
        razorpayAmount: order.amount,
      },
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    return {
      paymentId: savedPayment.id,
      invoiceId,
      razorpayOrderId: order.id,
      amount: invoiceAmount,
      currency: normalizedCurrency,
      keyId: this.getKeyId(),
    };
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<VerifyPaymentResult> {
    const payment = await this.paymentsRepository.findOne({
      where: { razorpayOrderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment order not found');
    }

    const expectedSignature = createHmac('sha256', this.getKeySecret())
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      payment.status = PaymentStatus.FAILED;
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      await this.paymentsRepository.save(payment);
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    const invoice = await this.invoicesRepository.findOne({
      where: { id: payment.invoiceId, tenantId: payment.tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    payment.status = PaymentStatus.PAID;
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    invoice.status = InvoiceStatus.PAID;

    await this.paymentsRepository.save(payment);
    await this.invoicesRepository.save(invoice);
    await this.recordPaymentInClientSurfaces(invoice, payment);

    return {
      paymentId: payment.id,
      invoiceId: invoice.id,
      status: payment.status,
      invoiceStatus: invoice.status,
    };
  }

  private async recordPaymentInClientSurfaces(
    invoice: Invoice,
    payment: Payment,
  ): Promise<void> {
    const client = await this.clientsRepository.findOne({
      where: { id: invoice.clientId, tenantId: invoice.tenantId },
    });

    if (!client) return;

    const amount = Number(payment.amount);
    const existingKhata = await this.khataRepository.findOne({
      where: {
        tenantId: invoice.tenantId,
        clientId: invoice.clientId,
        type: KhataEntryType.PAYMENT_RECEIVED,
      },
      order: { createdAt: 'DESC' },
    });

    const duplicate =
      existingKhata?.reminderSettings?.['paymentId'] === payment.id;

    if (!duplicate) {
      await this.khataRepository.save(
        this.khataRepository.create({
          tenantId: invoice.tenantId,
          clientId: invoice.clientId,
          type: KhataEntryType.PAYMENT_RECEIVED,
          amount,
          outstandingAmount: 0,
          dueDate: null,
          notes: `Payment received for invoice ${invoice.invoiceNumber}.`,
          reminderSettings: {
            invoiceId: invoice.id,
            paymentId: payment.id,
            source: 'payment_verification',
          },
        }),
      );
    }

    await this.notificationsRepository.save(
      this.notificationsRepository.create({
        tenantId: invoice.tenantId,
        clientId: invoice.clientId,
        type: ClientNotificationType.PAYMENT_RECEIVED,
        title: `Payment received for ${invoice.invoiceNumber}`,
        message: `Your payment of ${amount.toFixed(2)} has been recorded.`,
        invoiceId: invoice.id,
        proposalId: null,
        amount,
        dueDate: invoice.dueDate,
        metadata: { paymentId: payment.id },
      }),
    );
  }

  generateUpiQr(amount: number, upiId: string, name: string): string {
    const params = new URLSearchParams({
      pa: upiId,
      pn: name,
      am: this.roundCurrency(amount).toFixed(2),
      cu: 'INR',
    });

    return `upi://pay?${params.toString()}`;
  }

  private toSmallestCurrencyUnit(amount: number): number {
    return Math.round(this.roundCurrency(amount) * 100);
  }

  private getRazorpayClient(): Razorpay {
    if (this.razorpay) {
      return this.razorpay;
    }

    this.razorpay = new Razorpay({
      key_id: this.getKeyId(),
      key_secret: this.getKeySecret(),
    });

    return this.razorpay;
  }

  private getKeyId(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;

    if (!keyId) {
      throw new BadRequestException('RAZORPAY_KEY_ID is required');
    }

    return keyId;
  }

  private getKeySecret(): string {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new BadRequestException('RAZORPAY_KEY_SECRET is required');
    }

    return keySecret;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private readRazorpayError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { description?: unknown; reason?: unknown } })
        .error === 'object'
    ) {
      const razorpayError = (
        error as { error?: { description?: unknown; reason?: unknown } }
      ).error;
      const detail = razorpayError?.description ?? razorpayError?.reason;

      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Please check Razorpay configuration and invoice details.';
  }

  private isPayableInvoice(status: InvoiceStatus): boolean {
    return [
      InvoiceStatus.SENT,
      InvoiceStatus.VIEWED,
      InvoiceStatus.OVERDUE,
    ].includes(status);
  }
}
