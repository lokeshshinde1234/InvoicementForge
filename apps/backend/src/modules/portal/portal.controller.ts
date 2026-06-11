import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { PortalService, PortalTokenPayload } from './portal.service';

@Controller('portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('send-otp')
  sendOtp(@Body() body: { email?: string; companyId?: string }) {
    return this.portalService.sendOtp(body);
  }

  @Post('login')
  login(
    @Body() body: { email?: string; companyId?: string; password?: string },
  ) {
    return this.portalService.login(body);
  }

  @Post('set-password')
  setPassword(
    @Body()
    body: {
      email?: string;
      companyId?: string;
      password?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    return this.portalService.setPassword(body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email?: string; companyId?: string }) {
    return this.portalService.forgotPassword(body);
  }

  @Post('reset-password')
  resetPassword(
    @Body()
    body: {
      token?: string;
      companyId?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    return this.portalService.resetPassword(body);
  }

  @Post('change-password')
  changePassword(
    @Body()
    body: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.changePassword(payload, body);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body() body: { email?: string; companyId?: string; otp?: string },
  ) {
    return this.portalService.verifyOtp(body);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.me(payload);
  }

  @Post('notifications/:id/read')
  markNotificationRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.markNotificationRead(id, payload);
  }

  @Get('proposals/:id')
  getProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.getProposal(id, payload);
  }

  @Get('proposals/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="proposal.pdf"')
  async getProposalPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ): Promise<StreamableFile> {
    const payload = this.readPortalToken(authorization);
    const pdf = await this.portalService.getProposalPdf(id, payload);
    return new StreamableFile(pdf);
  }

  @Post('proposals/:id/approve')
  approveProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { signatureData?: string; signatureMethod?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.approveProposal(id, payload, body);
  }

  @Post('proposals/:id/aadhaar/upload')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: Number(
          process.env.AADHAAR_DOCUMENT_MAX_BYTES ?? 5 * 1024 * 1024,
        ),
      },
    }),
  )
  uploadAadhaarDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.uploadAadhaarDocument(id, payload, file);
  }

  @Get('proposals/:id/aadhaar/preview')
  async previewAadhaarDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
    @Headers('authorization') authorization?: string,
  ): Promise<StreamableFile> {
    const payload = this.readPortalToken(authorization);
    const preview = await this.portalService.previewAadhaarDocument(
      id,
      payload,
    );

    response.setHeader('Content-Type', preview.fileMimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${preview.fileName.replace(/"/g, '')}"`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    response.removeHeader('X-Frame-Options');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000",
    );

    return new StreamableFile(preview.buffer);
  }

  @Delete('proposals/:id/aadhaar/remove')
  removeAadhaarDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.removeAadhaarDocument(id, payload);
  }

  @Post('proposals/:id/request-changes')
  requestProposalChanges(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { message?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.requestProposalChanges(id, payload, body.message);
  }

  @Post('proposals/:id/sign')
  signProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { signatureData?: string; signatureMethod?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.signProposal(id, payload, body);
  }

  @Get('invoices/:id')
  getInvoice(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.getInvoice(id, payload);
  }

  @Get('invoices/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="invoice.pdf"')
  async getInvoicePdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ): Promise<StreamableFile> {
    const payload = this.readPortalToken(authorization);
    const pdf = await this.portalService.getInvoicePdf(id, payload);
    return new StreamableFile(pdf);
  }

  @Get('gst')
  getGstWorkspace(@Headers('authorization') authorization?: string) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.getGstWorkspace(payload);
  }

  @Post('gst/invoices/:id/request-correction')
  requestGstCorrection(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { message?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.requestGstCorrection(id, payload, body.message);
  }

  @Post('logout')
  logout() {
    return { loggedOut: true };
  }

  private readPortalToken(authorization?: string): PortalTokenPayload {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';

    if (!token) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    try {
      const payload = this.jwtService.verify<PortalTokenPayload>(token);

      if (
        payload.type !== 'client_portal' ||
        !payload.clientId ||
        !payload.tenantId
      ) {
        throw new UnauthorizedException('Please enter valid credentials.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Please enter valid credentials.');
    }
  }
}

@Controller('api/client')
export class ApiClientProposalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('proposals/:id/aadhaar/upload')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: {
        fileSize: Number(
          process.env.AADHAAR_DOCUMENT_MAX_BYTES ?? 5 * 1024 * 1024,
        ),
      },
    }),
  )
  uploadAadhaarDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.uploadAadhaarDocument(id, payload, file);
  }

  @Get('proposals/:id/aadhaar/preview')
  async previewAadhaarDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res({ passthrough: true }) response: Response,
    @Headers('authorization') authorization?: string,
  ): Promise<StreamableFile> {
    const payload = this.readPortalToken(authorization);
    const preview = await this.portalService.previewAadhaarDocument(
      id,
      payload,
    );

    response.setHeader('Content-Type', preview.fileMimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${preview.fileName.replace(/"/g, '')}"`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    response.removeHeader('X-Frame-Options');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    response.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000",
    );

    return new StreamableFile(preview.buffer);
  }

  @Delete('proposals/:id/aadhaar/remove')
  removeAadhaarDocument(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.removeAadhaarDocument(id, payload);
  }

  @Post('proposals/:id/approve')
  approveProposal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { signatureData?: string; signatureMethod?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.approveProposal(id, payload, body);
  }

  private readPortalToken(authorization?: string): PortalTokenPayload {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';

    if (!token) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    try {
      const payload = this.jwtService.verify<PortalTokenPayload>(token);

      if (
        payload.type !== 'client_portal' ||
        !payload.clientId ||
        !payload.tenantId
      ) {
        throw new UnauthorizedException('Please enter valid credentials.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Please enter valid credentials.');
    }
  }
}

@Controller('client')
export class ClientPasswordController {
  constructor(
    private readonly portalService: PortalService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  login(
    @Body() body: { email?: string; companyId?: string; password?: string },
  ) {
    return this.portalService.login(body);
  }

  @Post('set-password')
  setPassword(
    @Body()
    body: {
      email?: string;
      companyId?: string;
      password?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    return this.portalService.setPassword(body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email?: string; companyId?: string }) {
    return this.portalService.forgotPassword(body);
  }

  @Post('reset-password')
  resetPassword(
    @Body()
    body: {
      token?: string;
      companyId?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
  ) {
    return this.portalService.resetPassword(body);
  }

  @Post('change-password')
  changePassword(
    @Body()
    body: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const payload = this.readPortalToken(authorization);
    return this.portalService.changePassword(payload, body);
  }

  private readPortalToken(authorization?: string): PortalTokenPayload {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';

    if (!token) {
      throw new UnauthorizedException('Please enter valid credentials.');
    }

    try {
      const payload = this.jwtService.verify<PortalTokenPayload>(token);

      if (
        payload.type !== 'client_portal' ||
        !payload.clientId ||
        !payload.tenantId
      ) {
        throw new UnauthorizedException('Please enter valid credentials.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Please enter valid credentials.');
    }
  }
}
