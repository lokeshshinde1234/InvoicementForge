import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingCycle, TenantPlan } from '../tenants/tenant.entity';

export enum SubscriptionPaymentStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

@Entity({ name: 'subscription_payments' })
@Index(['tenantId'])
@Index(['razorpayOrderId'], { unique: true })
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: TenantPlan })
  plan: TenantPlan;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'varchar', length: 80 })
  razorpayOrderId: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  razorpayPaymentId: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  razorpaySignature: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPaymentStatus,
    default: SubscriptionPaymentStatus.CREATED,
  })
  status: SubscriptionPaymentStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
