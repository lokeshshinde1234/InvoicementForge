import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  SIGNED = 'SIGNED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

export enum ProposalApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type ProposalBlock = {
  id: string;
  type: string;
  order: number;
  content: Record<string, unknown>;
};

export type ProposalAuditEntry = {
  id: string;
  event: string;
  at: string;
  actor: string;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

@Entity({ name: 'proposals' })
@Index(['tenantId', 'status'])
@Index(['tenantId', 'clientId'])
@Index(['portalToken'], { unique: true })
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.DRAFT,
  })
  status: ProposalStatus;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  blocks: ProposalBlock[];

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'date', nullable: true })
  validUntil: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  signatureData: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  signatureIp: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  signatureMethod: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aadhaarEsignStatus: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  aadhaarEsignReference: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  aadhaarEsignRequestedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  aadhaarEsignCompletedAt: Date | null;

  @Column({
    type: 'enum',
    enum: ProposalApprovalStatus,
    default: ProposalApprovalStatus.PENDING,
  })
  approvalStatus: ProposalApprovalStatus;

  @Column({ type: 'boolean', default: false })
  aadhaarDocumentAttached: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedByClientId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  auditTrail: ProposalAuditEntry[];

  @Column({ type: 'uuid', unique: true })
  portalToken: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  terms: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
