import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePaymentOrderResult,
  RazorpayService,
  VerifyPaymentResult,
} from './razorpay.service';

type CreateOrderDto = {
  invoiceId: string;
  amount: number;
  currency?: string;
};

type VerifyPaymentDto = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

type RazorpayCallbackDto = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  error?: {
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Get('payments')
  findAll(@CurrentTenant() tenantId: string) {
    return this.razorpayService.findAll(tenantId);
  }

  @Delete('payments/:id')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<{ deleted: true }> {
    await this.razorpayService.remove(id, tenantId);
    return { deleted: true };
  }

  @Post('payments/create-order')
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentTenant() tenantId: string,
  ): Promise<CreatePaymentOrderResult> {
    return this.razorpayService.createOrder(
      dto.invoiceId,
      Number(dto.amount),
      dto.currency ?? 'INR',
      tenantId,
    );
  }

  @Post('payments/verify')
  verifyPayment(@Body() dto: VerifyPaymentDto): Promise<VerifyPaymentResult> {
    return this.razorpayService.verifyPayment(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
  }

  @Get('invoices/:id/upi-qr')
  generateUpiQr(
    @Param('id') _invoiceId: string,
    @Query('amount') amount: string,
    @Query('upiId') upiId: string,
    @Query('name') name: string,
  ): { upiLink: string } {
    return {
      upiLink: this.razorpayService.generateUpiQr(Number(amount), upiId, name),
    };
  }
}

@Controller('payments/razorpay')
export class PaymentsRazorpayCallbackController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('callback')
  async callback(
    @Body() dto: RazorpayCallbackDto,
    @Res() response: Response,
  ) {
    const frontendUrl = this.frontendUrl();

    if (
      !dto.razorpay_order_id ||
      !dto.razorpay_payment_id ||
      !dto.razorpay_signature
    ) {
      const reason =
        dto.error?.description ??
        dto.error?.reason ??
        'Payment was not completed.';
      response.redirect(
        `${frontendUrl}/portal/payments/result?status=failed&message=${encodeURIComponent(reason)}`,
      );
      return;
    }

    try {
      const result = await this.razorpayService.verifyPayment(
        dto.razorpay_order_id,
        dto.razorpay_payment_id,
        dto.razorpay_signature,
      );
      response.redirect(
        `${frontendUrl}/portal/payments/result?status=success&invoiceId=${encodeURIComponent(result.invoiceId)}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Payment verification failed.';
      response.redirect(
        `${frontendUrl}/portal/payments/result?status=failed&message=${encodeURIComponent(message)}`,
      );
    }
  }

  private frontendUrl(): string {
    return (
      (process.env.FRONTEND_URL ?? 'http://localhost:3000')
        .split(',')
        .map((url) => url.trim())
        .find(Boolean) ?? 'http://localhost:3000'
    );
  }
}
