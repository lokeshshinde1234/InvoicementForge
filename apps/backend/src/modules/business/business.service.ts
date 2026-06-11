import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSettings, TaxSystem } from './business-settings.entity';

export type UpdateBusinessSettingsDto = Partial<{
  legalName: string | null;
  gstin: string | null;
  sellerState: string | null;
  baseCurrency: string;
  countryCode: string;
  taxSystem: TaxSystem;
  fiscalYearStart: string | Date | null;
  taxSettings: Record<string, unknown>;
  supportedCurrencies: string[];
}>;

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessSettings)
    private readonly settingsRepository: Repository<BusinessSettings>,
  ) {}

  async getSettings(tenantId: string): Promise<BusinessSettings> {
    const existing = await this.settingsRepository.findOne({
      where: { tenantId },
    });

    if (existing) {
      return existing;
    }

    return this.settingsRepository.save(
      this.settingsRepository.create({
        tenantId,
        baseCurrency: 'INR',
        countryCode: 'IN',
        taxSystem: TaxSystem.GST,
        supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'AED'],
        taxSettings: {
          gstRates: [0, 5, 12, 18, 28],
          documentTypes: [
            'INVOICE',
            'QUOTE',
            'PROPOSAL',
            'PURCHASE_ORDER',
            'BILL_EXPENSE',
            'DELIVERY_CHALLAN',
            'CREDIT_NOTE',
            'DEBIT_NOTE',
            'RECEIPT',
            'CONTRACT',
          ],
        },
      }),
    );
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateBusinessSettingsDto,
  ): Promise<BusinessSettings> {
    const settings = await this.getSettings(tenantId);
    const nextBaseCurrency =
      dto.baseCurrency?.trim().toUpperCase() ?? settings.baseCurrency;
    const nextSupportedCurrencies = Array.from(
      new Set(
        [
          ...(dto.supportedCurrencies ?? settings.supportedCurrencies),
          nextBaseCurrency,
        ]
          .map((currency) => currency.trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    const updated = this.settingsRepository.merge(settings, {
      legalName:
        dto.legalName === undefined
          ? settings.legalName
          : dto.legalName?.trim() || null,
      gstin:
        dto.gstin === undefined
          ? settings.gstin
          : dto.gstin?.trim().toUpperCase() || null,
      sellerState:
        dto.sellerState === undefined
          ? settings.sellerState
          : dto.sellerState?.trim().toUpperCase() || null,
      baseCurrency: nextBaseCurrency,
      countryCode:
        dto.countryCode?.trim().toUpperCase() ?? settings.countryCode,
      taxSystem: dto.taxSystem ?? settings.taxSystem,
      fiscalYearStart:
        dto.fiscalYearStart === undefined
          ? settings.fiscalYearStart
          : dto.fiscalYearStart
            ? new Date(dto.fiscalYearStart)
            : null,
      taxSettings: dto.taxSettings ?? settings.taxSettings,
      supportedCurrencies: nextSupportedCurrencies,
    });

    return this.settingsRepository.save(updated);
  }
}
