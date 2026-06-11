import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Client } from './client.entity';
import { ClientsService } from './clients.service';
import type {
  ClientFilters,
  CreateClientDto,
  UpdateClientDto,
} from './clients.service';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @Body() dto: CreateClientDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Client> {
    return this.clientsService.create(dto, tenantId);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() filters: ClientFilters,
  ): Promise<Client[]> {
    return this.clientsService.findAll(tenantId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<Client> {
    return this.clientsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Client> {
    return this.clientsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<{ deleted: true }> {
    await this.clientsService.remove(id, tenantId);
    return { deleted: true };
  }

  @Post('import')
  async import(
    @Body() body: { clients: CreateClientDto[] },
    @CurrentTenant() tenantId: string,
  ): Promise<Client[]> {
    const clients = body?.clients ?? [];
    if (!Array.isArray(clients)) {
      throw new BadRequestException('clients must be an array');
    }
    if (clients.length === 0) return [];
    const MAX = 1000;
    if (clients.length > MAX) {
      throw new BadRequestException(`Too many rows: max ${MAX}`);
    }

    return this.clientsService.importClients(tenantId, clients);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('company/:companyId/clients')
export class CompanyClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(
    @Param('companyId') companyId: string,
    @CurrentTenant() tenantId: string,
    @Query() filters: ClientFilters,
  ): Promise<Client[]> {
    this.assertTenant(companyId, tenantId);
    return this.clientsService.findAll(tenantId, filters);
  }

  @Post()
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateClientDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Client> {
    this.assertTenant(companyId, tenantId);
    return this.clientsService.create(dto, tenantId);
  }

  @Get(':clientId')
  findOne(
    @Param('companyId') companyId: string,
    @Param('clientId') clientId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<Client> {
    this.assertTenant(companyId, tenantId);
    return this.clientsService.findOne(clientId, tenantId);
  }

  private assertTenant(companyId: string, tenantId: string): void {
    if (companyId !== tenantId) {
      throw new ForbiddenException('Company access denied.');
    }
  }
}
