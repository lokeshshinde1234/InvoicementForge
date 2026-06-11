import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/tenant.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamTask } from './team-task.entity';
import { User } from './user.entity';
import type {
  CreateTeamTaskDto,
  CreateTeamUserDto,
  SubmitTeamTaskReportDto,
  TeamTaskWithReport,
  UpdateTeamTaskDto,
  UpdateTeamUserDto,
} from './users.service';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('team')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  findTeamUsers(@CurrentTenant() tenantId: string): Promise<User[]> {
    return this.usersService.findByTenant(tenantId);
  }

  @Post('users')
  createTeamUser(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateTeamUserDto,
  ): Promise<User> {
    return this.usersService.createUser(tenantId, dto);
  }

  @Patch('users/:id')
  updateTeamUser(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(tenantId, id, dto);
  }

  @Delete('users/:id')
  async deleteTeamUser(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.usersService.deleteUser(tenantId, id);
    return { deleted: true };
  }

  @Get('tasks')
  findTeamTasks(@CurrentTenant() tenantId: string): Promise<TeamTaskWithReport[]> {
    return this.usersService.findTasks(tenantId);
  }

  @Get('my-tasks')
  findMyTasks(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TeamTaskWithReport[]> {
    return this.usersService.findMyTasks(tenantId, user.sub);
  }

  @Post('my-tasks/:id/report')
  submitMyTaskReport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SubmitTeamTaskReportDto,
  ): Promise<TeamTaskWithReport> {
    return this.usersService.submitMyTaskReport(tenantId, user.sub, id, dto);
  }

  @Post('tasks')
  createTeamTask(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateTeamTaskDto,
  ): Promise<TeamTask> {
    return this.usersService.createTask(tenantId, dto);
  }

  @Patch('tasks/:id')
  updateTeamTask(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamTaskDto,
  ): Promise<TeamTask> {
    return this.usersService.updateTask(tenantId, id, dto);
  }

  @Delete('tasks/:id')
  async deleteTeamTask(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    await this.usersService.deleteTask(tenantId, id);
    return { deleted: true };
  }
}
