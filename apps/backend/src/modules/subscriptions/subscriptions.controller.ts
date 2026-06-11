import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('demo-requests')
  createDemoRequest(
    @Body() dto: Parameters<SubscriptionsService['createDemoRequest']>[0],
  ) {
    return this.subscriptionsService.createDemoRequest(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription/status')
  status(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getStatus(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/checkout')
  checkout(
    @CurrentTenant() tenantId: string,
    @Body() dto: Parameters<SubscriptionsService['createCheckout']>[1],
  ) {
    return this.subscriptionsService.createCheckout(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/verify')
  verify(@Body() dto: Parameters<SubscriptionsService['verifyPayment']>[0]) {
    return this.subscriptionsService.verifyPayment(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/checkouts/:id/manual-activate')
  activateManual(
    @CurrentTenant() tenantId: string,
    @Param('id') checkoutId: string,
  ) {
    return this.subscriptionsService.activateManualCheckout(
      tenantId,
      checkoutId,
    );
  }

  @Post('subscription/razorpay/callback')
  async razorpayCallback(
    @Body()
    dto: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      error?: {
        description?: string;
        reason?: string;
      };
    },
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
        'Subscription payment was not completed.';
      response.redirect(
        `${frontendUrl}/subscription/result?status=failed&message=${encodeURIComponent(reason)}`,
      );
      return;
    }

    try {
      const result = await this.subscriptionsService.verifyPayment({
        razorpayOrderId: dto.razorpay_order_id,
        razorpayPaymentId: dto.razorpay_payment_id,
        razorpaySignature: dto.razorpay_signature,
      });
      response.redirect(
        `${frontendUrl}/subscription/result?status=success&plan=${encodeURIComponent(result.plan)}&billing=${encodeURIComponent(result.billingCycle)}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Subscription payment verification failed.';
      response.redirect(
        `${frontendUrl}/subscription/result?status=failed&message=${encodeURIComponent(message)}`,
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
