import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaxSystem {
  GST = 'GST',
  VAT = 'VAT',
  SALES_TAX = 'SALES_TAX',
  NONE = 'NONE',
}

@Entity({ name: 'business_settings' })
@Index(['tenantId'], { unique: true })
export class BusinessSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  gstin: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sellerState: string | null;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  baseCurrency: string;

  @Column({ type: 'varchar', length: 2, default: 'IN' })
  countryCode: string;

  @Column({ type: 'enum', enum: TaxSystem, default: TaxSystem.GST })
  taxSystem: TaxSystem;

  @Column({ type: 'date', nullable: true })
  fiscalYearStart: Date | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  taxSettings: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  supportedCurrencies: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
