import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EInvoiceStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  IRN_GENERATED = 'IRN_GENERATED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'e_invoice_records' })
@Index(['tenantId', 'invoiceId'], { unique: true })
@Index(['tenantId', 'status'])
export class EInvoiceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({
    type: 'enum',
    enum: EInvoiceStatus,
    default: EInvoiceStatus.PENDING,
  })
  status: EInvoiceStatus;

  @Column({ type: 'varchar', length: 128, nullable: true })
  irn: string | null;

  @Column({ type: 'text', nullable: true })
  qrCode: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  validationResult: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  nicPayload: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
