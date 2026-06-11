import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtPayload } from './jwt.strategy';
import { AuthService } from './auth.service';
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() request: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(request);
  }

  @Post('login')
  login(@Body() request: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(request);
  }

  @Post('forgot-password')
  forgotPassword(@Body() request: ForgotPasswordRequest) {
    return this.authService.forgotPassword(request);
  }

  @Post('reset-password')
  resetPassword(@Body() request: ResetPasswordRequest) {
    return this.authService.resetPassword(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() request: ChangePasswordRequest,
  ) {
    return this.authService.changePassword(user.sub, request);
  }
}

@Controller('company-owner')
export class CompanyOwnerAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() request: LoginRequest): Promise<AuthResponse> {
    return this.authService.login(request);
  }

  @Post('forgot-password')
  forgotPassword(@Body() request: ForgotPasswordRequest) {
    return this.authService.forgotPassword(request);
  }

  @Post('reset-password')
  resetPassword(@Body() request: ResetPasswordRequest) {
    return this.authService.resetPassword(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() request: ChangePasswordRequest,
  ) {
    return this.authService.changePassword(user.sub, request);
  }
}

@Controller('company')
export class CompanySignupController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() request: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(request);
  }

  @Post('onboarding')
  onboarding(@Body() request: RegisterRequest): Promise<AuthResponse> {
    return this.authService.register(request);
  }
}
