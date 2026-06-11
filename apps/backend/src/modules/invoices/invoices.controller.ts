import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Invoice } from './invoice.entity';
import { InvoicesService } from './invoices.service';
import type {
  CreateInvoiceDto,
  InvoiceFilters,
  SendInvoiceResult,
  UpdateInvoiceDto,
} from './invoices.service';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Invoice> {
    return this.invoicesService.create(dto, tenantId);
  }

  @Get()
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() filters: InvoiceFilters,
  ): Promise<Invoice[]> {
    return this.invoicesService.findAll(tenantId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<Invoice> {
    return this.invoicesService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Invoice> {
    return this.invoicesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<{ deleted: true }> {
    await this.invoicesService.remove(id, tenantId);
    return { deleted: true };
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="invoice.pdf"')
  async generatePdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<StreamableFile> {
    const pdf = await this.invoicesService.generatePdf(id, tenantId);
    return new StreamableFile(pdf);
  }

  @Post(':id/send')
  sendEmail(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<SendInvoiceResult> {
    return this.invoicesService.sendEmail(id, tenantId);
  }
}
