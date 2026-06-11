import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum KhataEntryType {
  CREDIT_SALE = 'CREDIT_SALE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  REMINDER_SENT = 'REMINDER_SENT',
}

@Entity({ name: 'khata_entries' })
@Index(['tenantId', 'clientId'])
@Index(['tenantId', 'type'])
export class KhataEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @Column({ type: 'enum', enum: KhataEntryType })
  type: KhataEntryType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  outstandingAmount: number;

  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  reminderSettings: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
