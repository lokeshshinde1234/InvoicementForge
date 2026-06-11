import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import '../../load-env';
import { PortalMailService } from '../portal/portal-mail.service';
import { Tenant } from '../tenants/tenant.entity';
import { User } from '../users/user.entity';
import {
  AuthController,
  CompanyOwnerAuthController,
  CompanySignupController,
} from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-secret';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  console.warn(
    'Warning: JWT_SECRET is not set; using insecure dev fallback. Set JWT_SECRET for production.',
  );
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AuthController,
    CompanyOwnerAuthController,
    CompanySignupController,
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PortalMailService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
