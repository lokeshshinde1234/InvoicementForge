import { BadRequestException } from '@nestjs/common';
import { InvoiceStatus } from '../invoices/invoice.entity';
import { Payment, PaymentStatus } from './payment.entity';
import { RazorpayService } from './razorpay.service';

describe('RazorpayService', () => {
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;

  afterEach(() => {
    process.env.RAZORPAY_KEY_ID = originalKeyId;
    process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
  });

  function createService(invoiceStatus: InvoiceStatus) {
    const invoice = {
      id: 'invoice-1',
      tenantId: 'tenant-1',
      invoiceNumber: 'INV-2026-001',
      status: invoiceStatus,
      total: '1234.50',
    };
    const invoicesRepository = {
      findOne: jest.fn().mockResolvedValue(invoice),
      save: jest.fn(),
    };
    const paymentsRepository = {
      create: jest.fn((payment: Payment): Payment => payment),
      save: jest.fn((payment: Payment): Promise<Payment> => {
        return Promise.resolve({ id: 'payment-1', ...payment });
      }),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    return {
      service: new RazorpayService(
        paymentsRepository as never,
        invoicesRepository as never,
      ),
      paymentsRepository,
    };
  }

  it('allows overdue invoices to create a payment order', async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const { service, paymentsRepository } = createService(
      InvoiceStatus.OVERDUE,
    );

    const result = await service.createOrder(
      'invoice-1',
      999,
      'inr',
      'tenant-1',
    );

    expect(result).toMatchObject({
      paymentId: 'payment-1',
      invoiceId: 'invoice-1',
      amount: 1234.5,
      currency: 'INR',
      keyId: null,
    });
    expect(paymentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1234.5,
        status: PaymentStatus.CREATED,
      }),
    );
  });

  it('blocks payment orders for already paid invoices', async () => {
    const { service } = createService(InvoiceStatus.PAID);

    await expect(
      service.createOrder('invoice-1', 1234.5, 'INR', 'tenant-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
