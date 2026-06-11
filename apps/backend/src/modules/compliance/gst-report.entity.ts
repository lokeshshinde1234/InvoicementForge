import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GstReportType {
  GSTR_1 = 'GSTR_1',
  GSTR_3B = 'GSTR_3B',
  GSTR_2A_RECONCILIATION = 'GSTR_2A_RECONCILIATION',
}

export enum GstReportStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  FILED = 'FILED',
}

@Entity({ name: 'gst_reports' })
@Index(['tenantId', 'type'])
@Index(['tenantId', 'period'])
export class GstReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: GstReportType })
  type: GstReportType;

  @Column({ type: 'varchar', length: 16 })
  period: string;

  @Column({
    type: 'enum',
    enum: GstReportStatus,
    default: GstReportStatus.DRAFT,
  })
  status: GstReportStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  summary: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  rows: Array<Record<string, unknown>>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
