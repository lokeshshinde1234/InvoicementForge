import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

type JwtRequestUser = {
  tenantId?: string | null;
};

type RequestWithUser = {
  user?: JwtRequestUser;
};

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const tenantId = request.user?.tenantId ?? null;
    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant in authentication token');
    }

    return tenantId;
  },
);
