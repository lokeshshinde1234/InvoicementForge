import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IntegrationProvider {
  NIC_E_INVOICE = 'NIC_E_INVOICE',
  AADHAAR_ESIGN = 'AADHAAR_ESIGN',
  DSC = 'DSC',
  RAZORPAY = 'RAZORPAY',
  PAYU = 'PAYU',
  STRIPE = 'STRIPE',
  XERO = 'XERO',
  QUICKBOOKS = 'QUICKBOOKS',
  TALLY_PRIME = 'TALLY_PRIME',
}

export enum IntegrationStatus {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  CONFIGURED = 'CONFIGURED',
  ERROR = 'ERROR',
}

@Entity({ name: 'integration_connections' })
@Index(['tenantId', 'provider'], { unique: true })
export class IntegrationConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: IntegrationProvider })
  provider: IntegrationProvider;

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.NOT_CONFIGURED,
  })
  status: IntegrationStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  config: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
