import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { PortalMailService } from '../portal/portal-mail.service';
import { PortalSmsService } from '../portal/portal-sms.service';
import {
  BillingCycle,
  SubscriptionStatus,
  Tenant,
  TenantPlan,
} from '../tenants/tenant.entity';
import { User, UserRole } from '../users/user.entity';
import { JwtPayload } from './jwt.strategy';

export type RegisterRequest = {
  email: string;
  password: string;
  tenantName: string;
  subdomain: string;
  gstin?: string | null;
  countryCode?: string;
  currency?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AuthResponse = {
  access_token: string;
};

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly superadminEmail = this.readSuperadminEmail()
    .trim()
    .toLowerCase();
  private readonly superadminPassword = this.readSuperadminPassword();
  private readonly resetExpiryMs =
    Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 60) * 60 * 1000;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly portalMailService: PortalMailService,
    private readonly portalSmsService: PortalSmsService,
  ) {}

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const email = request.email.trim().toLowerCase();
    const subdomain = this.normalizeSubdomain(request.subdomain);

    if (!subdomain) {
      throw new BadRequestException('Workspace subdomain is required');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const existingTenant = await this.tenantsRepository.findOne({
      where: { subdomain },
    });

    if (existingTenant) {
      throw new ConflictException(
        'This workspace URL is already taken. Please choose another one.',
      );
    }

    const trialStartedAt = new Date();
    const trialEndsAt = new Date(
      trialStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000,
    );
    const tenant = await this.tenantsRepository.save(
      this.tenantsRepository.create({
        name: request.tenantName.trim(),
        subdomain,
        gstin: request.gstin?.trim() || null,
        countryCode: request.countryCode?.trim().toUpperCase() || 'IN',
        currency: request.currency?.trim().toUpperCase() || 'INR',
        plan: TenantPlan.STARTER,
        billingCycle: BillingCycle.MONTHLY,
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialStartedAt,
        trialEndsAt,
        monthlySendLimit: 10,
        monthlyTemplateLimit: 5,
      }),
    );

    this.assertStrongPassword(request.password);
    const password = await bcrypt.hash(request.password, this.saltRounds);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        tenantId: tenant.id,
        email,
        password,
        passwordHash: password,
        role: UserRole.OWNER,
        isActive: true,
      }),
    );

    return this.signToken(user);
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const email = request.email.trim().toLowerCase();

    if (email === this.superadminEmail) {
      if (request.password !== this.superadminPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.signSuperadminToken();
    }

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.passwordHash ?? user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user);
  }

  async forgotPassword(request: ForgotPasswordRequest) {
    const email = request.email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.resetPasswordTokenHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = this.hashResetToken(token);
    user.resetPasswordExpiresAt = new Date(Date.now() + this.resetExpiryMs);
    user.resetPasswordUsed = false;
    await this.usersRepository.save(user);
    const tenant = user.tenantId
      ? await this.tenantsRepository.findOne({ where: { id: user.tenantId } })
      : null;

    const resetUrl = this.buildFrontendUrl(
      `/reset-password?token=${encodeURIComponent(token)}`,
    );
    const expiresInMinutes = Math.max(
      1,
      Math.round(this.resetExpiryMs / 60000),
    );
    const [emailResult, smsResult] = await Promise.allSettled([
      this.portalMailService.sendPasswordResetLink({
        email,
        resetUrl,
        accountName: email,
        subject: 'InvoiceForge password reset',
        expiresInMinutes,
        logoUrl: this.absoluteLogoUrl(tenant?.logoUrl),
        logoAltText: tenant?.logoAltText,
      }),
      this.portalSmsService.sendPasswordResetLink({
        phone: this.readOwnerPasswordResetPhone(),
        resetUrl,
        accountName: 'InvoiceForge',
        expiresInMinutes,
      }),
    ]);
    const delivery =
      emailResult.status === 'fulfilled'
        ? emailResult.value
        : { delivered: false, mode: 'log' as const };
    const smsDelivery =
      smsResult.status === 'fulfilled'
        ? smsResult.value
        : { delivered: false, mode: 'log' as const };

    if (!delivery.delivered && !smsDelivery.delivered) {
      if (emailResult.status === 'rejected') {
        this.throwDeliveryError(emailResult.reason);
      }
      if (smsResult.status === 'rejected') {
        this.throwDeliveryError(smsResult.reason);
      }
    }

    return {
      message: 'Password reset link sent successfully.',
      delivery,
      smsDelivery,
    };
  }

  async resetPassword(request: ResetPasswordRequest) {
    this.assertPasswordsMatch(request.newPassword, request.confirmPassword);
    this.assertStrongPassword(request.newPassword);
    const tokenHash = this.hashResetToken(request.token);
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.passwordHash')
      .addSelect('user.resetPasswordTokenHash')
      .where('user.resetPasswordTokenHash = :tokenHash', { tokenHash })
      .andWhere('user.resetPasswordUsed = false')
      .getOne();

    if (
      !user ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    const password = await bcrypt.hash(request.newPassword, this.saltRounds);
    user.password = password;
    user.passwordHash = password;
    user.passwordUpdatedAt = new Date();
    user.resetPasswordUsed = true;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await this.usersRepository.save(user);

    return { message: 'Password updated successfully. Please login again.' };
  }

  async changePassword(userId: string, request: ChangePasswordRequest) {
    this.assertPasswordsMatch(request.newPassword, request.confirmPassword);
    this.assertStrongPassword(request.newPassword);
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      request.currentPassword,
      user.passwordHash ?? user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const password = await bcrypt.hash(request.newPassword, this.saltRounds);
    user.password = password;
    user.passwordHash = password;
    user.passwordUpdatedAt = new Date();
    await this.usersRepository.save(user);

    return { message: 'Password updated successfully.' };
  }

  private signToken(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private signSuperadminToken(): AuthResponse {
    const payload: JwtPayload = {
      sub: 'superadmin',
      email: this.superadminEmail,
      tenantId: null,
      role: UserRole.SUPERADMIN,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private normalizeSubdomain(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 32);
  }

  private assertPasswordsMatch(
    password?: string,
    confirmPassword?: string,
  ): void {
    if (!password || !confirmPassword || password !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password must match.',
      );
    }
  }

  private assertStrongPassword(password: string): void {
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      throw new BadRequestException(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      );
    }
  }

  private hashResetToken(token?: string): string {
    if (!token?.trim()) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    return createHash('sha256').update(token.trim()).digest('hex');
  }

  private buildFrontendUrl(path: string): string {
    const base =
      process.env.FRONTEND_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000';
    return `${base.replace(/\/$/, '')}${path}`;
  }

  private absoluteLogoUrl(logoUrl?: string | null): string | null {
    if (!logoUrl) return null;
    if (/^https?:\/\//i.test(logoUrl) || logoUrl.startsWith('data:')) {
      return logoUrl;
    }

    const base =
      process.env.API_PUBLIC_URL ??
      `http://localhost:${process.env.PORT ?? 3001}`;
    return `${base.replace(/\/$/, '')}${logoUrl}`;
  }

  private readOwnerPasswordResetPhone(): string | null {
    return (
      process.env.TWILIO_OWNER_PASSWORD_RESET_TO ??
      process.env.TWILIO_PASSWORD_RESET_TO ??
      null
    );
  }

  private throwDeliveryError(reason: unknown): never {
    if (reason instanceof HttpException) {
      throw new ServiceUnavailableException(
        'Could not send owner reset link by email or SMS. Please verify email settings, Twilio SMS settings, and TWILIO_OWNER_PASSWORD_RESET_TO.',
      );
    }

    throw new ServiceUnavailableException(
      'Could not send owner reset link by email or SMS. Please verify email settings, Twilio SMS settings, and TWILIO_OWNER_PASSWORD_RESET_TO.',
    );
  }

  private readSuperadminEmail(): string {
    const email = process.env.SUPERADMIN_EMAIL?.trim();

    if (email) return email;

    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPERADMIN_EMAIL is required in production');
    }

    return 'superadmin@gmail.com';
  }

  private readSuperadminPassword(): string {
    const password = process.env.SUPERADMIN_PASSWORD;

    if (password) return password;

    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPERADMIN_PASSWORD is required in production');
    }

    return 'superadmin@12';
  }
}
