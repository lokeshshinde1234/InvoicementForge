import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ClientNotificationType {
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  INVOICE_SENT = 'INVOICE_SENT',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  INVOICE_DELETED = 'INVOICE_DELETED',
  PROPOSAL_DELETED = 'PROPOSAL_DELETED',
}

@Entity({ name: 'client_notifications' })
@Index(['tenantId', 'clientId', 'createdAt'])
@Index(['tenantId', 'clientId', 'type'])
export class ClientNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'enum', enum: ClientNotificationType })
  type: ClientNotificationType;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'uuid', nullable: true })
  invoiceId: string | null;

  @Column({ type: 'uuid', nullable: true })
  proposalId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
