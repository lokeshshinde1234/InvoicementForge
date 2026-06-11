import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BusinessSettings } from './business-settings.entity';
import { BusinessService } from './business.service';
import type { UpdateBusinessSettingsDto } from './business.service';

@UseGuards(JwtAuthGuard)
@Controller('business-settings')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  getSettings(@CurrentTenant() tenantId: string): Promise<BusinessSettings> {
    return this.businessService.getSettings(tenantId);
  }

  @Patch()
  updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateBusinessSettingsDto,
  ): Promise<BusinessSettings> {
    return this.businessService.updateSettings(tenantId, dto);
  }
}
