import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { ActivityLog } from '../activity-log/activity-log.entity';
import { TeamTask, TeamTaskStatus } from './team-task.entity';
import { User, UserRole } from './user.entity';

export type CreateTeamUserDto = {
  email: string;
  role: UserRole;
  password?: string;
  isActive?: boolean;
};

export type UpdateTeamUserDto = {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
};

export type CreateTeamTaskDto = {
  assigneeId: string;
  title: string;
  description?: string | null;
  status?: TeamTaskStatus;
  dueDate?: string | Date | null;
};

export type UpdateTeamTaskDto = {
  assigneeId?: string;
  title?: string;
  description?: string | null;
  status?: TeamTaskStatus;
  dueDate?: string | Date | null;
};

export type SubmitTeamTaskReportDto = {
  report?: string;
  status?: TeamTaskStatus;
};

export type TeamTaskReportSummary = {
  report: string;
  status: TeamTaskStatus;
  submittedAt: Date;
  submittedBy: string | null;
};

export type TeamTaskWithReport = TeamTask & {
  latestReport?: TeamTaskReportSummary | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(TeamTask)
    private readonly tasksRepository: Repository<TeamTask>,
    @InjectRepository(ActivityLog)
    private readonly activityLogsRepository: Repository<ActivityLog>,
  ) {}

  findByTenant(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { tenantId },
      order: { email: 'ASC' },
    });
  }

  async createUser(tenantId: string, dto: CreateTeamUserDto): Promise<User> {
    const role = dto.role ?? UserRole.MEMBER;

    if (![UserRole.ADMIN, UserRole.MEMBER].includes(role)) {
      throw new BadRequestException('Owners can add admins or members only.');
    }

    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.tenantId === tenantId
          ? 'This team member already exists in this company.'
          : 'This email is already registered in another company. Use a different email address for now.',
      );
    }

    const password = await bcrypt.hash(
      dto.password?.trim() || `Invite@${Date.now()}`,
      12,
    );

    return this.usersRepository.save(
      this.usersRepository.create({
        tenantId,
        email,
        role,
        isActive: dto.isActive ?? true,
        password,
        passwordHash: password,
        passwordUpdatedAt: new Date(),
      }),
    );
  }

  async updateUser(
    tenantId: string,
    userId: string,
    dto: UpdateTeamUserDto,
  ): Promise<User> {
    const user = await this.findUser(tenantId, userId);

    if (
      user.role === UserRole.OWNER &&
      dto.role &&
      dto.role !== UserRole.OWNER
    ) {
      throw new BadRequestException('Owner role cannot be changed here.');
    }

    if (
      dto.role &&
      ![UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER].includes(dto.role)
    ) {
      throw new BadRequestException('Invalid role.');
    }

    if (dto.email) {
      const email = this.normalizeEmail(dto.email);
      const existingUser = await this.usersRepository.findOne({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('This email is already registered.');
      }

      user.email = email;
    }

    user.role = dto.role ?? user.role;
    user.isActive = dto.isActive ?? user.isActive;

    if (dto.password?.trim()) {
      const password = await bcrypt.hash(dto.password.trim(), 12);
      user.password = password;
      user.passwordHash = password;
      user.passwordUpdatedAt = new Date();
    }

    return this.usersRepository.save(user);
  }

  async deleteUser(tenantId: string, userId: string): Promise<void> {
    const user = await this.findUser(tenantId, userId);

    if (user.role === UserRole.OWNER) {
      throw new BadRequestException('Owner user cannot be deleted here.');
    }

    await this.usersRepository.delete({ tenantId, id: userId });
  }

  async findTasks(tenantId: string): Promise<TeamTaskWithReport[]> {
    const tasks = await this.tasksRepository.find({
      where: { tenantId },
      relations: { assignee: true },
      order: { createdAt: 'DESC' },
    });

    return this.attachLatestReports(tenantId, tasks);
  }

  async findMyTasks(
    tenantId: string,
    userId: string,
  ): Promise<TeamTaskWithReport[]> {
    const tasks = await this.tasksRepository.find({
      where: { tenantId, assigneeId: userId },
      relations: { assignee: true },
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });

    return this.attachLatestReports(tenantId, tasks);
  }

  async createTask(
    tenantId: string,
    dto: CreateTeamTaskDto,
  ): Promise<TeamTask> {
    await this.findUser(tenantId, dto.assigneeId);

    return this.tasksRepository.save(
      this.tasksRepository.create({
        tenantId,
        assigneeId: dto.assigneeId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        status: dto.status ?? TeamTaskStatus.OPEN,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      }),
    );
  }

  async updateTask(
    tenantId: string,
    taskId: string,
    dto: UpdateTeamTaskDto,
  ): Promise<TeamTask> {
    const task = await this.findTask(tenantId, taskId);

    if (dto.assigneeId) {
      await this.findUser(tenantId, dto.assigneeId);
      task.assigneeId = dto.assigneeId;
    }

    task.title = dto.title?.trim() ?? task.title;
    task.description = dto.description ?? task.description;
    task.status = dto.status ?? task.status;
    task.dueDate = dto.dueDate ? new Date(dto.dueDate) : task.dueDate;

    return this.tasksRepository.save(task);
  }

  async deleteTask(tenantId: string, taskId: string): Promise<void> {
    const result = await this.tasksRepository.delete({ tenantId, id: taskId });

    if (result.affected === 0) {
      throw new NotFoundException('Team task not found');
    }
  }

  async submitMyTaskReport(
    tenantId: string,
    userId: string,
    taskId: string,
    dto: SubmitTeamTaskReportDto,
  ): Promise<TeamTaskWithReport> {
    const task = await this.tasksRepository.findOne({
      where: { tenantId, id: taskId, assigneeId: userId },
      relations: { assignee: true },
    });

    if (!task) {
      throw new NotFoundException('Assigned task not found');
    }

    const report = dto.report?.trim();
    if (!report) {
      throw new BadRequestException('Task report is required.');
    }

    if (dto.status) {
      task.status = dto.status;
      await this.tasksRepository.save(task);
    }

    await this.activityLogsRepository.save(
      this.activityLogsRepository.create({
        tenantId,
        entityType: 'team_task',
        entityId: task.id,
        action: 'TASK_REPORT_SUBMITTED',
        userId,
        metadata: {
          report,
          status: task.status,
          taskTitle: task.title,
          assigneeEmail: task.assignee?.email ?? null,
        },
      }),
    );

    const [taskWithReport] = await this.attachLatestReports(tenantId, [task]);
    return taskWithReport;
  }

  private async findUser(tenantId: string, userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { tenantId, id: userId },
    });

    if (!user) {
      throw new NotFoundException('Team user not found');
    }

    return user;
  }

  private async findTask(tenantId: string, taskId: string): Promise<TeamTask> {
    const task = await this.tasksRepository.findOne({
      where: { tenantId, id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Team task not found');
    }

    return task;
  }

  private async attachLatestReports(
    tenantId: string,
    tasks: TeamTask[],
  ): Promise<TeamTaskWithReport[]> {
    if (tasks.length === 0) {
      return [];
    }

    const taskIds = tasks.map((task) => task.id);
    const reportLogs = await this.activityLogsRepository.find({
      where: {
        tenantId,
        entityType: 'team_task',
        action: 'TASK_REPORT_SUBMITTED',
        entityId: In(taskIds),
      },
      order: { createdAt: 'DESC' },
    });
    const latestReportByTask = new Map<string, TeamTaskReportSummary>();

    for (const log of reportLogs) {
      if (latestReportByTask.has(log.entityId)) {
        continue;
      }

      latestReportByTask.set(log.entityId, {
        report: this.asString(log.metadata?.report),
        status: this.asTaskStatus(log.metadata?.status),
        submittedAt: log.createdAt,
        submittedBy: log.userId,
      });
    }

    return tasks.map((task) => ({
      ...task,
      latestReport: latestReportByTask.get(task.id) ?? null,
    }));
  }

  private asTaskStatus(value: unknown): TeamTaskStatus {
    return Object.values(TeamTaskStatus).includes(value as TeamTaskStatus)
      ? (value as TeamTaskStatus)
      : TeamTaskStatus.OPEN;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private normalizeEmail(value?: string): string {
    const email = value?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Please enter a valid team member email.');
    }

    return email;
  }
}
