import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

export type CompanyProfile = Pick<
  Tenant,
  | 'id'
  | 'name'
  | 'subdomain'
  | 'gstin'
  | 'countryCode'
  | 'currency'
  | 'logoUrl'
  | 'logoStorageKey'
  | 'logoFileName'
  | 'logoMimeType'
  | 'logoSize'
  | 'logoUploadedAt'
  | 'logoUpdatedAt'
  | 'logoAltText'
>;

@Injectable()
export class TenantsService {
  private readonly allowedLogoMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
  ]);
  private readonly maxLogoBytes = Number(
    process.env.COMPANY_LOGO_MAX_BYTES ?? 2 * 1024 * 1024,
  );
  private readonly uploadRoot = join(process.cwd(), 'uploads', 'company-logos');

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
  ) {}

  findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantsRepository.findOne({
      where: { subdomain: subdomain.trim().toLowerCase() },
    });
  }

  async findProfile(
    companyId: string,
    authenticatedTenantId?: string | null,
  ): Promise<CompanyProfile> {
    if (authenticatedTenantId && companyId !== authenticatedTenantId) {
      throw new ForbiddenException('Company access denied.');
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: companyId },
    });

    if (!tenant) {
      throw new NotFoundException('Company not found');
    }

    return this.serializeProfile(tenant);
  }

  async updateLogo(
    companyId: string,
    authenticatedTenantId: string,
    file: Express.Multer.File | undefined,
    altText?: string,
  ): Promise<CompanyProfile> {
    if (companyId !== authenticatedTenantId) {
      throw new ForbiddenException('Company access denied.');
    }

    if (!file) {
      throw new BadRequestException('Logo file is required.');
    }

    this.validateLogo(file);

    const tenant = await this.tenantsRepository.findOne({
      where: { id: companyId },
    });

    if (!tenant) {
      throw new NotFoundException('Company not found');
    }

    await this.ensureUploadRoot();
    const extension = this.safeExtension(file);
    const storageKey = `${companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
    const targetPath = join(this.uploadRoot, storageKey);

    await import('fs/promises').then((fs) =>
      fs.writeFile(targetPath, file.buffer),
    );
    await this.deleteStoredLogo(tenant.logoStorageKey);

    const now = new Date();
    tenant.logoUrl = `/uploads/company-logos/${storageKey}`;
    tenant.logoStorageKey = storageKey;
    tenant.logoFileName = this.safeFileName(file.originalname);
    tenant.logoMimeType = file.mimetype;
    tenant.logoSize = file.size;
    tenant.logoUploadedAt = tenant.logoUploadedAt ?? now;
    tenant.logoUpdatedAt = now;
    tenant.logoAltText = altText?.trim() || `${tenant.name} logo`;

    return this.serializeProfile(await this.tenantsRepository.save(tenant));
  }

  async removeLogo(
    companyId: string,
    authenticatedTenantId: string,
  ): Promise<CompanyProfile> {
    if (companyId !== authenticatedTenantId) {
      throw new ForbiddenException('Company access denied.');
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: companyId },
    });

    if (!tenant) {
      throw new NotFoundException('Company not found');
    }

    await this.deleteStoredLogo(tenant.logoStorageKey);
    tenant.logoUrl = null;
    tenant.logoStorageKey = null;
    tenant.logoFileName = null;
    tenant.logoMimeType = null;
    tenant.logoSize = null;
    tenant.logoUploadedAt = null;
    tenant.logoUpdatedAt = new Date();
    tenant.logoAltText = null;

    return this.serializeProfile(await this.tenantsRepository.save(tenant));
  }

  serializeProfile(tenant: Tenant): CompanyProfile {
    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      gstin: tenant.gstin,
      countryCode: tenant.countryCode,
      currency: tenant.currency,
      logoUrl: tenant.logoUrl,
      logoStorageKey: tenant.logoStorageKey,
      logoFileName: tenant.logoFileName,
      logoMimeType: tenant.logoMimeType,
      logoSize: tenant.logoSize,
      logoUploadedAt: tenant.logoUploadedAt,
      logoUpdatedAt: tenant.logoUpdatedAt,
      logoAltText: tenant.logoAltText,
    };
  }

  private validateLogo(file: Express.Multer.File): void {
    if (!this.allowedLogoMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Upload PNG, JPG, JPEG, WEBP, or SVG.',
      );
    }

    if (file.size > this.maxLogoBytes) {
      throw new BadRequestException('Logo file is too large.');
    }

    if (file.mimetype === 'image/svg+xml') {
      const contents = file.buffer.toString('utf8').toLowerCase();
      if (/<script|onload=|onerror=|javascript:/i.test(contents)) {
        throw new BadRequestException('SVG logo contains unsafe content.');
      }
    }
  }

  private safeExtension(file: Express.Multer.File): string {
    if (file.mimetype === 'image/svg+xml') return '.svg';
    if (file.mimetype === 'image/webp') return '.webp';
    if (file.mimetype === 'image/png') return '.png';
    return ['.jpg', '.jpeg'].includes(extname(file.originalname).toLowerCase())
      ? extname(file.originalname).toLowerCase()
      : '.jpg';
  }

  private safeFileName(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 240) || 'logo';
  }

  private async ensureUploadRoot(): Promise<void> {
    await mkdir(this.uploadRoot, { recursive: true });
  }

  private async deleteStoredLogo(storageKey: string | null): Promise<void> {
    if (!storageKey) return;
    const path = join(this.uploadRoot, storageKey);
    if (existsSync(path)) {
      await unlink(path).catch(() => undefined);
    }
  }
}
