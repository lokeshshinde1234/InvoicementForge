import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  hsnCode?: string;
  sacCode?: string;
  gstRate: number;
  taxType?: 'CGST_SGST' | 'IGST' | 'VAT' | 'SALES_TAX' | 'NONE';
  discount?: number;
  tdsRate?: number;
  tcsRate?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalTax?: number;
  tdsAmount?: number;
  tcsAmount?: number;
  total?: number;
};

@Entity({ name: 'invoices' })
@Index(['tenantId', 'invoiceNumber'], { unique: true })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'clientId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'varchar', length: 32 })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'jsonb' })
  lineItems: InvoiceLineItem[];

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalTax: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  terms: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  irn: string | null;

  @Column({ type: 'text', nullable: true })
  qrCode: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
