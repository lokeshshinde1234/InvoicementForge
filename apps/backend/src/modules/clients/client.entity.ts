import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'clients' })
@Index(['tenantId', 'email'])
@Index(['tenantId', 'companyName'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  companyName: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ type: 'boolean', default: false })
  isPasswordCreated: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  passwordCreatedAt: Date | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  resetPasswordTokenHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpiresAt: Date | null;

  @Column({ type: 'boolean', default: false })
  resetPasswordUsed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
