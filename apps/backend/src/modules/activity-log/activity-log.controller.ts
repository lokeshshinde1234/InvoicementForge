import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityLog } from './activity-log.entity';
import { ActivityLogService } from './activity-log.service';

@UseGuards(JwtAuthGuard)
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string): Promise<ActivityLog[]> {
    return this.activityLogService.findAll(tenantId);
  }
}
