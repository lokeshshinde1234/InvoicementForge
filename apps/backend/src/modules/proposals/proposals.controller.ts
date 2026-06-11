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
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Invoice } from '../invoices/invoice.entity';
import { Proposal } from './proposal.entity';
import { ProposalsService } from './proposals.service';
import type {
  CreateProposalDto,
  SignProposalResult,
  UpdateProposalDto,
} from './proposals.service';

type ReorderBlocksDto = {
  blockIds: string[];
};

type SignProposalDto = {
  signatureData: string;
  signatureMethod?: string;
};

@Controller()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('proposals')
  create(
    @Body() dto: CreateProposalDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Proposal> {
    return this.proposalsService.create(dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('proposals')
  findAll(@CurrentTenant() tenantId: string): Promise<Proposal[]> {
    return this.proposalsService.findAll(tenantId);
  }

  @Get('portal/:token')
  getByPortalToken(
    @Param('token', new ParseUUIDPipe()) token: string,
  ): Promise<Proposal> {
    return this.proposalsService.getByPortalToken(token);
  }

  @Post('portal/:token/sign')
  sign(
    @Param('token', new ParseUUIDPipe()) token: string,
    @Body() dto: SignProposalDto,
    @Req() request: Request,
  ): Promise<SignProposalResult> {
    return this.proposalsService.sign(
      token,
      dto.signatureData,
      request.ip ?? '',
      dto.signatureMethod,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('proposals/:id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<Proposal> {
    return this.proposalsService.findOne(id, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('api/company/proposals/:id')
  findCompanyProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.proposalsService.findCompanyProposalDetails(
      id,
      tenantId,
      user?.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('proposals/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="proposal.pdf"')
  async generatePdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<StreamableFile> {
    const pdf = await this.proposalsService.generatePdf(id, tenantId);
    return new StreamableFile(pdf);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('proposals/:id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Proposal> {
    return this.proposalsService.update(id, dto, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('proposals/:id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<{ deleted: true }> {
    await this.proposalsService.remove(id, tenantId);
    return { deleted: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:id/reorder-blocks')
  reorderBlocks(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReorderBlocksDto,
    @CurrentTenant() tenantId: string,
  ): Promise<Proposal> {
    return this.proposalsService.reorderBlocks(id, dto.blockIds, tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:id/convert')
  convertToInvoice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<Invoice> {
    return this.proposalsService.convertToInvoice(id, tenantId);
  }
}
