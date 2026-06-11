import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('by-subdomain/:subdomain')
  async findBySubdomain(
    @Param('subdomain') subdomain: string,
  ): Promise<{ tenantId: string; name: string; subdomain: string }> {
    const tenant = await this.tenantsService.findBySubdomain(subdomain);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      tenantId: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
    };
  }
}

@UseGuards(JwtAuthGuard)
@Controller('company/:companyId')
export class CompanyProfileController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('profile')
  findProfile(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.tenantsService.findProfile(companyId, tenantId);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  uploadLogo(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('logoAltText') logoAltText?: string,
  ) {
    return this.tenantsService.updateLogo(
      companyId,
      tenantId,
      file,
      logoAltText,
    );
  }

  @Put('logo')
  @UseInterceptors(FileInterceptor('logo', { storage: memoryStorage() }))
  replaceLogo(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('logoAltText') logoAltText?: string,
  ) {
    return this.tenantsService.updateLogo(
      companyId,
      tenantId,
      file,
      logoAltText,
    );
  }

  @Delete('logo')
  removeLogo(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.tenantsService.removeLogo(companyId, tenantId);
  }
}
