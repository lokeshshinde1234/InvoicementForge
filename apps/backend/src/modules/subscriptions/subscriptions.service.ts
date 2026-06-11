import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'node:crypto';
import Razorpay from 'razorpay';
import { Between, Repository } from 'typeorm';
import {
  DocumentRecord,
  BusinessDocumentStatus,
} from '../compliance/document-record.entity';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { Proposal, ProposalStatus } from '../proposals/proposal.entity';
import {
  BillingCycle,
  SubscriptionStatus,
  Tenant,
  TenantPlan,
} from '../tenants/tenant.entity';
import { DemoRequest } from './demo-request.entity';
import { PLAN_DEFINITIONS, planAmount, planLimits } from './subscription-plans';
import {
  SubscriptionPayment,
  SubscriptionPaymentStatus,
} from './subscription-payment.entity';

type CreateDemoRequestDto = {
  name: string;
  email: string;
  company: string;
  phone?: string | null;
  phoneCountry?: string | null;
  teamSize?: string | null;
  message?: string | null;
  source?: string | null;
};

const PHONE_COUNTRY_DIGITS: Record<string, number> = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AE: 9,
  SG: 8,
  AU: 9,
  DE: 10,
};

const PHONE_COUNTRY_DIAL_CODES: Record<string, string> = {
  IN: '91',
  US: '1',
  CA: '1',
  GB: '44',
  AE: '971',
  SG: '65',
  AU: '61',
  DE: '49',
};

type CheckoutDto = {
  plan: TenantPlan;
  billingCycle: BillingCycle;
};

type VerifySubscriptionPaymentDto = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

type SubscriptionStatusDto = {
  plan: TenantPlan;
  billingCycle: BillingCycle;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  subscriptionCurrentPeriodEndsAt: Date | null;
  trialDaysLeft: number;
  isTrialActive: boolean;
  requiresPayment: boolean;
  reason: string | null;
  monthlySendLimit: number;
  monthlyTemplateLimit: number;
  sendsUsedThisMonth: number;
  templatesUsed: number;
  plans: typeof PLAN_DEFINITIONS;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

@Injectable()
export class SubscriptionsService {
  private razorpay: Razorpay | null = null;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Proposal)
    private readonly proposalsRepository: Repository<Proposal>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(DocumentRecord)
    private readonly documentsRepository: Repository<DocumentRecord>,
    @InjectRepository(DemoRequest)
    private readonly demoRequestsRepository: Repository<DemoRequest>,
    @InjectRepository(SubscriptionPayment)
    private readonly subscriptionPaymentsRepository: Repository<SubscriptionPayment>,
  ) {}

  async createDemoRequest(dto: CreateDemoRequestDto): Promise<DemoRequest> {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim() || null;
    const phoneCountry = dto.phoneCountry?.trim().toUpperCase() || null;

    if (!dto.name?.trim() || !email || !dto.company?.trim()) {
      throw new BadRequestException(
        'Name, work email, and company are required.',
      );
    }

    if (phone) {
      let digits = phone.replace(/\D/g, '');
      const expectedDigits = phoneCountry
        ? PHONE_COUNTRY_DIGITS[phoneCountry]
        : null;
      const dialCode = phoneCountry
        ? PHONE_COUNTRY_DIAL_CODES[phoneCountry]
        : null;

      if (
        expectedDigits &&
        dialCode &&
        digits.length > expectedDigits &&
        digits.startsWith(dialCode)
      ) {
        digits = digits.slice(dialCode.length);
      }

      if (expectedDigits && digits.length !== expectedDigits) {
        throw new BadRequestException(
          `Phone number for ${phoneCountry} must contain ${expectedDigits} digits.`,
        );
      }

      if (!expectedDigits && (digits.length < 7 || digits.length > 15)) {
        throw new BadRequestException(
          'Phone number must contain 7 to 15 digits.',
        );
      }
    }

    const request = this.demoRequestsRepository.create({
      name: dto.name.trim(),
      email,
      company: dto.company.trim(),
      phone,
      teamSize: dto.teamSize?.trim() || null,
      message: dto.message?.trim() || null,
      metadata: {
        source: dto.source?.trim() || 'book_demo_page',
        phoneCountry,
      },
    });

    return this.demoRequestsRepository.save(request);
  }

  findDemoRequests(): Promise<DemoRequest[]> {
    return this.demoRequestsRepository.find({
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }

  async getStatus(tenantId: string): Promise<SubscriptionStatusDto> {
    const tenant = await this.getTenant(tenantId);
    const [sendsUsedThisMonth, templatesUsed] = await Promise.all([
      this.countSendsThisMonth(tenantId),
      this.countTemplates(tenantId),
    ]);
    const trialDaysLeft = this.daysLeft(tenant.trialEndsAt);
    const isTrialActive =
      tenant.subscriptionStatus === SubscriptionStatus.TRIALING &&
      trialDaysLeft > 0;
    const hasActiveSubscription =
      tenant.subscriptionStatus === SubscriptionStatus.ACTIVE &&
      this.isFuture(tenant.subscriptionCurrentPeriodEndsAt);
    const overSendLimit = sendsUsedThisMonth >= tenant.monthlySendLimit;
    const overTemplateLimit = templatesUsed >= tenant.monthlyTemplateLimit;
    const requiresPayment =
      (!isTrialActive && !hasActiveSubscription) ||
      overSendLimit ||
      overTemplateLimit;
    const reason =
      !isTrialActive && !hasActiveSubscription
        ? 'Your trial or subscription period is over.'
        : overSendLimit
          ? 'Your monthly document send limit has been reached.'
          : overTemplateLimit
            ? 'Your template limit has been reached.'
            : null;

    return {
      plan: tenant.plan,
      billingCycle: tenant.billingCycle,
      subscriptionStatus: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
      subscriptionCurrentPeriodEndsAt: tenant.subscriptionCurrentPeriodEndsAt,
      trialDaysLeft,
      isTrialActive,
      requiresPayment,
      reason,
      monthlySendLimit: tenant.monthlySendLimit,
      monthlyTemplateLimit: tenant.monthlyTemplateLimit,
      sendsUsedThisMonth,
      templatesUsed,
      plans: PLAN_DEFINITIONS,
    };
  }

  async createCheckout(tenantId: string, dto: CheckoutDto) {
    const tenant = await this.getTenant(tenantId);
    const plan = dto.plan;
    const billingCycle = dto.billingCycle;

    if (![TenantPlan.STARTER, TenantPlan.BUSINESS].includes(plan)) {
      throw new BadRequestException(
        'This plan must be handled by the sales team.',
      );
    }

    if (!Object.values(BillingCycle).includes(billingCycle)) {
      throw new BadRequestException('Invalid billing cycle.');
    }

    const amount = planAmount(plan, billingCycle);
    const currency = tenant.currency || 'INR';
    const keyId = process.env.RAZORPAY_KEY_ID ?? null;
    const keySecret = process.env.RAZORPAY_KEY_SECRET ?? null;
    let razorpayOrderId = `SUB-${tenantId}-${Date.now()}`.slice(0, 80);
    let metadata: Record<string, unknown> = { fallback: 'manual_subscription' };

    if (keyId && keySecret) {
      const order = (await this.getRazorpayClient().orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt: `SUB-${tenant.subdomain}-${Date.now()}`.slice(0, 40),
        notes: { tenantId, plan, billingCycle },
      })) as RazorpayOrder;
      razorpayOrderId = order.id;
      metadata = { orderStatus: order.status, razorpayAmount: order.amount };
    }

    const payment = await this.subscriptionPaymentsRepository.save(
      this.subscriptionPaymentsRepository.create({
        tenantId,
        plan,
        billingCycle,
        amount,
        currency,
        razorpayOrderId,
        status: SubscriptionPaymentStatus.CREATED,
        metadata,
      }),
    );

    return {
      checkoutId: payment.id,
      razorpayOrderId,
      amount,
      currency,
      keyId,
      plan,
      billingCycle,
      fallback: !keyId,
    };
  }

  async verifyPayment(dto: VerifySubscriptionPaymentDto) {
    const payment = await this.subscriptionPaymentsRepository.findOne({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });

    if (!payment) {
      throw new NotFoundException('Subscription checkout not found.');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret) {
      const expectedSignature = createHmac('sha256', keySecret)
        .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== dto.razorpaySignature) {
        payment.status = SubscriptionPaymentStatus.FAILED;
        payment.razorpayPaymentId = dto.razorpayPaymentId;
        payment.razorpaySignature = dto.razorpaySignature;
        await this.subscriptionPaymentsRepository.save(payment);
        throw new BadRequestException(
          'Invalid subscription payment signature.',
        );
      }
    }

    payment.status = SubscriptionPaymentStatus.PAID;
    payment.razorpayPaymentId = dto.razorpayPaymentId;
    payment.razorpaySignature = dto.razorpaySignature;
    await this.subscriptionPaymentsRepository.save(payment);
    await this.activatePlan(
      payment.tenantId,
      payment.plan,
      payment.billingCycle,
    );

    return {
      status: payment.status,
      plan: payment.plan,
      billingCycle: payment.billingCycle,
    };
  }

  async activateManualCheckout(tenantId: string, checkoutId: string) {
    const payment = await this.subscriptionPaymentsRepository.findOne({
      where: { id: checkoutId, tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Subscription checkout not found.');
    }

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      throw new ForbiddenException(
        'Manual activation is disabled when Razorpay is configured.',
      );
    }

    payment.status = SubscriptionPaymentStatus.PAID;
    payment.razorpayPaymentId = `MANUAL-${Date.now()}`;
    await this.subscriptionPaymentsRepository.save(payment);
    await this.activatePlan(tenantId, payment.plan, payment.billingCycle);

    return {
      status: payment.status,
      plan: payment.plan,
      billingCycle: payment.billingCycle,
    };
  }

  async assertCanSendDocument(tenantId: string): Promise<void> {
    const status = await this.getStatus(tenantId);

    if (status.requiresPayment) {
      throw new ForbiddenException(
        `${status.reason ?? 'Subscription required'} Please choose a plan to continue.`,
      );
    }
  }

  private async activatePlan(
    tenantId: string,
    plan: TenantPlan,
    billingCycle: BillingCycle,
  ) {
    const tenant = await this.getTenant(tenantId);
    const limits = planLimits(plan, billingCycle);
    const now = new Date();
    const periodDays = billingCycle === BillingCycle.YEARLY ? 365 : 30;

    tenant.plan = plan;
    tenant.billingCycle = billingCycle;
    tenant.subscriptionStatus = SubscriptionStatus.ACTIVE;
    tenant.subscriptionCurrentPeriodEndsAt = new Date(
      now.getTime() + periodDays * 24 * 60 * 60 * 1000,
    );
    tenant.monthlySendLimit = limits.monthlySendLimit;
    tenant.monthlyTemplateLimit = limits.monthlyTemplateLimit;

    await this.tenantsRepository.save(tenant);
  }

  private async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Company not found.');
    }

    if (!tenant.trialStartedAt || !tenant.trialEndsAt) {
      tenant.trialStartedAt = tenant.createdAt ?? new Date();
      tenant.trialEndsAt = new Date(
        tenant.trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000,
      );
      await this.tenantsRepository.save(tenant);
    }

    return tenant;
  }

  private async countSendsThisMonth(tenantId: string): Promise<number> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [proposals, invoices, documents] = await Promise.all([
      this.proposalsRepository.count({
        where: {
          tenantId,
          status: ProposalStatus.SENT,
          updatedAt: Between(start, end),
        },
      }),
      this.invoicesRepository.count({
        where: {
          tenantId,
          status: InvoiceStatus.SENT,
          updatedAt: Between(start, end),
        },
      }),
      this.documentsRepository.count({
        where: {
          tenantId,
          status: BusinessDocumentStatus.SENT,
          updatedAt: Between(start, end),
        },
      }),
    ]);

    return proposals + invoices + documents;
  }

  private countTemplates(tenantId: string): Promise<number> {
    return this.proposalsRepository.count({
      where: { tenantId },
    });
  }

  private daysLeft(date: Date | null): number {
    if (!date) return 0;
    return Math.max(
      0,
      Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
  }

  private isFuture(date: Date | null): boolean {
    return !!date && date.getTime() > Date.now();
  }

  private getRazorpayClient(): Razorpay {
    if (this.razorpay) return this.razorpay;
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    return this.razorpay;
  }
}
