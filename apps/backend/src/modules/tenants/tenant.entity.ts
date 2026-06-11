import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum TenantPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'tenants' })
@Unique(['subdomain'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  subdomain: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  gstin: string | null;

  @Column({ type: 'char', length: 2, default: 'IN' })
  countryCode: string;

  @Column({ type: 'char', length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  logoStorageKey: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  logoFileName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  logoMimeType: string | null;

  @Column({ type: 'integer', nullable: true })
  logoSize: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  logoUploadedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  logoUpdatedAt: Date | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  logoAltText: string | null;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.STARTER,
  })
  plan: TenantPlan;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  trialStartedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  subscriptionCurrentPeriodEndsAt: Date | null;

  @Column({ type: 'integer', default: 10 })
  monthlySendLimit: number;

  @Column({ type: 'integer', default: 5 })
  monthlyTemplateLimit: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
