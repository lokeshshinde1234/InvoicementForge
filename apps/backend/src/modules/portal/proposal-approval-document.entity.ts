import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProposalApprovalDocumentStatus {
  UPLOADED = 'uploaded',
  APPROVED = 'approved',
  REMOVED = 'removed',
}

@Entity({ name: 'proposal_approval_documents' })
@Index(['companyId', 'clientId', 'proposalId'])
@Index(['proposalId', 'status'])
export class ProposalApprovalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  proposalId: string;

  @Column({ type: 'varchar', length: 32, default: 'aadhaar' })
  documentType: 'aadhaar';

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 128 })
  fileMimeType: string;

  @Column({ type: 'integer' })
  fileSize: number;

  @Column({ type: 'text' })
  privateFilePath: string;

  @Column({ type: 'varchar', length: 255 })
  uploadedBy: string;

  @Column({ type: 'timestamptz' })
  uploadedAt: Date;

  @Column({
    type: 'enum',
    enum: ProposalApprovalDocumentStatus,
    default: ProposalApprovalDocumentStatus.UPLOADED,
  })
  status: ProposalApprovalDocumentStatus;

  @Column({ type: 'boolean', default: true })
  isVisibleToClient: boolean;

  @Column({ type: 'boolean', default: false })
  isVisibleToCompany: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
