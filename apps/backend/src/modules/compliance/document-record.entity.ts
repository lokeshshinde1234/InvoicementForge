import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BusinessDocumentType {
  INVOICE = 'INVOICE',
  QUOTE = 'QUOTE',
  PROPOSAL = 'PROPOSAL',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  BILL_EXPENSE = 'BILL_EXPENSE',
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  RECEIPT = 'RECEIPT',
  CONTRACT = 'CONTRACT',
}

export enum BusinessDocumentStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  SIGNED = 'SIGNED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'document_records' })
@Index(['tenantId', 'type'])
@Index(['tenantId', 'status'])
export class DocumentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: BusinessDocumentType })
  type: BusinessDocumentType;

  @Column({
    type: 'enum',
    enum: BusinessDocumentStatus,
    default: BusinessDocumentStatus.DRAFT,
  })
  status: BusinessDocumentStatus;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  attachments: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  auditHistory: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
