import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
  ) {}

  log(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ActivityLog> {
    const activityLog = this.activityLogsRepository.create({
      tenantId,
      entityType,
      entityId,
      action,
      userId: userId ?? null,
      metadata: metadata ?? null,
    });

    return this.activityLogsRepository.save(activityLog);
  }

  findAll(tenantId: string): Promise<ActivityLog[]> {
    return this.activityLogsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
